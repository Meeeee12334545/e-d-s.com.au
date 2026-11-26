"""Photos and phone clips for a client project page (projects/*.html).

    python3 -I tools/project_media.py <out_dir> <name>=<source>[@cw|@ccw] ...

A photo (.jpg) is turned upright, rotated a further quarter turn when the
name ends @cw or @ccw, and written twice with no metadata: <name>.jpg at
1600 px on its long side for the full view, and <name>-sm.jpg at 800 px for
the page. A clip (.mp4) is cut to 720 x 1280 H.264 at 30 frames a second
with AAC sound, its location and other metadata dropped, an iPhone HDR clip
toned down to ordinary colour, and the moov atom up front so it starts
playing before it has all arrived; <name>.jpg beside it is its poster frame.

Needs Pillow and imageio-ffmpeg (pip install pillow imageio-ffmpeg).
"""

import os
import subprocess
import sys

import imageio_ffmpeg
from PIL import Image, ImageOps

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
TONEMAP = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,"


def photo(src, out, name, turn):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    if turn:
        im = im.rotate(-90 if turn == "cw" else 90, expand=True)
    for suffix, edge in (("", 1600), ("-sm", 800)):
        copy = im.copy()
        copy.thumbnail((edge, edge), Image.LANCZOS)
        copy.save(os.path.join(out, f"{name}{suffix}.jpg"), quality=82, optimize=True, progressive=True)


def clip(src, out, name, poster_at):
    probe = subprocess.run([FFMPEG, "-hide_banner", "-i", src], capture_output=True, text=True).stderr
    hdr = "arib-std-b67" in probe or "smpte2084" in probe
    portrait = "720x1280" in probe or "1080x1920" in probe
    size = "720:1280" if portrait else "1280:720"
    mp4 = os.path.join(out, f"{name}.mp4")
    subprocess.run([
        FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", src,
        "-map", "0:v:0", "-map", "0:a:0?", "-map_metadata", "-1", "-map_chapters", "-1",
        "-vf", f"{TONEMAP if hdr else ''}fps=30,scale={size},format=yuv420p",
        "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-maxrate", "2200k", "-bufsize", "4400k", "-profile:v", "high",
        "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", mp4,
    ], check=True)
    subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-ss", str(poster_at), "-i", mp4, "-frames:v", "1", "-q:v", "5", os.path.join(out, f"{name}.jpg")], check=True)


def main():
    out, jobs = sys.argv[1], sys.argv[2:]
    os.makedirs(out, exist_ok=True)
    for job in jobs:
        name, src = job.split("=", 1)
        turn = None
        if src.endswith(("@cw", "@ccw")):
            src, turn = src.rsplit("@", 1)
        poster_at = 3
        if "#" in name:
            name, poster_at = name.split("#")
        if os.path.splitext(name)[1] == ".mp4":
            clip(src, out, os.path.splitext(name)[0], float(poster_at))
        else:
            photo(src, out, os.path.splitext(name)[0], turn)
        print("wrote", name)


if __name__ == "__main__":
    main()
