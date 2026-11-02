#!/usr/bin/env python3
"""WebP twins for the product shots in src/assets/img.

    python3 -I tools/products.py [--force]

Writes <name>.webp beside every PNG or JPEG in src/assets/img (not its
photos/ or flowsense/ folders, which have their own twins) that is over
60 KB, at its own size, with any transparency kept. img() in content.mjs
serves the twin when there is one, so run this after adding or replacing a
product shot; a twin older than its source is rebuilt, and --force rebuilds
them all. Client logos, the favicon and touch icon, the share card, the EDS
logo and the Metalog dimension drawing are left alone: they are small, need
their own format, or are line art that lossy WebP would blur.
Needs Pillow (pip install pillow).
"""
import glob, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "src/assets/img")
SKIP = ("client-", "favicon", "apple-touch", "og-card", "eds-logo", "metalog-4g-dimensions")
force = "--force" in sys.argv[1:]

before = after = 0
for f in sorted(glob.glob(os.path.join(IMG, "*.png")) + glob.glob(os.path.join(IMG, "*.jpg"))):
    name = os.path.basename(f)
    if name.startswith(SKIP) or os.path.getsize(f) < 60_000:
        continue
    out = f.rsplit(".", 1)[0] + ".webp"
    if not force and os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f):
        continue
    im = Image.open(f)
    im = im.convert("RGBA" if im.mode in ("P", "LA", "RGBA") or "transparency" in im.info else "RGB")
    im.save(out, "WEBP", quality=84, method=6)
    before += os.path.getsize(f)
    after += os.path.getsize(out)
    print(f"{name}: {os.path.getsize(f) // 1024} KB -> {os.path.getsize(out) // 1024} KB")
if before:
    print(f"{before // 1024} KB -> {after // 1024} KB")
