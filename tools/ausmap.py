#!/usr/bin/env python3
"""The office map on About and Contact: Australia from Natural Earth.

    python3 -I tools/ausmap.py <folder with the unzipped Natural Earth files>

The folder holds three public-domain Natural Earth downloads
(naturalearthdata.com, from naciscdn.org), each unzipped into a folder of its
own name:

  ne_10m_land/                            the coastline, at 1:10m
  ne_50m_admin_1_states_provinces_lines/  the state borders, at 1:50m
  SR_50M/                                 shaded relief of the world, 1:50m

It writes:

  src/data/ausmap.json               the map's units, Australia's coast and
                                     islands, its neighbours and the state
                                     borders as SVG paths
  src/assets/img/ausmap-relief.webp  the shaded relief over Australia, tinted
                                     to the deep teal band and transparent off
                                     the land

The projection is the one the office pins use (src/js/widgets.js): a plate
carree stretched for Australia's latitude, x = (lon - 111) * K and
y = (-lat - 9) * K * 1.13, over longitude 111 to 156 and latitude -9 to -45.5.
The relief raster is a plate carree of the world at 30 pixels a degree, so a
crop of it, stretched by the same 1.13, lies exactly under the paths.

Needs NumPy and Pillow (with WebP). Reads the shapefiles itself, so no GIS
library is needed.
"""
import argparse, json, math, os, struct
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K, STRETCH = 14, 1.13
LON0, LON1, LAT0, LAT1 = 111.0, 156.0, -9.0, -45.5
W, H = (LON1 - LON0) * K, (LAT0 - LAT1) * K * STRETCH


def xy(lon, lat):
    return (lon - LON0) * K, (-lat + LAT0) * K * STRETCH


# ---------------------------------------------------------------- shapefiles
def read_shp(path):
    """Polygons (type 5) and polylines (type 3): a list of rings or lines of
    (lon, lat) for each record."""
    b = open(path, "rb").read()
    i, out = 100, []
    while i < len(b):
        _, length = struct.unpack(">ii", b[i:i + 8])
        i += 8
        start = i
        kind = struct.unpack("<i", b[i:i + 4])[0]
        rings = []
        if kind in (3, 5):
            nparts, npoints = struct.unpack("<ii", b[i + 36:i + 44])
            parts = list(struct.unpack(f"<{nparts}i", b[i + 44:i + 44 + 4 * nparts])) + [npoints]
            off = i + 44 + 4 * nparts
            flat = struct.unpack(f"<{2 * npoints}d", b[off:off + 16 * npoints])
            pts = list(zip(flat[0::2], flat[1::2]))
            rings = [pts[parts[k]:parts[k + 1]] for k in range(nparts)]
        out.append(rings)
        i = start + length * 2
    return out


def read_dbf(path):
    """The records of a dBase table as dicts of stripped strings."""
    b = open(path, "rb").read()
    n, hlen, rlen = struct.unpack("<IHH", b[4:12])
    fields, i = [], 32
    while b[i] != 0x0D:
        fields.append((b[i:i + 11].split(b"\0")[0].decode(), b[i + 16]))
        i += 32
    rows = []
    for r in range(n):
        rec, pos, row = b[hlen + r * rlen:hlen + (r + 1) * rlen], 1, {}
        for name, ln in fields:
            row[name] = rec[pos:pos + ln].decode("utf-8", "replace").strip()
            pos += ln
        rows.append(row)
    return rows


# ---------------------------------------------------------------- geometry
def area(ring):
    return 0.5 * sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]))


def centroid(ring):
    xs, ys = zip(*ring)
    return sum(xs) / len(xs), sum(ys) / len(ys)


def clip(ring, x0, y0, x1, y1):
    """Sutherland-Hodgman: a ring cut to a rectangle."""
    def cut(pts, inside, meet):
        out = []
        for k, p in enumerate(pts):
            q = pts[k - 1]
            if inside(p):
                if not inside(q):
                    out.append(meet(q, p))
                out.append(p)
            elif inside(q):
                out.append(meet(q, p))
        return out
    def at_x(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))
    def at_y(y):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y)
    pts = ring
    for inside, meet in ((lambda p: p[0] >= x0, at_x(x0)), (lambda p: p[0] <= x1, at_x(x1)),
                         (lambda p: p[1] >= y0, at_y(y0)), (lambda p: p[1] <= y1, at_y(y1))):
        if not pts:
            break
        pts = cut(pts, inside, meet)
    return pts


def simplify(pts, eps):
    """Douglas-Peucker, iterative."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = pts[a], pts[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy) or 1e-9
        best, at = 0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / norm if norm > 1e-9 else math.hypot(px - ax, py - ay)
            if d > best:
                best, at = d, i
        if best > eps and at > 0:
            keep[at] = True
            stack += [(a, at), (at, b)]
    return [p for p, k in zip(pts, keep) if k]


def path(rings, closed=True):
    """Rings in map units as compact SVG path data: absolute moves, relative
    lines from rounded points, so the rounding never drifts."""
    out = []
    for ring in rings:
        r = [(round(x, 1), round(y, 1)) for x, y in ring]
        r = [p for k, p in enumerate(r) if k == 0 or p != r[k - 1]]
        if len(r) < 2:
            continue
        s = f"M{r[0][0]:g} {r[0][1]:g}"
        for (x0, y0), (x1, y1) in zip(r, r[1:]):
            s += f"l{round(x1 - x0, 1):g} {round(y1 - y0, 1):g}"
        out.append(s + ("z" if closed else ""))
    return "".join(out)


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src", help="folder with the unzipped Natural Earth files")
    ap.add_argument("--eps", type=float, default=0.32, help="simplification tolerance, map units")
    a = ap.parse_args()

    # land: Australia's rings, and the neighbours' cut to the frame
    aus, other = [], []
    for rings in read_shp(os.path.join(a.src, "ne_10m_land", "ne_10m_land.shp")):
        for ring in rings:
            lons = [p[0] for p in ring]; lats = [p[1] for p in ring]
            if max(lons) < LON0 - 1 or min(lons) > LON1 + 1 or max(lats) < LAT1 - 1 or min(lats) > LAT0 + 1:
                continue
            cx, cy = centroid(ring)
            big = abs(area(ring))
            torres = 141.0 <= cx <= 144.6 and -10.95 <= cy <= -9.1 and big < 0.06
            louisiade = cx > 148.5 and cy > -12.2
            if (cy < -10.95 and not louisiade and LON0 < cx < LON1 and cy > LAT1) or torres:
                aus.append(ring)
            else:
                c = clip(ring, LON0 - 0.5, LAT1 - 0.5, LON1 + 0.5, LAT0 + 0.5)
                if len(c) > 2:
                    other.append(c)
    proj = lambda ring: [xy(lon, lat) for lon, lat in ring]
    # islands smaller than about a twentieth of a square degree are left out,
    # unless they are named in a map of this size anyway (K'gari, the Tiwis,
    # Groote Eylandt, Kangaroo Island are all far bigger)
    aus_p = [simplify(proj(r), a.eps) for r in aus if abs(area(r)) > 0.006]
    other_p = [simplify(proj(r), a.eps * 1.6) for r in other if abs(area(r)) > 0.02]

    # state borders on land, Australia's only
    shp = os.path.join(a.src, "ne_50m_admin_1_states_provinces_lines", "ne_50m_admin_1_states_provinces_lines")
    lines = []
    for rec, rings in zip(read_dbf(shp + ".dbf"), read_shp(shp + ".shp")):
        if rec.get("ADM0_A3") == "AUS":
            lines += [simplify(proj(r), a.eps * 0.6) for r in rings]

    data = {
        "source": "Natural Earth (public domain): ne_10m_land, ne_50m_admin_1_states_provinces_lines, SR_50M. tools/ausmap.py",
        "k": K, "stretch": STRETCH, "lon0": LON0, "lat0": LAT0,
        "w": round(W, 1), "h": round(H, 1),
        "aus": path(aus_p), "other": path(other_p), "states": path(lines, closed=False),
    }
    out = os.path.join(ROOT, "src", "data", "ausmap.json")
    json.dump(data, open(out, "w"), separators=(",", ":"))
    print(f"ausmap.json: {os.path.getsize(out) // 1024} KB, {sum(len(r) for r in aus_p)} coast points in {len(aus_p)} rings, {len(other_p)} neighbour rings, {len(lines)} border lines")

    # relief: the crop of the 1:50m shaded relief under the frame, at 30 px a
    # degree (the raster's own), masked to Australia and tinted to the band
    Image.MAX_IMAGE_PIXELS = None
    sr = Image.open(os.path.join(a.src, "SR_50M", "SR_50M.tif"))
    px = lambda lon: (lon + 180) * 30
    py = lambda lat: (90 - lat) * 30
    box = (round(px(LON0)), round(py(LAT0)), round(px(LON1)), round(py(LAT1)))
    h = np.asarray(sr.crop(box), dtype=np.float32)
    cw, ch = h.shape[1], h.shape[0]
    # the land mask, drawn at 3x and brought down for a soft edge
    S = 3
    m = Image.new("L", (cw * S, ch * S), 0)
    d = ImageDraw.Draw(m)
    for ring in aus:
        if abs(area(ring)) <= 0.006:
            continue
        pts = [((lon - LON0) * 30 * S, (LAT0 - lat) * 30 * S) for lon, lat in ring]
        d.polygon(pts, fill=255)
    mask = np.asarray(m.resize((cw, ch), Image.LANCZOS), dtype=np.float32) / 255
    # the hillshade, flat ground near its middle value: shadows dark teal,
    # lit slopes pale aqua, the plains a calm mid teal with a little texture
    land = h[mask > 0.5]
    lo, mid, hi = np.percentile(land, 2), np.percentile(land, 50), np.percentile(land, 99.6)
    t = np.clip((h - mid) / np.where(h >= mid, hi - mid, mid - lo), -1, 1)
    t = np.sign(t) * np.abs(t) ** 0.85
    base = np.array([32, 94, 87], np.float32)      # the plains
    dark = np.array([10, 52, 49], np.float32)      # slopes away from the light
    lit = np.array([128, 196, 182], np.float32)    # slopes facing it
    rgb = np.where(t[..., None] < 0, base + (dark - base) * (-t[..., None]), base + (lit - base) * t[..., None])
    # a faint rise in tone towards the coast, as sea light catches it
    edge = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10)), np.float32) / 255
    rgb = rgb * (1 + 0.1 * (1 - edge))[..., None]
    rgba = np.dstack([np.clip(rgb, 0, 255), mask * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    out = os.path.join(ROOT, "src", "assets", "img", "ausmap-relief.webp")
    img.save(out, "WEBP", quality=78, method=6)
    print(f"ausmap-relief.webp: {img.size[0]} x {img.size[1]}, {os.path.getsize(out) // 1024} KB")


if __name__ == "__main__":
    main()
