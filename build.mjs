// Static site generator for the EDS website. No framework: content comes from
// src/data/content.mjs, pages are template strings, output goes to dist/.
//   npm run build   -> writes dist/
//   npm run dev     -> builds, then runs the site server (server/) on http://localhost:4173
import { mkdir, readFile, writeFile, rm, cp } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as C from "./src/data/content.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "dist");
const { site } = C;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Lucide is the only icon family (ISC licence). Icons are inlined at build
// time so pages need no icon script. The second argument picks a hover
// choreography from site.css; most icons have a sensible default.
const ANIM = {
  waves: "flow", "cloud-rain": "rain", fan: "spin", radar: "sweep", gauge: "needle",
  bell: "ring", "bell-ring": "ring", siren: "ring", phone: "ring", "map-pin": "hop",
  "arrow-right": "nudge-x", "arrow-up-right": "nudge-xy", send: "nudge-xy", download: "nudge-y",
  "hard-drive-download": "nudge-y", activity: "draw", "audio-waveform": "draw", "external-link": "nudge-xy",
};
const iconCache = new Map();
function icon(name, anim) {
  if (!iconCache.has(name)) {
    const file = path.join(ROOT, "node_modules/lucide-static/icons", `${name}.svg`);
    if (!existsSync(file)) throw new Error(`Lucide has no icon named "${name}"`);
    const inner = readFileSync(file, "utf8").replace(/^[\s\S]*?<svg[\s\S]*?>/, "").replace(/<\/svg>\s*$/, "").replace(/\s*\n\s*/g, "");
    iconCache.set(name, inner);
  }
  const a = anim === false ? "" : ` data-anim="${anim || ANIM[name] || "pop"}"`;
  return `<svg class="icon"${a} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconCache.get(name)}</svg>`;
}

const svc = (slug) => C.services.find((s) => s.slug === slug);
const sol = (slug) => C.solutions.find((s) => s.slug === slug);
const brand = (slug) => C.brands.find((s) => s.slug === slug);
const year = new Date().getFullYear();

/* ------------------------------------------------------------------ */
/* layout                                                              */
/* ------------------------------------------------------------------ */
function header(r, current) {
  // A mega menu takes a flat list of links, or `groups` of them (Services),
  // which it lays out as one titled column per group.
  const mLink = (i) => `<a href="${r}${i.href}">${icon(i.icon)}<span>${esc(i.label)}</span></a>`;
  const mega = (label, key, { items, groups }, all, cols) => `
      <div class="nav-item has-mega${groups ? " wide" : ""}">
        <button class="nav-link" aria-expanded="false"${current === key ? ' aria-current="page"' : ""}>${label}${icon("chevron-down", false)}</button>
        <div class="mega${groups ? " groups" : cols ? " cols-2" : ""}">
          ${groups ? groups.map((g) => `<div class="mega-group"><p class="mega-head">${esc(g.label)}</p>${g.items.map(mLink).join("")}</div>`).join("") : items.map(mLink).join("")}
          <a class="mega-all" href="${r}${all.href}"><span>${all.label}</span>${icon("arrow-right")}</a>
        </div>
      </div>`;
  const sGroups = C.serviceGroups.map((g) => ({
    label: g.title,
    items: C.services.filter((s) => s.group === g.id).map((s) => ({ href: `services/${s.slug}.html`, icon: s.icon, label: s.short || s.title })),
  }));
  const oItems = C.solutions.map((s) => ({ href: `solutions/${s.slug}.html`, icon: s.icon, label: s.title }));
  const pItems = [...C.brands.map((b) => ({ href: `products/${b.slug}.html`, icon: b.icon, label: b.name })), { href: "products/lidott-alarm.html", icon: "bell", label: "LIDoTT Alarm" }];
  const link = (href, label, key) => `<div class="nav-item"><a class="nav-link" href="${r}${href}"${current === key ? ' aria-current="page"' : ""}>${label}</a></div>`;
  const dLink = (i) => `<a href="${r}${i.href}">${icon(i.icon, false)}${esc(i.label)}</a>`;
  const dGroup = (label, { items, groups }, all) => `
        <details><summary>${label}${icon("chevron-down", false)}</summary><div>
          ${groups ? groups.map((g) => `<p class="drawer-sub">${esc(g.label)}</p>${g.items.map(dLink).join("")}`).join("") : items.map(dLink).join("")}
          <a href="${r}${all}">${icon("arrow-right", false)}View all</a>
        </div></details>`;
  return `
  <a class="skip" href="#main">Skip to content</a>
  <div class="progress" aria-hidden="true"></div>
  <header class="header">
    <div class="wrap">
      <a class="logo" href="${r}index.html" aria-label="EDS home"><img src="${site.logoWhite}" alt="EDS, Environmental Data Services" width="126" height="40"></a>
      <nav class="nav" aria-label="Main">
        ${mega("Services", "services", { groups: sGroups }, { href: "services/index.html", label: "All services" })}
        ${mega("Solutions", "solutions", { items: oItems }, { href: "solutions/index.html", label: "All solutions" })}
        ${mega("Products", "products", { items: pItems }, { href: "products/index.html", label: "All products" }, true)}
        ${link("flowsense.html", "FlowSense", "flowsense")}
        ${link("about.html", "About", "about")}
        ${link("resources.html", "Resources", "resources")}
      </nav>
      <div class="header-cta">
        <a class="header-phone" href="${site.phoneHref}" aria-label="Call EDS on ${site.phone}">${icon("phone")}<span>${site.phone}</span></a>
        <a class="btn btn-primary" href="${r}contact.html">Contact us</a>
      </div>
      <button class="burger" aria-label="Open menu" aria-expanded="false">${icon("menu", false)}</button>
    </div>
  </header>
  <div class="drawer" aria-label="Menu">
    <div class="drawer-scrim"></div>
    <div class="drawer-panel">
      <div class="drawer-head">
        <a class="logo" href="${r}index.html"><img src="${site.logoWhite}" alt="EDS" width="126" height="40"></a>
        <button class="burger drawer-close" style="display:inline-flex" aria-label="Close menu">${icon("x", false)}</button>
      </div>
      ${dGroup("Services", { groups: sGroups }, "services/index.html")}
      ${dGroup("Solutions", { items: oItems }, "solutions/index.html")}
      ${dGroup("Products", { items: pItems }, "products/index.html")}
      <a class="drawer-link" href="${r}flowsense.html">FlowSense</a>
      <a class="drawer-link" href="${r}about.html">About</a>
      <a class="drawer-link" href="${r}resources.html">Resources</a>
      <a class="btn btn-primary btn-lg" href="${r}contact.html">Contact us</a>
      <a class="btn btn-ghost btn-lg" href="${site.phoneHref}">${icon("phone", false)}${site.phone}</a>
    </div>
  </div>`;
}

function footer(r) {
  return `
  <footer class="footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <a class="logo" href="${r}index.html"><img src="${site.logoWhite}" alt="EDS, Environmental Data Services" width="145" height="46" loading="lazy"></a>
          <p>${site.tagline}</p>
          <div class="footer-contact">
            <a href="${site.phoneHref}">${icon("phone")}${site.phone}</a>
            <a href="mailto:${site.email}">${icon("mail")}${site.email}</a>
          </div>
        </div>
        <div>
          <h4>Services</h4>
          <ul>${C.services.filter((s) => s.featured).slice(0, 7).map((s) => `<li><a href="${r}services/${s.slug}.html">${esc(s.short || s.title)}</a></li>`).join("")}<li><a href="${r}services/index.html">All services</a></li></ul>
        </div>
        <div>
          <h4>Products</h4>
          <ul>${C.brands.map((b) => `<li><a href="${r}products/${b.slug}.html">${esc(b.name)}</a></li>`).join("")}</ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="${r}about.html">About EDS</a></li>
            <li><a href="${r}flowsense.html">EDS FlowSense</a></li>
            <li><a href="${r}solutions/index.html">Solutions</a></li>
            <li><a href="${r}resources.html">Resources</a></li>
            <li><a href="${r}contact.html">Contact</a></li>
            <li><a href="${site.remoteDataUrl}" rel="noopener">Remote data access</a></li>
          </ul>
        </div>
        <div>
          <h4>Head office</h4>
          <address>${site.address.join("<br>")}</address>
          <p style="margin-top:10px">${site.hours}</p>
          <form class="signup" data-mailto="${site.email}" data-subject="Register for EDS updates" data-track="Updates sign-up">
            <label for="f-email">Register for updates on projects, equipment and servicing</label>
            <input id="f-email" name="Email" type="email" placeholder="Your email" autocomplete="email" required>
            <button class="btn btn-primary" type="submit" aria-label="Register for updates">${icon("send")}</button>
          </form>
        </div>
      </div>
      <div class="footer-base">
        <span>© ${year} ${site.legal}. All rights reserved. <a href="${r}privacy.html" style="text-decoration:underline">Privacy policy</a></span>
      </div>
    </div>
  </footer>`;
}

// Visit counting for the admin dashboard (server/). Preview copies on GitHub
// Pages leave it out, since there is no server there to receive visits,
// unless ANALYTICS_ENDPOINT points at one.
const ENDPOINT = process.env.ANALYTICS_ENDPOINT || "";
const tracker = (r, file) =>
  process.env.PREVIEW && !ENDPOINT ? "" : `\n<script src="${r}assets/js/track.js" defer${ENDPOINT ? ` data-endpoint="${esc(ENDPOINT)}"` : ""}${file === "404.html" ? ' data-status="404"' : ""}></script>`;

function layout({ file, title, description, current, body, scripts = [] }) {
  const depth = file.split("/").length - 1;
  // The not-found page can be served at any depth, so it links from the root.
  const r = file === "404.html" ? "/" : "../".repeat(depth);
  const html = typeof body === "function" ? body(r) : body;
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#041513">${process.env.PREVIEW ? '\n<meta name="robots" content="noindex, nofollow">' : ""}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<link rel="icon" type="image/svg+xml" href="${r}assets/favicon.svg">
<link rel="preload" href="${r}assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${r}assets/fonts/inter-tight-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<script>document.documentElement.classList.add("js")</script>
<link rel="stylesheet" href="${r}assets/css/site.css">
</head>
<body>
${header(r, current)}
<main id="main">
${html}
</main>
${footer(r)}
<script src="${r}assets/js/site.js" defer></script>
${scripts.map((s) => `<script src="${r}assets/js/${s}" defer></script>`).join("\n")}${tracker(r, file)}
</body>
</html>
`.replaceAll("@root/", r);
}

/* ------------------------------------------------------------------ */
/* shared sections                                                     */
/* ------------------------------------------------------------------ */
const pageHero = (r, { crumbs = [], iconName, eyebrow, title, lede, actions = "" }) => `
<section class="page-hero dark">
  <canvas data-flowfield aria-hidden="true"></canvas>
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${r}index.html">Home</a>${crumbs.map(([label, href]) => `${icon("chevron-down", false)}${href ? `<a href="${r}${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`}`).join("")}</nav>
    ${iconName ? `<div class="hero-icon holder" data-reveal="scale">${icon(iconName)}</div>` : ""}
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
    <h1 class="h-lg" data-reveal>${esc(title)}</h1>
    ${lede ? `<p class="lede" data-reveal style="--i:1">${esc(lede)}</p>` : ""}
    ${actions ? `<div class="hero-actions" data-reveal style="--i:2">${actions}</div>` : ""}
  </div>
</section>`;

const ctaSection = (r, { title = "Talk to the people who measure it.", lede = "Tell us about your network, site or project. A real person from our team will come back to you." } = {}) => `
<section class="section dark cta">
  <canvas data-flowfield aria-hidden="true"></canvas>
  <div class="wrap">
    <h2 class="h-lg" data-reveal>${title}</h2>
    <p class="lede" data-reveal style="--i:1">${lede}</p>
    <div class="hero-actions" data-reveal style="--i:2">
      <a class="btn btn-primary btn-lg" data-magnetic href="${r}contact.html">Contact EDS ${icon("arrow-right")}</a>
      <a class="btn btn-ghost btn-lg" href="${site.phoneHref}">${icon("phone")} ${site.phone}</a>
    </div>
  </div>
</section>`;

const cardLink = (r, { href, iconName, title, text, n, tilt = true }) => `
<a class="card${tilt ? " tilt" : ""}" href="${r}${href}" data-reveal style="--i:${n % 4}">
  <span class="card-icon">${icon(iconName)}</span>
  <h3>${esc(title)}</h3>
  <p>${esc(text)}</p>
  <span class="link-arrow">Learn more ${icon("arrow-right")}</span>
</a>`;

const labSection = ({ eyebrow = "Flow lab", title = "See what a storm does to a sewer.", lede = "Send a storm through a model catchment and watch the hydrograph respond. The gap between measured flow and the dry weather pattern is inflow and infiltration: water that should never have reached the sewer." } = {}) => `
<section class="section dark" id="flow-lab">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">${eyebrow}</p>
      <h2 class="h-lg" data-reveal>${title}</h2>
      <p class="lede" data-reveal style="--i:1">${lede}</p>
    </div>
    <div class="lab" data-reveal>
      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">${icon("activity", false)} Sewer hydrograph</div>
          <div class="legend"><span><i></i>Measured flow</span><span><i class="dwf"></i>Dry weather pattern</span><span><i class="rain"></i>Rainfall</span></div>
        </div>
        <div class="chart-box"><canvas id="lab-chart" role="img" aria-label="Animated chart of sewer flow against the expected dry weather pattern, with rainfall shown above"></canvas></div>
        <div class="lab-controls">
          <button class="btn btn-primary" id="lab-storm" data-magnetic>${icon("cloud-rain")} Send a storm</button>
          <label class="range"><span>Storm size <output id="lab-size-out"></output></span><input id="lab-size" type="range" min="5" max="50" step="1" value="26"></label>
          <label class="range"><span>Network condition <output id="lab-leak-out"></output></span><input id="lab-leak" type="range" min="0.15" max="1.6" step="0.05" value="1"></label>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title">${icon("gauge", false)} At the flow meter</div></div>
        <svg id="lab-pipe" viewBox="0 0 200 200" role="img" aria-label="Cross-section of a sewer pipe showing the water depth">
          <defs>
            <clipPath id="lab-clip"><circle cx="100" cy="100" r="80"/></clipPath>
            <linearGradient id="lab-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4a6" stop-opacity=".85"/><stop offset="1" stop-color="#0d7c72" stop-opacity=".9"/></linearGradient>
          </defs>
          <circle cx="100" cy="100" r="87" fill="#0b302d" stroke="rgba(255,255,255,.22)" stroke-width="2"/>
          <g clip-path="url(#lab-clip)">
            <rect width="200" height="200" fill="#020c0b"/>
            <rect id="lab-water" x="0" y="120" width="200" height="60" fill="url(#lab-wg)"/>
            <g id="lab-arrows" class="lab-arrows"><line x1="20" y1="92" x2="180" y2="92"/><line x1="20" y1="100" x2="180" y2="100"/><line x1="20" y1="108" x2="180" y2="108"/></g>
            <line id="lab-surface" x1="0" x2="200" y1="120" y2="120" stroke="#dbf0ec" stroke-width="2"/>
          </g>
        </svg>
        <div class="readouts">
          <div class="readout"><b id="lab-q">0</b><span>Flow L/s</span></div>
          <div class="readout"><b id="lab-d">0</b><span>Depth mm</span></div>
          <div class="readout"><b id="lab-v">0</b><span>Velocity m/s</span></div>
        </div>
        <div class="state" id="lab-state" data-level="0" aria-live="polite"><i></i><div><b>Normal</b><small>Flow is tracking the dry weather pattern.</small></div></div>
        <div class="state" style="margin-top:10px"><div><b><span id="lab-extra">0</span> kL above dry weather flow</b><small>Extra volume in the last 30 hours: the cost of I&amp;I.</small></div></div>
      </div>
    </div>
    <p class="note" style="margin-top:16px">An illustrative model of a 600 mm sewer, not live data. Flow is wetted area multiplied by velocity, the way an area-velocity flow meter measures it.</p>
  </div>
</section>`;

const lidottDemo = () => `
<div class="demo" data-reveal>
  <div class="panel">
    <div class="panel-head"><div class="panel-title">${icon("radar", false)} Drag the water level</div></div>
    <svg id="lidott-svg" viewBox="0 0 360 420" data-level="0" role="img" aria-label="Cross-section of a manhole with a LIDoTT Alarm measuring the water level by radar">
      <defs><linearGradient id="lid-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4a6" stop-opacity=".8"/><stop offset="1" stop-color="#0d7c72"/></linearGradient></defs>
      <rect x="0" y="40" width="360" height="380" fill="#0b302d"/>
      <rect x="0" y="34" width="360" height="8" fill="#14605a"/>
      <rect x="100" y="42" width="160" height="340" fill="#020c0b"/>
      <rect x="0" y="330" width="100" height="50" fill="#020c0b"/><rect x="260" y="330" width="100" height="50" fill="#020c0b"/>
      <rect id="lid-water" x="0" y="300" width="360" height="80" fill="url(#lid-wg)" clip-path="url(#lid-clip)"/>
      <clipPath id="lid-clip"><rect x="100" y="42" width="160" height="340"/><rect x="0" y="330" width="100" height="50"/><rect x="260" y="330" width="100" height="50"/></clipPath>
      <polygon id="lid-beam" points="180,96 170,300 190,300" fill="rgba(95,180,166,.22)" stroke="rgba(95,180,166,.7)" stroke-dasharray="3 4"/>
      <line x1="100" x2="260" y1="225" y2="225" stroke="#f59e0b" stroke-dasharray="5 5"/><text x="268" y="229" fill="#f59e0b" font-size="11" font-weight="600">High 2.0 m</text>
      <line x1="100" x2="260" y1="147.500" y2="147.500" stroke="#ef4444" stroke-dasharray="5 5"/><text x="268" y="151" fill="#ef4444" font-size="11" font-weight="600">High-high 3.0 m</text>
      <rect x="92" y="28" width="176" height="12" rx="3" fill="#26313f" stroke="rgba(255,255,255,.3)"/>
      <rect x="168" y="42" width="24" height="10" fill="#8fa3c0"/>
      <rect x="160" y="52" width="40" height="44" rx="8" fill="#e8f3f1" stroke="#5fb4a6" stroke-width="2"/>
      <circle class="lid-led" cx="180" cy="68" r="5" fill="#22c55e"/>
      <line id="lid-dim" x1="118" x2="118" y1="96" y2="300" stroke="rgba(255,255,255,.45)" stroke-dasharray="2 4"/>
      <text x="16" y="24" fill="rgba(255,255,255,.6)" font-size="11">Ground level</text>
    </svg>
    <label class="range" style="margin-top:12px"><span>Water level <output><span id="lid-level">1.10</span> m</output></span><input id="lidott-level" type="range" min="0.2" max="3.8" step="0.01" value="1.1"></label>
  </div>
  <div class="panel">
    <div class="panel-head"><div class="panel-title">${icon("bell", false)} What the utility sees</div></div>
    <div class="readouts" style="grid-template-columns:1fr 1fr;margin-top:0">
      <div class="readout"><b><span id="lid-dist">2.90</span></b><span>Radar range m</span></div>
      <div class="readout"><b>± 5</b><span>Accuracy mm</span></div>
    </div>
    <div class="state" id="lid-state" data-level="0" aria-live="polite"><i></i><div><b>Normal</b><small>Three configurable states: normal, high, high-high.</small></div></div>
    <div class="sms" id="lidott-log" aria-live="polite"></div>
    <p class="note">An illustration of the alarm behaviour. Thresholds are set on site during installation.</p>
  </div>
</div>`;

function easDemo() {
  const arc = (a, b, colour) => {
    const pt = (s) => { const t = Math.PI + (s / 1000) * Math.PI; return `${(200 + 150 * Math.cos(t)).toFixed(1)} ${(200 + 150 * Math.sin(t)).toFixed(1)}`; };
    return `<path d="M${pt(a)}A150 150 0 0 1 ${pt(b)}" fill="none" stroke="${colour}" stroke-width="18" stroke-linecap="butt"/>`;
  };
  const ticks = [0, 250, 500, 750, 1000].map((s) => { const t = Math.PI + (s / 1000) * Math.PI; return `<text x="${(200 + 178 * Math.cos(t)).toFixed(1)}" y="${(204 + 178 * Math.sin(t)).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,.55)" font-size="11">${s}</text>`; }).join("");
  return `
<div class="demo" data-reveal>
  <div class="panel">
    <div class="panel-head"><div class="panel-title">${icon("gauge", false)} EDS Asset Score</div></div>
    <svg id="eas-svg" viewBox="0 0 400 320" role="img" aria-label="Dial showing an asset score from 0 to 1000">
      ${arc(0, 396, "#ef4444")}${arc(404, 696, "#f59e0b")}${arc(704, 1000, "#22c55e")}
      ${ticks}
      <line id="eas-needle" x1="200" y1="200" x2="200" y2="78" stroke="#fff" stroke-width="4" stroke-linecap="round" style="transition:transform .25s linear"/>
      <circle cx="200" cy="200" r="9" fill="#fff"/>
      <text id="eas-num" x="200" y="250" text-anchor="middle" fill="#fff" font-size="40" font-weight="650" font-family="Inter Tight, Inter, sans-serif">930</text>
      <polyline id="eas-spark" fill="none" stroke="#5fb4a6" stroke-width="2" stroke-linejoin="round"/>
      <text x="200" y="314" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="10">last 60 minutes</text>
    </svg>
  </div>
  <div class="panel">
    <div class="panel-head"><div class="panel-title">${icon("bell", false)} Try it</div></div>
    <p>One number from 0 to 1000, drawn from light, moisture, seismic and temperature sensors across the structure. Simulate a change and watch the alarm rule respond.</p>
    <div class="btn-row">
      <button class="btn btn-ghost btn-sm" data-eas="subtle">Subtle change</button>
      <button class="btn btn-ghost btn-sm" data-eas="adverse">Adverse event</button>
      <button class="btn btn-ghost btn-sm" data-eas="reset">${icon("rotate-ccw")} Reset</button>
    </div>
    <div class="state" id="eas-state" data-level="0" aria-live="polite"><i></i><div><b>Stable</b><small>No change beyond 5% in the last 60 minutes.</small></div></div>
    <p class="note" style="margin-top:14px">An illustration only. The EAS algorithms are patent pending and are not reproduced here.</p>
  </div>
</div>`;
}

// Four small drawings of FlowSense screens. They are illustrations, labelled
// as such, drawn in the platform's own light theme.
function fsScreen() {
  const pipe = (d, c, w = 5) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="2 12" stroke-linecap="round" class="fs-dash"/>`;
  const heat = `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice">
    <rect width="480" height="270" fill="#eef2f6"/>
    <g stroke="#dfe5ec" stroke-width="10" fill="none"><path d="M0 60H480M0 150H480M0 230H480M90 0V270M230 0V270M370 0V270"/></g>
    ${pipe("M40 60H230", "#3b82f6")}${pipe("M230 60H440", "#eab308")}${pipe("M90 60V150", "#3b82f6")}${pipe("M230 60V150", "#f97316", 6)}${pipe("M370 60V150", "#eab308")}
    ${pipe("M40 150H230", "#eab308")}${pipe("M230 150H440", "#ef4444", 7)}${pipe("M230 150V230", "#ef4444", 7)}${pipe("M90 230H230", "#f97316", 6)}${pipe("M230 230H420", "#3b82f6")}
    <g fill="#fff" stroke="#0c5f59" stroke-width="2"><circle cx="230" cy="60" r="5"/><circle cx="230" cy="150" r="5"/><circle cx="90" cy="150" r="5"/><circle cx="370" cy="150" r="5"/><circle cx="230" cy="230" r="5"/></g>
    <g font-size="10" font-family="Inter, sans-serif" fill="#26313f"><rect x="330" y="186" width="136" height="72" rx="8" fill="#fff" stroke="#dfe5ec"/><text x="342" y="204" font-weight="600">I/I severity</text>
    <rect x="342" y="212" width="14" height="6" rx="3" fill="#3b82f6"/><text x="362" y="218">Low</text><rect x="402" y="212" width="14" height="6" rx="3" fill="#eab308"/><text x="422" y="218">Moderate</text>
    <rect x="342" y="232" width="14" height="6" rx="3" fill="#f97316"/><text x="362" y="238">High</text><rect x="402" y="232" width="14" height="6" rx="3" fill="#ef4444"/><text x="422" y="238">Severe</text></g></svg>`;
  const blockage = `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet">
    <g stroke="#eef2f6"><path d="M40 50H460M40 100H460M40 150H460M40 200H460"/></g>
    <path class="fs-draw" pathLength="100" d="M40 190 C90 186 120 188 160 180 S230 168 270 150 S350 110 390 86 S440 62 460 54" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
    <path class="fs-draw" pathLength="100" d="M40 120 C80 114 110 126 150 120 S220 114 260 122 S340 116 380 121 S440 118 460 120" fill="none" stroke="#0d7c72" stroke-width="3" stroke-linecap="round"/>
    <g font-size="11" font-family="Inter, sans-serif"><text x="46" y="210" fill="#b91c1c" font-weight="600">Depth, creeping upward</text><text x="46" y="108" fill="#095f57" font-weight="600">Flow, unchanged</text>
    <rect x="296" y="22" width="164" height="26" rx="13" fill="#fef2f2" stroke="#fecaca"/><text x="310" y="39" fill="#b91c1c" font-weight="600">Likely obstruction building</text></g></svg>`;
  const psm = `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet">
    <rect x="150" y="30" width="180" height="210" rx="6" fill="#f4f7fa" stroke="#c8d2dc" stroke-width="2"/>
    <rect class="fs-well" x="152" y="130" width="176" height="108" fill="#5cc2b6" opacity=".85"/>
    <g font-size="10" font-family="Inter, sans-serif" stroke-dasharray="5 4">
      <path d="M130 60H350" stroke="#dc2626"/><path d="M130 92H350" stroke="#d97706"/><path d="M130 130H350" stroke="#0d7c72"/><path d="M130 200H350" stroke="#5b6878"/></g>
    <g font-size="10.5" font-family="Inter, sans-serif" fill="#26313f"><text x="358" y="63">Overflow</text><text x="358" y="95">Surcharge</text><text x="358" y="133">Pump start</text><text x="358" y="203">Pump stop</text></g>
    <g transform="translate(46 118) scale(2.4)" fill="none" stroke="#0c5f59" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g class="fs-fan">${iconCache.get("fan") || ""}</g></g>
    <text x="34" y="200" font-size="10.5" font-family="Inter, sans-serif" fill="#26313f" font-weight="600">Pump 1 running</text></svg>`;
  const alarms = `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet">
    ${[["#dc2626", "#fef2f2", "High-high level", "Site 07 · 2 min ago · SMS sent to duty officer", 26], ["#d97706", "#fffbeb", "Blockage Watch: depth drifting", "Site 14 · dry weather only · ranked 1 of 38", 104], ["#16a34a", "#f0fdf4", "Returned to normal", "Site 22 · acknowledged by the duty officer", 182]]
      .map(([c, bg, t, s, y], i) => `<g class="fs-toast" style="--i:${i}"><rect x="30" y="${y}" width="420" height="62" rx="12" fill="${bg}" stroke="${c}" stroke-opacity=".35"/><circle cx="60" cy="${y + 31}" r="9" fill="${c}"/><text x="84" y="${y + 27}" font-size="13" font-weight="650" font-family="Inter, sans-serif" fill="#05090f">${t}</text><text x="84" y="${y + 45}" font-size="10.5" font-family="Inter, sans-serif" fill="#5b6878">${s}</text></g>`).join("")}</svg>`;
  const views = [["I/I heat map", "Severity by pipe", heat], ["Blockage Watch", "Dry days only", blockage], ["Pump Station Manager", "Wet well, to scale", psm], ["Alarms", "Sent to people, not addresses", alarms]];
  return `
  <div class="fs-screen" data-reveal="right">
    <div class="fs-chrome"><img src="${site.logoWhite}" alt=""><span>FlowSense</span><span class="dot">Live</span></div>
    ${views.map(([t, s, svg], i) => `<div class="fs-view${i === 0 ? " active" : ""}"><h4>${t}<small>${s}</small></h4>${svg}</div>`).join("")}
    <span class="fs-caption">Illustration</span>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* pages                                                               */
/* ------------------------------------------------------------------ */
const pages = [];
const add = (p) => pages.push(p);

/* ---- home ---- */
function cityHref(r, ref) {
  if (ref === "flowsense") return `${r}flowsense.html`;
  if (ref === "lidott") return `${r}products/lidott-alarm.html`;
  const [k, slug] = ref.split(":");
  return `${r}${{ s: "services", o: "solutions", p: "products" }[k]}/${slug}.html`;
}
function cityLabel(ref) {
  if (ref === "flowsense") return "EDS FlowSense";
  const [k, slug] = ref.split(":");
  const item = k === "s" ? svc(slug) : sol(slug);
  return item.short || item.title;
}

add({
  file: "index.html",
  title: "EDS | Environmental Data Services: water, wastewater and environmental monitoring",
  description: "Environmental Data Services (EDS) has been a trusted leader in advanced monitoring solutions and specialised services since 1991, serving government, utilities, councils, consultants and industry across Australia.",
  current: "home",
  scripts: ["city.js", "lab.js", "widgets.js"],
  body: (r) => {
    const words = ["Every", "drop,", "measured."];
    return `
<section class="hero dark">
  <canvas class="hero-canvas" data-flowfield="dense" aria-hidden="true"></canvas>
  <div class="wrap hero-body">
    <p class="eyebrow">Water · Wastewater · Trade waste · Environment</p>
    <h1 class="h-xl" aria-label="Every drop, measured.">${words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${i === 2 ? `<em>${w}</em>` : w}</span></span>`).join(" ")}</h1>
    <p class="lede" data-reveal style="--i:4">Environmental Data Services has been a trusted leader in advanced monitoring solutions and specialised services since 1991, delivering high quality instrumentation, technical support and field proven solutions across Australia.</p>
    <div class="hero-actions" data-reveal style="--i:5">
      <a class="btn btn-primary btn-lg" data-magnetic href="#city-explorer">Explore the city ${icon("arrow-right")}</a>
      <a class="btn btn-ghost btn-lg" href="${r}services/index.html">Our services</a>
    </div>
    <p class="hero-hint" data-reveal style="--i:6">${icon("mouse-pointer-click", false)} Move your pointer through the flow</p>
    <div class="stats">
      ${C.stats.map((s, i) => `<div class="stat" data-reveal style="--i:${i}"><div class="stat-value"><span data-count="${s.value}"${s.decimals ? ` data-decimals="${s.decimals}"` : ""}${s.plain ? ' data-plain="1" data-from="1950"' : ""}>${s.value}</span>${s.suffix ? `<small>${s.suffix}</small>` : ""}</div><div class="stat-label">${s.label}</div></div>`).join("")}
    </div>
  </div>
</section>

<section class="section dark city-section" id="city-explorer">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">One city, every measurement</p>
      <h2 class="h-lg" data-reveal>Where does EDS fit in your network?</h2>
      <p class="lede" data-reveal style="--i:1">Hover over a district to lift it out of the city and see the services and products EDS brings to it.</p>
    </div>
  </div>
  <div class="wrap wide">
    <div class="city-grid">
      <div>
        <div class="city-stage" data-reveal="scale"><svg id="city" role="group" aria-label="Interactive map of a city. Each district shows the EDS services and products used there."></svg></div>
        <div class="city-tabs" role="tablist" aria-label="City districts">
          ${C.city.map((z, i) => `<button class="city-tab" role="tab" data-zone="${z.id}" aria-selected="${i === 0}">${icon(z.icon)}${z.name}</button>`).join("")}
        </div>
      </div>
      <div class="city-panel">
        ${C.city.map((z, i) => `
        <article class="city-card${i === 0 ? " active" : ""}" data-zone="${z.id}" data-name="${esc(z.name)}">
          <div class="city-card-head" style="--i:0"><span class="city-badge holder">${icon(z.icon)}</span><h3>${z.name}</h3></div>
          <p style="--i:1">${z.blurb}</p>
          <div style="--i:2"><h4>Services</h4><ul class="city-list">${z.services.map((s) => `<li><a href="${cityHref(r, s)}">${cityLabel(s)}${icon("arrow-right")}</a></li>`).join("")}</ul></div>
          <div style="--i:3"><h4>Products</h4><div class="chips">${z.products.map(([label, ref]) => `<a class="chip" href="${cityHref(r, ref)}">${esc(label)}</a>`).join("")}</div></div>
        </article>`).join("")}
      </div>
    </div>
  </div>
</section>

<section class="clients" aria-label="Clients">
  <p>Trusted by government, utilities, councils and industry</p>
  <div class="marquee"><div class="marquee-track">
    ${[0, 1].map((k) => C.clients.map((c) => `<div class="logo-tile"${k ? ' aria-hidden="true"' : ""}><img src="${c.src}" alt="${k ? "" : esc(c.name)}" loading="lazy"></div>`).join("")).join("")}
  </div></div>
</section>

<section class="section" id="services">
  <div class="wrap">
    <div class="section-head split">
      <div><p class="eyebrow">Services</p><h2 class="h-lg" data-reveal>Specialised services, delivered Australia wide.</h2></div>
      <a class="btn btn-outline" href="${r}services/index.html">All services ${icon("arrow-right")}</a>
    </div>
    <div class="grid c4">
      ${C.services.filter((s) => s.featured).map((s, n) => cardLink(r, { href: `services/${s.slug}.html`, iconName: s.icon, title: s.short || s.title, text: s.summary, n })).join("")}
    </div>
  </div>
</section>

${labSection()}

<section class="section fs-band" id="flowsense">
  <div class="wrap fs-grid">
    <div>
      <p class="eyebrow">EDS FlowSense</p>
      <h2 class="h-lg" data-reveal>Sewer network intelligence.</h2>
      <p class="lede" data-reveal style="--i:1;color:rgba(255,255,255,.85)">The platform behind our monitoring: flow analytics and engineering insight for every site EDS measures.</p>
      <div class="fs-list" role="tablist" data-reveal style="--i:2">
        ${[["flame", "I/I heat map", "One colour per severity band, with arrows showing which way the water runs."], ["siren", "Blockage Watch", "Early warning before a dry weather spill."], ["fan", "Pump Station Manager", "The wet well drawn to scale, with its live level."], ["bell-ring", "Alarms that reach people", "Sent to the email and mobile your team holds that day."]]
          .map(([ic, t, d], i) => `<button class="fs-item" role="tab" aria-selected="${i === 0}"><span class="card-icon">${icon(ic)}</span><span><b>${t}</b><span>${d}</span></span></button>`).join("")}
      </div>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="${r}flowsense.html">Discover FlowSense ${icon("arrow-right")}</a>
        <a class="btn btn-ghost btn-lg" href="${site.flowsenseUrl}" rel="noopener">Sign in ${icon("arrow-up-right")}</a>
      </div>
    </div>
    ${fsScreen()}
  </div>
</section>

<section class="section alt" id="products">
  <div class="wrap">
    <div class="section-head split">
      <div><p class="eyebrow">Products</p><h2 class="h-lg" data-reveal>One of Australia's largest portfolios of monitoring instruments.</h2></div>
      <div class="rail-nav"><button class="rail-btn" data-rail="brand-rail" data-dir="prev" aria-label="Previous products">${icon("arrow-right")}</button><button class="rail-btn" data-rail="brand-rail" data-dir="next" aria-label="Next products">${icon("arrow-right")}</button></div>
    </div>
    <div class="rail" id="brand-rail">
      ${C.brands.map((b) => `
      <a class="card brand-card" href="${r}products/${b.slug}.html">
        <div class="brand-shot"><img src="${b.cover || b.groups[0].items[0].image}" alt="${esc(b.title)}" loading="lazy" draggable="false"></div>
        <div class="brand-body"><span class="tag">${esc(b.tag)}</span><h3>${esc(b.title)}</h3><p>${esc(b.summary)}</p><span class="link-arrow">View range ${icon("arrow-right")}</span></div>
      </a>`).join("")}
    </div>
  </div>
</section>

<section class="section" id="industries">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Industries</p><h2 class="h-lg" data-reveal>Built for critical infrastructure.</h2>
    <p class="lede" data-reveal style="--i:1">EDS provides the capability, experience and service that clients rely on for critical infrastructure and operational monitoring.</p></div>
    <div class="ind" data-reveal>
      ${C.industries.map(([ic, t, d]) => `<div class="holder"><span class="card-icon">${icon(ic)}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}
    </div>
    <div class="certs" data-reveal>
      <img src="${C.img("ex-logo.gif")}" alt="Ex hazardous area mark" loading="lazy">
      <img src="${C.img("iecex.png")}" alt="IECEx" loading="lazy">
      <p><strong>Certified for hazardous areas.</strong> EDS supplies intrinsically safe equipment certified under ATEX and IECEx, including Zone 0 instruments for sewer environments.</p>
    </div>
  </div>
</section>

<section class="section alt" id="about">
  <div class="wrap split">
    <div>
      <p class="eyebrow">Since 1991</p>
      <h2 class="h-lg" data-reveal>Australian owned. Family founded. Still measuring.</h2>
      <div class="timeline">
        <span class="timeline-fill"></span>
        ${C.about.timeline.filter((_, i) => [2, 3, 5, 7].includes(i)).map(([when, t, d]) => `<div class="tl" data-reveal><time>${when}</time><i></i><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}
      </div>
      <a class="link-arrow" href="${r}about.html" style="margin-top:18px">The EDS story ${icon("arrow-right")}</a>
    </div>
    <figure class="quote" data-reveal="right" style="margin:0">
      ${icon("quote", false)}
      <blockquote>${C.about.quote.text}</blockquote>
      <cite><b>${C.about.quote.who}</b>, ${C.about.quote.org}</cite>
    </figure>
  </div>
</section>

<section class="section dark" id="offices">
  <div class="wrap aus">
    <svg id="ausmap" data-offices='${JSON.stringify(C.offices)}' role="group" aria-label="Map of Australia showing EDS offices" data-reveal="scale"></svg>
    <div>
      <p class="eyebrow">Nationwide</p>
      <h2 class="h-lg" data-reveal>Five offices. One number.</h2>
      <p class="lede" data-reveal style="--i:1;margin-bottom:26px">Crews and support across the country. Call <a href="${site.phoneHref}" style="color:var(--aqua);font-weight:600;white-space:nowrap">${site.phone}</a> from anywhere in Australia.</p>
      <div class="office-list">
        ${C.offices.map((o) => `<button class="office"><span class="card-icon">${icon("map-pin")}</span><span><b>${o.city}</b><span>${o.note}</span></span><em>${o.state}</em></button>`).join("")}
      </div>
    </div>
  </div>
</section>

<section class="section" id="papers">
  <div class="wrap">
    <div class="section-head split">
      <div><p class="eyebrow">White papers</p><h2 class="h-lg" data-reveal>What the data has taught us.</h2></div>
      <a class="btn btn-outline" href="${r}resources.html">All resources ${icon("arrow-right")}</a>
    </div>
    <div class="grid c3">
      ${C.papers.map((p, n) => `
      <a class="card paper tilt" href="${p.href}" rel="noopener" data-reveal style="--i:${n}">
        <div class="paper-top"><span class="card-icon">${icon("file-text")}</span><span class="tag">${p.date}</span></div>
        <div class="paper-body"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><span class="link-arrow">Read the paper ${icon("arrow-up-right")}</span></div>
      </a>`).join("")}
    </div>
  </div>
</section>

${ctaSection(r)}`;
  },
});

/* ---- services ---- */
add({
  file: "services/index.html",
  title: "Services | EDS",
  description: `${C.services.length} services from EDS: sewer flow and I&I monitoring, blockage alarms, water quality, sampling, rainfall, pump stations, SCADA integration, data analysis, calibration and more.`,
  current: "services",
  body: (r) => `
${pageHero(r, { crumbs: [["Services"]], eyebrow: "Services", title: "Specialised services for water and wastewater networks.", lede: "From a single audit to a national monitoring program, delivered by trained crews in every state.", actions: `<div class="chips">${C.serviceGroups.map((g) => `<a class="chip" href="#${g.id}">${esc(g.title)}</a>`).join("")}</div>` })}
${C.serviceGroups.map((g, gi) => `
<section class="section${gi % 2 ? " alt" : ""}" id="${g.id}"><div class="wrap">
  <div class="section-head"><p class="eyebrow">${esc(g.title)}</p><h2 class="h-lg" data-reveal>${esc(g.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(g.lede)}</p></div>
  <div class="grid c3">
    ${C.services.filter((s) => s.group === g.id).map((s, n) => cardLink(r, { href: `services/${s.slug}.html`, iconName: s.icon, title: s.title, text: s.summary, n })).join("")}
  </div>
</div></section>`).join("")}
${ctaSection(r)}`,
});

const blockHtml = (b) => `
<div class="block" data-reveal>
  <h2 class="h-md">${esc(b.heading)}</h2>
  ${b.items ? `<div class="feature-list">${b.items.map(([t, d]) => `<div class="feature holder">${icon("circle-check")}<div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>` : ""}
  ${b.list ? (b.heading.includes("approach") ? `<ol class="steps">${b.list.map((l) => `<li>${esc(l)}</li>`).join("")}</ol>` : `<ul class="checks">${b.list.map((l) => `<li>${icon("check", false)}<span>${esc(l)}</span></li>`).join("")}</ul>`) : ""}
</div>`;

// The sidebar: a contact card, then one card of links per non-empty
// [title, links] section, where each link is [href, label, icon?, external?].
const asideHtml = (r, sections) => `
<aside class="aside">
  <div class="aside-card brand" data-reveal="right">
    <h3>Talk to our team</h3>
    <p>We would welcome the opportunity to discuss your requirements.</p>
    <a class="btn btn-primary" href="${r}contact.html">Enquire now ${icon("arrow-right")}</a>
    <a class="btn btn-ghost" href="${site.phoneHref}" style="margin-left:6px">${icon("phone")} ${site.phone}</a>
  </div>
  ${sections.filter(([, links]) => links.length).map(([title, links], i) => `<div class="aside-card" data-reveal="right" style="--i:${i + 1}"><h3>${title}</h3><ul class="aside-links">${links.map(([href, label, ic = "arrow-right", ext]) => `<li><a href="${href}"${ext ? ' rel="noopener"' : ""}>${esc(label)}${icon(ic)}</a></li>`).join("")}</ul></div>`).join("")}
</aside>`;
const svcLinks = (r, slugs = []) => slugs.map((slug) => [`${r}services/${slug}.html`, svc(slug).short || svc(slug).title]);
const solLinks = (r, slugs = []) => slugs.map((slug) => [`${r}solutions/${slug}.html`, sol(slug).title]);
const brandLinks = (r, slugs = []) => slugs.map((slug) => [`${r}products/${slug}.html`, brand(slug).title]);
const paperLinks = (ids = []) => ids.map((id) => { const p = C.papers.find((x) => x.id === id); return [p.href, p.title, "download", true]; });

for (const s of C.services) {
  add({
    file: `services/${s.slug}.html`,
    title: `${s.title} | EDS`,
    description: s.summary,
    current: "services",
    scripts: { lab: ["lab.js"], lidott: ["widgets.js"] }[s.widget] || [],
    body: (r) => `
${pageHero(r, { crumbs: [["Services", "services/index.html"], [s.short || s.title]], iconName: s.icon, title: s.title, lede: s.summary, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${r}contact.html">Enquire now ${icon("arrow-right")}</a>${s.widget === "lab" ? `<a class="btn btn-ghost btn-lg" href="#flow-lab">${icon("cloud-rain")} Try the flow lab</a>` : ""}${s.widget === "lidott" ? `<a class="btn btn-ghost btn-lg" href="#alarm-demo">${icon("bell")} Try the alarm</a>` : ""}` })}
<section class="section"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${s.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    ${s.blocks.length ? `<div style="margin-top:clamp(40px,5vw,64px)">${s.blocks.map(blockHtml).join("")}</div>` : ""}
    ${s.compare ? `<div class="block" data-reveal><h2 class="h-md">${s.compare.heading}</h2><table class="compare"><thead><tr><th></th><th>${s.compare.left}</th><th>${s.compare.right}</th></tr></thead><tbody>${s.compare.rows.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
    ${s.quote ? `<figure class="quote" data-reveal style="margin:clamp(40px,5vw,64px) 0 0">${icon("quote", false)}<blockquote>${esc(s.quote.text)}</blockquote></figure>` : ""}
  </div>
  ${asideHtml(r, [["Related services", svcLinks(r, s.related)], ["Related solutions", solLinks(r, s.solutions)], ["Products we use", brandLinks(r, s.products)], ["White papers", paperLinks(s.papers)]])}
</div></section>
${s.widget === "lab" ? labSection({ eyebrow: "Try it", title: s.slug.startsWith("inflow") ? "Watch inflow and infiltration happen." : "What the flow meter sees in a storm." }) : ""}
${s.widget === "lidott" ? `<section class="section dark" id="alarm-demo"><div class="wrap"><div class="section-head"><p class="eyebrow">Try it</p><h2 class="h-lg" data-reveal>Raise the water. Watch the alarm.</h2></div>${lidottDemo()}</div></section>` : ""}
${ctaSection(r)}`,
  });
}

/* ---- solutions ---- */
add({
  file: "solutions/index.html",
  title: "Solutions | EDS",
  description: "Structure performance monitoring, asset and network assessment, thermal monitoring, wastewater monitoring, automatic sampling and environmental monitoring.",
  current: "solutions",
  body: (r) => `
${pageHero(r, { crumbs: [["Solutions"]], eyebrow: "Solutions", title: "Monitoring applied to the problem in front of you.", lede: "Each solution combines EDS instruments, field crews and data into an outcome you can act on." })}
<section class="section"><div class="wrap"><div class="grid c3">
  ${C.solutions.map((s, n) => cardLink(r, { href: `solutions/${s.slug}.html`, iconName: s.icon, title: s.title, text: s.summary, n })).join("")}
</div></div></section>
${ctaSection(r)}`,
});
for (const s of C.solutions) {
  add({
    file: `solutions/${s.slug}.html`,
    title: `${s.title} | EDS`,
    description: s.summary,
    current: "solutions",
    scripts: s.widget === "eas" ? ["widgets.js"] : [],
    body: (r) => `
${pageHero(r, { crumbs: [["Solutions", "solutions/index.html"], [s.title]], iconName: s.icon, title: s.title, lede: s.summary, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${r}contact.html">Enquire now ${icon("arrow-right")}</a>` })}
<section class="section"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${s.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    ${(s.blocks || []).length ? `<div style="margin-top:clamp(40px,5vw,64px)">${s.blocks.map(blockHtml).join("")}</div>` : ""}
  </div>
  ${asideHtml(r, [["Related solutions", solLinks(r, s.related)], ["Related services", svcLinks(r, C.services.filter((x) => x.solutions?.includes(s.slug)).map((x) => x.slug))], ["Products we use", brandLinks(r, s.productLinks)]])}
</div></section>
${s.widget === "eas" ? `<section class="section dark"><div class="wrap"><div class="section-head"><p class="eyebrow">EDS Asset Score</p><h2 class="h-lg" data-reveal>One score, watched around the clock.</h2></div>${easDemo()}</div></section>` : ""}
${ctaSection(r)}`,
  });
}

/* ---- products ---- */
add({
  file: "products/index.html",
  title: "Products | EDS",
  description: "EDS manufactures and represents leading instruments for water supply, wastewater, flow monitoring and process control: EDS, Detectronic, ORI, Hach Flow, Beadedstream, MicroLevel, Aquamonitrix and Dynaflox.",
  current: "products",
  body: (r) => `
${pageHero(r, { crumbs: [["Products"]], eyebrow: "Products", title: "Industry leading instruments, backed by people who use them.", lede: "EDS is a manufacturer, and represents leading manufacturers, in water supply and management, wastewater management, flow monitoring and process control." })}
<section class="section"><div class="wrap"><div class="grid c4">
  ${C.brands.map((b, n) => `
  <a class="card brand-card tilt" href="${r}products/${b.slug}.html" data-reveal style="width:auto;--i:${n % 4}">
    <div class="brand-shot"><img src="${b.cover || b.groups[0].items[0].image}" alt="${esc(b.title)}" loading="lazy"></div>
    <div class="brand-body"><span class="tag">${esc(b.tag)}</span><h3>${esc(b.title)}</h3><p>${esc(b.summary)}</p><span class="link-arrow">View range ${icon("arrow-right")}</span></div>
  </a>`).join("")}
</div></div></section>
<section class="section alt"><div class="wrap split" style="align-items:center">
  <div><p class="eyebrow">Featured</p><h2 class="h-lg" data-reveal>LIDoTT Alarm</h2><p class="lede" data-reveal style="--i:1;margin-top:16px">${C.lidott.lede} Radar level sensor, battery, modem and aerial in one compact, Zone 0 certified device.</p>
  <div class="hero-actions"><a class="btn btn-brand btn-lg" href="${r}products/lidott-alarm.html">See how it works ${icon("arrow-right")}</a></div></div>
  <div class="brand-shot" style="border:1px solid var(--border);border-radius:24px;aspect-ratio:1" data-reveal="right"><img src="${C.lidott.image}" alt="LIDoTT Alarm" loading="lazy"></div>
</div></section>
${ctaSection(r, { title: "Need help choosing an instrument?", lede: "Our team has installed, serviced and calibrated all of them. Ask us which suits your application." })}`,
});

// "PDF", "ZIP": shown in the Documents panel so people know what they will get.
const docType = (href) => href.split(".").pop().toUpperCase();
const prodDocs = (p) => `<ul class="prod-docs">${p.docs.map((d) => `<li><a href="${d.href}" rel="noopener">${icon("download")}<span>${esc(d.label)}</span></a></li>`).join("")}</ul>`;

for (const b of C.brands) {
  // Brand-wide documents first, then each product's, named after the product.
  const docs = [
    ...(b.docs || []).map((d) => ({ title: d.label, meta: docType(d.href), href: d.href })),
    ...b.groups.flatMap((g) => g.items.flatMap((p) => (p.docs || []).map((d) => ({ title: p.name, meta: `${d.label} · ${docType(d.href)}`, href: d.href })))),
  ];
  add({
    file: `products/${b.slug}.html`,
    title: `${b.title} | EDS Products`,
    description: b.summary,
    current: "products",
    body: (r) => `
${pageHero(r, { crumbs: [["Products", "products/index.html"], [b.name]], iconName: b.icon, eyebrow: b.tag, title: b.title, lede: b.summary, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${r}contact.html">Request pricing ${icon("arrow-right")}</a>` })}
<section class="section"><div class="wrap split">
  <div class="prose" data-reveal>${b.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  <aside class="aside">
    ${b.logo ? `<div class="aside-card" data-reveal="right" style="display:grid;place-items:center;padding:32px"><img src="${b.logo}" alt="${esc(b.name)} logo" style="max-height:70px" loading="lazy"></div>` : ""}
    <div class="aside-card brand" data-reveal="right"><h3>Request pricing</h3><p>Sales, hire and service from EDS, Australia wide.</p><a class="btn btn-primary" href="${r}contact.html">Enquire now ${icon("arrow-right")}</a></div>
    ${docs.length
      ? `<div class="aside-card" data-reveal="right"><h3>Documents</h3><ul class="aside-links docs">${docs.map((d) => `<li><a href="${d.href}" rel="noopener"><span>${esc(d.title)}<small>${esc(d.meta)}</small></span>${icon("download")}</a></li>`).join("")}</ul></div>`
      : `<div class="aside-card" data-reveal="right"><h3>Datasheets and manuals</h3><p>Ask us for the datasheet, manual or software for any ${esc(b.name)} product.</p><a class="link-arrow" href="mailto:${site.sales}?subject=${encodeURIComponent(`${b.name} datasheet request`)}">Request a datasheet ${icon("arrow-right")}</a></div>`}
  </aside>
</div></section>
<section class="section alt"><div class="wrap">
  ${b.groups.map((g) => `
  <div class="block">
    <h2 class="h-md" data-reveal>${esc(g.name)}</h2>
    <div class="prod-grid">
      ${g.items.map((p, n) => {
        // A card that links to its own page carries its documents there, since links cannot nest.
        const inner = `<div class="brand-shot"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy"></div><div class="prod-body"><h3>${esc(p.name)}</h3>${p.note ? `<p>${esc(p.note)}</p>` : ""}${p.docs && !p.href ? prodDocs(p) : ""}</div>`;
        return p.href ? `<a class="card prod" href="${r}${p.href}" data-reveal style="--i:${n % 5}">${inner}</a>` : `<div class="card prod hoverable" data-reveal style="--i:${n % 5}">${inner}</div>`;
      }).join("")}
    </div>
  </div>`).join("")}
</div></section>
${ctaSection(r, { title: `Ask us about ${b.name}.`, lede: "Pricing, availability, hire and technical advice from the EDS team." })}`,
  });
}

add({
  file: "products/lidott-alarm.html",
  title: "LIDoTT Alarm by Detectronic | EDS",
  description: "Self contained radar water level measurement and alarm device. ATEX and IECEx Zone 0 certified, measures up to 8.4 m, battery life up to 7 years.",
  current: "products",
  scripts: ["widgets.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["Products", "products/index.html"], ["Detectronic", "products/detectronic.html"], ["LIDoTT Alarm"]], iconName: "bell", eyebrow: "Detectronic", title: "LIDoTT Alarm", lede: C.lidott.lede, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${r}contact.html">Request pricing ${icon("arrow-right")}</a><a class="btn btn-ghost btn-lg" href="${C.lidott.datasheet}" rel="noopener">${icon("download")} Datasheet</a>` })}
<section class="section dark" style="padding-top:0"><div class="wrap">
  <div class="hl-grid" style="margin-bottom:clamp(40px,5vw,64px)">${C.lidott.highlights.map(([ic, t, d], i) => `<div class="hl holder" data-reveal style="--i:${i % 3}">${icon(ic)}<b>${t}</b><span>${d}</span></div>`).join("")}</div>
  <div class="section-head"><p class="eyebrow">See it work</p><h2 class="h-lg" data-reveal>Raise the water. Watch the alarm.</h2></div>
  ${lidottDemo()}
</div></section>
<section class="section"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${C.lidott.description.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="feature-list" style="margin-top:40px">${C.lidott.sections.map(([t, d]) => `<div class="feature holder" data-reveal>${icon("circle-check")}<div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>
  </div>
  <aside class="aside">
    <div class="aside-card" data-reveal="right" style="padding:20px"><img src="${C.lidott.image}" alt="LIDoTT Alarm device" loading="lazy" style="margin-inline:auto;max-height:300px"></div>
    <div class="aside-card" data-reveal="right"><h3>Specifications</h3><table class="specs"><tbody>${C.lidott.specs.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</tbody></table></div>
  </aside>
</div></section>
${ctaSection(r, { title: "Deploy LIDoTT Alarm across your network.", lede: "Simple to install and zero maintenance by design. Ask EDS for pricing and a deployment plan." })}`,
});

/* ---- FlowSense ---- */
add({
  file: "flowsense.html",
  title: "EDS FlowSense | Sewer network intelligence",
  description: "EDS FlowSense: sewer network monitoring, flow analytics and engineering intelligence by Environmental Data Services.",
  current: "flowsense",
  body: (r) => `
${pageHero(r, { crumbs: [["FlowSense"]], iconName: "waves", eyebrow: "EDS FlowSense", title: "Sewer network intelligence.", lede: C.flowsense.lede, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${site.flowsenseUrl}" rel="noopener">Open FlowSense ${icon("arrow-up-right")}</a><a class="btn btn-ghost btn-lg" href="${r}contact.html">Request a walkthrough</a>` })}
<section class="section fs-band"><div class="wrap fs-grid">
  <div>
    <p class="eyebrow">Inside the platform</p>
    <h2 class="h-lg" data-reveal>From a reading in a manhole to a decision.</h2>
    <div class="fs-list" role="tablist" data-reveal style="--i:1">
      ${[["flame", "I/I heat map", "One colour per severity band, with arrows showing which way the water runs."], ["siren", "Blockage Watch", "Early warning before a dry weather spill."], ["fan", "Pump Station Manager", "The wet well drawn to scale, with its live level."], ["bell-ring", "Alarms that reach people", "Sent to the email and mobile your team holds that day."]]
        .map(([ic, t, d], i) => `<button class="fs-item" role="tab" aria-selected="${i === 0}"><span class="card-icon">${icon(ic)}</span><span><b>${t}</b><span>${d}</span></span></button>`).join("")}
    </div>
  </div>
  ${fsScreen()}
</div></section>
<section class="section"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Capabilities</p><h2 class="h-lg" data-reveal>Everything your network is telling you.</h2></div>
  <div class="grid c3">
    ${C.flowsense.features.map(([ic, t, d], n) => `<div class="card hoverable holder" data-reveal style="--i:${n % 3}"><span class="card-icon">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}
  </div>
</div></section>
${ctaSection(r, { title: "See FlowSense on your own network.", lede: "FlowSense comes with EDS monitoring. Ask us for a walkthrough using your sites." })}`,
});

/* ---- about ---- */
add({
  file: "about.html",
  title: "About EDS | Environmental Data Services",
  description: "EDS is an Australian owned and operated company, a market leader in equipment and services for the water and wastewater industry since 1991.",
  current: "about",
  scripts: ["widgets.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["About"]], eyebrow: "About EDS", title: "Australian owned and operated since 1991.", lede: "Scientists, engineers and technicians who excel in every facet of environmental monitoring and project delivery." })}
<section class="section"><div class="wrap split">
  <div class="prose" data-reveal>${C.about.intro.map((p) => `<p>${esc(p)}</p>`).join("")}<h2>Our mission</h2>${C.about.mission.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  <aside class="aside">
    <figure class="quote" data-reveal="right" style="margin:0">${icon("quote", false)}<blockquote style="font-size:1.25rem">${C.about.quote.text}</blockquote><cite><b>${C.about.quote.who}</b>, ${C.about.quote.org}</cite></figure>
  </aside>
</div></section>
<section class="section alt"><div class="wrap">
  <div class="section-head"><p class="eyebrow">EDS origins</p><h2 class="h-lg" data-reveal>Founded by Graham and Cynthia Harper.</h2>
  <p class="lede" data-reveal style="--i:1">EDS began in Queensland in 1991, following Graham's success with Elpro, and alongside the release of the Pump Station Manager.</p></div>
  <div class="timeline">
    <span class="timeline-fill"></span>
    ${C.about.timeline.map(([when, t, d]) => `<div class="tl" data-reveal><time>${when}</time><i></i><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}
  </div>
  <figure class="quote" data-reveal style="margin:48px 0 0">${icon("quote", false)}<blockquote>${C.about.founder.text}</blockquote><cite><b>${C.about.founder.name}</b>, ${C.about.founder.role}</cite></figure>
</div></section>
<section class="section dark"><div class="wrap aus">
  <svg id="ausmap" data-offices='${JSON.stringify(C.offices)}' role="group" aria-label="Map of Australia showing EDS offices" data-reveal="scale"></svg>
  <div><p class="eyebrow">Nationwide</p><h2 class="h-lg" data-reveal>Five offices across Australia.</h2>
  <div class="office-list" style="margin-top:26px">${C.offices.map((o) => `<button class="office"><span class="card-icon">${icon("map-pin")}</span><span><b>${o.city}</b><span>${o.note}</span></span><em>${o.state}</em></button>`).join("")}</div></div>
</div></section>
${ctaSection(r)}`,
});

/* ---- resources ---- */
add({
  file: "resources.html",
  title: "Resources | EDS white papers, downloads and manuals",
  description: "EDS white papers on inflow and infiltration, plus software, drivers, datasheets and selection guides.",
  current: "resources",
  body: (r) => `
${pageHero(r, { crumbs: [["Resources"]], eyebrow: "Resources", title: "White papers, downloads and support.", lede: "What we have learned in the field, and the files you need to keep instruments running." })}
<section class="section"><div class="wrap">
  <div class="section-head"><p class="eyebrow">White papers</p><h2 class="h-lg" data-reveal>EDS publications</h2></div>
  <div class="grid c3">
    ${C.papers.map((p, n) => `
    <a class="card paper tilt" href="${p.href}" rel="noopener" data-reveal style="--i:${n}">
      <div class="paper-top"><span class="card-icon">${icon("file-text")}</span><span class="tag">${p.date}</span></div>
      <div class="paper-body"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><span class="link-arrow">Read the paper ${icon("arrow-up-right")}</span></div>
    </a>`).join("")}
  </div>
</div></section>
<section class="section alt"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Downloads and manuals</p><h2 class="h-lg" data-reveal>Software, drivers and datasheets</h2></div>
  <div class="grid c2">
    ${C.downloads.map((g) => `
    <div data-reveal>
      <h3 class="h-md" style="font-size:1.3rem;margin-bottom:16px">${g.group}</h3>
      <ul class="doc-list">${g.items.map(([label, href]) => `<li><a href="${href}" rel="noopener"><span class="card-icon">${icon(g.icon)}</span><span>${esc(label)}</span>${icon("download")}</a></li>`).join("")}</ul>
      ${g.note ? `<p class="note" style="margin-top:14px;font-size:.9rem">${g.note}</p>` : ""}
    </div>`).join("")}
  </div>
</div></section>
<section class="section"><div class="wrap"><div class="grid c3">
  <a class="card" href="${r}contact.html" data-reveal><span class="card-icon">${icon("lock")}</span><h3>Software passwords and RMA forms</h3><p>Request a software password, an EDS or Hach Marsh RMA form, or EDS safety policies and procedures.</p><span class="link-arrow">Contact service ${icon("arrow-right")}</span></a>
  <a class="card" href="${site.remoteDataUrl}" rel="noopener" data-reveal style="--i:1"><span class="card-icon">${icon("globe")}</span><h3>Remote data access</h3><p>Sign in to DetectData to view data from your Detectronic instruments.</p><span class="link-arrow">Open DetectData ${icon("arrow-up-right")}</span></a>
  <a class="card" href="https://earth.nullschool.net/" rel="noopener" data-reveal style="--i:2"><span class="card-icon">${icon("wind")}</span><h3>Wind and ocean currents</h3><p>View real time ocean and wind currents across the world's oceans.</p><span class="link-arrow">Open the live map ${icon("arrow-up-right")}</span></a>
</div></div></section>
${ctaSection(r, { title: "Cannot find a manual or driver?", lede: "Our service department will send you what you need." })}`,
});

/* ---- contact ---- */
add({
  file: "contact.html",
  title: "Contact EDS | 1300 721 683",
  description: "Contact Environmental Data Services. Head office at Meadowbrook, Queensland, with offices in New South Wales, Victoria, South Australia and Western Australia.",
  current: "contact",
  scripts: ["widgets.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["Contact"]], eyebrow: "Contact", title: "Call or visit. We would like to hear about your project.", lede: `${site.hours}. One number for every state: ${site.phone}.` })}
<section class="section"><div class="wrap contact-grid">
  <div class="contact-cards">
    <a class="contact-card" href="${site.phoneHref}" data-reveal><span class="card-icon">${icon("phone")}</span><span><b>${site.phone}</b><span>General enquiries, customer service, service department and sales</span></span></a>
    <a class="contact-card" href="mailto:${site.email}" data-reveal><span class="card-icon">${icon("mail")}</span><span><b>${site.email}</b><span>Enquiries</span></span></a>
    <a class="contact-card" href="mailto:${site.sales}" data-reveal><span class="card-icon">${icon("mail")}</span><span><b>${site.sales}</b><span>Sales</span></span></a>
    <a class="contact-card" href="mailto:${site.service}" data-reveal><span class="card-icon">${icon("mail")}</span><span><b>${site.service}</b><span>Service</span></span></a>
    <a class="contact-card" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("13/20-22 Ellerslie Road, Meadowbrook QLD 4131")}" rel="noopener" data-reveal><span class="card-icon">${icon("map-pin")}</span><span><b>Head office</b><span>${site.address.join(", ")}</span></span></a>
    <div class="contact-card" data-reveal><span class="card-icon">${icon("clock", false)}</span><span><b>Opening hours</b><span>${site.hours}. Closed Saturday and Sunday.</span></span></div>
  </div>
  <form class="form" data-mailto="${site.email}" data-track="Enquiry form" data-reveal="right">
    <h2>Send an enquiry</h2>
    <div class="field-row">
      <label class="field">Name<input name="Name" autocomplete="name" required></label>
      <label class="field">Organisation<input name="Organisation" autocomplete="organization"></label>
    </div>
    <div class="field-row">
      <label class="field">Email<input name="Email" type="email" autocomplete="email" required></label>
      <label class="field">Phone<input name="Phone" type="tel" autocomplete="tel"></label>
    </div>
    <label class="field">I am interested in<select name="subject"><option>General enquiry</option>${C.services.map((s) => `<option>${esc(s.title)}</option>`).join("")}<option>Product pricing</option><option>Equipment service or calibration</option><option>EDS FlowSense</option></select></label>
    <label class="field">Message<textarea name="Message" required></textarea></label>
    <button class="btn btn-primary btn-lg" type="submit" style="justify-self:start">${icon("send")} Open email to send</button>
    <p class="note">This opens your email program with the enquiry filled in, addressed to ${site.email}.</p>
  </form>
</div></section>
<section class="section dark"><div class="wrap aus">
  <svg id="ausmap" data-offices='${JSON.stringify(C.offices)}' role="group" aria-label="Map of Australia showing EDS offices" data-reveal="scale"></svg>
  <div><p class="eyebrow">Office locations</p><h2 class="h-lg" data-reveal>Find us in five states.</h2>
  <div class="office-list" style="margin-top:26px">${C.offices.map((o) => `<button class="office"><span class="card-icon">${icon("map-pin")}</span><span><b>${o.city}</b><span>${o.note}</span></span><em>${o.state}</em></button>`).join("")}</div></div>
</div></section>`,
});

/* ---- not found ---- */
add({
  file: "404.html",
  title: "Page not found | EDS",
  description: "This page could not be found.",
  current: "",
  body: (r) => `
${pageHero(r, { crumbs: [["Page not found"]], iconName: "waves", eyebrow: "Error 404", title: "This pipe leads nowhere.", lede: "The page you were looking for has moved or no longer exists. Try one of these instead.", actions: `<a class="btn btn-primary btn-lg" href="${r}index.html">Back to home ${icon("arrow-right")}</a><a class="btn btn-ghost btn-lg" href="${r}services/index.html">Services</a><a class="btn btn-ghost btn-lg" href="${r}products/index.html">Products</a><a class="btn btn-ghost btn-lg" href="${r}contact.html">Contact</a>` })}`,
});

/* ---- privacy ---- */
const privacy = (await readFile(path.join(ROOT, "content/privacy.txt"), "utf8")).split("\n").map((l) => l.trim()).filter(Boolean);
add({
  file: "privacy.html",
  title: "Privacy policy | EDS",
  description: "EDS privacy policy and statement.",
  current: "",
  body: (r) => `
${pageHero(r, { crumbs: [["Privacy policy"]], title: "EDS Privacy Policy & Statement", lede: privacy[1] })}
<section class="section"><div class="wrap"><div class="legal">
  ${privacy.slice(2).map((l) => (/^\d+\.\s/.test(l) && l.length < 90 ? `<h2>${esc(l)}</h2>` : `<p>${esc(l)}</p>`)).join("\n")}
</div></div></section>`,
});

/* ------------------------------------------------------------------ */
/* write                                                               */
/* ------------------------------------------------------------------ */
icon("fan"); // fsScreen() reuses the fan glyph, so make sure it is cached
await rm(DIST, { recursive: true, force: true });
await mkdir(path.join(DIST, "assets/fonts"), { recursive: true });
await cp(path.join(ROOT, "src/css"), path.join(DIST, "assets/css"), { recursive: true });
await cp(path.join(ROOT, "src/js"), path.join(DIST, "assets/js"), { recursive: true });
await cp(path.join(ROOT, "src/assets/img"), path.join(DIST, "assets/img"), { recursive: true });
for (const [pkg, f] of [["inter", "inter-latin-wght-normal.woff2"], ["inter-tight", "inter-tight-latin-wght-normal.woff2"]]) {
  await cp(path.join(ROOT, `node_modules/@fontsource-variable/${pkg}/files/${f}`), path.join(DIST, "assets/fonts", f));
}
await writeFile(
  path.join(DIST, "assets/favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0c5f59"/><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M12 24q6.7 6 13.3 0t13.4 0 13.3 0"/><path d="M12 40q6.7 6 13.3 0t13.4 0 13.3 0"/></g></svg>`
);
for (const p of pages) {
  const out = path.join(DIST, p.file);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, layout(p));
}
console.log(`Built ${pages.length} pages into dist/`);
