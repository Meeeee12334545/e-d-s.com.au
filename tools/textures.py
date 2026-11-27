#!/usr/bin/env python3
"""Material textures for the drawings: soil, sawn concrete, formed concrete,
asphalt and pipe bedding gravel, each a square tile that repeats without a
seam.

    python3 -I tools/textures.py [--preview <png>]

Writes src/assets/img/tex/<name>.webp. The drawings in diagrams.mjs and
scene.mjs fill their cut faces with these through an SVG <pattern> (scene.mjs:
texDefs), so a section through the ground reads as earth, aggregate and
bitumen rather than a flat tint, while every edge, label and moving part stays
vector. Everything here is generated, from fixed seeds, so a rerun gives the
same files: noise is filtered white noise (its spectrum shaped in the Fourier
domain, which makes it wrap at the tile edge for free) and stones are drawn
with their copies across each edge.

Needs NumPy and Pillow (with WebP).
"""
import argparse, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "assets", "img", "tex")
N = 512


def noise(seed, beta=2.0, lo=1.0, hi=None, sx=1.0, sy=1.0, n=N):
    """Tileable noise with a 1/f^beta power spectrum between lo and hi cycles
    per tile, mean 0 and standard deviation 1. sx and sy stretch it: sx > 1
    makes features wider than they are tall."""
    rng = np.random.default_rng(seed)
    F = np.fft.fft2(rng.standard_normal((n, n)))
    fx = np.fft.fftfreq(n) * n
    f = np.sqrt((fx[None, :] * sx) ** 2 + (fx[:, None] * sy) ** 2)
    f[0, 0] = 1
    amp = f ** (-beta / 2)
    amp[f < lo] = 0
    if hi:
        amp[f > hi] *= np.exp(-((f[f > hi] - hi) / (0.35 * hi)) ** 2)
    r = np.real(np.fft.ifft2(F * amp))
    return (r - r.mean()) / (r.std() + 1e-9)


def mix(a, b, t):
    t = np.clip(t, 0, 1)[..., None]
    return np.asarray(a, float) * (1 - t) + np.asarray(b, float) * t


def shade(img, k):
    """Multiply the image by a per-pixel factor."""
    return img * k[..., None]


class Canvas:
    """A float RGB tile with stones painted across its wrapped edges."""

    def __init__(self, base):
        self.img = base.astype(float)
        self.n = base.shape[0]

    def blob(self, cx, cy, r, rng, sides=0, ar=1.0, rot=0.0, wob=0.18):
        """A stone outline as a radius function of angle: smooth and
        rounded, or angular (sides > 0) like crushed or sawn aggregate."""
        ks = np.arange(2, 7)
        amps = rng.uniform(0, wob, len(ks)) / ks ** 0.6
        phs = rng.uniform(0, 2 * np.pi, len(ks))
        corners = rng.uniform(0, 2 * np.pi, sides) if sides else None

        def radius(th):
            rr = 1 + sum(a * np.cos(k * th + p) for a, k, p in zip(amps, ks, phs))
            if sides:
                # pull toward a polygon through the corner angles
                c = np.sort(corners)
                d = np.min(np.abs(((th[..., None] - c[None, :]) + np.pi) % (2 * np.pi) - np.pi), axis=-1)
                rr = rr * (0.86 + 0.14 * np.cos(np.minimum(d * sides / 2, np.pi / 2)))
            return r * rr

        def frame(xx, yy):
            dx, dy = xx - cx, yy - cy
            c, s = np.cos(rot), np.sin(rot)
            u = (dx * c + dy * s) / ar
            v = -dx * s + dy * c
            th = np.arctan2(v, u)
            d = np.sqrt(u * u + v * v) / radius(th)
            return d

        return frame

    def patch(self, cx, cy, R):
        """Index arrays for a square around (cx, cy), wrapped, with the
        pixel coordinates unwrapped so distances are continuous."""
        n = self.n
        x0, x1 = int(np.floor(cx - R)), int(np.ceil(cx + R)) + 1
        y0, y1 = int(np.floor(cy - R)), int(np.ceil(cy + R)) + 1
        xs, ys = np.arange(x0, x1), np.arange(y0, y1)
        xx, yy = np.meshgrid(xs + 0.5, ys + 0.5)
        return (ys % n)[:, None], (xs % n)[None, :], xx, yy

    def stone(self, cx, cy, r, color, rng, *, dome=True, sides=0, ar=1.0, rot=0.0,
              shadow=0.35, rim=0.0, grain=0.06, light=(-0.55, -0.75, 0.62), spec=0.12):
        frame = self.blob(cx, cy, r, rng, sides, ar, rot)
        R = r * ar * 1.45 + 4
        iy, ix, xx, yy = self.patch(cx, cy, R)
        d = frame(xx, yy)
        img = self.img
        # a soft contact shadow, down and to the right of the stone
        if shadow:
            ds = frame(xx - r * 0.18, yy - r * 0.28)
            sh = np.clip(1.25 - ds, 0, 1) ** 1.6 * shadow
            img[iy, ix] = shade(img[iy, ix], 1 - sh * (d > 0.98))
        inside = d < 1
        if not inside.any():
            return
        col = np.asarray(color, float)
        g = 1 + grain * rng.standard_normal(d.shape)
        if dome:
            # light it as a low dome: the normal leans out with distance from
            # the centre, along the direction from the centre
            h = np.sqrt(np.clip(1 - d ** 2, 0, 1))
            dx, dy = xx - cx, yy - cy
            l = np.sqrt(dx * dx + dy * dy) + 1e-6
            nx, ny = dx / l * (1 - h), dy / l * (1 - h)
            nz = h + 0.35
            nl = np.sqrt(nx * nx + ny * ny + nz * nz)
            L = np.asarray(light) / np.linalg.norm(light)
            lam = np.clip((nx * L[0] + ny * L[1] + nz * L[2]) / nl, 0, 1)
            k = 0.5 + 0.62 * lam
            px = col * (k * g)[..., None] + 255 * spec * (lam ** 18)[..., None]
        else:
            px = col * g[..., None]
        if rim:
            edge = np.clip((d - (1 - 0.16)) / 0.16, 0, 1)
            px = shade(px, 1 - rim * edge)
        # anti-aliased edge
        a = np.clip((1 - d) * r * 0.9, 0, 1)[..., None]
        img[iy, ix] = img[iy, ix] * (1 - a) + px * a


def finish(img):
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")


# ---------------------------------------------------------------- soil
def soil():
    """A cut face through firm sandy clay: two browns mottled together, faint
    horizontal bedding, sand grains, and pebbles with their contact shadows."""
    rng = np.random.default_rng(11)
    lowf = noise(1, beta=3.2, lo=1.5, hi=14)
    bed = noise(2, beta=2.6, lo=2, hi=40, sx=0.18, sy=1.0)  # wide, thin bands
    mid = noise(3, beta=2.0, lo=8, hi=70)
    fine = noise(4, beta=0.6, lo=90)
    t = 0.5 + 0.2 * lowf + 0.12 * bed
    base = mix((176, 146, 111), (139, 108, 79), t)
    base = shade(base, 1 + 0.05 * mid + 0.075 * fine)
    # sand: scattered light and dark grains
    sp = rng.random((N, N))
    base[sp > 0.9935] = base[sp > 0.9935] * 0.6 + np.array([226, 214, 192]) * 0.4
    base[sp < 0.006] *= 0.72
    c = Canvas(base)
    pal = [(150, 141, 128), (121, 113, 104), (168, 150, 120), (138, 112, 84),
           (182, 172, 156), (98, 92, 86), (160, 128, 92)]
    for _ in range(120):
        r = rng.uniform(1.6, 4.6)
        c.stone(rng.uniform(0, N), rng.uniform(0, N), r, pal[rng.integers(len(pal))], rng,
                ar=rng.uniform(0.75, 1.35), rot=rng.uniform(0, np.pi), shadow=0.32)
    for _ in range(22):
        r = rng.uniform(5.5, 10.5)
        c.stone(rng.uniform(0, N), rng.uniform(0, N), r, pal[rng.integers(len(pal))], rng,
                ar=rng.uniform(0.7, 1.4), rot=rng.uniform(0, np.pi), shadow=0.42, sides=rng.choice([0, 0, 6]))
    return finish(c.img)


# ---------------------------------------------------------------- concrete (sawn)
def concrete():
    """Concrete cut through, as a sawn section shows it: grey paste with sand
    grains, sliced aggregate of several rock colours with a darker skin, and
    small air voids."""
    rng = np.random.default_rng(21)
    lowf = noise(5, beta=2.6, lo=1.5, hi=20)
    fine = noise(6, beta=0.5, lo=80)
    base = np.ones((N, N, 3)) * np.array([191, 189, 183], float)
    base = shade(base, 1 + 0.02 * lowf + 0.07 * fine)
    sp = rng.random((N, N))
    base[sp > 0.985] = base[sp > 0.985] * 0.55 + np.array([214, 208, 196]) * 0.45
    base[sp < 0.012] *= 0.84
    c = Canvas(base)
    pal = [(156, 154, 150), (128, 127, 125), (176, 170, 160), (199, 190, 174),
           (142, 130, 114), (108, 108, 112), (168, 160, 150), (186, 176, 160)]
    for _ in range(430):
        r = rng.uniform(2.6, 7.5)
        c.stone(rng.uniform(0, N), rng.uniform(0, N), r, pal[rng.integers(len(pal))], rng,
                dome=False, sides=rng.integers(5, 9), ar=rng.uniform(0.6, 1.5), rot=rng.uniform(0, np.pi),
                shadow=0.0, rim=0.22, grain=0.05)
    for _ in range(110):
        r = rng.uniform(8, 16)
        c.stone(rng.uniform(0, N), rng.uniform(0, N), r, pal[rng.integers(len(pal))], rng,
                dome=False, sides=rng.integers(5, 8), ar=rng.uniform(0.6, 1.45), rot=rng.uniform(0, np.pi),
                shadow=0.0, rim=0.25, grain=0.06)
    img = c.img
    # air voids: small dark pits with a lit lower lip
    for _ in range(170):
        cx, cy, r = rng.uniform(0, N), rng.uniform(0, N), rng.uniform(0.6, 1.9)
        iy, ix, xx, yy = c.patch(cx, cy, r + 2)
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
        a = np.clip(1.2 - d, 0, 1)[..., None]
        lip = np.clip(1 - np.abs(d - 1.15) * 3, 0, 1) * ((yy - cy) > 0)
        img[iy, ix] = img[iy, ix] * (1 - a * 0.55) + img[iy, ix] * lip[..., None] * 0.12
    return finish(img)


# ---------------------------------------------------------------- concrete (formed)
def wall():
    """The inside face of precast concrete, as the form left it: smooth
    grey with soft mottling, the ghost of aggregate under the skin and
    small bug holes."""
    rng = np.random.default_rng(31)
    lowf = noise(7, beta=3.0, lo=1.5, hi=12)
    mid = noise(8, beta=2.2, lo=6, hi=60)
    fine = noise(9, beta=0.7, lo=100)
    base = np.ones((N, N, 3)) * np.array([178, 177, 171], float)
    base = shade(base, 1 + 0.045 * lowf + 0.03 * mid + 0.028 * fine)
    c = Canvas(base)
    for _ in range(60):
        r = rng.uniform(4, 12)
        tone = rng.uniform(0.965, 1.03)
        col = np.array([178, 177, 171]) * tone
        c.stone(rng.uniform(0, N), rng.uniform(0, N), r, col, rng, dome=False, shadow=0, grain=0.01,
                sides=rng.integers(5, 8), ar=rng.uniform(0.6, 1.4), rot=rng.uniform(0, np.pi))
    img = c.img
    for _ in range(240):
        cx, cy, r = rng.uniform(0, N), rng.uniform(0, N), rng.uniform(0.5, 2.2)
        iy, ix, xx, yy = c.patch(cx, cy, r + 2)
        d = np.sqrt((xx - cx) ** 2 + ((yy - cy) * 1.15) ** 2) / r
        a = np.clip(1.15 - d, 0, 1)[..., None]
        img[iy, ix] = img[iy, ix] * (1 - a * 0.38)
    return finish(img)


# ---------------------------------------------------------------- asphalt
def asphalt():
    """Dense graded asphalt: near black binder, a stone mix showing through,
    and the fines between."""
    rng = np.random.default_rng(41)
    lowf = noise(10, beta=2.6, lo=1.5, hi=16)
    fine = noise(11, beta=0.4, lo=60)
    base = np.ones((N, N, 3)) * np.array([58, 58, 60], float)
    base = shade(base, 1 + 0.05 * lowf + 0.18 * fine)
    c = Canvas(base)
    pal = [(118, 116, 112), (96, 95, 94), (140, 136, 128), (84, 83, 84), (156, 150, 140)]
    for _ in range(1100):
        r = rng.uniform(1.2, 4.6)
        c.stone(rng.uniform(0, N), rng.uniform(0, N), r, pal[rng.integers(len(pal))], rng,
                sides=rng.integers(4, 7), ar=rng.uniform(0.7, 1.4), rot=rng.uniform(0, np.pi),
                shadow=0.4, spec=0.05)
    return finish(c.img)


# ---------------------------------------------------------------- bedding gravel
def gravel():
    """Pipe bedding: 10 to 20 mm aggregate packed in, rounded and crushed
    stones in greys and browns over dark voids."""
    rng = np.random.default_rng(51)
    base = np.ones((N, N, 3)) * np.array([84, 78, 70], float)
    base = shade(base, 1 + 0.12 * noise(12, beta=1.2, lo=20))
    c = Canvas(base)
    pal = [(158, 152, 142), (134, 128, 120), (176, 166, 148), (120, 112, 102),
           (150, 136, 116), (190, 184, 172), (108, 106, 104)]
    # big first, then smaller ones fill the gaps
    for rmin, rmax, k in ((8, 13, 380), (5, 8, 600), (2.5, 5, 700)):
        for _ in range(k):
            c.stone(rng.uniform(0, N), rng.uniform(0, N), rng.uniform(rmin, rmax), pal[rng.integers(len(pal))], rng,
                    sides=rng.choice([0, 0, 5, 6]), ar=rng.uniform(0.7, 1.35), rot=rng.uniform(0, np.pi),
                    shadow=0.5, spec=0.1)
    return finish(c.img)


TEXTURES = {"soil": (soil, 74), "concrete": (concrete, 74), "wall": (wall, 72), "asphalt": (asphalt, 70), "gravel": (gravel, 72)}


# ---------------------------------------------------------------- city overlays
# The home-page city lays these over its flat ground colours (city-scene.js),
# skewed onto the iso grid, so they are RGBA: a light or dark tint whose alpha
# follows how far each texel strays from the mean. The ground keeps its own
# colour (and its lift on a picked district); the tile only breaks it up.
def overlay(v, light, dark, k):
    """v: signed field. Positive texels tint toward light, negative toward
    dark, alpha k * |v|."""
    v = np.clip(v, -3, 3)
    rgb = np.where(v[..., None] > 0, np.asarray(light, float), np.asarray(dark, float))
    a = np.clip(np.abs(v) * k, 0, 1) * 255
    return Image.fromarray(np.dstack([rgb, a]).astype(np.uint8), "RGBA")


def city_grass():
    """Mown grass seen from a few hundred metres: dry and lush patches, mower
    stripes worn faint, clumps, and a fine grain."""
    n = 224
    patches = noise(61, beta=3.4, lo=1, hi=6, n=n)
    clumps = noise(62, beta=2.0, lo=6, hi=40, n=n)
    grain = noise(63, beta=0.5, lo=60, n=n)
    v = 0.75 * patches + 0.45 * clumps + 0.4 * grain
    # dry patches go straw coloured rather than just lighter
    v = (v - v.mean()) / v.std()
    return overlay(v, (214, 206, 140), (10, 30, 12), 0.3)


def city_grain():
    """Weathering for paving, hardstand and yards: stains, tyre-darkened
    patches and pale flecks."""
    n = 224
    rng = np.random.default_rng(64)
    stains = noise(65, beta=3.0, lo=1, hi=8, n=n)
    mid = noise(66, beta=1.8, lo=8, hi=60, n=n)
    fine = noise(67, beta=0.3, lo=80, n=n)
    v = 0.7 * stains + 0.4 * mid + 0.5 * fine
    v = (v - v.mean()) / v.std()
    fl = rng.random((n, n))
    v[fl > 0.995] = 2.6
    v[fl < 0.004] = -2.6
    return overlay(v, (235, 232, 222), (8, 12, 14), 0.17)


TEXTURES["city-grass"] = (city_grass, 80)
TEXTURES["city-grain"] = (city_grain, 80)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", help="also write a 2 x 2 tiled sheet of every texture here")
    ap.add_argument("only", nargs="*")
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    sheets = []
    for name, (fn, q) in TEXTURES.items():
        if a.only and name not in a.only:
            continue
        im = fn()
        path = os.path.join(OUT, f"{name}.webp")
        im.save(path, "WEBP", quality=q, method=6)
        print(f"{name}: {os.path.getsize(path) // 1024} KB")
        sheets.append(im.convert("RGB").resize((N, N)) if im.size[0] != N or im.mode != "RGB" else im)
    if a.preview and sheets:
        sheet = Image.new("RGB", (N * 2 * len(sheets), N * 2))
        for i, im in enumerate(sheets):
            for dx in (0, 1):
                for dy in (0, 1):
                    sheet.paste(im, (i * 2 * N + dx * N, dy * N))
        sheet.save(a.preview)


if __name__ == "__main__":
    main()
