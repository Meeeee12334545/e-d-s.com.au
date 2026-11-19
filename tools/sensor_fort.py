#!/usr/bin/env python3
"""Sensor Fort documents and renders, from EDS's own brochure and datasheet.

    python3 -I tools/sensor_fort.py [folder with the two PDFs]

Reads "Sensor Fort Brochure.pdf" (SF BR 001) and "Sensor Fort SF 150
Datasheet.pdf" (SF DS 001), by default from the EDS Synology drive, and writes:

  src/assets/docs/eds-sensor-fort-{brochure,datasheet}.pdf   the documents
  src/assets/img/sensor-fort*.jpg and .webp                  the renders

From Rev C both documents are flattened: every page is one image with the
words laid over it for search, so there are no vectors to lift. The renders
are cut from the page images (2382 pixels across an A4 page), numbered
call-outs and all, and the page's key to them is set as text beside each
(build.mjs: sfShot). The line drawings (dimensions, site, installation) are
redrawn as SVG in diagrams.mjs from the datasheet's figures.

The cover render is the one picture that is retouched: its three call-out
lines and their dots are painted out, so the hero and the product cards show
the mount alone. Nothing of the mount itself is changed.

Needs PyMuPDF, Pillow, NumPy and OpenCV (pip install pymupdf pillow numpy
opencv-python-headless). Check the boxes below against a new revision: they
are in pixels of the page image.
"""
import os, shutil, sys
import cv2, numpy as np, pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Library/CloudStorage/SynologyDrive-EDS/EDS Portal/Equipment/EDS/Sensor Fort SF")
DOCS = {"br": ("Sensor Fort Brochure.pdf", "eds-sensor-fort-brochure.pdf"), "ds": ("Sensor Fort SF 150 Datasheet.pdf", "eds-sensor-fort-datasheet.pdf")}
IMG = os.path.join(ROOT, "src/assets/img")
PAGE_W = 2382  # the width the boxes were measured at

# the renders: file -> (document, page, box in page pixels, widest it is saved)
RENDERS = {
    "sensor-fort": ("br", 1, (537, 1296, 1717, 2690), 1180),      # the mount from upstream, on white
    "sensor-fort-lid": ("br", 4, (0, 529, 2382, 2285), 2000),     # in the chase, seen from the lid
    "sensor-fort-parts": ("br", 5, (179, 2043, 1135, 3014), 956),  # the five parts, numbered
    "sensor-fort-stern": ("br", 7, (179, 641, 2203, 1782), 1800),  # the stern face and the sensor tips
}
# the cover's call-outs, in the cover box's own pixels: a rule on the white
# page, a leader from its end, and a dot on the mount. Where a leader or dot
# lies on the mount's long faces it is covered with the same face from a
# little further along the mount (SHIFT), which is shaded the same; the rest
# is filled in from its surroundings.
RULE_C = ((0, 1259), (342, 1259))
RULE_C_WHITE = 280    # rule C is on the white page as far as this
LEAD_A, LEAD_B, LEAD_C = ((1214, 174), (1095, 272)), ((1127, 786), (678, 844)), ((342, 1259), (456, 1193))
SHIFT = (35, -29)     # along the mount: its walls and lips run this way
CABLE_SHIFT = (1, 38)  # down the cable, for the dot that sits on it


def page_image(doc, pno):
    """The one image a page is made of, as RGB."""
    pg = doc[pno - 1]
    xref = max(pg.get_images(full=True), key=lambda x: x[2] * x[3])[0]
    pm = pymupdf.Pixmap(doc, xref)
    if pm.n != 3:
        pm = pymupdf.Pixmap(pymupdf.csRGB, pm)
    im = Image.frombytes("RGB", (pm.width, pm.height), pm.samples)
    if im.width != PAGE_W:
        raise SystemExit(f"{doc.name} page {pno}: page image is {im.width} px wide, not {PAGE_W}. Re-measure the boxes.")
    return im


def clean_cover(im):
    """Paint out the cover's three call-outs, leaving the mount as rendered."""
    a = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
    h, w = a.shape[:2]

    def cover(mask, shift):
        # the picture moved by `shift`, let in through a soft-edged mask
        m = np.float32([[1, 0, -shift[0]], [0, 1, -shift[1]]])
        moved = cv2.warpAffine(a, m, (w, h), borderMode=cv2.BORDER_REPLICATE)
        alpha = cv2.GaussianBlur(mask, (0, 0), 2.2).astype(np.float32)[..., None] / 255
        return (a * (1 - alpha) + moved * alpha).astype(np.uint8)

    # leader B, its rule and its dot: over the lip, the wall and the shadow
    # beside it, which all run the way the mount does
    mask = np.zeros((h, w), np.uint8)
    cv2.line(mask, (w, LEAD_B[0][1]), LEAD_B[0], 255, 15)
    cv2.line(mask, *LEAD_B, 255, 15)
    cv2.circle(mask, LEAD_B[1], 19, 255, -1)
    a = cover(mask, SHIFT)
    # the dot on the cable
    mask[:] = 0
    cv2.circle(mask, LEAD_A[1], 18, 255, -1)
    a = cover(mask, CABLE_SHIFT)
    # leader A on the white page, as far as the cable
    (ax, ay), (bx, by) = LEAD_A
    ex = bx + 26
    cv2.line(a, (ax, ay), (ex, round(ay + (by - ay) * (ax - ex) / (ax - bx))), (255, 255, 255), 23)
    # rule C and its leader and dot, at the nose: filled in from around them
    cv2.line(a, RULE_C[0], (RULE_C_WHITE, RULE_C[0][1]), (255, 255, 255), 11)
    mask[:] = 0
    cv2.line(mask, (RULE_C_WHITE, RULE_C[0][1]), RULE_C[1], 255, 9)
    cv2.line(mask, *LEAD_C, 255, 11)
    cv2.circle(mask, LEAD_C[1], 16, 255, -1)
    a = cv2.inpaint(a, mask, 5, cv2.INPAINT_TELEA)
    # the ends of the page's own captions, in the two bottom corners
    a[1285:, :230] = 255
    a[1285:, 960:] = 255
    return Image.fromarray(cv2.cvtColor(a, cv2.COLOR_BGR2RGB))


def main():
    docs = {}
    for k, (name, out) in DOCS.items():
        path = os.path.join(SRC, name)
        docs[k] = pymupdf.open(path)
        shutil.copyfile(path, os.path.join(ROOT, "src/assets/docs", out))
        print(f"{out}: {os.path.getsize(path) // 1024} KB, {len(docs[k])} pages")
    for name, (d, pno, box, widest) in RENDERS.items():
        im = page_image(docs[d], pno).crop(box)
        if name == "sensor-fort":
            im = clean_cover(im)
        if im.width > widest:
            im = im.resize((widest, round(im.height * widest / im.width)), Image.LANCZOS)
        jpg, webp = os.path.join(IMG, name + ".jpg"), os.path.join(IMG, name + ".webp")
        im.save(jpg, "JPEG", quality=90, optimize=True, progressive=True)
        im.save(webp, "WEBP", quality=90, method=6)
        print(f"{name}: {im.width} x {im.height}, JPEG {os.path.getsize(jpg) // 1024} KB, WebP {os.path.getsize(webp) // 1024} KB")


if __name__ == "__main__":
    main()
