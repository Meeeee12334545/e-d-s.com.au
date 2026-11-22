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
# from the newsletter pictures, cropped clear of the hire ute beside the crew
P "$D/../../Pictures/Newsletters/IMG_2942 2.jpeg" crew-confined-space --crop 0.35,0.255,1,0.835 --widths 1400,800 --quality 68
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
P "$D/Data Cloud/Wastewater1.jpeg" treatment-plant-aerial --crop 0.2,0,0.6736,1 --widths 900,600 --quality 80
P "$D/Dynaflox/doppler_2.jpg" clamp-on-ultrasonic
# EDS's own install and site photos from the project folders (November 2026):
# no site names, asset numbers or number plates left in frame
T="$D/../../Projects/Toowoomba"
P "$D/../../Pictures/EDS Meadowbrook.JPG" head-office --fill 0.6225,0.6478,0.6875,0.6748 --patch 0.035,0.604,0.1,0.638:above --crop 0,0.25,1,0.74 --widths 1400,800 --quality 74
P "$D/../../Pictures/7B737A4B-0A8D-4AF0-826F-A7FE8DF0930E.JPG" crew-manhole-harness --crop 0,0.22,1,0.78 --widths 1400,800 --quality 74
P "$D/../../Pictures/E9CE22CD-1CBF-48AF-BBA3-D626BB2F5D29.JPG" manhole-shaft-deep --crop 0,0.12,1,0.84 --widths 1200,700 --quality 74
P "$T/2024 Calibrations/Site Pictures/brook st.JPG" flodar-manhole --crop 0,0.3,1,0.86 --widths 1400,800 --quality 74
P "$T/Pittsworth MSFM June 2024/MSFM Install - Incoming Line - Grand St Pittsworth 7-6-24.jpeg" msfm-sensor-flow --widths 1400,800 --quality 74
P "$T/James Street/Alderely St East West & Central Install/Alderely St Central.jpeg" flo-station-cabinet --crop 0,0.16,1,0.7 --widths 1400,800 --quality 76
P "$T/Cranley Install/1FB136CA-5E27-4575-ACB1-C63CB3F1DFCA.JPG" site-cabinet-gazebo --crop 0.08,0.18,0.92,0.7 --widths 1400,800 --quality 76
P "$T/10-10-23/Alderley Street East Pole.jpg" crew-solar-pole --crop 0,0.3,1,0.98 --widths 1400,800 --quality 76
P "$T/2026 January Prescott & Goggs Upgrade - Relocation/Install Pictures/35EBC69E-7CC3-429B-826D-D7E16BBF8C47.JPG" pipe-sensor-cable --widths 1400,800 --quality 74
P "$T/E-Flow Upgrades Prescott & Goggs - Black Gully Upgrade/pg 1.JPG" crew-van-roadside --crop 0,0.545,1,1 --widths 1400,800 --quality 74
# From the makers EDS distributes for, off their own websites (November 2026,
# at EDS's request), kept under Makers/<maker>; captions credit the maker
P "$D/Makers/Detectronic/about-products.jpg" lidott-sensor-chamber --widths 1400,800 --quality 76
P "$D/Makers/Detectronic/Media-14.jpg" lidott-alarm-culvert --crop 0,0.17,1,0.71 --widths 1200,800 --quality 70
P "$D/Makers/Beadedstream/2.jpg" temperature-string-river --crop 0,0.28,1,0.84 --widths 1200,700 --quality 64
P "$D/Makers/Beadedstream/homepage-image.jpg" d605-logger-post --crop 0.2,0,0.9,1 --widths 1400,800 --quality 76
P "$D/Makers/Beadedstream/beadedstream-probe.jpg" temperature-probe-beads --widths 1400,800 --quality 76
P "$D/Makers/Beadedstream/1.jpg" temperature-string-install --crop 0,0.25,1,0.81 --widths 1200,700 --quality 64
P "$D/Makers/Aquamonitrix/EPA_Mooreapark-article-image.jpg" nitrate-analyser-river --widths 1200,700 --quality 64
P "$D/Makers/Aquamonitrix/Photograph-of-Aquamonitrix-nitrite-and-nitrate-WEXFORD.png" nitrate-analyser-kiosk --widths 1020,700 --quality 80
P "$D/Makers/ORI/AquaSamp-Mini-manhole.jpg" ori-sampler-manhole --crop 0,0.1,1,0.96 --widths 800 --quality 80
P "$D/Makers/ORI/Sampling-Methode.jpg" ori-display-manhole --crop 0,0.04,1,0.84 --widths 1200,700 --quality 76
P "$D/Makers/Hach/ASPCXXXC121XX_Sampler-Portable-AS950-Operator-Center_Section_Lift-Canal-AO_V2.jpg" sampler-open-channel --crop 0,0.21,1,0.94 --widths 1400,800 --quality 74
P "$D/Makers/Hach/LFV00199A4NXH_Controller-FL1500-Operator-USB_Insert2-AW_V2_1.jpg" fl1500-logger-post --crop 0,0.2,0.68,0.9 --widths 1400,800 --quality 74
P "$D/Makers/Hach/FH950_Meter-Flow-Drop3-AO_V2.jpg" velocity-check-manhole --crop 0,0.37,1,0.96 --widths 1400,800 --quality 74
# Stock (Pexels, free to use), only where neither EDS nor a maker has a photo
P "$D/Stock/pexels-31670392.jpg" concrete-structure-water --widths 1400,800 --quality 76
# Detectronic's drawing of the LIDoTT Alarm in place: not graded.
P "$D/Detectronics/lidott-alarm2-web.jpg" lidott-alarm-site --quality 86 --no-grade
chmod 644 src/assets/img/photos/*
