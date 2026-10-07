// All site copy lives here. It is carried over from www.e-d-s.com.au (tidied,
// de-duplicated and set in Australian English), so nothing on the new site
// claims more than the old one did.

// Images live in src/assets/img and are copied to dist/assets/img by the build.
// "@root/" is swapped for each page's path back to the site root in layout().
export const img = (file) => `@root/assets/img/${file}`;
// Documents (datasheets, white papers, software) live in src/assets/docs.
export const localDoc = (file) => `@root/assets/docs/${file}`;

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
  // should be eds@e-d-s.com.au. It is safe to publish. Left empty, the forms
  // open the visitor's email program instead.
  formKey: "4fd0d5e0-cb94-40ad-adda-7c634e765045",
  address: ["13/20-22 Ellerslie Road", "Meadowbrook QLD 4131", "Australia"],
  hours: "Monday to Friday, 7:30am to 4:30pm",
  founded: 1991,
  // The live address, used for canonical links, the sitemap and share cards.
  url: "https://www.e-d-s.com.au",
  // Head office hours, in head office time. Drives the "open now" status.
  openingHours: { days: [1, 2, 3, 4, 5], opens: "07:30", closes: "16:30", timeZone: "Australia/Brisbane" },
  logoWhite: img("eds-logo-white-large.png"),
  flowsenseUrl: "https://edsflowsense.au/",
  remoteDataUrl: "https://www.detecdata-en.com/",
  legal: "EDS & DAUS Pty Ltd",
};

export const offices = [
  { city: "Brisbane", state: "QLD", note: "Head office, Meadowbrook", lon: 153.1, lat: -27.66, head: true },
  { city: "Richmond", state: "NSW", note: "New South Wales and ACT", lon: 150.75, lat: -33.6 },
  { city: "Boronia", state: "VIC", note: "Victoria", lon: 145.28, lat: -37.86 },
  { city: "Adelaide", state: "SA", note: "South Australia", lon: 138.6, lat: -34.93 },
];

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
export const serviceGroups = [
  { id: "sewer", title: "Sewer networks", heading: "Know what is in the pipe, and what should not be.", lede: "Measuring what flows through the network, finding where water gets in, and proving the fixes worked." },
  { id: "water", title: "Water & environment", heading: "Quality, sampling and rainfall, measured properly.", lede: "For utilities, industry and environmental projects, with full pipe flow alongside." },
  { id: "data", title: "Real-time data & analysis", heading: "From a reading to a decision.", lede: "Data that arrives as it happens, reaches the systems you already run, and ends in a report you can act on." },
  { id: "field", title: "Field services & support", heading: "The people and equipment behind every program.", lede: "Calibration, hire, facility management and training, from four offices across Australia." },
];

export const services = [
  {
    slug: "sewer-flow-monitoring",
    title: "Sewer Flow Monitoring",
    icon: "waves",
    group: "sewer",
    process: true,
    featured: true,
    summary: "Temporary and permanent flow monitoring for councils and water authorities, installed by trained crews Australia wide.",
    intro: [
      "EDS provides comprehensive sewer flow monitoring to help councils and water authorities manage their wastewater infrastructure efficiently and effectively. With more than three decades of experience, we pair industry-leading technology with hands-on support to deliver accurate, reliable data for informed decisions.",
      "Our crews are highly trained installation engineers, available Australia wide, who deliver results that are both safe and accurate. And unlike other providers, EDS gives you full access to the data.",
    ],
    blocks: [
      {
        heading: "Why choose EDS",
        items: [
          ["Precision and reliability", "Our fleet features the latest Detectronic MSFM area velocity flow meters, intrinsically safe and certified under ATEX and IECEx."],
          ["Expertise you can trust", "Field crews complete rigorous training in installation, maintenance and calibration, so every unit is installed correctly."],
          ["Flexible programs", "From short-term inflow and infiltration studies to long-term monitoring that supports sewer master planning."],
          ["Advanced sensors", "Including the LIDoTT level sensor for highly precise measurement across changing conditions."],
          ["Customer-focused", "We stay with you through data collection and interpretation, not just the install."],
        ],
      },
      {
        heading: "What is included",
        items: [
          ["Temporary and permanent flow monitoring", "Ideal for I/I studies, model calibrations and compliance reporting."],
          ["Comprehensive data analysis", "Detailed insights in reports that are easy to interpret, supporting planning and regulatory compliance."],
          ["Custom installation and site inspections", "Proper hydraulic site selection and installation to guarantee accurate data."],
          ["Rainfall correlation studies", "Data from RIMCO 7499 tipping bucket rain gauges shows how rainfall events affect the network."],
          ["Seamless data integration", "Data is transmitted directly to our platform, with API options for your existing systems."],
        ],
      },
      {
        heading: "Applications",
        list: [
          "Sewer model calibration to support long-term planning",
          "Identifying sources of inflow and infiltration to reduce treatment costs",
          "Capacity assessment for future infrastructure expansion",
          "Compliance with environmental regulations",
          "Early detection of blockages and potential system failures",
        ],
      },
      {
        heading: "Common questions",
        faq: [
          ["How long does a flow monitoring program run?", "It depends on what the data has to answer. Short term studies for inflow and infiltration typically run for 6 to 12 weeks, long enough to capture the network's response to wet weather. Long term monitoring runs across seasons, showing baseline infiltration as groundwater rises and falls through the year, and measuring the effect of past works."],
          ["How often are readings logged?", "Typically every 1 to 5 minutes. High resolution logging captures storm peaks accurately and shows the daily pattern of dry weather flow that analysis and modelling depend on."],
          ["Is the equipment safe to install in a live sewer?", "Yes. The Detectronic MSFM area velocity flow meters in our fleet are intrinsically safe and certified under ATEX and IECEx, and every installation is carried out by trained EDS crews."],
          ["Do we get the raw data, or only a report?", "Both. Unlike many providers, EDS gives you full access to the data, through EDS FlowSense or by API into your own systems, alongside the reports."],
          ["Is rainfall measured as well?", "Yes. RIMCO 7499 tipping bucket rain gauges are installed in the catchment alongside the flow meters, so the network's wet weather response can be read against the rain that caused it."],
          ["Do we have to buy the equipment?", "No. You can buy the instruments, hire them from the EDS fleet, or take monitoring as Data as a Service with no capital outlay, where EDS selects the sites, installs and maintains the equipment and delivers validated data."],
        ],
      },
    ],
    widget: "lab",
    related: ["inflow-infiltration-studies", "data-as-a-service", "sewer-model-calibration"],
    solutions: ["wastewater-monitoring"],
    products: ["detectronic", "hach-flow", "eds"],
    papers: ["unforeseen-benefits"],
  },
  {
    slug: "inflow-infiltration-studies",
    title: "Inflow & Infiltration Studies",
    icon: "cloud-rain",
    group: "sewer",
    process: true,
    featured: true,
    summary: "Find where stormwater and groundwater enter the sewer, and how much, so investment goes where it counts.",
    intro: [
      "EDS specialises in identifying and addressing the challenges of sewer inflow and infiltration (I&I). Excess stormwater and groundwater entering sewer systems remains one of the most costly and complex challenges for councils and utilities across Australia.",
      "Industry data suggests I&I can make up to 50% of the flow in older sewer networks during storm events. Left unmanaged, it hides the true capacity of a system, complicates hydraulic modelling and distorts investment planning, so infrastructure ends up sized too large or too small.",
      "Our team provides practical solutions to manage and mitigate the effects of I&I, protecting the environment and keeping the system efficient.",
    ],
    blocks: [
      {
        heading: "Why I&I matters",
        items: [
          ["Operational", "Overloaded networks in wet weather, bypass pumping and emergency response, and higher pumping and treatment costs for water that should never have reached the sewer."],
          ["Environmental", "A greater risk of overflows during peak events, faster asset deterioration, and more energy and emissions spent pumping and treating extraneous flow."],
          ["Financial", "Avoidable treatment costs at peak, and capital spent upsizing infrastructure when reducing I&I could defer the upgrade."],
          ["Planning", "Distorted flow records that obscure the true daily pattern, making models and forecasts harder to trust."],
        ],
      },
      {
        heading: "Our I&I services",
        items: [
          ["Assessment and analysis", "Comprehensive evaluation of sewer systems to identify I&I sources."],
          ["Advanced monitoring", "State-of-the-art technology for real-time data collection and analysis."],
          ["Customised solutions", "Tailored strategies to manage and reduce I&I impacts."],
          ["Maintenance and support", "Ongoing support so implemented solutions keep working."],
        ],
      },
      {
        heading: "What you gain",
        items: [
          ["Environmental protection", "Prevent untreated sewage discharges and safeguard natural water bodies."],
          ["Cost efficiency", "Reduce treatment costs by minimising unnecessary flow into the sewer."],
          ["System longevity", "Extend the life and reliability of sewer infrastructure."],
          ["Compliance assurance", "Meet environmental regulations and standards."],
        ],
      },
      {
        heading: "Short term and long term monitoring",
        lede: "Most I&I programs use one or both. The right choice depends on the decision the data has to support.",
        table: {
          neutral: true,
          left: "Short term",
          right: "Long term",
          rows: [
            ["Typical duration", "6 to 12 weeks, through wet weather", "Continuous, across seasons and years"],
            ["What it answers", "Where I&I enters, and how much, in each subcatchment", "The baseline infiltration load, and how it varies through the year"],
            ["Best used for", "Ranking subcatchments for CCTV, manhole surveys and repairs, and storm data for model calibration", "Seasonal groundwater infiltration and persistent defects that short studies can miss"],
            ["Capital decisions", "Fast evidence for rehabilitation and planning decisions", "Whether a capacity upgrade or targeted rehabilitation is the more cost effective outcome"],
            ["After the works", "A baseline to measure against", "Proof of whether past interventions worked"],
          ],
        },
      },
      {
        heading: "Monitoring done properly",
        list: [
          "High resolution logging, typically at 1 to 5 minute intervals, so storm events and the daily pattern are captured accurately",
          "Pre-installation inspections that assess hydraulics, access and the risk of ragging or debris before a site is chosen",
          "Intrinsically safe equipment for live networks, certified under ATEX and IECEx",
          "Rain gauges in the catchment, so each wet weather response is attributed to the rain that caused it",
          "QA/QC throughout: data validation, calibration checks and remote telemetry for the length of the program",
        ],
      },
      {
        heading: "From data to action",
        lede: "In EDS's experience, consistent with findings across the water industry, about 20% of a sewer network typically accounts for 80% of its I&I. Finding that 20% is what makes a program pay back.",
        items: [
          ["Targeted remediation", "Data driven prioritisation finds the worst performing segments for relining, grouting and manhole sealing, instead of blanket rehabilitation."],
          ["Capital works planning", "I&I analysis built into long term asset strategies, reducing the need for costly upsizing."],
          ["Performance measurement", "Monitoring after the works confirms whether each intervention delivered, and validates the investment."],
        ],
      },
      {
        heading: "Common questions",
        faq: [
          ["What is the difference between inflow and infiltration?", "Inflow is stormwater that enters the sewer directly, through sources such as stormwater cross connections, unapproved private connections and defective manholes. It arrives quickly during a storm. Infiltration is groundwater that seeps in through cracks, joints and faulty connections. It builds slowly and lingers as groundwater rises."],
          ["How are the two told apart?", "By reading flow against rainfall. Gauges in the catchment, together with historical climate data, separate the rapid response of inflow from the delayed, groundwater driven response of infiltration."],
          ["How many flow meters does a study need?", "It depends on the size of the network and the question being asked, and sites are chosen by their hydraulics after pre-installation inspections. As one example, EDS deployed 20 short term area velocity flow meters for a regional council's study ahead of a treatment plant upgrade."],
          ["What do we receive at the end?", "Validated data, and a report that ranks subcatchments by their contribution, with a prioritised remediation plan. Monitoring after the works then shows whether they reduced I&I."],
        ],
      },
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
    short: "Data as a Service (DaaS)",
    icon: "database-zap",
    group: "sewer",
    featured: true,
    summary: "A complete open channel sewer monitoring solution with no capital outlay, managed end to end by EDS.",
    intro: [
      "EDS DaaS delivers a structured workflow that ensures accuracy, reliability and defensible results. We select the sites, install and maintain the equipment, validate the data continuously and deliver insights you can act on.",
    ],
    blocks: [
      {
        heading: "A structured, end-to-end approach",
        list: [
          "Hydraulic site selection",
          "Expert installation",
          "Continuous QA/QC and validation",
          "Real-time monitoring and anomaly detection",
          "Verification of the depth to velocity relationship",
          "Ongoing maintenance and performance checks",
          "Delivery of actionable insights",
        ],
      },
      {
        heading: "Managed service and support",
        items: [
          ["99.95% data availability", "A managed fleet with continuous oversight."],
          ["Hydraulic validation of sites", "Every site is checked against the hydraulics it should obey."],
          ["Continuous calibration", "Not a periodic visit, an ongoing process."],
          ["Real-time alerts and insights", "Know about a change when it happens."],
        ],
      },
      {
        heading: "Advanced monitoring technology",
        items: [
          ["Detectronic MSFM AV flow meter", "High performance in sewer environments, with reliable, precise measurement."],
          ["Intrinsically safe", "ATEX and IECEx certified."],
          ["Integrated 4G communications", "Real-time data and continuous visibility of network performance."],
        ],
      },
      {
        heading: "DaaS against traditional monitoring",
        table: {
          left: "Traditional monitoring",
          right: "EDS DaaS",
          rows: [
            ["Data quality", "Variable, often inconsistent", "Reliable and validated"],
            ["Calibration", "Periodic", "Continuous"],
            ["What you receive", "Raw data only", "Real-time insights"],
            ["Installation", "Poor practice is common", "Hydraulic site selection and expert install"],
            ["QA/QC", "Limited validation", "Continuous QA/QC"],
            ["Depth and velocity", "Often misaligned", "Relationship verified"],
            ["Capital outlay", "Equipment purchase", "None"],
          ],
        },
      },
      {
        heading: "Common questions",
        faq: [
          ["Is there any capital outlay?", "No. EDS supplies, installs and maintains the monitoring equipment, so there is nothing to purchase. You pay for validated data and the insight that comes with it."],
          ["What data availability can we expect?", "EDS DaaS is delivered with 99.95% data availability, from a managed fleet with continuous oversight, continuous calibration and real-time alerts."],
          ["How do we see the data?", "In EDS FlowSense, with alarms by email and SMS when something changes, or by API into your own systems."],
          ["How is DaaS different from buying a monitoring program?", "With DaaS, EDS answers for the data, not just the equipment. Hydraulic site selection, continuous QA/QC, verification of the depth to velocity relationship and ongoing maintenance are all part of the service."],
        ],
      },
    ],
    related: ["sewer-flow-monitoring", "real-time-monitoring", "inflow-infiltration-studies"],
    solutions: ["wastewater-monitoring"],
    products: ["detectronic"],
  },
  {
    slug: "sewer-model-calibration",
    title: "Sewer Network Model Calibrations",
    short: "Model Calibration",
    icon: "drafting-compass",
    group: "sewer",
    process: true,
    featured: true,
    summary: "Monitoring programs designed to calibrate and enhance hydraulic and sewer network models.",
    intro: [
      "We work closely with our clients to design and deliver tailored network monitoring programs, from project initiation through to final delivery. These programs support the calibration and enhancement of existing hydraulic and sewer network models.",
      "Hydraulic modelling helps communities understand, plan and future-proof their wastewater infrastructure. High-resolution flow and rainfall data are essential for accurate simulation of collection system performance in both dry and wet weather.",
      "Today's leading modelling platforms can import and process flow and rainfall data in near real time. But the quality of a model depends entirely on the accuracy of the field data fed into it.",
      "Whether you are starting your hydraulic modelling journey or need updated flow monitoring to re-calibrate an existing model, EDS is ready to partner with you. Our team has worked with major councils and utilities across Australia, and understands the importance of reliable, defensible data that supports confident engineering decisions.",
      "Measured data can change the plan as well as the model. When a regional water authority used temporary flow monitoring to recalibrate its hydraulic model, the data showed actual infiltration rates were significantly lower than first modelled. Rehabilitation funds were reallocated, and high risk catchments prioritised more accurately.",
    ],
    blocks: [
      {
        heading: "What a calibration program needs",
        items: [
          ["High resolution flow and rainfall", "Flow logged typically every 1 to 5 minutes, with rain gauges in the catchment, so storm peaks and the daily pattern are both captured."],
          ["Dry and wet weather", "A model has to match the network in dry weather and in storms, so monitoring runs long enough to record both."],
          ["Sites chosen by their hydraulics", "Pre-installation inspections assess hydraulics, access and the risk of ragging or debris before a meter goes in."],
          ["Validated data", "Continuous QA/QC, calibration checks and verification of the depth to velocity relationship, so the model is never tuned to a faulty reading."],
        ],
      },
      {
        heading: "Calibration scored storm by storm",
        lede: "A single score across a whole record can look respectable while the model misses every storm peak. In EDS FlowSense, each storm is scored on its own, to the CIWEM UDG Code of Practice for the hydraulic modelling of sewer systems (2017).",
        items: [
          ["Published acceptance bands", "Peak flow within −15% to +25%, event volume within −10% to +20%, and peak timing within one hour. An event passes on peak and volume together."],
          ["At least three storms", "A calibration needs three assessable storms before it may be called verified. With fewer, it is reported as insufficient events rather than quietly passed."],
          ["Validated on independent storms", "RTK unit hydrographs fitted per catchment are checked against storms that were not used to fit them, with a scorecard for each."],
          ["Ready for your modelling platform", "RTK parameters compatible with EPA SWMM, and exports in EPA SWMM 5, GeoJSON, Excel and CSV."],
        ],
      },
      {
        heading: "Common questions",
        faq: [
          ["How long should calibration monitoring run?", "Long enough to record dry weather flow and several significant storms. Because a calibration needs at least three assessable storms before it can be called verified, the duration depends on the season and the rain that falls. Short term programs commonly run for 6 to 12 weeks."],
          ["Can you work with our existing model?", "Yes. EDS supplies monitoring to calibrate a new model or re-calibrate an existing one, with flow and rainfall data delivered in formats modelling platforms can import, or by API."],
          ["Who carries out the calibration?", "EDS designs and delivers the monitoring program, and can work through the calibration with your modelling team or consultant. FlowSense scorecards mean everyone works from the same results."],
        ],
      },
    ],
    related: ["sewer-flow-monitoring", "inflow-infiltration-studies", "network-assessment"],
    products: ["detectronic", "hach-flow"],
  },
  {
    slug: "thermal-infiltration-surveys",
    title: "Thermal Infiltration Surveys",
    icon: "thermometer",
    group: "sewer",
    process: true,
    summary: "Thermistor strings and open channel flow meters used together to pinpoint where groundwater is getting into a sewer.",
    intro: [
      "Flow monitoring shows how much infiltration a catchment has. Temperature shows where it is getting in. Groundwater and surface water usually enter a sewer at a different temperature from the wastewater already in the pipe, so a string of temperature sensors laid along the pipe registers the change at the point of entry.",
      "EDS combines Beadedstream thermistor strings with open channel sewer flow meters. When a crack opens, the sensors nearest it shift while the flow meter records the extra water arriving, so infiltration is located as well as measured.",
      "Temperature studies are not limited to sewers. EDS delivers short to long term temperature studies in water networks and most other atmospheric or pressurised reticulated networks.",
    ],
    blocks: [
      {
        heading: "Why combine temperature and flow",
        items: [
          ["Accuracy and sensitivity", "Temperature locates infiltration and flow quantifies it, so even minor ingress points show up early."],
          ["Continuous monitoring", "Both record continuously in near real time, so new infiltration points are picked up as they appear."],
          ["Non-intrusive installation", "Strings go in through existing manholes and inspection points, with no excavation or shutdown."],
          ["Built for sewers", "Robust, waterproof sensors that stand up to corrosion, chemicals and physical damage."],
          ["Targeted repairs", "Knowing where water enters narrows the scope, and the cost, of remedial work."],
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
    icon: "siren",
    group: "sewer",
    summary: "Level alarms and continuous depth monitoring that warn of blockages and surcharges before they become overflows.",
    intro: [
      "Blockages and surcharges give warning if something is watching. EDS deploys level monitoring through sewer networks that alerts crews to rising wastewater depth, so utilities can react quickly to a blockage, or a surcharge caused by a sewer collapse, before it becomes a spill.",
      "Detectronic's LIDoTT ALARM puts a radar level sensor, battery, modem and aerial into one Zone 0 certified device, suited to deployment throughout sewer networks and in domestic or lateral sewers.",
      "Where flow meters are already installed, the data does the watching too. A steady rise in depth with no rain to explain it points to a developing blockage or sediment build-up, often long before field crews would report it.",
    ],
    blocks: [
      {
        heading: "How it works",
        items: [
          ["Three alarm states", "Thresholds such as normal, high and high-high are configured on site, with a message when levels return to normal."],
          ["Alarms that reach people", "Delivered by SMS, email and website, with GIS options and optional weather-managed alarm filtering."],
          ["Daily heartbeat", "A daily message confirms each sensor is still operational."],
          ["Long life, zero maintenance", "Battery life of up to seven years, in a submersible, naturally self-cleaning enclosure."],
          ["Depth watched against flow", "On metered sites, FlowSense Blockage Watch looks for depth creeping upward while flow does not, and gives crews a shortlist."],
        ],
      },
      {
        heading: "Level alarms for every chamber",
        items: [
          ["LIDoTT ALARM", "Pulsed coherent radar measuring up to 8.4 m to ± 5 mm, with three alarm states and a battery life of up to seven years."],
          ["Detectronic Alarm2", "Radar level from 0 to 20 m with no deadband, accurate to ± 5 mm at 20 m. High and low, rate of change and profile alarms, sent immediately on change and hourly while in alarm."],
          ["LIDoTT R", "Radar and pressure level together, up to 17 m in total with zero deadband, for continuous monitoring through surcharge."],
          ["Certified for the sewer", "All three are ATEX and IECEx certified for Zone 0, the most hazardous classification."],
        ],
      },
      {
        heading: "Blockage Watch in FlowSense",
        lede: "Where flow meters are installed, FlowSense reads the dry weather record for the signs of a developing blockage. It is included on every site. It needs roughly two months of history, and shows that a line is blocking rather than exactly where.",
        items: [
          ["Eight blockage signatures", "Six of them from level alone. The strongest, conveyance at matched depth, uses velocity as well."],
          ["Scored, not just flagged", "Each case is scored: watch from 35, warning from 55 and critical from 75. A case closes itself once the signature goes."],
          ["A likely cause and an action", "Silt or grease, a sudden obstruction, a downstream restriction or increased load, with a suggested response: desilt, CCTV, inspect below the meter, or no action."],
          ["Tested against your history", "A backtest against your own overflow register shows how much warning it would have given."],
        ],
      },
      {
        heading: "What it helps you catch",
        list: [
          "Blockages in main, domestic and lateral sewers",
          "Surcharges caused by sewer collapses",
          "Sediment build-up, cleared before the next storm",
          "Partial obstructions, sags and displaced joints",
          "Rising risk of a wet weather overflow",
        ],
      },
    ],
    widget: "lidott",
    related: ["sewer-flow-monitoring", "real-time-monitoring", "pump-station-monitoring"],
    solutions: ["wastewater-monitoring", "asset-network-assessment"],
    products: ["detectronic"],
    papers: ["unforeseen-benefits"],
  },
  {
    slug: "rehabilitation-verification",
    title: "Rehabilitation & Works Verification",
    short: "Works Verification",
    icon: "badge-check",
    group: "sewer",
    process: true,
    summary: "Before and after flow monitoring that shows whether relining, cleaning and repair works delivered what was paid for.",
    intro: [
      "Rehabilitation is a large investment, and flow data is the most direct way to show it worked. EDS monitors before and after relining, cleaning and repair programs, so the change in the network is measured rather than assumed.",
      "After a cleaning and relining program in one coastal network, flow profiles recorded by EDS showed the network back to its baseline hydraulic behaviour within 24 hours, confirming the works had restored full capacity.",
      "Utilities increasingly use these before and after comparisons to verify contractor performance, reducing disputes and improving accountability across maintenance programs.",
    ],
    blocks: [
      {
        heading: "A before and after approach",
        list: [
          "Baseline monitoring before works begin",
          "Rainfall recorded alongside flow, so wet weather response before and after can be compared",
          "Monitoring through and after the works",
          "Depth, flow and wet weather response compared against the baseline",
          "A report that documents the outcome for asset and planning teams",
        ],
      },
      {
        heading: "What it tells you",
        items: [
          ["Whether capacity was restored", "Flow profiles show the network returning to baseline hydraulic behaviour."],
          ["Whether infiltration fell", "Less depth and flow variation during rainfall confirms the rehabilitation reduced infiltration."],
          ["Whether the model was right", "Measured results confirm, or correct, the improvements the model predicted."],
          ["Where to spend next", "Long term monitoring validates past interventions and guides the next round of investment."],
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
      "EDS has provided both flow and quality monitoring to the wastewater industry since its founding, and quality monitoring remains a major part of what we do. Whatever the requirement, from single point EC monitoring to a network program delivering real-time data from thousands of field instruments, we supply, install and look after the equipment.",
      "EDS manufactures its own pH, EC and turbidity sensors and the iLab multi-parameter range, and represents Aquamonitrix for real-time nitrate and nitrite measurement. Readings can go straight to your SCADA or telemetry system.",
    ],
    blocks: [
      {
        heading: "What we measure",
        items: [
          ["pH, EC and turbidity", "EDS-made sensors for continuous measurement in water and wastewater."],
          ["Several parameters at once", "The iLab 901 multi-parameter analytical sensor measures up to seven parameters together, from temperature, depth, pH, ORP, conductivity, turbidity, dissolved oxygen, chlorophyll, blue-green algae, ammonia, nitrate, chloride and fluoride. The handheld iLab Sonde covers field checks."],
          ["Nitrate and nitrite", "Aquamonitrix measures both from the same sample by ion chromatography, with detection limits of 1.5 ppm nitrate and 0.25 ppm nitrite, and no sample pre-treatment."],
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
          ["Few site visits", "Aquamonitrix runs more than 600 samples between services, over three months at six samples a day, and the iLab 901 has its own self-cleaning system."],
          ["Up and running quickly", "Aquamonitrix can be running within a couple of hours, with extremely stable calibration over long deployments."],
          ["Calibrated in place", "EDS audits and calibrates analytical equipment in situ, so the readings stay trustworthy for the length of the program."],
        ],
      },
    ],
    related: ["sampling-programs", "trade-waste", "auditing-calibration"],
    solutions: ["wastewater-monitoring", "environmental-monitoring"],
    products: ["eds", "aquamonitrix", "ori"],
  },
  {
    slug: "sampling-programs",
    title: "Sampling & Sampler Hire",
    icon: "test-tubes",
    group: "water",
    summary: "Automatic water and wastewater samplers to buy or hire, including the only true intrinsically safe sampler in Australia.",
    intro: [
      "EDS offers the largest range of automated water and wastewater samplers, and supplies the only true intrinsically safe sampler in Australia. We sell the widest range of sampler configurations in the country and keep a select rental fleet for short to long term projects.",
      "The range covers mobile and stationary samplers from ORI, the world's leading manufacturer of ATEX and IECEx certified sampling systems, and MicroLevel's portable, fixed and refrigerated composite samplers.",
    ],
    blocks: [
      {
        heading: "What we offer",
        items: [
          ["Purchase", "The widest range of sampler configurations in Australia."],
          ["Hire", "A select rental fleet for short to long term projects."],
          ["Certified for hazardous areas", "ATEX and IECEx certified ORI samplers for sewers and other demanding sites."],
          ["Composite and refrigerated", "MicroLevel MICROSAMPLER units for portable, fixed and refrigerated composite sampling."],
          ["Expert advice", "Help choosing the right sampler and configuration for the job."],
        ],
      },
      {
        heading: "Suitable for",
        list: [
          "Wastewater, sewer and pretreatment sludge sampling",
          "Trade waste and process water monitoring",
          "Stormwater, surface water, river and well sampling",
          "Watershed monitoring",
          "Product sampling for quality verification",
        ],
      },
      {
        heading: "Choosing a sampler",
        items: [
          ["ORI NEMO 1 M", "Mobile sampler approved under ATEX and IECEx for Zones 1 and 2, with inputs for up to 10 digital and 2 analogue sensors and an optional LTE modem. Peristaltic, vacuum and hybrid pump versions."],
          ["ORI AquaSamp Mini", "A light portable sampler for spot and timed samples, with 6 m suction lift and up to 144 samples on one charge. An ATEX version is available."],
          ["ORI PumpModul", "Starts on an event: a contact such as a push-button, an RS485 command or an ORI logger. Available with ATEX approval for Zone 1."],
          ["ORI BASIC mobil", "Battery powered mobile samplers for hazardous Zones 1 and 2, including a version with active cooling."],
          ["MicroLevel MICROSAMPLER", "Composite samplers in portable (10P), fixed (10B) and refrigerated (10R) configurations."],
          ["Flow proportional sampling", "Detectronic MSFM flow meters can pulse a sampler, so samples are taken in proportion to the flow."],
        ],
      },
    ],
    related: ["water-quality-monitoring", "trade-waste", "equipment-rental"],
    solutions: ["automatic-sampling", "environmental-monitoring"],
    products: ["ori", "microlevel"],
  },
  {
    slug: "trade-waste",
    title: "Trade Waste Monitoring",
    icon: "factory",
    group: "water",
    featured: true,
    summary: "Compliance monitoring, real-time data and reporting for industrial discharge.",
    intro: [
      "EDS provides comprehensive trade waste monitoring to help businesses stay compliant and efficient. We work with some of Australia's largest companies, helping them manage their trade waste efficiently and sustainably.",
      "A trade waste program usually brings flow, sampling and quality together. EDS supplies, installs and services all three, so one team answers for the whole site.",
      "For utilities, network flow data also shows trade waste where it should not be. In one Queensland catchment, persistent overnight flow with no rain to explain it led to the discovery of a trade waste connection incorrectly tied into the sewer.",
    ],
    blocks: [
      {
        heading: "Trade waste services",
        items: [
          ["Compliance monitoring", "Accurate, reliable monitoring systems that keep you within local and national regulations."],
          ["Real-time data collection", "Continuous monitoring of trade waste parameters, allowing timely intervention."],
          ["Customised solutions", "Systems tailored to your operations and waste streams."],
          ["Reporting and analysis", "Comprehensive reporting to help you understand and manage your trade waste."],
          ["Maintenance and support", "Ongoing servicing so your monitoring is always working."],
        ],
      },
      {
        heading: "What a program can include",
        items: [
          ["Flow", "Discharge measured in open channels with area velocity meters, or in full pipes with Dynaflox ultrasonic and other closed channel meters."],
          ["Sampling", "ORI samplers certified under ATEX and IECEx, and MicroLevel portable, fixed and refrigerated composite samplers, with flow proportional sampling where it is required."],
          ["Quality", "EDS pH, EC and turbidity sensors, and Aquamonitrix for nitrate and nitrite."],
          ["Data and reporting", "Readings in real time to FlowSense or your own systems, and reports for your compliance records."],
        ],
      },
      {
        heading: "Why EDS",
        items: [
          ["Decades of experience", "Knowledge gained over decades in the industry."],
          ["Exceptional customer service", "A team dedicated to supporting you."],
          ["Cutting-edge technology", "Precise and reliable monitoring solutions."],
          ["Tailored solutions", "Designed around the needs of your business."],
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
    short: "Closed Channel Flow",
    icon: "cylinder",
    group: "water",
    summary: "Magnetic, ultrasonic and contacting technologies to measure and totalise flow in full pipes.",
    intro: [
      "In closed channel flow monitoring there are several products and technologies that can be used to measure flow.",
      "The options include magnetic and ultrasonic flow meters, pressure transmitters and contacting technologies such as capacitance, TDR (time domain reflectometry) and paddle wheel, to measure and totalise the flow. Each technology has its pluses and minuses.",
      "EDS staff would welcome the opportunity to discuss the options and services available.",
    ],
    blocks: [
      {
        heading: "The technologies",
        items: [
          ["Magnetic", "Measures the voltage induced as a conductive liquid moves through a magnetic field. Nothing obstructs the flow and there are no moving parts, but the liquid must be conductive."],
          ["Ultrasonic transit time", "Times sound pulses travelling with and against the flow. Suited to clean liquids, and available inline, as insertion meters or clamped on the outside of the pipe."],
          ["Ultrasonic Doppler", "Reflects sound from particles and bubbles carried in the liquid, so it suits wastewater, slurries and other liquids with solids."],
          ["Pressure transmitters", "Infer flow from the differential pressure across a restriction, and measure level and head."],
          ["Contacting technologies", "Capacitance and TDR (time domain reflectometry) sensors measure level, and paddle wheels measure velocity directly. Simple and economical where conditions suit them."],
        ],
      },
      {
        heading: "Choosing a meter",
        lede: "Each technology has its pluses and minuses. These are the questions that decide between them.",
        list: [
          "The liquid: its conductivity, and the solids and bubbles it carries",
          "The pipe: material, diameter, lining and condition",
          "The straight run of pipe available upstream and downstream of the meter",
          "Whether the line can be cut, or the meter must clamp on or be hot tapped in service",
          "The accuracy required, whether for billing, compliance or operations",
          "Power, communications, and the systems the readings must reach",
        ],
      },
      {
        heading: "How EDS helps",
        items: [
          ["Selection and supply", "Advice on the technology that suits the application, and supply from one of Australia's largest portfolios of monitoring instruments."],
          ["Installation and commissioning", "Installed and commissioned by EDS technicians, and connected to your SCADA or telemetry."],
          ["Audit and calibration", "In situ audits and calibration of closed channel meters already in service."],
          ["Hire", "Short and long term hire for temporary measurement."],
        ],
      },
    ],
    related: ["auditing-calibration", "equipment-rental", "real-time-monitoring"],
    products: ["dynaflox", "eds"],
  },
  {
    slug: "rainfall-monitoring",
    title: "Rainfall Monitoring",
    icon: "cloud-drizzle",
    group: "water",
    process: true,
    summary: "Tipping bucket rain gauges installed alongside flow meters, so every change in the network can be read against the rain that caused it.",
    intro: [
      "Flow data shows that something changed. Rainfall data shows why. EDS integrates data from RIMCO 7499 tipping bucket rain gauges sited in the catchments we monitor, so the network's wet weather response can be measured against the rain that produced it.",
      "Rainfall correlation is how inflow is told apart from infiltration. Inflow arrives quickly during a storm. Infiltration builds slowly and lingers as groundwater rises. On-site gauges, read with historical climate data, let the two be separated with confidence.",
      "Rainfall data is in our history: EDS developed the data logger for the Bureau of Meteorology in the 1990s, and those loggers are still in use today.",
    ],
    blocks: [
      {
        heading: "What is included",
        items: [
          ["Tipping bucket rain gauges", "RIMCO 7499 gauges sited within the catchment being monitored."],
          ["High resolution logging", "Rain recorded at short intervals, typically 1 to 5 minutes, so storm peaks are captured."],
          ["Rainfall dependent I&I analysis", "Flow response separated into rapid inflow and slower, groundwater driven infiltration."],
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
    related: ["inflow-infiltration-studies", "sewer-model-calibration", "sewer-flow-monitoring"],
    solutions: ["environmental-monitoring"],
    products: ["eds"],
    papers: ["measuring-the-invisible"],
  },
  {
    slug: "real-time-monitoring",
    title: "Real-Time Monitoring",
    icon: "radio-tower",
    group: "data",
    featured: true,
    summary: "Rugged wireless monitoring equipment that integrates with the SCADA systems you already run.",
    intro: [
      "EDS offers an extensive selection of rugged, wireless monitoring equipment designed for the most demanding and critical applications. Our devices are engineered for resilience and accuracy, performing reliably in any condition.",
      "We are not just about providing equipment. We combine the latest monitoring technology with a high level of customer service, so you have the support and expertise to succeed.",
    ],
    blocks: [
      {
        heading: "Key features",
        items: [
          ["Durable design", "Built to withstand harsh environments and challenging conditions."],
          ["Wireless connectivity", "Integrates with wireless networks for flexible deployment."],
          ["Versatile compatibility", "Works with leading SCADA architectures including ClearSCADA, Schneider CITECT, ELPRO and many more."],
        ],
      },
      {
        heading: "Our promise",
        items: [
          ["Latest technology", "Stay ahead with the most advanced monitoring tools."],
          ["Exceptional support", "A commitment to outstanding customer service."],
          ["Reliability", "The highest industry data uptime rate for continuous, dependable monitoring."],
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
          ["4G from the field", "EDS and Detectronic loggers report over the mobile network. The battery powered EDS Hawk lives inside the maintenance hole, with no cabinet or mains power at site."],
          ["EDS FlowSense", "Every site on one map, refreshed every 60 seconds, worst first: open alarms, quiet loggers and sites outside their normal range."],
          ["Alarms that reach people", "Threshold and no-data rules, sent by email and SMS once when the state changes, so a dead logger is caught as well as a high level."],
          ["Your own systems", "Feeds to your SCADA or historian, and a read API, with nothing installed on your control network."],
        ],
      },
    ],
    related: ["data-as-a-service", "sewer-flow-monitoring", "facility-management"],
    products: ["eds", "detectronic"],
  },
  {
    slug: "pump-station-monitoring",
    title: "Pump Station Monitoring",
    icon: "fan",
    group: "data",
    summary: "Wet well levels, pump runs and alarms watched around the clock, from the company that built the Pump Station Manager.",
    intro: [
      "Pump stations are where EDS began. The company was founded in 1991 alongside the release of its flagship product, the Pump Station Manager (PSM), and EDS still designs and builds the instruments that keep pump stations under watch.",
      "We supply and install monitoring for wet well levels, pump runs and alarms, and connect it to the SCADA systems you already run. Flow data from the network upstream adds what SCADA alone cannot show: how the catchment responds to rain, and whether pump start and stop levels suit the flows actually arriving.",
      "Utilities have used flow data from LIDoTT Smart sensors to refine pump start and stop levels, reducing both run time and power consumption.",
    ],
    blocks: [
      {
        heading: "What we provide",
        items: [
          ["Pump Station Manager", "The EDS flagship since 1991, designed and built by EDS."],
          ["Wet well level", "Radar and pressure level sensing with the LIDoTT R, or EDS ultrasonic level sensors."],
          ["Loggers and telemetry", "EDS EMS data loggers and the 4G Metalog send readings in real time."],
          ["SCADA integration", "Works with ClearSCADA, Schneider CITECT, ELPRO and other leading SCADA architectures."],
          ["The wet well in FlowSense", "Drawn to scale with its start, stop, surcharge and overflow levels and the live water level."],
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
        lede: "FlowSense works out station flow and pump condition from the level and run signals a station already has, with no flow meter required.",
        items: [
          ["What it needs", "Wet well level scanned at five minutes or better, the run state of each pump, and the dimensions of the well."],
          ["What it reports", "Volume in and out, pump starts and run hours, and energy per megalitre pumped."],
          ["Capacity against nameplate", "Each pump's delivered capacity over ninety days, set against its nameplate rating, shows wear before it becomes a failure."],
          ["Honest about gaps", "Cycles the record cannot support are left out and reported, rather than estimated."],
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
    intro: [
      "Telemetry is in EDS's roots. Before founding EDS, Graham Harper started Elpro, now one of the world's largest SCADA suppliers.",
      "Our monitoring equipment works with leading SCADA architectures including ClearSCADA, Schneider CITECT and ELPRO. Data can also reach your systems from our platform by API, and real-time analytical sensors can be integrated into new or existing building management systems.",
    ],
    blocks: [
      {
        heading: "Ways to connect",
        items: [
          ["Direct to SCADA", "Instruments that work with ClearSCADA, Schneider CITECT, ELPRO and many more."],
          ["4G telemetry", "Integrated 4G communications on flow meters and loggers, for real-time data."],
          ["API access", "Data passed from our platform straight into your existing systems."],
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
          ["Read API", "Pulled over HTTPS on your own schedule, into tools such as Power BI, Excel, Grafana or ArcGIS. Read only."],
          ["Webhooks", "Signed messages posted when an alarm, an overflow or a forecast risk is recorded."],
        ],
      },
      {
        heading: "Common questions",
        faq: [
          ["Does anything need to be installed on our SCADA?", "No. There is no agent, connector or gateway to install. OPC UA, DNP3 and Modbus are not touched in either direction, and there is no control path into your systems."],
          ["Are the readings changed on the way?", "No. Values are sent exactly as stored, with no gap filling and no smoothing. A missing reading is left blank rather than estimated."],
          ["How long does a connection take to commission?", "Usually an afternoon. Each connection is commissioned with you, and is not called done until a reading has arrived and been checked."],
          ["Is there a charge for the feeds?", "No. Feeds, the API and webhooks cost nothing extra with a FlowSense subscription."],
        ],
      },
    ],
    related: ["real-time-monitoring", "pump-station-monitoring", "facility-management"],
    products: ["eds", "aquamonitrix"],
  },
  {
    slug: "data-analysis-reporting",
    title: "Data Analysis & Reporting",
    icon: "chart-line",
    group: "data",
    summary: "Validated flow, depth and rainfall data turned into reports that show where the problems are and what to fix first.",
    intro: [
      "Data is only valuable if it leads to a decision. EDS validates the data it collects and turns it into reports that are easy to interpret, supporting planning, investment and regulatory compliance.",
      "Our data validation processes are ISO compliant. Readings are checked continuously and, where it matters, cross-checked against SCADA pump station records and field inspections to verify anomalies.",
      "In EDS's experience, about 20% of a sewer network typically accounts for 80% of its inflow and infiltration. Good analysis finds that 20%, so rehabilitation goes where it pays back.",
    ],
    blocks: [
      {
        heading: "What we deliver",
        items: [
          ["Continuous QA/QC", "Data validated as it arrives, with calibration checks and remote telemetry throughout the program."],
          ["Rainfall dependent I&I analysis", "Inflow separated from infiltration using on-site rain gauges and historical climate data."],
          ["Prioritised remediation plans", "Subcatchments ranked by contribution, with cost benefit analyses and a phased program of works."],
          ["Asset condition insights", "Shifts in the depth to velocity relationship that point to blockages, sediment and structural defects."],
          ["Cross connection detection", "Dry weather flow signatures that reveal illegal discharges and stormwater tied into the sewer."],
          ["Full access to your data", "Through FlowSense, or by API into your own systems."],
        ],
      },
      {
        heading: "From an EDS project",
        items: [
          ["Three subcatchments, 65% of the I&I", "A regional council engaged EDS ahead of a treatment plant upgrade. Twenty short term flow meters and on-site rain gauges showed where the water was coming from."],
          ["A $6M expansion avoided", "The evidence let the council redirect capital into relining, manhole sealing and inflow source reduction."],
          ["Peak wet weather flows down 35%", "Targeted rehabilitation delivered the reduction within two years."],
        ],
      },
      {
        heading: "How the analysis is done",
        lede: "Every derived figure in EDS FlowSense carries a note on how it was calculated: the method, the constants and the assumptions, in plain language.",
        items: [
          ["Dry weather flow", "Sanitary flow and groundwater infiltration separated from qualifying dry days only, with a daily pattern for each type of day."],
          ["Every storm on its own", "Isolated storms detected automatically, each with its peak, volume, lag and uplift over dry weather flow."],
          ["A split that adds up", "Sanitary flow, groundwater infiltration and rainfall-derived inflow, summing exactly to the metered total."],
          ["Priced at your rates", "Extraneous volumes costed at your own treatment and pumping rates, and remediation options ranked by NPV, benefit cost ratio and cost per kilolitre removed."],
          ["The measured record is kept", "Data is checked for flatlines, spikes, drift and impossible values. Repairs are for export only: a gap fill never overwrites what was measured."],
          ["Catchments that close", "Upstream and downstream sites compared, aligned on travel time, to show where flow is gained or lost."],
        ],
      },
    ],
    related: ["data-as-a-service", "inflow-infiltration-studies", "rehabilitation-verification"],
    solutions: ["asset-network-assessment"],
    products: ["detectronic"],
    papers: ["measuring-the-invisible", "unforeseen-benefits"],
  },
  {
    slug: "network-assessment",
    title: "Network Assessment & Review",
    icon: "network",
    group: "data",
    featured: true,
    summary: "In-depth network analysis and reporting on the performance and condition of water and wastewater networks.",
    intro: [
      "EDS has in-depth knowledge and a long history of working with Australia's largest networks in the water and wastewater industry. We offer full network analysis and reports that show overall performance and operating condition.",
      "EDS has developed numerous collection system models to assist councils and governments in evaluating their sewer systems, troubleshooting existing problems, proposing improvements and developing a prioritised list of improvements with their associated costs.",
    ],
    blocks: [
      {
        heading: "Related activities",
        list: [
          "Model development",
          "Flow monitoring for model calibration and I/I assessment",
          "Development of a program for system improvement",
          "Training your staff in modelling and monitoring practices",
          "Real-time data evaluation as events happen, with instantaneous alarms",
        ],
      },
      {
        heading: "What an assessment can show",
        items: [
          ["Where the inflow is worst", "Inflow severity mapped across catchments, so CCTV inspections and rehabilitation budgets go where they are needed."],
          ["Asset condition", "Shifts in the depth to velocity relationship that reveal blockages, sediment, sags, displaced joints and infiltration points before crews report them."],
          ["What should not be there", "Dry weather flow signatures that reveal cross connections, illegal discharges and stormwater tied into the sewer."],
          ["Capacity and level of service", "Pipe capacity and self-cleansing velocity checked against the WSA 02 Sewerage Code of Australia."],
        ],
      },
      {
        heading: "What you receive",
        list: [
          "Validated monitoring data, and full access to it",
          "A report on the performance and operating condition of the network",
          "Problems located and explained, with the evidence behind each",
          "A prioritised list of improvements, with their associated costs",
        ],
      },
    ],
    related: ["sewer-model-calibration", "data-analysis-reporting", "sewer-flow-monitoring"],
    solutions: ["asset-network-assessment"],
    products: ["detectronic", "eds"],
    papers: ["unforeseen-benefits", "measuring-the-invisible"],
  },
  {
    slug: "auditing-calibration",
    title: "Auditing & Calibration",
    icon: "clipboard-check",
    group: "field",
    featured: true,
    summary: "In situ audits and calibration of your monitoring equipment by experienced service technicians.",
    intro: [
      "EDS's experienced team of service and network technicians offers in situ audit and calibration of your monitoring equipment. This includes closed channel, open channel, quantity and analytical equipment.",
      "EDS has a vast knowledge base in the operation of the many monitoring technologies available.",
      "Calibration is what keeps a long record trustworthy. EDS has calibrated long term sewer flow gauges across multiple Yarra Valley Water sites, so the data stays reliable for hydraulic modelling and infrastructure planning.",
    ],
    blocks: [
      {
        heading: "What we audit and calibrate",
        items: [
          ["Open channel flow", "Area velocity flow meters, level sensors and loggers in sewers, drains and channels."],
          ["Closed channel flow", "Magnetic, ultrasonic and other full pipe meters, measuring and totalising flow."],
          ["Quantity", "Level, pressure and rainfall instruments, and the loggers that record them."],
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
          ["Defensible data", "Readings that hold up in a model, a compliance report or a capital works decision."],
          ["Problems found early", "A drifting sensor or a fouled site found at the audit, not months later in the data."],
        ],
      },
    ],
    related: ["closed-channel-flow", "trade-waste", "equipment-rental"],
    products: ["hach-flow", "dynaflox", "eds"],
  },
  {
    slug: "equipment-rental",
    title: "Equipment Rental",
    icon: "package-check",
    group: "field",
    summary: "Long and short term hire of monitoring and analytical equipment built for the harshest applications.",
    intro: [
      "EDS offers an extensive range of monitoring and analytical equipment as part of our hire fleet. Our equipment is designed for the harshest and most demanding applications.",
      "EDS is one of the leading suppliers of rugged scientific and quantitative products across a wide range of applications, and we back the fleet with expert advice.",
      "We are renowned for tackling difficult applications and can offer bespoke packages, from off-the-shelf systems to national and international projects.",
    ],
    blocks: [
      {
        heading: "In the hire fleet",
        items: [
          ["Flow meters and loggers", "Area velocity flow meters and 4G loggers for temporary flow surveys, including the EDS Hawk."],
          ["Samplers", "A select rental fleet of automatic water and wastewater samplers for short to long term projects."],
          ["Analytical equipment", "Monitoring and analytical instruments for water quality programs."],
        ],
      },
      {
        heading: "How hire works",
        steps: true,
        list: [
          "Tell us the application, the site and how long you need the equipment",
          "We recommend the right setup, from an off-the-shelf system to a bespoke package",
          "Install it yourself, or have trained EDS crews install and commission it",
          "Readings from 4G instruments arrive in EDS FlowSense or your own systems",
        ],
      },
      {
        heading: "When hire makes sense",
        list: [
          "Short term inflow and infiltration studies",
          "Monitoring for model calibration",
          "Before and after monitoring around rehabilitation works",
          "Trade waste and compliance sampling campaigns",
        ],
      },
    ],
    related: ["sewer-flow-monitoring", "trade-waste", "auditing-calibration"],
    products: ["hach-flow", "ori", "microlevel", "dynaflox"],
  },
  {
    slug: "facility-management",
    title: "Facility Management",
    icon: "building-2",
    group: "field",
    summary: "Integrated, technology-driven facility management for major corporate and government organisations.",
    intro: [
      "With more than 30 years of experience, EDS is a trusted leader in facility management solutions for major corporate and government organisations across Australia.",
      "Facility management is more than maintenance. It is about optimising the performance, safety and sustainability of your assets. Our team works closely with each client to provide tailored solutions that maximise operational efficiency and minimise downtime, while ensuring compliance with the latest regulations and industry standards.",
      "We combine in-depth knowledge of complex facilities with advanced monitoring systems, integrated data management platforms and real-time reporting tools. At EDS each solution is custom built, because no two facilities are the same. We consider your environment, budget, level of risk, compliance and legislative requirements.",
    ],
    blocks: [
      {
        heading: "Our facility management services",
        items: [
          ["Comprehensive asset management", "Proactive maintenance, lifecycle planning and asset optimisation strategies."],
          ["24/7 support and monitoring", "Continuous system oversight and rapid response to issues, minimising operational disruption."],
          ["Sustainability and compliance", "Solutions focused on energy efficiency, environmental responsibility and regulatory compliance."],
          ["Custom integration", "New technologies and processes integrated into your existing facility infrastructure, including your BMS."],
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
    quote: {
      text: "Motivated people, delivering multiple services together as one team, and a continual focus on processes, results in cost-reductions from synergies and integration.",
    },
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
      "EDS trains client staff in monitoring and modelling practices, so the people who own a network can understand the data it produces and get the most from it.",
      "Our own field crews complete rigorous training in installation, maintenance and calibration, because trained people and sound QA are what keep data quality high over a long program.",
      "We also support the instruments and software we supply. Manuals, software and drivers are on our Resources page, and EDS, Hach Flo-Ware and Dynaflox software is available on request.",
    ],
    blocks: [
      {
        heading: "How we help",
        items: [
          ["Monitoring and modelling practice", "Training for your staff in the practices behind network monitoring and hydraulic models."],
          ["Software and drivers", "FSDATA Desktop and USB-serial drivers to download, with EDS (EMS2001, EMS4000), Hach Flo-Ware and Dynaflox software on request."],
          ["Advice on equipment", "Our team has installed, serviced and calibrated the instruments we sell, and can tell you which suits your application."],
          ["Ongoing support", "Maintenance and support so implemented solutions keep working."],
          ["EMS-Flow", "EDS software for commissioning area velocity flow sensors: pipe profile, level, velocity calibration and logging mode set through a five step wizard, with every setting read back to confirm it."],
        ],
      },
    ],
    related: ["auditing-calibration", "network-assessment", "equipment-rental"],
    products: ["eds", "hach-flow", "dynaflox"],
  },
];

/* ------------------------------------------------------------------ */
/* Solutions (the old site's "Applications")                           */
/* ------------------------------------------------------------------ */
export const solutions = [
  {
    slug: "structure-performance",
    title: "Structure Performance & Monitoring",
    icon: "landmark",
    summary: "24/7 condition scoring of critical structures with the EDS Asset Score (EAS).",
    intro: [
      "EDS has worked with Australia's largest industries to deliver detailed and critical asset condition reports. No one knows better than our clients how quickly asset conditions can change. EDS offers a complete product and service solution to deliver real-time condition reporting.",
      "The patent pending EDS Asset Score (EAS) provides a 24/7 status score of infrastructure condition and change, so our clients are notified as soon as possible of any adverse or subtle change to asset integrity. The EAS is represented as a score from 0 to 1000 and uses EDS algorithms to plot and record asset condition.",
      "Every client's solution is different, from buildings to hydraulic assessments. For one government asset, EDS installed a combination of light, moisture, seismic and temperature sensors across critical structure points, providing 24/7 monitoring and asset evaluation.",
      "Historical EAS can also be plotted to alarm on a predetermined trigger. For example, if any monitored parameter changes by more than 5% in 60 minutes, on-site managers and key stakeholders are alerted.",
    ],
    blocks: [
      {
        heading: "How the EDS Asset Score works",
        items: [
          ["Sensors chosen for the structure", "Light, moisture, seismic and temperature sensors, or whatever combination the asset needs, placed at critical structure points."],
          ["One score from 0 to 1000", "EDS algorithms combine the readings into a single score of condition and change, recorded around the clock."],
          ["Alarms on change", "Triggers set on the score's history, such as any monitored parameter moving more than 5% in 60 minutes."],
          ["The right people told", "On-site managers and key stakeholders alerted as soon as possible to adverse or subtle change."],
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
    title: "Asset & Network Assessment",
    icon: "scan-search",
    summary: "Regular, consistent assessments that keep networks and assets operating at peak performance.",
    intro: [
      "Network condition and deterioration can vary in severity, but it almost always affects the overall serviceability of the asset, increasing staff and maintenance costs.",
      "By carrying out regular, consistent network assessments and reports, EDS can help ensure your network and assets are operating at peak performance.",
      "Accurate flow data reveals far more than inflow. In one regional council, a sudden shift in the depth to velocity relationship revealed a partial obstruction in a rising main, and a targeted CCTV inspection confirmed the debris.",
    ],
    blocks: [
      {
        heading: "What we look for",
        items: [
          ["Blockages and sediment", "A steady rise in depth with no rain to explain it, found and cleared before the next storm."],
          ["Structural defects", "Depth anomalies that point to sags, displaced joints and infiltration points."],
          ["Cross connections", "Overnight flow in dry weather, or a rainfall response a residential catchment should not have."],
          ["Where to spend", "Inflow severity mapped across catchments, so inspections and rehabilitation go where they are needed."],
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
    title: "Network Thermal Monitoring",
    icon: "thermometer",
    summary: "Short to long term temperature studies that pinpoint ingress sources in reticulated networks.",
    intro: [
      "EDS offers the products and services to deliver short to long term temperature studies that measure temperature fluctuations in reticulated networks. This is not limited to water or wastewater networks, and applies to most atmospheric or pressurised networks.",
      "Using temperature to determine network conditions is a growing practice. It delivers accurate, low cost reports on network conditions and allows specific ingress sources to be pinpointed.",
    ],
    blocks: [
      {
        heading: "How it works",
        items: [
          ["A string of sensors", "Temperature sensors spaced along a cable and laid in the pipe. Water entering the network is usually a different temperature from what is already in it."],
          ["A flow meter alongside", "An open channel flow meter measures the volume the network is carrying at the same time."],
          ["Located and measured", "When a defect lets water in, the sensors nearest it change while the flow meter records the extra water arriving, so the ingress is both located and quantified."],
        ],
      },
      {
        heading: "The equipment",
        items: [
          ["Beadedstream Digital Temperature Cable", "Up to 750 m long with up to 125 sensors, accurate to ± 0.1 °C between −10 and 30 °C. IP68, and rated to 3.5 MPa fluid pressure."],
          ["Loggers for remote sites", "The Beadedstream D605 reports by two-way Iridium satellite with pole-to-pole coverage, with four cable ports for up to 500 sensors."],
          ["Into your systems", "The Beadedstream MLink converts a temperature cable to Modbus or JSON over RS-485 for other loggers and SCADA."],
        ],
      },
    ],
    related: ["asset-network-assessment", "wastewater-monitoring"],
    productLinks: ["beadedstream"],
  },
  {
    slug: "wastewater-monitoring",
    title: "Wastewater Monitoring",
    icon: "droplets",
    summary: "Flow and quality monitoring, from a single EC point to thousands of deployed field instruments.",
    intro: [
      "EDS has decades of experience providing both flow and quality monitoring for the wastewater industry. This was the founding focus of EDS and remains a major part of our services to this day.",
      "EDS is Australia's largest service contractor for water and wastewater monitoring studies, both short and long term.",
      "We can provide the widest range of equipment suited to the most demanding applications, whatever the requirement: from single point EC monitoring to a detailed network monitoring program delivering real-time data from thousands of deployed field instruments.",
    ],
    blocks: [
      {
        heading: "What we monitor",
        items: [
          ["Flow", "Area velocity flow meters in sewers and channels, including the Detectronic MSFM, EDS E-Flow 3 and the Hach range."],
          ["Level and alarms", "Radar and pressure level sensors, and self contained alarms that warn of blockages and surcharges."],
          ["Quality", "pH, EC, turbidity and multi-parameter sensors, and Aquamonitrix for nitrate and nitrite."],
          ["Sampling", "ORI and MicroLevel automatic samplers, for purchase or hire."],
          ["Rainfall", "Tipping bucket rain gauges in the catchments we monitor."],
          ["Data", "Every reading in EDS FlowSense, with alarms by email and SMS, and feeds to your own systems."],
        ],
      },
      {
        heading: "Programs of every length",
        list: [
          "Short term studies for inflow and infiltration and model calibration",
          "Long term monitoring that tracks performance across seasons",
          "Permanent monitoring stations, installed and maintained by EDS",
          "Managed monitoring as Data as a Service, with no capital outlay",
        ],
      },
    ],
    related: ["automatic-sampling", "environmental-monitoring"],
    productLinks: ["detectronic", "hach-flow", "aquamonitrix"],
  },
  {
    slug: "automatic-sampling",
    title: "Automatic Sampling",
    icon: "flask-conical",
    summary: "Australia's widest range of automated water and wastewater samplers, for sale or hire.",
    intro: [
      "EDS offers the largest range of automated water and wastewater samplers. The only true intrinsically safe sampler in Australia is supplied by EDS.",
      "We offer the widest range of sampler configurations in Australia for purchase, and a select rental fleet for short to long term projects.",
    ],
    blocks: [
      {
        heading: "Suitable for",
        list: [
          "Water, stormwater and surface water sampling",
          "River and well sampling",
          "Watershed monitoring",
          "Process water monitoring",
          "Product sampling for quality verification",
          "Wastewater and pretreatment sludge sampling",
          "Monitoring of sewer systems",
        ],
      },
      {
        heading: "Choosing the right sampler",
        list: [
          "The hazardous area classification of the site, and the ATEX and IECEx approval it needs",
          "Spot, timed or composite samples, and how many bottles",
          "Time proportional or flow proportional sampling",
          "Whether samples must be refrigerated until collection",
          "Battery or mains power, and how long the sampler must run unattended",
          "Whether readings and alarms need to be sent by telemetry",
        ],
      },
    ],
    related: ["wastewater-monitoring", "environmental-monitoring"],
    productLinks: ["ori", "microlevel"],
  },
  {
    slug: "environmental-monitoring",
    title: "Environmental Monitoring",
    icon: "trees",
    summary: "Environmental data you can trust, at every stage of project development.",
    intro: [
      "EDS works closely with clients to deliver environmental monitoring solutions tailored to each project's requirements. Decades of direct market experience mean EDS can deliver the most suitable solutions for the most demanding needs.",
      "Environmental data that makes sense, and is accurate and reliable, is essential to understanding your biophysical environment and the interactions you are having with it.",
      "Trustworthy data matters at every stage of project development: to guide design, provide a baseline, allow prediction and assessment of impacts, validate mitigation and management procedures, or demonstrate compliance.",
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
          ["Sampling", "Automatic samplers for river, well, stormwater and watershed programs."],
        ],
      },
    ],
    related: ["wastewater-monitoring", "automatic-sampling"],
    productLinks: ["eds", "beadedstream", "aquamonitrix"],
  },
];

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */
// `docs` on a product is downloadable from its card; the brand page's
// Documents panel lists those plus any brand-wide `docs`.
export const brands = [
  {
    slug: "eds",
    name: "EDS",
    title: "EDS Instruments",
    icon: "cpu",
    tag: "Designed and built by EDS",
    summary: "Data loggers, sensors and the Pump Station Manager, manufactured by EDS.",
    cover: img("e-flow-3.png"),
    intro: [
      "Environmental Data Services is a manufacturer, and represents leading manufacturers, in water supply and management, wastewater management, flow monitoring equipment and process control equipment.",
      "EDS manufactures the popular EMS \"D\" Series data loggers and the Pump Station Manager, and contractually manufactures and supplies data loggers to the Australian Bureau of Meteorology.",
    ],
    groups: [
      {
        name: "Data loggers",
        items: [
          { name: "Hawk", type: "logger", note: "Battery powered 4G sewer logger", image: img("hawk.png"), href: "products/hawk.html", docs: [{ label: "Datasheet", href: localDoc("eds-hawk-datasheet.pdf") }, { label: "Brochure", href: localDoc("eds-hawk-brochure.pdf") }] },
          { name: "iLab Sonde", type: "quality", note: "Multi-parameter handheld", image: img("ilab-and-sensor.jpg") },
          { name: "EPM-2", type: "logger", note: "Portable 4G pressure logger", image: img("epm-2.png") },
          { name: "Metalog", type: "logger", note: "4G data logger", image: img("grt101-gprs-4g-lte-battery-supply-wireless.jpg") },
          { name: "EMS-003", type: "logger", note: "Dual channel logger", image: img("003d.jpg") },
          { name: "EMS-050D", type: "logger", note: "Multi-channel logger", image: img("050d.jpg") },
          { name: "Pump Station Manager", type: "logger", note: "PSM, the EDS flagship since 1991", image: img("psm.jpg") },
        ],
      },
      {
        name: "Sensors",
        items: [
          { name: "E-Flow 3", type: "flow", note: "Dual mode sewer flowmeter", image: img("e-flow-3.png"), href: "products/e-flow-3.html", docs: [{ label: "Datasheet", href: localDoc("eds-e-flow-3-datasheet.pdf") }, { label: "Brochure", href: localDoc("eds-e-flow-3-brochure.pdf") }] },
          { name: "iLab 901", type: "quality", note: "Multi-parameter analytical sensor", image: img("ilab-901-multitparameter-analytical-sensor-2.gif"), docs: [{ label: "Datasheet", href: localDoc("eds-ilab-901-datasheet.pdf") }] },
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
    icon: "radar",
    tag: "Sewer and wastewater network monitoring",
    summary: "Ultrasonic flow, level and water quality instruments engineered for sewer networks.",
    logo: img("detectronic-logocolour.png"),
    cover: img("lidott-sensor-r-1.png"),
    intro: [
      "Detectronic is a specialist in sewer and wastewater network monitoring and management, focused on measuring, recording, reporting and reacting to wastewater depths and flow rates.",
      "Detectronic designs and manufactures a comprehensive range of advanced ultrasonic flow, level and water quality monitoring instruments, engineered for the accurate monitoring of sewerage networks, wastewater systems and trade effluent.",
      "Its flow meters support early flood detection, inflow and infiltration assessment, combined sewer overflow (CSO) monitoring and the development of intelligent sewer networks, across both short-term investigations and long-term continuous monitoring programs.",
    ],
    blocks: [
      {
        heading: "Across the range",
        lede: "Every instrument here is ATEX and IECEx certified for Zone 0, the most hazardous classification, and built for the sewer.",
        items: [
          ["MSFM S2.5T flow meter", "Velocity 0.03 to 4.00 m/s and depth to 3.5 m, logging every 1 to 60 minutes. More than 15 weeks on one battery at 2 minute logging. Can pulse a sampler for flow proportional sampling."],
          ["LIDoTT Sensor", "Ultrasonic level to 1.5 m, accurate to ± 2 mm, switching automatically to pressure, to 10 m, when the chamber surcharges."],
          ["LIDoTT R", "Radar level to 7 m, accurate to ± 5 mm, with pressure to 10 m: up to 17 m in total with zero deadband."],
          ["LIDoTT Smart logger", "Logs every 2 to 15 minutes and reports every 5 minutes to 24 hours over 4G LTE-M1 or NB-IoT, with a battery life of up to seven years."],
          ["Alarm2", "Radar level from 0 to 20 m with no deadband, with high and low, rate of change and profile alarms, and a typical battery life of five years or more."],
          ["LIDoTT Alarm", "Sensor, battery, modem and aerial in one device, measuring to 8.4 m with three alarm states."],
        ],
      },
    ],
    groups: [
      {
        name: "Flow, level and logging",
        items: [
          { name: "MSFM", type: "flow", note: "Rugged 4G area velocity flow meter", image: img("s2.5-04-small-766x1024.png"), docs: [{ label: "S2.5T datasheet", href: localDoc("detectronic-msfm-s2-5t-datasheet.pdf") }] },
          { name: "LIDoTT Smart", type: "level", note: "Long life, rugged 4G patented level monitor", image: img("dete01-01.24-600x452.png"), docs: [{ label: "LIDoTT Sensor datasheet", href: localDoc("detectronic-lidott-sensor-datasheet.pdf") }] },
          { name: "LIDoTT Alarm", type: "level", note: "Self contained level measurement and alarm device", image: img("lidott-alarm-3.png"), href: "products/lidott-alarm.html", docs: [{ label: "Datasheet", href: localDoc("detectronic-lidott-alarm-datasheet.pdf") }] },
          { name: "Alarm2", type: "level", note: "All-in-one radar level monitor with alarms, up to 20 m, LoRaWAN or cellular", image: img("detectronic-alarm2.png"), href: "products/alarm2.html", docs: [{ label: "Datasheet", href: localDoc("detectronic-alarm2-datasheet.pdf") }, { label: "4G manual", href: localDoc("detectronic-alarm2-4g-manual.pdf") }] },
          { name: "LIDoTT R", type: "level", note: "High-precision radar and pressure sensor for continuous monitoring", image: img("lidott-sensor-r-1.png"), docs: [{ label: "Datasheet", href: localDoc("detectronic-lidott-r-datasheet.pdf") }] },
          { name: "Multi Channel Data Loggers", type: "logger", note: "Rugged remote multichannel loggers", image: img("new-2-channel-logger-1001x1024.jpg") },
        ],
      },
    ],
  },
  {
    slug: "ori",
    name: "ORI",
    title: "ORI Samplers",
    icon: "flask-conical",
    tag: "ATEX and IECEx certified sampling",
    summary: "Rugged mobile and stationary samplers from the world's leading maker of certified sampling systems.",
    logo: img("ori-logo.png"),
    intro: [
      "EDS is proud to offer the trusted ORI product range across Australia, in an established partnership that continues to deliver exceptional results in the field. Together, EDS and ORI provide some of the most rugged, reliable and high-performance equipment available.",
      "For over 60 years, ORI has been a global leader in manufacturing sampling, measuring and laboratory equipment. A 100% family-owned company, ORI is recognised as the world's leading manufacturer of ATEX and IECEx certified sampling systems.",
      "ORI samplers come with one of two controls: BASIC, for simple programs, or NeMo, which adds logging, telemetry and control.",
    ],
    blocks: [
      {
        heading: "Choosing an ORI sampler",
        items: [
          ["NEMO 1 M", "Approved under ATEX and IECEx for Zones 1 and 2. Up to 10 digital and 2 analogue sensors such as pH, conductivity, oxygen and level, 8 GB of memory and an optional LTE modem. Peristaltic (PP), vacuum (V) and hybrid (H) pumps."],
          ["AquaSamp Mini", "Spot and timed sampling with 6 m suction lift and up to 144 samples per charge, at 4.1 kg with its battery. IP65, with an ATEX version available."],
          ["PumpModul", "Event triggered: started by a contact such as a push-button, an RS485 command or an ORI Mlog logger. ATEX approved for Zone 1, or as a standard version."],
          ["BASIC mobil", "Battery powered mobile samplers for hazardous Zones 1 and 2, with a version that actively cools 35 litres of sample."],
        ],
      },
    ],
    groups: [
      {
        name: "Mobile samplers",
        items: [
          { name: "Aqua Mini", type: "sampling", note: "Portable sampler, up to 144 samples per charge", image: img("aquasamp-mini-teaser.png"), docs: [{ label: "Brochure", href: localDoc("ori-aquasamp-mini-brochure.pdf") }, { label: "PumpModul datasheet", href: localDoc("ori-pumpmodul-datasheet.pdf") }] },
          // One datasheet covers all three NEMO 1 M versions.
          { name: "NEMO 1 MH", type: "sampling", note: "ATEX Zone 1 mobile sampler, hybrid pump", image: img("nemo-1-mh.png"), docs: [{ label: "Datasheet", href: localDoc("ori-nemo-1-m-datasheet.pdf") }] },
          { name: "NEMO 1 M PP", type: "sampling", note: "ATEX Zone 1 mobile sampler, peristaltic pump", image: img("csm-nemo1-m-pp-6a7052503d.png"), docs: [{ label: "Datasheet", href: localDoc("ori-nemo-1-m-datasheet.pdf") }] },
          { name: "NEMO 1 M V", type: "sampling", note: "ATEX Zone 1 mobile sampler, vacuum pump", image: img("csm-nemo1-m-vac-6a5f2d98ac.png"), docs: [{ label: "Datasheet", href: localDoc("ori-nemo-1-m-datasheet.pdf") }] },
          { name: "Basic Mobil", type: "sampling", note: "Battery powered sampler for hazardous zones", image: img("basic-mobil.png") },
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
    docs: [{ label: "ORI water analytics catalogue", href: localDoc("ori-water-analytics-catalogue.pdf") }],
  },
  {
    slug: "hach-flow",
    name: "Hach Flow",
    title: "Hach Flow",
    icon: "gauge",
    tag: "Open channel flow measurement",
    summary: "Loggers and sensors from Hach, including the Sigma and Marsh-McBirney legacy lines.",
    intro: [
      "Hach Flow, including its legacy brands Sigma and Marsh-McBirney, has a proven track record of industry-leading innovation and product accuracy in open channel flow measurement.",
      "With true and timely flow data, you reduce risk and make critical wastewater flow decisions with confidence, managing your flow proactively rather than reacting to problems.",
      "Hach meters are the link between collecting superior flow data and conveying it to you conveniently and reliably, with options for stationary, portable, permanent or temporary use. The sensor range runs from non-contact sensors that stay above the flow to limit fouling, to rugged submerged AV sensors.",
    ],
    blocks: [
      {
        heading: "Choosing a Hach system",
        lede: "Following Hach's own selection guide. Our team can help you match the system to the site.",
        items: [
          ["Non-contact", "A flow logger with the Flo-Dar sensor: radar velocity and ultrasonic level from above the flow. Hach's most universal option, it limits fouling and avoids confined space entry after installation."],
          ["Submerged area velocity", "Doppler velocity and pressure level from a sensor in the flow, for a wide range of conditions. The Flo-Tote 3 suits very clean water and low velocities or levels."],
          ["Ultrasonic level", "Down-looking sensors for flumes and weirs, and an in-pipe sensor that removes the ultrasonic deadband in near full pipes."],
          ["Redundant level", "A submerged AV sensor with an in-pipe ultrasonic sensor, for billing and overflow monitoring."],
          ["Permanent power", "The Flo-Station with Flo-Dar, with four 4–20 mA outputs to SCADA, or a Sigma 950 with a submerged AV sensor."],
          ["Process control and spot checks", "The SC200 controller with one or two ultrasonic sensors and a weir and flume library, and the FH950 handheld meter for spot checks and stream gauging."],
        ],
      },
    ],
    groups: [
      {
        name: "Loggers",
        items: [
          { name: "FL1500 Logger", type: "flow", image: img("landing-fl1500-2.jpg"), docs: [{ label: "FSDATA Desktop 32-bit", href: localDoc("hach-flow-fsdata-desktop-32bit.zip") }, { label: "FSDATA Desktop 64-bit", href: localDoc("hach-flow-fsdata-desktop-64bit.zip") }] },
          { name: "FH950 Velocity Meter", type: "flow", note: "Handheld meter for spot checks and stream gauging", image: img("landing-fh950.jpg") },
          { name: "FL900 Portable", type: "flow", note: "Flow logger at the core of most Hach systems", image: img("landing-fl900-2.jpg") },
          { name: "SC200 Controller", type: "flow", note: "Controller for ultrasonic level and process control", image: img("landing-sc200.jpg") },
          { name: "Flo-Station", type: "flow", note: "Mains powered flow monitor for Flo-Dar", image: img("landing-flo-station.jpg") },
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
    icon: "thermometer",
    tag: "Temperature data logging",
    summary: "Temperature loggers, thermistor strings and cloud data, proven in the extremes of Alaska.",
    logo: img("logo-dark.png"),
    intro: [
      "EDS is proud to represent Beadedstream, a leader in temperature data logging and monitoring. The partnership lets us offer loggers, sensors and data monitoring systems designed to measure air, soil and water temperatures in the most challenging environments.",
      "Beadedstream's products are renowned for their reliability, having been tested and proven in the extreme conditions of Alaska. They provide accurate, dependable temperature data for scientific research, industrial process monitoring and remote locations.",
      "In sewers, EDS lays Beadedstream temperature cables alongside open channel flow meters to locate where groundwater is getting in.",
    ],
    blocks: [
      {
        heading: "The range at a glance",
        items: [
          ["Digital Temperature Cable", "Made to length, up to 750 m with up to 125 sensors, accurate to ± 0.1 °C between −10 and 30 °C. IP68, rated to 3.5 MPa fluid pressure."],
          ["D605 logger", "Two-way Iridium satellite with pole-to-pole coverage, four cable ports for up to 500 sensors, and more than six months on its battery without sun when reporting daily."],
          ["MLink", "Moulded in line with the cable at the factory, it converts temperature readings to Modbus or JSON over RS-485 for other loggers and SCADA."],
          ["Spot Logger", "A battery powered logger with a D-size lithium battery the owner can replace, and status checked by swiping a magnet."],
        ],
      },
    ],
    groups: [
      {
        name: "Product range",
        items: [
          { name: "D605", type: "temperature", note: "Satellite logger for temperature cables", image: img("front-view-of-beadedstream-d605-temperature-data-logger-without-antenna.png"), docs: [{ label: "Datasheet", href: localDoc("beadedstream-d605-datasheet.pdf") }] },
          { name: "Spot Logger", type: "temperature", note: "Battery powered temperature logger", image: img("spot-logger-side-view-with-raymo-connector.png"), docs: [{ label: "Battery install and replacement guide", href: localDoc("beadedstream-spot-logger-battery-guide.pdf") }] },
          { name: "Thermistor String", type: "temperature", note: "Up to 125 sensors on one cable", image: img("standard-dtc-bar-code-144-1.jpg"), docs: [{ label: "Digital Temperature Cable spec sheet", href: localDoc("beadedstream-digital-temperature-cable-spec-sheet.pdf") }, { label: "EDS white paper", href: localDoc("eds-white-paper-thermistor-strings.pdf") }] },
          { name: "Mlink", type: "software", note: "Temperature cables to Modbus or JSON", image: img("beadedstream-mlink-temperature-data-logger-connector.png"), docs: [{ label: "Spec sheet", href: localDoc("beadedstream-mlink-spec-sheet.pdf") }] },
          { name: "Capture Mobile App", type: "software", note: "Connectivity", image: img("beadedstream-capture-ios-app-1.png") },
          { name: "Beadedcloud Data", type: "software", note: "Connectivity", image: img("beadedcloud-dashboard-in-all-devices-1.png") },
        ],
      },
    ],
  },
  {
    slug: "microlevel",
    name: "MicroLevel",
    title: "MicroLevel Samplers",
    icon: "test-tubes",
    tag: "Composite samplers",
    summary: "Portable, permanent and refrigerated composite samplers for wastewater and process liquids.",
    intro: [
      "The MicroLevel MICROSAMPLER range takes composite samples from wastewater, factory drains and manholes, water channels and any liquid that needs to be examined.",
      "The range covers three configurations: the portable 10P, the fixed 10B for industrial wastewater, manholes, streams and channels, and the stationary, refrigerated 10R for samples that must be kept cool until collection.",
      "EDS supplies MicroLevel samplers alongside the ORI range, and can advise on the configuration that suits the site and the sampling program.",
    ],
    groups: [
      {
        name: "MICROSAMPLER range",
        items: [
          { name: "MICROSAMPLER 10P", type: "sampling", note: "Portable composite sampler for wastewater, factory drains, manholes and water canals", image: img("6d2b2a76351a2d8f5edefdcc12c5ea49.png") },
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
    icon: "flask-round",
    tag: "Nitrate and nitrite analyser",
    summary: "Real-time nitrate and nitrite measurement with laboratory accuracy in the field.",
    intro: [
      "Aquamonitrix is a revolutionary analyser for measuring nitrate and nitrite in raw, process and effluent water. It delivers real-time measurement with laboratory accuracy in the field, and transmits data instantly to your SCADA or telemetry system and to the dedicated Datamonitrix data management platform.",
      "It delivers lab-quality accuracy and precision over a broad analytic range, with extremely stable calibration and minimal need for intervention over long deployments. The analyser can be up and running within a couple of hours and is easy to operate and service, contributing to low operating and lifetime costs.",
      "Aquamonitrix measures nitrate and nitrite from the same sample. It is portable, and the inbuilt sample system is robust enough to handle wastewater without sample pre-treatment or costly add-on sampling equipment.",
    ],
    blocks: [
      {
        heading: "Performance",
        items: [
          ["Nitrate", "Up to 500 ppm as NO3, with a detection limit of 1.5 ppm as NO3 (0.34 ppm as N)."],
          ["Nitrite", "Up to 100 ppm as NO2, with a detection limit of 0.25 ppm as NO2 (0.08 ppm as N)."],
          ["Method", "Ion chromatography with optical detection, with a measurement as often as every 15 minutes."],
          ["Service interval", "More than 600 sampling runs between services: over three months at six samples a day."],
          ["Integration", "Modbus over RS232 or RS485 to SCADA and telemetry, in an IP65 enclosure weighing 12 kg."],
        ],
      },
    ],
    groups: [
      {
        name: "The analyser",
        items: [
          { name: "Aquamonitrix", type: "quality", note: "Nitrate and nitrite, rugged and portable", image: img("picture-1.png"), docs: [{ label: "Performance datasheet", href: localDoc("aquamonitrix-performance-datasheet.pdf") }] },
        ],
      },
    ],
  },
  {
    slug: "dynaflox",
    name: "Dynaflox",
    title: "Dynaflox",
    icon: "audio-waveform",
    tag: "Ultrasonic water and flow meters",
    summary: "Ultrasonic water meters and flow meters to ISO and AWWA standards.",
    intro: [
      "Dynaflox (formerly Dynameters) was established in 1998 and is a leading manufacturer of ultrasonic water meters and flow meters for wide ranging applications.",
      "All Dynaflox products meet world standards of quality and performance, including ISO and AWWA standards. Its system is certified to ISO 9001:2008 and ISO 14001, and its products hold the CE mark. Every system is individually tested and inspected.",
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
          { name: "Flow Meter", type: "flow", note: "Clamp-on", image: img("i-doppler-clamp.jpg") },
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

export const lidott = {
  title: "LIDoTT Alarm",
  maker: "Detectronic",
  lede: "Self contained water level measurement and alarm device.",
  image: img("lidott-alarm-3.png"),
  image2: img("lidott-alarm-interior-drawing-web.jpg"),
  datasheet: localDoc("detectronic-lidott-alarm-datasheet.pdf"),
  highlights: [
    ["radar", "Radar sensor", "5° beam angle"],
    ["ruler", "Range", "Measures up to 8.4 m"],
    ["package", "All in one", "Sensor, battery, modem and aerial"],
    ["shield-check", "Zone 0", "ATEX and IECEx certified"],
    ["bell", "3 alarm states", "Configured on site"],
    ["battery-full", "Long life", "Battery up to 7 years"],
  ],
  description: [
    "LIDoTT ALARM is a level measurement and alarm device which integrates the level sensor, battery, modem and Detectronic's unique Neptune antenna into one compact device. It alerts users to changes in wastewater depth, enabling utilities to react quickly to blockages and to surcharges caused by sewer collapses.",
  ],
  sections: [
    ["Continuous measurement and alarm delivery", "Alarm threshold set-points are configured on site during installation, and a \"return to normal\" message is sent when levels fall back below the threshold. Level sampling can be set to 5 or 15 minutes, and a daily heartbeat message verifies the sensor is operational. Logging at 15 minute intervals is available as an option."],
    ["Designed for convenience", "LIDoTT ALARM is simple to install and zero maintenance by design. The enclosure is moulded from a resilient, naturally self-cleaning polymer and is submersible."],
    ["Widespread deployment", "Ideal for deployment throughout sewer networks and in domestic or lateral sewers, and suitable for other water courses. It offers up to three configurable level states, for example normal, high and high-high (green, amber, red), and keeps reporting status as levels return to normal."],
    ["Easy to mount", "The LIDoTT laser pointer is clipped onto the fixing pole during installation to identify the measurement target. Once marked, the LIDoTT ALARM replaces the pointer and locks into place. The assembly is easily removed and replaced in exactly the same position."],
    ["Data communications", "Communicates using NB-IoT / Cat M1 with 2G fallback. Each breached threshold triggers an alarm message with the current level, both going high and returning to normal. Alarms are delivered via Detectronic Cloud by SMS, email and website, with GIS options and optional weather-managed alarm filtering."],
  ],
  specs: [
    ["Sensor type", "Pulsed coherent microwave radar (PCR)"],
    ["Range", "Up to 8.4 m"],
    ["Accuracy", "± 5 mm"],
    ["Operating temperature", "-20°C to +70°C"],
    ["Protection", "IP68 / NEMA 6P"],
    ["Dimensions", "92 mm (w) × 196 mm (h) × 122 mm (d)"],
    ["Communications", "Internal hi-gain NB-IoT / Cat M / 2G antenna"],
    ["Approvals", "ATEX Zone 0, IECEx Zone 0"],
  ],
};

export const alarm2 = {
  title: "Alarm2",
  maker: "Detectronic",
  lede: "All-in-one radar level monitor with alarms, up to 20 m, LoRaWAN or cellular.",
  image: img("detectronic-alarm2.png"),
  datasheet: localDoc("detectronic-alarm2-datasheet.pdf"),
  manual: localDoc("detectronic-alarm2-4g-manual.pdf"),
  highlights: [
    ["radar", "Radar sensor", "No deadband"],
    ["ruler", "Range", "Measures up to 20 m"],
    ["package", "All in one", "Sensor, battery, modem and antenna"],
    ["bell-ring", "Multiple alarms", "High, low, and rate of change"],
    ["wifi", "Connectivity", "LoRaWAN or 4G cellular"],
    ["battery-full", "Long life", "Battery over 5 years"],
  ],
  description: [
    "Alarm2 is a complete level measurement and alarm device for remote deployment. The integrated radar sensor, battery, modem and antenna fit into one compact enclosure, measuring levels up to 20 m with no deadband and ± 5 mm accuracy at range. Alarms are triggered immediately when thresholds are breached, with hourly status updates to confirm operation.",
  ],
  sections: [
    ["Precise measurement across range", "Radar measurement from 0 to 20 m with no blind spot ensures consistent accuracy across changing conditions. Accuracy of ± 5 mm at 20 m guarantees reliable threshold detection and alarm delivery."],
    ["Flexible alarm configuration", "High and low set-points, rate of change detection, and profile alarms are all configurable during installation. Alarms are sent immediately on threshold breach and hourly while the alarm condition persists."],
    ["Robust deployment", "Fully integrated into a durable enclosure rated for outdoor and underground environments. LoRaWAN and 4G cellular connectivity options suit different network availability, with fallback to alternative modes."],
    ["Real-time monitoring", "Status messages and data are sent immediately on detection, with hourly heartbeat messages to confirm operational status. Integration with Detectronic Cloud enables email, SMS and web-based alerting."],
    ["Low maintenance", "Self-contained design requires no external sensors or wiring. Battery life over five years minimises site visits for maintenance."],
  ],
  specs: [
    ["Sensor type", "Radar (4G LTE Cat-1)"],
    ["Range", "0 to 20 m"],
    ["Accuracy", "± 5 mm at 20 m"],
    ["Deadband", "None"],
    ["Operating temperature", "-20°C to +70°C"],
    ["Protection", "IP65 / NEMA 4X"],
    ["Communications", "LoRaWAN or 4G LTE Cat-1"],
    ["Battery", "Over 5 years typical"],
  ],
};

/* ------------------------------------------------------------------ */
/* EDS instruments with a page of their own                            */
/* ------------------------------------------------------------------ */
// Each is built at products/<slug>.html. `name` matches the product card in
// the EDS range, which links here. `specs` is [[group, [[label, value]]]],
// and `worksWith` is [[href, title, line]].
export const productPages = [
  {
    slug: "e-flow-3",
    name: "E-Flow 3",
    icon: "radar",
    tag: "Dual mode sewer flowmeter",
    title: "E-Flow 3 dual mode sewer flowmeter | EDS",
    lede: "Contactless radar measures velocity and depth in normal flow. When the sewer surcharges, ultrasonic and sealed pressure sensors take over, with no gap in the record.",
    description: "EDS E-Flow 3: a four sensor area velocity flowmeter for sewer maintenance holes. Dual radar in normal flow, dual 1 MHz ultrasonic and sealed pressure in surcharge, RS485 Modbus RTU.",
    image: img("e-flow-3.png"),
    figure: { src: img("e-flow-3-installation.jpg"), alt: "Cutaway of a sewer with E-Flow 3 mounted at the pipe obvert and cabled to a data logger near the top of the maintenance hole", caption: "E-Flow 3 at the pipe obvert, cabled to a logger in the shaft" },
    docs: [
      { label: "Datasheet", note: "Principle of operation, full specifications, installation and wiring.", href: localDoc("eds-e-flow-3-datasheet.pdf") },
      { label: "Brochure", note: "How E-Flow 3 measures, and where it fits.", href: localDoc("eds-e-flow-3-brochure.pdf") },
    ],
    highlights: [
      ["radar", "Dual radar", "24 GHz velocity and 120 GHz depth, from above the flow"],
      ["waves", "Surcharge ready", "Dual 1 MHz ultrasonic and sealed 316 stainless pressure"],
      ["arrow-left-right", "Seamless changeover", "No blind zone and no gap in the record"],
      ["gauge", "0.05 to 20 m/s", "Velocity range, with depth from 0 to 10 m"],
      ["shield-check", "Fully potted", "Corrosion, impact and water resistant housing"],
      ["cable", "RS485 Modbus RTU", "8 to 15 VDC, 150 mA at 12 VDC"],
    ],
    intro: [
      "E-Flow 3 is an area velocity flowmeter built for harsh, demanding sewer environments. Four sensors share one body at the pipe obvert. In normal flow a pair of contactless radars measures velocity and depth from above the water, so there is nothing in the flow for grease, rag and silt to foul.",
      "When the sewer surcharges and the free surface is lost, a dual 1 MHz ultrasonic Doppler velocity sensor and a sealed 316 stainless steel pressure transducer take over seamlessly. One sensor body, one record, from dry weather flow through to full surcharge.",
      "Peak wet weather flow, overflow volumes and surcharge duration drive inflow and infiltration programs, capacity assessments and regulatory reporting. They are also exactly when a conventional wetted sensor is most likely to be fouled. E-Flow 3 keeps measuring through the whole event.",
    ],
    features: [
      ["Normal flow: dual radar", "A 24 GHz Doppler radar reads surface velocity, corrected to mean channel velocity, and a 120 GHz FMCW radar reads depth. Neither touches the flow."],
      ["Surcharge: ultrasonic and pressure", "Dual 1 MHz ultrasonic Doppler transducers measure velocity through the water column, and the sealed pressure transducer reads depth to 10 m, compensated for dynamic pressure."],
      ["Seamless changeover", "The sensor checks all four elements every cycle and picks the right pair as the pipe fills and drains. The other pair stays available and cross checked, so there is no blind zone."],
      ["Obvert mounting sheds debris", "Fixed to the pipe crown on an EDS bracket, out of the flow path, so material cannot build up on the sensor face. Site visits become verification, not cleaning."],
      ["No confined space entry", "Installed and retrieved from the maintenance hole opening, then commissioned and verified from the surface with EMS-Flow through the EDS logger."],
      ["Diagnostics you can trust", "Composite velocity, depth and flow come with each sensor's own value and status over Modbus, so you can see which pair is active, and why, from the office."],
    ],
    specs: [
      ["Velocity", [
        ["Method", "Contactless 24 GHz radar in normal flow, dual 1 MHz contact ultrasonic in surcharge"],
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
        ["Interface", "RS485, two wire"],
        ["Protocol", "Modbus RTU slave, register map supplied"],
        ["Response time", "10 s, with configurable damping"],
        ["Firmware", "Remote update over RS485 with an EDS logger"],
        ["Configuration", "EMS-Flow, from the surface through an EDS logger"],
      ]],
      ["Mechanical and environmental", [
        ["Housing", "Alloy and engineering plastic composite"],
        ["Sealing", "Electronics fully potted, unaffected by temperature cycling"],
        ["Cable", "Integral, length to suit the maintenance hole"],
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
    specNote: "Accuracy is stated under reference conditions. Radar velocity needs a free surface with enough texture to return a signal; below 0.2 m/s the sensor prefers ultrasonic velocity where it is available. Specifications may change without notice.",
    worksWith: [
      ["products/hawk.html", "Hawk 4G logger", "Powers and polls E-Flow 3 over RS485 and reports over 4G."],
      ["flowsense.html", "EDS FlowSense", "Hydrographs, surcharge and reverse flow alarms, and export to hydraulic models."],
    ],
    cta: { title: "Put E-Flow 3 in your network.", lede: "Tell us the pipe size, the depth and what you need from the data. We will size the bracket and cable, recommend the logger and telemetry, and can install and commission for you." },
  },
  {
    slug: "hawk",
    name: "Hawk",
    icon: "radio-tower",
    tag: "Battery powered 4G logger",
    title: "Hawk battery powered 4G sewer logger | EDS",
    lede: "The 4G logger built for Australian sewer networks. It lives inside the maintenance hole, with no cabinet to build and no power to bring to site.",
    description: "EDS Hawk: a battery powered 4G LTE data logger for sewer maintenance holes. IP68 submersible, three RS485 sensor ports, logging from every second, internal battery up to 152 Ah.",
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
      "The Hawk installs inside the maintenance hole. It powers and reads your flow, level and quality sensors over RS485, logs as often as every second, stores every reading on board, and reports over 4G LTE to FlowSense and to your own systems.",
      "There is no cabinet to build, no power to bring to site, and no need to enter the chamber to commission or reconfigure it. Nothing is mounted at the surface, so there is nothing to damage, vandalise or maintain in the road reserve.",
      "Hawk connects directly to E-Flow 3 and any other Modbus RTU sensor, and reports to FlowSense: one team for the sensor, logger, telemetry and data.",
    ],
    features: [
      ["Sealed for surcharge", "Canister, lid and connectors are sealed to IP68, so the record continues while the chamber is underwater."],
      ["Built for the sewer atmosphere", "A V0 flame retardant, corrosion resistant ABS canister, sealed connectors and a stainless wall bracket."],
      ["No power at site", "72 to 152 Ah on board, and each sensor is powered only while it is read. No mains, no solar panel, no roadside cabinet."],
      ["Set up from the surface", "A magnet wakes the Hawk and EMS-Flow sets it up over Bluetooth from the road. Configuration and firmware follow over 4G."],
      ["Every reading kept", "32 MB on board holds 10 years of data, so a missed report in patchy coverage does not mean lost data."],
      ["Two destinations at once", "Up to four data centres. Send the same data to FlowSense and to your SCADA or historian, or run them as primary and standby."],
    ],
    specs: [
      ["Telemetry", [
        ["Cellular", "4G LTE"],
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
        ["On board memory", "32 MB, 10 years of data retention"],
        ["Battery", "Internal: 72, 80 or 100 Ah rechargeable, or 152 Ah primary"],
        ["Operating current", "Under 65 mA average at 7.2 VDC"],
        ["Sleep current", "40 µA or less at 7.2 VDC"],
        ["External supply", "None required"],
      ]],
      ["Enclosure and environment", [
        ["Protection", "IP68, submersible"],
        ["Material", "V0 flame retardant, corrosion resistant ABS"],
        ["Lid", "Bolted, O ring sealed; SIM and battery inside"],
        ["Controls", "Magnetic wake point and status indicators; no switches"],
        ["Dimensions", "Ø165 × 243 mm, excluding handle and antenna"],
        ["Mounting", "Stainless wall bracket, expansion bolts"],
        ["Operating temperature", "−40 to 60 °C, 95 % humidity non condensing"],
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
    specNote: "Typical values. Battery life depends on the logging and reporting intervals, the connected sensors and the site temperature, so EDS sizes the battery for each deployment.",
    worksWith: [
      ["products/e-flow-3.html", "E-Flow 3 flowmeter", "Dual mode sewer flowmeter, radar with surcharge backup."],
      ["flowsense.html", "EDS FlowSense", "Hosted data, hydrographs, alarms, quality auditing and export."],
    ],
    cta: { title: "Put a Hawk in the maintenance hole.", lede: "Tell us the network, the sites and the data you need. EDS will size the battery, supply the bracket and sensors, install and commission from the surface, and deliver the data through FlowSense. Also available in EDS rental fleets for temporary flow surveys." },
  },
];

/* ------------------------------------------------------------------ */
/* FlowSense                                                           */
/* ------------------------------------------------------------------ */
export const flowsense = {
  lede: "Monitoring, flow analytics and engineering insight for the sites EDS measures, in one platform.",
  features: [
    ["map", "Your network on one map", "Every monitored site, its status and its alarms, on a live network map with weather overlaid."],
    ["flame", "I/I heat map", "One colour per severity band, every pipe outlined, with animated arrows showing which way the water runs."],
    ["siren", "Blockage Watch", "Watches every monitored line for depth creeping upward while flow does not, and gives crews a shortlist before a choke becomes an overflow."],
    ["bell-ring", "Alarms that reach people", "Name people from your team on an alarm rule and each message reaches the email and mobile they hold that day."],
    ["fan", "Pump Station Manager", "The wet well drawn to scale, with its start, stop, surcharge and overflow levels and the live water level."],
    ["cloud-rain", "Rainfall outlook", "A forecast that states its odds, with overflow risk judged against a pipe capacity the site's own readings support."],
    ["git-compare-arrows", "Compare two sites", "Draw a second site's flow, depth or velocity over the same window, shifted by a travel time."],
    ["drafting-compass", "Calibration scorecards", "Every model calibration scored per storm against published industry acceptance bands."],
    ["plug-zap", "Connects to SCADA", "Five ways to connect SCADA, including a hosted SFTP folder so nothing is exposed at your end."],
    ["calculator", "Shows its working", "A \"How this is calculated\" note beside every derived figure: the method, constants and assumptions in plain language."],
  ],
  standards: {
    heading: "Built to the published standards.",
    lede: "Each method in FlowSense follows a published standard, so results can be checked, compared and defended.",
    items: [
      ["drafting-compass", "CIWEM UDG Code of Practice (2017)", "Per-storm calibration acceptance bands, and dry weather flow as a daily pattern for each type of day."],
      ["droplets", "WEF MOP FD-6 and WPCF MOP No. 36", "Dry weather flow as sanitary flow plus groundwater infiltration, from qualifying dry days only."],
      ["ruler", "WSA 02 Sewerage Code of Australia", "Self-cleansing velocity, level of service checks, and Colebrook-White friction for each pipe."],
      ["cloud-rain", "AR&R 2019 and AS/NZS 3500.3", "Areal reduction factors, design rainfall temporal patterns, and the Rational Method for ungauged subcatchments."],
      ["list-checks", "QARTOD", "The quality control tests and flag vocabulary used to score each record before it is trusted."],
      ["git-branch", "EPA SWMM", "Dynamic wave routing, and the three-component RTK method for rainfall-derived infiltration and inflow."],
    ],
    note: "FlowSense is built to these standards and tested against them on every release. EDS does not describe the software as certified, accredited or endorsed by the bodies that publish them.",
  },
  faq: [
    ["Who owns the data?", "You do. Data exports in open formats with no export fee, and if you cancel at renewal, your data exports with you in full."],
    ["Do we need to install anything?", "No. FlowSense runs in the browser on desktop, tablet and phone. Connecting your SCADA needs no agent, connector or gateway on your systems, and FlowSense has no control path into them."],
    ["Does it only work with EDS instruments?", "No. FlowSense is vendor independent. Alongside the instruments EDS installs, it can collect from your own loggers, or take data from your SCADA by HTTPS, MQTT, API, SFTP or FTPS."],
    ["Where is the data hosted, and how is it secured?", "In Australia, in DigitalOcean's Sydney region. Sign-in supports two-factor codes, access is set per person down to individual sites and channels, and every sign-in, view, change and export is recorded in an audit trail."],
    ["Can the data go back into our SCADA or historian?", "Yes. As scheduled CSV files over SFTP or FTPS, as MQTT messages to your broker, through a read-only API, and as signed webhooks when an alarm, an overflow or a forecast risk is recorded."],
    ["How many people can use it?", "Unlimited users, with role based access and administration that can be delegated to your own team."],
    ["How do we get started?", "Send us the flow history you already hold and EDS will set up a 90 day trial of the whole platform on it. Or ask for a walkthrough using your own sites."],
  ],
  docs: [
    { label: "Platform brochure", note: "The whole platform in sixteen pages: the screens, the standards it follows and the pricing.", href: localDoc("eds-flowsense-brochure.pdf") },
    { label: "Features and benefits", note: "What FlowSense does to monitor, analyse and plan a sewer network.", href: localDoc("eds-flowsense-features-and-benefits.pdf") },
    { label: "Sending data to your SCADA", note: "For engineering, control systems and IT teams.", href: localDoc("eds-flowsense-data-to-scada.pdf") },
  ],
};

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */
export const about = {
  intro: [
    "Environmental Data Services (EDS) is an Australian owned and operated company that has been a market leader in providing equipment and services to the water and wastewater industry since 1991.",
    "EDS delivers cutting-edge equipment and specialised services to the water and wastewater industry, as well as the mining, manufacturing, power and processing sectors. Our team comprises scientists, engineers and technicians who excel in all facets of environmental monitoring and project delivery.",
    "Our purpose is straightforward: to empower you with the freedom to take control of your assets and projects. We are driven by a pursuit of discovery and innovation, developing technologies and delivering services that open the door to a world of possibilities.",
  ],
  mission: [
    "EDS is committed to delivering the highest level of equipment and services, with a core focus on achieving successful client outcomes. The company's mission is rooted in innovation, sustainability and a relentless pursuit of discovery and technological advancement.",
    "EDS empowers businesses and organisations with state-of-the-art tools and insights for making informed environmental decisions, contributing to a more sustainable future.",
  ],
  timeline: [
    ["Early 1970s", "Elite Electronics", "Graham Harper begins building businesses in electronics."],
    ["Early 1980s", "Elpro", "Graham starts Elpro, now one of the world's largest SCADA suppliers."],
    ["1991", "EDS is founded", "Graham and Cynthia Harper establish EDS in Queensland, alongside the release of its flagship product, the Pump Station Manager (PSM)."],
    ["1990s", "Bureau of Meteorology loggers", "Graham develops the EDS data logger for the Bureau of Meteorology, still in use today, then moves into flow with the Marsh-McBirney range, now Hach."],
    ["2001–02", "Amberley Fire Training Facility", "EDS builds the facility under Graham's leadership."],
    ["2003", "Defence facility contract", "EDS begins servicing and monitoring the Australian Defence facility, under a contract still in place."],
    ["2005", "A founder's legacy", "Graham sadly passes. Under Cynthia's stewardship, EDS continues to thrive and grow."],
    ["2022–23", "Goulburn Valley Water, Kilmore", "EDS provided sewer flow monitoring at 10 sites in Kilmore, supporting Goulburn Valley Water's infrastructure management and planning."],
    ["2023", "Sydney Water panel provider", "EDS was awarded a five year panel provider contract to supply sewer flow and level instrumentation to Sydney Water."],
    ["2023", "North East Water", "EDS ran sewer and rainfall monitoring across 15 sites over eight weeks, giving North East Water high resolution data for infrastructure planning and management."],
    ["2023", "Townsville City Council, Wulguru & Pallarenda", "EDS installed and operated sewer monitoring equipment at 34 sites over 12 weeks to inform the council's infrastructure planning and management."],
    ["2023–24", "Yarra Valley Water gauge calibrations", "EDS calibrated long term sewer flow gauges across multiple Yarra Valley Water sites, so the data stays reliable for hydraulic modelling and infrastructure planning."],
    ["2023–24", "Cairns Regional Council monitoring stations", "EDS installed and maintains long term sewer monitoring stations, giving the council continuous sewer flow and water quality data to improve wastewater management and environmental sustainability."],
    ["2024", "Wingecarribee Shire Council", "EDS installed 15 short term sewer flow gauges across the Mittagong and Robertson catchments."],
    ["2026", "Transurban service provider", "EDS was awarded a service provider contract with Transurban to service and maintain key tunnel infrastructure."],
    ["Today", "Australia's largest supplier", "EDS has grown to be Australia's largest supplier of equipment for the water and wastewater industry, and was awarded the largest sewer monitoring project in Australia in recent years."],
  ],
  approach: {
    heading: "Instruments, crews and data, from one team.",
    lede: "EDS makes instruments, represents leading manufacturers, installs and maintains them with its own crews, and delivers the data. One team answers for the whole chain.",
    items: [
      ["cpu", "Manufacturer and representative", "EDS designs and builds its own loggers and sensors, and represents leading manufacturers including Detectronic, ORI, Hach and Beadedstream."],
      ["hard-hat", "Our own field crews", "Installation engineers trained in installation, maintenance and calibration, working from four offices across Australia."],
      ["shield-check", "Certified for hazardous areas", "Intrinsically safe equipment certified under ATEX and IECEx, including Zone 0 instruments for sewer environments."],
      ["badge-check", "Data you can defend", "ISO compliant data validation, with continuous QA/QC and calibration checks throughout every program."],
      ["waves", "One platform", "Readings arrive in EDS FlowSense, built and supported in Australia, or go straight to your own SCADA and systems."],
      ["key-round", "Your data, always", "Full access to the data we collect, in open formats, through FlowSense or by API."],
    ],
  },
  founder: { name: "Cynthia Harper", role: "Co-founder, Environmental Data Services", text: "EDS continues to strive to deliver the level of service and professionalism that was part of Graham's founding ethos." },
  quote: { text: "EDS helped us design and implement a user friendly and rugged sewer monitoring program that was completely remote. The level of service and professionalism received by EDS is always leading the industry.", who: "Tony Cockrel", org: "DERM" },
};

/* ------------------------------------------------------------------ */
/* Selling points shared across pages                                  */
/* ------------------------------------------------------------------ */
// The three ways to work with EDS, shown on the home, services and products
// pages. `topic` and `mode` pre-fill the enquiry form (see contactHref()).
export const ways = {
  heading: "Buy it, hire it, or let EDS run it.",
  lede: "However your program is funded, the same instruments, crews and data platform sit behind it.",
  items: [
    {
      mode: "buy", icon: "package", title: "Buy", line: "Own the instruments",
      text: "Choose from one of Australia's largest portfolios of monitoring instruments, made by EDS or by the leading manufacturers we represent.",
      points: ["Supply, installation and commissioning", "In situ audits and calibration", "Training for your staff"],
      link: ["products/index.html", "Browse products"], topic: "Product pricing", cta: "Ask about pricing",
    },
    {
      mode: "hire", icon: "calendar-clock", title: "Hire", line: "For a study or a season",
      text: "Short and long term hire from the EDS fleet, built for the harshest and most demanding applications.",
      points: ["Flow meters, samplers and loggers", "Bespoke packages for difficult sites", "Expert advice on the right setup"],
      link: ["services/equipment-rental.html", "Equipment rental"], topic: "Equipment Rental", cta: "Ask about hire",
    },
    {
      mode: "managed", icon: "database-zap", title: "Data as a Service", line: "No capital outlay",
      text: "EDS selects the sites, installs and maintains the equipment, validates the data continuously and delivers insights you can act on.",
      points: ["99.95% data availability", "Continuous QA/QC and calibration", "Real-time alerts in FlowSense"],
      link: ["services/data-as-a-service.html", "How DaaS works"], topic: "Sewer Flow Data as a Service", cta: "Ask about DaaS",
    },
  ],
};

// Outcomes from EDS projects, each told elsewhere on the site (the data
// analysis and works verification pages, the about timeline and the white
// papers). Those marked `home` are shown on the home page, in one row of four;
// each is also shown on the service pages listed in `services`, two at most.
export const results = [
  {
    stat: "$6M", label: "treatment plant expansion avoided", who: "Regional council", home: true,
    text: "Twenty short term flow meters and on-site rain gauges showed three subcatchments carried 65% of the I&I. Capital went into relining and inflow reduction instead, and peak wet weather flows fell 35% within two years.",
    services: ["inflow-infiltration-studies", "sewer-flow-monitoring", "rainfall-monitoring"],
  },
  {
    stat: "34", label: "sites installed and operated in 12 weeks", who: "Townsville City Council", home: true,
    text: "Sewer monitoring across the Wulguru and Pallarenda catchments, to inform the council's infrastructure planning and management.",
    services: ["sewer-flow-monitoring"],
  },
  {
    stat: "24 h", label: "for the network to return to baseline", who: "Coastal network", home: true,
    text: "After a cleaning and relining program, flow profiles recorded by EDS showed the network back to its baseline hydraulic behaviour within a day, confirming the works had restored full capacity.",
    services: ["data-analysis-reporting", "rehabilitation-verification"],
  },
  {
    stat: "15", label: "sites of sewer and rainfall data in eight weeks", who: "North East Water", home: true,
    text: "High resolution sewer flow and rainfall monitoring, giving the utility the data it needed for infrastructure planning and management.",
    services: ["rainfall-monitoring", "sewer-flow-monitoring"],
  },
  {
    stat: "40%", label: "less variation in depth and flow during rain", who: "Metropolitan utility",
    text: "Monitoring after a relining program showed depth and flow varied far less in wet weather, confirming the works had reduced infiltration and that the model's predicted improvement was real.",
    services: ["rehabilitation-verification"],
  },
  {
    stat: "30%", label: "less spent on unnecessary relining", who: "Regional NSW council",
    text: "Inflow severity mapped across catchments from reliable flow data sent CCTV inspections and rehabilitation budgets where they were needed, and compliance targets were reached sooner.",
    services: ["network-assessment", "data-analysis-reporting"],
  },
];

// How a monitoring program runs, on the service pages marked `process: true`.
export const programSteps = [
  ["map", "Scope and site selection", "Agree what the data has to answer, then choose sites by their hydraulics, not their convenience."],
  ["hard-hat", "Install and commission", "Trained EDS crews install intrinsically safe instruments, Australia wide, and check every site before it goes live."],
  ["activity", "Monitor and validate", "Readings arrive over 4G into FlowSense, with continuous QA/QC and alarms when something changes."],
  ["file-chart-column", "Report and recommend", "Validated data and a report that shows where the problems are and what to fix first, or a feed into your model by API."],
];

export const industries = [
  ["droplets", "Water & Wastewater", "Councils, utilities and water authorities."],
  ["trees", "Environment", "Catchments, rivers and compliance monitoring."],
  ["factory", "Industrial", "Mining, manufacturing, power and processing."],
  ["landmark", "Government", "Federal, state and local, including Defence."],
];

export const clients = [
  ["Downer", "client-downer.jpg"],
  ["Ventia", "client-ventia.jpg"],
  ["Bureau of Meteorology", "client-bureau-of-meteorology.jpg"],
  ["Yarra Valley Water", "client-yarra-valley-water.jpg"],
  ["Sydney Water", "client-sydney-water.png"],
  ["Hunter Water", "client-hunter-water.jpg"],
  ["Urban Utilities", "client-urban-utilities.jpeg"],
  ["Aurecon", "client-aurecon.png"],
  ["Stantec", "client-stantec.png"],
  ["Water Corporation", "client-water-corporation.png"],
  ["Hach", "client-hach.jpg"],
  ["Transurban", "client-transurban.jpg"],
  ["GHD", "client-ghd.jpg"],
  ["SMEC", "client-smec.jpg"],
  ["Veolia", "client-veolia.png"],
].map(([name, file]) => ({ name, src: img(file) }));

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */
export const papers = [
  {
    id: "unforeseen-benefits",
    title: "The Unforeseen Benefits of Sewer Inflow & Infiltration Monitoring",
    date: "October 2025",
    text: "How modern sewer flow monitoring programs deliver far more than I/I insights. Drawing on real projects across Australia, it shows accurate flow data helping utilities detect blockages, verify maintenance, identify cross connections, optimise pump operations and target investment.",
    href: localDoc("eds-white-paper-unforeseen-benefits-of-ii-monitoring.pdf"),
  },
  {
    id: "measuring-the-invisible",
    title: "Inflow & Infiltration: Measuring the Invisible Problem",
    date: "July 2025",
    text: "Excess stormwater and groundwater entering sewer systems remains one of the most costly and complex challenges for councils and utilities. With asset pressures rising and budgets under strain, targeting I&I is more critical than ever.",
    href: localDoc("eds-white-paper-measuring-the-invisible-problem.pdf"),
  },
  {
    id: "thermistor-strings",
    title: "Thermistor Strings with Open Channel Sewer Flow Meters to Locate Infiltration",
    date: "White paper",
    text: "How combining thermistor strings with open channel sewer flow meters gives precise detection of infiltration, with continuous real-time monitoring, non-intrusive installation and significant cost savings.",
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
      ["FlowSense platform brochure", localDoc("eds-flowsense-brochure.pdf")],
      ["FlowSense features and benefits", localDoc("eds-flowsense-features-and-benefits.pdf")],
      ["Sending FlowSense data to your SCADA", localDoc("eds-flowsense-data-to-scada.pdf")],
    ],
  },
  // Full width, in two columns.
  {
    group: "Datasheets and guides",
    icon: "file-text",
    wide: true,
    items: [
      ["EDS E-Flow 3 sewer flowmeter datasheet", localDoc("eds-e-flow-3-datasheet.pdf")],
      ["EDS E-Flow 3 sewer flowmeter brochure", localDoc("eds-e-flow-3-brochure.pdf")],
      ["EDS Hawk 4G logger datasheet", localDoc("eds-hawk-datasheet.pdf")],
      ["EDS Hawk 4G logger brochure", localDoc("eds-hawk-brochure.pdf")],
      ["iLab 901 multi-parameter sensor datasheet", localDoc("eds-ilab-901-datasheet.pdf")],
      ["Detectronic MSFM S2.5T flow meter datasheet", localDoc("detectronic-msfm-s2-5t-datasheet.pdf")],
      ["Detectronic LIDoTT Sensor datasheet", localDoc("detectronic-lidott-sensor-datasheet.pdf")],
      ["Detectronic LIDoTT Alarm datasheet", localDoc("detectronic-lidott-alarm-datasheet.pdf")],
      ["Detectronic Alarm2 radar level monitor datasheet", localDoc("detectronic-alarm2-datasheet.pdf")],
      ["Detectronic Alarm2 4G LTE Cat 1 manual", localDoc("detectronic-alarm2-4g-manual.pdf")],
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
export const city = [
  {
    id: "sewer",
    name: "Sewer network",
    icon: "waves",
    blurb: "Under every street, flow and depth are measured at the manhole and sent in over 4G.",
    services: ["s:sewer-flow-monitoring", "s:inflow-infiltration-studies", "s:blockage-overflow-alarms", "s:sewer-model-calibration"],
    products: [["Detectronic MSFM flow meter", "p:detectronic"], ["LIDoTT Alarm", "lidott"], ["Hach Flo-Dar", "p:hach-flow"]],
  },
  {
    id: "pump",
    name: "Pump station",
    icon: "fan",
    blurb: "Wet well levels, pump runs and alarms, watched around the clock.",
    services: ["s:pump-station-monitoring", "s:real-time-monitoring", "s:scada-telemetry-integration", "s:network-assessment"],
    products: [["EDS Pump Station Manager", "p:eds"], ["EMS data loggers", "p:eds"], ["LIDoTT R level sensor", "p:detectronic"]],
  },
  {
    id: "plant",
    name: "Treatment plant",
    icon: "flask-conical",
    blurb: "Flow, quality and sampling through every stage of treatment.",
    services: ["s:water-quality-monitoring", "o:wastewater-monitoring", "s:closed-channel-flow", "s:auditing-calibration"],
    products: [["Aquamonitrix nitrate analyser", "p:aquamonitrix"], ["ORI samplers", "p:ori"], ["Dynaflox ultrasonic meters", "p:dynaflox"]],
  },
  {
    id: "industry",
    name: "Industrial estate",
    icon: "factory",
    blurb: "Discharge measured and sampled, so trade waste stays compliant.",
    services: ["s:trade-waste", "s:sampling-programs", "s:equipment-rental", "s:auditing-calibration"],
    products: [["ORI ATEX samplers", "p:ori"], ["MicroLevel MICROSAMPLER", "p:microlevel"], ["Dynaflox flow meters", "p:dynaflox"]],
  },
  {
    id: "river",
    name: "River & catchment",
    icon: "trees",
    blurb: "Water quality, rainfall and temperature, from baseline to compliance.",
    services: ["o:environmental-monitoring", "s:water-quality-monitoring", "s:rainfall-monitoring", "o:network-thermal-monitoring"],
    products: [["iLab multi-parameter sonde", "p:eds"], ["Beadedstream thermistor strings", "p:beadedstream"], ["EDS pH, EC and turbidity sensors", "p:eds"]],
  },
  {
    id: "cbd",
    name: "City & facilities",
    icon: "building-2",
    blurb: "Buildings and structures scored 24/7 and managed as one service.",
    services: ["s:facility-management", "o:structure-performance", "o:asset-network-assessment"],
    products: [["EDS Asset Score (EAS)", "o:structure-performance"], ["EPM-2 pressure logger", "p:eds"], ["Metalog 4G logger", "p:eds"]],
  },
  {
    id: "ops",
    name: "Operations centre",
    icon: "monitor-dot",
    blurb: "Every reading arrives in one place: EDS FlowSense.",
    services: ["flowsense", "s:data-analysis-reporting", "s:real-time-monitoring", "s:data-as-a-service"],
    products: [["EDS FlowSense platform", "flowsense"], ["SCADA connection", "flowsense"], ["Alarms by SMS and email", "flowsense"]],
  },
];

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
  "contact-2": "contact.html",
  "contact-eds": "contact.html",
  enquire: "contact.html",
  "eds-privacy-statement": "privacy.html",
  downloads: "resources.html",
  "download-and-support": "resources.html",
  publications: "resources.html",
  "wind-and": "resources.html",
  "services-eds": "services/index.html",
  "applications-eds": "solutions/index.html",
  // Services
  "sewer-network-monitoring": "services/sewer-flow-monitoring.html",
  "flow-monitoring": "services/sewer-flow-monitoring.html",
  "auditing-and-calibration": "services/auditing-calibration.html",
  "closed-channel-flow-monitoring": "services/closed-channel-flow.html",
  "eds-daas-data-as-a-service": "services/data-as-a-service.html",
  "equipment-rental": "services/equipment-rental.html",
  "facility-management": "services/facility-management.html",
  "facility-management-1": "services/facility-management.html",
  "inflow-infiltration-studies": "services/inflow-infiltration-studies.html",
  "network-assessment-and-evaluations": "services/network-assessment.html",
  "real-time-monitoring": "services/real-time-monitoring.html",
  "sewer-network-model-calibrations": "services/sewer-model-calibration.html",
  "trade-waste": "services/trade-waste.html",
  "trade-waste-2": "services/trade-waste.html",
  "rainfall-monitoring": "services/rainfall-monitoring.html",
  "overflow-alarms": "services/blockage-overflow-alarms.html",
  "water-quality": "services/water-quality-monitoring.html",
  telemetry: "services/scada-telemetry-integration.html",
  // Solutions
  "waste-water-montioring": "solutions/wastewater-monitoring.html",
  "environmental-monitoring": "solutions/environmental-monitoring.html",
  "automatic-sampling": "solutions/automatic-sampling.html",
  "network-thermal-monitoring": "solutions/network-thermal-monitoring.html",
  "structure-performance-and-monitoring-1": "solutions/structure-performance.html",
  "asset-monitoring-and-servicing": "solutions/structure-performance.html",
  "new-page-4-1": "solutions/asset-network-assessment.html",
  // Products
  eds: "products/eds.html",
  ilab: "products/eds.html",
  "e-flow": "products/e-flow-3.html",
  "flowsense-1": "flowsense.html",
  detectronics: "products/detectronic.html",
  msfm: "products/detectronic.html",
  lidott: "products/detectronic.html",
  "lidott-r": "products/detectronic.html",
  "lidott-alarm": "products/lidott-alarm.html",
  "ori-index": "products/ori.html",
  "aqua-mini": "products/ori.html",
  "nemo-1-m-pp": "products/ori.html",
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
  beadedstream: "products/beadedstream.html",
  d605: "products/beadedstream.html",
  "spot-logger": "products/beadedstream.html",
  mlink: "products/beadedstream.html",
  "temperature-string": "products/beadedstream.html",
  "thermistor-string-1": "products/beadedstream.html",
  microlevel: "products/microlevel.html",
  "microlevel-portable-sampler": "products/microlevel.html",
  aquamonitrix: "products/aquamonitrix.html",
  "dynaflox-2": "products/dynaflox.html",
};
