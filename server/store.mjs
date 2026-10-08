// Visit storage for the analytics dashboard: one SQLite file (Node's built-in
// node:sqlite, so no packages to install) and the queries the dashboard runs.
// Days and hours are recorded in the site's own time zone, so "today" in the
// dashboard means today in Brisbane rather than in UTC.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

export const TZ = process.env.ANALYTICS_TZ || "Australia/Brisbane";
const SESSION_GAP = 30 * 60e3; // a visit ends after 30 minutes without a page view or click

const dtf = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
export function local(ts) {
  const p = {};
  for (const { type, value } of dtf.formatToParts(ts)) p[type] = value;
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

/* ---- calendar arithmetic on YYYY-MM-DD strings ---- */
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const utc = (day) => Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10));
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const addDays = (day, n) => iso(utc(day) + n * 864e5);
const monthStart = (day, n = 0) => { const d = new Date(utc(day)); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n); return iso(+d); };
const span = (from, to) => Math.round((utc(to) - utc(from)) / 864e5) + 1;
const lastYear = (day) => `${+day.slice(0, 4) - 1}${day.slice(4)}`.replace(/-02-29$/, "-02-28");

// Turns ?range=30d (or ?range=custom&from=…&to=…) into the days to report
// on, the bucket size for the chart, and the period before it to compare with.
export function resolveRange({ range = "30d", from, to } = {}) {
  const today = local(Date.now()).day;
  let unit = "day";
  if (range === "today") { from = to = today; unit = "hour"; }
  else if (range === "7d" || range === "30d" || range === "90d") { to = today; from = addDays(today, 1 - parseInt(range, 10)); }
  else if (range === "12m") { to = today; from = monthStart(today, -11); unit = "month"; }
  else if (range === "custom" && DAY_RE.test(from || "") && DAY_RE.test(to || "")) {
    if (to > today) to = today;
    if (from > to) [from, to] = [to, from];
    if (span(from, to) > 731) from = addDays(to, -730);
    unit = from === to ? "hour" : span(from, to) > 120 ? "month" : "day";
  } else return resolveRange({ range: "30d" });
  // The comparison period has the same length. Twelve months compare with the
  // same months a year earlier, up to the same date.
  if (range === "12m") return { range, from, to, prevFrom: monthStart(from, -12), prevTo: lastYear(to), unit, today };
  return { range, from, to, prevFrom: addDays(from, -span(from, to)), prevTo: addDays(from, -1), unit, today };
}

function buckets(from, to, unit) {
  if (unit === "hour") return Array.from({ length: 24 }, (_, h) => String(h));
  const keys = [];
  if (unit === "month") for (let m = monthStart(from); m <= to; m = monthStart(m, 1)) keys.push(m.slice(0, 7));
  else for (let d = from; d <= to; d = addDays(d, 1)) keys.push(d);
  return keys;
}
const BUCKET = { hour: "hour", day: "day", month: "substr(day, 1, 7)" };

/* ---- the store ---- */
export function openStore(dir) {
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "analytics.db"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,
      ts INTEGER NOT NULL,          -- unix ms
      day TEXT NOT NULL,            -- YYYY-MM-DD in the site's time zone
      hour INTEGER NOT NULL,
      type TEXT NOT NULL,           -- pageview, or an action: link, button, toggle, tab, download, contact, outbound, search, choice, form
      visitor TEXT NOT NULL,        -- hash of IP + browser + a salt that is thrown away daily
      session TEXT NOT NULL,
      entry INTEGER NOT NULL DEFAULT 0, -- 1 on the first page view of a visit
      pid TEXT,                     -- page view id from the browser, for time on page
      path TEXT NOT NULL,
      title TEXT,
      status INTEGER,               -- 404 when the page was not found
      referrer TEXT, source TEXT, medium TEXT, campaign TEXT,
      device TEXT, browser TEXT, os TEXT,
      country TEXT, region TEXT,
      target TEXT, label TEXT,      -- for actions: where a link went (or open/close for a toggle), and the words on what was clicked
      item TEXT,                    -- the product, card or form field the action belonged to
      area TEXT,                    -- where on the page: Header, Footer, a section by its heading…
      engaged INTEGER,              -- ms the page was on screen
      scroll INTEGER,               -- deepest scroll, percent
      org TEXT,                     -- who holds the visitor's network (lookup.mjs), on page views
      org_kind TEXT,                -- organisation, provider (an internet provider) or hosting
      city TEXT
    );
    CREATE INDEX IF NOT EXISTS events_day ON events(day, type);
    CREATE INDEX IF NOT EXISTS events_visitor ON events(visitor, ts);
    CREATE INDEX IF NOT EXISTS events_pid ON events(pid);
    CREATE INDEX IF NOT EXISTS events_ts ON events(ts);
    CREATE INDEX IF NOT EXISTS events_session ON events(session, ts);
    CREATE TABLE IF NOT EXISTS salts (day TEXT PRIMARY KEY, salt TEXT NOT NULL);
    -- Network ranges and who holds them, from the internet registries. Ranges,
    -- not visitors' addresses: one row covers a whole organisation or provider block.
    CREATE TABLE IF NOT EXISTS networks (
      v INTEGER NOT NULL, start TEXT NOT NULL, "end" TEXT NOT NULL, org TEXT NOT NULL, kind TEXT NOT NULL, fetched INTEGER NOT NULL,
      PRIMARY KEY (v, start, "end")
    );
  `);
  // Databases from before the organisation lookup and action labels get their columns.
  const have = new Set(db.prepare("PRAGMA table_info(events)").all().map((c) => c.name));
  for (const col of ["org", "org_kind", "city", "item", "area"]) if (!have.has(col)) db.exec(`ALTER TABLE events ADD COLUMN ${col} TEXT`);

  const st = (sql) => db.prepare(sql);
  const getSalt = st("SELECT salt FROM salts WHERE day = ?");
  const putSalt = st("INSERT OR IGNORE INTO salts (day, salt) VALUES (?, ?)");
  const dropSalts = st("DELETE FROM salts WHERE day <> ?");
  const lastSeen = st("SELECT session, ts FROM events WHERE visitor = ? ORDER BY ts DESC LIMIT 1");
  const insert = st(`INSERT INTO events (ts, day, hour, type, visitor, session, entry, pid, path, title, status, referrer, source, medium, campaign, device, browser, os, country, region, target, label, item, area)
    VALUES (:ts, :day, :hour, :type, :visitor, :session, :entry, :pid, :path, :title, :status, :referrer, :source, :medium, :campaign, :device, :browser, :os, :country, :region, :target, :label, :item, :area)`);
  const engageSt = st(`UPDATE events SET engaged = max(coalesce(engaged, 0), ?), scroll = max(coalesce(scroll, 0), ?)
    WHERE pid = ? AND visitor = ? AND type = 'pageview'`);
  const tagSt = st("UPDATE events SET org = ?, org_kind = ?, city = ? WHERE id = ?");
  // the narrowest known range holding the address
  const networkSt = st(`SELECT v, start, "end", org, kind, fetched FROM networks WHERE v = ? AND start <= ? AND "end" >= ? ORDER BY start DESC, "end" LIMIT 1`);
  const saveNetworkSt = st(`INSERT OR REPLACE INTO networks (v, start, "end", org, kind, fetched) VALUES (:v, :start, :end, :org, :kind, :fetched)`);
  const deleteNetworkSt = st(`DELETE FROM networks WHERE v = ? AND start = ? AND "end" = ?`);
  const pruneNetworksSt = st(`DELETE FROM networks WHERE rowid IN (SELECT rowid FROM networks ORDER BY fetched DESC LIMIT -1 OFFSET 5000)`);
  for (const n of st(`SELECT v, start, "end" FROM networks`).all()) {
    const minSize = n.v === 4 ? 1n << 8n : 1n << 80n;
    if (BigInt(`0x${n.end}`) - BigInt(`0x${n.start}`) + 1n < minSize) deleteNetworkSt.run(n.v, n.start, n.end);
  }
  pruneNetworksSt.run();

  // Today's salt. Yesterday's is deleted, so hashes cannot be linked across days.
  function salt(ts) {
    const { day } = local(ts);
    const row = getSalt.get(day);
    if (row) return row.salt;
    putSalt.run(day, randomBytes(16).toString("hex"));
    dropSalts.run(day);
    return getSalt.get(day).salt;
  }

  function record(e) {
    const last = lastSeen.get(e.visitor);
    const fresh = !last || e.ts - last.ts > SESSION_GAP;
    const row = { ...e, ...local(e.ts), session: fresh ? randomBytes(8).toString("hex") : last.session, entry: fresh && e.type === "pageview" ? 1 : 0 };
    for (const k of Object.keys(row)) if (row[k] === undefined) row[k] = null;
    return Number(insert.run(row).lastInsertRowid);
  }

  const engage = (pid, visitor, engaged, scroll) => engageSt.run(engaged, scroll, pid, visitor);
  const tag = (id, { org, kind, city }) => tagSt.run(org ?? null, kind ?? null, city ?? null, id);
  const network = (v, key) => networkSt.get(v, key, key);
  const saveNetwork = (n, stale) => {
    if (stale && (stale.start !== n.start || stale.end !== n.end)) deleteNetworkSt.run(stale.v, stale.start, stale.end);
    saveNetworkSt.run(n);
    pruneNetworksSt.run();
  };
  const deleteNetwork = (n) => deleteNetworkSt.run(n.v, n.start, n.end);

  /* ---- reporting ---- */
  const PV = "type = 'pageview' AND day BETWEEN ? AND ?";
  // Clicks on anything: links, buttons, menus, tabs, documents, email and phone, other sites.
  const CLICK = "type IN ('link', 'button', 'toggle', 'tab', 'download', 'contact', 'outbound')";

  // `hours` caps the hour of day, so today so far compares with yesterday up to the same time.
  function summary(from, to, hours = 23) {
    const a = st(`SELECT count(*) pageviews, count(DISTINCT visitor) visitors, count(DISTINCT session) visits,
      avg(engaged) FILTER (WHERE status IS NULL) avgTime FROM events WHERE ${PV} AND hour <= ?`).get(from, to, hours);
    const b = st(`SELECT count(*) visits, sum(n = 1) bounces FROM (SELECT count(*) n FROM events WHERE ${PV} AND hour <= ? GROUP BY session)`).get(from, to, hours);
    const c = st(`SELECT count(*) n FROM events WHERE ${CLICK} AND day BETWEEN ? AND ? AND hour <= ?`).get(from, to, hours);
    return {
      visitors: a.visitors, visits: a.visits, pageviews: a.pageviews,
      perVisit: a.visits ? a.pageviews / a.visits : null,
      bounceRate: b.visits ? b.bounces / b.visits : null,
      avgTime: a.avgTime,
      clicks: c.n,
    };
  }

  function series(from, to, unit) {
    const k = BUCKET[unit];
    const rows = new Map(st(`SELECT ${k} k, count(*) pageviews, count(DISTINCT visitor) visitors, count(DISTINCT session) visits,
      avg(engaged) FILTER (WHERE status IS NULL) avgTime FROM events WHERE ${PV} GROUP BY k`).all(from, to).map((r) => [String(r.k), r]));
    const bounce = new Map(st(`SELECT k, count(*) visits, sum(n = 1) bounces FROM
      (SELECT min(${k}) k, count(*) n FROM events WHERE ${PV} GROUP BY session) GROUP BY k`).all(from, to).map((r) => [String(r.k), r]));
    const clicks = new Map(st(`SELECT ${k} k, count(*) n FROM events WHERE ${CLICK} AND day BETWEEN ? AND ? GROUP BY k`).all(from, to).map((r) => [String(r.k), r.n]));
    const now = local(Date.now());
    return buckets(from, to, unit).map((key) => {
      // hours that have not happened yet are left empty rather than drawn as zero
      if (unit === "hour" && from === now.day && Number(key) > now.hour) return { key, future: true };
      const r = rows.get(key) || { pageviews: 0, visitors: 0, visits: 0, avgTime: null };
      const b = bounce.get(key);
      return {
        key, visitors: r.visitors, visits: r.visits, pageviews: r.pageviews,
        perVisit: r.visits ? r.pageviews / r.visits : null,
        bounceRate: b?.visits ? b.bounces / b.visits : null,
        avgTime: r.avgTime,
        clicks: clicks.get(key) || 0,
      };
    });
  }

  // the page a click happened on, or how many pages when there were several
  const ON_PAGE = "CASE WHEN count(DISTINCT path) = 1 THEN max(path) END page, count(DISTINCT path) pages";
  const top = (sql, from, to, limit = 100) => st(`${sql} LIMIT ${limit}`).all(from, to);
  const clicks = (type, from, to) =>
    st(`SELECT target, max(label) label, count(*) count, count(DISTINCT visitor) visitors, ${ON_PAGE}
      FROM events WHERE type = ? AND day BETWEEN ? AND ? GROUP BY target ORDER BY count DESC LIMIT 100`).all(type, from, to);

  function stats(q) {
    const r = resolveRange(q);
    const { from, to, prevFrom, prevTo, unit } = r;
    const prevSeries = series(prevFrom, prevTo, unit);
    const cur = series(from, to, unit);
    return {
      range: r,
      totals: summary(from, to),
      prev: summary(prevFrom, prevTo, r.range === "today" ? local(Date.now()).hour : 23),
      series: cur,
      prevSeries: cur.map((_, i) => prevSeries[i] || null),
      pages: top(`SELECT path, max(title) title, count(*) views, count(DISTINCT visitor) visitors, avg(engaged) avgTime, avg(scroll) scroll
        FROM events WHERE ${PV} AND status IS NULL GROUP BY path ORDER BY views DESC`, from, to),
      entries: top(`SELECT path, max(title) title, count(*) visits FROM events WHERE ${PV} AND entry = 1 GROUP BY path ORDER BY visits DESC`, from, to),
      sources: top(`SELECT coalesce(source, 'Direct') name, count(*) visits FROM events WHERE ${PV} AND entry = 1 GROUP BY name ORDER BY visits DESC`, from, to),
      campaigns: top(`SELECT campaign name, max(source) source, max(medium) medium, count(*) visits FROM events
        WHERE ${PV} AND entry = 1 AND campaign IS NOT NULL GROUP BY campaign ORDER BY visits DESC`, from, to),
      orgs: top(`SELECT org name, count(DISTINCT visitor) visitors, count(DISTINCT session) visits, count(*) views, max(ts) last
        FROM events WHERE ${PV} AND org_kind = 'organisation' GROUP BY org ORDER BY visitors DESC, views DESC`, from, to),
      providers: top(`SELECT org name, count(DISTINCT visitor) visitors FROM events WHERE ${PV} AND org_kind IN ('provider', 'hosting')
        GROUP BY org ORDER BY visitors DESC`, from, to),
      cities: top(`SELECT city name, count(DISTINCT visitor) visitors FROM events WHERE ${PV} AND city IS NOT NULL GROUP BY city ORDER BY visitors DESC`, from, to),
      regions: top(`SELECT coalesce(region, 'Unknown') name, count(DISTINCT visitor) visitors FROM events WHERE ${PV} GROUP BY name ORDER BY visitors DESC`, from, to),
      devices: top(`SELECT device name, count(DISTINCT visitor) visitors FROM events WHERE ${PV} GROUP BY name ORDER BY visitors DESC`, from, to),
      browsers: top(`SELECT browser name, count(DISTINCT visitor) visitors FROM events WHERE ${PV} GROUP BY name ORDER BY visitors DESC`, from, to),
      os: top(`SELECT os name, count(DISTINCT visitor) visitors FROM events WHERE ${PV} GROUP BY name ORDER BY visitors DESC`, from, to),
      notFound: top(`SELECT path, count(*) count, max(target) linkedFrom FROM events WHERE ${PV} AND status = 404 GROUP BY path ORDER BY count DESC`, from, to),
      downloads: clicks("download", from, to),
      contacts: clicks("contact", from, to),
      outbound: clicks("outbound", from, to),
      forms: st(`SELECT label name, count(*) count, ${ON_PAGE} FROM events WHERE type = 'form' AND day BETWEEN ? AND ?
        GROUP BY label ORDER BY count DESC LIMIT 100`).all(from, to),
      // what people clicked: each control by its words, what it belonged to and where it was
      clicked: st(`SELECT type, label, item, area, max(target) target, count(*) count, count(DISTINCT visitor) visitors, ${ON_PAGE}
        FROM events WHERE ${CLICK} AND day BETWEEN ? AND ? GROUP BY type, label, item, area ORDER BY count DESC LIMIT 200`).all(from, to),
      areas: top(`SELECT coalesce(area, 'Not recorded') name, count(*) count, count(DISTINCT visitor) visitors
        FROM events WHERE ${CLICK} AND day BETWEEN ? AND ? GROUP BY name ORDER BY count DESC`, from, to),
      clickPages: top(`SELECT path, max(title) title, count(*) count, count(DISTINCT visitor) visitors
        FROM events WHERE ${CLICK} AND day BETWEEN ? AND ? GROUP BY path ORDER BY count DESC`, from, to),
      searches: top(`SELECT max(label) name, max(area) area, count(*) count, count(DISTINCT visitor) visitors
        FROM events WHERE type = 'search' AND day BETWEEN ? AND ? GROUP BY lower(label) ORDER BY count DESC`, from, to),
      choices: top(`SELECT label name, item field, count(*) count, count(DISTINCT visitor) visitors
        FROM events WHERE type = 'choice' AND day BETWEEN ? AND ? GROUP BY item, label ORDER BY count DESC`, from, to),
    };
  }

  // People active in the last five minutes.
  const live = () => ({ now: st("SELECT count(DISTINCT visitor) n FROM events WHERE ts > ?").get(Date.now() - 5 * 60e3).n });

  // Each visit in the period, newest first, with every page and action in
  // order. `show` narrows them to visits where someone clicked something
  // (clicked) or got in touch (contacted); `offset` and `limit` page through.
  const SHOW = {
    all: "",
    clicked: `HAVING sum(${CLICK}) > 0`,
    contacted: "HAVING sum(type IN ('contact', 'form')) > 0",
  };
  function visits(q) {
    const { from, to } = resolveRange(q);
    const having = SHOW[q.show] ?? "";
    const limit = Math.max(1, Math.min(100, parseInt(q.limit, 10) || 20));
    const offset = Math.max(0, parseInt(q.offset, 10) || 0);
    const total = st(`SELECT count(*) n FROM (SELECT session FROM events WHERE day BETWEEN ? AND ? GROUP BY session ${having})`).get(from, to).n;
    const sessions = st(`SELECT session FROM events WHERE day BETWEEN ? AND ? GROUP BY session ${having}
      ORDER BY max(ts) DESC LIMIT ? OFFSET ?`).all(from, to, limit, offset).map((r) => r.session);
    const rows = st(`SELECT session, visitor, ts, type, path, title, status, source, referrer, medium, campaign, device, browser, os, region, city, org, org_kind,
      target, label, item, area, engaged, scroll FROM events WHERE session IN (SELECT value FROM json_each(?)) ORDER BY ts, id`).all(JSON.stringify(sessions));
    // the same visitor's earlier visits that day (the daily hash cannot see further back)
    const visitNo = st("SELECT count(DISTINCT session) n FROM events WHERE visitor = ? AND day = ? AND ts <= ?");
    const byId = new Map(sessions.map((id) => [id, null]));
    const since = Date.now() - 5 * 60e3;
    for (const r of rows) {
      let v = byId.get(r.session);
      if (!v) {
        v = { id: r.session, visitor: r.visitor, start: r.ts, end: r.ts, source: r.source, referrer: r.referrer, medium: r.medium, campaign: r.campaign,
          device: r.device, browser: r.browser, os: r.os, region: r.region, pages: 0, clicks: 0, steps: [] };
        byId.set(r.session, v);
      }
      v.end = Math.max(v.end, r.ts + (r.engaged || 0));
      if (r.type === "pageview") {
        v.pages++;
        // a visit's first page view says where it came from and what it was on
        for (const k of ["source", "referrer", "medium", "campaign", "device", "browser", "os", "region"]) v[k] ??= r[k];
      }
      if (/^(link|button|toggle|tab|download|contact|outbound)$/.test(r.type)) v.clicks++;
      if (r.org && !v.org) Object.assign(v, { org: r.org, orgKind: r.org_kind });
      if (r.city && !v.city) v.city = r.city;
      v.steps.push({ ts: r.ts, type: r.type, path: r.path, title: r.title, status: r.status, target: r.target, label: r.label, item: r.item, area: r.area, engaged: r.engaged, scroll: r.scroll });
    }
    const list = [...byId.values()].filter(Boolean).map(({ visitor, ...v }) => ({
      ...v,
      live: v.steps[v.steps.length - 1].ts > since,
      visitNo: visitNo.get(visitor, local(v.start).day, v.start).n,
    }));
    return { total, offset, visits: list };
  }

  function exportRows(q) {
    const { from, to } = resolveRange(q);
    return st(`SELECT ts, day, type, path, title, status, source, medium, campaign, referrer, device, browser, os, region, country,
      city, org, org_kind, target, label, item, area, engaged, scroll, session FROM events WHERE day BETWEEN ? AND ? ORDER BY ts`).all(from, to);
  }

  return { salt, record, engage, tag, network, saveNetwork, deleteNetwork, stats, live, visits, exportRows, close: () => db.close() };
}
