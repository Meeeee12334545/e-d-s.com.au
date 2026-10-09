// The analytics dashboard at /admin, behind a single password.
// Set ADMIN_PASSWORD (in .env locally, or in the host's settings) to turn it
// on. Signing in sets a signed, HttpOnly cookie that lasts 14 days; changing
// the password signs everyone out.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clientIp } from "./collect.mjs";
import { TZ, resolveRange } from "./store.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = { "admin.css": "text/css; charset=utf-8", "admin.js": "text/javascript; charset=utf-8" };
const COOKIE = "eds_admin";
const MAX_AGE = 14 * 24 * 3600;

const PASSWORD = process.env.ADMIN_PASSWORD || "";
const sha = (s) => createHash("sha256").update(s).digest();
const KEY = process.env.SESSION_SECRET || sha(`eds-admin\0${PASSWORD}`);
const sign = (v) => createHmac("sha256", KEY).update(v).digest("base64url");
const same = (a, b) => a.length === b.length && timingSafeEqual(a, b);

function signedIn(req) {
  const token = String(req.headers.cookie || "").split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const [exp, mac] = (token || "").split(".");
  return !!(PASSWORD && mac && Number(exp) > Date.now() / 1000 && same(Buffer.from(mac), Buffer.from(sign(exp))));
}
const cookie = (req, value, maxAge) => {
  const secure = req.socket.encrypted || req.headers["x-forwarded-proto"] === "https";
  return `${COOKIE}=${value}; Path=/admin; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
};

// Ten wrong passwords from one address locks it out for 15 minutes.
const failures = new Map();
const lockedOut = (ip) => { const f = failures.get(ip); return f && f.n >= 10 && Date.now() - f.at < 15 * 60e3; };
const fail = (ip) => { const f = failures.get(ip); failures.set(ip, { n: f && Date.now() - f.at < 15 * 60e3 ? f.n + 1 : 1, at: Date.now() }); };

const HEADERS = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; frame-ancestors 'none'; form-action 'self'; base-uri 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "Cache-Control": "no-store",
};
const send = (res, code, type, body, extra = {}) => { res.writeHead(code, { ...HEADERS, "Content-Type": type, ...extra }); res.end(body); };
const html = (res, code, body, extra) => send(res, code, "text/html; charset=utf-8", body, extra);
const json = (res, data) => send(res, 200, "application/json; charset=utf-8", JSON.stringify(data));
const redirect = (res, to, extra = {}) => { res.writeHead(303, { ...HEADERS, Location: to, ...extra }); res.end(); };

/* ---- icons: Lucide, read from the same package the site build uses ---- */
const ICONS = ["log-out", "download", "monitor", "smartphone", "tablet", "file-down", "mail", "phone", "external-link", "send", "triangle-alert", "file-text", "info", "users", "chevron-right",
  "mouse-pointer-click", "link", "search", "list-checks", "panels-top-left", "chevrons-up-down", "hash", "clock", "route", "building-2"];
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" class="sprite" aria-hidden="true">${ICONS.map((name) => {
  const file = path.join(HERE, "../node_modules/lucide-static/icons", `${name}.svg`);
  const inner = existsSync(file) ? readFileSync(file, "utf8").replace(/^[\s\S]*?<svg[\s\S]*?>/, "").replace(/<\/svg>\s*$/, "").replace(/\s*\n\s*/g, "") : "";
  return `<symbol id="i-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`;
}).join("")}</svg>`;
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const MARK = `<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#0c5f59"/><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M12 24q6.7 6 13.3 0t13.4 0 13.3 0"/><path d="M12 40q6.7 6 13.3 0t13.4 0 13.3 0"/></g></svg>`;

const page = (title, body, cls = "") => `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="stylesheet" href="/admin/assets/admin.css">
</head>
<body class="${cls}">
${sprite}
${body}
</body>
</html>`;

const gate = (heading, inner) => page(`${heading} | EDS admin`, `
<main class="gate">
  <div class="gate-card">
    <div class="brand">${MARK}<span>EDS <b>Site analytics</b></span></div>
    <h1>${heading}</h1>
    ${inner}
  </div>
</main>`, "gate-page");

const loginPage = (error = "") => gate("Sign in", `
    <form method="post" action="/admin/login">
      <label for="password">Admin password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
      ${error ? `<p class="error" role="alert">${error}</p>` : ""}
      <button class="btn btn-primary" type="submit">Sign in</button>
    </form>`);

const setupPage = () => gate("Turn on the admin area", `
    <p>The dashboard is switched off because no admin password is set.</p>
    <ol class="steps">
      <li>Copy <code>.env.example</code> to <code>.env</code> (or open your host's environment settings).</li>
      <li>Set <code>ADMIN_PASSWORD</code> to a long password only you know.</li>
      <li>Restart the server and come back to <code>/admin</code>.</li>
    </ol>`);

const RANGES = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"], ["12m", "12 months"], ["custom", "Custom"]];
const dashboard = () => page("Site analytics | EDS admin", `
<header class="top">
  <div class="wrap top-inner">
    <a class="brand" href="/admin">${MARK}<span>EDS <b>Site analytics</b></span></a>
    <p class="live" id="live" aria-live="polite"><span class="pulse" aria-hidden="true"></span><span id="live-text">Checking who is on the site…</span></p>
    <div class="top-actions">
      <a class="btn btn-quiet" href="/" target="_blank" rel="noopener">${icon("external-link")}<span>View site</span></a>
      <form method="post" action="/admin/logout"><button class="btn btn-quiet" type="submit">${icon("log-out")}<span>Sign out</span></button></form>
    </div>
  </div>
</header>

<main class="wrap dash" id="dash" data-tz="${TZ}">
  <div class="filters" role="toolbar" aria-label="Date range">
    <div class="seg" id="ranges">${RANGES.map(([v, l]) => `<button type="button" data-range="${v}" aria-pressed="false">${l}</button>`).join("")}</div>
    <form class="custom" id="custom" hidden>
      <label><span>From</span><input type="date" name="from" required></label>
      <label><span>To</span><input type="date" name="to" required></label>
      <button class="btn btn-small" type="submit">Apply</button>
    </form>
    <p class="period" id="period"></p>
    <a class="btn btn-quiet btn-small push" id="export" href="/admin/api/export.csv">${icon("download")}<span>Export CSV</span></a>
  </div>

  <section class="kpis" id="kpis" aria-label="Totals for the period"></section>

  <section class="card chart-card" aria-labelledby="chart-title">
    <div class="card-head">
      <div><h2 id="chart-title">Visitors</h2><p class="sub" id="chart-sub"></p></div>
      <div class="legend" id="legend"></div>
      <button class="btn btn-quiet btn-small" type="button" id="table-toggle" aria-pressed="false">Show table</button>
    </div>
    <div class="chart" id="chart"></div>
  </section>

  <section class="card visits-card" aria-labelledby="visits-title">
    <div class="card-head">
      <div><h2 id="visits-title">Who visited and what they did</h2><p class="sub">Every visit in the period, newest first: who it was, what they did, and every page and click in order. Open a visit to see it step by step.</p></div>
      <div class="seg" id="visit-filter" role="group" aria-label="Which visits to show">
        <button type="button" data-show="all" aria-pressed="true">All visits</button>
        <button type="button" data-show="orgs" aria-pressed="false">Organisations</button>
        <button type="button" data-show="clicked" aria-pressed="false">Clicked something</button>
        <button type="button" data-show="contacted" aria-pressed="false">Got in touch</button>
      </div>
    </div>
    <div class="key-row" aria-label="What the action labels mean">
      <span class="ev-tag t-page">${icon("file-text")}Page view</span>
      <span class="ev-tag t-click">${icon("mouse-pointer-click")}Click</span>
      <span class="ev-tag t-search">${icon("search")}Search or choice</span>
      <span class="ev-tag t-goal">${icon("send")}Enquiry or download</span>
      <span class="ev-tag t-leave">${icon("external-link")}Left the site</span>
    </div>
    <p class="visit-count" id="visit-count" aria-live="polite"></p>
    <ol class="visits" id="visits"></ol>
    <button class="more" type="button" id="visits-more" hidden>Show more visits</button>
  </section>

  <div class="grid" id="cards"></div>

  <section class="about">
    <h2>${icon("info")}How these numbers are counted</h2>
    <ul>
      <li><b>No cookies.</b> Visitors are counted with a hash of their IP address and browser that is reset every day. IP addresses are never stored, so a person who comes back tomorrow counts as a new visitor.</li>
      <li><b>Organisations</b> are whoever holds the visitor's network in the public internet registries, so they name a business, council or university only when it has its own network. People at home, on a phone or at a business that just buys internet show under their internet provider; cloud networks are usually VPNs, iCloud Private Relay or bots that got through.</li>
      <li><b>A visit</b> ends after 30 minutes with no activity. <b>Bounce rate</b> is the share of visits that saw one page. <b>Time on page</b> counts only the time the page was on screen.</li>
      <li><b>Clicks</b> are every link, button, menu, tab and question a visitor clicked, named by the words on it, with what it belonged to (a product, say) and where on the page it was: the header, the footer, or a section by its heading. <b>Searches</b> are the words typed into site search or the instrument finder. <b>Choices</b> are options picked in a form, such as the enquiry topic; nothing typed into a form is recorded.</li>
      <li><b>Form submissions</b> are counted when someone presses send on a complete form.</li>
      <li><b>Locations</b> in Australia come from the visitor's time zone, so Sydney and Canberra share one row. Cities are approximate, from <a href="https://db-ip.com" target="_blank" rel="noopener">IP Geolocation by DB-IP</a>, and on mobile networks can be hundreds of kilometres out. Bots and crawlers are left out. Times are in ${TZ.replace("_", " ")} time.</li>
      <li><label class="check"><input type="checkbox" id="ignore"> Don't count my own visits from this browser</label></li>
    </ul>
  </section>
</main>
<script src="/admin/assets/admin.js" defer></script>`, "dash-page");

/* ---- routes ---- */
function readForm(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 4096) { resolve(new URLSearchParams()); req.destroy(); } });
    req.on("end", () => resolve(new URLSearchParams(body)));
    req.on("error", () => resolve(new URLSearchParams()));
  });
}

// Each row's action in plain words, for the spreadsheet's "action" column.
const ACTIONS = {
  link: "Clicked a link", button: "Clicked a button", tab: "Picked a tab", download: "Downloaded a document",
  outbound: "Went to another site", search: "Searched", choice: "Chose an option", form: "Sent a form",
};
const describe = (r) =>
  r.type === "pageview" ? (r.status === 404 ? "Page not found" : "Viewed a page")
  : r.type === "toggle" ? (r.target === "close" ? "Closed" : "Opened")
  : r.type === "contact" ? (/^tel:/i.test(r.target || "") ? "Clicked the phone number" : "Clicked an email address")
  : ACTIONS[r.type] || r.type;

// CSV for spreadsheets. Cells that start like a formula are prefixed with an
// apostrophe, because page titles and links come from visitors' browsers.
function csv(rows) {
  const cols = ["time", "type", "path", "title", "status", "source", "medium", "campaign", "referrer", "device", "browser", "os", "region", "country", "city", "organisation", "network_type", "action", "target", "label", "item", "area", "seconds_on_page", "scroll_percent", "visit"];
  const cell = (v) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const time = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, dateStyle: "short", timeStyle: "medium" });
  const lines = rows.map((r) => [time.format(r.ts), r.type, r.path, r.title, r.status, r.source, r.medium, r.campaign, r.referrer, r.device, r.browser, r.os,
    r.region, r.country, r.city, r.org, r.org_kind, describe(r), r.target, r.label, r.item, r.area, r.engaged == null ? "" : Math.round(r.engaged / 1000), r.scroll, r.session].map(cell).join(","));
  return `﻿${cols.join(",")}\n${lines.join("\n")}\n`;
}

export async function admin(req, res, url, store) {
  const route = url.pathname.replace(/\/+$/, "") || "/admin";
  const asset = route.startsWith("/admin/assets/") && route.slice(14);
  if (asset && ASSETS[asset]) return send(res, 200, ASSETS[asset], await readFile(path.join(HERE, "admin", asset)), { "Cache-Control": "no-cache" });

  if (!PASSWORD) return html(res, 503, setupPage());
  const ip = clientIp(req);

  if (route === "/admin/login" && req.method === "POST") {
    if (lockedOut(ip)) return html(res, 429, loginPage("Too many attempts. Try again in 15 minutes."));
    const given = (await readForm(req)).get("password") || "";
    if (!same(sha(given), sha(PASSWORD))) { fail(ip); return html(res, 401, loginPage("That password is not right.")); }
    failures.delete(ip);
    const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
    return redirect(res, "/admin", { "Set-Cookie": cookie(req, `${exp}.${sign(exp)}`, MAX_AGE) });
  }
  if (route === "/admin/logout" && req.method === "POST") return redirect(res, "/admin", { "Set-Cookie": cookie(req, "", 0) });

  const authed = signedIn(req);
  if (route === "/admin") return html(res, 200, authed ? dashboard() : loginPage());
  if (!authed) return send(res, 401, "application/json; charset=utf-8", '{"error":"signed out"}');

  const q = Object.fromEntries(url.searchParams);
  if (route === "/admin/api/stats") return json(res, store.stats(q));
  if (route === "/admin/api/live") return json(res, store.live());
  if (route === "/admin/api/visits") return json(res, store.visits(q));
  if (route === "/admin/api/export.csv") {
    const { from, to } = resolveRange(q);
    return send(res, 200, "text/csv; charset=utf-8", csv(store.exportRows(q)), { "Content-Disposition": `attachment; filename="eds-analytics-${from}-to-${to}.csv"` });
  }
  send(res, 404, "text/plain; charset=utf-8", "Not found");
}
