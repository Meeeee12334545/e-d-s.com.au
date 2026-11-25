#!/usr/bin/env python3
"""Make the FlowSense screens for flowsense.html from the brochure screenshots.

    python3 -I tools/flowsense_screens.py <eds-data-platform>/docs/images

The FlowSense repository (eds-data-platform) keeps the screenshots its
brochures are built from in docs/images/brochure and docs/images/flagship,
photographed from the demonstration account, whose sites and readings are
synthetic. This script copies them out as
src/assets/img/flowsense/<name>-<w>x<h>.jpg with a WebP twin at each width,
so build.mjs can offer the browser a smaller one on a phone (`shot()`).
Nothing is graded: screens keep their own colours. Needs Pillow
(pip install pillow). Re-run it when the brochures are reissued with new
screenshots, then check the page, and the Pump Station Manager pins in
content.mjs especially.

The screens were last taken from the 25 November 2026 reissue (FlowSense
brochure 2.0, platform brochure 2.12).
"""
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src/assets/img/flowsense")

# source (folder/file under docs/images), name, widths to write, crop
# (keep the top of a long screen at this height to width ratio, or None)
SCREENS = [
    ("brochure/command-centre.png", "overview", (2240, 1200), None),
    ("brochure/mobile.png", "phone", (600, 320), None),
    ("brochure/network-map.png", "network-map", (1600, 800), None),
    ("brochure/fleet-health.png", "fleet-health", (1600, 800), None),
    ("flagship/alarms.png", "alarms", (1600, 800), None),
    ("brochure/site-detail.png", "site-page", (1600, 800), None),
    ("brochure/site-telemetry.png", "site-month", (1600, 800), None),
    ("brochure/blockage-watch.png", "blockage-watch", (1600, 800), None),
    ("brochure/blockage-verdict.png", "blockage-case", (1200, 600), None),
    ("brochure/ii-metrics.png", "ii-figures", (1600, 800), None),
    ("brochure/ii-hydrograph.png", "rdii-hydrograph", (1600, 800), None),
    ("brochure/scattergraph.png", "scattergraph", (1600, 800), None),
    ("brochure/diagnostics.png", "site-diagnostics", (1200, 600), None),
    ("brochure/heat-map.png", "heat-map", (2240, 1200), None),
    ("brochure/rtk-calibration.png", "rtk-calibration", (1600, 800), None),
    ("brochure/pump-stations.png", "psm", (2240, 1200), None),
    ("brochure/report-preview.png", "report", (1200, 600), 1.54),
    ("brochure/reports.png", "report-builder", (1600, 800), None),
    ("flagship/analytics.png", "flow-analytics", (1600, 800), None),
    ("flagship/forecast.png", "forecast", (1600, 800), None),
    ("flagship/psm-pumps.png", "pump-condition", (1600, 800), None),
    ("flagship/ask.png", "ask", (1600, 800), None),
]

if len(sys.argv) != 2:
    sys.exit(__doc__)
SRC = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))
for src, name, widths, crop in SCREENS:
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    if crop and im.height > im.width * crop:
        im = im.crop((0, 0, im.width, round(im.width * crop)))
    for w in sorted({min(w, im.width) for w in widths}, reverse=True):
        h = round(im.height * w / im.width)
        out = im.resize((w, h), Image.LANCZOS) if w != im.width else im
        base = os.path.join(OUT, f"{name}-{w}x{h}")
        out.save(base + ".jpg", quality=80, optimize=True, progressive=True)
        out.save(base + ".webp", quality=80, method=6)
        print(f"{name}-{w}x{h}: jpg {os.path.getsize(base + '.jpg') // 1024} KB, webp {os.path.getsize(base + '.webp') // 1024} KB")
