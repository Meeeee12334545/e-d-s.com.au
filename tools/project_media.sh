# The photos and clips on the client project pages, cut from the originals on
# the EDS Synology drive by tools/project_media.py. Run from the repository:
#   sh tools/project_media.sh
# with a Python that has Pillow and imageio-ffmpeg. A clip name may end
# #<seconds> to pick its poster frame.
set -e
PY=${PY:-python3}
SLR="$HOME/Library/CloudStorage/SynologyDrive-EDS/EDS Portal/Projects/SLR"

# SLR Consulting, Bridge Street sewer, Fortitude Valley: the site visit on 25 November 2026.
$PY -I tools/project_media.py src/assets/projects/slr \
  "bridge-1.mp4#4=$SLR/Bridge Street/FF31993F-45F7-4680-B454-EF44B191F95B.mov" \
  "bridge-2.mp4#6=$SLR/Bridge Street/46E9DCF4-CDA5-4F6D-A32F-0D0DB00E1A17.mov" \
  "bridge-down.jpg=$SLR/Bridge Street/FB794C6B-5540-440E-A43B-9605F441299D.JPG" \
  "bridge-sensor.jpg=$SLR/Bridge Street/58D434D3-32D7-44C9-BC29-013104C8B287.JPG" \
  "bridge-debris-removed.jpg=$SLR/Bridge Street/Bridge St Debris Removed.JPG" \
  "bridge-bolt-repairs.jpg=$SLR/Bridge Street/bolt repairs.JPG" \
  "bridge-mortar.jpg=$SLR/Bridge Street/0B6DAC94-5D48-4EA5-82B2-22BAFCFF9838.JPG@cw" \
  "wickham-1.mp4#3=$SLR/Whickham Removal/5C17DD10-A537-4F69-AD20-570F675693A5.mov" \
  "wickham-2.mp4#9=$SLR/Whickham Removal/ED9C9CF1-6AD3-42CF-9AE1-144ACA3FA66B.mov" \
  "wickham-debris-removed.jpg=$SLR/Whickham Removal/debris removed from side 150mm.JPG"
