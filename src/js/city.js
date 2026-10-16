// The interactive city: selection, the storm, the underground view, the
// sensor readouts and the HUD. city-scene.js draws the
// scene as two SVGs (the still city and an overlay of everything that moves);
// every visible word comes from the JSON block the build writes from
// content.mjs (city, cityUi and cityStorm).
//
// Nothing changes by itself or on hover alone: a district lifts on a click,
// a tap or keyboard focus (or when the visitor runs the storm), and a
// sensor's readout opens on a click. Hovering only brightens what would be
// picked. The ambient animation (traffic, pings, flows) always runs.
(() => {
  const svg = document.getElementById("city"), dataEl = document.getElementById("city-data");
  if (!svg || !dataEl || !window.CityScene) return;
  const data = JSON.parse(dataEl.textContent);
  const { ui, storm: stormData, zones: zoneData } = data;
  const sc = CityScene.build(svg, data);
  const layers = [svg, sc.fx];
  const cls = (name, on) => layers.forEach((s) => s.classList.toggle(name, on));
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const section = svg.closest(".city-section"), stage = svg.closest(".city-stage");
  const cards = $$(".city-card"), tabs = $$(".city-tab"), caption = $(".city-caption"), liveEl = $("#city-live");
  const btn = { storm: $('.city-btn[data-act="storm"]'), under: $('.city-btn[data-act="under"]'), expand: $('.city-btn[data-act="expand"]') };
  const grid = $("#city-grid"), closeBtn = $(".city-close");
  const tiles = Object.fromEntries($$(".city-tile[data-tile]").map((t) => [t.dataset.tile, t]));
  const tip = $(".city-tip"), tipBody = $(".city-tip-body"), tipClose = $(".city-tip-close");
  const zoneOf = Object.fromEntries(zoneData.map((z) => [z.id, z]));
  const sensorOf = {};
  zoneData.forEach((z) => z.sensors.forEach((s) => { sensorOf[s.id] = { ...s, zone: z.id }; }));
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const order = zoneData.map((z) => z.id);
  const ZONE_IDS = Object.keys(sc.zones);

  const state = { active: null, under: false, expanded: false, inView: false, storm: null };
  let liveTimer = 0;
  const announce = (text) => {
    if (!liveEl || !text) return;
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { liveEl.textContent = ""; liveEl.textContent = text; }, 250);
  };
  const fill = (tpl, vars) => String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  const setCaption = (text) => { if (caption) caption.textContent = text || caption.dataset.rest || ""; };
  const cardOf = (id) => cards.find((c) => c.dataset.zone === id);

  /* ---- selection ---- */
  // The active district (and its overlay twin) moves to the end of its layer
  // the frame before it lifts, so it paints over taller neighbours; the
  // previous one goes back to its slot in depth order.
  const restoreSlot = (id) => {
    for (const [layer, map] of [[sc.zoneLayer, sc.zones], [sc.zoneFxLayer, sc.zoneFx]]) {
      const g = map[id], mine = sc.slots[id];
      const next = [...layer.children].find((c) => c !== g && sc.slots[c.dataset.zone] > mine);
      layer.insertBefore(g, next || null);
    }
  };
  let handTimers = [];
  function handOff(id) {
    handTimers.forEach(clearTimeout); handTimers = [];
    const pings = $$(".ping", sc.zoneFx[id]);
    pings.forEach((p) => p.classList.remove("wake"));
    requestAnimationFrame(() => pings.forEach((p) => p.classList.add("wake")));
    handTimers.push(setTimeout(() => pings.forEach((p) => p.classList.remove("wake")), 1200));
    if (id !== "ops") handTimers.push(setTimeout(() => {
      sc.handMotion.setAttribute("path", sc.links[id].getAttribute("d"));
      sc.hand.classList.add("on");
      sc.handMotion.beginElement();
      handTimers.push(setTimeout(() => { cls("beacon-on", true); handTimers.push(setTimeout(() => cls("beacon-on", false), 400)); }, 780));
      handTimers.push(setTimeout(() => sc.hand.classList.remove("on"), 1000));
    }, 220));
  }
  // Moving a focused district in the DOM blurs it; the refocus that follows
  // must not count as the visitor picking it again.
  let reparenting = false;
  const tabsEl = $(".city-tabs");
  function setActive(id, { announceIt = false } = {}) {
    if (!sc.zones[id]) return;
    const prev = state.active;
    state.active = id;
    if (prev !== id) {
      const focused = document.activeElement;
      reparenting = true;
      if (prev) restoreSlot(prev);
      sc.zoneLayer.appendChild(sc.zones[id]);
      sc.zoneFxLayer.appendChild(sc.zoneFx[id]);
      if (focused && (focused === sc.zones[prev] || focused === sc.zones[id])) focused.focus({ preventScroll: true });
      reparenting = false;
      requestAnimationFrame(apply);
      handOff(id);
      hideTip();
    } else apply();
    const z = zoneOf[id];
    if (announceIt && z) announce(fill(ui.live.select, { name: z.name, services: $$(".city-list a", cardOf(id)).length, products: $$(".chip", cardOf(id)).length }));
    // Where the tabs scroll sideways (phones), bring the selected one into
    // the row. Only the row scrolls: a selection never moves the page.
    const tab = tabs.find((t) => t.dataset.zone === id);
    if (tab && tabsEl && tabsEl.scrollWidth > tabsEl.clientWidth + 1) {
      const off = tab.getBoundingClientRect().left - tabsEl.getBoundingClientRect().left;
      tabsEl.scrollTo({ left: tabsEl.scrollLeft + off - (tabsEl.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
    }
  }
  function apply() {
    const id = state.active;
    cls("has-active", !!id);
    cls("is-underground", state.under);
    cls("is-expanded", state.expanded);
    section.classList.toggle("is-underground", state.under);
    section.classList.toggle("is-expanded", state.expanded);
    for (const k of ZONE_IDS) {
      const on = k === id;
      sc.zones[k].classList.toggle("active", on);
      sc.zoneFx[k].classList.toggle("active", on);
      sc.zones[k].setAttribute("tabindex", on ? "0" : "-1");
      sc.labels[k].classList.toggle("active", on);
      sc.shadows[k].classList.toggle("on", on);
      sc.links[k]?.classList.toggle("on", on || id === "ops");
    }
    cards.forEach((c) => c.classList.toggle("active", c.dataset.zone === id));
    tabs.forEach((t) => { const on = t.dataset.zone === id; t.setAttribute("aria-selected", String(on)); t.setAttribute("tabindex", on ? "0" : "-1"); });
    if (btn.under) { btn.under.setAttribute("aria-pressed", String(state.under)); $("span", btn.under).textContent = state.under ? ui.toolbar.underOn : ui.toolbar.under; }
    drawSpark();
  }
  // A visitor's own pick. Mid-storm, the storm stops moving the selection
  // from then on.
  const user = (id, announceIt) => {
    if (state.storm) state.storm.userTookOver = true;
    setActive(id, { announceIt });
  };

  // Hover only brightens a district's ground and shows its label. It is a
  // class rather than :hover so that crossing one of the district's sensors
  // (which sit in the overlay) does not switch it off and on.
  const setHover = (id, on) => { sc.zones[id]?.classList.toggle("hover", on); sc.labels[id]?.classList.toggle("hover", on); };
  const hitZone = (el) => { const s = el?.closest?.(".sensor"); return s ? sensorOf[s.dataset.sensor]?.zone : null; };
  Object.entries(sc.zones).forEach(([id, g]) => {
    g.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") setHover(id, true); });
    g.addEventListener("pointerleave", (e) => { if (hitZone(e.relatedTarget) !== id) setHover(id, false); });
    g.addEventListener("click", () => user(id, true));
    g.addEventListener("focus", () => { if (!reparenting) user(id, true); });
    g.addEventListener("keydown", (e) => {
      const i = order.indexOf(state.active);
      const by = (dx, dy) => { // nearest district in that direction by rect centre
        const c = (k) => { const [x0, y0, x1, y1] = sc.ZONES[k].rect; return [(x0 + x1) / 2, (y0 + y1) / 2]; };
        const [cx, cy] = c(state.active);
        const cand = ZONE_IDS.filter((k) => k !== state.active).map((k) => { const [x, y] = c(k); const sx = (x - y) - (cx - cy), sy = (x + y) - (cx + cy); return { k, sx, sy }; })
          .filter((o) => (dx && Math.sign(o.sx) === dx && Math.abs(o.sx) > Math.abs(o.sy) * 0.6) || (dy && Math.sign(o.sy) === dy && Math.abs(o.sy) > Math.abs(o.sx) * 0.6))
          .sort((a, b) => Math.hypot(a.sx, a.sy) - Math.hypot(b.sx, b.sy));
        return cand[0]?.k;
      };
      const next = { ArrowRight: order[(i + 1) % order.length], ArrowLeft: order[(i - 1 + order.length) % order.length], ArrowDown: by(0, 1), ArrowUp: by(0, -1), Home: order[0], End: order[order.length - 1] }[e.key];
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("a", cardOf(state.active))?.focus(); return; }
      if (!next) return;
      e.preventDefault();
      user(next, true);
      sc.zones[next].focus({ preventScroll: true });
    });
  });
  tabs.forEach((t) => t.addEventListener("click", () => user(t.dataset.zone, true)));

  /* ---- the sensors: hover brightens, a click opens the readout ---- */
  let openTip = null;
  const tipDocked = () => !fine;
  const highlight = (id) => {
    $$(".city-sensors button").forEach((b) => b.classList.toggle("hi", b.dataset.sensor === id));
    Object.entries(sc.sensors).forEach(([k, n]) => n.classList.toggle("hi", k === id));
  };
  function readValue(s, r, t) {
    if (r.text) return ui.text[r.text] || r.text;
    const level = stormLevel(), phase = (s.id.length * 1.3) % 6.28;
    const v = r.base + (r.swing || 0) * Math.sin(t / 9 + phase) + (r.storm - r.base) * level;
    return v.toFixed(r.decimals || 0);
  }
  // units follow the site's style: "72%" but "41.8 L/s"
  const withUnit = (v, unit) => (unit ? (unit === "%" ? `${v}%` : `${v} ${unit}`) : String(v));
  // the name pills in the scene are sized to their text; in the expanded
  // view the pills of the picked district also carry a reading
  const fitPill = (g) => {
    const t = $(".callout text", g), r = $(".callout rect", g);
    if (!t || !r) return;
    const w = t.getComputedTextLength() + 20;
    if (!(w > 20)) return;
    r.setAttribute("width", w.toFixed(1)); r.setAttribute("x", (+t.getAttribute("x") - w / 2).toFixed(1));
  };
  const fitAll = () => Object.values(sc.sensors).forEach(fitPill);
  function fillPills() {
    const t = performance.now() / 1000;
    for (const [id, g] of Object.entries(sc.sensors)) {
      const s = sensorOf[id], val = $(".cs-val", g);
      if (!val) continue;
      const show = state.expanded && s.zone === state.active, r = s.reads[0];
      const text = show ? ` · ${withUnit(r.text ? (id === "lidott" ? ui.states[lidottState] : readValue(s, r, t)) : readValue(s, r, t), r.unit)}` : "";
      if (val.textContent !== text) { val.textContent = text; fitPill(g); }
    }
    layoutPills();
  }
  // In the expanded view the picked district's pills can collide, so each
  // one that would sit on another is lifted above it, its leader line
  // lengthened to match. Everything goes back to its own spot otherwise.
  function layoutPills() {
    const placed = [];
    const pills = state.active ? $$(".zone-fx.active .callout", sc.fx) : [];
    for (const c of Object.values(sc.sensors).map((g) => $(".callout", g))) {
      if (!c || pills.includes(c)) continue;
      resetPill(c);
    }
    pills.sort((a, b) => +$("rect", a).dataset.y0 - +$("rect", b).dataset.y0 || 0);
    // The district's own name label (raised 20 px while active) is an
    // obstacle too. It sits outside the lifted group, which is scaled 1.07
    // about its origin and raised 14 px, so the label is mapped into the
    // group's own coordinates first.
    const lr = state.expanded && state.active ? $("rect", sc.labels[state.active]) : null;
    if (lr) {
      const [ox, oy] = (sc.zoneFx[state.active].style.transformOrigin || "0px 0px").split(" ").map(parseFloat);
      const x = +lr.getAttribute("x"), y = +lr.getAttribute("y") - 20, w = +lr.getAttribute("width");
      placed.push({ x: ox + (x - ox) / 1.07, w: w / 1.07, y: oy + (y - oy + 14) / 1.07 });
    }
    for (const c of pills) {
      const r = $("rect", c), t = $("text", c), l = $("line", c);
      if (!r.dataset.y0) { r.dataset.y0 = r.getAttribute("y"); t.dataset.y0 = t.getAttribute("y"); l.dataset.y0 = l.getAttribute("y2"); }
      let y = +r.dataset.y0;
      const x0 = +r.getAttribute("x"), w = +r.getAttribute("width");
      // lift it until it clears every pill already placed (a lift can land
      // it on another, so look again until nothing moves)
      for (let guard = 0, moved = state.expanded; moved && guard < 12; guard++) {
        moved = false;
        for (const p of placed) {
          const overlapX = x0 < p.x + p.w + 6 && p.x < x0 + w + 6;
          if (overlapX && Math.abs(y - p.y) < 22) { y = p.y - 22; moved = true; }
        }
      }
      const dy = y - +r.dataset.y0;
      r.setAttribute("y", y.toFixed(1)); t.setAttribute("y", (+t.dataset.y0 + dy).toFixed(1)); l.setAttribute("y2", (+l.dataset.y0 + dy).toFixed(1));
      placed.push({ x: x0, w, y });
    }
  }
  function resetPill(c) {
    const r = $("rect", c), t = $("text", c), l = $("line", c);
    if (!r.dataset.y0 || r.getAttribute("y") === r.dataset.y0) return;
    r.setAttribute("y", r.dataset.y0); t.setAttribute("y", t.dataset.y0); l.setAttribute("y2", l.dataset.y0);
  }
  function fillTip(id) {
    const s = sensorOf[id]; if (!s || !tipBody) return;
    const t = performance.now() / 1000;
    tipBody.innerHTML = `<b></b><small></small><dl>${s.reads.map(() => "<dt></dt><dd></dd>").join("")}</dl>`;
    $("b", tipBody).textContent = s.name; $("small", tipBody).textContent = s.instrument || "";
    const dts = $$("dt", tipBody), dds = $$("dd", tipBody);
    s.reads.forEach((r, i) => { dts[i].textContent = r.label; dds[i].textContent = withUnit(s.id === "lidott" && r.text ? ui.states[lidottState] : readValue(s, r, t), r.unit); });
  }
  // On a mouse the readout floats beside the sensor on the map. On a touch
  // screen it docks in the page: under the map when a sensor on the map was
  // tapped, under the list when a row in the card was tapped, so it always
  // opens where the visitor is looking.
  const tipHome = { parent: tip?.parentNode, next: tip?.nextSibling };
  function showTip(id, fromRow) {
    const g = sc.sensors[id]; if (!g || !tip) return;
    openTip = id; fillTip(id);
    if (tipDocked()) {
      if (fromRow) fromRow.closest("ul").after(tip);
      else if (tip.parentNode !== tipHome.parent) tipHome.parent.insertBefore(tip, tipHome.next);
      tip.hidden = false;
      tip.classList.add("docked");
    } else {
      if (tip.parentNode !== tipHome.parent) tipHome.parent.insertBefore(tip, tipHome.next);
      tip.hidden = false;
      const r = $(".hit", g).getBoundingClientRect(), s = stage.getBoundingClientRect();
      const x = r.left + r.width / 2 - s.left, y = r.top - s.top;
      tip.classList.toggle("flip", x > s.width * 0.6);
      tip.style.left = `${x.toFixed(0)}px`; tip.style.top = `${Math.max(0, y - 10).toFixed(0)}px`;
    }
    requestAnimationFrame(() => tip.classList.add("on"));
    $$(".city-sensors button").forEach((b) => b.setAttribute("aria-expanded", String(b.dataset.sensor === id)));
    highlight(id);
  }
  function hideTip() {
    if (!tip || !openTip) return;
    openTip = null;
    tip.classList.remove("on", "docked");
    setTimeout(() => { if (!openTip) tip.hidden = true; }, 150);
    $$(".city-sensors button[aria-expanded=true]").forEach((b) => b.setAttribute("aria-expanded", "false"));
    highlight(null);
  }
  Object.entries(sc.sensors).forEach(([id, g]) => {
    const hit = $(".hit", g), zone = sensorOf[id].zone;
    hit.addEventListener("pointerenter", (e) => { if (e.pointerType !== "mouse") return; setHover(zone, true); if (!openTip) highlight(id); });
    hit.addEventListener("pointerleave", (e) => { if (e.pointerType !== "mouse") return; if (!sc.zones[zone].contains(e.relatedTarget)) setHover(zone, false); if (!openTip) highlight(null); });
    hit.addEventListener("click", (e) => { e.stopPropagation(); const was = openTip; if (state.active !== zone) user(zone); if (was !== id) showTip(id); else hideTip(); });
  });
  $$(".city-sensors button").forEach((b) => {
    const id = b.dataset.sensor;
    b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && !openTip) highlight(id); });
    b.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !openTip) highlight(null); });
    b.addEventListener("focus", () => { if (!openTip) highlight(id); });
    b.addEventListener("blur", () => { if (!openTip) highlight(null); });
    b.addEventListener("click", () => (openTip === id ? hideTip() : showTip(id, b)));
  });
  tipClose?.addEventListener("click", hideTip);

  /* ---- under a mouse the whole city tilts a little toward the pointer ---- */
  // The stylesheet grows and lifts it on hover; this sets the tilt as an
  // axis and angle, a few degrees at most, throttled to one update a frame.
  if (fine) {
    let box = null, raf = 0, px = 0, py = 0;
    const setTilt = (rx, ry) => {
      const a = Math.hypot(rx, ry);
      stage.style.setProperty("--tilt", `${a.toFixed(2)}deg`);
      if (a > 0.01) { stage.style.setProperty("--ax", (rx / a).toFixed(3)); stage.style.setProperty("--ay", (ry / a).toFixed(3)); }
    };
    stage.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") box = stage.getBoundingClientRect(); });
    stage.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || !box) return;
      px = (e.clientX - box.left) / box.width - 0.5;
      py = (e.clientY - box.top) / box.height - 0.5;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; setTilt(-py * 4, px * 5); });
    });
    stage.addEventListener("pointerleave", () => { box = null; setTilt(0, 0); });
  }
  svg.addEventListener("click", hideTip);

  /* ---- the HUD: four tiles and the hydrograph ---- */
  const hudRest = Object.fromEntries((ui.hud.tiles || []).map((t) => [t.key, parseFloat(t.rest)]));
  const hudDec = { rain: 0, primary: 0, well: 2, alarms: 0 };
  let hudCur = { ...hudRest }, hudFrom = { ...hudRest }, hudTo = { ...hudRest }, hudT0 = 0, hudRaf = 0;
  function hudTarget(v) {
    hudFrom = { ...hudCur }; hudTo = { ...hudTo, ...v }; hudT0 = performance.now();
    if (!hudRaf) hudRaf = requestAnimationFrame(hudStep);
  }
  function hudStep(now) {
    const p = Math.min(1, (now - hudT0) / 480), e = 1 - Math.pow(1 - p, 3);
    for (const k in hudTo) hudCur[k] = hudFrom[k] + (hudTo[k] - hudFrom[k]) * e;
    paintHud();
    hudRaf = p < 1 ? requestAnimationFrame(hudStep) : 0;
  }
  function paintHud(drift = 0) {
    for (const k in tiles) {
      if (k === "spark" || !(k in hudCur)) continue;
      const v = hudCur[k] + (k === "primary" || k === "well" ? drift * (k === "well" ? 0.01 : 2) : 0);
      const out = $("[data-value]", tiles[k]);
      if (out) out.textContent = k === "alarms" ? String(Math.round(v)) : v.toFixed(hudDec[k] ?? 0);
    }
    const alarms = Math.round(hudCur.alarms || 0), at = tiles.alarms;
    if (at) { at.toggleAttribute("data-alarm", alarms > 0); const sm = $("small", at); if (sm) sm.textContent = alarms > 0 ? ui.hud.alarmWord : (ui.hud.tiles.find((t) => t.key === "alarms")?.unit || ""); }
  }

  // one 24 h trace per district, drawn once from a seed; the storm trace
  // swaps in while a storm runs
  const spark = $(".city-spark");
  const traces = {};
  function makeTrace(seed, stormy) {
    const rnd = (() => { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; })();
    const pts = [];
    for (let i = 0; i < 48; i++) {
      const h = i / 2, diurnal = 0.55 + 0.35 * Math.sin((h - 9) / 24 * Math.PI * 2) + 0.12 * Math.sin((h - 19) / 24 * Math.PI * 4);
      let v = diurnal + (rnd() - 0.5) * 0.06;
      if (stormy && h > 13 && h < 22) v += Math.max(0, 1.1 * Math.sin((h - 13) / 9 * Math.PI)) * (h < 17 ? 1 : 0.6);
      pts.push(v);
    }
    const max = Math.max(...pts) * 1.08;
    const X = (i) => (i / 47 * 216 + 2).toFixed(1), Y = (v) => (46 - v / max * 40).toFixed(1);
    const line = pts.map((v, i) => `${i ? "L" : "M"}${X(i)} ${Y(v)}`).join("");
    const dwf = pts.map((v, i) => { const h = i / 2; return `${i ? "L" : "M"}${X(i)} ${Y(0.55 + 0.35 * Math.sin((h - 9) / 24 * Math.PI * 2) + 0.12 * Math.sin((h - 19) / 24 * Math.PI * 4))}`; }).join("");
    const rain = stormy ? [26, 27, 28, 29, 30, 31, 32, 33].map((i) => `<rect x="${X(i)}" y="2" width="3.5" height="${(4 + Math.sin((i - 25) / 9 * Math.PI) * 9).toFixed(1)}"/>`).join("") : "";
    return { line, area: `${line}L218 46L2 46Z`, dwf, rain, end: [X(47), Y(pts[47])] };
  }
  if (spark) {
    spark.innerHTML = `<defs><linearGradient id="city-spark-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4a6" stop-opacity=".35"/><stop offset="1" stop-color="#5fb4a6" stop-opacity="0"/></linearGradient></defs><g class="rain"></g><path class="dwf"/><path class="area on" fill="url(#city-spark-fill)"/><path class="trace on"/><circle class="dot" r="2.6"/>`;
    zoneData.forEach((z, i) => { traces[z.id] = { rest: makeTrace(i + 3, false), storm: makeTrace(i + 3, true) }; });
  }
  function drawSpark() {
    if (!spark || !state.active) return;
    const t = traces[state.active]?.[state.storm ? "storm" : "rest"]; if (!t) return;
    $(".trace", spark).setAttribute("d", t.line); $(".area", spark).setAttribute("d", t.area); $(".dwf", spark).setAttribute("d", t.dwf);
    $(".rain", spark).innerHTML = (state.active === "river" || state.active === "sewer" || state.storm) ? t.rain : "";
    const dot = $(".dot", spark); dot.setAttribute("cx", t.end[0]); dot.setAttribute("cy", t.end[1]);
  }

  /* ---- the readout ticker: twice a second, only what is on screen ---- */
  let tick = 0, lidottState = "normal";
  function stormLevel() {
    if (!state.storm) return 0;
    const t = stormElapsed();
    return t < 8 ? t / 8 : t < 22 ? 1 : Math.max(0, 1 - (t - 22) / 7);
  }
  function tickReadouts() {
    const t = performance.now() / 1000, card = cardOf(state.active);
    if (card) $$("[data-read]", card).forEach((b) => { const s = sensorOf[b.dataset.read]; if (!s) return; const r = s.reads[0]; b.textContent = r.text ? (s.id === "lidott" ? ui.states[lidottState] : readValue(s, r, t)) : readValue(s, r, t); });
    if (openTip) fillTip(openTip);
    fillPills();
    if (!hudRaf) paintHud(Math.sin(t / 7));
  }
  const startTicker = () => { if (!tick) { tickReadouts(); tick = setInterval(tickReadouts, 500); } };
  const stopTicker = () => { clearInterval(tick); tick = 0; };

  /* ---- the storm: a scripted event, driven by classes on both layers ---- */
  const steps = [];
  stormData.steps.forEach((s) => {
    steps.push({ at: s.at, run: () => stepMain(s) });
    (s.sub || []).forEach((sub) => steps.push({ at: sub.at, run: () => stepSub(s, sub) }));
  });
  steps.push({ at: stormData.duration, run: () => finishStorm(false) });
  steps.sort((a, b) => a.at - b.at);
  const log = $(".city-log");
  function addLog(stamp, text) {
    if (!log) return;
    const d = document.createElement("div");
    const sm = document.createElement("small"); sm.textContent = stamp; d.append(sm, document.createTextNode(text));
    log.appendChild(d);
    while (log.children.length > 3) log.firstElementChild.remove();
  }
  function stepMain(s) {
    cls(`storm-${s.n}`, true);
    if (!state.storm.userTookOver) setActive(s.zone);
    setCaption(s.caption);
    $$(`.city-why[data-step="${s.n}"]`).forEach((p) => { p.hidden = false; });
    if (s.log) addLog(s.logStamp || "", s.log);
    if (s.hud) hudTarget(s.hud);
    if (s.announce) announce(s.announceText);
    if (s.n === 3) setLidott("high");
    drawSpark();
  }
  function stepSub(s, sub) {
    cls(`storm-${s.n}b`, true);
    if (sub.caption) setCaption(sub.caption);
    if (sub.state) setLidott(sub.state);
    if (sub.log) addLog(sub.logStamp || "", sub.log);
    if (sub.sms) sendSms(sub.sms === "ok");
  }
  function setLidott(st) {
    lidottState = st;
    cls("lidott-high", st === "high");
    cls("lidott-highhigh", st === "highHigh");
    const sp = $('.sensor[data-sensor="lidott"] .cs-state', sc.fx);
    if (sp) sp.textContent = ` · ${ui.states[st]}`;
  }
  function sendSms(ok) {
    sc.sms.classList.toggle("ok", !!ok); sc.sms.classList.add("on");
    sc.smsMotion.beginElement();
    setTimeout(() => { cls("beacon-on", true); setTimeout(() => cls("beacon-on", false), 400); }, 1050);
    setTimeout(() => sc.sms.classList.remove("on"), 1400);
  }
  const stormElapsed = () => state.storm ? state.storm.elapsed + (state.storm.running ? (performance.now() - state.storm.t0) / 1000 : 0) : 0;
  // the rain, cloud and lightning, painted between the two layers
  const weather = window.CityWeather ? CityWeather(sc, { clock: () => (state.storm ? stormElapsed() : null), script: stormData }) : null;
  function scheduleStorm() {
    const st = state.storm, now = stormElapsed();
    st.timers = steps.filter((s) => !st.done.has(s)).map((s) => setTimeout(() => { st.done.add(s); s.run(); }, Math.max(0, (s.at - now) * 1000)));
    st.t0 = performance.now(); st.running = true;
  }
  function suspendStorm() {
    const st = state.storm; if (!st || !st.running) return;
    st.timers.forEach(clearTimeout); st.elapsed = stormElapsed(); st.running = false;
  }
  function startStorm() {
    if (state.storm) return finishStorm(true);
    hideTip();
    state.storm = { elapsed: 0, t0: performance.now(), running: false, timers: [], done: new Set(), prevActive: state.active, userTookOver: false };
    cls("is-storm", true);
    btn.storm?.setAttribute("aria-pressed", "true"); $("span", btn.storm).textContent = ui.toolbar.stormBusy;
    announce(ui.live.stormStart);
    scheduleStorm();
    weather?.start();
    drawSpark();
  }
  function clearStormClasses() {
    layers.forEach((s) => [...s.classList].filter((c) => /^storm-|^lidott-|^is-storm$/.test(c)).forEach((c) => s.classList.remove(c)));
    setLidott("normal");
    sc.sms.classList.remove("on");
    $$(".city-why").forEach((p) => { p.hidden = true; });
  }
  function finishStorm(cancelled) {
    const st = state.storm; if (!st) return;
    st.timers.forEach(clearTimeout);
    state.storm = null;
    clearStormClasses();
    weather?.end(cancelled);
    hudTarget(hudRest);
    btn.storm?.setAttribute("aria-pressed", "false"); $("span", btn.storm).textContent = ui.toolbar.storm;
    if (cancelled) { setCaption(ui.toolbar.stormCancelled); announce(ui.live.stormCancelled); }
    else announce(ui.live.stormEnd);
    // the caption goes back to the instruction once the storm has settled
    setTimeout(() => { if (!state.storm) setCaption(); }, cancelled ? 2500 : 3000);
    // the district the visitor had picked comes back, unless they picked
    // another one during the storm
    if (!st.userTookOver) setActive(st.prevActive);
    else apply();
    drawSpark();
  }
  btn.storm?.addEventListener("click", startStorm);
  // Escape stops a storm or closes a readout from anywhere on the page, and
  // a click anywhere else closes the readout
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (state.storm) finishStorm(true); else if (openTip) hideTip(); else if (state.expanded) setExpanded(false); } });
  document.addEventListener("pointerdown", (e) => { if (openTip && !e.target.closest?.(".city-tip, .hit, .city-sensors")) hideTip(); });

  /* ---- the underground view ---- */
  /* ---- the expanded view: the city nearly full screen, with every pill ---- */
  // The grid becomes a fixed, modal panel; focus stays inside it until it
  // closes with the button or Escape, and goes back to the expand button.
  let lastFocus = null;
  function setExpanded(on) {
    if (state.expanded === on || !grid) return;
    state.expanded = on;
    hideTip();
    document.body.classList.toggle("city-lock", on);
    if (closeBtn) closeBtn.hidden = !on;
    if (on) { grid.setAttribute("role", "dialog"); grid.setAttribute("aria-modal", "true"); grid.setAttribute("aria-label", ui.expandedLabel); }
    else { grid.removeAttribute("role"); grid.removeAttribute("aria-modal"); grid.removeAttribute("aria-label"); }
    btn.expand?.setAttribute("aria-pressed", String(on));
    if (btn.expand) $("span", btn.expand).textContent = on ? ui.toolbar.collapse : ui.toolbar.expand;
    apply();
    fillPills();
    requestAnimationFrame(() => { fitAll(); layoutPills(); });
    if (on) { lastFocus = document.activeElement; closeBtn?.focus({ preventScroll: true }); announce(ui.live.expanded); }
    else { (lastFocus?.isConnected ? lastFocus : btn.expand)?.focus({ preventScroll: true }); announce(ui.live.collapsed); }
  }
  btn.expand?.addEventListener("click", () => setExpanded(!state.expanded));
  closeBtn?.addEventListener("click", () => setExpanded(false));
  grid?.addEventListener("keydown", (e) => {
    if (!state.expanded || e.key !== "Tab") return;
    // only what a visitor can actually reach: the hidden cards' links and the
    // tabs that are out of the tab order do not count
    const items = $$("button:not([tabindex='-1']), a[href], [tabindex='0']", grid).filter((el) => el instanceof SVGElement || (!el.hidden && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden"));
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  fitAll();
  document.fonts?.ready?.then(fitAll);

  btn.under?.addEventListener("click", () => {
    state.under = !state.under;
    apply();
    announce(state.under ? ui.live.underOn : ui.live.underOff);
  });

  /* ---- clarifier scraper arms turn (true rotation in the ground plane) ---- */
  const P = CityScene.P;
  let raf = 0;
  const spin = (now) => {
    for (const a of sc.arms) {
      const t = now / 2600 + a.phase, dx = Math.cos(t) * a.r, dy = Math.sin(t) * a.r;
      const [x1, y1] = P(a.cx - dx, a.cy - dy, a.z), [x2, y2] = P(a.cx + dx, a.cy + dy, a.z);
      a.arm.setAttribute("x1", x1.toFixed(1)); a.arm.setAttribute("y1", y1.toFixed(1));
      a.arm.setAttribute("x2", x2.toFixed(1)); a.arm.setAttribute("y2", y2.toFixed(1));
    }
    raf = state.inView && !document.hidden ? requestAnimationFrame(spin) : 0;
  };
  spin(0);
  const kick = () => { if (!raf) raf = requestAnimationFrame(spin); };

  /* ---- gating: nothing runs while the stage is off screen or the tab hidden ---- */
  function sync() {
    const on = state.inView && !document.hidden;
    cls("is-offscreen", !on);
    if (on) {
      layers.forEach((s) => { try { s.unpauseAnimations(); } catch {} });
      startTicker(); kick();
      if (state.storm && !state.storm.running) scheduleStorm();
      weather?.run(true);
    } else {
      layers.forEach((s) => { try { s.pauseAnimations(); } catch {} });
      stopTicker(); suspendStorm();
      weather?.run(false);
    }
  }
  new IntersectionObserver(([en]) => { state.inView = en.isIntersecting; sync(); }, { threshold: 0.3 }).observe(svg);
  document.addEventListener("visibilitychange", sync);

  /* ---- go ---- */
  // start on the district the page was built with (the first card)
  setActive(cards.find((c) => c.classList.contains("active"))?.dataset.zone || order[0]);
  paintHud();
})();
