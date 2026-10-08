#!/usr/bin/env python3
"""Prepare a photograph for the site.

    python3 tools/photos.py <source> <name> [--crop x0,y0,x1,y1] [--patch x0,y0,x1,y1:fx,fy]
                            [--widths 1600,800] [--quality 82]

Writes src/assets/img/photos/<name>-<w>x<h>.jpg and .webp at each width (never
larger than the source), with the camera's metadata left out. build.mjs finds
them by name, so a page refers to the photo as photo("<name>"). Fractions of
the image, 0 to 1, describe a crop, or a patch: the rectangle to cover and the
top left corner of the area to copy over it, or "above" to mirror the strip
just above it (to hide a date stamp). Patches are feathered at the edges.

    python3 tools/photos.py <source> --product <file> [--max 1000]

Resizes a product shot to at most --max pixels on its longest side and writes
it straight to src/assets/img/<file>, as JPEG or PNG by its extension.
Needs Pillow (pip install pillow).
"""
import argparse, os, sys
from PIL import Image, ImageDraw, ImageOps, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "src/assets/img")

def frac(s):
    return [float(v) for v in s.split(",")]

def box(im, f):
    x0, y0, x1, y1 = f
    return (round(x0 * im.width), round(y0 * im.height), round(x1 * im.width), round(y1 * im.height))

ap = argparse.ArgumentParser()
ap.add_argument("source"); ap.add_argument("name", nargs="?")
ap.add_argument("--crop"); ap.add_argument("--patch", action="append", default=[])
ap.add_argument("--widths", default="1600,800"); ap.add_argument("--quality", type=int, default=82)
ap.add_argument("--product"); ap.add_argument("--max", type=int, default=1000)
a = ap.parse_args()

im = ImageOps.exif_transpose(Image.open(a.source))
if a.product:
    im.thumbnail((a.max, a.max), Image.LANCZOS)
    out = os.path.join(IMG, a.product)
    if out.lower().endswith(".png"):
        im.save(out, optimize=True)
    else:
        im.convert("RGB").save(out, quality=88, optimize=True, progressive=True)
    print(f"{a.product}: {im.width}x{im.height}, {os.path.getsize(out) // 1024} KB")
    sys.exit()

if not a.name: ap.error("a name is needed")
im = im.convert("RGB")
for p in a.patch:
    rect, src = p.split(":")
    x0, y0, x1, y1 = box(im, frac(rect)); w, h = x1 - x0, y1 - y0
    if src == "above":
        tile = ImageOps.flip(im.crop((x0, y0 - h, x1, y0)))
    else:
        fx, fy = frac(src); sx, sy = round(fx * im.width), round(fy * im.height)
        tile = im.crop((sx, sy, sx + w, sy + h))
    # feathered edges, so the patch fades into its surroundings
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rectangle((8, 8, w - 9, h - 9), fill=255)
    im.paste(tile, (x0, y0), mask.filter(ImageFilter.GaussianBlur(5)))
if a.crop:
    im = im.crop(box(im, frac(a.crop)))

os.makedirs(os.path.join(IMG, "photos"), exist_ok=True)
widths = sorted({min(int(w), im.width) for w in a.widths.split(",")}, reverse=True)
for w in widths:
    h = round(im.height * w / im.width)
    out = im.resize((w, h), Image.LANCZOS) if w != im.width else im
    base = os.path.join(IMG, "photos", f"{a.name}-{w}x{h}")
    out.save(base + ".jpg", quality=a.quality, optimize=True, progressive=True)
    out.save(base + ".webp", quality=a.quality, method=6)
    print(f"{a.name}-{w}x{h}: jpg {os.path.getsize(base + '.jpg') // 1024} KB, webp {os.path.getsize(base + '.webp') // 1024} KB")
