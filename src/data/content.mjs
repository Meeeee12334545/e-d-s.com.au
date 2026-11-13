// All site copy lives here. It is carried over from www.e-d-s.com.au (tidied,
// de-duplicated and set in Australian English), so nothing on the new site
// claims more than the old one did.
import { existsSync } from "node:fs";

// Images live in src/assets/img and are copied to dist/assets/img by the build.
// "@root/" is swapped for each page's path back to the site root in layout().
// A product shot's WebP twin (tools/products.py) is served when there is one.
export const img = (file) => {
  const webp = file.replace(/\.(png|jpe?g)$/i, ".webp");
  return `@root/assets/img/${webp !== file && existsSync(new URL(`../assets/img/${webp}`, import.meta.url)) ? webp : file}`;
};
// Documents (datasheets, white papers, software) live in src/assets/docs.
export const localDoc = (file) => `@root/assets/docs/${file}`;
// Photographs live in src/assets/img/photos, prepared by tools/photos.py, and
// are named here as { photo: "<name>", alt, caption }: `figure` (or a pair as
// `figures`) on a service or solution page, `asideFigure` for a product shot
// in its sidebar. Every photo is shown in the same 3:2 frame with the same
// teal grade; `pos` picks the part to keep when the crop bites ("50% 20%"
// keeps the top) and `plain: true` shows a drawing whole, in its own colours.
// The photos are EDS's own site photos unless noted.
// Where there is no photograph of a method, a page can show an illustration
// (`diagram: "<id>"`, drawn by diagrams.mjs from `diagrams` below) or a
// FlowSense screen (`screen` beside the opening text, `shot` under a block),
// as { name, alt, caption } from src/assets/img/flowsense.

export const site = {
  name: "Environmental Data Services",
  short: "EDS",
  tagline: "Monitoring Australia's water, wastewater and environment since 1991.",
  phone: "1300 721 683",
  phoneHref: "tel:1300721683",
  email: "eds@e-d-s.com.au",
  sales: "sales@e-d-s.com.au",
  service: "service@e-d-s.com.au",
  // Web3Forms access key (https://web3forms.com). The enquiry and sign-up
  // forms send through it to the address the key was created for, which
  // should be eds@e-d-s.com.au. It is safe to publish. The build stops if it
  // is empty.
  formKey: "4fd0d5e0-cb94-40ad-adda-7c634e765045",
  address: ["13/20–22 Ellerslie Road", "Meadowbrook QLD 4131", "Australia"],
  hours: "Monday to Friday, 7:30am to 4:30pm",
  founded: 1991,
  // The live address, used for canonical links, the sitemap and share cards.
  url: "https://www.e-d-s.com.au",
  // Head office hours, in head office time. Drives the "open now" status.
  openingHours: { days: [1, 2, 3, 4, 5], opens: "07:30", closes: "16:30", timeZone: "Australia/Brisbane" },
  logo: img("eds-logo-colour.png"),
  logoWhite: img("eds-logo-white-large.png"),
  flowsenseUrl: "https://edsflowsense.au/",
  remoteDataUrl: "https://www.detecdata-en.com/",
  legal: "EDS & DAUS Pty Ltd",
  // EDS's own profiles elsewhere (LinkedIn, YouTube, the Google Business
  // Profile's share link and so on). They go into the structured data as
  // `sameAs`, which is how Google ties those profiles to this site.
  profiles: [],
  // Site ownership tokens: the `content` of the meta tag Google Search
  // Console and Bing Webmaster Tools each offer under "HTML tag". Each goes
  // on the home page when set. Not needed for a domain verified by DNS.
  verify: { google: "", bing: "" },
  // The IndexNow key (https://www.indexnow.org). The build publishes it as
  // /<key>.txt, and the publish workflow uses it to tell Bing and the other
  // IndexNow search engines which pages changed (tools/indexnow.mjs). Any
  // 32 hex characters; changing it only means the next publish sends every page.
  indexNowKey: "d968c1e599ceeb8a6cdacc2021cf1270",
};

export const offices = [
  { city: "Brisbane", state: "QLD", note: "Head office, Meadowbrook", lon: 153.1, lat: -27.66, head: true },
  { city: "Richmond", state: "NSW", note: "Serving New South Wales and the ACT", lon: 150.75, lat: -33.6 },
  { city: "Boronia", state: "VIC", note: "Serving Victoria", lon: 145.28, lat: -37.86 },
  { city: "Adelaide", state: "SA", note: "Serving South Australia", lon: 138.6, lat: -34.93 },
];

// The home hero's paragraph: 20 words at most, so the hero fits one screen.
export const homeLede = "Australia's largest supplier of water and wastewater monitoring equipment, with our own crews and data platform. Australian owned since 1991.";

// The proof row under the client logos on the home page: four statements at
// one weight. Each is a claim made elsewhere on the site (the About timeline,
// the footer credentials, the DaaS page), brought up to the first screen.
export const proof = [
  { lead: "Looking after Defence and Transurban sites", text: "An Australian Defence facility since 2003, and key Transurban tunnel infrastructure under a 2026 contract." },
  { lead: "Supplied, installed and serviced by EDS", text: "Our own loggers and flow meters, plus Detectronic, Hach, ORI, Beadedstream and more, fitted and maintained by our crews." },
  { lead: "Sydney Water panel provider", text: "Sewer flow and level instruments on a five-year panel, and EDS loggers at the Bureau of Meteorology since the 1990s." },
  { lead: "Certified for the sewer", text: "Intrinsically safe instruments under ATEX and IECEx for Zone 0. And 99.95% data availability under EDS Data as a Service." },
];

// The instrument shelf on the home page: four flagship instruments shown large
// on one plate, each with its maker, one line and two facts from its own page.
// `fit` is how much of the shot's height the image may take, so the four sit at
// a believable relative size. Product shots on transparent backgrounds only.
export const shelf = {
  heading: "The instruments our crews put their name to.",
  lede: "We design and build our own loggers and flow meters, and represent Detectronic, Hach, ORI, Beadedstream and others. We install, service and calibrate every instrument here ourselves.",
  items: [
    { name: "MSFM S2 with LIDoTT", maker: "Detectronic", href: "products/detectronic.html", image: img("detectronic-msfm-s2-lidott.png"), fit: 100,
      text: "The area velocity meter our sewer fleet runs on, with the level sensor that keeps measuring as the chamber surcharges.", specs: ["ATEX and IECEx Zone 0", "LIDoTT level to ± 2 mm"] },
    { name: "LIDoTT Alarm", maker: "Detectronic", href: "products/lidott-alarm.html", image: img("lidott-alarm-cut.png"), fit: 90,
      text: "Radar level sensor, battery, modem and antenna in one device, for early warning of blockages and overflows.", specs: ["Radar level to ± 5 mm", "Up to seven years on battery"] },
    { name: "Hawk", maker: "EDS", href: "products/hawk.html", image: img("hawk.png"), fit: 94,
      text: "The 4G logger built for Australian sewer networks. It lives inside the manhole, with no cabinet to build and no power to bring to site.", specs: ["IP68 submersible", "Designed and built by EDS"] },
    { name: "E-Flow 3", maker: "EDS", href: "products/e-flow-3.html", image: img("e-flow-3.png"), fit: 72,
      text: "Contactless radar measures velocity and depth in normal flow. When the sewer surcharges, ultrasonic and pressure sensors take over.", specs: ["Four sensors, no gap in the record", "Designed and built by EDS"] },
  ],
};

export const stats = [
  { value: 1991, label: "Founded in Queensland. Australian owned ever since.", plain: true },
  { value: 4, label: "Offices across Australia" },
  { value: 99.95, suffix: "%", decimals: 2, label: "Data availability under EDS DaaS" },
  { value: 24, suffix: "/7", label: "Real-time monitoring and alarms" },
];

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */
// Services are listed by group, in this order, on the services page and in
// the menus. `featured` services also appear on the home page and in the
// footer. `solutions` links a service to the solution pages (the old site's
// "Applications") it is used for, and `papers` to white papers by id.
// `pageTitle` (also on solutions and brands) is the whole title shown in
// Google and the browser tab, in place of "<title> | EDS", where the short
// title leaves out the words people search for. Keep it to 60 characters and
// to words the page's own copy uses; the build warns when a title runs longer.
// `description` (also on solutions and brands) is the line Google shows under
// that title, in place of the `summary`, where the summary is too short to
// say what the page offers. Keep it between about 120 and 155 characters and
// to claims the page already makes.
export const serviceGroups = [
  { id: "sewer", title: "Sewer networks", heading: "Know what is in the pipe, and what should not be.", lede: "Measure what flows through the network, find where the water gets in, and prove the fixes worked.", proof: "Intrinsically safe instruments certified for Zone 0, from the company awarded the largest sewer monitoring project in Australia in recent years." },
  { id: "water", title: "Water & environment", heading: "Quality, sampling and rainfall, measured properly.", lede: "For utilities, industry and environmental projects, from a single sampler on hire to a whole trade waste program.", proof: "The widest range of automatic samplers in Australia, from ORI and MicroLevel." },
  { id: "data", title: "Real-time data & analysis", heading: "From a reading to a decision.", lede: "Data that arrives as it happens, reaches the systems you already run, and ends in a report you can act on." },
  { id: "field", title: "Field services & support", heading: "The people and equipment behind every program.", lede: "Calibration, hire, facility management and training, from four offices across Australia and crews who travel." },
];

// "At a glance" in each service and solution page hero: [icon, fact, line].
// Every fact repeats something the page itself says, so nothing new is claimed.
export const glance = {
  "sewer-flow-monitoring": [
    ["gauge", "Detectronic MSFM meters", "Area velocity, intrinsically safe, ATEX and IECEx"],
    ["calendar-range", "Temporary or permanent", "From short I&I studies to long-term master planning"],
    ["cloud-rain", "Rain gauges alongside", "RIMCO 7499 gauges show how rain affects the network"],
    ["database", "Full access to your data", "On our platform, or by API into your own systems"],
  ],
  "inflow-infiltration-studies": [
    ["calendar-range", "6 to 12 weeks", "A typical short-term study, through wet weather"],
    ["timer", "Every 1 to 5 minutes", "Logging that captures storms and the daily pattern"],
    ["shield-check", "ATEX and IECEx", "Intrinsically safe equipment for live networks"],
    ["cloud-rain", "Rain gauges in the catchment", "Each response tied to the rain that caused it"],
  ],
  "data-as-a-service": [
    ["activity", "99.95% data availability", "A managed fleet with continuous oversight"],
    ["wallet", "No capital outlay", "EDS selects the sites, installs and maintains the equipment"],
    ["gauge", "Detectronic MSFM AV meters", "Intrinsically safe, with integrated 4G"],
    ["bell-ring", "Real-time alerts", "Know about a change when it happens"],
  ],
  "sewer-model-calibration": [
    ["timer", "Every 1 to 5 minutes", "Flow and rainfall logged at high resolution"],
    ["cloud-lightning", "At least three storms", "Before a calibration can be called verified"],
    ["target", "Published acceptance bands", "Peak flow, event volume and peak timing scored"],
    ["file-output", "Ready for EPA SWMM", "RTK parameters, with SWMM 5, GeoJSON, Excel and CSV exports"],
  ],
  "thermal-infiltration-surveys": [
    ["thermometer", "Temperature finds it", "The sensors nearest the entry point shift first"],
    ["waves", "Flow measures it", "An open channel meter records the extra water"],
    ["hard-hat", "No excavation", "Strings go in through existing manholes"],
    ["crosshair", "Targeted repairs", "Knowing where water enters cuts the cost of works"],
  ],
  "blockage-overflow-alarms": [
    ["radar", "Radar level to ± 5 mm", "LIDoTT Alarm measures up to 8.4 m"],
    ["landmark", "Sydney Water panel provider", "For sewer flow and level instrumentation"],
    ["bell-ring", "SMS, email and website", "Three alarm states, and a daily heartbeat"],
    ["shield-check", "Zone 0", "ATEX and IECEx, the most hazardous classification"],
  ],
  "rehabilitation-verification": [
    ["history", "Before and after", "Baseline monitoring before the works begin"],
    ["cloud-rain", "Rainfall alongside flow", "Wet weather response compared before and after"],
    ["gauge", "Whether capacity was restored", "Flow profiles show the return to baseline"],
    ["file-text", "A documented outcome", "A report for asset and planning teams"],
  ],
  "water-quality-monitoring": [
    ["flask-conical", "pH, EC and turbidity", "Sensors made by EDS"],
    ["layers", "Up to seven parameters", "At once, with the iLab 901 multi-parameter sensor"],
    ["test-tube", "Nitrate and nitrite", "Aquamonitrix, from one sample, with no pre-treatment"],
    ["calendar-clock", "600 samples between services", "Over three months at six samples a day"],
  ],
  "sampling-programs": [
    ["shield-check", "Intrinsically safe", "The only true intrinsically safe sampler in Australia"],
    ["layout-grid", "The widest range", "Of sampler configurations in Australia"],
    ["truck", "A rental fleet", "For short or long projects"],
    ["snowflake", "Refrigerated composite", "MicroLevel portable, fixed and refrigerated units"],
  ],
  "trade-waste": [
    ["waves", "Flow", "Area velocity meters in channels, ultrasonic in full pipes"],
    ["test-tubes", "Sampling", "Flow-proportional where it is required"],
    ["flask-conical", "Quality", "pH, EC, turbidity, nitrate and nitrite"],
    ["file-check", "Compliance reporting", "Real-time readings and reports for your records"],
  ],
  "closed-channel-flow": [
    ["magnet", "Magnetic", "No moving parts, for conductive liquids"],
    ["audio-waveform", "Ultrasonic", "Transit time for clean liquids, Doppler for solids"],
    ["gauge", "Pressure and contacting", "Differential pressure, capacitance, TDR and paddle wheel"],
    ["wrench", "Supply to calibration", "Selection, installation, audits and hire"],
  ],
  "rainfall-monitoring": [
    ["cloud-rain", "RIMCO 7499 gauges", "Tipping buckets sited in the catchment"],
    ["timer", "Every 1 to 5 minutes", "So storm peaks are captured"],
    ["split", "Inflow from infiltration", "Rapid response separated from slow groundwater"],
    ["history", "Bureau of Meteorology loggers", "Developed by EDS in the 1990s, still in use"],
  ],
  "real-time-monitoring": [
    ["radio-tower", "4G from the field", "The EDS Hawk needs no cabinet or mains power"],
    ["refresh-cw", "Every 60 seconds", "Every site on one FlowSense map, worst first"],
    ["bell-ring", "Email and SMS alarms", "Including a logger that has gone quiet"],
    ["plug", "Your SCADA", "ClearSCADA, Schneider CITECT, ELPRO and more"],
  ],
  "pump-station-monitoring": [
    ["cpu", "Pump Station Manager", "The EDS flagship since 1991"],
    ["radar", "Wet well level", "Radar and pressure sensing with the LIDoTT R"],
    ["plug", "SCADA integration", "ClearSCADA, Schneider CITECT, ELPRO and more"],
    ["gauge", "Capacity against nameplate", "Pump wear shown before it becomes a failure"],
  ],
  "scada-telemetry-integration": [
    ["plug", "Direct to SCADA", "ClearSCADA, Schneider CITECT, ELPRO and more"],
    ["radio-tower", "4G telemetry", "Built into flow meters and loggers"],
    ["code", "API, MQTT and webhooks", "Data pulled or pushed on your schedule"],
    ["folder-down", "Hosted SFTP", "Nothing exposed at your end"],
  ],
  "data-analysis-reporting": [
    ["shield-check", "ISO-compliant validation", "Readings checked continuously"],
    ["chart-pie", "20% of the network", "Typically carries 80% of the I&I"],
    ["split", "A split that adds up", "Sanitary flow, infiltration and inflow sum to the metered total"],
    ["badge-dollar-sign", "Priced at your rates", "Options ranked by NPV and cost per kilolitre"],
  ],
  "network-assessment": [
    ["map", "Where the inflow is worst", "Severity mapped across catchments"],
    ["activity", "Asset condition", "Read from the depth-to-velocity relationship"],
    ["ruler", "WSA 02 checks", "Pipe capacity and self-cleansing velocity"],
    ["list-ordered", "Prioritised improvements", "With their costs"],
  ],
  "auditing-calibration": [
    ["waves", "Open and closed channel", "Flow meters, level sensors and loggers"],
    ["flask-conical", "Analytical", "pH, EC, turbidity and nutrient analysers"],
    ["map-pin", "On site", "Audited and calibrated where it's installed"],
    ["file-check", "A record of findings", "Adjustments and recommendations documented"],
  ],
  "equipment-rental": [
    ["gauge", "Flow meters and loggers", "Including the 4G EDS Hawk"],
    ["test-tubes", "Samplers", "Automatic water and wastewater samplers"],
    ["flask-conical", "Analytical equipment", "For water quality programs"],
    ["hard-hat", "Installed by you or by us", "Trained EDS crews can install and commission"],
  ],
  "facility-management": [
    ["shield", "Defence since 2003", "Servicing and monitoring, under a contract still in place"],
    ["route", "Transurban", "Key tunnel infrastructure, under a contract awarded in 2026"],
    ["clock", "24/7 support", "Continuous oversight and rapid response"],
    ["building-2", "Your BMS", "New technology integrated into existing infrastructure"],
  ],
  "training-support": [
    ["graduation-cap", "Monitoring and modelling", "Training for your staff"],
    ["download", "Software and drivers", "FSDATA Desktop, and EDS, Hach and Dynaflox software on request"],
    ["settings", "EMS-Flow", "A five-step wizard for commissioning flow sensors"],
    ["life-buoy", "Ongoing support", "For the instruments and software we supply"],
  ],
  "structure-performance": [
    ["gauge", "One score, 0 to 1000", "The EDS Asset Score, recorded around the clock"],
    ["bell-ring", "Alarms on change", "Such as 5% in 60 minutes on any parameter"],
    ["scan", "Sensors to suit", "Light, moisture, seismic and temperature"],
    ["users", "The right people told", "On-site managers and key stakeholders"],
  ],
  "asset-network-assessment": [
    ["traffic-cone", "Blockages and sediment", "Found and cleared before the next storm"],
    ["activity", "Structural defects", "Sags, displaced joints and infiltration points"],
    ["git-merge", "Cross connections", "Overnight flow in dry weather"],
    ["map", "Where to spend", "Inflow severity mapped across catchments"],
  ],
  "network-thermal-monitoring": [
    ["cable", "Up to 750 m", "Beadedstream cable with up to 125 sensors"],
    ["thermometer", "± 0.1 °C", "Between −10 and 30 °C"],
    ["satellite", "Pole-to-pole coverage", "D605 loggers report by Iridium satellite"],
    ["plug", "Modbus or JSON", "The MLink connects cables to loggers and SCADA"],
  ],
  "wastewater-monitoring": [
    ["award", "Australia's largest", "Service contractor for water and wastewater studies"],
    ["waves", "Flow and quality", "The founding focus of EDS"],
    ["calendar-range", "Programs of every length", "Short-term studies to permanent stations"],
    ["wallet", "No capital outlay", "With monitoring as Data as a Service"],
  ],
  "automatic-sampling": [
    ["shield-check", "Intrinsically safe", "The only true intrinsically safe sampler in Australia"],
    ["layout-grid", "The widest range", "Of sampler configurations in Australia"],
    ["truck", "Buy or hire", "A rental fleet for short or long projects"],
  ],
  "environmental-monitoring": [
    ["flask-conical", "Water quality", "Sondes, sensors, and Aquamonitrix for nutrients"],
    ["cloud-rain", "Rainfall", "Logged at short intervals"],
    ["thermometer", "Temperature", "Proven in the extremes of Alaska"],
    ["test-tubes", "Sampling", "River, bore, stormwater and catchment programs"],
  ],
};

export const services = [
  {
    slug: "sewer-flow-monitoring",
    title: "Sewer Flow Monitoring",
    pageTitle: "Sewer Flow Monitoring, Australia-Wide | EDS",
    icon: "waves",
    group: "sewer",
    process: true,
    featured: true,
    summary: "Temporary and permanent flow monitoring for councils and water authorities, installed by trained crews Australia-wide.",
    description: "Temporary and permanent sewer flow monitoring for councils and water authorities, with Detectronic MSFM meters installed by our crews Australia-wide.",
    tags: ["Detectronic MSFM meters", "ATEX and IECEx"],
    intro: [
      "Good decisions about a sewer network start with good data from inside it. EDS has been putting flow meters into Australian sewers for more than three decades.",
      "We bring the instruments, the crews and the data platform, and we stay until the data has answered your question. Our own crews install and look after every site. And you get all the data, not just a report at the end.",
    ],
    blocks: [
      {
        heading: "Why choose EDS",
        lede: "Australia's largest supplier of water and wastewater monitoring equipment, with our own crews and our own data platform.",
        items: [
          ["Instruments built for the sewer", "Our fleet runs on Detectronic MSFM S2.5T area velocity flow meters, intrinsically safe and certified under ATEX and IECEx. They measure velocity from 0.03 to 4 m/s and depth to 3.5 m."],
          ["Crews who do this every day", "Our own crews are trained in installation, maintenance and calibration, and work from four offices across Australia."],
          ["Programs of any length", "From a short inflow and infiltration study to years of monitoring that feeds your sewer master plan."],
          ["Sensors for every chamber", "Including the LIDoTT level sensor, accurate to ± 2 mm. It switches to pressure, up to 10 m, when the chamber surcharges."],
          ["With you past the install", "We stay with you through data collection and interpretation, not just the day the meter goes in."],
        ],
      },
      {
        heading: "What is included",
        items: [
          ["Temporary and permanent flow monitoring", "For I&I studies, model calibration and compliance reporting."],
          ["Analysis and reporting", "Reports that are easy to read and act on, for planning and regulatory compliance."],
          ["Sites chosen properly", "Hydraulic site selection and careful installation, because accurate data starts with the right spot in the pipe."],
          ["Rainfall alongside", "RIMCO 7499 tipping bucket rain gauges in the catchment show how each storm moves through the network."],
          ["Data where you want it", "Readings arrive in EDS FlowSense as they are taken, or by API into the systems you already run."],
        ],
      },
      {
        heading: "Applications",
        list: [
          "Calibrating your sewer model for long-term planning",
          "Finding the sources of inflow and infiltration, and cutting treatment costs",
          "Assessing capacity before you expand",
          "Meeting environmental regulations",
          "Catching blockages and failures early",
        ],
      },
      {
        heading: "Common questions",
        faq: [
          ["How long does a flow monitoring program run?", "It depends on what the data has to answer. Short I&I studies typically run 6 to 12 weeks, long enough to capture wet weather. Long-term monitoring runs across seasons. It shows how infiltration changes with groundwater through the year, and what past works achieved."],
          ["How often are readings logged?", "Typically every 1 to 5 minutes. That captures storm peaks, and the daily dry weather pattern that analysis and modelling rely on."],
          ["Is the equipment safe to install in a live sewer?", "Yes. The Detectronic MSFM meters in our fleet are intrinsically safe and certified under ATEX and IECEx, and trained EDS crews do every installation."],
          ["Do we get the raw data, or only a report?", "Both. You get the reports and full access to the data, in EDS FlowSense or by API."],
          ["Is rainfall measured as well?", "Yes. We install RIMCO 7499 tipping bucket rain gauges in the catchment, so each wet weather response can be read against the rain that caused it."],
          ["Do we have to buy the equipment?", "No. You can buy the instruments, hire them, or take Data as a Service with no capital outlay. Under DaaS, we choose the sites, install and maintain the equipment, and deliver validated data."],
        ],
      },
    ],
    figure: { photo: "sewer-av-meter", alt: "An area velocity flow meter on a mounting band at the invert of a sewer, seen from the manhole above, with wastewater flowing over it", caption: "An area velocity flow meter at the bottom of a sewer, measuring depth and velocity.", pos: "50% 45%" },
    widget: "lab",
    related: ["inflow-infiltration-studies", "data-as-a-service", "sewer-model-calibration"],
    solutions: ["wastewater-monitoring"],
    products: ["detectronic", "hach-flow", "eds"],
    papers: ["unforeseen-benefits"],
  },
  {
    slug: "inflow-infiltration-studies",
    title: "Inflow & Infiltration Studies",
    pageTitle: "Inflow & Infiltration (I&I) Studies | EDS",
    icon: "cloud-rain",
    group: "sewer",
    process: true,
    featured: true,
    summary: "Find where stormwater and groundwater enter the sewer, and how much, so investment goes where it counts.",
    description: "Find where stormwater and groundwater get into the sewer, and how much. EDS I&I studies run through wet weather, with rain gauges in the catchment.",
    intro: [
      "Stormwater and groundwater in the sewer is one of the most expensive problems a council or utility can have, and one of the hardest to see. Finding it is what we do best.",
      "Industry data suggests inflow and infiltration (I&I) can make up half the flow in an older network during a storm. Left alone, it hides the system's true capacity and muddies the hydraulic model. Pipes and plants end up too big or too small.",
      "We measure where the water gets in and how much, so your money goes to the repairs that make the biggest difference.",
    ],
    blocks: [
      {
        heading: "Why I&I matters",
        nav: "Why it matters",
        items: [
          ["Operational", "Overloaded networks in wet weather, bypass pumping, emergency response, and the cost of pumping and treating water that should never have reached the sewer."],
          ["Environmental", "A greater risk of overflows in big storms, assets that wear out faster, and more energy and emissions spent on water that shouldn't be there."],
          ["Financial", "Avoidable treatment costs, and money spent on bigger pipes and plants when cutting I&I could delay the upgrade."],
          ["Planning", "Flow records that hide the true daily pattern, making models and forecasts harder to trust."],
        ],
      },
      {
        heading: "Our I&I services",
        nav: "Our services",
        items: [
          ["Find the sources", "Flow meters and rain gauges across the catchment show which subcatchments let the water in, and how much."],
          ["Watch it happen", "Intrinsically safe meters report over 4G, so you see each storm's response as it happens."],
          ["Plan the fix", "A repair plan built on your own data, with subcatchments ranked by how much water they let in."],
          ["Ongoing support", "We keep the monitoring and the fixes working long after the study ends."],
        ],
      },
      {
        heading: "What you gain",
        nav: "",
        items: [
          ["Fewer overflows", "Less stormwater in the sewer means fewer untreated discharges into local waterways."],
          ["Lower treatment costs", "Every litre of rain you keep out of the sewer is a litre you don't have to pump and treat."],
          ["Assets that last longer", "A network that isn't overloaded in every storm lasts longer and fails less often."],
          ["Compliance you can show", "Data that shows you're meeting environmental regulations and standards."],
        ],
      },
      {
        heading: "Short-term and long-term monitoring",
        nav: "Short or long term",
        lede: "Most I&I programs use one or both. The right choice depends on the decision the data has to support.",
        table: {
          neutral: true,
          left: "Short term",
          right: "Long term",
          rows: [
            ["Typical duration", "6 to 12 weeks, through wet weather", "Continuous, across seasons and years"],
            ["What it answers", "Where I&I enters, and how much, in each subcatchment", "The baseline infiltration load, and how it varies through the year"],
            ["Best used for", "Ranking subcatchments for CCTV, manhole surveys and repairs, and storm data for model calibration", "Seasonal groundwater infiltration and persistent defects that short studies can miss"],
            ["Capital decisions", "Fast evidence for rehabilitation and planning decisions", "Whether a capacity upgrade or targeted rehabilitation is better value"],
            ["After the works", "A baseline to measure against", "Proof of whether past works succeeded"],
          ],
        },
      },
      {
        heading: "Monitoring done properly",
        nav: "How we monitor",
        list: [
          "High-resolution logging, typically every 1 to 5 minutes, to capture storms and the daily pattern",
          "Inspections of hydraulics, access and the risk of rag or debris before a site is chosen",
          "Intrinsically safe equipment for live networks, certified under ATEX and IECEx",
          "Rain gauges in the catchment, so each wet weather response is tied to the rain that caused it",
          "QA/QC throughout: data validation, calibration checks and remote telemetry",
        ],
      },
      {
        heading: "From data to action",
        nav: "Data to action",
        lede: "In our experience, and across the water industry, about 20% of a sewer network typically carries 80% of its I&I. Finding that 20% is what makes a program pay back.",
        items: [
          ["Targeted repairs", "The data finds the worst sections for relining, grouting and manhole sealing, so you don't have to rehabilitate everything."],
          ["Capital works planning", "I&I analysis built into long-term asset plans, reducing the need for costly upgrades."],
          ["Performance measurement", "Monitoring after the works shows whether each repair delivered."],
        ],
      },
      {
        heading: "Common questions",
        faq: [
          ["What is the difference between inflow and infiltration?", "Inflow is stormwater that enters directly, through cross connections, unapproved private connections and faulty manholes. It arrives quickly during a storm. Infiltration is groundwater that seeps in through cracks, joints and faulty connections. It builds slowly and lingers."],
          ["How are the two told apart?", "By reading flow against rainfall. Gauges in the catchment and historical climate data separate the fast response of inflow from the slow, groundwater-driven response of infiltration."],
          ["How many flow meters does a study need?", "It depends on the size of the network and the question being asked. We choose sites by their hydraulics, after inspecting them. One regional council's study, ahead of a treatment plant upgrade, used 20 short-term flow meters."],
          ["What do we receive at the end?", "Validated data, and a report that ranks subcatchments by how much they contribute, with a prioritised repair plan. Monitoring after the works shows whether they cut I&I."],
        ],
      },
    ],
    figures: [
      { photo: "infiltration-joints", alt: "Groundwater streaming into a manhole through the joints in its concrete wall, over an instrument mounted below", caption: "Infiltration: groundwater seeping in through failing joints, long after the rain has stopped." },
      { photo: "inflow-manhole-rain", alt: "Water cascading down the step irons of a manhole during heavy rain", caption: "Inflow: stormwater pouring into a manhole while a storm is under way." },
    ],
    widget: "lab",
    related: ["sewer-flow-monitoring", "thermal-infiltration-surveys", "sewer-model-calibration"],
    solutions: ["network-thermal-monitoring", "wastewater-monitoring"],
    products: ["detectronic", "beadedstream"],
    papers: ["measuring-the-invisible", "thermistor-strings"],
  },
  {
    slug: "data-as-a-service",
    title: "Sewer Flow Data as a Service",
    pageTitle: "Sewer Flow Data as a Service (DaaS) | EDS",
    short: "Data as a Service (DaaS)",
    icon: "database-zap",
    group: "sewer",
    featured: true,
    summary: "Sewer flow monitoring with no capital outlay. EDS supplies, installs and looks after the equipment, and you get validated data.",
    tags: ["No capital outlay", "Validated data"],
    intro: [
      "With Data as a Service you don't buy flow meters. You buy the answers. We choose the sites, install and maintain the equipment, and validate the data continuously. You pay for data you can rely on, with no capital outlay and nothing to own.",
      "We've run sewer flow monitoring across Australia for more than three decades. With DaaS, we answer for the data, not just the equipment.",
    ],
    blocks: [
      {
        heading: "DaaS against traditional monitoring",
        lede: "What changes when EDS answers for the data, not just the equipment.",
        table: {
          left: "Traditional monitoring",
          right: "EDS DaaS",
          rows: [
            ["Data quality", "Variable, often inconsistent", "Reliable and validated"],
            ["Calibration", "Periodic", "Continuous"],
            ["What you receive", "Raw data only", "Real-time insights"],
            ["Installation", "Depends on the installer", "Hydraulic site selection and expert install"],
            ["QA/QC", "Limited validation", "Continuous QA/QC"],
            ["Depth and velocity", "Often misaligned", "Relationship verified"],
            ["Capital outlay", "Equipment purchase", "None"],
          ],
        },
      },
      {
        heading: "The meter behind it",
        lede: "EDS runs the Detectronic MSFM in its own monitoring fleet, so the advice you get comes from people who install it.",
        items: [
          ["Detectronic MSFM area velocity flow meter", "The MSFM S2.5T measures velocity from 0.03 to 4 m/s and depth to 3.5 m. It logs every 1 to 60 minutes, and lasts more than 15 weeks on one battery at 2-minute logging."],
          ["Certified for Zone 0", "Intrinsically safe under ATEX and IECEx, the most hazardous classification, for live sewers."],
          ["4G straight into FlowSense", "Readings arrive as they're taken, with email and SMS alarms when something changes, or by API into your own systems."],
        ],
      },
      {
        heading: "How it runs, end to end",
        lede: "A managed fleet with continuous oversight, delivered with 99.95% data availability.",
        steps: true,
        list: [
          "Hydraulic site selection",
          "Expert installation",
          "Continuous QA/QC and validation",
          "Real-time monitoring and anomaly detection",
          "Verification of the depth-to-velocity relationship",
          "Ongoing maintenance and performance checks",
          "Delivery of insight you can act on",
        ],
      },
      {
        heading: "Common questions",
        faq: [
          ["Is there any capital outlay?", "No. We supply, install and maintain the equipment, so there's nothing to buy. You pay for validated data and the insight that comes with it."],
          ["What data availability can we expect?", "99.95%, from a managed fleet with continuous oversight, continuous calibration and real-time alerts."],
          ["How do we see the data?", "In EDS FlowSense, with alarms by email and SMS when something changes, or by API into your own systems."],
          ["How is DaaS different from buying a monitoring program?", "Everything that makes the data trustworthy is included: site selection, continuous QA/QC, depth and velocity checks, and ongoing maintenance."],
        ],
      },
    ],
    figure: { photo: "sewer-sensors-chamber", alt: "A sewer chamber with a level float and an area velocity sensor on a stainless steel bracket, both installed in the flow", caption: "Level and velocity sensors in a chamber on an EDS-monitored site. Under DaaS, we choose the site, then install and maintain the equipment." },
    related: ["sewer-flow-monitoring", "real-time-monitoring", "inflow-infiltration-studies"],
    solutions: ["wastewater-monitoring"],
    products: ["detectronic"],
  },
  {
    slug: "sewer-model-calibration",
    title: "Sewer Model Calibration",
    pageTitle: "Hydraulic & Sewer Model Calibration | EDS",
    short: "Model Calibration",
    icon: "drafting-compass",
    group: "sewer",
    process: true,
    featured: true,
    summary: "Flow and rainfall monitoring designed to calibrate your hydraulic model, scored storm by storm.",
    description: "Flow and rainfall monitoring designed to calibrate your hydraulic model: logged every 1 to 5 minutes, scored storm by storm and ready for EPA SWMM.",
    intro: [
      "A hydraulic model is only as good as the field data behind it. We design and run the monitoring that calibrates new models and brings existing ones back into line, from the first site visit to the final dataset.",
      "To simulate a network properly, in dry weather and in storms, a model needs high-resolution flow and rainfall data from the pipes themselves.",
      "Today's modelling platforms can take flow and rainfall data in near real time. The limit is no longer the software. It's the accuracy of what goes in.",
      "Whether you're building your first model or recalibrating an old one, we can help. We've worked with major councils and utilities across Australia, and we know what engineers need from data they have to stand behind.",
      "Measured data can change the plan as well as the model. When a regional water authority recalibrated its model with temporary flow monitoring, infiltration proved well below what had been modelled. Rehabilitation funds were moved, and the high-risk catchments came first.",
    ],
    blocks: [
      {
        heading: "What a calibration program needs",
        items: [
          ["High-resolution flow and rainfall", "Flow logged typically every 1 to 5 minutes, with rain gauges in the catchment, to capture storm peaks and the daily pattern."],
          ["Dry and wet weather", "A model has to match the network in dry weather and in storms, so monitoring runs long enough to record both."],
          ["Sites chosen by their hydraulics", "We inspect hydraulics, access and the risk of rag or debris before a meter goes in."],
          ["Validated data", "Continuous QA/QC, calibration checks and depth and velocity checks, so the model is never tuned to a faulty reading."],
        ],
      },
      {
        heading: "Calibration scored storm by storm",
        lede: "A single score across a whole record can look fine while the model misses every storm peak. EDS FlowSense scores each storm on its own, to the CIWEM UDG Code of Practice (2017).",
        items: [
          ["Published acceptance bands", "Peak flow within −15% to +25%, event volume within −10% to +20%, and peak timing within one hour. An event passes on peak and volume together."],
          ["At least three storms", "A calibration needs three usable storms before it can be called verified. With fewer, it's reported as insufficient, not quietly passed."],
          ["Validated on independent storms", "RTK hydrographs fitted to each catchment are checked against storms not used to fit them, with a scorecard for each."],
          ["Ready for your modelling platform", "RTK parameters compatible with EPA SWMM, and exports in EPA SWMM 5, GeoJSON, Excel and CSV."],
        ],
      },
      {
        heading: "Common questions",
        faq: [
          ["How long should calibration monitoring run?", "Long enough to record dry weather flow and several big storms. A calibration needs at least three usable storms, so it depends on the season and the rain. Short programs commonly run 6 to 12 weeks."],
          ["Can you work with our existing model?", "Yes. We deliver flow and rainfall data in formats modelling platforms can import, or by API."],
          ["Who carries out the calibration?", "We design and run the monitoring, and can work through the calibration with your modelling team or consultant. FlowSense scorecards keep everyone on the same results."],
        ],
      },
    ],
    figure: { photo: "sewer-manhole-bracket", alt: "Looking down a manhole to a sensor bracket fixed across the invert of the pipe, with the sensor cable running up the shaft", caption: "A monitoring site: the sensor bracket across the bottom of the pipe, cabled to a logger at the top of the shaft. We choose sites by their hydraulics, so the model gets readings it can trust." },
    related: ["sewer-flow-monitoring", "inflow-infiltration-studies", "network-assessment"],
    products: ["detectronic", "hach-flow"],
  },
  {
    slug: "thermal-infiltration-surveys",
    diagram: "thermal",
    title: "Thermal Infiltration Surveys",
    icon: "thermometer",
    group: "sewer",
    process: true,
    summary: "Thermistor strings and open channel flow meters, used together to pinpoint where groundwater gets into a sewer.",
    intro: [
      "Flow monitoring shows how much infiltration a catchment has. Temperature shows where it gets in. Groundwater and surface water are usually a different temperature from wastewater. A string of sensors along the pipe picks up the change where they enter.",
      "We pair Beadedstream thermistor strings with sewer flow meters. When a crack opens, the nearest sensors shift and the flow meter records the extra water. So you get the location and the amount.",
      "It's not just for sewers. We also run short and long temperature studies in water networks and most other piped networks, pressurised or not.",
    ],
    blocks: [
      {
        heading: "Why combine temperature and flow",
        items: [
          ["Accuracy and sensitivity", "Temperature finds infiltration and flow measures it, so even small entry points show up early."],
          ["Continuous monitoring", "Both record in near real time, so new entry points are picked up as they appear."],
          ["No digging, no shutdown", "Strings go in through existing manholes and inspection points."],
          ["Built for sewers", "Robust, waterproof sensors that stand up to corrosion, chemicals and physical damage."],
          ["Targeted repairs", "Knowing where water enters narrows the scope and cost of repairs."],
        ],
      },
      {
        heading: "Typical uses",
        list: [
          "Locating the infiltration an I&I study has measured",
          "Prioritising CCTV inspections and repairs",
          "Intermittent infiltration that conventional methods miss",
          "Temperature studies in water and other pressurised networks",
        ],
      },
    ],
    related: ["inflow-infiltration-studies", "sewer-flow-monitoring", "rehabilitation-verification"],
    solutions: ["network-thermal-monitoring", "asset-network-assessment"],
    products: ["beadedstream", "detectronic"],
    papers: ["thermistor-strings"],
  },
  {
    slug: "blockage-overflow-alarms",
    title: "Blockage & Overflow Alarms",
    pageTitle: "Sewer Blockage & Overflow Alarms | EDS",
    icon: "siren",
    group: "sewer",
    summary: "Level alarms that warn as a sewer surcharges, and Blockage Watch, which finds a blockage weeks before it overflows.",
    intro: [
      "Blockages and surcharges give warning if something is watching. Our level monitoring alerts crews as wastewater rises, so they can act on a blockage or sewer collapse before it becomes a spill.",
      "Detectronic's LIDoTT Alarm puts a radar level sensor, battery, modem and antenna into one Zone 0 certified device, for main, domestic and lateral sewers. We supply and install it across Australia and run it in our own fleet. We're also a Sydney Water panel provider for sewer flow and level instruments.",
      "Where flow meters are in, the data watches too. A steady rise in depth with no rain to explain it points to a blockage or sediment building up, often long before crews would report it.",
    ],
    blocks: [
      {
        heading: "How it works",
        items: [
          ["Three alarm states", "Such as normal, high and high-high, set on site, with a message when levels return to normal."],
          ["Alarms that reach people", "By SMS, email and website, with GIS options and optional weather-managed filtering."],
          ["Daily heartbeat", "A daily message confirms each sensor is working."],
        ],
      },
      {
        heading: "Level alarms for every chamber",
        nav: "Level alarms",
        lede: "Three Detectronic radar instruments, all ATEX and IECEx certified for Zone 0, the most hazardous classification.",
        products: [
          { name: "LIDoTT Alarm", maker: "Detectronic", href: "products/lidott-alarm.html", image: img("lidott-alarm-cut.png"), fit: 92,
            text: "Radar measuring up to 8.4 m to ± 5 mm, with three alarm states and up to seven years on battery, in a submersible, self-cleaning enclosure." },
          { name: "Alarm2", maker: "Detectronic", href: "products/alarm2.html", image: img("detectronic-alarm2.png"), fit: 92,
            text: "Radar level from 0 to 20 m with no deadband, accurate to ± 5 mm at 20 m. High and low, rate of change and profile alarms." },
          { name: "LIDoTT R", maker: "Detectronic", href: "products/detectronic.html#lidott-r", image: img("lidott-sensor-r-cut.png"), fit: 96,
            text: "Radar and pressure level together, up to 17 m in total with zero deadband, for continuous monitoring through surcharge." },
        ],
      },
      {
        heading: "Blockage Watch in FlowSense",
        nav: "Blockage Watch",
        lede: "Where flow meters are in, FlowSense reads the dry weather record and finds a blockage weeks before it overflows. It's included on every site. It tells you a line is blocking, not exactly where, so you still want a level alarm in the chamber.",
        items: [
          ["Eight blockage signatures", "Six use level alone. The strongest also uses velocity."],
          ["Scored, not just flagged", "Each case is scored: watch from 35, warning from 55 and critical from 75. A case closes itself once the signature goes."],
          ["A likely cause and an action", "Silt or grease, a sudden obstruction, a downstream restriction or more load. Then a suggested response: desilt, CCTV, inspect below the meter, or no action."],
          ["Tested against your history", "A backtest against your own overflow register shows how much warning it would have given."],
        ],
      },
      {
        heading: "What it helps you catch",
        nav: "What it catches",
        list: [
          "Blockages in main, domestic and lateral sewers",
          "Surcharges caused by sewer collapses",
          "Sediment build-up, cleared before the next storm",
          "Partial obstructions, sags and displaced joints",
          "Rising risk of a wet weather overflow",
        ],
      },
    ],
    figure: { photo: "sewer-overflow-street", alt: "Wastewater surging up around a manhole cover and across a flooded street", caption: "A surcharging sewer. A level alarm in the chamber warns of the rising depth before a blockage becomes a spill like this one." },
    widget: "lidott",
    related: ["sewer-flow-monitoring", "real-time-monitoring", "pump-station-monitoring"],
    solutions: ["wastewater-monitoring", "asset-network-assessment"],
    products: ["detectronic"],
    papers: ["unforeseen-benefits"],
  },
  {
    slug: "rehabilitation-verification",
    diagram: "beforeafter",
    title: "Rehabilitation & Works Verification",
    pageTitle: "Sewer Rehabilitation & Works Verification | EDS",
    short: "Works Verification",
    icon: "badge-check",
    group: "sewer",
    summary: "Before-and-after flow monitoring that shows whether relining, cleaning and repair works delivered what was paid for.",
    description: "Before-and-after flow monitoring, with rainfall alongside, that shows whether relining, cleaning and repair works delivered what was paid for.",
    intro: [
      "Rehabilitation is a big investment, and flow data is the most direct way to show it worked. We monitor before and after relining, cleaning and repairs, so the change is measured, not assumed.",
      "Utilities increasingly use these comparisons to check contractor performance, which means fewer disputes and clearer accountability.",
    ],
    blocks: [
      {
        heading: "A before-and-after approach",
        list: [
          "Baseline monitoring before works begin",
          "Rainfall recorded alongside flow, to compare wet weather response before and after",
          "Monitoring through and after the works",
          "Depth, flow and wet weather response compared against the baseline",
          "A report that documents the outcome for asset and planning teams",
        ],
      },
      {
        heading: "What it tells you",
        items: [
          ["Whether capacity was restored", "Flow profiles show the network returning to baseline."],
          ["Whether infiltration fell", "Less variation in depth and flow during rain confirms infiltration fell."],
          ["Whether the model was right", "Measured results confirm, or correct, the improvements the model predicted."],
          ["Where to spend next", "Long-term monitoring proves past works and guides the next round of spending."],
        ],
      },
    ],
    related: ["inflow-infiltration-studies", "data-analysis-reporting", "sewer-flow-monitoring"],
    solutions: ["asset-network-assessment"],
    products: ["detectronic"],
    papers: ["unforeseen-benefits", "measuring-the-invisible"],
  },
  {
    slug: "water-quality-monitoring",
    title: "Water Quality Monitoring",
    icon: "droplet",
    group: "water",
    summary: "pH, EC, turbidity and nutrient monitoring for wastewater, process water and the environment, from one sensor to a whole network.",
    intro: [
      "We've measured water quality for the wastewater industry since we began, and it's still a big part of what we do. From one EC point to thousands of instruments reporting in real time, we supply, install and look after the equipment.",
      "We make our own pH, EC and turbidity sensors and the iLab multi-parameter range, and we represent Aquamonitrix for real-time nitrate and nitrite. Readings go straight to FlowSense, or to your own SCADA or telemetry system.",
    ],
    blocks: [
      {
        heading: "What we measure",
        items: [
          ["pH, EC and turbidity", "EDS-made sensors for continuous measurement in water and wastewater."],
          ["Several parameters at once", "The iLab 901 measures up to seven at once, from a list including pH, ORP, conductivity, turbidity, dissolved oxygen, ammonia and nitrate. The handheld iLab Sonde covers field checks."],
          ["Nitrate and nitrite", "Aquamonitrix measures both from one sample, with no pre-treatment. Detection limits are 1.5 ppm nitrate and 0.25 ppm nitrite."],
          ["Flow and quality together", "One program can cover both, as EDS has done for the wastewater industry for decades."],
        ],
      },
      {
        heading: "Where it is used",
        list: [
          "Wastewater networks and treatment processes",
          "Raw, process and effluent water",
          "Trade waste discharges",
          "Rivers, stormwater and surface water",
          "Baseline, impact and compliance monitoring for projects",
        ],
      },
      {
        heading: "Built for long deployments",
        items: [
          ["Readings where you need them", "Continuous readings to SCADA, telemetry or a building management system, as well as to EDS FlowSense."],
          ["Few site visits", "Aquamonitrix runs more than 600 samples between services: over three months at six a day. The iLab 901 cleans itself."],
          ["Sensors that stay clear in a sewer", "Sensor Fort, designed and built by EDS, holds pH, EC and other sensors on the bottom of a gravity sewer with only their tips in the flow, so rag has nothing to catch."],
          ["Up and running quickly", "Aquamonitrix can be running within a couple of hours, and its calibration stays stable over long deployments."],
          ["Calibrated in place", "We audit and calibrate analytical equipment on site, so the readings stay trustworthy."],
        ],
      },
    ],
    figure: { photo: "treatment-plant-clarifier", alt: "The circular clarifier of a wastewater treatment plant on a clear day, with its scraper bridge and weir", caption: "A treatment plant clarifier. We monitor quality from the inlet to the effluent, and in the network and environment around it." },
    related: ["sampling-programs", "trade-waste", "auditing-calibration"],
    solutions: ["wastewater-monitoring", "environmental-monitoring"],
    products: ["eds", "aquamonitrix", "ori"],
  },
  {
    slug: "sampling-programs",
    asideFigure: { src: img("nemo-1-mh-cut.png"), alt: "The ORI NEMO 1 M mobile sampler: a black drum with its pump and controller on top, and the suction hose coiled beside it", caption: "ORI NEMO 1 M, approved under ATEX and IECEx for Zones 1 and 2.", w: 322, h: 457 },
    title: "Sampling & Sampler Hire",
    pageTitle: "Sampling Programs & Sampler Hire | EDS",
    icon: "test-tubes",
    group: "water",
    summary: "Automatic water and wastewater samplers to buy or hire, including the only true intrinsically safe sampler in Australia.",
    intro: [
      "EDS has the widest range of automatic water and wastewater samplers in Australia. Buy the setup that suits the job, or hire from our rental fleet for a short study or a long program.",
      "The range includes mobile and stationary samplers from ORI, recognised as the world's leading maker of ATEX and IECEx certified sampling systems. MicroLevel adds portable, fixed and refrigerated composite samplers.",
    ],
    blocks: [
      {
        heading: "What we offer",
        items: [
          ["Purchase", "The widest range of sampler configurations in Australia."],
          ["Hire", "A rental fleet for short or long projects."],
          ["Certified for hazardous areas", "ATEX and IECEx certified ORI samplers for sewers and other demanding sites."],
          ["Composite and refrigerated", "MicroLevel MICROSAMPLER units for portable, fixed and refrigerated composite sampling."],
          ["Expert advice", "Help choosing the right sampler for the job."],
        ],
      },
      {
        heading: "Suitable for",
        list: [
          "Wastewater, sewer and pretreatment sludge sampling",
          "Trade waste and process water monitoring",
          "Stormwater, surface water, river and bore sampling",
          "Catchment monitoring",
          "Product sampling for quality verification",
        ],
      },
      {
        heading: "Choosing a sampler",
        items: [
          ["ORI NEMO 1 M", "Mobile sampler approved under ATEX and IECEx for Zones 1 and 2. Inputs for up to 10 digital and 2 analogue sensors, and an optional LTE modem. Peristaltic, vacuum and hybrid pump versions."],
          ["ORI AquaSamp Mini", "A light portable sampler for spot and timed samples, with 6 m suction lift and up to 144 samples on one charge. An ATEX version is available."],
          ["ORI PumpModul", "Starts on an event: a contact such as a push-button, an RS485 command or an ORI logger. Available with ATEX approval for Zone 1."],
          ["ORI BASIC mobil", "Battery-powered mobile samplers for hazardous Zones 1 and 2, including a version with active cooling."],
          ["MicroLevel MICROSAMPLER", "Composite samplers in portable (10P), fixed (10B) and refrigerated (10R) configurations."],
          ["Flow-proportional sampling", "Detectronic MSFM flow meters can pulse a sampler, so samples are taken in proportion to the flow."],
        ],
      },
    ],
    related: ["water-quality-monitoring", "trade-waste", "equipment-rental"],
    solutions: ["automatic-sampling", "environmental-monitoring"],
    products: ["ori", "microlevel"],
  },
  {
    slug: "trade-waste",
    diagram: "tradewaste",
    title: "Trade Waste Monitoring",
    pageTitle: "Trade Waste Monitoring & Compliance | EDS",
    icon: "factory",
    group: "water",
    featured: true,
    summary: "Flow, sampling, quality and reporting for industrial discharge, from one team, so staying compliant is simple.",
    description: "Trade waste flow, sampling and quality monitoring for industrial discharge. EDS supplies, installs and services all three, so staying compliant is simple.",
    intro: [
      "Trade waste monitoring keeps your business compliant and your discharge under control. EDS works with some of Australia's largest companies to measure, sample and report on what leaves their sites.",
      "A trade waste program usually covers flow, sampling and quality. We supply, install and service all three, so you deal with one team, not three suppliers.",
      "For utilities, flow data also shows trade waste where it shouldn't be. In one Queensland catchment, steady overnight flow with no rain to explain it revealed a trade waste connection wrongly tied into the sewer.",
    ],
    blocks: [
      {
        heading: "Trade waste services",
        items: [
          ["Compliance monitoring", "Monitoring that keeps you within local and national regulations."],
          ["Real-time data", "Continuous readings, so you can step in before a problem becomes a breach."],
          ["Built around your site", "Systems matched to your operations and your waste streams."],
          ["Kept working", "Ongoing servicing, so your monitoring works every day, not just the day it's checked."],
        ],
      },
      {
        heading: "What a program can include",
        items: [
          ["Flow", "Discharge measured in open channels with area velocity meters, or in full pipes with Dynaflox ultrasonic and other closed channel meters."],
          ["Sampling", "ORI samplers certified under ATEX and IECEx, and MicroLevel composite samplers, with flow-proportional sampling where required."],
          ["Quality", "EDS pH, EC and turbidity sensors, and Aquamonitrix for nitrate and nitrite. In the sewer itself, Sensor Fort keeps pH and EC sensors clear of rag."],
          ["Data and reporting", "Readings in real time to FlowSense or your own systems, and reports for your compliance records."],
        ],
      },
      {
        heading: "Why EDS",
        items: [
          ["Decades in the industry", "We've been measuring water and wastewater since 1991, and it shows in the advice you get."],
          ["Crews who do the work", "Our own crews are trained in installation, maintenance and calibration, and work from four offices across Australia."],
          ["Calibrated in place", "We audit and calibrate your meters and analytical equipment where they're installed, so the readings stay trustworthy."],
        ],
      },
    ],
    related: ["sampling-programs", "water-quality-monitoring", "auditing-calibration"],
    solutions: ["automatic-sampling", "wastewater-monitoring"],
    products: ["ori", "microlevel", "dynaflox", "aquamonitrix"],
  },
  {
    slug: "closed-channel-flow",
    title: "Closed Channel Flow Monitoring",
    pageTitle: "Closed Channel & Full Pipe Flow Monitoring | EDS",
    short: "Closed Channel Flow",
    icon: "cylinder",
    group: "water",
    summary: "Magnetic, ultrasonic and contacting meters that measure flow in full pipes.",
    description: "Magnetic, ultrasonic, pressure and contacting flow meters for full pipes. EDS helps you choose, then supplies, installs, audits and calibrates them.",
    intro: [
      "Measuring flow in a full pipe comes down to the right technology for the liquid, the pipe and the job.",
      "The options include magnetic and ultrasonic meters, pressure transmitters, and contacting types such as capacitance, TDR (time domain reflectometry) and paddle wheel.",
      "We've supplied, installed and calibrated all of them, and we're glad to talk through which one suits your job.",
    ],
    blocks: [
      {
        heading: "The technologies",
        items: [
          ["Magnetic", "Measures the voltage a conductive liquid creates as it moves through a magnetic field. Nothing blocks the flow and there are no moving parts, but the liquid must be conductive."],
          ["Ultrasonic transit time", "Times sound pulses with and against the flow. Suits clean liquids, and comes inline, as an insertion meter or clamped to the outside of the pipe."],
          ["Ultrasonic Doppler", "Bounces sound off particles and bubbles in the liquid, so it suits wastewater, slurries and other liquids with solids."],
          ["Pressure transmitters", "Infer flow from the differential pressure across a restriction, and measure level and head."],
          ["Contacting technologies", "Capacitance and TDR sensors measure level, and paddle wheels measure velocity directly. Simple and economical where conditions suit."],
        ],
      },
      {
        heading: "Choosing a meter",
        lede: "These are the questions that decide it.",
        list: [
          "The liquid: its conductivity, and the solids and bubbles it carries",
          "The pipe: material, diameter, lining and condition",
          "The straight run of pipe available upstream and downstream of the meter",
          "Whether the line can be cut, or the meter must clamp on or be hot tapped",
          "The accuracy required, whether for billing, compliance or operations",
          "Power, communications, and the systems the readings must reach",
        ],
      },
      {
        heading: "How EDS helps",
        items: [
          ["Selection and supply", "Advice on what suits the job, and supply from one of Australia's largest ranges of monitoring instruments."],
          ["Installation and commissioning", "Installed and commissioned by EDS technicians, and connected to your SCADA or telemetry."],
          ["Audit and calibration", "On-site audits and calibration of meters already in service."],
          ["Hire", "Short- and long-term hire for temporary measurement."],
        ],
      },
    ],
    figure: { photo: "clamp-on-ultrasonic", alt: "A pair of ultrasonic transducers strapped to a green pipe, cabled to a wall-mounted flow transmitter with a keypad and display", caption: "Clamp-on ultrasonic transducers measure flow from outside the pipe, with no cut into the line and nothing in the flow." },
    related: ["auditing-calibration", "equipment-rental", "real-time-monitoring"],
    products: ["dynaflox", "eds"],
  },
  {
    slug: "rainfall-monitoring",
    title: "Rainfall Monitoring",
    pageTitle: "Rainfall Monitoring & Rain Gauges | EDS",
    icon: "cloud-drizzle",
    group: "water",
    process: true,
    summary: "Tipping bucket gauges beside the flow meters, so each change in flow is read against the rain that caused it.",
    description: "Tipping bucket rain gauges installed alongside flow meters, so every change in the network can be read against the rain that caused it.",
    intro: [
      "Flow data shows that something changed. Rainfall data shows why. We put RIMCO 7499 tipping bucket rain gauges in the catchments we monitor, so each wet weather response can be read against the rain that caused it.",
      "Rainfall is how inflow is told apart from infiltration. Inflow arrives quickly during a storm. Infiltration builds slowly and lingers. On-site gauges and historical climate data separate the two.",
      "Rainfall is in our history too. We developed the data logger for the Bureau of Meteorology in the 1990s, and those loggers are still in use.",
    ],
    blocks: [
      {
        heading: "What is included",
        items: [
          ["Tipping bucket rain gauges", "RIMCO 7499 gauges sited within the catchment being monitored."],
          ["High-resolution logging", "Rain recorded typically every 1 to 5 minutes, to capture storm peaks."],
          ["Rainfall-dependent I&I analysis", "Flow split into fast inflow and slower, groundwater-driven infiltration."],
          ["Historical context", "Site records read against historical climate data."],
          ["Rainfall in FlowSense", "Weather on the network map, and a rainfall outlook that states its odds."],
        ],
      },
      {
        heading: "Applications",
        list: [
          "Inflow and infiltration studies",
          "Hydraulic model calibration in dry and wet weather",
          "Wet weather overflow risk",
          "Environmental monitoring programs",
        ],
      },
    ],
    asideFigure: { src: img("tipping-bucket-rain-gauge.png"), alt: "A tipping bucket rain gauge: a stainless steel cylinder with a bronze funnel on a levelling base", caption: "A tipping bucket rain gauge.", w: 360, h: 500 },
    related: ["inflow-infiltration-studies", "sewer-model-calibration", "sewer-flow-monitoring"],
    solutions: ["environmental-monitoring"],
    products: ["eds"],
    papers: ["measuring-the-invisible"],
  },
  {
    slug: "real-time-monitoring",
    title: "Real-Time Monitoring",
    pageTitle: "Real-Time Wireless Monitoring | EDS",
    icon: "radio-tower",
    group: "data",
    featured: true,
    summary: "Rugged 4G monitoring that reports to one map and to the SCADA you already run, with alarms that reach people.",
    description: "Rugged 4G monitoring that reports to one map and to the SCADA you already run, with email and SMS alarms when a level rises or a logger goes quiet.",
    intro: [
      "When a level rises or a logger goes quiet, you want to know now, not next week. Our rugged wireless equipment is built for the toughest sites, and reports over 4G to one map and your SCADA.",
      "And we don't just ship the boxes. We install, commission and support the equipment, so the data keeps arriving for the life of the program.",
    ],
    blocks: [
      {
        heading: "Key features",
        items: [
          ["Built tough", "Made for harsh conditions, including a surcharged manhole."],
          ["Wireless from the start", "4G telemetry built in, so a site can go wherever the mobile network reaches."],
          ["Fits your SCADA", "Works with ClearSCADA, Schneider CITECT, ELPRO and many more."],
        ],
      },
      {
        heading: "What you can count on",
        items: [
          ["Instruments we build ourselves", "The Hawk logger and E-Flow 3 flow meter are designed and built by EDS, alongside the ranges we represent."],
          ["Support from the people who install it", "Our crews put this equipment in, so the advice you get comes from the field."],
          ["Data that keeps arriving", "99.95% data availability under EDS DaaS, from a managed fleet with continuous oversight."],
        ],
      },
      {
        heading: "What we monitor in real time",
        list: [
          "Sewer flow, depth and velocity",
          "Wet well levels, pump runs and alarms",
          "Blockage and overflow levels in chambers and lateral sewers",
          "Water quality, including pH, EC, turbidity, nitrate and nitrite",
          "Rainfall in the catchments we monitor",
          "Pressure in water networks, with the EPM-2 portable 4G logger",
        ],
      },
      {
        heading: "How the data reaches you",
        items: [
          ["4G from the field", "EDS and Detectronic loggers report over the mobile network. The battery-powered EDS Hawk lives inside the manhole, with no cabinet or mains power."],
          ["EDS FlowSense", "Every site on one map, refreshed every 60 seconds, worst first: open alarms, quiet loggers and sites outside their normal range."],
          ["Alarms that reach people", "Threshold and no-data rules, sent once by email and SMS when the state changes. A dead logger gets caught as well as a high level."],
          ["Your own systems", "Feeds to your SCADA or historian, and a read API, with nothing installed on your control network."],
        ],
      },
    ],
    figure: { photo: "telemetry-pole-solar", alt: "A solar panel and a telemetry enclosure mounted on a pole beside a monitoring site, with a manhole in the long grass below", caption: "A solar-powered telemetry site. Readings leave over the mobile network as they are taken.", pos: "50% 18%" },
    related: ["data-as-a-service", "sewer-flow-monitoring", "facility-management"],
    products: ["eds", "detectronic"],
  },
  {
    slug: "pump-station-monitoring",
    diagram: "wetwell",
    title: "Pump Station Monitoring",
    icon: "fan",
    group: "data",
    summary: "Wet well levels, pump runs and alarms watched around the clock, from the company that built the Pump Station Manager.",
    description: "Wet well levels, pump runs and alarms watched around the clock and linked to your SCADA, from the company that built the Pump Station Manager.",
    intro: [
      "Pump stations are where EDS began. We launched in 1991 with our flagship product, the Pump Station Manager (PSM), and we still design and build the instruments that watch over pump stations.",
      "We supply and install monitoring for wet well levels, pump runs and alarms, and connect it to your SCADA. Flow data from upstream adds what SCADA can't show: how the catchment responds to rain, and whether pump start and stop levels suit the flows arriving.",
      "Utilities have used flow data from LIDoTT Smart sensors to refine those levels, cutting run time and power use.",
    ],
    blocks: [
      {
        heading: "What we provide",
        items: [
          ["Pump Station Manager", "The EDS flagship since 1991, designed and built by EDS."],
          ["Wet well level", "Radar and pressure level sensing with the LIDoTT R, or EDS ultrasonic level sensors."],
          ["Loggers and telemetry", "EDS EMS data loggers and the 4G Metalog send readings in real time."],
          ["SCADA integration", "Works with ClearSCADA, Schneider CITECT, ELPRO and other SCADA systems."],
        ],
      },
      {
        heading: "Applications",
        list: [
          "Wet well level and overflow alarms",
          "Refining pump start and stop levels",
          "Reducing pump run time and power consumption",
          "Cross-checking network flow data against pump station records",
        ],
      },
      {
        heading: "Pump Station Manager in FlowSense",
        lede: "FlowSense works out station flow and pump condition from the level and run signals a station already has. No flow meter needed.",
        shot: { name: "psm", alt: "The FlowSense Pump Station Manager: the station's figures across the top, the wet well drawn to scale with its set-points, a briefing in words, and each pump's delivery against its rating on a dial.", caption: "The Pump Station Manager in FlowSense (demonstration account): the wet well to scale with its set-points, and each pump's delivery against its rating." },
        items: [
          ["What it needs", "The wet well level signal, the run state of each pump, and the dimensions of the well. Most stations already produce the first two."],
          ["What it reports", "Volume in and out, pump starts and run hours, and energy per megalitre pumped."],
          ["Capacity against nameplate", "Each pump's delivered capacity, set against its nameplate rating, shows wear before it becomes a failure."],
          ["Honest about gaps", "Cycles the record can't support are left out and reported, not estimated."],
        ],
      },
    ],
    related: ["real-time-monitoring", "scada-telemetry-integration", "blockage-overflow-alarms"],
    solutions: ["wastewater-monitoring"],
    products: ["eds", "detectronic"],
    papers: ["unforeseen-benefits"],
  },
  {
    slug: "scada-telemetry-integration",
    title: "SCADA & Telemetry Integration",
    short: "SCADA & Telemetry",
    icon: "plug-zap",
    group: "data",
    summary: "Monitoring data delivered into the SCADA, telemetry and building management systems you already run.",
    description: "Monitoring data delivered into the SCADA, telemetry and building systems you already run: ClearSCADA, Schneider CITECT and ELPRO, or by API and MQTT.",
    intro: [
      "Telemetry is in our roots. Before EDS, founder Graham Harper started ELPRO, now one of the world's largest SCADA suppliers.",
      "Our equipment works with SCADA systems including ClearSCADA, Schneider CITECT and ELPRO. Data can also reach you from our platform by API, and analytical sensors can feed new or existing building management systems.",
    ],
    blocks: [
      {
        heading: "Ways to connect",
        items: [
          ["Direct to SCADA", "Instruments that work with ClearSCADA, Schneider CITECT, ELPRO and many more."],
          ["4G telemetry", "4G built into flow meters and loggers, for real-time data."],
          ["Hosted SFTP", "Files dropped into a folder EDS hosts, so nothing is exposed at your end."],
          ["Building management systems", "Real-time analytical sensors integrated into new or existing BMS."],
          ["Analysers to telemetry", "Aquamonitrix sends nitrate and nitrite readings straight to SCADA or telemetry."],
        ],
      },
      {
        heading: "Applications",
        list: [
          "Pump stations and wet wells",
          "Network flow and level sites",
          "Treatment process and quality analysers",
          "Facilities and buildings",
        ],
      },
      {
        heading: "From FlowSense to your systems",
        lede: "Validated data can flow back out of EDS FlowSense to the SCADA, historian or reporting tools your teams already use.",
        items: [
          ["Scheduled files", "CSV files delivered to your server over SFTP or FTPS, for SCADA file importers and historians."],
          ["MQTT", "Messages to your broker as JSON or CSV. The closest thing to live."],
          ["Read API", "Pulled over HTTPS on your schedule, into tools such as Power BI, Excel, Grafana or ArcGIS. Read only, with one exception: a key can be allowed to record what a crew found on a work order."],
          ["Webhooks", "Signed messages posted when an alarm is raised or cleared, a forecast puts a site at risk, or Blockage Watch flags a blockage."],
        ],
      },
      {
        heading: "Common questions",
        faq: [
          ["Does anything need to be installed on our SCADA?", "No. There's no agent, connector or gateway to install. OPC UA, DNP3 and Modbus aren't touched in either direction, and there's no control path into your systems."],
          ["Are the readings changed on the way?", "No. Values are sent exactly as stored, with no gap filling and no smoothing. A missing reading is left blank, not estimated."],
          ["How long does a connection take to commission?", "Usually an afternoon. We commission each one with you, and it isn't done until a reading has arrived and been checked."],
          ["Is there a charge for the feeds?", "No. Feeds, the API and webhooks cost nothing extra with a FlowSense subscription."],
        ],
      },
    ],
    figure: { photo: "telemetry-cabinet", alt: "An open site cabinet with a data logger, a modem and a power supply mounted inside, wired to the instruments on site", caption: "Inside a site cabinet: logger, telemetry and power supply, wired to the station's instruments and on to SCADA.", pos: "50% 62%" },
    related: ["real-time-monitoring", "pump-station-monitoring", "facility-management"],
    products: ["eds", "aquamonitrix"],
    papers: ["one-platform-many-sources"],
  },
  {
    slug: "data-analysis-reporting",
    screen: { name: "report", alt: "An executive summary generated by EDS FlowSense: the period and sites covered, headline figures, the daily volume across the network stacked by site, and telemetry health for every site.", caption: "A FlowSense executive summary, from the platform's demonstration account. Every report is built from the same validated record." },
    title: "Data Analysis & Reporting",
    pageTitle: "Flow Data Analysis & Reporting | EDS",
    icon: "chart-line",
    group: "data",
    summary: "Validated flow, depth and rainfall data turned into reports that show where the problems are and what to fix first.",
    description: "Validated flow, depth and rainfall data turned into reports that show where the problems are and what to fix first. Our data validation is ISO compliant.",
    intro: [
      "Data is only valuable if it leads to a decision. We validate what we collect and turn it into clear reports for planning, investment and compliance.",
      "Our data validation is ISO compliant. Readings are checked continuously. Where it matters, anomalies are cross-checked against SCADA pump station records and field inspections.",
      "In our experience, about 20% of a sewer network typically carries 80% of its I&I. Good analysis finds that 20%, so repairs go where they pay back.",
    ],
    blocks: [
      {
        heading: "What we deliver",
        items: [
          ["Continuous QA/QC", "Data validated as it arrives, with calibration checks and remote telemetry throughout the program."],
          ["Rainfall-dependent I&I analysis", "Inflow separated from infiltration using on-site rain gauges and historical climate data."],
          ["Prioritised repair plans", "Subcatchments ranked by contribution, with cost-benefit analysis and a staged program of works."],
          ["Asset condition insights", "Shifts in the depth-to-velocity relationship that point to blockages, sediment and structural defects."],
          ["Cross connection detection", "Dry weather flow signatures that reveal illegal discharges and stormwater tied into the sewer."],
          ["Full access to your data", "Through FlowSense, or by API into your own systems."],
        ],
      },
      {
        heading: "How the analysis is done",
        lede: "Every calculated figure in EDS FlowSense shows how it was worked out: the method, the constants and the assumptions, in plain language.",
        shot: { name: "rdii-hydrograph", alt: "An RDII hydrograph in EDS FlowSense: measured flow in blue, the modelled dry weather baseline dashed beneath it, and the rainfall-derived inflow in red, over four weeks with two storms.", caption: "Measured flow, the dry weather baseline and the rainfall-derived inflow in FlowSense, from the platform's demonstration account." },
        items: [
          ["Dry weather flow", "Sanitary flow and groundwater infiltration separated from qualifying dry days only, with a daily pattern for each type of day."],
          ["Every storm on its own", "Isolated storms detected automatically, each with its peak, volume, lag and rise above dry weather flow."],
          ["A split that adds up", "Sanitary flow, groundwater infiltration and rainfall-derived inflow add up exactly to the metered total."],
          ["Priced at your rates", "Unwanted water costed at your own treatment and pumping rates, and repair options ranked by NPV, benefit-cost ratio and cost per kilolitre removed."],
          ["The measured record is kept", "Data is checked for flatlines, spikes, drift and impossible values. Repairs are for export only: a gap fill never overwrites what was measured."],
          ["Catchments that close", "Upstream and downstream sites compared, aligned on travel time, to show where flow is gained or lost."],
        ],
      },
    ],
    related: ["data-as-a-service", "inflow-infiltration-studies", "rehabilitation-verification"],
    solutions: ["asset-network-assessment"],
    products: ["detectronic"],
    papers: ["one-platform-many-sources", "measuring-the-invisible", "unforeseen-benefits"],
  },
  {
    slug: "network-assessment",
    title: "Network Assessment & Review",
    pageTitle: "Water & Wastewater Network Assessment | EDS",
    icon: "network",
    group: "data",
    featured: true,
    summary: "A clear picture of how your water or wastewater network performs, where it struggles, and what to fix first.",
    description: "A clear picture of how your water or wastewater network is performing, where it is struggling, and what to fix first, from validated monitoring data.",
    intro: [
      "We've worked with some of Australia's largest water and wastewater networks for more than thirty years. We know what a healthy network looks like in the data, and a struggling one. An assessment turns your monitoring into a clear picture of performance and condition, and a list of what to do about it.",
      "We've built sewer models for councils and governments across the country, to evaluate their networks, solve problems and rank improvements by cost.",
    ],
    blocks: [
      {
        heading: "What an assessment can show",
        items: [
          ["Where the inflow is worst", "Inflow severity mapped across catchments, so CCTV inspections and rehabilitation budgets go where they're needed."],
          ["Asset condition", "Shifts in the depth-to-velocity relationship that reveal blockages, sediment, sags, displaced joints and infiltration points before crews report them."],
          ["What should not be there", "Dry weather flow signatures that reveal cross connections, illegal discharges and stormwater tied into the sewer."],
          ["Capacity and level of service", "Pipe capacity and self-cleansing velocity checked against the WSA 02 Sewerage Code of Australia."],
        ],
      },
      {
        heading: "What you receive",
        items: [
          ["Validated data", "Validated monitoring data, and full access to it."],
          ["A performance report", "The performance and operating condition of the network, in one report."],
          ["Problems explained", "Each problem located and explained, with the evidence behind it."],
          ["Costed priorities", "A prioritised list of improvements, with costs."],
        ],
      },
      {
        heading: "Alongside an assessment",
        list: [
          "Model development",
          "Flow monitoring for model calibration and I&I assessment",
          "An improvement program",
          "Training your staff in modelling and monitoring practices",
          "Real-time evaluation as events happen, with instant alarms",
        ],
      },
    ],
    figure: { photo: "sewer-pipe-downstream", alt: "Looking along a large sewer pipe from a manhole, with the sensor mounting band fixed inside the entry and flow running away into the dark", caption: "Looking downstream from a manhole. Flow and depth measured at sites like this show how the network is performing, and where it isn't." },
    related: ["sewer-model-calibration", "data-analysis-reporting", "sewer-flow-monitoring"],
    solutions: ["asset-network-assessment"],
    products: ["detectronic", "eds"],
    papers: ["unforeseen-benefits", "measuring-the-invisible"],
  },
  {
    slug: "auditing-calibration",
    title: "Auditing & Calibration",
    pageTitle: "Flow Meter Auditing & Calibration | EDS",
    icon: "clipboard-check",
    group: "field",
    featured: true,
    summary: "Audits and calibration of your monitoring equipment where it's installed, by experienced EDS technicians, so your data holds up.",
    intro: [
      "A drifting instrument costs you twice: once in readings you can't trust, and again in the decisions made on them. Our technicians audit and calibrate equipment where it's installed: closed channel, open channel, level, pressure, rainfall and analytical.",
      "We've worked with most of the monitoring technologies available, so we know how each one drifts and how to put it right.",
      "Calibration keeps a long record trustworthy. We've calibrated long-term sewer flow gauges across multiple Yarra Valley Water sites, keeping the data reliable for modelling and planning.",
    ],
    blocks: [
      {
        heading: "What we audit and calibrate",
        items: [
          ["Open channel flow", "Area velocity flow meters, level sensors and loggers in sewers, drains and channels."],
          ["Closed channel flow", "Magnetic, ultrasonic and other full pipe meters."],
          ["Level, pressure and rainfall", "Level sensors, pressure transmitters and rain gauges, and the loggers that record them."],
          ["Analytical", "pH, EC, turbidity and multi-parameter sensors, and nutrient analysers."],
        ],
      },
      {
        heading: "What an audit covers",
        list: [
          "The site: its hydraulics, access, and the condition of the installation",
          "The instrument's readings against an independent reference measurement",
          "For flow meters, the relationship between depth and velocity",
          "The logger, power supply and telemetry, so readings keep reaching you",
          "A record of findings, adjustments and recommendations",
        ],
      },
      {
        heading: "Why it matters",
        items: [
          ["Data that stands up", "Readings that hold up in a model, a compliance report or a capital works decision."],
          ["Problems found early", "A drifting sensor or a fouled site found at the audit, not months later in the data."],
        ],
      },
    ],
    figure: { photo: "site-crew-manhole", alt: "A manhole in a park, with an access hatch behind a safety rail and a white van parked beyond it", caption: "A manhole and a railed access hatch in a park, the kind of site where we audit and calibrate instruments in place." },
    related: ["closed-channel-flow", "trade-waste", "equipment-rental"],
    products: ["hach-flow", "dynaflox", "eds"],
  },
  {
    slug: "equipment-rental",
    title: "Equipment Rental",
    pageTitle: "Monitoring Equipment Hire & Rental | EDS",
    icon: "package-check",
    group: "field",
    summary: "Long- and short-term hire of rugged monitoring and analytical equipment, installed by you or by trained EDS crews.",
    description: "Hire flow meters, loggers, samplers and analytical equipment from the EDS fleet, short or long term, installed by you or by trained EDS crews.",
    intro: [
      "You don't have to own the instruments. Our hire fleet covers flow meters, loggers, samplers and analytical equipment, all built for the toughest jobs, for a short study or a long program.",
      "The hire fleet is the same equipment our own crews run, so the advice that comes with it is from people who use it in the field.",
      "Difficult sites are our specialty. Ask us for an off-the-shelf system or a custom package, for one site or a national or international project.",
    ],
    blocks: [
      {
        heading: "In the hire fleet",
        lede: "Flow meters, loggers and samplers, with analytical instruments for water quality programs.",
        products: [
          { name: "MSFM flow meters", maker: "Detectronic", href: "products/detectronic.html#msfm-s2-5t", image: img("detectronic-msfm-s2-lidott.png"), fit: 100,
            text: "Area velocity flow meters for temporary flow surveys. The fleet runs on the MSFM S2.5T, intrinsically safe and certified under ATEX and IECEx." },
          { name: "Hawk 4G loggers", maker: "EDS", href: "products/hawk.html", image: img("hawk.png"), fit: 88,
            text: "Battery-powered 4G loggers for temporary flow surveys, made by EDS." },
          { name: "Automatic samplers", maker: "ORI and MicroLevel", href: "products/ori.html", image: img("nemo-1-mh-cut.png"), fit: 92,
            text: "Automatic water and wastewater samplers for short or long projects." },
        ],
      },
      {
        heading: "How hire works",
        steps: true,
        list: [
          "Tell us the job, the site and how long you need the equipment",
          "We recommend the right setup, from an off-the-shelf system to a custom package",
          "Install it yourself, or have trained EDS crews install and commission it",
          "Readings from 4G instruments arrive in EDS FlowSense or your own systems",
        ],
      },
      {
        heading: "When hire makes sense",
        list: [
          "Short-term inflow and infiltration studies",
          "Monitoring for model calibration",
          "Before-and-after monitoring around rehabilitation works",
          "Trade waste and compliance sampling campaigns",
        ],
      },
    ],
    related: ["sewer-flow-monitoring", "trade-waste", "auditing-calibration"],
    products: ["detectronic", "eds", "ori", "microlevel", "hach-flow", "dynaflox"],
  },
  {
    slug: "facility-management",
    title: "Facility Management",
    icon: "building-2",
    group: "field",
    summary: "Facility management with the monitoring built in, for major corporate and government organisations including Defence.",
    intro: [
      "For more than thirty years, major corporate and government organisations have trusted EDS with their facilities. Today that includes Defence and Transurban.",
      "Facility management is more than maintenance. It's keeping your assets performing, safe and sustainable, with little downtime and every standard met. And because one team delivers several services, costs come down.",
      "We're a monitoring company, so the monitoring comes built in: sensors, data platforms and real-time reporting. No two facilities are the same, so we build each service around your site, budget, risks and legal requirements.",
    ],
    blocks: [
      {
        heading: "Our facility management services",
        items: [
          ["Asset management", "Proactive maintenance and lifecycle planning, to get the most from every asset."],
          ["24/7 support and monitoring", "Continuous oversight and a rapid response when something goes wrong, so disruption stays small."],
          ["Sustainability and compliance", "Energy efficiency, environmental responsibility and the regulations your facility must meet."],
          ["Custom integration", "New technology and processes built into your existing facility, including your BMS."],
        ],
      },
      {
        heading: "Where we have delivered",
        items: [
          ["Australian Defence facility", "Servicing and monitoring since 2003, under a contract still in place."],
          ["Transurban", "A service provider contract, awarded in 2026, to service and maintain key tunnel infrastructure."],
          ["Amberley Fire Training Facility", "Built by EDS in 2001 and 2002."],
        ],
      },
    ],
    figures: [
      { photo: "fire-training-pad", alt: "A live fire burning across a concrete training pad under a clear sky, with bushland behind", caption: "A live fire training pad." },
      { photo: "fire-training-fuselage", alt: "An aircraft fuselage fire trainer marked Royal Australian Air Force, standing on a concrete pad", caption: "An aircraft fire trainer at a Defence training facility." },
    ],
    related: ["real-time-monitoring", "scada-telemetry-integration", "auditing-calibration"],
    solutions: ["structure-performance"],
    products: ["eds"],
  },
  {
    slug: "training-support",
    title: "Training & Technical Support",
    short: "Training & Support",
    icon: "graduation-cap",
    group: "field",
    summary: "Training for your staff in monitoring and modelling practice, and support for the instruments and software we supply.",
    intro: [
      "We train your staff in monitoring and modelling, so the people who own a network understand its data and get the most from it.",
      "Our own crews are trained in installation, maintenance and calibration, because that's what keeps data quality high over a long program.",
      "We also support the instruments and software we supply. Manuals, software and drivers are on our Resources page, and EDS, Hach Flo-Ware and Dynaflox software is available on request.",
    ],
    blocks: [
      {
        heading: "How we help",
        items: [
          ["Monitoring and modelling practice", "Training for your staff in the practices behind network monitoring and hydraulic models."],
          ["Software and drivers", "FSDATA Desktop and USB-serial drivers to download, with EDS (EMS2001, EMS4000), Hach Flo-Ware and Dynaflox software on request."],
          ["Advice on equipment", "Our team has installed, serviced and calibrated the instruments we sell, and can tell you which suits your application."],
          ["Ongoing support", "Maintenance and support for the instruments and software we supply, so they keep working."],
          ["EMS-Flow", "EDS software for commissioning area velocity sensors. A five-step wizard sets pipe profile, level, velocity calibration and logging mode, then reads every setting back to confirm it."],
        ],
      },
    ],
    related: ["auditing-calibration", "network-assessment", "equipment-rental"],
    products: ["eds", "hach-flow", "dynaflox"],
    downloads: [["resources.html#downloads", "Software, drivers and manuals"], [localDoc("eds-ems-flow-user-manual.pdf"), "EMS-Flow software user manual"]],
  },
];

/* ------------------------------------------------------------------ */
/* Solutions (the old site's "Applications")                           */
/* ------------------------------------------------------------------ */
export const solutions = [
  {
    slug: "structure-performance",
    tags: ["One score, 0 to 1000", "Alarms on change"],
    title: "Structure Performance & Monitoring",
    icon: "landmark",
    summary: "24/7 condition scoring of critical structures with the EDS Asset Score (EAS).",
    description: "24/7 condition monitoring of critical structures with the EDS Asset Score: one number from 0 to 1000, and alarms to the right people when it changes.",
    intro: [
      "A structure can change faster than an annual inspection will catch. We've delivered detailed condition reports on critical assets for Australia's largest industries, and we offer the products and service to report condition in real time.",
      "At its heart is the patent-pending EDS Asset Score (EAS): one number from 0 to 1000, recorded around the clock. It tells you how a structure is doing and whether it's changing. When something shifts, the people responsible hear about it as soon as possible.",
      "Every job is different, from buildings to hydraulic assessments. On one government asset, we fitted light, moisture, seismic and temperature sensors at critical points, for 24/7 monitoring and evaluation.",
      "The score's history can also raise alarms on a trigger you set. If any reading moves more than 5% in 60 minutes, say, site managers and key stakeholders are alerted.",
    ],
    blocks: [
      {
        heading: "How the EDS Asset Score works",
        items: [
          ["Sensors chosen for the structure", "Light, moisture, seismic and temperature sensors, or whatever combination the asset needs, placed at critical structure points."],
          ["One score from 0 to 1000", "EDS algorithms combine the readings into a single score of condition and change, recorded around the clock."],
          ["Alarms on change", "Triggers set on the score's history, such as any monitored parameter moving more than 5% in 60 minutes."],
          ["The right people told", "Site managers and key stakeholders alerted as soon as possible to any change."],
        ],
      },
      {
        heading: "Where it applies",
        list: [
          "Buildings and critical structures",
          "Government and corporate assets",
          "Hydraulic assessments",
          "Facilities managed under an EDS facility management service",
        ],
      },
    ],
    widget: "eas",
    related: ["asset-network-assessment", "environmental-monitoring"],
  },
  {
    slug: "asset-network-assessment",
    diagram: "scatter",
    tags: ["Blockages and sediment", "Cross connections"],
    title: "Asset & Network Assessment",
    icon: "scan-search",
    summary: "Catch blockages, structural defects and cross connections early, and see where to spend first.",
    description: "Network assessments that catch blockages, structural defects and cross connections early, and map inflow across catchments so you know where to spend.",
    intro: [
      "A deteriorating network rarely fails all at once. Long before anything fails outright, it starts costing more to run, in staff time and maintenance.",
      "Regular assessments from EDS catch that slide early and keep your network performing at its best.",
      "Accurate flow data shows far more than inflow. At one regional council, a sudden shift between depth and velocity revealed a partial blockage in a rising main, and CCTV confirmed the debris.",
    ],
    blocks: [
      {
        heading: "What we look for",
        items: [
          ["Blockages and sediment", "A steady rise in depth with no rain to explain it, found and cleared before the next storm."],
          ["Structural defects", "Depth anomalies that point to sags, displaced joints and infiltration points."],
          ["Cross connections", "Overnight flow in dry weather, or a rainfall response a residential catchment shouldn't have."],
          ["Where to spend", "Inflow severity mapped across catchments, so inspections and rehabilitation go where they're needed."],
        ],
      },
      {
        heading: "How we assess",
        list: [
          "Flow and depth monitoring at hydraulically sound sites",
          "Temperature studies to locate where water enters",
          "Level alarms on lines at risk of blockage or overflow",
          "Validated analysis, and a report with priorities and costs",
          "Monitoring repeated after the works, to confirm the result",
        ],
      },
    ],
    related: ["structure-performance", "network-thermal-monitoring"],
  },
  {
    slug: "network-thermal-monitoring",
    diagram: "thermal",
    tags: ["Up to 125 sensors", "± 0.1 °C"],
    title: "Network Thermal Monitoring",
    icon: "thermometer",
    summary: "Temperature studies that find exactly where water gets into a pipe, in water and wastewater networks alike.",
    description: "Temperature studies that pinpoint where water gets into a pipe, with Beadedstream cables of up to 125 sensors, in water and wastewater networks alike.",
    intro: [
      "Water getting into a pipe is usually a different temperature from what's already in it. Our temperature studies use that difference to find exactly where it gets in. They work in water, wastewater and most other piped networks, pressurised or not.",
      "It's a growing practice in network assessment: accurate, low cost, and able to pinpoint each source.",
    ],
    blocks: [
      {
        heading: "How it works",
        items: [
          ["A string of sensors", "Up to 125 temperature sensors spaced along one cable and laid in the pipe, through existing manholes."],
          ["A flow meter alongside", "An open channel flow meter measures the volume the network is carrying at the same time."],
          ["Located and measured", "When a defect lets water in, the nearest sensors change and the flow meter records the extra water. You get the location and the amount."],
        ],
      },
      {
        heading: "The equipment",
        items: [
          ["Beadedstream Digital Temperature Cable", "Up to 750 m long with up to 125 sensors, accurate to ± 0.1 °C between −10 and 30 °C. IP68, and rated to 3.5 MPa fluid pressure."],
          ["Loggers for remote sites", "The Beadedstream D605 reports by two-way Iridium satellite, pole to pole, with four cable ports for up to 500 sensors."],
          ["Into your systems", "The Beadedstream MLink converts a temperature cable to Modbus or JSON over RS-485 for other loggers and SCADA."],
        ],
      },
    ],
    related: ["asset-network-assessment", "wastewater-monitoring"],
    productLinks: ["beadedstream"],
  },
  {
    slug: "wastewater-monitoring",
    tags: ["Our founding focus", "No capital outlay with DaaS"],
    title: "Wastewater Monitoring",
    pageTitle: "Wastewater Flow & Quality Monitoring | EDS",
    icon: "droplets",
    summary: "Flow and quality monitoring, from a single EC point to thousands of deployed field instruments.",
    description: "Wastewater flow and quality monitoring from Australia's largest service contractor for water and wastewater studies, from one EC point to thousands.",
    intro: [
      "Flow and quality monitoring for the wastewater industry is where EDS began, and decades later it's still the heart of what we do.",
      "Today we're Australia's largest service contractor for water and wastewater monitoring studies, short and long term.",
      "Whatever you need to measure, we have the equipment and the people, from a single EC point to thousands of instruments reporting in real time.",
    ],
    blocks: [
      {
        heading: "What we monitor",
        items: [
          ["Flow", "Area velocity flow meters in sewers and channels, including the Detectronic MSFM, EDS E-Flow 3 and the Hach range."],
          ["Level and alarms", "Radar and pressure level sensors, and self-contained alarms that warn of blockages and surcharges."],
          ["Quality", "pH, EC, turbidity and multi-parameter sensors, and Aquamonitrix for nitrate and nitrite."],
          ["Sampling", "ORI and MicroLevel automatic samplers, for purchase or hire."],
          ["Rainfall", "Tipping bucket rain gauges in the catchments we monitor."],
          ["Data", "Every reading in EDS FlowSense, with alarms by email and SMS, and feeds to your own systems."],
        ],
      },
      {
        heading: "Programs of every length",
        list: [
          "Short-term studies for inflow and infiltration and model calibration",
          "Long-term monitoring that tracks performance across seasons",
          "Permanent monitoring stations, installed and maintained by EDS",
          "Managed monitoring as Data as a Service, with no capital outlay",
        ],
      },
    ],
    figure: { photo: "treatment-plant-aerial", alt: "Aerial view of a circular clarifier at a wastewater treatment plant, its walkway reaching the centre, beside a channel across the grass", caption: "From the network to the plant: flow and quality monitored at every stage of treatment." },
    related: ["automatic-sampling", "environmental-monitoring"],
    productLinks: ["detectronic", "hach-flow", "aquamonitrix"],
  },
  {
    slug: "automatic-sampling",
    diagram: "sampling",
    tags: ["Intrinsically safe", "Buy or hire"],
    title: "Automatic Sampling",
    pageTitle: "Automatic Water & Wastewater Sampling | EDS",
    icon: "flask-conical",
    summary: "Australia's widest range of automatic water and wastewater samplers, for sale or hire.",
    description: "Australia's widest range of automatic water and wastewater samplers, including the only true intrinsically safe sampler in the country. Buy or hire.",
    intro: [
      "EDS has the widest range of automatic water and wastewater samplers in Australia, and supplies the only true intrinsically safe sampler in the country.",
      "Buy the setup your site needs, or hire one for a short study or a long program.",
    ],
    blocks: [
      {
        heading: "Suitable for",
        list: [
          "Water, stormwater and surface water sampling",
          "River and bore sampling",
          "Catchment monitoring",
          "Process water monitoring",
          "Product sampling for quality verification",
          "Wastewater and pretreatment sludge sampling",
          "Monitoring of sewer systems",
        ],
      },
      {
        heading: "Choosing the right sampler",
        items: [
          ["Hazardous area", "The site's hazardous area classification, and the ATEX and IECEx approval it needs."],
          ["Sample type", "Spot, timed or composite samples, and how many bottles."],
          ["Time or flow", "Time-proportional or flow-proportional sampling."],
          ["Refrigeration", "Whether samples must be refrigerated until collection."],
          ["Power", "Battery or mains power, and how long the sampler must run unattended."],
          ["Telemetry", "Whether readings and alarms need to be sent by telemetry."],
        ],
      },
    ],
    related: ["wastewater-monitoring", "environmental-monitoring"],
    productLinks: ["ori", "microlevel"],
  },
  {
    slug: "environmental-monitoring",
    tags: ["Rivers, drains, surface water", "Every stage of a project"],
    title: "Environmental Monitoring",
    icon: "trees",
    summary: "Water quality, rainfall, temperature and sampling, designed around your project, from the baseline to compliance.",
    description: "Water quality, rainfall, temperature and sampling designed around your project, to set the baseline, assess the impacts and demonstrate compliance.",
    intro: [
      "Every environmental project has its own questions. We work with you to design monitoring around them, drawing on decades on the toughest sites.",
      "Accurate, reliable data shows you the environment you work in, and your effect on it.",
      "It matters at every stage, from guiding the design to showing compliance.",
    ],
    blocks: [
      {
        heading: "Data for every stage of a project",
        steps: true,
        list: [
          "Guide the design",
          "Establish the baseline",
          "Predict and assess the impacts",
          "Validate mitigation and management procedures",
          "Demonstrate compliance",
        ],
      },
      {
        heading: "What we measure",
        items: [
          ["Water quality", "Multi-parameter sondes and sensors for rivers, stormwater and surface water, and Aquamonitrix for nitrate and nitrite."],
          ["Rainfall", "Tipping bucket rain gauges, logged at short intervals so storm peaks are captured."],
          ["Temperature", "Beadedstream loggers and temperature cables for air, soil and water, proven in the extremes of Alaska."],
          ["Sampling", "Automatic samplers for river, bore, stormwater and catchment programs."],
        ],
      },
    ],
    figure: { photo: "stormwater-culvert", alt: "A sensor cable running into a concrete stormwater culvert with a shallow stream flowing out of it between rocks", caption: "A stormwater culvert fitted for monitoring. The same equipment suits rivers, drains and surface water." },
    related: ["wastewater-monitoring", "automatic-sampling"],
    productLinks: ["eds", "beadedstream", "aquamonitrix"],
  },
];

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */
// `docs` on a product is downloadable from its card; the brand page's
// Documents panel lists those plus any brand-wide `docs`.
// The network work leads the solutions (index, menu, footer and form): it is
// where EDS began and what most visitors come for.
const SOLUTION_ORDER = ["wastewater-monitoring", "asset-network-assessment", "network-thermal-monitoring", "automatic-sampling", "environmental-monitoring", "structure-performance"];
solutions.sort((a, b) => SOLUTION_ORDER.indexOf(a.slug) - SOLUTION_ORDER.indexOf(b.slug));

export const brands = [
  {
    slug: "eds",
    name: "EDS",
    title: "EDS Instruments",
    pageTitle: "EDS Data Loggers, Sensors & Pump Station Manager",
    icon: "cpu",
    tag: "Designed and built by EDS",
    summary: "Data loggers, sensors and the Pump Station Manager, manufactured by EDS.",
    description: "Data loggers, sensors and the Pump Station Manager, designed and built by EDS, including the 4G Hawk and Metalog loggers and the E-Flow 3 sewer flow meter.",
    cover: img("e-flow-3.png"),
    intro: [
      "We design and build our own instruments, and represent leading manufacturers, across water supply, wastewater, flow monitoring and process control. Buy an EDS instrument, and the people who designed it are the people who support it.",
      "We make the EMS “D” Series loggers, the Pump Station Manager that launched the company in 1991, the 4G Hawk and Metalog loggers, the E-Flow 3 sewer flow meter and the Sensor Fort sensor mount for gravity sewers. We also make data loggers for the Bureau of Meteorology, under contract.",
    ],
    groups: [
      {
        name: "Data loggers",
        items: [
          { name: "Hawk", type: "logger", note: "Battery-powered 4G sewer logger", image: img("hawk.png"), href: "products/hawk.html", docs: [{ label: "Datasheet", href: localDoc("eds-hawk-datasheet.pdf") }, { label: "Brochure", href: localDoc("eds-hawk-brochure.pdf") }] },
          { name: "Metalog 4G", type: "logger", note: "4G logger for 4 to 20 mA and Modbus instruments", image: img("metalog-4g.png"), href: "products/metalog-4g.html", docs: [{ label: "Datasheet", href: localDoc("eds-metalog-4g-datasheet.pdf") }, { label: "Brochure", href: localDoc("eds-metalog-4g-brochure.pdf") }] },
          { name: "iLab Sonde", type: "quality", note: "Multi-parameter handheld", image: img("ilab-and-sensor.jpg") },
          { name: "EPM-2", type: "logger", note: "Portable 4G pressure logger", image: img("epm-2.png") },
          { name: "EMS-003", type: "logger", note: "Dual-channel logger", image: img("003d.jpg") },
          { name: "EMS-050D", type: "logger", note: "Multi-channel logger", image: img("050d.jpg") },
          { name: "Pump Station Manager", type: "logger", note: "PSM, the EDS flagship since 1991", image: img("psm.jpg") },
        ],
      },
      {
        name: "Sensors",
        items: [
          { name: "E-Flow 3", type: "flow", note: "Dual-mode sewer flow meter", image: img("e-flow-3.png"), href: "products/e-flow-3.html", docs: [{ label: "Datasheet", href: localDoc("eds-e-flow-3-datasheet.pdf") }, { label: "Brochure", href: localDoc("eds-e-flow-3-brochure.pdf") }] },
          { name: "iLab 901", type: "quality", note: "Multi-parameter water quality sonde", image: img("ilab-901.png"), href: "products/ilab-901.html", docs: [{ label: "Datasheet", href: localDoc("eds-ilab-901-datasheet.pdf") }] },
          { name: "Sensor Fort", type: "quality", note: "Sensor mount for gravity sewers", image: img("sensor-fort.png"), href: "products/sensor-fort.html", docs: [{ label: "Datasheet", href: localDoc("eds-sensor-fort-datasheet.pdf") }, { label: "Brochure", href: localDoc("eds-sensor-fort-brochure.pdf") }] },
          { name: "Ultrasonic Level", type: "level", note: "Level sensor", image: img("ultrasonic-level-sensor-image-2.png") },
          { name: "EC", type: "quality", note: "Electro-conductivity sensor", image: img("cos41.jpg") },
          { name: "pH", type: "quality", note: "pH sensor", image: img("eds-ph-sensor.jpg") },
          { name: "Turbidity", type: "quality", note: "Turbidity sensor", image: img("turbidity-sensor.jpg") },
        ],
      },
    ],
  },
  {
    slug: "detectronic",
    name: "Detectronic",
    title: "Detectronic",
    pageTitle: "Detectronic Flow Meters & Level Monitors in Australia | EDS",
    icon: "radar",
    tag: "Sewer and wastewater network monitoring",
    summary: "Ultrasonic flow, level and water quality instruments engineered for sewer networks.",
    description: "Detectronic ultrasonic flow, level and water quality instruments for sewer networks, including the MSFM and LIDoTT, supplied and installed by EDS.",
    logo: img("detectronic-logocolour.png"),
    cover: img("detectronic-msfm-s2-lidott.png"),
    coverName: "MSFM flow meter and LIDoTT level sensor",
    intro: [
      "Detectronic specialises in sewer and wastewater network monitoring: measuring, recording, reporting and reacting to depth and flow.",
      "It designs and makes ultrasonic flow, level and water quality instruments for sewers, wastewater systems and trade waste.",
      "Its flow meters support early flood detection, I&I assessment, combined sewer overflow (CSO) monitoring and smart sewer networks, in short studies and long-term programs.",
      "We supply and install Detectronic instruments across Australia and run them in our own fleet, so the advice comes from people who install them.",
    ],
    blocks: [
      {
        heading: "Across the range",
        lede: "Every instrument here is ATEX and IECEx certified for Zone 0, the most hazardous classification, and built for the sewer.",
        items: [
          ["MSFM S2.5T flow meter", "Velocity 0.03 to 4.00 m/s and depth to 3.5 m, logging every 1 to 60 minutes. More than 15 weeks on one battery at 2-minute logging. Can pulse a sampler for flow-proportional sampling."],
          ["LIDoTT Sensor", "Ultrasonic level to 1.5 m, accurate to ± 2 mm. Switches to pressure, up to 10 m, when the chamber surcharges."],
          ["LIDoTT R", "Radar level to 7 m, accurate to ± 5 mm, with pressure to 10 m: up to 17 m in total with zero deadband."],
          ["LIDoTT Smart logger", "Logs every 2 to 15 minutes and reports every 5 minutes to 24 hours over 4G LTE-M1 or NB-IoT. Battery life of up to seven years."],
          ["Alarm2", "Radar level from 0 to 20 m with no deadband. High and low, rate of change and profile alarms. Typical battery life of five years or more."],
          ["LIDoTT Alarm", "Sensor, battery, modem and antenna in one device, measuring to 8.4 m with three alarm states."],
        ],
      },
    ],
    groups: [
      {
        name: "Flow, level and logging",
        items: [
          { name: "MSFM S2.5T", type: "flow", note: "Rugged 4G area velocity flow meter", image: img("s2.5-04-small-766x1024.png"), docs: [{ label: "Datasheet", href: localDoc("detectronic-msfm-s2-5t-datasheet.pdf") }, { label: "Manual", href: localDoc("detectronic-msfm-s2-5t-manual.pdf") }] },
          { name: "LIDoTT Smart", type: "level", note: "LIDoTT Sensor and Smart logger: a long-life, rugged, patented 4G level monitor", image: img("dete01-01.24-600x452.png"), docs: [{ label: "LIDoTT Sensor datasheet", href: localDoc("detectronic-lidott-sensor-datasheet.pdf") }] },
          { name: "LIDoTT Alarm", type: "level", note: "Self-contained level measurement and alarm device", image: img("lidott-alarm-3.png"), href: "products/lidott-alarm.html", docs: [{ label: "Datasheet", href: localDoc("detectronic-lidott-alarm-datasheet.pdf") }] },
          { name: "Alarm2", type: "level", note: "All-in-one radar level monitor with alarms, up to 20 m, LoRaWAN or 4G", image: img("detectronic-alarm2.png"), href: "products/alarm2.html", docs: [{ label: "Datasheet", href: localDoc("detectronic-alarm2-datasheet.pdf") }, { label: "4G manual", href: localDoc("detectronic-alarm2-4g-manual.pdf") }] },
          { name: "LIDoTT R", type: "level", note: "High-precision radar and pressure sensor for continuous monitoring", image: img("lidott-sensor-r-1.png"), docs: [{ label: "Datasheet", href: localDoc("detectronic-lidott-r-datasheet.pdf") }] },
          { name: "2 Channel Data Logger", type: "logger", note: "GPRS logger for pulse output water meters, with optional pressure to 200 m and alarms on each channel", image: img("new-2-channel-logger-1001x1024.jpg"), docs: [{ label: "Datasheet", href: localDoc("detectronic-msfm-gprs-2-channel-data-logger-datasheet.pdf") }] },
        ],
      },
    ],
  },
  {
    slug: "ori",
    name: "ORI",
    title: "ORI Samplers",
    pageTitle: "ORI ATEX & IECEx Certified Samplers in Australia | EDS",
    icon: "flask-conical",
    tag: "ATEX and IECEx certified sampling",
    summary: "Rugged mobile and stationary samplers from the maker recognised as the world leader in certified sampling systems.",
    description: "ORI mobile and stationary samplers from the maker recognised as the world leader in ATEX and IECEx certified sampling, brought to Australia by EDS.",
    logo: img("ori-logo.png"),
    intro: [
      "EDS represents ORI in Australia. Over a long partnership, we've put its rugged, reliable samplers to work in the field.",
      "ORI has made sampling, measuring and laboratory equipment for over 60 years. Still 100% family owned, it's recognised as the world's leading maker of ATEX and IECEx certified sampling systems.",
      "ORI samplers come with one of two controls: BASIC, for simple programs, or NEMO, which adds logging, telemetry and control.",
    ],
    blocks: [
      {
        heading: "Choosing an ORI sampler",
        items: [
          ["NEMO 1 M", "Approved under ATEX and IECEx for Zones 1 and 2. Up to 10 digital and 2 analogue sensors such as pH, conductivity, oxygen and level, 8 GB of memory and an optional LTE modem. Peristaltic (PP), vacuum (V) and hybrid (H) pumps."],
          ["AquaSamp Mini", "Spot and timed sampling with 6 m suction lift and up to 144 samples per charge, at 4.1 kg with its battery. IP65, with an ATEX version available."],
          ["PumpModul", "Event-triggered: started by a contact such as a push-button, an RS485 command or an ORI Mlog logger. ATEX approved for Zone 1, or as a standard version."],
          ["BASIC mobil", "Battery-powered mobile samplers for hazardous Zones 1 and 2, with a version that actively cools 35 litres of sample."],
        ],
      },
    ],
    groups: [
      {
        name: "Mobile samplers",
        items: [
          { name: "AquaSamp Mini", type: "sampling", note: "Portable sampler, up to 144 samples per charge", image: img("aquasamp-mini-teaser.png"), docs: [{ label: "Brochure", href: localDoc("ori-aquasamp-mini-brochure.pdf") }] },
          // One datasheet covers all three NEMO 1 M versions.
          { name: "NEMO 1 MH", type: "sampling", note: "ATEX Zone 1 mobile sampler, hybrid pump", image: img("nemo-1-mh.png"), docs: [{ label: "Datasheet", href: localDoc("ori-nemo-1-m-datasheet.pdf") }] },
          { name: "NEMO 1 M PP", type: "sampling", note: "ATEX Zone 1 mobile sampler, peristaltic pump", image: img("csm-nemo1-m-pp-6a7052503d.png"), docs: [{ label: "Datasheet", href: localDoc("ori-nemo-1-m-datasheet.pdf") }] },
          { name: "NEMO 1 M V", type: "sampling", note: "ATEX Zone 1 mobile sampler, vacuum pump", image: img("csm-nemo1-m-vac-6a5f2d98ac.png"), docs: [{ label: "Datasheet", href: localDoc("ori-nemo-1-m-datasheet.pdf") }] },
          { name: "BASIC mobil", type: "sampling", note: "Battery-powered sampler for hazardous zones", image: img("basic-mobil.png") },
        ],
      },
      {
        name: "Measuring technology",
        items: [
          { name: "Mlog", type: "logger", note: "Multitool logger", image: img("mlog-multitool-logger-gps-01.jpg") },
          { name: "Mlog Z2", type: "logger", note: "ATEX and IECEx", image: img("atex-mlog.jpg") },
          { name: "iLink", type: "software", note: "1-wire Bluetooth", image: img("ilink.jpg") },
          { name: "X-zone Com", type: "gas", note: "Gas monitoring", image: img("x-zone-com.jpg") },
          { name: "Optical", type: "quality", note: "Optical sensors", image: img("ori-optical.png") },
        ],
      },
    ],
    docs: [{ label: "ORI water analytics catalogue", href: localDoc("ori-water-analytics-catalogue.pdf") }, { label: "PumpModul datasheet", href: localDoc("ori-pumpmodul-datasheet.pdf"), pageOnly: true }],
  },
  {
    slug: "hach-flow",
    name: "Hach Flow",
    title: "Hach Flow",
    pageTitle: "Hach Flow Meters, Loggers & Sensors in Australia | EDS",
    icon: "gauge",
    tag: "Open channel flow measurement",
    summary: "Loggers and sensors from Hach, including the Sigma and Marsh-McBirney legacy lines.",
    description: "Hach flow loggers and sensors, including the FL900, FL1500, Flo-Dar and the Sigma and Marsh-McBirney lines. Supplied by EDS since the 1990s.",
    intro: [
      "Hach Flow, with its legacy brands Sigma and Marsh-McBirney, has a long record of innovation and accuracy in open channel flow measurement. We've supplied the range since the Marsh-McBirney days in the 1990s.",
      "Hach meters collect flow data and get it to you reliably, for fixed, portable, permanent or temporary use. Sensors range from non-contact types above the flow, which limit fouling, to rugged submerged AV sensors.",
    ],
    blocks: [
      {
        heading: "Choosing a Hach system",
        lede: "Based on Hach's own selection guide. We can help you match the system to the site.",
        items: [
          ["Non-contact", "A flow logger with the Flo-Dar sensor: radar velocity and ultrasonic level from above the flow. Hach's most versatile option, it limits fouling and avoids confined space entry after installation."],
          ["Submerged area velocity", "Doppler velocity and pressure level from a sensor in the flow, for a wide range of conditions. The Flo-Tote 3 suits very clean water and low velocities or levels."],
          ["Ultrasonic level", "Down-looking sensors for flumes and weirs, and an in-pipe sensor that removes the ultrasonic deadband in near full pipes."],
          ["Redundant level", "A submerged AV sensor with an in-pipe ultrasonic sensor, for billing and overflow monitoring."],
          ["Permanent power", "The Flo-Station with Flo-Dar, with four 4–20 mA outputs to SCADA, or a Sigma 950 with a submerged AV sensor."],
          ["Process control and spot checks", "The SC200 controller takes one or two ultrasonic sensors and has a weir and flume library. The FH950 handheld meter covers spot checks and stream gauging."],
        ],
      },
    ],
    groups: [
      {
        name: "Loggers",
        items: [
          { name: "FL1500 Logger", type: "flow", image: img("landing-fl1500-2.jpg"), docs: [{ label: "FSDATA Desktop 32-bit", href: localDoc("hach-flow-fsdata-desktop-32bit.zip") }, { label: "FSDATA Desktop 64-bit", href: localDoc("hach-flow-fsdata-desktop-64bit.zip") }] },
          { name: "FH950 Velocity Meter", type: "flow", note: "Handheld meter for spot checks and stream gauging", image: img("hach-fh950.jpg") },
          { name: "FL900 Portable", type: "flow", note: "Flow logger at the core of most Hach systems", image: img("landing-fl900-2.jpg") },
          { name: "SC200 Controller", type: "flow", note: "Controller for ultrasonic level and process control", image: img("landing-sc200.jpg") },
          { name: "Flo-Station", type: "flow", note: "Mains-powered flow monitor for Flo-Dar", image: img("landing-flo-station.jpg") },
        ],
      },
      {
        name: "Sensors",
        items: [
          { name: "Flo-Dar", type: "flow", note: "Non-contact radar velocity and ultrasonic level", image: img("landing-flo-dar-1.jpg") },
          { name: "Sub AV Sensor", type: "flow", note: "Submerged Doppler velocity and pressure level", image: img("landing-sigma-av.jpg") },
          { name: "Flo-Tote 3", type: "flow", note: "Submerged AV for clean water and low flows", image: img("landing-flo-tote.jpg") },
          { name: "AV Flow Sensor with Bubbler", type: "flow", note: "Submerged AV with bubbler level", image: img("landing-sigma-av-bubbler.jpg") },
          { name: "Ultrasonic Sensors", type: "flow", note: "Non-contact level for flumes, weirs and pipes", image: img("landing-sigma-ultrasonic.jpg") },
        ],
      },
    ],
    docs: [{ label: "Hach Flow selection guide", href: localDoc("hach-flow-selection-guide.pdf") }],
  },
  {
    slug: "beadedstream",
    name: "Beadedstream",
    title: "Beadedstream",
    pageTitle: "Beadedstream Temperature Loggers in Australia | EDS",
    icon: "thermometer",
    tag: "Temperature data logging",
    summary: "Temperature loggers, thermistor strings and cloud data, proven in the extremes of Alaska.",
    description: "Beadedstream temperature loggers, thermistor strings and cloud data, proven in Alaska. EDS lays the cables in sewers to find where groundwater gets in.",
    logo: img("logo-dark.png"),
    intro: [
      "We represent Beadedstream, whose loggers, sensors and data systems measure air, soil and water temperature in the toughest places.",
      "Its reputation for reliability was earned in the extremes of Alaska, on research, industrial and remote sites.",
      "In sewers, we lay Beadedstream cables alongside flow meters to find where groundwater gets in.",
    ],
    blocks: [
      {
        heading: "The range at a glance",
        items: [
          ["Digital Temperature Cable", "Made to length, up to 750 m with up to 125 sensors, accurate to ± 0.1 °C between −10 and 30 °C. IP68, rated to 3.5 MPa fluid pressure."],
          ["D605 logger", "Two-way Iridium satellite, pole to pole. Four cable ports for up to 500 sensors, and more than six months on battery without sun when reporting daily."],
          ["MLink", "Moulded in line with the cable at the factory, it converts temperature readings to Modbus or JSON over RS-485 for other loggers and SCADA."],
          ["Spot Logger", "A battery-powered logger with a D-size lithium battery you can replace. Swipe a magnet to check its status."],
        ],
      },
    ],
    groups: [
      {
        name: "Product range",
        items: [
          { name: "D605", type: "temperature", note: "Satellite logger for temperature cables", image: img("front-view-of-beadedstream-d605-temperature-data-logger-without-antenna.png"), docs: [{ label: "Datasheet", href: localDoc("beadedstream-d605-datasheet.pdf") }] },
          { name: "Spot Logger", type: "temperature", note: "Battery-powered temperature logger", image: img("spot-logger-side-view-with-raymo-connector.png"), docs: [{ label: "Battery install and replacement guide", href: localDoc("beadedstream-spot-logger-battery-guide.pdf") }] },
          { name: "Digital Temperature Cable", type: "temperature", note: "Thermistor string with up to 125 sensors on one cable", image: img("standard-dtc-bar-code-144-1.jpg"), docs: [{ label: "Spec sheet", href: localDoc("beadedstream-digital-temperature-cable-spec-sheet.pdf") }, { label: "EDS white paper", href: localDoc("eds-white-paper-thermistor-strings.pdf") }] },
          { name: "MLink", type: "software", note: "Temperature cables to Modbus or JSON", image: img("beadedstream-mlink-temperature-data-logger-connector.png"), docs: [{ label: "Spec sheet", href: localDoc("beadedstream-mlink-spec-sheet.pdf") }] },
          { name: "Capture Mobile App", type: "software", note: "Mobile app for Beadedstream loggers", image: img("beadedstream-capture-ios-app-1.png") },
          { name: "Beadedcloud Data", type: "software", note: "Cloud data for Beadedstream loggers", image: img("beadedcloud-dashboard-in-all-devices-1.png") },
        ],
      },
    ],
  },
  {
    slug: "microlevel",
    name: "MicroLevel",
    title: "MicroLevel Samplers",
    pageTitle: "MicroLevel Composite Samplers in Australia | EDS",
    icon: "test-tubes",
    tag: "Composite samplers",
    summary: "Portable, permanent and refrigerated composite samplers for wastewater and process liquids.",
    description: "MicroLevel MICROSAMPLER composite samplers: the portable 10P, fixed 10B and refrigerated 10R, for wastewater, drains, manholes and process liquids.",
    intro: [
      "The MicroLevel MICROSAMPLER range takes composite samples from wastewater, factory drains and manholes, water channels and any liquid that needs testing.",
      "The portable 10P goes where you need it. The fixed 10B suits industrial wastewater, manholes, streams and channels. The refrigerated 10R keeps samples cool until collection.",
      "We supply MicroLevel alongside ORI, and we're happy to advise on what suits your site.",
    ],
    groups: [
      {
        name: "MICROSAMPLER range",
        items: [
          { name: "MICROSAMPLER 10P", type: "sampling", note: "Portable composite sampler for wastewater, factory drains, manholes and water channels", image: img("6d2b2a76351a2d8f5edefdcc12c5ea49.png") },
          { name: "MICROSAMPLER 10B", type: "sampling", note: "Fixed composite sampling unit for industrial wastewater, manholes, streams and channels", image: img("0d15002ac7d0c03f9837eecc2143e2ce.png") },
          { name: "MICROSAMPLER 10R", type: "sampling", note: "Stationary refrigerated composite sampling unit", image: img("4830446c6b2ce4c663ab9e4c3a0b1c51.png") },
        ],
      },
    ],
  },
  {
    slug: "aquamonitrix",
    name: "Aquamonitrix",
    title: "Aquamonitrix",
    pageTitle: "Aquamonitrix Nitrate & Nitrite Analyser | EDS",
    icon: "flask-round",
    tag: "Nitrate and nitrite analyser",
    summary: "Real-time nitrate and nitrite measurement with laboratory accuracy in the field.",
    description: "Aquamonitrix measures nitrate and nitrite in the field in real time, with laboratory accuracy, and handles wastewater without sample pre-treatment.",
    logo: img("aquamonitrix-logo.png"),
    intro: [
      "Aquamonitrix brings laboratory accuracy for nitrate and nitrite into the field. It measures raw, process and effluent water in real time, and sends results straight to your SCADA or telemetry and to its own Datamonitrix platform.",
      "Its calibration stays stable over long deployments, with little need for intervention. It can be running within a couple of hours, and it's easy to operate and service, which keeps costs low.",
      "It measures nitrate and nitrite from one sample. It's portable, and its built-in sample system handles wastewater with no pre-treatment or costly add-ons.",
    ],
    blocks: [
      {
        heading: "Performance",
        items: [
          ["Nitrate", "Up to 500 ppm as NO₃, with a detection limit of 1.5 ppm as NO₃ (0.34 ppm as N)."],
          ["Nitrite", "Up to 100 ppm as NO₂, with a detection limit of 0.25 ppm as NO₂ (0.08 ppm as N)."],
          ["Method", "Ion chromatography with optical detection, measuring as often as every 15 minutes."],
          ["Service interval", "More than 600 sampling runs between services: over three months at six samples a day."],
          ["Integration", "Modbus over RS232 or RS485 to SCADA and telemetry, in an IP65 enclosure weighing 12 kg."],
        ],
      },
    ],
    groups: [
      {
        name: "The analyser",
        items: [
          { name: "Aquamonitrix", type: "quality", note: "Nitrate and nitrite, rugged and portable", image: img("aquamonitrix-analyser.jpg"), docs: [{ label: "Performance datasheet", href: localDoc("aquamonitrix-performance-datasheet.pdf") }] },
        ],
      },
    ],
  },
  {
    slug: "dynaflox",
    name: "Dynaflox",
    title: "Dynaflox",
    pageTitle: "Dynaflox Ultrasonic Water & Flow Meters | EDS",
    icon: "audio-waveform",
    tag: "Ultrasonic water and flow meters",
    summary: "Ultrasonic water meters and flow meters to ISO and AWWA standards.",
    description: "Dynaflox ultrasonic water meters and flow meters, made to ISO and AWWA standards. EDS supplies, installs and calibrates them for full pipe flow.",
    intro: [
      "Dynaflox (formerly Dynameters) has made ultrasonic water and flow meters since 1998.",
      "Its meters are made to ISO and AWWA standards and carry the CE mark. Its quality system is certified to ISO 9001:2008 and ISO 14001, and every meter is individually tested and inspected.",
      "We supply, install and calibrate Dynaflox meters for full pipes, from plant inlets to trade waste discharge.",
    ],
    groups: [
      {
        name: "Select your technology",
        items: [
          { name: "UltraD", type: "flow", image: img("i-ultrad.jpg") },
          { name: "Ultra F", type: "flow", image: img("ultrasonicbulk-2.jpg") },
          { name: "Insertion Flow Meter", type: "flow", image: img("hot-tapped.png") },
          { name: "3 in 1", type: "flow", image: img("p-3in1-bulk1.jpg") },
          { name: "UltraD Small", type: "flow", image: img("ultrad-small-1.png") },
          { name: "Clamp-on Flow Meter", type: "flow", note: "Ultrasonic, for full pipe flow", image: img("i-doppler-clamp.jpg") },
        ],
      },
    ],
  },
];

// What each product measures or does. Every product above carries one `type`,
// which drives the instrument finder on the products page and search.
export const productTypes = [
  { id: "flow", label: "Flow", icon: "waves" },
  { id: "level", label: "Level", icon: "ruler" },
  { id: "quality", label: "Water quality", icon: "droplet" },
  { id: "sampling", label: "Sampling", icon: "test-tubes" },
  { id: "logger", label: "Data loggers", icon: "hard-drive" },
  { id: "temperature", label: "Temperature", icon: "thermometer" },
  { id: "software", label: "Connectivity and apps", icon: "smartphone" },
  { id: "gas", label: "Gas detection", icon: "wind" },
];

// The illustrations drawn by diagrams.mjs, each on the page that names it
// with `diagram`. They show how a method works, not a real site, and every
// caption says so. `labels` are the words in the drawing (kept short: they
// grow a step on phones), `alt` describes the whole drawing for screen
// readers, and two-panel drawings take `panels` and a `legend`.
export const diagrams = {
  thermal: {
    alt: "Illustration of a sewer in section between two manholes. A thermistor string runs along the invert from a logger, and a flow meter sits at the downstream manhole. Groundwater seeps in through a cracked joint, and a chart beneath shows the temperature along the pipe changing at the sensors nearest the crack.",
    caption: "Illustration: a thermistor string along the pipe and a flow meter downstream. The temperature changes at the sensors nearest the defect.",
    labels: { groundwater: "Groundwater", defect: "Defect", string: "Thermistor string", logger: "Logger", meter: "Flow meter", chart: "Temperature along the pipe", change: ["The sensors nearest", "the defect change"] },
  },
  wetwell: {
    alt: "Illustration of a sewage pump station in section. Sewage arrives from the network into the wet well, two pumps at the bottom lift it into the rising main, and the level rises and falls between the start and stop levels, below the surcharge and overflow levels. A LIDoTT R at the top of the well reads the level, the pump run signals go to the Pump Station Manager in a cabinet at the surface, and its readings go on to SCADA and EDS FlowSense.",
    caption: "Illustration: level from a LIDoTT R and pump runs from the Pump Station Manager, sent in real time to SCADA and EDS FlowSense.",
    labels: { overflow: "Overflow", surcharge: "Surcharge", start: "Start", stop: "Stop", main: "Rising main", radar: ["LIDoTT R", "Radar and pressure"], inlet: "From the network", pumps: "Pump run signals", manager: "Pump Station Manager", data: "To SCADA and EDS FlowSense" },
  },
  tradewaste: {
    alt: "Illustration of a trade waste discharge point. A drain runs from an industrial site to a sampling pit on its way to the sewer. In the pit a flow sensor sits on the invert and a quality probe hangs in the flow; beside it a sampler draws through a hose, and a logger with an antenna sends the readings on for reporting.",
    caption: "Illustration: flow, sampling and quality at one discharge point, with a logger sending the readings on for reporting.",
    labels: { site: "Your site", sewer: "To the sewer", data: "Data and reporting", sampling: "Sampling", quality: "Quality", flow: "Flow" },
  },
  scatter: {
    alt: "Illustration of a scattergraph of depth against velocity. Most readings follow one curve, the site's usual relationship, while a group of later readings sits well above it, deeper for the same velocity.",
    caption: "Illustration: a site's depth against its velocity. Readings that leave the usual relationship can point to a blockage, sediment or a structural defect, before anything fails outright.",
    labels: { velocity: "Velocity", depth: "Depth", usual: "The usual relationship", shift: ["A shift away from it", "can point to a blockage"] },
  },
  beforeafter: {
    alt: "Illustration of two hydrographs with comparable storms. Before the works, measured flow rises far above the dry weather flow pattern during and after the rain. After the works, it rises only a little above it.",
    caption: "Illustration: comparable storms before and after the works. After them, measured flow rises far less above dry weather flow.",
    panels: [["Before the works", ""], ["After the works", ""]],
    legend: [["rain", "Rainfall"], ["meas", "Measured flow"], ["dwf", "Dry weather flow"], ["band", "Inflow and infiltration"]],
  },
  sampling: {
    alt: "Illustration of one day's flow, with a storm in the afternoon, sampled two ways. Time-proportional sampling takes twelve samples evenly through the day. Flow-proportional sampling takes the same twelve, bunched where the flow is highest.",
    caption: "Illustration: one day's flow, sampled two ways. Sampling in proportion to flow puts more samples where more water passed. Detectronic MSFM flow meters can pulse a sampler to do it.",
    panels: [["Time-proportional", "A sample at set intervals"], ["Flow-proportional", "A sample for every set volume of flow"]],
    legend: [["meas", "Flow"], ["sample", "A sample taken"]],
  },
  eflowModes: {
    alt: "Illustration of E-Flow 3 at the top of a sewer pipe beside a manhole, in two conditions. In normal flow the pipe is partly full. One radar beam reaches the surface upstream for velocity, another reaches straight down for depth, and arrows show the velocity through the depth and its mean. In surcharge the pipe is full and water has risen up the manhole. An ultrasonic beam reaches into the water for velocity, the pressure transducer reads depth, and the radar stands by.",
    caption: "Illustration of E-Flow 3 at the top of the pipe, not to scale.",
    panels: [
      ["Normal flow: non-contact radar", "Nothing touches the water", [[1, "radar", "24 GHz Doppler radar reads surface velocity, corrected to mean velocity through the depth"], [2, "radar", "120 GHz radar reads depth from above the flow"]]],
      ["Surcharge: Doppler ultrasonic and pressure", "Measuring through the full water column", [[3, "us", "Dual 1 MHz Doppler ultrasonic reads velocity from particles carried in the flow"], [4, "us", "Sealed 316 stainless pressure transducer reads depth, to 10 m of surcharge"]]],
    ],
    legend: [["radar", "Radar beam"], ["us", "Ultrasonic beam"], ["profile", "Velocity through the depth"], ["mean", "Mean velocity"]],
    labels: { surface: "Surface velocity", profile: "Velocity profile", mean: "Mean", flow: "Flow", above: "Free surface present", full: "Pipe full: radar stands by", head: ["Pressure", "head"] },
  },
  eflowObvert: {
    alt: "Illustration of two sewer pipes in section. In the first, a conventional flow sensor sits on the invert, and rag, grease and silt carried by the flow have built up around it. In the second, E-Flow 3 sits at the obvert above the water, reading the surface by radar, while the same solids pass beneath it.",
    caption: "Illustration: where the sensor sits decides how often someone has to visit it.",
    panels: [
      ["A conventional sensor on the invert", "In the path of everything the sewer carries"],
      ["E-Flow 3 at the obvert", "Above the flow, and in the water only when the pipe runs full"],
    ],
    legend: [["solid", "Rag, grease and silt"], ["radar", "Radar beam"]],
    labels: { invert: "Sensor on the invert", fouled: ["Rag and grease build up,", "and the reading drifts"], obvert: "E-Flow 3 at the obvert", clear: ["Solids pass beneath,", "with nothing to foul"], flow: "Flow" },
  },
  eflowProfile: {
    alt: "Illustration in two parts. Along the pipe, E-Flow 3's velocity radar reads the water surface, and arrows show velocity through the depth, fastest near the surface and slowing to nothing at the bed. A dashed line marks the mean, and the depth radar measures the depth. Across the pipe, the wetted area below the surface is shaded by velocity, lighter where the water moves faster, with the depth marked.",
    caption: "Illustration: mean velocity times wetted area is flow, worked out in the sensor itself.",
    panels: [
      ["Velocity: from the surface through the depth", "What the radar reads, and the mean it gives"],
      ["Area: from depth and the pipe profile", "The wetted cross-section, shaded by velocity"],
    ],
    sum: [["v̄", "Mean velocity", "Radar 2 % of reading, ultrasonic 1 %"], ["A", "Wetted area", "From depth, 0.2 % of full scale ± 1 mm"], ["Q", "Flow", "Computed in the sensor"]],
    legend: [["radar", "Radar beam"], ["profile", "Velocity through the depth"], ["mean", "Mean velocity"]],
    labels: { surface: ["Surface velocity, read across", "the 24 GHz radar footprint"], mean: ["Corrected through the depth", "to mean velocity"], depth: ["Depth by", "120 GHz radar"], flow: "Flow", area: "Wetted area A", key: ["Slower", "Faster"] },
  },
  eflowXray: {
    alt: "Illustration of E-Flow 3 seen through its housing as it hangs from the top of the pipe. It shows the stainless mounting bracket, the composite housing, the potted electronics, the radar windows with their beams reaching the water, the ultrasonic face and pressure port on the nose, and the cable leaving towards the manhole. Numbered markers match the list beneath.",
    caption: "Illustration: how E-Flow 3 is built, seen through its housing. Not an engineering drawing.",
    items: [
      ["Obvert mounting sheds debris.", "Fixed to the pipe crown on an EDS bracket, out of the flow path, so material can't build up on the sensor face."],
      ["Tough composite housing.", "Alloy and engineering plastic composite that resists corrosion, impact and water."],
      ["Fully potted, sealed for life.", "The electronics are fully potted and unaffected by temperature cycling."],
      ["316 stainless where it's wet.", "A sealed 316 stainless steel pressure transducer reads depth to 10 m of surcharge."],
      ["Sealed ultrasonic face.", "Dual 1 MHz transducers sealed into the face. The bidirectional E-Flow 3 B also reports reverse flow."],
      ["Integral cable.", "Power and RS485 in one cable, sized to suit the manhole. Firmware updates run over it through an EDS logger."],
    ],
  },
  eflowInstall: {
    alt: "Four illustrations of one manhole, each adding the next part. First, E-Flow 3 is fitted at the top of the pipe from the manhole opening. Second, its cable is clipped up the shaft wall. Third, the logger hangs near the top of the shaft and reports over 4G. Fourth, a tablet at the surface commissions it through the logger.",
    caption: "Illustration: an E-Flow 3 installation, step by step, all from the surface.",
    steps: [
      ["Fit the sensor at the crown", "On an EDS bracket sized to the pipe, sensor face towards the incoming flow, from the manhole opening."],
      ["Run the cable up the shaft", "The integral cable is clipped to the shaft wall, its length specified to suit the manhole."],
      ["Hang the logger near the top", "The EDS logger powers and polls the sensor over RS485, and reports over 4G."],
      ["Commission from the surface", "Set up and verified with EMS-Flow through the logger, with no confined space entry."],
    ],
  },
  eflowCompare: {
    alt: "Illustration of one storm recorded by three kinds of flow meter. Each row shows the flow that actually passed as a dashed line, with the time the pipe ran full shaded. A non-contact radar alone records the flow until the pipe surcharges, then has a gap until the surface returns. A wetted sensor on the invert records through the surcharge, but its reading drifts low as rag and grease build up. E-Flow 3 records the whole storm, by radar before and after the surcharge and by ultrasonic and pressure through it, with no gap.",
    caption: "Illustration: the same storm, recorded three ways. A record with a gap, or one that drifts, has to be corrected or discarded.",
    rows: [
      ["radar", "Non-contact radar alone", "A gap when the pipe runs full"],
      ["wetted", "Wetted sensor on the invert", "Drifts as rag and grease build up"],
      ["eflow", "E-Flow 3", "The whole storm, with no gap"],
    ],
    gap: "No reading",
    legend: [["truth", "What actually flowed"], ["band", "Pipe running full"], ["recr", "Recorded by radar"], ["recu", "Recorded by ultrasonic and pressure"], ["recw", "Recorded by a wetted sensor"]],
  },
};

export const lidott = {
  title: "LIDoTT Alarm",
  tag: "Self-contained water level alarm",
  maker: "Detectronic",
  lede: "Self-contained water level measurement and alarm device.",
  image: img("lidott-alarm-3.png"),
  image2: img("lidott-alarm-interior-drawing-web.jpg"),
  datasheet: localDoc("detectronic-lidott-alarm-datasheet.pdf"),
  // Detectronic's drawing of the alarm in place, labelled as an illustration.
  figure: { photo: "lidott-alarm-site", alt: "Cutaway illustration of a LIDoTT Alarm mounted at the top of a manhole beneath a street, measuring the sewer level below by radar and sending level alarms to the cloud over the mobile network", caption: "Illustration: where it sits. Mounted in the manhole, measuring the level by radar and reporting alarms over the mobile network.", plain: true },
  highlights: [
    ["radar", "Radar sensor", "5° beam angle"],
    ["ruler", "Range", "Measures up to 8.4 m"],
    ["package", "All in one", "Sensor, battery, modem and antenna"],
    ["shield-check", "Zone 0", "ATEX and IECEx certified"],
    ["bell", "3 alarm states", "Configured on site"],
    ["battery-full", "Long life", "Battery up to 7 years"],
  ],
  description: [
    "LIDoTT Alarm puts a level sensor, battery, modem and Detectronic's unique Neptune antenna into one compact device. It warns you when wastewater depth changes, so you can act fast on blockages and on surcharges from sewer collapses.",
  ],
  sections: [
    ["Continuous measurement and alarm delivery", "Alarm levels are set on site during installation, and a “return to normal” message goes out when levels fall back. Level sampling can be set to 5 or 15 minutes, and a daily heartbeat confirms the sensor is working. 15-minute logging is optional."],
    ["Designed for convenience", "Simple to install, and zero maintenance by design. The enclosure is a tough, naturally self-cleaning polymer, and it's submersible."],
    ["Widespread deployment", "Suits every part of a sewer network, including domestic and lateral sewers, and other watercourses too. It offers up to three level states, such as normal, high and high-high (green, amber, red), and keeps reporting as levels return to normal."],
    ["Easy to mount", "During installation, a laser pointer clips onto the fixing pole to mark the measuring point. The LIDoTT Alarm then replaces the pointer and locks in place. It lifts out and goes back in exactly the same position."],
    ["Data communications", "Uses NB-IoT / Cat M1 with 2G fallback. Each threshold crossed sends an alarm with the current level, going high and returning to normal. Alarms come through Detectronic Cloud by SMS, email and website, with GIS options and optional weather-managed filtering."],
  ],
  specs: [
    ["Sensor type", "Pulsed coherent microwave radar (PCR)"],
    ["Range", "Up to 8.4 m"],
    ["Accuracy", "± 5 mm"],
    ["Operating temperature", "−20 to 70 °C"],
    ["Protection", "IP68 / NEMA 6P"],
    ["Dimensions", "92 × 196 × 122 mm (W × H × D)"],
    ["Communications", "Internal hi-gain NB-IoT / Cat M / 2G antenna"],
    ["Approvals", "ATEX Zone 0, IECEx Zone 0"],
  ],
};

export const alarm2 = {
  title: "Alarm2",
  tag: "Radar level monitor with alarms",
  maker: "Detectronic",
  lede: "All-in-one radar level monitor with alarms, up to 20 m, LoRaWAN or 4G.",
  image: img("detectronic-alarm2.png"),
  datasheet: localDoc("detectronic-alarm2-datasheet.pdf"),
  manual: localDoc("detectronic-alarm2-4g-manual.pdf"),
  highlights: [
    ["radar", "Radar sensor", "No deadband"],
    ["ruler", "Range", "Measures up to 20 m"],
    ["package", "All in one", "Sensor, battery and modem, with an external antenna"],
    ["bell-ring", "Multiple alarms", "High, low, and rate of change"],
    ["wifi", "Connectivity", "LoRaWAN or 4G mobile"],
    ["battery-full", "Long life", "Battery over 5 years"],
  ],
  description: [
    "Alarm2 is a complete level monitor and alarm for remote sites. Radar sensor, battery and modem share one compact enclosure, with an external antenna. It measures up to 20 m with no deadband, accurate to ± 5 mm. An alarm goes out the moment a threshold is crossed and hourly while it lasts, and a daily heartbeat confirms it's working.",
  ],
  sections: [
    ["Precise across the whole range", "Radar measures from 0 to 20 m with no deadband, and stays accurate to ± 5 mm even at 20 m."],
    ["Flexible alarm configuration", "High and low set-points, rate of change and profile alarms are all set during installation. Alarms go out immediately, then hourly while the condition lasts."],
    ["Robust deployment", "Sealed to IP68 and built for manholes and chambers. Choose the LoRaWAN or 4G version to suit the network at each site."],
    ["Real-time monitoring", "Data goes to your monitoring platform at each send interval, and straight away when a level changes state. A daily heartbeat confirms the unit is working, and a JSON API links it to cloud platforms and SCADA."],
    ["Low maintenance", "No external sensors or wiring. Battery life of over five years means fewer site visits."],
  ],
  specs: [
    ["Sensor type", "Contactless radar"],
    ["Range", "0 to 20 m"],
    ["Accuracy", "± 5 mm at 20 m"],
    ["Deadband", "None"],
    ["Operating temperature", "−20 to 60 °C"],
    ["Protection", "IP68"],
    ["Dimensions", "160 × 80 × 80 mm (L × W × D), indicative"],
    ["Weight", "500 g"],
    ["Communications", "LoRaWAN or 4G LTE Cat-1"],
    ["Approvals", "ATEX Zone 0, IECEx Zone 0"],
    ["Battery", "Over 5 years typical"],
  ],
};

/* ------------------------------------------------------------------ */
/* EDS instruments with a page of their own                            */
/* ------------------------------------------------------------------ */
// Each is built at products/<slug>.html. `name` matches the product card in
// the EDS range, which links here. `specs` is [[group, [[label, value]]]],
// and `worksWith` is [[href, title, line]]. Optional: `terminals` draws the
// terminal block, its groups in the order they sit on the block, each with
// its pins as [[pin, name, function]] and a note, numbered from the pin 1
// end; and `applications` is a row of [icon, title, line] cards. `features`
// is optional too. E-Flow 3 adds `anatomy` (the product shot with its sensors
// numbered, beside the opening text), `modes` and `upkeep` (bands built round
// an illustration in diagrams.mjs), `demo` (the changeover demo on the deep
// teal, widgets.js) and `tough` (a split band). Each band's `nav` is its label
// in the section bar, which a page with several bands gets.
export const productPages = [
  {
    slug: "e-flow-3",
    name: "E-Flow 3",
    icon: "radar",
    tag: "Dual-mode sewer flow meter",
    title: "E-Flow 3 Dual-Mode Sewer Flow Meter | EDS",
    lede: "Non-contact radar in normal flow. Doppler ultrasonic and pressure in surcharge. Seamless switching, so the record never stops.",
    description: "EDS E-Flow 3 sewer flow meter: non-contact radar in normal flow, Doppler ultrasonic and pressure in surcharge, with seamless changeover and minimal upkeep.",
    image: img("e-flow-3.png"),
    hero: { caption: "Illustration: radar while there's a free surface, ultrasonic and pressure when the pipe runs full.", normal: "Normal flow: radar", surcharge: "Surcharge: ultrasonic and pressure" },
    figure: { src: img("e-flow-3-installation.jpg"), alt: "Cutaway of a sewer with E-Flow 3 mounted at the top of the pipe and cabled to a data logger near the top of the manhole", caption: "E-Flow 3 at the top of the pipe, cabled to a logger in the shaft" },
    docs: [
      { label: "Datasheet", note: "Principle of operation, full specifications, installation and wiring.", href: localDoc("eds-e-flow-3-datasheet.pdf") },
      { label: "Brochure", note: "How E-Flow 3 measures, and where it fits.", href: localDoc("eds-e-flow-3-brochure.pdf") },
    ],
    highlights: [
      ["radar", "Non-contact radar", "24 GHz velocity and 120 GHz depth, read from above the flow"],
      ["waves", "Ultrasonic and pressure", "Dual 1 MHz Doppler and sealed 316 stainless, for surcharge"],
      ["arrow-left-right", "Seamless changeover", "No blind zone and no gap in the record"],
      ["wrench", "Least maintenance", "Nothing in the flow for rag and grease to foul"],
      ["crosshair", "Accurate to 1 %", "Of reading in surcharge; depth to 0.2 % of full scale"],
      ["shield-check", "Built for the sewer", "Fully potted, corrosion and impact resistant"],
    ],
    intro: [
      "E-Flow 3 is an area velocity flow meter built for sewers and the worst they can throw at it. Four sensors share one body at the top of the pipe (the obvert): non-contact radar for normal flow, and Doppler ultrasonic with a pressure depth sensor for surcharge.",
      "In normal flow the radars measure from above the water, so there's nothing in the flow for grease, rag and silt to foul. When the sewer surcharges, the ultrasonic and pressure pair takes over on its own, then hands back as the level drops. One sensor, one continuous record, from dry weather to full surcharge.",
      "That's why E-Flow 3 needs less maintenance than any other type of open channel flow meter, while keeping unmatched accuracy. And it keeps measuring through the storms that matter most, just when a wetted sensor is most likely to be fouled.",
    ],
    anatomy: {
      heading: "Four sensors, one body",
      alt: "E-Flow 3 seen from the side, with its four sensors numbered: the velocity radar behind the sloping face, the depth radar in the dome, the ultrasonic transducers on the front of the nose and the pressure port beneath it",
      caption: "E-Flow 3 as it hangs: body against the top of the pipe, nose towards the water, upstream to the left.",
      pairs: [
        ["radar", "Normal flow: non-contact radar", [
          [1, "Velocity radar, 24 GHz", "Behind the sloping face, aimed upstream at the approaching surface", 41, 51],
          [2, "Depth radar, 120 GHz", "In the dome, looking straight down at the water", 19.5, 39.5],
        ]],
        ["us", "Surcharge: ultrasonic and pressure", [
          [3, "Dual Doppler ultrasonic, 1 MHz", "On the angled front of the nose, in the water only when the pipe runs full", 53.5, 74],
          [4, "Pressure transducer, 316 stainless", "Sealed port beneath the nose, reading depth to 10 m", 63, 91],
        ]],
      ],
    },
    modes: {
      nav: "Measuring",
      heading: "Above the surface by radar.\nBelow it by ultrasonic and pressure.",
      lede: "Each pair does what it's best at. Radar reads the flow from above whenever there's a free surface. When the pipe runs full, ultrasonic and pressure measure through the water instead. The record never stops.",
      diagram: "eflowModes",
    },
    demo: {
      nav: "Changeover",
      heading: "Fill the pipe. Watch it change over.",
      lede: "Drag the water level, or play a storm. E-Flow 3 checks all four sensors every cycle and hands over as the pipe fills and drains, with no blind zone.",
    },
    why: {
      nav: "Why E-Flow 3",
      heading: "Other flow meters do half the job.\nE-Flow 3 does both.",
      lede: "A radar alone loses its reading the moment the pipe surcharges. A wetted sensor on the bottom of the pipe keeps measuring, but fouls with rag and grease, and drifts. E-Flow 3 uses each technology where it works best and switches seamlessly. That makes it better than any other sewer flow meter on the market.",
      diagram: "eflowCompare",
      columns: ["Radar alone", "Wetted sensor on the invert", "E-Flow 3"],
      rows: [
        ["Measures without touching the flow", "yes", "no", "yes"],
        ["Keeps measuring when the pipe runs full", "no", "yes", "yes"],
        ["Nothing on the invert for rag and grease to foul", "yes", "no", "yes"],
        ["One continuous record through a storm", "no", "Until it fouls", "yes"],
      ],
    },
    accuracy: {
      nav: "Accuracy",
      heading: "Unmatched accuracy, from the surface down.",
      lede: "Flow is only as good as its velocity and area. E-Flow 3 reads surface velocity and corrects it to mean velocity through the depth. It measures depth to 1 mm resolution and works out the wetted area from the pipe profile. Then it calculates flow in the sensor itself.",
      diagram: "eflowProfile",
      heading2: "The figures, from dry weather to full surcharge",
      stats: [
        ["1 %", "of reading, ultrasonic velocity", "± 0.005 m/s"],
        ["2 %", "of reading, radar velocity", "± 0.01 m/s"],
        ["0.2 %", "of full scale, depth", "± 0.001 m"],
        ["1 mm", "depth resolution", "and 0.001 m/s velocity"],
        ["0.05 to 20 m/s", "velocity range", "recommended above 0.2 m/s"],
        ["0 to 10 m", "depth range", "including surcharge"],
      ],
    },
    upkeep: {
      nav: "Maintenance",
      heading: "Less maintenance than any other open channel flow meter.",
      lede: "Most open channel flow meters sit on the bottom of the pipe (the invert), in the path of everything the sewer carries. E-Flow 3 sits at the top, and only touches the water when the pipe runs full. So there's far less to clean, with no loss of accuracy.",
      diagram: "eflowObvert",
      items: [
        ["No cleaning visits in normal service", "The radars have nothing in the water to foul, and the sealed body sheds material once a surcharge drains. Site visits become checks, not clean-outs."],
        ["No confined space entry", "Install, retrieve, commission and check it from the manhole opening, with EMS-Flow through the EDS logger."],
        ["Check it from the office", "Every sensor reports its own value and status over Modbus, so you can see which pair is active, and why, before anyone drives out."],
      ],
    },
    install: {
      nav: "Installation",
      heading: "Installed and commissioned from the surface.",
      lede: "No one enters the manhole. E-Flow 3 goes in from the opening and is set up from the surface. EDS crews install and commission it across Australia.",
      diagram: "eflowInstall",
    },
    tough: {
      nav: "Build",
      heading: "Built for sewers and the harshest conditions.",
      lede: "Hydrogen sulphide, grease, rag, silt, temperature swings and the odd full surcharge. E-Flow 3 is built to sit in all of it for years and keep reporting.",
      hazards: ["Hydrogen sulphide", "Grease", "Rag", "Silt", "Temperature swings", "Full surcharge"],
      photos: [
        { photo: "sewer-overflow-street", alt: "Wastewater surging up around a manhole cover and across a flooded street", caption: "A surcharge forcing wastewater up around a manhole cover." },
        { photo: "inflow-manhole-rain", alt: "Water cascading down the step irons of a manhole during heavy rain", caption: "Stormwater pouring into a manhole in heavy rain." },
      ],
      diagram: "eflowXray",
    },
    applications: {
      nav: "Uses",
      heading: "Where E-Flow 3 fits.",
      items: [
        ["cloud-rain", "Inflow and infiltration", "Reliable wet weather velocity and depth through surcharge, the events that define an I&I program."],
        ["waypoints", "Network monitoring", "Long-term flow at key points in reticulation and trunk sewers, with minimal site visits."],
        ["waves", "Overflow and surcharge", "Capture the peak, the duration and, with the bidirectional model, any reverse flow."],
        ["fan", "Pump station and catchment", "Inflow to wet wells and catchment boundaries, feeding capacity and growth planning."],
      ],
    },
    system: {
      nav: "System",
      heading: "From the manhole to your desk.",
      lede: "E-Flow 3 is part of one EDS system: the sensor, the Hawk logger in the manhole, 4G telemetry and FlowSense. One team looks after all of it, from the sensor to the report.",
      nodes: [
        { kind: "product", name: "E-Flow 3", line: "Velocity, depth, flow, temperature and diagnostics, in the manhole", image: img("e-flow-3.png") },
        { kind: "product tall", name: "Hawk 4G logger", line: "Powers and polls the sensor, stores every reading and reports over 4G", image: img("hawk.png") },
        { kind: "screen", name: "EDS FlowSense", line: "Hydrographs, surcharge and reverse flow alarms, quality auditing and export", shot: "overview" },
        { kind: "team", name: "Your team", line: "Engineers, operators, hydraulic modellers and regulatory reporting" },
      ],
      links: ["RS485 Modbus", "4G LTE", "Web and API"],
      alt: "The FlowSense network overview screen, with alarms, a site list and a map of the network",
      ems: ["EMS-Flow", "commissions and verifies the sensor from the surface, through the logger."],
      caption: "The EDS monitoring system around E-Flow 3. It can also be polled by third-party RTUs and loggers over Modbus RTU.",
    },
    specs: [
      ["Velocity", [
        ["Method", "Non-contact 24 GHz radar in normal flow, dual 1 MHz contact ultrasonic in surcharge"],
        ["Range", "0.05 to 20 m/s, recommended above 0.2 m/s"],
        ["Accuracy", "Ultrasonic 1 % of reading ± 0.005 m/s; radar 2 % of reading ± 0.01 m/s"],
        ["Resolution", "0.001 m/s"],
        ["Dead zone", "Ultrasonic unidirectional 0 to 0.002 m/s, bidirectional ± 0.03 m/s; radar ± 0.05 m/s"],
        ["Velocity radar", "24 GHz continuous wave Doppler, 24° × 12° antenna"],
        ["Ultrasonic", "Dual 1 MHz Doppler, 5° beam"],
      ]],
      ["Depth", [
        ["Method", "120 GHz FMCW radar in normal flow, sealed pressure transducer in surcharge"],
        ["Range", "0 to 10 m"],
        ["Accuracy", "0.2 % of full scale ± 0.001 m"],
        ["Resolution", "0.001 m"],
        ["Depth radar", "120 GHz FMCW, 14° × 10° antenna"],
        ["Pressure transducer", "316 stainless steel, sealed, with dynamic pressure compensation"],
      ]],
      ["Electrical and communications", [
        ["Supply", "8 to 15 VDC, 12 VDC nominal"],
        ["Current", "150 mA at 12 VDC"],
        ["Interface", "RS485, two-wire"],
        ["Protocol", "Modbus RTU slave, register map supplied"],
        ["Response time", "10 s, with configurable damping"],
        ["Firmware", "Remote update over RS485 with an EDS logger"],
        ["Configuration", "EMS-Flow, from the surface through an EDS logger"],
      ]],
      ["Mechanical and environmental", [
        ["Housing", "Alloy and engineering plastic composite"],
        ["Sealing", "Electronics fully potted, unaffected by temperature cycling"],
        ["Cable", "Integral, length to suit the manhole"],
        ["Mounting", "Pipe obvert on an EDS bracket, sensor face upstream"],
        ["Water temperature", "0 to 60 °C, accurate to 0.5 °C"],
        ["Service", "Sewage, trade waste and combined flows, permanent or temporary"],
      ]],
      ["Ordering", [
        ["E-Flow 3 U", "Unidirectional. Ultrasonic mode reports absolute velocity."],
        ["E-Flow 3 B", "Bidirectional. Signed velocity and flow; identifies reverse flow and backing up."],
        ["Bracket", "Obvert mounting bracket, sized to the pipe diameter"],
        ["Cable", "Integral, length specified at order"],
      ]],
    ],
    specNav: "Specs",
    specNote: "Accuracy is stated under reference conditions. Radar velocity needs a free surface with enough texture to return a signal. Below 0.2 m/s the sensor prefers ultrasonic velocity where available. Specifications may change without notice.",
    worksWith: [
      ["products/hawk.html", "Hawk 4G logger", "Powers and polls E-Flow 3 over RS485 and reports over 4G."],
      ["flowsense.html", "EDS FlowSense", "Hydrographs, surcharge and reverse flow alarms, and export to hydraulic models."],
    ],
    cta: { title: "Put E-Flow 3 in your network.", lede: "Tell us the pipe size, the depth and what you need from the data. We'll size the bracket and cable, recommend the logger and telemetry, and can install and commission it for you." },
  },
  {
    slug: "hawk",
    name: "Hawk",
    icon: "radio-tower",
    tag: "Battery-powered 4G logger",
    title: "Hawk Battery-Powered 4G Sewer Logger | EDS",
    lede: "A 4G logger that lives inside the manhole, with no cabinet to build and no power to bring to site.",
    description: "EDS Hawk: a battery-powered 4G LTE data logger for sewer manholes. IP68 submersible, with three RS485 sensor ports and logging from every second.",
    image: img("hawk.png"),
    figure: { src: img("hawk-bracket.png"), alt: "The Hawk logger hanging from its stainless steel wall bracket", caption: "Hawk on its stainless wall bracket" },
    docs: [
      { label: "Datasheet", note: "Design, installation, full specifications, wiring and ordering.", href: localDoc("eds-hawk-datasheet.pdf") },
      { label: "Brochure", note: "The Hawk at a glance.", href: localDoc("eds-hawk-brochure.pdf") },
    ],
    highlights: [
      ["signal", "4G LTE", "Reports every 1 minute to 24 hours"],
      ["timer", "Logs every second", "32 MB on board holds 10 years of data"],
      ["cable", "3 × RS485", "Modbus RTU sensors, 15 kV ESD protected"],
      ["battery-full", "Up to 152 Ah", "Internal battery and a 40 µA sleep current"],
      ["droplets", "IP68", "Submersible; keeps logging when surcharged"],
      ["magnet", "Set up from the surface", "Magnet wake and EMS-Flow over Bluetooth"],
    ],
    intro: [
      "The Hawk goes inside the manhole. It powers and reads your flow, level and quality sensors over RS485, and logs as often as every second. It stores every reading on board and reports over 4G LTE to FlowSense and your own systems.",
      "There's no cabinet to build, no power to bring to site, and no need to enter the chamber to set it up. Nothing sits at the surface, so there's nothing to damage, vandalise or maintain in the road reserve.",
      "Hawk connects directly to E-Flow 3 and any other Modbus RTU sensor. One team looks after the sensor, logger, telemetry and data.",
    ],
    features: [
      ["Sealed for surcharge", "Canister, lid and connectors are sealed to IP68, so the record continues while the chamber is underwater."],
      ["Built for the sewer atmosphere", "A V0 flame-retardant, corrosion-resistant ABS canister, sealed connectors and a stainless wall bracket."],
      ["No power at site", "72 to 152 Ah on board, and each sensor is powered only while it is read. No mains, no solar panel, no roadside cabinet."],
      ["Set up from the surface", "A magnet wakes the Hawk and EMS-Flow sets it up over Bluetooth from the road. Configuration and firmware follow over 4G."],
      ["Every reading kept", "32 MB on board holds 10 years of data, so a missed report in patchy coverage doesn't mean lost data."],
      ["More than one destination", "Up to four data centres. Send the same data to FlowSense and to your SCADA or historian, or run them as primary and standby."],
    ],
    specs: [
      ["Telemetry", [
        ["Mobile network", "4G LTE"],
        ["Logging interval", "1 second to 24 hours"],
        ["Reporting interval", "1 minute to 24 hours"],
        ["Data centres", "Up to 4, each with primary and standby addressing"],
        ["Configuration", "EMS-Flow: Bluetooth on site, remote over 4G"],
        ["Firmware", "Remote update over 4G"],
        ["Operating modes", "Low power and debug, switchable"],
      ]],
      ["Sensor interface", [
        ["Ports", "3 × RS485, independent channels"],
        ["Sensors", "Modbus RTU sensors, including E-Flow 3"],
        ["Serial settings", "Baud rate, parity and stop bits set per channel"],
        ["Protection", "15 kV ESD on every RS485 port"],
        ["Sensor power", "2 × switched 12 V outputs, 500 mA (6 W) each"],
        ["Warm up", "Power on delay up to 255 s before each reading"],
        ["Scheduling", "Logging interval, warm up and retries set per channel"],
      ]],
      ["Data and power", [
        ["On-board memory", "32 MB, 10 years of data retention"],
        ["Battery", "Internal: 72, 80 or 100 Ah rechargeable, or 152 Ah primary"],
        ["Operating current", "Under 65 mA average at 7.2 VDC"],
        ["Sleep current", "40 µA or less at 7.2 VDC"],
        ["External supply", "None required"],
      ]],
      ["Enclosure and environment", [
        ["Protection", "IP68, submersible"],
        ["Material", "V0 flame-retardant, corrosion-resistant ABS"],
        ["Lid", "Bolted, O ring sealed; SIM and battery inside"],
        ["Controls", "Magnetic wake point and status indicators; no switches"],
        ["Dimensions", "Ø165 × 243 mm, excluding handle and antenna"],
        ["Mounting", "Stainless wall bracket, expansion bolts"],
        ["Operating temperature", "−40 to 60 °C, 95 % humidity non-condensing"],
        ["Storage temperature", "−40 to 85 °C"],
      ]],
      ["Sensor connector wiring", [
        ["Red", "12 V switched sensor supply"],
        ["Black", "0 V power ground"],
        ["Green or blue", "RS485 A"],
        ["Yellow", "RS485 B"],
      ]],
      ["Ordering", [
        ["Hawk 72", "72 Ah rechargeable. Short surveys and sites visited regularly."],
        ["Hawk 80", "80 Ah rechargeable. General network monitoring with scheduled visits."],
        ["Hawk 100", "100 Ah rechargeable. Long intervals and several sensors on one logger."],
        ["Hawk 152", "152 Ah primary. The longest unattended service, for permanent and remote sites."],
        ["Chamber sensing", "Option for any model: methane, temperature and humidity, and tilt to flag a disturbed unit."],
      ]],
    ],
    specNote: "Typical values. Battery life depends on logging and reporting intervals, sensors and temperature, so we size the battery for each site.",
    worksWith: [
      ["products/e-flow-3.html", "E-Flow 3 flow meter", "Dual-mode sewer flow meter, radar with surcharge backup."],
      ["flowsense.html", "EDS FlowSense", "Hosted data, hydrographs, alarms, quality auditing and export."],
    ],
    cta: { title: "Put a Hawk in the manhole.", lede: "Tell us the sites and the data you need. We'll size the battery, install and commission from the surface, and deliver the data through FlowSense. Hawk is in our rental fleet for temporary surveys too." },
  },
  {
    slug: "metalog-4g",
    name: "Metalog 4G",
    icon: "antenna",
    tag: "Remote 4G data logger",
    title: "Metalog 4G Data Logger for 4 to 20 mA & Modbus | EDS",
    lede: "Telemetry for any 4 to 20 mA or Modbus instrument, in one compact 4G logger.",
    description: "EDS Metalog 4G: a compact remote data logger with four 4 to 20 mA inputs and an RS485 Modbus RTU port, returning the data over the 4G network.",
    image: img("metalog-4g.png"),
    figure: { src: img("metalog-4g-dimensions.png"), alt: "Dimensioned drawing of the Metalog 4G: a front view 88 mm wide and 60 mm high with 10 mm keyhole flanges on each side, and the terminal end view, 25 mm deep", caption: "Front and terminal end views, in mm" },
    docs: [
      { label: "Datasheet", note: "Specifications, terminals and power, wiring, dimensions and installation.", href: localDoc("eds-metalog-4g-datasheet.pdf") },
      { label: "Brochure", note: "The Metalog 4G at a glance: connections, applications and specifications.", href: localDoc("eds-metalog-4g-brochure.pdf") },
    ],
    highlights: [
      ["activity", "4 × 4 to 20 mA", "Analogue inputs for two-wire or three-wire transmitters"],
      ["cable", "RS485 Modbus RTU", "A shared two-wire bus, or transparent pass through"],
      ["signal", "4G mobile", "Built-in modem with an SMA female 50 Ω connector"],
      ["plug-zap", "9 to 28 V DC", "Suits 12 V and 24 V site supplies, and powers your sensors"],
      ["usb", "USB setup", "Configured on site from a laptop"],
      ["droplets", "IP58", "88 × 60 × 25 mm, rated −20 to 80 °C"],
    ],
    intro: [
      "Metalog 4G is a compact remote data logger for water and wastewater networks. It reads up to four 4 to 20 mA transmitters and multiple RS485 Modbus RTU instruments, and sends the data over 4G.",
      "Level, pressure and flow transmitters all land on one 8-way terminal block. The 9 to 28 V DC range suits common 12 V and 24 V site supplies. Fed from its DC jack, the V+ terminal powers loop-powered transmitters at the same voltage.",
      "You set it up on site from a laptop over USB, and two status lights show whether it's in setup, armed or sending.",
    ],
    features: [
      ["Four analogue inputs", "Channels Ai0 to Ai3 accept 4 to 20 mA signals from two-wire loop-powered or three-wire transmitters."],
      ["RS485 Modbus RTU", "Poll instruments on a shared two-wire bus, or use transparent mode to pass serial data straight through the logger."],
      ["Powers your sensors", "Runs from 9 to 28 V DC through the terminal block or a 5.5 × 2.5 mm DC jack. Fed from the jack, V+ supplies your transmitters at the same voltage."],
      ["4G mobile telemetry", "A built-in 4G modem takes an antenna on its SMA female connector, directly or through an extension cable. The SIM sits in a hinged slot on the rear panel."],
      ["Simple setup on site", "Configure from a laptop over USB. A red light shows setup, disarmed and armed; a green light shows start up and each message being sent."],
      ["Compact and panel mounted", "An 88 × 60 × 25 mm IP58 body that fixes to a flat wall or panel through keyhole slots in its side flanges."],
    ],
    terminals: {
      heading: "One terminal block, every connection.",
      lede: "Power, analogue and RS485 wiring all land on one 8-way terminal block, with the USB port and power switch on the same face.",
      groups: [
        { label: "RS485", kind: "rs485", pins: [[8, "A+", "RS485 data A+"], [7, "B−", "RS485 data B−"]],
          note: ["RS485", "A+ to A+ and B− to B− on every device, daisy-chained along one bus, with a unique address for each Modbus device."] },
        { label: "Analogue input", kind: "ai", pins: [[6, "Ai3", "Analogue input 4, 4 to 20 mA"], [5, "Ai2", "Analogue input 3, 4 to 20 mA"], [4, "Ai1", "Analogue input 2, 4 to 20 mA"], [3, "Ai0", "Analogue input 1, 4 to 20 mA"]],
          note: ["Analogue inputs", "A two-wire transmitter runs from V+ to its input, and all loops share V+. A three-wire transmitter on its own supply shares 0 V with the logger GND."] },
        { label: "9 to 28 V DC", kind: "power", pins: [[2, "GND", "Ground: supply negative, and the three-wire 0 V common"], [1, "V+", "Power in, or sensor power out"]],
          note: ["Power in or out", "Wire 9 to 28 V DC to V+ and GND, pins 1 and 2. Or plug the supply into the DC jack, and V+ then powers your sensors at the supply voltage."] },
      ],
      caution: "Switch the logger off before making or changing connections, and check each transmitter's polarity and supply voltage against its own datasheet.",
    },
    applications: {
      heading: "Where it works.",
      items: [
        ["fan", "Pump stations", "Wet well level from a submersible level transducer."],
        ["container", "Reservoirs", "Storage level in tanks and reservoirs."],
        ["gauge", "Network pressure", "Pressure transmitters at critical points in the reticulation."],
        ["waves", "Flow metering", "Analogue or Modbus outputs from flow meters."],
      ],
    },
    specs: [
      ["Sensor interface", [
        ["Analogue inputs", "4 channels, Ai0 to Ai3, 4 to 20 mA (default)"],
        ["Transmitters", "Two-wire, loop-powered from the logger V+, or three-wire on an external supply"],
        ["Ports", "1 × RS485, two-wire (A+, B−)"],
        ["Serial modes", "Modbus RTU, or transparent RS485 transmission"],
      ]],
      ["Telemetry", [
        ["Mobile network", "4G"],
        ["Antenna", "SMA female connector, 50 Ω"],
        ["SIM card", "Hinged slot on the rear panel"],
        ["Configuration", "On site, from a laptop over USB"],
      ]],
      ["Power", [
        ["Supply voltage", "9 to 28 V DC"],
        ["Terminal input", "V+ and GND, pins 1 and 2"],
        ["DC jack", "5.5 × 2.5 mm, 2.5 mm centre pin"],
        ["Sensor power", "V+ output at supply voltage when powered from the DC jack"],
        ["Power switch", "On / off"],
      ]],
      ["Enclosure and environment", [
        ["Dimensions", "88 × 60 × 25 mm (W × H × D)"],
        ["Protection", "IP58"],
        ["Operating temperature", "−20 to 80 °C"],
        ["Mounting", "Side flanges, 10 mm wide, with keyhole slots"],
        ["Terminal block", "8-way, 3.81 mm pitch"],
        ["Indicators", "ACT (red) and SRV (green) LEDs"],
      ]],
      ["Status lights", [
        ["Setup mode", "ACT flashes every 600 ms"],
        ["Disarmed", "ACT flashes every 6 s"],
        ["Armed", "ACT flashes twice every 3 s"],
        ["Starting or sending", "SRV on"],
        ["Start up or send complete", "SRV off"],
      ]],
      ["Ordering", [
        ["Model", "EDS-Metalog-4G-4CA"],
        ["Matched to your site", "Transmitters, antennas and enclosures, by the EDS team"],
      ]],
    ],
    specNote: "Specifications are subject to change without notice.",
    worksWith: [
      ["services/pump-station-monitoring.html", "Pump Station Monitoring", "Wet well levels, pump runs and alarms, watched around the clock."],
      ["services/real-time-monitoring.html", "Real-Time Monitoring", "Rugged wireless monitoring for the SCADA systems you already run."],
    ],
    cta: { title: "Put your instruments on 4G.", lede: "Tell us the site, the instruments and the supply you have. Our team can match transmitters, antennas and enclosures to your site." },
  },
  {
    slug: "ilab-901",
    name: "iLab 901",
    icon: "flask-conical",
    tag: "Multi-parameter water quality sonde",
    title: "iLab 901 Multi-Parameter Water Quality Sonde | EDS",
    lede: "Up to seven water quality parameters at once, from one rugged sonde and its handheld.",
    description: "EDS iLab 901: a rugged multi-parameter sonde and handheld measuring up to seven water quality parameters at once, with self-cleaning and Modbus RS485.",
    image: img("ilab-901.png"),
    figure: { src: img("ilab-and-sensor.jpg"), alt: "The iLab handheld, with its screen and keypad, beside the iLab 901 sonde and its sensor guard", caption: "The handheld, the sonde and its sensor guard" },
    docs: [
      { label: "Datasheet", note: "Measurements, specifications and dimensions.", href: localDoc("eds-ilab-901-datasheet.pdf") },
    ],
    highlights: [
      ["layers", "Up to seven at once", "Parameters measured together, from a list of thirteen"],
      ["sparkles", "Cleans itself", "So the data stays accurate for longer"],
      ["database", "100,000+ readings", "Stored on the handheld"],
      ["droplets", "IP68 sonde", "Rated to 30 m, with an IP67 handheld"],
      ["cable", "Modbus RS485", "On a 9 to 36 V DC supply or its own lithium cells"],
      ["map-pin", "GPS and USB", "Built in, with Bluetooth as an option"],
    ],
    intro: [
      "The iLab 901 is a multi-parameter sonde for long-term water quality monitoring. Fit it with up to seven sensors, chosen from thirteen measurements, and it reads them all at once.",
      "It cleans its own sensors, so the data stays accurate for longer. Set the sampling interval to suit, and the sonde makes the most of its batteries.",
      "The handheld shows each reading on a 3.5 inch colour screen and stores more than 100,000 of them. GPS and USB are built in, and Bluetooth is an option.",
    ],
    features: [
      ["Seven at once", "One sonde carries physical, electrochemical, optical and ion-selective sensors, picked for the job."],
      ["Cleans itself", "A self-cleaning system keeps the sensors clear, so the iLab holds accurate data for longer."],
      ["Long deployments", "Set the sampling interval to suit, and stretch the time the sonde runs on its own lithium cells."],
      ["Readings in your hand", "A 3.5 inch colour screen with an adjustable backlight shows results live, with fast processing on board."],
      ["Built for the field", "An IP68 sonde and an IP67 handheld with high-impact rubber gaskets and a shape that's easy to hold."],
      ["Located and connected", "GPS and USB are built in and Bluetooth is optional. The sonde speaks Modbus over RS485."],
    ],
    measurements: {
      nav: "Measurements",
      heading: "Thirteen measurements. Fit up to seven.",
      lede: "Each iLab 901 is fitted with the sensors your program needs. Conductivity also gives salinity and total dissolved solids.",
      columns: ["Measurement", "Method", "Range", "Resolution", "Accuracy"],
      groups: [
        ["Physical", [
          ["Temperature", "Thermistor", "0 to 60 °C", "0.01 °C", "±0.5 °C"],
          ["Depth", "Pressure", "0 to 61 m", "2 cm", "±0.3%"],
        ]],
        ["Electrochemical", [
          ["pH", "Glass electrode", "0 to 14 pH", "0.01 pH", "±0.1 pH"],
          ["ORP", "Glass electrode", "−1000 to +1000 mV", "1 mV", "±5 mV"],
          ["Conductivity", "Platinum gauze electrode pair", "1 to 2000 µS/cm (K = 1)\n100 µS/cm to 100 mS/cm (K = 10)", "0.1 µS/cm to 0.01 mS/cm, by range", "±3%"],
        ]],
        ["Optical", [
          ["Dissolved oxygen", "Fluorescence", "0 to 20 mg/L (0 to 20 ppm)\n0 to 200%", "0.01 mg/L\n0.1%", "±3% or ±0.3 mg/L, whichever is greater"],
          ["Turbidity", "Light scattering", "0 to 1000 NTU", "0.1 NTU", "±5% or 0.3 NTU, whichever is greater"],
          ["Chlorophyll", "Fluorescence", "0 to 500 µg/L", "0.01 to 0.1 µg/L, by range", "±5% of the signal level of 1 ppb rhodamine B dye"],
          ["Blue-green algae", "Fluorescence", "200 to 300,000 cells/mL", "20 cells/mL", "±10% of the signal level of 1 ppb rhodamine B dye"],
        ]],
        ["Ion-selective", [
          ["Ammonia nitrogen", "Ion-selective electrode", "0.1 to 1000 mg/L-N", "0.01 mg/L-N", "±5% or ±0.2 mg/L"],
          ["Nitrate nitrogen", "Ion-selective electrode", "0.5 to 1000 mg/L-N", "0.01 mg/L-N", "±10% or ±0.2 mg/L"],
          ["Chloride", "Ion-selective electrode", "3 to 1000 mg/L", "0.01 mg/L", "±10% or ±0.2 mg/L"],
          ["Fluoride", "Ion-selective electrode", "0.5 to 1000 mg/L", "0.01 mg/L", "±10% or ±0.2 mg/L"],
        ]],
      ],
      notes: [
        ["With an ion-selective sensor", "The pH working range is 5 to 10 pH, and the sonde is rated to a depth of 10 m."],
        ["Depth", "The depth sensor reads to 61 m. The sonde itself is rated to 30 m."],
        ["Temperature", "The sonde measures in water from 0 to 40 °C, non-freezing."],
      ],
    },
    applications: {
      nav: "Applications",
      heading: "Where it works.",
      items: [
        ["waves", "Rivers, lakes and reservoirs", "Online multi-parameter water quality monitoring."],
        ["droplet", "Source water", "Drinking water sources, groundwater and sea water."],
        ["trees", "Environmental monitoring", "Long-term water quality records."],
        ["sprout", "Agriculture", "Water quality monitoring for agriculture."],
      ],
    },
    specs: [
      ["Sonde", [
        ["Sensors", "Up to 7 at once"],
        ["Communication", "Modbus, RS485"],
        ["Power supply", "9 to 36 V DC"],
        ["Power draw", "3 W"],
        ["Battery", "8 × 3.6 V lithium cells"],
        ["Protection", "IP68"],
        ["Depth rating", "30 m (10 m with an ion-selective sensor)"],
        ["Measuring temperature", "0 to 40 °C, non-freezing"],
        ["Storage temperature", "0 to 50 °C, non-freezing"],
        ["Size", "90 mm diameter × 640.5 mm long"],
        ["Weight", "3 kg"],
      ]],
      ["Handheld", [
        ["Display", "3.5 inch colour screen, adjustable backlight"],
        ["Data storage", "More than 100,000 readings"],
        ["Positioning", "GPS receiver, built in"],
        ["Interfaces", "USB; Bluetooth optional"],
        ["Power supply", "4 × 3.7 V rechargeable lithium, built in"],
        ["Protection", "IP67"],
        ["Material", "ABS and polycarbonate"],
        ["Operating temperature", "0 to 50 °C, non-freezing"],
        ["Storage temperature", "−15 to 60 °C"],
        ["Size", "203 × 100 × 43 mm"],
        ["Weight", "0.5 kg"],
      ]],
      ["Measurements", [
        ["Fitted at once", "Up to 7"],
        ["Physical", "Temperature, depth"],
        ["Electrochemical", "pH, ORP, conductivity (with salinity and TDS)"],
        ["Optical", "Dissolved oxygen, turbidity, chlorophyll, blue-green algae"],
        ["Ion-selective", "Ammonia nitrogen, nitrate nitrogen, chloride, fluoride"],
      ]],
    ],
    specNote: "Specifications are subject to change without notice.",
    worksWith: [
      ["services/water-quality-monitoring.html", "Water Quality Monitoring", "pH, EC, turbidity and nutrient monitoring, from one sensor to a whole network."],
      ["solutions/environmental-monitoring.html", "Environmental Monitoring", "Water quality, rainfall, temperature and sampling, from the baseline to compliance."],
    ],
    cta: { title: "Tell us what you need to measure.", lede: "Give us the water, the parameters and how long the sonde will be out. We'll match the sensors to your site." },
  },
  {
    slug: "sensor-fort",
    name: "Sensor Fort",
    icon: "shield",
    tag: "Sensor mount for gravity sewers",
    title: "Sensor Fort: Install pH & EC Sensors in a Sewer | EDS",
    lede: "How to install pH, EC and other water quality sensors in a gravity sewer, and keep them working. The only mount that hides everything but the sensor tip.",
    description: "How to install pH, EC and other water quality sensors in a gravity sewer. Sensor Fort holds them on the invert with only their tips in the flow, clear of rag.",
    image: img("sensor-fort.png"),
    heroCaption: "Sensor Fort in a 150 mm sewer, with the pipe cut away. Patent pending.",
    figure: { src: img("sensor-fort-downstream.png"), alt: "Sensor Fort in a cut-away 150 mm sewer pipe, seen from downstream, with a sensor tip showing below the spill lip", caption: "From downstream: the sensor tips sit below the spill lip" },
    docs: [
      { label: "Datasheet", note: "Specifications, sensor fit, the range, dimensions and ordering.", href: localDoc("eds-sensor-fort-datasheet.pdf") },
      { label: "Brochure", note: "The problem, how Sensor Fort works, and flow from the same site.", href: localDoc("eds-sensor-fort-brochure.pdf") },
    ],
    highlights: [
      ["shield", "Only the tips meet the flow", "Sensor bodies, clamps and cables stay inside the mount"],
      ["wind", "Nothing for rag to catch", "A smooth saddle that flow and rag can only pass over"],
      ["plug", "Works with 99% of sensors", "On the market, as tested by EDS, from any maker"],
      ["ruler", "150 to 1050 mm sewers", "One Sensor Fort for each pipe diameter"],
      ["zap-off", "Runs on nothing but your sensors", "No power, no pump and no moving parts to look after"],
      ["waves", "Flow from the same site", "The spill lip is a hydraulic control, so depth gives flow"],
    ],
    intro: [
      "Installing a pH, EC or dissolved oxygen sensor in a gravity sewer is hard, and the hard part isn't the sensor. It's how you hold it in the flow. Rag wraps around anything that divides the flow, grit buries whatever sits in slow water, fat coats whatever sits at the waterline, and low flows leave sensors dry.",
      "Sensor Fort is a low moulded saddle that sits on the bottom of the pipe (the invert) at a manhole. Two sensors lie inside it, pointing downstream. The flow rides up the saddle, spills over a lip and runs fast across their tips. Nothing else is exposed.",
      "EDS designed Sensor Fort and builds it in Australia, drawing on more than 30 years of experience and knowledge of sewers, to solve that one problem. It needs nothing to run except your sensors: no power, no pump and no moving parts. It works with 99% of the sensors on the market, as tested by EDS, so you keep the ones your network already trusts. And it's designed to stay in the sewer for 12 months between visits.",
    ],
    anatomy: {
      figure: "anatomy",
      heading: "One body. Two protected bays.",
      alt: "Sensor Fort seen from above and behind: a dark moulded saddle with a thin nose upstream, two raised shoulders with a valley between them, a cable hood on each shoulder, and two sensor tips showing at the downstream end",
      key: ["Feathered nose", "Cable hood", "Shoulder over a sensor bay", "Valley", "Cable clamp", "Spill lip", "Stern face", "Sensor tips"],
      caption: "The sensors lie under the shoulders and show only their tips at the stern. Each cable leaves under a hood on its shoulder.",
    },
    problem: {
      nav: "The problem",
      heading: "Four ways to hold a sensor in a sewer.\nNone of them works, and none ever will.",
      lede: "In a gravity sewer the weak point is the mount, not the sensor. Rag wraps around anything that divides the flow. Grit buries whatever sits in slow water. Fat coats whatever sits at the waterline. And low flows leave sensors dry. Each of these fails for a mechanical reason that no sensor can overcome.",
      fails: "What doesn't work",
      methods: [
        ["pole", "Needs regular cleaning", "Pole, chain or pendulum from above", "Rag catches where the pole pierces the surface, and on the sensor itself. A ring of fat forms at the waterline."],
        ["band", "The best of the four, and it still rags", "Sensor strapped to a band", "Rag catches on the sensor body, the clamps and the cable. Silt settles in the lee of the sensor."],
        ["float", "Unreliable in a sewer", "Float on a tether", "Rag collects on the float and its tether. At low flow the float grounds or tips over."],
        ["bypass", "Needs a pump, power and visits", "Pumped bypass to a flow cell", "The intake blocks, and the tubing and the flow cell foul between visits."],
      ],
      answer: {
        wins: "What does",
        eyebrow: "The idea",
        heading: "Hide everything but the tip.",
        lede: "So we changed the mount, drawing on more than 30 years of working in sewers. Sensor Fort gives rag nothing to wrap around, keeps every cable out of the flow and leaves no sensor body to be buried. No other mount does all three, which makes it the only solution for analytical sensors in a gravity sewer network.",
        points: [
          ["Rag", "No leading edge. The saddle spans the invert, so flow and rag can only pass over it."],
          ["Grit", "The tips sit just below the spill lip, where fast water keeps grit moving."],
          ["Low flow", "Each sensor lies 15° tip down, so its tip is the last part to go dry."],
          ["Upkeep", "It needs nothing to run except your sensors: no pump, no power and no moving parts. Designed for 12 months between visits."],
        ],
        image: img("sensor-fort-end.png"),
        alt: "Sensor Fort seen from downstream inside a pipe: two shoulders against the pipe wall, an open valley between them, and two sensor tips side by side at the bottom",
        caption: "From downstream. The centre of the sewer stays open above the valley.",
      },
    },
    works: {
      nav: "How it works",
      heading: "Shaped so the flow keeps the tips clear.",
      lede: "Sensor Fort works by shape alone. The flow rides up a feathered nose, gathers in the valley between two shoulders, spills over a lip and runs fast across the sensor tips. The same shape keeps every sensor body, clamp and cable out of the stream.",
      figure: {
        name: "section",
        flowing: true,
        says: [[22, 84, "start", "Deep and slow in the pool"], [990, 84, "end", "Shallow and fast across the tips"]],
        alt: "Sensor Fort in section in a 150 mm sewer, with the water moving from left to right. Water 81 mm deep upstream rides up the mount's nose, spills over the lip at its downstream end and runs fast and 36 mm deep past the sensor tip. Strands of rag ride over the mount with the flow. The sensor lies inside the mount, tip down, and the cable hood stands clear of the water.",
        key: ["Feathered nose", "Cable hood, clear of the stream", "Valley for low flows", "Sensor inside the shoulder", "Spill lip", "Sensor tips in fast water"],
        caption: "Section along the centre line of the SF 150 in a 150 mm sewer. The water levels at each end were calculated for 1.9 L/s at a grade of 1%. The surface between them is schematic, and the pale area is the thin skin against the pipe wall. The moving water is an illustration: it runs faster where it is shallower, and the brown strands are rag passing over.",
      },
      rulesHeading: "Six design rules",
      rules: [
        ["No leading edge", "Rag catches where flow divides around an edge. The saddle spans the invert, so flow can only pass over it."],
        ["Only the tips are exposed", "Sensor bodies, clamps and cables stay inside. The flow side has no seam, hole or fastener."],
        ["Tips at the lowest point", "Each sensor lies 15° tip down, so its tip is the last part of the installation to go dry."],
        ["Tips in the fastest water", "The tips sit just below the spill lip, where fast water keeps biofilm thin and grit moving."],
        ["No cable in the flow", "Each cable leaves its bay under a hood and runs to the top of the pipe in a covered channel."],
        ["Low and full width", "A low hump that fills the invert sheds debris over its top, where a post would hold it."],
      ],
      note: ["What no mount can do.", "No mount can stop biofilm growing or a pH reference ageing, though fast water keeps biofilm thin. So we match the sensor type and the data checks to the service interval each site needs."],
    },
    flow: {
      nav: "Flow",
      heading: "Flow and water quality from one site.",
      lede: "The spill lip is a hydraulic control, like a flume or weir, so the depth upstream rises predictably with flow. Fit Sensor Fort in the outlet pipe of a manhole and it holds a pool in the channel across the manhole floor (the chase). A level sensor above the chase, or a pressure sensor in it, measures the depth. We turn that depth into flow with a rating curve for the mount, while the sensors keep measuring water quality.",
      figure: {
        name: "flow",
        alt: "A manhole in section on a 375 mm sewer, with flow from left to right. Sensor Fort sits in the outlet pipe and holds a pool 113 mm deep in the chase. A level sensor hangs above the pool, and a pressure sensor is shown on the floor of the chase as the alternative.",
        key: ["Sensor Fort in the outlet pipe", "Spill lip, the hydraulic control", "Sensor tips", "Pool held in the chase", "Level sensor above the chase", "Or a pressure sensor in the chase"],
        caption: "Sensor Fort in the outlet pipe of a manhole on a 375 mm sewer, with a level sensor above the chase. The depth shown was calculated for the SF 375 at 10 L/s and a grade of 0.5%. The figure is schematic.",
      },
      rating: {
        heading: "Calculated rating, SF 375 in a 375 mm sewer",
        sub: "The depth held in the chase at each flow.",
        labels: ["Flow", "Depth in the chase"],
        points: [[1, 62], [2, 71], [5, 90], [10, 113], [20, 145], [40, 193]],
        note: "The rating applies while the flow over the lip is free. At flat grades the lip can drown at high flows, and the rating then no longer applies.",
      },
      items: [
        ["One site, one entry", "Flow and water quality are measured, logged and reported together from one installation."],
        ["Loads and context", "Flow puts every reading in context, and lets you work out loads as well as concentrations."],
        ["No assumed roughness", "A rating at a control doesn't depend on an assumed pipe roughness or grade, as an estimate from Manning's equation does."],
        ["Confidence in the data", "The depth record shows when the sensor tips are covered and when the sewer runs dry."],
      ],
    },
    fit: {
      nav: "Sensor fit",
      heading: "Your sensors. Your sewer.",
      lede: "Sensor Fort works with 99% of the sensors on the market, as tested by EDS. We surveyed 48 pH, conductivity and dissolved oxygen sensor models from 22 makers, and sized the sensor bays to suit them. The larger the sewer, the larger the sensor its Sensor Fort takes. A sleeve adapts each sensor to its bay, so you fit your own sensors, certified for your own zones.",
      columns: ["Model", "Pipe diameter", "Largest sensor body", "Typical sensor formats", "Surveyed models that fit"],
      rows: [
        ["SF 150, SF 225", "150 and 225 mm", "28.5 mm by 190 mm", "12 mm electrodes in a sleeve, compact 22 mm sensors and 3/4 inch NPT bodies", 26],
        ["SF 300, SF 375", "300 and 375 mm", "35.5 mm by 270 mm", "In addition, 1 inch NPT bodies and 35 mm differential sensors", 36],
        ["SF 450 to SF 1050", "450 to 1050 mm", "51 mm by 315 mm", "In addition, 1.5 inch NPT bodies, 51 mm differential sensors and optical oxygen sensors", 46],
        ["To order", "525 mm and larger", "80 mm by 600 mm", "Multiparameter sondes and long armatures", 48],
      ],
      surveyed: 48,
      figure: {
        name: "range",
        alt: "Ten sewer pipes in end view, from 150 mm to 1050 mm in diameter, each with its Sensor Fort drawn to scale as a low saddle across the bottom of the pipe. The saddle takes up less of the pipe as the pipe gets larger.",
        caption: "One Sensor Fort for each pipe diameter, in millimetres. Schematic end views, with the diameter, lip height and shoulder height drawn to scale. Sizes between those shown are made to order.",
      },
      notes: [
        ["A 12 mm electrode fits every Sensor Fort", "pH, ORP, conductivity and dissolved oxygen sensors all come as 12 mm electrodes, so there's a sensor for every sewer."],
        ["Conductivity", "In sewers smaller than 450 mm, use a four-electrode conductivity sensor. Inductive heads fit the SF 450 and larger by size, but need a site check, because the whole head must stand in the flow."],
        ["Check the fit first", "The survey was done in November 2026. Please confirm the fit of your sensor with us before you order."],
      ],
    },
    fastening: {
      nav: "Fastening",
      heading: "One screw fastens both sensors.",
      lede: "The sensors lie in two straight bays under the shoulders, 15° tip down. Each bay opens only towards the pipe wall, so the side that faces the flow is one continuous skin.",
      figure: {
        name: "bay",
        alt: "The underside of Sensor Fort with one sensor bay open: a sensor in its sleeve lies along the bay with its tip at the downstream end, a clamp bar and its screw are drawn clear below, and a small clamp holds the cable where it leaves the bay",
        caption: "The open side of a bay, with the clamp bar and its screw drawn clear. The numbers match the steps.",
      },
      steps: [
        ["Sleeve the sensor", "A 12 mm electrode screws into its sleeve by its PG13.5 thread. A larger body takes a split sleeve."],
        ["Lay it in the open bay", "Turn the mount over on the bench, lay the sensor in and slide it downstream until its sleeve meets the stern ring."],
        ["Tighten one screw", "A single clamp bar beneath the stern presses both sleeves home, so one M5 screw fastens both sensors."],
        ["Clamp the cable", "A small clamp holds each cable in its groove, so a pull on the cable never reaches the sensor."],
      ],
      items: [
        ["No fastener faces the flow", "The clamp bar sits in a pocket beneath the stern."],
        ["The pipe wall closes the bays", "Each bay opens only towards the pipe wall, which leaves the flow side seamless."],
        ["A solid stop for every sensor", "Each sleeve bears on the stern ring, so drag and the 15° tilt both press the sensor home."],
      ],
    },
    service: {
      nav: "Service",
      heading: "Load it on the bench. Leave it for 12 months. Swap it.",
      lede: "The work happens on the bench, not in the manhole. A loaded mount goes into the pipe on an EDS expansion band, and at the next visit the whole mount is exchanged for a fresh one.",
      steps: [
        ["Load", "Each sensor is sleeved, clamped in its bay, calibrated and capped wet on the bench."],
        ["Install", "The loaded mount is fixed on its EDS expansion band in the pipe, with nothing drilled."],
        ["Leave", "The mount is designed to stay in the sewer for 12 months between visits."],
        ["Swap", "The whole mount is exchanged for a freshly loaded one, and the old one is refurbished."],
      ],
      supplied: {
        heading: "Supplied as part of an EDS monitoring solution",
        items: [
          ["Complete sites", "We supply Sensor Fort with the Metalog 4G logger, an upstream level sensor where you need flow, and commissioning into FlowSense."],
          ["Your sensors", "Use the sensors your network already trusts. We supply the mount and the sleeves, and match the data checks to the service interval."],
          ["Your own system", "The mount has no electrical parts, so sensors with 4 to 20 mA or Modbus outputs connect to any RTU, logger or SCADA host."],
        ],
      },
    },
    range: {
      nav: "Range",
      heading: "One Sensor Fort for each pipe diameter.",
      lede: "Each one forms a low hump in the sewer. Check upstream connections and overflow levels against these figures before you choose a site.",
      columns: ["Model", "Pipe diameter", "Largest sensor body", "Lip height", "Length", "Area occupied", "Tips covered above"],
      rise: ["Rise at a grade of", "0.1%", "0.5%", "1%"],
      rows: [
        ["SF 150", "150 mm", "28.5 mm", "40", "314", "26%", "0.4 L/s", "", "41", "59"],
        ["SF 225", "225 mm", "28.5 mm", "39", "320", "12%", "0.4 L/s", "", "36", "60"],
        ["SF 300", "300 mm", "35.5 mm", "46", "426", "10%", "2.5 L/s", "", "45", "78"],
        ["SF 375", "375 mm", "35.5 mm", "45", "433", "7%", "2.5 L/s", "", "47", "88"],
        ["SF 450", "450 mm", "51 mm", "62", "531", "9%", "5.5 L/s", "53", "67", "120"],
        ["SF 525", "525 mm", "51 mm", "61", "540", "7%", "5.5 L/s", "52", "71", ""],
        ["SF 600", "600 mm", "51 mm", "61", "573", "6%", "6 L/s", "52", "75", ""],
        ["SF 750", "750 mm", "51 mm", "61", "639", "4%", "6.5 L/s", "51", "84", ""],
        ["SF 900", "900 mm", "51 mm", "60", "686", "3%", "8 L/s", "50", "95", ""],
        ["SF 1050", "1050 mm", "51 mm", "60", "721", "2%", "8.5 L/s", "49", "107", ""],
      ],
      note: "Dimensions and rises are in millimetres, and each model holds two sensors. Lip height is from the invert to the spill lip. Area occupied is the share of the pipe area the mount takes up at its widest section. Tips covered above is the calculated flow above which the sensor tips are fully under water. Rise is the largest calculated rise in the upstream water level over the flow range; a dash falls outside the grades calculated for that model. Sensor Forts for sondes up to 80 mm are made to order for sewers of 525 mm and larger, as are sizes between those listed.",
      check: {
        heading: "Before you choose a site",
        items: [
          ["Upstream level", "Check upstream connections and overflow levels against the rise in the table."],
          ["Capacity", "Avoid sewers that surcharge in dry weather, because the pipe upstream of the mount runs full first."],
          ["Steep sewers", "Above a grade of about 0.7% the flow is supercritical, and a hydraulic jump forms upstream of the mount."],
          ["Low flow", "Below the flow in the table the sensor tips are partly exposed, and at zero flow they drain. Choose a sewer with a continuous base flow."],
          ["Sediment", "Solids can settle in the upstream pool in dry weather, but the tips sit downstream of the lip, clear of the deposit."],
          ["Cleaning and CCTV", "A jetting nozzle or camera crawler can't pass the mount, so agree a removal procedure with the asset owner."],
        ],
      },
    },
    applications: {
      nav: "Uses",
      heading: "Where it works.",
      items: [
        ["factory", "Trade waste", "pH and conductivity at a discharge point or in the receiving sewer."],
        ["route", "Source tracking", "Paired sites that narrow down where an abnormal discharge enters the network."],
        ["waves", "Saline ingress", "Conductivity changes that reveal saline water entering the network."],
        ["wind", "Odour control", "pH and dissolved oxygen trends that support septicity and dosing studies."],
      ],
    },
    faq: {
      nav: "Questions",
      heading: "Installing pH, EC and water quality sensors in a sewer.",
      lede: "Short answers. The detail is above, and in the datasheet.",
      items: [
        ["How do you install a pH or EC sensor in a sewer?", "Mount it where rag can't catch it. Sensor Fort is a low saddle that sits on the invert of the pipe at a manhole, fixed on an expansion band with nothing drilled. The sensor lies inside it, 15° tip down, with only its tip in the flow. Each sensor is sleeved, calibrated and capped wet on the bench first, and the loaded mount then goes into the pipe."],
        ["Why do water quality sensors foul in a sewer?", "Usually because of the mount, not the sensor. Rag wraps around anything that divides the flow, grit buries whatever sits in slow water, fat coats whatever sits at the waterline, and low flows leave sensors dry. Poles, bands, floats and pumped bypasses each fail for one of those reasons."],
        ["Which water quality sensors can be installed in a sewer with Sensor Fort?", "Sensor Fort works with 99% of the sensors on the market, as tested by EDS. It takes any cylindrical sensor that measures at its tip, from any maker, including pH, ORP, conductivity (EC) and dissolved oxygen. A sleeve adapts each sensor to its bay, from 12 mm electrodes to 80 mm sondes in larger sewers. Each mount holds two sensors."],
        ["What size sewer does it suit?", "Gravity sewers from 150 mm to 1050 mm in diameter, with one Sensor Fort for each pipe diameter. It is made for circular pipe, with U-shaped channels on request. Choose a sewer with a continuous base flow, so the sensor tips stay wet."],
        ["How often do sensors in a sewer need servicing?", "Sensor Fort is designed to stay in the sewer for 12 months between visits. The whole mount is then exchanged for a freshly loaded one. No mount can stop biofilm growing or a pH reference ageing, so we match the sensor type and the data checks to the service interval each site needs."],
        ["Does it need power or a pump?", "No. Sensor Fort needs nothing to run except your sensors. It is passive, with no moving parts, no electrical parts and no power. Sensors with 4 to 20 mA or Modbus outputs connect to any RTU, logger or SCADA host, or to an EDS Metalog 4G logger."],
        ["Can I measure flow at the same site?", "Yes. The spill lip is a hydraulic control, so the depth upstream rises predictably with flow. With Sensor Fort in the outlet pipe of a manhole, a level sensor above the chase measures that depth, and a rating curve for the mount turns it into flow."],
        ["Who makes Sensor Fort?", "EDS (Environmental Data Services) designed Sensor Fort and builds it in Australia, drawing on more than 30 years of experience in sewer monitoring. It is patent pending."],
      ],
    },
    drawing: {
      heading: "Dimensions of the SF 150",
      figures: ["dimensions", "end"],
      alt: "Dimension drawings of the SF 150: in plan it is 314 mm long and 149 mm wide; in section it is 114 mm high at the cable hoods, with the sensor axis 15 degrees tip down and the spill lip 40 mm above the invert; from downstream it fills the bottom of a 150 mm pipe",
      caption: "The SF 150, for a 150 mm sewer, in millimetres: plan, section on the centre line and the view from downstream. The other models are in the range table.",
    },
    specs: [
      ["General", [
        ["Product", "Sensor Fort (SF), passive sensor mount"],
        ["Origin", "Designed and built in Australia by EDS"],
        ["Function", "Holds one or two analytical sensors on the invert, with only their tips in the flow"],
        ["Pipe diameters", "150 mm to 1050 mm, with one model for each pipe diameter"],
        ["Pipe shape", "Circular pipe; U-shaped channels on request"],
        ["Operation", "Passive, with no moving parts, no electrical parts and no power"],
        ["Protection", "Patent pending"],
      ]],
      ["Sensor bays", [
        ["Number", "Two bays; a blanking plug closes an unused bay"],
        ["Sensor size", "Bodies to 28.5 mm in SF 150 and SF 225, 35.5 mm in SF 300 and SF 375, and 51 mm from SF 450"],
        ["Attitude", "Sensors lie 15° tip down, with their tips pointing downstream"],
        ["Tip exposure", "Flat tips sit flush with the stern; a 12 mm electrode stands 20 mm proud"],
        ["Sensor types", "Any cylindrical sensor that measures at its tip, including pH, ORP, conductivity and dissolved oxygen"],
        ["Bay sealing", "The bays flood in service; use plugs rated for immersion or a removable sealing gel"],
      ]],
      ["Fastening", [
        ["Sleeve", "One for each sensor family; sets the tip at the stern"],
        ["Clamp bar", "One bar beneath the stern and one M5 × 16 socket head cap screw fasten both sleeves"],
        ["Cable clamp", "One for each cable, with one M4 × 12 screw; takes any pull on the cable"],
      ]],
      ["Sleeves and parts, SF 150 and SF 225", [
        ["12 mm electrode", "Threaded sleeve for electrodes 120 mm long with a PG13.5 thread; leaves 20 mm of the tip in the flow"],
        ["22 to 26.7 mm", "Split sleeves for 22.0, 22.9, 25.4, 26.0 and 26.7 mm bodies; the 26.7 mm sleeve also suits 3/4 inch NPT threads"],
        ["28 to 28.5 mm", "Shims, as these bodies pass the stern ring bare"],
        ["Tail ring, plug", "A tail ring centres the rear of a slim body, and a blanking plug closes an unused bay"],
        ["Plug head", "Allow up to 24 mm in diameter for the plug head and cable coupling"],
        ["Larger models", "Sleeves are supplied to suit the sensors ordered"],
      ]],
      ["Service", [
        ["Concept", "Sensors are loaded and calibrated on the bench, and the whole mount is exchanged"],
        ["Interval", "Designed for 12 months between visits"],
        ["Sensor care", "No mount can prevent biofilm growth or reference ageing, so sensor choice and data checks still apply"],
      ]],
      ["Materials", [
        ["Body", "Moulded polymer, in cast polyurethane or HDPE"],
        ["Other parts", "Engineering polymer sleeves and clamps; 316 stainless steel band and fasteners"],
        ["Mass", "About 0.5 kg for the SF 150, without sensors"],
        ["Classified zones", "No electrical parts; specify a static dissipative body grade. Sensors are certified by the client"],
      ]],
      ["Installation", [
        ["Position", "Incoming pipe of a manhole, or the outlet pipe where flow is also measured"],
        ["Fixing", "EDS expansion band, with nothing drilled"],
        ["Orientation", "Thin feathered nose upstream, sensor tips downstream"],
        ["Cable route", "Beneath a hood on each shoulder, then in a covered channel to the obvert"],
        ["Access", "Confined space entry, as for an EDS flow sensor"],
        ["Cleaning, CCTV", "A jetting nozzle or camera crawler cannot pass; agree a removal procedure with the asset owner"],
      ]],
      ["Hydraulics, SF 375", [
        ["Lip height", "45 mm, or 12% of the diameter"],
        ["Area occupied", "7% of the pipe area at the widest section"],
        ["Upstream rise", "Up to 40 mm at a grade of 0.25%, 47 mm at 0.5% and 88 mm at 1%"],
        ["Tips covered", "Above about 2.5 L/s for a 35 mm sensor body"],
      ]],
      ["Flow indication", [
        ["Principle", "The spill lip acts as a hydraulic control, so upstream depth rises predictably with flow"],
        ["Measurement", "Level sensor above the chase of the manhole, or a pressure sensor in it, with the mount in the outlet pipe"],
        ["Rating", "Calculated rating curve for each model. SF 375: about 62 mm at 1 L/s, 113 mm at 10 L/s and 193 mm at 40 L/s"],
        ["Conditions", "Free flow over the lip; the rating does not apply once the lip is drowned"],
      ]],
      ["Dimensions, SF 150", [
        ["Length", "314 mm"],
        ["Width", "149 mm"],
        ["Height", "114 mm at the cable hoods"],
        ["Lip height", "40 mm above the invert"],
        ["Sensor axis", "15° tip down"],
        ["Bay diameter", "31.0 mm, stern ring 29.4 mm"],
      ]],
      ["Supplied by EDS", [
        ["Mount", "Made to the diameter of the sewer, with its clamp bar and cable clamps"],
        ["Sensor parts", "Sleeves, shims and plugs to suit your sensors"],
        ["In the pipe", "The EDS expansion band and the cable channel"],
        ["Service", "Bench loading, installation and the exchange service"],
        ["Where required", "The Metalog 4G logger, FlowSense and an upstream level sensor for flow"],
      ]],
      ["Ordering", [
        ["Model code", "SF followed by the pipe diameter in millimetres; for example, SF 375"],
        ["Pipe", "Internal diameter, material and condition"],
        ["Hydraulics", "Grade, dry weather flow range and overnight depth"],
        ["Sensors", "Make, model, body diameter and length, thread and plug head"],
        ["Site", "Depth of the manhole and the position of the pipe"],
        ["You supply", "Sensors and transmitters certified for your zone, the logger or RTU unless EDS supplies it, site access and the asset owner's approvals"],
      ]],
    ],
    specNav: "Specs",
    specNote: "Sensor Fort is patent pending. Hydraulic figures are calculated with the EDS hydraulic model. Specifications may change without notice.",
    worksWith: [
      ["products/metalog-4g.html", "Metalog 4G logger", "Logs 4 to 20 mA and Modbus sensors, and reports over 4G."],
      ["flowsense.html", "EDS FlowSense", "Flow and water quality from the site, on one record."],
      ["services/water-quality-monitoring.html", "Water Quality Monitoring", "pH, EC and more, from one sensor to a whole network."],
    ],
    cta: { title: "Tell us about your sewer and your sensors.", lede: "Give us the pipe diameter and grade, the flows you expect and the sensors you want to use. We'll confirm the Sensor Fort model and the sleeves, and plan the installation with your network team." },
  },
];

/* ------------------------------------------------------------------ */
/* FlowSense                                                           */
/* ------------------------------------------------------------------ */
export const flowsense = {
  title: "The whole network. Understood.",
  lede: "Live operations, infiltration and inflow, pump stations and calibrated hydraulic models, all on one validated record.",
  // The Network Overview under the hero, and the key figures beneath it.
  stage: {
    shot: "overview",
    alt: "The FlowSense Network Overview: six status figures across the top, a list of the sites that need attention, and a map of the network on aerial imagery.",
    caption: "The Network Overview lists the sites that need attention, worst first, beside a map of where they are. It refreshes every sixty seconds.",
  },
  facts: [
    ["60", "s", "refresh rate across the whole network"],
    ["5", "", "ways to connect your SCADA, with nothing installed on it"],
    ["8", "", "blockage signatures, six of them from a level reading alone"],
    ["16", "", "engineering tools on one GIS canvas, by project and scenario"],
  ],
  // The narrated video tour is sent on request, not shown on the site (EDS,
  // 11 November 2026: it tells competitors too much). `request` is what the
  // enquiry arrives naming, so EDS knows the visitor is asking for the video.
  video: {
    heading: "Take the video tour.",
    lede: "A 13-minute narrated tour of every screen. Tell us who you are and we'll send it to you.",
    action: "Request the video",
    request: "FlowSense video tour",
  },
  // Three products in one, and the purchase each one takes the place of.
  layers: {
    heading: "Three products in one, and one record underneath them.",
    lede: "Each layer is normally bought separately, with a spreadsheet in between. In FlowSense they share one database, one set of units and one timeline. The figure in the board paper is the reading in the chamber, and you can trace one to the other in your browser.",
    items: [
      ["activity", "Monitor", "Live fleet status, site detail, alarms, telemetry and battery health, rainfall context, and early warning of blockages weeks before a pipe surcharges.", "Replaces the logger vendor's portal"],
      ["chart-line", "Analyse", "Rainfall-derived infiltration and inflow in kilolitres, dry weather flow profiled, depth and velocity hydraulics, catchment flow balance and data quality scores.", "Replaces spreadsheets and manual I&I studies"],
      ["drafting-compass", "Engineer", "Project workspaces for calibrated rainfall response (RTK) models, a dynamic wave network model, the I/I heat map, and the cost per kilolitre of infiltration removed.", "Replaces a modelling consultancy engagement"],
    ],
  },
  // The tour: one stop per screen, in the order the platform's own menu
  // runs (Monitor, Analyse, Engineer, Deliver). `group` labels the first stop
  // of each part. `shots` are [name, alt], laid out by `layout`: one screen,
  // a `stack` (the second overlapping the first), two `beside` each other,
  // a `column` (one above the other), `wide` (across the page under the
  // copy) or `tall` (a phone beside the copy).
  tour: [
    {
      id: "monitor", group: "Monitor", heading: "Every site, every minute. Worst first.",
      lede: "The Overview opens with the sites that need attention, listed beside a map that shows where they are. Point at a row and its site is ringed on the map. Filter the map by what is wrong, then click through to the site.",
      points: [
        ["Six figures across the top", "Five open their own list. Alarms to acknowledge are kept apart from any still breaching."],
        ["Since you last looked", "One line on what changed since your last visit: alarms raised, blockage warnings, sites gone quiet."],
        ["Needs attention, worst first", "One row per site with its reason: alarms newest first, then recent failures, then the backlog."],
        ["Where it is", "Every site on aerial imagery, ringed amber while an alarm waits and red while one is breaching. Rain radar is one click away."],
      ],
      layout: "single", shots: [["network-map", "The FlowSense network map on aerial imagery, with the Layers panel narrowing it to alarms, telemetry, battery and hydraulic risk."]],
    },
    {
      id: "usual", heading: "Every site, judged against its own usual.",
      lede: "FlowSense compares each site's latest hour with its usual pattern for that day and time, learnt from its own record. It says plainly when a site is running above or below.",
      points: [
        ["Small departures stay quiet", "A move under 10% isn't called out, so the list isn't a wall of amber."],
        ["No reading, no verdict", "A site whose newest reading is more than a day old gets no verdict, not a guess."],
        ["Weather is not a fault", "Rain in the last day is shown beside the verdict, so a rise after rain is never read as a problem."],
        ["Every channel, not only flow", "The list shows whatever a site measures: pH, conductivity, rain, gas, pump runs, power."],
      ],
      layout: "single", shots: [["flow-analytics", "The FlowSense Flow Analytics page: a card for every site with its 24-hour trend, latest readings and status."]],
    },
    {
      id: "sites", heading: "Whatever the site measures, in the form that suits it.",
      lede: "A gravity sewer, a pump station, a trade waste discharge and an overflow chamber each get one page, laid out for what that site measures. Every chart zooms, pans and exports, and the link you send a colleague opens the same view.",
      points: [
        ["A tile for each measurement", "Set against this time yesterday, with the daily volume, the hours it is based on, and the logger."],
        ["Pumps read as states", "A pump shows how long and how often it ran, never an average."],
        ["Any window on one time axis", "Each measurement has its own pane, with pump runs and alarms drawn as lanes on the same axis."],
        ["Honest about gaps", "Every trace breaks where the logger went quiet, rather than drawing across the gap."],
      ],
      layout: "stack", shots: [["site-page", "A FlowSense site page: the verdict against usual beside the site's name, then tiles for flow, depth, velocity and temperature."], ["site-month", "A month of flow, depth, velocity and temperature on one time axis in FlowSense, with a storm and its alarm flagged on the trace."]],
    },
    {
      id: "fleet", heading: "The failing logger, named before it goes quiet.",
      lede: "A monitoring program fails quietly. A battery flattens, a modem stops answering, and the quarter's report is already wrong. FlowSense watches the fleet itself, and puts what needs attention first.",
      points: [
        ["A replace-by date for every battery", "Projected from the site's own discharge trend and battery chemistry. A dying logger becomes a planned visit."],
        ["Late, judged site by site", "Offline means a site missed its own delivery deadline, so a twice-daily logger is never reported late at hour three."],
        ["Alarms that reach a person", "Threshold, no data and pump condition rules send email and SMS once, when the state changes. They go to people, not to addresses."],
        ["Monday, in the inbox", "Each reader gets a summary of their own network, waiting at the start of the week."],
      ],
      layout: "stack", shots: [["fleet-health", "FlowSense Fleet Health: every logger on the account with its battery, delivery record and a replace-by date."], ["alarms", "The FlowSense alarm queue: every rule that has tripped, unanswered first, with cleared alarms kept apart from those still breaching."]],
    },
    {
      id: "blockage-watch", heading: "Blockages found in dry weather, weeks before they overflow.",
      lede: "A sewer drains almost empty overnight, and an obstruction shows in that trough long before anyone rings the council. Blockage Watch reads it twice a day, sets rain aside, and runs on every gravity sewer you monitor without being asked.",
      points: [
        ["A decision, ranked", "What needs a decision first, with its case number, then the sites behaving normally."],
        ["The call that saves a crew", "The level is up because more water is arriving: increased load, not an obstruction. No jetting."],
        ["The numbers behind it", "Overnight level and its trend, the headroom left in the pipe, evidence strength and dry days judged."],
        ["Tested on your own history", "A one-click backtest replays the detector against the overflows already in your register. The hit rate you see is yours."],
      ],
      layout: "beside", shots: [["blockage-watch", "FlowSense Blockage Watch: the sites needing a decision first, each with its score, mechanism and case, and clear sites folded below."], ["blockage-case", "A Blockage Watch case file in FlowSense: the verdict on its score ladder, the key numbers, and every night of evidence behind it."]],
    },
    {
      id: "analyse", group: "Analyse", heading: "Infiltration and inflow, in kilolitres.",
      lede: "“This catchment is wet” is not a business case. A volume, a peak, a lag and a percentage over dry weather flow is. FlowSense separates the storm from the sewage beneath it and reports what the difference is worth, per catchment and per storm.",
      points: [
        ["A baseline that moves", "Dry weather flow from dry days only, split by day type, so a weekend or wet winter is never blamed on the storm."],
        ["The three-way split", "Sanitary flow, groundwater infiltration and rainfall-derived inflow add up exactly to the metered total."],
        ["Catchment closure", "Upstream against downstream, aligned on travel time, so you know how much of the flow is accounted for."],
        ["A price on the water", "Volumes priced at your own treatment and pumping rates, carried into the capital plan unchanged."],
      ],
      layout: "column", shots: [["ii-figures", "The infiltration and inflow figures for one site in FlowSense: peak inflow, volume in kilolitres, percentage over dry weather flow, lag, dry weather flow and night baseline."], ["rdii-hydrograph", "An RDII hydrograph in FlowSense: measured flow in blue, the modelled dry weather baseline dashed beneath it, and the rainfall-derived inflow in red."]],
    },
    {
      id: "data-quality", heading: "Check the instrument before you trust the number.",
      lede: "Every figure in FlowSense rests on the record being sound. So it scores the record first, names the weak channel, and shows its working when it repairs anything.",
      points: [
        ["Depth against velocity", "Every depth and velocity pair over the window, coloured by flow. Silt, surcharge, backwater and a failing meter each leave a different shape."],
        ["Three scores, named for what they score", "Operator health, telemetry and anomalies, with each channel's completeness and gaps listed, not averaged away."],
        ["The full QARTOD test battery", "Gross range, climatology, spikes, rate of change, flatlines and cross-channel residuals, each with a recommended repair."],
        ["Repairs never overwrite a reading", "Filled gaps live only in the analysis and the export. The reading the instrument produced is always there to go back to."],
      ],
      layout: "beside", shots: [["scattergraph", "A FlowSense scattergraph of depth against velocity, coloured by flow, with the correlation, ranges and sample count beneath it."], ["site-diagnostics", "FlowSense site diagnostics: operator health, telemetry and anomaly scores, with each channel's completeness, gaps and last reading."]],
    },
    {
      id: "engineer", group: "Engineer", heading: "Severity painted onto the real network.",
      lede: "FlowSense traces infiltration and inflow along the gravity network, by catchment and flow direction, with a confidence for each estimate. The result: a ranked list of pipes worth sending a camera down.",
      points: [
        ["Six methods", "You choose the method, and the platform says where your data can't support it."],
        ["Along the pipes", "Severity follows the way the sewer drains, not a circle drawn round a meter."],
        ["Confidence, 0 to 1", "Pipes far from a gauge fade, rather than pretend to a number."],
        ["Your GIS, as supplied", "The council's sewer layer loads from the file it came in, and the map exports as an A4 report."],
      ],
      layout: "wide", shots: [["heat-map", "The FlowSense I/I heat map: severity painted along the sewer network over aerial imagery, with the inspection priority list of the pipes most likely to be sources."]],
    },
    {
      id: "modelling", heading: "A calibrated model you keep, not a report you file.",
      lede: "FlowSense runs calibration, validation and a dynamic wave network model as a project your engineers keep. When the question comes back next year, you run it again instead of commissioning it again.",
      points: [
        ["Every storm scored on its own", "Simulated peak within 15% below to 25% above observed, and event volume within 10% below to 20% above, to the CIWEM Code of Practice."],
        ["Honest about its own ceiling", "Measured inflow carries noise from the baseline, so the workspace shows the best possible score beside the one achieved."],
        ["Dynamic wave hydraulics", "Pipes, pumps, gates and control rules, run from the network's own dry weather state and exported to EPA SWMM 5."],
        ["The capital plan", "Options ranked by net present value, benefit-cost ratio and cost per kilolitre removed."],
      ],
      tools: ["I/I Heat Map", "RTK Calibration", "RTK Validation", "Hydraulics", "Scattergraph", "Pump Station", "Overflow Forecast", "Capital Plan", "Compliance", "Catchment Model", "Dry Weather Flow", "Events", "Data Scrubbing", "QA and QC", "Compare", "Export"],
      toolsNote: "Sixteen tools on a GIS canvas, organised by project and scenario.",
      layout: "single", shots: [["rtk-calibration", "A rainfall response (RTK) calibration scored in FlowSense: the fit score beside the best score available on this record, and each storm scored separately."]],
    },
    {
      id: "reports", group: "Deliver", heading: "The board paper, from the record your operators use.",
      lede: "Seven templates, each written for a different reader and generated from the same validated record, under your logo. The quarterly pack stops being a fortnight of copying charts.",
      points: [
        ["A template for every reader", "Executive summary, flow totals, flow analysis, engineering diagnostic, site investigation, network performance, and pump stations."],
        ["Context, not just totals", "Each period is set against five other windows, including the same weeks last year."],
        ["In the inbox, by the calendar", "Daily, weekly or monthly by email, each over whole days, so one issue compares with the last."],
        ["Feeds on a schedule", "CSV by SFTP or FTPS, CSV or JSON by MQTT, with run history. A failed send never skips a window."],
      ],
      layout: "beside", shots: [["report-builder", "The FlowSense report builder: template, sections, sites and period, previewed before anything is exported."], ["report", "A generated FlowSense executive summary: headline figures, the network's daily volume stacked by site, and telemetry health for every site."]],
    },
    {
      id: "field", heading: "The office and the manhole see the same thing.",
      lede: "Your account works on a phone, with nothing to install and no second licence. What the crew finds sits beside the data it explains, where next year's engineer will find it.",
      points: [
        ["Notes with photographs", "Observation, maintenance and calibration notes, with photos and video from the phone in the crew's pocket."],
        ["Surveys that write the paperwork", "The pre-installation survey fills in the inspection report, manhole diagram included."],
        ["A link for the contractor", "A single-use link with no login opens one job and nothing else. What they find comes back as a field note, photographs attached."],
        ["The instrument's history", "Zero checks, reference readings and meter comparisons kept against the site, for the year somebody asks."],
      ],
      layout: "tall", shots: [["phone", "The FlowSense Network Overview on a phone: what needs attention first, and a tab bar for the pages used most."]],
    },
  ],
  // The showpiece. PSM is the oldest idea in EDS and one of the most used
  // tools in FlowSense. The pins sit on the screen at fractions of its width
  // and height, each in its panel's own white space so it hides no text;
  // check them after the brochure is replaced.
  psm: {
    eyebrow: "Pump Station Manager",
    heading: "Station flow from the pumps you already run. No flow meter.",
    lede: "A wet well fills as sewage arrives and empties as the pumps move it. So its level, the pump run states and its size make a flow record. EDS has built PSM on that idea since 1991. Today it's one of the most used tools in FlowSense.",
    shot: ["psm", "The FlowSense Pump Station Manager: the station's figures across the top, the wet well drawn to scale with its set-points, a briefing in words, and each pump's delivery against its rating on a dial."],
    pins: [
      ["The station's figures first", "What arrived, what was pumped out, and the balance of the two over whole pump cycles.", 26.8, 42.9],
      ["The wet well, in kilolitres", "An engineer's section of the well, with its start and stop levels and the volume each cycle moves.", 31.1, 56.4],
      ["A briefing, in words", "What is worth watching and what is for the record, each with a button to its evidence.", 84.7, 55.4],
      ["Pump condition, with a date", "Each pump against its rating, a warning when its output slips, and remaining useful life as a range.", 90.4, 70.4],
    ],
    trace: {
      title: "Two slopes and a well volume are enough.",
      text: "One slope gives the inflow, the other gives what each pump is actually delivering today. Five hours of wet well level, one station: a schematic, not measured data.",
      rise: "Filling as sewage arrives", fall: "Emptying as the pumps run",
    },
    points: [
      ["Station flow without a flow meter", "Inflow from the wet well level, plus volume pumped, starts and run hours, with the well itself in kilolitres. No chamber work, no meter to buy, no confined space entry."],
      ["Pump delivery measured, not rated", "Each pump's delivery is the median of its measured days, set against its nameplate or its own first month. Pumps sharing a rising main are never judged against their ratings added up, since together they deliver less."],
      ["Pump condition, with the time each pump has left", "On dry days each pump is compared with its own reference. A slow decline, a sudden drop or a stopped pump raises a finding and an alarm. Remaining useful life is given as a range, to ISO 13381-1."],
    ],
    needs: "It needs very little: the wet well level signal, pump run states as numbers, and the well dimensions. Most stations already produce the first two, so this is usually the cheapest flow data an authority can add.",
    link: ["services/pump-station-monitoring.html", "Pump station monitoring by EDS"],
  },
  connect: {
    heading: "Bring the fleet you own and the SCADA you run.",
    lede: "Nothing here asks you to replace an instrument or start your record again. Several logger brands, two SCADA systems and a decade of spreadsheets land in one account and read as one network.",
    in: ["Your loggers, collected by EDS, from several manufacturers", "Your SCADA sends, by HTTPS push or MQTT, with nothing installed on it", "We read your system by API, on a schedule", "We collect your files from your SFTP or FTPS server", "You drop files into an SFTP folder we host for you", "Reviewed CSV import, staged and checked before it lands"],
    record: ["Field time kept, never the time it was collected", "Duplicates dropped, so anything can be safely re-sent", "All or nothing: no half loaded day, ever", "Unknown tags wait for a person to map them, not a guess"],
    out: ["Back to your SCADA, on a schedule", "CSV by SFTP or FTPS, CSV or JSON by MQTT", "A read API and signed webhooks, for your historian or BI stack", "Model exports: EPA SWMM 5, GeoJSON, Excel", "Branded reports, PDF and CSV, under your name", "Everything, on exit: your record leaves with you"],
    note: "Commissioned with you. We set up every connection with your IT or SCADA people, using documents written for them. A connection isn't done until a reading has arrived and been checked.",
  },
  apart: {
    heading: "Eight things you won't find together elsewhere in Australia.",
    lede: "No other platform sold in Australia carries a reading the whole way, from the chamber to the capital plan, on one record and in one subscription. Each of these answers a question an authority is asked every year.",
    items: [
      ["One record, end to end", "The reading in the chamber and the figure in the board paper are the same number, never retyped."],
      ["Blockages read from the pipe", "Eight dry weather signatures that name the mechanism and the action, backtested on your own overflows."],
      ["Flow from every pump station", "Station inflow and pump condition from the level and run signals you already have."],
      ["Infiltration that adds up", "Sanitary, groundwater and rainfall-derived flow, summing exactly to the metered total."],
      ["Models you keep", "Storm-by-storm calibration, a dynamic wave network and a costed plan, in one workspace."],
      ["Data both ways", "Five ways in from your SCADA, and the validated record back out."],
      ["Every number shows its working", "“How this is calculated” on the figures that matter, naming the method and the standard."],
      ["Priced by the site", "Everything included, unlimited users, and no editions to choose between."],
    ],
  },
  standards: {
    heading: "Built to the published standards, and tested against them.",
    lede: "Each calculation in FlowSense cites the standard it follows, where your reviewer can read it. The list comes from the running software, so a standard nothing uses can't appear on it. Tests against the code check it on every release.",
    items: [
      ["drafting-compass", "CIWEM UDG Code of Practice (2017)", "Storm-by-storm calibration acceptance bands, and dry weather flow as a daily pattern for each type of day."],
      ["droplets", "WEF MOP FD-6 and WPCF MOP No. 36", "Dry weather flow as sanitary flow plus groundwater infiltration, from qualifying dry days only."],
      ["ruler", "WSA 02 Sewerage Code of Australia", "Self-cleansing velocity, level of service checks, and Colebrook-White friction for each pipe."],
      ["cloud-rain", "AR&R 2019 and AS/NZS 3500.3", "Areal reduction factors, design rainfall temporal patterns, and the Rational Method for ungauged subcatchments."],
      ["list-checks", "QARTOD", "The quality control tests and flag vocabulary used to score each record before it is trusted."],
      ["git-branch", "EPA SWMM", "Dynamic wave routing, and the three-component RTK method for rainfall-derived infiltration and inflow."],
      ["fan", "ISO 13381-1", "A pump's remaining useful life, counted down to a stated limit and given with its uncertainty."],
      ["scale", "NSW Liquid Trade Waste Guidelines (2021)", "Trade waste charges: the annual fee, usage, excess mass and pH charges, on a trade waste account."],
    ],
    methods: ["Saint-Venant", "Preissmann slot", "Manning", "Colebrook-White", "Muskingum-Cunge", "Rational Method", "Nash-Sutcliffe", "Kling-Gupta", "Theil-Sen", "Hampel", "Matérn 3/2 Gaussian process", "ISO 8601 on every boundary", "WCAG 2.1 AA contrast"],
    methodsNote: "Published methods implemented rather than approximated.",
    instruments: "The instruments EDS supplies carry their own certification. The Detectronic LIDoTT range is MCERTS certified for flow metering and rated ATEX and IECEx Zone 0 for hazardous atmospheres. A certified meter keeps its certification when its readings reach FlowSense, which stores the field time and the raw value.",
    note: "FlowSense is built to these standards and tested against them on every release. EDS does not describe the software as certified, accredited or endorsed by the bodies that publish them.",
    assurance: [
      ["server", "Hosted in Sydney", "DigitalOcean's Sydney region, backed up nightly."],
      ["lock", "Encrypted in transit", "Current TLS, with strict transport security."],
      ["shield-check", "Two-factor sign-in", "Time-based codes, to RFC 6238, which EDS can require by role."],
      ["users", "Access down to the channel", "Roles, pages, sites and channels, set by you."],
      ["scroll-text", "A full audit trail", "Who signed in, viewed, changed and exported, kept for at least a year."],
      ["key-round", "Tokens that only write", "A leaked token cannot read a stored value."],
    ],
    clientsHeading: "Since 1991, EDS has measured water and wastewater for",
    clientsNote: "Logos are of organisations EDS has supplied, monitored or worked for since 1991. They are the trademarks of their owners and do not indicate use of FlowSense.",
  },
  faq: [
    ["Who owns the data?", "You do. Export it in open formats at no charge, and if you cancel at renewal, all of it goes with you."],
    ["Do we need to install anything?", "No. FlowSense runs in the browser on desktop, tablet and phone. Connecting your SCADA needs no agent, connector or gateway on your systems, and FlowSense has no control path into them."],
    ["Does it only work with EDS instruments?", "No. FlowSense is vendor independent. It can collect from your own loggers, or take data from your SCADA by HTTPS, MQTT, API, SFTP or FTPS."],
    ["Where is the data hosted, and how is it secured?", "In Australia, in DigitalOcean's Sydney region. Sign-in supports two-factor codes, and you set each person's access down to individual sites and channels. An audit trail records every sign-in, view, change and export."],
    ["Can the data go back into our SCADA or historian?", "Yes. By scheduled CSV files over SFTP or FTPS, MQTT messages to your broker, or a read API. Signed webhooks fire when an alarm is raised or cleared, a forecast puts a site at risk, or Blockage Watch flags a blockage."],
    ["How many people can use it?", "Unlimited users, with role-based access, and admin you can hand to your own team."],
    ["What does Blockage Watch not do?", "It's a statistical early warning from each sensor's own history. It says the pipe reaching that sensor is behaving differently, for a reason rain doesn't explain. It doesn't locate the obstruction, and can't see one downstream of the meter."],
    ["How do we get started?", "Ask us for a walkthrough using your own sites. We'll demonstrate FlowSense live and show you the working behind every number on the screen."],
  ],
  docs: [
    { label: "Platform overview", note: "The short introduction: what FlowSense does, from the instrument in the pipe to the board paper.", href: localDoc("eds-flowsense-platform-overview.pdf") },
    { label: "Platform brochure", note: "The whole platform at a glance, in sixteen pages: the screens, the standards it follows and the pricing.", href: localDoc("eds-flowsense-brochure.pdf") },
    { label: "Detailed brochure", note: "The longer read: each screen explained, how Blockage Watch and the Pump Station Manager reach a verdict, and the pricing terms in full.", href: localDoc("eds-flowsense-platform-brochure.pdf") },
    { label: "Platform datasheet", note: "The technical reference: every way data gets in and out, the engineering tools, the standards and where the boundaries sit.", href: localDoc("eds-flowsense-datasheet.pdf") },
    { label: "Features and benefits", note: "What FlowSense does to monitor, analyse and engineer a sewer network.", href: localDoc("eds-flowsense-features-and-benefits.pdf") },
    { label: "The value case", note: "Monitoring, modelling, alerting and the infiltration study in one subscription, priced against what the market publishes.", href: localDoc("eds-flowsense-value-case.pdf") },
    { label: "Competitive brochure", note: "Why depth and velocity together matter, and how FlowSense compares with ADS, StormHarvester and Kallipr.", href: localDoc("eds-flowsense-competitive-brochure.pdf") },
    { label: "Connecting your SCADA", note: "The five ways readings get in, with ports and setup. For engineering, control systems and IT teams.", href: localDoc("eds-flowsense-connecting-your-scada.pdf") },
    { label: "Sending data to your SCADA", note: "The four standing feeds back out to your SCADA, historian or reporting tools.", href: localDoc("eds-flowsense-data-to-scada.pdf") },
    { label: "Industry paper: One Platform, Many Sources", note: "The case for bringing every logger brand and your SCADA data onto one platform, with the savings costed.", href: localDoc("eds-industry-paper-one-platform-many-sources.pdf") },
  ],
};

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */
export const about = {
  intro: [
    "Graham and Cynthia Harper founded Environmental Data Services (EDS) in Queensland in 1991. Today we're Australia's largest supplier of monitoring equipment to the water and wastewater industry, and still Australian owned.",
    "We also supply instruments and services to mining, manufacturing, power and processing. Our team covers every part of environmental monitoring, from the manhole to the final report.",
    "Our purpose is simple: to give you data you can trust, and the confidence to act on it. We build the instruments, the platform and the field services that make that possible.",
  ],
  mission: [
    "We judge our equipment and our service by one thing: did you get the outcome you needed? Behind that is real curiosity about how networks behave, and the engineering to measure them properly.",
    "Good environmental decisions need good data. We give organisations the tools and the insight to make them, and a more sustainable future follows.",
  ],
  timeline: [
    ["Early 1970s", "Elite Electronics", "Graham Harper began building businesses in electronics."],
    ["Early 1980s", "ELPRO", "Graham started ELPRO, now one of the world's largest SCADA suppliers."],
    ["1991", "EDS is founded", "Graham and Cynthia Harper established EDS in Queensland, with the release of its flagship product, the Pump Station Manager (PSM)."],
    ["1990s", "Bureau of Meteorology loggers", "Graham developed the EDS data logger for the Bureau of Meteorology, still in use today, then moved into flow with the Marsh-McBirney range, now Hach."],
    ["2001–02", "Amberley Fire Training Facility", "EDS built the facility under Graham's leadership."],
    ["2003", "Defence facility contract", "EDS began servicing and monitoring the Australian Defence facility, under a contract still in place."],
    ["2005", "A founder's legacy", "Graham sadly passed away. EDS has continued to grow under Cynthia's leadership."],
    ["2022–23", "Goulburn Valley Water, Kilmore", "EDS monitored sewer flow at 10 sites in Kilmore, supporting Goulburn Valley Water's infrastructure planning and management."],
    ["2023", "Sydney Water panel provider", "EDS was awarded a five-year panel contract to supply sewer flow and level instruments to Sydney Water."],
    ["2023", "North East Water", "EDS monitored sewers and rainfall at 15 sites over eight weeks, giving North East Water high-resolution data for infrastructure planning."],
    ["2023", "Townsville City Council, Wulguru & Pallarenda", "EDS installed and ran sewer monitoring at 34 sites over 12 weeks, to inform the council's infrastructure planning."],
    ["2023–24", "Yarra Valley Water gauge calibrations", "EDS calibrated long-term sewer flow gauges across multiple Yarra Valley Water sites, keeping the data reliable for modelling and planning."],
    ["2023–24", "Cairns Regional Council monitoring stations", "EDS installed and maintains long-term sewer monitoring stations, giving the council continuous flow and water quality data."],
    ["2024", "Wingecarribee Shire Council", "EDS installed 15 short-term sewer flow gauges across the Mittagong and Robertson catchments."],
    ["2026", "Transurban service provider", "EDS was awarded a service provider contract with Transurban to service and maintain key tunnel infrastructure."],
    ["Today", "Australia's largest supplier", "EDS is now Australia's largest supplier of equipment for the water and wastewater industry. It was also awarded the largest sewer monitoring project in Australia in recent years."],
  ],
  approach: {
    heading: "Instruments, crews and data, from one team.",
    lede: "We make instruments, represent leading manufacturers, install and maintain them with our own crews, and deliver the data. One team answers for all of it, so there's never anyone else to call.",
    items: [
      ["cpu", "Manufacturer and representative", "We design and build our own loggers and sensors, and represent Detectronic, ORI, Hach, Beadedstream and others."],
      ["hard-hat", "Our own field crews", "Engineers and technicians trained in installation, maintenance and calibration, working from four offices and travelling Australia-wide."],
      ["shield-check", "Certified for hazardous areas", "Intrinsically safe equipment certified under ATEX and IECEx, including Zone 0 instruments for sewers."],
      ["badge-check", "Data you can defend", "ISO-compliant data validation, with continuous QA/QC and calibration checks throughout every program."],
      ["waves", "One platform", "Readings arrive in EDS FlowSense, built and supported in Australia, or go straight to your own SCADA and systems."],
      ["key-round", "Your data, always", "Full access to the data we collect, in open formats, through FlowSense or by API."],
    ],
  },
  founder: { name: "Cynthia Harper", role: "Co-founder, Environmental Data Services", text: "EDS continues to strive to deliver the level of service and professionalism that was part of Graham's founding ethos." },
  // Photographs from EDS sites: one beside the timeline on the home page, and
  // the mosaic on the about page (the first photo is the large one).
  homePhoto: { photo: "crew-confined-space", alt: "Two crew in hi-vis beside an entry tripod set over an open manhole on a gravel track in bushland, with a confined space warning sign in the foreground", caption: "A crew set up for a confined space entry, with the tripod over the manhole and the warning sign out.", pos: "42% 50%" },
  field: {
    heading: "The work, as it is.",
    lede: "Sewers, chambers, cabinets and poles: the sites our crews instrument, visit and keep reporting.",
    photos: [
      { photo: "sewer-av-meter", alt: "An area velocity flow meter on a mounting band at the invert of a sewer, seen from the manhole above, with wastewater flowing over it", caption: "An area velocity flow meter in the channel of a sewer." },
      { photo: "site-crew-manhole", alt: "A manhole in a park, with an access hatch behind a safety rail and a white van parked beyond it", caption: "A site visit." },
      { photo: "telemetry-pole-solar", alt: "A solar panel and a telemetry enclosure mounted on a pole beside a monitoring site", caption: "A solar-powered telemetry site.", pos: "50% 18%" },
      { photo: "sewer-sensors-chamber", alt: "A sewer chamber with a level float and an area velocity sensor installed in the flow", caption: "Level and velocity sensors in a chamber." },
      { photo: "telemetry-cabinet", alt: "An open site cabinet with a data logger, a modem and a power supply mounted inside", caption: "Inside a site cabinet.", pos: "50% 62%" },
    ],
  },
  quote: { text: "EDS helped us design and implement a user friendly and rugged sewer monitoring program that was completely remote. The level of service and professionalism received by EDS is always leading the industry.", who: "Tony Cockrel", org: "DERM" },
};

/* ------------------------------------------------------------------ */
/* Selling points shared across pages                                  */
/* ------------------------------------------------------------------ */
// The three ways to work with EDS, shown on the home, services and products
// pages. `topic` and `mode` pre-fill the enquiry form (see contactHref()).
export const ways = {
  heading: "Buy it, hire it, or let EDS run it.",
  lede: "However you fund your program, you get the same instruments, our own crews from four offices and FlowSense. Pick the way that suits your budget and timeline.",
  items: [
    {
      mode: "buy", icon: "package", title: "Buy", line: "Own the instruments",
      text: "Choose from one of Australia's largest ranges of monitoring instruments, built by EDS or the manufacturers we represent.",
      points: ["Supply, installation and commissioning", "On-site audits and calibration", "Training for your staff"],
      link: ["products/index.html", "Browse products"], topic: "Product pricing", cta: "Request pricing",
    },
    {
      mode: "hire", icon: "calendar-clock", title: "Hire", line: "For a study or a season",
      text: "Short- and long-term hire from the EDS fleet, installed by you or by trained EDS crews.",
      points: ["Flow meters, samplers and loggers", "Custom packages for difficult sites", "Expert advice on the right setup"],
      link: ["services/equipment-rental.html", "Equipment rental"], topic: "Equipment Rental", cta: "Start an enquiry",
    },
    {
      mode: "managed", icon: "database-zap", title: "Data as a Service", line: "No capital outlay",
      text: "EDS selects the sites, installs and maintains the equipment and validates the data continuously. You pay for data you can rely on, with nothing to own.",
      points: ["99.95% data availability", "Continuous QA/QC and calibration", "Real-time alerts in FlowSense"],
      link: ["services/data-as-a-service.html", "How DaaS works"], topic: "Sewer Flow Data as a Service", cta: "Start an enquiry",
    },
  ],
};

// Outcomes from EDS projects, each told elsewhere on the site (the data
// analysis and works verification pages, the about timeline and the white
// papers). Those marked `home` are shown on the home page, in one row of four;
// each is also shown on the service and solution pages listed in `services`,
// two at most.
export const results = [
  {
    stat: "$6M", label: "treatment plant expansion avoided", who: "Regional council", home: true,
    text: "Twenty short-term flow meters and on-site rain gauges showed three subcatchments carried 65% of the I&I. Capital went into relining and inflow reduction instead, and peak wet weather flows fell 35% within two years.",
    services: ["inflow-infiltration-studies", "sewer-flow-monitoring", "rainfall-monitoring"],
  },
  {
    stat: "34", label: "sites installed and operated in 12 weeks", who: "Townsville City Council", home: true,
    text: "Sewer monitoring across the Wulguru and Pallarenda catchments, to inform the council's infrastructure planning and management.",
    services: ["sewer-flow-monitoring", "wastewater-monitoring"],
  },
  {
    stat: "24 h", label: "until flows were back at baseline after relining", who: "Coastal network", home: true,
    text: "After cleaning and relining, our flow profiles showed the network back to baseline within a day, confirming full capacity was restored.",
    services: ["data-analysis-reporting", "rehabilitation-verification", "asset-network-assessment"],
  },
  {
    stat: "15", label: "sites of sewer flow and rainfall monitoring in eight weeks", who: "North East Water", home: true,
    text: "High-resolution sewer flow and rainfall monitoring, giving the utility the data it needed for infrastructure planning.",
    services: ["rainfall-monitoring", "sewer-flow-monitoring", "wastewater-monitoring"],
  },
  {
    stat: "40%", label: "less variation in depth and flow during rain", who: "Metropolitan utility",
    text: "Monitoring after relining showed far less variation in wet weather. The works had cut infiltration, and the model's predicted improvement was real.",
    services: ["rehabilitation-verification"],
  },
  {
    stat: "30%", label: "less spent on unnecessary relining", who: "Regional NSW council",
    text: "Reliable flow data mapped inflow severity across catchments. CCTV inspections and rehabilitation budgets went where they were needed, and compliance targets came sooner.",
    services: ["network-assessment", "data-analysis-reporting", "asset-network-assessment"],
  },
];

// How a monitoring program runs, on the service pages marked `process: true`.
export const programSteps = [
  ["map", "Scope and site selection", "Agree what the data has to answer, then choose sites by their hydraulics, not their convenience."],
  ["hard-hat", "Install and commission", "Trained EDS crews install intrinsically safe instruments, Australia-wide, and check every site before it goes live."],
  ["activity", "Monitor and validate", "Readings arrive over 4G into FlowSense, with continuous QA/QC and alarms when something changes."],
  ["file-chart-column", "Report and recommend", "Validated data and a report that shows where the problems are and what to fix first, or a feed into your model by API."],
];

export const industries = [
  ["droplets", "Water & Wastewater", "Councils, utilities and water authorities."],
  ["trees", "Environment", "Catchments, rivers and compliance monitoring."],
  ["factory", "Industrial", "Mining, manufacturing, power and processing."],
  ["landmark", "Government", "Federal, state and local, including Defence."],
];

// Client logos, on transparent backgrounds made by tools/logos.py.
export const clients = [
  ["Downer", "client-downer.png"],
  ["Ventia", "client-ventia.png"],
  ["Bureau of Meteorology", "client-bureau-of-meteorology.png"],
  ["Yarra Valley Water", "client-yarra-valley-water.png"],
  ["Sydney Water", "client-sydney-water.png"],
  ["Hunter Water", "client-hunter-water.png"],
  ["Urban Utilities", "client-urban-utilities.png"],
  ["Aurecon", "client-aurecon.png"],
  ["Stantec", "client-stantec.png"],
  ["Water Corporation", "client-water-corporation.png"],
  ["Hach", "client-hach.png"],
  ["Transurban", "client-transurban.png"],
  ["GHD", "client-ghd.png"],
  ["SMEC", "client-smec.png"],
  ["Veolia", "client-veolia.png"],
].map(([name, file]) => ({ name, src: img(file) }));

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */
export const papers = [
  {
    id: "one-platform-many-sources",
    kind: "Industry paper",
    title: "One Platform, Many Sources",
    date: "October 2026",
    text: "The savings from bringing flow data from several logger brands and your SCADA historian onto one platform. It puts a cost on what fragmentation hides, from manual data handling to faults found too late, with FlowSense as the worked example.",
    href: localDoc("eds-industry-paper-one-platform-many-sources.pdf"),
  },
  {
    id: "unforeseen-benefits",
    title: "The Unforeseen Benefits of Sewer Inflow & Infiltration Monitoring",
    date: "October 2025",
    text: "How sewer flow monitoring delivers far more than I&I insights. Real projects across Australia show flow data helping utilities find blockages, check maintenance, identify cross connections, tune pumps and target investment.",
    href: localDoc("eds-white-paper-unforeseen-benefits-of-ii-monitoring.pdf"),
  },
  {
    id: "measuring-the-invisible",
    title: "Inflow & Infiltration: Measuring the Invisible Problem",
    date: "July 2025",
    text: "Stormwater and groundwater in sewers remain one of the costliest, most complex challenges for councils and utilities. With assets under pressure and budgets tight, targeting I&I matters more than ever.",
    href: localDoc("eds-white-paper-measuring-the-invisible-problem.pdf"),
  },
  {
    id: "thermistor-strings",
    title: "Thermistor Strings with Open Channel Sewer Flow Meters to Locate Infiltration",
    date: "July 2024",
    text: "How thermistor strings and open channel sewer flow meters together pinpoint infiltration, with real-time monitoring, non-intrusive installation and significant cost savings.",
    href: localDoc("eds-white-paper-thermistor-strings.pdf"),
  },
];

export const downloads = [
  {
    group: "Software and drivers",
    icon: "hard-drive-download",
    items: [
      ["FSDATA Desktop for FL1500 (32-bit)", localDoc("hach-flow-fsdata-desktop-32bit.zip")],
      ["FSDATA Desktop for FL1500 (64-bit)", localDoc("hach-flow-fsdata-desktop-64bit.zip")],
      ["USB-Serial Adapter GXU driver", localDoc("gxmu-1200-usb-serial-drivers.zip")],
      ["EMS-Flow software user manual", localDoc("eds-ems-flow-user-manual.pdf")],
    ],
    note: "EDS (EMS2001, EMS4000), Hach Flo-Ware and Dynaflox RS-232 software are available on request. Contact us for a password.",
  },
  {
    group: "EDS FlowSense",
    icon: "waves",
    items: [
      ["FlowSense platform overview", localDoc("eds-flowsense-platform-overview.pdf")],
      ["FlowSense platform brochure", localDoc("eds-flowsense-brochure.pdf")],
      ["FlowSense detailed brochure", localDoc("eds-flowsense-platform-brochure.pdf")],
      ["FlowSense platform datasheet", localDoc("eds-flowsense-datasheet.pdf")],
      ["FlowSense features and benefits", localDoc("eds-flowsense-features-and-benefits.pdf")],
      ["FlowSense value case", localDoc("eds-flowsense-value-case.pdf")],
      ["FlowSense competitive brochure", localDoc("eds-flowsense-competitive-brochure.pdf")],
      ["Connecting your SCADA to FlowSense", localDoc("eds-flowsense-connecting-your-scada.pdf")],
      ["Sending FlowSense data to your SCADA", localDoc("eds-flowsense-data-to-scada.pdf")],
      ["One Platform, Many Sources: FlowSense industry paper", localDoc("eds-industry-paper-one-platform-many-sources.pdf")],
    ],
  },
  // Full width, in two columns.
  {
    group: "Datasheets and guides",
    icon: "file-text",
    wide: true,
    items: [
      ["EDS E-Flow 3 sewer flow meter datasheet", localDoc("eds-e-flow-3-datasheet.pdf")],
      ["EDS E-Flow 3 sewer flow meter brochure", localDoc("eds-e-flow-3-brochure.pdf")],
      ["EDS Hawk 4G logger datasheet", localDoc("eds-hawk-datasheet.pdf")],
      ["EDS Hawk 4G logger brochure", localDoc("eds-hawk-brochure.pdf")],
      ["EDS Metalog 4G data logger datasheet", localDoc("eds-metalog-4g-datasheet.pdf")],
      ["EDS Metalog 4G data logger brochure", localDoc("eds-metalog-4g-brochure.pdf")],
      ["iLab 901 multi-parameter sensor datasheet", localDoc("eds-ilab-901-datasheet.pdf")],
      ["EDS Sensor Fort sensor mount datasheet", localDoc("eds-sensor-fort-datasheet.pdf")],
      ["EDS Sensor Fort sensor mount brochure", localDoc("eds-sensor-fort-brochure.pdf")],
      ["Detectronic MSFM S2.5T flow meter datasheet", localDoc("detectronic-msfm-s2-5t-datasheet.pdf")],
      ["Detectronic MSFM S2.5T installation and maintenance manual", localDoc("detectronic-msfm-s2-5t-manual.pdf")],
      ["Detectronic LIDoTT Sensor datasheet", localDoc("detectronic-lidott-sensor-datasheet.pdf")],
      ["Detectronic LIDoTT Alarm datasheet", localDoc("detectronic-lidott-alarm-datasheet.pdf")],
      ["Detectronic Alarm2 radar level monitor datasheet", localDoc("detectronic-alarm2-datasheet.pdf")],
      ["Detectronic Alarm2 4G LTE Cat 1 manual", localDoc("detectronic-alarm2-4g-manual.pdf")],
      ["Detectronic MSFM GPRS 2 channel data logger datasheet", localDoc("detectronic-msfm-gprs-2-channel-data-logger-datasheet.pdf")],
      ["Detectronic LIDoTT R datasheet", localDoc("detectronic-lidott-r-datasheet.pdf")],
      ["ORI AquaSamp Mini brochure", localDoc("ori-aquasamp-mini-brochure.pdf")],
      ["ORI PumpModul portable sampler datasheet", localDoc("ori-pumpmodul-datasheet.pdf")],
      ["ORI NEMO 1 M sampler datasheet", localDoc("ori-nemo-1-m-datasheet.pdf")],
      ["ORI water analytics catalogue", localDoc("ori-water-analytics-catalogue.pdf")],
      ["Hach Flow selection guide", localDoc("hach-flow-selection-guide.pdf")],
      ["Beadedstream D605 temperature logger datasheet", localDoc("beadedstream-d605-datasheet.pdf")],
      ["Beadedstream Spot Logger battery guide", localDoc("beadedstream-spot-logger-battery-guide.pdf")],
      ["Beadedstream Digital Temperature Cable spec sheet", localDoc("beadedstream-digital-temperature-cable-spec-sheet.pdf")],
      ["Beadedstream Mlink spec sheet", localDoc("beadedstream-mlink-spec-sheet.pdf")],
      ["Aquamonitrix performance datasheet", localDoc("aquamonitrix-performance-datasheet.pdf")],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* The interactive city                                                */
/* ------------------------------------------------------------------ */
// Each district lists what EDS does there. `s:` links a service, `o:` a
// solution, `p:` a product brand; plain strings are shown as chips.
// `sensors` are the instruments drawn on the map: `at` is the tile position
// (x, y, height), `major` ones carry a name pill in the scene, `alarm` marks
// the one that raises the storm alarm, and each `reads` entry drifts about
// `base` by `swing` and moves to `storm` during the storm. Every figure is
// illustrative, none is live data. A sensor's `layer` (above, street or
// below) is the layer it travels with when the district is taken apart.
// `strata` says what each of those three layers holds, and `asset` is the
// one asset in the district that can be opened and taken apart (`pin` is the
// sensor its way in is drawn from when the district is apart): its `parts`
// run top to bottom, `eds` marks the ones EDS supplies (each fact in their
// `note` is from the datasheets in src/assets/docs or the pages above), and
// `sensor` ties a part to the reading it shows. city-scene.js draws each part
// by its id.
export const city = [
  {
    id: "sewer",
    name: "Sewer network",
    icon: "waves",
    blurb: "Under every street, flow and depth are measured at the manhole and sent in over 4G.",
    services: ["s:sewer-flow-monitoring", "s:inflow-infiltration-studies", "s:blockage-overflow-alarms", "s:sewer-model-calibration"],
    products: [["Detectronic MSFM flow meter", "p:detectronic"], ["LIDoTT Alarm", "lidott"], ["Hach Flo-Dar", "p:hach-flow"]],
    sensors: [
      { id: "msfm", layer: "below", name: "Detectronic MSFM", instrument: "Area velocity flow meter", ref: "p:detectronic", icon: "gauge", at: [6.78, 3.05, 0], major: true,
        reads: [{ label: "Depth", unit: "mm", base: 212, swing: 6, storm: 1480, decimals: 0 }, { label: "Velocity", unit: "m/s", base: 0.76, swing: 0.03, storm: 1.9, decimals: 2 }, { label: "Flow", unit: "L/s", base: 41.8, swing: 1.2, storm: 310, decimals: 1 }] },
      { id: "lidott", layer: "below", name: "LIDoTT Alarm", instrument: "Level alarm, MH 14", ref: "lidott", icon: "siren", at: [8.13, 3.05, 0], major: true, alarm: true,
        reads: [{ label: "Level", unit: "m", base: 0.91, swing: 0.02, storm: 3.04, decimals: 2 }, { label: "State", unit: "", text: "normal" }] },
      { id: "flodar", layer: "below", name: "Hach Flo-Dar", instrument: "Radar velocity", ref: "p:hach-flow", icon: "radio", at: [6.78, 0.5, 0],
        reads: [{ label: "Flow", unit: "L/s", base: 12.4, swing: 0.6, storm: 96, decimals: 1 }] },
      { id: "lidott-smart", layer: "below", name: "LIDoTT Smart", instrument: "Depth logger", ref: "lidott", icon: "activity", at: [8.13, 1.0, 0],
        reads: [{ label: "Depth", unit: "mm", base: 160, swing: 4, storm: 1120, decimals: 0 }] },
    ],
    strata: {
      above: "Eleven homes, each draining through its own lateral.",
      street: "Two lanes, six manholes and the EDS crew at MH 9.",
      below: "Two-lane mains, the house laterals and a cracked joint letting groundwater in.",
    },
    asset: {
      id: "mh9", pin: "msfm", name: "Manhole 9", button: "See inside manhole 9",
      caption: "How the Detectronic MSFM is installed: the sensor rides a ring locked inside the pipe, and the logger is fixed to the step irons.",
      parts: [
        { id: "cover", name: "Cover and frame", note: "At road level. The only part a passer-by sees." },
        { id: "unit", name: "MSFM S2.5T logger", eds: true, ref: "p:detectronic", note: "Fixed to the step irons. Logs every 1 to 60 minutes and sends over 2G, LTE-M or NB-IoT." },
        { id: "battery", name: "ATEX battery pack", eds: true, ref: "p:detectronic", note: "12 V rechargeable lithium-ion: 30 weeks or more at a 5-minute logging rate." },
        { id: "shaft", name: "Shaft rings and step irons", note: "The way down for the crew, and the fixing for the logger." },
        { id: "base", name: "Base and benching", note: "Shapes the flow through the chamber." },
        { id: "pipe", name: "Sewer pipe", note: "The flow being measured." },
        { id: "ring", name: "Stainless fixing ring", eds: true, ref: "p:detectronic", note: "A scissor expander locks it inside the pipe; the cable is tied along its trailing edge." },
        { id: "sensor", name: "Area velocity sensor", eds: true, ref: "p:detectronic", sensor: "msfm", note: "Velocity from dual piezoelectric elements, depth from hydrostatic pressure, and temperature." },
      ],
    },
  },
  {
    id: "pump",
    name: "Pump station",
    icon: "fan",
    blurb: "Wet well levels, pump runs and alarms, watched around the clock.",
    services: ["s:pump-station-monitoring", "s:real-time-monitoring", "s:scada-telemetry-integration", "s:network-assessment"],
    products: [["EDS Pump Station Manager", "p:eds"], ["EMS data loggers", "p:eds"], ["LIDoTT R level sensor", "p:detectronic"]],
    sensors: [
      { id: "psm", layer: "above", name: "Pump Station Manager", instrument: "Wet well level and pump runs", ref: "p:eds", icon: "cpu", at: [5.95, 9.3, 14], major: true,
        reads: [{ label: "Wet well", unit: "m", base: 1.12, swing: 0.18, storm: 2.61, decimals: 2 }, { label: "Pumps running", unit: "of 2", base: 1, swing: 0, storm: 2, decimals: 0 }] },
      { id: "lidott-r", layer: "below", name: "LIDoTT R", instrument: "Radar and pressure level", ref: "p:detectronic", icon: "waves", at: [6.3, 8.05, 7], major: true,
        reads: [{ label: "Level", unit: "m", base: 1.12, swing: 0.18, storm: 2.61, decimals: 2 }] },
      { id: "ems", layer: "above", name: "EMS data logger", instrument: "Data logger", ref: "p:eds", icon: "radio-tower", at: [6.1, 9.15, 32],
        reads: [{ label: "Reported", unit: "", text: "reported" }] },
    ],
    strata: {
      above: "The pump house and the control cabinet with the Pump Station Manager.",
      street: "The fenced compound, the wet well lid and the service van.",
      below: "The wet well, its two pumps and the rising main to the trunk sewer.",
    },
    asset: {
      id: "wetwell", pin: "lidott-r", name: "Wet well", button: "See inside the wet well",
      caption: "Wet well level from a LIDoTT R at the top of the chamber, and pump runs read by the Pump Station Manager.",
      parts: [
        { id: "cabinet", name: "Pump Station Manager", eds: true, ref: "p:eds", sensor: "psm", note: "The EDS flagship since 1991, designed and built by EDS." },
        { id: "hatch", name: "Access hatch", note: "Opened to lift the pumps or service the sensor." },
        { id: "radar", name: "LIDoTT R", eds: true, ref: "p:detectronic", sensor: "lidott-r", note: "Radar to 7 m below the sensor; its pressure sensor takes over up to 10 m above, with no gap." },
        { id: "well", name: "Wet well", note: "Where the flow collects between pump runs." },
        { id: "pumps", name: "Two submersible pumps", note: "On guide rails, so either can be lifted out." },
        { id: "rising", name: "Rising main", note: "Carries the pumped flow to the trunk sewer." },
      ],
    },
  },
  {
    id: "plant",
    name: "Treatment plant",
    icon: "flask-conical",
    blurb: "Flow, quality and sampling through every stage of treatment.",
    services: ["s:water-quality-monitoring", "o:wastewater-monitoring", "s:closed-channel-flow", "s:auditing-calibration"],
    products: [["Aquamonitrix nitrate analyser", "p:aquamonitrix"], ["ORI samplers", "p:ori"], ["Dynaflox ultrasonic meters", "p:dynaflox"]],
    sensors: [
      { id: "dynaflox", layer: "above", name: "Dynaflox ultrasonic meter", instrument: "Closed channel flow", ref: "p:dynaflox", icon: "gauge", at: [0.9, 5.75, 6], major: true,
        reads: [{ label: "Inlet flow", unit: "L/s", base: 180, swing: 8, storm: 420, decimals: 0 }] },
      { id: "aquamonitrix", layer: "street", name: "Aquamonitrix analyser", instrument: "Nitrate and nitrite", ref: "p:aquamonitrix", icon: "flask-conical", at: [1.95, 7.6, 0], major: true,
        reads: [{ label: "Nitrate", unit: "ppm", base: 2.1, swing: 0.1, storm: 3.4, decimals: 1 }] },
      { id: "ori-plant", layer: "above", name: "ORI sampler", instrument: "Composite sampling", ref: "p:ori", icon: "test-tube", at: [3.3, 9.65, 7],
        reads: [{ label: "Sample", unit: "of 24", base: 14, swing: 0, storm: 19, decimals: 0 }] },
      { id: "sludge", layer: "above", name: "EDS ultrasonic level sensor", instrument: "Tank level", ref: "p:eds", icon: "activity", at: [3.0, 6.3, 30],
        reads: [{ label: "Level", unit: "%", base: 71, swing: 1, storm: 74, decimals: 0 }] },
    ],
    strata: {
      above: "Screens, clarifiers, the aeration basin and two digesters.",
      street: "Site roads, walkways and the fenced boundary.",
      below: "The inlet sewer arriving, and the outfall leaving for the river.",
    },
    asset: {
      id: "inlet", pin: "dynaflox", name: "Plant inlet main", button: "See inside the plant inlet",
      caption: "Flow into the plant, metered from outside the pipe: no cut into the line and nothing in the flow.",
      parts: [
        { id: "transmitter", name: "Dynaflox flow transmitter", eds: true, ref: "p:dynaflox", sensor: "dynaflox", note: "Wall mounted, with a keypad and display. Works out the flow from the transducers." },
        { id: "cable", name: "Transducer cables", note: "One to each transducer." },
        { id: "transducers", name: "Ultrasonic transducers", eds: true, ref: "p:dynaflox", note: "A pair strapped to the pipe, timing sound pulses with and against the flow." },
        { id: "straps", name: "Mounting straps", note: "Hold the transducers at their set spacing." },
        { id: "pipe", name: "Inlet main", note: "Full of flow, and never cut for the meter." },
      ],
    },
  },
  {
    id: "industry",
    name: "Industrial estate",
    icon: "factory",
    blurb: "Discharge measured and sampled, so trade waste stays compliant.",
    services: ["s:trade-waste", "s:sampling-programs", "s:equipment-rental", "s:auditing-calibration"],
    products: [["ORI ATEX samplers", "p:ori"], ["MicroLevel MICROSAMPLER", "p:microlevel"], ["Dynaflox flow meters", "p:dynaflox"]],
    sensors: [
      { id: "ori-atex", layer: "above", name: "ORI ATEX sampler", instrument: "Hazardous-area sampling", ref: "p:ori", icon: "shield-check", at: [10.6, 7.6, 12], major: true,
        reads: [{ label: "Bottle", unit: "of 24", base: 9, swing: 0, storm: 11, decimals: 0 }] },
      { id: "dynaflox-tw", layer: "above", name: "Dynaflox flow meter", instrument: "Discharge flow", ref: "p:dynaflox", icon: "gauge", at: [11.6, 7.95, 7], major: true,
        reads: [{ label: "Flow", unit: "L/s", base: 3.2, swing: 0.2, storm: 3.6, decimals: 1 }] },
      { id: "ph-tw", layer: "below", name: "EDS pH sensor", instrument: "Discharge quality", ref: "p:eds", icon: "flask-conical", at: [10.85, 7.8, 0],
        reads: [{ label: "pH", unit: "", base: 7.4, swing: 0.05, storm: 7.1, decimals: 1 }] },
      { id: "microsampler", layer: "street", name: "MicroLevel MICROSAMPLER", instrument: "Refrigerated composite", ref: "p:microlevel", icon: "test-tube", at: [11.9, 9.6, 0],
        reads: [{ label: "Sample", unit: "of 24", base: 6, swing: 0, storm: 8, decimals: 0 }] },
    ],
    strata: {
      above: "The shed, the sawtooth works, two stacks and the tank farm.",
      street: "Loading docks, the weighbridge and the trade waste point.",
      below: "The trade waste connection into the sewer main.",
    },
    asset: {
      id: "tradewaste", pin: "ph-tw", name: "Trade waste point", button: "See inside the trade waste point",
      caption: "Where the estate's discharge is measured and sampled before it reaches the sewer.",
      parts: [
        { id: "sampler", name: "ORI ATEX sampler", eds: true, ref: "p:ori", sensor: "ori-atex", note: "Certified for hazardous areas. Fills one bottle at a time from a rack of 24." },
        { id: "meter", name: "Dynaflox flow meter", eds: true, ref: "p:dynaflox", sensor: "dynaflox-tw", note: "Measures the discharge leaving the site." },
        { id: "cover", name: "Inspection chamber cover", note: "Lifted to service the sensor and the suction line." },
        { id: "hose", name: "Suction line", note: "Draws each sample from the flow." },
        { id: "ph", name: "EDS pH sensor", eds: true, ref: "p:eds", sensor: "ph-tw", note: "Hung in the flow. EDS makes its own pH, EC and turbidity sensors." },
        { id: "chamber", name: "Inspection chamber", note: "The last access point before the public sewer." },
        { id: "pipe", name: "Discharge pipe", note: "To the sewer main under the road." },
      ],
    },
  },
  {
    id: "river",
    name: "River & catchment",
    icon: "trees",
    blurb: "Water quality, rainfall and temperature, from baseline to compliance.",
    services: ["o:environmental-monitoring", "s:water-quality-monitoring", "s:rainfall-monitoring", "o:network-thermal-monitoring"],
    products: [["iLab multi-parameter sonde", "p:eds"], ["Beadedstream thermistor strings", "p:beadedstream"], ["EDS pH, EC and turbidity sensors", "p:eds"]],
    sensors: [
      { id: "rimco", layer: "above", name: "RIMCO 7499 rain gauge", instrument: "Tipping bucket", ref: "s:rainfall-monitoring", icon: "cloud-rain", at: [0.75, 0.75, 9], major: true,
        reads: [{ label: "Rain", unit: "mm/h", base: 0, swing: 0, storm: 18, decimals: 0 }, { label: "Last 24 h", unit: "mm", base: 2, swing: 0, storm: 24, decimals: 0 }] },
      { id: "ilab", layer: "street", name: "iLab 901", instrument: "Multi-parameter analytical sensor", ref: "p:eds", icon: "flask-conical", at: [2.3, 2.3, 0], major: true,
        reads: [{ label: "Turbidity", unit: "NTU", base: 8, swing: 1.5, storm: 140, decimals: 0 }, { label: "EC", unit: "µS/cm", base: 410, swing: 6, storm: 230, decimals: 0 }, { label: "Temperature", unit: "°C", base: 17.2, swing: 0.2, storm: 15.9, decimals: 1 }] },
      { id: "therm", layer: "below", name: "Beadedstream thermistor string", instrument: "Temperature profile", ref: "p:beadedstream", icon: "thermometer", at: [3.7, 3.35, 0],
        reads: [{ label: "Bed temperature", unit: "°C", base: 16.8, swing: 0.1, storm: 15.4, decimals: 1 }] },
      { id: "turb", layer: "street", name: "EDS turbidity sensor", instrument: "At the outfall", ref: "p:eds", icon: "droplets", at: [1.6, 2.5, 4],
        reads: [{ label: "Turbidity", unit: "NTU", base: 6, swing: 1, storm: 95, decimals: 0 }] },
    ],
    strata: {
      above: "The weather station on its mast and the gauging weir.",
      street: "The river, its banks, a footbridge and the reed bed.",
      below: "The river bed, the thermistor string and the plant outfall.",
    },
    asset: {
      id: "raingauge", pin: "rimco", name: "Rain gauge", button: "See inside the rain gauge",
      caption: "A RIMCO 7499 tipping bucket gauge: each tip is counted, so the logger knows how hard it is raining.",
      parts: [
        { id: "funnel", name: "Bronze funnel", note: "Collects the rain and feeds it to the bucket." },
        { id: "bucket", name: "Tipping bucket", eds: true, ref: "s:rainfall-monitoring", sensor: "rimco", note: "Tips each time one side fills, and every tip is counted." },
        { id: "body", name: "Stainless steel cylinder", note: "Keeps wind and debris away from the bucket." },
        { id: "base", name: "Levelling base", note: "Sets the bucket level so every tip holds the same rain." },
      ],
    },
  },
  {
    id: "cbd",
    name: "CBD & facilities",
    icon: "building-2",
    blurb: "Buildings and structures scored 24/7 and managed as one service.",
    services: ["s:facility-management", "o:structure-performance", "o:asset-network-assessment"],
    products: [["EDS Asset Score (EAS)", "o:structure-performance"], ["EPM-2 pressure logger", "p:eds"], ["Metalog 4G logger", "p:eds"]],
    sensors: [
      { id: "eas", layer: "above", name: "EDS Asset Score", instrument: "Light, moisture, seismic and temperature sensors", ref: "o:structure-performance", icon: "building-2", at: [11.35, 1.05, 88], major: true,
        reads: [{ label: "Score", unit: "/ 1000", base: 930, swing: 2, storm: 928, decimals: 0 }] },
      { id: "epm2", layer: "below", name: "EPM-2 pressure logger", instrument: "Water main pressure", ref: "p:eds", icon: "gauge", at: [14.6, 4.2, 0], major: true,
        reads: [{ label: "Pressure", unit: "m head", base: 52, swing: 0.8, storm: 50, decimals: 0 }] },
      { id: "eas2", layer: "above", name: "EDS Asset Score", instrument: "Light, moisture, seismic and temperature sensors", ref: "o:structure-performance", icon: "building-2", at: [13.1, 2.8, 74],
        reads: [{ label: "Score", unit: "/ 1000", base: 962, swing: 2, storm: 961, decimals: 0 }] },
      { id: "metalog-cbd", layer: "above", name: "Metalog 4G logger", instrument: "Telemetry", ref: "p:eds", icon: "radio-tower", at: [12.1, 4.3, 6],
        reads: [{ label: "Reported", unit: "", text: "reported" }] },
    ],
    strata: {
      above: "Towers scored around the clock by the EDS Asset Score.",
      street: "The plaza, its fountain and the transit canopy.",
      below: "Tower foundations and the water main the EPM-2 logger watches.",
    },
    asset: {
      id: "tower", pin: "eas", name: "Scored tower", button: "See inside the tower",
      caption: "Light, moisture, seismic and temperature sensors at critical structure points, combined into one score from 0 to 1000.",
      parts: [
        { id: "roof", name: "Roof and plant", note: "Plant room, air handling units and the mast." },
        { id: "upper", name: "Upper floors", note: "Offices." },
        { id: "eas", name: "EDS Asset Score sensors", eds: true, ref: "o:structure-performance", sensor: "eas", note: "Placed at critical structure points and scored 0 to 1000, 24/7." },
        { id: "lower", name: "Lower floors", note: "Offices and the lobby." },
        { id: "base", name: "Basement and foundations", note: "Where the structure meets the ground." },
      ],
    },
  },
  {
    id: "ops",
    name: "Operations centre",
    icon: "monitor-dot",
    blurb: "Every reading arrives in one place: EDS FlowSense.",
    services: ["flowsense", "s:data-analysis-reporting", "s:real-time-monitoring", "s:data-as-a-service"],
    products: [["EDS FlowSense platform", "flowsense"], ["SCADA connection", "flowsense"], ["Alarms by SMS and email", "flowsense"]],
    sensors: [
      { id: "flowsense", layer: "above", name: "EDS FlowSense", instrument: "Platform", ref: "flowsense", icon: "monitor-dot", at: [8.8, 6.5, 78], major: true,
        reads: [{ label: "Sites online", unit: "", base: 24, swing: 0, storm: 24, decimals: 0 }, { label: "Open alarms", unit: "", base: 0, swing: 0, storm: 1, decimals: 0 }, { label: "Availability", unit: "%", base: 99.95, swing: 0, storm: 99.95, decimals: 2 }] },
      { id: "scada", layer: "above", name: "SCADA connection", instrument: "Telemetry integration", ref: "s:scada-telemetry-integration", icon: "plug-zap", at: [8.3, 8.3, 18],
        reads: [{ label: "Link", unit: "", text: "connected" }] },
    ],
    strata: {
      above: "The operations centre, its wall of screens and the telemetry mast.",
      street: "The yard and the EDS service fleet.",
      below: "No pipes here. Readings arrive over 4G, not under the ground.",
    },
    asset: {
      id: "datapath", pin: "flowsense", name: "How a reading travels", button: "See how a reading travels",
      caption: "From the instrument in the network to the people who act on it. Every reading arrives in one place: EDS FlowSense.",
      parts: [
        { id: "people", name: "Alarms by SMS and email", eds: true, ref: "flowsense", note: "The crew and the operators hear about it first." },
        { id: "scada", name: "SCADA connection", eds: true, ref: "s:scada-telemetry-integration", sensor: "scada", note: "Readings into the SCADA system the utility already runs." },
        { id: "flowsense", name: "EDS FlowSense", eds: true, ref: "flowsense", sensor: "flowsense", note: "Every reading arrives in one place." },
        { id: "network", name: "4G network", note: "Loggers send their readings in real time." },
        { id: "loggers", name: "Loggers", eds: true, ref: "p:eds", note: "EDS EMS data loggers, the 4G Metalog, and the modem built into each LIDoTT Alarm." },
        { id: "instruments", name: "Instruments in the network", note: "Flow meters, level sensors, samplers and analysers." },
      ],
    },
  },
];

// Every word the city's controls, readings bar, captions, key and screen
// reader announcements use. `{name}`, `{services}` and `{products}` are
// filled in by city.js; `states` are the LIDoTT alarm words shown in the
// scene, and `text` the words a sensor shows instead of a number.
export const cityUi = {
  stageLabel: "Interactive map of an illustrative Australian capital city. Each district shows the EDS services and products used there.",
  zoneLabel: "{name}: show EDS services and products",
  tabsLabel: "City districts",
  toolbarLabel: "City controls",
  toolbar: { tour: "Take the tour", storm: "Send a storm", stormBusy: "Stop the storm", stormCancelled: "Storm stopped.", mute: "Mute the storm", unmute: "Unmute the storm", under: "Show the sewer", underOn: "Show the surface", expand: "Expand the city", collapse: "Back to the page", close: "Close", zoomLabel: "Zoom", zoomIn: "Zoom in", zoomOut: "Zoom out" },
  captionRest: "Send a storm, take a district apart, or show the sewer beneath the streets.",
  captionRestTouch: "Pinch to zoom in, send a storm, take a district apart, or show the sewer.",
  sensorsHeading: "Sensors on the map",
  tipLabel: "Sensor readings",
  readingsNote: "Illustrative readings, not live data.",
  note: "An illustrative Australian capital city. The readings, alarms, crews and storm are a simulation, not a real network or live data.",
  hud: {
    label: "Illustrative network readings",
    sparkLabel: "Last 24 h",
    alarmWord: "alarm",
    tiles: [
      { key: "rain", label: "Rain", unit: "mm/h", rest: "0" },
      { key: "primary", label: "Trunk depth", unit: "mm", rest: "212" },
      { key: "well", label: "Wet well", unit: "m", rest: "1.12" },
      { key: "alarms", label: "Alarms", unit: "", rest: "0" },
    ],
  },
  states: { normal: "Normal", high: "High", highHigh: "High-high" },
  text: { reported: "2 min ago", connected: "Connected", normal: "Normal" },
  legend: { label: "Key", items: [["circle-dot", "Sensor"], ["siren", "Alarm"], ["route", "Data link to the operations centre"], ["droplets", "Overflow"]],
    // shown while the sewer is on view
    underItems: [["gauge", "Area velocity flow meter"], ["waves", "Level sensor"], ["radio-tower", "Data logger"]] },
  expandedLabel: "The city, expanded",
  // the tour: the visitor's own scrolling flies the camera through the city,
  // district by district in `route` order (the way the water goes), each one
  // taken apart as the camera arrives
  tour: {
    title: "City tour",
    route: ["river", "sewer", "pump", "plant", "industry", "cbd", "ops"],
    begin: "Scroll to fly in", beginTouch: "Swipe to fly in", count: "{n} districts",
    flying: "Flying to {name}", at: "District {i} of {n}",
    endTitle: "End of the tour", endSub: "Scroll on to continue the page",
    leave: "Leave the tour", railLabel: "Tour districts", dot: "{name}, district {i} of {n}",
    open: "Open this district",
    end: { heading: "That's the city.", text: "Seven districts and one platform: every reading you saw arrives in EDS FlowSense.", enquire: "Start an enquiry", back: "Back to the page", more: "or keep scrolling" },
    live: {
      start: "City tour started. Scroll to fly through the city. Escape leaves the tour.",
      arrive: "{name}, district {i} of {n}, taken apart.",
      end: "End of the tour. Scroll on to continue the page.",
      left: "Tour closed.",
    },
  },
  // taking a district apart into its three layers, and opening its asset
  explode: {
    take: "Take it apart", put: "Put it back together", back: "Back to the district", backCity: "Back to the city",
    strata: { above: "Above ground", street: "Street level", below: "Below ground" },
    layersLabel: "Layers of {name}", partsLabel: "Parts of {name}", partsHeading: "Parts, top to bottom",
    caption: "{name}, taken apart. Pick a layer to see what it holds.",
    assetCaption: "Pick a part to read about it.",
    productLink: "About this product",
    live: {
      district: "{name} taken apart into three layers.",
      districtBack: "{name} put back together.",
      asset: "{name} opened and taken apart into {n} parts.",
      assetTogether: "{name} put back together.",
      assetClosed: "{name} closed.",
    },
  },
  logLabel: "Operations messages", logStamp: "06:40 · heartbeat", heartbeat: "Daily heartbeat: 24 sensors operational",
  live: {
    select: "{name} selected. {services} services and {products} products.",
    stormStart: "Storm started. Illustrative rain of 18 millimetres an hour over the catchment.",
    stormEnd: "Storm over. Flows returning to normal and the storm scored in FlowSense.",
    stormCancelled: "Storm stopped.",
    underOn: "Showing the sewer beneath the city.",
    underOff: "Showing the city surface.",
    expanded: "City expanded. Press Escape to close it.",
    collapsed: "City closed.",
  },
};

// The storm the city can be sent: an illustrative 29 second event, one step
// at a time. Each step lifts a district at `at` seconds, shows its `caption`,
// adds a "why this matters" line (`why`, linking the EDS service that answers
// it) to that district's card, moves the readings bar to `hud`, and may add a
// message to the operations log (`log`) or be read out (`announceText`).
// `sub` steps change the LIDoTT alarm `state` part way through a step. The
// alarm levels (High 2.0 m, High-high 3.0 m) match the LIDoTT Alarm demo.
export const cityStorm = {
  duration: 29,
  steps: [
    { n: 1, at: 0, zone: "river", caption: "Rain starts. The RIMCO 7499 gauge tips at 18 mm/h.", why: "Rain data shows why the network changed.", link: "s:rainfall-monitoring", hud: { rain: 18, primary: 212, well: 1.12, alarms: 0 }, announce: true, announceText: "Rain gauge tipping, 18 millimetres an hour." },
    { n: 2, at: 4, zone: "sewer", caption: "Gully pits and three connected downpipes push inflow into the sewer.", why: "Inflow and infiltration studies find where the rain gets in.", link: "s:inflow-infiltration-studies", hud: { rain: 18, primary: 640, well: 1.38, alarms: 0 } },
    { n: 3, at: 8, zone: "sewer", caption: "Level passes 2.0 m at MH 14. LIDoTT Alarm: High.", sub: [{ at: 10, state: "highHigh", caption: "3.0 m. High-high. An SMS and email go out.", log: "ALARM High-high level 3.04 m · MH 14 · LIDoTT Alarm", logStamp: "06:52 · SMS and email", sms: true }], why: "Level alarms warn before a surcharge becomes a spill.", link: "s:blockage-overflow-alarms", hud: { rain: 22, primary: 1480, well: 1.62, alarms: 1 }, announce: true, announceText: "Manhole 14 surcharging. LIDoTT Alarm high-high. SMS sent to the operations centre." },
    { n: 4, at: 12, zone: "ops", caption: "FlowSense receives the alarm and sends an EDS crew to MH 14.", why: "Every alarm lands in one place.", link: "flowsense", hud: { rain: 22, primary: 2030, well: 2.05, alarms: 1 }, log: "Crew dispatched to MH 14", logStamp: "06:54 · FlowSense" },
    { n: 5, at: 15, zone: "pump", caption: "Both pumps run as the wet well reaches 2.61 m.", why: "Pump station monitoring shows whether start and stop levels suit the flows arriving.", link: "s:pump-station-monitoring", hud: { rain: 20, primary: 1900, well: 2.61, alarms: 1 }, log: "Pump station: both pumps running, wet well 2.61 m", logStamp: "06:58 · FlowSense", announce: true, announceText: "Pump station running both pumps." },
    { n: 6, at: 18, zone: "plant", caption: "The plant inlet spikes to 420 L/s on the Dynaflox meter.", why: "Closed channel flow metered without cutting the pipe.", link: "s:closed-channel-flow", hud: { rain: 14, primary: 1600, well: 2.40, alarms: 1 } },
    { n: 7, at: 20.5, zone: "river", caption: "At the river outfall the turbidity sensor reads 95 NTU.", why: "Water quality monitoring, from baseline to compliance.", link: "s:water-quality-monitoring", hud: { rain: 8, primary: 1320, well: 2.10, alarms: 1 } },
    { n: 8, at: 23, zone: "sewer", caption: "The rain stops. Inflow drains in minutes; the infiltration tail lingers.", sub: [{ at: 24.5, state: "normal", caption: "Return to normal: 0.98 m.", log: "Return to normal: 0.98 m · MH 14", logStamp: "07:21 · SMS and email", sms: "ok" }], why: "Thermal surveys locate the infiltration that keeps flowing after the rain.", link: "s:thermal-infiltration-surveys", hud: { rain: 0, primary: 760, well: 1.44, alarms: 0 }, announce: true, announceText: "Storm passing. Flow returning to normal." },
    { n: 9, at: 26.5, zone: "ops", caption: "Storm scored in FlowSense: peak 310 L/s on 24 mm of rain.", why: "Scored storms calibrate the sewer model.", link: "s:sewer-model-calibration", hud: { rain: 0, primary: 420, well: 1.12, alarms: 0 }, log: "Storm 1 scored: peak 310 L/s, 24 mm rain", logStamp: "07:30 · FlowSense" },
  ],
};

/* ------------------------------------------------------------------ */
/* Old page addresses                                                  */
/* ------------------------------------------------------------------ */

// Public pages on the old Squarespace site, and where each one lives now.
// The build writes a small forwarding page for each, so bookmarks and search
// results keep working. Old addresses that match a new page (/about,
// /contact, /flowsense, /products) need no entry. Anything else falls through
// to the 404 page.
export const oldPages = {
  home: "index.html",
  "what-we-do": "about.html",
  // A 2017 page of EDS's safety and quality documents for one client.
  "logan-water-infrastructure-alliance": "about.html",
  "contact-2": "contact.html",
  "contact-eds": "contact.html",
  // The old /enquire is served by the enquiry page itself, enquire.html.
  // The old site's other enquiry forms open the form on the matching topic.
  "contact-sales": "enquire.html?topic=Product+pricing",
  "contact-eds-for-price-and-availability": "enquire.html?topic=Product+pricing",
  "get-a-quote": "enquire.html?topic=Product+pricing",
  "e-flow-enquiry": "enquire.html?topic=Product+pricing&product=E-Flow+3+%28EDS%29",
  "request-lidott-price": "enquire.html?topic=Product+pricing&product=LIDoTT+Alarm+%28Detectronic%29",
  "lidott-request-for-proposal": "enquire.html?topic=Product+pricing&product=LIDoTT+Alarm+%28Detectronic%29",
  "trade-waste-enquiry": "enquire.html?topic=Trade+Waste+Monitoring",
  // The old site's Aquamonitrix enquiry form, and its general one.
  "new-page-6": "enquire.html?topic=Product+pricing&product=Aquamonitrix",
  "new-page": "enquire.html",
  "free-30-minute-discovery-call": "enquire.html",
  feedback: "enquire.html",
  "sign-up-newsletter": "contact.html",
  "eds-privacy-statement": "privacy.html",
  downloads: "resources.html",
  "download-and-support": "resources.html",
  publications: "resources.html",
  "wind-and": "resources.html",
  "white-papers": "resources.html",
  "reference-articles": "resources.html",
  // The old software and manual download pages.
  ems2001: "resources.html",
  "ems2001-1": "resources.html",
  ems4001: "resources.html",
  "psm-1": "resources.html",
  "g-series": "resources.html",
  "eflow-software": "resources.html",
  "wingps-140": "resources.html",
  "hach-software": "resources.html",
  floware: "resources.html",
  "floware-1": "resources.html",
  "manuals-hach": "resources.html",
  "detectronic-manuals-software": "resources.html",
  "ori-pump-module-software": "resources.html",
  // The old Projects, Company Overview and News pages.
  projects: "about.html",
  capabilities: "about.html",
  news: "about.html",
  "services-eds": "services/index.html",
  "applications-eds": "solutions/index.html",
  // The old Industries: Water page.
  "water-1": "solutions/index.html",
  // Services
  "sewer-network-monitoring": "services/sewer-flow-monitoring.html",
  "flow-monitoring": "services/sewer-flow-monitoring.html",
  "servicing-and-field-works": "services/sewer-flow-monitoring.html",
  "short-and-long-term-monitoring": "services/sewer-flow-monitoring.html",
  "the-future-of-sewer-flow-monitoring-5-key-trends-for-2025": "services/sewer-flow-monitoring.html",
  "atex-flow-monitoring": "services/sewer-flow-monitoring.html",
  "auditing-and-calibration": "services/auditing-calibration.html",
  "insitu-calibration-and-servicing": "services/auditing-calibration.html",
  "closed-channel-flow-monitoring": "services/closed-channel-flow.html",
  "closed-channel-flow-eters": "services/closed-channel-flow.html",
  // The old site's range of meters for full pipes.
  "electromagnetic-flowmeter": "services/closed-channel-flow.html",
  "transit-time-flow-meters": "services/closed-channel-flow.html",
  "ultrasonic-flow-meter": "services/closed-channel-flow.html",
  "doppler-ultrasonic": "services/closed-channel-flow.html",
  "water-meters": "services/closed-channel-flow.html",
  "eds-daas-data-as-a-service": "services/data-as-a-service.html",
  "equipment-rental": "services/equipment-rental.html",
  // The old shop and hire list.
  store: "services/equipment-rental.html",
  "facility-management": "services/facility-management.html",
  "facility-management-1": "services/facility-management.html",
  "facility-and-porperty-maintenance": "services/facility-management.html",
  defence: "services/facility-management.html",
  "inflow-infiltration-studies": "services/inflow-infiltration-studies.html",
  "proactive-sewer-management": "services/inflow-infiltration-studies.html",
  "network-assessment-and-evaluations": "services/network-assessment.html",
  "network-assesment-and-evaluations": "services/network-assessment.html",
  "real-time-monitoring": "services/real-time-monitoring.html",
  "remote-monitoring": "services/real-time-monitoring.html",
  "sewer-network-model-calibrations": "services/sewer-model-calibration.html",
  "trade-waste": "services/trade-waste.html",
  "trade-waste-2": "services/trade-waste.html",
  "trade-waste-monitoring": "services/trade-waste.html",
  "pictures-trade-waste": "services/trade-waste.html",
  "rainfall-monitoring": "services/rainfall-monitoring.html",
  // The old Rain Gauges page.
  "aquaculture-1": "services/rainfall-monitoring.html",
  weather: "services/rainfall-monitoring.html",
  "weather-station": "services/rainfall-monitoring.html",
  "overflow-alarms": "services/blockage-overflow-alarms.html",
  "alarming-stations": "services/blockage-overflow-alarms.html",
  // The old Real Time Alarming page.
  "new-page-3": "services/blockage-overflow-alarms.html",
  "water-quality": "services/water-quality-monitoring.html",
  "analytical-monitoring": "services/water-quality-monitoring.html",
  "ph-monitors": "services/water-quality-monitoring.html",
  "do-disolved-oxygen": "services/water-quality-monitoring.html",
  "orp-1": "services/water-quality-monitoring.html",
  // An analyser and controller range the new site no longer lists.
  "analytical-sensor-logger-configuration": "services/water-quality-monitoring.html",
  "aquas-ph": "services/water-quality-monitoring.html",
  bod: "services/water-quality-monitoring.html",
  cod: "services/water-quality-monitoring.html",
  toc: "services/water-quality-monitoring.html",
  pahs: "services/water-quality-monitoring.html",
  "new-page-14": "services/water-quality-monitoring.html",
  "new-page-18": "services/water-quality-monitoring.html",
  "new-page-25": "services/water-quality-monitoring.html",
  "new-page-64": "services/water-quality-monitoring.html",
  "new-page-66": "services/water-quality-monitoring.html",
  "new-page-70": "services/water-quality-monitoring.html",
  "new-page-74": "services/water-quality-monitoring.html",
  "new-page-78": "services/water-quality-monitoring.html",
  "ec03-logger": "services/water-quality-monitoring.html",
  "pro-controller": "services/water-quality-monitoring.html",
  "multiparameter-controller": "services/water-quality-monitoring.html",
  "sm63-radar-flow": "services/water-quality-monitoring.html",
  "sm63-radar-flow-1": "services/water-quality-monitoring.html",
  "smr60-ultrasonic-level": "services/water-quality-monitoring.html",
  telemetry: "services/scada-telemetry-integration.html",
  "wireless-telemetry": "services/scada-telemetry-integration.html",
  // The old SCADA page.
  "new-page-1": "services/scada-telemetry-integration.html",
  // Solutions
  "waste-water-montioring": "solutions/wastewater-monitoring.html",
  "waste-water": "solutions/wastewater-monitoring.html",
  "environmental-monitoring": "solutions/environmental-monitoring.html",
  "river-and-waterway-monitoring": "solutions/environmental-monitoring.html",
  "soil-agricultural": "solutions/environmental-monitoring.html",
  "automatic-sampling": "solutions/automatic-sampling.html",
  "automatic-samplers": "solutions/automatic-sampling.html",
  "automatic-samplers-1": "solutions/automatic-sampling.html",
  "network-thermal-monitoring": "solutions/network-thermal-monitoring.html",
  "structure-performance-and-monitoring-1": "solutions/structure-performance.html",
  "asset-monitoring-and-servicing": "solutions/structure-performance.html",
  "structure-performance-and-monitoring": "solutions/structure-performance.html",
  structural: "solutions/structure-performance.html",
  "structural-monitoring": "solutions/structure-performance.html",
  "new-page-4-1": "solutions/asset-network-assessment.html",
  "new-page-4": "solutions/asset-network-assessment.html",
  // The old Real Time Network Assessments page.
  water: "solutions/asset-network-assessment.html",
  // Products
  "product-1": "products/index.html",
  "products-1": "products/index.html",
  eds: "products/eds.html",
  psm: "products/eds.html",
  epm2: "products/eds.html",
  ems003: "products/eds.html",
  ems050: "products/eds.html",
  "ec-eds": "products/eds.html",
  // The old pressure pages, now the EPM-2 pressure logger.
  "pressure-monitoring": "products/eds.html",
  "pressure-sensors": "products/eds.html",
  ilab: "products/ilab-901.html",
  "e-flow": "products/e-flow-3.html",
  metalog: "products/metalog-4g.html",
  "flowsense-1": "flowsense.html",
  detectronics: "products/detectronic.html",
  msfm: "products/detectronic.html",
  lidott: "products/detectronic.html",
  "lidott-r": "products/detectronic.html",
  "multi-channel-data-loggers": "products/detectronic.html",
  "lidott-alarm": "products/lidott-alarm.html",
  "ori-index": "products/ori.html",
  "aqua-mini": "products/ori.html",
  "nemo-1-m-pp": "products/ori.html",
  ori: "products/ori.html",
  ilink: "products/ori.html",
  mlog: "products/ori.html",
  "xzone-com": "products/ori.html",
  "optical-camera-system": "products/ori.html",
  "basic-mobile-refrigerator-1": "products/ori.html",
  "portable-sampler-iecex-and-atex-rated": "products/ori.html",
  "stationary-iecex-atex-sampler": "products/ori.html",
  "stationary-iecex-atex-sampler-1": "products/ori.html",
  "wall-sampler": "products/ori.html",
  "hach-flow": "products/hach-flow.html",
  "fl1500-logger": "products/hach-flow.html",
  "fl900-logger": "products/hach-flow.html",
  "flodar-sensor": "products/hach-flow.html",
  "flotote-3-sensor": "products/hach-flow.html",
  fh950: "products/hach-flow.html",
  "sc200-controller": "products/hach-flow.html",
  flostation: "products/hach-flow.html",
  "sub-av-sensor": "products/hach-flow.html",
  "av-sensor-with-bubbler": "products/hach-flow.html",
  "low-profile-velocity-sensor": "products/hach-flow.html",
  "ultrasonic-depth-sensors": "products/hach-flow.html",
  "flodar-gal": "products/hach-flow.html",
  beadedstream: "products/beadedstream.html",
  d605: "products/beadedstream.html",
  "spot-logger": "products/beadedstream.html",
  mlink: "products/beadedstream.html",
  "temperature-string": "products/beadedstream.html",
  "thermistor-string-1": "products/beadedstream.html",
  "thermistor-string": "products/beadedstream.html",
  beadedcloud: "products/beadedstream.html",
  "capture-mobile-app": "products/beadedstream.html",
  microlevel: "products/microlevel.html",
  "microlevel-portable-sampler": "products/microlevel.html",
  aquamonitrix: "products/aquamonitrix.html",
  "dynaflox-2": "products/dynaflox.html",
  dynaflox: "products/dynaflox.html",
  dynameter: "products/dynaflox.html",
  "3in1": "products/dynaflox.html",
  dmtfh: "products/dynaflox.html",
  dmtfp: "products/dynaflox.html",
  dmtfw: "products/dynaflox.html",
  ultra: "products/dynaflox.html",
  ultrad: "products/dynaflox.html",
  ultraf: "products/dynaflox.html",
  // Dynaflox's Ultra S water meter and Dyna Probe level meter.
  "ultrasonic-depth": "products/dynaflox.html",
  "ultrasonic-depth-1": "products/dynaflox.html",
};

// Documents the old site served from /s/<file name>, which people still follow
// from bookmarks, emails and other sites. The build puts a copy of the document
// in src/assets/docs at each old address.
export const oldFiles = {
  "DNS-51-MSFM-S2-5T-Installation-and-Maintenance-Iss-3-07-06-21.pdf": "detectronic-msfm-s2-5t-manual.pdf",
  "DNS-51-MSFM-S2-5T-Installation-and-Maintenance-Iss-3-07-06-21-xjce.pdf": "detectronic-msfm-s2-5t-manual.pdf",
};
