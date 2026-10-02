// The analytics dashboard. Fetches /admin/api/stats for the chosen period and
// draws the tiles, the chart and the lists; /admin/api/live feeds the "on the
// site now" count and the latest visits. No libraries: the chart is SVG.
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
    renderVisits(d.visits);
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

  const CARDS = [
    { id: "pages", title: "Pages", tabs: [
      { label: "Top pages", key: "pages", head: "Page", name: (r) => r.path, sub: (r) => r.title, cols: [["views", "Views", num], ["visitors", "Visitors", num], ["avgTime", "Time", dur]] },
      { label: "Entry pages", key: "entries", head: "First page of the visit", name: (r) => r.path, sub: (r) => r.title, cols: [["visits", "Visits", num]] },
    ] },
    { id: "sources", title: "Sources", tabs: [
      { label: "Referrers", key: "sources", head: "Where the visit came from", name: (r) => r.name, cols: [["visits", "Visits", num]] },
      { label: "Campaigns", key: "campaigns", head: "Campaign (utm_campaign)", name: (r) => r.name, sub: (r) => join(r.source, r.medium), cols: [["visits", "Visits", num]] },
    ] },
    { id: "locations", title: "Locations", note: "Australian states from the visitor's time zone", tabs: [
      { label: "Region", key: "regions", head: "Region", name: (r) => r.name, cols: visitors },
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
      const el = h("section", "card");
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

  /* ---- latest visits ---- */
  const DEVICE = { Desktop: "monitor", Mobile: "smartphone", Tablet: "tablet" };
  const ago = (ts) => {
    const sec = (Date.now() - ts) / 1000;
    if (sec < 60) return "just now";
    if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
    return fWhen.format(ts);
  };
  function step(st) {
    const li = h("li");
    const chip = h("span", "step");
    let name = "file-text", text = st.path, title = st.title || st.path;
    if (st.type === "pageview" && st.status === 404) { name = "triangle-alert"; chip.classList.add("warn"); text = `${st.path} (not found)`; }
    else if (st.type === "download") { name = "file-down"; text = fileName(st.target); title = st.target; }
    else if (st.type === "contact") { name = /^tel:/i.test(st.target) ? "phone" : "mail"; text = contact(st.target); title = st.target; }
    else if (st.type === "outbound") { name = "external-link"; text = site(st.target); title = st.target; }
    else if (st.type === "form") { name = "send"; text = st.label || "Form"; title = text; }
    if (st.type !== "pageview") chip.classList.add("act");
    chip.title = title;
    chip.append(icon(name), h("span", null, text));
    li.append(chip);
    return li;
  }
  function renderVisits(visits) {
    const box = $("#visits");
    box.textContent = "";
    if (!visits.length) { box.append(h("li", "empty", "No visits yet.")); return; }
    for (const v of visits) {
      const li = h("li", "visit");
      const head = h("div", "visit-head");
      const pages = v.steps.filter((x) => x.type === "pageview").length;
      head.append(icon(DEVICE[v.device] || "monitor"), h("b", null, v.region), h("span", null, join(v.browser && v.os && `${v.browser} on ${v.os}`, `from ${v.source}`, `${pages} ${pages === 1 ? "page" : "pages"}`, v.end - v.start >= 1000 && dur(v.end - v.start))));
      const when = h("time", null, ago(v.start));
      when.dateTime = new Date(v.start).toISOString();
      when.title = fWhen.format(v.start);
      head.append(when);
      const journey = h("ol", "journey");
      v.steps.forEach((st) => journey.append(step(st)));
      li.append(head, journey);
      box.append(li);
    }
  }

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
  setInterval(() => { if (!document.hidden) loadLive(); }, 30e3);
  setInterval(() => { if (!document.hidden && state.data?.range.to === state.data?.range.today) load(); }, 5 * 60e3);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) loadLive(); });
})();
