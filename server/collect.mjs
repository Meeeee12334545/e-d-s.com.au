// POST /api/collect: receives what assets/js/track.js reports from each page.
// No cookies and no IP addresses are kept. A visitor is a hash of IP, browser
// and a salt that is replaced every day, which is enough to count unique
// visitors without being able to follow anyone from one day to the next. Page
// views are then tagged with the organisation and city behind the address
// (lookup.mjs), and the address itself is dropped.
import { createHash } from "node:crypto";
import { isIP } from "node:net";

// Page views and time on page, then each thing a visitor did: links and
// buttons clicked, menus and questions opened, tabs picked, documents, email
// and phone, other sites, searches, form options chosen and forms sent.
const TYPES = new Set(["pageview", "engagement", "link", "button", "toggle", "tab", "download", "contact", "outbound", "search", "choice", "form"]);
const BOT = /bot|crawl|spider|slurp|scrape|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|preview|facebookexternalhit|embedly|whatsapp|curl|wget|python|axios|node-fetch|go-http|java\//i;

// Australian time zones say which state a visitor is in; elsewhere the
// country comes from the host's geo header, or from the time zone.
const AU_STATES = {
  "Australia/Brisbane": "Queensland", "Australia/Lindeman": "Queensland",
  "Australia/Sydney": "New South Wales & ACT", "Australia/Canberra": "New South Wales & ACT", "Australia/ACT": "New South Wales & ACT",
  "Australia/NSW": "New South Wales & ACT", "Australia/Broken_Hill": "New South Wales & ACT", "Australia/Lord_Howe": "New South Wales & ACT",
  "Australia/Melbourne": "Victoria", "Australia/Victoria": "Victoria",
  "Australia/Adelaide": "South Australia", "Australia/South": "South Australia",
  "Australia/Perth": "Western Australia", "Australia/West": "Western Australia", "Australia/Eucla": "Western Australia",
  "Australia/Hobart": "Tasmania", "Australia/Tasmania": "Tasmania", "Australia/Currie": "Tasmania",
  "Australia/Darwin": "Northern Territory", "Australia/North": "Northern Territory",
};
const TZ_COUNTRY = {
  "Pacific/Auckland": "NZ", "Pacific/Chatham": "NZ", "Pacific/Port_Moresby": "PG", "Pacific/Fiji": "FJ", "Pacific/Noumea": "NC",
  "Asia/Singapore": "SG", "Asia/Kuala_Lumpur": "MY", "Asia/Jakarta": "ID", "Asia/Makassar": "ID", "Asia/Manila": "PH", "Asia/Bangkok": "TH",
  "Asia/Ho_Chi_Minh": "VN", "Asia/Hong_Kong": "HK", "Asia/Shanghai": "CN", "Asia/Taipei": "TW", "Asia/Tokyo": "JP", "Asia/Seoul": "KR",
  "Asia/Kolkata": "IN", "Asia/Calcutta": "IN", "Asia/Dubai": "AE", "Asia/Riyadh": "SA", "Asia/Qatar": "QA", "Asia/Karachi": "PK",
  "Europe/London": "GB", "Europe/Dublin": "IE", "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Amsterdam": "NL", "Europe/Brussels": "BE",
  "Europe/Madrid": "ES", "Europe/Rome": "IT", "Europe/Zurich": "CH", "Europe/Vienna": "AT", "Europe/Stockholm": "SE", "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK", "Europe/Helsinki": "FI", "Europe/Warsaw": "PL", "Europe/Prague": "CZ", "Europe/Lisbon": "PT", "Europe/Athens": "GR",
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Phoenix": "US", "America/Los_Angeles": "US",
  "America/Anchorage": "US", "Pacific/Honolulu": "US", "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA",
  "America/Winnipeg": "CA", "America/Halifax": "CA", "America/Mexico_City": "MX", "America/Sao_Paulo": "BR", "America/Buenos_Aires": "AR",
  "America/Argentina/Buenos_Aires": "AR", "America/Santiago": "CL", "America/Bogota": "CO", "America/Lima": "PE",
  "Africa/Johannesburg": "ZA", "Africa/Lagos": "NG", "Africa/Nairobi": "KE", "Africa/Cairo": "EG",
};
const GEO_HEADERS = ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-appengine-country", "x-country-code", "x-geo-country"];
const countryName = new Intl.DisplayNames(["en"], { type: "region" });

function location(headers, tz) {
  let country = GEO_HEADERS.map((h) => headers[h]).find((v) => /^[A-Z]{2}$/i.test(v || ""))?.toUpperCase();
  if (country === "XX" || country === "T1") country = undefined; // Cloudflare's "unknown" and Tor
  if (!country) country = tz?.startsWith("Australia/") ? "AU" : TZ_COUNTRY[tz];
  if (country === "AU") return { country, region: AU_STATES[tz] || "Australia" };
  if (country) return { country, region: countryName.of(country) || country };
  return { country: null, region: tz ? tz.split("/").pop().replace(/_/g, " ") : null };
}

// Friendly names for the referrers a water industry site actually sees.
const SOURCES = [
  [/(^|\.)google\./, "Google"], [/(^|\.)bing\.com$/, "Bing"], [/duckduckgo\.com$/, "DuckDuckGo"], [/(^|\.)yahoo\./, "Yahoo"],
  [/(^|\.)ecosia\.org$/, "Ecosia"], [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"], [/(^|\.)facebook\.com$|^fb\.me$|^l\.facebook\.com$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"], [/^t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, "X (Twitter)"], [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/(^|\.)reddit\.com$/, "Reddit"], [/chatgpt\.com$|chat\.openai\.com$/, "ChatGPT"], [/(^|\.)perplexity\.ai$/, "Perplexity"],
  [/(^|\.)claude\.ai$/, "Claude"], [/(^|\.)gemini\.google\.com$/, "Gemini"], [/copilot\.microsoft\.com$/, "Copilot"],
  [/mail\.google\.com$|outlook\.(live|office)\.com$|mail\.yahoo\.com$/, "Email"],
];
const sourceOf = (host) => (SOURCES.find(([re]) => re.test(host)) || [, host])[1];

function browserOf(ua) {
  if (/Edg(e|A|iOS)?\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Firefox|FxiOS/.test(ua)) return "Firefox";
  if (/Chrome|CriOS/.test(ua)) return "Chrome";
  if (/Safari/.test(ua)) return "Safari";
  return "Other";
}
function osOf(ua) {
  if (/Windows/.test(ua)) return "Windows";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Macintosh|Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}
const deviceOf = (w) => (!w ? null : w < 640 ? "Mobile" : w < 1024 ? "Tablet" : "Desktop");

// Plain text only, trimmed and capped, so nothing odd reaches the database.
const clean = (v, max = 200) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) || undefined : undefined);
const parseUrl = (v) => { try { return new URL(v); } catch { return null; } };
// "/services/index.html" and "/services/" are the same page.
const pagePath = (u) => { let p = u.pathname.replace(/\/index\.html$/, "/"); try { p = decodeURI(p); } catch {} return p.slice(0, 300); };

// At most 120 requests a minute from one address.
const hits = new Map();
setInterval(() => hits.clear(), 60e3).unref();
const limited = (ip) => { const n = (hits.get(ip) || 0) + 1; hits.set(ip, n); return n > 120; };

const trustedProxies = new Set((process.env.TRUSTED_PROXIES || "").split(",").map((ip) => ip.trim()).filter(Boolean));
export const clientIp = (req) => {
  const remote = req.socket.remoteAddress || "";
  if (trustedProxies.has(remote)) {
    const forwarded = String(req.headers["x-forwarded-for"] || "").split(",").map((ip) => ip.trim());
    for (let i = forwarded.length - 1; i >= 0; i--) if (isIP(forwarded[i]) && !trustedProxies.has(forwarded[i])) return forwarded[i];
  }
  return remote;
};

function readBody(req, max) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > max) { resolve(null); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(null));
  });
}

export async function collect(req, res, store, lookup) {
  if (req.method !== "POST") { res.writeHead(405, { Allow: "POST" }); return res.end(); }
  const ip = clientIp(req);
  const ua = String(req.headers["user-agent"] || "");
  const text = await readBody(req, 8192);
  let body;
  try { body = JSON.parse(text); } catch {}
  const page = parseUrl(body?.url);
  const reply = (code) => { res.writeHead(code, { "Cache-Control": "no-store" }); res.end(); };
  if (!body || !TYPES.has(body.type) || !page || !/^https?:$/.test(page.protocol)) return reply(400);
  if (limited(ip)) return reply(429);
  if (!ua || BOT.test(ua)) return reply(204);

  const ts = Date.now();
  const visitor = createHash("sha256").update(`${store.salt(ts)}|${ip}|${ua}|${page.host}`).digest("hex").slice(0, 16);
  const pid = clean(body.pid, 40);

  if (body.type === "engagement") {
    if (pid) store.engage(pid, visitor, Math.max(0, Math.min(3600e3, Math.round(+body.engaged || 0))), Math.max(0, Math.min(100, Math.round(+body.scroll || 0))));
    return reply(204);
  }

  const event = { ts, type: body.type, visitor, path: pagePath(page), title: clean(body.title) };
  if (body.type === "pageview") {
    const tz = clean(body.tz, 60);
    const ref = parseUrl(body.referrer);
    const params = page.searchParams;
    Object.assign(event, location(req.headers, tz), {
      pid,
      status: body.status === 404 ? 404 : undefined,
      device: deviceOf(Math.round(+body.width) || 0),
      browser: browserOf(ua),
      os: osOf(ua),
      medium: clean(params.get("utm_medium"), 80),
      campaign: clean(params.get("utm_campaign"), 120),
    });
    if (ref && ref.host !== page.host) {
      const host = ref.host.replace(/^www\./, "");
      event.referrer = host;
      event.source = clean(params.get("utm_source"), 80) || sourceOf(host);
    } else {
      event.source = clean(params.get("utm_source"), 80);
      // a broken link on our own site: remember which page it was on
      if (ref && event.status === 404) event.target = pagePath(ref);
    }
  } else {
    Object.assign(event, { target: clean(body.target, 500), label: clean(body.label, 120), item: clean(body.item, 120), area: clean(body.area, 120) });
  }
  const id = store.record(event);
  reply(204);
  if (body.type === "pageview" && lookup) {
    try { const who = await lookup.lookup(ip); if (who) store.tag(id, who); } catch (err) { console.error("Lookup failed:", err.message); }
  }
}
