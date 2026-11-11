#!/usr/bin/env python3
"""Prepare the narrated FlowSense tour for flowsense.html.

    python3 -I tools/flowsense_video.py /path/to/FlowSense-Platform-Overview.mp4

The film EDS supplies is 1080p with its narration, a caption track and a
chapter for each screen. This script writes what the page needs:

    src/assets/video/flowsense-tour.mp4          the film, re-encoded smaller
    src/assets/video/flowsense-tour.vtt          its captions, as WebVTT
    src/assets/video/flowsense-tour-poster.jpg   the title card, shown before play
    src/data/flowsense-tour.json                 length, size and chapters

The picture stays 1080p, since the screens in it carry small type; the
saving comes from a slower encode and plainer audio (the sound is one voice).
The film must stay under 100 MB, the largest file GitHub will take. Needs
ffmpeg: on the PATH, named by FFMPEG, or from `pip install imageio-ffmpeg`.
Re-run it when a new cut of the film arrives, then check the chapter list on
the page against the film.
"""
import json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src/assets/video")
NAME = "flowsense-tour"
POSTER_AT = 3  # seconds in: the title card, once it has faded up


def ffmpeg():
    exe = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if not exe:
        try:
            import imageio_ffmpeg
            exe = imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            sys.exit("No ffmpeg found: install it, set FFMPEG, or pip install imageio-ffmpeg")
    return exe


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True)


def main(src):
    ff = ffmpeg()
    os.makedirs(OUT, exist_ok=True)
    film, captions, poster = (os.path.join(OUT, NAME + ext) for ext in (".mp4", ".vtt", "-poster.jpg"))

    # A keyframe every three seconds, so a jump to a chapter lands quickly.
    run(ff, "-v", "error", "-y", "-i", src, "-map", "0:v:0", "-map", "0:a:0", "-map_chapters", "-1", "-map_metadata", "-1",
        "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p", "-g", "90",
        "-c:a", "aac", "-b:a", "96k", "-ac", "2", "-movflags", "+faststart", film)
    run(ff, "-v", "error", "-y", "-i", src, "-map", "0:s:0", captions)
    run(ff, "-v", "error", "-y", "-ss", str(POSTER_AT), "-i", src, "-frames:v", "1", "-vf", "scale=1600:-2", "-q:v", "4", poster)

    meta = run(ff, "-v", "error", "-i", src, "-f", "ffmetadata", "-").stdout
    chapters = []
    for block in meta.split("[CHAPTER]")[1:]:
        f = dict(line.split("=", 1) for line in block.strip().splitlines() if "=" in line)
        num, den = map(int, f["TIMEBASE"].split("/"))
        chapters.append({"t": round(int(f["START"]) * num / den, 2), "title": f["title"]})
    info = subprocess.run([ff, "-hide_banner", "-i", film], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", info).groups()
    w, ht = re.search(r"Video:.*?(\d{3,5})x(\d{3,5})", info).groups()
    data = {"duration": round(int(h) * 3600 + int(m) * 60 + float(s)), "width": int(w), "height": int(ht), "chapters": chapters}
    with open(os.path.join(ROOT, "src/data", NAME + ".json"), "w") as out:
        json.dump(data, out, indent=2)
        out.write("\n")

    mb = os.path.getsize(film) / 1048576
    print(f"{NAME}.mp4: {mb:.1f} MB, {data['duration']} s, {w}x{ht}, {len(chapters)} chapters")
    if mb >= 100:
        sys.exit("The film is over 100 MB, which GitHub will refuse: raise -crf and run again")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
