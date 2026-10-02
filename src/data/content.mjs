// All site copy lives here. It is carried over from www.e-d-s.com.au (tidied,
// de-duplicated and set in Australian English), so nothing on the new site
// claims more than the old one did.

// Images live in src/assets/img and are copied to dist/assets/img by the build.
// "@root/" is swapped for each page's path back to the site root in layout().
export const img = (file) => `@root/assets/img/${file}`;
// Documents (datasheets, white papers, software) not yet copied into the
// project are still on the old host.
export const doc = (path) => `https://www.e-d-s.com.au${path}`;
// Documents copied into the project live in src/assets/docs.
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
  { city: "Canning Vale", state: "WA", note: "Western Australia", lon: 115.92, lat: -32.06 },
];

export const stats = [
  { value: 1991, label: "Founded in Queensland. Australian owned ever since.", plain: true },
  { value: 5, label: "Offices across Australia" },
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
  { id: "field", title: "Field services & support", heading: "The people and equipment behind every program.", lede: "Calibration, hire, facility management and training, from five offices across Australia." },
];

export const services = [
  {
    slug: "sewer-flow-monitoring",
    title: "Sewer Flow Monitoring",
    icon: "waves",
    group: "sewer",
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
    featured: true,
    summary: "Find where stormwater and groundwater enter the sewer, and how much, so investment goes where it counts.",
    intro: [
      "EDS specialises in identifying and addressing the challenges of sewer inflow and infiltration (I&I). Excess stormwater and groundwater entering sewer systems remains one of the most costly and complex challenges for councils and utilities across Australia.",
      "Our team provides practical solutions to manage and mitigate the effects of I&I, protecting the environment and keeping the system efficient.",
    ],
    blocks: [
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
    ],
    compare: {
      heading: "DaaS against traditional monitoring",
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
    featured: true,
    summary: "Monitoring programs designed to calibrate and enhance hydraulic and sewer network models.",
    intro: [
      "We work closely with our clients to design and deliver tailored network monitoring programs, from project initiation through to final delivery. These programs support the calibration and enhancement of existing hydraulic and sewer network models.",
      "Hydraulic modelling helps communities understand, plan and future-proof their wastewater infrastructure. High-resolution flow and rainfall data are essential for accurate simulation of collection system performance in both dry and wet weather.",
      "Today's leading modelling platforms can import and process flow and rainfall data in near real time. But the quality of a model depends entirely on the accuracy of the field data fed into it.",
      "Whether you are starting your hydraulic modelling journey or need updated flow monitoring to re-calibrate an existing model, EDS is ready to partner with you. Our team has worked with major councils and utilities across Australia, and understands the importance of reliable, defensible data that supports confident engineering decisions.",
    ],
    blocks: [],
    related: ["sewer-flow-monitoring", "inflow-infiltration-studies", "network-assessment"],
    products: ["detectronic", "hach-flow"],
  },
  {
    slug: "thermal-infiltration-surveys",
    title: "Thermal Infiltration Surveys",
    icon: "thermometer",
    group: "sewer",
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
          ["Several parameters at once", "The iLab 901 multi-parameter analytical sensor, and the handheld iLab Sonde for field checks."],
          ["Nitrate and nitrite", "Aquamonitrix measures both from the same sample, with laboratory accuracy in the field and no sample pre-treatment."],
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
    blocks: [],
    related: ["auditing-calibration", "equipment-rental", "real-time-monitoring"],
    products: ["dynaflox", "eds"],
  },
  {
    slug: "rainfall-monitoring",
    title: "Rainfall Monitoring",
    icon: "cloud-drizzle",
    group: "water",
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
          ["Hosted SFTP", "One of five ways FlowSense connects to SCADA, so nothing is exposed at your end."],
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
    ],
    related: ["sewer-model-calibration", "data-analysis-reporting", "sewer-flow-monitoring"],
    solutions: ["asset-network-assessment"],
    products: ["detectronic", "eds"],
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
    ],
    blocks: [],
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
    blocks: [],
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
    intro: [
      "Environmental Data Services is a manufacturer, and represents leading manufacturers, in water supply and management, wastewater management, flow monitoring equipment and process control equipment.",
      "EDS manufactures the popular EMS \"D\" Series data loggers and the Pump Station Manager, and contractually manufactures and supplies data loggers to the Australian Bureau of Meteorology.",
    ],
    groups: [
      {
        name: "Data loggers",
        items: [
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
          { name: "E-Flow", type: "flow", note: "Flow sensor", image: img("eflow-4.png") },
          { name: "iLab 901", type: "quality", note: "Multi-parameter analytical sensor", image: img("ilab-901-multitparameter-analytical-sensor-2.gif"), docs: [{ label: "Datasheet", href: doc("/s/iLab-901-Multitparameter-Analytical-Sensor-DS-21rs.pdf") }] },
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
    groups: [
      {
        name: "Flow, level and logging",
        items: [
          { name: "MSFM", type: "flow", note: "Rugged 4G area velocity flow meter", image: img("s2.5-04-small-766x1024.png"), docs: [{ label: "S2.5T datasheet", href: localDoc("detectronic-msfm-s2-5t-datasheet.pdf") }] },
          { name: "LIDoTT Smart", type: "level", note: "Long life, rugged 4G patented level monitor", image: img("dete01-01.24-600x452.png"), docs: [{ label: "LIDoTT Sensor datasheet", href: localDoc("detectronic-lidott-sensor-datasheet.pdf") }] },
          { name: "LIDoTT Alarm", type: "level", note: "Self contained level measurement and alarm device", image: img("lidott-alarm-3.png"), href: "products/lidott-alarm.html", docs: [{ label: "Datasheet", href: doc("/s/MMS-D050-LIDoTT-Alarm-iss3.pdf") }] },
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
    ],
    groups: [
      {
        name: "Mobile samplers",
        items: [
          { name: "Aqua Mini", type: "sampling", image: img("aquasamp-mini-teaser.png"), docs: [{ label: "Brochure", href: localDoc("ori-aquasamp-mini-brochure.pdf") }, { label: "PumpModul datasheet", href: localDoc("ori-pumpmodul-datasheet.pdf") }] },
          // One datasheet covers all three NEMO 1 M versions.
          { name: "NEMO 1 MH", type: "sampling", image: img("nemo-1-mh.png"), docs: [{ label: "Datasheet", href: localDoc("ori-nemo-1-m-datasheet.pdf") }] },
          { name: "NEMO 1 M PP", type: "sampling", image: img("csm-nemo1-m-pp-6a7052503d.png"), docs: [{ label: "Datasheet", href: localDoc("ori-nemo-1-m-datasheet.pdf") }] },
          { name: "NEMO 1 M V", type: "sampling", image: img("csm-nemo1-m-vac-6a5f2d98ac.png"), docs: [{ label: "Datasheet", href: localDoc("ori-nemo-1-m-datasheet.pdf") }] },
          { name: "Basic Mobil", type: "sampling", image: img("basic-mobil.png") },
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
    docs: [{ label: "ORI water analytics catalogue", href: doc("/s/Catalogue_Wateranalytics_eng-lfy2.pdf") }],
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
    groups: [
      {
        name: "Loggers",
        items: [
          { name: "FL1500 Logger", type: "flow", image: img("landing-fl1500-2.jpg"), docs: [{ label: "FSDATA Desktop 32-bit", href: doc("/s/FSDATA-Desktop-32bit.zip") }, { label: "FSDATA Desktop 64-bit", href: doc("/s/FSDATA-Desktop-64bit.zip") }] },
          { name: "FH950 Velocity Meter", type: "flow", image: img("landing-fh950.jpg") },
          { name: "FL900 Portable", type: "flow", image: img("landing-fl900-2.jpg") },
          { name: "SC200 Controller", type: "flow", image: img("landing-sc200.jpg") },
          { name: "Flo-Station", type: "flow", image: img("landing-flo-station.jpg") },
        ],
      },
      {
        name: "Sensors",
        items: [
          { name: "Flo-Dar", type: "flow", note: "Non-contact", image: img("landing-flo-dar-1.jpg") },
          { name: "Sub AV Sensor", type: "flow", image: img("landing-sigma-av.jpg") },
          { name: "Flo-Tote 3", type: "flow", image: img("landing-flo-tote.jpg") },
          { name: "AV Flow Sensor with Bubbler", type: "flow", image: img("landing-sigma-av-bubbler.jpg") },
          { name: "Ultrasonic Sensors", type: "flow", image: img("landing-sigma-ultrasonic.jpg") },
        ],
      },
    ],
    docs: [{ label: "Hach Flow selection guide", href: doc("/s/HachFlow_Selection_Guide-New.pdf") }],
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
    ],
    groups: [
      {
        name: "Product range",
        items: [
          { name: "D605", type: "temperature", note: "Logger", image: img("front-view-of-beadedstream-d605-temperature-data-logger-without-antenna.png"), docs: [{ label: "Datasheet", href: localDoc("beadedstream-d605-datasheet.pdf") }] },
          { name: "Spot Logger", type: "temperature", note: "Logger", image: img("spot-logger-side-view-with-raymo-connector.png"), docs: [{ label: "Battery install and replacement guide", href: localDoc("beadedstream-spot-logger-battery-guide.pdf") }] },
          { name: "Thermistor String", type: "temperature", note: "Sensor", image: img("standard-dtc-bar-code-144-1.jpg"), docs: [{ label: "Digital Temperature Cable spec sheet", href: localDoc("beadedstream-digital-temperature-cable-spec-sheet.pdf") }, { label: "EDS white paper", href: doc("/s/EDS-White-Paper-Benefits-of-Using-Thermistor-Strings-in-Conjunction-with-Open-Channel-Sewer-Flow-Met-jhzm.pdf") }] },
          { name: "Mlink", type: "software", note: "Connectivity", image: img("beadedstream-mlink-temperature-data-logger-connector.png"), docs: [{ label: "Spec sheet", href: localDoc("beadedstream-mlink-spec-sheet.pdf") }] },
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
    groups: [
      {
        name: "The analyser",
        items: [
          { name: "Aquamonitrix", type: "quality", note: "Nitrate and nitrite, rugged and portable", image: img("picture-1.png"), docs: [{ label: "Performance datasheet", href: doc("/s/Aquamonitrix-Performance.pdf") }] },
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
  datasheet: doc("/s/MMS-D050-LIDoTT-Alarm-iss3.pdf"),
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
  docs: [
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
    ["Today", "Australia's largest supplier", "EDS has grown to be Australia's largest supplier of equipment for the water and wastewater industry, and was awarded the largest sewer monitoring project in Australia in recent years."],
  ],
  founder: { name: "Cynthia Harper", role: "Co-founder, Environmental Data Services", text: "EDS continues to strive to deliver the level of service and professionalism that was part of Graham's founding ethos." },
  quote: { text: "EDS helped us design and implement a user friendly and rugged sewer monitoring program that was completely remote. The level of service and professionalism received by EDS is always leading the industry.", who: "Tony Cockrel", org: "DERM" },
};

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
  ["Spotless", "client-spotless.jpg"],
  ["Urban Utilities", "client-urban-utilities.jpeg"],
  ["Aurecon", "client-aurecon.png"],
  ["Stantec", "client-stantec.png"],
  ["Blue Siren", "client-blue-siren.png"],
  ["Water Corporation", "client-water-corporation.png"],
  ["Hach", "client-hach.jpg"],
  ["Transurban", "client-transurban.jpg"],
  ["GHD", "client-ghd.jpg"],
  ["SMEC", "client-smec.jpg"],
  ["Cardno", "client-eds-client.png"],
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
    href: doc("/s/EDS-White-Paper-The-Unforeseen-Benefits-of-Sewer-Inflow-and-Infiltration-Monitoring-October-2025.pdf"),
  },
  {
    id: "measuring-the-invisible",
    title: "Inflow & Infiltration: Measuring the Invisible Problem",
    date: "July 2025",
    text: "Excess stormwater and groundwater entering sewer systems remains one of the most costly and complex challenges for councils and utilities. With asset pressures rising and budgets under strain, targeting I&I is more critical than ever.",
    href: doc("/s/EDS-White-Paper-Inflow-Infiltration-Measuring-the-Invisible-Problem-July-2025-rev13.pdf"),
  },
  {
    id: "thermistor-strings",
    title: "Thermistor Strings with Open Channel Sewer Flow Meters to Locate Infiltration",
    date: "White paper",
    text: "How combining thermistor strings with open channel sewer flow meters gives precise detection of infiltration, with continuous real-time monitoring, non-intrusive installation and significant cost savings.",
    href: doc("/s/EDS-White-Paper-Benefits-of-Using-Thermistor-Strings-in-Conjunction-with-Open-Channel-Sewer-Flow-Met-jhzm.pdf"),
  },
];

export const downloads = [
  {
    group: "Software and drivers",
    icon: "hard-drive-download",
    items: [
      ["FSDATA Desktop for FL1500 (32-bit)", doc("/s/FSDATA-Desktop-32bit.zip")],
      ["FSDATA Desktop for FL1500 (64-bit)", doc("/s/FSDATA-Desktop-64bit.zip")],
      ["USB-Serial Adapter GXU driver", doc("/s/GXMU-1200-Drivers.zip")],
      ["EMS-Flow software user manual", localDoc("eds-ems-flow-user-manual.pdf")],
    ],
    note: "EDS (EMS2001, EMS4000), Hach Flo-Ware and Dynaflox RS-232 software are available on request. Contact us for a password.",
  },
  {
    group: "EDS FlowSense",
    icon: "waves",
    items: [
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
      ["iLab 901 multi-parameter sensor datasheet", doc("/s/iLab-901-Multitparameter-Analytical-Sensor-DS-21rs.pdf")],
      ["Detectronic MSFM S2.5T flow meter datasheet", localDoc("detectronic-msfm-s2-5t-datasheet.pdf")],
      ["Detectronic LIDoTT Sensor datasheet", localDoc("detectronic-lidott-sensor-datasheet.pdf")],
      ["Detectronic LIDoTT Alarm datasheet", doc("/s/MMS-D050-LIDoTT-Alarm-iss3.pdf")],
      ["Detectronic LIDoTT R datasheet", localDoc("detectronic-lidott-r-datasheet.pdf")],
      ["ORI AquaSamp Mini brochure", localDoc("ori-aquasamp-mini-brochure.pdf")],
      ["ORI PumpModul portable sampler datasheet", localDoc("ori-pumpmodul-datasheet.pdf")],
      ["ORI NEMO 1 M sampler datasheet", localDoc("ori-nemo-1-m-datasheet.pdf")],
      ["ORI water analytics catalogue", doc("/s/Catalogue_Wateranalytics_eng-lfy2.pdf")],
      ["Hach Flow selection guide", doc("/s/HachFlow_Selection_Guide-New.pdf")],
      ["Beadedstream D605 temperature logger datasheet", localDoc("beadedstream-d605-datasheet.pdf")],
      ["Beadedstream Spot Logger battery guide", localDoc("beadedstream-spot-logger-battery-guide.pdf")],
      ["Beadedstream Digital Temperature Cable spec sheet", localDoc("beadedstream-digital-temperature-cable-spec-sheet.pdf")],
      ["Beadedstream Mlink spec sheet", localDoc("beadedstream-mlink-spec-sheet.pdf")],
      ["Aquamonitrix performance datasheet", doc("/s/Aquamonitrix-Performance.pdf")],
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
