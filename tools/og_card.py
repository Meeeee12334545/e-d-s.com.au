"""Draw og-card.jpg, the 1200 x 630 picture shown when a page is shared,
in the site's own colours and type: a daylight ground with teal currents,
the colour logo, the headline in Saira. Needs Python Playwright and a build
in dist/ (it borrows the fonts and logo from there).

usage: python3 -I tools/og_card.py
"""
import asyncio
import math
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
OUT = ROOT / "src/assets/img/og-card.jpg"


def currents():
    # streamlines like the hero's flow field, gathered on the right
    paths = []
    for i in range(46):
        y0 = 40 + i * 13.5
        amp = 10 + (i % 7) * 3
        phase = i * 0.55
        pts = []
        for x in range(380, 1230, 10):
            k = (x - 380) / 850
            y = y0 + math.sin(x * 0.006 + phase) * amp + math.cos(x * 0.0021 - phase * 0.6) * amp * 0.8 - k * 40
            pts.append(f"{x},{y:.1f}")
        colour = ["61,153,145", "14,143,132", "30,150,210"][i % 3]
        alpha = 0.1 + 0.22 * ((i * 37) % 11) / 10
        dash = ' stroke-dasharray="2 7"' if i % 5 == 0 else ""
        paths.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="rgba({colour},{alpha:.2f})" stroke-width="1.3" stroke-linecap="round"{dash}/>')
    return "".join(paths)


HTML = f"""<!doctype html><html><head><style>
@font-face {{ font-family: "EDS Display"; src: url("{(DIST / 'assets/fonts/saira-semiexpanded-latin.woff2').as_uri()}"); font-weight: 400 700; }}
@font-face {{ font-family: "EDS Text"; font-weight: 300; src: local("HelveticaNeue-Light"), url("{(DIST / 'assets/fonts/aileron-latin-400-normal.woff2').as_uri()}"); }}
@font-face {{ font-family: "EDS Text"; font-weight: 500; src: local("HelveticaNeue-Medium"), url("{(DIST / 'assets/fonts/aileron-latin-600-normal.woff2').as_uri()}"); }}
html, body {{ margin: 0; }}
.card {{ position: relative; width: 1200px; height: 630px; overflow: hidden; color: #0f2b2a;
  background: radial-gradient(70% 90% at 95% 0%, rgba(61,153,145,.24), rgba(61,153,145,0) 62%),
    radial-gradient(60% 80% at 0% 100%, rgba(56,189,248,.1), rgba(56,189,248,0) 60%),
    linear-gradient(180deg, #eef7f5 0%, #f6fbfa 60%, #fff 100%); }}
svg {{ position: absolute; inset: 0; }}
.veil {{ position: absolute; inset: 0; background: radial-gradient(70% 80% at 18% 52%, rgba(246,251,250,.95), rgba(246,251,250,.6) 55%, rgba(246,251,250,0)); }}
.logo {{ position: absolute; left: 72px; top: 64px; height: 50px; }}
.kicker {{ position: absolute; left: 72px; top: 150px; display: flex; align-items: center; gap: 14px; font: 500 25px "EDS Text", "Helvetica Neue", sans-serif; color: #095f57; }}
.kicker::before {{ content: ""; width: 32px; height: 3px; border-radius: 2px; background: #3d9991; }}
h1 {{ position: absolute; left: 68px; top: 222px; margin: 0; font: 520 116px/1.0 "EDS Display", sans-serif; letter-spacing: -.02em; }}
.foot {{ position: absolute; left: 72px; right: 72px; bottom: 54px; display: flex; justify-content: space-between; align-items: baseline;
  padding-top: 24px; border-top: 2px solid #3d9991; font: 300 26px "EDS Text", "Helvetica Neue", sans-serif; color: #2e4543; }}
.foot b {{ font: 560 28px "EDS Display", sans-serif; color: #0d7c72; }}
</style></head><body><div class="card">
<svg width="1200" height="630" viewBox="0 0 1200 630">{currents()}</svg>
<div class="veil"></div>
<img class="logo" src="{(DIST / 'assets/img/eds-logo-colour.png').as_uri()}" alt="">
<p class="kicker">Water, wastewater, trade waste and environment</p>
<h1>Every drop,<br>measured.</h1>
<p class="foot"><span>Monitoring Australia's water, wastewater and environment since 1991.</span><b>1300 721 683</b></p>
</div></body></html>"""


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1200, "height": 630})
        tmp = ROOT / "dist/og-card-source.html"
        tmp.write_text(HTML)
        await page.goto(tmp.as_uri())
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(300)
        await page.locator(".card").screenshot(path=str(OUT), type="jpeg", quality=90)
        tmp.unlink()
        await browser.close()
    print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024} KB")


asyncio.run(main())
