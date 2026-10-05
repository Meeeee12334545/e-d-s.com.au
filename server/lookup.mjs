// Who is behind a visit: the organisation that holds the visitor's network
// and the nearest city. Runs after the visit is recorded, and the IP address
// is only held in memory while it is looked up; never stored.
//   Organisation: the public internet registries (RDAP, the same records as
//   "whois"), cached per network so each one is asked once a month. When the
//   network belongs to an internet provider, the address's reverse DNS name
//   sometimes names the business using it instead.
//   City: DB-IP's free City Lite database (CC BY 4.0), downloaded monthly
//   into DATA_DIR. Approximate, especially on mobile networks.
import { createGunzip } from "node:zlib";
import { createWriteStream } from "node:fs";
import { readFile, rename, stat, unlink } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";
import path from "node:path";
import { Reader } from "mmdb-lib";

const MONTH = 30 * 864e5;
const timeout = (ms) => AbortSignal.timeout(ms);

/* ---- what kind of network ---- */
// Internet providers: a visit through one is someone at home, on a phone or at
// a business that just buys internet, so the provider says nothing about who.
const PROVIDER = /telstra|optus|singtel|tpg|iinet|internode|westnet|aapt|vocus|dodo|primus|commander|aussie ?broadband|superloop|exetel|leaptel|launtel|spintel|tangerine|belong|amaysim|vodafone|\bmate\b|occom|swoop|skymesh|activ8me|starlink|space ?x|\bnbn\b|pentanet|buddy telco|kogan|lebara|boost mobile|spark|one ?nz|2degrees|vocus|orcon|slingshot|comcast|verizon|at&t|charter|t-mobile|\bbt\b|virgin|deutsche telekom|orange|telefonica|bharti|jio|pldt|globe telecom|indosat|telkom|broadband|internet service|customer|dsl|cable|mobile|wireless|cellular|residential/i;
// Data centres, cloud and privacy relays: usually bots, VPNs, iCloud Private
// Relay or a company's security proxy rather than a person's own network.
const HOSTING = /amazon|\baws\b|google|microsoft|azure|cloudflare|digitalocean|linode|akamai|ovh|hetzner|vultr|oracle|alibaba|tencent|fastly|leaseweb|choopa|m247|datacamp|\bapple\b|icloud|private relay|zscaler|netskope|cisco umbrella|hosting|data ?cent(er|re)|\bvpn\b|proxy|servers?\b|colo(cation)?\b/i;
const kindOf = (name) => (HOSTING.test(name) ? "hosting" : PROVIDER.test(name) ? "provider" : "organisation");

/* ---- addresses as fixed-width hex, so ranges compare as strings ---- */
function toBig(ip) {
  if (isIP(ip) === 4) return ip.split(".").reduce((n, p) => (n << 8n) + BigInt(p), 0n);
  let [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [], t = tail ? tail.split(":") : [];
  if (ip.includes(".")) { // ::ffff:1.2.3.4
    const v4 = (t.length ? t : h).pop();
    const n = toBig(v4);
    (t.length || !h.length ? t : h).push((n >> 16n).toString(16), (n & 0xffffn).toString(16));
  }
  const parts = ip.includes("::") ? [...h, ...Array(8 - h.length - t.length).fill("0"), ...t] : h;
  return parts.reduce((n, p) => (n << 16n) + BigInt(parseInt(p || "0", 16)), 0n);
}
const hex = (n, v) => n.toString(16).padStart(v === 4 ? 8 : 32, "0");
const cidr = (c) => {
  const [base, bits] = c.split("/");
  const v = isIP(base), width = v === 4 ? 32n : 128n, size = width - BigInt(bits);
  const start = (toBig(base) >> size) << size;
  return { v, start, end: start + (1n << size) - 1n };
};
const NON_PUBLIC_V4 = [
  "0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16",
  "172.16.0.0/12", "192.0.0.0/24", "192.0.2.0/24", "192.88.99.0/24", "192.168.0.0/16",
  "198.18.0.0/15", "198.51.100.0/24", "203.0.113.0/24", "224.0.0.0/4", "240.0.0.0/4",
].map(cidr);
const GLOBAL_V6 = cidr("2000::/3");
const NON_PUBLIC_V6 = ["2001::/23", "2001:db8::/32", "2002::/16", "3fff::/20"].map(cidr);
const inRange = (n, v, range) => range.v === v && range.start <= n && n <= range.end;
const MIN_NETWORK_SIZE = { 4: 1n << 8n, 6: 1n << 80n };
const broadEnough = (network, v) => BigInt(`0x${network.end}`) - BigInt(`0x${network.start}`) + 1n >= MIN_NETWORK_SIZE[v];
// IPv4 addresses that arrive as ::ffff:1.2.3.4
const plain = (ip) => ip.replace(/^::ffff:(?=\d+\.)/i, "");
const isPublic = (ip) => {
  const v = isIP(ip);
  if (!v) return false;
  const n = toBig(ip);
  return v === 4
    ? !NON_PUBLIC_V4.some((r) => inRange(n, v, r))
    : inRange(n, v, GLOBAL_V6) && !NON_PUBLIC_V6.some((r) => inRange(n, v, r));
};

/* ---- registries ---- */
// IANA's list of which registry (APNIC, ARIN, RIPE...) answers for which addresses.
let registries = null, registriesAt = 0;
async function registryFor(ip, v) {
  if (!registries || Date.now() - registriesAt > MONTH) {
    const lists = await Promise.all([4, 6].map((n) => fetch(`https://data.iana.org/rdap/ipv${n}.json`, { signal: timeout(8000) }).then((r) => r.json())));
    registries = lists.flatMap((l) => l.services.flatMap(([blocks, [url]]) => blocks.map((b) => ({ ...cidr(b), url: url.replace(/\/?$/, "/") }))));
    registriesAt = Date.now();
  }
  const n = toBig(ip);
  return registries.find((r) => r.v === v && r.start <= n && n <= r.end)?.url;
}

const vcardName = (e) => e?.vcardArray?.[1]?.find((x) => x[0] === "fn")?.[3];
async function whois(ip, v) {
  const base = await registryFor(ip, v);
  if (!base) return null;
  const res = await fetch(`${base}ip/${ip}`, { headers: { Accept: "application/rdap+json" }, signal: timeout(6000) });
  if (!res.ok) return null;
  const d = await res.json();
  const registrant = (d.entities || []).find((e) => e.roles?.includes("registrant"));
  const described = (d.remarks || []).find((r) => r.title === "description")?.description?.[0];
  const name = String(vcardName(registrant) || described || d.name || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!name || !d.startAddress || !d.endAddress) return null;
  return { start: hex(toBig(d.startAddress), v), end: hex(toBig(d.endAddress), v), org: name, kind: kindOf(name) };
}

/* ---- reverse DNS: "mail.logan.qld.gov.au" on a Telstra line ---- */
const resolver = new Resolver({ timeout: 2000, tries: 1 });
const GENERIC = /\d+[-.]\d+[-.]\d+|\b(ip|cpe|dyn|dynamic|static|dsl|ppp|pool|host|client|customer|user|broadband|nbn|cust|ptr|rev|reverse|unassigned)\b/i;
const SUFFIX2 = /\.(com|net|org|gov|edu|asn|id|csiro|co|govt|ac|school|iwi|ltd)\.(au|nz|uk|jp|sg|my|za|in|id|ph|th|cn|hk|kr|br)$/i;
const STATE = /^(qld|nsw|vic|sa|wa|tas|nt|act)$/i;
function domainOf(host) {
  const labels = host.replace(/\.$/, "").toLowerCase().split(".");
  if (labels.length < 2) return null;
  let keep = SUFFIX2.test(`.${labels.slice(-2).join(".")}`) ? 3 : 2;
  if (keep === 3 && STATE.test(labels.at(-keep))) keep = 4; // logan.qld.gov.au
  return labels.length >= keep ? labels.slice(-keep).join(".") : null;
}
async function reverseName(ip) {
  try {
    const [host] = await resolver.reverse(ip);
    if (!host || GENERIC.test(host)) return null;
    const domain = domainOf(host);
    return domain && kindOf(domain) === "organisation" ? domain : null;
  } catch { return null; }
}

/* ---- city ---- */
const DB_URL = (d) => `https://download.db-ip.com/free/dbip-city-lite-${d.toISOString().slice(0, 7)}.mmdb.gz`;
let cities = null;
async function loadCities(dir) {
  const file = path.join(dir, "dbip-city-lite.mmdb");
  const age = await stat(file).then((s) => Date.now() - s.mtimeMs, () => Infinity);
  let fresh = false;
  if (age > 35 * 864e5) {
    const now = new Date(), last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    for (const d of [now, last]) {
      try {
        const res = await fetch(DB_URL(d), { signal: timeout(300e3) });
        if (!res.ok) continue;
        const part = `${file}.part`;
        await pipeline(Readable.fromWeb(res.body), createGunzip(), createWriteStream(part));
        await rename(part, file);
        fresh = true;
        break;
      } catch (err) { console.error("City database download failed:", err.message); await unlink(`${file}.part`).catch(() => {}); }
    }
  }
  // About 130 MB in memory, so it is read once and again only after a new download.
  if (cities && !fresh) return;
  cities = null;
  try { cities = new Reader(await readFile(file)); } catch {}
}
function cityOf(ip) {
  const r = cities?.get(ip);
  const name = r?.city?.names?.en;
  if (!name) return null;
  const state = r.subdivisions?.[0]?.names?.en;
  return r.country?.iso_code === "AU" && state ? `${name}, ${STATE_ABBR[state] || state}` : name;
}
const STATE_ABBR = {
  Queensland: "QLD", "New South Wales": "NSW", Victoria: "VIC", "South Australia": "SA", "Western Australia": "WA",
  Tasmania: "TAS", "Northern Territory": "NT", "Australian Capital Territory": "ACT",
};

/* ---- the lookup ---- */
export function openLookup(store, dir) {
  if (process.env.ANALYTICS_LOOKUP === "off") return { lookup: async () => null };
  const failed = new Map(); // networks the registries could not answer for, retried after 10 minutes
  const pending = new Map();
  let activeLookups = 0, rateCount = 0, rateStarted = Date.now();

  const refresh = () => loadCities(dir).catch((err) => console.error("City database:", err.message));
  const citiesReady = refresh();
  setInterval(refresh, 864e5).unref();

  async function network(ip, v) {
    const key = hex(toBig(ip), v);
    let known = store.network(v, key);
    if (known && !broadEnough(known, v)) { store.deleteNetwork(known); known = null; }
    if (known && Date.now() - known.fetched < MONTH) return known;
    if (failed.get(key) > Date.now()) return known || null;
    try {
      const found = await whois(ip, v);
      if (found) {
        if (broadEnough(found, v)) store.saveNetwork({ v, ...found, fetched: Date.now() }, known);
        else if (known) store.deleteNetwork(known);
        return found;
      }
    } catch {}
    failed.set(key, Date.now() + 10 * 60e3);
    if (failed.size > 5000) failed.clear();
    return known || null;
  }

  async function lookup(raw) {
    const ip = plain(raw);
    const v = isIP(ip);
    if (!v || !isPublic(ip)) return null;
    if (pending.has(ip)) return pending.get(ip);
    const now = Date.now();
    if (now - rateStarted >= 60e3) { rateStarted = now; rateCount = 0; }
    if (activeLookups >= 8 || rateCount >= 120) return null;
    activeLookups++;
    rateCount++;
    const job = (async () => {
      const net = await network(ip, v);
      let org = net?.org || null, kind = net?.kind || null;
      if (kind !== "organisation") {
        const named = await reverseName(ip);
        if (named) { org = named; kind = "organisation"; }
      }
      await citiesReady;
      return { org, kind, city: cityOf(ip) };
    })().finally(() => { pending.delete(ip); activeLookups--; });
    pending.set(ip, job);
    return job;
  }

  return { lookup };
}
