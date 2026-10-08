#!/bin/sh
# Prepares every photograph on the site from the originals on the EDS Synology
# drive. Run from the project root after adding or changing a photo here:
#     sh tools/photos.sh
# Crops and patches are fractions of the image (see tools/photos.py).
set -e
D="${PHOTOS_SRC:-$HOME/Library/CloudStorage/SynologyDrive-EDS/EDS Portal/Website/Website Images}"
P() { python3 -I tools/photos.py "$@"; }
rm -f src/assets/img/photos/*
P "$D/Flo-Dar Manhole.jpg" sewer-av-meter --widths 1400,800 --quality 76
P "$D/20181120_110037.jpg" sewer-sensors-chamber --crop 0,0.15,1,0.82
P "$D/1912450_DSCN0167.jpg" sewer-pipe-downstream --patch 0.6,0.84,0.97,0.93:0.28,0.84 --widths 1400,800 --quality 78
P "$D/2642748_DSCN0464.jpg" sewer-manhole-bracket --widths 1400,800 --quality 78
P "$D/2071872_DSCN0313.jpg" site-crew-manhole --patch 0.58,0.85,0.98,0.93:above --widths 1400,800 --quality 74
P "$D/20190704_135352.jpg" telemetry-cabinet --crop 0.04,0,0.96,0.69 --widths 1100,700 --quality 78
P "$D/Toowoomba North St.jpg" telemetry-pole-solar --crop 0,0,1,0.81 --widths 1100,700 --quality 76
P "$D/20190507_132724.jpg" fire-training-pad --widths 1400,800 --quality 78
P "$D/20190930_095350.jpg" fire-training-fuselage
P "$D/2509417_DSCN0415.JPG" stormwater-culvert --crop 0,0,1,0.84 --widths 1400,800 --quality 76
P "$D/Inflow Infiltration/Inflow infiltration.jpeg" infiltration-joints
P "$D/Back Up/EDS/Services/5898804_orig.jpg" inflow-manhole-rain
P "$D/Back Up/Banner Images/city-sewer-backup.jpg" sewer-overflow-street --widths 1400,800 --quality 74
P "$D/Back Up/Banner Images/wastewaterpic.jpg" treatment-plant-clarifier --widths 1400,800 --quality 78
P "$D/Data Cloud/Wastewater1.jpeg" treatment-plant-aerial --widths 1600,900 --quality 78
P "$D/Dynaflox/doppler_2.jpg" clamp-on-ultrasonic
# Detectronic's drawing of the LIDoTT Alarm in place: not graded.
P "$D/Detectronics/lidott-alarm2-web.jpg" lidott-alarm-site --quality 86 --no-grade
chmod 644 src/assets/img/photos/*
