#!/usr/bin/env python3
"""Screens of EDS's own software, lifted out of its manuals.

    python3 -I tools/software_screens.py

Copies screenshots out of the manuals in src/assets/docs as
src/assets/img/software/<name>-<w>x<h>.jpg with a WebP twin, laid out like the
FlowSense screens (tools/flowsense_screens.py) so build.mjs shows them the
same way (`shot()`), in their own colours. Needs PyMuPDF and Pillow (pip
install pymupdf pillow). Re-run it after a manual is replaced, and check the
xref still points at the same screen.
"""
import io, os
import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "src/assets/docs")
OUT = os.path.join(ROOT, "src/assets/img/software")

# document, image xref, name, widths to write
SCREENS = [
    ("eds-ems-flow-user-manual.pdf", 44, "ems-flow-wizard", (930, 620)),
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
        out.save(base + ".jpg", quality=84, optimize=True, progressive=True)
        out.save(base + ".webp", quality=82, method=6)
        print(f"{name}-{w}x{h}: jpg {os.path.getsize(base + '.jpg') // 1024} KB, webp {os.path.getsize(base + '.webp') // 1024} KB")
