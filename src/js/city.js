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
//
// The city is drawn once the page has painted its first frame (or after a
// moment, in a tab that is not showing), so the hero is on screen before the
// work of building two thousand elements begins. The city sits well below
// the fold, so nothing is seen to wait.
(() => {
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    build();
  };
  const fallback = setTimeout(start, 400);
  requestAnimationFrame(() => { clearTimeout(fallback); setTimeout(start, 0); });

  function build() {
  const svg = document.getElementById("city"), dataEl = document.getElementById("city-data");
  if (!svg || !dataEl || !window.CityScene) return;
  const data = JSON.parse(dataEl.textContent);
  const { ui, storm: stormData, zones: zoneData } = data;
  const sc = CityScene.build(svg, data);
  const layers = [svg, sc.fx];
  const cls = (name, on) => layers.forEach((s) => s.classList.toggle(name, on));
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // the stage holds the view (the drawing and everything laid over it) and,
  // on phones, the list of labels under it
  const section = svg.closest(".city-section"), stage = svg.closest(".city-stage"), view = svg.closest(".city-view");
  const cards = $$(".city-card"), tabs = $$(".city-tab"), caption = $(".city-caption"), liveEl = $("#city-live");
  const btn = { tour: $('.city-btn[data-act="tour"]'), storm: $('.city-btn[data-act="storm"]'), under: $('.city-btn[data-act="under"]'), expand: $('.city-btn[data-act="expand"]'), explode: $('.city-btn[data-act="explode"]') };
  const grid = $("#city-grid"), closeBtn = $(".city-close");
  const tiles = Object.fromEntries($$(".city-tile[data-tile]").map((t) => [t.dataset.tile, t]));
  const tip = $(".city-tip"), tipBody = $(".city-tip-body"), tipClose = $(".city-tip-close");
  const zoneOf = Object.fromEntries(zoneData.map((z) => [z.id, z]));
  const sensorOf = {};
  zoneData.forEach((z) => z.sensors.forEach((s) => { sensorOf[s.id] = { ...s, zone: z.id }; }));
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const order = zoneData.map((z) => z.id);
  const ZONE_IDS = Object.keys(sc.zones);

  // view: "city", "district" (the active district taken apart) or "asset"
  // (its asset open and taken apart, reached from `assetFrom`)
  // `tour` is the tour's state while the visitor is on it (the end of this file)
  const state = { active: null, under: false, expanded: false, inView: false, storm: null, view: "city", assetFrom: "city", tour: null };
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
      // an open asset closes; if the visitor came from a district taken
      // apart, the newly picked district comes apart in its place
      if (state.view === "asset") {
        const back = state.assetFrom === "district";
        closeAsset({ quick: true, refocus: false });
        if (back) { state.view = "district"; apply(); switchDistrict(prev, id); }
      } else if (state.view === "district") switchDistrict(prev, id);
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
    cls("is-exploded", state.view === "district" || !!(state.tour && state.tour.k > 0));
    cls("is-asset", state.view === "asset");
    stage.classList.toggle("is-exploded", state.view === "district");
    stage.classList.toggle("is-asset", state.view === "asset");
    section.classList.toggle("is-exploded", state.view !== "city");
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
    if (btn.under) { btn.under.setAttribute("aria-pressed", String(state.under)); $("span", btn.under).textContent = state.under ? ui.toolbar.underOn : ui.toolbar.under; btn.under.setAttribute("aria-disabled", String(state.view !== "city")); }
    if (btn.explode) { const on = state.view !== "city"; btn.explode.setAttribute("aria-pressed", String(on)); $("span", btn.explode).textContent = on ? ui.explode.put : ui.explode.take; }
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
      const r = $(".hit", g).getBoundingClientRect(), s = view.getBoundingClientRect();
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
  // It goes onto the box that holds the three layers as an inline rotate
  // (site.css eases it, and the compositor turns the one texture): set as
  // custom properties on the stage it restyled every node in the city on
  // every move of the mouse.
  const model = $(".city-model", stage);
  if (fine && model) {
    let box = null, raf = 0, px = 0, py = 0;
    const setTilt = (rx, ry) => {
      const a = Math.hypot(rx, ry);
      model.style.rotate = a > 0.01 ? `${(rx / a).toFixed(3)} ${(ry / a).toFixed(3)} 0 ${a.toFixed(2)}deg` : "";
    };
    stage.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") box = stage.getBoundingClientRect(); });
    stage.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || !box || state.tour) return;
      if (state.view !== "city") { setTilt(0, 0); return; }
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
    fillNotes(t);
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
  // The EDS fleet steps up as the storm goes on: FlowSense sends a van from
  // the operations yard to MH 14 once the alarm is raised, and a crew turns
  // out at each district the storm reaches. When MH 14 returns to normal the
  // crew packs up and drives back. The van keeps left all the way.
  let driveRaf = 0;
  function drive(route, ms, done) {
    cancelAnimationFrame(driveRaf);
    const pts = route.map(([x, y]) => CityScene.P(x, y)), lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), total = lens.reduce((a, b) => a + b, 0);
    const van = sc.dispatch.use, t0 = performance.now();
    sc.dispatch.g.classList.add("on");
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      let d = e * total, i = 0;
      while (i < lens.length - 1 && d > lens[i]) d -= lens[i++];
      const u = lens[i] ? d / lens[i] : 1, a = pts[i], b = pts[i + 1], dx = route[i + 1][0] - route[i][0], dy = route[i + 1][1] - route[i][1];
      van.setAttribute("href", `#van-${Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "e" : "w") : dy > 0 ? "s" : "n"}`);
      van.setAttribute("transform", `translate(${(a[0] + (b[0] - a[0]) * u).toFixed(1)} ${(a[1] + (b[1] - a[1]) * u).toFixed(1)})`);
      if (t < 1) driveRaf = requestAnimationFrame(step);
      else { driveRaf = 0; sc.dispatch.g.classList.remove("on"); done?.(); }
    };
    driveRaf = requestAnimationFrame(step);
  }
  function crewStep(n) {
    if (n === 4) { cls("dispatch-out", true); drive(sc.dispatch.route, 4200, () => state.storm && cls("crew-mh14", true)); }
    if (n === 5) cls("crew-pump", true);
    if (n === 6) cls("crew-plant", true);
    if (n === 7) cls("crew-river", true);
  }
  function crewSub(n) {
    if (n !== 8) return;
    setTimeout(() => {
      if (!state.storm) return;
      cls("crew-mh14", false);
      drive(sc.dispatch.route.slice().reverse(), 3400, () => cls("dispatch-out", false));
    }, 500);
  }
  function stepMain(s) {
    cls(`storm-${s.n}`, true);
    crewStep(s.n);
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
    crewSub(s.n);
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
    if (state.view !== "city") resetViews();
    state.storm = { elapsed: 0, t0: performance.now(), running: false, timers: [], done: new Set(), prevActive: state.active, userTookOver: false };
    cls("is-storm", true);
    btn.storm?.setAttribute("aria-pressed", "true"); $("span", btn.storm).textContent = ui.toolbar.stormBusy;
    announce(ui.live.stormStart);
    scheduleStorm();
    weather?.start();
    drawSpark();
  }
  function clearStormClasses() {
    layers.forEach((s) => [...s.classList].filter((c) => /^storm-|^lidott-|^crew-|^dispatch-|^is-storm$/.test(c)).forEach((c) => s.classList.remove(c)));
    cancelAnimationFrame(driveRaf); driveRaf = 0;
    sc.dispatch.g.classList.remove("on");
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
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (state.storm) finishStorm(true);
    else if (openTip) hideTip();
    else if (state.view === "asset") closeAsset({ to: state.assetFrom });
    else if (state.view === "district") setDistrict(false);
    else if (state.expanded) setExpanded(false);
  });
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
    requestAnimationFrame(() => { fitAll(); layoutPills(); reframe(); });
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
    if (state.view !== "city") return;
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
    // only the overlay holds animations, so only it is paused (the class
    // on the still city would restyle its two thousand nodes for nothing)
    sc.fx.classList.toggle("is-offscreen", !on);
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

  /* ---- taking it apart: a district in three layers, an asset in parts ---- */
  // One tween drives everything that moves together. For a district that is
  // the camera (the viewBox of both layers, kept at 800:448 so the page never
  // shifts) and a progress k from 0 (together) to 1 (apart) that sets each
  // layer's offset, the guides and the labels. An asset has a k for each
  // part, staggered from the top part down. Nothing here runs unless the
  // visitor asked for it.
  const SVGNS = "http://www.w3.org/2000/svg", X = ui.explode;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = (ms) => (reduced ? ms * 0.6 : ms);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp = (v) => Math.max(0, Math.min(1, v));
  // two channels, so opening an asset never cuts short the camera
  const anims = { d: 0, a: 0 };
  function run(ch, ms, step, done) {
    cancelAnimationFrame(anims[ch]);
    // a hidden tab gets no frames: go straight to the end
    if (document.hidden) { step(ms); anims[ch] = 0; done?.(); return; }
    const t0 = performance.now();
    const tick = (now) => { const t = Math.min(ms, now - t0); step(t); if (t < ms) anims[ch] = requestAnimationFrame(tick); else { anims[ch] = 0; done?.(); } };
    anims[ch] = requestAnimationFrame(tick);
  }

  /* the camera */
  const VB0 = sc.VB.split(" ").map(Number);
  let vb = VB0.slice();
  const setVB = (v) => { vb = v; const a = v.map((n) => n.toFixed(2)).join(" "); svg.setAttribute("viewBox", a); sc.fx.setAttribute("viewBox", a); };
  const lerp = (a, b, t) => a.map((n, i) => n + (b[i] - n) * t);
  const isWide = () => view.clientWidth >= 680;
  const colW = () => (isWide() ? Math.round(Math.min(230, Math.max(172, view.clientWidth * 0.2))) : 0);
  // a viewBox of the given shape that frames a box, leaving room each side
  // for the label columns (and `pad` of the height free above and below)
  function frame([x0, y0, x1, y1], aspect = 800 / 448, { max = 860, pad = 0.1 } = {}) {
    const W = view.clientWidth || 800, room = Math.max(0.42, 1 - (2 * colW() + 24) / W);
    const w = Math.min(max, Math.max((x1 - x0) / room, (y1 - y0) * (1 + pad * 2) * aspect));
    const h = w / aspect;
    return [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h];
  }

  /* a district's three layers */
  const dk = {}, splits = new Map();
  // Taken apart, a district's structures paint over its street and the
  // street over the block below, so the volume group is split into two
  // groups for as long as it is apart, then put back in its depth order.
  function splitVol(id, on) {
    const vol = $(".vol", sc.zones[id]), sp = splits.get(id);
    if (on && !sp) {
      const order = [...vol.children], lo = document.createElementNS(SVGNS, "g"), hi = document.createElementNS(SVGNS, "g");
      lo.setAttribute("class", "vol-lo"); hi.setAttribute("class", "vol-hi");
      vol.append(lo, hi);
      order.forEach((n) => (n.getAttribute("data-s") === "lo" ? lo : hi).appendChild(n));
      splits.set(id, { order, lo, hi });
    } else if (!on && sp) {
      sp.order.forEach((n) => vol.appendChild(n));
      sp.lo.remove(); sp.hi.remove();
      splits.delete(id);
    }
  }
  function placeDistrict(id, k) {
    const kit = sc.explode(id);
    if (k > 0) splitVol(id, true);
    const up = `translate(0 ${(-kit.rise * k).toFixed(2)})`, dn = `translate(0 ${(kit.sink * k).toFixed(2)})`, o = clamp(k * 2.5).toFixed(3);
    splits.get(id)?.hi.setAttribute("transform", up);
    kit.fxl.hi.setAttribute("transform", up);
    kit.fxl.below.setAttribute("transform", dn);
    kit.block.setAttribute("transform", dn);
    kit.block.style.opacity = o; kit.blockFx.style.opacity = o; kit.ghost.style.opacity = (k * 0.9).toFixed(3);
    for (const g of kit.guides) {
      const [x, y] = g.p;
      g.el.setAttribute("x1", x.toFixed(1)); g.el.setAttribute("y1", (y - kit.rise * k).toFixed(2));
      g.el.setAttribute("x2", x.toFixed(1)); g.el.setAttribute("y2", (y + kit.sink * k).toFixed(2));
      g.el.style.opacity = o;
    }
    sc.zones[id].classList.toggle("exploded", k > 0);
    sc.zoneFx[id].classList.toggle("exploded", k > 0);
    if (k === 0) { splitVol(id, false); focusStratum(id, null); }
    dk[id] = k;
  }
  // a layer label's click brings that layer forward and dims the other two
  function focusStratum(id, layer) {
    const z = sc.zones[id], cur = z.getAttribute("data-focus");
    const next = layer && cur !== layer ? layer : null;
    for (const g of [z, sc.zoneFx[id]]) next ? g.setAttribute("data-focus", next) : g.removeAttribute("data-focus");
    notes.forEach((n) => n.kind === "stratum" && n.btn.setAttribute("aria-pressed", String(n.key === `s-${next}`)));
    if (state.view === "district" && id === state.active) setCaption(next ? `${X.strata[next]}: ${zoneOf[id].strata[next]}` : fill(X.caption, { name: zoneOf[id].name }));
  }
  function setDistrict(on) {
    const id = state.active, kit = sc.explode(id), from = vb.slice(), k0 = dk[id] || 0;
    if (on) {
      if (state.view !== "city") return;
      if (state.storm) finishStorm(true);
      hideTip();
      state.under = false;
      state.view = "district";
      apply();
      showDistrictNotes(id);
      setCaption(fill(X.caption, { name: zoneOf[id].name }));
      const to = frame(kit.box);
      run("d", T(880), (t) => {
        setVB(lerp(from, to, easeIO(clamp(t / T(520)))));
        placeDistrict(id, k0 + (1 - k0) * easeOut(clamp((t - T(170)) / T(680))));
        layoutNotes();
      }, layoutNotes);
      announce(fill(X.live.district, { name: zoneOf[id].name }));
    } else {
      if (state.view !== "district") return;
      state.view = "city";
      hideNotes();
      apply();
      setCaption();
      run("d", T(760), (t) => {
        placeDistrict(id, k0 * (1 - easeOut(clamp(t / T(440)))));
        setVB(lerp(from, VB0, easeIO(clamp((t - T(240)) / T(520)))));
      }, () => { placeDistrict(id, 0); setVB(VB0); });
      announce(fill(X.live.districtBack, { name: zoneOf[id].name }));
    }
  }
  // a different district picked while one is apart: the first goes back
  // together as the camera glides across, then the new one comes apart
  function switchDistrict(prev, id) {
    const k0 = prev ? dk[prev] || 0 : 0, from = vb.slice(), to = frame(sc.explode(id).box);
    showDistrictNotes(id);
    setCaption(fill(X.caption, { name: zoneOf[id].name }));
    run("d", T(1040), (t) => {
      if (prev) placeDistrict(prev, k0 * (1 - easeOut(clamp(t / T(360)))));
      setVB(lerp(from, to, easeIO(clamp((t - T(120)) / T(580)))));
      placeDistrict(id, easeOut(clamp((t - T(380)) / T(660))));
      layoutNotes();
    }, () => { if (prev) placeDistrict(prev, 0); layoutNotes(); });
  }
  function showDistrictNotes(id) {
    const z = zoneOf[id], kit = sc.explode(id), items = [];
    for (const k of ["above", "street", "below"]) items.push({ key: `s-${k}`, kind: "stratum", side: "left", name: X.strata[k], sub: z.strata[k], mark: kit.marks[k], pressed: false, onClick: () => focusStratum(id, k) });
    const main = z.asset.pin;
    for (const s of z.sensors) {
      const mark = $(".ping-dot", sc.sensors[s.id]);
      if (s.id === main) items.push({ key: "asset", kind: "inside", side: "right", icon: "scan-eye", name: z.asset.button, sensor: s.id, subName: s.name, mark, onClick: (e) => openAsset(id, "district", e.currentTarget) });
      else items.push({ key: `i-${s.id}`, kind: "instrument", side: "right", name: s.name, sensor: s.id, mark, onClick: () => (openTip === s.id ? hideTip() : showTip(s.id)) });
    }
    setNotes(items, fill(X.layersLabel, { name: z.name }));
  }

  /* the labels: HTML in two columns with leader lines, or numbered on phones */
  const notesEl = $("#city-notes"), leaders = $(".city-leaders", notesEl), notesList = $("#city-notes-list");
  const noteCols = { left: $('.city-notes-col[data-side="left"]', notesEl), right: $('.city-notes-col[data-side="right"]', notesEl) };
  const iconOf = (name) => $(`.city-inside .icon`)?.cloneNode(true);
  let notes = [];
  function noteButton(it, i) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `city-label is-${it.kind}${it.eds ? " eds" : ""}`;
    if (it.kind === "stratum" || it.kind === "part") b.setAttribute("aria-pressed", "false");
    const n = document.createElement("span"); n.className = "city-label-n"; n.textContent = String(i + 1); n.setAttribute("aria-hidden", "true");
    const nm = document.createElement("b"); nm.textContent = it.name;
    const sm = document.createElement("small"); sm.textContent = it.sub || "";
    b.append(n);
    if (it.icon) { const ic = iconOf(it.icon); if (ic) b.append(ic); }
    b.append(nm, sm);
    b.addEventListener("click", it.onClick);
    return [b, sm];
  }
  function setNotes(items, label) {
    noteCols.left.replaceChildren(); noteCols.right.replaceChildren(); notesList.replaceChildren();
    notes = items.map((it, i) => {
      const [btnEl, sm] = noteButton(it, i), [lb, lsm] = noteButton(it, i);
      noteCols[it.side || "right"].append(btnEl);
      const li = document.createElement("li"); li.append(lb); notesList.append(li);
      return { ...it, btn: btnEl, sm, lb, lsm };
    });
    notesEl.setAttribute("aria-label", label); notesList.setAttribute("aria-label", label);
    notesEl.hidden = false; notesList.hidden = false;
    fillNotes();
    layoutNotes();
  }
  function hideNotes() { notesEl.hidden = true; notesList.hidden = true; notes = []; leaders.replaceChildren(); }
  function fillNotes(t = performance.now() / 1000) {
    for (const n of notes) {
      if (!n.sensor) continue;
      const s = sensorOf[n.sensor], r = s.reads[0];
      const v = withUnit(r.text ? (s.id === "lidott" ? ui.states[lidottState] : readValue(s, r, t)) : readValue(s, r, t), r.unit);
      const text = n.subName ? `${n.subName}: ${v}` : v;
      if (n.sm.textContent !== text) { n.sm.textContent = text; n.lsm.textContent = text; }
    }
  }
  function layoutNotes() {
    if (notesEl.hidden || !notes.length) return;
    const r = view.getBoundingClientRect(), W = r.width, H = r.height, wide = W >= 680, cw = colW();
    // the tour keeps the labels clear of its own bar, card and rail
    const inset = parseFloat(notesEl.style.getPropertyValue("--inset")) || 0, ceil = parseFloat(notesEl.style.getPropertyValue("--ceil")) || 6, floor = parseFloat(notesEl.style.getPropertyValue("--floor")) || 6;
    notesEl.classList.toggle("is-narrow", !wide);
    notesList.classList.toggle("is-on", !wide);
    notesEl.style.setProperty("--col", `${cw}px`);
    leaders.setAttribute("viewBox", `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
    const at = notes.map((n) => { const m = n.mark?.getBoundingClientRect(); return m && (m.width || m.height || m.left) ? [m.left + m.width / 2 - r.left, m.top + m.height / 2 - r.top] : null; });
    let d = "", dots = "";
    if (wide) {
      const sides = { left: [], right: [] };
      notes.forEach((n, i) => { if (at[i]) sides[n.side || (at[i][0] < W / 2 ? "left" : "right")].push(i); });
      for (const side of ["left", "right"]) {
        const ids = sides[side].sort((a, b) => at[a][1] - at[b][1]);
        ids.forEach((i) => notes[i].btn.parentNode !== noteCols[side] && noteCols[side].append(notes[i].btn));
        // stack each label level with its mark, pushed apart, kept on the stage
        const place = [];
        let y = ceil;
        for (const i of ids) { const h = notes[i].btn.offsetHeight; const top = Math.max(y, at[i][1] - h / 2); place.push([i, top, h]); y = top + h + 8; }
        let limit = H - (side === "left" ? floor : 6);
        for (let j = place.length - 1; j >= 0; j--) { if (place[j][1] + place[j][2] > limit) place[j][1] = Math.max(ceil, limit - place[j][2]); limit = place[j][1] - 8; }
        for (const [i, top, h] of place) {
          notes[i].btn.style.top = `${top.toFixed(1)}px`;
          const ex = side === "left" ? cw + 4 : W - inset - cw - 4, ey = top + h / 2, [ax, ay] = at[i];
          const mx = side === "left" ? Math.max(ex + 10, Math.min(ax - 12, ex + 26)) : Math.min(ex - 10, Math.max(ax + 12, ex - 26));
          d += `M${ex.toFixed(1)} ${ey.toFixed(1)}H${mx.toFixed(1)}L${ax.toFixed(1)} ${ay.toFixed(1)}`;
          dots += `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2.6"/>`;
        }
      }
    } else {
      // phones: a numbered balloon on each part, the list under the stage
      notes.forEach((n, i) => { if (!at[i]) return; dots += `<g class="balloon"><circle cx="${at[i][0].toFixed(1)}" cy="${(at[i][1] - 12).toFixed(1)}" r="8.5"/><text x="${at[i][0].toFixed(1)}" y="${(at[i][1] - 8.6).toFixed(1)}">${i + 1}</text></g>`; d += `M${at[i][0].toFixed(1)} ${(at[i][1] - 3.5).toFixed(1)}V${at[i][1].toFixed(1)}`; });
    }
    leaders.innerHTML = `<path d="${d}"/>${dots}`;
  }

  /* the asset: drawn in its own SVG over the stage, taken apart part by part */
  const assetEl = $("#city-asset"), assetSvg = $(".city-asset-svg", assetEl), assetDetail = $(".city-asset-detail", assetEl);
  const assetBtn = { back: $('[data-act="asset-back"]', assetEl), toggle: $('[data-act="asset-toggle"]', assetEl) };
  let A = null;
  function fitAsset() {
    if (!A) return;
    const r = assetEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    A.built.apply(() => 1);
    const bb = A.built.root.getBBox();
    A.built.apply((i) => A.k[i]);
    // the asset apart fills what is left between the label columns, the
    // controls along the top and the part's detail along the bottom
    const top = 64, bottom = 84, side = colW() + 28;
    const s = Math.min((r.width - 2 * side) / bb.width, (r.height - top - bottom) / bb.height, 3.2);
    const w = r.width / s, h = r.height / s;
    const x = bb.x + bb.width / 2 - w / 2, y = bb.y - (top + (r.height - top - bottom - bb.height * s) / 2) / s;
    assetSvg.setAttribute("viewBox", [x, y, w, h].map((n) => n.toFixed(1)).join(" "));
  }
  function openAsset(id, from = "city", trigger) {
    // asked for from the tour, the asset opens on the page with its district picked
    if (state.tour) { state.tour.leave({ select: id }); from = "city"; trigger = $(`.city-inside[data-zone="${id}"]`); }
    if (state.storm) finishStorm(true);
    hideTip();
    const z = zoneOf[id];
    state.view = "asset"; state.assetFrom = from;
    assetEl.hidden = false;
    assetEl.setAttribute("aria-label", fill(X.partsLabel, { name: z.asset.name }));
    const built = sc.buildAsset(assetSvg, z.asset);
    A = { zone: id, data: z.asset, built, k: z.asset.parts.map(() => 0), apart: false, trigger: trigger || document.activeElement, sel: null };
    apply();
    $("span", assetBtn.back).textContent = from === "district" ? X.back : X.backCity;
    fitAsset();
    setAssetDetail(null);
    showAssetNotes();
    setAssetApart(true);
    if (!isWide()) { const sr = view.getBoundingClientRect(); if (sr.top < 0 || sr.top > window.innerHeight * 0.5) view.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" }); }
    assetBtn.back.focus({ preventScroll: true });
    announce(fill(X.live.asset, { name: z.asset.name, n: z.asset.parts.length }));
  }
  function setAssetApart(on) {
    if (!A) return;
    A.apart = on;
    assetBtn.toggle.setAttribute("aria-pressed", String(on));
    $("span", assetBtn.toggle).textContent = on ? X.put : X.take;
    const n = A.k.length, from = A.k.slice(), st = reduced ? 0 : 55, dur = T(on ? 640 : 460), a = A;
    // parts leave from the top down and come back from the bottom up
    run("a", dur + st * (n - 1), (t) => {
      for (let i = 0; i < n; i++) { const p = easeOut(clamp((t - (on ? i : n - 1 - i) * st) / dur)); a.k[i] = from[i] + ((on ? 1 : 0) - from[i]) * p; }
      a.built.apply((i) => a.k[i]);
      layoutNotes();
    });
    if (!on) announce(fill(X.live.assetTogether, { name: A.data.name }));
  }
  function showAssetNotes() {
    const items = A.data.parts.map((p) => { const bp = A.built.parts.find((q) => q.id === p.id); return bp && { key: `p-${p.id}`, kind: "part", eds: p.eds, name: p.name, sensor: p.sensor, mark: bp.mark, onClick: () => selectPart(p.id) }; }).filter(Boolean);
    setNotes(items, fill(X.partsLabel, { name: A.data.name }));
  }
  function selectPart(id) {
    if (!A) return;
    A.sel = A.sel === id ? null : id;
    A.built.parts.forEach((p) => p.groups.forEach((g) => g.classList.toggle("dim", !!A.sel && p.id !== A.sel)));
    notes.forEach((n) => { n.btn.setAttribute("aria-pressed", String(n.key === `p-${A.sel}`)); n.lb.setAttribute("aria-pressed", String(n.key === `p-${A.sel}`)); });
    setAssetDetail(A.sel);
  }
  function setAssetDetail(id) {
    const p = id && A.data.parts.find((q) => q.id === id);
    assetDetail.replaceChildren();
    if (!p) { assetDetail.textContent = `${A.data.caption} ${X.assetCaption}`; return; }
    const b = document.createElement("b"); b.textContent = `${p.name}. `;
    assetDetail.append(b, document.createTextNode(`${p.note} `));
    if (p.href) { const a = document.createElement("a"); a.href = p.href; a.textContent = X.productLink; assetDetail.append(a); }
  }
  function closeAsset({ to = "city", quick = false, refocus = true } = {}) {
    if (state.view !== "asset" || !A) return;
    const a = A;
    A = null;
    const finish = () => { if (!A) { assetEl.hidden = true; assetSvg.replaceChildren(); } };
    state.view = to === "district" && (dk[state.active] || 0) > 0 ? "district" : "city";
    if (state.view === "district") showDistrictNotes(state.active); else hideNotes();
    apply();
    setCaption(state.view === "district" ? fill(X.caption, { name: zoneOf[state.active].name }) : undefined);
    if (quick) finish();
    else {
      assetEl.classList.add("is-leaving");
      run("a", T(220), () => {}, () => { assetEl.classList.remove("is-leaving"); finish(); });
    }
    // focus goes back where the visitor came from; a label's button is
    // rebuilt with the district's labels, so find its new copy
    const back = a.trigger?.isConnected && !a.trigger.closest("[hidden]") ? a.trigger : state.view === "district" ? [...document.querySelectorAll(".city-label.is-inside")].find((n) => n.offsetParent) : null;
    if (refocus) (back || btn.explode)?.focus({ preventScroll: true });
    announce(fill(X.live.assetClosed, { name: a.data.name }));
  }
  // straight back to the whole city, with no animation (a storm is starting)
  function resetViews() {
    if (A) closeAsset({ quick: true, refocus: false });
    cancelAnimationFrame(anims.d); anims.d = 0;
    Object.keys(dk).forEach((id) => dk[id] > 0 && placeDistrict(id, 0));
    setVB(VB0);
    state.view = "city";
    hideNotes();
    apply();
  }
  function reframe() {
    if (state.view === "district" && !anims.d) setVB(frame(sc.explode(state.active).box));
    if (state.view === "asset") fitAsset();
    layoutNotes();
  }
  let rf = 0;
  new ResizeObserver(() => { if (!rf) rf = requestAnimationFrame(() => { rf = 0; reframe(); }); }).observe(view);

  btn.explode?.addEventListener("click", () => {
    if (state.view === "city") return setDistrict(true);
    if (state.view === "asset") closeAsset({ to: "district", quick: true, refocus: false });
    if (state.view === "district") setDistrict(false);
  });
  assetBtn.back?.addEventListener("click", () => closeAsset({ to: state.assetFrom }));
  assetBtn.toggle?.addEventListener("click", () => setAssetApart(!A?.apart));
  $$(".city-inside").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.zone;
    if (state.view === "asset") { if (A?.zone === id) return; closeAsset({ quick: true, to: state.assetFrom, refocus: false }); }
    const from = state.view === "district" ? "district" : "city";
    if (state.active !== id) user(id, false);
    openAsset(id, from, b);
  }));

  /* ---- every so often, a white roadster barrel-rolls over the car in front ---- */
  // Ambient, like the rest of the traffic: it never picks or opens anything.
  // Every 15 to 30 seconds, while the whole city is on screen, a low white
  // roadster comes up behind a slower car on a random road, fires its
  // compressed-air thrusters and barrel-rolls over it: one turn about its
  // long axis while it swings out to one side, over the top of the car
  // (upside down at the top) and down the other side. It rolls under reduced
  // motion too: the site keeps its motion for those visitors (the owner's own
  // Mac reports reduced motion), and the roll is the point.
  const LANES = [
    { from: [-0.9, 4.85], to: [15.9, 4.85], dir: "e" }, { from: [15.9, 5.15], to: [-0.9, 5.15], dir: "w" },
    { from: [5.15, -0.9], to: [5.15, 10.9], dir: "s" }, { from: [9.85, 10.9], to: [9.85, -0.9], dir: "n" },
  ];
  const trafficLayer = $(".traffic", sc.fx);
  let stunting = false, stuntTimer = 0;
  const svgEl = (tag, attrs) => { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  function stunt() {
    if (stunting) return;
    stunting = true;
    const lane = LANES[Math.floor(Math.random() * LANES.length)], [fx0, fy0] = lane.from, [fx1, fy1] = lane.to, L = Math.hypot(fx1 - fx0, fy1 - fy0);
    const at = (d) => CityScene.P(fx0 + (fx1 - fx0) * d / L, fy0 + (fy1 - fy0) * d / L);
    const g = svgEl("g", { class: "stunt" }), shadow = svgEl("ellipse", { class: "stunt-shadow", rx: 6, ry: 3 });
    const car = svgEl("use", { href: `#car-${lane.dir}` }), rs = svgEl("use", { href: `#roadster-${lane.dir}` });
    // the thrusters' compressed air: two white jets from the car's underside,
    // turning with it as it flips, and puffs that billow out along them and fade
    const jets = [svgEl("polygon", { class: "stunt-jet" }), svgEl("polygon", { class: "stunt-jet" })], puffs = Array.from({ length: 26 }, () => svgEl("circle", { class: "stunt-puff", r: 0 }));
    g.append(car, shadow, ...puffs, ...jets, rs);
    const [ax, ay] = at(0), [bx, by] = at(1), ux = bx - ax, uy = by - ay, ul = Math.hypot(ux, uy), dxu = ux / ul, dyu = uy / ul;
    const live = [];
    let lastPuff = 0, nextPuff = 0;
    trafficLayer.appendChild(g);
    // The roll: the car turns once about its long axis while its path circles
    // the line of travel, R px high at the side and 2R at the top, and `swing`
    // tiles out to the side along the lane's perpendicular on the ground.
    const vCar = 1.0, vR = 2.4, head = 3.2, air = 0.95, R = 13, swing = 0.36, t0 = performance.now();
    const lx = (fx1 - fx0) / L, ly = (fy1 - fy0) / L, [perpX, perpY] = CityScene.P(-ly, lx), pl = Math.hypot(perpX, perpY);
    const angle = Math.atan2(dyu, dxu) * 180 / Math.PI;
    let jumpAt = null;
    const step = (now) => {
      const t = (now - t0) / 1000, dC = head + vCar * t, dR = vR * t;
      // take off so that the top of the roll comes right over the car
      if (jumpAt === null && dC - dR <= 0.65) jumpAt = t;
      const u = jumpAt === null ? 0 : Math.min(1, (t - jumpAt) / air), flying = u > 0 && u < 1, rolling = flying;
      const roll = flying ? 2 * Math.PI * u : 0, lift = flying ? R * (1 - Math.cos(roll)) : 0, out = rolling ? swing * Math.sin(roll) : 0;
      const [cx, cy] = at(dC), [gx, gy] = at(dR), rx = gx + perpX * out, ry = gy + perpY * out;
      car.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`);
      // turning about its long axis: squashed across its length through zero, mirrored when upside down
      const sy = rolling ? Math.cos(roll) : 1;
      rs.setAttribute("transform", `translate(${rx.toFixed(1)} ${(ry - lift).toFixed(1)}) translate(0 -2.6) rotate(${angle.toFixed(1)}) scale(1 ${sy.toFixed(3)}) rotate(${(-angle).toFixed(1)}) translate(0 2.6)`);
      shadow.setAttribute("cx", rx.toFixed(1)); shadow.setAttribute("cy", ry.toFixed(1));
      shadow.setAttribute("opacity", flying ? (0.5 * (1 - lift / (2 * R) / 1.3)).toFixed(2) : "0");
      // the thrusters fire from just before take-off until the car lands
      const firing = jumpAt !== null ? t - jumpAt < air + 0.04 : dC - dR <= 1.0;
      // the underside's direction on screen: down on the road, out to the side
      // through the roll, up when the car is upside down
      let jx = rolling ? (perpX / pl) * Math.sin(roll) * 0.9 : 0, jy = (rolling ? (perpY / pl) * Math.sin(roll) * 0.9 : 0) + Math.cos(rolling ? roll : 0);
      const jl = Math.hypot(jx, jy) || 1; jx /= jl; jy /= jl;
      const bodyX = rx, bodyY = ry - lift - 2.6;
      jets.forEach((jet, k) => {
        if (!firing) return jet.setAttribute("opacity", "0");
        const side = k ? 1 : -1, px = bodyX + dxu * side * 6 + jx * 1.6, py = bodyY + dyu * side * 6 + jy * 1.6, len = 7 + Math.random() * 4, wx = -jy * 1.1, wy = jx * 1.1;
        jet.setAttribute("points", `${(px + wx).toFixed(1)},${(py + wy).toFixed(1)} ${(px - wx).toFixed(1)},${(py - wy).toFixed(1)} ${(px + jx * len).toFixed(1)},${(py + jy * len).toFixed(1)}`);
        jet.setAttribute("opacity", (0.6 + Math.random() * 0.25).toFixed(2));
      });
      if (firing && now - lastPuff > nextPuff) {
        const p = puffs.find((q) => !live.includes(q)), side = Math.random() < 0.5 ? -1 : 1;
        if (p) live.push(Object.assign(p, { born: now, x: bodyX + dxu * side * 6 + jx * 6, y: bodyY + dyu * side * 6 + jy * 6, vx: jx * 58 - dxu * 22 + (Math.random() - 0.5) * 16, vy: jy * 58 - dyu * 22 + (Math.random() - 0.5) * 16 }));
        lastPuff = now; nextPuff = 16 + Math.random() * 16;
      }
      for (let i = live.length - 1; i >= 0; i--) {
        const p = live[i], age = (now - p.born) / 1000;
        if (age > 0.7) { p.setAttribute("r", "0"); live.splice(i, 1); continue; }
        const k = 1 - Math.exp(-age * 4);
        p.setAttribute("cx", (p.x + p.vx * k / 4).toFixed(1)); p.setAttribute("cy", (p.y + p.vy * k / 4).toFixed(1));
        p.setAttribute("r", (1.6 + age * 11).toFixed(1)); p.setAttribute("opacity", (0.88 * (1 - age / 0.7)).toFixed(2));
      }
      if (dR > L + 1 && dC > L + 1) { g.remove(); stunting = false; scheduleStunt(Math.max(0, 15000 + Math.random() * 15000 - (performance.now() - t0))); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function scheduleStunt(ms) {
    clearTimeout(stuntTimer);
    stuntTimer = setTimeout(() => (state.inView && !document.hidden && state.view === "city" ? stunt() : scheduleStunt(4000)), ms);
  }
  scheduleStunt(5000 + Math.random() * 5000);
  // a hook for checking it without waiting: svg.dispatchEvent(new Event("citystunt"))
  svg.addEventListener("citystunt", stunt);

  /* ---- the tour: the visitor's own scrolling flies the camera through the city ---- */
  // "Take the tour" pins the city to the screen and turns the page's scroll
  // into a timeline t: 0 is the whole city, 1 to 7 the districts in route
  // order and 8 the whole city again. The camera is a curve through the
  // frames "Take it apart" uses, rising between districts and dipping in on
  // arrival; the district nearest the camera comes apart by how close the
  // camera is, with the same three layers and labels. The camera is a
  // transform on .city-model (the compositor moves one texture) relative to
  // a viewBox rewritten only when the visitor rests, so the drawing is crisp
  // at any zoom without being redrawn on every frame. Nothing moves by
  // itself: a notch of a wheel is a push that eases off, and everything else
  // is the page scrolling. Wheel events are never cancelled, since cancelling
  // the first of a trackpad's stream drops the whole gesture in Chrome.
  const TOUR = ui.tour, tourEl = $("#city-tour"), track = $("#city-track");
  if (TOUR && tourEl && track && btn.tour) {
    const route = (TOUR.route || []).filter((id) => sc.zones[id]), NT = route.length;
    const tStage = $("#city-tour-stage"), tTitle = $("#city-tour-title"), tSub = $("#city-tour-sub"), tRail = $("#city-tour-rail"), tCard = $("#city-tour-card"), tHint = $("#city-tour-hint"), tEnd = $("#city-tour-end");
    const mix = (a, b, t) => a + (b - a) * t, smooth = (x) => x * x * (3 - 2 * x), lim = (v, a, b) => Math.max(a, Math.min(b, v));
    const nameOf = (id) => zoneOf[id]?.name || id, idx = (id) => route.indexOf(id) + 1;
    const jump = (top) => scrollTo({ top, left: 0, behavior: "instant" });
    const T = { on: false, t: 0, tr: 0, vh: 1, top: 0, raf: 0, last: 0, lastScroll: 0, baked: -1, W: 800, H: 448, B: VB0.slice(), K: [], F: VB0.slice(), cs: { s: 1, tx: 0, ty: 0 }, focus: null, k: 0, notesZ: null, cardZ: null, told: null, endTold: false, dir: 1, snapping: false, snapRaf: 0, idle: 0, inertia: false, inertiaT: 0, inertiaRaf: 0, vel: 0, y: 0, lastI: 0, dirty: true, seen: new Set(), labA: "" };
    const dots = {};
    $("[data-text]", tHint).textContent = fine ? TOUR.begin : TOUR.beginTouch;
    route.forEach((id, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "city-tour-dot";
      b.innerHTML = `<span>${nameOf(id)}</span><i></i>`; b.setAttribute("aria-label", fill(TOUR.dot, { name: nameOf(id), i: i + 1, n: NT }));
      b.addEventListener("click", () => goTo(i + 1));
      tRail.appendChild(b); dots[id] = b;
    });

    /* the camera */
    function measure() { T.W = view.clientWidth || 800; T.H = view.clientHeight || 448; T.K = [overview(), ...route.map(frameFor), overview()]; }
    // the whole city, a little closer than the page shows it, in the stage's shape
    function overview() {
      const aspect = T.W / T.H, k = 0.92, w = VB0[2] * k, h = VB0[3] * k, x = VB0[0] + (VB0[2] - w) / 2, y = VB0[1] + (VB0[3] - h) / 2;
      if (w / h < aspect) { const W = h * aspect; return [x - (W - w) / 2, y, W, h]; }
      const H = w / aspect; return [x, y - (H - h) / 2, w, H];
    }
    // the box "Take it apart" frames, set a little above centre so it clears
    // the card, with room beside it for the label columns
    function frameFor(id) {
      const [x0, y0, x1, y1] = sc.explode(id).box, W = T.W, aspect = W / T.H, wide = isWide(), col = wide ? colW() + 20 : 0;
      const room = Math.max(0.42, 1 - (2 * col + 40) / W), padV = wide ? 0.2 : 0.3, cyf = wide ? 0.46 : 0.38;
      const w = Math.max((x1 - x0) / room, (y1 - y0) * (1 + padV * 2) * aspect), h = w / aspect;
      return [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h * cyf, w, h];
    }
    // the frame at t: a Catmull-Rom curve through the frame centres, eased
    // so the camera slows into each district, and a zoom that lifts between
    function camAt(t) {
      const K = T.K, n = K.length - 1; t = lim(t, 0, n);
      const i = Math.min(n - 1, Math.floor(t)), s = t - i;
      const c = (k) => { const F = K[lim(k, 0, n)]; return [F[0] + F[2] / 2, F[1] + F[3] / 2]; };
      const p0 = c(i - 1), p1 = c(i), p2 = c(i + 1), p3 = c(i + 2);
      const cr = (a, b, c2, d, u) => 0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u);
      const u = s + (smooth(s) - s) * 0.6;
      const cx = cr(p0[0], p1[0], p2[0], p3[0], u), cy = cr(p0[1], p1[1], p2[1], p3[1], u);
      const bump = i === 0 || i === n - 1 ? 0.08 : 0.3;
      const w = mix(K[i][2], K[i + 1][2], u) * (1 + bump * Math.sin(Math.PI * s)), h = w / (T.W / T.H);
      return [cx - w / 2, cy - h / 2, w, h];
    }
    function pose(t) {
      t = lim(t, 0, NT + 1);
      let focus = null, kf = 0;
      route.forEach((id, i) => { const d = Math.abs(t - (i + 1)), k = 1 - smooth(clamp((d - 0.08) / 0.4)); if (k > kf) { kf = k; focus = id; } });
      const tilt = t < 1 ? 7 * (1 - smooth(clamp(t / 0.6))) : t > NT ? 7 * smooth(clamp((t - NT - 0.4) / 0.6)) : 0;
      return { t, F: camAt(t), focus, k: kf, tilt, noteA: focus ? clamp((kf - 0.82) / 0.18) : 0, endA: clamp((t - NT - 0.55) / 0.3), hintA: 1 - clamp(t / 0.1), labA: Math.max(1 - clamp(t / 0.45), clamp((t - NT - 0.4) / 0.45)) };
    }
    // the transform that shows frame F when the drawing is rendered for frame B
    function camOf(F) {
      const [bx, by, bw, bh] = T.B, s = bw / F[2], px = (F[0] + F[2] / 2 - bx) / bw * T.W, py = (F[1] + F[3] / 2 - by) / bh * T.H;
      return { s, tx: T.W / 2 - s * px, ty: T.H / 2 - s * py };
    }
    // at rest the camera is baked into the viewBox, so the city is crisp at any zoom
    function bake(F) { T.B = F.slice(); setVB(F); T.cs = { s: 1, tx: 0, ty: 0 }; model.style.transform = "translate3d(0px, 0px, 0px) scale(1)"; T.dirty = true; }

    /* what the visitor reads: the card, the bar and the rail */
    function setCard(id, a) {
      if (id && T.cardZ !== id) {
        T.cardZ = id;
        const card = cardOf(id);
        $(".city-tour-num", tCard).textContent = fill(TOUR.at, { i: idx(id), n: NT });
        $("h3", tCard).textContent = nameOf(id);
        $(".city-tour-blurb", tCard).textContent = $(":scope > p", card)?.textContent || "";
        const chips = $(".chips", card);
        $(".chips", tCard).replaceChildren(...(chips ? [...chips.children].map((c) => c.cloneNode(true)) : []));
      }
      tCard.style.opacity = a.toFixed(3); tCard.style.transform = `translateY(${((1 - a) * 10).toFixed(1)}px)`; tCard.style.pointerEvents = a > 0.6 ? "auto" : "none";
    }
    function render() {
      const po = pose(T.tr), t = po.t;
      if (po.focus !== T.focus) {
        if (T.focus) placeDistrict(T.focus, 0);
        T.focus = po.focus; T.k = 0;
        if (po.focus) setActive(po.focus);
      }
      const wasApart = T.k > 0;
      T.k = po.k;
      if (T.focus && dk[T.focus] !== po.k) placeDistrict(T.focus, po.k);
      if (po.k > 0 !== wasApart) apply();
      T.F = po.F; T.cs = camOf(po.F);
      model.style.transform = `translate3d(${T.cs.tx.toFixed(2)}px, ${T.cs.ty.toFixed(2)}px, 0px) scale(${T.cs.s.toFixed(4)})`;
      const tilt = po.tilt > 0.01 ? `1 0 0 ${po.tilt.toFixed(2)}deg` : "";
      if (model.style.rotate !== tilt) model.style.rotate = tilt;
      const labA = po.labA.toFixed(3);
      if (labA !== T.labA) { T.labA = labA; sc.labelLayer.style.opacity = labA; }
      setCard(po.noteA > 0 ? T.focus : T.cardZ, po.noteA);
      // the labels "Take it apart" draws, once the district is nearly apart
      if (po.noteA > 0 && T.focus && isWide()) {
        if (T.notesZ !== T.focus) { T.notesZ = T.focus; notesEl.style.setProperty("--floor", `${tCard.offsetHeight + 40}px`); showDistrictNotes(T.focus); }
        notesEl.style.opacity = po.noteA.toFixed(3);
        layoutNotes();
      } else if (T.notesZ) { T.notesZ = null; hideNotes(); }
      if (po.noteA >= 0.99 && T.focus && T.told !== T.focus) { T.told = T.focus; announce(fill(TOUR.live.arrive, { name: nameOf(T.focus), i: idx(T.focus), n: NT })); }
      if (po.noteA <= 0) T.told = null;
      const hintA = po.hintA.toFixed(3), endA = po.endA.toFixed(3), dim = (1 - po.endA * 0.6).toFixed(3);
      if (tHint.style.opacity !== hintA) tHint.style.opacity = hintA;
      if (tEnd.style.opacity !== endA) { tEnd.style.opacity = endA; tEnd.style.pointerEvents = po.endA > 0.5 ? "auto" : "none"; }
      if (view.style.opacity !== dim) view.style.opacity = dim;
      if (po.endA >= 0.99 && !T.endTold) { T.endTold = true; announce(TOUR.live.end); }
      if (po.endA <= 0) T.endTold = false;
      const near = Math.round(t), d = Math.abs(t - near);
      let title, sub, cur = null;
      if (near === 0 && t < 0.5) { title = fine ? TOUR.begin : TOUR.beginTouch; sub = fill(TOUR.count, { n: NT }); }
      else if (near === NT + 1 && t > NT + 0.5) { title = TOUR.endTitle; sub = TOUR.endSub; }
      else if (d < 0.3 && near >= 1 && near <= NT) { cur = route[near - 1]; title = nameOf(cur); sub = fill(TOUR.at, { i: near, n: NT }); }
      else { const nx = lim(T.dir > 0 ? Math.ceil(t) : Math.floor(t), 1, NT); title = fill(TOUR.flying, { name: nameOf(route[nx - 1]) }); sub = fill(TOUR.at, { i: nx, n: NT }); }
      if (tTitle.textContent !== title) tTitle.textContent = title;
      if (tSub.textContent !== sub) tSub.textContent = sub;
      if (cur) T.seen.add(cur);
      for (const id of route) { const b = dots[id]; if (id === cur) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); b.classList.toggle("seen", T.seen.has(id) && id !== cur); }
    }
    // the drawn t follows the scrolled t with a little weight, which smooths
    // the steps of a wheel without ever lagging behind it
    function loop(now) {
      if (!T.on) return;
      const dt = Math.min(64, now - T.last); T.last = now;
      const prev = T.tr, tau = reduced ? 40 : 90;
      T.tr += (T.t - T.tr) * (1 - Math.exp(-dt / tau));
      if (Math.abs(T.t - T.tr) < 0.0003) T.tr = T.t;
      if (T.tr !== prev) T.dir = Math.sign(T.tr - prev) || T.dir;
      if (T.tr !== prev || T.dirty) { T.dirty = false; render(); }
      // once the drawn camera has caught up with a scroll that has stopped,
      // bake it, so the city is crisp exactly where the visitor rests
      else if (T.tr === T.t && T.baked !== T.t && !T.snapping && !T.inertia && now - T.lastScroll > 150) { T.baked = T.t; bake(T.F); }
      T.raf = requestAnimationFrame(loop);
    }

    /* in and out */
    function enter() {
      if (T.on) return;
      if (state.storm) finishStorm(true);
      if (state.view !== "city") resetViews();
      if (state.expanded) setExpanded(false);
      hideTip();
      state.under = false;
      Object.assign(T, { on: true, t: 0, tr: 0, dir: 1, focus: null, k: 0, notesZ: null, cardZ: null, told: null, endTold: false, labA: "" });
      T.seen.clear();
      state.tour = T;
      route.forEach((id) => sc.explode(id));
      tourEl.hidden = false;
      document.body.classList.add("is-touring"); document.documentElement.classList.add("is-touring"); section.classList.add("is-touring"); cls("is-touring", true);
      notesEl.style.setProperty("--inset", "44px"); notesEl.style.setProperty("--ceil", "84px");
      tStage.appendChild(view);
      T.vh = innerHeight || 800; track.hidden = false; track.style.height = `${(NT + 2.4) * T.vh}px`;
      T.top = section.getBoundingClientRect().top + scrollY;
      jump(T.top);
      measure(); bake(overview()); setActive(route[0]); apply(); render();
      T.last = performance.now(); T.raf = requestAnimationFrame(loop);
      announce(TOUR.live.start);
      $('[data-act="tour-leave"]', tourEl)?.focus({ preventScroll: true });
    }
    function leave({ to = "top", select } = {}) {
      if (!T.on) return;
      stopInertia(); cancelSnap(); clearTimeout(T.idle); cancelAnimationFrame(T.raf);
      const last = select || T.focus || route[lim(Math.round(T.tr), 1, NT) - 1];
      if (T.focus) placeDistrict(T.focus, 0);
      Object.assign(T, { on: false, focus: null, k: 0 });
      state.tour = null;
      if (T.notesZ) { T.notesZ = null; hideNotes(); }
      notesEl.style.opacity = ""; notesEl.style.removeProperty("--inset"); notesEl.style.removeProperty("--ceil"); notesEl.style.removeProperty("--floor");
      cls("is-touring", false);
      setVB(VB0); model.style.transform = ""; model.style.rotate = ""; view.style.opacity = ""; sc.labelLayer.style.opacity = "";
      stage.insertBefore(view, stage.firstChild);
      section.classList.remove("is-touring"); track.hidden = true; tourEl.hidden = true;
      document.body.classList.remove("is-touring"); document.documentElement.classList.remove("is-touring");
      setActive(last); apply();
      const r = section.getBoundingClientRect(), top = r.top + scrollY;
      jump(to === "end" ? Math.max(top, top + r.height - innerHeight + 40) : top - 8);
      btn.tour.focus({ preventScroll: true });
      announce(TOUR.live.left);
    }
    T.leave = leave;

    /* the scroll sets t; a wheel notch is a push that eases off; a rest near
       a district finishes the arrival; the drawing is re-rendered crisp at rest */
    function goTo(i, { ms, ease = easeIO } = {}) {
      i = lim(i, 0, NT + 1); stopInertia(); cancelAnimationFrame(T.snapRaf);
      const y = T.top + i * T.vh, y0 = scrollY, t0 = performance.now(), dur = ms || (reduced ? 240 : Math.min(1100, 480 + 300 * Math.abs(i - T.t)));
      T.snapping = true;
      const step = (now) => { if (!T.snapping) return; const k = clamp((now - t0) / dur); jump(mix(y0, y, ease(k))); if (k < 1) T.snapRaf = requestAnimationFrame(step); else { T.snapping = false; scheduleRest(); } };
      T.snapRaf = requestAnimationFrame(step);
    }
    function cancelSnap() { if (T.snapping) { cancelAnimationFrame(T.snapRaf); T.snapping = false; } }
    function scheduleRest() { clearTimeout(T.idle); T.idle = setTimeout(rest, 200); }
    function rest() {
      if (!T.on || T.snapping || T.inertia) return;
      const t = T.t;
      if (t < 0 || t > NT + 1) return;
      const near = Math.round(t), d = Math.abs(t - near);
      if (d > 0.003 && d < 0.22 && near >= 1 && near <= NT) { goTo(near, { ms: reduced ? 200 : 560, ease: easeOut }); return; }
      bake(T.F);
    }
    // the push waits a moment before it moves anything, so that a trackpad
    // stream that begins with one big event can cancel it unnoticed
    function impulse(dir) {
      T.vel = lim(T.vel + dir * (reduced ? 650 : 950), -2600, 2600);
      if (T.inertia) return;
      T.inertia = true; clearTimeout(T.inertiaT);
      T.inertiaT = setTimeout(() => { if (!T.inertia) return; T.y = scrollY; T.lastI = performance.now(); T.inertiaRaf = requestAnimationFrame(inertiaStep); }, 45);
    }
    function inertiaStep(now) {
      if (!T.inertia) return;
      const dt = Math.min(0.05, (now - T.lastI) / 1000); T.lastI = now;
      T.y += T.vel * dt; T.vel *= Math.exp(-dt / (reduced ? 0.16 : 0.3));
      jump(T.y);
      if (Math.abs(T.vel) > 24 && T.on) T.inertiaRaf = requestAnimationFrame(inertiaStep); else stopInertia(true);
    }
    function stopInertia(settled) { if (!T.inertia) return; clearTimeout(T.inertiaT); cancelAnimationFrame(T.inertiaRaf); T.inertia = false; T.vel = 0; if (settled) scheduleRest(); }
    addEventListener("scroll", () => {
      if (!T.on) return;
      T.t = (scrollY - T.top) / T.vh; T.dirty = true; T.lastScroll = performance.now();
      if (T.t < -0.25) { leave({ to: "top" }); return; }
      if (T.t > NT + 1.4) { leave({ to: "end" }); return; }
      if (!T.snapping && !T.inertia) scheduleRest();
    }, { passive: true });
    addEventListener("scrollend", () => { if (T.on && !T.snapping && !T.inertia) { clearTimeout(T.idle); rest(); } });
    let lastWheel = 0, streak = 0;
    addEventListener("wheel", (e) => {
      if (!T.on) return;
      const now = performance.now();
      streak = now - lastWheel < 60 ? streak + 1 : 0; lastWheel = now;
      // a lone event after a pause is a notch of a wheel; a stream is a
      // trackpad or a smooth wheel, and the page scrolls with its own momentum
      const notch = e.deltaMode === 1 ? Math.abs(e.deltaY) >= 1 : Math.abs(e.deltaY) >= 30;
      if (streak === 0 && notch && Math.abs(e.deltaX) < 2) { cancelSnap(); impulse(Math.sign(e.deltaY)); return; }
      stopInertia(); cancelSnap();
    }, { passive: true });
    addEventListener("touchstart", () => { if (T.on) { stopInertia(); cancelSnap(); } }, { passive: true });
    // before the page's own Escape handling, so a readout closes on its own first
    document.addEventListener("keydown", (e) => {
      if (!T.on || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      const cur = Math.round(lim(T.t, 0, NT + 1)), go = (i) => { e.preventDefault(); goTo(i, { ms: reduced ? 240 : 820 }); };
      if (e.key === "Escape") { if (!openTip) { e.preventDefault(); leave(); } }
      else if (e.key === " " && e.target.closest?.("button, a")) return;
      else if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "ArrowRight" || (e.key === " " && !e.shiftKey)) go(cur + 1);
      else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "ArrowLeft" || (e.key === " " && e.shiftKey)) go(cur - 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(NT + 1);
    }, { capture: true });
    addEventListener("resize", () => {
      if (!T.on) return;
      const t = T.t; T.vh = innerHeight || 800; track.style.height = `${(NT + 2.4) * T.vh}px`;
      T.top = section.getBoundingClientRect().top + scrollY; jump(T.top + t * T.vh);
      measure(); bake(camAt(T.tr)); render();
    });
    btn.tour.addEventListener("click", enter);
    $('[data-act="tour-leave"]', tourEl)?.addEventListener("click", () => leave());
    $('[data-act="tour-end"]', tourEl)?.addEventListener("click", () => leave({ to: "end" }));
    $('[data-act="tour-open"]', tourEl)?.addEventListener("click", () => leave({ select: T.cardZ }));
    // on the tour a click on a district flies to it
    for (const [id, g] of Object.entries(sc.zones)) g.addEventListener("click", () => { if (T.on && route.includes(id)) goTo(idx(id)); });
  }

  /* ---- go ---- */
  // start on the district the page was built with (the first card)
  setActive(cards.find((c) => c.classList.contains("active"))?.dataset.zone || order[0]);
  paintHud();
  }
})();
