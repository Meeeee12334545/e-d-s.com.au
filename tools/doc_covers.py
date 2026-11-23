#!/usr/bin/env python3
"""Cover images for the white papers on resources.html.

    python3 -I tools/doc_covers.py

Renders the first page of each paper in src/assets/docs (`papers` in
content.mjs) to src/assets/img/covers/<name>-<w>x<h>.jpg with a WebP twin, at
two widths, so the card can show the paper as it looks before it is
downloaded. The pages are EDS's own, shown in their own colours. Needs
PyMuPDF and Pillow (pip install pymupdf pillow). Re-run it after a paper is
replaced or a new one is added to PAPERS.
"""
import io, os
import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "src/assets/docs")
OUT = os.path.join(ROOT, "src/assets/img/covers")

# document, name (the paper's id in content.mjs)
PAPERS = [
    ("eds-industry-paper-one-platform-many-sources.pdf", "one-platform-many-sources"),
    ("eds-white-paper-unforeseen-benefits-of-ii-monitoring.pdf", "unforeseen-benefits"),
    ("eds-white-paper-measuring-the-invisible-problem.pdf", "measuring-the-invisible"),
    ("eds-white-paper-thermistor-strings.pdf", "thermistor-strings"),
]
WIDTHS = (640, 320)

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))
for doc, name in PAPERS:
    page = pymupdf.open(os.path.join(DOCS, doc))[0]
    pix = page.get_pixmap(dpi=200)
    im = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    for w in WIDTHS:
        h = round(im.height * w / im.width)
        out = im.resize((w, h), Image.LANCZOS)
        base = os.path.join(OUT, f"{name}-{w}x{h}")
        out.save(base + ".jpg", quality=84, optimize=True, progressive=True)
        out.save(base + ".webp", quality=80, method=6)
        print(base, os.path.getsize(base + ".jpg"), os.path.getsize(base + ".webp"))
