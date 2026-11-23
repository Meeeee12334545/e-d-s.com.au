"""Draw the EDS patent pending mark as a self-contained SVG.

The mark is a ruled two-cell plate: the EDS logo (wave and letters) in white
on the logo teal, then PATENT PENDING. The logo is traced from EDS's own
artwork ("EDS Logo Colour Large.png" in EDS Portal/EDS Main Logos on the
Synology drive, 4000 px wide), leaving out the "Environmental Data Services"
line. The words are outlined from the site's display face (Saira at its
semi-expanded width, OFL; see tools/fonts.py), so the file needs no fonts
and looks the same on the site, in a PDF or in an email.

usage: python3 -I tools/patent_mark.py [path/to/EDS Logo Colour Large.png]
       (needs OpenCV, NumPy, Pillow, fontTools and brotli)
writes src/assets/img/patent-pending.svg
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LOGO = Path.home() / "Library/CloudStorage/SynologyDrive-EDS/EDS Portal/EDS Main Logos/Colour Version/EDS Logo Colour Large.png"
FONT = ROOT / "src/assets/fonts/saira-semiexpanded-latin.woff2"
OUT = ROOT / "src/assets/img/patent-pending.svg"

TEAL = "#3D9991"  # the logo's own teal
INK = "#0f2b2a"   # --ink
H = 40            # plate height, px at 1x
LINE = 1.5        # rule weight
LOGO_H = 20       # logo height inside the teal cell
PAD = 12          # side padding in each cell
SIZE = 15         # type size of the words
WEIGHT = 620      # same weight as the site's headings
TRACK = 0.12      # letter spacing, em
WORDS = "PATENT PENDING"


def runs(profile):
    """Start and end of each run of non-empty entries."""
    on = np.concatenate([[0], (profile > 0).astype(int), [0]])
    d = np.diff(on)
    return list(zip(np.where(d == 1)[0], np.where(d == -1)[0]))


def logo_mask(path):
    """The wave and the EDS letters, without the line of words under them."""
    a = np.array(Image.open(path).convert("RGBA"))[:, :, 3] > 127
    cols = runs(a.sum(0))
    # the wave is the first run of columns; the letters and the words follow
    wave_end = cols[0][1]
    right = a[:, wave_end:]
    letters = runs(right.sum(1))[0]  # first band of rows: the letters
    keep = a.copy()
    keep[:, wave_end:] = False
    keep[letters[0]:letters[1], wave_end:] = right[letters[0]:letters[1]]
    ys, xs = np.where(keep)
    return keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def trace(mask, scale, dx, dy):
    """The mask as one even-odd path, scaled into place."""
    m = mask.astype(np.uint8) * 255
    contours, _ = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    d = []
    for c in contours:
        c = cv2.approxPolyDP(c, 1.2, True)[:, 0, :]
        if len(c) < 3:
            continue
        pts = [f"{dx + x * scale:.2f} {dy + y * scale:.2f}" for x, y in c]
        d.append("M" + "L".join(pts) + "Z")
    return "".join(d)


def words(text, size, x, baseline):
    """Outlined words, their ink bounds (x0, x1) and the cap height."""
    font = instancer.instantiateVariableFont(TTFont(FONT), {"wght": WEIGHT})
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    em = font["head"].unitsPerEm
    s = size / em
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}")
    ink = BoundsPen(gs)
    pos = 0.0
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]
        for out in (pen, ink):
            gs[g].draw(TransformPen(out, (s, 0, 0, -s, x + pos, baseline)))
        pos += hmtx[g][0] * s
        if i < len(text) - 1:
            pos += TRACK * size
    cap = font["OS/2"].sCapHeight * s
    return pen.getCommands(), (ink.bounds[0], ink.bounds[2]), cap


mask = logo_mask(Path(sys.argv[1]) if len(sys.argv) > 1 else LOGO)
lh, lw = mask.shape
scale = LOGO_H / lh
logo_w = lw * scale
cell = PAD + logo_w + PAD
logo = trace(mask, scale, PAD, (H - LOGO_H) / 2)

# the words' ink centred in the white cell, side to side and on cap height
_, (x0, x1), cap = words(WORDS, SIZE, 0, 0)
gap = PAD + 2  # from the teal cell, and from the inside of the rule
text, _, _ = words(WORDS, SIZE, cell + gap - x0, H / 2 + cap / 2)
W = cell + gap + (x1 - x0) + gap + LINE
r = 2  # --radius
h = LINE / 2

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.2f} {H}" width="{W:.0f}" height="{H}" role="img" aria-labelledby="t">
<title id="t">EDS, patent pending</title>
<rect x="{h}" y="{h}" width="{W - LINE:.2f}" height="{H - LINE}" rx="{r - h}" fill="#fff" stroke="{TEAL}" stroke-width="{LINE}"/>
<path d="M{r} 0H{cell:.2f}V{H}H{r}A{r} {r} 0 0 1 0 {H - r}V{r}A{r} {r} 0 0 1 {r} 0Z" fill="{TEAL}"/>
<path fill="#fff" fill-rule="evenodd" d="{logo}"/>
<path fill="{INK}" d="{text}"/>
</svg>
"""
OUT.write_text(svg)
print(f"{OUT.relative_to(ROOT)}: {W:.0f} x {H}, {len(svg) // 1024} KB")
