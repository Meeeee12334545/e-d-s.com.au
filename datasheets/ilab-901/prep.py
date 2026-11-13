#!/usr/bin/env python3
"""Prepare the artwork for the iLab 901 datasheet and web page.

    python3 -I datasheets/ilab-901/prep.py

Writes into ./assets:
  ilab-901.png       the sonde and its sensor guard, cut out, for the datasheet
  eds-logo-colour.png, eds-logo-white.png   the real EDS logo
  saira-semiexpanded-latin.woff2            the site's heading face
and into src/assets/img: ilab-901.png (the same shot at web size; run
tools/products.py afterwards for its WebP twin).

The product shot starts from EDS's own high-resolution render on the Synology
drive (6667 x 4675, the label already blanked by EDS in 2022). The blanked
patch is flat grey and has a line of the maker's small print left under it, so
the label band is repainted here from the cylinder's own shading (one clean
column, mapped between the tube's top and bottom edges; the small print goes) and "iLab" is set on
it in the blue of EDS's own labelled artwork (ilab-and-sensor.jpg). The floor
shadow under the guard is cleared so the shot sits on any plate.
Needs Pillow and numpy.
"""
import os, shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, "assets")
PORTAL = os.path.expanduser("~/Library/CloudStorage/SynologyDrive-EDS/EDS Portal")
RENDER = os.path.join(PORTAL, "Equipment/EDS/iLab Multi-Parameter Quality Sensor/Hb5b5dae7156a44d28c088963964e3143T.png")
LOGOS = os.path.join(PORTAL, "EDS Main Logos")
FONT = ("/System/Library/Fonts/HelveticaNeue.ttc", 3)  # Bold Italic
BLUE = (16, 110, 190)

os.makedirs(OUT, exist_ok=True)

# ---------- the product shot ----------
im = Image.open(RENDER).convert("RGBA")
px = np.asarray(im).astype(np.float32)
alpha = px[..., 3]

# The label band in the render ends at column X1; CLEAN is one clean column
# of the tube's shading just right of the blanked patch.
X1, CLEAN = 3422, 3424
ROW = 1700  # a row that crosses the tube at every column used


def edges(x):
    """Top and bottom of the tube at column x: the opaque run through ROW."""
    col = alpha[:, x] > 200
    top = ROW
    while col[top - 1]:
        top -= 1
    bot = ROW
    while col[bot + 1]:
        bot += 1
    return top, bot


ct, cb = edges(CLEAN)
profile = px[ct:cb + 1, CLEAN, :3]            # shading from top edge to bottom edge
tt = np.linspace(0, 1, len(profile))

# Repaint from 17% to 98.5% of the tube's height (past the top of EDS's patch
# and over the maker's small print under it), easing in over a few percent at
# the top and bottom and a few pixels at the left so no seam shows.
X0 = 2338
T0, T1, M, MX = 0.17, 0.985, 0.03, 10
for x in range(X0 - MX, X1 + 1):
    top, bot = edges(x)
    ys = np.arange(top, bot + 1)
    t = (ys - top) / (bot - top)
    w = np.clip((t - (T0 - M)) / M, 0, 1) * np.clip(((T1 + 0.01) - t) / 0.01, 0, 1) * min(1, max(0, (x - (X0 - MX)) / MX))
    for c in range(3):
        px[ys, x, c] = px[ys, x, c] * (1 - w) + np.interp(t, tt, profile[:, c]) * w

# "iLab" on the label, drawn flat then set along the tube: the quad's corners
# sit at fixed fractions of the tube's height at its two ends.
font = ImageFont.truetype(FONT[0], 400, index=FONT[1])
box = font.getbbox("iLab")
flat = Image.new("L", (box[2] - box[0] + 40, box[3] - box[1] + 40), 0)
ImageDraw.Draw(flat).text((20 - box[0], 20 - box[1]), "iLab", font=font, fill=255)
LX0, LX1, LT0, LT1 = 2400, 2400 + int(flat.width * 0.56), 0.345, 0.625


def at(x, t):
    top, bot = edges(x)
    return (x, top + t * (bot - top))


quad = [at(LX0, LT0), at(LX0, LT1), at(LX1, LT1), at(LX1, LT0)]  # tl, bl, br, tr
# perspective coefficients mapping output (render) points back to the flat art
src = [(0, 0), (0, flat.height), (flat.width, flat.height), (flat.width, 0)]
A, B = [], []
for (X, Y), (u, v) in zip(quad, src):
    A += [[X, Y, 1, 0, 0, 0, -u * X, -u * Y], [0, 0, 0, X, Y, 1, -v * X, -v * Y]]
    B += [u, v]
coef = np.linalg.solve(np.array(A, np.float64), np.array(B, np.float64))
ink = np.asarray(flat.transform(im.size, Image.PERSPECTIVE, tuple(coef), Image.BICUBIC)).astype(np.float32)[..., None] / 255
px[..., :3] = px[..., :3] * (1 - ink) + np.array(BLUE, np.float32) * ink

# clear the floor shadow: the soft, mostly transparent wash under the guard
px[..., 3] = np.where(alpha < 150, 0, alpha)
shot = Image.fromarray(px.clip(0, 255).astype(np.uint8), "RGBA")
# drop specks left by the threshold, then crop to the product
a = shot.getchannel("A").filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
shot.putalpha(Image.fromarray(np.minimum(np.asarray(a), np.asarray(shot.getchannel("A")))))
shot = shot.crop(shot.getchannel("A").getbbox())

big = shot.copy(); big.thumbnail((2400, 2400), Image.LANCZOS)
big.save(os.path.join(OUT, "ilab-901.png"), optimize=True)
web = shot.copy(); web.thumbnail((1400, 1400), Image.LANCZOS)
web.save(os.path.join(ROOT, "src/assets/img/ilab-901.png"), optimize=True)
print("ilab-901.png", big.size, "web", web.size)

# ---------- logo and heading face ----------
for src_name, name in (("Colour Version/EDS Logo Colour Large.png", "eds-logo-colour.png"), ("White Version/EDS Logo WHITE Large.png", "eds-logo-white.png")):
    logo = Image.open(os.path.join(LOGOS, src_name)).convert("RGBA")
    logo = logo.crop(logo.getchannel("A").getbbox())
    logo.thumbnail((1200, 1200), Image.LANCZOS)
    logo.save(os.path.join(OUT, name), optimize=True)
    print(name, logo.size)
shutil.copy(os.path.join(ROOT, "src/assets/fonts/saira-semiexpanded-latin.woff2"), OUT)
