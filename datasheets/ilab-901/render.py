#!/usr/bin/env python3
"""Print the iLab 901 datasheet to PDF.

    python3 datasheets/ilab-901/render.py [--check]

Writes src/assets/docs/eds-ilab-901-datasheet.pdf, the file the website
links to, at A4 with the backgrounds on. --check also reports how much room
each page has left above its footer (a negative figure means it overflows).
Needs Playwright (pip install playwright; playwright install chromium).
Run prep.py first if ./assets is missing.
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "datasheet.html")
OUT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "src/assets/docs/eds-ilab-901-datasheet.pdf")

SPARE = """() => [...document.querySelectorAll('.page')].map((p, i) => {
  const main = p.querySelector('.main'), limit = p.querySelector('.foot').getBoundingClientRect().top;
  let low = 0;
  for (const n of main.querySelectorAll('*')) { const r = n.getBoundingClientRect(); if (r.height) low = Math.max(low, r.bottom); }
  return { page: i + 1, spare_mm: +((limit - low) * 25.4 / 96).toFixed(1) };
})"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("file://" + SRC)
    page.evaluate("document.fonts.ready")
    page.wait_for_load_state("networkidle")
    broken = page.evaluate("[...document.images].filter(i => !i.naturalWidth).map(i => i.getAttribute('src'))")
    if broken:
        sys.exit(f"Missing images: {broken}")
    if "--check" in sys.argv:
        page.emulate_media(media="print")
        for row in page.evaluate(SPARE):
            print(f"page {row['page']}: {row['spare_mm']} mm spare" + ("  <-- overflows" if row["spare_mm"] < 0 else ""))
    page.pdf(path=OUT, format="A4", print_background=True, prefer_css_page_size=True,
             margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
    browser.close()
print(f"{os.path.basename(OUT)}: {os.path.getsize(OUT) // 1024} KB")
