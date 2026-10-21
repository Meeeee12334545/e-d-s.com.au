#!/usr/bin/env python3
"""Check that the built site scrolls and hovers smoothly.

    node build.mjs
    python3 -I tools/perf_check.py [--pages index.html,about.html] [--dist dist] [--port 4793]

Serves dist/ itself and drives headless Chromium (Python Playwright, which on
this Mac renders on the real GPU) at 1440 x 900 and 2x. For each page it
scrolls to the bottom with Chrome's own wheel gesture at about 1400 px/s, with
the pointer parked mid-screen as a visitor's would be, and reports the frames
that took over 20 ms (a dropped frame at 60 Hz) and over 34 ms, the worst gap
and the scroll position it happened at. On the home page it also moves the
pointer onto the city, holds it, sweeps it across and takes it away, since
each of those once cost a run of 25 ms frames, and counts the compositor
layers (the home page should hold a few dozen, not a few hundred).

A page is fine when it drops no frames while scrolling and the city's hover
phases drop none or one; a single 30 ms frame is noise, and the first run
after the browser starts can show one 100 ms frame as the city first appears
(the GPU warming up), which a second run does not.
Run it before and after a change to the city or the stylesheet.
"""
import argparse, os, sys, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECORD = "window.__fr=[]; window.__rec=true; (function f(t){ if(!window.__rec) return; window.__fr.push([t, scrollY]); requestAnimationFrame(f); })(performance.now());"
STOP = "window.__rec=false; window.__fr"
FRAMES = "(ms) => new Promise(res => { const ts=[]; function f(t){ ts.push(t); if (t - ts[0] < ms) requestAnimationFrame(f); else res(ts); } requestAnimationFrame(f); })"


def serve(directory, port):
    class Quiet(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=directory, **k)

        def log_message(self, *a):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", port), Quiet)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def gaps(frames):
    return [(b[0] - a[0], a[1]) for a, b in zip(frames, frames[1:])]


def scroll_report(page, cdp):
    total = page.evaluate("document.documentElement.scrollHeight")
    page.evaluate(RECORD)
    cdp.send("Input.synthesizeScrollGesture", {"x": 720, "y": 450, "yDistance": -(total - 900), "speed": 1400, "gestureSourceType": "mouse"})
    page.wait_for_timeout(300)
    g = gaps(page.evaluate(STOP))
    worst = max(g, key=lambda x: x[0]) if g else (0, 0)
    return f"{len(g)} frames, over 20 ms: {sum(1 for d, _ in g if d > 20)}, over 34 ms: {sum(1 for d, _ in g if d > 34)}, worst {worst[0]:.0f} ms at y={worst[1]:.0f}"


def hover_report(page):
    box = page.evaluate("(() => { const r = document.querySelector('.city-stage').getBoundingClientRect(); return [r.left, r.top + scrollY, r.width, r.height]; })()")
    page.evaluate(f"window.scrollTo({{top: {int(box[1] - 150)}, behavior: 'instant'}})")
    page.mouse.move(1400, 20)
    page.wait_for_timeout(1500)
    cx, cy = box[0] + box[2] / 2, 150 + box[3] / 2

    def sweep():
        for i in range(30):
            page.mouse.move(cx - 200 + i * 13, cy - 60 + (i % 5) * 20)
            page.wait_for_timeout(16)

    out = []
    for name, act, ms in [("at rest", lambda: None, 1500), ("pointer enters", lambda: page.mouse.move(cx, cy), 1500), ("pointer sweeps", sweep, 600), ("pointer leaves", lambda: page.mouse.move(1400, 20), 1500)]:
        act()
        ts = page.evaluate(FRAMES, ms)
        iv = [b - a for a, b in zip(ts, ts[1:])]
        out.append(f"{name}: {len(iv)} frames, over 20 ms: {sum(1 for x in iv if x > 20)}, worst {max(iv):.0f} ms")
    return out


def layer_count(page, cdp):
    seen = {}
    cdp.on("LayerTree.layerTreeDidChange", lambda ev: seen.update({"layers": ev.get("layers") or []}))
    cdp.send("LayerTree.enable")
    page.evaluate("document.querySelector('.city-stage').scrollIntoView({block: 'center'})")
    page.wait_for_timeout(1500)
    layers = seen.get("layers", [])
    cdp.send("LayerTree.disable")
    return f"{len(layers)} compositor layers with the city in view, {sum(1 for l in layers if l.get('drawsContent'))} of them drawing"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dist", default=os.path.join(ROOT, "dist"))
    ap.add_argument("--port", type=int, default=4793)
    ap.add_argument("--pages", default="index.html,services/sewer-flow-monitoring.html,products/index.html,about.html,flowsense.html")
    args = ap.parse_args()
    if not os.path.isdir(args.dist):
        sys.exit("No dist/ to check: run node build.mjs first")
    server = serve(args.dist, args.port)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chromium")
        context = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2, reduced_motion="no-preference")
        page = context.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        cdp = context.new_cdp_session(page)
        for path in args.pages.split(","):
            page.goto(f"http://127.0.0.1:{args.port}/{path}", wait_until="load")
            page.wait_for_timeout(1500)
            print(f"{path}: scroll {scroll_report(page, cdp)}")
            if path == "index.html":
                for line in hover_report(page):
                    print(f"  city, {line}")
                print(f"  {layer_count(page, cdp)}")
        print("console errors:", "; ".join(errors) if errors else "none")
        browser.close()
    server.shutdown()


if __name__ == "__main__":
    main()
