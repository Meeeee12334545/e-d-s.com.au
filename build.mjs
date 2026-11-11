// Static site generator for the EDS website. No framework: content comes from
// src/data/content.mjs, pages are template strings, output goes to dist/.
//   npm run build   -> writes dist/
//   npm run dev     -> builds, then runs the site server (server/) on http://localhost:4173
import { mkdir, readFile, writeFile, rm, cp } from "node:fs/promises";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as C from "./src/data/content.mjs";
import { diagram, efDefs, efSensor, efSection, efBeam } from "./diagrams.mjs";

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
  "arrow-right": "nudge-x", "arrow-up-right": "nudge-xy", "arrow-down": "nudge-y", send: "nudge-xy", download: "nudge-y",
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
// The address pages are published at. Preview builds set SITE_URL so their
// share cards and canonical links point at the preview copy.
const SITE_URL = (process.env.SITE_URL || site.url).replace(/\/+$/, "");
const pageUrl = (file) => `${SITE_URL}/${file === "index.html" ? "" : file}`;

// The stylesheet and scripts are addressed with a hash of their contents, so
// a browser holding yesterday's copy fetches today's along with the new pages
// rather than laying them out with old rules.
const versions = new Map();
const asset = (r, file) => {
  if (!versions.has(file)) versions.set(file, createHash("sha1").update(readFileSync(path.join(ROOT, "src", file))).digest("hex").slice(0, 8));
  return `${r}assets/${file}?v=${versions.get(file)}`;
};

const slugify = (s) => String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const typeOf = (id) => C.productTypes.find((t) => t.id === id);
// Every product, flattened, with the brand and range it belongs to. A few
// groups are headed with a prompt ("Select your technology") rather than a
// name, so those products have no `range` to show.
const NAMELESS = new Set(["Select your technology", "Product range", "The analyser"]);
const products = C.brands.flatMap((b) => b.groups.flatMap((g) => g.items.map((p) => ({ ...p, id: slugify(p.name), brand: b, group: g.name, range: NAMELESS.has(g.name) ? "" : g.name }))));

// Links to the enquiry form with the topic (and product, and way of working)
// already chosen. The form reads ?topic=, ?product= and ?mode= in site.js.
// It has a page of its own, enquire.html, and is also on contact.html, whose
// own cards pass that `file` so they choose their topic in place.
const contactHref = (r, { topic, product, mode } = {}, file = "enquire.html") => {
  const q = new URLSearchParams();
  if (topic) q.set("topic", topic);
  if (product) q.set("product", product);
  if (mode) q.set("mode", mode);
  const qs = q.toString();
  return `${r}${file}${qs ? `?${esc(qs)}` : ""}`;
};

// Photographs. tools/photos.py writes each one to src/assets/img/photos as
// <name>-<width>x<height>.jpg with a WebP twin, at two widths, so the browser
// can take the smaller one on a phone. The width and height attributes hold
// the photo's space on the page before it loads.
const PHOTOS = {};
for (const f of readdirSync(path.join(ROOT, "src/assets/img/photos"))) {
  const m = f.match(/^(.+)-(\d+)x(\d+)\.jpg$/);
  if (m) (PHOTOS[m[1]] ||= []).push({ w: +m[2], h: +m[3] });
}
for (const list of Object.values(PHOTOS)) list.sort((a, b) => b.w - a.w);
// `sizes` is how wide the photo is laid out, so the browser can choose a width.
function photo(name, alt, { sizes = "(max-width: 980px) calc(100vw - 40px), 740px" } = {}) {
  const v = PHOTOS[name];
  if (!v) throw new Error(`No photo named "${name}" in src/assets/img/photos (see tools/photos.py)`);
  const set = (ext) => v.map((s) => `@root/assets/img/photos/${name}-${s.w}x${s.h}.${ext} ${s.w}w`).join(", ");
  const [big] = v;
  return `<picture><source type="image/webp" srcset="${set("webp")}" sizes="${sizes}"><img src="@root/assets/img/photos/${name}-${big.w}x${big.h}.jpg" srcset="${set("jpg")}" sizes="${sizes}" width="${big.w}" height="${big.h}" alt="${esc(alt)}" loading="lazy" decoding="async"></picture>`;
}
// A captioned photograph: { photo, alt, caption }. Every photo is shown in
// the same 3:2 frame with the same grade (site.css); `pos` says which part
// to keep when the crop bites ("50% 20%" favours the top), and `plain: true`
// is for a drawing, shown whole and in its own colours. A panorama under a
// page's opening text (`cls: "pano"`, overviewHtml()) is shown whole too.
const photoFigure = (f, { i, sizes, cls = "" } = {}) => `
<figure class="photo${f.plain ? " photo-plain" : ""}${cls ? ` ${cls}` : ""}" data-reveal${i != null ? ` style="--i:${i}"` : ""}>
  <div class="photo-frame"${f.pos ? ` style="--pos:${esc(f.pos)}"` : ""}>${photo(f.photo, f.alt, { sizes })}</div>
  ${f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : ""}
</figure>`;
// FlowSense screens. tools/flowsense_screens.py lifts them out of the
// brochures into src/assets/img/flowsense as <name>-<w>x<h>.jpg with a WebP
// twin, at one or two widths, laid out like the photographs above. Shown
// in their own colours: they are the platform, not a photograph.
const SHOTS = {};
for (const f of readdirSync(path.join(ROOT, "src/assets/img/flowsense"))) {
  const m = f.match(/^(.+)-(\d+)x(\d+)\.jpg$/);
  if (m) (SHOTS[m[1]] ||= []).push({ w: +m[2], h: +m[3] });
}
for (const list of Object.values(SHOTS)) list.sort((a, b) => b.w - a.w);
function shot(name, alt, { sizes = "(max-width: 980px) calc(100vw - 40px), 700px", eager = false } = {}) {
  const v = SHOTS[name];
  if (!v) throw new Error(`No FlowSense screen named "${name}" in src/assets/img/flowsense (see tools/flowsense_screens.py)`);
  const set = (ext) => v.map((s) => `@root/assets/img/flowsense/${name}-${s.w}x${s.h}.${ext} ${s.w}w`).join(", ");
  const [big] = v;
  return `<picture><source type="image/webp" srcset="${set("webp")}" sizes="${sizes}"><img src="@root/assets/img/flowsense/${name}-${big.w}x${big.h}.jpg" srcset="${set("jpg")}" sizes="${sizes}" width="${big.w}" height="${big.h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></picture>`;
}
// A FlowSense screen on a service page, captioned like a photograph:
// { name, alt, caption }. `tall` keeps the top of a long screen (a report)
// in a portrait frame and fades it out at the foot.
const screenFigure = (f, { tall = false, sizes } = {}) => `
<figure class="screen${tall ? " tall" : ""}" data-reveal>
  <div class="fs-frame">${shot(f.name, f.alt, { sizes })}</div>
  ${f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : ""}
</figure>`;
// Client marks at one optical weight. Each PNG's own proportions give its
// height (equal ink area: a square mark taller, a wide wordmark shorter), so
// a roundel and a wordmark carry the same weight in the grid (--h, site.css).
const pngSize = (file) => { const b = readFileSync(path.join(ROOT, "src", file)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const logoHeight = (src) => { const { w, h } = pngSize(src.replace("@root/", "")); return Math.max(24, Math.min(46, Math.round(Math.sqrt(3400 / (w / h))))); };
const logoGrid = () => `<ul class="logo-grid" aria-label="Clients">${C.clients.map((c, i) => `<li data-reveal style="--i:${i % 5};--h:${logoHeight(c.src)}px"><img src="${c.src}" alt="${esc(c.name)}" loading="lazy"></li>`).join("")}</ul>`;
// Four statements at one weight: the home page's proof row (C.proof).
const proofRow = () => `<div class="proof-row">${C.proof.map((p, i) => `<div data-reveal style="--i:${i}"><b>${esc(p.lead)}</b><span>${esc(p.text)}</span></div>`).join("")}</div>`;
// Two photographs side by side, across the page.
const figureRow = (figs) => `<div class="photo-row">${figs.map((f, i) => photoFigure(f, { i, sizes: "(max-width: 700px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 28px), 612px" })).join("")}</div>`;
// A product shot beside the opening text: { src, alt, caption, w, h }, on a
// tonal plate with its caption under it, like the photographs.
const asideFigure = (s) => (s.asideFigure ? `<figure class="aside-figure" data-reveal><div class="aside-plate"><img src="${s.asideFigure.src}" alt="${esc(s.asideFigure.alt)}" width="${s.asideFigure.w}" height="${s.asideFigure.h}" loading="lazy"></div><figcaption>${esc(s.asideFigure.caption)}</figcaption></figure>` : "");

/* ------------------------------------------------------------------ */
/* layout                                                              */
/* ------------------------------------------------------------------ */
function header(r, current, menuTab, file) {
  // The Services menu holds the services and the solutions: a rail of tabs
  // down its left, one per service group and one for the solutions, and the
  // open tab's links beside it, so only one group is read at a time. It
  // opens on the tab of the page the visitor is on (`menuTab`: a service
  // group's id or "solutions"), or the first. Products has two labelled
  // columns, the ranges and the instruments with a page of their own. Each
  // link carries a one-line description: the service's or solution's
  // summary, the brand's or product's tag.
  const mLink = (i) => `<a href="${r}${i.href}">${icon(i.icon)}<span><b>${esc(i.label)}</b>${i.desc ? `<small>${esc(i.desc)}</small>` : ""}</span></a>`;
  // Services and Products are each a link to the page that lists them all,
  // with a chevron beside it that opens the menu (the menu also opens under
  // the pointer, site.js), so the word can be clicked to go to the page and
  // keyboard and touch visitors still have a button for the menu.
  const navSplit = (label, href, keys) => `<div class="nav-split"><a class="nav-link" href="${r}${href}"${keys.includes(current) ? ' aria-current="page"' : ""}>${label}</a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mega-${label.toLowerCase()}" aria-label="${label} menu">${icon("chevron-down", false)}</button></div>`;
  const tabs = [
    ...C.serviceGroups.map((g) => ({
      id: g.id, label: g.title, lede: g.lede, all: { href: `services/index.html#${g.id}`, label: "All services" },
      items: C.services.filter((s) => s.group === g.id).map((s) => ({ href: `services/${s.slug}.html`, icon: s.icon, label: s.short || s.title, desc: s.summary })),
    })),
    {
      id: "solutions", label: "Solutions", lede: "Each solution combines EDS instruments, field crews and data into an outcome you can act on.", all: { href: "solutions/index.html", label: "All solutions" },
      items: C.solutions.map((s) => ({ href: `solutions/${s.slug}.html`, icon: s.icon, label: s.title, desc: s.summary })),
    },
  ];
  const openTab = tabs.some((t) => t.id === menuTab) ? menuTab : tabs[0].id;
  const tabbed = `
      <div class="nav-item has-mega wide">
        ${navSplit("Services", "services/index.html", ["services", "solutions"])}
        <div class="mega mega-tabs" id="mega-services">
          <div class="mega-rail">
            <p class="mega-head" id="mega-rail-label">Services and solutions</p>
            <div role="tablist" aria-labelledby="mega-rail-label">
              ${tabs.map((t) => `<button class="mega-tab${t.id === "solutions" ? " sep" : ""}" role="tab" id="mega-tab-${t.id}" aria-controls="mega-pane-${t.id}" aria-selected="${t.id === openTab}" tabindex="${t.id === openTab ? 0 : -1}" data-track-label="${esc(t.label)}"><span>${esc(t.label)}</span><i aria-hidden="true">${t.items.length}</i>${icon("chevron-right", false)}</button>`).join("")}
            </div>
          </div>
          <div class="mega-panes">
            ${tabs.map((t) => `<div class="mega-pane${t.id === openTab ? " on" : ""}" role="tabpanel"${t.id === openTab ? "" : " inert"} id="mega-pane-${t.id}" aria-labelledby="mega-tab-${t.id}">
              <div class="mega-pane-head"><p>${esc(t.lede)}</p><a href="${r}${t.all.href}">${t.all.label}${icon("arrow-right", false)}</a></div>
              ${t.items.map(mLink).join("")}
            </div>`).join("")}
          </div>
          <div class="mega-foot"><span>Not sure which service fits? Tell us about the site or the problem and we'll point you to the right one.</span><a href="${r}enquire.html">Start an enquiry ${icon("arrow-right")}</a></div>
        </div>
      </div>`;
  const pRanges = C.brands.map((b) => ({ href: `products/${b.slug}.html`, icon: b.icon, label: b.name, desc: b.tag }));
  const pInstruments = [...C.productPages.map((pg) => ({ href: `products/${pg.slug}.html`, icon: pg.icon, label: pg.name, desc: pg.tag })), { href: "products/lidott-alarm.html", icon: "bell", label: "LIDoTT Alarm", desc: C.lidott.tag }, { href: "products/alarm2.html", icon: "bell-ring", label: "Alarm2", desc: C.alarm2.tag }];
  const productsMenu = `
      <div class="nav-item has-mega">
        ${navSplit("Products", "products/index.html", ["products"])}
        <div class="mega cols-2" id="mega-products">
          <div class="mega-col"><p class="mega-head">Ranges</p>${pRanges.map(mLink).join("")}</div>
          <div class="mega-col"><p class="mega-head">Instruments</p>${pInstruments.map(mLink).join("")}</div>
          <div class="mega-foot"><span>All ${products.length} instruments, filtered by type or searched by name.</span><a href="${r}products/index.html">All products ${icon("arrow-right")}</a></div>
        </div>
      </div>`;
  const link = (href, label, key) => `<div class="nav-item"><a class="nav-link" href="${r}${href}"${current === key ? ' aria-current="page"' : ""}>${label}</a></div>`;
  // The phone menu lists the same: each section has a heading, its links and,
  // where it says so, a "View all" link after them. The group holding the
  // page the visitor is on opens with that page marked.
  const here = (href) => (href === file ? ' aria-current="page"' : "");
  const dLink = (i) => `<a href="${r}${i.href}"${here(i.href)}>${icon(i.icon, false)}${esc(i.label)}</a>`;
  const dGroup = (label, sections) => `
        <details${sections.some((g) => g.items.some((i) => i.href === file) || g.all?.href === file) ? ' class="has-current"' : ""}><summary>${label}${icon("chevron-down", false)}</summary><div>
          ${sections.map((g) => `${g.label ? `<p class="drawer-sub">${esc(g.label)}</p>` : ""}${g.items.map(dLink).join("")}${g.all ? `<a href="${r}${g.all.href}"${here(g.all.href)}>${icon("arrow-right", false)}${g.all.label}</a>` : ""}`).join("")}
        </div></details>`;
  const dSections = tabs.map((t, i) => ({ label: t.label, items: t.items, all: t.id === "solutions" ? t.all : i === C.serviceGroups.length - 1 ? { href: "services/index.html", label: "All services" } : null }));
  return `
  <a class="skip" href="#main">Skip to content</a>
  <div class="progress" aria-hidden="true"></div>
  <header class="header">
    <div class="wrap">
      <a class="logo" href="${r || "./"}" aria-label="EDS home"><img src="${site.logo}" alt="EDS, Environmental Data Services" width="189" height="48"></a>
      <nav class="nav" aria-label="Main">
        ${tabbed}
        ${productsMenu}
        ${link("flowsense.html", "FlowSense", "flowsense")}
        ${link("about.html", "About", "about")}
        ${link("resources.html", "Resources", "resources")}
      </nav>
      <div class="header-cta">
        <button class="header-search" type="button" data-search-open aria-label="Search the site" aria-keyshortcuts="Control+K Meta+K /">${icon("search")}<kbd data-kbd>Ctrl K</kbd></button>
        <a class="header-phone" href="${site.phoneHref}" aria-label="Call EDS on ${site.phone}">${icon("phone")}<span>${site.phone}</span></a>
        <a class="header-quote" href="${r}enquire.html" data-quote-link hidden>${icon("clipboard-list")}<span class="sr-only">Products in your quote list: </span><b data-quote-count>0</b></a>
        <a class="btn btn-primary" href="${r}contact.html">Contact us</a>
      </div>
      <button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="drawer-panel" data-track-label="Menu">${icon("menu", false)}</button>
    </div>
  </header>
  <div class="drawer">
    <div class="drawer-scrim"></div>
    <div class="drawer-panel" id="drawer-panel" role="dialog" aria-modal="true" aria-label="Menu">
      <div class="drawer-head">
        <a class="logo" href="${r || "./"}"><img src="${site.logo}" alt="EDS" width="189" height="48"></a>
        <button class="burger drawer-close" aria-label="Close menu">${icon("x", false)}</button>
      </div>
      <button class="drawer-search" type="button" data-search-open>${icon("search", false)}<span>Search products, services, documents</span></button>
      ${dGroup("Services", dSections)}
      ${dGroup("Products", [{ label: "Ranges", items: pRanges }, { label: "Instruments", items: pInstruments, all: { href: "products/index.html", label: "All products" } }])}
      <a class="drawer-link" href="${r}flowsense.html"${here("flowsense.html")}>FlowSense</a>
      <a class="drawer-link" href="${r}about.html"${here("about.html")}>About</a>
      <a class="drawer-link" href="${r}resources.html"${here("resources.html")}>Resources</a>
      <a class="drawer-link" href="${r}enquire.html" data-quote-link hidden>Your quote list <b class="count" data-quote-count>0</b></a>
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
          <a class="logo" href="${r || "./"}"><img src="${site.logo}" alt="EDS, Environmental Data Services" width="110" height="28" loading="lazy"></a>
          <p>${site.tagline}</p>
          <div class="footer-contact">
            <a href="${site.phoneHref}">${icon("phone")}${site.phone}</a>
            <span>${icon("mail", false)}${site.email}</span>
            <a href="${r}enquire.html">${icon("message-square-text")}Start an enquiry</a>
          </div>
        </div>
        <div>
          <h2>Services</h2>
          <ul>${C.services.filter((s) => s.featured).slice(0, 7).map((s) => `<li><a href="${r}services/${s.slug}.html">${esc(s.short || s.title)}</a></li>`).join("")}<li><a href="${r}services/index.html">All services</a></li></ul>
        </div>
        <div>
          <h2>Products</h2>
          <ul>${C.brands.map((b) => `<li><a href="${r}products/${b.slug}.html">${esc(b.name)}</a></li>`).join("")}<li><a href="${r}products/index.html">All products</a></li></ul>
        </div>
        <div>
          <h2>Company</h2>
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
          <h2>Head office</h2>
          <address>${site.address.join("<br>")}</address>
          <p class="footer-hours">${site.hours}</p>
          ${openStatus()}
          <form class="signup" ${formSend} data-subject="Register for EDS updates" data-track="Updates sign-up">
            <label for="f-email">Register for updates on projects, equipment and servicing</label>
            <input id="f-email" name="Email" type="email" placeholder="Your email" autocomplete="email" required>
            ${botcheck}
            <button class="btn btn-primary" type="submit" aria-label="Register for updates">${icon("arrow-right")}<i class="spin" aria-hidden="true"></i></button>
            <p class="signup-done" role="status" data-done="sent" hidden>${icon("check", false)} Thanks, you're signed up for EDS updates.</p>
            <p class="signup-done form-error" role="alert" data-done="error" hidden>${icon("circle-alert", false)} That did not go through. Please try again in a moment.</p>
          </form>
        </div>
      </div>
      <div class="footer-creds" role="group" aria-label="Credentials">
        <span class="mark"><img src="${C.img("ex-logo.gif")}" alt="Ex hazardous area mark" loading="lazy"><img src="${C.img("iecex.png")}" alt="IECEx" loading="lazy"></span>
        <span>Intrinsically safe equipment certified under ATEX and IECEx</span>
        <span>Australian owned since ${site.founded}</span>
        <span>Sydney Water panel provider</span>
      </div>
      <div class="footer-base">
        <span>© ${year} ${site.legal}. All rights reserved. <a href="${r}privacy.html">Privacy policy</a></span>
        <a class="to-top" href="#top">Back to top ${icon("arrow-up", "nudge-up")}</a>
      </div>
    </div>
  </footer>`;
}

// The forms send through Web3Forms from the page (site.js), so the build
// needs its access key.
if (!site.formKey) throw new Error("Set site.formKey in content.mjs: the forms send through Web3Forms with it");
const formSend = `data-key="${esc(site.formKey)}"`;
// A field people leave alone and bots fill in, so Web3Forms can drop spam.
const botcheck = `<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" hidden>`;

// "Open now" or "Closed" for head office, worked out in the browser by site.js.
const openStatus = () => `<span class="open-status" data-open-status='${JSON.stringify(site.openingHours)}' hidden><i></i><span></span></span>`;

// The search palette (search.js). Its index is loaded the first time it opens.
const searchDialog = () => `
<dialog class="search" aria-label="Search the site">
  <div class="search-bar">
    ${icon("search", false)}
    <input type="search" placeholder="Search products, services and documents" autocomplete="off" spellcheck="false" enterkeyhint="go" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="search-results" aria-autocomplete="list">
    <button class="search-close" type="button" data-search-close aria-label="Close search"><kbd>Esc</kbd>${icon("x", false)}</button>
  </div>
  <div class="search-results" id="search-results" role="listbox" aria-label="Search results"></div>
  <p class="sr-only" role="status" data-search-status></p>
  <div class="search-foot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
</dialog>`;

// Call and enquire, always to hand on a phone (shown below 700px by site.css).
const actionBar = (r, current) => `
<nav class="actionbar" aria-label="Quick actions">
  <a href="${site.phoneHref}" data-open-dot>${icon("phone", false)}<span>Call</span></a>
  <button type="button" data-search-open>${icon("search", false)}<span>Search</span></button>
  <a class="primary" href="${["contact", "enquire"].includes(current) ? "#enquiry" : `${r}enquire.html`}">${icon("message-square-text", false)}<span>Enquire</span><span class="sr-only" data-quote-link hidden>, products in your quote list:</span><b class="count" data-quote-count hidden>0</b></a>
</nav>`;

// Structured data for search engines. The organisation is described in full
// on the home, about and contact pages, with the website itself on the home
// page (its name is the site name Google shows) and the head office as a
// local business on the contact page. Service and solution pages describe
// their service, provided by that organisation, and every page with a
// breadcrumb trail gives it.
const ORG_ID = `${SITE_URL}/#organization`;
const AUSTRALIA = { "@type": "Country", name: "Australia" };
const absolute = (src) => src.replace("@root/", `${SITE_URL}/`);
const headOffice = () => {
  const [street, locality] = site.address;
  const [, suburb, state, postcode] = locality.match(/^(.*) ([A-Z]{2,3}) (\d{4})$/) || [];
  return { "@type": "PostalAddress", streetAddress: street, addressLocality: suburb, addressRegion: state, postalCode: postcode, addressCountry: "AU" };
};
function jsonLd(file, crumbs, { description, service, image }) {
  const blocks = [];
  const { w, h } = pngSize(site.logo.replace("@root/", ""));
  const logo = { "@type": "ImageObject", url: absolute(site.logo), width: w, height: h };
  if (["index.html", "about.html", "contact.html"].includes(file)) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": ORG_ID,
      name: site.name,
      alternateName: site.short,
      legalName: site.legal,
      description: C.homeLede,
      url: `${SITE_URL}/`,
      logo,
      image: `${SITE_URL}/assets/img/og-card.jpg`,
      email: site.email,
      telephone: site.phone,
      foundingDate: String(site.founded),
      address: headOffice(),
      areaServed: AUSTRALIA,
      location: C.offices.map((o) => ({ "@type": "Place", name: `${site.short} ${o.city}${o.head ? " (head office)" : ""}`, address: { "@type": "PostalAddress", addressLocality: o.city, addressRegion: o.state, addressCountry: "AU" } })),
      knowsAbout: C.services.map((s) => s.title),
      contactPoint: [
        { "@type": "ContactPoint", contactType: "customer service", telephone: site.phone, email: site.email, areaServed: "AU", availableLanguage: "en" },
        { "@type": "ContactPoint", contactType: "sales", email: site.sales, areaServed: "AU" },
        { "@type": "ContactPoint", contactType: "technical support", email: site.service, areaServed: "AU" },
      ],
      ...(site.profiles.length ? { sameAs: site.profiles } : {}),
    });
  }
  if (file === "index.html") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: site.name,
      alternateName: [site.short, `${site.short}, ${site.name}`],
      url: `${SITE_URL}/`,
      inLanguage: "en-AU",
      publisher: { "@id": ORG_ID },
    });
  }
  if (file === "contact.html") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    blocks.push({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#head-office`,
      name: site.name,
      parentOrganization: { "@id": ORG_ID },
      url: `${SITE_URL}/`,
      logo,
      image: `${SITE_URL}/assets/img/og-card.jpg`,
      telephone: site.phone,
      email: site.email,
      address: headOffice(),
      areaServed: AUSTRALIA,
      openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: site.openingHours.days.map((d) => days[d]), opens: site.openingHours.opens, closes: site.openingHours.closes }],
    });
  }
  if (service) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Service",
      name: service,
      serviceType: service,
      description,
      url: pageUrl(file),
      image: image.url,
      provider: { "@type": "Organization", "@id": ORG_ID, name: site.name, url: `${SITE_URL}/` },
      areaServed: AUSTRALIA,
    });
  }
  if (crumbs?.length) {
    const trail = [["Home", "index.html"], ...crumbs.map(([label, href]) => [label, href || file])];
    blocks.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: trail.map(([name, href], i) => ({ "@type": "ListItem", position: i + 1, name, item: pageUrl(href) })),
    });
  }
  return blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b).replace(/</g, "\\u003c")}</script>`).join("\n");
}

// pageHero() notes the breadcrumb trail here so layout() can describe it in
// structured data without every page passing it twice.
let heroCrumbs = null;

// Visit counting for the admin dashboard (server/). Builds for GitHub Pages
// (STATIC_HOST, or a PREVIEW copy) leave it out, since there is no server
// there to receive visits, unless ANALYTICS_ENDPOINT points at one.
const ENDPOINT = process.env.ANALYTICS_ENDPOINT || "";
const tracker = (r, file) =>
  (process.env.STATIC_HOST || process.env.PREVIEW) && !ENDPOINT ? "" : `\n<script src="${asset(r, "js/track.js")}" defer${ENDPOINT ? ` data-endpoint="${esc(ENDPOINT)}"` : ""}${file === "404.html" ? ' data-status="404"' : ""}></script>`;

// The picture shown when a page is shared on LinkedIn, Facebook, Teams or
// in a message: the page's first photograph or FlowSense screen, where its
// shape survives the 1.91 : 1 crop those apps give it, or else the EDS card
// (og-card.jpg, always on the home page). `alt` is already escaped.
const OG_CARD = { url: `${SITE_URL}/assets/img/og-card.jpg`, w: 1200, h: 630, alt: "EDS. Every drop, measured. Water, wastewater and environmental monitoring since 1991." };
function shareImage(file, html) {
  const m = file !== "index.html" && html.match(/<img src="@root\/(assets\/img\/(?:photos|flowsense)\/[^"]+-(\d+)x(\d+)\.jpg)"[^>]*?\salt="([^"]*)"/);
  if (m && m[2] / m[3] >= 1.2 && m[2] / m[3] <= 2) return { url: `${SITE_URL}/${m[1]}`, w: +m[2], h: +m[3], alt: m[4] };
  return { ...OG_CARD, alt: esc(OG_CARD.alt) };
}

function layout({ file, title, description, current, menuTab, body, scripts = [], service }) {
  const depth = file.split("/").length - 1;
  // The not-found page can be served at any depth, so it links from the root.
  const r = file === "404.html" ? "/" : "../".repeat(depth);
  heroCrumbs = null;
  const html = typeof body === "function" ? body(r) : body;
  const crumbs = heroCrumbs;
  const url = pageUrl(file);
  const image = shareImage(file, html);
  // Preview copies stay out of search. The live pages let Google show a
  // large image beside them in results and in Discover; the not-found page,
  // which the host also serves at /404.html, stays out. The ownership
  // tokens, when set, go on the home page only.
  const robots = process.env.PREVIEW ? "noindex, nofollow" : file === "404.html" ? "noindex" : "max-image-preview:large";
  const verify = file === "index.html" && !process.env.PREVIEW ? [["google-site-verification", site.verify.google], ["msvalidate.01", site.verify.bing]].filter(([, v]) => v).map(([k, v]) => `\n<meta name="${k}" content="${esc(v)}">`).join("") : "";
  // The "js" class hides the blocks that rise into view (site.css). If
  // site.js fails to load, or stops before its reveal code has run (it sets
  // EDS_READY), the class comes off and the page shows as it is.
  const out = `<!doctype html>
<html lang="en-AU" data-root="${r}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#ffffff">
<meta name="robots" content="${robots}">${file === "404.html" ? "" : `\n<link rel="canonical" href="${url}">`}${verify}
<meta property="og:site_name" content="EDS, Environmental Data Services">
<meta property="og:locale" content="en_AU">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image.url}">
<meta property="og:image:width" content="${image.w}">
<meta property="og:image:height" content="${image.h}">
<meta property="og:image:alt" content="${image.alt}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="${r}assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="${r}assets/img/apple-touch-icon.png">
<link rel="preload" href="${r}assets/fonts/saira-semiexpanded-latin.woff2" as="font" type="font/woff2" crossorigin>
<script>document.documentElement.classList.add("js");setTimeout(function(){if(!window.EDS_READY)document.documentElement.classList.remove("js")},4000)</script>
<link rel="stylesheet" href="${asset(r, "css/site.css")}">
${jsonLd(file, crumbs, { description, service, image })}
</head>
<body id="top">
${header(r, current, menuTab, file)}
<main id="main">
${html}
</main>
${footer(r)}
${actionBar(r, current)}
${searchDialog()}
<script src="${asset(r, "js/site.js")}" defer onerror="document.documentElement.classList.remove('js')"></script>
<script src="${asset(r, "js/search.js")}" defer></script>
<script src="${asset(r, "js/quote.js")}" defer></script>
${scripts.map((s) => `<script src="${asset(r, `js/${s}`)}" defer></script>`).join("\n")}${tracker(r, file)}
</body>
</html>
`.replaceAll("@root/", r)
    // Every link to a document in assets/docs: a PDF (a datasheet, manual,
    // brochure or white paper) opens in a new tab, and anything else (the
    // software zips) saves the file rather than leaving the page.
    .replace(/<a\s[^>]*href="[^"]*assets\/docs\/[^"]*"[^>]*>/g, (a) => (/href="[^"]*\.pdf"/i.test(a) ? (/\starget=/.test(a) ? a : a.replace(/>$/, ' target="_blank">')) : /\sdownload(?=[\s>=])/.test(a) ? a : a.replace(/>$/, " download>")))
    // Typographer's apostrophes: a straight tick between two letters (EDS's,
    // don't) becomes ’ everywhere, copy and alt text alike. No page script
    // holds such a tick, so code is untouched.
    .replace(/(\p{L})'(\p{L})/gu, "$1’$2")
    // A number and its unit never part at a line end (8.4 m, ±5 mm, 12 weeks,
    // Zone 0), nor a standard's name from its number (AS/NZS 3500.3, No. 36),
    // nor the groups of the phone number. Text between tags only, never
    // inside a script or a stylesheet.
    .replace(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)|>([^<]+)(?=<)/g, (m, code, text) => (code ? m : `>${text
      .replace(/(\d) (?=(?:mm|m|km|kPa|MPa|kL|L|°C|mA|µA|V|VDC|W|kV|Ah|Hz|kHz|MHz|GHz|Ω|MB|GB|ms|s|kg|ppm|%|h|weeks?|days?|months?|years?|hours?|minutes?)(?![\p{L}\d]))/gu, "$1\u00a0")
      .replace(/± (?=\d)/g, "±\u00a0")
      .replace(/\bZone (?=\d)/g, "Zone\u00a0")
      .replace(/\b(No\.|ISO|RFC|SWMM|WSA|AS\/NZS) (?=\d)/g, "$1\u00a0")
      .replace(/\b1300 (\d{3}) (\d{3})\b/g, "1300\u00a0$1\u00a0$2")}`));
  // In-page links, product deep links and form labels all rely on ids being unique.
  const ids = [...out.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) throw new Error(`${file} repeats the id(s): ${[...new Set(dupes)].join(", ")}`);
  return out;
}

/* ------------------------------------------------------------------ */
/* shared sections                                                     */
/* ------------------------------------------------------------------ */
// `visual` fills the right of the hero on wide screens: a product photo on
// brand pages, an "On this page" list on longer service pages.
const pageHero = (r, { crumbs = [], iconName, eyebrow, title, lede, actions = "", after = "", visual = "", compact = false, cls = "" }) => {
  heroCrumbs = crumbs;
  const copy = `
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${r || "./"}">Home</a>${crumbs.map(([label, href]) => `${icon("chevron-down", false)}${href ? `<a href="${r}${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}`).join("")}</nav>
    ${iconName && !visual ? `<div class="hero-icon holder" data-reveal="scale">${icon(iconName)}</div>` : ""}
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
    <h1 class="h-lg" data-reveal>${esc(title)}</h1>
    ${lede ? `<p class="lede" data-reveal style="--i:1">${esc(lede)}</p>` : ""}
    ${actions ? `<div class="hero-actions" data-reveal style="--i:2">${actions}</div>` : ""}
    ${after}`;
  return `
<section class="page-hero${visual ? " has-visual" : ""}${visual.includes('class="hero-product"') ? " has-product" : ""}${compact ? " compact" : ""}${cls ? ` ${cls}` : ""}">
  <canvas data-flowfield aria-hidden="true"></canvas>
  <div class="wrap">${visual ? `<div class="hero-copy">${copy}</div>${visual}` : copy}</div>
</section>`;
};

// A product photograph on a white plate, captioned with what it shows.
const heroProduct = (src, name) => `
<figure class="hero-product" data-reveal="scale" style="--i:2">
  <div class="hero-product-shot"><img src="${src}" alt="${esc(name)}" fetchpriority="high"></div>
  <figcaption>Pictured: ${esc(name)}</figcaption>
</figure>`;

// Jump links to the sections of a longer page. `sections` is [[id, label]],
// or [id, label, count] to show how many things the section holds.
const heroToc = (sections) => `
<nav class="hero-toc${sections.length > 8 ? " long" : ""}" aria-label="On this page" data-reveal="right" style="--i:2">
  <p>On this page</p>
  <ol>${sections.map(([id, label, count], i) => `<li><a href="#${id}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(label)}${count ? `<em>${count}</em>` : ""}${icon("arrow-down")}</a></li>`).join("")}</ol>
</nav>`;

// A titled glass card for the right of a page hero, for pages that are not
// long enough to need a jump list.
const heroPanel = (title, inner, cls = "") => `
<div class="hero-panel${cls ? ` ${cls}` : ""}" data-reveal="right" style="--i:2">
  <p>${title}</p>
  ${inner}
</div>`;

// The headline numbers from the home page, as a two by two grid.
const heroFacts = () => heroPanel("EDS at a glance", `<dl class="hero-facts">${C.stats.map((s) => `<div><dt>${s.label}</dt><dd>${s.value}${s.suffix ? `<small>${s.suffix}</small>` : ""}</dd></div>`).join("")}</dl>`);

// Three steps, each an icon, a name and a line: [icon, name, line].
const heroSteps = (title, steps) => heroPanel(title, `<ol class="hero-steps">${steps.map(([ic, t, d]) => `<li><span class="card-icon">${icon(ic, false)}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></li>`).join("")}</ol>`);

const ctaSection = (r, { title = "Talk to the people who measure it.", lede = "Tell us about your network, site or project. A real person from our team will come back to you.", topic, product } = {}) => `
<section class="section dark cta">
  <canvas data-flowfield aria-hidden="true"></canvas>
  <div class="wrap">
    <h2 class="h-lg" data-reveal>${title}</h2>
    <p class="lede" data-reveal style="--i:1">${lede}</p>
    <div class="hero-actions" data-reveal style="--i:2">
      <a class="btn btn-primary btn-lg" href="${contactHref(r, { topic, product })}">Start an enquiry</a>
      <a class="btn btn-ghost btn-lg" href="${site.phoneHref}">${icon("phone")} ${site.phone}</a>
    </div>
  </div>
</section>`;

// A card that is a link. The whole card is the link, so instead of a "Learn
// more" label on every card an arrow sits in the corner (`.go`). `tags` are
// short facts from the content shown as chips under the text.
const cardLink = (r, { href, iconName, title, text, n, cls = "", media = "", tags = [], cols = 4 }) => `
<a class="card${cls ? ` ${cls}` : ""}" href="${r}${href}" data-reveal style="--i:${n % cols}">
  <span class="card-icon">${icon(iconName)}</span>
  <h3>${esc(title)}</h3>
  <p>${esc(text)}</p>
  ${tags.length ? `<p class="card-for">${tags.map((t) => `<span>${esc(t)}</span>`).join("")}</p>` : ""}
  <span class="go" aria-hidden="true">${icon("arrow-right")}</span>${media}
</a>`;

// The flow meter's pipe: a 600 mm sewer in cross-section, drawn with the
// E-Flow 3 kit on the deep teal, with an area velocity meter on the invert
// looking up at the surface. lab.js slides the water (a 160 unit block from
// the crown at y 20 to the invert at 180) down by the depth, centres the
// velocity arrows in it, and points the meter's beam at the surface.
const f1 = (n) => Math.round(n * 10) / 10;
function labPipe() {
  const p = "lab", w = 280, h = 200, cx = 116, cy = 100, R = 80, wall = 9, oy = 168.5;
  const half = (y) => Math.sqrt(R * R - (y - cy) ** 2);
  const circ = (r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 -${2 * r} 0Z`;
  // an alarm level: a dashed line across the pipe, out to a small tag in the soil
  const level = (hr, cls, text, width) => { const y = 180 - hr * 160; return `<path class="lab-level ${cls}" d="M${f1(cx - half(y))} ${y}H${cx + R + wall + 6}"/><g class="lab-tag ${cls}" transform="translate(${cx + R + wall + 8} ${y})"><rect x="0" y="-8" width="${width}" height="16" rx="8"/><text x="7" y="3.8">${text}</text></g>`; };
  // the velocity through the depth as the kit draws it: a power law from the bed
  const arrows = [0, 1, 2, 3, 4].map((i) => { const y = 82 + 9 * i, l = f1(60 * Math.pow(1 - i / 5.6, 1 / 6)), o = (1 - i * 0.11).toFixed(2); return `<path class="lab-arrow" stroke-opacity="${o}" d="M86 ${y}H${f1(86 + l)}"/><path class="lab-arrow-h" stroke-opacity="${o}" d="M${f1(86 + l - 4.4)} ${y - 2.8}L${f1(86 + l)} ${y}L${f1(86 + l - 4.4)} ${y + 2.8}"/>`; }).join("");
  const corners = [[6, 6, 1, 1], [w - 6, 6, -1, 1], [6, h - 6, 1, -1], [w - 6, h - 6, -1, -1]].map(([x, y, sx, sy]) => `M${x} ${y + 12 * sy}V${y}H${x + 12 * sx}`).join("");
  const defs = `${efDefs(p, { dark: true })}
          <linearGradient id="${p}-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef-w0"/><stop offset=".18" class="ef-w1"/><stop offset="1" class="ef-w2"/></linearGradient>
          <radialGradient id="${p}-ub" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${oy}" r="150"><stop offset="0" class="ef-g0 u"/><stop offset="1" class="ef-g1 u"/></radialGradient>
          <pattern id="${p}-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" class="ef-gridline"/></pattern>
          <clipPath id="lab-clip"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
          <clipPath id="lab-wclip"><rect id="lab-wclip-r" x="0" y="20" width="${w}" height="160"/></clipPath>`;
  return `<svg id="lab-pipe" class="ef-dark" viewBox="0 0 ${w} ${h}" role="img" aria-label="Cross-section of a 600 mm sewer pipe, cut through the ground, showing the water depth against the high and high-high alarm levels. The area velocity meter sits on the invert, its ultrasonic beam looking up at the surface, and arrows in the water show the velocity through the depth.">
          <defs>${defs}</defs>
          <rect width="${w}" height="${h}" fill="url(#${p}-soil)"/>
          <path fill="url(#${p}-cut)" fill-rule="evenodd" d="${circ(R + wall)}${circ(R)}"/>
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${p}-air)"/>
          <g clip-path="url(#lab-clip)">
            <g id="lab-water-g"><rect x="0" y="20" width="${w}" height="160" fill="url(#${p}-wg)"/><path class="ef-surf-g" d="M0 20H${w}"/><path class="ef-surf" d="M0 20H${w}"/></g>
            <path id="lab-beam" class="ef-beam u" fill="url(#${p}-ub)"/>
            <g class="ef-waves" id="lab-waves">${[0, 1, 2, 3].map((k) => `<path class="ef-wave u" style="--d:${(k * 0.3).toFixed(1)}s"/>`).join("")}</g>
            <path id="lab-foot" class="lab-foot"/>
            <g clip-path="url(#lab-wclip)"><g id="lab-arrows" class="lab-arrows">${arrows}</g></g>
            <path class="lab-base" fill="url(#${p}-body)" d="M96 ${cy + R + 1}H136V177.4H96Z"/>
            <path class="lab-sensor" d="M96.5 177.4Q97.5 170 106 168.2H126Q134.5 170 135.5 177.4Z"/>
            <ellipse class="ef-us" cx="${cx}" cy="168.4" rx="4.4" ry="1.4" fill="url(#${p}-gold)"/>
          </g>
          <rect width="${w}" height="${h}" fill="url(#${p}-grid)"/>
          <path class="ef-edge" d="${circ(R + wall)}${circ(R)}"/>
          ${level(0.6, "h", "High", 38)}${level(0.85, "hh", "High-high", 64)}
          <path class="ef-hud" d="${corners}"/>
        </svg>`;
}

const labSection = ({ eyebrow = "", title = "See what a storm does to a sewer.", lede = "Send a storm through a model catchment and watch the hydrograph respond. The gap between measured flow and the dry weather pattern is inflow and infiltration: water that should never have reached the sewer." } = {}) => `
<section class="section dark band" id="flow-lab">
  <div class="wrap">
    <div class="section-head">
      ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}
      <h2 class="h-lg" data-reveal>${title}</h2>
      <p class="lede" data-reveal style="--i:1">${lede}</p>
    </div>
    <div class="lab" data-reveal>
      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">${icon("activity", false)} Sewer hydrograph</div>
          <div class="lab-status">
            <span class="lab-chip" id="lab-raining">${icon("cloud-rain", false)}Raining <b id="lab-rain-out">0</b>&nbsp;mm/h</span>
            <time class="lab-clock" id="lab-clock" aria-label="Simulated time">Day 1 · 06:00</time>
          </div>
        </div>
        <div class="lab-legend-row">
          <div class="legend"><span><i></i>Measured flow</span><span><i class="dwf"></i>Dry weather pattern</span><span><i class="ii"></i>Inflow &amp; infiltration</span><span><i class="rain"></i>Rainfall</span></div>
        </div>
        <div class="chart-box">
          <canvas id="lab-chart" tabindex="0" role="img" aria-label="Animated chart of sewer flow against the expected dry weather pattern, with rainfall shown above. Use the left and right arrow keys to read values." aria-describedby="lab-summary"></canvas>
          <div class="lab-tip" id="lab-tip" aria-hidden="true">
            <time data-tip="time"></time>
            <dl>
              <dt><i></i>Measured</dt><dd><span data-tip="q"></span> L/s</dd>
              <dt><i class="dwf"></i>Dry weather</dt><dd><span data-tip="base"></span> L/s</dd>
              <dt><i class="ii"></i>I&amp;I</dt><dd><span data-tip="extra"></span> L/s</dd>
              <dt><i class="rain"></i>Rain</dt><dd><span data-tip="rain"></span> mm/h</dd>
            </dl>
          </div>
          <p class="sr-only" id="lab-summary"></p>
          <p class="sr-only" id="lab-cursor-sr" aria-live="polite"></p>
        </div>
        <p class="lab-hint">${icon("pointer", false)}<span>Tap or point at the chart to read values<span class="lab-kbd">, or focus it and press <kbd>←</kbd> <kbd>→</kbd></span></span></p>
        <div class="lab-controls">
          <div class="lab-actions">
            <button class="btn btn-primary" id="lab-storm">${icon("cloud-rain")} Send a storm</button>
            <button class="lab-pause" id="lab-pause" type="button" aria-pressed="false" aria-label="Pause the simulation"><span class="when-running">${icon("pause", false)}</span><span class="when-paused" hidden>${icon("play", false)}</span></button>
          </div>
          <label class="range"><span>Storm size <output id="lab-size-out" for="lab-size"></output></span><input id="lab-size" aria-label="Storm size" type="range" min="5" max="50" step="1" value="26"><small>Rain depth of the next storm, over two hours.</small></label>
          <label class="range"><span>Network condition <output id="lab-leak-out" for="lab-leak"></output></span><input id="lab-leak" aria-label="Network condition" type="range" min="0.15" max="1.6" step="0.05" value="1"><small>How much of the rain finds its way into the sewer.</small></label>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title">${icon("gauge", false)} At the flow meter</div></div>
        ${labPipe()}
        <p class="lab-pipe-cap">600 mm pipe. Area velocity meter at the invert; dashed lines are the alarm levels.</p>
        <div class="readouts">
          <div class="readout"><b id="lab-q">0</b><span>Flow <i>L/s</i></span></div>
          <div class="readout"><b id="lab-d">0</b><span>Depth <i>mm</i></span></div>
          <div class="readout"><b id="lab-v">0</b><span>Velocity <i>m/s</i></span></div>
          <div class="readout readout-ii"><b id="lab-dq">+0.0</b><span>I&amp;I <i>L/s</i></span></div>
        </div>
        <div class="state" id="lab-state" data-level="0" aria-live="polite"><i></i><div><b>Normal</b><small>Flow is tracking the dry weather pattern.</small></div></div>
        <div class="state" style="margin-top:10px">${icon("droplets", false)}<div><b><span id="lab-extra">0</span> kL above dry weather flow</b><small>Extra volume in the last 30 hours: the cost of I&amp;I.</small></div></div>
      </div>
    </div>
    <p class="note" style="margin-top:16px">An illustrative model of a 600 mm sewer, not live data. Flow is wetted area multiplied by velocity, the way an area velocity flow meter measures it.</p>
  </div>
</section>`;

// The LIDoTT Alarm demo: a manhole in section, drawn with the E-Flow 3 kit
// on the deep teal. The alarm hangs under the cover on its bracket and its
// radar looks down the shaft at the water; the sewer runs through the
// benched chamber at the bottom. widgets.js shares this geometry (LID): the
// radar face is 4 m above the invert, and the level moves the water, the
// beam and its wavefronts, the footprint and the range dimension.
const LID = { w: 480, h: 400, ground: 36, crown: 316, inv: 368, wall: 10, shaft: [165, 315], cx: 240, face: 133, depth: 4 };
function lidottSvg() {
  const p = "lid", { w, h, ground, crown, inv, wall, cx, face, depth } = LID, [s0, s1] = LID.shaft;
  const yOf = (m) => inv - (m / depth) * (inv - face);
  const corners = [[6, 6, 1, 1], [w - 6, 6, -1, 1], [6, h - 6, 1, -1], [w - 6, h - 6, -1, -1]].map(([x, y, sx, sy]) => `M${x} ${y + 14 * sy}V${y}H${x + 14 * sx}`).join("");
  // an alarm level: a dashed line across the shaft, out to a pill tag that
  // sits against the right edge (it grows leftwards on a phone)
  const level = (m, cls, text, width) => `<path class="lid-level ${cls}" d="M${s0} ${f1(yOf(m))}H${w - 12 - width - 2}"/><g transform="translate(${w - 12 - width} ${f1(yOf(m))})"><g class="lid-tag ${cls}"><rect x="0" y="-9.5" width="${width}" height="19" rx="9.5"/><circle cx="10" cy="0" r="3"/><text x="18" y="4">${text}</text></g></g>`;
  const defs = `${efDefs(p, { dark: true })}
    <linearGradient id="${p}-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef-w0"/><stop offset=".18" class="ef-w1"/><stop offset="1" class="ef-w2"/></linearGradient>
    <linearGradient id="${p}-red" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e5584c"/><stop offset=".4" stop-color="#c8352b"/><stop offset="1" stop-color="#a32a22"/></linearGradient>
    <radialGradient id="${p}-bg" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${face}" r="${inv - face}"><stop offset="0" class="ef-g0 r"/><stop offset="1" class="ef-g1 r"/></radialGradient>
    <pattern id="${p}-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" class="ef-gridline"/></pattern>
    <clipPath id="${p}-clip"><path d="M${s0} ${ground}H${s1}V${crown}H${w}V${inv}H0V${crown}H${s0}Z"/></clipPath>
    <clipPath id="${p}-bclip"><rect id="lid-bclip-r" x="0" y="${crown}" width="${w}" height="${inv - crown}"/></clipPath>`;
  const y0 = f1(yOf(1.1));
  // the ground: road and soil, the shaft and the sewer cut and hatched, the
  // benching behind the channel, cover and frame, step irons
  const section = `
    <rect x="0" y="${ground}" width="${w}" height="${h - ground}" fill="url(#${p}-soil)"/>
    <rect class="ef-road" x="0" y="${ground - 5}" width="${w}" height="5"/>
    <rect x="0" y="${crown}" width="${w}" height="${inv - crown}" fill="url(#${p}-air)"/>
    <rect x="${s0}" y="${ground}" width="${s1 - s0}" height="${crown - ground}" fill="url(#${p}-air)"/>
    <rect class="lid-bench" x="${s0}" y="${crown}" width="${s1 - s0}" height="${inv - crown}" fill="url(#${p}-cut)"/>
    <path class="lid-bench-edge" d="M${s0} ${crown + 0.5}H${s1}"/>
    <rect id="lid-water" x="0" y="${y0}" width="${w}" height="${f1(inv - y0)}" fill="url(#${p}-wg)" clip-path="url(#${p}-clip)"/>
    <g clip-path="url(#${p}-bclip)" class="ef-bits">${[[30, 340, 0], [140, 356, -2.6], [90, 326, -4.4], [400, 348, -1.3], [250, 334, -5.6], [330, 360, -3.2]].map(([x, y, d]) => `<circle cx="${x}" cy="${y}" r="2" style="--d:${d}s"/>`).join("")}</g>
    <path id="lid-surf-g" class="ef-surf-g" d="M0 ${y0}H${w}"/><path id="lid-surf" class="ef-surf" d="M0 ${y0}H${w}"/>
    <path fill="url(#${p}-cut)" d="M0 ${crown - wall}H${s0 - wall}V${ground}H${s0}V${crown}H0ZM${s1} ${ground}H${s1 + wall}V${crown - wall}H${w}V${crown}H${s1}ZM0 ${inv}H${w}V${inv + wall}H0Z"/>
    <path class="ef-edge" d="M0 ${crown}H${s0}V${ground}M${s1} ${ground}V${crown}H${w}M0 ${inv}H${w}M0 ${crown - wall}H${s0 - wall}V${ground}M${s1 + wall} ${ground}V${crown - wall}H${w}M0 ${inv + wall}H${w}"/>
    <rect class="ef-frame" x="${s0 - wall - 5}" y="${ground - 8}" width="${s1 - s0 + 2 * wall + 10}" height="4" rx="1"/>
    <rect class="ef-lid" x="${s0 - 1}" y="${ground - 9.5}" width="${s1 - s0 + 2}" height="3.6" rx="1"/>
    ${Array.from({ length: 16 }, (_, k) => ground + 30 + 16 * k).filter((y) => y < crown - 8).map((y) => `<path class="ef-step" d="M${s1} ${y}h-7v5h7"/>`).join("")}`;
  // the alarm itself, after its photograph: the rail across the shaft, the
  // clamp and strap, the red body with its label, the LED and the radar face
  const device = `
    <g class="lid-device">
      <rect class="lid-rail" x="${s0}" y="46" width="${s1 - s0}" height="8" rx="1" fill="url(#${p}-steel)"/>
      <rect class="lid-clamp" x="229" y="42" width="22" height="16" rx="2"/>
      <circle class="ef-bolt" cx="234.5" cy="50" r="1.3"/><circle class="ef-bolt" cx="245.5" cy="50" r="1.3"/>
      <path class="lid-strap" d="M235 58H245V65.5Q245 68.5 242 68.5H238Q235 68.5 235 65.5Z"/>
      <path class="lid-body" fill="url(#${p}-red)" d="M228 68H252Q258 68 258.6 74L262 123Q262.4 130 255 130H225Q217.6 130 218 123L221.4 74Q222 68 228 68Z"/>
      <path class="ef-shine" d="M225.6 76L223.2 118"/>
      <rect class="ef-label" x="231" y="80" width="18" height="30" rx="1.5"/>
      <rect class="ef-mark" x="231" y="80" width="2.6" height="30" rx="1"/>
      <path class="ef-print" d="M236.2 85.5h9M236.2 89.5h10.5M236.2 93.5h6.5M236.2 100.5h10.5M236.2 104.5h8"/>
      <circle class="lid-led-g" cx="240" cy="120" r="5.5"/><circle class="lid-led" cx="240" cy="120" r="2.6"/>
      <ellipse class="lid-face" cx="240" cy="130.4" rx="13" ry="3" fill="url(#${p}-dome)"/>
      <ellipse class="ef-glint" cx="235" cy="129.6" rx="2.2" ry=".7"/>
    </g>`;
  const inner = `
    <rect width="${w}" height="${h}" fill="url(#${p}-grid)"/>
    ${level(2, "h", "High 2.0 m", 84)}${level(3, "hh", "High-high 3.0 m", 116)}
    <g class="lid-radar"><path id="lid-beam" class="ef-beam r" fill="url(#${p}-bg)"/><g class="ef-waves" id="lid-waves">${[0, 1, 2, 3].map((k) => `<path class="ef-wave r" style="--d:${(k * 0.3).toFixed(1)}s"/>`).join("")}</g><path id="lid-foot" class="ef-foot r"/></g>
    <g class="lid-range"><path id="lid-ext" class="lid-ext"/><path id="lid-dim" class="lid-dim"/><text id="lid-dim-t" class="lid-dim-t" x="106" y="${f1((face + y0) / 2 - 3)}" text-anchor="end"><tspan id="lid-dim-v">2.90 m</tspan><tspan class="lid-dim-l" x="106" dy="1.3em">radar range</tspan></text></g>
    ${device}
    <g class="lid-txt"><text x="12" y="24">Ground</text><text x="${s1 + wall + 10}" y="78">LIDoTT Alarm</text><text x="12" y="${crown + 31}">Sewer</text></g>
    <text class="lid-flow-l" x="${w - 42}" y="${crown + 31}" text-anchor="end">Flow</text><path class="lid-arrow" d="M${w - 34} ${crown + 27}h20m-5-3.6 5 3.6-5 3.6"/>
    <path class="ef-hud" d="${corners}"/>`;
  return `<svg id="lidott-svg" class="ef-dark" viewBox="0 0 ${w} ${h}" data-level="0" role="img" aria-label="A manhole in section, with a LIDoTT Alarm hung under the cover on its bracket and its radar beam measuring down the shaft to the water. Dashed lines mark the high and high-high alarm levels, and the radar range is dimensioned beside the shaft. The water level can be dragged from the sewer at the bottom up the shaft."><defs>${defs}</defs>${section}${inner}</svg>`;
}
const lidottDemo = ({ link = "" } = {}) => `
<div class="demo" data-reveal>
  <div class="panel">
    <div class="panel-head"><div class="panel-title">${icon("radar", false)} Drag the water level</div></div>
    ${lidottSvg()}
    <label class="range" style="margin-top:12px"><span>Water level <output><span id="lid-level">1.10</span> m</output></span><input id="lidott-level" aria-label="Water level" type="range" min="0.2" max="3.8" step="0.01" value="1.1"></label>
  </div>
  <div class="panel">
    <div class="panel-head"><div class="panel-title">${icon("bell", false)} What the utility sees</div></div>
    <div class="readouts" style="grid-template-columns:1fr 1fr;margin-top:0">
      <div class="readout"><b><span id="lid-dist">2.90</span><small>m</small></b><span>Radar range</span></div>
      <div class="readout"><b>±5<small>mm</small></b><span>Accuracy</span></div>
    </div>
    <div class="state" id="lid-state" data-level="0" aria-live="polite"><i></i><div><b>Normal</b><small>Three configurable states: normal, high, high-high.</small></div></div>
    <div class="sms" id="lidott-log" aria-live="polite"></div>
    <p class="note">An illustration of how a LIDoTT Alarm behaves. Thresholds are set on site during installation.</p>
    ${link ? `<a class="link-arrow" href="${link}" style="margin-top:12px">LIDoTT Alarm specifications and datasheet ${icon("arrow-right")}</a>` : ""}
  </div>
</div>`;

// The EDS Asset Score as a precision gauge on an instrument screen: a 180°
// track with fine ticks, the three alarm zones as thin arcs over a soft
// glow, a slender needle on a hub, the score in EDS Display and the last
// hour as a sparkline in a sub-panel. widgets.js rotates #eas-needle about
// (200, 200) and plots #eas-spark in a 180 x 40 box at (110, 260): both sit
// in groups that carry them to where this drawing wants them.
function easDemo() {
  const W = 400, H = 340, CX = 200, CY = 158, R = 120;
  const f1 = (n) => n.toFixed(1);
  const pt = (s, r) => { const t = Math.PI + (s / 1000) * Math.PI; return [CX + r * Math.cos(t), CY + r * Math.sin(t)]; };
  const arc = (a, b, r) => { const [x1, y1] = pt(a, r), [x2, y2] = pt(b, r); return `M${f1(x1)} ${f1(y1)}A${r} ${r} 0 ${b - a > 500 ? 1 : 0} 1 ${f1(x2)} ${f1(y2)}`; };
  const zones = [[0, 400, "#f87171"], [400, 700, "#f6a04d"], [700, 1000, "#4ade80"]];
  const zoneArcs = (w, op) => zones.map(([a, b, c], i) => `<path d="${arc(a + (i ? 6 : 0), b - (i < 2 ? 6 : 0), R)}" stroke="${c}" stroke-width="${w}" stroke-opacity="${op}"/>`).join("");
  let ticks = "";
  for (let s = 0; s <= 1000; s += 25) {
    const major = s % 250 === 0;
    const [x1, y1] = pt(s, R - 9), [x2, y2] = pt(s, major ? R - 21 : R - 14);
    ticks += `<path class="eas-tick${major ? " major" : ""}" d="M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}"/>`;
  }
  const nums = [0, 250, 500, 750, 1000].map((s) => { const [x, y] = pt(s, R - 40); return `<text class="eas-mono eas-scale" x="${f1(x)}" y="${f1(y + 4)}" text-anchor="middle">${s}</text>`; }).join("");
  const corners = [[6, 6, 1, 1], [W - 6, 6, -1, 1], [6, H - 6, 1, -1], [W - 6, H - 6, -1, -1]].map(([x, y, sx, sy]) => `M${x} ${y + 14 * sy}V${y}H${x + 14 * sx}`).join("");
  // the sub-panel: the hour's sparkline, scaled from where widgets.js plots it
  const SP = { x: 40, y: 258, w: 320, h: 54 };
  const sx = SP.w / 180, sy = SP.h / 40;
  const sparkT = `translate(${f1(SP.x - 110 * sx)} ${f1(SP.y - 260 * sy)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})`;
  const grid = `M${SP.x} ${SP.y}H${SP.x + SP.w}M${SP.x} ${SP.y + SP.h / 2}H${SP.x + SP.w}M${SP.x} ${SP.y + SP.h}H${SP.x + SP.w}${[1, 2, 3].map((k) => `M${SP.x + (SP.w / 4) * k} ${SP.y}V${SP.y + SP.h}`).join("")}`;
  return `
<div class="demo" data-reveal>
  <div class="panel">
    <div class="panel-head"><div class="panel-title">${icon("gauge", false)} EDS Asset Score</div></div>
    <svg id="eas-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="An instrument dial showing the EDS Asset Score from 0 to 1000, with red, amber and green zones on its scale, the score as a number, and the last 60 minutes of the score as a line beneath">
      <defs>
        <radialGradient id="eas-plate" gradientUnits="userSpaceOnUse" cx="330" cy="0" r="460"><stop offset="0" stop-color="#105049"/><stop offset=".55" stop-color="#08312e"/><stop offset="1" stop-color="#052523"/></radialGradient>
        <pattern id="eas-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" class="ef-gridline"/></pattern>
      </defs>
      <rect width="${W}" height="${H}" rx="14" fill="url(#eas-plate)"/><rect width="${W}" height="${H}" rx="14" fill="url(#eas-grid)"/>
      <path class="eas-bezel" d="${arc(0, 1000, R + 11)}"/>
      <path class="eas-track" d="${arc(0, 1000, R)}"/>
      <g class="eas-zone">${zoneArcs(16, .16)}${zoneArcs(4, 1)}</g>
      ${ticks}${nums}
      <g transform="translate(0 ${CY - 200})"><g id="eas-needle"><path class="eas-needle-g" d="M200 88L203.4 200L200 218L196.6 200Z"/><path class="eas-needle" d="M200 88L203.4 200L200 218L196.6 200Z"/></g></g>
      <circle class="eas-hub-ring" cx="${CX}" cy="${CY}" r="15"/><circle class="eas-hub" cx="${CX}" cy="${CY}" r="10.5"/><circle class="eas-hub-core" cx="${CX}" cy="${CY}" r="4.5"/>
      <text id="eas-num" x="218" y="214" text-anchor="end">930</text><text class="eas-mono eas-of" x="225" y="214">/ 1000</text>
      <rect class="eas-sub" x="24" y="232" width="352" height="96" rx="8"/>
      <text class="eas-sub-h" x="36" y="249">Last 60 minutes</text>
      <circle class="eas-live" cx="357" cy="245.5" r="3"/><text class="eas-mono eas-small" x="350" y="249" text-anchor="end">Live</text>
      <path class="eas-sub-grid" d="${grid}"/>
      <g transform="${sparkT}" fill="none" stroke-linejoin="round" stroke-linecap="round"><use href="#eas-spark" stroke="#9fe7da" stroke-width="7" stroke-opacity=".2"/><g stroke="#9fe7da" stroke-width="2"><polyline id="eas-spark" vector-effect="non-scaling-stroke"/></g></g>
      <g class="eas-mono eas-small"><text x="${SP.x}" y="323">-60 min</text><text x="${SP.x + SP.w / 2}" y="323" text-anchor="middle">-30</text><text x="${SP.x + SP.w}" y="323" text-anchor="end">now</text></g>
      <path class="ef-hud" d="${corners}"/>
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

// Four drawings of FlowSense screens, one to a tab, drawn from the real
// screens in src/assets/img/flowsense: the I/I heat map over a suburb's
// streets, Blockage Watch's verdict and evidence, the Pump Station
// Manager's wet well in section, and an alarm finding the person on call.
// They sit in the platform's own frame (top bar, side rail, status bar)
// in its light theme, labelled as illustrations in the status bar. The
// `fine` text gives way at phone widths and the `fs-lbl` text grows there
// (site.css), by `--lg` where a label has less room.
function fsScreen() {
  // a Lucide glyph at s px, from the cache icon() fills
  const glyph = (name, x, y, s, stroke, sw = 2) => { icon(name, false); return `<g transform="translate(${x} ${y}) scale(${(s / 24).toFixed(3)})" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${iconCache.get(name)}</g>`; };
  const f1 = (n) => Math.round(n * 10) / 10;
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const INK = "#0f2b2a", INK2 = "#2e4543", MUTED = "#4e6361", LINE = "#d5dde5";
  // a panel on the drawing with a soft shadow under it (no filters)
  const card = (x, y, w, h, { r = 8, fill = "#fff", stroke = LINE, shadow = .08 } = {}) => `<rect x="${x}" y="${y + 1.5}" width="${w}" height="${h}" rx="${r}" fill="${INK}" fill-opacity="${shadow}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
  const halo = `stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke"`;

  // 1. I/I heat map: a suburb's streets, houses, a reserve and a creek, and
  // under them the sewers draining to a pump station. Each pipe takes its
  // severity band's colour and its diameter's width; arrows point
  // downstream and the dots along them run closer and faster the worse the
  // I/I, as the platform's own legend says. Gauges carry their scores and
  // one pipe is hovered.
  const heat = (() => {
    const MAIN = 4.6, LOCAL = 3.3;
    const roads = [
      [[[-130, 46], [74, 46], [178, 46], [292, 46], [398, 46], [610, 42]], LOCAL],
      [[[-130, 95], [78, 90], [126, 95], [176, 100], [236, 98], [296, 96], [346, 98], [396, 100], [610, 91]], MAIN],
      [[[-130, 193], [84, 198], [128, 199.5], [172, 201], [300, 202], [404, 205], [610, 203]], MAIN],
      [[[66, -90], [74, 46], [78, 90], [84, 198]], LOCAL],
      [[[182, -90], [178, 46], [176, 100], [172, 201], [166, 360]], LOCAL],
      [[[288, -90], [292, 46], [296, 96], [300, 202]], LOCAL],
      [[[402, -90], [398, 46], [396, 100], [404, 205]], LOCAL],
      [[[236, 98], [233, 66]], LOCAL],
      [[[128, 199.5], [126, 156]], LOCAL],
    ];
    const courts = [[233, 62], [126, 152]];
    const line = (pts) => `M${pts.map(([x, y]) => `${x} ${y}`).join("L")}`;
    const segs = roads.flatMap(([pts, hw]) => pts.slice(1).map((b, k) => [pts[k], b, hw]));
    const dist = (px, py, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
    const clear = (x, y, r) => segs.every(([a, b, hw]) => dist(x, y, a, b) > hw + r) && courts.every(([cx, cy]) => Math.hypot(x - cx, y - cy) > 8 + r);
    const inPark = (x, y) => x > 298 && x < 406 && y > 94 && y < 207;
    const inShops = (x, y) => x > 402 && y > 98 && y < 207;
    // houses face every street, a little irregular, none on a road
    let houses = "", n = 0;
    for (const [[ax, ay], [bx, by], hw] of segs) {
      const len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len;
      for (let s = 9; s < len - 6; s += 13) for (const side of [1, -1]) {
        n++;
        const w = 4.2 + rnd(n) * 1.4, d = 3.2 + rnd(n + 50) * 1.2, off = hw + 5 + d + rnd(n + 99) * 1.5;
        const cx = ax + ux * s - uy * side * off, cy = ay + uy * s + ux * side * off;
        if (cx < -60 || cx > 540 || cy < -50 || cy > 207 || inPark(cx, cy) || inShops(cx, cy) || !clear(cx, cy, Math.max(w, d) + 1.5)) continue;
        const c = [[-w, -d], [w, -d], [w, d], [-w, d]].map(([p, q]) => [f1(cx + ux * p - uy * q), f1(cy + uy * p + ux * q)]);
        houses += `M${c[0][0]} ${c[0][1]}l${c.slice(1).map(([x, y], k) => `${f1(x - c[k][0])} ${f1(y - c[k][1])}`).join(" ")}z`;
      }
    }
    const trees = [];
    for (let k = 0; k < 34; k++) {
      const x = 310 + rnd(k + 400) * 82, y = 110 + rnd(k + 500) * 80;
      if (Math.hypot((x - 362) / 25, (y - 170) / 15) < 1 || (y < 132 && x > 330 && x < 376)) continue;
      trees.push([f1(x), f1(y), f1(2.6 + rnd(k + 600) * 2.6)]);
    }
    const bankTrees = [[-60, 260], [-24, 228], [24, 228], [40, 258], [66, 230], [150, 262], [214, 232], [262, 262], [330, 232], [392, 260], [470, 226], [520, 262], [560, 222], [90, 290], [230, 284], [380, 292], [500, 296], [-40, 300], [300, 306]].map(([x, y], k) => [x, y, 3 + rnd(k + 700) * 2]);
    const creek = "M-130 236C-80 230 -44 252 -12 246C50 236 110 262 182 248S310 232 372 246S452 262 492 240S566 226 610 234";

    // the sewers, upstream to downstream: [points, I/I score, width]
    const pipes = [
      [[[-130, 95], [78, 90]], 8, 3], [[[74, 46], [78, 90]], 10, 3], [[[78, 90], [84, 198]], 14, 3.6],
      [[[126, 95], [176, 100]], 18, 3], [[[178, 46], [176, 100]], 30, 3], [[[176, 100], [172, 201]], 36, 3.6],
      [[[126, 156], [128, 199.5]], 26, 3],
      [[[233, 66], [236, 98]], 56, 3], [[[236, 98], [296, 96]], 74, 3.2], [[[292, 46], [296, 96]], 62, 3], [[[296, 96], [300, 202]], 78, 4.2],
      [[[610, 91], [396, 100]], 16, 3], [[[346, 98], [396, 100]], 28, 3], [[[398, 46], [396, 100]], 40, 3], [[[396, 100], [404, 205]], 52, 3.8],
      [[[-130, 193], [84, 198]], 12, 4.4], [[[84, 198], [128, 199.5]], 18, 4.4], [[[128, 199.5], [172, 201]], 22, 4.6],
      [[[172, 201], [300, 202]], 48, 5], [[[300, 202], [404, 205]], 76, 5.4], [[[404, 205], [436, 226]], 70, 5.4],
    ];
    const COL = ["#3b82f6", "#eab308", "#f97316", "#ef4444"];
    const band = (s) => (s < 20 ? 0 : s < 45 ? 1 : s < 70 ? 2 : 3);
    const arrows = pipes.map(([pts, s, w]) => {
      const [[ax, ay], [bx, by]] = pts, len = Math.hypot(bx - ax, by - ay);
      if (len < 36) return "";
      const t = len > 90 ? [0.32, 0.72] : [0.56];
      const a = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI, L = w + 5, hw = w / 2 + 2.7;
      return t.map((k) => `<path transform="translate(${f1(ax + (bx - ax) * k)} ${f1(ay + (by - ay) * k)}) rotate(${f1(a)})" d="M${f1(L / 2)} 0L${f1(-L / 2)} ${f1(-hw)}L${f1(-L / 4)} 0L${f1(-L / 2)} ${f1(hw)}Z" fill="${COL[band(s)]}"/>`).join("");
    }).join("");
    const gauges = [[78, 90, 9], [172, 201, 24], [296, 96, 65], [396, 100, 41], [404, 205, 72]];
    const isGauge = (x, y) => gauges.some(([gx, gy]) => gx === x && gy === y);
    const nodes = [...new Map(pipes.flatMap(([pts]) => pts).filter(([x, y]) => x > 0 && x < 480 && y > 0 && y < 270 && !isGauge(x, y) && !(x === 436 && y === 226)).map((p) => [p.join(), p])).values()];

    return `<svg class="fs-map" viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs><linearGradient id="fs-hm-g" x1="0" x2="1"><stop offset="0" stop-color="#2563eb"/><stop offset=".2" stop-color="#60a5fa"/><stop offset=".45" stop-color="#facc15"/><stop offset=".7" stop-color="#f97316"/><stop offset="1" stop-color="#dc2626"/></linearGradient></defs>
    <rect x="-130" y="-90" width="740" height="450" fill="#f1f3ef"/><rect x="-130" y="250" width="740" height="110" fill="#dcebd3"/>
    <path d="${creek}" fill="none" stroke="#dcebd3" stroke-width="44" stroke-linecap="round"/>
    <g>${bankTrees.map(([x, y, r]) => `<circle cx="${x}" cy="${f1(y + 1.2)}" r="${f1(r)}" fill="#b6d3a8"/><circle cx="${x}" cy="${y}" r="${f1(r)}" fill="#c9e2bd"/>`).join("")}</g>
    <path d="${creek}" fill="none" stroke="#a9d0e6" stroke-width="10" stroke-linecap="round"/><path d="${creek}" fill="none" stroke="#c4e3f3" stroke-width="7" stroke-linecap="round"/>
    <path d="M304 104L392 106L399 197L304 196Z" fill="#d9ebd0"/>
    <ellipse cx="362" cy="170" rx="19" ry="10" fill="#c4e3f3" stroke="#a9d0e6"/>
    <path d="M304 132C326 126 346 142 366 136S390 122 398 120" fill="none" stroke="#f6f3e8" stroke-width="2.4" stroke-linecap="round"/>
    <g>${trees.map(([x, y, r]) => `<circle cx="${x}" cy="${f1(y + 1.2)}" r="${r}" fill="#a9cd99"/><circle cx="${x}" cy="${y}" r="${r}" fill="#bfdcb1"/>`).join("")}</g>
    <path d="${houses}" fill="#e2e6e5" stroke="#d0d7d6" stroke-width=".6"/>
    <rect x="414" y="110" width="58" height="46" rx="2" fill="#e2e6e8" stroke="#ccd3d6" stroke-width=".8"/>
    <path d="M422 118h10v6h-10zM440 118h10v6h-10zM458 118h8v6h-8z" fill="#d3d9dc"/>
    <rect x="414" y="162" width="58" height="35" rx="2" fill="#e8ebec"/>
    <path d="M420 166v8M427 166v8M434 166v8M441 166v8M448 166v8M455 166v8M462 166v8M420 185v8M427 185v8M434 185v8M441 185v8M448 185v8M455 185v8M462 185v8" stroke="#fff" stroke-width="1"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <g stroke="#d8dfe3">${roads.map(([pts, hw]) => `<path d="${line(pts)}" stroke-width="${hw * 2 + 2}"/>`).join("")}${courts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.6" fill="#d8dfe3" stroke="none"/>`).join("")}</g>
      <g stroke="#fff">${roads.map(([pts, hw]) => `<path d="${line(pts)}" stroke-width="${hw * 2}"/>`).join("")}${courts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.6" fill="#fff" stroke="none"/>`).join("")}</g>
      <path d="M162.6 238V258M175.4 236V256" stroke="#9fb0b0" stroke-width="1.4"/>
    </g>
    <path class="fs-hm-glow" d="M296 96L300 202" fill="none" stroke="#ef4444" stroke-width="16" stroke-linecap="round"/>
    <path d="M436 226C452 231 468 236 492 236H610" fill="none" stroke="#6b7f7d" stroke-width="2" stroke-dasharray="4 3"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <g stroke="${INK}" stroke-opacity=".22">${pipes.map(([pts, , w]) => `<path d="${line(pts)}" stroke-width="${w + 2}"/>`).join("")}</g>
      ${pipes.map(([pts, s, w]) => `<path d="${line(pts)}" stroke="${COL[band(s)]}" stroke-width="${w}"/>`).join("")}
      ${pipes.map(([pts, s]) => `<path class="fs-hm-flow b${band(s)}" d="${line(pts)}"/>`).join("")}
    </g>
    <g stroke="#fff" stroke-width="1.1" stroke-linejoin="round" paint-order="stroke">${arrows}</g>
    <g fill="#fff" stroke="${INK2}" stroke-width="1.1">${nodes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4"/>`).join("")}</g>
    <circle class="fs-hm-ping" cx="404" cy="205" r="8.5" fill="none" stroke="${COL[3]}" stroke-width="2"/>
    ${gauges.map(([x, y, s]) => `<circle cx="${x}" cy="${f1(y + 1.3)}" r="9" fill="${INK}" fill-opacity=".18"/><circle cx="${x}" cy="${y}" r="8.5" fill="${COL[band(s)]}" stroke="#fff" stroke-width="2"/><text class="fine" x="${x}" y="${f1(y + 3.1)}" font-size="8.4" font-weight="700" text-anchor="middle" fill="${band(s) === 1 ? INK : "#fff"}">${s}</text>`).join("")}
    <rect x="429" y="219" width="14" height="14" rx="3.5" fill="#0c5f59" stroke="#fff" stroke-width="1.8"/><circle cx="436" cy="226" r="2.6" fill="none" stroke="#fff" stroke-width="1.3"/>
    <circle cx="298" cy="149" r="4.6" fill="#fff" stroke="#ef4444" stroke-width="2.2"/>
    <g class="fine" font-size="8.5" font-style="italic">
      <text x="351" y="125" text-anchor="middle" fill="#4a7a43" ${halo}>Reserve</text>
      <text x="236" y="262" text-anchor="middle" fill="#4b86a6" ${halo}>Creek</text>
      <text x="436" y="248" text-anchor="middle" font-style="normal" font-weight="600" fill="${INK2}" ${halo}>Pump station</text>
    </g>
    <g class="fine">
      <rect x="188" y="122" width="98" height="54" rx="8" fill="${INK}" fill-opacity=".14" transform="translate(0 2)"/>
      <rect x="188" y="122" width="98" height="54" rx="8" fill="${INK}"/><path d="M285 143l7 6-7 6z" fill="${INK}"/>
      <text x="198" y="139" font-size="10.5" font-weight="650" fill="#fff">SW-2214</text>
      <circle cx="201" cy="151.5" r="3" fill="#ef4444"/><text x="208" y="155" font-size="9.5" fill="#fff" fill-opacity=".88">Severe · score 78</text>
      <text class="mono" x="198" y="169" font-size="8.5" fill="#fff" fill-opacity=".62">225 mm · 189 m</text>
    </g>
    <g class="fine">
      ${card(10, 10, 22, 44, { r: 6 })}<path d="M10 32h22" stroke="${LINE}"/><path d="M16 21h10M21 16v10M16 43h10" fill="none" stroke="${INK2}" stroke-width="1.6" stroke-linecap="round"/>
      ${card(300, 10, 170, 32, { r: 7 })}<path d="M352 16v20M404 16v20" stroke="${LINE}"/>
      <g text-anchor="middle"><text x="326" y="25" font-size="11.5" font-weight="650" fill="${INK}">5</text><text x="378" y="25" font-size="11.5" font-weight="650" fill="#dc2626">72</text><text x="437" y="25" font-size="11.5" font-weight="650" fill="${INK}">1.2 km</text>
        <g font-size="7.4" fill="${MUTED}"><text x="326" y="36">gauges</text><text x="378" y="36">peak severity</text><text x="437" y="36">high or severe</text></g></g>
      ${card(10, 206, 146, 56)}
      <text x="20" y="220" font-size="9.5" font-weight="650" fill="${INK}">I/I severity</text>
      <rect x="20" y="226" width="126" height="5.5" rx="2.75" fill="url(#fs-hm-g)"/>
      <g class="mono" font-size="7.4" fill="${MUTED}"><text x="20" y="241">0</text><text x="45.2" y="241" text-anchor="middle">20</text><text x="76.7" y="241" text-anchor="middle">45</text><text x="108.2" y="241" text-anchor="middle">70</text><text x="146" y="241" text-anchor="end">100</text></g>
      <path d="M20 252h16" stroke="#f97316" stroke-width="3" stroke-linecap="round"/><path d="M34 252l-6-3.8v7.6z" fill="#f97316" stroke="#fff" stroke-width=".9"/>
      <text x="42" y="255" font-size="8.5" fill="${INK2}">Arrows run downstream</text>
      <g stroke="${INK2}" stroke-width="1.2" stroke-linecap="round"><path d="M300 258h56M300 254v8M356 254v8"/></g><text x="328" y="251" font-size="8" text-anchor="middle" fill="${INK2}" ${halo}>100 m</text>
      <circle cx="466" cy="256" r="8.5" fill="#fff" stroke="${LINE}"/><path d="M466 249.5l3 6.5h-6z" fill="${INK}"/><path d="M466 262.5l3-6.5h-6z" fill="#c3cdcc"/>
    </g>
  </svg>`;
  })();

  // 2. Blockage Watch: the site's verdict and risk score on its bands, then
  // the evidence: the overnight level on three weeks of nights, the rain
  // nights shaded and set aside, a trend fitted to the dry ones climbing
  // away from the baseline.
  const blockage = (() => {
    const N = 21, x0 = 44, x1 = 430, yT = 104, yB = 220;
    const X = (i) => f1(x0 + ((x1 - x0) * i) / (N - 1));
    const Y = (v) => f1(yB - ((v - 90) / 70) * (yB - yT));
    const lvl = [103, 105, 102, 104, 106, 128, 146, 121, 110, 112, 113, 117, 119, 123, 141, 126, 131, 134, 139, 143, 148];
    const rain = { 5: 8, 6: 22, 7: 4, 14: 15, 15: 6 };
    const runs = [[0, 4], [8, 13], [16, 20]], gaps = [[4, 8], [13, 16]];
    const path = ([a, b]) => Array.from({ length: b - a + 1 }, (_, k) => `${k ? "L" : "M"}${X(a + k)} ${Y(lvl[a + k])}`).join("");
    const S = (s) => f1(12 + 4.56 * s);
    const bands = [[0, 35, "#bbf7d0", "Normal"], [35, 55, "#fde68a", "Watch 35"], [55, 75, "#fed7aa", "Warning 55"], [75, 100, "#fecaca", "Critical 75"]];
    return `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs><clipPath id="fs-bw-bar"><rect x="12" y="65" width="456" height="8" rx="4"/></clipPath></defs>
    <g class="fine"><rect x="12" y="9" width="46" height="17" rx="8.5" fill="#fef3c7" stroke="#fbbf24"/><text x="35" y="21" font-size="9.5" font-weight="650" text-anchor="middle" fill="#92400e">Watch</text>
      <text x="66" y="21.5" font-size="11" font-weight="650" fill="${INK}">Site 14 · Trunk sewer</text>
      <text x="12" y="58" font-size="9.5" fill="${MUTED}">Overnight level up on dry nights, flow unchanged</text>
      <text x="468" y="52" font-size="8.5" text-anchor="end" fill="${MUTED}">risk score of 100</text></g>
    <text class="fs-lbl" x="12" y="44" font-size="12.5" font-weight="650" fill="#b45309">Likely obstruction building</text>
    <text x="468" y="39" font-size="32" font-weight="650" letter-spacing="-.5" text-anchor="end" fill="#b45309">44</text>
    <g clip-path="url(#fs-bw-bar)">${bands.map(([a, b, c]) => `<rect x="${S(a)}" y="65" width="${f1(S(b) - S(a))}" height="8" fill="${c}"/>`).join("")}</g>
    <path d="M${S(35)} 65v8M${S(55)} 65v8M${S(75)} 65v8" stroke="#fff" stroke-width="1.5"/>
    <g class="fine" font-size="8" fill="${MUTED}">${bands.map(([a, , , t]) => `<text x="${f1(S(a) + (a ? 3 : 0))}" y="86">${t}</text>`).join("")}</g>
    <g class="fs-bw-mark"><circle cx="${S(44)}" cy="69" r="5.4" fill="#fff" stroke="#b45309" stroke-width="2.4"/></g>

    ${[[4.5, 7.5], [13.5, 15.5]].map(([a, b]) => `<rect x="${X(a)}" y="${yT}" width="${f1(X(b) - X(a))}" height="${yB - yT}" fill="#eef2f5"/>`).join("")}
    <g fill="#7cc6e0">${Object.entries(rain).map(([i, mm]) => `<rect x="${f1(X(+i) - 4.5)}" y="${yT}" width="9" height="${f1(mm * 1.5)}" rx="1.5"/>`).join("")}</g>
    <g stroke="#e3e9ee" stroke-width="1">${[100, 120, 140, 160].map((v) => `<path d="M${x0} ${Y(v)}H${x1}"/>`).join("")}</g>
    <path d="M${x0} ${yT}V${yB}H${x1}" fill="none" stroke="#b7c3c1"/>
    <g class="fine mono" font-size="8.5" fill="${MUTED}">${[100, 120, 140, 160].map((v) => `<text x="${x0 - 6}" y="${f1(Y(v) + 3)}" text-anchor="end">${v}</text>`).join("")}
      <text x="${x0}" y="${yB + 14}">3 wk ago</text><text x="${X(7)}" y="${yB + 14}" text-anchor="middle">2 wk</text><text x="${X(14)}" y="${yB + 14}" text-anchor="middle">1 wk</text><text x="${x1}" y="${yB + 14}" text-anchor="end">Last night</text></g>
    <g class="fine" font-size="8.5"><text x="12" y="99" font-weight="600" fill="${INK2}">Overnight level, mm</text><text x="${X(6)}" y="99" text-anchor="middle" fill="#3b8fb0">Rain: set aside</text></g>
    <path d="M${x0} ${Y(104)}H${x1}" fill="none" stroke="${INK2}" stroke-width="1.3" stroke-dasharray="5 4"/>
    <path d="M${X(3)} ${Y(104)}Q${X(13)} ${Y(110)} ${X(20)} ${Y(150)}" fill="none" stroke="#dc2626" stroke-opacity=".55" stroke-width="1.6" stroke-dasharray="5 4"/>
    <path d="${gaps.map(([a, b]) => `M${X(a)} ${Y(lvl[a])}L${X(b)} ${Y(lvl[b])}`).join("")}" fill="none" stroke="#dc2626" stroke-opacity=".4" stroke-width="1.4" stroke-dasharray="1 3.5" stroke-linecap="round"/>
    <path class="fs-draw" pathLength="100" d="${runs.map(path).join("")}" fill="none" stroke="#dc2626" stroke-opacity=".16" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="fs-draw" pathLength="100" d="${runs.map(path).join("")}" fill="none" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    ${lvl.map((v, i) => i === N - 1 ? "" : i in rain ? `<circle cx="${X(i)}" cy="${Y(v)}" r="2.4" fill="#fff" stroke="#9aa9a8" stroke-width="1.3"/>` : `<circle cx="${X(i)}" cy="${Y(v)}" r="2.5" fill="#dc2626" stroke="#fff" stroke-width="1.2"/>`).join("")}
    <circle class="fs-bw-ping" cx="${X(20)}" cy="${Y(148)}" r="3.8" fill="none" stroke="#dc2626" stroke-width="1.6"/>
    <circle cx="${X(20)}" cy="${Y(148)}" r="3.8" fill="#dc2626" stroke="#fff" stroke-width="1.5"/>
    <path d="M444 ${Y(104)}h6M447 ${Y(104)}V${Y(150)}M444 ${Y(150)}h6" fill="none" stroke="#b91c1c" stroke-width="1.4"/>
    <text class="fs-lbl" x="438" y="${f1(Y(127) + 4)}" font-size="11.5" font-weight="650" text-anchor="end" fill="#b91c1c">+46 mm</text>
    <text class="fine" x="438" y="${f1(Y(104) - 5)}" font-size="8.5" text-anchor="end" fill="${INK2}">Baseline</text>
    <g class="fine" font-size="8.5" fill="${INK2}">
      <path d="M${x0} 251h14" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round"/><text x="${x0 + 19}" y="254">Overnight level</text>
      <path d="M140 251h14" stroke="#dc2626" stroke-opacity=".6" stroke-width="1.6" stroke-dasharray="5 4"/><text x="159" y="254">Trend</text>
      <path d="M198 251h14" stroke="${INK2}" stroke-width="1.3" stroke-dasharray="5 4"/><text x="217" y="254">Baseline</text>
      <rect x="268" y="246" width="9" height="9" rx="1.5" fill="#7cc6e0"/><text x="282" y="254">Rain, set aside</text>
    </g>
  </svg>`;
  })();

  // 3. Pump Station Manager: the wet well in section against its depth
  // scale, the incoming sewer falling in, two submersibles on the floor and
  // the duty pump's riser to the rising main. The level climbs to pump
  // start, the duty pump runs it down to pump stop and rests, on one
  // timing (site.css: fs-psm-*). Each pump's start and stop are tagged, as
  // in the platform, with the volume moved each cycle between them.
  const psm = (() => {
    const F = 240, M = 62, yAt = (m) => f1(F - M * m);
    const L = 172, R = 312, W = 10, G = 36, TOP = 46;
    const lv = { high: yAt(2.6), start: yAt(2.35), stop: yAt(0.55) };
    const P = [[222, 1, "#0d9488"], [276, 2, "#c026d3"]];
    const badge = (x, y, n, c, r = 5.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#fff" stroke-width="1.3"/><text x="${x}" y="${f1(y + r * 0.5)}" font-size="${f1(r * 1.35)}" font-weight="700" text-anchor="middle" fill="#fff">${n}</text>`;
    const pump = ([x, n, c]) => `
      ${n === 1 ? `<rect class="fs-psm-run" x="${x - 16}" y="203" width="32" height="40" rx="10" fill="none" stroke="#4ade80" stroke-width="6"/>` : ""}
      <path d="M${x - 14} 240V235H${x + 19}V240Z" fill="#44605c"/>
      <rect x="${x - 11}" y="214" width="22" height="22" rx="4.5" fill="url(#psm-steel)" stroke="#7d8f8d"/>
      <path d="M${x - 11} 220h22M${x - 11} 225h22" stroke="#aebcba"/>
      <rect x="${x - 7}" y="208" width="14" height="7.5" rx="2.5" fill="#2b3533"/>
      ${badge(x, 229, n, c, 4.6)}`;
    const ticks = [0, 0.5, 1, 1.5, 2, 2.5];
    return `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>${efDefs("psm")}
      <linearGradient id="psm-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b2e3d9" stop-opacity=".9"/><stop offset=".2" stop-color="#7fc7b9" stop-opacity=".9"/><stop offset="1" stop-color="#2e8479" stop-opacity=".92"/></linearGradient>
      <linearGradient id="psm-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8" stop-opacity=".34"/><stop offset="1" stop-color="#38bdf8" stop-opacity=".06"/></linearGradient>
    </defs>
    <path d="M0 ${G}H${L - W}M${R + W} ${G}H480" fill="none" stroke="#a9b8b6" stroke-width="1.2"/>
    <path d="${[...Array(11)].map((_, k) => `M${8 + k * 14} ${G}l-4 5`).join("")}${[...Array(11)].map((_, k) => `M${334 + k * 14} ${G}l-4 5`).join("")}" fill="none" stroke="#c3cdcc"/>
    <rect x="${L}" y="${TOP}" width="${R - L}" height="${F - TOP}" fill="url(#psm-air)"/>
    <path class="fs-psm-cone" d="M196 55L192.6 ${lv.start}H199.4Z" fill="url(#psm-beam)" stroke="#38bdf8" stroke-opacity=".45" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <path class="fs-dash" d="M${L} 63q7 1.5 8 12V${lv.stop}" fill="none" stroke="#60a5fa" stroke-width="2.2" stroke-dasharray="3 6" stroke-linecap="round"/>
    <rect class="fs-psm-water" x="${L}" y="${lv.start}" width="${R - L}" height="${f1(F - lv.start)}" fill="url(#psm-wg)"/>
    <g class="fs-psm-surf" fill="none"><path d="M${L} ${lv.start}H${R}" stroke="#9fe7da" stroke-opacity=".5" stroke-width="6"/><path d="M${L} ${lv.start}H${R}" stroke="#2a8a7f" stroke-width="1.4"/></g>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M292 237V56" stroke="#a9b8b6" stroke-width="6"/><path d="M292 237V56" stroke="#dde5e3" stroke-width="3"/>
      <path d="M238 237V56H480" stroke="#ea7a2a" stroke-width="6.5"/><path d="M238 237V56H480" stroke="#fdba74" stroke-width="3.2"/>
      <path class="fs-psm-flow" d="M238 230V56H476" stroke="#fff" stroke-width="1.8"/>
    </g>
    <path d="M480 56l-7-4.5v9z" fill="#ea7a2a"/>
    ${P.map(pump).join("")}
    <path fill="url(#psm-cut)" d="M${L - W} ${G}H${L}V50H${L - W}ZM${L - W} 68H${L}V${F}H${R}V60H${R + W}V${F + W}H${L - W}ZM${R} ${G}H${R + W}V52H${R}ZM${L} ${G}H226V${TOP}H${L}ZM262 ${G}H${R}V${TOP}H262Z"/>
    <path d="M${L - W} ${G}V50M${L - W} 68V${F + W}H${R + W}V60M${R + W} 52V${G}M${L} ${TOP}V50M${L} 68V${F}H${R}V60M${R} 52V${TOP}M${L - W} ${G}H226V${TOP}H${L}M262 ${TOP}V${G}H${R + W}M262 ${TOP}H${R}" fill="none" stroke="#8ea19e"/>
    <rect x="221" y="31.5" width="46" height="4.5" rx="1.5" fill="#46605d"/>
    <rect x="189" y="${TOP}" width="14" height="9" rx="2" fill="#2b3533"/><circle cx="196" cy="52" r="1.6" fill="#38bdf8"/>
    <rect x="0" y="50" width="${L}" height="18" fill="#eef6fd" stroke="#93c5fd"/>
    <rect x="0.5" y="60" width="${L - 0.5}" height="7.5" fill="#9fd0f2"/><path d="M0 60H${L}" stroke="#3b82f6" stroke-opacity=".6"/>
    <path class="fs-dash" d="M6 64H${L - 6}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="2 7" stroke-linecap="round"/>
    <g fill="none" stroke-width="1.3" stroke-dasharray="5 4"><path d="M${L} ${lv.high}H340" stroke="#dc2626"/><path d="M${L} ${lv.start}H340" stroke="#0d7c72"/><path d="M${L} ${lv.stop}H340" stroke="#6b7f7d"/></g>
    <g fill="none" stroke="${INK2}" stroke-width="1.1"><path d="M346 ${lv.start + 1}V${lv.stop - 1}"/><path d="M342.5 ${lv.start + 7}l3.5-6 3.5 6M342.5 ${lv.stop - 7}l3.5 6 3.5-6" stroke-linejoin="round"/></g>
    <text class="fine" x="244" y="152" font-size="9" font-weight="650" fill="#0d7c72" ${halo}>Duty pump</text>
    <g class="fine">
      <text x="354" y="${f1(lv.high + 3.4)}" font-size="9.5" font-weight="600" fill="#b91c1c">High level</text>
      ${[["start", "Pump start", "2.35 m"], ["stop", "Pump stop", "0.55 m"]].map(([k, t]) => `${badge(358, lv[k], 1, P[0][2])}${badge(371, lv[k], 2, P[1][2])}<text x="381" y="${f1(lv[k] + 3.4)}" font-size="9.5" font-weight="600" fill="${INK2}">${t}</text>`).join("")}
      <g class="mono" font-size="9" text-anchor="end" fill="${INK}"><text x="472" y="${f1(lv.high + 3.4)}">2.60 m</text><text x="472" y="${f1(lv.start + 3.4)}">2.35 m</text><text x="472" y="${f1(lv.stop + 3.4)}">0.55 m</text></g>
      <text x="354" y="164" font-size="9" fill="${MUTED}">per cycle</text>
      <text x="354" y="176" class="mono" font-size="8" fill="${MUTED}">1.80 m × 12 m²</text>
      <g class="mono" font-size="8" fill="${MUTED}" text-anchor="end">${ticks.map((m) => `<text x="150" y="${f1(yAt(m) + 2.8)}">${m.toFixed(1)}</text>`).join("")}<text x="150" y="${f1(yAt(2.5) - 9)}">m</text></g>
      <path d="M155 ${yAt(2.5)}V${F}${ticks.map((m) => `M155 ${yAt(m)}h-3`).join("")}" fill="none" stroke="#9aa9a8"/>
      <path d="M${L} 252v12M${R} 252v12M${L} 258H${R}" fill="none" stroke="#9aa9a8"/><rect x="221" y="252" width="42" height="12" fill="#fff"/><text x="242" y="261" class="mono" font-size="8.5" text-anchor="middle" fill="${INK2}">Ø 3.91 m</text>
      <path d="M12 12h10" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/><text x="27" y="15" font-size="7.6" font-weight="650" letter-spacing=".06em" fill="${MUTED}">INCOMING SEWER</text>
      <path d="M458 12h10" stroke="#ea7a2a" stroke-width="2.5" stroke-linecap="round"/><text x="453" y="15" font-size="7.6" font-weight="650" letter-spacing=".06em" text-anchor="end" fill="${MUTED}">RISING MAIN</text>
      ${card(12, 82, 120, 28, { r: 7, shadow: .05 })}${badge(26, 96, 1, P[0][2])}<text x="37" y="99.5" font-size="9.5" font-weight="650" fill="${INK}">Pump 1</text>
      <text class="fs-psm-on" x="124" y="99.5" font-size="9" font-weight="650" text-anchor="end" fill="#15803d">Running</text><text class="fs-psm-off" x="124" y="99.5" font-size="9" text-anchor="end" fill="${MUTED}">Idle</text>
      ${card(12, 116, 120, 28, { r: 7, shadow: .05 })}${badge(26, 130, 2, P[1][2])}<text x="37" y="133.5" font-size="9.5" font-weight="650" fill="${INK}">Pump 2</text><text x="124" y="133.5" font-size="9" text-anchor="end" fill="${MUTED}">Standby</text>
    </g>
    <text class="fs-lbl" x="12" y="30" font-size="13" font-weight="650" fill="${INK}">8.5 L/s</text>
    <text class="fs-lbl" x="468" y="30" font-size="13" font-weight="650" text-anchor="end" fill="${INK}">29.7 L/s</text>
    <text class="fs-lbl" x="354" y="${f1((lv.start + lv.stop) / 2 - 3)}" font-size="12" font-weight="650" fill="${INK}">21.6 kL</text>
    ${card(12, 150, 120, 92, { r: 7, shadow: .05 })}
    <text class="fine" x="22" y="166" font-size="9" font-weight="650" fill="${INK2}">Pump 1 against rating</text>
    ${(() => {
      const cx = 72, cy = 223, r = 33, pt = (v, rr) => { const a = Math.PI - (Math.min(v, 120) / 120) * Math.PI; return [f1(cx + rr * Math.cos(a)), f1(cy - rr * Math.sin(a))]; };
      const arc = (a, b, c, w) => { const [x0, y0] = pt(a, r), [x1, y1] = pt(b, r); return `<path d="M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}" fill="none" stroke="${c}" stroke-width="${w}"/>`; };
      const [nx, ny] = pt(100, r - 7);
      return `${arc(0, 120, "#eef1f2", 7)}${arc(0, 70, "#fbd5d5", 7)}${arc(90, 112, "#22c55e", 7)}
      <path d="${[0, 20, 40, 60, 80, 100, 120].map((v) => { const [a, b] = pt(v, r - 5.5), [c, d] = pt(v, r - 9); return `M${a} ${b}L${c} ${d}`; }).join("")}" stroke="#9aa9a8" stroke-width="1"/>
      <path d="M${cx} ${cy}L${nx} ${ny}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="3.6" fill="${INK}"/>
      <text class="mono" x="${cx}" y="239.5" font-size="10" font-weight="650" text-anchor="middle" fill="${INK}">100%</text>
      <text class="fine" x="106" y="239.5" font-size="7.6" fill="${MUTED}">of rated</text>`;
    })()}
  </svg>`;
  })();

  // 4. Alarms that reach people: the alarm, this week's roster with today's
  // duty officer picked out, and their phone as the SMS and the email land.
  const alarms = (() => {
    const days = "MTWTFSS".split(""), who = [0, 0, 1, 1, 1, 2, 2], today = 2;
    const P = [["SL", "#8b5cf6"], ["RK", "#0d7c72"], ["JP", "#d97706"]];
    const dx = (k) => f1(190 + k * 16);
    const note = (y, i, bg, ic, app, title, body) => `
      <g class="fs-al-n" style="--i:${i}">
        <rect x="350" y="${y}" width="104" height="48" rx="11" fill="#fff" fill-opacity=".94"/>
        <rect x="357" y="${y + 7}" width="13" height="13" rx="3.5" fill="${bg}"/>${glyph(ic, 359.5, y + 9.5, 8, "#fff", 2.4)}
        <text class="fine" x="375" y="${y + 16.5}" font-size="7.6" font-weight="600" fill="${MUTED}">${app}</text><text class="fine" x="447" y="${y + 16.5}" font-size="7" text-anchor="end" fill="${MUTED}">now</text>
        <text class="fs-lbl" style="--lg:11.5px" x="357" y="${y + 31}" font-size="9.5" font-weight="650" fill="${INK}">${title}</text>
        <text class="fine" x="357" y="${y + 42}" font-size="8" fill="${INK2}">${body}</text>
      </g>`;
    return `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <linearGradient id="al-body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a4644"/><stop offset=".12" stop-color="#1a2221"/><stop offset=".88" stop-color="#1a2221"/><stop offset="1" stop-color="#3a4644"/></linearGradient>
      <linearGradient id="al-wall" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#0a3532"/><stop offset=".55" stop-color="#145a54"/><stop offset="1" stop-color="#3d9991"/></linearGradient>
      <linearGradient id="al-av" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c9a8e"/><stop offset="1" stop-color="#0b6b62"/></linearGradient>
    </defs>
    ${card(12, 70, 138, 126, { r: 10, stroke: "#f3c5c5" })}
    <circle class="fs-al-ping" cx="34" cy="94" r="12" fill="none" stroke="#dc2626" stroke-width="2"/>
    <circle cx="34" cy="94" r="12" fill="#dc2626"/>${glyph("triangle-alert", 27, 86.5, 14, "#fff", 2.2)}
    <g class="fine"><text x="53" y="91" font-size="7.6" font-weight="700" letter-spacing=".08em" fill="#b91c1c">ALARM</text><text x="53" y="103" font-size="9" fill="${MUTED}">Site 07 · Wet well</text>
      <text class="mono" x="140" y="91" font-size="8.5" text-anchor="end" fill="${MUTED}">14:02</text>
      <text x="22" y="180" font-size="8.5" fill="${MUTED}">Above 2.40 m for 2 min</text></g>
    <text class="fs-lbl" style="--lg:13.5px" x="22" y="130" font-size="12" font-weight="650" fill="${INK}">High-high level</text>
    <text class="mono" x="22" y="161" font-size="16" font-weight="650" fill="#b91c1c">2.43 m</text>

    ${card(172, 34, 128, 202, { r: 10 })}
    <g class="fine"><text x="184" y="53" font-size="9" font-weight="650" fill="${INK2}">On call this week</text>${glyph("calendar", 278, 44, 11, MUTED, 2)}</g>
    <rect x="${f1(dx(today) - 8)}" y="60" width="16" height="36" rx="5" fill="#e6f4f1" stroke="#0d7c72" stroke-opacity=".5"/>
    <g class="fine" font-size="8" text-anchor="middle">${days.map((d, k) => `<text x="${dx(k)}" y="71" fill="${k === today ? "#0d7c72" : MUTED}" font-weight="${k === today ? 700 : 400}">${d}</text>`).join("")}</g>
    ${who.map((p, k) => `<circle cx="${dx(k)}" cy="84" r="5.6" fill="${P[p][1]}" fill-opacity="${k === today ? 1 : .55}"/>`).join("")}
    <path d="M184 106H288" stroke="${LINE}"/>
    <circle class="fs-al-ping" cx="236" cy="138" r="19" fill="none" stroke="#0d7c72" stroke-width="2" style="--d:.6s"/>
    <circle cx="236" cy="138" r="19" fill="url(#al-av)"/><text x="236" y="142.5" font-size="12.5" font-weight="700" text-anchor="middle" fill="#fff">RK</text>
    <text class="fs-lbl" style="--lg:13px" x="236" y="175" font-size="11.5" font-weight="650" text-anchor="middle" fill="${INK}">Duty officer</text>
    <text class="fine" x="236" y="188" font-size="8.5" text-anchor="middle" fill="${MUTED}">On call today</text>
    ${[[184, "message-square", "SMS"], [240, "mail", "Email"]].map(([x, ic, t]) => `<rect x="${x}" y="201" width="48" height="20" rx="10" fill="#f1f6f5" stroke="#d2e2de"/>${glyph(ic, x + 7, 205.5, 11, "#0d7c72", 2.2)}<text class="fine" x="${x + 22}" y="214.5" font-size="8.5" font-weight="600" fill="${INK2}">${t}</text>`).join("")}

    <g fill="none" stroke="#0d7c72" stroke-width="2" stroke-linecap="round"><path class="fs-dash" d="M152 133H166" stroke-dasharray="3 6"/><path class="fs-dash" d="M302 140H330" stroke-dasharray="3 6"/></g>
    <g fill="#0d7c72"><path d="M171 133l-6-4v8z"/><path d="M337 140l-6-4v8z"/></g>

    <rect x="338" y="62" width="2.5" height="16" rx="1" fill="#2b3533"/><rect x="338" y="84" width="2.5" height="26" rx="1" fill="#2b3533"/><rect x="463.5" y="90" width="2.5" height="34" rx="1" fill="#2b3533"/>
    <rect x="340" y="6" width="124" height="258" rx="22" fill="url(#al-body)"/>
    <rect x="345" y="11" width="114" height="248" rx="18" fill="url(#al-wall)"/>
    <path d="M345 196C374 182 402 206 430 192S459 184 459 184V241Q459 259 441 259H363Q345 259 345 241Z" fill="#fff" fill-opacity=".06"/>
    <path d="M345 214C372 202 404 224 432 210S459 204 459 204V241Q459 259 441 259H363Q345 259 345 241Z" fill="#fff" fill-opacity=".05"/>
    <rect x="384" y="17" width="36" height="10" rx="5" fill="#050807"/>
    <text class="fine" x="402" y="44" font-size="7.6" text-anchor="middle" fill="#fff" fill-opacity=".8">Wednesday 11 November</text>
    <text x="402" y="77" font-size="29" font-weight="300" letter-spacing="-.5" text-anchor="middle" fill="#fff">14:02</text>
    ${note(92, 0, "#22c55e", "message-circle", "Messages", "High-high level", "Site 07 · 2.43 m")}
    ${note(146, 1, "#3b82f6", "mail", "Mail", "Alarm: Site 07", "High-high level, 2.43 m")}
    <circle cx="368" cy="234" r="9.5" fill="#fff" fill-opacity=".14"/><circle cx="436" cy="234" r="9.5" fill="#fff" fill-opacity=".14"/>
    <g class="fine">${glyph("flashlight", 363.5, 229.5, 9, "#fff", 2)}${glyph("camera", 431.5, 229.5, 9, "#fff", 2)}</g>
    <rect x="382" y="250" width="40" height="3" rx="1.5" fill="#fff" fill-opacity=".75"/>
  </svg>`;
  })();

  // [title, note beside it, status bar note, drawing]
  const views = [
    ["I/I heat map", "Severity by pipe", "Arrows run downstream, faster where I/I is worse", heat],
    ["Blockage Watch", "Dry nights only", "Rain set aside, judged on the overnight trough", blockage],
    ["Pump Station Manager", "Wet well, to scale", "Live level and pump runs", psm],
    ["Alarms", "Sent to people, not addresses", "Sent to whoever is on call today", alarms],
  ];
  const rail = ["layout-grid", "flame", "chart-spline", "fan", "bell-ring", "file-text"];
  return `
  <div class="fs-screen" data-reveal="right" data-view="0">
    <div class="fs-chrome"><img src="${site.logoWhite}" alt=""><span>FlowSense</span><span class="dot">Demo</span><span class="fs-bell">${icon("bell", false)}<b>3</b></span></div>
    <div class="fs-rail" aria-hidden="true">${rail.map((ic, k) => `<i${k >= 1 && k <= 4 ? ` data-v="${k - 1}"` : ""}>${icon(ic, false)}</i>`).join("")}</div>
    ${views.map(([t, s, , svg], i) => `<div class="fs-view${i === 0 ? " active" : ""}"><p class="fs-view-title">${t}<small>${s}</small></p>${svg}</div>`).join("")}
    <div class="fs-status"><span class="fs-caption">Illustration</span>${views.map(([, , note], i) => `<span data-v="${i}">${note}</span>`).join("")}</div>
  </div>`;
}

// The home hero's flow meter reporting in. site.js draws the last day of
// readings and moves it on every few seconds. Labelled as an illustration,
// like the flow lab and the FlowSense screens.
const liveCard = () => `
<aside class="live" aria-label="Illustration of a flow meter reporting live" data-reveal="right" style="--i:5">
  <div class="live-head"><span class="live-site">${icon("radio-tower", false)} Site 07, trunk sewer</span><span class="live-tag">Reporting</span></div>
  <div class="live-value"><b data-live="q">41.8</b><span>L/s</span></div>
  <p class="live-label">Flow over the last 24 hours</p>
  <svg class="live-chart" viewBox="0 0 300 86" aria-hidden="true">
    <defs><linearGradient id="live-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d9991" stop-opacity=".26"/><stop offset="1" stop-color="#3d9991" stop-opacity="0"/></linearGradient></defs>
    <path class="live-area" fill="url(#live-fill)"/><path class="live-dwf"/><path class="live-line"/><circle class="live-dot" r="3.5"/>
  </svg>
  <div class="live-read">
    <div><span>Depth</span><b data-live="d">212</b><small>mm</small></div>
    <div><span>Velocity</span><b data-live="v">0.76</b><small>m/s</small></div>
    <div><span>Battery</span><b>94</b><small>%</small></div>
  </div>
  <div class="live-foot"><span>Illustration</span><span>${icon("signal", false)} Sent over 4G</span></div>
</aside>`;

// "Add to quote": collects products into one enquiry (quote.js). The item
// carries paths from the site root, since the list is shown on other pages.
const plainPath = (src) => src.replace("@root/", "");
const quoteItem = (p) => ({ id: `${p.brand.slug}-${p.id}`, name: p.name, brand: p.brand.name, image: plainPath(p.image), href: p.href || `products/${p.brand.slug}.html#${p.id}` });
// `by` names the element that says which product it is (a card's title), for
// screen readers among many cards.
const describedBy = (by) => (by ? ` aria-describedby="${by}"` : "");
const quoteBtn = (item, cls = "", by = "") => `<button class="quote-add${cls ? ` ${cls}` : ""}" type="button" data-quote="${esc(JSON.stringify(item))}"${describedBy(by)}>${icon("list-plus", false)}${icon("check", false)}<span>Add to quote</span></button>`;

// Buy, hire or Data as a Service: one card each, with the enquiry form
// opened on the right topic and way of working.
const waysSection = (r, { cls = "" } = {}) => `
<section class="section${cls ? ` ${cls}` : ""}" id="ways"><div class="wrap">
  <div class="section-head"><h2 class="h-lg" data-reveal>${esc(C.ways.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(C.ways.lede)}</p></div>
  <div class="ways">
    ${C.ways.items.map((w, n) => `
    <article class="way${w.mode === "managed" ? " way-feature" : ""}" data-reveal style="--i:${n}">
      <div class="way-head"><span class="card-icon">${icon(w.icon)}</span><div><h3>${esc(w.title)}</h3><p class="way-line">${esc(w.line)}</p></div></div>
      <p>${esc(w.text)}</p>
      <ul class="way-points">${w.points.map((pt) => `<li>${icon("check", false)}<span>${esc(pt)}</span></li>`).join("")}</ul>
      <div class="way-actions">
        <a class="btn ${w.mode === "managed" ? "btn-primary" : "btn-brand"}" href="${contactHref(r, { topic: w.topic, mode: w.mode })}">${esc(w.cta)}</a>
        <a class="link-arrow" href="${r}${w.link[0]}">${esc(w.link[1])} ${icon("arrow-right")}</a>
      </div>
    </article>`).join("")}
  </div>
</div></section>`;

// Outcomes from EDS projects as stat cards.
const resultCards = (list, extra = "") => `
  <div class="results">
    ${list.map((x, n) => `
    <figure class="result" data-reveal style="--i:${n}">
      <b class="result-stat">${esc(x.stat)}</b>
      <span class="result-label">${esc(x.label)}</span>
      <p>${esc(x.text)}</p>
      <figcaption>${icon("map-pin", false)}${esc(x.who)}</figcaption>
    </figure>`).join("")}${extra}
  </div>`;
// Two at most on a service page: one sits beside its heading, two share a row.
const resultsFor = (slug) => C.results.filter((x) => x.services.includes(slug)).slice(0, 2);

// How a monitoring program runs, as four numbered steps.
const processSection = (tone = "alt") => `
<section class="section band${tone === "alt" ? " alt" : ""}" id="how-it-runs"><div class="wrap">
  <div class="band-head"><h2 class="h-lg" data-reveal>How a program runs</h2><p class="lede" data-reveal style="--i:1">From the first call to data you can act on.</p></div>
  <ol class="process">
    ${C.programSteps.map(([, t, d], n) => `<li data-reveal style="--i:${n}"><span class="process-n">${String(n + 1).padStart(2, "0")}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join("")}
  </ol>
</div></section>`;

// "PDF", "ZIP": shown in the Documents panel so people know what they will get.
const docType = (href) => href.split(".").pop().toUpperCase();
const prodDocs = (p, by = "") => `<ul class="prod-docs">${p.docs.map((d) => `<li><a href="${d.href}" rel="noopener"${describedBy(by)}>${icon("download")}<span>${esc(d.label)}</span></a></li>`).join("")}</ul>`;

// The structured specifications a product has on the site: the EDS product
// pages, LIDoTT Alarm and Alarm2. Shown first in the quick view and in the
// compare view; a product without them shows a blank there, never a guess.
const specsOf = (p) => p.href === "products/lidott-alarm.html" ? [["Specifications", C.lidott.specs]] : p.href === "products/alarm2.html" ? [["Specifications", C.alarm2.specs]] : C.productPages.find((pg) => `products/${pg.slug}.html` === p.href)?.specs || [];

// One product. The whole card opens the quick view (products.js), and the
// details the quick view and the compare view show travel with the card as
// JSON. The body is grouped so the table view on the products page can lay
// the same card out as a row: shot, name and note, type, documents, actions.
// The quick view button comes first, so a screen reader meets the product
// before its actions, and each action names its product.
const productCard = (r, p, { id = p.id, showBrand = false, n = 0 } = {}) => {
  const t = typeOf(p.type);
  // The product's own documents, then the ones that cover its whole brand.
  const docs = [...(p.docs || []), ...(p.brand.docs || []).filter((d) => !d.pageOnly)];
  const item = quoteItem(p);
  const data = { id: item.id, name: p.name, note: p.note || "", image: p.image, brand: p.brand.name, brandHref: `${r}products/${p.brand.slug}.html`, range: p.range, type: t.label, page: p.href ? `${r}${p.href}` : "", docs, specs: specsOf(p), quote: item };
  return `
<article class="card prod" id="${id}" data-type="${p.type}" data-brand="${p.brand.slug}" data-docs="${docs.length ? 1 : 0}" data-search="${esc([p.name, p.note, p.brand.name, p.group, t.label].join(" ").toLowerCase())}" data-product="${esc(JSON.stringify(data))}" data-reveal style="--i:${n % 5}">
  <button class="prod-open" type="button" aria-haspopup="dialog" aria-label="Quick view: ${esc(p.name)}${showBrand ? `, ${esc(p.brand.name)}` : ""}"><span>${icon("zoom-in", false)}Quick view</span></button>
  <div class="brand-shot"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy"></div>
  <div class="prod-body">
    <div class="prod-name">${showBrand ? `<span class="tag">${esc(p.brand.name)}</span>` : ""}<h3 id="${id}-name">${esc(p.name)}</h3>${p.note ? `<p>${esc(p.note)}</p>` : ""}</div>
    <span class="prod-type">${esc(t.label)}</span>
    <div class="prod-foot">${p.docs ? prodDocs(p, `${id}-name`) : `<span class="prod-nodocs"><span class="sr-only">No documents online</span></span>`}${p.href ? `<a class="link-arrow prod-page" href="${r}${p.href}" aria-describedby="${id}-name">See how it works ${icon("arrow-right")}</a>` : ""}<div class="prod-actions">${quoteBtn(item, "sm", `${id}-name`)}<button class="prod-cmp" type="button" aria-pressed="false" aria-describedby="${id}-name" data-track-label="Compare" data-track-item="${esc(p.name)}">${icon("git-compare-arrows", false)}<span>Compare</span></button></div></div>
  </div>
</article>`;
};

// The product quick view. products.js fills it from the card that opened it.
const quickView = () => `
<dialog class="qv" aria-labelledby="qv-name">
  <div class="qv-bar">
    <button class="qv-btn" type="button" data-qv-step="-1" aria-label="Previous product">${icon("chevron-left", false)}</button>
    <span class="qv-count" data-qv="count"></span>
    <button class="qv-btn" type="button" data-qv-step="1" aria-label="Next product">${icon("chevron-right", false)}</button>
    <button class="qv-copy" type="button" data-qv-copy>${icon("link", false)}<span>Copy link</span></button>
    <button class="qv-btn" type="button" data-qv-close aria-label="Close">${icon("x", false)}</button>
  </div>
  <p class="sr-only" aria-live="polite" data-qv="say"></p>
  <div class="qv-shot"><img data-qv="image" alt=""></div>
  <div class="qv-body">
    <p class="tag" data-qv="brand"></p>
    <h2 id="qv-name" data-qv="name"></h2>
    <p class="qv-note" data-qv="note"></p>
    <dl class="qv-facts">
      <div><dt>Type</dt><dd data-qv="type"></dd></div>
      <div><dt>Family</dt><dd data-qv="range"></dd></div>
      <div><dt>Brand</dt><dd><a data-qv="brandLink"></a></dd></div>
    </dl>
    <div class="qv-actions">
      <a class="btn btn-brand btn-lg" data-qv="enquire">Request pricing</a>
      <button class="quote-add btn-lg" type="button" data-qv="quote">${icon("list-plus", false)}${icon("check", false)}<span>Add to quote</span></button>
    </div>
    <a class="qv-call" href="${site.phoneHref}">${icon("phone", false)} Or call ${site.phone}</a>
    <div class="qv-specs" data-qv="specs" hidden><h3>Specifications</h3><table class="specs"><tbody></tbody></table><a class="link-arrow" data-qv="specsAll" hidden>All specifications ${icon("arrow-right")}</a></div>
    <a class="link-arrow qv-page" data-qv="page" hidden>See how it works ${icon("arrow-right")}</a>
    <div class="qv-docs" data-qv="docs" hidden><h3>Documents</h3><ul class="aside-links"></ul></div>
    <p class="note">Sales, hire and service from EDS, Australia-wide.</p>
  </div>
  <template data-qv="docIcon">${icon("download")}</template>
</dialog>
<div class="cmp-tray" role="region" aria-label="Instruments to compare" hidden>
  <b class="cmp-n"></b>
  <div class="cmp-sel"></div>
  <button class="btn btn-primary" type="button" data-cmp-open disabled>Compare side by side</button>
  <button class="cmp-clear" type="button" data-cmp-clear>Clear</button>
  <template data-cmp="x">${icon("x", false)}</template>
</div>
<dialog class="cmp" aria-labelledby="cmp-title">
  <div class="cmp-bar"><h2 id="cmp-title">Compare instruments</h2><button class="qv-btn" type="button" data-cmp-close aria-label="Close">${icon("x", false)}</button></div>
  <div class="table-scroll"><table class="cmp-table"><thead></thead><tbody></tbody></table></div>
  <div class="cmp-foot">
    <a class="btn btn-brand" data-cmp-enquire>Request pricing for these</a>
    <button class="btn btn-outline" type="button" data-cmp-quote>${icon("list-plus")} Add all to quote</button>
    <p class="note" data-cmp-note></p>
  </div>
</dialog>`;

/* ------------------------------------------------------------------ */
/* pages                                                               */
/* ------------------------------------------------------------------ */
const pages = [];
const add = (p) => pages.push(p);

/* ---- home ---- */
// A city ref is a service (`s:`), a solution (`o:`), a product range (`p:`),
// or one of the two pages with no prefix, "flowsense" and "lidott".
function cityHref(r, ref) {
  if (ref === "flowsense") return `${r}flowsense.html`;
  if (ref === "lidott") return `${r}products/lidott-alarm.html`;
  const [k, slug] = ref.split(":");
  return `${r}${{ s: "services", o: "solutions", p: "products" }[k]}/${slug}.html`;
}
function cityLabel(ref) {
  if (ref === "flowsense") return "EDS FlowSense";
  if (ref === "lidott") return "LIDoTT Alarm";
  const [k, slug] = ref.split(":");
  if (k === "p") return esc(brand(slug).name);
  const item = k === "s" ? svc(slug) : sol(slug);
  return item.short || item.title;
}

add({
  file: "index.html",
  title: "Environmental Data Services | Water & Wastewater Monitoring",
  description: "Environmental Data Services (EDS): flow meters, samplers, trained field crews and FlowSense data for water and wastewater. Australian owned since 1991.",
  current: "home",
  scripts: ["city-scene.js", "city-traffic.js", "city-sound.js", "city-weather.js", "city.js"],
  body: (r) => {
    const words = ["Every", "drop,", "measured."];
    // The page tells one story in ten bands. Dark bands run on a schedule:
    // the hero, the city (the one interactive showpiece) and the closing call
    // to action. The flow lab lives on the sewer flow and I&I pages, the white
    // papers on Resources, and the office map on About and Contact.
    return `
<section class="hero">
  <canvas class="hero-canvas" data-flowfield="dense" aria-hidden="true"></canvas>
  <div class="wrap hero-body">
    <div class="hero-main">
      <div>
        <h1 class="h-xl" aria-label="Every drop, measured.">${words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(" ")}</h1>
        <p class="lede" data-reveal style="--i:4">${esc(C.homeLede)}</p>
        <div class="hero-actions" data-reveal style="--i:5">
          <a class="btn btn-primary btn-lg" href="${r}services/index.html">Our services</a>
          <a class="btn btn-ghost btn-lg" href="#city-explorer">Explore the city</a>
        </div>
      </div>
      ${liveCard()}
    </div>
  </div>
</section>

<section class="clients proof" aria-label="Clients and key figures">
  <p>Trusted by government, utilities, councils and industry</p>
  <div class="wrap">
    ${logoGrid()}
    ${proofRow()}
  </div>
</section>

<section class="section" id="services">
  <div class="wrap">
    <div class="section-head split">
      <h2 class="h-lg" data-reveal>Specialised services, delivered Australia-wide.</h2>
      <a class="btn btn-outline" href="${r}services/index.html">All services</a>
    </div>
    <div class="grid bento">
      ${C.services.filter((s) => s.featured).map((s, n) => cardLink(r, {
        href: `services/${s.slug}.html`, iconName: s.icon, title: s.short || s.title, text: s.summary, n, tags: s.tags,
        // The first service leads with a photo of the meter EDS installs; the
        // third sits on the brand gradient, so the grid is not all white tiles.
        ...(n === 0 && { cls: "bento-lead", media: `<span class="bento-shot"><img src="${C.img("s2.5-04-small-766x1024.png")}" alt="" loading="lazy"></span>` }),
        ...(n === 2 && { cls: "bento-wide" }),
      })).join("")}
    </div>
  </div>
</section>

<section class="section alt" id="results">
  <div class="wrap">
    <div class="section-head split">
      <div><p class="eyebrow">Results from the field</p><h2 class="h-lg" data-reveal>Data that changed the decision.</h2></div>
      <a class="btn btn-outline" href="${r}about.html#projects">Recent projects</a>
    </div>
    ${resultCards(C.results.filter((x) => x.home))}
  </div>
</section>

<section class="section dark city-section" id="city-explorer">
  <div class="wrap">
    <div class="section-head">
      <h2 class="h-lg" data-reveal>Where does EDS fit in your network?</h2>
      <p class="lede" data-reveal style="--i:1">Pick a district to lift it out of the city and see the services and products EDS brings to it.</p>
    </div>
  </div>
  <div class="wrap wide">
    <div class="city-grid" id="city-grid">
      <button type="button" class="city-close" aria-label="${esc(C.cityUi.toolbar.close)}" hidden>${icon("x", false)}</button>
      <div class="city-tabs" role="tablist" aria-label="${esc(C.cityUi.tabsLabel)}">
        ${C.city.map((z, i) => `<button class="city-tab" role="tab" id="city-tab-${z.id}" aria-controls="city-card-${z.id}" data-zone="${z.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${icon(z.icon)}${z.name}</button>`).join("")}
      </div>

      <div class="city-stage" data-reveal="scale">
        <div class="city-view">
        <div class="city-clip">
          <div class="city-model"><svg id="city" role="group" aria-label="${esc(C.cityUi.stageLabel)}"></svg></div>
          <div class="city-zoom" role="group" aria-label="${esc(C.cityUi.toolbar.zoomLabel)}"><button type="button" data-act="zoom-out" aria-label="${esc(C.cityUi.toolbar.zoomOut)}" disabled>${icon("minus", false)}</button><button type="button" data-act="zoom-in" aria-label="${esc(C.cityUi.toolbar.zoomIn)}">${icon("plus", false)}</button></div>
        </div>
        <div class="city-asset" id="city-asset" role="group" hidden>
          <svg class="city-asset-svg" aria-hidden="true" focusable="false"></svg>
          <div class="city-asset-bar"><button type="button" class="btn btn-ghost city-btn" data-act="asset-back">${icon("arrow-left")}<span></span></button><button type="button" class="btn btn-ghost city-btn" data-act="asset-toggle" data-pressed="true">${icon("unfold-vertical")}${icon("fold-vertical", false)}<span></span></button></div>
          <p class="city-asset-detail" aria-live="polite"></p>
        </div>
        <div class="city-notes" id="city-notes" role="group" hidden><svg class="city-leaders" aria-hidden="true" focusable="false"></svg><div class="city-notes-col" data-side="left"></div><div class="city-notes-col" data-side="right"></div></div>
        <div class="city-tip" id="city-tip" role="group" aria-label="${esc(C.cityUi.tipLabel)}" hidden><div class="city-tip-body"></div><button type="button" class="city-tip-close" aria-label="${esc(C.cityUi.toolbar.close)}">${icon("x", false)}</button></div>
        </div>
        <ol class="city-notes-list" id="city-notes-list" hidden></ol>
      </div>

      <div class="city-bar">
        <div class="city-toolbar" role="toolbar" aria-label="${esc(C.cityUi.toolbarLabel)}">
          <button type="button" class="btn btn-primary city-btn" data-act="tour">${icon("route")}<span>${esc(C.cityUi.toolbar.tour)}</span></button>
          <button type="button" class="btn btn-ghost city-btn" data-act="storm" data-pressed="false" aria-describedby="city-note">${icon("cloud-rain")}<span>${esc(C.cityUi.toolbar.storm)}</span></button>
          <button type="button" class="btn btn-ghost city-btn" data-act="sound" data-pressed="false" aria-label="${esc(C.cityUi.toolbar.mute)}">${icon("volume-2", false)}${icon("volume-x", false)}</button>
          <button type="button" class="btn btn-ghost city-btn" data-act="explode" data-pressed="false">${icon("unfold-vertical")}${icon("fold-vertical", false)}<span>${esc(C.cityUi.explode.take)}</span></button>
          <button type="button" class="btn btn-ghost city-btn" data-act="under" data-pressed="false">${icon("layers")}<span>${esc(C.cityUi.toolbar.under)}</span></button>
          <button type="button" class="btn btn-ghost city-btn" data-act="expand" data-pressed="false">${icon("maximize-2")}${icon("minimize-2", false)}<span>${esc(C.cityUi.toolbar.expand)}</span></button>
        </div>
        <p class="city-caption" aria-live="off" data-rest="${esc(C.cityUi.captionRest)}">${esc(C.cityUi.captionRest)}</p>
        <div class="city-hud" aria-label="${esc(C.cityUi.hud.label)}">
          ${C.cityUi.hud.tiles.map((t) => `<div class="city-tile" data-tile="${t.key}"><span>${esc(t.label)}</span><b data-value>${esc(t.rest)}</b><small>${esc(t.unit)}</small>${t.key === "alarms" ? icon("bell", false) : ""}</div>`).join("")}
          <div class="city-tile city-tile-spark" data-tile="spark"><span>${esc(C.cityUi.hud.sparkLabel)}</span><svg class="city-spark" viewBox="0 0 220 48" preserveAspectRatio="none" aria-hidden="true"></svg></div>
        </div>
        <p class="sr-only" id="city-live" aria-live="polite"></p>
        <p class="note city-note" id="city-note">${icon("info", false)}${esc(C.cityUi.note)}</p>
        <ul class="city-legend" aria-label="${esc(C.cityUi.legend.label)}">
          ${C.cityUi.legend.items.map(([ic, label]) => `<li>${icon(ic, false)}${esc(label)}</li>`).join("")}${C.cityUi.legend.underItems.map(([ic, label]) => `<li class="for-under">${icon(ic, false)}${esc(label)}</li>`).join("")}
        </ul>
      </div>

      <div class="city-panel">
        ${C.city.map((z, i) => `
        <div class="city-card${i === 0 ? " active" : ""}" id="city-card-${z.id}" role="tabpanel" aria-labelledby="city-tab-${z.id}" data-zone="${z.id}" data-name="${esc(z.name)}">
          <div class="city-card-head" style="--i:0"><span class="city-badge holder">${icon(z.icon)}</span><h3>${z.name}</h3></div>
          <p style="--i:1">${z.blurb}</p>
          <button type="button" class="city-inside" style="--i:1" data-asset="${z.asset.id}" data-zone="${z.id}">${icon("scan-eye")}<span>${esc(z.asset.button)}</span>${icon("arrow-right", false)}</button>
          <div style="--i:2"><h4>Services</h4><ul class="city-list">${z.services.map((s) => `<li><a href="${cityHref(r, s)}">${cityLabel(s)}${icon("arrow-right")}</a></li>`).join("")}</ul></div>
          <div style="--i:3"><h4>Products</h4><div class="chips">${z.products.map(([label, ref]) => `<a class="chip" href="${cityHref(r, ref)}">${esc(label)}</a>`).join("")}</div></div>
          <div style="--i:4"><h4>${esc(C.cityUi.sensorsHeading)}</h4>
            <ul class="city-sensors">${z.sensors.map((s) => `<li><button type="button" data-sensor="${s.id}" aria-controls="city-tip" aria-expanded="false">${icon(s.icon, false)}<span class="cs-name">${esc(s.name)}</span><span class="sr-only">: </span><span class="cs-read"><b data-read="${s.id}">${s.reads[0].text ? esc(C.cityUi.text[s.reads[0].text]) : s.reads[0].base.toFixed(s.reads[0].decimals)}</b>${s.reads[0].unit === "%" ? "%" : s.reads[0].unit ? ` ${esc(s.reads[0].unit)}` : ""}</span></button></li>`).join("")}</ul>
            <p class="note">${esc(C.cityUi.readingsNote)}</p></div>
          ${C.cityStorm.steps.filter((s) => s.zone === z.id).map((s) => `<p class="city-why" data-step="${s.n}" hidden style="--i:5">${esc(s.why)} <a href="${cityHref(r, s.link)}">${cityLabel(s.link)}${icon("arrow-right")}</a></p>`).join("")}
          ${z.id === "ops" ? `<div class="sms city-log" style="--i:5" aria-label="${esc(C.cityUi.logLabel)}"><div><small>${esc(C.cityUi.logStamp)}</small>${esc(C.cityUi.heartbeat)}</div></div>` : ""}
        </div>`).join("")}
      </div>
    </div>
  </div>
  <div class="city-track" id="city-track" hidden></div>
  <div class="city-tour" id="city-tour" role="region" aria-label="${esc(C.cityUi.tour.title)}" hidden>
    <div class="city-tour-bg"></div>
    <div class="city-tour-stage" id="city-tour-stage"></div>
    <div class="city-tour-top">
      <div class="city-tour-where"><p class="eyebrow">${esc(C.cityUi.tour.title)}</p><p class="city-tour-title" id="city-tour-title"></p><p class="city-tour-sub" id="city-tour-sub"></p></div>
      <button type="button" class="btn btn-ghost city-btn city-tour-leave" data-act="tour-leave" aria-label="${esc(C.cityUi.tour.leave)}" aria-keyshortcuts="Escape">${icon("x", false)}<span>${esc(C.cityUi.tour.leave)}</span><kbd aria-hidden="true">Esc</kbd></button>
    </div>
    <div class="city-tour-rail" id="city-tour-rail" role="group" aria-label="${esc(C.cityUi.tour.railLabel)}"></div>
    <div class="city-tour-card" id="city-tour-card"><p class="city-tour-num"></p><h3></h3><p class="city-tour-blurb"></p><div class="chips"></div><button type="button" class="city-tour-open" data-act="tour-open">${esc(C.cityUi.tour.open)}${icon("arrow-right", false)}</button></div>
    <div class="city-tour-hint" id="city-tour-hint"><span class="city-tour-mouse" aria-hidden="true"></span><span data-text></span></div>
    <div class="city-tour-end" id="city-tour-end"><div><h3>${esc(C.cityUi.tour.end.heading)}</h3><p>${esc(C.cityUi.tour.end.text)}</p><div class="city-tour-acts"><a class="btn btn-primary" href="${r}enquire.html">${esc(C.cityUi.tour.end.enquire)}</a><button type="button" class="btn btn-ghost" data-act="tour-end">${esc(C.cityUi.tour.end.back)}</button></div><p class="city-tour-more">${esc(C.cityUi.tour.end.more)}</p></div></div>
  </div>
  <script type="application/json" id="city-data">${JSON.stringify({ ui: C.cityUi, storm: C.cityStorm, zones: C.city.map(({ id, name, sensors, strata, asset }) => ({ id, name, sensors, strata, asset: { ...asset, parts: asset.parts.map((p) => ({ ...p, href: p.ref ? cityHref(r, p.ref) : "" })) } })) }).replace(/</g, "\\u003c")}</script>
</section>

${waysSection(r)}

<section class="section fs-band" id="flowsense">
  <div class="wrap fs-grid">
    <div>
      <h2 class="h-lg" data-reveal>The platform behind every reading.</h2>
      <p class="lede" data-reveal style="--i:1">EDS FlowSense, built and supported in Australia: live operations, infiltration and inflow, pump stations and calibrated models, for every site we measure.</p>
      <div class="fs-list" role="group" aria-label="FlowSense tools" data-auto data-reveal style="--i:2">
        ${[["flame", "I/I heat map", "One colour per severity band, with arrows showing which way the water runs."], ["chart-spline", "Blockage Watch", "Early warning before a dry weather spill."], ["fan", "Pump Station Manager", "The wet well drawn to scale, with its live level."], ["bell-ring", "Alarms that reach people", "Sent to the email and mobile your team holds that day."]]
          .map(([ic, t, d], i) => `<button type="button" class="fs-item" aria-pressed="${i === 0}"><span class="card-icon">${icon(ic)}</span><span><b>${t}</b><span>${d}</span></span></button>`).join("")}
      </div>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="${r}flowsense.html">Discover FlowSense</a>
        <a class="btn btn-ghost btn-lg" href="${site.flowsenseUrl}" rel="noopener">Sign in ${icon("arrow-up-right")}</a>
      </div>
    </div>
    ${fsScreen()}
  </div>
</section>

<section class="section alt" id="products">
  <div class="wrap">
    <div class="section-head split">
      <div><h2 class="h-lg" data-reveal>${esc(C.shelf.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(C.shelf.lede)}</p></div>
      <a class="btn btn-outline" href="${r}products/index.html">All ${products.length} instruments</a>
    </div>
    <div class="shelf" data-reveal="scale">
      ${C.shelf.items.map((it, n) => `
      <a class="inst" href="${r}${it.href}">
        <span class="inst-shot" style="--fit:${it.fit}%"><img src="${it.image}" alt="${esc(it.name)}" loading="lazy"></span>
        <span class="inst-body"><small>${esc(it.maker)}</small><b>${esc(it.name)}</b><span class="inst-text">${esc(it.text)}</span><span class="inst-spec">${it.specs.map((x) => `<i>${esc(x)}</i>`).join("")}</span></span>
      </a>`).join("")}
    </div>
    <div class="range-grid">
      ${C.brands.map((b, n) => { const count = products.filter((p) => p.brand === b).length; return `<a class="range-link" href="${r}products/${b.slug}.html" data-reveal style="--i:${n % 4}"><span><b>${esc(b.title)}</b><small>${count} ${count === 1 ? "instrument" : "instruments"}</small></span><span class="go" aria-hidden="true">${icon("arrow-right")}</span></a>`; }).join("")}
    </div>
  </div>
</section>

<section class="section" id="about">
  <div class="wrap split">
    <div>
      <h2 class="h-lg" data-reveal>Australian owned. Family&nbsp;founded. Still&nbsp;measuring.</h2>
      <div class="timeline">
        <span class="timeline-fill"></span>
        ${C.about.timeline.filter(([, t]) => ["EDS is founded", "Defence facility contract", "Sydney Water panel provider", "Transurban service provider", "Australia's largest supplier"].includes(t)).map(([when, t, d]) => `<div class="tl" data-reveal><time>${when}</time><i></i><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}
      </div>
      <a class="link-arrow" href="${r}about.html" style="margin-top:18px">The EDS story ${icon("arrow-right")}</a>
    </div>
    <div class="about-side">
      ${photoFigure(C.about.homePhoto, { sizes: "(max-width: 980px) calc(100vw - 40px), 460px" })}
      <figure class="quote" data-reveal="right">
        ${icon("quote", false)}
        <blockquote>${C.about.quote.text}</blockquote>
        <cite><b>${C.about.quote.who}</b>, ${C.about.quote.org}</cite>
      </figure>
    </div>
  </div>
  <div class="wrap about-more">
    <div class="about-block" id="offices" data-reveal>
      <h3 class="h-md">Four offices. One number.</h3>
      <p>Crews and support across the country. Call <a href="${site.phoneHref}">${site.phone}</a> from anywhere in Australia.</p>
      <ul class="mini-grid plain">
        ${C.offices.map((o) => `<li><span><b>${o.city} <em>${o.state}</em></b><span>${o.note}</span></span></li>`).join("")}
      </ul>
      <a class="link-arrow" href="${r}contact.html">Office details ${icon("arrow-right")}</a>
    </div>
    <div class="about-block" id="industries" data-reveal style="--i:1">
      <h3 class="h-md">Built for critical infrastructure.</h3>
      <p>Government, utilities and industry have relied on EDS for operational monitoring for more than thirty years.</p>
      <ul class="mini-grid">
        ${C.industries.map(([ic, t, d]) => `<li><span class="card-icon">${icon(ic)}</span><span><b>${t}</b><span>${d}</span></span></li>`).join("")}
      </ul>
    </div>
  </div>
</section>

${ctaSection(r)}`;
  },
});

/* ---- services ---- */
add({
  file: "services/index.html",
  title: "Water & Wastewater Monitoring Services | EDS",
  description: `${C.services.length} services from EDS: sewer flow and I&I monitoring, blockage alarms, water quality, sampling, rainfall, pump stations, SCADA integration, calibration and more.`,
  current: "services",
  body: (r) => `
${pageHero(r, { crumbs: [["Services"]], title: "Specialised services for water and wastewater networks.", lede: "From a single audit to a national monitoring program, installed and run by our own crews from four offices.", actions: `<a class="btn btn-primary btn-lg" href="${contactHref(r)}">Start an enquiry</a><a class="btn btn-ghost btn-lg" href="${site.phoneHref}">${icon("phone")} ${site.phone}</a><div class="chips">${C.serviceGroups.map((g) => `<a class="chip" href="#${g.id}">${esc(g.title)}</a>`).join("")}</div>`, visual: heroToc(C.serviceGroups.map((g) => [g.id, g.title, C.services.filter((s) => s.group === g.id).length])) })}
${C.serviceGroups.map((g, gi) => `
<section class="section${gi % 2 ? " alt" : ""}" id="${g.id}"><div class="wrap">
  <div class="section-head"><p class="kicker">${esc(g.title)}<span>${C.services.filter((s) => s.group === g.id).length} services</span></p><h2 class="h-lg" data-reveal>${esc(g.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(g.lede)}${g.proof ? ` <span class="lede-proof">${esc(g.proof)}</span>` : ""}</p></div>
  <div class="grid c3">
    ${(() => {
      // Rows always fill: the group's lead service spans two columns (with
      // its chips and a tint), and a second card does too where the count
      // would otherwise leave a hole in the last row.
      const list = C.services.filter((s) => s.group === g.id);
      const extra = (3 - (list.length + 1) % 3) % 3;
      const wide = new Set([0, ...Array.from({ length: extra }, (_, k) => list.length - 1 - k).filter((k) => k > 0)]);
      return list.map((s, n) => cardLink(r, { href: `services/${s.slug}.html`, iconName: s.icon, title: s.title, text: s.summary, n, cols: 3, tags: n === 0 ? s.tags || [] : [], cls: n === 0 ? "wide lead" : wide.has(n) ? "wide" : "" })).join("");
    })()}
  </div>
</div></section>`).join("")}
${waysSection(r)}
${ctaSection(r)}`,
});

// Questions and answers as an accordion, described for search engines as an
// FAQPage. `faq` is [[question, answer]].
const faqHtml = (faq) => `
<div class="faq">${faq.map(([q, a]) => `<details class="faq-item"><summary>${esc(q)}${icon("chevron-down", false)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }).replace(/</g, "\\u003c")}</script>`;

// A two column comparison: { left, right, rows: [[label, left, right]] }.
// `neutral` tables weigh two options against each other; the others set a
// common practice against the EDS way of working.
const tableHtml = (c) => `<div class="table-scroll"><table class="compare${c.neutral ? " neutral" : ""}"><thead><tr><th><span class="sr-only">Compared on</span></th><th>${esc(c.left)}</th><th>${esc(c.right)}</th></tr></thead><tbody>${c.rows.map((row) => `<tr>${row.map((cell, i) => `<td${i ? ` data-h="${esc(i === 1 ? c.left : c.right)}"` : ""}>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;

// A content block in a product range page's main column: a heading with a
// short lede, then feature cards (`items`), a checklist or numbered steps
// (`list`, numbered with `steps: true`), a comparison (`table`) or questions
// and answers (`faq`).
const blockHtml = (b) => `
<div class="block" id="${slugify(b.heading)}" data-reveal>
  <h2 class="h-md">${esc(b.heading)}</h2>
  ${b.lede ? `<p class="block-lede">${esc(b.lede)}</p>` : ""}
  ${b.table ? tableHtml(b.table) : ""}
  ${b.items ? `<div class="feature-list">${b.items.map(([t, d]) => `<div class="feature holder"><div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>` : ""}
  ${b.list ? (b.steps || b.heading.includes("approach") ? `<ol class="steps">${b.list.map((l) => `<li>${esc(l)}</li>`).join("")}</ol>` : `<ul class="checks">${b.list.map((l) => `<li>${icon("check", false)}<span>${esc(l)}</span></li>`).join("")}</ul>`) : ""}
  ${b.faq ? faqHtml(b.faq) : ""}
</div>`;

// The sections of a service or solution page, for the section bar under the
// hero: its blocks, plus any comparison table, results or demo below them.
// Labels are short so the bar fits on a desktop: a block's `nav` is its name
// in the bar ("" leaves it out), and the ids still come from the headings.
function sectionsOf(s) {
  const list = [...(s.blocks || []).map((b) => [slugify(b.heading), b.nav ?? (b.faq ? "Questions" : b.heading)])];
  if (s.compare) list.push([slugify(s.compare.heading), s.compare.nav ?? s.compare.heading]);
  // The evidence sits straight after the first feature band (bandsOf()), so
  // a visitor meets a result before the reference material.
  if (resultsFor(s.slug).length) {
    const after = (s.blocks || []).findIndex((b) => b.items);
    list.splice(after < 0 ? list.length : after + 1, 0, ["results", "Results"]);
  }
  if (s.process) list.push(["how-it-runs", "How it runs"]);
  if (s.widget === "lab") list.push(["flow-lab", "Flow lab"]);
  if (s.widget === "lidott") list.push(["alarm-demo", "Alarm demo"]);
  if (s.widget === "eas") list.push(["asset-score", "Try the EDS Asset Score"]);
  return list.filter(([, label]) => label);
}

// A slim bar of the page's sections. It sits under the hero, sticks under the
// header once the hero scrolls away, and marks the section in view (site.js).
// Short pages do not need one.
const sectionBar = (r, s) => {
  const list = sectionsOf(s);
  if (list.length < 3) return "";
  return `
<nav class="secbar" aria-label="On this page"><div class="wrap secbar-in">
  <ol>${list.map(([id, label]) => `<li><a href="#${id}">${esc(label)}</a></li>`).join("")}</ol>
  <a class="btn btn-brand secbar-cta" href="${contactHref(r, { topic: s.title })}">Start an enquiry</a>
</div></nav>`;
};

// "At a glance" beside the hero copy: three or four facts taken from the page
// itself (`glance` in content.mjs). Pages without them keep a plain hero.
const glanceOf = (s) => {
  const facts = C.glance[s.slug];
  return facts ? heroPanel("At a glance", `<ul class="hero-steps glance">${facts.map(([ic, t, d]) => `<li><span class="card-icon">${icon(ic, false)}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></li>`).join("")}</ul>`) : "";
};

// A service or solution page's opening text, across the page: beside its
// photograph (`figure`), illustration (`diagram`), FlowSense screen
// (`screen`) or product shot (`asideFigure`) when it has one,
// otherwise the first paragraph beside the rest. A pair of photographs
// (`figures`) sits under the text. Enquiries are left to the hero, the
// section bar and the closing band, so there is no contact card here.
function overviewHtml(s) {
  const paras = (list) => list.map((p) => `<p>${esc(p)}</p>`).join("");
  const sizes = "(max-width: 980px) calc(100vw - 40px), 580px";
  // A panorama is shown whole, across the page under the text: cropped to
  // 3:2 beside the text it lost most of the picture and was drawn soft.
  const pano = s.figure && PHOTOS[s.figure.photo]?.[0].w / PHOTOS[s.figure.photo]?.[0].h > 2.4;
  const visual = s.figure ? (pano ? "" : photoFigure(s.figure, { sizes }))
    : s.diagram ? diagram(s.diagram, C.diagrams[s.diagram])
    : s.screen ? screenFigure(s.screen, { tall: true, sizes })
    : asideFigure(s);
  const [lead, ...rest] = s.intro;
  const text = visual || !rest.length
    ? `<div class="prose" data-reveal>${paras(s.intro)}</div>`
    : `<div class="prose" data-reveal><p>${esc(lead)}</p></div><div class="prose prose-rest" data-reveal style="--i:1">${paras(rest)}</div>`;
  return `
<section class="section band" id="overview"><div class="wrap">
  <div class="intro">${text}${visual}</div>
  ${pano ? photoFigure(s.figure, { sizes: "(max-width: 1320px) 94vw, 1240px", cls: "pano" }) : ""}
  ${s.figures ? figureRow(s.figures) : ""}
</div></section>`;
}
const svcLinks = (r, slugs = []) => slugs.map((slug) => [`${r}services/${slug}.html`, svc(slug).short || svc(slug).title]);
const solLinks = (r, slugs = []) => slugs.map((slug) => [`${r}solutions/${slug}.html`, sol(slug).title]);
const brandLinks = (r, slugs = []) => slugs.map((slug) => [`${r}products/${slug}.html`, brand(slug).title]);
const paperLinks = (ids = []) => ids.map((id) => { const p = C.papers.find((x) => x.id === id); return [p.href, p.title, "download", true]; });

/* ---- service and solution pages: one full-width band per section ---- */
// Each section gets the whole width and a layout that suits it, so no two
// neighbours look alike: the first feature list as cards, later feature
// lists as a row of deliverables, checklists in two columns, tables across
// the page, questions beside their heading, numbered steps in a row. A list
// of two, or one that follows a list of the same kind, sits beside its
// heading as ruled rows instead. Every band heading is set at the same size.
const isSteps = (b) => Boolean(b.list && (b.steps || b.heading.includes("approach")));
const bandHead = (b) => `<div class="band-head"><h2 class="h-lg" data-reveal>${esc(b.heading).replace(/\n/g, "<br>")}</h2>${b.lede ? `<p class="lede" data-reveal style="--i:1">${esc(b.lede)}</p>` : ""}</div>`;
const flatItems = (items) => `<ul class="flat-list">${items.map(([t, d], n) => `<li data-reveal style="--i:${n % 4}"><span><b>${esc(t)}</b><span>${esc(d)}</span></span></li>`).join("")}</ul>`;
const checkList = (list) => `<ul class="checks" data-reveal>${list.map((l) => `<li>${icon("check", false)}<span>${esc(l)}</span></li>`).join("")}</ul>`;
const blockBody = (b) => (b.items ? flatItems(b.items) : b.list ? checkList(b.list) : "");
// A block's FlowSense screen (`shot`), across the page under its items.
const bandShot = (b) => (b.shot ? screenFigure(b.shot, { sizes: "(max-width: 1240px) calc(100vw - 40px), 1200px" }) : "");
const band = (tone, inner, { id, cls = "" } = {}) => `
<section class="section band${tone === "alt" ? " alt" : ""}${cls ? ` ${cls}` : ""}"${id ? ` id="${id}"` : ""}><div class="wrap">${inner}</div></section>`;

function bandsOf(s, r) {
  const out = [];
  const blocks = s.blocks || [];
  let cards = false;
  for (const b of blocks) {
    const id = slugify(b.heading);
    if (b.products) {
      out.push({ id, cls: "band-products", html: `${bandHead(b)}<div class="shelf n${b.products.length}" data-reveal="scale">${b.products.map((it) => `
      <a class="inst" href="${r}${it.href}">
        <span class="inst-shot" style="--fit:${it.fit || 100}%"><img src="${it.image}" alt="${esc(it.name)}" loading="lazy"></span>
        <span class="inst-body"><small>${esc(it.maker)}</small><b>${esc(it.name)}</b><span class="inst-text">${esc(it.text)}</span></span>
      </a>`).join("")}</div>` });
    } else if (b.items && !cards) {
      cards = true;
      out.push({ id, cls: "band-cards", html: `${bandHead(b)}<div class="feature-grid n${b.items.length}">${b.items.map(([t, d], n) => `<div class="feature holder" data-reveal style="--i:${n % 4}"><div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>${bandShot(b)}` });
    } else if (b.items && (b.items.length <= 2 || out.at(-1)?.cls === "band-deliv")) {
      // two points, or a list straight after a row of deliverables: ruled
      // rows beside the heading, so a short band is not mostly empty and
      // two neighbours never share a layout
      out.push({ id, cls: "band-split", html: `<div class="split-band">${bandHead(b)}${flatItems(b.items)}</div>${bandShot(b)}` });
    } else if (b.items) {
      // what a program includes: one column per item, across the page
      out.push({ id, cls: "band-deliv", html: `${bandHead(b)}<ul class="deliv n${b.items.length}">${b.items.map(([t, d], n) => `<li data-reveal style="--i:${n % 5}"><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join("")}</ul>${bandShot(b)}` });
    } else if (b.table) {
      out.push({ id, cls: "band-table", html: `${bandHead(b)}<div data-reveal>${tableHtml(b.table)}</div>` });
    } else if (b.faq) {
      out.push({ id, cls: "band-split", html: `<div class="split-band">${bandHead(b)}<div data-reveal>${faqHtml(b.faq)}</div></div>` });
    } else if (isSteps(b)) {
      out.push({ id, cls: "band-steps", html: `${bandHead(b)}<ol class="step-grid n${b.list.length}">${b.list.map((l, n) => `<li data-reveal style="--i:${n % 4}"><span>${String(n + 1).padStart(2, "0")}</span><p>${esc(l)}</p></li>`).join("")}</ol>` });
    } else if (out.at(-1)?.cls === "band-list") {
      // a checklist straight after another sits beside its heading
      out.push({ id, cls: "band-split", html: `<div class="split-band">${bandHead(b)}${checkList(b.list)}</div>` });
    } else {
      out.push({ id, cls: "band-list", html: `${bandHead(b)}<ul class="checks cols" data-reveal style="--rows:${Math.ceil(b.list.length / 2)}">${b.list.map((l) => `<li>${icon("check", false)}<span>${esc(l)}</span></li>`).join("")}</ul>` });
    }
  }
  if (s.compare) out.push({ id: slugify(s.compare.heading), cls: "band-table", html: `${bandHead(s.compare)}<div data-reveal>${tableHtml(s.compare)}</div>` });
  if (s.quote) out.push({ cls: "band-quote", html: `<figure class="quote" data-reveal>${icon("quote", false)}<blockquote>${esc(s.quote.text)}</blockquote></figure>` });
  const results = resultsFor(s.slug);
  // One result sits beside its heading. Two share the row with a third tile
  // that lists the other results, so the row is full and every result is a
  // click away. The band goes straight after the first feature band, so the
  // evidence comes before the reference material (sectionsOf() matches).
  const resultsHead = `<div class="band-head"><h2 class="h-lg" data-reveal>Results from the field</h2></div>`;
  let resultsBand = null;
  if (results.length === 1) resultsBand = { id: "results", cls: "band-results", html: `<div class="split-band">${resultsHead}${resultCards(results)}</div>` };
  else if (results.length) {
    const rest = C.results.filter((x) => !results.includes(x));
    const more = `<a class="result more" href="${r}about.html#projects" aria-label="All results from EDS programs" data-reveal style="--i:2"><p class="more-h">${rest.length} more results from EDS programs</p><ul>${rest.slice(0, 4).map((x) => `<li><b>${esc(x.stat)}</b><span>${esc(x.label)}</span></li>`).join("")}</ul><span class="link-arrow">All results ${icon("arrow-right")}</span></a>`;
    resultsBand = { id: "results", cls: "band-results", html: `${resultsHead}${resultCards(results, more)}` };
  }
  if (resultsBand) {
    const after = out.findIndex((b) => b.cls === "band-cards");
    out.splice(after < 0 ? out.length : after + 1, 0, resultsBand);
  }
  return out;
}

// The body of a service or solution page: the opening text, then one band per
// section in alternating white and pale grey, how a program runs, any demo,
// the related links in one band, and the call to action.
function detailBody(r, s, { related, demo = "" }) {
  let tone = "white";
  const flip = () => (tone = tone === "alt" ? "white" : "alt");
  const bands = bandsOf(s, r).map((b) => band(flip(), b.html, b)).join("");
  const process = s.process ? processSection(flip()) : "";
  const groups = related.filter(([, links]) => links.length);
  const relatedTone = demo ? "alt" : flip();
  const relatedHead = `<div class="band-head"><h2 class="h-lg" data-reveal>Related</h2></div>`;
  return `
${overviewHtml(s)}
${bands}
${process}
${demo}
${groups.length ? band(relatedTone, `${relatedHead}<div class="related-grid n${groups.length}">${groups.map(([title, links], i) => `<div data-reveal style="--i:${i}"><h3>${title}</h3><ul class="aside-links">${links.map(([href, label, ic = "arrow-right", ext]) => `<li><a href="${href}"${ext ? ' rel="noopener"' : ""}>${esc(label)}${icon(ic)}</a></li>`).join("")}</ul></div>`).join("")}</div>`, { id: "related", cls: "band-related" }) : ""}`;
}

for (const s of C.services) {
  add({
    file: `services/${s.slug}.html`,
    title: s.pageTitle || `${s.title} | EDS`,
    description: s.description || s.summary,
    service: s.title,
    current: "services",
    menuTab: s.group,
    scripts: { lab: ["lab.js"], lidott: ["widgets.js"] }[s.widget] || [],
    body: (r) => `
${pageHero(r, { crumbs: [["Services", "services/index.html"], [s.short || s.title]], title: s.title, lede: s.summary, compact: true, actions: `<a class="btn btn-primary btn-lg" href="${contactHref(r, { topic: s.title })}">Start an enquiry</a>${s.widget === "lab" ? `<a class="btn btn-ghost btn-lg" href="#flow-lab">${icon("cloud-rain")} Try the flow lab</a>` : ""}${s.widget === "lidott" ? `<a class="btn btn-ghost btn-lg" href="#alarm-demo">${icon("bell")} Try the alarm</a>` : ""}`, visual: glanceOf(s) })}
<div class="secbar-scope">${sectionBar(r, s)}
${detailBody(r, s, {
  related: [["Services", svcLinks(r, s.related)], ["Solutions", solLinks(r, s.solutions)], ["Instruments we use", brandLinks(r, s.products)], ["White papers", paperLinks(s.papers)], ["Downloads", (s.downloads || []).map(([href, label]) => (href.startsWith("@root/") ? [href, label, "download", true] : [`${r}${href}`, label]))]],
  demo: s.widget === "lab" ? labSection({ title: s.slug.startsWith("inflow") ? "Watch inflow and infiltration happen." : "What the flow meter sees in a storm." })
    : s.widget === "lidott" ? `<section class="section dark band" id="alarm-demo"><div class="wrap"><div class="section-head"><h2 class="h-lg" data-reveal>Raise the water. Watch the alarm.</h2></div>${lidottDemo({ link: `${r}products/lidott-alarm.html` })}</div></section>` : "",
})}</div>
${ctaSection(r, { topic: s.title })}`,
  });
}

/* ---- solutions ---- */
add({
  file: "solutions/index.html",
  title: "Wastewater & Environmental Monitoring Solutions | EDS",
  description: "Wastewater, network, thermal, sampling, environmental and structure monitoring from Australia's largest service contractor for water and wastewater studies.",
  current: "solutions",
  menuTab: "solutions",
  body: (r) => `
${pageHero(r, { crumbs: [["Solutions"]], title: "Monitoring applied to the problem in front of you.", lede: "Instruments, crews and data from Australia's largest service contractor for water and wastewater monitoring studies.", actions: `<a class="btn btn-primary btn-lg" href="${contactHref(r)}">Start an enquiry</a>`, visual: heroSteps("How a solution comes together", [["cpu", "Instruments", "Our own, and ranges from Detectronic, Hach, ORI and more: one of Australia's largest portfolios."], ["hard-hat", "Field crews", "Installed, maintained and calibrated by trained EDS crews from four offices."], ["chart-line", "Data you can act on", "Delivered to FlowSense, your SCADA system or a report."]]) })}
<section class="section"><div class="wrap">
  <div class="section-head"><h2 class="h-lg" data-reveal>Start with the problem you are solving.</h2><p class="lede" data-reveal style="--i:1">Each solution page sets out what we look for, how we measure it, and the instruments and crews we bring.</p></div>
  <div class="grid c3">
  ${C.solutions.map((s, n) => cardLink(r, { href: `solutions/${s.slug}.html`, iconName: s.icon, title: s.title, text: s.summary, n, cols: 3, tags: s.tags || [] })).join("")}
  </div>
</div></section>
<section class="section alt proof-band" aria-label="Why EDS"><div class="wrap">${proofRow()}</div></section>
${ctaSection(r)}`,
});
for (const s of C.solutions) {
  add({
    file: `solutions/${s.slug}.html`,
    title: s.pageTitle || `${s.title} | EDS`,
    description: s.description || s.summary,
    service: s.title,
    current: "solutions",
    menuTab: "solutions",
    scripts: s.widget === "eas" ? ["widgets.js"] : [],
    body: (r) => `
${pageHero(r, { crumbs: [["Solutions", "solutions/index.html"], [s.title]], title: s.title, lede: s.summary, compact: true, actions: `<a class="btn btn-primary btn-lg" href="${contactHref(r, { topic: s.title })}">Start an enquiry</a>`, visual: glanceOf(s) })}
<div class="secbar-scope">${sectionBar(r, s)}
${detailBody(r, s, {
  related: [["Solutions", solLinks(r, s.related)], ["Services", svcLinks(r, C.services.filter((x) => x.solutions?.includes(s.slug)).map((x) => x.slug))], ["Instruments we use", brandLinks(r, s.productLinks)]],
  demo: s.widget === "eas" ? `<section class="section dark band" id="asset-score"><div class="wrap"><div class="section-head"><h2 class="h-lg" data-reveal>One score, watched around the clock.</h2></div>${easDemo()}</div></section>` : "",
})}</div>
${ctaSection(r, { topic: s.title })}`,
  });
}

/* ---- products ---- */
add({
  file: "products/index.html",
  title: "Flow Meters, Samplers & Monitoring Instruments | EDS",
  description: "Flow meters, loggers, samplers and sensors for water and wastewater, from EDS, Detectronic, Hach Flow, ORI, Beadedstream, MicroLevel, Aquamonitrix and Dynaflox.",
  current: "products",
  scripts: ["products.js"],
  body: (r) => {
    // The filter rail: one option per type, per range and for documents,
    // each with its count. products.js keeps the counts current as the
    // visitor narrows the list.
    const opt = (value, label, n, ic = "") => `<li><button type="button" class="cat-opt" data-value="${esc(value)}" aria-pressed="${value === "" ? "true" : "false"}" data-track-label="${esc(label)}">${ic ? icon(ic, false) : ""}<span>${esc(label)}</span><span data-n>${n}</span></button></li>`;
    const rail = `
    <aside class="cat-rail" aria-label="Filter the instruments">
      <div class="cat-group" role="group" aria-labelledby="cat-h-type" data-cat-filter="type"><p class="cat-h" id="cat-h-type">Type</p><ul>${opt("", "All instruments", products.length)}${C.productTypes.map((t) => opt(t.id, t.label, products.filter((p) => p.type === t.id).length, t.icon)).join("")}</ul></div>
      <div class="cat-group" role="group" aria-labelledby="cat-h-brand" data-cat-filter="brand"><p class="cat-h" id="cat-h-brand">Range</p><ul>${opt("", "All ranges", products.length)}${C.brands.map((b) => opt(b.slug, b.name, products.filter((p) => p.brand === b).length)).join("")}</ul></div>
      <div class="cat-group" role="group" aria-labelledby="cat-h-docs" data-cat-filter="docs"><p class="cat-h" id="cat-h-docs">Documents</p><ul>${opt("", "Any", products.length)}${opt("1", "Datasheet or manual", products.filter((p) => (p.docs || []).length || (p.brand.docs || []).length).length)}</ul></div>
    </aside>`;
    return `
${pageHero(r, { crumbs: [["Products"]], title: "Instruments built for the field, backed by the people who use them.", compact: true, after: `
    <div class="finder-bar" id="finder" data-reveal style="--i:2">
      <label class="finder-search">${icon("search", false)}<input type="search" placeholder="Try “flow”, “Hach” or “level”" aria-label="Search ${products.length} instruments by name, range or what they measure" autocomplete="off" spellcheck="false"></label>
      <p class="finder-live" hidden><span data-finder-live></span> <a class="link-arrow" href="#instruments">See them ${icon("arrow-right")}</a></p>
    </div>` })}
<section class="section ranges-strip" id="ranges"><div class="wrap">
  <div class="ranges-head"><h2 class="h-md" data-reveal>Browse by range</h2><p data-reveal style="--i:1">We make our own instruments and represent leading manufacturers, across water supply, wastewater, flow monitoring and process control. We install, service and calibrate every range here ourselves.</p></div>
  <div class="range-tiles">
    ${C.brands.map((b, n) => {
      const count = products.filter((p) => p.brand === b).length;
      return `<a class="range-tile" href="${r}products/${b.slug}.html" data-reveal style="--i:${n % 4}"><span class="card-icon">${icon(b.icon)}</span><b>${esc(b.title)}</b><small>${count} ${count === 1 ? "instrument" : "instruments"}</small><span class="go" aria-hidden="true">${icon("arrow-right")}</span></a>`;
    }).join("")}
  </div>
</div></section>
<section class="section alt finder-results" id="instruments"><div class="wrap">
  <h2 class="sr-only">Instruments</h2>
  <div class="finder cat">
    ${rail}
    <div class="cat-main">
      <div class="cat-bar">
        <p class="finder-count" role="status">Showing all ${products.length} instruments</p>
        <div class="view-toggle" role="group" aria-label="View"><button type="button" class="view-btn" data-view="grid" aria-pressed="true" data-track-label="Grid view">${icon("layout-grid", false)}Grid</button><button type="button" class="view-btn" data-view="table" aria-pressed="false" data-track-label="Table view">${icon("list", false)}Table</button></div>
      </div>
      <div class="prod-grid" data-view="grid">
        <div class="prod-head" aria-hidden="true"><span></span><span>Instrument</span><span>Type</span><span>Documents</span><span></span></div>
        ${products.map((p, n) => productCard(r, p, { id: `${p.brand.slug}-${p.id}`, showBrand: true, n })).join("")}
      </div>
      <div class="finder-empty" hidden>
        <span class="card-icon">${icon("search-x")}</span>
        <h3>No instruments match</h3>
        <p>Try another word or filter, or ask our team which instrument suits your application.</p>
        <div class="hero-actions"><button class="btn btn-outline" type="button" data-finder-reset>Show all instruments</button><a class="btn btn-brand" href="${contactHref(r, { topic: "Product pricing" })}">Start an enquiry</a></div>
      </div>
    </div>
  </div>
</div></section>
${quickView()}
<section class="section" id="featured"><div class="wrap split" style="align-items:center">
  <div><p class="eyebrow">Featured</p><h2 class="h-lg" data-reveal>LIDoTT Alarm</h2><p class="lede" data-reveal style="--i:1;margin-top:16px">${C.lidott.lede} Radar level sensor, battery, modem and antenna in one compact unit, certified for Zone 0.</p>
  <div class="hero-actions"><a class="btn btn-brand btn-lg" href="${r}products/lidott-alarm.html">See how it works</a></div></div>
  <div class="brand-shot" style="border:1px solid var(--border);border-radius:var(--radius);aspect-ratio:1" data-reveal="right"><img src="${C.lidott.image}" alt="LIDoTT Alarm" loading="lazy"></div>
</div></section>
${waysSection(r, { cls: "alt" })}
${ctaSection(r, { title: "Need help choosing an instrument?", lede: "Our team has installed, serviced and calibrated all of them. Ask us which suits your application.", topic: "Product pricing" })}`;
  },
});

for (const b of C.brands) {
  const range = products.filter((p) => p.brand === b);
  // The hero shows the brand's cover photo: a product's own shot, or a shot
  // of the range named by `coverName`.
  const cover = range.find((p) => p.image === b.cover) || range[0];
  const pricing = { topic: "Product pricing", product: b.title };
  // Brand-wide documents first, then each product's, named after the product.
  // A file shared by several products is listed once, under all their names.
  const docs = [];
  for (const d of [
    ...(b.docs || []).map((d) => ({ title: d.label, meta: docType(d.href), href: d.href })),
    ...range.flatMap((p) => (p.docs || []).map((d) => ({ title: p.name, meta: `${d.label} · ${docType(d.href)}`, href: d.href }))),
  ]) {
    const seen = docs.find((x) => x.href === d.href);
    if (seen) seen.title += `, ${d.title}`;
    else docs.push(d);
  }
  add({
    file: `products/${b.slug}.html`,
    title: b.pageTitle || `${b.title} | EDS Products`,
    description: b.description || b.summary,
    current: "products",
    scripts: ["products.js"],
    body: (r) => `
${pageHero(r, { crumbs: [["Products", "products/index.html"], [b.name]], iconName: b.icon, eyebrow: b.tag, title: b.title, lede: b.summary, actions: `<a class="btn btn-primary btn-lg" href="${contactHref(r, pricing)}">Request pricing</a><a class="btn btn-ghost btn-lg" href="#range">${icon("layout-grid")} View the range</a>`, visual: heroProduct(b.cover || cover.image, b.coverName || cover.name) })}
<section class="section"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${b.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    ${b.blocks?.length ? `<div style="margin-top:clamp(40px,5vw,64px)">${b.blocks.map(blockHtml).join("")}</div>` : ""}
  </div>
  <aside class="aside">
    ${b.logo ? `<div class="aside-card logo-card" data-reveal="right" style="display:grid;place-items:center;padding:32px"><img src="${b.logo}" alt="${esc(b.name)} logo" style="max-height:70px;width:auto" loading="lazy"></div>` : ""}
    ${docs.length
      ? `<div class="aside-card" data-reveal="right"><h2>Documents</h2><ul class="aside-links docs">${docs.map((d) => `<li><a href="${d.href}" rel="noopener"><span>${esc(d.title)}<small>${esc(d.meta)}</small></span>${icon("download")}</a></li>`).join("")}</ul></div>`
      : `<div class="aside-card" data-reveal="right"><h2>Datasheets and manuals</h2><p>Ask us for the datasheet, manual or software for any ${esc(b.name)} product.</p><a class="link-arrow" href="${contactHref(r, { topic: "General enquiry", product: `${b.name} datasheet or manual` })}">Request a datasheet ${icon("arrow-right")}</a></div>`}
  </aside>
</div></section>
<section class="section alt" id="range"><div class="wrap">
  ${b.groups.map((g) => `
  <div class="block">
    <h2 class="h-md range-head" data-reveal>${esc(g.name)}<span>${g.items.length} ${g.items.length === 1 ? "product" : "products"}</span></h2>
    <div class="prod-grid">${range.filter((p) => p.group === g.name).map((p, n) => productCard(r, p, { n })).join("")}</div>
  </div>`).join("")}
  <p class="range-hint" data-reveal>${icon("zoom-in", false)} Select any product for a closer look and to request pricing.</p>
</div></section>
${quickView()}
${ctaSection(r, { title: `Ask us about ${b.name}.`, lede: "Pricing, availability, hire and technical advice from the EDS team.", ...pricing })}`,
  });
}

add({
  file: "products/lidott-alarm.html",
  title: "LIDoTT Radar Level Alarm by Detectronic | EDS",
  description: "Self-contained radar water level measurement and alarm device. ATEX and IECEx Zone 0 certified, measures up to 8.4 m, battery life up to 7 years.",
  current: "products",
  scripts: ["widgets.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["Products", "products/index.html"], ["Detectronic", "products/detectronic.html"], ["LIDoTT Alarm"]], iconName: "bell", eyebrow: "Radar level alarm", title: "LIDoTT Alarm", lede: C.lidott.lede, actions: `<a class="btn btn-primary btn-lg" href="${contactHref(r, { topic: "Product pricing", product: "LIDoTT Alarm (Detectronic)" })}">Request pricing</a>${quoteBtn(quoteItem(products.find((p) => p.href === "products/lidott-alarm.html")), "btn-lg")}<a class="btn btn-ghost btn-lg" href="${C.lidott.datasheet}" rel="noopener">${icon("download")} Datasheet</a>`, visual: heroProduct(C.lidott.image, "LIDoTT Alarm") })}
<section class="section hl-band"><div class="wrap">
  <div class="hl-grid">${C.lidott.highlights.map(([ic, t, d], i) => `<div class="hl holder" data-reveal style="--i:${i % 3}">${icon(ic)}<b>${t}</b><span>${d}</span></div>`).join("")}</div>
</div></section>
<section class="section dark band"><div class="wrap">
  <div class="section-head"><p class="eyebrow">See it work</p><h2 class="h-lg" data-reveal>Raise the water. Watch the alarm.</h2></div>
  ${lidottDemo()}
</div></section>
<section class="section"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${C.lidott.description.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="feature-list" style="margin-top:40px">${C.lidott.sections.map(([t, d]) => `<div class="feature holder" data-reveal><div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>
    ${photoFigure(C.lidott.figure)}
  </div>
  <aside class="aside">
    <figure class="aside-figure" data-reveal="right"><div class="aside-plate"><img src="${C.lidott.image2}" alt="Drawing of LIDoTT Alarm in section" loading="lazy"></div><figcaption>LIDoTT Alarm, in section</figcaption></figure>
    <div class="aside-card" id="specifications" data-reveal="right"><h2>Specifications</h2><table class="specs"><tbody>${C.lidott.specs.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</tbody></table></div>
    <div class="aside-card" data-reveal="right"><h2>Documents</h2><ul class="aside-links docs"><li><a href="${C.lidott.datasheet}" rel="noopener"><span>LIDoTT Alarm datasheet<small>${docType(C.lidott.datasheet)}</small></span>${icon("download")}</a></li></ul></div>
  </aside>
</div></section>
${ctaSection(r, { title: "Deploy LIDoTT Alarm across your network.", lede: "Simple to install and zero maintenance by design. Ask us for pricing and a deployment plan.", topic: "Product pricing", product: "LIDoTT Alarm (Detectronic)" })}`,
});

add({
  file: "products/alarm2.html",
  title: "Alarm2 Radar Level Monitor by Detectronic | EDS",
  description: "All-in-one radar level monitor with alarms, up to 20 m range with ± 5 mm accuracy. LoRaWAN or 4G connectivity, battery over 5 years.",
  current: "products",
  body: (r) => `
${pageHero(r, { crumbs: [["Products", "products/index.html"], ["Detectronic", "products/detectronic.html"], ["Alarm2"]], iconName: "bell-ring", eyebrow: "Radar level monitor", title: "Alarm2", lede: C.alarm2.lede, actions: `<a class="btn btn-primary btn-lg" href="${contactHref(r, { topic: "Product pricing", product: "Alarm2 (Detectronic)" })}">Request pricing</a>${quoteBtn(quoteItem(products.find((p) => p.href === "products/alarm2.html")), "btn-lg")}<a class="btn btn-ghost btn-lg" href="${C.alarm2.datasheet}" rel="noopener">${icon("download")} Datasheet</a>`, visual: heroProduct(C.alarm2.image, "Alarm2") })}
<section class="section hl-band"><div class="wrap">
  <div class="hl-grid">${C.alarm2.highlights.map(([ic, t, d], i) => `<div class="hl holder" data-reveal style="--i:${i % 3}">${icon(ic)}<b>${t}</b><span>${d}</span></div>`).join("")}</div>
</div></section>
<section class="section"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${C.alarm2.description.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="feature-list" style="margin-top:40px">${C.alarm2.sections.map(([t, d]) => `<div class="feature holder" data-reveal><div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>
  </div>
  <aside class="aside">
    <div class="aside-card" id="specifications" data-reveal="right"><h2>Specifications</h2><table class="specs"><tbody>${C.alarm2.specs.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</tbody></table></div>
    <div class="aside-card" data-reveal="right"><h2>Documents</h2><ul class="aside-links docs">${[["Alarm2 datasheet", C.alarm2.datasheet], ["Alarm2 4G manual", C.alarm2.manual]].map(([t, href]) => `<li><a href="${href}" rel="noopener"><span>${t}<small>${docType(href)}</small></span>${icon("download")}</a></li>`).join("")}</ul></div>
  </aside>
</div></section>
${ctaSection(r, { title: "Deploy Alarm2 across your network.", lede: "Tell us about your sites and how you want to be alerted. We'll come back with pricing and support.", topic: "Product pricing", product: "Alarm2 (Detectronic)" })}`,
});

/* ---- EDS instruments with a page of their own ---- */
// The terminal block as it sits on the logger: the USB port, the terminals in
// their groups (pin numbers under each, a numbered badge under each group,
// counted from the pin 1 end) and the power switch, then the notes in that order.
function terminalBand(t) {
  const n = t.groups.length;
  const block = t.groups.map((g, i) => `<li class="tb-group" data-kind="${g.kind}" style="--n:${g.pins.length}"><span class="tb-glabel">${esc(g.label)}</span><ol class="tb-pins">${g.pins.map(([pin, name, fn]) => `<li class="tb-pin" data-name="${esc(name)}"><span class="tb-name">${esc(name)}</span><span class="tb-screw" aria-hidden="true"></span><span class="tb-num"><span class="sr-only">Pin </span>${pin}<span class="sr-only">: ${esc(fn)}</span></span></li>`).join("")}</ol><span class="tb-badge" aria-hidden="true">${n - i}</span></li>`).join("");
  const notes = [...t.groups].reverse().map((g, i) => `<li class="feature holder" data-reveal style="--i:${i}"><span class="tb-badge" aria-hidden="true">${i + 1}</span><div><b>${esc(g.note[0])}</b><span>${esc(g.note[1])}</span></div></li>`).join("");
  return `<div class="section-head"><h2 class="h-lg" data-reveal>${esc(t.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(t.lede)}</p></div>
  <figure class="tb" data-reveal>
    <div class="tb-face">
      <span class="tb-port" aria-hidden="true"><span>USB</span><i></i></span>
      <ol class="tb-block" aria-label="Terminal block, left to right">${block}</ol>
      <span class="tb-switch" aria-hidden="true"><span>Off / On</span><i></i><small>Power switch</small></span>
    </div>
    <figcaption>${esc(`Terminal block: ${t.groups.reduce((s, g) => s + g.pins.length, 0)} way, pin numbers under each terminal.`)}</figcaption>
  </figure>
  <ol class="tb-notes">${notes}</ol>
  ${t.caution ? `<p class="tb-caution" data-reveal>${icon("circle-alert")}<span>${esc(t.caution)}</span></p>` : ""}`;
}
const applicationsBand = (a) => `<div class="section-head"><h2 class="h-lg" data-reveal>${esc(a.heading)}</h2></div>
  <div class="grid c4">${a.items.map(([ic, t, d], i) => `<div class="card holder" data-reveal style="--i:${i}"><span class="card-icon">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}</div>`;

/* ---- E-Flow 3: how a two-pair sensor shows itself ---- */
// The product shot with its sensors numbered, and a key in their pairs
// (`anatomy`): beside the opening text, under it.
const anatomyFigure = (a, src) => `
<figure class="anat" data-reveal>
  <p class="anat-h">${esc(a.heading)}</p>
  <div class="anat-plate"><div class="anat-img"><img src="${src}" alt="${esc(a.alt)}" width="963" height="471" loading="lazy">${a.pairs.flatMap(([pair, , items]) => items.map(([n, , , x, y]) => `<span class="anat-pin ${pair}" style="--x:${x};--y:${y}" aria-hidden="true">${n}</span>`)).join("")}</div></div>
  <div class="anat-key">${a.pairs.map(([pair, label, items]) => `<div class="anat-pair ${pair}"><p>${esc(label)}</p><ol>${items.map(([n, t, d]) => `<li><span class="anat-n" aria-hidden="true">${n}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></li>`).join("")}</ol></div>`).join("")}</div>
  <figcaption>${esc(a.caption)}</figcaption>
</figure>`;
// An illustration across the page under its heading (`modes`).
const diagramBand = (b) => `${bandHead(b)}${diagram(b.diagram, C.diagrams[b.diagram])}`;
// Why it beats the alternatives (`why`): the storm drawn three ways, then
// what each kind of meter can and cannot do.
const MARK = { yes: ["check", "Yes"], no: ["x", "No"] };
const whyBand = (w) => `${bandHead(w)}${diagram(w.diagram, C.diagrams[w.diagram])}
  <div class="ef-matrix-wrap" data-reveal><table class="ef-matrix"><thead><tr><th scope="col"><span class="sr-only">What it does</span></th>${w.columns.map((c, i) => `<th scope="col"${i === w.columns.length - 1 ? ' class="us"' : ""}>${esc(c)}</th>`).join("")}</tr></thead>
  <tbody>${w.rows.map(([what, ...cells]) => `<tr><th scope="row">${esc(what)}</th>${cells.map((c, i) => {
    const [ic, word] = MARK[c] || ["minus", c];
    return `<td class="${MARK[c] ? c : "part"}${i === cells.length - 1 ? " us" : ""}">${icon(ic, false)}<span${MARK[c] ? ' class="sr-only"' : ""}>${esc(word)}</span></td>`;
  }).join("")}</tr>`).join("")}</tbody></table></div>`;
// Accuracy (`accuracy`): how velocity and depth become flow, then the figures.
const accuracyBand = (a) => `${bandHead(a)}${diagram(a.diagram, C.diagrams[a.diagram])}
  <div class="ef-acc"><h3 data-reveal>${esc(a.heading2)}</h3><ul class="ef-stats">${a.stats.map(([v, l, d], n) => `<li data-reveal style="--i:${n}"><b>${esc(v)}</b><span>${esc(l)}</span><small>${esc(d)}</small></li>`).join("")}</ul></div>`;
// Upkeep (`upkeep`): the drawing, then what it saves.
const upkeepBand = (u) => `${bandHead(u)}${diagram(u.diagram, C.diagrams[u.diagram])}
  <ul class="deliv n${u.items.length} ef-upkeep">${u.items.map(([t, d], n) => `<li data-reveal style="--i:${n}"><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join("")}</ul>`;
// What the sewer throws at it, in EDS's own photographs, then how E-Flow 3
// is built for it, seen through its housing (`tough`).
const toughBand = (t) => `<div class="split-band ef-tough"><div class="band-head"><h2 class="h-lg" data-reveal>${esc(t.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(t.lede)}</p><ul class="ef-hazards" data-reveal style="--i:2" aria-label="What it faces">${t.hazards.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></div>${figureRow(t.photos)}</div>${diagram(t.diagram, C.diagrams[t.diagram])}`;
// The system around the sensor (`system`): the sensor, the logger, the
// platform and the people, joined by what carries the data, on the same
// instrument screen as the drawings. Product shots and a FlowSense screen.
const systemBand = (y) => `${bandHead(y)}
  <figure class="diagram dg-screen ef-dark dg-system" data-reveal><div class="dg-plate">
    <ol class="sys">${y.nodes.map((n, i) => `${i ? `<li class="sys-link" aria-hidden="true"><span>${esc(y.links[i - 1])}</span><i></i></li>` : ""}<li class="sys-node ${n.kind}"><span class="sys-img">${n.shot ? shot(n.shot, y.alt, { sizes: "(max-width: 980px) 240px, 240px" }) : n.image ? `<img src="${n.image}" alt="${esc(n.name)}" loading="lazy" decoding="async">` : icon("users", false)}</span><b>${esc(n.name)}</b><span>${esc(n.line)}</span></li>`).join("")}</ol>
    <p class="sys-ems">${icon("tablet-smartphone", false)}<span><b>${esc(y.ems[0])}</b> ${esc(y.ems[1])}</span></p>
  </div><figcaption>${esc(y.caption)}</figcaption></figure>`;

// The E-Flow 3 hero: the product on an instrument screen in a looped storm.
// Water rises over the sensor and falls again and the beams change over with
// it, so the page's point is made in its first screen. Each moving part is its
// own layer, moved by transform and opacity only (site.css: .ef-hero). Laid
// out in a 400 unit square that a short plate crops top and bottom.
function eflowHero(pg) {
  const p = "efh", surf = 312, us = [212, 195, -0.6, 0.8];
  const rv = efBeam(p, "rv", [170, 158, -0.6, 0.8], 12, { toY: surf, waves: 4 }), rd = efBeam(p, "rd", [97.5, 147, 0, 1], 7, { toY: surf, waves: 3 });
  const u1 = efBeam(p, "u1", [us[0] - 0.8, us[1] - 3, us[2], us[3]], 2.5, { len: 128, kind: "u", waves: 4 }), u2 = efBeam(p, "u2", [us[0] + 0.8, us[1] + 3, us[2], us[3]], 2.5, { len: 116, kind: "u", waves: 4 });
  const layer = (cls, body, defs = "") => `<svg class="${cls}" viewBox="0 0 400 400" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
  return `
<figure class="hero-product" data-reveal="scale" style="--i:2">
  <div class="hero-product-shot ef-hero">
    <div class="ef-hero-stage">
      ${layer("ef-dark", `<rect width="400" height="400" fill="url(#${p}-soil)"/><rect y="68" width="400" height="332" fill="url(#${p}-air)"/><path fill="url(#${p}-cut)" d="M0 46H400V68H0ZM0 382H400V400H0Z"/><path class="ef-edge" d="M0 46H400M0 68H400M0 382H400"/><rect x="92" y="67" width="196" height="16" rx="2" fill="url(#${p}-steel)" fill-opacity=".7"/>`, efDefs(p, { dark: true }))}
      ${layer("ef-dark ef-hero-radar", `${rv.draw}${rd.draw}`, `${rv.defs}${rd.defs}`)}
      ${layer("ef-dark ef-hero-us", `${u1.draw}${u2.draw}`, `${u1.defs}${u2.defs}`)}
      <img src="${pg.image}" alt="${esc(pg.name)}" width="963" height="471" fetchpriority="high">
      ${layer("ef-hero-water", `<rect width="400" height="400" fill="url(#${p}-w)"/><rect width="400" height="7" fill="#9fe7da" fill-opacity=".28"/><rect width="400" height="2" fill="#d6fff7"/>${[[200, 30], [300, 54], [40, 196], [168, 256], [292, 214]].map(([x, y]) => `<path class="ef-hero-arrow" d="M${x} ${y}h44m-7-4.6 7 4.6-7 4.6"/>`).join("")}`, `<linearGradient id="${p}-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fc4b4" stop-opacity=".62"/><stop offset=".5" stop-color="#1b8a7d" stop-opacity=".78"/><stop offset="1" stop-color="#0d6b62" stop-opacity=".9"/></linearGradient>`)}
    </div>
    <p class="ef-hero-tag" aria-hidden="true"><span class="n"><i></i>${esc(pg.hero.normal)}</span><span class="s"><i></i>${esc(pg.hero.surcharge)}</span></p>
  </div>
  <figcaption>${esc(pg.hero.caption)}</figcaption>
</figure>`;
}

// The changeover demo: a sewer and manhole in section with E-Flow 3 at the
// obvert, drawn with the kit in diagrams.mjs on the deep teal. The water
// level is dragged (or a storm played), and the water, beams, velocity
// profile, sensor states, readings and record follow (widgets.js, which
// shares this geometry: sensor at the crown from x 310).
const DEMO = { w: 560, h: 312, ground: 40, crown: 176, inv: 296, wall: 10, shaft: [400, 456] };
function eflowDemo() {
  const p = "efd";
  const ef = efSensor(p, 310, DEMO.crown, 1, { cable: "C404 185 412.5 182 412.5 168V74" });
  const [ux, uy, udx, udy] = ef.us;
  const bu = efBeam(p, "bu", [ux - 0.8, uy - 2, udx, udy], 2.5, { len: 106, kind: "u", waves: 5 }), bu2 = efBeam(p, "bu2", [ux + 0.7, uy + 2.4, udx, udy], 2.5, { len: 98, kind: "u", waves: 5 });
  const rad = (id, [x, y], r) => `<radialGradient id="${p}-${id}" gradientUnits="userSpaceOnUse" cx="${x}" cy="${y}" r="${r}"><stop offset="0" class="ef-g0 r"/><stop offset="1" class="ef-g1 r"/></radialGradient>`;
  const defs = `${efDefs(p, { dark: true })}${rad("bv", ef.vel, 112)}${rad("bd", ef.depth, 90)}${bu.defs}${bu2.defs}
    <linearGradient id="${p}-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef-w0"/><stop offset=".18" class="ef-w1"/><stop offset="1" class="ef-w2"/></linearGradient>
    <pattern id="${p}-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" class="ef-gridline"/></pattern>
    <clipPath id="ef-clip"><path id="ef-clip-r" d="M0 266H560V296H0Z"/></clipPath>`;
  const water = `<path id="ef-water" fill="url(#${p}-wg)" d="M0 266H560V296H0Z"/><path id="ef-surf-g" class="ef-surf-g" d="M0 266H560"/><path id="ef-surf" class="ef-surf" d="M0 266H560"/>`;
  const corners = [[6, 6, 1, 1], [554, 6, -1, 1], [6, 306, 1, -1], [554, 306, -1, -1]].map(([x, y, sx, sy]) => `M${x} ${y + 14 * sy}V${y}H${x + 14 * sx}`).join("");
  const inner = `
    <rect width="${DEMO.w}" height="${DEMO.h}" fill="url(#${p}-grid)"/>
    <g clip-path="url(#ef-clip)" class="ef-bits">${[[30, 282, 0], [120, 290, -2], [210, 250, -4.5], [70, 236, -6], [160, 214, -1], [250, 288, -3.4], [20, 204, -5.2], [90, 262, -3]].map(([x, y, d]) => `<circle cx="${x}" cy="${y}" r="2" style="--d:${d}s"/>`).join("")}</g>
    <g class="ef-prof-g"><path id="ef-pf-base" class="ef-prof-base"/><path id="ef-pf-env" class="ef-prof-env"/><path id="ef-pf" class="ef-prof"/><path id="ef-pf-top" class="ef-prof-top"/><path id="ef-pf-mean" class="ef-prof-mean"/><text id="ef-vtag" class="ef-tag" x="0" y="0"></text></g>
    <g class="ef-radar"><path id="ef-bv" class="ef-beam r" fill="url(#${p}-bv)"/><path id="ef-bd" class="ef-beam r" fill="url(#${p}-bd)"/><g class="ef-waves" id="ef-wv">${'<path class="ef-wave r"/>'.repeat(4)}</g><g class="ef-waves" id="ef-wd">${'<path class="ef-wave r"/>'.repeat(3)}</g><path id="ef-foot" class="ef-foot r"/><text class="ef-tag r" x="12" y="196">Radar measuring</text></g>
    <g class="ef-uswrap">${bu.draw}${bu2.draw}<text class="ef-tag u" x="12" y="196">Ultrasonic measuring</text></g>
    ${ef.draw}
    <g id="ef-head" class="ef-head"><path id="ef-head-ext" class="ef-ext"/><path id="ef-head-dim" class="ef-dim"/><text id="ef-head-t" x="484" y="120"><tspan id="ef-head-v">0.00 m</tspan><tspan x="484" dy="1.2em">head</tspan></text></g>
    <g class="ef-txt"><text x="12" y="26">Ground</text><text x="472" y="72">Logger</text><text x="300" y="166" text-anchor="end">E-Flow 3 at the obvert</text></g>
    <text class="ef-flow-l" x="494" y="287">Flow</text><path class="dg-arrow w" d="M526 283h20m-5-3.6 5 3.6-5 3.6"/>
    <path class="ef-hud" d="${corners}"/>`;
  return `
<div class="demo ef-demo" data-reveal>
  <div class="panel">
    <div class="panel-head"><div class="panel-title">${icon("waves", false)} Drag the water level</div><button class="btn btn-ghost btn-sm" type="button" id="ef-play" aria-pressed="false">${icon("cloud-rain", false)} <span id="ef-play-l">Play a storm</span></button></div>
    <svg id="ef-svg" class="ef-dark" viewBox="0 0 ${DEMO.w} ${DEMO.h}" data-pair="radar" role="img" aria-label="A sewer pipe and manhole in section, with E-Flow 3 at the top of the pipe and a logger near the top of the manhole. Arrows in the water show the velocity through the depth. The water level can be raised from low flow to a full surcharge up the manhole."><defs>${defs}</defs>${efSection(p, water, inner, DEMO)}</svg>
    <label class="range"><span>Water level <output><span id="ef-level">0.20</span> m</output></span><input id="ef-range" type="range" min="0.05" max="2.6" step="0.01" value="0.2"></label>
    <div class="ef-trace">
      <p class="ef-trace-h"><b>The record</b><span><i class="r"></i>Radar <i class="u"></i>Ultrasonic and pressure</span></p>
      <div class="ef-trace-plot"><svg id="ef-trace" viewBox="0 0 560 84" preserveAspectRatio="none" aria-hidden="true"><path class="ef-obv" d="M0 40H560"/><path id="ef-tr-r" class="ef-tr r"/><path id="ef-tr-u" class="ef-tr u"/></svg><span class="ef-obv-l">Pipe obvert</span></div>
    </div>
  </div>
  <div class="panel">
    <div class="panel-head"><div class="panel-title">${icon("radar", false)} What E-Flow 3 reports</div></div>
    <div class="state ef-state" id="ef-state" data-pair="radar"><i></i><div><b>Dual radar, non-contact</b><small>Free surface below the sensor.</small></div></div>
    <p class="sr-only" id="ef-live" aria-live="polite"></p>
    <ol class="ef-sensors">${[["vel", 1, "r", "Velocity radar", "24 GHz"], ["dep", 2, "r", "Depth radar", "120 GHz"], ["us", 3, "u", "Doppler ultrasonic", "Dual 1 MHz"], ["pr", 4, "u", "Pressure", "316 stainless"]].map(([k, n, pair, t, d]) => `<li data-s="${k}" data-pair="${pair}" data-state="standby"><span class="ef-n ${pair}" aria-hidden="true">${n}</span><span>${t}<small>${d}</small></span><em>Standing by</em></li>`).join("")}</ol>
    <div class="ef-spec" id="ef-spec-box" data-pair="radar">
      <p class="ef-trace-h"><b>Velocity signal</b><span id="ef-spec-l">Radar</span></p>
      <svg id="ef-spec" viewBox="0 0 280 64" aria-hidden="true"><path class="ef-spec-axis" d="M4 56H276"/><path id="ef-spec-n" class="ef-spec-n"/><path id="ef-spec-p" class="ef-spec-p"/></svg>
    </div>
    <div class="readouts ef-readouts">
      <div class="readout"><b><span id="ef-d">0.200</span><small>m</small></b><span>Depth</span></div>
      <div class="readout"><b><span id="ef-v">0.80</span><small>m/s</small></b><span>Velocity</span></div>
      <div class="readout"><b><span id="ef-q">0</span><small>L/s</small></b><span>Flow</span></div>
    </div>
    <p class="note">An illustration of how E-Flow 3 changes over, in a 600 mm sewer. Not to scale, and not live data.</p>
  </div>
</div>`;
}

for (const pg of C.productPages) {
  const b = brand("eds");
  const pricing = { topic: "Product pricing", product: `${pg.name} (${b.name})` };
  const datasheet = pg.docs.find((d) => d.label === "Datasheet");
  // optional bands between the overview (white) and the specifications: the
  // light ones alternate grey and white, and the demo sits on the deep teal
  const extra = [
    pg.modes && ["how-it-measures", pg.modes.nav, diagramBand(pg.modes)],
    pg.demo && ["changeover", pg.demo.nav, `<div class="section-head"><h2 class="h-lg" data-reveal>${esc(pg.demo.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(pg.demo.lede)}</p></div>${eflowDemo()}`, "dark"],
    pg.why && ["why-e-flow-3", pg.why.nav, whyBand(pg.why)],
    pg.accuracy && ["accuracy", pg.accuracy.nav, accuracyBand(pg.accuracy)],
    pg.upkeep && ["maintenance", pg.upkeep.nav, upkeepBand(pg.upkeep)],
    pg.install && ["installation", pg.install.nav, diagramBand(pg.install)],
    pg.tough && ["built-for-the-sewer", pg.tough.nav, toughBand(pg.tough)],
    pg.terminals && ["connections", "", terminalBand(pg.terminals)],
    pg.applications && ["applications", pg.applications.nav || "", applicationsBand(pg.applications)],
    pg.system && ["system", pg.system.nav, systemBand(pg.system)],
  ].filter(Boolean);
  let light = 0;
  const tones = extra.map(([, , , dark]) => (dark ? " dark" : light++ % 2 ? "" : " alt"));
  const specTone = light % 2 ? "" : " alt";
  // A page with several bands gets the section bar the service pages have.
  const nav = [["overview", "Overview"], ...extra.filter(([, label]) => label).map(([id, label]) => [id, label]), ["specifications", pg.specNav || "Specifications"]];
  const bar = (r) => nav.length > 4 ? `
<nav class="secbar" aria-label="On this page"><div class="wrap secbar-in">
  <ol>${nav.map(([id, label]) => `<li><a href="#${id}">${esc(label)}</a></li>`).join("")}</ol>
  <a class="btn btn-brand secbar-cta" href="${contactHref(r, pricing)}">Request pricing</a>
</div></nav>` : "";
  add({
    file: `products/${pg.slug}.html`,
    title: pg.title,
    description: pg.description,
    current: "products",
    scripts: pg.demo ? ["widgets.js"] : [],
    body: (r) => `
${pageHero(r, { crumbs: [["Products", "products/index.html"], [b.name, `products/${b.slug}.html`], [pg.name]], iconName: pg.icon, eyebrow: pg.tag, title: pg.name, lede: pg.lede, actions: `<a class="btn btn-primary btn-lg" href="${contactHref(r, pricing)}">Request pricing</a>${quoteBtn(quoteItem(products.find((p) => p.href === `products/${pg.slug}.html`)), "btn-lg")}<a class="btn btn-ghost btn-lg" href="${datasheet.href}" rel="noopener">${icon("download")} Datasheet</a>`, visual: pg.hero ? eflowHero(pg) : heroProduct(pg.image, pg.name) })}
<div class="secbar-scope">${bar(r)}
<section class="section hl-band"><div class="wrap">
  <div class="hl-grid">${pg.highlights.map(([ic, t, d], i) => `<div class="hl holder" data-reveal style="--i:${i % 3}">${icon(ic)}<b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div>
</div></section>
<section class="section" id="overview"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${pg.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    ${pg.features ? `<div class="feature-list" style="margin-top:40px">${pg.features.map(([t, d]) => `<div class="feature holder" data-reveal><div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>` : ""}
    ${pg.anatomy ? anatomyFigure(pg.anatomy, pg.image) : ""}
  </div>
  <aside class="aside">
    <figure class="aside-figure" data-reveal="right"><div class="aside-plate"><img src="${pg.figure.src}" alt="${esc(pg.figure.alt)}" loading="lazy"></div><figcaption>${esc(pg.figure.caption)}</figcaption></figure>
    <div class="aside-card" data-reveal="right"><h2>Documents</h2><ul class="aside-links docs">${pg.docs.map((d) => `<li><a href="${d.href}" rel="noopener"><span>${esc(`${pg.name} ${d.label.toLowerCase()}`)}<small>${docType(d.href)} · ${esc(d.note)}</small></span>${icon("download")}</a></li>`).join("")}</ul></div>
    <div class="aside-card" data-reveal="right"><h2>Works with</h2><ul class="aside-links docs">${pg.worksWith.map(([href, t, d]) => `<li><a href="${r}${href}"><span>${esc(t)}<small>${esc(d)}</small></span>${icon("arrow-right")}</a></li>`).join("")}</ul></div>
  </aside>
</div></section>
${extra.map(([id, , html], i) => `<section class="section band${tones[i]}" id="${id}"><div class="wrap">
  ${html}
</div></section>`).join("\n")}
<section class="section band${specTone}" id="specifications"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Specifications</p><h2 class="h-lg" data-reveal>${esc(pg.name)} in detail.</h2></div>
  <div class="spec-groups">${pg.specs.map(([group, rows], i) => `<div class="aside-card" data-reveal style="--i:${i % 3}"><h3>${esc(group)}</h3><table class="specs"><tbody>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>`).join("")}</div>
  <p class="note spec-note" data-reveal>${esc(pg.specNote)} Full details are in the <a href="${datasheet.href}" rel="noopener">${esc(pg.name)} datasheet</a>.</p>
</div></section></div>
${ctaSection(r, { ...pg.cta, ...pricing })}`,
  });
}

/* ---- FlowSense ---- */
// A tour of the platform in its own screens: each stop is a heading, a short
// lede and four points beside the screen they describe, in the order the
// platform's menu runs (Monitor, Analyse, Engineer, Deliver). The Pump
// Station Manager is the one showpiece band, with its screen pinned. The
// copy and the screens are `flowsense` in content.mjs. The rate card stays in
// the brochures, not on the page (EDS, 23 October 2026).
const FS = C.flowsense;
const FS_SIZES = {
  single: "(max-width: 980px) calc(100vw - 40px), 700px",
  stack: "(max-width: 980px) calc(100vw - 40px), 640px",
  over: "(max-width: 700px) calc(100vw - 40px), (max-width: 980px) calc(60vw - 24px), 400px",
  beside: "(max-width: 700px) calc(100vw - 40px), (max-width: 980px) calc(57vw - 24px), 400px",
  besideB: "(max-width: 700px) calc(100vw - 40px), (max-width: 980px) calc(43vw - 24px), 300px",
  column: "(max-width: 980px) calc(100vw - 40px), 700px",
  wide: "(max-width: 980px) calc(100vw - 40px), 1240px",
  tall: "(max-width: 980px) 70vw, 300px",
};
const fsFrame = (name, alt, { sizes, cls = "", eager = false, i } = {}) => `<div class="fs-frame${cls ? ` ${cls}` : ""}" data-reveal${i != null ? ` style="--i:${i}"` : ""}>${shot(name, alt, { sizes, eager })}</div>`;
const fsPoints = (points) => `<ul class="fs-points">${points.map(([t, d], n) => `<li data-reveal style="--i:${n + 2}"><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("")}</ul>`;
const fsTags = (tags) => `<ul class="fs-tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
function fsStop(s, n) {
  const [a, b] = s.shots;
  const media = s.layout === "stack" ? `<div class="fs-media stack">${fsFrame(a[0], a[1], { sizes: FS_SIZES.stack })}${fsFrame(b[0], b[1], { sizes: FS_SIZES.over, cls: "over", i: 2 })}</div>`
    : s.layout === "beside" ? `<div class="fs-media beside">${fsFrame(a[0], a[1], { sizes: FS_SIZES.beside })}${fsFrame(b[0], b[1], { sizes: FS_SIZES.besideB, i: 2 })}</div>`
    : s.layout === "column" ? `<div class="fs-media column">${fsFrame(a[0], a[1], { sizes: FS_SIZES.column })}${fsFrame(b[0], b[1], { sizes: FS_SIZES.column, i: 2 })}</div>`
    : `<div class="fs-media">${fsFrame(a[0], a[1], { sizes: FS_SIZES[s.layout] || FS_SIZES.single })}</div>`;
  const copy = `<div class="fs-stop-copy">
    <div class="fs-stop-head">${s.group ? `<p class="eyebrow">${esc(s.group)}</p>` : ""}<h2 data-reveal>${esc(s.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(s.lede)}</p></div>
    <div>${fsPoints(s.points)}${s.tools ? `<p class="fs-tags-note" data-reveal>${esc(s.toolsNote)}</p>${fsTags(s.tools)}` : ""}</div>
  </div>`;
  const tone = n % 2 ? " alt" : "";
  if (s.layout === "wide") return `<section class="section band fs-stop wide${tone}" id="${s.id}"><div class="wrap">${copy}${media}</div></section>`;
  return `<section class="section band fs-stop${n % 2 ? " rev" : ""}${tone}${s.layout === "tall" ? " tall" : ""}" id="${s.id}"><div class="wrap fs-stop-in">${copy}${media}</div></section>`;
}
// The video tour is not on the site and not in this repository: a visitor
// asks for it, and EDS sends it once it knows who is asking. The button opens
// the enquiry form with the FlowSense topic picked and the video named as
// what the enquiry is about (the form's "Enquiring about" line).
const fsVideo = (r, v) => `
<section class="section band" id="video"><div class="wrap">
  <div class="fs-ask" data-reveal>
    ${icon("circle-play")}
    <div><h2>${esc(v.heading)}</h2><p>${esc(v.lede)}</p></div>
    <a class="btn btn-primary btn-lg" href="${contactHref(r, { topic: "EDS FlowSense", product: v.request })}">${esc(v.action)}</a>
  </div>
</div></section>`;
// The section bar for this page: the same bar as the service pages, with
// the walkthrough as its action.
const fsBar = (r) => `
<nav class="secbar" aria-label="On this page"><div class="wrap secbar-in">
  <ol>${[["video", "Video"], ["platform", "Platform"], ["monitor", "Monitor"], ["blockage-watch", "Blockage Watch"], ["psm", "Pump stations"], ["analyse", "Analyse"], ["engineer", "Engineer"], ["reports", "Reports"], ["connect", "Connect"], ["standards", "Standards"], ["questions", "Questions"], ["documents", "Documents"]].map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join("")}</ol>
  <a class="btn btn-brand secbar-cta" href="${contactHref(r, { topic: "EDS FlowSense" })}">Request a walkthrough</a>
</div></nav>`;
// The wet well trace beside the Pump Station Manager: five hours of level
// drawn as a schematic, filling slowly as sewage arrives and emptying fast
// as the pumps run, between the start and stop levels.
const fsTrace = (t) => {
  const cycle = "M20 168 L170 56 L198 168 L348 56 L376 168 L526 56 L554 168 L620 118";
  return `
<figure class="fs-trace" data-reveal>
  <svg viewBox="0 0 640 230" aria-hidden="true">
    <defs><linearGradient id="fst-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4a6" stop-opacity=".3"/><stop offset="1" stop-color="#5fb4a6" stop-opacity=".02"/></linearGradient></defs>
    <rect class="fst-band" x="20" y="56" width="600" height="112"/>
    <path class="fst-grid" d="M20 84H620M20 112H620M20 140H620M170 20V200M348 20V200M526 20V200"/>
    <path class="fst-axis" d="M20 20V200M20 200H620"/>
    <g stroke-dasharray="5 5" stroke-width="1.3"><path d="M20 56H620" stroke="#0d7c72"/><path d="M20 168H620" stroke="#4e6361"/></g>
    <path d="${cycle} V200 H20 Z" fill="url(#fst-fill)"/>
    <path class="fst-glow draw" pathLength="100" d="${cycle}"/>
    <path class="draw" pathLength="100" d="${cycle}" fill="none" stroke="#0c5f59" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
    <g class="fst-runs">${[170, 348, 526].map((x) => `<rect x="${x}" y="203" width="28" height="4" rx="2"/>`).join("")}</g>
    <g font-family="'EDS Text', 'Helvetica Neue', sans-serif" font-size="11.5" fill="#2e4543">
      <text x="572" y="50" font-weight="650">Start</text><text x="574" y="184" font-weight="650">Stop</text>
      <text x="22" y="220" fill="#4e6361">${esc(t.rise)}</text>
      <text x="206" y="40" fill="#4e6361">${esc(t.fall)}</text>
      <text x="22" y="40" fill="#4e6361" font-size="10.5">Wet well level</text>
    </g>
    <g fill="none" stroke="#4e6361" stroke-width="1"><path d="M60 198V141"/><path d="M212 44 L212 54 L188 100"/></g>
  </svg>
  <figcaption><b>${esc(t.title)}</b> ${esc(t.text)}</figcaption>
</figure>`;
};
add({
  file: "flowsense.html",
  title: "EDS FlowSense | Sewer network intelligence",
  description: "EDS FlowSense: live operations, infiltration and inflow, pump stations and calibrated hydraulic models on one validated record. Built in Australia by EDS.",
  current: "flowsense",
  body: (r) => {
    const cut = FS.tour.findIndex((s) => s.id === "analyse");
    const first = FS.tour.slice(0, cut), second = FS.tour.slice(cut);
    const walkthrough = contactHref(r, { topic: "EDS FlowSense" });
    return `
${pageHero(r, { cls: "fs-hero", crumbs: [["FlowSense"]], eyebrow: "Sewer network intelligence", title: FS.title, lede: FS.lede, compact: true, actions: `<a class="btn btn-primary btn-lg" href="${site.flowsenseUrl}" rel="noopener">Open FlowSense ${icon("arrow-up-right")}</a><a class="btn btn-ghost btn-lg" href="${walkthrough}">Request a walkthrough</a>` })}
<section class="fs-stage" aria-label="The FlowSense Network Overview">
  <div class="wrap">
    <figure class="fs-stage-shot">
      ${fsFrame(FS.stage.shot, FS.stage.alt, { sizes: FS_SIZES.wide, cls: "lg", eager: true, i: 3 })}
      <figcaption data-reveal style="--i:4">${esc(FS.stage.caption)}</figcaption>
    </figure>
    <ul class="fs-facts">
      ${FS.facts.map(([v, u, l], n) => `<li data-reveal style="--i:${n}"><b>${esc(v)}${u ? `<small>${esc(u)}</small>` : ""}</b><span>${esc(l)}</span></li>`).join("")}
    </ul>
  </div>
</section>
${fsBar(r)}
${fsVideo(r, FS.video)}
<section class="section band alt" id="platform"><div class="wrap">
  <div class="band-head"><h2 class="h-lg" data-reveal>${esc(FS.layers.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(FS.layers.lede)}</p></div>
  <div class="grid c3 fs-layers">
    ${FS.layers.items.map(([ic, t, d, rep], n) => `<div class="card hoverable holder" data-reveal style="--i:${n}"><span class="card-icon">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p><small>${esc(rep)}</small></div>`).join("")}
  </div>
</div></section>
${first.map(fsStop).join("")}
<section class="section fs-band fs-psm" id="psm"><div class="wrap">
  <div class="fs-psm-head">
    <p class="eyebrow">${esc(FS.psm.eyebrow)}</p>
    <h2 class="h-lg" data-reveal>${esc(FS.psm.heading)}</h2>
    <p class="lede" data-reveal style="--i:1">${esc(FS.psm.lede)}</p>
  </div>
  <div class="fs-psm-stage">
    <figure class="fs-frame lg fs-pinned" data-reveal style="--i:2">
      ${shot(FS.psm.shot[0], FS.psm.shot[1], { sizes: "(max-width: 980px) calc(100vw - 40px), 760px" })}
      ${FS.psm.pins.map(([t, , x, y], i) => `<span class="fs-pin" data-n="${i + 1}" style="--x:${x};--y:${y}" aria-hidden="true"><b>${i + 1}</b></span>`).join("")}
    </figure>
    <ol class="fs-key" aria-label="What the screen shows">
      ${FS.psm.pins.map(([t, d], i) => `<li data-n="${i + 1}" data-reveal style="--i:${i + 3}"><span>${i + 1}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join("")}
    </ol>
  </div>
  <div class="fs-psm-more">
    ${fsTrace(FS.psm.trace)}
    ${fsPoints(FS.psm.points)}
  </div>
  <p class="fs-psm-needs" data-reveal>${esc(FS.psm.needs)}</p>
  <div class="hero-actions" data-reveal style="--i:1">
    <a class="btn btn-primary btn-lg" href="${r}${FS.psm.link[0]}">${esc(FS.psm.link[1])}</a>
    <a class="btn btn-ghost btn-lg" href="${walkthrough}">Request a walkthrough</a>
  </div>
</div></section>
${second.map(fsStop).join("")}
<section class="section band" id="connect"><div class="wrap">
  <div class="band-head"><h2 class="h-lg" data-reveal>${esc(FS.connect.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(FS.connect.lede)}</p></div>
  <div class="fs-flow">
    <div data-reveal><h3>${icon("arrow-down-to-line", false)} In</h3><ul>${FS.connect.in.map((l) => `<li>${icon("check", false)}<span>${esc(l)}</span></li>`).join("")}</ul></div>
    <div class="mid" data-reveal style="--i:1"><h3>${icon("database", false)} One validated record</h3><ul>${FS.connect.record.map((l) => `<li>${icon("check", false)}<span>${esc(l)}</span></li>`).join("")}</ul></div>
    <div data-reveal style="--i:2"><h3>${icon("arrow-up-from-line", false)} Out</h3><ul>${FS.connect.out.map((l) => `<li>${icon("check", false)}<span>${esc(l)}</span></li>`).join("")}</ul></div>
  </div>
  <p class="fs-flow-note" data-reveal>${esc(FS.connect.note)}</p>
</div></section>
<section class="section band alt" id="apart"><div class="wrap">
  <div class="band-head"><h2 class="h-lg" data-reveal>${esc(FS.apart.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(FS.apart.lede)}</p></div>
  <ul class="deliv n4">${FS.apart.items.map(([t, d], n) => `<li data-reveal style="--i:${n % 4}"><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join("")}</ul>
</div></section>
<section class="section band" id="standards"><div class="wrap">
  <div class="band-head"><h2 class="h-lg" data-reveal>${esc(FS.standards.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(FS.standards.lede)}</p></div>
  <ul class="fs-std">${FS.standards.items.map(([ic, t, d], n) => `<li data-reveal style="--i:${n % 4}"><span class="card-icon">${icon(ic)}</span><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join("")}</ul>
  <p class="fs-tags-note" data-reveal>${esc(FS.standards.methodsNote)}</p>
  ${fsTags(FS.standards.methods)}
  <ul class="fs-assure">${FS.standards.assurance.map(([ic, t, d], n) => `<li data-reveal style="--i:${n}">${icon(ic, false)}<b>${esc(t)}</b><small>${esc(d)}</small></li>`).join("")}</ul>
  <div class="fs-trust" data-reveal><p>${esc(FS.standards.instruments)}</p><p class="note">${esc(FS.standards.note)}</p></div>
  <div class="fs-clients">
    <p>${esc(FS.standards.clientsHeading)}</p>
    ${logoGrid()}
    <p class="note">${esc(FS.standards.clientsNote)}</p>
  </div>
</div></section>
<section class="section band alt band-split" id="questions"><div class="wrap"><div class="split-band">
  <div class="band-head"><h2 class="h-lg" data-reveal>What councils and utilities ask us.</h2><p class="lede" data-reveal style="--i:1">If your question isn't here, our team will answer it on <a href="${site.phoneHref}">${site.phone}</a>.</p></div>
  <div data-reveal>${faqHtml(FS.faq)}</div>
</div></div></section>
<section class="section band" id="documents"><div class="wrap">
  <div class="section-head"><h2 class="h-lg" data-reveal>Read more about FlowSense.</h2></div>
  <ul class="doc-list grid c2">
    ${FS.docs.map((d, n) => `<li data-reveal style="--i:${n}"><a href="${d.href}" rel="noopener"><span class="card-icon">${icon("file-text")}</span><span>${esc(d.label)}<small>${esc(d.note)} ${docType(d.href)}.</small></span>${icon("download")}</a></li>`).join("")}
  </ul>
</div></section>
${ctaSection(r, { title: "See it on your own network.", lede: "Book a live demonstration on your own sites, and bring your hardest question about how a figure was calculated. We'll show you the working behind every number on the screen.", topic: "EDS FlowSense" })}`;
  },
});

/* ---- about ---- */
add({
  file: "about.html",
  title: "About EDS | Environmental Data Services",
  description: "EDS: Australian owned and operated since 1991, and Australia's largest supplier of monitoring equipment to the water and wastewater industry.",
  current: "about",
  scripts: ["widgets.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["About"]], title: "Australian owned and operated since 1991.", lede: "Scientists, engineers and technicians who know water and wastewater monitoring from the manhole up.", visual: heroFacts() })}
<section class="section"><div class="wrap split">
  <div class="prose" data-reveal>${C.about.intro.map((p) => `<p>${esc(p)}</p>`).join("")}<h2>Our mission</h2>${C.about.mission.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  <aside class="aside">
    <figure class="quote" data-reveal="right" style="margin:0">${icon("quote", false)}<blockquote style="font-size:1.25rem">${C.about.quote.text}</blockquote><cite><b>${C.about.quote.who}</b>, ${C.about.quote.org}</cite></figure>
  </aside>
</div></section>
<section class="section alt" id="in-the-field"><div class="wrap">
  <div class="section-head"><p class="eyebrow">In the field</p><h2 class="h-lg" data-reveal>${esc(C.about.field.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(C.about.field.lede)}</p></div>
  <div class="mosaic">${C.about.field.photos.map((f, i) => photoFigure(f, { i, sizes: i ? "(max-width: 560px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 27px), 300px" : "(max-width: 980px) calc(100vw - 40px), 614px" })).join("")}</div>
</div></section>
<section class="section" id="how-we-work"><div class="wrap">
  <div class="section-head"><h2 class="h-lg" data-reveal>${esc(C.about.approach.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(C.about.approach.lede)}</p></div>
  <div class="grid c3">
    ${C.about.approach.items.map(([ic, t, d], n) => `<div class="card hoverable holder" data-reveal style="--i:${n % 3}"><span class="card-icon">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}
  </div>
</div></section>
<section class="section alt"><div class="wrap origins">
  <div class="section-head"><p class="eyebrow">EDS origins</p><h2 class="h-lg" data-reveal>Founded by Graham and Cynthia Harper.</h2>
  <p class="lede" data-reveal style="--i:1">EDS began in Queensland in 1991, after Graham's success with ELPRO, with the release of the Pump Station Manager.</p></div>
  <div class="timeline">
    <span class="timeline-fill"></span>
    ${C.about.timeline.map(([when, t, d], i) => `${i === C.about.timeline.findIndex(([w]) => w.startsWith("2022")) ? '<p class="tl-group" id="projects">Recent projects</p>' : ""}<div class="tl" data-reveal><time>${when}</time><i></i><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}
  </div>
  <figure class="quote" data-reveal style="margin:48px 0 0">${icon("quote", false)}<blockquote>${C.about.founder.text}</blockquote><cite><b>${C.about.founder.name}</b>, ${C.about.founder.role}</cite></figure>
</div></section>
<section class="section dark"><div class="wrap aus">
  <svg id="ausmap" data-offices='${JSON.stringify(C.offices)}' role="img" aria-label="Map of Australia showing EDS offices" data-reveal="scale"></svg>
  <div><h2 class="h-lg" data-reveal>Four offices across Australia.</h2>
  <p class="lede" data-reveal style="--i:1">Crews and support across the country, on one number. Tell us about your network, site or project.</p>
  <div class="office-list" style="margin-top:26px">${C.offices.map((o) => `<button class="office" type="button"><span class="card-icon">${icon("map-pin")}</span><span><b>${o.city}</b><span>${o.note}</span></span><em>${o.state}</em></button>`).join("")}</div>
  <div class="hero-actions" data-reveal style="--i:2"><a class="btn btn-primary btn-lg" href="${contactHref(r)}">Start an enquiry</a><a class="btn btn-ghost btn-lg" href="${site.phoneHref}">${icon("phone")} ${site.phone}</a></div></div>
</div></section>`,
});

/* ---- resources ---- */
// Every document on the site as one list for the Resources library: the
// downloads and the white papers, each with its range, its kind and the size
// of the file, read from the file itself at build time.
const docFile = (href) => href.replace("@root/assets/docs/", "");
const docSize = (file) => { const mb = statSync(path.join(ROOT, "src/assets/docs", file)).size / 1048576; return mb >= 10 ? `${Math.round(mb)} MB` : `${Math.max(0.1, mb).toFixed(1)} MB`; };
const docRange = (file) => /^eds-flowsense|^eds-industry/.test(file) ? "FlowSense" : /^eds-/.test(file) ? "EDS" : /^detectronic/.test(file) ? "Detectronic" : /^ori-/.test(file) ? "ORI" : /^hach|^gxmu/.test(file) ? "Hach Flow" : /^beadedstream/.test(file) ? "Beadedstream" : /^aquamonitrix/.test(file) ? "Aquamonitrix" : "EDS";
const docKind = (file, label) => { const l = label.toLowerCase(); return /white-paper|industry-paper/.test(file) ? "White paper" : /\.zip$/.test(file) ? "Software" : /manual/.test(l) ? "Manual" : /datasheet|spec sheet/.test(l) ? "Datasheet" : /brochure|catalogue|overview|features|value case/.test(l) ? "Brochure" : "Guide"; };
const RANGE_ORDER = ["EDS", "Detectronic", "ORI", "Hach Flow", "Beadedstream", "Aquamonitrix", "FlowSense"];
const library = [...C.downloads.flatMap((g) => g.items.map(([label, href]) => ({ label, href }))), ...C.papers.map((p) => ({ label: p.title, href: p.href }))]
  .filter((d, i, all) => all.findIndex((x) => x.href === d.href) === i)
  .map((d) => { const file = docFile(d.href); return { ...d, file, range: docRange(file), kind: docKind(file, d.label), ext: file.split(".").pop().toUpperCase(), size: docSize(file) }; })
  .sort((a, b) => RANGE_ORDER.indexOf(a.range) - RANGE_ORDER.indexOf(b.range) || a.label.localeCompare(b.label));
const libraryChips = (name, values) => `<div class="lib-chips" role="group" aria-label="${name}" data-lib-filter="${name.toLowerCase()}"><span class="lib-lbl">${name}</span><button type="button" class="fchip" data-value="" aria-pressed="true" data-track-label="All ${name.toLowerCase()}s">All</button>${values.map((v) => `<button type="button" class="fchip" data-value="${esc(v)}" aria-pressed="false" data-track-label="${esc(v)}">${esc(v)}</button>`).join("")}</div>`;
const LIBRARY_ROWS = 12;

add({
  file: "resources.html",
  title: "White Papers, Downloads & Manuals | EDS",
  description: "EDS white papers on inflow and infiltration, and on locating it with thermistor strings, plus software, drivers, datasheets and selection guides.",
  current: "resources",
  scripts: ["library.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["Resources"]], title: "White papers, downloads and support.", lede: "What we've learnt in the field, and the files you need to keep instruments running.", visual: heroToc([["papers", "White papers", C.papers.length], ["downloads", "Datasheets, manuals and software", library.length], ["support", "Passwords, RMA forms and data access"]]) })}
<section class="section" id="papers"><div class="wrap">
  <div class="section-head"><p class="eyebrow">White papers</p><h2 class="h-lg" data-reveal>EDS publications</h2></div>
  <div class="grid ${C.papers.length % 3 ? "c2" : "c3"}">
    ${C.papers.map((p, n) => `
    <a class="card paper" href="${p.href}" rel="noopener" data-reveal style="--i:${n}">
      <div class="paper-top"><span class="card-icon">${icon("file-text")}</span><span class="tag">${p.date}</span></div>
      <div class="paper-body"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><span class="go" aria-hidden="true">${icon("download")}</span></div>
    </a>`).join("")}
  </div>
</div></section>
<section class="section alt library" id="downloads"><div class="wrap">
  <div class="section-head"><h2 class="h-lg" data-reveal>Datasheets, manuals and software</h2><p class="lede" data-reveal style="--i:1">Every document EDS publishes, with its file type and size shown before you download.</p></div>
  <div class="lib-bar" data-reveal style="--i:2">
    <label class="finder-search">${icon("search", false)}<input type="search" placeholder="Search ${library.length} documents" aria-label="Search documents" autocomplete="off" spellcheck="false"></label>
    ${libraryChips("Range", [...new Set(library.map((d) => d.range))])}
    ${libraryChips("Type", [...new Set(library.map((d) => d.kind))])}
  </div>
  <p class="finder-count" role="status">Showing ${LIBRARY_ROWS} of ${library.length} documents</p>
  <div class="table-scroll"><table class="lib-table">
    <thead><tr><th>Document</th><th>Range</th><th>Type</th><th>File</th><th><span class="sr-only">Download</span></th></tr></thead>
    <tbody>${library.map((d, i) => `<tr data-range="${esc(d.range)}" data-type="${esc(d.kind)}" data-search="${esc([d.label, d.range, d.kind, d.ext].join(" ").toLowerCase())}"${i >= LIBRARY_ROWS ? " hidden" : ""}><td class="d"><span class="doc-name"><span class="card-icon">${icon(d.kind === "Software" ? "hard-drive-download" : "file-text", false)}</span><a href="${d.href}" rel="noopener" data-track-item="${esc(d.label)}">${esc(d.label)}</a></span></td><td class="r">${esc(d.range)}</td><td class="t"><span>${esc(d.kind)}</span></td><td class="f">${d.ext} · ${d.size}</td><td class="dl"><a href="${d.href}" rel="noopener" aria-label="Download ${esc(d.label)}" data-track-item="${esc(d.label)}">${icon("download")}</a></td></tr>`).join("")}</tbody>
  </table></div>
  <div class="finder-empty" hidden>
    <span class="card-icon">${icon("search-x")}</span>
    <h3>No documents match</h3>
    <p>Try another word, or ask our service department for the file you need.</p>
    <div class="hero-actions"><button class="btn btn-outline" type="button" data-lib-reset>Show all documents</button><a class="btn btn-brand" href="${contactHref(r, { topic: "General enquiry" })}">Ask for a document</a></div>
  </div>
  <p class="lib-more"><button class="btn btn-outline" type="button" data-lib-more>Show all ${library.length} documents ${icon("chevron-down")}</button></p>
  <p class="note" style="margin-top:18px;font-size:.9rem;max-width:72ch">${C.downloads.find((g) => g.note).note}</p>
</div></section>
<section class="section" id="support"><div class="wrap"><div class="section-head"><h2 class="h-lg" data-reveal>Passwords, RMA forms and data access</h2></div><div class="grid c2">
  <a class="card" href="${contactHref(r, { topic: "Equipment service or calibration" })}" data-reveal><span class="card-icon">${icon("lock")}</span><h3>Software passwords and RMA forms</h3><p>Request a software password, an EDS or Hach Marsh RMA form, or EDS safety policies and procedures.</p><span class="go" aria-hidden="true">${icon("arrow-right")}</span></a>
  <a class="card" href="${site.remoteDataUrl}" rel="noopener" data-reveal style="--i:1"><span class="card-icon">${icon("globe")}</span><h3>Remote data access</h3><p>Sign in to DetectData to view data from your Detectronic instruments.</p><span class="go" aria-hidden="true">${icon("arrow-up-right")}</span></a>
</div></div></section>
${ctaSection(r, { title: "Can't find a manual or driver?", lede: "Our service department will send you what you need.", topic: "Equipment service or calibration" })}`,
});

/* ---- contact ---- */
// The enquiry form's first question, as tiles. Each one is a topic the old
// "I am interested in" list offered (`subject` is that option); the
// monitoring tile opens the list of services and solutions to narrow it
// down. `prompt` is the hint in the details box once a tile is picked.
const enquiryTopics = [
  { id: "monitoring", icon: "activity", title: "A monitoring service", hint: "Flow, water quality, real-time data", prompt: "Your site or network, what you need to measure, and for how long" },
  { id: "pricing", icon: "tag", title: "Product pricing", subject: "Product pricing", hint: "Instruments to buy", prompt: "Which instruments, how many, and where they will be installed" },
  { id: "hire", icon: "calendar-clock", title: "Equipment hire", subject: "Equipment Rental", hint: "For a study or a season", prompt: "What you need to measure, where, and the dates you need it for" },
  { id: "service", icon: "wrench", title: "Service or calibration", subject: "Equipment service or calibration", hint: "Repairs and calibration", prompt: "The instrument, its serial number if you have it, and what it is doing" },
  { id: "flowsense", icon: "waves", title: "EDS FlowSense", subject: "EDS FlowSense", hint: "A walkthrough of the platform", prompt: "The sites you monitor now, and what you'd like to see" },
  { id: "general", icon: "message-circle-more", title: "Something else", subject: "General enquiry", hint: "Any other question", prompt: "Tell us about your site, network or project" },
];

// The enquiry form, on its own page (enquire.html) and beside the contact
// details on contact.html. site.js runs it; quote.js fills the quote list.
const enquiryForm = (r, reveal) => `
  <form class="form" id="enquiry" ${formSend} data-track="Enquiry form" data-reveal="${reveal}" novalidate>
    <div class="form-fields">
      <div class="form-head">
        <h2>Start an enquiry</h2>
        <p>Three quick steps, and it goes straight to our team.</p>
        <ol class="form-progress" aria-hidden="true">
          ${[["topic", "Topic"], ["project", "Project"], ["you", "Contact"]].map(([k, t], i) => `<li data-progress="${k}"><span><b>${i + 1}</b>${icon("check", false)}</span>${t}</li>`).join("")}
        </ol>
      </div>
      <fieldset class="form-part" data-part="topic" aria-describedby="topic-error">
        <legend><span class="part-no"><b>1</b>${icon("check", false)}</span>What can we help with?</legend>
        <div class="topic-tiles">
          ${enquiryTopics.map((t) => `<label class="topic-tile holder"><input type="radio" name="Topic" value="${esc(t.title)}" data-topic="${t.id}" data-subject="${esc(t.subject || "")}" data-prompt="${esc(t.prompt)}"><span class="card-icon">${icon(t.icon)}</span><b>${esc(t.title)}</b><small>${esc(t.hint)}</small></label>`).join("")}
        </div>
        <small class="field-error" id="topic-error" data-topic-error hidden role="alert">Please choose a topic.</small>
        <label class="field topic-detail" data-topic-detail hidden>Which service or solution?<select>
          <option value="">Not sure yet, or more than one</option>
          ${C.serviceGroups.map((g) => `<optgroup label="${esc(g.title)}">${C.services.filter((s) => s.group === g.id).map((s) => `<option>${esc(s.title)}</option>`).join("")}</optgroup>`).join("")}
          <optgroup label="Solutions">${C.solutions.map((s) => `<option>${esc(s.title)}</option>`).join("")}</optgroup>
        </select></label>
        <input type="hidden" name="subject" value="General enquiry">
      </fieldset>
      <fieldset class="form-part" data-part="project">
        <legend><span class="part-no"><b>2</b>${icon("check", false)}</span>Tell us about your project</legend>
        <div class="form-context" hidden>
          <span class="card-icon">${icon("package", false)}</span>
          <div><small>Enquiring about</small><b></b></div>
          <button type="button" data-context-clear aria-label="Remove this product from the enquiry">${icon("x", false)}</button>
          <input type="hidden" name="Product">
        </div>
        <div class="quote-box" data-quote-box hidden>
          <div class="quote-box-head">
            <span class="card-icon">${icon("clipboard-list", false)}</span>
            <div><small>Your quote list</small><b data-quote-summary></b></div>
            <button type="button" class="quote-clear" data-quote-clear>${icon("trash-2", false)}<span>Clear</span></button>
          </div>
          <ul class="quote-items" data-quote-items></ul>
          <a class="quote-more" href="${r}products/index.html#finder">${icon("plus", false)} Add more products</a>
        </div>
        <template data-quote-row>
          <li>
            <img alt="" width="48" height="48" loading="lazy">
            <span><a></a><small></small></span>
            <span class="qty"><button type="button" data-step="-1">${icon("minus", false)}</button><input type="number" min="1" max="999" value="1" inputmode="numeric"><button type="button" data-step="1">${icon("plus", false)}</button></span>
            <button type="button" class="quote-remove" aria-label="Remove">${icon("x", false)}</button>
          </li>
        </template>
        <fieldset class="field modes">
          <legend><span>How would you like to work? <i>Optional</i></span></legend>
          <div class="mode-chips">
            ${[...C.ways.items.map((w) => [w.mode, w.title === "Data as a Service" ? "Managed by EDS (DaaS)" : w.title]), ["unsure", "Not sure yet"]].map(([m, label]) => `<label class="mode-chip"><input type="radio" name="Way of working" value="${esc(label)}" data-mode="${m}"><span>${esc(label)}</span></label>`).join("")}
          </div>
        </fieldset>
        <label class="field">Details<textarea name="Message" required placeholder="${esc(enquiryTopics.at(-1).prompt)}" data-prompt="${esc(enquiryTopics.at(-1).prompt)}"></textarea></label>
        <textarea name="Products" hidden disabled></textarea>
      </fieldset>
      <fieldset class="form-part" data-part="you">
        <legend><span class="part-no"><b>3</b>${icon("check", false)}</span>How can we reach you?</legend>
        <div class="field-row">
          <label class="field">Name<input name="Name" autocomplete="name" required></label>
          <label class="field"><span>Organisation <i>Optional</i></span><input name="Organisation" autocomplete="organization"></label>
        </div>
        <div class="field-row">
          <label class="field">Email<input name="Email" type="email" autocomplete="email" required pattern="[^@\\s]+@[^@\\s]+\\.[^@\\s]+"></label>
          <label class="field" data-phone-field><span>Phone <i>Optional</i></span><input name="Phone" type="tel" autocomplete="tel"></label>
        </div>
        <fieldset class="field modes">
          <legend><span>How should we reply?</span></legend>
          <div class="mode-chips">
            <label class="mode-chip"><input type="radio" name="Reply by" value="Email" checked><span>By email</span></label>
            <label class="mode-chip"><input type="radio" name="Reply by" value="Phone call" data-needs-phone><span>Give me a call</span></label>
          </div>
        </fieldset>
      </fieldset>
      ${botcheck}
      <div class="form-submit">
        <button class="btn btn-brand btn-lg" type="submit"><span>Submit enquiry</span>${icon("arrow-right")}<i class="spin" aria-hidden="true"></i></button>
        <p class="note">${icon("lock", false)}Your enquiry goes straight to our team. <a href="${r}privacy.html">Privacy policy</a></p>
      </div>
      <p class="form-error" role="alert" data-done="error" hidden>${icon("circle-alert", false)}<span>Your enquiry didn't go through. Please try again in a moment, or call <a href="${site.phoneHref}">${site.phone}</a>.</span></p>
    </div>
    <div class="form-done" data-done="sent" hidden tabindex="-1" role="status">
      <svg class="done-mark" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg>
      <h2 data-done-title>Thanks. Your enquiry is with our team.</h2>
      <dl class="done-summary">
        <div><dt>About</dt><dd data-sum="topic"></dd></div>
        <div><dt>Products</dt><dd data-sum="products"></dd></div>
        <div><dt>Way of working</dt><dd data-sum="way"></dd></div>
        <div><dt>We will reply</dt><dd data-sum="reply"></dd></div>
      </dl>
      <p>For anything urgent, call <a href="${site.phoneHref}">${site.phone}</a>.</p>
      <div class="btn-row">
        <button class="btn btn-outline" type="button" data-form-edit>${icon("plus", false)}Start another enquiry</button>
        <a class="link-arrow" href="${r}products/index.html">Browse products ${icon("arrow-right")}</a>
      </div>
    </div>
  </form>`;

add({
  file: "contact.html",
  title: "Contact EDS | Offices in QLD, NSW, VIC & SA | 1300 721 683",
  description: "Contact Environmental Data Services. Head office at Meadowbrook, Queensland, with offices in New South Wales, Victoria and South Australia.",
  current: "contact",
  scripts: ["widgets.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["Contact"]], title: "Give us a call or drop\u00a0in. We'd love to hear about your project.", lede: `${site.hours}, with one number for every state.`, visual: heroPanel("Quickest ways to reach us", `
  <a class="hero-call" href="${site.phoneHref}">${icon("phone")}<span><small>Call from anywhere in Australia</small><b>${site.phone}</b></span></a>
  <ul class="hero-links">
    <li><a href="#enquiry">${icon("message-square-text")}<span>Start an enquiry</span>${icon("arrow-down")}</a></li>
    <li><a href="#offices">${icon("map-pin")}<span>Offices in four states</span>${icon("arrow-down")}</a></li>
  </ul>`, "hero-contact") })}
<section class="section alt"><div class="wrap contact-grid">
  <div class="contact-cards">
    <a class="contact-card" href="${site.phoneHref}" data-reveal><span class="card-icon">${icon("phone")}</span><span><b>${site.phone}</b><span>General enquiries, customer service, service department and sales</span></span></a>
    <a class="contact-card" href="${contactHref(r, { topic: "Product pricing" }, "contact.html")}" data-reveal><span class="card-icon">${icon("tag")}</span><span><b>Sales</b><span>${site.sales}<br>Pricing, quotes and hire</span></span></a>
    <a class="contact-card" href="${contactHref(r, { topic: "Equipment service or calibration" }, "contact.html")}" data-reveal><span class="card-icon">${icon("wrench")}</span><span><b>Service</b><span>${site.service}<br>Equipment service and calibration</span></span></a>
    <a class="contact-card" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("13/20-22 Ellerslie Road, Meadowbrook QLD 4131")}" rel="noopener" data-reveal><span class="card-icon">${icon("map-pin")}</span><span><b>Head office</b><span>${site.address.join(", ")}</span></span></a>
    <div class="contact-card" data-reveal><span class="card-icon">${icon("clock", false)}</span><span><b>Opening hours</b><span>${site.hours}. Closed Saturday and Sunday.</span>${openStatus()}</span></div>
  </div>
  ${enquiryForm(r, "right")}
</div></section>
<section class="section dark" id="offices"><div class="wrap aus">
  <svg id="ausmap" data-offices='${JSON.stringify(C.offices)}' role="img" aria-label="Map of Australia showing EDS offices" data-reveal="scale"></svg>
  <div><p class="eyebrow">Office locations</p><h2 class="h-lg" data-reveal>Find us in four states.</h2>
  <div class="office-list" style="margin-top:26px">${C.offices.map((o) => `<button class="office" type="button"><span class="card-icon">${icon("map-pin")}</span><span><b>${o.city}</b><span>${o.note}</span></span><em>${o.state}</em></button>`).join("")}</div></div>
</div></section>`,
});

/* ---- enquiry ---- */
// The enquiry form on a page of its own: where "Start an enquiry", "Request
// pricing" and the quote list lead from every other page.
add({
  file: "enquire.html",
  title: "Start an enquiry | EDS",
  description: "Ask EDS about monitoring, product pricing, equipment hire, service and calibration, or EDS FlowSense. Your enquiry goes straight to our team.",
  current: "enquire",
  body: (r) => `
${pageHero(r, { compact: true, crumbs: [["Contact", "contact.html"], ["Start an enquiry"]], title: "Tell us what you need.", lede: "Monitoring, pricing, hire, service or a question about FlowSense. A real person from our team will come back to you." })}
<section class="section alt enquire-section"><div class="wrap enquire-grid">
  ${enquiryForm(r, "")}
  <aside class="enquire-aside">
    <div class="aside-card brand" data-reveal="right">
      <h2>Prefer to talk?</h2>
      <a class="hero-call" href="${site.phoneHref}">${icon("phone")}<span><small>Call from anywhere in Australia</small><b>${site.phone}</b></span></a>
      <p>${site.hours}.</p>
      ${openStatus()}
    </div>
    <div class="aside-card" data-reveal="right" style="--i:1">
      <h2>Head office</h2>
      <address>${site.address.join("<br>")}</address>
      <a class="link-arrow" href="${r}contact.html">All contact details ${icon("arrow-right")}</a>
    </div>
  </aside>
</div></section>`,
});

/* ---- not found ---- */
add({
  file: "404.html",
  title: "Page not found | EDS",
  description: "This page could not be found.",
  current: "",
  body: (r) => `
${pageHero(r, { crumbs: [["Page not found"]], iconName: "waves", eyebrow: "Error 404", title: "This pipe leads nowhere.", lede: "The page you were looking for has moved or no longer exists. Search for it, or try one of these instead.", actions: `<button class="btn btn-primary btn-lg" type="button" data-search-open>${icon("search")} Search the site</button><a class="btn btn-ghost btn-lg" href="${r}index.html">Home</a><a class="btn btn-ghost btn-lg" href="${r}services/index.html">Services</a><a class="btn btn-ghost btn-lg" href="${r}products/index.html">Products</a><a class="btn btn-ghost btn-lg" href="${r}contact.html">Contact</a>` })}`,
});

/* ---- privacy ---- */
// content/privacy.txt, one paragraph a line: the first line is the page title
// and the second its lede. A line that starts "1. " (and so on) is a section
// heading, a line that starts "### " a sub-heading, a run of lines that start
// "- " is a list, and [words](url) is a link. Email addresses and 1300 numbers
// become links, and the domain never breaks at its hyphens.
const privacy = (await readFile(path.join(ROOT, "content/privacy.txt"), "utf8")).split("\n").map((l) => l.trim()).filter(Boolean);
const legalLine = (l) => esc(l)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, words, href) => `<a href="${href}" rel="noopener">${words}</a>`)
  .replace(/\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g, (m) => `<a class="nw" href="mailto:${m}">${m}</a>`)
  .replace(/\b1[38]00 \d{3} \d{3}\b/g, (m) => `<a class="nw" href="tel:${m.replace(/ /g, "")}">${m}</a>`)
  .replace(/(?<![@\w.\/-])((?:www\.)?e-d-s\.com\.au|DB-IP)(?![\w-])/g, '<span class="nw">$1</span>');
const legalHeading = (l) => /^\d+\.\s/.test(l) && l.length < 90;
const legalHtml = (lines) => {
  const out = [];
  let list = null;
  for (const l of lines) {
    if (l.startsWith("- ")) {
      if (!list) out.push((list = []));
      list.push(`  <li>${legalLine(l.slice(2))}</li>`);
      continue;
    }
    list = null;
    if (l.startsWith("### ")) { out.push(`<h3>${esc(l.slice(4))}</h3>`); continue; }
    out.push(legalHeading(l) ? `<h2 id="${slugify(l.replace(/^\d+\.\s/, ""))}">${esc(l)}</h2>` : `<p>${legalLine(l)}</p>`);
  }
  return out.map((x) => (Array.isArray(x) ? `<ul>\n${x.join("\n")}\n</ul>` : x)).join("\n");
};
// The numbered sections as a jump list that stays beside the text (from
// 981 px), and the date the policy gives itself (in section 10) under the title.
const privacySections = privacy.slice(2).filter(legalHeading).map((l) => { const t = l.replace(/^\d+\.\s/, ""); return [slugify(t), t]; });
const privacyDate = privacy.join(" ").match(/dated (\d{1,2} \w+ \d{4})/)?.[1];
add({
  file: "privacy.html",
  title: "Privacy policy | EDS",
  description: "What the EDS website collects when you visit or get in touch, why, who sees it, and how to ask us about it.",
  current: "",
  body: (r) => `
${pageHero(r, { crumbs: [["Privacy policy"]], title: privacy[0], lede: privacy[1], after: privacyDate ? `<p class="note legal-date" data-reveal style="--i:2">Last updated ${privacyDate}</p>` : "" })}
<section class="section"><div class="wrap legal-wrap">${heroToc(privacySections)}<div class="legal">
  ${legalHtml(privacy.slice(2))}
</div></div></section>`,
});

/* ------------------------------------------------------------------ */
/* search index                                                        */
/* ------------------------------------------------------------------ */
// Everything the search palette (search.js) can find, grouped by `g`. Links
// are relative to the site root, and search.js adds each page's way back to
// it. `b` is extra text to match on that is never shown; `x` marks links that
// leave the site and `d` the documents: a PDF opens in a new tab, anything
// else downloads.
function searchIndex() {
  const items = [];
  const text = (...parts) => parts.flat(Infinity).filter(Boolean).join(" ");
  const blockText = (blocks = []) => blocks.map((b) => [b.heading, b.lede, b.items || [], b.list || [], (b.products || []).map((p) => [p.name, p.maker, p.text]), b.table?.rows || [], b.faq || []]);
  const plain = plainPath;
  const put = (g, t, s, h, more = {}) => items.push({ g, t, s, h, ...more });

  for (const s of C.services) put("Services", s.title, s.summary, `services/${s.slug}.html`, { i: s.icon, b: text(s.short, C.serviceGroups.find((g) => g.id === s.group)?.title, s.intro, blockText(s.blocks), s.compare?.rows || []) });
  for (const s of C.solutions) put("Solutions", s.title, s.summary, `solutions/${s.slug}.html`, { i: s.icon, b: text(s.intro, blockText(s.blocks)) });
  put("Products", "LIDoTT Alarm", `Detectronic · ${C.lidott.lede}`, "products/lidott-alarm.html", { img: plain(C.lidott.image), b: text("level radar alarm", C.lidott.description, C.lidott.sections, C.lidott.specs) });
  put("Products", "Alarm2", `Detectronic · ${C.alarm2.tag}`, "products/alarm2.html", { img: plain(C.alarm2.image), b: text("radar level alarm LoRaWAN 4G", C.alarm2.description, C.alarm2.sections, C.alarm2.highlights.map(([, t, d]) => [t, d]), C.alarm2.specs) });
  for (const pg of C.productPages) put("Products", pg.name, `EDS · ${pg.tag}`, `products/${pg.slug}.html`, { img: plain(pg.image), b: text(pg.lede, pg.intro, pg.features, [pg.modes, pg.why, pg.accuracy, pg.upkeep, pg.install, pg.tough, pg.system].map((x) => x && [x.heading, x.lede, x.items]), pg.specs.map(([g, rows]) => [g, rows])) });
  for (const p of products) {
    if (p.href) continue; // has a page of its own, listed above
    put("Products", p.name, `${p.brand.name} · ${p.note || p.range || typeOf(p.type).label}`, `products/${p.brand.slug}.html#${p.id}`, { img: plain(p.image), b: text(typeOf(p.type).label, p.group) });
  }
  for (const b of C.brands) put("Product ranges", b.title, b.tag, `products/${b.slug}.html`, { i: b.icon, b: text(b.name, b.summary, b.intro, blockText(b.blocks), b.groups.map((g) => g.name)) });
  put("Pages", "Instrument finder", `All ${products.length} instruments, filtered by type or searched by name.`, "products/index.html#finder", { i: "package-search", b: "products catalogue range brands" });
  put("Pages", "EDS FlowSense", "Sewer network intelligence: flow analytics and engineering insight.", "flowsense.html", { i: "waves", b: text(C.flowsense.lede, C.flowsense.tour.flatMap((t) => [[t.heading, t.lede], ...t.points]), [[C.flowsense.psm.heading, C.flowsense.psm.lede], ...C.flowsense.psm.points], C.flowsense.apart.items, C.flowsense.standards.items.map(([, t, d]) => [t, d]), C.flowsense.faq) });
  put("Pages", "About EDS", "Australian owned and operated since 1991.", "about.html", { i: "building-2", b: text(C.about.intro, C.about.mission, C.about.approach.items.map(([, t, d]) => [t, d]), C.about.timeline, "history founders story") });
  put("Pages", "Resources", "White papers, downloads and support.", "resources.html", { i: "book-open", b: "manuals software drivers datasheets passwords rma" });
  put("Pages", "Contact EDS", `${site.hours}. ${site.phone} from anywhere in Australia.`, "contact.html", { i: "messages-square", b: text(site.address, "enquiry form quote") });
  put("Pages", "All services", "Specialised services for water and wastewater networks.", "services/index.html", { i: "layout-grid" });
  put("Pages", "All solutions", "Monitoring applied to the problem in front of you.", "solutions/index.html", { i: "layout-grid" });
  put("Pages", "Home", site.tagline, "index.html", { i: "house" });
  put("Pages", "Privacy policy", "How EDS handles personal information.", "privacy.html", { i: "lock" });
  for (const p of C.papers) put("Documents", p.title, [p.kind || "White paper", p.date].filter((x, i, a) => x && a.indexOf(x) === i).join(" · "), plain(p.href), { i: "file-text", d: 1, b: p.text });
  for (const g of C.downloads) for (const [label, href] of g.items) if (!items.some((e) => e.h === plain(href))) put("Documents", label, g.group, plain(href), { i: g.icon, d: 1, b: g.note });
  for (const p of products) {
    for (const d of p.docs || []) {
      if (!items.some((e) => e.h === plain(d.href))) put("Documents", `${p.name}: ${d.label}`, `${p.brand.name} · ${docType(d.href)}`, plain(d.href), { i: "file-text", d: 1, b: text(p.brand.title, p.note) });
    }
  }
  put("Contact", `Call ${site.phone}`, `${site.hours}, from anywhere in Australia`, site.phoneHref, { i: "phone", b: "phone ring telephone call" });
  put("Contact", "Start an enquiry", "The enquiry form, with the topic of your choice", "enquire.html", { i: "message-square-text", b: "send quote pricing message" });
  put("Contact", "Sales enquiry", "Pricing, quotes and hire", contactHref("", { topic: "Product pricing" }), { i: "tag", b: "email sales quote" });
  put("Contact", "Service enquiry", "Equipment service and calibration", contactHref("", { topic: "Equipment service or calibration" }), { i: "wrench", b: "email service repair calibration" });
  for (const o of C.offices) put("Offices", `${o.city}, ${o.state}`, o.note, "contact.html#offices", { i: "map-pin", b: "office location address branch" });
  put("Sign in", "Sign in to EDS FlowSense", "edsflowsense.au", site.flowsenseUrl, { i: "log-in", x: 1, b: "login platform" });
  put("Sign in", "Remote data access", "DetectData, for Detectronic instruments", site.remoteDataUrl, { i: "globe", x: 1, b: "login detecdata" });

  const icons = {};
  for (const name of new Set(items.map((e) => e.i).filter(Boolean).concat("arrow-right", "arrow-up-right", "download", "search-x"))) { icon(name); icons[name] = iconCache.get(name); }
  const suggested = ["services/sewer-flow-monitoring.html", "services/inflow-infiltration-studies.html", "services/data-as-a-service.html", "products/lidott-alarm.html", "flowsense.html", "products/index.html#finder", site.phoneHref];
  return { items, icons, suggested };
}

/* ------------------------------------------------------------------ */
/* write                                                               */
/* ------------------------------------------------------------------ */
await rm(DIST, { recursive: true, force: true });
await mkdir(path.join(DIST, "assets/fonts"), { recursive: true });
// The stylesheet ships without its comments (about a fifth of its weight);
// they stay in src/css for whoever edits it. No string in it holds "/*".
await mkdir(path.join(DIST, "assets/css"), { recursive: true });
for (const f of readdirSync(path.join(ROOT, "src/css"))) await writeFile(path.join(DIST, "assets/css", f), (await readFile(path.join(ROOT, "src/css", f), "utf8")).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*\n+/g, "\n"));
await cp(path.join(ROOT, "src/js"), path.join(DIST, "assets/js"), { recursive: true });
await cp(path.join(ROOT, "src/assets/img"), path.join(DIST, "assets/img"), { recursive: true });
await cp(path.join(ROOT, "src/assets/docs"), path.join(DIST, "assets/docs"), { recursive: true });
// Saira for headings, cut to its semi-expanded width by tools/fonts.py;
// Aileron, which stands in for Helvetica Neue where a visitor has none; and
// Geist Mono for readouts.
await cp(path.join(ROOT, "src/assets/fonts"), path.join(DIST, "assets/fonts"), { recursive: true });
for (const f of ["aileron-latin-400-normal.woff2", "aileron-latin-600-normal.woff2", "aileron-latin-700-normal.woff2"]) {
  await cp(path.join(ROOT, `node_modules/@fontsource/aileron/files/${f}`), path.join(DIST, "assets/fonts", f));
}
await cp(path.join(ROOT, "node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2"), path.join(DIST, "assets/fonts/geist-mono-latin-wght-normal.woff2"));
// Google shows about 60 characters of a title and 160 of a description, and
// pages that share either are hard to tell apart in its results.
for (const [i, p] of pages.entries()) {
  if (p.file === "404.html") continue;
  if (p.title.length > 60) console.warn(`${p.file}: the title is ${p.title.length} characters, and Google shows about 60`);
  if (p.description.length > 160) console.warn(`${p.file}: the description is ${p.description.length} characters, and Google shows about 160`);
  for (const key of ["title", "description"]) {
    const twin = pages.slice(i + 1).find((q) => q[key] === p[key]);
    if (twin) console.warn(`${p.file} and ${twin.file} have the same ${key}`);
  }
}
// The sitemap dates each page by when its content last changed: its title,
// description, structured data and everything in <main> (so a change to the
// menus or footer does not count). PAGE_DATES names the dates file from the last publish,
// which the publish workflow takes from the gh-pages branch. A page that
// matches its fingerprint there keeps its date; any other page is dated
// today. The new dates go out as assets/page-dates.json for the next build.
const today = new Intl.DateTimeFormat("en-CA", { timeZone: site.openingHours.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
let lastDates = {};
if (process.env.PAGE_DATES && existsSync(process.env.PAGE_DATES)) {
  const text = readFileSync(process.env.PAGE_DATES, "utf8").trim();
  try {
    if (text) lastDates = JSON.parse(text);
  } catch {
    console.warn(`${process.env.PAGE_DATES} is not JSON, so every page is dated today`);
  }
}
const pageDates = {};
for (const p of pages) {
  const out = path.join(DIST, p.file);
  await mkdir(path.dirname(out), { recursive: true });
  const html = layout(p);
  await writeFile(out, html);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)].join("\n");
  const hash = createHash("sha1").update(`${p.title}\n${p.description}\n${ld}\n${html.match(/<main id="main">[\s\S]*<\/main>/)[0]}`).digest("hex").slice(0, 12);
  pageDates[p.file] = { hash, date: lastDates[p.file]?.hash === hash ? lastDates[p.file].date : today };
}
await writeFile(path.join(DIST, "assets/page-dates.json"), `${JSON.stringify(pageDates, null, 1)}\n`);
// Forwarding pages for the old site's addresses. GitHub Pages serves
// /hach-flow from hach-flow.html, so each sits at the root. It cannot send
// a real redirect, but Google takes an instant refresh as a permanent one and
// passes the old address's standing to the new page, so these carry no
// noindex (which would tell it to drop the address instead).
// A target may carry its own query (an enquiry topic); then that query is
// kept rather than the visitor's.
for (const [from, to] of Object.entries(C.oldPages)) {
  const file = to.split("?")[0];
  if (!pages.some((p) => p.file === file)) throw new Error(`oldPages: "${from}" points at missing page ${to}`);
  if (pages.some((p) => p.file === `${from}.html`)) throw new Error(`oldPages: "${from}" would overwrite a page`);
  await writeFile(
    path.join(DIST, `${from}.html`),
    `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<title>Page moved</title>
<link rel="canonical" href="${pageUrl(file)}">
<meta http-equiv="refresh" content="0; url=${esc(to)}">
<script>location.replace("${to}"${file === to ? " + location.search" : ""} + location.hash)</script>
</head>
<body><p>This page has moved to <a href="${esc(to)}">${pageUrl(file)}</a>.</p></body>
</html>
`
  );
}
// Documents at the old site's /s/ addresses.
for (const [from, to] of Object.entries(C.oldFiles)) {
  await mkdir(path.join(DIST, "s"), { recursive: true });
  await cp(path.join(ROOT, "src/assets/docs", to), path.join(DIST, "s", from)).catch(() => {
    throw new Error(`oldFiles: "${from}" points at missing document ${to}`);
  });
}
const searchData = JSON.stringify(searchIndex());
// The index is written straight to disk, not through layout(), so a path
// left as "@root/" here would 404 from the search palette.
if (searchData.includes("@root/")) throw new Error("search index has unresolved @root/ paths");
await writeFile(path.join(DIST, "assets/js/search-index.js"), `// Generated by build.mjs from src/data/content.mjs. Do not edit.\nwindow.EDS_SEARCH = ${searchData};\n`);
await writeFile(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .filter((p) => p.file !== "404.html")
    .map((p) => `  <url><loc>${pageUrl(p.file)}</loc><lastmod>${pageDates[p.file].date}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`
);
await writeFile(path.join(DIST, "robots.txt"), process.env.PREVIEW ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
// llms.txt (https://llmstxt.org): the site in brief, for the AI assistants
// and answer engines that read it, with every page and its description.
const pageOf = (file) => pages.find((p) => p.file === file);
const llmsLink = (file, name) => `- [${name}](${pageUrl(file)}): ${pageOf(file).description}`;
await writeFile(
  path.join(DIST, "llms.txt"),
  `# ${site.name} (${site.short})

> ${C.homeLede}

${site.tagline} Offices: ${C.offices.map((o) => `${o.city} ${o.state}${o.head ? " (head office)" : ""}`).join(", ")}. Phone ${site.phone}, email ${site.email}. Enquiries: ${pageUrl("enquire.html")}

## Services

${C.services.map((s) => llmsLink(`services/${s.slug}.html`, s.title)).join("\n")}

## Solutions

${C.solutions.map((s) => llmsLink(`solutions/${s.slug}.html`, s.title)).join("\n")}

## Products

${llmsLink("products/index.html", "All instruments")}
${C.brands.map((b) => llmsLink(`products/${b.slug}.html`, b.title)).join("\n")}
${C.productPages.map((pg) => llmsLink(`products/${pg.slug}.html`, pg.name)).join("\n")}

## About EDS

${[["flowsense.html", "EDS FlowSense"], ["about.html", "About EDS"], ["resources.html", "Resources: white papers, downloads and manuals"], ["contact.html", "Contact EDS"]].map(([f, n]) => llmsLink(f, n)).join("\n")}
`
);
// The IndexNow key, which shows the search engines that the pings from the
// publish workflow (tools/indexnow.mjs) come from the site's owner.
if (!process.env.PREVIEW) await writeFile(path.join(DIST, `${site.indexNowKey}.txt`), site.indexNowKey);
console.log(`Built ${pages.length} pages into dist/`);
