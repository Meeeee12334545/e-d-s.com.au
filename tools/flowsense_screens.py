#!/usr/bin/env python3
"""Lift the FlowSense screens out of the brochures for flowsense.html.

    python3 -I tools/flowsense_screens.py

The brochures in src/assets/docs carry each screen of the platform as a full
size JPEG (photographed from the demonstration account, whose sites and
readings are synthetic). This script copies them out as
src/assets/img/flowsense/<name>-<w>x<h>.jpg with a WebP twin at each width,
so build.mjs can offer the browser a smaller one on a phone (`shot()`).
Nothing is graded: screens keep their own colours. Needs PyMuPDF and Pillow
(pip install pymupdf pillow). Re-run it after a brochure is replaced, then
check the page: a new revision may move a screen to another page or xref.
"""
import io, os
import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "src/assets/docs")
OUT = os.path.join(ROOT, "src/assets/img/flowsense")

# document, image xref, name, widths to write
SCREENS = [
    ("eds-flowsense-platform-brochure.pdf", 14, "overview", (2240, 1200)),
    ("eds-flowsense-platform-brochure.pdf", 48, "phone", (600, 320)),
    ("eds-flowsense-platform-brochure.pdf", 17, "network-map", (1600, 800)),
    ("eds-flowsense-platform-brochure.pdf", 45, "fleet-health", (1600, 800)),
    ("eds-flowsense-platform-brochure.pdf", 46, "alarms", (1600, 800)),
    ("eds-flowsense-platform-brochure.pdf", 59, "site-page", (1600, 800)),
    ("eds-flowsense-platform-brochure.pdf", 60, "site-month", (1600, 800)),
    ("eds-flowsense-platform-brochure.pdf", 71, "blockage-watch", (1600, 800)),
    ("eds-flowsense-platform-brochure.pdf", 82, "blockage-case", (1200, 600)),
    ("eds-flowsense-platform-brochure.pdf", 93, "ii-figures", (1600, 800)),
    ("eds-flowsense-platform-brochure.pdf", 94, "rdii-hydrograph", (1600, 800)),
    ("eds-flowsense-platform-brochure.pdf", 105, "scattergraph", (1600, 800)),
    ("eds-flowsense-platform-brochure.pdf", 106, "site-diagnostics", (1200, 600)),
    ("eds-flowsense-platform-brochure.pdf", 117, "heat-map", (2240, 1200)),
    ("eds-flowsense-platform-brochure.pdf", 128, "rtk-calibration", (1600, 800)),
    ("eds-flowsense-platform-brochure.pdf", 139, "psm", (2240, 1200)),
    ("eds-flowsense-platform-brochure.pdf", 150, "report", (1200, 600)),
    ("eds-flowsense-platform-brochure.pdf", 151, "report-builder", (1600, 800)),
    ("eds-flowsense-brochure.pdf", 299, "flow-analytics", (1600, 800)),
]

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))
docs = {}
for doc, xref, name, widths in SCREENS:
    d = docs.setdefault(doc, pymupdf.open(os.path.join(DOCS, doc)))
    im = Image.open(io.BytesIO(d.extract_image(xref)["image"])).convert("RGB")
    for w in sorted({min(w, im.width) for w in widths}, reverse=True):
        h = round(im.height * w / im.width)
        out = im.resize((w, h), Image.LANCZOS) if w != im.width else im
        base = os.path.join(OUT, f"{name}-{w}x{h}")
        out.save(base + ".jpg", quality=80, optimize=True, progressive=True)
        out.save(base + ".webp", quality=80, method=6)
        print(f"{name}-{w}x{h}: jpg {os.path.getsize(base + '.jpg') // 1024} KB, webp {os.path.getsize(base + '.webp') // 1024} KB")
