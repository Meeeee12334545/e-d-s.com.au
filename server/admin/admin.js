// The analytics dashboard. Fetches /admin/api/stats for the chosen period and
// draws the tiles, the chart and the lists; /admin/api/live feeds the "on the
// site now" count, and /admin/api/visits each visit step by step. No libraries: the chart is SVG.
// Everything that came from a visitor's browser goes in with textContent.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const h = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };
  const NS = "http://www.w3.org/2000/svg";
  const s = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    parent?.append(el);
    return el;
  };
  const icon = (name) => {
    const svg = s("svg", { class: "icon", "aria-hidden": "true" });
    s("use", { href: `#i-${name}` }, svg);
    return svg;
  };
  const saved = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
  };

  const dash = $("#dash");
  const state = { range: saved.get("eds-admin-range") || "30d", from: "", to: "", metric: "visitors", table: false, data: null };
  const cardState = new Map(); // which tab each card shows, and whether it is expanded

  /* ---- formatting ---- */
  const nf = new Intl.NumberFormat("en-AU");
  const cf = new Intl.NumberFormat("en-AU", { notation: "compact", maximumFractionDigits: 1 });
  const num = (v) => (v == null ? "–" : v >= 10000 ? cf.format(v) : nf.format(Math.round(v)));
  const dur = (ms) => {
    if (ms == null) return "–";
    const t = Math.round(ms / 1000);
    return t < 60 ? `${t}s` : `${Math.floor(t / 60)}m ${String(t % 60).padStart(2, "0")}s`;
  };
  const pct = (v) => (v == null ? "–" : `${Math.round(v * 100)}%`);
  const dec = (v) => (v == null ? "–" : v.toFixed(1));

  const METRICS = {
    visitors: { label: "Visitors", fmt: num, good: 1 },
    visits: { label: "Visits", fmt: num, good: 1 },
    pageviews: { label: "Page views", fmt: num, good: 1 },
    perVisit: { label: "Pages per visit", fmt: dec, good: 1 },
    bounceRate: { label: "Bounce rate", fmt: pct, good: -1, points: true },
    avgTime: { label: "Time on page", fmt: dur, good: 1 },
    clicks: { label: "Clicks", fmt: num, good: 1 },
  };

  // Bucket keys are calendar dates in the site's time zone, so format them as UTC.
  const utc = (key) => new Date(Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, key.length > 7 ? +key.slice(8, 10) : 1));
  const df = (o) => new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", ...o });
  const fDay = df({ day: "numeric", month: "short" });
  const fDayLong = df({ weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const fMonth = df({ month: "short" });
  const fMonthLong = df({ month: "long", year: "numeric" });
  const fRange = df({ day: "numeric", month: "short", year: "numeric" });
  const fWhen = new Intl.DateTimeFormat("en-AU", { timeZone: dash.dataset.tz, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const hour12 = (n) => `${n % 12 || 12}${n < 12 ? "am" : "pm"}`;
  const axisLabel = (key, unit) => (unit === "hour" ? hour12(+key) : unit === "month" ? fMonth.format(utc(key)) : fDay.format(utc(key)));
  const longLabel = (key, unit, day) =>
    unit === "hour" ? `${hour12(+key)}–${hour12((+key + 1) % 24)}, ${fDayLong.format(utc(day))}` : unit === "month" ? fMonthLong.format(utc(key)) : fDayLong.format(utc(key));
  const period = (a, b) => (a === b ? fDayLong.format(utc(a)) : fRange.formatRange(utc(a), utc(b)));

  /* ---- loading ---- */
  let ticket = 0;
  async function load() {
    const q = new URLSearchParams({ range: state.range });
    if (state.range === "custom") { q.set("from", state.from); q.set("to", state.to); }
    $("#export").href = `/admin/api/export.csv?${q}`;
    const mine = ++ticket;
    dash.classList.add("loading");
    try {
      const res = await fetch(`/admin/api/stats?${q}`);
      if (res.status === 401) return location.reload();
      const data = await res.json();
      if (mine !== ticket) return;
      state.data = data;
      render();
      loadVisits();
    } finally {
      if (mine === ticket) dash.classList.remove("loading");
    }
  }

  async function loadLive() {
    const res = await fetch("/admin/api/live");
    if (res.status === 401) return location.reload();
    const d = await res.json();
    $("#live-text").textContent = d.now === 1 ? "1 person on the site now" : `${d.now} people on the site now`;
    $("#live").classList.toggle("on", d.now > 0);
  }

  function render() {
    const { range, totals, prev } = state.data;
    for (const b of $("#ranges").children) b.setAttribute("aria-pressed", String(b.dataset.range === range.range));
    $("#period").textContent = `${period(range.from, range.to)}, compared with ${period(range.prevFrom, range.prevTo)}`;
    const custom = $("#custom");
    custom.elements.from.max = custom.elements.to.max = range.today;
    let notice = $("#notice");
    if (!totals.pageviews && !prev.pageviews) {
      if (!notice) { notice = h("p", "notice"); notice.id = "notice"; $("#kpis").before(notice); }
      notice.textContent = "No visits recorded in this period yet. They appear here as soon as someone opens a page on the site.";
    } else notice?.remove();
    renderKpis();
    renderChart();
    renderCards();
  }

  /* ---- tiles ---- */
  function delta(cur, old, m) {
    const el = h("span", "delta flat");
    if (cur == null || old == null) { el.textContent = "No earlier data"; return el; }
    if (!m.points && old === 0) { el.textContent = cur > 0 ? "New this period" : "No change"; return el; }
    const r = Math.round(m.points ? (cur - old) * 100 : ((cur - old) / old) * 100);
    if (r === 0) { el.textContent = "No change"; return el; }
    el.className = `delta ${r * m.good > 0 ? "good" : "bad"}`;
    el.textContent = `${r > 0 ? "▲" : "▼"} ${Math.abs(r)}${m.points ? " pts" : "%"}`;
    el.append(h("span", "sr", ` ${r > 0 ? "up" : "down"} on the previous period`));
    return el;
  }
  function renderKpis() {
    const { totals, prev } = state.data;
    const box = $("#kpis");
    box.textContent = "";
    for (const [key, m] of Object.entries(METRICS)) {
      const b = h("button", "kpi");
      b.type = "button";
      b.setAttribute("aria-pressed", String(key === state.metric));
      b.append(h("span", "kpi-label", m.label), h("span", "kpi-value", m.fmt(totals[key])), delta(totals[key], prev[key], m));
      b.addEventListener("click", () => { state.metric = key; renderKpis(); renderChart(); });
      box.append(b);
    }
  }

  /* ---- the chart: this period against the one before, one axis ---- */
  function niceTicks(max, metric) {
    const target = Math.max(max, 0) / 4;
    let step;
    if (metric === "avgTime") step = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600].map((x) => x * 1000).find((x) => x >= target) || 3600e3;
    else if (metric === "bounceRate") step = [0.05, 0.1, 0.2, 0.25].find((x) => x >= target) || 0.25;
    else {
      const min = metric === "perVisit" ? 0.5 : 1;
      const p = 10 ** Math.floor(Math.log10(Math.max(target, min)));
      step = [1, 2, 5, 10].map((x) => x * p).find((x) => x >= target && x >= min);
    }
    const n = Math.max(1, Math.ceil(max / step - 1e-9));
    return Array.from({ length: n + 1 }, (_, i) => +(i * step).toFixed(6));
  }
  const tickFmt = {
    avgTime: (ms) => { const t = ms / 1000; return t < 60 ? `${t}s` : t % 60 ? `${Math.floor(t / 60)}m ${t % 60}s` : `${t / 60}m`; },
    bounceRate: (v) => `${Math.round(v * 100)}%`,
    perVisit: (v) => String(v),
  };
  const UNIT = { hour: "Hour", day: "Day", month: "Month" };

  let hover = null; // the current chart's hover handlers, for keyboard use
  function renderChart() {
    const { series, prevSeries, range } = state.data;
    const m = METRICS[state.metric];
    const unit = range.unit;
    $("#chart-title").textContent = m.label;
    $("#chart-sub").textContent = `By ${unit}, ${period(range.from, range.to)}`;
    const legend = $("#legend");
    legend.textContent = "";
    for (const [cls, text] of [["key", "This period"], ["key prev", "Previous period"]]) {
      const item = h("span");
      item.append(h("i", cls), text);
      legend.append(item);
    }
    const toggle = $("#table-toggle");
    toggle.textContent = state.table ? "Show chart" : "Show table";
    toggle.setAttribute("aria-pressed", String(state.table));

    const cur = series.map((d) => (d.future ? null : d[state.metric] ?? null));
    const old = prevSeries.map((d) => (d ? d[state.metric] ?? null : null));
    const box = $("#chart");
    box.textContent = "";
    hover = null;
    if (state.table) return box.append(chartTable(series, prevSeries, cur, old, m, unit, range));

    const W = Math.max(300, Math.round(box.clientWidth)), H = 280;
    const P = { t: 12, r: 18, b: 30, l: 50 };
    const n = cur.length, iw = W - P.l - P.r, ih = H - P.t - P.b;
    const x = (i) => P.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
    const ticks = niceTicks(Math.max(0, ...cur.filter((v) => v != null), ...old.filter((v) => v != null)), state.metric);
    const top = ticks[ticks.length - 1];
    const y = (v) => P.t + ih - (v / top) * ih;
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": `${m.label} by ${unit}, this period and the previous period. Use the table view for exact values.` }, box);

    const fmtTick = tickFmt[state.metric] || num;
    for (const t of ticks) {
      s("line", { class: "grid-line", x1: P.l, x2: W - P.r, y1: y(t), y2: y(t) }, svg);
      s("text", { class: "tick", x: P.l - 10, y: y(t), "text-anchor": "end", "dominant-baseline": "middle" }, svg).textContent = fmtTick(t);
    }
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 72))));
    for (let i = 0; i < n; i += every) {
      const anchor = n > 1 && x(i) > W - P.r - 24 ? "end" : "middle";
      s("text", { class: "tick", x: x(i), y: H - 8, "text-anchor": anchor }, svg).textContent = axisLabel(series[i].key, unit);
    }

    // Lines break where there is no value (a rate with no visits, an hour still to come).
    const runs = (vals) => {
      const out = [];
      let run = null;
      vals.forEach((v, i) => { if (v == null) run = null; else { if (!run) out.push((run = [])); run.push([x(i), y(v)]); } });
      return out;
    };
    const d = (pts) => pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join("");
    for (const run of runs(old)) run.length > 1 ? s("path", { class: "line prev", d: d(run) }, svg) : s("circle", { class: "dot prev", cx: run[0][0], cy: run[0][1], r: 3 }, svg);
    for (const run of runs(cur)) {
      if (run.length > 1) {
        s("path", { class: "area", d: `${d(run)}L${run[run.length - 1][0].toFixed(1)} ${y(0)}L${run[0][0].toFixed(1)} ${y(0)}Z` }, svg);
        s("path", { class: "line cur", d: d(run) }, svg);
      } else s("circle", { class: "dot cur", cx: run[0][0], cy: run[0][1], r: 4 }, svg);
    }
    const lastI = cur.findLastIndex((v) => v != null);
    if (lastI >= 0) s("circle", { class: "dot cur", cx: x(lastI), cy: y(cur[lastI]), r: 4 }, svg);

    // crosshair and tooltip
    const cross = s("line", { class: "cross", x1: 0, x2: 0, y1: P.t, y2: P.t + ih, visibility: "hidden" }, svg);
    const dotOld = s("circle", { class: "dot prev", r: 4, visibility: "hidden" }, svg);
    const dotCur = s("circle", { class: "dot cur", r: 4, visibility: "hidden" }, svg);
    const tip = h("div", "tip");
    tip.hidden = true;
    box.append(tip);
    const place = (dot, v, i) => {
      dot.setAttribute("visibility", v == null ? "hidden" : "visible");
      if (v != null) { dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(v)); }
    };
    const row = (cls, value, text) => {
      const r = h("div", "tip-row");
      r.append(h("i", cls), h("b", null, value), h("span", null, text));
      return r;
    };
    let at = -1;
    const show = (i) => {
      at = i;
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      place(dotOld, old[i], i);
      place(dotCur, cur[i], i);
      tip.textContent = "";
      tip.append(h("div", "tip-date", longLabel(series[i].key, unit, range.from)));
      tip.append(row("key", series[i].future ? "–" : m.fmt(cur[i]), m.label.toLowerCase()));
      if (prevSeries[i]) tip.append(row("key prev", m.fmt(old[i]), longLabel(prevSeries[i].key, unit, range.prevFrom)));
      tip.hidden = false;
      const scale = box.clientWidth / W;
      const px = x(i) * scale;
      tip.style.left = `${px + tip.offsetWidth + 16 > box.clientWidth ? px - tip.offsetWidth - 12 : px + 12}px`;
    };
    const hide = () => { at = -1; tip.hidden = true; for (const el of [cross, dotOld, dotCur]) el.setAttribute("visibility", "hidden"); };
    svg.addEventListener("pointermove", (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      show(Math.max(0, Math.min(n - 1, Math.round(n === 1 ? 0 : ((px - P.l) / iw) * (n - 1)))));
    });
    svg.addEventListener("pointerleave", hide);
    hover = { n, show, hide, at: () => at, last: Math.max(0, lastI) };
  }

  function chartTable(series, prevSeries, cur, old, m, unit, range) {
    const wrap = h("div", "chart-scroll");
    const t = h("table");
    t.append(h("caption", null, `${m.label} by ${unit}`));
    const head = h("tr");
    for (const c of [UNIT[unit], "This period", "Previous period"]) head.append(h("th", null, c));
    t.appendChild(h("thead")).append(head);
    const body = t.appendChild(h("tbody"));
    series.forEach((d, i) => {
      const tr = h("tr");
      tr.append(h("td", null, longLabel(d.key, unit, range.from)), h("td", null, d.future ? "–" : m.fmt(cur[i])), h("td", null, prevSeries[i] ? m.fmt(old[i]) : "–"));
      body.append(tr);
    });
    wrap.append(t);
    return wrap;
  }

  /* ---- lists ---- */
  const fileName = (u) => { try { return decodeURIComponent(new URL(u).pathname.split("/").pop()) || u; } catch { return u; } };
  const site = (u) => { try { const x = new URL(u); return x.host.replace(/^www\./, "") + (x.pathname === "/" ? "" : x.pathname); } catch { return u; } };
  const contact = (t) => t.replace(/^(mailto|tel):/i, "");
  const join = (...parts) => parts.filter(Boolean).join(" · ");
  const onPage = (r) => (r.page ? `on ${r.page}` : r.pages > 1 ? `on ${r.pages} pages` : "");
  const visitors = [["visitors", "Visitors", num]];

  // What each kind of click is called, and its colour in the lists and timeline.
  const KINDS = {
    link: ["Link", "t-click"], button: ["Button", "t-click"], toggle: ["Menu or question", "t-click"], tab: ["Tab", "t-click"],
    download: ["Download", "t-goal"], contact: ["Email or phone", "t-goal"], form: ["Form sent", "t-goal"],
    outbound: ["Other site", "t-leave"], search: ["Search", "t-search"], choice: ["Choice", "t-search"],
  };
  const quoted = (v) => (v ? `“${v}”` : "");
  // what an action belonged to: "for Hach FL900", or "in search results for …"
  const inSearch = (item) => /^(search results|suggested search results)/.test(item || "");
  const forWord = (item) => (inSearch(item) ? "in" : "for");
  const clickName = (r) =>
    r.type === "download" ? fileName(r.target) : r.type === "contact" ? contact(r.target) : r.type === "outbound" ? `${r.label ? `${quoted(r.label)} to ` : ""}${site(r.target)}` : quoted(r.label || "(no words on it)");
  const clickSub = (r) => join(
    r.type === "link" && r.target && (r.target.startsWith("#") ? "jumps down the page" : `goes to ${r.target}`),
    r.type === "toggle" && (r.target === "close" ? "closed" : "opened"),
    r.type === "download" && r.label && `link ${quoted(r.label)}`,
    r.item && `${forWord(r.item)} ${r.item}`, r.area && !inSearch(r.item) && `in ${r.area}`, onPage(r),
  );

  const CARDS = [
    { id: "clicked", title: "What people clicked", wide: true, note: "Every link, button, menu and tab, named by the words on it and where it was on the page", tabs: [
      { label: "Everything clicked", key: "clicked", head: "What was clicked", badge: (r) => KINDS[r.type], name: clickName, sub: clickSub, cols: [["count", "Clicks", num], ["visitors", "Visitors", num]] },
      { label: "Where on the page", key: "areas", head: "Part of the page", name: (r) => r.name, cols: [["count", "Clicks", num], ["visitors", "Visitors", num]] },
      { label: "Pages with clicks", key: "clickPages", head: "Page", name: (r) => r.path, sub: (r) => r.title, cols: [["count", "Clicks", num], ["visitors", "Visitors", num]] },
      { label: "Searches", key: "searches", head: "Words searched for", name: (r) => quoted(r.name), sub: (r) => r.area && `in ${r.area}`, cols: [["count", "Times", num], ["visitors", "Visitors", num]] },
      { label: "Form choices", key: "choices", head: "Option picked", name: (r) => quoted(r.name), sub: (r) => r.field && `in the field ${quoted(r.field)}`, cols: [["count", "Times", num], ["visitors", "Visitors", num]] },
    ] },
    { id: "pages", title: "Pages", tabs: [
      { label: "Top pages", key: "pages", head: "Page", name: (r) => r.path, sub: (r) => r.title, cols: [["views", "Views", num], ["visitors", "Visitors", num], ["avgTime", "Time", dur]] },
      { label: "Entry pages", key: "entries", head: "First page of the visit", name: (r) => r.path, sub: (r) => r.title, cols: [["visits", "Visits", num]] },
    ] },
    { id: "sources", title: "Sources", tabs: [
      { label: "Referrers", key: "sources", head: "Where the visit came from", name: (r) => r.name, cols: [["visits", "Visits", num]] },
      { label: "Campaigns", key: "campaigns", head: "Campaign (utm_campaign)", name: (r) => r.name, sub: (r) => join(r.source, r.medium), cols: [["visits", "Visits", num]] },
    ] },
    { id: "orgs", title: "Organisations", note: "Who holds the network each visit came from", tabs: [
      { label: "Organisations", key: "orgs", head: "Organisation", name: (r) => r.name, sub: (r) => `last visit ${ago(r.last)}`, cols: [["visitors", "Visitors", num], ["views", "Views", num]] },
      { label: "Internet providers", key: "providers", head: "Home, mobile or cloud network", name: (r) => r.name, cols: visitors },
    ] },
    { id: "locations", title: "Locations", note: "States from the visitor's time zone, cities from their address", tabs: [
      { label: "Region", key: "regions", head: "Region", name: (r) => r.name, cols: visitors },
      { label: "City", key: "cities", head: "City (approximate)", name: (r) => r.name, cols: visitors },
    ] },
    { id: "devices", title: "Devices", tabs: [
      { label: "Device", key: "devices", head: "Device", name: (r) => r.name || "Unknown", cols: visitors },
      { label: "Browser", key: "browsers", head: "Browser", name: (r) => r.name || "Unknown", cols: visitors },
      { label: "OS", key: "os", head: "Operating system", name: (r) => r.name || "Unknown", cols: visitors },
    ] },
    { id: "downloads", title: "Document downloads", note: "Datasheets, white papers and software", tabs: [
      { label: "Documents", key: "downloads", head: "Document", name: (r) => fileName(r.target), sub: (r) => join(r.label, onPage(r)), cols: [["count", "Clicks", num], ["visitors", "Visitors", num]] },
    ] },
    { id: "enquiries", title: "Enquiries", note: "People getting in touch from the site", tabs: [
      { label: "Email and phone", key: "contacts", head: "Address or number clicked", name: (r) => contact(r.target), sub: onPage, cols: [["count", "Clicks", num]] },
      { label: "Forms", key: "forms", head: "Form and topic", name: (r) => r.name, sub: onPage, cols: [["count", "Sent", num]] },
    ] },
    { id: "outbound", title: "Links to other sites", tabs: [
      { label: "Outbound", key: "outbound", head: "Link", name: (r) => site(r.target), sub: (r) => join(r.label, onPage(r)), cols: [["count", "Clicks", num]] },
    ] },
    { id: "notfound", title: "Pages not found", note: "Broken or old links people followed", tabs: [
      { label: "404s", key: "notFound", head: "Address", name: (r) => r.path, sub: (r) => r.linkedFrom && `linked from ${r.linkedFrom}`, cols: [["count", "Hits", num]] },
    ] },
  ];

  function barList(rows, tab, open) {
    const wrap = h("div", "list");
    if (!rows?.length) { wrap.append(h("p", "empty", "Nothing recorded in this period.")); return wrap; }
    wrap.style.setProperty("--cols", tab.cols.length);
    const head = h("div", "list-head");
    head.append(h("span", null, tab.head), ...tab.cols.map(([, label]) => h("span", "v", label)));
    const [key] = tab.cols[0];
    const max = Math.max(1, ...rows.map((r) => r[key] || 0));
    const ol = h("ol", "bars");
    for (const r of rows.slice(0, open ? rows.length : 8)) {
      const li = h("li");
      li.style.setProperty("--w", `${((r[key] || 0) / max) * 100}%`);
      const name = h("span", "name");
      const text = String(tab.name(r) ?? "");
      const t = h("span", "t", text);
      t.title = text;
      const badge = tab.badge?.(r);
      if (badge) t.prepend(h("span", `ev-tag small ${badge[1]}`, badge[0]));
      name.append(t);
      const sub = tab.sub?.(r);
      if (sub) name.append(h("small", null, sub));
      li.append(name, ...tab.cols.map(([k, , fmt]) => h("span", "v", fmt(r[k]))));
      ol.append(li);
    }
    wrap.append(head, ol);
    return wrap;
  }

  function renderCards() {
    const box = $("#cards");
    box.textContent = "";
    for (const card of CARDS) {
      const cs = cardState.get(card.id) || { tab: 0, open: false };
      cardState.set(card.id, cs);
      const tab = card.tabs[cs.tab];
      const rows = state.data[tab.key] || [];
      const el = h("section", card.wide ? "card wide" : "card");
      el.setAttribute("aria-labelledby", `${card.id}-title`);
      const head = h("div", "card-head");
      const titles = h("div");
      const h2 = h("h2", null, card.title);
      h2.id = `${card.id}-title`;
      titles.append(h2);
      if (card.note) titles.append(h("p", "sub", card.note));
      head.append(titles);
      if (card.tabs.length > 1) {
        const tabs = h("div", "tabs");
        tabs.setAttribute("role", "tablist");
        card.tabs.forEach((t, i) => {
          const b = h("button", null, t.label);
          b.type = "button";
          b.setAttribute("role", "tab");
          b.setAttribute("aria-selected", String(i === cs.tab));
          b.addEventListener("click", () => { cs.tab = i; cs.open = false; renderCards(); });
          tabs.append(b);
        });
        head.append(tabs);
      }
      el.append(head, barList(rows, tab, cs.open));
      if (rows.length > 8) {
        const more = h("button", "more", cs.open ? "Show fewer" : `Show all ${rows.length}`);
        more.type = "button";
        more.addEventListener("click", () => { cs.open = !cs.open; renderCards(); });
        el.append(more);
      }
      box.append(el);
    }
  }

  /* ---- visitor activity: each visit, step by step ---- */
  const DEVICE = { Desktop: "monitor", Mobile: "smartphone", Tablet: "tablet" };
  // The clock time, with how long ago for today's visits: "12:45 pm, 5 min ago".
  // Earlier days get the day too, so 11 pm yesterday never reads as today.
  const fTime = new Intl.DateTimeFormat("en-AU", { timeZone: dash.dataset.tz, hour: "numeric", minute: "2-digit" });
  const fDate = new Intl.DateTimeFormat("en-CA", { timeZone: dash.dataset.tz });
  const ago = (ts) => {
    if (fDate.format(ts) !== fDate.format(Date.now())) return fWhen.format(ts);
    const sec = (Date.now() - ts) / 1000;
    const rel = sec < 60 ? "just now" : sec < 3600 ? `${Math.floor(sec / 60)} min ago` : `${Math.floor(sec / 3600)} h ago`;
    return `${fTime.format(ts)}, ${rel}`;
  };
  const fClock = new Intl.DateTimeFormat("en-AU", { timeZone: dash.dataset.tz, hour: "numeric", minute: "2-digit", second: "2-digit" });
  const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  // "Sewer Flow Monitoring | EDS" is the page "Sewer Flow Monitoring".
  const pageName = (st) => (st.path === "/" ? "Home" : (st.title || "").split(" | ")[0] || st.path);

  // Each step as a coloured tag and a sentence: plain words, with what was
  // clicked or searched for in quotes and the thing it was about in bold.
  function describe(st) {
    const q = (v) => h("q", null, v || "(no words on it)");
    const b = (v) => h("b", null, v);
    const forItem = !st.item ? [] : inSearch(st.item) ? [` in ${st.item}`] : [" for ", b(st.item)];
    const area = st.area && `in ${st.area}`;
    switch (st.type) {
      case "pageview":
        if (st.status === 404) return { tag: "Not found", cls: "t-warn", icon: "triangle-alert", what: ["Tried to open a page that does not exist: ", b(st.path)] };
        return { tag: "Page view", cls: "t-page", icon: "file-text", what: ["Viewed the page ", b(pageName(st))],
          where: [st.path, st.engaged >= 1000 && `on screen for ${dur(st.engaged)}`, st.scroll != null && `scrolled ${st.scroll}% of the way down`] };
      case "link":
        if (st.target?.startsWith("#")) return { tag: "Link click", cls: "t-click", icon: "hash", what: ["Clicked ", q(st.label), " to jump down the page", ...forItem], where: [area] };
        return { tag: "Link click", cls: "t-click", icon: "link", what: ["Clicked the link ", q(st.label), ...forItem], where: [st.target && `goes to ${st.target}`, !inSearch(st.item) && area] };
      case "button":
        return { tag: "Button click", cls: "t-click", icon: "mouse-pointer-click", what: ["Clicked the button ", q(st.label), ...forItem], where: [area] };
      case "toggle":
        return { tag: st.target === "close" ? "Closed" : "Opened", cls: "t-click", icon: "chevrons-up-down", what: [st.target === "close" ? "Closed " : "Opened ", q(st.label), ...forItem], where: [area] };
      case "tab":
        return { tag: "Tab", cls: "t-click", icon: "panels-top-left", what: ["Switched to the tab ", q(st.label), ...forItem], where: [area] };
      case "download":
        return { tag: "Download", cls: "t-goal", icon: "file-down", what: ["Downloaded ", b(fileName(st.target)), ...forItem], where: [st.label && `from the link ${quoted(st.label)}`, area] };
      case "contact":
        return /^tel:/i.test(st.target)
          ? { tag: "Phone", cls: "t-goal", icon: "phone", what: ["Tapped the phone number ", b(contact(st.target))], where: [area] }
          : { tag: "Email", cls: "t-goal", icon: "mail", what: ["Clicked the email address ", b(contact(st.target))], where: [area] };
      case "form":
        return { tag: "Form sent", cls: "t-goal", icon: "send", what: ["Sent the form ", q(st.label)], where: [area] };
      case "outbound":
        return { tag: "Left the site", cls: "t-leave", icon: "external-link", what: ["Followed a link to another site: ", b(site(st.target))], where: [st.label && `the link ${quoted(st.label)}`, area] };
      case "search":
        return { tag: "Search", cls: "t-search", icon: "search", what: ["Searched for ", q(st.label)], where: [area] };
      case "choice":
        return /^(Un)?ticked /.test(st.label || "")
          ? { tag: "Choice", cls: "t-search", icon: "list-checks", what: [st.label, ...forItem], where: [area] }
          : { tag: "Choice", cls: "t-search", icon: "list-checks", what: ["Picked ", q(st.label), ...(st.item ? [" in the field ", b(st.item)] : [])], where: [area] };
      default:
        return { tag: st.type, cls: "t-click", icon: "mouse-pointer-click", what: [st.label || st.type], where: [area] };
    }
  }

  // "3m", "45s", "1h 5m": short enough to sit inside a page chip
  const short = (ms) => {
    const t = Math.round(ms / 1000);
    return t < 60 ? `${t}s` : t < 3600 ? `${Math.round(t / 60)}m` : `${Math.floor(t / 3600)}h ${Math.round((t % 3600) / 60)}m`;
  };
  const isPhone = (st) => st.type === "contact" && /^tel:/i.test(st.target || "");
  const isEmail = (st) => st.type === "contact" && !isPhone(st);
  const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
  const uniq = (xs) => [...new Set(xs.filter(Boolean))];
  const cap = (t) => `${t[0].toUpperCase()}${t.slice(1)}`;

  // Everything worth knowing about a visit, worked out once from its steps.
  function profile(v) {
    const of = (test) => v.steps.filter(typeof test === "string" ? (st) => st.type === test : test);
    const views = of("pageview");
    const pages = views.filter((st) => st.status !== 404);
    const reading = pages.reduce((a, st) => a + (st.engaged || 0), 0);
    const longest = pages.reduce((a, st) => ((st.engaged || 0) > (a?.engaged || 0) ? st : a), null);
    const deepest = pages.reduce((a, st) => (st.scroll != null && st.scroll > (a?.scroll ?? -1) ? st : a), null);
    const p = {
      views, pages, reading, longest, deepest,
      names: uniq(pages.map(pageName)),
      notFound: uniq(views.filter((st) => st.status === 404).map((st) => st.path)),
      searches: uniq(of("search").map((st) => st.label)),
      choices: of("choice"),
      downloads: uniq(of("download").map((st) => fileName(st.target))),
      forms: of("form"),
      phones: uniq(of(isPhone).map((st) => contact(st.target))),
      emails: uniq(of(isEmail).map((st) => contact(st.target))),
      outbound: uniq(of("outbound").map((st) => site(st.target).split("/")[0])),
      // what they looked at: the products, services and questions their clicks were about
      topics: uniq(v.steps.map((st) => (st.item && st.type !== "choice" && !inSearch(st.item) ? st.item : null))),
    };
    const touched = p.forms.length || p.phones.length || p.emails.length;
    p.level = touched ? 4
      : p.downloads.length || p.searches.length || p.names.length >= 3 || reading >= 120e3 ? 3
      : views.length >= 2 || reading >= 30e3 || v.end - v.start >= 60e3 || v.clicks > 0 ? 2 : 1;
    return p;
  }
  const LEVELS = {
    4: ["Got in touch", "Sent a form, or clicked the phone number or an email address"],
    3: ["Strong interest", "Downloaded something, searched, read 3 or more pages or spent 2 minutes or more reading"],
    2: ["Browsing", "Opened more than one page, clicked something, read for 30 seconds or stayed a minute or more"],
    1: ["Quick look", "One page, under 30 seconds of reading, no clicks"],
  };

  // The visit in one sentence, what they did first and foremost: "Viewed Home,
  // Sewer Flow Monitoring and Contact, downloaded fl900.pdf and sent the form …".
  function story(v, p) {
    const some = (xs, one, many) => (!xs.length ? null : xs.length === 1 ? `${one} ${xs[0]}` : many(xs.length));
    const parts = [
      p.names.length && `viewed ${p.names.length > 4 ? `${andList(p.names.slice(0, 3))} and ${p.names.length - 3} more pages` : andList(p.names)}`,
      some(p.searches.map(quoted), "searched for", (n) => `ran ${n} searches`),
      some(p.downloads, "downloaded", (n) => `downloaded ${n} documents`),
      some(p.forms.map((st) => quoted(st.label)), "sent the form", (n) => `sent ${n} forms`),
      p.phones.length && "clicked the phone number",
      some(p.emails, "clicked the email address", (n) => `clicked ${n} email addresses`),
      some(p.outbound, "left for", (n) => `followed links to ${n} other sites`),
      p.notFound.length && `hit ${p.notFound.length === 1 ? "a missing page" : `${p.notFound.length} missing pages`}`,
    ].filter(Boolean);
    return `${cap(andList(parts) || "opened the site")}.`;
  }
  // The things that matter most, as badges beside who it was.
  function outcomes(p) {
    return [
      p.forms.length && ["send", p.forms.length > 1 ? `Sent ${p.forms.length} forms` : "Sent a form"],
      p.phones.length && ["phone", "Clicked the phone number"],
      p.emails.length && ["mail", "Clicked an email address"],
      p.downloads.length && ["file-down", p.downloads.length > 1 ? `Downloaded ${p.downloads.length} documents` : "Downloaded a document"],
    ].filter(Boolean);
  }

  // Who the visit was: an organisation by name, otherwise where they were.
  const NETWORK = {
    organisation: "Organisation's own network",
    provider: "Home, office or mobile internet",
    hosting: "Cloud network, often a VPN, Private Relay or a bot",
  };
  const place = (v) => [v.city, v.region].filter(Boolean).join(", ");
  function who(v) {
    const isOrg = v.orgKind === "organisation";
    return {
      isOrg,
      name: isOrg ? v.org : place(v) || "Unknown location",
      network: v.orgKind ? `${NETWORK[v.orgKind] || "Network"}${!isOrg && v.org ? ` (${v.org})` : ""}` : null,
      where: isOrg ? place(v) : null,
    };
  }

  function levelBadge(level) {
    const [label, why] = LEVELS[level];
    const b = h("span", `level lvl-${level}`);
    b.title = why;
    const bars = h("span", "level-bars");
    bars.setAttribute("aria-hidden", "true");
    for (let i = 1; i <= 4; i++) bars.append(h("i", i <= level ? "on" : null));
    b.append(bars, h("span", null, label));
    return b;
  }

  // One row per action, under the page it happened on.
  function actionRow(st, start) {
    const d = describe(st);
    const li = h("li", `ev ${d.cls}`);
    li.append(stamp(st.ts, start));
    const tag = h("span", `ev-tag small ${d.cls}`);
    tag.append(icon(d.icon), d.tag);
    const body = h("div", "ev-body");
    const what = h("p", "ev-what");
    what.append(tag, ...d.what.filter((x) => x !== "" && x != null));
    body.append(what);
    const where = join(...(d.where || []));
    if (where) body.append(h("p", "ev-where", where));
    li.append(body);
    return li;
  }
  // the clock time, and how far into the visit it was
  function stamp(ts, start) {
    const t = h("time", "stamp");
    t.dateTime = new Date(ts).toISOString();
    t.append(h("span", null, fClock.format(ts)), h("small", null, ts - start < 1000 ? "arrived" : `+${dur(ts - start)}`));
    return t;
  }
  // a small bar: how long a page was on screen, or how far down it was read
  function meter(frac, text, label) {
    const m = h("span", "meter");
    m.title = label;
    const bar = h("span", "meter-bar");
    const fill = h("i");
    fill.style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`;
    bar.append(fill);
    m.append(bar, h("span", null, text));
    return m;
  }
  function timeline(v, p) {
    const tl = h("ol", "timeline");
    tl.setAttribute("aria-label", `Everything this visitor did, in order, ${fWhen.format(v.start)}`);
    const most = Math.max(1, ...p.pages.map((st) => st.engaged || 0));
    let group = null;
    const open = (st) => {
      const li = h("li", "tl-page");
      const head = h("div", "tl-head");
      if (st) {
        const d = describe(st);
        head.append(stamp(st.ts, v.start));
        const main = h("div", "tl-main");
        const title = h("p", "tl-title");
        title.append(icon(d.icon), st.status === 404 ? h("b", null, `${st.path} (page not found)`) : h("b", null, pageName(st)));
        if (st.status !== 404) title.append(h("span", "tl-path", st.path));
        main.append(title);
        if (st.status !== 404 && (st.engaged != null || st.scroll != null)) {
          const ms = h("div", "meters");
          if (st.engaged != null) ms.append(meter((st.engaged || 0) / most, `${dur(st.engaged)} on screen`, "Time the page was on screen"));
          if (st.scroll != null) ms.append(meter(st.scroll / 100, `read ${st.scroll}% of the way down`, "How far down the page they scrolled"));
          main.append(ms);
        }
        head.append(main);
      } else head.append(h("p", "tl-title muted", "Before the first page view was recorded"));
      group = h("ol", "tl-actions");
      li.append(head, group);
      tl.append(li);
    };
    for (const st of v.steps) {
      if (st.type === "pageview") open(st);
      else { if (!group) open(null); group.append(actionRow(st, v.start)); }
    }
    return tl;
  }

  // Every fact about the visit and the visitor, as labelled rows.
  function facts(v, p, w) {
    const dl = h("dl", "facts");
    const row = (label, ...values) => {
      const vals = values.flat().filter((x) => x != null && x !== "" && x !== false);
      if (!vals.length) return;
      const dd = h("dd");
      vals.forEach((x, i) => { if (i) dd.append(h("br")); dd.append(typeof x === "string" ? h("span", null, x) : x); });
      dl.append(h("dt", null, label), dd);
    };
    const small = (t) => h("small", null, t);
    row("Organisation", w.isOrg ? v.org : null, w.isOrg && v.orgVisits > 1 ? small(`Visit ${v.orgVisitNo} of ${v.orgVisits} from them in this period`) : null);
    row("Network", w.network);
    row("Location", place(v), v.country && v.country !== "AU" && v.region !== regionName(v.country) ? regionName(v.country) : null, v.city ? small("City is approximate, from the IP address") : null);
    row("Device", join(v.device, v.browser && v.os && `${v.browser} on ${v.os}`));
    row("Came from", v.source || "Typed the address, a bookmark or a link in an app", v.referrer && v.referrer !== v.source ? small(v.referrer) : null);
    row("Campaign", v.campaign && join(v.campaign, v.medium));
    row("When", `${fWhen.format(v.start)}${v.end - v.start >= 60e3 ? ` to ${fTime.format(v.end)}` : ""}`, v.end - v.start >= 1000 ? small(`${dur(v.end - v.start)} on the site`) : null);
    row("Earlier today", v.visitNo > 1 ? `${ordinal(v.visitNo)} visit today from this browser and network` : null);
    row("Landed on", p.views[0] && (p.views[0].status === 404 ? `${p.views[0].path} (not found)` : pageName(p.views[0])), p.views[0] && small(p.views[0].path));
    if (p.views.length > 1) row("Left from", pageName(p.views[p.views.length - 1]));
    row("Pages", `${plural(p.views.length, "page view")}${p.names.length !== p.views.length ? `, ${plural(p.names.length, "different page")}` : ""}`,
      p.reading >= 1000 ? small(`${dur(p.reading)} reading in all`) : null);
    row("Most time on", p.longest?.engaged >= 1000 ? `${pageName(p.longest)} (${dur(p.longest.engaged)})` : null);
    row("Read furthest", p.deepest && p.deepest.scroll > 0 ? `${p.deepest.scroll}% of ${pageName(p.deepest)}` : null);
    row("Looked at", p.topics.slice(0, 8).join(", ") || null, p.topics.length > 8 ? small(`and ${p.topics.length - 8} more`) : null);
    row("Clicks", v.clicks ? nf.format(v.clicks) : null);
    row("Searched for", p.searches.map(quoted).join(", ") || null);
    row("Picked", p.choices.map((st) => (st.item ? `${quoted(st.label)} in ${st.item}` : st.label)));
    row("Downloaded", p.downloads);
    row("Got in touch", p.forms.map((st) => `Sent the form ${quoted(st.label)}`), p.phones.map((x) => `Clicked the phone number ${x}`), p.emails.map((x) => `Clicked ${x}`));
    row("Left for", p.outbound.join(", ") || null);
    row("Missing pages", p.notFound);
    return dl;
  }
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const regionName = (code) => { try { return regionNames.of(code); } catch { return code; } };

  // the visit at a glance: pages as their names (with time on screen), actions as coloured chips
  function chip(st) {
    const d = describe(st);
    const li = h("li");
    const c = h("span", `step ${d.cls}`);
    const name = st.type === "pageview" ? (st.status === 404 ? `${st.path} (not found)` : pageName(st)) : d.what.map((x) => (typeof x === "string" ? x : x.textContent)).join("");
    c.title = st.type === "pageview" && st.engaged >= 1000 ? `${name}, ${dur(st.engaged)} on screen` : name;
    c.append(icon(d.icon), h("span", null, name));
    if (st.type === "pageview" && st.engaged >= 1000) c.append(h("small", null, short(st.engaged)));
    li.append(c);
    return li;
  }

  const vstate = { show: "all", list: [], total: 0, counts: null, open: new Set() };
  const rangeQuery = () => {
    const q = new URLSearchParams({ range: state.range });
    if (state.range === "custom") { q.set("from", state.from); q.set("to", state.to); }
    return q;
  };
  // `more` adds the next page; otherwise the list reloads, keeping as many visits as are shown.
  async function loadVisits(more = false) {
    const period = rangeQuery().toString();
    if (period !== vstate.period) { vstate.period = period; vstate.list = []; }
    const q = rangeQuery();
    q.set("show", vstate.show);
    q.set("offset", more ? vstate.list.length : 0);
    q.set("limit", more ? 20 : Math.min(100, Math.max(20, vstate.list.length)));
    const key = q.toString();
    vstate.key = key;
    const res = await fetch(`/admin/api/visits?${q}`);
    if (res.status === 401) return location.reload();
    const d = await res.json();
    if (vstate.key !== key) return;
    vstate.total = d.total;
    vstate.counts = d.counts;
    vstate.list = more ? [...vstate.list, ...d.visits.filter((v) => !vstate.list.some((x) => x.id === v.id))] : d.visits;
    renderVisits();
  }

  const SHOWN = { all: "visits", orgs: "visits from named organisations", contacted: "visits where someone got in touch", downloaded: "visits with a download", clicked: "visits where someone clicked something" };
  function renderVisits() {
    const { list, total, counts } = vstate;
    for (const b of $("#visit-filter").children) {
      const n = b.querySelector(".n");
      if (n) n.textContent = counts ? nf.format(counts[b.dataset.show] ?? 0) : "";
    }
    const box = $("#visits");
    box.textContent = "";
    const label = SHOWN[vstate.show];
    $("#visit-count").textContent = total ? `Showing ${nf.format(list.length)} of ${nf.format(total)} ${label}, newest first` : "";
    const more = $("#visits-more");
    more.hidden = list.length >= total;
    more.textContent = `Show ${Math.min(20, total - list.length)} more visits`;
    if (!list.length) { box.append(h("li", "empty", `No ${label} in this period.`)); return; }
    for (const v of list) {
      const p = profile(v);
      const w = who(v);
      const li = h("li", `visit lvl-${p.level}`);
      const det = h("details");
      det.open = vstate.open.has(v.id);
      det.addEventListener("toggle", () => (det.open ? vstate.open.add(v.id) : vstate.open.delete(v.id)));
      const sum = h("summary", "visit-head");

      // who, where from and on what; when, and for how long
      const top = h("div", "visit-top");
      const avatar = h("span", `avatar${w.isOrg ? " org" : ""}`);
      avatar.append(icon(w.isOrg ? "building-2" : DEVICE[v.device] || "monitor"));
      const id = h("div", "who");
      const line = h("p", "who-name");
      line.append(h("b", null, w.name));
      if (v.live) line.append(h("span", "live-badge", "On the site now"));
      id.append(line, h("p", "who-sub", join(w.where, w.network, join(v.device, v.browser && v.os && `${v.browser} on ${v.os}`))));
      const when = h("div", "when");
      const t = h("time", null, ago(v.start));
      t.dateTime = new Date(v.start).toISOString();
      t.title = fWhen.format(v.start);
      when.append(t);
      if (v.end - v.start >= 1000) when.append(h("span", null, `${dur(v.end - v.start)} on the site`));
      top.append(avatar, id, when);

      // how interested, what they achieved, and whether they have been before
      const badges = h("div", "visit-badges");
      badges.append(levelBadge(p.level));
      for (const [ic, text] of outcomes(p)) { const b = h("span", "goal-badge t-goal"); b.append(icon(ic), text); badges.append(b); }
      if (w.isOrg && v.orgVisits > 1) { const b = h("span", "info-badge"); b.append(icon("building-2"), `${ordinal(v.orgVisitNo)} of ${v.orgVisits} visits from them this period`); badges.append(b); }
      if (v.visitNo > 1) { const b = h("span", "info-badge"); b.append(icon("users"), `${ordinal(v.visitNo)} visit today`); b.title = "The same browser and network came earlier today"; badges.append(b); }
      const src = h("span", "info-badge");
      src.append(icon("route"), v.source ? `From ${v.source}` : "Typed address or bookmark");
      if (v.referrer) src.title = `Referrer: ${v.referrer}`;
      badges.append(src);

      const preview = h("ol", "journey");
      const shown = v.steps.slice(0, 14);
      shown.forEach((st) => preview.append(chip(st)));
      if (v.steps.length > shown.length) preview.append(h("li", "muted", `+${v.steps.length - shown.length} more`));
      const hint = h("span", "visit-open");
      hint.append(icon("chevron-right"), h("span", "closed-only", "See everything about this visit"), h("span", "open-only", "Hide details"));
      sum.append(top, badges, h("p", "visit-story", story(v, p)), preview, hint);

      const body = h("div", "visit-body");
      const about = h("section", "visit-about");
      about.append(h("h3", null, "About this visit"), facts(v, p, w));
      const steps = h("section", "visit-steps");
      steps.append(h("h3", null, `Step by step: ${plural(p.views.length, "page")}, ${plural(v.steps.length - p.views.length, "action")}`), timeline(v, p));
      body.append(about, steps);
      det.append(sum, body);
      li.append(det);
      box.append(li);
    }
  }
  $("#visit-filter").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.dataset.show === vstate.show) return;
    vstate.show = b.dataset.show;
    for (const x of $("#visit-filter").children) x.setAttribute("aria-pressed", String(x === b));
    vstate.list = [];
    loadVisits();
  });
  $("#visits-more").addEventListener("click", () => loadVisits(true));

  /* ---- controls ---- */
  $("#ranges").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const custom = $("#custom");
    if (b.dataset.range === "custom") {
      custom.hidden = false;
      if (state.data && !custom.elements.from.value) { custom.elements.from.value = state.data.range.from; custom.elements.to.value = state.data.range.to; }
      custom.elements.from.focus();
      return;
    }
    custom.hidden = true;
    state.range = b.dataset.range;
    saved.set("eds-admin-range", state.range);
    load();
  });
  $("#custom").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target.elements;
    Object.assign(state, { range: "custom", from: f.from.value, to: f.to.value });
    load();
  });
  $("#table-toggle").addEventListener("click", () => { state.table = !state.table; renderChart(); });

  const chartBox = $("#chart");
  chartBox.tabIndex = 0;
  chartBox.setAttribute("aria-label", "Chart. Use the left and right arrow keys to read values.");
  chartBox.addEventListener("keydown", (e) => {
    if (!hover || !["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(e.key)) return;
    e.preventDefault();
    if (e.key === "Escape") return hover.hide();
    const i = hover.at() < 0 ? hover.last : hover.at();
    hover.show(e.key === "Home" ? 0 : e.key === "End" ? hover.n - 1 : Math.max(0, Math.min(hover.n - 1, i + (e.key === "ArrowLeft" ? -1 : 1))));
  });
  chartBox.addEventListener("focus", () => hover?.show(hover.last));
  chartBox.addEventListener("blur", () => hover?.hide());
  let width = 0;
  new ResizeObserver(([en]) => {
    const w = Math.round(en.contentRect.width);
    if (state.data && !state.table && w !== width) renderChart();
    width = w;
  }).observe(chartBox);

  const ignore = $("#ignore");
  ignore.checked = !!saved.get("eds-analytics-ignore");
  ignore.addEventListener("change", () => saved.set("eds-analytics-ignore", ignore.checked ? "1" : null));

  load();
  loadLive();
  // the visit list follows along while the period includes today
  const refresh = () => { loadLive(); if (state.data?.range.to === state.data?.range.today) loadVisits(); };
  setInterval(() => { if (!document.hidden) refresh(); }, 30e3);
  setInterval(() => { if (!document.hidden && state.data?.range.to === state.data?.range.today) load(); }, 5 * 60e3);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
})();
