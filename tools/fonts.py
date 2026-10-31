"""Make the site's display face from Saira (Omnibus-Type, OFL 1.1).

The headings are set in Saira at its semi-expanded width, the open-licence
face closest to Eurostile. The variable font from @fontsource-variable/saira
carries every width from condensed to expanded (99 KB); this pins the width
at 112.5 (semi-expanded) and keeps the weights from 400 up, so the file the
browser fetches is a third of the size. (Cutting the weights down to 700
leaves variation deltas out of range, and Firefox then drops them all.)

usage: python3 -I tools/fonts.py   (needs fontTools and brotli)
"""
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "node_modules/@fontsource-variable/saira/files/saira-latin-standard-normal.woff2"
OUT = ROOT / "src/assets/fonts/saira-semiexpanded-latin.woff2"

font = TTFont(SRC)
font = instancer.instantiateVariableFont(font, {"wdth": 112.5, "wght": (400, 900)})
font.flavor = "woff2"
OUT.parent.mkdir(parents=True, exist_ok=True)
font.save(OUT)
print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024} KB")
