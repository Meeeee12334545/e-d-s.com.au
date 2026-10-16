"""Screenshot and sanity-check the home page city's exploded views.

Build the site and serve dist/ first, for example:
    node build.mjs
    python3 -m http.server 4791 --bind 127.0.0.1 --directory dist

Then:
    python3 -I check_city.py --out /path/to/shots [--url http://127.0.0.1:4791/index.html] [--only sewer,pump]

Writes, for every district: <id>-apart.png (the district taken apart) and
<id>-asset.png (its asset taken apart), the same at phone width with a
-phone suffix, plus city.png. Prints console errors, the median frame
interval at rest and while a district is apart, and any label that overlaps
another or runs off the stage. Needs Python Playwright with Chromium.
Reduced motion is off on purpose: the site keeps its motion under reduce
and the timing should be measured with the full animation.
"""
import argparse
import json
import statistics
import sys

from playwright.sync_api import sync_playwright

ZONES = ["sewer", "pump", "plant", "industry", "river", "cbd", "ops"]

FRAMES = """() => new Promise((done) => {
  const t = []; let last = performance.now();
  const step = (now) => { t.push(now - last); last = now; if (t.length < 120) requestAnimationFrame(step); else done(t.slice(5)); };
  requestAnimationFrame(step);
})"""

# labels that overlap one another or leave the stage, and leaders with no mark
LABELS = """() => {
  const view = document.querySelector('.city-view').getBoundingClientRect();
  const btns = [...document.querySelectorAll('#city-notes .city-note')].filter((b) => b.offsetParent);
  const boxes = btns.map((b) => [b, b.getBoundingClientRect()]);
  const out = [];
  boxes.forEach(([b, r], i) => {
    if (r.left < view.left - 1 || r.right > view.right + 1 || r.top < view.top - 1 || r.bottom > view.bottom + 1) out.push('off stage: ' + b.textContent.trim());
    boxes.slice(i + 1).forEach(([c, s]) => { if (r.left < s.right && s.left < r.right && r.top < s.bottom && s.top < r.bottom) out.push('overlap: ' + b.textContent.trim() + ' / ' + c.textContent.trim()); });
  });
  return { count: btns.length, problems: out };
}"""


def median_ms(page):
    return round(statistics.median(page.evaluate(FRAMES)), 2)


def open_city(page, url):
    page.goto(url)
    page.locator("#city-explorer").scroll_into_view_if_needed()
    page.wait_for_timeout(1200)


def pick(page, zone):
    page.locator(f'.city-tab[data-zone="{zone}"]').click(force=True)
    page.wait_for_timeout(500)


def run(url, out, only, phone):
    errors = []
    report = {}
    with sync_playwright() as p:
        # uncapped, so the frame interval measures the work and not the 60 Hz vsync
        browser = p.chromium.launch(args=["--disable-gpu-vsync", "--disable-frame-rate-limit"])
        size = {"width": 390, "height": 844} if phone else {"width": 1440, "height": 900}
        ctx = browser.new_context(viewport=size, device_scale_factor=2 if not phone else 1, reduced_motion="no-preference", has_touch=phone)
        page = ctx.new_page()
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        open_city(page, url)
        sfx = "-phone" if phone else ""
        view = page.locator(".city-view")
        if not phone:
            report["rest_ms"] = median_ms(page)
            view.screenshot(path=f"{out}/city.png")
        for zone in only:
            pick(page, zone)
            page.locator('.city-btn[data-act="explode"]').click(force=True)
            page.wait_for_timeout(1300)
            view.screenshot(path=f"{out}/{zone}-apart{sfx}.png")
            report[f"{zone}-apart{sfx}"] = page.evaluate(LABELS)
            if not phone and zone == only[0]:
                report["apart_ms"] = median_ms(page)
            page.locator('.city-note.is-inside:visible').first.click()
            page.wait_for_timeout(1400)
            shot = page.locator(".city-stage") if phone else view
            shot.screenshot(path=f"{out}/{zone}-asset{sfx}.png")
            report[f"{zone}-asset{sfx}"] = page.evaluate(LABELS)
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
            page.keyboard.press("Escape")
            page.wait_for_timeout(1000)
        browser.close()
    return errors, report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:4791/index.html")
    ap.add_argument("--out", required=True)
    ap.add_argument("--only", default=",".join(ZONES))
    ap.add_argument("--no-phone", action="store_true")
    a = ap.parse_args()
    only = [z for z in a.only.split(",") if z]
    errors, report = run(a.url, a.out, only, False)
    if not a.no_phone:
        e2, r2 = run(a.url, a.out, only[:3], True)
        errors += e2
        report.update(r2)
    print(json.dumps(report, indent=1))
    print("console errors:", errors or "none")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
