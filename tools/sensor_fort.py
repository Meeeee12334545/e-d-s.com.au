#!/usr/bin/env python3
"""Sensor Fort artwork, lifted from EDS's own brochure and datasheet.

    python3 -I tools/sensor_fort.py [folder with the two PDFs]

Reads "Sensor Fort Brochure SF BR 001 Rev A.pdf" and "Sensor Fort Datasheet
SF DS 001 Rev A.pdf" (by default from the EDS Synology drive) and writes:

  src/assets/docs/eds-sensor-fort-{brochure,datasheet}.pdf   the documents
  src/assets/img/sensor-fort*.png                            the renders, with
                                                             their transparency
  src/data/sensor-fort-figures.json                          the figures

The figures are the documents' own drawings (the section with its calculated
water surface, the flow figure, the range of end views, the anatomy and
fastening call-outs, the dimension drawing), turned into inline SVG: every
line, fill and label is kept as a vector, so the page's figures are sharp at
any size and their numbers are real text. build.mjs sets them (sfFigure) and
site.css sizes their labels (.sf-fig). The renders get WebP twins here, at a
higher quality than tools/products.py gives the product shots.

Needs PyMuPDF and Pillow (pip install pymupdf pillow).
"""
import html, json, math, os, re, shutil, sys
import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Library/CloudStorage/SynologyDrive-EDS/EDS Portal/Equipment/EDS/Sensor Fort SF")
DOCS = {"br": ("Sensor Fort Brochure SF BR 001 Rev A.pdf", "eds-sensor-fort-brochure.pdf"), "ds": ("Sensor Fort Datasheet SF DS 001 Rev A.pdf", "eds-sensor-fort-datasheet.pdf")}
IMG = os.path.join(ROOT, "src/assets/img")
S = 2  # drawing units per PDF point

# the renders: (document, page, width in pixels, order among that width on the page) -> file
RENDERS = {
    "sensor-fort.png": ("br", 1, 1600, 0),             # in a 150 mm sewer, pipe cut away
    "sensor-fort-downstream.png": ("br", 2, 1400, 0),  # the same, from downstream
    "sensor-fort-section.png": ("br", 3, 1400, 0),     # section on the centre line
    "sensor-fort-anatomy.png": ("br", 5, 1400, 0),     # the mount alone
    "sensor-fort-bay.png": ("br", 5, 1400, 1),         # the open side of a bay
    "sensor-fort-end.png": ("ds", 1, 700, 0),          # end view from downstream
    "sensor-fort-plan.png": ("ds", 5, 1200, 0),        # dimension drawing: plan
    "sensor-fort-side.png": ("ds", 5, 1200, 1),        # dimension drawing: section
    "sensor-fort-end-light.png": ("ds", 5, 700, 0),    # dimension drawing: end view
}
# the figures: (document, page, clip in points, options)
FIGURES = {
    "section": ("br", 3, (45, 201, 550.8, 376), {}),
    "flow": ("br", 4, (45, 216.5, 550.8, 453), {}),
    "range": ("br", 6, (45, 340, 552, 434), {"text": r"^\d+$"}),
    "anatomy": ("br", 5, (118, 180, 512, 455), {}),
    "bay": ("br", 5, (45, 517, 303.5, 648.5), {}),
    "dimensions": ("ds", 5, (45, 138, 350, 388), {}),
    "end": ("ds", 5, (375, 258, 545, 402), {}),
}

# the drawings' letterspaced headings, whose word breaks the PDF does not keep
HEADS = {"PLAN": "Plan", "SECTIONONTHECENTRELINE": "Section on the centre line", "VIEWFROMDOWNSTREAM": "View from downstream", "MANHOLE": "Manhole"}

hexc = lambda c: None if c is None else "#%02x%02x%02x" % tuple(int(round(v * 255)) for v in c)
n1 = lambda v: ("%.1f" % v).rstrip("0").rstrip(".")


def rdp(pts, tol):
    """Drop the points a polyline does not need (Ramer-Douglas-Peucker)."""
    if len(pts) < 3:
        return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    if abs(x1 - x0) + abs(y1 - y0) < 1e-6:  # a closed loop: split it at its far point
        at = max(range(len(pts)), key=lambda i: (pts[i][0] - x0) ** 2 + (pts[i][1] - y0) ** 2)
        return rdp(pts[: at + 1], tol)[:-1] + rdp(pts[at:], tol) if 0 < at < len(pts) - 1 else [pts[0], pts[-1]]
    dx, dy = x1 - x0, y1 - y0
    den = (dx * dx + dy * dy) ** 0.5 or 1e-9
    far, at = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * (pts[i][0] - x0) - dx * (pts[i][1] - y0)) / den
        if d > far:
            far, at = d, i
    if far <= tol:
        return [pts[0], pts[-1]]
    return rdp(pts[: at + 1], tol)[:-1] + rdp(pts[at:], tol)


def path_of(items, ox, oy, closed):
    """A drawing's items as SVG path data, in drawing units from the clip's corner."""
    P = lambda p: ((p.x - ox) * S, (p.y - oy) * S)
    near = lambda a, b: b is not None and abs(a[0] - b[0]) < 0.05 and abs(a[1] - b[1]) < 0.05
    subs, end = [], None  # each subpath: [start, [command, ...]]
    for it in items:
        k = it[0]
        if k in ("l", "c"):
            pts = [P(p) for p in it[1:]]
            if not near(pts[0], end):
                subs.append([pts[0], []])
            subs[-1][1].append(pts[1:])
            end = pts[-1]
        elif k == "re":
            r = it[1]
            subs.append(f"M{n1((r.x0 - ox) * S)} {n1((r.y0 - oy) * S)}h{n1(r.width * S)}v{n1(r.height * S)}h{n1(-r.width * S)}z")
            end = None
        elif k == "qu":
            q = it[1]
            subs.append("M" + "L".join(f"{n1(x)} {n1(y)}" for x, y in (P(q.ul), P(q.ur), P(q.lr), P(q.ll))) + "z")
            end = None
    out = []
    for sub in subs:
        if isinstance(sub, str):
            out.append(sub)
            continue
        start, cmds = sub
        d, at, run = f"M{n1(start[0])} {n1(start[1])}", start, []
        for c in cmds + [None]:
            if c is not None and len(c) == 1:
                run.append(c[0])
                continue
            if run:  # a run of straight segments, thinned
                d += "".join(f"L{n1(x)} {n1(y)}" for x, y in rdp([at] + run, 0.12)[1:])
                at, run = run[-1], []
            if c is not None:
                d += "C" + " ".join(f"{n1(x)} {n1(y)}" for x, y in c)
                at = c[-1]
        out.append(d + ("z" if closed else ""))
    return "".join(out)


def figure(doc, pno, clip, opt):
    pg = doc[pno - 1]
    x0, y0, x1, y1 = clip
    box = pymupdf.Rect(clip)
    w, h = (x1 - x0) * S, (y1 - y0) * S
    back, parts, discs = [], [], []
    # the renders: over the figure's background, under its lines and water
    for inf in pg.get_image_info(xrefs=True):
        b = pymupdf.Rect(inf["bbox"])
        if inf["width"] < 700 or not box.contains(b + (2, 2, -2, -2)):
            continue
        name = next(n for n, (d, p, least, k) in RENDERS.items() if doc.name.endswith(DOCS[d][0]) and p == pno and render_xref(doc, pno, least, k) == inf["xref"])
        parts.append(f'<image href="@img/{name}" x="{n1((b.x0 - x0) * S)}" y="{n1((b.y0 - y0) * S)}" width="{n1(b.width * S)}" height="{n1(b.height * S)}"/>')
    for dr in pg.get_drawings():
        r = dr["rect"]
        if r.x0 < x0 - 1 or r.x1 > x1 + 1 or r.y0 < y0 - 1 or r.y1 > y1 + 1:
            continue
        fill, stroke = hexc(dr.get("fill")), hexc(dr.get("color"))
        items = dr["items"]
        # a circle: the numbered discs and the pin heads
        if all(i[0] == "c" for i in items) and len(items) in (4, 8, 16, 32) and abs(r.width - r.height) < 0.4:
            cx, cy, rad = ((r.x0 + r.x1) / 2 - x0) * S, ((r.y0 + r.y1) / 2 - y0) * S, r.width * S / 2
            if fill == "#1b4e4a" and rad > 10:
                discs.append((cx, cy, rad))
                continue
            parts.append(f'<circle cx="{n1(cx)}" cy="{n1(cy)}" r="{n1(rad)}"' + (f' fill="{fill}"' if fill else ' fill="none"') + (f' stroke="{stroke}" stroke-width="{n1(dr["width"] * S)}"' if stroke else "") + "/>")
            continue
        a = [f'd="{path_of(items, x0, y0, bool(fill))}"', f'fill="{fill}"' if fill else 'fill="none"']
        if fill and (dr.get("fill_opacity") or 1) < 0.99:
            a.append(f'fill-opacity="{round(dr["fill_opacity"], 2)}"')
        if dr.get("even_odd") and fill:
            a.append('fill-rule="evenodd"')
        if stroke and dr["type"] != "f":
            a.append(f'stroke="{stroke}" stroke-width="{n1(dr["width"] * S)}"')
            dash = re.findall(r"[\d.]+", dr.get("dashes") or "")
            if len(dash) > 1 and float(dash[0]):
                a.append(f'stroke-dasharray="{" ".join(n1(float(v) * S) for v in dash[:-1])}"')
        ground = fill and dr["type"] == "f" and all(i[0] == "re" for i in items) and (dr.get("fill_opacity") or 1) > 0.99
        (back if ground else parts).append(f"<path {' '.join(a)}/>")
    # the words: a number on a disc becomes a badge, the rest are labels
    badges, labels = [], []
    for blk in pg.get_text("dict", clip=box)["blocks"]:
        for line in blk.get("lines", []):
            for sp in line["spans"]:
                t = sp["text"].strip()
                if not t or (opt.get("text") and not re.search(opt["text"], t)):
                    continue
                bx = pymupdf.Rect(sp["bbox"])
                mx, my = ((bx.x0 + bx.x1) / 2 - x0) * S, ((bx.y0 + bx.y1) / 2 - y0) * S
                disc = next((d for d in discs if abs(d[0] - mx) < d[2] and abs(d[1] - my) < d[2]), None)
                if disc and t.isdigit():
                    badges.append((int(t), disc))
                    continue
                head = HEADS.get(t.replace(" ", ""))  # a letterspaced heading, set in sentence case
                t = head or t
                cls = "h" if head else "b" if "Bold" in sp["font"] or sp["flags"] & 16 else ""
                ox, oy = (sp["origin"][0] - x0) * S, (sp["origin"][1] - y0) * S
                dx, dy = line["dir"]
                attrs = [f'x="{n1(ox)}" y="{n1(oy)}"', f'fill="#{sp["color"]:06x}"']
                if cls:
                    attrs.append(f'class="{cls}"')
                if abs(dy) > 0.01:
                    attrs.append(f'transform="rotate({n1(math.degrees(math.atan2(dy, dx)))} {n1(ox)} {n1(oy)})"')
                labels.append(f"<text {' '.join(attrs)}>{html.escape(t, quote=False)}</text>")
    for n, (cx, cy, rad) in sorted(badges):
        labels.append(f'<g class="sf-b" style="transform-origin:{n1(cx)}px {n1(cy)}px"><circle cx="{n1(cx)}" cy="{n1(cy)}" r="{n1(rad)}"/><text x="{n1(cx)}" y="{n1(cy)}">{n}</text></g>')
    return {"w": round(w), "h": round(h), "svg": "".join(back) + "".join(parts) + "".join(labels), "badges": len(badges)}


_xrefs = {}
def render_xref(doc, pno, least, k):
    """The xref of the k-th render `least` pixels wide on a page, in page order."""
    key = (doc.name, pno, least)
    if key not in _xrefs:
        _xrefs[key] = [x[0] for x in doc[pno - 1].get_images(full=True) if x[2] == least]
    return _xrefs[key][k]


def main():
    docs = {}
    for k, (name, out) in DOCS.items():
        path = os.path.join(SRC, name)
        docs[k] = pymupdf.open(path)
        shutil.copyfile(path, os.path.join(ROOT, "src/assets/docs", out))
        print(f"{out}: {os.path.getsize(path) // 1024} KB, {len(docs[k])} pages")
    for name, (d, pno, least, k) in RENDERS.items():
        doc = docs[d]
        xref = render_xref(doc, pno, least, k)
        mask = next(x[1] for x in doc[pno - 1].get_images(full=True) if x[0] == xref)
        pm = pymupdf.Pixmap(doc, xref)
        if mask:
            pm = pymupdf.Pixmap(pm, pymupdf.Pixmap(doc, mask))
        pm.save(os.path.join(IMG, name))
        # the WebP twin img() serves: near lossless, so the renders stay sharp
        # under the figures' call-outs and the moving water (products.py
        # leaves these alone)
        Image.open(os.path.join(IMG, name)).save(os.path.join(IMG, name[:-4] + ".webp"), "WEBP", quality=94, method=6)
        print(f"{name}: {pm.width} x {pm.height}, WebP {os.path.getsize(os.path.join(IMG, name[:-4] + '.webp')) // 1024} KB")
    figs = {}
    for name, (d, pno, clip, opt) in FIGURES.items():
        figs[name] = figure(docs[d], pno, clip, opt)
        print(f"figure {name}: {figs[name]['w']} x {figs[name]['h']}, {len(figs[name]['svg']) // 1024} KB, {figs[name].pop('badges')} badges")
    with open(os.path.join(ROOT, "src/data/sensor-fort-figures.json"), "w") as f:
        json.dump(figs, f, indent=1)
        f.write("\n")


if __name__ == "__main__":
    main()
