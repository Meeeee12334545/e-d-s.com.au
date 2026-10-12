"""Client logos for the home page, on a transparent background.

The logos arrive as JPEGs or PNGs on white (or off-white) backgrounds. On the
pale band they sit on, the white shows as a box around each one, so this
removes the background colour instead: every pixel becomes the logo colour
with the background taken out as transparency (the "colour to alpha" method),
which keeps antialiased edges smooth. Empty margins are trimmed so the logos
come out at an even size.

    python3 tools/logos.py src/assets/img/client-downer.jpg [...]

writes src/assets/img/client-downer.png (and so on) beside each input. The
background colour is read from the image's border, so it handles grey
backgrounds, and ones that shade to white, as well as plain white. Run it on
the original files, not on its own output. Needs Pillow.
"""
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

NOISE = 6  # channel difference treated as background (JPEG noise)
PAD = 4    # transparent pixels left round the trimmed logo


def background(im):
    w, h = im.size
    px = im.load()
    border = [px[x, y][:3] for x in range(w) for y in (0, h - 1)] + [px[x, y][:3] for y in range(h) for x in (0, w - 1)]
    return Counter(border).most_common(1)[0][0]


def colour_to_alpha(im, bg):
    out = Image.new("RGBA", im.size)
    src, dst = im.load(), out.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a0 = src[x, y]
            c = (r, g, b)
            # How much darker each channel is than the background, as a share
            # of how much darker it could be: the largest is the pixel's
            # opacity. Logos are darker than their background, so anything
            # lighter (a background that shades to white) counts as background.
            alpha = 0.0
            for v, k in zip(c, bg):
                if v < k:
                    alpha = max(alpha, (k - v) / k)
            if max(k - v for v, k in zip(c, bg)) <= NOISE:
                alpha = 0.0
            if alpha <= 0:
                dst[x, y] = (0, 0, 0, 0)
                continue
            rgb = tuple(max(0, min(255, round(k - (k - v) / alpha))) if v < k else k for v, k in zip(c, bg))
            dst[x, y] = (*rgb, round(alpha * a0))
    return out


def main(paths):
    for p in map(Path, paths):
        im = Image.open(p).convert("RGBA")
        bg = background(im)
        out = colour_to_alpha(im, bg)
        box = out.getbbox()
        if box:
            l, t, r, b = box
            out = out.crop((max(0, l - PAD), max(0, t - PAD), min(out.width, r + PAD), min(out.height, b + PAD)))
        dest = p.with_suffix(".png")
        out.save(dest, optimize=True)
        print(f"{p.name} -> {dest.name}  background {bg}  {out.width}x{out.height}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
