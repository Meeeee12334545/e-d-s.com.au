// Static site generator for the EDS website. No framework: content comes from
// src/data/content.mjs, pages are template strings, output goes to dist/.
//   npm run build   -> writes dist/
//   npm run dev     -> builds, then runs the site server (server/) on http://localhost:4173
import { mkdir, readFile, writeFile, rm, cp } from "node:fs/promises";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
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

// Links to the contact form with the topic (and product, and way of working)
// already chosen. contact.html reads ?topic=, ?product= and ?mode= in site.js.
const contactHref = (r, { topic, product, mode } = {}) => {
  const q = new URLSearchParams();
  if (topic) q.set("topic", topic);
  if (product) q.set("product", product);
  if (mode) q.set("mode", mode);
  const qs = q.toString();
  return `${r}contact.html${qs ? `?${esc(qs)}` : ""}`;
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
// is for a drawing, shown whole and in its own colours.
const photoFigure = (f, { i, sizes } = {}) => `
<figure class="photo${f.plain ? " photo-plain" : ""}" data-reveal${i != null ? ` style="--i:${i}"` : ""}>
  <div class="photo-frame"${f.pos ? ` style="--pos:${esc(f.pos)}"` : ""}>${photo(f.photo, f.alt, { sizes })}</div>
  ${f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : ""}
</figure>`;
// Two photographs side by side.
const figureRow = (figs) => `<div class="photo-row">${figs.map((f, i) => photoFigure(f, { i, sizes: "(max-width: 700px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 28px), 362px" })).join("")}</div>`;
// What a service or solution page shows after its introduction: one
// photograph (`figure`) or a pair (`figures`).
const figuresHtml = (s) => (s.figures ? figureRow(s.figures) : s.figure ? photoFigure(s.figure) : "");
// A product shot or drawing in the sidebar: { src, alt, caption, w, h }.
const asideFigure = (s) => (s.asideFigure ? `<figure class="aside-card aside-figure" data-reveal="right"><img src="${s.asideFigure.src}" alt="${esc(s.asideFigure.alt)}" width="${s.asideFigure.w}" height="${s.asideFigure.h}" loading="lazy"><figcaption>${esc(s.asideFigure.caption)}</figcaption></figure>` : "");

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
  const pItems = [...C.brands.map((b) => ({ href: `products/${b.slug}.html`, icon: b.icon, label: b.name })), ...C.productPages.map((pg) => ({ href: `products/${pg.slug}.html`, icon: pg.icon, label: pg.name })), { href: "products/lidott-alarm.html", icon: "bell", label: "LIDoTT Alarm" }, { href: "products/alarm2.html", icon: "bell-ring", label: "Alarm2" }];
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
      <a class="logo" href="${r}index.html" aria-label="EDS home"><img src="${site.logoWhite}" alt="EDS, Environmental Data Services" width="182" height="48"></a>
      <nav class="nav" aria-label="Main">
        ${mega("Services", "services", { groups: sGroups }, { href: "services/index.html", label: "All services" })}
        ${mega("Solutions", "solutions", { items: oItems }, { href: "solutions/index.html", label: "All solutions" })}
        ${mega("Products", "products", { items: pItems }, { href: "products/index.html", label: "All products" }, true)}
        ${link("flowsense.html", "FlowSense", "flowsense")}
        ${link("about.html", "About", "about")}
        ${link("resources.html", "Resources", "resources")}
      </nav>
      <div class="header-cta">
        <button class="header-search" type="button" data-search-open aria-label="Search the site" aria-keyshortcuts="Control+K Meta+K /">${icon("search")}<kbd data-kbd>Ctrl K</kbd></button>
        <a class="header-phone" href="${site.phoneHref}" aria-label="Call EDS on ${site.phone}">${icon("phone")}<span>${site.phone}</span></a>
        <a class="header-quote" href="${r}contact.html#enquiry" data-quote-link hidden>${icon("clipboard-list")}<span class="sr-only">Quote list, </span><b data-quote-count>0</b><span class="sr-only"> items</span></a>
        <a class="btn btn-primary" href="${r}contact.html">Contact us</a>
      </div>
      <button class="burger" aria-label="Open menu" aria-expanded="false" data-track-label="Menu">${icon("menu", false)}</button>
    </div>
  </header>
  <div class="drawer" aria-label="Menu">
    <div class="drawer-scrim"></div>
    <div class="drawer-panel">
      <div class="drawer-head">
        <a class="logo" href="${r}index.html"><img src="${site.logoWhite}" alt="EDS" width="182" height="48"></a>
        <button class="burger drawer-close" style="display:inline-flex" aria-label="Close menu">${icon("x", false)}</button>
      </div>
      <button class="drawer-search" type="button" data-search-open>${icon("search", false)}<span>Search products, services, documents</span></button>
      ${dGroup("Services", { groups: sGroups }, "services/index.html")}
      ${dGroup("Solutions", { items: oItems }, "solutions/index.html")}
      ${dGroup("Products", { items: pItems }, "products/index.html")}
      <a class="drawer-link" href="${r}flowsense.html">FlowSense</a>
      <a class="drawer-link" href="${r}about.html">About</a>
      <a class="drawer-link" href="${r}resources.html">Resources</a>
      <a class="drawer-link" href="${r}contact.html#enquiry" data-quote-link hidden>Your quote list <b class="count" data-quote-count>0</b></a>
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
          <a class="logo" href="${r}index.html"><img src="${site.logoWhite}" alt="EDS, Environmental Data Services" width="106" height="28" loading="lazy"></a>
          <p>${site.tagline}</p>
          <div class="footer-contact">
            <a href="${site.phoneHref}">${icon("phone")}${site.phone}</a>
            <span>${icon("mail", false)}${site.email}</span>
            <a href="${r}contact.html#enquiry">${icon("send")}Send an enquiry</a>
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
          ${openStatus()}
          <form class="signup" ${formSend} data-subject="Register for EDS updates" data-track="Updates sign-up">
            <label for="f-email">Register for updates on projects, equipment and servicing</label>
            <input id="f-email" name="Email" type="email" placeholder="Your email" autocomplete="email" required>
            ${botcheck}
            <button class="btn btn-primary" type="submit" aria-label="Register for updates">${icon("send")}</button>
            <p class="signup-done" role="status" data-done="sent" hidden>${icon("check", false)} Thanks, you are registered for EDS updates.</p>
            <p class="signup-done form-error" role="alert" data-done="error" hidden>${icon("circle-alert", false)} That did not go through. Please try again in a moment.</p>
          </form>
        </div>
      </div>
      <div class="footer-base">
        <span>© ${year} ${site.legal}. All rights reserved. <a href="${r}privacy.html" style="text-decoration:underline">Privacy policy</a></span>
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
  <div class="search-foot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
</dialog>`;

// Call and enquire, always to hand on a phone (shown below 700px by site.css).
const actionBar = (r, current) => `
<nav class="actionbar" aria-label="Quick actions">
  <a href="${site.phoneHref}" data-open-dot>${icon("phone", false)}<span>Call</span></a>
  <button type="button" data-search-open>${icon("search", false)}<span>Search</span></button>
  <a class="primary" href="${current === "contact" ? "" : `${r}contact.html`}#enquiry">${icon("send", false)}<span>Enquire</span><b class="count" data-quote-count hidden>0</b></a>
</nav>`;

// Structured data for search engines: the organisation on the home and
// contact pages, and a breadcrumb trail on every page that has one.
function jsonLd(file, crumbs) {
  const blocks = [];
  if (file === "index.html" || file === "contact.html") {
    const [street, locality] = site.address;
    const [, suburb, state, postcode] = locality.match(/^(.*) ([A-Z]{2,3}) (\d{4})$/) || [];
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.name,
      alternateName: site.short,
      legalName: site.legal,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/assets/img/apple-touch-icon.png`,
      email: site.email,
      telephone: site.phone,
      foundingDate: String(site.founded),
      address: { "@type": "PostalAddress", streetAddress: street, addressLocality: suburb, addressRegion: state, postalCode: postcode, addressCountry: "AU" },
      contactPoint: [
        { "@type": "ContactPoint", contactType: "customer service", telephone: site.phone, email: site.email, areaServed: "AU", availableLanguage: "en" },
        { "@type": "ContactPoint", contactType: "sales", email: site.sales, areaServed: "AU" },
        { "@type": "ContactPoint", contactType: "technical support", email: site.service, areaServed: "AU" },
      ],
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

function layout({ file, title, description, current, body, scripts = [] }) {
  const depth = file.split("/").length - 1;
  // The not-found page can be served at any depth, so it links from the root.
  const r = file === "404.html" ? "/" : "../".repeat(depth);
  heroCrumbs = null;
  const html = typeof body === "function" ? body(r) : body;
  const crumbs = heroCrumbs;
  const url = pageUrl(file);
  const out = `<!doctype html>
<html lang="en-AU" data-root="${r}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#041513">${process.env.PREVIEW ? '\n<meta name="robots" content="noindex, nofollow">' : ""}${file === "404.html" ? "" : `\n<link rel="canonical" href="${url}">`}
<meta property="og:site_name" content="EDS, Environmental Data Services">
<meta property="og:locale" content="en_AU">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}/assets/img/og-card.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="EDS. Every drop, measured. Water, wastewater and environmental monitoring since 1991.">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="${r}assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="${r}assets/img/apple-touch-icon.png">
<link rel="preload" href="${r}assets/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<script>document.documentElement.classList.add("js")</script>
<link rel="stylesheet" href="${asset(r, "css/site.css")}">
${jsonLd(file, crumbs)}
</head>
<body id="top">
${header(r, current)}
<main id="main">
${html}
</main>
${footer(r)}
${actionBar(r, current)}
${searchDialog()}
<script src="${asset(r, "js/site.js")}" defer></script>
<script src="${asset(r, "js/search.js")}" defer></script>
<script src="${asset(r, "js/quote.js")}" defer></script>
${scripts.map((s) => `<script src="${asset(r, `js/${s}`)}" defer></script>`).join("\n")}${tracker(r, file)}
</body>
</html>
`.replaceAll("@root/", r);
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
const pageHero = (r, { crumbs = [], iconName, eyebrow, title, lede, actions = "", visual = "" }) => {
  heroCrumbs = crumbs;
  const copy = `
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${r}index.html">Home</a>${crumbs.map(([label, href]) => `${icon("chevron-down", false)}${href ? `<a href="${r}${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}`).join("")}</nav>
    ${iconName ? `<div class="hero-icon holder" data-reveal="scale">${icon(iconName)}</div>` : ""}
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
    <h1 class="h-lg" data-reveal>${esc(title)}</h1>
    ${lede ? `<p class="lede" data-reveal style="--i:1">${esc(lede)}</p>` : ""}
    ${actions ? `<div class="hero-actions" data-reveal style="--i:2">${actions}</div>` : ""}`;
  return `
<section class="page-hero dark${visual ? " has-visual" : ""}">
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
      <a class="btn btn-primary btn-lg" data-magnetic href="${contactHref(r, { topic, product })}">Contact EDS ${icon("arrow-right")}</a>
      <a class="btn btn-ghost btn-lg" href="${site.phoneHref}">${icon("phone")} ${site.phone}</a>
    </div>
  </div>
</section>`;

const cardLink = (r, { href, iconName, title, text, n, tilt = true, cls = "", media = "" }) => `
<a class="card${tilt ? " tilt" : ""}${cls ? ` ${cls}` : ""}" href="${r}${href}" data-reveal style="--i:${n % 4}">
  <span class="card-icon">${icon(iconName)}</span>
  <h3>${esc(title)}</h3>
  <p>${esc(text)}</p>
  <span class="link-arrow">Learn more ${icon("arrow-right")}</span>${media}
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
          <div class="lab-status">
            <span class="lab-chip" id="lab-raining" role="status">${icon("cloud-rain", false)}Raining <b id="lab-rain-out">0</b>&nbsp;mm/h</span>
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
        <p class="lab-hint">${icon("mouse-pointer-2", false)}Point at the chart to read values<span class="lab-kbd">, or focus it and press <kbd>←</kbd><kbd>→</kbd></span></p>
        <div class="lab-controls">
          <div class="lab-actions">
            <button class="btn btn-primary" id="lab-storm" data-magnetic>${icon("cloud-rain")} Send a storm</button>
            <button class="lab-pause" id="lab-pause" type="button" aria-pressed="false" aria-label="Pause the simulation"><span class="when-running">${icon("pause", false)}</span><span class="when-paused" hidden>${icon("play", false)}</span></button>
          </div>
          <label class="range"><span>Storm size <output id="lab-size-out" for="lab-size"></output></span><input id="lab-size" type="range" min="5" max="50" step="1" value="26"><small>Rain depth of the next storm, over two hours.</small></label>
          <label class="range"><span>Network condition <output id="lab-leak-out" for="lab-leak"></output></span><input id="lab-leak" type="range" min="0.15" max="1.6" step="0.05" value="1"><small>How much of the rain finds its way into the sewer.</small></label>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title">${icon("gauge", false)} At the flow meter</div></div>
        <svg id="lab-pipe" viewBox="0 0 200 200" role="img" aria-label="Cross-section of a sewer pipe showing the water depth against the high and high-high alarm levels, with the area-velocity meter at the bottom">
          <defs>
            <clipPath id="lab-clip"><circle cx="100" cy="100" r="80"/></clipPath>
            <linearGradient id="lab-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4a6" stop-opacity=".85"/><stop offset="1" stop-color="#0d7c72" stop-opacity=".9"/></linearGradient>
          </defs>
          <circle cx="100" cy="100" r="87" fill="#0b302d" stroke="rgba(255,255,255,.22)" stroke-width="2"/>
          <g clip-path="url(#lab-clip)">
            <rect width="200" height="200" fill="#020c0b"/>
            <g id="lab-water-g">
              <rect x="0" y="20" width="200" height="160" fill="url(#lab-wg)"/>
              <line x1="0" x2="200" y1="20" y2="20" stroke="#dbf0ec" stroke-width="2"/>
            </g>
            <g id="lab-arrows" class="lab-arrows"><line x1="20" y1="92" x2="180" y2="92"/><line x1="20" y1="100" x2="180" y2="100"/><line x1="20" y1="108" x2="180" y2="108"/></g>
            <g stroke-dasharray="4 4" stroke-width="1.2">
              <line x1="0" x2="200" y1="84" y2="84" stroke="rgba(245,158,11,.75)"/>
              <line x1="0" x2="200" y1="44" y2="44" stroke="rgba(239,68,68,.8)"/>
            </g>
            <text x="176" y="80" text-anchor="end" fill="rgba(245,158,11,.95)">High</text>
            <text x="140" y="40" text-anchor="end" fill="rgba(239,68,68,.95)">High-high</text>
            <line id="lab-beam" x1="100" y1="168" x2="100" y2="121"/>
            <rect x="89" y="167" width="22" height="11" rx="2.5" fill="#5fb4a6" stroke="#04201d" stroke-width="1.5"/>
          </g>
        </svg>
        <p class="lab-pipe-cap">600 mm pipe. Area-velocity meter at the invert; dashed lines are the alarm levels.</p>
        <div class="readouts">
          <div class="readout"><b id="lab-q">0</b><span>Flow L/s</span></div>
          <div class="readout"><b id="lab-d">0</b><span>Depth mm</span></div>
          <div class="readout"><b id="lab-v">0</b><span>Velocity m/s</span></div>
          <div class="readout readout-ii"><b id="lab-dq">+0.0</b><span>I&amp;I L/s</span></div>
        </div>
        <div class="state" id="lab-state" data-level="0" aria-live="polite"><i></i><div><b>Normal</b><small>Flow is tracking the dry weather pattern.</small></div></div>
        <div class="state" style="margin-top:10px">${icon("droplets", false)}<div><b><span id="lab-extra">0</span> kL above dry weather flow</b><small>Extra volume in the last 30 hours: the cost of I&amp;I.</small></div></div>
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
      <text id="eas-num" x="200" y="250" text-anchor="middle" fill="#fff" font-size="40" font-weight="650" font-family="Geist, sans-serif">930</text>
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
    <g font-size="10" font-family="Geist, sans-serif" fill="#26313f"><rect x="330" y="186" width="136" height="72" rx="8" fill="#fff" stroke="#dfe5ec"/><text x="342" y="204" font-weight="600">I/I severity</text>
    <rect x="342" y="212" width="14" height="6" rx="3" fill="#3b82f6"/><text x="362" y="218">Low</text><rect x="402" y="212" width="14" height="6" rx="3" fill="#eab308"/><text x="422" y="218">Moderate</text>
    <rect x="342" y="232" width="14" height="6" rx="3" fill="#f97316"/><text x="362" y="238">High</text><rect x="402" y="232" width="14" height="6" rx="3" fill="#ef4444"/><text x="422" y="238">Severe</text></g></svg>`;
  const blockage = `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet">
    <g stroke="#eef2f6"><path d="M40 50H460M40 100H460M40 150H460M40 200H460"/></g>
    <path class="fs-draw" pathLength="100" d="M40 190 C90 186 120 188 160 180 S230 168 270 150 S350 110 390 86 S440 62 460 54" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
    <path class="fs-draw" pathLength="100" d="M40 120 C80 114 110 126 150 120 S220 114 260 122 S340 116 380 121 S440 118 460 120" fill="none" stroke="#0d7c72" stroke-width="3" stroke-linecap="round"/>
    <g font-size="11" font-family="Geist, sans-serif"><text x="46" y="210" fill="#b91c1c" font-weight="600">Depth, creeping upward</text><text x="46" y="108" fill="#095f57" font-weight="600">Flow, unchanged</text>
    <rect x="296" y="22" width="164" height="26" rx="13" fill="#fef2f2" stroke="#fecaca"/><text x="310" y="39" fill="#b91c1c" font-weight="600">Likely obstruction building</text></g></svg>`;
  const psm = `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet">
    <rect x="150" y="30" width="180" height="210" rx="6" fill="#f4f7fa" stroke="#c8d2dc" stroke-width="2"/>
    <rect class="fs-well" x="152" y="130" width="176" height="108" fill="#5cc2b6" opacity=".85"/>
    <g font-size="10" font-family="Geist, sans-serif" stroke-dasharray="5 4">
      <path d="M130 60H350" stroke="#dc2626"/><path d="M130 92H350" stroke="#d97706"/><path d="M130 130H350" stroke="#0d7c72"/><path d="M130 200H350" stroke="#5b6878"/></g>
    <g font-size="10.5" font-family="Geist, sans-serif" fill="#26313f"><text x="358" y="63">Overflow</text><text x="358" y="95">Surcharge</text><text x="358" y="133">Pump start</text><text x="358" y="203">Pump stop</text></g>
    <g transform="translate(46 118) scale(2.4)" fill="none" stroke="#0c5f59" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g class="fs-fan">${iconCache.get("fan") || ""}</g></g>
    <text x="34" y="200" font-size="10.5" font-family="Geist, sans-serif" fill="#26313f" font-weight="600">Pump 1 running</text></svg>`;
  const alarms = `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet">
    ${[["#dc2626", "#fef2f2", "High-high level", "Site 07 · 2 min ago · SMS sent to duty officer", 26], ["#d97706", "#fffbeb", "Blockage Watch: depth drifting", "Site 14 · dry weather only · ranked 1 of 38", 104], ["#16a34a", "#f0fdf4", "Returned to normal", "Site 22 · acknowledged by the duty officer", 182]]
      .map(([c, bg, t, s, y], i) => `<g class="fs-toast" style="--i:${i}"><rect x="30" y="${y}" width="420" height="62" rx="12" fill="${bg}" stroke="${c}" stroke-opacity=".35"/><circle cx="60" cy="${y + 31}" r="9" fill="${c}"/><text x="84" y="${y + 27}" font-size="13" font-weight="650" font-family="Geist, sans-serif" fill="#05090f">${t}</text><text x="84" y="${y + 45}" font-size="10.5" font-family="Geist, sans-serif" fill="#5b6878">${s}</text></g>`).join("")}</svg>`;
  const views = [["I/I heat map", "Severity by pipe", heat], ["Blockage Watch", "Dry days only", blockage], ["Pump Station Manager", "Wet well, to scale", psm], ["Alarms", "Sent to people, not addresses", alarms]];
  return `
  <div class="fs-screen" data-reveal="right">
    <div class="fs-chrome"><img src="${site.logoWhite}" alt=""><span>FlowSense</span><span class="dot">Live</span></div>
    ${views.map(([t, s, svg], i) => `<div class="fs-view${i === 0 ? " active" : ""}"><h4>${t}<small>${s}</small></h4>${svg}</div>`).join("")}
    <span class="fs-caption">Illustration</span>
  </div>`;
}

// The home hero's flow meter reporting in. site.js draws the last day of
// readings and moves it on every few seconds. Labelled as an illustration,
// like the flow lab and the FlowSense screens.
const liveCard = () => `
<aside class="live" aria-label="Illustration of a flow meter reporting live" data-reveal="right" style="--i:5">
  <div class="live-head"><span class="live-site">${icon("radio-tower", false)} Site 07 · Trunk sewer</span><span class="live-tag">Live</span></div>
  <div class="live-value"><b data-live="q">41.8</b><span>L/s</span></div>
  <p class="live-label">Flow over the last 24 hours</p>
  <svg class="live-chart" viewBox="0 0 300 86" aria-hidden="true">
    <defs><linearGradient id="live-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4a6" stop-opacity=".32"/><stop offset="1" stop-color="#5fb4a6" stop-opacity="0"/></linearGradient></defs>
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
const quoteBtn = (item, cls = "") => `<button class="quote-add${cls ? ` ${cls}` : ""}" type="button" data-quote="${esc(JSON.stringify(item))}">${icon("list-plus", false)}${icon("check", false)}<span>Add to quote</span></button>`;

// Buy, hire or Data as a Service: one card each, with the enquiry form
// opened on the right topic and way of working.
const waysSection = (r, { cls = "" } = {}) => `
<section class="section${cls ? ` ${cls}` : ""}" id="ways"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Ways to work with EDS</p><h2 class="h-lg" data-reveal>${esc(C.ways.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(C.ways.lede)}</p></div>
  <div class="ways">
    ${C.ways.items.map((w, n) => `
    <article class="way${w.mode === "managed" ? " way-feature" : ""}" data-reveal style="--i:${n}">
      <div class="way-head"><span class="card-icon">${icon(w.icon)}</span><div><h3>${esc(w.title)}</h3><p class="way-line">${esc(w.line)}</p></div></div>
      <p>${esc(w.text)}</p>
      <ul class="way-points">${w.points.map((pt) => `<li>${icon("check", false)}<span>${esc(pt)}</span></li>`).join("")}</ul>
      <div class="way-actions">
        <a class="btn ${w.mode === "managed" ? "btn-primary" : "btn-brand"}" href="${contactHref(r, { topic: w.topic, mode: w.mode })}">${esc(w.cta)} ${icon("arrow-right")}</a>
        <a class="link-arrow" href="${r}${w.link[0]}">${esc(w.link[1])}</a>
      </div>
    </article>`).join("")}
  </div>
</div></section>`;

// Outcomes from EDS projects as stat cards.
const resultCards = (list) => `
  <div class="results">
    ${list.map((x, n) => `
    <figure class="result" data-reveal style="--i:${n}">
      <b class="result-stat">${esc(x.stat)}</b>
      <span class="result-label">${esc(x.label)}</span>
      <p>${esc(x.text)}</p>
      <figcaption>${icon("map-pin", false)}${esc(x.who)}</figcaption>
    </figure>`).join("")}
  </div>`;
// Two at most beside a service page's sidebar, so the pair fills the column.
const resultsFor = (slug) => C.results.filter((x) => x.services.includes(slug)).slice(0, 2);

// How a monitoring program runs, as four numbered steps.
const processSection = () => `
<section class="section alt" id="how-it-runs"><div class="wrap">
  <div class="section-head"><p class="eyebrow">How a program runs</p><h2 class="h-lg" data-reveal>From the first call to data you can act on.</h2></div>
  <ol class="process">
    ${C.programSteps.map(([ic, t, d], n) => `<li class="holder" data-reveal style="--i:${n}"><span class="process-n">${String(n + 1).padStart(2, "0")}</span><span class="card-icon">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join("")}
  </ol>
</div></section>`;

// "PDF", "ZIP": shown in the Documents panel so people know what they will get.
const docType = (href) => href.split(".").pop().toUpperCase();
const prodDocs = (p) => `<ul class="prod-docs">${p.docs.map((d) => `<li><a href="${d.href}" rel="noopener">${icon("download")}<span>${esc(d.label)}</span></a></li>`).join("")}</ul>`;

// One product. The whole card opens the quick view (products.js), and the
// details the quick view shows travel with the card as JSON.
const productCard = (r, p, { id = p.id, showBrand = false, n = 0 } = {}) => {
  const t = typeOf(p.type);
  // The product's own documents, then the ones that cover its whole brand.
  const docs = [...(p.docs || []), ...(p.brand.docs || [])];
  const data = { name: p.name, note: p.note || "", image: p.image, brand: p.brand.name, brandHref: `${r}products/${p.brand.slug}.html`, range: p.range, type: t.label, page: p.href ? `${r}${p.href}` : "", docs, quote: quoteItem(p) };
  return `
<article class="card prod" id="${id}" data-type="${p.type}" data-search="${esc([p.name, p.note, p.brand.name, p.brand.title, p.brand.tag, p.group, t.label].join(" ").toLowerCase())}" data-product="${esc(JSON.stringify(data))}" data-reveal style="--i:${n % 5}">
  <div class="brand-shot"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy"></div>
  <div class="prod-body">${showBrand ? `<span class="tag">${esc(p.brand.name)}</span>` : ""}<h3>${esc(p.name)}</h3>${p.note ? `<p>${esc(p.note)}</p>` : ""}<div class="prod-foot">${p.docs ? prodDocs(p) : ""}${quoteBtn(quoteItem(p), "sm")}</div></div>
  <button class="prod-open" type="button" aria-haspopup="dialog" aria-label="Quick view: ${esc(p.name)}${showBrand ? `, ${esc(p.brand.name)}` : ""}"><span>${icon("zoom-in", false)}Quick view</span></button>
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
  <div class="qv-shot"><img data-qv="image" alt=""></div>
  <div class="qv-body">
    <p class="tag" data-qv="brand"></p>
    <h2 id="qv-name" data-qv="name"></h2>
    <p class="qv-note" data-qv="note"></p>
    <dl class="qv-facts">
      <div><dt>Type</dt><dd data-qv="type"></dd></div>
      <div><dt>Range</dt><dd data-qv="range"></dd></div>
      <div><dt>Brand</dt><dd><a data-qv="brandLink"></a></dd></div>
    </dl>
    <div class="qv-actions">
      <a class="btn btn-brand btn-lg" data-qv="enquire">Request pricing ${icon("arrow-right")}</a>
      <button class="quote-add btn-lg" type="button" data-qv="quote">${icon("list-plus", false)}${icon("check", false)}<span>Add to quote</span></button>
    </div>
    <a class="qv-call" href="${site.phoneHref}">${icon("phone", false)} Or call ${site.phone}</a>
    <a class="link-arrow qv-page" data-qv="page" hidden>See how it works ${icon("arrow-right")}</a>
    <div class="qv-docs" data-qv="docs" hidden><h3>Documents</h3><ul class="aside-links"></ul></div>
    <p class="note">Sales, hire and service from EDS, Australia wide.</p>
  </div>
  <template data-qv="docIcon">${icon("download")}</template>
</dialog>`;

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
    <div class="hero-main">
      <div>
        <p class="eyebrow">Water · Wastewater · Trade waste · Environment</p>
        <h1 class="h-xl" aria-label="Every drop, measured.">${words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${i === 2 ? `<em>${w}</em>` : w}</span></span>`).join(" ")}</h1>
        <p class="lede" data-reveal style="--i:4">Environmental Data Services has been a trusted leader in advanced monitoring solutions and specialised services since 1991, delivering high quality instrumentation, technical support and field proven solutions across Australia.</p>
        <div class="hero-actions" data-reveal style="--i:5">
          <a class="btn btn-primary btn-lg" data-magnetic href="#city-explorer">Explore the city ${icon("arrow-right")}</a>
          <a class="btn btn-ghost btn-lg" href="${r}services/index.html">Our services</a>
        </div>
        <p class="hero-hint" data-reveal style="--i:6">${icon("mouse-pointer-click", false)} Move your pointer through the flow</p>
      </div>
      ${liveCard()}
    </div>
    <div class="stats">
      ${C.stats.map((s, i) => `<div class="stat" data-reveal style="--i:${i}"><div class="stat-value"><span data-count="${s.value}"${s.decimals ? ` data-decimals="${s.decimals}"` : ""}${s.plain ? ' data-plain="1" data-from="1950"' : ""}>${s.value}</span>${s.suffix ? `<small>${s.suffix}</small>` : ""}</div><div class="stat-label">${s.label}</div></div>`).join("")}
    </div>
  </div>
</section>

<section class="section dark city-section" id="city-explorer">
  <div class="wrap">
    <div class="section-head">
      <h2 class="h-lg" data-reveal>Where does EDS fit in your network?</h2>
      <p class="lede" data-reveal style="--i:1">Hover over a district to lift it out of the city and see the services and products EDS brings to it.</p>
    </div>
  </div>
  <div class="wrap wide">
    <div class="city-grid">
      <div class="city-stage" data-reveal="scale"><svg id="city" role="group" aria-label="Interactive map of a city. Each district shows the EDS services and products used there."></svg></div>
      <div class="city-tabs" role="tablist" aria-label="City districts">
        ${C.city.map((z, i) => `<button class="city-tab" role="tab" data-zone="${z.id}" aria-selected="${i === 0}">${icon(z.icon)}${z.name}</button>`).join("")}
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
      <h2 class="h-lg" data-reveal>Specialised services, delivered Australia wide.</h2>
      <a class="btn btn-outline" href="${r}services/index.html">All services ${icon("arrow-right")}</a>
    </div>
    <div class="grid bento">
      ${C.services.filter((s) => s.featured).map((s, n) => cardLink(r, {
        href: `services/${s.slug}.html`, iconName: s.icon, title: s.short || s.title, text: s.summary, n,
        // The first service leads with a photo of the meter EDS installs; the
        // third sits on the brand gradient, so the grid is not all white tiles.
        ...(n === 0 && { tilt: false, cls: "bento-lead", media: `<span class="bento-shot"><img src="${C.img("s2.5-04-small-766x1024.png")}" alt="" loading="lazy"></span>` }),
        ...(n === 2 && { tilt: false, cls: "bento-wide" }),
      })).join("")}
    </div>
  </div>
</section>

<section class="section alt" id="results">
  <div class="wrap">
    <div class="section-head split">
      <div><p class="eyebrow">Results from the field</p><h2 class="h-lg" data-reveal>Data that changed the decision.</h2></div>
      <a class="btn btn-outline" href="${r}about.html#projects">Recent projects ${icon("arrow-right")}</a>
    </div>
    ${resultCards(C.results.filter((x) => x.home))}
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
      <h2 class="h-lg" data-reveal>One of Australia's largest portfolios of monitoring instruments.</h2>
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

${waysSection(r)}

<section class="section alt" id="industries">
  <div class="wrap">
    <div class="section-head"><h2 class="h-lg" data-reveal>Built for critical infrastructure.</h2>
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

<section class="section" id="about">
  <div class="wrap split">
    <div>
      <p class="eyebrow">Since 1991</p>
      <h2 class="h-lg" data-reveal>Australian owned. Family founded. Still measuring.</h2>
      <div class="timeline">
        <span class="timeline-fill"></span>
        ${C.about.timeline.filter(([, t]) => ["EDS is founded", "Defence facility contract", "Sydney Water panel provider", "Transurban service provider", "Australia's largest supplier"].includes(t)).map(([when, t, d]) => `<div class="tl" data-reveal><time>${when}</time><i></i><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}
      </div>
      <a class="link-arrow" href="${r}about.html" style="margin-top:18px">The EDS story ${icon("arrow-right")}</a>
    </div>
    <div class="about-side">
      ${photoFigure(C.about.homePhoto, { sizes: "(max-width: 980px) calc(100vw - 40px), 460px" })}
      <figure class="quote" data-reveal="right" style="margin:0">
        ${icon("quote", false)}
        <blockquote>${C.about.quote.text}</blockquote>
        <cite><b>${C.about.quote.who}</b>, ${C.about.quote.org}</cite>
      </figure>
    </div>
  </div>
</section>

<section class="section dark" id="offices">
  <div class="wrap aus">
    <svg id="ausmap" data-offices='${JSON.stringify(C.offices)}' role="group" aria-label="Map of Australia showing EDS offices" data-reveal="scale"></svg>
    <div>
      <h2 class="h-lg" data-reveal>Four offices. One number.</h2>
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
${pageHero(r, { crumbs: [["Services"]], eyebrow: "Services", title: "Specialised services for water and wastewater networks.", lede: "From a single audit to a national monitoring program, delivered by trained crews in every state.", actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${r}contact.html">Talk to our team ${icon("arrow-right")}</a><a class="btn btn-ghost btn-lg" href="${site.phoneHref}">${icon("phone")} ${site.phone}</a><div class="chips">${C.serviceGroups.map((g) => `<a class="chip" href="#${g.id}">${esc(g.title)}</a>`).join("")}</div>`, visual: heroToc(C.serviceGroups.map((g) => [g.id, g.title, C.services.filter((s) => s.group === g.id).length])) })}
${C.serviceGroups.map((g, gi) => `
<section class="section${gi % 2 ? " alt" : ""}" id="${g.id}"><div class="wrap">
  <div class="section-head"><p class="eyebrow">${esc(g.title)}</p><h2 class="h-lg" data-reveal>${esc(g.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(g.lede)}</p></div>
  <div class="grid c3">
    ${C.services.filter((s) => s.group === g.id).map((s, n) => cardLink(r, { href: `services/${s.slug}.html`, iconName: s.icon, title: s.title, text: s.summary, n })).join("")}
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
const tableHtml = (c) => `<div class="table-scroll"><table class="compare${c.neutral ? " neutral" : ""}"><thead><tr><th></th><th>${esc(c.left)}</th><th>${esc(c.right)}</th></tr></thead><tbody>${c.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const compareHtml = (c) => `
<div class="block" id="${slugify(c.heading)}" data-reveal>
  <h2 class="h-md">${esc(c.heading)}</h2>
  ${tableHtml(c)}
</div>`;

// A content block: a heading with a short lede, then feature cards (`items`),
// a checklist or numbered steps (`list`, numbered with `steps: true`), a
// comparison (`table`) or questions and answers (`faq`).
const blockHtml = (b) => `
<div class="block" id="${slugify(b.heading)}" data-reveal>
  <h2 class="h-md">${esc(b.heading)}</h2>
  ${b.lede ? `<p class="block-lede">${esc(b.lede)}</p>` : ""}
  ${b.table ? tableHtml(b.table) : ""}
  ${b.items ? `<div class="feature-list">${b.items.map(([t, d]) => `<div class="feature holder">${icon("circle-check")}<div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>` : ""}
  ${b.list ? (b.steps || b.heading.includes("approach") ? `<ol class="steps">${b.list.map((l) => `<li>${esc(l)}</li>`).join("")}</ol>` : `<ul class="checks">${b.list.map((l) => `<li>${icon("check", false)}<span>${esc(l)}</span></li>`).join("")}</ul>`) : ""}
  ${b.faq ? faqHtml(b.faq) : ""}
</div>`;

// The jump list for a service or solution page: its blocks, plus any
// comparison table or demo below them. Short pages do not need one.
function sectionsOf(s) {
  const list = [...(s.blocks || []).map((b) => [slugify(b.heading), b.heading])];
  if (s.compare) list.push([slugify(s.compare.heading), s.compare.heading]);
  if (resultsFor(s.slug).length) list.push(["results", "Results from the field"]);
  if (s.process) list.push(["how-it-runs", "How a program runs"]);
  if (s.widget === "lab") list.push(["flow-lab", "Try the flow lab"]);
  if (s.widget === "lidott") list.push(["alarm-demo", "Try the alarm"]);
  if (s.widget === "eas") list.push(["asset-score", "Try the EDS Asset Score"]);
  return list.length >= 2 ? heroToc([["overview", "Overview"], ...list]) : "";
}

// The sidebar: a contact card, then one card of links per non-empty
// [title, links] section, where each link is [href, label, icon?, external?].
// `topic` is the enquiry topic the contact card's button opens the form with.
const asideHtml = (r, sections, topic, extra = "") => `
<aside class="aside">
  <div class="aside-card brand" data-reveal="right">
    <h3>Talk to our team</h3>
    <p>We would welcome the opportunity to discuss your requirements.</p>
    <a class="btn btn-primary" href="${contactHref(r, { topic })}">Enquire now ${icon("arrow-right")}</a>
    <a class="btn btn-ghost" href="${site.phoneHref}" style="margin-left:6px">${icon("phone")} ${site.phone}</a>
  </div>
  ${extra}
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
${pageHero(r, { crumbs: [["Services", "services/index.html"], [s.short || s.title]], iconName: s.icon, title: s.title, lede: s.summary, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${contactHref(r, { topic: s.title })}">Enquire now ${icon("arrow-right")}</a>${s.widget === "lab" ? `<a class="btn btn-ghost btn-lg" href="#flow-lab">${icon("cloud-rain")} Try the flow lab</a>` : ""}${s.widget === "lidott" ? `<a class="btn btn-ghost btn-lg" href="#alarm-demo">${icon("bell")} Try the alarm</a>` : ""}`, visual: sectionsOf(s) })}
<section class="section" id="overview"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${s.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    ${figuresHtml(s)}
    ${s.blocks.length ? `<div style="margin-top:clamp(40px,5vw,64px)">${s.blocks.map(blockHtml).join("")}</div>` : ""}
    ${s.compare ? compareHtml(s.compare) : ""}
    ${s.quote ? `<figure class="quote" data-reveal style="margin:clamp(40px,5vw,64px) 0 0">${icon("quote", false)}<blockquote>${esc(s.quote.text)}</blockquote></figure>` : ""}
    ${resultsFor(s.slug).length ? `<div class="block results-block" id="results" data-reveal><h2 class="h-md">Results from the field</h2>${resultCards(resultsFor(s.slug))}</div>` : ""}
  </div>
  ${asideHtml(r, [["Related services", svcLinks(r, s.related)], ["Related solutions", solLinks(r, s.solutions)], ["Products we use", brandLinks(r, s.products)], ["White papers", paperLinks(s.papers)]], s.title, asideFigure(s))}
</div></section>
${s.process ? processSection() : ""}
${s.widget === "lab" ? labSection({ eyebrow: "Try it", title: s.slug.startsWith("inflow") ? "Watch inflow and infiltration happen." : "What the flow meter sees in a storm." }) : ""}
${s.widget === "lidott" ? `<section class="section dark" id="alarm-demo"><div class="wrap"><div class="section-head"><p class="eyebrow">Try it</p><h2 class="h-lg" data-reveal>Raise the water. Watch the alarm.</h2></div>${lidottDemo()}</div></section>` : ""}
${ctaSection(r, { topic: s.title })}`,
  });
}

/* ---- solutions ---- */
add({
  file: "solutions/index.html",
  title: "Solutions | EDS",
  description: "Structure performance monitoring, asset and network assessment, thermal monitoring, wastewater monitoring, automatic sampling and environmental monitoring.",
  current: "solutions",
  body: (r) => `
${pageHero(r, { crumbs: [["Solutions"]], eyebrow: "Solutions", title: "Monitoring applied to the problem in front of you.", lede: "Each solution combines EDS instruments, field crews and data into an outcome you can act on.", visual: heroSteps("How a solution comes together", [["cpu", "Instruments", "Chosen from one of Australia's largest monitoring portfolios."], ["hard-hat", "Field crews", "Installed, maintained and calibrated by trained EDS crews."], ["chart-line", "Data you can act on", "Delivered to FlowSense, your SCADA system or a report."]]) })}
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
${pageHero(r, { crumbs: [["Solutions", "solutions/index.html"], [s.title]], iconName: s.icon, title: s.title, lede: s.summary, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${contactHref(r, { topic: s.title })}">Enquire now ${icon("arrow-right")}</a>`, visual: sectionsOf(s) })}
<section class="section" id="overview"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${s.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    ${figuresHtml(s)}
    ${(s.blocks || []).length ? `<div style="margin-top:clamp(40px,5vw,64px)">${s.blocks.map(blockHtml).join("")}</div>` : ""}
  </div>
  ${asideHtml(r, [["Related solutions", solLinks(r, s.related)], ["Related services", svcLinks(r, C.services.filter((x) => x.solutions?.includes(s.slug)).map((x) => x.slug))], ["Products we use", brandLinks(r, s.productLinks)]], s.title, asideFigure(s))}
</div></section>
${s.widget === "eas" ? `<section class="section dark" id="asset-score"><div class="wrap"><div class="section-head"><p class="eyebrow">EDS Asset Score</p><h2 class="h-lg" data-reveal>One score, watched around the clock.</h2></div>${easDemo()}</div></section>` : ""}
${ctaSection(r, { topic: s.title })}`,
  });
}

/* ---- products ---- */
add({
  file: "products/index.html",
  title: "Products | EDS",
  description: "EDS manufactures and represents leading instruments for water supply, wastewater, flow monitoring and process control: EDS, Detectronic, ORI, Hach Flow, Beadedstream, MicroLevel, Aquamonitrix and Dynaflox.",
  current: "products",
  scripts: ["products.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["Products"]], eyebrow: "Products", title: "Industry leading instruments, backed by people who use them.", lede: "EDS is a manufacturer, and represents leading manufacturers, in water supply and management, wastewater management, flow monitoring and process control.", actions: `<a class="btn btn-primary btn-lg" data-magnetic href="#finder">${icon("package-search")} Find an instrument</a><a class="btn btn-ghost btn-lg" href="${contactHref(r, { topic: "Product pricing" })}">Request pricing</a>`, visual: heroToc([["ranges", "Product ranges", C.brands.length], ["finder", "Instrument finder", products.length], ["featured", "Featured: LIDoTT Alarm"], ["ways", "Buy, hire or Data as a Service"]]) })}
<section class="section" id="ranges"><div class="wrap"><div class="grid c4">
  ${C.brands.map((b, n) => `
  <a class="card brand-card tilt" href="${r}products/${b.slug}.html" data-reveal style="width:auto;--i:${n % 4}">
    <div class="brand-shot"><img src="${b.cover || b.groups[0].items[0].image}" alt="${esc(b.title)}" loading="lazy"></div>
    <div class="brand-body"><span class="tag">${esc(b.tag)}</span><h3>${esc(b.title)}</h3><p>${esc(b.summary)}</p><span class="link-arrow">View range ${icon("arrow-right")}</span></div>
  </a>`).join("")}
</div></div></section>
<section class="section alt" id="finder"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Instrument finder</p><h2 class="h-lg" data-reveal>Find the right instrument.</h2>
  <p class="lede" data-reveal style="--i:1">All ${products.length} instruments from every range, in one place. Filter by what you need to measure, or search by name.</p></div>
  <div class="finder">
    <div class="finder-bar" data-reveal>
      <label class="finder-search">${icon("search", false)}<input type="search" placeholder="Search by name, brand or use" aria-label="Search instruments" autocomplete="off" spellcheck="false"></label>
      <div class="finder-chips" role="group" aria-label="Filter by type">
        <button type="button" class="fchip" data-type="" aria-pressed="true" data-track-label="All instruments">All<span>${products.length}</span></button>
        ${C.productTypes.map((t) => `<button type="button" class="fchip" data-type="${t.id}" aria-pressed="false" data-track-label="${esc(t.label)}">${icon(t.icon)}${t.label}<span>${products.filter((p) => p.type === t.id).length}</span></button>`).join("")}
      </div>
    </div>
    <p class="finder-count" role="status">Showing all ${products.length} instruments</p>
    <div class="prod-grid">${products.map((p, n) => productCard(r, p, { id: `${p.brand.slug}-${p.id}`, showBrand: true, n })).join("")}</div>
    <div class="finder-empty" hidden>
      <span class="card-icon">${icon("search-x")}</span>
      <h3>No instruments match</h3>
      <p>Try another word or type, or ask our team which instrument suits your application.</p>
      <div class="hero-actions"><button class="btn btn-outline" type="button" data-finder-reset>Show all instruments</button><a class="btn btn-brand" href="${contactHref(r, { topic: "Product pricing" })}">Ask our team ${icon("arrow-right")}</a></div>
    </div>
  </div>
</div></section>
${quickView()}
<section class="section" id="featured"><div class="wrap split" style="align-items:center">
  <div><p class="eyebrow">Featured</p><h2 class="h-lg" data-reveal>LIDoTT Alarm</h2><p class="lede" data-reveal style="--i:1;margin-top:16px">${C.lidott.lede} Radar level sensor, battery, modem and aerial in one compact, Zone 0 certified device.</p>
  <div class="hero-actions"><a class="btn btn-brand btn-lg" href="${r}products/lidott-alarm.html">See how it works ${icon("arrow-right")}</a></div></div>
  <div class="brand-shot" style="border:1px solid var(--border);border-radius:24px;aspect-ratio:1" data-reveal="right"><img src="${C.lidott.image}" alt="LIDoTT Alarm" loading="lazy"></div>
</div></section>
${waysSection(r, { cls: "alt" })}
${ctaSection(r, { title: "Need help choosing an instrument?", lede: "Our team has installed, serviced and calibrated all of them. Ask us which suits your application.", topic: "Product pricing" })}`,
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
    title: `${b.title} | EDS Products`,
    description: b.summary,
    current: "products",
    scripts: ["products.js"],
    body: (r) => `
${pageHero(r, { crumbs: [["Products", "products/index.html"], [b.name]], iconName: b.icon, eyebrow: b.tag, title: b.title, lede: b.summary, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${contactHref(r, pricing)}">Request pricing ${icon("arrow-right")}</a><a class="btn btn-ghost btn-lg" href="#range">${icon("layout-grid")} View the range</a>`, visual: heroProduct(b.cover || cover.image, b.coverName || cover.name) })}
<section class="section"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${b.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    ${b.blocks?.length ? `<div style="margin-top:clamp(40px,5vw,64px)">${b.blocks.map(blockHtml).join("")}</div>` : ""}
  </div>
  <aside class="aside">
    ${b.logo ? `<div class="aside-card" data-reveal="right" style="display:grid;place-items:center;padding:32px"><img src="${b.logo}" alt="${esc(b.name)} logo" style="max-height:70px;width:auto" loading="lazy"></div>` : ""}
    <div class="aside-card brand" data-reveal="right"><h3>Request pricing</h3><p>Sales, hire and service from EDS, Australia wide.</p><a class="btn btn-primary" href="${contactHref(r, pricing)}">Enquire now ${icon("arrow-right")}</a></div>
    ${docs.length
      ? `<div class="aside-card" data-reveal="right"><h3>Documents</h3><ul class="aside-links docs">${docs.map((d) => `<li><a href="${d.href}" rel="noopener"><span>${esc(d.title)}<small>${esc(d.meta)}</small></span>${icon("download")}</a></li>`).join("")}</ul></div>`
      : `<div class="aside-card" data-reveal="right"><h3>Datasheets and manuals</h3><p>Ask us for the datasheet, manual or software for any ${esc(b.name)} product.</p><a class="link-arrow" href="${contactHref(r, { product: `${b.name} datasheet or manual` })}">Request a datasheet ${icon("arrow-right")}</a></div>`}
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
  title: "LIDoTT Alarm by Detectronic | EDS",
  description: "Self contained radar water level measurement and alarm device. ATEX and IECEx Zone 0 certified, measures up to 8.4 m, battery life up to 7 years.",
  current: "products",
  scripts: ["widgets.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["Products", "products/index.html"], ["Detectronic", "products/detectronic.html"], ["LIDoTT Alarm"]], iconName: "bell", eyebrow: "Detectronic", title: "LIDoTT Alarm", lede: C.lidott.lede, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${contactHref(r, { topic: "Product pricing", product: "LIDoTT Alarm (Detectronic)" })}">Request pricing ${icon("arrow-right")}</a>${quoteBtn(quoteItem(products.find((p) => p.href === "products/lidott-alarm.html")), "btn-lg on-dark")}<a class="btn btn-ghost btn-lg" href="${C.lidott.datasheet}" rel="noopener">${icon("download")} Datasheet</a>`, visual: heroProduct(C.lidott.image, "LIDoTT Alarm") })}
<section class="section dark" style="padding-top:0"><div class="wrap">
  <div class="hl-grid" style="margin-bottom:clamp(40px,5vw,64px)">${C.lidott.highlights.map(([ic, t, d], i) => `<div class="hl holder" data-reveal style="--i:${i % 3}">${icon(ic)}<b>${t}</b><span>${d}</span></div>`).join("")}</div>
  <div class="section-head"><p class="eyebrow">See it work</p><h2 class="h-lg" data-reveal>Raise the water. Watch the alarm.</h2></div>
  ${lidottDemo()}
</div></section>
<section class="section"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${C.lidott.description.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="feature-list" style="margin-top:40px">${C.lidott.sections.map(([t, d]) => `<div class="feature holder" data-reveal>${icon("circle-check")}<div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>
    ${photoFigure(C.lidott.figure)}
  </div>
  <aside class="aside">
    <figure class="aside-card aside-figure" data-reveal="right"><img src="${C.lidott.image2}" alt="Drawing of LIDoTT Alarm in section" loading="lazy"><figcaption>LIDoTT Alarm, in section</figcaption></figure>
    <div class="aside-card" data-reveal="right"><h3>Specifications</h3><table class="specs"><tbody>${C.lidott.specs.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</tbody></table></div>
  </aside>
</div></section>
${ctaSection(r, { title: "Deploy LIDoTT Alarm across your network.", lede: "Simple to install and zero maintenance by design. Ask EDS for pricing and a deployment plan.", topic: "Product pricing", product: "LIDoTT Alarm (Detectronic)" })}`,
});

add({
  file: "products/alarm2.html",
  title: "Alarm2 Radar Level Monitor by Detectronic | EDS",
  description: "All-in-one radar level monitor with alarms, up to 20 m range with ± 5 mm accuracy. LoRaWAN or 4G connectivity, battery over 5 years.",
  current: "products",
  body: (r) => `
${pageHero(r, { crumbs: [["Products", "products/index.html"], ["Detectronic", "products/detectronic.html"], ["Alarm2"]], iconName: "bell-ring", eyebrow: "Detectronic", title: "Alarm2", lede: C.alarm2.lede, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${contactHref(r, { topic: "Product pricing", product: "Alarm2 (Detectronic)" })}">Request pricing ${icon("arrow-right")}</a>${quoteBtn(quoteItem(products.find((p) => p.href === "products/alarm2.html")), "btn-lg on-dark")}<a class="btn btn-ghost btn-lg" href="${C.alarm2.datasheet}" rel="noopener">${icon("download")} Datasheet</a><a class="btn btn-ghost btn-lg" href="${C.alarm2.manual}" rel="noopener">${icon("download")} Manual</a>`, visual: heroProduct(C.alarm2.image, "Alarm2") })}
<section class="section dark" style="padding-top:0"><div class="wrap">
  <div class="hl-grid" style="margin-bottom:clamp(40px,5vw,64px)">${C.alarm2.highlights.map(([ic, t, d], i) => `<div class="hl holder" data-reveal style="--i:${i % 3}">${icon(ic)}<b>${t}</b><span>${d}</span></div>`).join("")}</div>
</div></section>
<section class="section"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${C.alarm2.description.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="feature-list" style="margin-top:40px">${C.alarm2.sections.map(([t, d]) => `<div class="feature holder" data-reveal>${icon("circle-check")}<div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>
  </div>
  <aside class="aside">
    <div class="aside-card" data-reveal="right"><h3>Specifications</h3><table class="specs"><tbody>${C.alarm2.specs.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</tbody></table></div>
  </aside>
</div></section>
${ctaSection(r, { title: "Deploy Alarm2 across your network.", lede: "Complete level measurement and alarm device, ready for remote deployment. Ask EDS for pricing and support.", topic: "Product pricing", product: "Alarm2 (Detectronic)" })}`,
});

/* ---- EDS instruments with a page of their own ---- */
for (const pg of C.productPages) {
  const b = brand("eds");
  const pricing = { topic: "Product pricing", product: `${pg.name} (${b.name})` };
  const datasheet = pg.docs.find((d) => d.label === "Datasheet");
  add({
    file: `products/${pg.slug}.html`,
    title: pg.title,
    description: pg.description,
    current: "products",
    body: (r) => `
${pageHero(r, { crumbs: [["Products", "products/index.html"], [b.name, `products/${b.slug}.html`], [pg.name]], iconName: pg.icon, eyebrow: `${b.name} · ${pg.tag}`, title: pg.name, lede: pg.lede, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${contactHref(r, pricing)}">Request pricing ${icon("arrow-right")}</a>${quoteBtn(quoteItem(products.find((p) => p.href === `products/${pg.slug}.html`)), "btn-lg on-dark")}<a class="btn btn-ghost btn-lg" href="${datasheet.href}" rel="noopener">${icon("download")} Datasheet</a>`, visual: heroProduct(pg.image, pg.name) })}
<section class="section dark" style="padding-top:0"><div class="wrap">
  <div class="hl-grid">${pg.highlights.map(([ic, t, d], i) => `<div class="hl holder" data-reveal style="--i:${i % 3}">${icon(ic)}<b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div>
</div></section>
<section class="section"><div class="wrap split">
  <div>
    <div class="prose" data-reveal>${pg.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="feature-list" style="margin-top:40px">${pg.features.map(([t, d]) => `<div class="feature holder" data-reveal>${icon("circle-check")}<div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join("")}</div>
  </div>
  <aside class="aside">
    <figure class="aside-card aside-figure" data-reveal="right"><img src="${pg.figure.src}" alt="${esc(pg.figure.alt)}" loading="lazy"><figcaption>${esc(pg.figure.caption)}</figcaption></figure>
    <div class="aside-card" data-reveal="right"><h3>Documents</h3><ul class="aside-links docs">${pg.docs.map((d) => `<li><a href="${d.href}" rel="noopener"><span>${esc(`${pg.name} ${d.label.toLowerCase()}`)}<small>${docType(d.href)} · ${esc(d.note)}</small></span>${icon("download")}</a></li>`).join("")}</ul></div>
    <div class="aside-card" data-reveal="right"><h3>Works with</h3><ul class="aside-links docs">${pg.worksWith.map(([href, t, d]) => `<li><a href="${r}${href}"><span>${esc(t)}<small>${esc(d)}</small></span>${icon("arrow-right")}</a></li>`).join("")}</ul></div>
  </aside>
</div></section>
<section class="section alt" id="specifications"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Specifications</p><h2 class="h-lg" data-reveal>${esc(pg.name)} in detail.</h2></div>
  <div class="spec-groups">${pg.specs.map(([group, rows], i) => `<div class="aside-card" data-reveal style="--i:${i % 3}"><h3>${esc(group)}</h3><table class="specs"><tbody>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>`).join("")}</div>
  <p class="note spec-note" data-reveal>${esc(pg.specNote)} Full details are in the <a href="${datasheet.href}" rel="noopener">${esc(pg.name)} datasheet</a>.</p>
</div></section>
${ctaSection(r, { ...pg.cta, ...pricing })}`,
  });
}

/* ---- FlowSense ---- */
add({
  file: "flowsense.html",
  title: "EDS FlowSense | Sewer network intelligence",
  description: "EDS FlowSense: sewer network monitoring, flow analytics and engineering intelligence by Environmental Data Services.",
  current: "flowsense",
  body: (r) => `
${pageHero(r, { crumbs: [["FlowSense"]], iconName: "waves", eyebrow: "EDS FlowSense", title: "Sewer network intelligence.", lede: C.flowsense.lede, actions: `<a class="btn btn-primary btn-lg" data-magnetic href="${site.flowsenseUrl}" rel="noopener">Open FlowSense ${icon("arrow-up-right")}</a><a class="btn btn-ghost btn-lg" href="${contactHref(r, { topic: "EDS FlowSense" })}">Request a walkthrough</a>`, visual: heroToc([["platform", "Inside the platform"], ["capabilities", "Capabilities", C.flowsense.features.length], ["standards", "Methods and standards"], ["questions", "Questions", C.flowsense.faq.length], ["documents", "Documents", C.flowsense.docs.length]]) })}
<section class="section fs-band" id="platform"><div class="wrap fs-grid">
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
<section class="section" id="capabilities"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Capabilities</p><h2 class="h-lg" data-reveal>Everything your network is telling you.</h2></div>
  <div class="grid c3">
    ${C.flowsense.features.map(([ic, t, d], n) => `<div class="card hoverable holder" data-reveal style="--i:${n % 3}"><span class="card-icon">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}
  </div>
</div></section>
<section class="section alt" id="standards"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Methods</p><h2 class="h-lg" data-reveal>${esc(C.flowsense.standards.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(C.flowsense.standards.lede)}</p></div>
  <div class="grid c3">
    ${C.flowsense.standards.items.map(([ic, t, d], n) => `<div class="card hoverable holder" data-reveal style="--i:${n % 3}"><span class="card-icon">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}
  </div>
  <p class="note" data-reveal style="margin-top:22px">${esc(C.flowsense.standards.note)}</p>
</div></section>
<section class="section" id="questions"><div class="wrap split rev">
  <div class="section-head" style="margin:0"><p class="eyebrow">Questions</p><h2 class="h-lg" data-reveal>What councils and utilities ask us.</h2><p class="lede" data-reveal style="--i:1">If your question is not here, our team will answer it on ${site.phone}.</p></div>
  <div data-reveal>${faqHtml(C.flowsense.faq)}</div>
</div></section>
<section class="section alt" id="documents"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Documents</p><h2 class="h-lg" data-reveal>Read more about FlowSense.</h2></div>
  <ul class="doc-list grid c2">
    ${C.flowsense.docs.map((d, n) => `<li data-reveal style="--i:${n}"><a href="${d.href}" rel="noopener"><span class="card-icon">${icon("file-text")}</span><span>${esc(d.label)}<small>${esc(d.note)} ${docType(d.href)}.</small></span>${icon("download")}</a></li>`).join("")}
  </ul>
</div></section>
${ctaSection(r, { title: "See FlowSense on your own network.", lede: "FlowSense comes with EDS monitoring. Ask us for a walkthrough using your sites.", topic: "EDS FlowSense" })}`,
});

/* ---- about ---- */
add({
  file: "about.html",
  title: "About EDS | Environmental Data Services",
  description: "EDS is an Australian owned and operated company, a market leader in equipment and services for the water and wastewater industry since 1991.",
  current: "about",
  scripts: ["widgets.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["About"]], eyebrow: "About EDS", title: "Australian owned and operated since 1991.", lede: "Scientists, engineers and technicians who excel in every facet of environmental monitoring and project delivery.", visual: heroFacts() })}
<section class="section"><div class="wrap split">
  <div class="prose" data-reveal>${C.about.intro.map((p) => `<p>${esc(p)}</p>`).join("")}<h2>Our mission</h2>${C.about.mission.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  <aside class="aside">
    <figure class="quote" data-reveal="right" style="margin:0">${icon("quote", false)}<blockquote style="font-size:1.25rem">${C.about.quote.text}</blockquote><cite><b>${C.about.quote.who}</b>, ${C.about.quote.org}</cite></figure>
  </aside>
</div></section>
<section class="section dark" id="in-the-field"><div class="wrap">
  <div class="section-head"><p class="eyebrow">In the field</p><h2 class="h-lg" data-reveal>${esc(C.about.field.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(C.about.field.lede)}</p></div>
  <div class="mosaic">${C.about.field.photos.map((f, i) => photoFigure(f, { i, sizes: i ? "(max-width: 560px) calc(100vw - 40px), (max-width: 980px) calc(50vw - 27px), 300px" : "(max-width: 980px) calc(100vw - 40px), 614px" })).join("")}</div>
</div></section>
<section class="section alt" id="how-we-work"><div class="wrap">
  <div class="section-head"><p class="eyebrow">How we work</p><h2 class="h-lg" data-reveal>${esc(C.about.approach.heading)}</h2><p class="lede" data-reveal style="--i:1">${esc(C.about.approach.lede)}</p></div>
  <div class="grid c3">
    ${C.about.approach.items.map(([ic, t, d], n) => `<div class="card hoverable holder" data-reveal style="--i:${n % 3}"><span class="card-icon">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("")}
  </div>
</div></section>
<section class="section"><div class="wrap">
  <div class="section-head"><p class="eyebrow">EDS origins</p><h2 class="h-lg" data-reveal>Founded by Graham and Cynthia Harper.</h2>
  <p class="lede" data-reveal style="--i:1">EDS began in Queensland in 1991, following Graham's success with Elpro, and alongside the release of the Pump Station Manager.</p></div>
  <div class="timeline">
    <span class="timeline-fill"></span>
    ${C.about.timeline.map(([when, t, d], i) => `<div class="tl"${i === C.about.timeline.findIndex(([w]) => w.startsWith("2022")) ? ' id="projects"' : ""} data-reveal><time>${when}</time><i></i><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}
  </div>
  <figure class="quote" data-reveal style="margin:48px 0 0">${icon("quote", false)}<blockquote>${C.about.founder.text}</blockquote><cite><b>${C.about.founder.name}</b>, ${C.about.founder.role}</cite></figure>
</div></section>
<section class="section dark"><div class="wrap aus">
  <svg id="ausmap" data-offices='${JSON.stringify(C.offices)}' role="group" aria-label="Map of Australia showing EDS offices" data-reveal="scale"></svg>
  <div><p class="eyebrow">Nationwide</p><h2 class="h-lg" data-reveal>Four offices across Australia.</h2>
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
${pageHero(r, { crumbs: [["Resources"]], eyebrow: "Resources", title: "White papers, downloads and support.", lede: "What we have learned in the field, and the files you need to keep instruments running.", visual: heroToc([["papers", "White papers", C.papers.length], ["downloads", "Software, drivers and datasheets", C.downloads.reduce((n, g) => n + g.items.length, 0)], ["support", "Passwords, RMA forms and data access"]]) })}
<section class="section" id="papers"><div class="wrap">
  <div class="section-head"><p class="eyebrow">White papers</p><h2 class="h-lg" data-reveal>EDS publications</h2></div>
  <div class="grid c3">
    ${C.papers.map((p, n) => `
    <a class="card paper tilt" href="${p.href}" rel="noopener" data-reveal style="--i:${n}">
      <div class="paper-top"><span class="card-icon">${icon("file-text")}</span><span class="tag">${p.date}</span></div>
      <div class="paper-body"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><span class="link-arrow">Read the paper ${icon("arrow-up-right")}</span></div>
    </a>`).join("")}
  </div>
</div></section>
<section class="section alt" id="downloads"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Downloads and manuals</p><h2 class="h-lg" data-reveal>Software, drivers and datasheets</h2></div>
  <div class="grid c2">
    ${C.downloads.map((g) => `
    <div data-reveal${g.wide ? ' style="grid-column:1/-1;margin-top:28px"' : ""}>
      <h3 class="h-md" style="font-size:1.3rem;margin-bottom:16px">${g.group}</h3>
      <ul class="doc-list${g.wide ? " grid c2" : ""}">${g.items.map(([label, href]) => `<li><a href="${href}" rel="noopener"><span class="card-icon">${icon(g.icon)}</span><span>${esc(label)}</span>${icon("download")}</a></li>`).join("")}</ul>
      ${g.note ? `<p class="note" style="margin-top:14px;font-size:.9rem">${g.note}</p>` : ""}
    </div>`).join("")}
  </div>
</div></section>
<section class="section" id="support"><div class="wrap"><div class="grid c3">
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
  description: "Contact Environmental Data Services. Head office at Meadowbrook, Queensland, with offices in New South Wales, Victoria and South Australia.",
  current: "contact",
  scripts: ["widgets.js"],
  body: (r) => `
${pageHero(r, { crumbs: [["Contact"]], eyebrow: "Contact", title: "Call or visit. We would like to hear about your project.", lede: `${site.hours}. One number for every state: ${site.phone.replace(/ /g, " ")}.`, visual: heroPanel("Quickest ways to reach us", `
  <a class="hero-call" href="${site.phoneHref}">${icon("phone")}<span><small>Call from anywhere in Australia</small><b>${site.phone}</b></span></a>
  ${openStatus()}
  <ul class="hero-links">
    <li><a href="#enquiry">${icon("send")}<span>Send an enquiry</span>${icon("arrow-down")}</a></li>
    <li><a href="#offices">${icon("map-pin")}<span>Offices in four states</span>${icon("arrow-down")}</a></li>
  </ul>`, "hero-contact") })}
<section class="section"><div class="wrap contact-grid">
  <div class="contact-cards">
    <a class="contact-card" href="${site.phoneHref}" data-reveal><span class="card-icon">${icon("phone")}</span><span><b>${site.phone}</b><span>General enquiries, customer service, service department and sales</span></span></a>
    <a class="contact-card" href="#enquiry" data-reveal><span class="card-icon">${icon("send")}</span><span><b>Send an enquiry</b><span>${site.email}<br>Projects, monitoring programs and general questions</span></span></a>
    <a class="contact-card" href="${contactHref(r, { topic: "Product pricing" })}" data-reveal><span class="card-icon">${icon("tag")}</span><span><b>Sales</b><span>${site.sales}<br>Pricing, quotes and hire</span></span></a>
    <a class="contact-card" href="${contactHref(r, { topic: "Equipment service or calibration" })}" data-reveal><span class="card-icon">${icon("wrench")}</span><span><b>Service</b><span>${site.service}<br>Equipment service and calibration</span></span></a>
    <a class="contact-card" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("13/20-22 Ellerslie Road, Meadowbrook QLD 4131")}" rel="noopener" data-reveal><span class="card-icon">${icon("map-pin")}</span><span><b>Head office</b><span>${site.address.join(", ")}</span></span></a>
    <div class="contact-card" data-reveal><span class="card-icon">${icon("clock", false)}</span><span><b>Opening hours</b><span>${site.hours}. Closed Saturday and Sunday.</span>${openStatus()}</span></div>
  </div>
  <form class="form" id="enquiry" ${formSend} data-track="Enquiry form" data-reveal="right" novalidate>
    <div class="form-fields">
      <h2>Send an enquiry</h2>
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
      <div class="field-row">
        <label class="field">Name<input name="Name" autocomplete="name" required></label>
        <label class="field"><span>Organisation <i>Optional</i></span><input name="Organisation" autocomplete="organization"></label>
      </div>
      <div class="field-row">
        <label class="field">Email<input name="Email" type="email" autocomplete="email" required></label>
        <label class="field"><span>Phone <i>Optional</i></span><input name="Phone" type="tel" autocomplete="tel"></label>
      </div>
      <label class="field">I am interested in<select name="subject">
        <option>General enquiry</option>
        ${C.serviceGroups.map((g) => `<optgroup label="${esc(g.title)}">${C.services.filter((s) => s.group === g.id).map((s) => `<option>${esc(s.title)}</option>`).join("")}</optgroup>`).join("")}
        <optgroup label="Solutions">${C.solutions.map((s) => `<option>${esc(s.title)}</option>`).join("")}</optgroup>
        <optgroup label="Products and support"><option>Product pricing</option><option>Equipment service or calibration</option><option>EDS FlowSense</option></optgroup>
      </select></label>
      <fieldset class="field modes">
        <legend><span>How would you like to work? <i>Optional</i></span></legend>
        <div class="mode-chips">
          ${[...C.ways.items.map((w) => [w.mode, w.title === "Data as a Service" ? "Managed by EDS (DaaS)" : w.title]), ["unsure", "Not sure yet"]].map(([m, label]) => `<label class="mode-chip"><input type="radio" name="Way of working" value="${esc(label)}" data-mode="${m}"><span>${esc(label)}</span></label>`).join("")}
        </div>
      </fieldset>
      <label class="field">Message<textarea name="Message" required placeholder="Tell us about your site, network or project"></textarea></label>
      <textarea name="Products" hidden disabled></textarea>
      ${botcheck}
      <button class="btn btn-primary btn-lg" type="submit" style="justify-self:start">${icon("send")} <span>Send enquiry</span></button>
      <p class="form-error" role="alert" data-done="error" hidden>${icon("circle-alert", false)} Your enquiry did not go through. Please try again in a moment, or call ${site.phone}.</p>
      <p class="note">Your enquiry goes straight to our team.</p>
    </div>
    <div class="form-done" data-done="sent" hidden tabindex="-1" role="status">
      <span class="card-icon">${icon("mail-check", false)}</span>
      <h2>Thanks, your enquiry has been sent</h2>
      <p>It has gone to our team at ${site.email}, and we will reply to the email address you gave. For anything urgent, call ${site.phone}.</p>
      <div class="btn-row">
        <button class="btn btn-ghost" type="button" data-form-edit>${icon("pencil-line", false)}Send another enquiry</button>
      </div>
    </div>
  </form>
</div></section>
<section class="section dark" id="offices"><div class="wrap aus">
  <svg id="ausmap" data-offices='${JSON.stringify(C.offices)}' role="group" aria-label="Map of Australia showing EDS offices" data-reveal="scale"></svg>
  <div><p class="eyebrow">Office locations</p><h2 class="h-lg" data-reveal>Find us in four states.</h2>
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
${pageHero(r, { crumbs: [["Page not found"]], iconName: "waves", eyebrow: "Error 404", title: "This pipe leads nowhere.", lede: "The page you were looking for has moved or no longer exists. Search for it, or try one of these instead.", actions: `<button class="btn btn-primary btn-lg" type="button" data-search-open>${icon("search")} Search the site</button><a class="btn btn-ghost btn-lg" href="${r}index.html">Home</a><a class="btn btn-ghost btn-lg" href="${r}services/index.html">Services</a><a class="btn btn-ghost btn-lg" href="${r}products/index.html">Products</a><a class="btn btn-ghost btn-lg" href="${r}contact.html">Contact</a>` })}`,
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
/* search index                                                        */
/* ------------------------------------------------------------------ */
// Everything the search palette (search.js) can find, grouped by `g`. Links
// are relative to the site root, and search.js adds each page's way back to
// it. `b` is extra text to match on that is never shown; `x` marks links that
// leave the site.
function searchIndex() {
  const items = [];
  const text = (...parts) => parts.flat(Infinity).filter(Boolean).join(" ");
  const blockText = (blocks = []) => blocks.map((b) => [b.heading, b.lede, b.items || [], b.list || [], b.table?.rows || [], b.faq || []]);
  const plain = plainPath;
  const put = (g, t, s, h, more = {}) => items.push({ g, t, s, h, ...more });

  for (const s of C.services) put("Services", s.title, s.summary, `services/${s.slug}.html`, { i: s.icon, b: text(s.short, C.serviceGroups.find((g) => g.id === s.group)?.title, s.intro, blockText(s.blocks), s.compare?.rows || []) });
  for (const s of C.solutions) put("Solutions", s.title, s.summary, `solutions/${s.slug}.html`, { i: s.icon, b: text(s.intro, blockText(s.blocks)) });
  put("Products", "LIDoTT Alarm", `Detectronic · ${C.lidott.lede}`, "products/lidott-alarm.html", { img: plain(C.lidott.image), b: text("level radar alarm", C.lidott.description, C.lidott.sections, C.lidott.specs) });
  for (const pg of C.productPages) put("Products", pg.name, `EDS · ${pg.tag}`, `products/${pg.slug}.html`, { img: plain(pg.image), b: text(pg.lede, pg.intro, pg.features, pg.specs.map(([g, rows]) => [g, rows])) });
  for (const p of products) {
    if (p.href) continue; // has a page of its own, listed above
    put("Products", p.name, `${p.brand.name} · ${p.note || p.range || typeOf(p.type).label}`, `products/${p.brand.slug}.html#${p.id}`, { img: plain(p.image), b: text(typeOf(p.type).label, p.brand.title, p.brand.tag, p.group) });
  }
  for (const b of C.brands) put("Product ranges", b.title, b.tag, `products/${b.slug}.html`, { i: b.icon, b: text(b.name, b.summary, b.intro, blockText(b.blocks), b.groups.map((g) => g.name)) });
  put("Pages", "Instrument finder", `All ${products.length} instruments, filtered by type or searched by name.`, "products/index.html#finder", { i: "package-search", b: "products catalogue range brands" });
  put("Pages", "EDS FlowSense", "Sewer network intelligence: flow analytics and engineering insight.", "flowsense.html", { i: "waves", b: text(C.flowsense.lede, C.flowsense.features.map(([, t, d]) => [t, d]), C.flowsense.standards.items.map(([, t, d]) => [t, d]), C.flowsense.faq) });
  put("Pages", "About EDS", "Australian owned and operated since 1991.", "about.html", { i: "building-2", b: text(C.about.intro, C.about.mission, C.about.approach.items.map(([, t, d]) => [t, d]), C.about.timeline, "history founders story") });
  put("Pages", "Resources", "White papers, downloads and support.", "resources.html", { i: "book-open", b: "manuals software drivers datasheets passwords rma" });
  put("Pages", "Contact EDS", `${site.hours}. ${site.phone} from anywhere in Australia.`, "contact.html", { i: "messages-square", b: text(site.address, "enquiry form quote") });
  put("Pages", "All services", "Specialised services for water and wastewater networks.", "services/index.html", { i: "layout-grid" });
  put("Pages", "All solutions", "Monitoring applied to the problem in front of you.", "solutions/index.html", { i: "layout-grid" });
  put("Pages", "Home", site.tagline, "index.html", { i: "house" });
  put("Pages", "Privacy policy", "How EDS handles personal information.", "privacy.html", { i: "lock" });
  for (const p of C.papers) put("Documents", p.title, `White paper · ${p.date}`, p.href, { i: "file-text", x: 1, b: p.text });
  for (const g of C.downloads) for (const [label, href] of g.items) put("Documents", label, g.group, plain(href), { i: g.icon, x: 1, b: g.note });
  for (const p of products) {
    for (const d of p.docs || []) {
      if (!items.some((e) => e.h === plain(d.href))) put("Documents", `${p.name}: ${d.label}`, `${p.brand.name} · ${docType(d.href)}`, plain(d.href), { i: "file-text", x: 1, b: text(p.brand.title, p.note) });
    }
  }
  put("Contact", `Call ${site.phone}`, `${site.hours}, from anywhere in Australia`, site.phoneHref, { i: "phone", b: "phone ring telephone call" });
  put("Contact", "Send an enquiry", "The enquiry form, with the topic of your choice", "contact.html#enquiry", { i: "send", b: "quote pricing message" });
  put("Contact", "Sales enquiry", "Pricing, quotes and hire", contactHref("", { topic: "Product pricing" }), { i: "tag", b: "email sales quote" });
  put("Contact", "Service enquiry", "Equipment service and calibration", contactHref("", { topic: "Equipment service or calibration" }), { i: "wrench", b: "email service repair calibration" });
  for (const o of C.offices) put("Offices", `${o.city}, ${o.state}`, o.note, "contact.html#offices", { i: "map-pin", b: "office location address branch" });
  put("Sign in", "Sign in to EDS FlowSense", "edsflowsense.au", site.flowsenseUrl, { i: "log-in", x: 1, b: "login platform" });
  put("Sign in", "Remote data access", "DetectData, for Detectronic instruments", site.remoteDataUrl, { i: "globe", x: 1, b: "login detecdata" });

  const icons = {};
  for (const name of new Set(items.map((e) => e.i).filter(Boolean).concat("arrow-right", "arrow-up-right", "search-x"))) { icon(name); icons[name] = iconCache.get(name); }
  const suggested = ["services/sewer-flow-monitoring.html", "services/inflow-infiltration-studies.html", "services/data-as-a-service.html", "products/lidott-alarm.html", "flowsense.html", "products/index.html#finder", site.phoneHref];
  return { items, icons, suggested };
}

/* ------------------------------------------------------------------ */
/* write                                                               */
/* ------------------------------------------------------------------ */
icon("fan"); // fsScreen() reuses the fan glyph, so make sure it is cached
await rm(DIST, { recursive: true, force: true });
await mkdir(path.join(DIST, "assets/fonts"), { recursive: true });
await cp(path.join(ROOT, "src/css"), path.join(DIST, "assets/css"), { recursive: true });
await cp(path.join(ROOT, "src/js"), path.join(DIST, "assets/js"), { recursive: true });
await cp(path.join(ROOT, "src/assets/img"), path.join(DIST, "assets/img"), { recursive: true });
await cp(path.join(ROOT, "src/assets/docs"), path.join(DIST, "assets/docs"), { recursive: true });
for (const [pkg, f] of [["geist", "geist-latin-wght-normal.woff2"], ["geist-mono", "geist-mono-latin-wght-normal.woff2"]]) {
  await cp(path.join(ROOT, `node_modules/@fontsource-variable/${pkg}/files/${f}`), path.join(DIST, "assets/fonts", f));
}
for (const p of pages) {
  const out = path.join(DIST, p.file);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, layout(p));
}
// Forwarding pages for the old site's addresses. GitHub Pages serves
// /hach-flow from hach-flow.html, so each sits at the root.
for (const [from, to] of Object.entries(C.oldPages)) {
  if (!pages.some((p) => p.file === to)) throw new Error(`oldPages: "${from}" points at missing page ${to}`);
  if (pages.some((p) => p.file === `${from}.html`)) throw new Error(`oldPages: "${from}" would overwrite a page`);
  await writeFile(
    path.join(DIST, `${from}.html`),
    `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<title>Page moved</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${pageUrl(to)}">
<meta http-equiv="refresh" content="0; url=${to}">
<script>location.replace("${to}" + location.search + location.hash)</script>
</head>
<body><p>This page has moved to <a href="${to}">${pageUrl(to)}</a>.</p></body>
</html>
`
  );
}
await writeFile(path.join(DIST, "assets/js/search-index.js"), `// Generated by build.mjs from src/data/content.mjs. Do not edit.\nwindow.EDS_SEARCH = ${JSON.stringify(searchIndex())};\n`);
await writeFile(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .filter((p) => p.file !== "404.html")
    .map((p) => `  <url><loc>${pageUrl(p.file)}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);
await writeFile(path.join(DIST, "robots.txt"), process.env.PREVIEW ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`Built ${pages.length} pages into dist/`);
