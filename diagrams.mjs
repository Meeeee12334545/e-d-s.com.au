// Illustrations: cutaway drawings that show how a method or an instrument
// works, on the pages that have no photograph of it. Each is inline SVG built
// from the cutaway kit in scene.mjs (photographic materials on the cut faces,
// lit surfaces, instruments drawn from their photographs), so it looks like
// the real thing yet stays sharp at any size, and its words stay text. The
// words in them, the alt text and the captions live in `diagrams` in
// content.mjs; a page names one with `diagram: "<id>"`. Every caption says it
// is an illustration.
//
// Labels sit on small plates in the drawing's own units and grow as a whole
// when the figure is narrow (a container query in site.css), so each label is
// placed with room to grow into. Moving parts are few, use transforms, dashes
// and fill-opacity, pause off screen like the other ambient loops, and sit in
// a layer of their own over the still drawing (stack()), so the textures are
// painted once.

import { texDefs, matDefs, instDefs, ground, waterTable, pipeLong, chamber, chamberWalls, shaft, water, eflow3, cable, hawk as hawkLogger, coverFrame, stepIron, avSensor, lidottR, kiosk, d605, dtc, hanger, frameSpan, tag, lead, flowArrow, subPump, riser, pipeRun, hatch, vent, sampler, building, sonde, rag, grease, silt, fouling, textW, lidAside, tablet, alarm2Unit, msfmUnit, rainGauge, solarPanel, transmitter, turf } from "./scene.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const f1 = (n) => Math.round(n * 10) / 10;
// A smooth line through [x, y] points (Catmull-Rom as cubic Béziers).
const smooth = (pts) => pts.map(([x, y], i) => {
  if (!i) return `M${f1(x)} ${f1(y)}`;
  const [x0, y0] = pts[i - 2] || pts[i - 1], [x1, y1] = pts[i - 1], [x3, y3] = pts[i + 1] || [x, y];
  return `C${f1(x1 + (x - x0) / 6)} ${f1(y1 + (y - y0) / 6)} ${f1(x - (x3 - x1) / 6)} ${f1(y - (y3 - y1) / 6)} ${f1(x)} ${f1(y)}`;
}).join("");
const sample = (from, to, step, fn) => { const out = []; for (let x = from; x <= to + 1e-6; x += step) out.push([x, fn(x)]); return out; };
// A label of one or two lines; `a` is the text anchor.
const label = (x, y, lines, { a = "start", cls = "" } = {}) => {
  const [first, ...rest] = [].concat(lines);
  return `<text x="${x}" y="${y}"${a !== "start" ? ` text-anchor="${a}"` : ""}${cls ? ` class="${cls}"` : ""}>${esc(first)}${rest.map((l) => `<tspan x="${x}" dy="1.25em">${esc(l)}</tspan>`).join("")}</text>`;
};
const leader = (d, cls = "") => `<path class="dg-leader${cls ? ` ${cls}` : ""}" d="${d}"/>`;
const svg = (w, h, body, defs = "") => `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`;
// A drawing in two layers: the still scene, with its textures, drawn once;
// and over it, in an SVG of its own on its own compositor layer, whatever
// moves, so a loop repaints only the few vectors that move (site.css:
// .dg-stack, .dg-fx).
const stack = (w, h, still, fx, defs = "", fxDefs = "") => `<div class="dg-stack">${svg(w, h, still, defs)}<svg class="dg-fx" viewBox="0 0 ${w} ${h}" aria-hidden="true">${fxDefs ? `<defs>${fxDefs}</defs>` : ""}${fx}</svg></div>`;
// the foot of a section block fading into the white plate
const fadeDef = (p) => `<linearGradient id="${p}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>`;

/* ---- thermal: a thermistor string finds where groundwater gets in ---- */
// A street in section between two manholes, the water table above the pipe.
// A string of temperature sensors runs from a D605 logger in the upstream
// manhole along the invert; a flow meter sits just upstream of the next one.
// Groundwater comes in at an open joint, and the chart under the ground
// shows the temperature along the pipe changing at the sensors nearest it.
function thermal(t) {
  const L = t.labels, p = "rtt";
  const W = 480, G = 34, TABLE = 92, CR = 148, INV = 180, T = 6, BOT = 236, WT = 8;
  const MA = [36, 96], MB = [384, 444], open = 34, oA = 66, oB = 414;
  const level = 169, at = 236, joints = [140, 188, 236, 284, 332];
  const beads = Array.from({ length: 12 }, (_, k) => 106 + k * 21.5);
  const base = 270, temp = (x) => base + 30 * Math.exp(-(((x - at) / 30) ** 2));
  const hot = beads.filter((x) => temp(x) - base > 5);
  const steps = [G + 38, G + 60, G + 82, G + 104];
  const drips = [0, 1, 2].map((n) => `<ellipse class="sc-drip" cx="${f1(at + 1 + n * 1.6)}" cy="${CR + 2}" rx="1.2" ry="1.9" style="--d:${n * 0.55}s"/>`).join("");
  const body = `
  ${ground(p, { x0: 0, x1: W, y: G, bottom: BOT, holes: [frameSpan(open, oA), frameSpan(open, oB)] })}
  ${waterTable(p, { x0: 0, x1: W, y: TABLE, bottom: BOT })}
  ${pipeLong(p, { x0: 0, x1: W, crown: CR, inv: INV, t: T, joints, gaps: [[MA[0] - WT, MA[1] + WT], [MB[0] - WT, MB[1] + WT]], open: [MA, MB], bed: 7, stain: level - 3 })}
  <ellipse cx="${at + 1}" cy="${CR + 10}" rx="13" ry="12" fill="url(#${p}-wetwall)"/>
  <path class="sc-trickle" d="M${at + 1} ${CR}q1.5 7 -.5 13"/>
  ${chamber(p, { a: MA[0], b: MA[1], crown: CR, inv: INV, t: WT })}
  ${chamber(p, { a: MB[0], b: MB[1], crown: CR, inv: INV, t: WT })}
  ${shaft(p, { a: MA[0], b: MA[1], top: G, bottom: CR, t: WT, ring: 28, slab: 8, open, oc: oA, steps, stepW: 18, wallTo: CR })}
  ${shaft(p, { a: MB[0], b: MB[1], top: G, bottom: CR, t: WT, ring: 28, slab: 8, open, oc: oB, steps, stepW: 18, wallTo: CR })}
  ${chamberWalls(p, { a: MA[0], b: MA[1], top: CR, crown: CR, inv: INV, t: WT })}
  ${chamberWalls(p, { a: MB[0], b: MB[1], top: CR, crown: CR, inv: INV, t: WT })}
  <path class="sc-dtc" d="M47 ${G + 30}V${INV - 3}Q47 ${INV - 1.6} 49 ${INV - 1.6}H${beads[0] - 4}"/>
  ${d605(p, 40, G + 14, 14)}
  ${hanger(p, MB[1], 434, G + 22)}
  ${hawkLogger(p, 434, G + 22, 11)}
  ${cable(`M375 ${INV - 2}H431Q436 ${INV - 2} 436 ${INV - 7}V${G + 46}`, { w: 1.2 })}
  ${water(p, { x0: 0, x1: W, level, bottom: INV })}
  ${dtc(p, 47, beads[beads.length - 1] + 4, INV - 1.6, beads, { hot })}
  ${avSensor(p, 352, INV, 22)}
  <path class="sc-joint-open" d="M${at - 0.6} ${CR - T - 0.4}l1.2 ${T * 0.45}-1 .9 1.6 ${T * 0.6}"/>
  ${tag(112, 56, L.logger, { bold: true })}${lead([[110, 52.5], [55, G + 21]])}
  ${tag(372, 56, L.meter, { a: "end", bold: true })}${lead([[366, 61], [366, INV - 5]])}
  ${tag(148, 86, L.groundwater)}<path class="sc-table-mark" d="M131 ${TABLE - 9}h11l-5.5 7.5z"/>
  ${tag(254, 126, L.defect, { bold: true })}${lead([[252, 129], [237.5, CR - 3]])}
  ${tag(84, 218, L.string, { bold: true })}${lead([[122, 209], [beads[1], INV - 1.6]])}
  ${flowArrow(150, 162)}
  <rect x="0" y="${BOT - 22}" width="${W}" height="23" fill="url(#${p}-fade)"/>
  <g class="sc-guide">${hot.map((x) => `<path d="M${f1(x)} ${INV + 3}V${f1(temp(x) - 5)}"/>`).join("")}</g>
  <path class="dg-grid" d="M92 ${base}H388"/>
  <path class="dg-band-cool" d="${smooth(sample(92, 388, 8, temp))}L388 ${base}H92Z"/>
  <path class="dg-axis" d="M92 318H388"/>
  <path class="dg-trace" d="${smooth(sample(92, 388, 8, temp))}"/>
  ${beads.map((x) => `${hot.includes(x) ? `<circle class="dg-bead-g" cx="${f1(x)}" cy="${f1(temp(x))}" r="3.2"/>` : ""}<circle class="dg-bead${hot.includes(x) ? " hot" : ""}" cx="${f1(x)}" cy="${f1(temp(x))}" r="3.2"/>`).join("")}
  ${label(92, 340, L.chart, { cls: "dg-b" })}
  ${label(292, 290, L.change, { cls: "dg-m" })}${leader("M288 287L256 293")}`;
  const defs = `${texDefs(p, 0.62)}${matDefs(p)}${instDefs(p)}${fadeDef(p)}<radialGradient id="${p}-wetwall">${["#1d2a24", "#1d2a24", "#1d2a24"].map((c, i) => `<stop offset="${[0, 0.55, 1][i]}" stop-color="${c}" stop-opacity="${[0.5, 0.22, 0][i]}"/>`).join("")}</radialGradient>`;
  const fx = `<g class="sc-drips">${drips}</g><g class="sc-seep"><path d="M206 104q18 10 26 38"/><path d="M268 104q-18 10 -26 38"/></g>`;
  return stack(480, 352, body, fx, defs);
}

/* ---- wetwell: a pump station under watch ---- */
// A sewage pump station in section: the precast wet well under its cover
// slab and hatch, the gravity main coming in, two submersible pumps on
// their duckfoot bends with the risers, valves and header taking the rising
// main out through the wall. The level rises from stop to start and the
// pumps draw it down (CSS: .dg-water, .dg-run, .dg-main-flow, on one 14 s
// cycle). A LIDoTT R under the slab reads the level by radar; the Pump
// Station Manager in its kiosk takes that and the pump runs, and sends them
// on. The water is drawn see-through, as a cutaway would show it, so the
// pumps read under it.
function wetwell(t) {
  const L = t.labels, p = "rtw";
  const W = 480, G = 86, WL = 176, WR = 320, WW = 10, FLOOR = 352, SLAB = 12;
  const lv = { overflow: 132, surcharge: 174, start: 222, stop: 296 };
  const CR = 150, INV = 174, HEAD = 118;
  const radar = { cx: 198, y: G + SLAB + 3 };
  const beam = efBeam(p, "bm", [radar.cx, radar.y + 22.5, 0, 1], 5, { toY: lv.stop - 4, waves: 3 });
  const p1 = subPump(p, 210, FLOOR, 28, { rails: G + SLAB + 2 }), p2 = subPump(p, 262, FLOOR, 28, { rails: G + SLAB + 2 });
  const lamp = (x) => `<circle class="dg-run" cx="${f1(x + 28 * 0.66 * 0.24)}" cy="${f1(FLOOR - 28 * 0.44 - 25.2 + 25.2 * 0.48)}" r="1.7"/>`;
  const risers = [p1.out, p2.out];
  const wellClip = `<clipPath id="${p}-well"><rect x="${WL}" y="${G + SLAB}" width="${WR - WL}" height="${FLOOR - G - SLAB}"/></clipPath>`;
  const level = (y, cls) => `<g class="dg-level${cls ? ` ${cls}` : ""}"><path d="M${WL} ${y}H${WR + WW + 8}"/></g>`;
  const body = `
  ${ground(p, { x0: 0, x1: W, y: G, bottom: 372, holes: [[WL - WW - 10, WR + WW + 10]] })}
  ${pipeLong(p, { x0: 0, x1: WL - WW + 1, crown: CR, inv: INV, t: 5, joints: [44, 112], bed: 6, stain: 167 })}
  ${water(p, { x0: 0, x1: WL - WW + 1, level: 162, bottom: INV })}
  <linearGradient id="${p}-ww" href="#${p}-in-shaft" gradientUnits="userSpaceOnUse" x1="${WL}" y1="0" x2="${WR}" y2="0"/>
  <linearGradient id="${p}-wf" href="#${p}-fall" gradientUnits="userSpaceOnUse" x1="0" y1="${G}" x2="0" y2="${FLOOR}"/>
  <rect x="${WL}" y="${G + SLAB}" width="${WR - WL}" height="${FLOOR - G - SLAB}" fill="url(#${p}-wall)"/>
  <rect x="${WL}" y="${G + SLAB}" width="${WR - WL}" height="${FLOOR - G - SLAB}" fill="url(#${p}-ww)"/>
  <rect x="${WL}" y="${G + SLAB}" width="${WR - WL}" height="${FLOOR - G - SLAB}" fill="url(#${p}-wf)"/>
  <rect x="${WL}" y="${lv.start - 2}" width="${WR - WL}" height="${FLOOR - lv.start + 2}" fill="#3b4524" fill-opacity=".12"/>
  <path class="sc-tide" d="M${WL} ${lv.start - 2}H${WR}"/>
  <path class="sc-bore-joint" d="M${WL} 150H${WR}M${WL} 222H${WR}M${WL} 294H${WR}"/>
  <path fill="url(#${p}-conc)" d="M${WL} ${FLOOR - 24}L${WL + 26} ${FLOOR}H${WL}ZM${WR} ${FLOOR - 24}L${WR - 26} ${FLOOR}H${WR}Z"/>
  <path class="sc-cut-edge" d="M${WL} ${FLOOR - 24}L${WL + 26} ${FLOOR}M${WR} ${FLOOR - 24}L${WR - 26} ${FLOOR}"/>
  ${p1.draw}${p2.draw}
  ${risers.map(([x, y], k) => riser(p, x, y, HEAD + 3.5, 6, { valves: [HEAD + 66 + k * 0, HEAD + 34] })).join("")}
  ${pipeRun(p, risers[0][0] - 3, W, HEAD, 7, [WR + WW + 18, 420])}
  ${cable(`M${f1(210 + 28 * 0.66 * 0.18 + 1.4)} ${f1(FLOOR - 28 * 0.44 - 25.2 - 2.24)}V${G + SLAB + 1}`, { w: 1 })}
  ${cable(`M${f1(262 + 28 * 0.66 * 0.18 + 1.4)} ${f1(FLOOR - 28 * 0.44 - 25.2 - 2.24)}V${G + SLAB + 1}`, { w: 1 })}
  <path fill="url(#${p}-conc)" d="M${WL - WW} ${G + SLAB}H${WL}V${CR - 5}H${WL - WW}ZM${WL - WW} ${INV + 5}H${WL}V${FLOOR}H${WL - WW}ZM${WR} ${G + SLAB}H${WR + WW}V${HEAD - 4.5}H${WR}ZM${WR} ${HEAD + 4.5}H${WR + WW}V${FLOOR}H${WR}ZM${WL - WW} ${FLOOR}H${WR + WW}V${FLOOR + 16}H${WL - WW}Z"/>
  <path class="sc-cut-edge" d="M${WL - WW} ${G + SLAB}V${CR - 5}M${WL - WW} ${INV + 5}V${FLOOR + 16}H${WR + WW}V${HEAD + 4.5}M${WR + WW} ${HEAD - 4.5}V${G + SLAB}M${WL} ${G + SLAB}V${CR - 5}M${WL} ${INV + 5}V${FLOOR}H${WR}V${HEAD + 4.5}M${WR} ${HEAD - 4.5}V${G + SLAB}"/>
  <path fill="url(#${p}-conc)" d="M${WL - WW - 10} ${G}H${WR + WW + 10}V${G + SLAB}H${WL - WW - 10}Z"/>
  <rect x="194" y="${G - 0.5}" width="98" height="${SLAB + 0.5}" fill="url(#${p}-void)"/>
  ${hatch(p, 194, 292, G - 1.8)}
  <path class="sc-cut-edge" d="M${WL - WW - 10} ${G}H194M292 ${G}H${WR + WW + 10}V${G + SLAB}H${WL - WW - 10}Z"/>
  ${vent(p, 310, G - 1, 22, 4)}
  <path class="sc-hanger" d="M${radar.cx} ${G + SLAB}V${radar.y}"/>
  ${lidottR(p, radar.cx, radar.y, 15)}
  ${cable(`M${radar.cx} ${radar.y}V${G + SLAB + 1}`, { w: 1 })}
  <path class="sc-conduit" d="M62 ${G + 3}V${G + 16}Q62 ${G + 22} 68 ${G + 22}H${WL - WW + 1}"/><path class="sc-conduit-hi" d="M62 ${G + 3}V${G + 16}Q62 ${G + 22} 68 ${G + 22}H${WL - WW + 1}"/>
  ${kiosk(p, 34, 42, 52, 42, { antenna: 14 })}
  ${tag(344, lv.overflow + 4, L.overflow, { cls: "alarm" })}${tag(344, lv.surcharge + 4, L.surcharge, { cls: "alarm" })}
  ${tag(344, lv.start + 4, L.start, { bold: true })}${tag(344, lv.stop + 4, L.stop, { bold: true })}
  ${tag(474, 106, L.main, { a: "end" })}
  ${tag(14, 126, L.radar, { bold: true })}${lead([[128, 122], [radar.cx - 8, radar.y + 12]])}
  ${tag(14, 198, L.inlet)}
  ${tag(14, 334, L.pumps, { bold: true })}${lead([[118, 330], [210 + 28 * 0.66 * 0.24, FLOOR - 28 * 0.44 - 25.2 * 0.52]])}
  ${label(92, 64, L.manager, { cls: "dg-b" })}
  ${label(474, 18, L.data, { a: "end", cls: "dg-m" })}`;
  const fx = `
  <g clip-path="url(#${p}-well)"><g class="dg-water">${water(p, { x0: WL, x1: WR, level: lv.start, bottom: FLOOR + 80, streaks: false, alpha: "t" })}</g></g>
  <path class="dg-fall" d="M${WL - 1} 168q8 3 10 24"/>
  <path class="dg-main-flow" d="${risers.map(([x, y]) => `M${f1(x)} ${f1(y)}V${HEAD}`).join("")}M${f1(risers[0][0])} ${HEAD}H${W - 6}"/>
  ${lamp(210)}${lamp(262)}
  ${beam.draw}
  <g>${level(lv.overflow, "alarm")}${level(lv.surcharge, "alarm")}${level(lv.start, "")}${level(lv.stop, "")}</g>
  <path class="dg-link" d="M60 14H${W - 196}"/>`;
  const defs = `${texDefs(p, 0.62)}${matDefs(p)}${instDefs(p)}`;
  const fxDefs = `${beam.defs}${wellClip}
  <linearGradient id="${p}-wtr-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9db4a8" stop-opacity=".78"/><stop offset=".06" stop-color="#7f9a8d" stop-opacity=".62"/><stop offset=".5" stop-color="#5f7c70" stop-opacity=".58"/><stop offset="1" stop-color="#344d45" stop-opacity=".72"/></linearGradient>`;
  return stack(480, 372, body, fx, defs, fxDefs);
}

/* ---- tradewaste: flow, sampling and quality at one discharge point ---- */
// A factory's discharge point in section: the drain leaves the building and
// runs to a metering pit on its way to the sewer. In the pit an area
// velocity sensor sits on the invert and a quality sonde hangs in the flow;
// a sampler beside the pit draws through its suction hose, and a kiosk with
// a logger and antenna sends the readings on.
function tradewaste(t) {
  const L = t.labels, p = "rtx";
  const W = 480, G = 122, CR = 212, INV = 234, T = 5, BOT = 304, PT = 7;
  const PA = 232, PB = 290, open = 40, oc = 261;
  const level = 227;
  const body = `
  ${building(p, 10, 152, 46, G)}
  ${ground(p, { x0: 0, x1: W, y: G, bottom: BOT, holes: [frameSpan(open, oc)] })}
  <rect x="106" y="${G}" width="12" height="${CR - G - 2}" fill="url(#${p}-pvcv)"/>
  <path class="sc-edge-dk" d="M106 ${G}V${CR - 2}M118 ${G}V${CR - 2}"/>
  ${pipeLong(p, { x0: 100, x1: W, crown: CR, inv: INV, t: 3, gaps: [[107, 117], [PA - PT, PB + PT]], open: [[PA, PB]], bed: 6, mat: "pvc", stain: level - 2 })}
  <rect x="96" y="${CR - 3}" width="4" height="${INV - CR + 9}" fill="url(#${p}-pvcv)"/>
  ${chamber(p, { a: PA, b: PB, crown: CR, inv: INV, t: PT, base: 8 })}
  ${shaft(p, { a: PA, b: PB, top: G, bottom: CR, t: PT, ring: 30, slab: 7, open, oc, steps: [G + 34, G + 58], stepW: 16, wallTo: CR })}
  ${chamberWalls(p, { a: PA, b: PB, top: CR, crown: CR, inv: INV, t: PT, base: 8 })}
  ${cable(`M258 ${INV - 2}H284Q287 ${INV - 2} 287 ${INV - 6}V${G + 18}`, { w: 1 })}
  ${water(p, { x0: 100, x1: W, level, bottom: INV })}
  ${avSensor(p, 240, INV, 18)}
  <path class="sc-probe-cable" d="M271 ${G + 14}V${CR + 2}"/>
  ${sonde(p, 271, CR + 1, INV - 2.5, 6.4)}
  <path class="sc-hanger" d="M${PB} ${G + 14}H271"/>
  <path class="sc-hose" d="M${336 - 17} ${G - 20}C300 ${G - 20} 298 ${G - 6} 298 ${G + 2}V${G + 8}Q298 ${G + 14} 292 ${G + 18}Q280 ${G + 26} 280 ${G + 40}V${INV - 6}"/>
  <path class="sc-hose-in sc-draw" d="M280 ${INV - 6}V${G + 40}Q280 ${G + 26} 292 ${G + 18}Q298 ${G + 14} 298 ${G + 8}V${G + 2}C298 ${G - 6} 300 ${G - 20} ${336 - 17} ${G - 20}"/>
  <rect x="277.6" y="${INV - 7}" width="4.8" height="5" rx="1" fill="url(#${p}-ssv)"/>
  <path class="sc-conduit" d="M186 ${G + 5}V${G + 12}Q186 ${G + 16} 190 ${G + 16}H${PA - PT}"/><path class="sc-conduit-hi" d="M186 ${G + 5}V${G + 12}Q186 ${G + 16} 190 ${G + 16}H${PA - PT}"/>
  ${cable(`M${PA} ${G + 16}H271`, { w: 0.9 })}
  ${kiosk(p, 168, 80, 36, 42, { antenna: 12 })}
  ${sampler(p, 336, G, 34)}
  <rect x="0" y="${BOT - 20}" width="${W}" height="21" fill="url(#${p}-fade)"/>
  ${label(81, 30, L.site, { a: "middle", cls: "dg-m" })}
  ${label(186, 52, L.data, { a: "middle", cls: "dg-b" })}
  ${label(336, 52, L.sampling, { a: "middle", cls: "dg-b" })}
  ${tag(318, 186, L.quality, { bold: true })}${lead([[316, 183], [274.6, 214]])}
  ${tag(170, 278, L.flow, { bold: true })}${lead([[202, 272], [247, INV - 3]])}
  ${tag(470, 202, L.sewer, { a: "end" })}
  ${flowArrow(372, 222, "", { len: 30 })}`;
  return svg(480, 304, body, `${texDefs(p, 0.55)}${matDefs(p)}${instDefs(p)}${fadeDef(p)}`);
}

/* ---- wqstation: a sonde in a river, reporting from the bank ---- */
// The river in cross-section with its bank on the left: grass on the bank
// top, the soil cut, gravel and silt on the bed under the water. A slotted
// PVC guard pipe pegged down the bank holds a multi-parameter sonde under
// the surface, and its cable runs up to a stainless cabinet on a galvanised
// post with a solar panel and an antenna. The pipe and sonde are drawn in
// their own frame along the slope (`th` degrees): u down the pipe from its
// top end, y across it. The data link runs from the antenna in its own layer.
function wqstation(t) {
  const L = t.labels, p = "rtq";
  const G = 150, WL = 194, H = 318, th = 40;
  const c = Math.cos((th * Math.PI) / 180), s = Math.sin((th * Math.PI) / 180);
  const R = 13, r = 10.6, U0 = -2, U1 = 164; // the guard pipe: outer and inner radius, its ends
  const S = [152, 158]; // the top of the bank's straight slope
  const O = [S[0] + (R + 2) * s, S[1] - (R + 2) * c]; // the pipe's axis, resting on the bank
  const W = (u, y = 0) => [f1(O[0] + u * c - y * s), f1(O[1] + u * s + y * c)];
  const wx = f1(S[0] + ((WL - S[1]) / s) * c); // where the surface meets the bank
  const E = [f1(S[0] + 170 * c), f1(S[1] + 170 * s)]; // the toe of the bank
  const slope = `L${E[0]} ${E[1]}C${f1(E[0] + 16 * c)} ${f1(E[1] + 16 * s)} 312 289 340 290S440 291 480 286`;
  const land = `M0 ${G}H118C132 ${G} 141 149 ${S[0]} ${S[1]}`;
  // the bed: a skin of gravel and silt along the slope under the water
  const bed = `M${wx} ${WL}${slope}L480 ${H}H${wx}Z`;
  const segs = [];
  let a0 = U0;
  for (const s0 of [100, 112, 124, 136, 148]) { segs.push([a0, s0]); a0 = s0 + 3.5; }
  segs.push([a0, U1]);
  const walls = segs.map(([x0, x1]) => `M${x0} ${-R}H${x1}V${-r}H${x0}ZM${x0} ${r}H${x1}V${R}H${x0}Z`).join("");
  const top = W(-6), tip = W(150);
  const sx = 322;
  const body = `
  <rect x="190" y="${WL}" width="${480 - 190}" height="${300 - WL}" fill="url(#${p}-rv)"/>
  <path class="sc-surf-lo" d="M${wx} ${WL + 1.6}H480"/><path class="sc-surf" d="M${wx} ${WL + 0.4}H480"/>
  <path fill="url(#${p}-soil)" d="${land}${slope}L480 ${H}H0Z"/>
  <path fill="url(#${p}-humus)" d="M0 ${G}H118C132 ${G} 141 149 ${S[0]} ${S[1]}L${S[0]} ${S[1] + 14}L0 ${G + 14}Z"/>
  <clipPath id="${p}-bedc"><path d="${bed}"/></clipPath>
  <g clip-path="url(#${p}-bedc)"><path fill="none" stroke="url(#${p}-grav)" stroke-width="12" d="M${wx} ${WL}${slope}"/><path fill="none" stroke="rgba(120, 104, 80, .35)" stroke-width="12" d="M${wx} ${WL}${slope}"/></g>
  <path class="sc-cut-edge" d="M${wx} ${WL}${slope}"/>
  ${turf(0, S[0], (x) => (x <= 118 ? G : G + ((x - 118) / (S[0] - 118)) * (S[1] - G) * 0.6), { seed: "wq" })}
  <rect x="68" y="${G - 1}" width="22" height="26" fill="url(#${p}-conc)"/><path class="sc-cut-edge" d="M68 ${G - 1}V${G + 25}H90V${G - 1}"/>
  <rect x="76" y="38" width="6" height="${G + 22 - 38}" fill="url(#${p}-galvv)"/>
  ${solarPanel(p, 79, 34, 44, -20)}
  ${kiosk(p, 56, 76, 46, 48, { antenna: 0 })}
  <path class="sc-mast" d="M97 76V58"/><rect x="95.9" y="49" width="2.2" height="10" rx="1.1" fill="#1b1f22"/>
  ${cable(`M${top[0]} ${top[1]}C150 146 146 147.5 140 147.5H86V125`, { w: 1.4 })}
  <g transform="translate(${f1(O[0])} ${f1(O[1])}) rotate(${th})">
    ${[24, 84].map((u) => `<path class="sc-stake" d="M${u} ${R}V${R + 16}"/><rect x="${u - 1.4}" y="${-R - 1.2}" width="2.8" height="${2 * R + 2.4}" rx=".6" fill="url(#${p}-galv)"/>`).join("")}
    <rect x="${U0}" y="${-r}" width="${U1 - U0}" height="${2 * r}" fill="#24302d" fill-opacity=".35"/>
    ${cable("M-6 0H93", { w: 2.2 })}
    <rect x="93" y="-3.4" width="6" height="6.8" rx="1" fill="url(#${p}-blkv)"/>
    <rect x="98" y="-7.6" width="44" height="15.2" rx="3.2" fill="url(#${p}-blk)"/>
    <rect x="104" y="-6" width="16" height="12" rx=".5" fill="url(#${p}-label)"/>
    <path class="sc-lbl-r" d="M106 -2.6h11M106 0h8M106 2.6h10"/>
    <rect x="141" y="-8.2" width="14" height="16.4" rx="2" fill="url(#${p}-ssv)"/>
    ${[-4.6, -1.6, 1.6, 4.6].map((y) => `<rect x="143" y="${f1(y - 0.7)}" width="10" height="1.4" rx=".5" fill="#1f2629"/>`).join("")}
    <path fill="url(#${p}-pvc)" d="${walls}"/><path class="sc-edge-dk" d="${walls}"/>
    <rect x="${U0 - 3}" y="${-R}" width="3.6" height="${2 * R}" rx="1" fill="#3a4246"/>
    <rect x="${U1}" y="${-R}" width="3.6" height="${2 * R}" rx="1" fill="#3a4246"/>
  </g>
  ${label(212, 64, L.data, { cls: "dg-b" })}
  <text x="${sx}" y="98">${L.sensors.map((l, i) => `<tspan class="dg-b"${i ? ` x="${sx}" dy="1.25em"` : ""}>${esc(l)}</tspan>`).join("")}<tspan class="dg-m" x="${sx}" dy="1.45em">${esc(L.more)}</tspan></text>
  ${lead([[sx - 6, 122], [tip[0], tip[1]]])}`;
  const fx = `<circle class="dg-ping" cx="97" cy="48" r="9"/><path class="dg-link" d="M204 60H112"/>`;
  return stack(480, H, body, fx, `${texDefs(p, 0.6)}${matDefs(p)}${instDefs(p)}<linearGradient id="${p}-rv" href="#${p}-river" gradientUnits="userSpaceOnUse" x1="0" y1="${WL}" x2="0" y2="300"/>`);
}

/* ---- connect: readings in over 4G, validated data out one way ---- */
// The network in section on the left (a manhole with a flow meter on the
// invert and a Hawk logger, a pump station's wet well with a LIDoTT R and
// a kiosk), its readings rising over 4G to EDS FlowSense, and four one-way
// links on to your own building, seen in section with its rack and screen.
// Arrowheads only on the way out; the dashes run in their own layer.
function connect(t) {
  const L = t.labels, p = "rtc";
  const G = 232, CROWN = G + 48, INV = G + 74, T = 6;
  const MA = [36, 70]; // the manhole, inside faces
  const WA = 172, WB = 228, WW = 8, FLOOR = G + 94, WLV = G + 68; // the wet well
  const H = FLOOR + WW + 29;
  const F = { x: 172, y: 30, w: 100, h: 92 }; // EDS FlowSense
  const outs = [44, 68, 92, 116], turns = [452, 432, 412, 392], IN = 88;
  const ROOF = G - 78, rows = [0, 1, 2, 3, 4].map((k) => G - 46 + 9 * k);
  const beam = efBeam(p, "bm", [200, G + 36.5, 0, 1], 6, { toY: WLV - 1, waves: 3 });
  const day = (x) => { const u = (x - 182) / 40; return 0.5 + 0.28 * Math.sin(2 * Math.PI * u - 1.9) + 0.1 * Math.sin(4 * Math.PI * u - 0.6); };
  const trace = smooth(sample(182, 262, 4, (x) => f1(102 - 36 * day(x))));
  const oc = (MA[0] + MA[1]) / 2;
  const body = `
  ${ground(p, { x0: 0, x1: 480, y: G, bottom: H, holes: [frameSpan(22, oc), [WA - WW - 4, WB + WW + 4]] })}
  ${pipeLong(p, { x0: 0, x1: WA - WW, crown: CROWN, inv: INV, t: T, joints: [110], gaps: [[MA[0], MA[1]]], bed: 6, stain: INV - 12 })}
  ${shaft(p, { a: MA[0], b: MA[1], top: G, bottom: CROWN, t: T, ring: 22, slab: 6, open: 22, oc, steps: [G + 24, G + 38], stepW: 11, wallTo: CROWN })}
  ${water(p, { x0: 0, x1: WA - WW, level: INV - 10, bottom: INV })}
  <linearGradient id="${p}-ww" href="#${p}-in-shaft" gradientUnits="userSpaceOnUse" x1="${WA}" y1="0" x2="${WB}" y2="0"/>
  <rect x="${WA}" y="${G}" width="${WB - WA}" height="${FLOOR - G}" fill="url(#${p}-wall)"/><rect x="${WA}" y="${G}" width="${WB - WA}" height="${FLOOR - G}" fill="url(#${p}-ww)"/>
  ${water(p, { x0: WA, x1: WB, level: WLV, bottom: FLOOR, streaks: false })}
  <path fill="url(#${p}-conc)" d="M${WA - WW} ${G}H${WA}V${CROWN}H${WA - WW}ZM${WA - WW} ${INV}H${WA}V${FLOOR}H${WA - WW}ZM${WB} ${G}H${WB + WW}V${FLOOR}H${WB}ZM${WA - WW} ${FLOOR}H${WB + WW}V${FLOOR + WW}H${WA - WW}Z"/>
  <path class="sc-cut-edge" d="M${WA - WW} ${G}V${CROWN}M${WA - WW} ${INV}V${FLOOR + WW}H${WB + WW}V${G}M${WA} ${G}V${CROWN}M${WA} ${INV}V${FLOOR}H${WB}V${G}"/>
  ${hatch(p, WA - 2, WB + 2, G - 1.8)}
  ${avSensor(p, 92, INV, 16)}
  ${cable(`M108 ${INV - 2}H62Q60 ${INV - 2} 60 ${INV - 6}V${G + 30}`, { w: 1 })}
  ${hanger(p, MA[1], 58, G + 12)}${hawkLogger(p, 58, G + 12, 8)}
  ${cable(`M138 ${G + 1}V${G + 8}H200V${G + 14}`, { w: 1 })}
  <path class="sc-hanger" d="M200 ${G + 6}V${G + 14}"/>
  ${lidottR(p, 200, G + 14, 15)}
  ${kiosk(p, 116, G - 40, 34, 40, { antenna: 14 })}
  <rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" rx="2" fill="#1f2a2c"/>
  <rect x="${F.x + 3.5}" y="${F.y + 3.5}" width="${F.w - 7}" height="${F.h - 7}" rx="1" fill="#f7faf9"/>
  <rect x="${F.x + 3.5}" y="${F.y + 3.5}" width="${F.w - 7}" height="9" fill="#0d7c72"/>
  <path d="M${F.x + 9} ${F.y + 8}h18" stroke="#bfe6df" stroke-width="1.2"/>
  <path class="dg-grid" d="M182 58H262M182 78H262M182 98H262"/>
  <path d="${trace}L262 104H182Z" fill="#5fb4a6" fill-opacity=".22"/>
  <path class="dg-trace" d="${trace}"/>
  <path d="M182 112h34M222 112h22" stroke="#c3cdcc" stroke-width="1.2"/>
  ${outs.map((y, k) => `<path class="dg-head" d="M${turns[k] - 4.5} ${ROOF - 8}L${turns[k]} ${ROOF - 1}L${turns[k] + 4.5} ${ROOF - 8}Z"/>`).join("")}
  ${[...outs.map((y) => [F.x + F.w, y]), [F.x, IN]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#095f57"/>`).join("")}
  <circle cx="133" cy="${IN}" r="2.4" fill="#095f57"/>
  ${L.links.map((l, k) => label(282, outs[k] - 6, l, { cls: "dg-b" })).join("")}
  ${label(222, 20, L.platform, { a: "middle", cls: "dg-b" })}
  ${label(280, 139, L.none, { cls: "dg-m" })}
  ${label(143, IN - 7, L.g4, { cls: "dg-b" })}
  <rect x="366" y="${ROOF + 8}" width="104" height="${G - ROOF - 8}" fill="#e9eeee"/>
  <rect x="366" y="${ROOF + 8}" width="104" height="${G - ROOF - 8}" fill="url(#${p}-room)"/>
  <path fill="url(#${p}-conc)" d="M360 ${ROOF}H476V${ROOF + 8}H360ZM360 ${ROOF + 8}H366V${G}H360ZM470 ${ROOF + 8}H476V${G}H470Z"/>
  <path class="sc-cut-edge" d="M360 ${G}V${ROOF}H476V${G}M366 ${G}V${ROOF + 8}H470V${G}"/>
  <rect x="376" y="${G - 56}" width="24" height="56" rx="1" fill="url(#${p}-blkv)"/>
  ${rows.map((y) => `<rect x="379" y="${y - 2}" width="18" height="5" rx=".4" fill="#2f363a"/><circle class="sc-lamp" cx="394" cy="${y + 0.5}" r=".9"/>`).join("")}
  <rect x="408" y="${G - 22}" width="56" height="2.6" fill="#8a6f52"/><rect x="410" y="${G - 19.4}" width="2.4" height="19.4" fill="#6e5841"/><rect x="459.6" y="${G - 19.4}" width="2.4" height="19.4" fill="#6e5841"/>
  <rect x="418" y="${G - 52}" width="38" height="24" rx="1.4" fill="#1c2224"/>
  <rect x="420" y="${G - 50}" width="34" height="19" fill="#f2f6f5"/>
  ${[[424, 8], [431, 13], [438, 6], [445, 11]].map(([x, h]) => `<rect x="${x}" y="${G - 33 - h}" width="4" height="${h}" fill="#0d7c72"/>`).join("")}
  <rect x="434" y="${G - 28}" width="6" height="6" fill="#30373a"/>
  ${tag(470, G + 34, L.yours, { a: "end", bold: true })}
  ${tag(12, H - 12, L.sites, { bold: true })}`;
  const fx = `
  ${beam.draw}
  <path class="dg-send" d="M60 ${G - 4}V${IN}H${F.x - 3}"/>
  <path class="dg-send" d="M144 ${G - 54}V${IN}H133"/>
  ${outs.map((y, k) => `<path class="dg-send" d="M${F.x + F.w + 4} ${y}H${turns[k]}V${ROOF - 6}"/>`).join("")}`;
  return stack(480, H, body, fx, `${texDefs(p, 0.55)}${matDefs(p)}${instDefs(p)}${beam.defs}<linearGradient id="${p}-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`);
}

/* ---- Sensor Fort: the four usual ways to hold a sensor in a sewer ---- */
// One long section each, flow left to right, shown failing over a twelve
// second loop: rag drifts in with the flow and catches, one piece after
// another, on whatever faces the flow or crosses it (a probe on its chain,
// a ring and its cable, a bracket, the intake of a sample line). Each carries
// a red cross, so the four read as what does not work before a word is read.
// The words are page text under each drawing (build.mjs: problemBand); the
// motion is CSS (site.css: .sfm-*), paused off screen with the other
// illustrations.
const SM = { w: 320, h: 168, crown: 52, inv: 138, surf: 100 };
// a strand of rag that arrives n-th (1 to 4) and stays where it is drawn
const smRag = (p, x, y, n, k = n, dx = -170) => `<g class="sfm-in n${n}" style="--dx:${dx}px">${rag(x, y, 20, { seed: `${p}${n}${k}`, tone: k, bend: 2.2 })}</g>`;
const smScene = (p, inner, { shaft = null } = {}) => {
  const { w, h, crown, inv, surf } = SM, T = 8;
  return stack(w, h, `
  <rect width="${w}" height="${crown - T}" fill="url(#${p}-soil)"/><rect y="${inv + T}" width="${w}" height="${h - inv - T}" fill="url(#${p}-soil)"/>
  ${pipeLong(p, { x0: 0, x1: w, crown, inv, t: T, joints: [40, 290], gaps: shaft ? [[shaft[0], shaft[1]]] : [], bed: 0, stain: surf - 3 })}
  ${shaft ? `<linearGradient id="${p}-sh" href="#${p}-in-shaft" gradientUnits="userSpaceOnUse" x1="${shaft[0]}" y1="0" x2="${shaft[1]}" y2="0"/>
  <rect x="${shaft[0]}" y="0" width="${shaft[1] - shaft[0]}" height="${crown}" fill="url(#${p}-wall)"/><rect x="${shaft[0]}" y="0" width="${shaft[1] - shaft[0]}" height="${crown}" fill="url(#${p}-sh)"/>
  ${stepIron(p, (shaft[0] + shaft[1]) / 2 + 10, 18, 16)}
  <path fill="url(#${p}-conc)" d="M${shaft[0] - T} 0H${shaft[0]}V${crown}H${shaft[0] - T}ZM${shaft[1]} 0H${shaft[1] + T}V${crown}H${shaft[1]}Z"/>
  <path class="sc-cut-edge" d="M${shaft[0] - T} 0V${crown - T}M${shaft[0]} 0V${crown}M${shaft[1]} 0V${crown}M${shaft[1] + T} 0V${crown - T}"/>` : ""}
  ${water(p, { x0: 0, x1: w, level: surf, bottom: inv })}`, `
  ${inner}
  <path class="sm-arrow" d="M272 ${inv - 9}h26m-6-4 6 4-6 4"/>
  <g class="sfm-x"><circle cx="${w - 22}" cy="22" r="12"/><path d="M${w - 27} 17l10 10m0-10l-10 10"/></g>`, `${efDefs(p, { k: 0.5 })}`);
};
const SF_METHODS = {
  // a probe hung down the manhole on a chain: it swings in the flow, and
  // rag collects on the probe and the chain
  chain: (p) => smScene(p, `
  <g class="sfm-swing" style="transform-origin:160px 0">
    <path class="sm-chain" d="M160 0V106"/><path class="sm-chain l" d="M160 0V106"/>
    ${sonde(p, 160, 104, 132, 10)}
    ${smRag(p, 150, SM.surf + 2, 1)}${smRag(p, 148, 110, 2)}${smRag(p, 151, 119, 3)}${smRag(p, 149, 126, 4)}
  </g>`, { shaft: [128, 192] }),
  // a sensor strapped to a band in the pipe, as a flow sensor is: the
  // sensor, its band and its cable all sit in the flow
  ring: (p) => smScene(p, `
  <rect x="146" y="${SM.crown}" width="20" height="2" fill="url(#${p}-ss)"/><rect x="140" y="${SM.inv - 2}" width="58" height="2" fill="url(#${p}-ss)"/>
  ${cable(`M152 ${SM.inv - 4}C120 ${SM.inv - 3} 84 ${SM.inv - 6} 0 ${SM.inv - 4}`, { w: 1.6 })}
  ${avSensor(p, 150, SM.inv - 1.6, 40)}
  ${smRag(p, 142, SM.inv - 10, 1)}${smRag(p, 152, SM.inv - 14, 2, 3)}${smRag(p, 86, SM.inv - 6, 3, 1, -110)}${smRag(p, 60, SM.inv - 8, 4, 0, -90)}`),
  // a bracket bolted to the manhole wall, reaching down into the flow: it
  // has to be drilled and fixed from inside, and then it catches rag itself
  bracket: (p) => smScene(p, `
  <path d="M128 10h14v118h-5V40h-9z" fill="url(#${p}-galvv)"/><path class="sc-edge-dk" d="M128 10h14v118h-5V40h-9z"/>
  <circle class="sc-bolt" cx="133" cy="18" r="2"/><circle class="sc-bolt" cx="133" cy="32" r="2"/>
  <rect x="140" y="112" width="34" height="13" rx="5" fill="url(#${p}-blk)"/><rect x="174" y="114.5" width="5" height="8" rx="1.5" fill="url(#${p}-ss)"/>
  <rect x="148" y="109" width="6" height="19" rx="1" fill="url(#${p}-galvv)"/>
  ${smRag(p, 131, SM.surf + 2, 1)}${smRag(p, 132, 109, 2)}${smRag(p, 131, 118, 3)}${smRag(p, 142, 107, 4, 1)}`, { shaft: [128, 192] }),
  // a pump lifting a sample up a line to a cabinet: the intake blocks, the
  // flow stops, and there is a pump, a line and a cabinet to look after
  cabinet: (p) => smScene(p, `
  <path class="sm-hose" d="M158 126V40Q158 22 176 22"/><path class="dg-hose-flow sfm-choke" d="M158 126V40Q158 22 176 22"/>
  <rect x="174" y="9" width="28" height="26" rx="1.5" fill="url(#${p}-brushed)"/><path class="sc-seam" d="M176 12h24v20h-24z"/><rect x="179" y="15" width="12" height="7" fill="#2a3236"/><circle class="sfm-led" cx="196" cy="29" r="2"/>
  <path class="sm-hose" d="M202 22h12"/><path class="dg-hose-flow sfm-choke" d="M202 22h12"/>
  <rect x="214" y="11" width="34" height="22" rx="1.5" fill="url(#${p}-brushed)"/><rect x="217" y="14" width="28" height="16" fill="#cfe3e6" fill-opacity=".6"/><rect class="dg-foul sfm-grow" x="217" y="14" width="28" height="16"/><rect x="227" y="3" width="8" height="21" rx="2" fill="url(#${p}-blkv)"/>
  <rect x="153" y="125" width="10" height="7" rx="1.5" fill="url(#${p}-ssv)"/>
  ${[[146, 128, 0], [156, 133, 1], [162, 126, 2]].map(([x, y, k]) => `<g class="sfm-in n${k + 1}">${grease(p, x, y, 4.2, 2.6)}</g>`).join("")}
  ${smRag(p, 144, 124, 2, 1)}${smRag(p, 148, 133, 4, 3)}`, { shaft: [128, 262] }),
};
export const sfMethod = (kind) => SF_METHODS[kind](`sfm-${kind}`);

/* ---- Sensor Fort itself, drawn from the SF 150 datasheet ---- */
// The datasheet gives the mount in side elevation and from upstream: 345 mm
// long with a 47 mm flexible boot at the nose, walls 135 mm high that rise
// over the last 80 mm to stern blocks 175 mm high, two sensors lying 15° tip
// down with their tips at the stern face, and each cable running inside its
// wall and out of the top of its block. These drawings set that out in
// millimetres (nose at the origin, y up) and place it with X and Y, which
// turn millimetres into the units of each drawing.
const sfWall = (X, Y) => `M${X(0)} ${Y(0)}V${Y(131)}Q${X(0)} ${Y(135)} ${X(4)} ${Y(135)}H${X(262)}C${X(292)} ${Y(135)} ${X(298)} ${Y(175)} ${X(326)} ${Y(175)}H${X(345)}V${Y(0)}Z`;
const sfBoot = (X, Y) => `M${X(0)} ${Y(0)}V${Y(131)}Q${X(0)} ${Y(135)} ${X(4)} ${Y(135)}H${X(47)}V${Y(0)}Z`;
const sfStrip = (X, Y) => `M${X(47)} ${Y(137)}H${X(262)}V${Y(135)}H${X(47)}Z`;
// the cable's way out: forward from the head of the sensor, up and back along
// the top of the wall, then up through the stern block
const sfRoute = (X, Y) => `M${X(187)} ${Y(72)}H${X(112)}A${f1(Math.abs(X(27) - X(0)))} ${f1(Math.abs(Y(27) - Y(0)))} 0 0 1 ${X(112)} ${Y(126)}H${X(270)}C${X(300)} ${Y(126)} ${X(323)} ${Y(142)} ${X(323)} ${Y(175)}`;
// a sensor in its bay: 190 mm long, 28.5 mm across, 15° tip down, tip just
// proud of the stern face
const sfSensor = (X, Y, { tip = 349, low = 29, len = 190, dia = 28.5 } = {}) => {
  const c = Math.cos(Math.PI / 12), s = Math.sin(Math.PI / 12), r = dia / 2;
  const pt = (along, side) => `${X(tip - along * c + side * s)} ${Y(low + along * s + side * c)}`;
  return `M${pt(0, r)}L${pt(len, r)}L${pt(len, -r)}L${pt(0, -r)}Z`;
};
// the mount as a solid body, from the side: teal walls, the dark boot at the
// nose and the flexible strip along the top
const sfBody = (X, Y, p) => (p
  ? `<path d="${sfWall(X, Y)}" fill="url(#${p}-sft)"/><path d="${sfWall(X, Y)}" fill="url(#${p}-sfsh)"/><path d="${sfBoot(X, Y)}" fill="url(#${p}-sfboot)"/><path d="${sfStrip(X, Y)}" fill="url(#${p}-sfstrip)"/><path class="sfd-edge" d="${sfWall(X, Y)}"/>`
  : `<path class="sfd-body" d="${sfWall(X, Y)}"/><path class="sfd-boot" d="${sfBoot(X, Y)}"/><path class="sfd-strip" d="${sfStrip(X, Y)}"/>`);
// a dimension: a line between two points with a slash at each end, and its
// figure beside it
const sfDim = (x1, y1, x2, y2, text, { dx = 0, dy = -6, a = "middle" } = {}) => `
  <path class="sfd-dim" d="M${x1} ${y1}L${x2} ${y2}M${x1 - 4} ${y1 + 4}l8-8M${x2 - 4} ${y2 + 4}l8-8"/>
  <text class="sfd-fig" x="${f1((x1 + x2) / 2 + dx)}" y="${f1((y1 + y2) / 2 + dy)}" text-anchor="${a}">${esc(text)}</text>`;
const sfDot = (x, y) => `<circle class="sfd-dot" cx="${x}" cy="${y}" r="4.2"/>`;
const sfBadge = (n, bx, by, dx, dy) => `<path class="sfd-lead" d="M${bx} ${by}L${dx} ${dy}"/>${sfDot(dx, dy)}<g class="sf-b" style="transform-origin:${bx}px ${by}px"><circle cx="${bx}" cy="${by}" r="13"/><text x="${bx}" y="${by}">${n}</text></g>`;

// The mount's materials, after EDS's renders: teal moulded polymer lit from
// above (a sheen along its top, deeper where it meets the floor), the
// paler curved cheek, the black flexible boot and the grey lip strips.
const sfMat = (p) => `
  <linearGradient id="${p}-sft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fbfb3"/><stop offset=".12" stop-color="#3f9f95"/><stop offset=".6" stop-color="#2f8a81"/><stop offset="1" stop-color="#1f6b63"/></linearGradient>
  <linearGradient id="${p}-sfsh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".1"/><stop offset=".3" stop-color="#fff" stop-opacity=".06"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>
  <linearGradient id="${p}-cheek" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#86dccf"/><stop offset=".4" stop-color="#55b9ac"/><stop offset="1" stop-color="#2f8a81"/></linearGradient>
  <linearGradient id="${p}-sfboot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b4244"/><stop offset=".35" stop-color="#626a6c"/><stop offset="1" stop-color="#2b3133"/></linearGradient>
  <linearGradient id="${p}-sfstrip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7ccce"/><stop offset="1" stop-color="#7f8789"/></linearGradient>
  <linearGradient id="${p}-benchf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
  <linearGradient id="${p}-mouth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>`;
// The mount in the chase, in section along the centre line with the near wall
// cut away: the manhole floor and the wall above the outlet, the far wall of
// the mount with its cheek and the sensor inside it, and the cable going up
// the wall. Water is drawn between two layers of it, on a canvas
// (src/js/sensor-fort.js), from the surface and the floor given here, so
// `back` goes under the water and `front` over it; `still` is the water as a
// plain fill, for a page without the script.
export function sfSection(p = "sfs") {
  const W = 1080, H = 470, K = 1.6, INV = 400, N = 250;
  const X = (mm) => f1(N + mm * K), Y = (mm) => f1(INV - mm * K);
  const XS = N + 345 * K, OBV = INV - 150 * K, BENCH = INV - 147 * K, LIFT = 3 * K;
  const surf = [[0, 301], [N, 301], [N + 80, 300], [N + 370, 301], [N + 470, 304], [XS, 309], [XS + 58, 312], [W, 312]];
  const bed = [[0, INV], [N, INV], [N + 1, INV - 1.3], [N + 47 * K, INV - LIFT], [XS, INV - LIFT], [XS, INV], [W, INV]];
  // the water runs a little faster between the cheeks and out past the tips
  const pace = [[0, 1], [N + 230, 1], [XS - 60, 1.5], [XS + 40, 1.55], [W, 1.3]];
  const defs = `${efDefs(p, { k: 1.5 })}${sfMat(p)}
  <linearGradient id="${p}-ins" href="#${p}-in-shaft" gradientUnits="userSpaceOnUse" x1="-200" y1="0" x2="${W + 200}" y2="0"/>
  <linearGradient id="${p}-inb" href="#${p}-in-pipe" gradientUnits="userSpaceOnUse" x1="0" y1="${OBV}" x2="0" y2="${INV}"/>
  <linearGradient id="${p}-sw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9db4a8" stop-opacity=".4"/><stop offset="1" stop-color="#344d45" stop-opacity=".7"/></linearGradient>`;
  const back = `<defs>${defs}</defs>
  <rect width="${W}" height="${H}" fill="url(#${p}-wall)"/><rect width="${W}" height="${H}" fill="url(#${p}-ins)"/>
  <rect width="${W}" height="${f1(BENCH)}" fill="#000" fill-opacity=".16"/>
  <path class="sc-bore-joint" d="M0 120H${XS}"/><path class="sc-bore-joint l" d="M0 121.2H${XS}"/>
  <path fill="url(#${p}-wall)" d="M0 ${f1(BENCH)}H${XS}V${INV}H0Z"/><path fill="url(#${p}-benchf)" d="M0 ${f1(BENCH)}H${XS}V${INV}H0Z"/>
  <path class="sc-bench-edge" d="M0 ${f1(BENCH)}H${XS}"/>
  <rect x="${XS}" y="${OBV}" width="${W - XS}" height="${INV - OBV}" fill="url(#${p}-wall)"/><rect x="${XS}" y="${OBV}" width="${W - XS}" height="${INV - OBV}" fill="url(#${p}-inb)"/>
  <rect x="${XS}" y="${OBV}" width="${W - XS}" height="${INV - OBV}" fill="url(#${p}-mouth)"/>
  <path fill="url(#${p}-cut)" d="M0 ${INV}H${W}V${H}H0ZM${XS} 0H${W}V${OBV}H${XS}Z"/>
  <path class="sc-cut-edge" d="M0 ${INV}H${W}M${XS} 0V${OBV}H${W}"/>
  ${stepIron(p, XS - 40, 34, 34).replace(/ellipse cx="[^"]+"/, (m) => m)}
  <path d="${sfWall(X, Y)}" fill="url(#${p}-sft)"/>
  <path d="${sfWall(X, Y)}" fill="url(#${p}-sfsh)"/>
  <path d="${sfBoot(X, Y)}" fill="url(#${p}-sfboot)"/>
  <path class="sfd-boot-hi" d="M${X(3)} ${Y(128)}H${X(45)}"/>
  <path d="M${X(124)} ${Y(3)}C${X(124)} ${Y(72)} ${X(138)} ${Y(113)} ${X(170)} ${Y(111)}L${X(345)} ${Y(64)}V${Y(3)}Z" fill="url(#${p}-cheek)"/>
  <path class="sfd-cheek-hi" d="M${X(127)} ${Y(20)}C${X(127)} ${Y(72)} ${X(140)} ${Y(108)} ${X(170)} ${Y(107)}L${X(340)} ${Y(63)}"/>
  <path d="${sfStrip(X, Y)}" fill="url(#${p}-sfstrip)"/>
  <path class="sfd-rim" d="M${X(47)} ${Y(134.6)}H${X(262)}C${X(292)} ${Y(134.6)} ${X(298)} ${Y(174.6)} ${X(326)} ${Y(174.6)}H${X(345)}"/>
  <path class="sfd-route" d="${sfRoute(X, Y)}"/>
  <path class="sfd-sensor" d="${sfSensor(X, Y)}"/>
  <path class="sfd-tip" d="${sfSensor(X, Y, { tip: 351, len: 6, dia: 15 })}"/>
  <path class="sfd-edge" d="${sfWall(X, Y)}"/>
  <path class="sfd-floor b" d="M${X(0)} ${Y(0)}V${Y(0.8)}L${X(47)} ${Y(3)}V${Y(0)}Z"/><path class="sfd-floor" d="M${X(47)} ${Y(0)}V${Y(3)}H${X(345)}V${Y(0)}Z"/>
  <path class="sfd-tether" d="M${X(336)} ${Y(175)}C${X(336)} ${Y(205)} ${X(339)} ${Y(225)} ${X(339)} ${Y(250)}"/>
  ${cable(`M${X(323)} ${Y(175)}C${X(323)} ${Y(200)} ${X(330)} ${Y(218)} ${X(330)} ${Y(250)}`, { w: 8 })}`;
  const still = `<path fill="url(#${p}-sw)" d="M${surf.map(([x, y]) => `${x} ${y}`).join("L")}L${[...bed].reverse().map(([x, y]) => `${f1(x)} ${f1(y)}`).join("L")}Z"/><path class="ef-surf" d="M${surf.map(([x, y]) => `${x} ${y}`).join("L")}"/>`;
  const front = `
  ${tag(18, f1(BENCH + 26), "Benching", { size: 13 })}
  ${tag(W - 18, 32, "Manhole wall", { a: "end", size: 13 })}
  ${tag(W - 18, OBV + 28, "Outlet pipe", { a: "end", size: 13 })}
  <text class="sf-say" x="22" y="286">Flow</text><path class="dg-arrow" d="M62 281h30m-8-5 8 5-8 5"/>
  ${sfBadge(1, 196, 348, N + 4, INV - 4)}
  ${sfBadge(2, 470, 236, 470, 352)}
  ${sfBadge(3, 372, 118, 420, f1(INV - 136 * K))}
  ${sfBadge(4, 700, 66, X(338), Y(158))}
  ${sfBadge(5, 872, 84, X(330.5), 44)}
  ${sfBadge(6, 912, 250, XS + 7, Y(27))}`;
  return { w: W, h: H, back, still, front, flow: { w: W, h: H, surf, bed: bed.map(([x, y]) => [f1(x), f1(y)]), pace, wake: XS } };
}

// Going in from the lid, as one loop: the mount comes down the wall above
// the outlet hanging nose low, its nose lands in the chase, it lies down
// pointing upstream as the tether is paid out, and the flow parks its stern
// blocks on the wall. The motion is sampled here into keyframes, so the mount
// and the tether it hangs from stay together; the steps beside the drawing
// light up in time with it (site.css: .sf-go).
export function sfInstall(p = "sfi") {
  const W = 720, H = 400, K = 0.8, F = 342, WALL = 552, T = 12;
  const TILT = 48, LAND = 3.8, DOWN = 6.6, PUSH = 7.0, HOME = 8.0;
  const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  // where the mount is at time t: its nose (drawing units) and its tilt
  const pose = (t) => {
    let a = TILT, gap = 9, up = 0;
    if (t < LAND) up = 330 * (1 - ease(t / LAND) ** 0.9);
    else if (t < DOWN) { const u = ease((t - LAND) / (DOWN - LAND)); a = TILT * (1 - u); gap = 9 + 9 * u; }
    else { a = 0; gap = 18 * (1 - ease((t - PUSH) / (HOME - PUSH))); }
    const r = (a * Math.PI) / 180;
    const x = WALL - (345 * Math.cos(r) + gap) * K, y = F - up * K;
    // the top of the stern block, where the tether leaves
    const hx = x + (333 * Math.cos(r) - 175 * Math.sin(r)) * K, hy = y - (333 * Math.sin(r) + 175 * Math.cos(r)) * K;
    return { x, y, a, hx, hy };
  };
  const steps = 48, frames = Array.from({ length: steps + 1 }, (_, i) => pose((i / steps) * T));
  const pct = (i) => f1((i / steps) * 100);
  const keys = (name, fn) => `@keyframes ${name}{${frames.map((f, i) => `${pct(i)}%{transform:${fn(f)}}`).join("")}}`;
  const end = pose(T);
  const X = (mm) => f1(mm * K), Y = (mm) => f1(-mm * K);
  const body = `
  <rect width="${W}" height="${H}" fill="url(#${p}-wall)"/><rect width="${W}" height="${H}" fill="url(#${p}-ins)"/>
  <rect width="${W}" height="${f1(F - 147 * K)}" fill="#000" fill-opacity=".16"/>
  <path fill="url(#${p}-wall)" d="M0 ${f1(F - 147 * K)}H${WALL}V${F}H0Z"/><path fill="url(#${p}-benchf)" d="M0 ${f1(F - 147 * K)}H${WALL}V${F}H0Z"/><path class="sc-bench-edge" d="M0 ${f1(F - 147 * K)}H${WALL}"/>
  <rect x="${WALL}" y="${F - 150 * K}" width="${W - WALL}" height="${150 * K}" fill="url(#${p}-wall)"/><rect x="${WALL}" y="${F - 150 * K}" width="${W - WALL}" height="${150 * K}" fill="url(#${p}-inb)"/><rect x="${WALL}" y="${F - 150 * K}" width="${W - WALL}" height="${150 * K}" fill="url(#${p}-mouth)"/>
  <path fill="url(#${p}-cut)" d="M0 ${F}H${W}V${H}H0ZM${WALL} 0H${W}V${F - 150 * K}H${WALL}Z"/>
  <path class="sc-cut-edge" d="M0 ${F}H${W}M${WALL} 0V${F - 150 * K}H${W}"/>
  ${stepIron(p, WALL - 34, 44, 28)}${stepIron(p, WALL - 34, 114, 28)}
  ${water(p, { x0: 0, x1: W, level: F - 44, bottom: F })}
  ${tag(W - 16, 28, "Manhole wall", { a: "end", size: 12 })}
  ${tag(W - 16, F - 150 * K + 26, "Outlet pipe", { a: "end", size: 12 })}
  ${tag(16, f1(F - 147 * K - 12), "Chase", { size: 12 })}`;
  const fx = `
  <style>${keys(`${p}-mount`, (f) => `translate(${f1(f.x)}px,${f1(f.y)}px) rotate(${f1(-f.a)}deg)`)}${keys(`${p}-rope`, (f) => `translate(${f1(f.hx)}px,${f1(f.hy)}px)`)}</style>
  <g class="sfi-go">
    <g class="sfi-rope" style="animation-name:${p}-rope;transform:translate(${f1(end.hx)}px,${f1(end.hy)}px)"><path class="sfd-rope sfi-taut" d="M0 0V-${H}"/></g>
    <path class="sfd-rope sfi-slack" d="M${f1(end.hx)} ${f1(end.hy)}C${f1(end.hx - 30)} ${f1(end.hy - 60)} ${WALL - 46} 150 ${WALL - 8} 113V0"/>
    <g class="sfi-mount" style="animation-name:${p}-mount;transform:translate(${f1(end.x)}px,${f1(end.y)}px)">${sfBody(X, Y, `${p}m`)}</g>
  </g>
  <path class="dg-arrow sfi-push" d="M34 ${F - 22}h64m-9-6 9 6-9 6"/>`;
  return stack(W, H, body, fx, `${efDefs(p, { k: 1 })}${sfMat(p)}<linearGradient id="${p}-ins" href="#${p}-in-shaft" gradientUnits="userSpaceOnUse" x1="-160" y1="0" x2="${W + 160}" y2="0"/><linearGradient id="${p}-inb" href="#${p}-in-pipe" gradientUnits="userSpaceOnUse" x1="0" y1="${F - 150 * K}" x2="0" y2="${F}"/>`, sfMat(`${p}m`));
}

// Where the SF 150 fits: the chase from the side with the three figures to
// measure, and across with its width.
export function sfSite(p = "sfw") {
  const K = 0.9, N = 196, INV = 214;
  const X = (mm) => f1(N + mm * K), Y = (mm) => f1(INV - mm * K);
  const XS = N + 345 * K, OBV = INV - 165 * K, TOP = INV - 137 * K;
  const side = svg(744, 290, `
  <rect x="48" y="${f1(INV - 52 * K)}" width="${f1(XS + 96 - 48)}" height="${f1(52 * K)}" class="sfd-water"/>
  <rect x="${XS}" y="${f1(OBV)}" width="96" height="${f1(165 * K)}" class="sfd-outlet"/>
  <path fill="url(#${p}-cut)" d="M48 ${INV}H${f1(XS + 96)}V${INV + 16}H48ZM${XS} 16H${f1(XS + 46)}V${f1(OBV)}H${XS}Z"/>
  <path class="ef-edge" d="M48 ${INV}H${f1(XS + 96)}M48 ${INV + 16}H${f1(XS + 96)}M${XS} 16V${f1(OBV)}H${f1(XS + 46)}V16"/>
  ${sfBody(X, Y)}
  <path class="sfd-dash" d="M48 ${f1(TOP)}H${XS}M${f1(XS + 96)} ${f1(OBV)}H${f1(XS + 122)}M${f1(XS + 96)} ${INV}H${f1(XS + 122)}"/>
  <text class="sfd-fig" x="52" y="${f1(TOP - 8)}">Top of chase wall (benching)</text>
  <text class="sfd-fig" x="${f1(XS + 48)}" y="${f1((OBV + INV) / 2 - 3)}" text-anchor="middle">Outlet<tspan x="${f1(XS + 48)}" dy="1.25em">DN150</tspan></text>
  ${sfDim(74, INV, 74, f1(TOP), "walls 137 min", { dx: 9, dy: 4, a: "start" })}
  ${sfDim(f1(XS - 350 * K), INV + 42, XS, INV + 42, "straight chase 350 min", { dy: 19 })}
  <path class="sfd-ext" d="M${f1(XS - 350 * K)} ${INV + 20}V${INV + 48}M${XS} ${INV + 20}V${INV + 48}"/>
  ${sfDim(f1(XS + 112), INV, f1(XS + 112), f1(OBV), "obvert 165 max", { dx: 9, dy: 4, a: "start" })}`, efDefsFlat(p));
  // across the chase: a U channel in the benching, the mount in it
  const C = 150, R = 73.45, WAT = 54, IR = R - 15, half = Math.sqrt(IR ** 2 - (IR + 15 - WAT) ** 2);
  const end = svg(300, 290, `
  <path fill="url(#${p}e-cut)" d="M18 62L75 84V163A75 75 0 0 0 225 163V84L282 62V268H18Z"/>
  <path class="ef-edge" d="M18 62L75 84V163A75 75 0 0 0 225 163V84L282 62"/>
  <path class="sfd-body" d="M${C - R} 103V${f1(238 - R)}A${R} ${R} 0 0 0 ${C + R} ${f1(238 - R)}V103H${C + IR}V${f1(238 - R)}A${IR} ${IR} 0 0 1 ${C - IR} ${f1(238 - R)}V103Z"/>
  <path class="sfd-water" d="M${f1(C - half)} ${238 - WAT}A${IR} ${IR} 0 0 0 ${f1(C + half)} ${238 - WAT}Z"/>
  <path class="sfd-strip" d="M75 101h17v3H75zM208 101h17v3h-17z"/>
  <path class="sfd-ext" d="M75 78V38M225 78V38"/>
  ${sfDim(75, 46, 225, 46, "147 to 153", { dy: -9 })}`, efDefsFlat(`${p}e`));
  return { side, end };
}

// The SF 150 in side elevation and from upstream, with its dimensions, as
// the datasheet draws it.
export function sfDims() {
  const K = 1.3, N = 104, INV = 262;
  const X = (mm) => f1(N + mm * K), Y = (mm) => f1(INV - mm * K);
  const XS = N + 345 * K;
  const side = svg(660, 322, `
  <path class="sfd-sheet" d="${sfWall(X, Y)}"/>
  <path class="sfd-boot" d="${sfBoot(X, Y)}"/><path class="sfd-strip" d="M${X(47)} ${Y(136.6)}H${X(262)}V${Y(134.4)}H${X(47)}Z"/>
  <path class="sfd-dash" d="M${X(47)} ${Y(3)}H${X(345)}"/>
  <path class="sfd-route s" d="${sfRoute(X, Y)}V${Y(198)}m-5 7 5-7 5 7"/>
  <path class="sfd-sensor s" d="${sfSensor(X, Y)}"/><path class="sfd-axis" d="M${X(349 - 205 * 0.966)} ${Y(29 + 205 * 0.259)}L${X(349 + 12 * 0.966)} ${Y(29 - 12 * 0.259)}"/>
  <path class="sfd-ext" d="M${N} ${INV + 6}V${INV + 36}M${XS} ${INV + 6}V${INV + 36}M${N} ${Y(140)}V${Y(166)}M${X(47)} ${Y(140)}V${Y(166)}M${N - 6} ${INV}H${N - 30}M${N - 6} ${Y(135)}H${N - 30}M${f1(XS + 6)} ${INV}H${f1(XS + 30)}M${f1(XS + 6)} ${Y(175)}H${f1(XS + 30)}"/>
  ${sfDim(N, INV + 30, XS, INV + 30, "345", { dy: 19 })}
  ${sfDim(N, f1(INV - 160 * K), f1(N + 47 * K), f1(INV - 160 * K), "47 boot", { dy: -9, dx: 12 })}
  ${sfDim(N - 24, INV, N - 24, f1(INV - 135 * K), "135", { dx: -9, dy: 4, a: "end" })}
  ${sfDim(f1(XS + 24), INV, f1(XS + 24), f1(INV - 175 * K), "175", { dx: 9, dy: 4, a: "start" })}
  <text class="sfd-fig b" x="${N + 8}" y="${INV + 19}">Flow</text><path class="dg-arrow" d="M${N + 44} ${INV + 14}h34m-8-5 8 5-8 5"/>`);
  const C = 150, R = 73.45 * K, IR = 58.45 * K, LIP = 77 * K, BAY = 14.25 * K;
  const end = svg(300, 322, `
  <path class="sfd-sheet" d="M${f1(C - R)} ${Y(175)}h${f1(15 * K)}V${Y(135)}h${f1(-15 * K)}zM${f1(C + R)} ${Y(175)}h${f1(-15 * K)}V${Y(135)}h${f1(15 * K)}z"/>
  <path class="sfd-boot" d="M${f1(C - R)} ${Y(135)}V${Y(73.45)}A${f1(R)} ${f1(R)} 0 0 0 ${f1(C + R)} ${Y(73.45)}V${Y(135)}H${f1(C + IR)}V${Y(73.45)}A${f1(IR)} ${f1(IR)} 0 0 1 ${f1(C - IR)} ${Y(73.45)}V${Y(135)}Z"/>
  <path class="sfd-strip" d="M${f1(C - LIP)} ${Y(136.6)}h${f1(LIP - IR)}V${Y(134.4)}h${f1(IR - LIP)}zM${f1(C + LIP)} ${Y(136.6)}h${f1(IR - LIP)}V${Y(134.4)}h${f1(LIP - IR)}z"/>
  <circle class="sfd-sensor s" cx="${f1(C - 33 * K)}" cy="${Y(31)}" r="${f1(BAY)}"/><circle class="sfd-sensor s" cx="${f1(C + 33 * K)}" cy="${Y(31)}" r="${f1(BAY)}"/>
  <path class="sfd-ext" d="M${f1(C - LIP)} ${Y(140)}V${Y(203)}M${f1(C + LIP)} ${Y(140)}V${Y(203)}M${f1(C - R)} ${Y(60)}V${INV + 36}M${f1(C + R)} ${Y(60)}V${INV + 36}"/>
  ${sfDim(f1(C - LIP), f1(INV - 197 * K), f1(C + LIP), f1(INV - 197 * K), "154 over lips", { dy: -9 })}
  ${sfDim(f1(C - R), INV + 30, f1(C + R), INV + 30, "146.9", { dy: 19 })}`);
  return { side, end };
}

// The four things rag catches on, as small signs: flow from the left, the
// thing that catches, and a strand of rag caught on it.
const SF_CATCH = {
  edge: `<path class="sfc-line" d="M32 12v32h14"/><path class="dg-rag" d="M32 15q7 3 5 10t5 10"/>`,
  gap: `<path class="sfc-line" d="M27 12h8v32h-8zM39 12h8v32h-8z"/><path class="dg-rag" d="M28 20q8 0 9 6t-1 14"/>`,
  span: `<path class="sfc-line" d="M27 10v36M47 10v36M27 27h20"/><path class="dg-rag" d="M34 27q-3 7 1 13M40 27q3 5 0 10"/>`,
  flutter: `<path class="sfc-line" d="M27 10v36"/><path class="sfc-line sfc-wave" d="M27 22q7-7 12 0t11 1"/><path class="dg-rag" d="M38 21q3 7 0 13"/>`,
};
export const sfCatch = (kind) => svg(56, 56, `<path class="sfc-flow" d="M6 20h13M6 28h13M6 36h13"/>${SF_CATCH[kind]}`);

/* ---- scatter: a shift in the depth to velocity relationship ---- */
// A scattergraph as the analysis software draws one: depth in millimetres
// against velocity in metres a second, a few hundred five-minute readings in
// a cloud about the site's usual curve (its spread widening with depth, as
// real data does), the fitted curve with its band, and a later group of
// readings sitting deeper for the same velocity.
function scatter(t) {
  const L = t.labels;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = () => { let u = 0; for (let k = 0; k < 4; k++) u += rnd(); return (u - 2) / 0.58; };
  const VMAX = 1.25, DMAX = 450;
  const X = (v) => 64 + (v / VMAX) * 380, Y = (d) => 262 - (d / DMAX) * 238;
  // the usual relationship: depth rising with velocity, as a pipe at part
  // full depth runs
  const fit = (v) => 18 + 300 * (v / 1.1) ** 1.55;
  const usual = Array.from({ length: 300 }, () => { const v = 0.12 + rnd() ** 0.8 * 0.98; const d = fit(v) + gauss() * (6 + 0.05 * fit(v)); return [X(v + gauss() * 0.012), Y(d)]; });
  const shifted = Array.from({ length: 64 }, () => { const v = 0.16 + rnd() * 0.42; const d = fit(v) + 105 + 120 * (v - 0.16) + gauss() * 14; return [X(v + gauss() * 0.01), Y(d)]; });
  const vs = sample(0.1, 1.15, 0.025, (v) => v).map(([v]) => v);
  const band = `${smooth(vs.map((v) => [X(v), Y(fit(v) + 10 + 0.07 * fit(v))]))}L${vs.slice().reverse().map((v) => `${f1(X(v))} ${f1(Y(fit(v) - 10 - 0.07 * fit(v)))}`).join("L")}Z`;
  const vt = [0, 0.25, 0.5, 0.75, 1, 1.25], dt = [0, 100, 200, 300, 400];
  const body = `
  <rect x="64" y="24" width="380" height="238" class="ch-plot"/>
  <path class="ch-grid" d="${dt.slice(1).map((d) => `M64 ${f1(Y(d))}H444`).join("")}${vt.slice(1, -1).map((v) => `M${f1(X(v))} 24V262`).join("")}"/>
  <path class="ch-grid-m" d="${[50, 150, 250, 350].map((d) => `M64 ${f1(Y(d))}H444`).join("")}"/>
  <path class="dg-axis" d="M64 24V262H444"/>
  <path class="ch-tickm" d="${vt.map((v) => `M${f1(X(v))} 262v4`).join("")}${dt.map((d) => `M64 ${f1(Y(d))}h-4`).join("")}"/>
  ${vt.map((v) => `<text class="dg-tick" x="${f1(X(v))}" y="278" text-anchor="middle">${v}</text>`).join("")}
  ${dt.map((d) => `<text class="dg-tick" x="56" y="${f1(Y(d) + 3.6)}" text-anchor="end">${d}</text>`).join("")}
  ${label(444, 293, `${L.velocity} (m/s)`, { a: "end", cls: "dg-m" })}
  ${label(68, 16, `${L.depth} (mm)`, { cls: "dg-m" })}
  <path class="dg-fit-band" d="${band}"/>
  <g class="ch-pts">${usual.map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.9"/>`).join("")}</g>
  <g class="ch-pts shift">${shifted.map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.1"/>`).join("")}</g>
  <path class="ch-fit" d="${smooth(vs.map((v) => [X(v), Y(fit(v))]))}"/>
  ${label(262, 236, L.usual, { cls: "dg-m dg-h" })}${leader("M300 224L322 167")}
  ${label(84, 52, L.shift, { cls: "dg-b dg-h" })}${leader("M118 84L136 120")}`;
  return svg(480, 300, body);
}

/* ---- rainfall: a wet weather response read against the rain ---- */
// Above, a catchment in section during a storm: a tipping bucket gauge on
// its post with a logger strapped to it, rain reaching the sewer two ways
// (straight in at a manhole, and later through the ground and an open
// joint), and the flow meter upstream of the manhole with its logger in the
// shaft. Beneath, the same storm as a chart: rain bars at the top, and the
// flow over dry weather flow split into the fast inflow peak and the slow
// infiltration that lingers. Rain, seepage and inflow move in their own layer.
function rainfall(t) {
  const L = t.labels, p = "rtr";
  const G = 112, TABLE = 140, CROWN = 166, INV = 196, LVL = 182, SOIL = 232, T = 6;
  const SA = [290, 334], oc = (SA[0] + SA[1]) / 2, open = 34;
  const GX = 52, GT = 14;
  const crack = 168;
  const shower = Array.from({ length: 36 }, (_, k) => {
    const x = -26 + k * 14.2 + ((k * 7) % 5), y0 = 2 + ((k * 11) % 9);
    return `<path d="M${f1(x)} ${y0}L${f1(x + 0.2 * (G - 8 - y0))} ${G - 8}" style="animation-delay:-${((k * 0.29) % 0.7).toFixed(2)}s"/>`;
  }).join("");
  const RT = 248, AX = 396;
  const CX = (u) => 14 + u * 452, CY = (v) => AX - v * 46;
  const base = (u) => 0.62 + 0.15 * Math.sin(2 * Math.PI * 3 * u - 1.1);
  const inflow = (u) => 1.25 * pulse(u, 0.165, 0.034);
  const infil = (u) => { const s0 = u - 0.17; return s0 <= 0 ? 0 : 0.8 * (1 - Math.exp(-s0 / 0.09)) * Math.exp(-s0 / 0.75); };
  const us = sample(0, 1, 0.005, (u) => u).map(([u]) => u);
  const line = (fn) => us.map((u) => [CX(u), CY(fn(u))]);
  const back = (pts) => pts.slice().reverse().map(([x, y]) => `${f1(x)} ${f1(y)}`).join("L");
  const meas = line((u) => base(u) + infil(u) + inflow(u)), slow = line((u) => base(u) + infil(u)), dry = line(base);
  const rain = [3, 6, 10, 17, 27, 31, 24, 28, 19, 13, 9, 11, 7, 4, 3, 2];
  const tk = [[0, "0 h"], [1 / 3, "24 h"], [2 / 3, "48 h"], [1, "72 h"]];
  const drips = [0, 1, 2].map((n) => `<ellipse class="sc-drip" cx="${crack + 1 + n * 1.6}" cy="${CROWN + 2}" rx="1.2" ry="1.9" style="--d:${n * 0.55}s"/>`).join("");
  const body = `
  ${ground(p, { x0: 0, x1: 480, y: G, bottom: SOIL, holes: [frameSpan(open, oc)] })}
  ${waterTable(p, { x0: 0, x1: 480, y: TABLE, bottom: SOIL })}
  ${pipeLong(p, { x0: 0, x1: 480, crown: CROWN, inv: INV, t: T, joints: [52, 110, crack, 226, 384, 442], gaps: [[SA[0], SA[1]]], bed: 8, stain: LVL - 3 })}
  <ellipse cx="${crack + 1}" cy="${CROWN + 9}" rx="12" ry="11" fill="url(#${p}-wetwall)"/>
  ${shaft(p, { a: SA[0], b: SA[1], top: G, bottom: CROWN, t: T, ring: 26, slab: 7, open, oc, steps: [G + 26, G + 42], stepW: 14, wallTo: CROWN })}
  ${water(p, { x0: 0, x1: 480, level: LVL, bottom: INV })}
  <path class="sc-joint-open" d="M${crack - 0.6} ${CROWN - T - 0.4}l1.2 ${T * 0.45}-1 .9 1.6 ${T * 0.6}"/>
  ${avSensor(p, 238, INV, 18)}
  ${cable(`M256 ${INV - 2}H${SA[0] + 6}Q${SA[0] + 3} ${INV - 2} ${SA[0] + 3} ${INV - 6}V${G + 44}`, { w: 1 })}
  ${hanger(p, SA[0], SA[0] + 9, G + 16)}${hawkLogger(p, SA[0] + 9, G + 16, 8)}
  <rect x="${f1(SA[0] + 2)}" y="${G + 34}" width="2" height="12" fill="#15181a"/>
  ${rainGauge(p, GX, GT, G + 4, 30)}
  <rect x="${GX - 3}" y="${GT + 64}" width="6" height="2" fill="url(#${p}-ss)"/>
  ${hawkLogger(p, GX + 9, GT + 58, 7)}
  <rect x="0" y="${SOIL - 18}" width="480" height="19" fill="url(#${p}-fade)"/>
  ${tag(GX + 30, GT + 16, L.gauge, { bold: true })}
  ${tag(104, TABLE - 5, L.groundwater)}<path class="sc-table-mark" d="M86 ${TABLE - 9}h11l-5.5 7.5z"/>
  ${tag(crack + 32, CROWN - T - 8, L.infiltration, { bold: true })}${lead([[crack + 30, CROWN - T - 11], [crack + 1, CROWN - T + 1]])}
  ${tag(206, G - 16, L.inflow, { bold: true })}
  ${tag(256, SOIL - 6, L.meter, { a: "middle", bold: true })}${lead([[256, SOIL - 19], [248, INV - 3]])}
  ${flowArrow(400, LVL + 11, L.flow || "Flow")}
  <path class="dg-grid" d="${[1, 2].map((v) => `M14 ${f1(CY(v))}H466`).join("")}"/>
  <g class="dg-rain">${rain.map((h, n) => `<rect x="${f1(CX(0.15) + n * 3.2)}" y="${RT}" width="2.3" height="${h}" rx=".8"/>`).join("")}</g>
  ${label(f1(CX(0.15) + rain.length * 3.2 + 8), RT + 12, L.rain, { cls: "dg-m" })}
  <path class="dg-band-slow" fill="url(#${p}-slow)" d="${smooth(slow)}L${back(dry)}Z"/>
  <path class="dg-band-fast" d="${smooth(meas)}L${back(slow)}Z"/>
  <path class="dg-axis" d="M14 ${AX}H466"/>
  <path class="dg-tick-mark" d="${tk.map(([u]) => `M${f1(CX(u))} ${AX}v4`).join("")}"/>
  ${tk.map(([u, s0], i) => `<text class="dg-tick" x="${f1(CX(u))}" y="${AX + 15}"${i === 0 ? "" : ` text-anchor="${i === tk.length - 1 ? "end" : "middle"}"`}>${s0}</text>`).join("")}
  <path class="dg-dwf" d="${smooth(dry)}"/>
  <path class="dg-meas" d="${smooth(meas)}"/>
  ${label(144, 300, L.fast[0], { cls: "dg-b" })}${label(144, 316, L.fast[1], { cls: "dg-m" })}${leader(`M140 306L${f1(CX(0.22))} ${f1(CY(base(0.22) + infil(0.22) + inflow(0.22) * 0.45))}`)}
  ${label(274, 300, L.slow[0], { cls: "dg-b" })}${label(274, 316, L.slow[1], { cls: "dg-m" })}${leader(`M310 322L${f1(CX(0.62))} ${f1(CY(base(0.62) + infil(0.62) * 0.5))}`)}
  ${label(466, 346, L.measured, { a: "end", cls: "dg-m" })}
  ${label(466, 388, L.dry, { a: "end", cls: "dg-m" })}`;
  const fx = `
  <g clip-path="url(#${p}-sky)"><g class="dg-shower">${shower}</g></g>
  <g class="sc-seep"><path d="M${crack - 24} ${TABLE + 6}q12 8 22 ${CROWN - T - TABLE - 6}"/><path d="M${crack + 28} ${TABLE + 6}q-12 8 -22 ${CROWN - T - TABLE - 6}"/></g>
  <g class="sc-drips">${drips}</g>
  <path class="dg-inflow" d="M206 ${G - 3}H${SA[0] - 10}Q${SA[0] + 4} ${G - 3} ${SA[0] + 6} ${G + 8}V${LVL - 1}"/>
  <path class="dg-inflow-head" d="M${SA[0] - 22} ${G - 6.5}l5 3.5-5 3.5"/>`;
  const defs = `${texDefs(p, 0.6)}${matDefs(p)}${instDefs(p)}${fadeDef(p)}<radialGradient id="${p}-wetwall"><stop offset="0" stop-color="#1d2a24" stop-opacity=".5"/><stop offset=".55" stop-color="#1d2a24" stop-opacity=".22"/><stop offset="1" stop-color="#1d2a24" stop-opacity="0"/></radialGradient>
  <pattern id="${p}-slow" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#2b9bd0" fill-opacity=".1"/><path d="M0 0V5" stroke="#2b9bd0" stroke-opacity=".55" stroke-width="1.1"/></pattern>`;
  return stack(480, 414, body, fx, defs, `<clipPath id="${p}-sky"><rect width="480" height="${G}"/></clipPath>`);
}

/* ---- fullpipe: three ways to meter a full pipe ---- */
// Three full steel pipes in long section, one above the other, flow left to
// right, each with its flanged joints. A magnetic meter: the flanged spool
// with its painted housing cut away to show the coils above and below and
// the field across the flow, and beside it the pipe seen end on with its
// liner, the electrodes and the voltage across them. A clamp-on transit
// time pair on stainless straps, timing pulses with and against the flow,
// and its transmitter. One Doppler transducer, its sound bouncing back off
// particles and bubbles. Pulses, echoes and what the water carries move in
// their own layer.
function fullpipe(t) {
  const L = t.labels, p = "rtf";
  const D = 44, W = 5, ROW = 118;
  const crownOf = (y0) => y0 + 36;
  const pipe = (x0, x1, c, { end = false, flanges = [] } = {}) => `
  <rect x="${x0}" y="${c}" width="${x1 - x0}" height="${D}" fill="url(#${p}-fw)"/>
  <path class="sc-streak" style="stroke-dasharray:14 30" d="M${x0} ${c + 14}H${x1}M${x0} ${c + 30}H${x1}"/>
  <rect x="${x0}" y="${c - W}" width="${x1 - x0}" height="${W}" fill="url(#${p}-ss)"/>
  <rect x="${x0}" y="${c + D}" width="${x1 - x0}" height="${W}" fill="url(#${p}-ss)"/>
  <path class="sc-cut-edge" d="M${x0} ${c - W}H${x1}M${x0} ${c}H${x1}M${x0} ${c + D}H${x1}M${x0} ${c + D + W}H${x1}"/>
  ${flanges.map((x) => `<rect x="${x - 2.4}" y="${c - W - 4}" width="4.8" height="${D + 2 * W + 8}" rx=".6" fill="url(#${p}-ssv)"/><path class="sc-edge-dk" d="M${x} ${c - W - 4}V${c + D + W + 4}"/>`).join("")}
  ${end ? `<ellipse cx="${x1}" cy="${c + D / 2}" rx="6" ry="${D / 2 + W}" fill="url(#${p}-ssv)"/><ellipse cx="${x1}" cy="${c + D / 2}" rx="4.6" ry="${D / 2}" fill="url(#${p}-fw)"/>` : ""}`;
  const coil = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="12" rx="1.5" fill="url(#${p}-brass)"/><path class="dg-coil-wind" d="${Array.from({ length: Math.floor((w - 6) / 3.2) + 1 }, (_, k) => `M${f1(x + 3 + k * 3.2)} ${y + 2}v8`).join("")}"/>`;
  const field = (xs, y0, y1, ya = (y0 + y1) / 2) => `<path class="dg-field" d="${xs.map((x) => `M${x} ${y0}V${y1}`).join("")}"/><path class="dg-field-arrow" d="${xs.map((x) => `M${x - 3} ${ya - 2}l3 4 3-4`).join("")}"/>`;
  // a clamp-on transducer: an aluminium block on the pipe, its strap round
  // the pipe (seen again under it) and its cable leaving through a gland
  const xdcr = (x, c, gland = "right") => `
  <path d="M${x} ${c - W}V${c - W - 9}Q${x} ${c - W - 10} ${x + 1} ${c - W - 10}H${x + 19}Q${x + 20} ${c - W - 10} ${x + 20} ${c - W - 9}V${c - W}Z" fill="url(#${p}-brushed)"/>
  <path class="sc-edge-dk" d="M${x} ${c - W}V${c - W - 9}Q${x} ${c - W - 10} ${x + 1} ${c - W - 10}H${x + 19}Q${x + 20} ${c - W - 10} ${x + 20} ${c - W - 9}V${c - W}"/>
  <rect x="${x + 8}" y="${c - W - 10.6}" width="4" height="${10.6}" fill="url(#${p}-ssv)"/>
  <rect x="${x + 8}" y="${c + D + W}" width="4" height="2.4" rx=".6" fill="url(#${p}-ssv)"/>
  <rect x="${gland === "right" ? x + 20 : x - 4}" y="${c - W - 7.5}" width="4" height="5" rx="1" fill="#1b1f22"/>`;
  const chev = (x, y, dx, dy) => { const n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n; return `M${f1(x - 6 * ux - 4 * uy)} ${f1(y - 6 * uy + 4 * ux)}L${f1(x)} ${f1(y)}L${f1(x - 6 * ux + 4 * uy)} ${f1(y - 6 * uy - 4 * ux)}`; };
  const flowM = (x, c) => flowArrow(x, c + 39, L.flow);
  const rule = (y0) => `<path class="dg-rule" d="M0 ${y0 - 10}H480"/>`;
  const A = 160, B = 284, ax = A + 10, bx = B + 10, m = (ax + bx) / 2;

  // magnetic
  const c1 = crownOf(0), EX = 380, EY = c1 + D / 2, R = D / 2, X1 = 306;
  const mag = `
  ${label(0, 13, L.magnetic, { cls: "dg-t" })}
  ${pipe(0, X1, c1, { end: true, flanges: [36, 106, 196, 276] })}
  <path d="M110 ${c1 - W - 18}H192V${c1 - W}H110Z" fill="url(#${p}-magb)"/><path d="M110 ${c1 + D + W}H192V${c1 + D + W + 18}H110Z" fill="url(#${p}-magb)"/>
  <rect x="113" y="${c1}" width="76" height="${D}" fill="#eef1ee" fill-opacity=".22"/>
  ${coil(120, c1 - W - 14, 62)}${coil(120, c1 + D + W + 2, 62)}
  <path class="sc-edge-dk" d="M110 ${c1 - W - 18}H192V${c1 - W}M110 ${c1 + D + W + 18}H192V${c1 + D + W}M110 ${c1 - W - 18}V${c1 - W}M110 ${c1 + D + W}V${c1 + D + W + 18}"/>
  <rect x="139" y="${c1 - W - 38}" width="24" height="20" rx="1.5" fill="url(#${p}-magb)"/><rect x="143" y="${c1 - W - 34}" width="16" height="7" fill="#22343a"/><path class="sc-screen-t" d="M145 ${c1 - W - 31}h10"/>
  ${tag(198, c1 - W - 9, L.field, { bold: true })}${lead([[196, c1 - W - 13], [173, c1 + 5]])}
  ${flowM(18, c1)}
  <circle cx="${EX}" cy="${EY}" r="${R}" fill="url(#${p}-fwr)"/>
  <circle cx="${EX}" cy="${EY}" r="${R + W / 2}" fill="none" stroke="url(#${p}-ss)" stroke-width="${W}"/>
  <circle cx="${EX}" cy="${EY}" r="${R - 1}" fill="none" stroke="#eef1ee" stroke-width="2"/>
  <circle class="sc-cut-edge" cx="${EX}" cy="${EY}" r="${R + W}"/>
  ${coil(EX - 24, c1 - W - 14, 48)}${coil(EX - 24, c1 + D + W + 2, 48)}
  <path class="dg-volt" d="M${EX - R + 3} ${EY}H${EX + R - 3}"/>
  <path class="dg-volt-end" d="M${EX - R + 7} ${EY - 3}l-4 3 4 3M${EX + R - 7} ${EY - 3}l4 3-4 3"/>
  <rect x="${EX - R - W - 2}" y="${EY - 3}" width="${W + 4}" height="6" rx="1.2" fill="url(#${p}-ss)"/>
  <rect x="${EX + R - 2}" y="${EY - 3}" width="${W + 4}" height="6" rx="1.2" fill="url(#${p}-ss)"/>
  ${tag(EX + R + W + 8, EY + 4, L.voltage, { bold: true })}`;
  const magFx = `${field([132, 145, 158, 171], c1 - W - 2, c1 + D + W + 2)}${field([EX - 11, EX, EX + 11], c1 - W - 2, c1 + D + W + 2, EY + 11)}`;

  // transit time
  const y2 = ROW, c2 = crownOf(y2), bed = c2 + D, top2 = c2 - W + 1;
  const withP = [[ax - 4, top2], [m - 3, bed], [bx - 4, top2]], against = [[bx + 4, top2], [m + 3, bed], [ax + 4, top2]];
  const pth = (pts) => `M${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join("L")}`;
  const at = (q, r0, k) => [q[0] + (r0[0] - q[0]) * k, q[1] + (r0[1] - q[1]) * k];
  const arrowOn = ([q, r0]) => { const [x, y] = at(q, r0, 0.6); return chev(x, y, r0[0] - q[0], r0[1] - q[1]); };
  const cables = (y0, both) => cable(`M${A + 24} ${crownOf(y0) - W - 5}C${A + 34} ${crownOf(y0) - W - 5} ${A + 34} ${y0 + 13} ${A + 44} ${y0 + 13}H${m - 15}${both ? `M${B - 4} ${crownOf(y0) - W - 5}C${B - 14} ${crownOf(y0) - W - 5} ${B - 14} ${y0 + 13} ${B - 24} ${y0 + 13}H${m + 15}` : ""}`, { w: 1.2 });
  const transit = `
  ${rule(y2)}
  ${label(0, y2 + 13, L.transit, { cls: "dg-t" })}
  ${pipe(0, 480, c2, { flanges: [60, 420] })}
  <path class="dg-sound" d="${pth(withP)}"/><path class="dg-sound back" d="${pth(against)}"/>
  <path class="dg-sound-arrow" d="${arrowOn(withP)}"/><path class="dg-sound-arrow back" d="${arrowOn(against)}"/>
  ${xdcr(A, c2, "right")}${xdcr(B, c2, "left")}
  ${cables(y2, true)}${transmitter(p, m - 15, y2 + 1, 30)}
  ${tag(ax + 2, c2 + 26, L.with, { a: "end", bold: true })}
  ${tag(bx - 14, c2 + 26, L.against, { bold: true })}
  ${flowM(410, c2)}`;
  const transitFx = `<path class="dg-sound-pulse" d="${pth(withP)}"/><path class="dg-sound-pulse back" d="${pth(against)}"/>`;

  // Doppler
  const y3 = 2 * ROW, c3 = crownOf(y3);
  const beam = efBeam(p, "dp", [ax, c3, 0.5, 0.866], 13, { toY: c3 + D - 2, kind: "u", waves: 3 });
  const hits = [[ax + 12, c3 + 19, "p"], [ax + 25, c3 + 33, "b"]];
  const arc = ([x, y], r0) => { const a0 = Math.atan2(c3 - y, ax - x), sp = 0.75; return `M${f1(x + r0 * Math.cos(a0 - sp))} ${f1(y + r0 * Math.sin(a0 - sp))}A${r0} ${r0} 0 0 1 ${f1(x + r0 * Math.cos(a0 + sp))} ${f1(y + r0 * Math.sin(a0 + sp))}`; };
  const solids = [...hits, [30, c3 + 13, "b"], [62, c3 + 31, "p"], [100, c3 + 9, "b"], [124, c3 + 35, "p"], [378, c3 + 11, "b"], [394, c3 + 22, "p"], [440, c3 + 9, "b"], [470, c3 + 17, "p"]];
  const dop = `
  ${rule(y3)}
  ${label(0, y3 + 13, L.doppler, { cls: "dg-t" })}
  ${pipe(0, 480, c3, { flanges: [60, 420] })}
  ${solids.map(([x, y, k]) => (k === "p" ? `<circle cx="${x}" cy="${y}" r="2.1" fill="#8a7454"/>` : `<circle cx="${x}" cy="${y}" r="2.4" fill="#eef7fa" fill-opacity=".8" stroke="#bcd7e0" stroke-width=".6"/>`)).join("")}
  ${xdcr(A, c3, "right")}
  ${cables(y3, false)}${transmitter(p, m - 15, y3 + 1, 30)}
  ${tag(ax + 54, c3 + 17, L.bounce, { bold: true })}${lead([[ax + 50, c3 + 25], [ax + 30, c3 + 32]])}
  ${flowM(410, c3)}`;
  const dopFx = `
  <g clip-path="url(#${p}-bore)"><g class="dg-bits">${[[20, c3 + 22, 0], [60, c3 + 40, -2.4], [8, c3 + 6, -4.6], [40, c3 + 28, -6.8]].map(([x, y, d]) => `<circle cx="${x}" cy="${y}" r="1.6" style="--d:${d}s"/>`).join("")}</g></g>
  ${beam.draw}
  <g class="ef-waves">${hits.map((e, i) => [5.5, 10].map((r0, k) => `<path class="ef-wave u" style="--d:${(i * 0.45 + k * 0.25).toFixed(2)}s" d="${arc(e, r0)}"/>`).join("")).join("")}</g>`;
  const defs = `${texDefs(p, 0.6, ["conc"])}${matDefs(p)}${instDefs(p)}
  <linearGradient id="${p}-fw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fae9f"/><stop offset=".45" stop-color="#6c8d7f"/><stop offset="1" stop-color="#4a685c"/></linearGradient>
  <radialGradient id="${p}-fwr" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#8fae9f"/><stop offset="1" stop-color="#4a685c"/></radialGradient>
  <linearGradient id="${p}-magb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c87b8"/><stop offset=".5" stop-color="#3a6596"/><stop offset="1" stop-color="#2a4c74"/></linearGradient>`;
  const fxDefs = `${beam.defs}<clipPath id="${p}-bore"><rect x="0" y="${c3}" width="480" height="${D}"/></clipPath>`;
  return stack(480, 2 * ROW + 92, `${mag}${transit}${dop}`, `${magFx}${transitFx}${dopFx}`, defs, fxDefs);
}

/* ---- E-Flow 3: a drawing kit ---- */
// Shared by the E-Flow 3 drawings and the changeover demo (build.mjs):
// gradients and section hatching for cut concrete and soil (ids prefixed per
// drawing, as several sit on one page), the sensor drawn after the product
// photograph, beams with wavefronts travelling out along them, and velocity
// profiles. The sensor hangs from the pipe crown with upstream to the left,
// as in datasheet figure 3: the depth radar's dome at the upstream end, the
// velocity radar behind the sloping face, the ultrasonic face on the front of
// the nose and the pressure port beneath it. It is drawn in its own units,
// 84 long and 46 deep; each element is [x, y, dx, dy]: where it sits and
// which way it looks.
const EF = {
  body: "M8 0H70A8 8 0 0 1 78 8V10A8 8 0 0 1 70 18H68V40Q68 46 62 46H55Q52 46 51 43L48 33L30 18H8A8 8 0 0 1 0 10V8A8 8 0 0 1 8 0Z",
  depth: [16, 23.6, 0, 1], vel: [40, 25.8, -0.77, 0.64], us: [50.4, 38.4, -0.8, 0.6], press: [59.5, 46.6, 0, 1],
};
const turn = (dx, dy, a) => { const r = (a * Math.PI) / 180; return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)]; };
// The flat materials of the earlier line drawings: hatched cut faces and a
// stippled soil. Kept for the dimension drawings (engineering drawings by
// nature) and the FlowSense screen, which draws a schematic as the software does.
export function efDefsFlat(p, { dark = false } = {}) {
  const c = dark
    ? { soil: "#0b3532", stone: ["#0f403b", "#0d3b37"], cut: "#123f3b", line: "#1f5650", air: ["#021614", "#052421"] }
    : { soil: "#f2eee4", stone: ["#e3dbc9", "#e9e2d3"], cut: "#e6ebea", line: "#b4c2c0", air: ["#eaf1ef", "#fbfdfc"] };
  return `
  <pattern id="${p}-soil" width="24" height="20" patternUnits="userSpaceOnUse"><rect width="24" height="20" fill="${c.soil}"/><ellipse cx="5" cy="5" rx="2.4" ry="1.5" fill="${c.stone[0]}"/><ellipse cx="16" cy="13" rx="1.8" ry="1.2" fill="${c.stone[1]}"/><circle cx="20" cy="4" r=".9" fill="${c.stone[0]}"/><circle cx="9" cy="16" r=".8" fill="${c.stone[1]}"/></pattern>
  <pattern id="${p}-cut" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="${c.cut}"/><path d="M0 0V6" stroke="${c.line}" stroke-width="1.1"/></pattern>
  <linearGradient id="${p}-air" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.air[0]}"/><stop offset="1" stop-color="${c.air[1]}"/></linearGradient>
  <linearGradient id="${p}-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b6764"/><stop offset=".3" stop-color="#2b3533"/><stop offset="1" stop-color="#141b1a"/></linearGradient>
  <radialGradient id="${p}-dome" cx=".36" cy=".2" r=".9"><stop offset="0" stop-color="#8a9997"/><stop offset=".4" stop-color="#1f2928"/><stop offset="1" stop-color="#040707"/></radialGradient>
  <linearGradient id="${p}-face" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b6c0be"/><stop offset="1" stop-color="#66726f"/></linearGradient>
  <linearGradient id="${p}-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc96"/><stop offset=".55" stop-color="#d1a24b"/><stop offset="1" stop-color="#94681f"/></linearGradient>
  <linearGradient id="${p}-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7f7"/><stop offset="1" stop-color="#97a4a3"/></linearGradient>`;
}
// The cutaway kit's materials (scene.mjs) under the names the E-Flow 3
// drawings use: the textures at scale k, the metals, plastics and water,
// and the old names (cut, air, body, face, gold, steel) mapped onto them.
export function efDefs(p, { k = 0.75 } = {}) {
  const h = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const w = f1(92 * k), o = h(p);
  return `${texDefs(p, k)}${matDefs(p)}${instDefs(p)}
  <pattern id="${p}-cut" patternUnits="userSpaceOnUse" width="${w}" height="${w}" patternTransform="translate(${o % 61} ${(o >> 5) % 53})"><image href="@root/assets/img/tex/concrete.webp" width="${w}" height="${w}" preserveAspectRatio="none"/></pattern>
  <linearGradient id="${p}-air" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e4446"/><stop offset="1" stop-color="#5d6466"/></linearGradient>
  <linearGradient id="${p}-body" href="#${p}-blk"/><linearGradient id="${p}-face" href="#${p}-glz"/><linearGradient id="${p}-gold" href="#${p}-brass"/><linearGradient id="${p}-steel" href="#${p}-ss"/>`;
}
// The sensor with its upstream end at the crown (x, y), scaled by s, and its
// cable running on along `cable` (a path continuing from the gland).
export function efSensor(p, x, y, s, { cable: run = "", detail = 1 } = {}) {
  const at = ([u, v, dx, dy]) => [x + u * s, y + v * s, dx, dy];
  const draw = `
  ${run ? cable(`M${f1(x + 89.5 * s)} ${f1(y + 9 * s)}${run}`, { w: f1(Math.max(1.1, 1.6 * s)) }) : ""}
  <g class="ef-sensor" transform="translate(${x} ${y}) scale(${s})">${eflow3(p, { detail })}</g>`;
  return { draw, depth: at(EF.depth), vel: at(EF.vel), us: at(EF.us), press: at(EF.press) };
}
// A beam from an element: a cone of the given half angle out to a level
// (`toY`) or a length, shaded from its emitter, with wavefronts that travel
// out along it. `kind` is "r" (radar) or "u" (ultrasonic). Returns its
// gradient (for defs), the drawing, and where it meets the level.
export function efBeam(p, id, el, half, { toY, len, kind = "r", waves = 4 } = {}) {
  const [ox, oy, dx, dy] = el;
  const reach = (a) => { const [ex, ey] = turn(dx, dy, a); const t = toY != null ? (toY - oy) / ey : len; return [t, ox + ex * t, oy + ey * t]; };
  const [t1, x1, y1] = reach(-half), [t2, x2, y2] = reach(half);
  const near = Math.min(t1, t2), far = Math.max(t1, t2), gid = `${p}-${id}`;
  const [ax, ay] = turn(dx, dy, -half), [bx, by] = turn(dx, dy, half);
  const arcs = Array.from({ length: waves }, (_, k) => {
    const r = (near * (k + 0.7)) / (waves + 0.2);
    return `<path class="ef-wave ${kind}" style="--d:${(k * 0.3).toFixed(2)}s" d="M${f1(ox + ax * r)} ${f1(oy + ay * r)}A${f1(r)} ${f1(r)} 0 0 1 ${f1(ox + bx * r)} ${f1(oy + by * r)}"/>`;
  }).join("");
  return {
    defs: `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${f1(ox)}" cy="${f1(oy)}" r="${f1(far)}"><stop offset="0" class="ef-g0 ${kind}"/><stop offset="1" class="ef-g1 ${kind}"/></radialGradient>`,
    draw: `<path class="ef-beam ${kind}" fill="url(#${gid})" d="M${f1(ox)} ${f1(oy)}L${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}Z"/><g class="ef-waves">${arcs}</g>`,
    foot: [Math.min(x1, x2), Math.max(x1, x2)],
  };
}
// Velocity through the depth at one station: arrows sized by a power law
// from the bed (a free surface) or from both walls (the pipe full), the
// curve through their tips and the mean as a dashed line.
// `dip` puts the fastest water a little below a free surface, as it runs
// in a pipe or narrow channel.
export function efProfile(x0, top, bottom, len, { full = false, step = 7, surface = false, dip = false } = {}) {
  const open = (z) => Math.pow(z, 1 / 6) - (dip ? 2.5 * Math.max(0, z - 0.8) ** 2 : 0);
  const v = (y) => (full ? Math.pow(Math.max(0, 1 - Math.abs((2 * y - top - bottom) / (bottom - top))), 1 / 7) : open(Math.max(0, (bottom - y) / (bottom - top))));
  const ys = []; for (let y = top + step * 0.6; y < bottom - 2; y += step) ys.push(y);
  const arrow = (y) => { const l = len * v(y); return l < 7 ? "" : `M${x0} ${f1(y)}H${f1(x0 + l)}m-4.4-2.8 4.4 2.8-4.4 2.8`; };
  const env = sample(top, bottom, (bottom - top) / 24, (y) => y).map(([y]) => [x0 + len * v(y), y]);
  const mean = x0 + len * (full ? 0.82 : dip ? 0.85 : 0.857);
  const ymax = full ? (top + bottom) / 2 : dip ? bottom - 0.84 * (bottom - top) : top;
  return {
    mean, vs: [x0 + len * v(ys[0]), ys[0]], vmax: [x0 + len * v(ymax), ymax],
    draw: `<path class="ef-prof-base" d="M${x0} ${top}V${bottom}"/><path class="ef-prof-env" d="${smooth(env)}"/>
  <path class="ef-prof" d="${(surface ? ys.slice(1) : ys).map(arrow).join("")}"/>${surface ? `<path class="ef-prof-top" d="${arrow(ys[0])}"/>` : ""}
  <path class="ef-prof-mean" d="M${f1(mean)} ${top + 3}V${bottom - 3}"/>`,
  };
}
const efPin = (x, y, n, pair) => `<g class="dg-pin ${pair}"><circle cx="${f1(x)}" cy="${f1(y)}" r="9"/><text x="${f1(x)}" y="${f1(y + 4.2)}" text-anchor="middle">${n}</text></g>`;
// What the sensor sees, as a lit status: amber for the radar pair, blue for
// ultrasonic and pressure.
const efStatus = (x, y, text, kind) => `<g class="sc-tag b st" style="transform-origin:${x}px ${y}px"><rect x="${x}" y="${f1(y - 13.4)}" width="${f1(textW(text, 11, 600) + 30)}" height="18.6" rx="2"/><circle class="dg-led-g ${kind}" cx="${x + 11}" cy="${y - 4}" r="5.4"/><circle class="dg-led ${kind}" cx="${x + 11}" cy="${y - 4}" r="3"/><text x="${x + 21}" y="${y}">${esc(text)}</text></g>`;
const flowMark = (x, y, label) => `<text x="${x}" y="${y}" class="dg-w">${esc(label)}</text><path class="dg-arrow w" d="M${x + 34} ${y - 4}h26m-6-4 6 4-6 4"/>`;

// A sewer in long section with a manhole beside the sensor: road and soil,
// the pipe and shaft walls cut and hatched, a cover and frame, step irons,
// and a logger hung near the top of the shaft. `level` is the water surface
// (in the shaft when `full`). Light or dark, as `p` was defined.
export const LS = { w: 480, h: 250, ground: 18, crown: 104, inv: 226, wall: 10, shaft: [326, 370] };
export function efWater(p, level, full, g = LS) {
  const { w, crown, inv } = g, [s0, s1] = g.shaft;
  const gid = `${p}-wg`;
  const grad = `<linearGradient id="${gid}" href="#${p}-wtr" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(level)}" x2="0" y2="${inv}"/>`;
  const streaks = (y0, y1) => [0, 1, 2, 3].map((k) => { const yy = y0 + ((k + 0.6) * (y1 - y0)) / 4.2; const d = [[9, 31], [14, 40], [6, 27], [11, 36]][k]; return `<path class="sc-streak" style="--d:${(-k * 0.83).toFixed(2)}s;stroke-dasharray:${d[0]} ${d[1]};--len:-${d[0] + d[1]}" d="M0 ${f1(yy)}H${w}"/>`; }).join("");
  const body = full
    ? `<path fill="url(#${gid})" d="M0 ${crown}H${s0}V${f1(level)}H${s1}V${crown}H${w}V${inv}H0Z"/>${streaks(crown + 6, inv - 4)}<path class="sc-surf-lo" d="M${s0} ${f1(level + 1.6)}H${s1}"/><path class="sc-surf" d="M${s0} ${f1(level + 0.4)}H${s1}"/>`
    : `<rect x="0" y="${f1(level)}" width="${w}" height="${f1(inv - level)}" fill="url(#${gid})"/>${inv - level > 14 ? streaks(level + 3, inv - 3) : ""}<path class="sc-surf-lo" d="M0 ${f1(level + 1.6)}H${w}"/><path class="sc-surf" d="M0 ${f1(level + 0.4)}H${w}"/>`;
  return { grad, body };
}
export function efSection(p, water, inner, g = LS) {
  const { w, h, ground: G, crown, inv, wall } = g, [s0, s1] = g.shaft;
  const open = (s1 - s0) * 0.86, oc = (s0 + s1) / 2;
  const steps = [];
  for (let y = G + 32; y < crown - 8; y += 18) steps.push(y);
  const joints = [];
  for (let x = 70; x < w - 20; x += 186) if (x < s0 - 30 || x > s1 + 30) joints.push(x);
  return `
  ${ground(p, { x0: 0, x1: w, y: G, bottom: h, holes: [[oc - open / 2 - 9, oc + open / 2 + 9]] })}
  ${pipeLong(p, { x0: 0, x1: w, crown, inv, t: wall, joints, gaps: [[s0, s1]], bed: Math.max(0, Math.min(10, h - inv - wall)), stain: inv - (inv - crown) * 0.42 })}
  ${shaft(p, { a: s0, b: s1, top: G, bottom: crown, t: wall, ring: 30, slab: 8, open, oc, steps, stepW: Math.min(18, (s1 - s0) * 0.42), wallTo: crown })}
  <path class="sc-ao" d="M${s0 - wall} ${crown + 0.9}H${s0}M${s1} ${crown + 0.9}H${s1 + wall}"/>
  ${hanger(p, s0, s0 + 13, G + 22)}${hawkLogger(p, s0 + 13, G + 22, 12)}
  ${water}
  ${inner}`;
}

/* ---- eflowModes: radar in normal flow, ultrasonic and pressure in surcharge ---- */
const LOGGER_CABLE = `C322 113 339 110 339 96V66`;
function eflowNormal(t) {
  const L = t.labels, p = "efn", level = 170;
  const ef = efSensor(p, 226, LS.crown, 1, { cable: LOGGER_CABLE });
  const bv = efBeam(p, "bv", ef.vel, 12, { toY: level }), bd = efBeam(p, "bd", ef.depth, 7, { toY: level, waves: 3 });
  const pr = efProfile(136, level + 1, LS.inv - 1, 70, { surface: true, dip: true });
  const w = efWater(p, level, false);
  const [f0, f1x] = bv.foot;
  return stack(LS.w, LS.h, efSection(p, w.body, ""), `
  ${pr.draw}
  ${bv.draw}${bd.draw}
  <path class="ef-foot r" d="M${f1(f0)} ${level}H${f1(f1x)}"/>
  ${ef.draw}
  ${efPin(f0 + 2, level - 30, 1, "radar")}${efPin(ef.depth[0] + 14, level - 16, 2, "radar")}
  ${tag(f1(f0 - 10), level - 12, L.surface, { a: "end" })}
  ${label(16, level + 24, L.profile, { cls: "dg-w" })}
  ${label(f1(pr.mean + 6), LS.inv - 8, L.mean, { cls: "dg-w dg-b" })}
  ${flowMark(386, LS.inv - 10, L.flow)}
  ${efStatus(16, 50, L.above, "r")}`, `${efDefs(p)}${w.grad}${bv.defs}${bd.defs}`);
}
function eflowSurcharge(t) {
  const L = t.labels, p = "efs", level = 56;
  const ef = efSensor(p, 226, LS.crown, 1, { cable: LOGGER_CABLE });
  // the dual transducers, one above the other on the nose face, 5° beams
  const [ux, uy, udx, udy] = ef.us;
  const bu = efBeam(p, "bu", [ux - 0.8, uy - 2, udx, udy], 2.5, { len: 84, kind: "u", waves: 4 }), bu2 = efBeam(p, "bu2", [ux + 0.7, uy + 2.4, udx, udy], 2.5, { len: 76, kind: "u", waves: 4 });
  const pr = efProfile(136, LS.crown + 1, LS.inv - 1, 72, { full: true });
  const w = efWater(p, level, true);
  const [px, py] = ef.press, dim = 394;
  const head = `
  <path class="ef-ext" d="M${f1(px + 5)} ${f1(py)}H${dim + 6}M${LS.shaft[1] + 12} ${level}H${dim + 6}"/>
  <path class="ef-dim" d="M${dim} ${f1(py - 2)}V${level + 2}m-4 6 4-6 4 6M${dim - 4} ${f1(py - 8)}l4 6 4-6"/>
  ${tag(dim + 9, 64, L.head, { bold: true })}`;
  const bits = `<g class="dg-bits">${[[20, 168, 0], [60, 192, -2.4], [8, 212, -4.6], [40, 182, -6.8], [14, 150, -8.4], [70, 130, -3.6]].map(([x, y, d]) => `<circle cx="${x}" cy="${y}" r="2.2" style="--d:${d}s"/>`).join("")}</g>`;
  return stack(LS.w, LS.h, efSection(p, w.body, ""), `
  ${bits}${pr.draw}
  ${bu.draw}${bu2.draw}
  <g class="dg-ping-u">${[0, 1, 2].map((n) => `<path d="M${f1(px - 7)} ${f1(py + 6)}q7 5 14 0" style="--d:${n * 0.5}s"/>`).join("")}</g>
  ${ef.draw}${head}
  ${efPin(ef.us[0] - 46, ef.us[1] + 22, 3, "us")}${efPin(px + 18, py + 13, 4, "us")}
  ${label(16, 206, L.profile, { cls: "dg-w" })}
  ${flowMark(386, LS.inv - 10, L.flow)}
  ${efStatus(16, 50, L.full, "u")}`, `${efDefs(p)}${w.grad}${bu.defs}${bu2.defs}`);
}

/* ---- eflowObvert: a sensor on the invert, against E-Flow 3 at the obvert ---- */
// The same sewer twice, in long section. In the first a wetted sensor sits
// on the invert and the flow has wound rag round it, caught grease in the
// rag and banked grit against it; strands keep arriving and stopping there.
// In the second E-Flow 3 is at the crown and the same strands, grease and
// grit pass beneath it.
const OB = { w: 480, h: 196, crown: 42, inv: 168, wall: 10, surf: 116 };
function obvertScene(p, inner, { moving }) {
  const { w, h, crown, inv, wall, surf } = OB;
  const water = efWater(p, surf, false, { ...LS, w, crown, inv });
  return { grad: water.grad, body: `
  <rect width="${w}" height="${crown - wall}" fill="url(#${p}-soil)"/>
  <rect y="${inv + wall}" width="${w}" height="${h - inv - wall}" fill="url(#${p}-soil)"/>
  ${pipeLong(p, { x0: 0, x1: w, crown, inv, t: wall, joints: [96, 282, 468], bed: 0, stain: surf - 3 })}
  ${water.body}`, fx: `${moving}${inner}` };
}
// strands of rag and lumps of grease carried along, each on its own delay
const carried = (p, cls) => [[-40, 128, 0, 0], [-60, 146, 1, -2.6], [-30, 158, 2, -5.4], [-50, 138, 0, -8.1]].map(([x, y, k, d]) => `<g class="${cls}" style="--d:${d}s">${k === 1 ? grease(p, x + 8, y, 5.2, 3.2) : rag(x, y, 24, { seed: `${cls}${k}`, tone: k, bend: 2.4 })}</g>`).join("");
function invertPanel(t) {
  const L = t.labels, p = "eoa", { inv, surf } = OB;
  const sc = obvertScene(p, `
  ${cable(`M0 ${inv - 2}H228`, { w: 1.3 })}
  ${avSensor(p, 228, inv, 30)}
  ${fouling(p, 214, inv, 74, 22, "eoa")}
  ${[[150, 0], [340, 1], [420, 2]].map(([x, k]) => grease(p, x, surf + 1.2, 6 + k * 1.5, 1.8)).join("")}
  ${tag(16, 70, L.invert, { bold: true })}${lead([[118, 74], [236, inv - 12]])}
  ${tag(300, 70, L.fouled)}${lead([[318, 92], [284, inv - 16]])}
  ${flowMark(388, inv - 8, L.flow)}`, { moving: carried(p, "sc-stop") });
  return stack(OB.w, OB.h, sc.body, sc.fx, `${efDefs(p, { k: 0.8 })}${sc.grad}`);
}
function obvertPanel(t) {
  const L = t.labels, p = "eob", { crown, inv, surf } = OB;
  const ef = efSensor(p, 200, crown, 1.05, { cable: "H480" });
  const bv = efBeam(p, "bv", ef.vel, 12, { toY: surf }), bd = efBeam(p, "bd", ef.depth, 7, { toY: surf, waves: 3 });
  const sc = obvertScene(p, `
  ${silt(p, 60, 150, inv, 3)}${silt(p, 330, 410, inv, 2.6)}
  ${bv.draw}${bd.draw}
  <path class="ef-foot r" d="M${f1(bv.foot[0])} ${surf}H${f1(bv.foot[1])}"/>
  ${ef.draw}
  ${tag(16, 70, L.obvert, { bold: true })}${lead([[152, 66], [204, 58]])}
  ${tag(330, 92, L.clear)}
  ${flowMark(388, inv - 8, L.flow)}`, { moving: carried(p, "sc-pass") });
  return stack(OB.w, OB.h, sc.body, sc.fx, `${efDefs(p, { k: 0.8 })}${sc.grad}${bv.defs}${bd.defs}`);
}

/* ---- eflowProfile: from surface velocity and depth to flow ---- */
// Left, a close look along the pipe: the radar reads the surface across its
// footprint, and the velocity through the depth beneath it gives the mean.
// Right, the pipe in cross-section: depth and the pipe profile give the
// wetted area, shaded by how fast the water moves (lighter is faster).
function profileLong(t) {
  const L = t.labels, p = "epl", g = { ...LS, w: 560, h: 330, ground: 0, crown: 40, inv: 300, wall: 10 }, level = 152;
  const ef = efSensor(p, 376, g.crown, 1.55, { cable: "H560" });
  const bv = efBeam(p, "bv", ef.vel, 12, { toY: level }), bd = efBeam(p, "bd", ef.depth, 7, { toY: level, waves: 3 });
  const pr = efProfile(238, level + 1, g.inv - 1, 124, { surface: true, step: 9, dip: true });
  const w = efWater(p, level, false, g);
  const [f0, f1x] = bv.foot, dim = 536;
  const body = `
  <rect width="${g.w}" height="${g.crown - g.wall}" fill="url(#${p}-soil)"/>
  <rect y="${g.inv + g.wall}" width="${g.w}" height="${g.h - g.inv - g.wall}" fill="url(#${p}-soil)"/>
  ${pipeLong(p, { x0: 0, x1: g.w, crown: g.crown, inv: g.inv, t: g.wall, joints: [120, 470], bed: 0, stain: level - 4 })}
  ${w.body}`;
  const fx = `
  ${pr.draw}${bv.draw}${bd.draw}
  <path class="ef-foot r" d="M${f1(f0)} ${level}H${f1(f1x)}"/>
  ${ef.draw}
  <path class="ef-ext" d="M${f1(ef.depth[0] + 10)} ${level}H${dim + 6}M${dim - 30} ${g.inv}H${dim + 6}"/>
  <path class="ef-dim d" d="M${dim} ${level + 2}V${g.inv - 2}m-4-6 4 6 4-6M${dim - 4} ${level + 8}l4-6 4 6"/>
  ${label(dim - 8, 236, L.depth, { a: "end", cls: "dg-w dg-b" })}
  ${tag(24, 78, L.surface)}${lead([[190, 90], [f1(f0 + 6), level - 2]])}
  ${label(24, 232, L.mean, { cls: "dg-w dg-b" })}${leader(`M180 248L${f1(pr.mean - 2)} 262`, "w")}
  ${flowMark(24, g.inv - 12, L.flow)}`;
  return stack(g.w, g.h, body, fx, `${efDefs(p, { k: 1.2 })}${w.grad}${bv.defs}${bd.defs}`);
}
function profileCross(t) {
  // Looking along the pipe, cut square across: the concrete ring and the
  // bedding under it, the bore running away into the dark, and the water's
  // cut face shaded by how fast it moves (lighter is faster), with the
  // depth radar looking down from E-Flow 3 at the crown, seen end on.
  const L = t.labels, p = "epc", cx = 190, cy = 168, R = 126, wall = 13, surf = 152;
  const half = Math.sqrt(R * R - (cy - surf) ** 2), xl = cx - half, xr = cx + half;
  const seg = `M${f1(xl)} ${surf}H${f1(xr)}A${R} ${R} 0 1 1 ${f1(xl)} ${surf}Z`;
  const bands = [["#163b37", 1.0], ["#1d4f49", 0.82], ["#28675f", 0.64], ["#3c8578", 0.47], ["#66ad9f", 0.31], ["#b4e8dc", 0.16]];
  const iso = bands.map(([c, k]) => `<ellipse cx="${cx}" cy="${surf + 18}" rx="${f1(150 * k)}" ry="${f1(150 * k * 0.86)}" fill="${c}"/>`).join("");
  const lines = bands.slice(1).map(([, k]) => `<ellipse cx="${cx}" cy="${surf + 18}" rx="${f1(150 * k)}" ry="${f1(150 * k * 0.86)}"/>`).join("");
  const beamL = cx - Math.tan((10 * Math.PI) / 180) * (surf - 60), beamR = cx + (cx - beamL);
  const ring = (r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 -${2 * r} 0Z`;
  const by = cy - R; // the crown
  const body = `
  <rect width="380" height="330" fill="url(#${p}-soil)"/>
  <path fill="rgba(214, 190, 150, .22)" d="M${cx - R - wall - 26} 0H${cx + R + wall + 26}V${cy}H${cx - R - wall - 26}Z"/>
  <path fill="url(#${p}-grav)" d="M${cx - R - wall - 26} ${cy}H${cx + R + wall + 26}V330H${cx - R - wall - 26}Z"/>
  <path fill="rgba(150, 128, 98, .28)" d="M${cx - R - wall - 26} ${cy}H${cx + R + wall + 26}V330H${cx - R - wall - 26}Z"/>
  <path class="sc-trench" d="M${cx - R - wall - 26} 0V330M${cx + R + wall + 26} 0V330M${cx - R - wall - 26} ${cy}H${cx + R + wall + 26}"/>
  <path fill="url(#${p}-conc)" fill-rule="evenodd" d="${ring(R + wall)}${ring(R)}"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${p}-tunnel)"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 0.34}" fill="url(#${p}-far)"/>
  <path class="sc-cut-edge" d="${ring(R + wall)}${ring(R)}"/>
  <path class="sc-ao" d="${ring(R - 1)}"/>
  <clipPath id="${p}-seg"><path d="${seg}"/></clipPath>
  <g clip-path="url(#${p}-seg)">${iso}<g class="dg-isovel">${lines}</g></g>
  <path class="sc-surf-lo" d="M${f1(xl)} ${surf + 1.6}H${f1(xr)}"/><path class="sc-surf" d="M${f1(xl)} ${surf + 0.4}H${f1(xr)}"/>
  <path class="ef-beam r" fill="url(#${p}-xb)" d="M${cx} 62L${f1(beamL)} ${surf}H${f1(beamR)}Z"/>
  <path class="ef-foot r" d="M${f1(beamL)} ${surf}H${f1(beamR)}"/>
  <rect x="${cx - 21}" y="${by - 0.6}" width="42" height="4.4" rx=".8" fill="url(#${p}-ss)"/>
  <path d="M${cx - 13} ${by + 3.8}H${cx + 13}Q${cx + 16} ${by + 3.8} ${cx + 16} ${by + 8}V${by + 17}Q${cx + 16} ${by + 22} ${cx + 11} ${by + 22}H${cx - 11}Q${cx - 16} ${by + 22} ${cx - 16} ${by + 17}V${by + 8}Q${cx - 16} ${by + 3.8} ${cx - 13} ${by + 3.8}Z" fill="url(#${p}-blkv)"/>
  <path class="sc-part" d="M${cx - 16} ${by + 12.6}H${cx + 16}"/>
  <path d="M${cx - 5.6} ${by + 22}A5.6 5.6 0 0 0 ${cx + 5.6} ${by + 22}Z" fill="url(#${p}-dome)"/>
  <ellipse cx="${cx - 2}" cy="${by + 23.2}" rx="1.6" ry=".7" fill="#fff" fill-opacity=".55"/>
  <path class="ef-ext" d="M${f1(xr - 6)} ${surf}H352M${cx + 30} ${cy + R}H352"/>
  <path class="ef-dim d" d="M346 ${surf + 2}V${cy + R - 2}m-4-6 4 6 4-6M342 ${surf + 8}l4-6 4 6"/>
  ${tag(332, 250, "h", { a: "end", bold: true })}
  ${label(cx, 238, L.area, { a: "middle", cls: "dg-w dg-b" })}
  <rect x="62" y="308" width="110" height="7" rx="1" fill="url(#${p}-key)"/>
  ${tag(54, 316, L.key[0], { a: "end" })}${tag(180, 316, L.key[1])}`;
  const defs = `${efDefs(p, { k: 1 })}<linearGradient id="${p}-xb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef-g0 r"/><stop offset="1" class="ef-g1 r"/></linearGradient>
  <radialGradient id="${p}-tunnel" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#0d1011"/><stop offset=".45" stop-color="#2c3133"/><stop offset=".8" stop-color="#5a6062"/><stop offset="1" stop-color="#6e7476"/></radialGradient>
  <radialGradient id="${p}-far" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".9"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}-key" x1="0" y1="0" x2="1" y2="0">${bands.map(([c], i) => `<stop offset="${(i / (bands.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join("")}</linearGradient>`;
  return svg(380, 330, body, defs);
}

/* ---- eflowXray: how E-Flow 3 is built, seen through its housing ---- */
// The sensor large and see-through: the bracket at the crown, the composite
// housing, the potted electronics inside, the radar windows, the sealed
// wetted parts and the integral cable. Numbered pins match the list under
// the drawing (`items` on the page). Construction after the datasheet's
// mechanical section; an illustration, not an engineering drawing.
function xray(t) {
  // E-Flow 3 large under the crown, its near side cut away: the composite
  // shell (its cut edge pale), the potting that fills it, the main board
  // along the body, the 24 GHz radar board behind the sloping window, the
  // 120 GHz module over the dome, the two ultrasonic stacks behind the
  // brass face, the stainless pressure capsule in the nose, and the cable's
  // cores fanning out from the gland to the board.
  const p = "exr", s = 4.6, x0 = 236, crownY = 58, y0 = crownY + 16.6;
  const P = (u, v) => [x0 + u * s, y0 + v * s];
  const sens = { vel: [...P(40, 25.8), -0.77, 0.64], depth: [...P(16, 23.6), 0, 1], us: [...P(50.4, 38.4), -0.8, 0.6] };
  const water = 306;
  const bv = efBeam(p, "bv", sens.vel, 12, { toY: water }), bd = efBeam(p, "bd", sens.depth, 7, { toY: water, waves: 3 });
  const pins = [[1, P(-4, -2), [x0 - 40, crownY + 8]], [2, P(67.2, 26), [x0 + 76 * s + 34, y0 + 26 * s]], [3, P(30, 6.9), [x0 + 22 * s, y0 - 4.5 * s + 8]], [4, P(59.5, 44.2), [x0 + 59.5 * s + 36, 296]], [5, P(51.2, 38), [x0 + 50 * s - 44, y0 + 38 * s + 12]], [6, P(81, 9), [x0 + 83.6 * s + 30, y0 + 9 * s + 32]]];
  // the cut window: the shell 1.4 thick all round
  const WIN = "M8 1.4H70A6.6 6.6 0 0 1 76.6 8V10A6.6 6.6 0 0 1 70 16.6H66.6V40Q66.6 44.6 62 44.6H55Q53.1 44.6 52.4 42.6L49.4 32.4L30.5 16.6H8A6.6 6.6 0 0 1 1.4 10V8A6.6 6.6 0 0 1 8 1.4Z";
  // along the sloping window: unit vectors along it and into the body
  const ax = 20 / Math.hypot(20, 16.2), ay = 16.2 / Math.hypot(20, 16.2), nx = ay, ny = -ax;
  const onSlope = (k, d) => [27.6 + 20 * k + nx * d, 18 + 16.2 * k + ny * d];
  const [r0x, r0y] = onSlope(0.16, 4.9), [r1x, r1y] = onSlope(0.86, 4.9), [r2x, r2y] = onSlope(0.86, 6.3), [r3x, r3y] = onSlope(0.16, 6.3);
  const patches = [0.26, 0.38, 0.5, 0.62, 0.74].map((k) => { const [px, py] = onSlope(k, 4.5); return `<rect x="${f1(px - 0.7)}" y="${f1(py - 0.35)}" width="1.4" height=".7" fill="#d7b65a" transform="rotate(${f1((Math.atan2(16.2, 20) * 180) / Math.PI)} ${f1(px)} ${f1(py)})"/>`; }).join("");
  const inside = `
    <path d="${WIN}" fill="url(#${p}-pot)"/>
    <rect x="6" y="6.1" width="56" height="1.5" fill="#2f6e3d"/><path d="M6.4 6.3H61.6" stroke="#c9a54e" stroke-width=".16" stroke-dasharray=".9 .6"/>
    <rect x="11" y="4.2" width="5.4" height="1.9" rx=".2" fill="#151719"/><rect x="23" y="3.8" width="6.6" height="2.3" rx=".2" fill="#151719"/><rect x="38" y="4.6" width="4" height="1.5" rx=".2" fill="#151719"/>
    <path d="M23.4 3.8v-.3M24.4 3.8v-.3M25.4 3.8v-.3M26.4 3.8v-.3M27.4 3.8v-.3M28.4 3.8v-.3M29.2 3.8v-.3" stroke="#b9c0c3" stroke-width=".2"/>
    ${[[19.4, 7.6, 1.9], [33.5, 7.6, 1.6], [47, 7.6, 1.4], [52.6, 7.6, 2.2]].map(([x, y, h]) => `<rect x="${x - 0.6}" y="${y}" width="1.2" height="${h}" rx=".5" fill="url(#${p}-capg)"/>`).join("")}
    <rect x="44" y="3.9" width="3" height="2.2" rx=".2" fill="#e8e3d4"/><rect x="55" y="4.4" width="5" height="1.7" fill="#d9dfe1"/>
    <rect x="57.6" y="17.4" width="1.3" height="17" fill="#2f6e3d"/><rect x="58.9" y="20" width="1.4" height="3.4" rx=".2" fill="#151719"/><rect x="58.9" y="26" width="1.2" height="2.4" rx=".2" fill="#151719"/>
    <path d="M${f1(r0x)} ${f1(r0y)}L${f1(r1x)} ${f1(r1y)}L${f1(r2x)} ${f1(r2y)}L${f1(r3x)} ${f1(r3y)}Z" fill="#2f6e3d"/>${patches}
    <rect x="12.6" y="13.2" width="6.8" height="2.6" rx=".3" fill="#2f6e3d"/><rect x="14.6" y="12.2" width="2.8" height="1.1" rx=".2" fill="#151719"/>
    ${[0, 1].map((k) => { const cx = 50.9 + k * 1.15 + 1.4, cy = 35.8 + k * 3.9 - 0.4; return `<g transform="rotate(-16 ${cx} ${cy})"><rect x="${f1(cx - 0.2)}" y="${f1(cy - 1.2)}" width="1.1" height="2.4" fill="#ecebe5"/><rect x="${f1(cx + 0.9)}" y="${f1(cy - 1.2)}" width="2.2" height="2.4" fill="#3b3833"/></g>`; }).join("")}
    <rect x="57.6" y="38.4" width="3.8" height="6.4" rx=".6" fill="url(#${p}-ssv)"/><path d="M57.9 44.4h3.2" stroke="#7e898d" stroke-width=".3"/>
    <path class="xr-wire" style="stroke:#b83226" d="M77.6 7.8C70 7.8 66 8.6 62 7.6"/><path class="xr-wire" style="stroke:#1a1c1d" d="M77.6 8.7C70 8.7 66 9.6 62 8.6"/><path class="xr-wire" style="stroke:#e4e6e2" d="M77.6 9.6C70 9.8 66 10.8 61 9.6"/><path class="xr-wire" style="stroke:#2f7d3e" d="M77.6 10.5C71 11 67 12.6 59.4 12"/>
    <path class="xr-wire" style="stroke:#8f6a2d;stroke-width:.25" d="M53.2 34.2C55 30 57 26 57.6 24M60 38.4V35"/>`;
  const body = `
  <rect width="900" height="${crownY - 22}" fill="url(#${p}-soil)"/>
  <rect y="${crownY - 22}" width="900" height="22" fill="url(#${p}-conc)"/><path class="sc-cut-edge" d="M0 ${crownY - 22}H900M0 ${crownY}H900"/>
  <rect y="${crownY}" width="900" height="${water - crownY}" fill="url(#${p}-wall)"/><rect y="${crownY}" width="900" height="${water - crownY}" fill="url(#${p}-inx)"/>
  <path class="sc-ao" d="M0 ${crownY + 1.2}H900"/>
  <path class="sc-bore-joint" d="M110 ${crownY}V${water}M790 ${crownY}V${water}"/>
  <rect y="${water}" width="900" height="${330 - water}" fill="url(#${p}-wtx)"/><path class="sc-surf-lo" d="M0 ${water + 1.6}H900"/><path class="sc-surf" d="M0 ${water + 0.4}H900"/>
  ${cable(`M${f1(x0 + 89.5 * s)} ${f1(y0 + 9 * s)}C700 ${f1(y0 + 9 * s)} 700 ${crownY + 10} 760 ${crownY + 10}H900`, { w: 6 })}
  <g transform="translate(${x0} ${y0}) scale(${s})">
    ${eflow3(p)}
    <clipPath id="${p}-win"><path d="${WIN}"/></clipPath>
    <g clip-path="url(#${p}-win)">${inside}</g>
    <path class="xr-cut" d="${WIN}"/>
    <path d="M27.6 18L47.6 34.2L52 30.6L35.6 18Z" fill="url(#${p}-glz)"/><path class="sc-glint" style="stroke-width:.25" d="M33 18.9L46.2 29.6"/>
    <path d="M10.2 18A5.8 5.8 0 0 0 21.8 18Z" fill="url(#${p}-dome)"/>
    <path d="M48.2 33.8L51 43.4L53.6 42.4L50.9 32.8Z" fill="url(#${p}-brass)"/>
    <ellipse cx="59.5" cy="46.2" rx="3.4" ry="1.15" fill="url(#${p}-ss)"/>
  </g>
  ${pins.map(([n, [tx, ty], at]) => (at ? `${lead([[at[0], at[1]], [tx, ty]], { dot: false })}${efPin(at[0], at[1], n, "xr")}` : efPin(tx, ty, n, "xr"))).join("")}`;
  const defs = `${efDefs(p, { k: 1.4 })}${bv.defs}${bd.defs}
  <linearGradient id="${p}-inx" href="#${p}-in-pipe" gradientUnits="userSpaceOnUse" x1="0" y1="${crownY}" x2="0" y2="${water + 60}"/>
  <linearGradient id="${p}-wtx" href="#${p}-wtr" gradientUnits="userSpaceOnUse" x1="0" y1="${water}" x2="0" y2="400"/>
  <linearGradient id="${p}-pot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3328"/><stop offset=".5" stop-color="#2a251e"/><stop offset="1" stop-color="#1c1915"/></linearGradient>
  <linearGradient id="${p}-capg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3c1f"/><stop offset=".4" stop-color="#b78445"/><stop offset="1" stop-color="#5a3c1f"/></linearGradient>`;
  return `<div class="dg-xray">${stack(900, 330, body, `${bv.draw}${bd.draw}`, defs).replaceAll("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ')}</div><ol class="dg-facts dg-numbered">${t.items.map(([title, line], i) => `<li><span class="dg-n xr" aria-hidden="true">${i + 1}</span><span><b>${esc(title)}</b> ${esc(line)}</span></li>`).join("")}</ol>`;
}

/* ---- eflowInstall: installed and commissioned from the surface ---- */
// Four small scenes of one manhole, each adding the next part: the sensor
// at the crown, the cable up the shaft, the logger near the top, and the
// phone or tablet at the surface that commissions it through the logger.
const IN = { ground: 44, crown: 134, inv: 188, wall: 8, shaft: [108, 148], surf: 168 };
// Four small scenes of the one manhole, the lid lifted, each adding the
// next part: the sensor going in on its pole, the cable clipped up the
// shaft, the logger hung under the slab, and a tablet at the surface talking
// to the logger. A soft light falls on what each step adds.
function installScene(step) {
  const p = `ein${step}`, { ground: G, crown, inv, wall, surf } = IN, [s0, s1] = IN.shaft;
  const oc = (s0 + s1) / 2, open = 30;
  const ef = efSensor(p, 40, crown, 0.62, { detail: 0 });
  const wt = efWater(p, surf, false, { ...IN, w: 240, shaft: IN.shaft });
  const part = (k, html) => (k <= step ? html : "");
  const [hx, hy, hr] = [[70, crown + 16, 44], [124, 100, 34], [s0 + 10, G + 24, 26], [200, G - 26, 30]][step - 1];
  const clips = [88, 104, 120].map((y) => `<rect x="${s0 + 2.6}" y="${y - 1.4}" width="3.4" height="2.8" rx=".6" fill="url(#${p}-ss)"/>`).join("");
  const body = `
  ${ground(p, { x0: 0, x1: 240, y: G, bottom: 200, asph: 3.5, base: 5, holes: [[oc - open / 2 - 8, oc + open / 2 + 8]] })}
  ${pipeLong(p, { x0: 0, x1: 240, crown, inv, t: wall, joints: [18, 220], gaps: [[s0, s1]], bed: 0, stain: surf - 3 })}
  ${shaft(p, { a: s0, b: s1, top: G, bottom: crown, t: wall, ring: 26, slab: 6, open, oc, steps: [G + 24, G + 42, G + 60, G + 78], stepW: 13, wallTo: crown, lid: false })}
  ${lidAside(p, s1 + 26, s1 + 26 + open + 2, G)}
  ${wt.body}
  <circle cx="${hx}" cy="${hy}" r="${hr}" fill="url(#${p}-halo)"/>`;
  const fx = `
  ${step === 1 ? `<path class="sc-pole" d="M${oc + 6} ${G - 26}L${oc - 2} ${crown - 4}Q${oc - 4} ${crown + 2} ${oc - 12} ${crown + 4}H96"/><path class="sc-pole-hi" d="M${oc + 6} ${G - 26}L${oc - 2} ${crown - 4}"/><path class="ins-move" d="M${oc - 14} ${G + 10}V${crown - 16}"/>` : ""}
  ${part(1, ef.draw)}
  ${part(2, `${cable(`M95.6 ${crown + 5.6}H${s0 + 4.3}V${G + 30}`, { w: 1 })}${clips}`)}
  ${part(3, `${hanger(p, s0, s0 + 11, G + 16)}${hawkLogger(p, s0 + 11, G + 16, 9)}${[0, 1, 2].map((n) => `<path class="ins-wave" style="--d:${n * 0.4}s" d="M${s0 + 3 - n * 6} ${G - 12 - n * 6}q${8 + n * 6} -${6 + n * 4} ${16 + n * 12} 0"/>`).join("")}`)}
  ${part(4, `<path class="ins-link" d="M${s0 + 11} ${G + 12}C${s0 + 14} ${G - 18} 182 ${G - 28} 188 ${G - 24}"/>${tablet(p, 186, G - 38, 32)}`)}`;
  return stack(240, 200, body, fx, `${efDefs(p, { k: 0.5 })}${wt.grad}<radialGradient id="${p}-halo"><stop offset="0" stop-color="#e6fffa" stop-opacity=".3"/><stop offset="1" stop-color="#e6fffa" stop-opacity="0"/></radialGradient>`);
}
const installSteps = (t) => `<ol class="dg-steps">${t.steps.map(([title, line], i) => `<li><p class="dg-step-h"><span class="dg-step-n">${i + 1}</span><b>${esc(title)}</b></p>${installScene(i + 1)}<p>${esc(line)}</p></li>`).join("")}</ol>`;

/* ---- eflowCompare: one storm, three kinds of flowmeter ---- */
// The same storm under each meter: what actually flowed (dashed), the time
// the pipe ran full (shaded), and what the meter recorded.
const CX = (t) => 6 + t * 588, CY = (q) => 86 - q * 68;
const stormQ = (t) => { const u = (t - 0.12) / 0.26; return 0.22 + (u <= 0 ? 0 : 0.86 * u * u * Math.exp(2 * (1 - u))); };
const QF = 0.72;
function compareRow(kind, gap = "") {
  const ts = sample(0, 1, 0.005, (t) => t).map(([t]) => t);
  const over = ts.filter((t) => stormQ(t) > QF), s0 = over[0], s1 = over[over.length - 1];
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
  const line = (fn, keep = () => true) => {
    let d = "", on = false;
    for (const t of ts) { if (!keep(t)) { on = false; continue; } d += `${on ? "L" : "M"}${f1(CX(t))} ${f1(CY(fn(t)))}`; on = true; }
    return d;
  };
  const truth = `<path class="dg-truth" d="${line(stormQ)}"/>`;
  const band = `<rect class="dg-sband" x="${f1(CX(s0))}" y="4" width="${f1(CX(s1) - CX(s0))}" height="84"/>`;
  const rl = (cls, d) => `<path class="dg-rec-g ${cls}" d="${d}"/><path class="dg-rec ${cls}" d="${d}"/>`;
  let rec = "";
  if (kind === "radar") rec = `${rl("r", line(stormQ, (t) => t < s0 || t > s1))}<rect class="dg-gap" x="${f1(CX(s0) + 2)}" y="8" width="${f1(CX(s1) - CX(s0) - 4)}" height="76" rx="4"/><text class="dg-gap-t" x="${f1((CX(s0) + CX(s1)) / 2)}" y="56" text-anchor="middle">${esc(gap)}</text>`;
  else if (kind === "wetted") rec = `<path class="dg-rec w" d="${line((t) => stormQ(t) * (1 - 0.34 * Math.min(1, Math.max(0, (t - 0.08) / 0.92))) + rnd() * 0.035)}"/>`;
  else rec = `${rl("r", line(stormQ, (t) => t <= s0 + 0.0026))}${rl("u", line(stormQ, (t) => t >= s0 && t <= s1 + 0.0026))}${rl("r", line(stormQ, (t) => t >= s1))}`;
  return svg(600, 92, `<path class="dg-axis" d="M6 88H594"/>${band}${truth}${rec}`);
}

// Two drawings with their titles above and what each pair does beneath.
const KEY_EF = {
  radar: `<svg viewBox="0 0 16 10"><path d="M1 1L15 5L1 9Z" class="ef-key r"/></svg>`,
  us: `<svg viewBox="0 0 16 10"><path d="M1 4L15 5L1 6Z" class="ef-key u"/></svg>`,
  solid: `<svg viewBox="0 0 16 10"><path d="M1 6q3-3 6-1t8-1" fill="none" stroke="#8d7f67" stroke-width="2.2" stroke-linecap="round"/><path d="M1.5 5q3-3 6-1t7-1" fill="none" stroke="#c3b9a2" stroke-width=".8" stroke-linecap="round"/></svg>`,
  profile: `<svg viewBox="0 0 16 10"><path d="M1 2H13m-3-2 3 2-3 2M1 7H9m-3-2 3 2-3 2" class="ef-key p"/></svg>`,
  mean: `<svg viewBox="0 0 16 10"><path d="M1 5H15" class="ef-key m"/></svg>`,
  truth: `<svg viewBox="0 0 16 10"><path d="M1 5H15" class="dg-truth"/></svg>`,
  band: `<svg viewBox="0 0 16 10"><rect x="1" y="1" width="14" height="8" rx="2" class="dg-sband"/></svg>`,
  recr: `<svg viewBox="0 0 16 10"><path d="M1 5H15" class="dg-rec r"/></svg>`,
  recu: `<svg viewBox="0 0 16 10"><path d="M1 5H15" class="dg-rec u"/></svg>`,
  recw: `<svg viewBox="0 0 16 10"><path d="M1 5H15" class="dg-rec w"/></svg>`,
};
const efLegend = (t) => (t.legend ? `<ul class="dg-legend">${t.legend.map(([k, l]) => `<li>${KEY_EF[k].replace("<svg ", '<svg aria-hidden="true" ')}${esc(l)}</li>`).join("")}</ul>` : "");
const efPanels = (t, drawings) => `<div class="dg-panels">${drawings.map((d, i) => {
  const [title, note, facts] = t.panels[i];
  return `<div class="dg-panel"><p class="dg-panel-h"><b>${esc(title)}</b>${note ? `<span>${esc(note)}</span>` : ""}</p>${d}${facts ? `<ul class="dg-facts">${facts.map(([n, pair, f]) => `<li${n ? "" : ' class="plain"'}>${n ? `<span class="dg-n ${pair}" aria-hidden="true">${n}</span>` : ""}<span>${esc(f)}</span></li>`).join("")}</ul>` : ""}</div>`;
}).join("")}</div>`;
// The profile figure ends in the sum it shows: mean velocity times area is flow.
const efSum = (t) => `<div class="dg-sum">${t.sum.map(([sym, name, note], i) => `${i ? `<span class="dg-op" aria-hidden="true">${i === t.sum.length - 1 ? "=" : "×"}</span>` : ""}<div><i>${esc(sym)}</i><b>${esc(name)}</b><span>${esc(note)}</span></div>`).join("")}</div>`;
const efRows = (t) => `<div class="dg-rows">${t.rows.map(([kind, title, verdict]) => `<div class="dg-row ${kind}"><p class="dg-row-h"><b>${esc(title)}</b><span>${esc(verdict)}</span></p>${compareRow(kind, t.gap)}</div>`).join("")}</div>`;

/* ---- hawk: a 4G logger that lives inside the manhole ---- */
// The Hawk on its stainless wall bracket under the cover slab, an E-Flow 3
// at the pipe crown on its RS485 cable, and the 4G link out through the
// lid. Nothing above the road: that is the point of the drawing.
function hawkFig(t) {
  const L = t.labels, p = "rth";
  const G = 74, S0 = 296, S1 = 344, CROWN = 230, INV = 302, LEVEL = 278, SURCH = 168, T = 9;
  const oc = (S0 + S1) / 2, open = 40, hx = S0 + 14, hy = G + 26;
  const ef = efSensor(p, 150, CROWN, 0.86, { cable: `H${S0 + 5}Q${S0 + 3} ${CROWN + 7.7} ${S0 + 3} ${CROWN - 4}V${hy + 34}Q${S0 + 3} ${hy + 30} ${hx - 2} ${hy + 30}` });
  const bv = efBeam(p, "bv", ef.vel, 11, { toY: LEVEL }), bd = efBeam(p, "bd", ef.depth, 7, { toY: LEVEL, waves: 3 });
  const body = `
  ${ground(p, { x0: 0, x1: 480, y: G, bottom: 336, holes: [frameSpan(open, oc)] })}
  ${pipeLong(p, { x0: 0, x1: 480, crown: CROWN, inv: INV, t: T, joints: [70, 430], gaps: [[S0, S1]], bed: 10, stain: LEVEL - 3 })}
  ${shaft(p, { a: S0, b: S1, top: G, bottom: CROWN, t: T, ring: 30, slab: 8, open, oc, steps: [G + 72, G + 92, G + 112, G + 132], stepW: 16, wallTo: CROWN })}
  ${water(p, { x0: 0, x1: 480, level: LEVEL, bottom: INV })}
  <g class="dg-level alarm"><path d="M${S0 - 30} ${SURCH}H${S1}"/></g>
  ${tag(S0 - 36, SURCH - 9, L.surcharge, { a: "end", cls: "alarm" })}
  ${ef.draw}
  ${hanger(p, S0, hx, hy)}${hawkLogger(p, hx, hy, 12)}
  ${tag(S0 - 18, hy + 6, L.hawk, { a: "end", bold: true })}${lead([[S0 - 14, hy + 3], [hx - 6, hy + 14]])}
  ${tag(S0 - 18, 214, L.cable, { a: "end", bold: true })}${lead([[S0 - 14, 210], [S0 + 3, 210]])}
  ${tag(24, 214, L.sensor, { bold: true })}${lead([[84, 214], [166, 236]])}
  ${label(472, G - 14, L.surface, { a: "end", cls: "dg-m" })}
  ${label(hx, G - 40, L.data, { a: "middle", cls: "dg-b" })}
  ${flowArrow(18, 295, L.flow || "Flow")}`;
  const fx = `${bd.draw}${bv.draw}<circle class="dg-ping" cx="${hx + 2.6}" cy="${hy - 9}" r="9"/><path class="dg-link" d="M${hx + 2.6} ${hy - 12}V${G - 30}"/>`;
  return stack(480, 336, body, fx, `${texDefs(p, 0.7)}${matDefs(p)}${instDefs(p)}${bd.defs}${bv.defs}`);
}

/* ---- msfm: an area velocity flow meter in a manhole ---- */
// The MSFM S2.5T in its yellow frame on the step irons, high in the shaft,
// its two sensor cables down the shaft and along the bottom of the incoming
// pipe to the area velocity sensor, which sits on a stainless ring facing
// upstream with its ultrasonic beam into the flow. The data goes out through
// the lid. The ring's far half shows in the air above the water. The
// labels are placed for the 1.36 scale they take on a phone: the surcharge
// sits right of the shaft, the cables' label inside the pipe.
function msfmFig(t) {
  const L = t.labels, p = "rtm";
  const G = 74, S0 = 300, S1 = 356, CROWN = 222, INV = 300, LEVEL = 266, SURCH = 178, T = 9;
  const oc = (S0 + S1) / 2, open = 42, uy = G + 20;
  const unit = msfmUnit(p, oc, uy, 26);
  const SX = 168, SW = 30, RX = SX + SW * 0.55;
  const [[ax, ay], [bx, by]] = unit.plugs;
  const run = (px, py, dx) => `M${px} ${py}V${py + 6}Q${px} ${py + 11} ${px - 5} ${py + 11}H${S0 + 9 + dx}Q${S0 + 5 + dx} ${py + 11} ${S0 + 5 + dx} ${py + 16}V${INV - 6 - dx}Q${S0 + 5 + dx} ${INV - 2 - dx} ${S0 + dx} ${INV - 2 - dx}H${SX + SW - 1}`;
  const beam = efBeam(p, "uv", [SX + 6.5, INV - 4.2, -0.58, -0.81], 10, { toY: LEVEL + 1.5, kind: "u", waves: 3 });
  const body = `
  ${ground(p, { x0: 0, x1: 480, y: G, bottom: 336, holes: [frameSpan(open, oc)] })}
  ${pipeLong(p, { x0: 0, x1: 480, crown: CROWN, inv: INV, t: T, joints: [64, 432], gaps: [[S0, S1]], bed: 10, stain: LEVEL - 3 })}
  ${shaft(p, { a: S0, b: S1, top: G, bottom: CROWN, t: T, ring: 30, slab: 8, open, oc, steps: [uy + 22, uy + 44, G + 92, G + 114, G + 136], stepW: 34, wallTo: CROWN })}
  <rect x="${f1(RX)}" y="${CROWN}" width="3.2" height="${INV - CROWN}" fill="url(#${p}-ssv)"/>
  <rect x="${f1(RX - 0.6)}" y="${CROWN - 1}" width="4.4" height="2.2" fill="url(#${p}-ss)"/>
  ${water(p, { x0: 0, x1: 480, level: LEVEL, bottom: INV })}
  <g class="dg-level alarm"><path d="M${S0} ${SURCH}H${S1 + 6}"/></g>
  ${tag(S1 + 10, SURCH - 9, L.surcharge, { cls: "alarm" })}
  ${unit.draw}
  ${[uy + 22, uy + 44].map((y) => [oc - 13, oc + 10.7].map((x) => `<rect x="${f1(x - 0.5)}" y="${y - 1.6}" width="3.3" height="3.2" rx=".6" fill="#16191b"/>`).join("")).join("")}
  ${cable(run(bx, by, 1.8), { w: 1.2 })}
  ${cable(run(ax, ay, 0), { w: 1.4, cls: "yel" })}
  ${avSensor(p, SX, INV, SW)}
  <rect x="${f1(RX - 0.6)}" y="${INV - 1.2}" width="4.4" height="2.2" fill="url(#${p}-ss)"/>
  ${tag(S0 - 18, uy + 26, L.unit, { a: "end", bold: true })}${lead([[S0 - 14, uy + 23], [oc - 9, uy + 26]])}
  ${tag(S0 - 8, 250, L.cables, { a: "end", bold: true })}${lead([[S0 - 4, 246], [S0 + 5, 246]])}
  ${tag(24, 190, L.sensor, { bold: true })}${lead([[104, 212], [SX + 14, INV - 5]])}
  ${label(oc, G - 40, L.data, { a: "middle", cls: "dg-b" })}
  ${flowArrow(18, 292, L.flow || "Flow")}`;
  const fx = `${beam.draw}<circle class="dg-ping" cx="${oc}" cy="${uy - 4}" r="9"/><path class="dg-link" d="M${oc} ${uy - 6}V${G - 30}"/>`;
  return stack(480, 336, body, fx, `${texDefs(p, 0.7)}${matDefs(p)}${instDefs(p)}${beam.defs}`);
}

/* ---- alarm2: a radar level alarm at the top of a chamber ---- */
// Alarm2 looking down from under the cover on its bracket, its beam
// reaching the water, the alarm set-points dashed across the chamber, and
// the link out through its external antenna in the frame.
function alarm2(t) {
  const L = t.labels, p = "rta";
  const G = 74, WL = 204, WR = 348, T = 9, CROWN = 256, INV = 290, LEVEL = 274;
  const lv = { high: 176, low: 302 };
  const oc = (WL + WR) / 2, open = 96;
  const unit = alarm2Unit(p, 248, G + 22, 52);
  const [lx, ly] = unit.lens;
  const beam = efBeam(p, "bm", [lx, ly, 0, 1], 9, { toY: LEVEL, waves: 4 });
  const FLOOR = 318;
  const body = `
  ${ground(p, { x0: 0, x1: 480, y: G, bottom: 336, holes: [frameSpan(open, oc)] })}
  ${pipeLong(p, { x0: 0, x1: WL - T, crown: CROWN, inv: INV, t: 6, joints: [60], bed: 8, stain: LEVEL - 3 })}
  ${pipeLong(p, { x0: WR + T, x1: 480, crown: CROWN, inv: INV, t: 6, joints: [420], bed: 8, stain: LEVEL - 3 })}
  ${shaft(p, { a: WL, b: WR, top: G, bottom: FLOOR, t: T, ring: 34, slab: 9, open, oc, steps: [G + 52, G + 72, G + 92, G + 112, G + 132, G + 152], stepW: 22, wallTo: CROWN })}
  <path fill="url(#${p}-conc)" d="M${WL - T} ${INV}H${WL}V${FLOOR + T}H${WL - T}ZM${WR} ${INV}H${WR + T}V${FLOOR + T}H${WR}ZM${WL - T} ${FLOOR}H${WR + T}V${FLOOR + T}H${WL - T}Z"/>
  <path class="sc-cut-edge" d="M${WL - T} ${INV}V${FLOOR + T}H${WR + T}V${INV}M${WL} ${INV}V${FLOOR}H${WR}V${INV}"/>
  ${water(p, { x0: 0, x1: WL, level: LEVEL, bottom: INV })}${water(p, { x0: WR, x1: 480, level: LEVEL, bottom: INV })}
  ${water(p, { x0: WL, x1: WR, level: LEVEL, bottom: FLOOR, streaks: false })}
  <path class="sc-hanger" d="M${f1(lx - 18)} ${G + 14.5}V${G + 22}M${f1(lx + 4)} ${G + 14.5}V${G + 22}"/>
  <rect x="${f1(lx - 26)}" y="${G + 13.6}" width="38" height="2.6" fill="url(#${p}-ss)"/>
  ${unit.draw}
  ${cable(`M248 ${G + 28}H226V${G + 15}`, { w: 1 })}
  <rect x="223.4" y="${G + 3}" width="5.2" height="12" rx="2" fill="#16191b"/>
  <g class="dg-level alarm"><path d="M${WL} ${lv.high}H${WR + 18}"/></g>
  <g class="dg-level"><path d="M${WL} ${lv.low}H${WR + 18}"/></g>
  ${tag(WR + 24, lv.high + 4, L.high, { cls: "alarm" })}
  ${tag(WR + 24, lv.low + 4, L.low, { bold: true })}
  ${tag(WL - 18, G + 32, L.unit, { a: "end", bold: true })}${lead([[WL - 14, G + 28], [250, G + 30]])}
  ${tag(WL - 18, 200, L.radar, { a: "end", bold: true })}${lead([[WL - 14, 196], [f1(lx - 4), 196]])}
  ${label(240, G - 46, L.data, { cls: "dg-b" })}`;
  const fx = `${beam.draw}<circle class="dg-ping" cx="226" cy="${G + 4}" r="9"/><path class="dg-link" d="M226 ${G - 14}V${G - 54}"/>`;
  return stack(480, 336, body, fx, `${texDefs(p, 0.66)}${matDefs(p)}${instDefs(p)}${beam.defs}`);
}

/* ---- two-panel charts: HTML titles and legend, a small SVG each ---- */
// Hydrographs over two days as a logger records them: five-minute flow with
// its scatter about a daily pattern, the response to one storm, and the
// rainfall that caused it hanging from the top in 15 minute bars. Flow is in
// litres a second on the left axis.
const hx = (t) => 30 + t * 262;
const dwf = (t) => 0.45 + 0.17 * Math.sin(2 * Math.PI * (2 * t) - 1.9) + 0.04 * Math.sin(2 * Math.PI * (6 * t) - 0.6);
// a storm's response: a gamma curve that rises over `k` and peaks at 1
const pulse = (t, t0, k) => { const u = (t - t0) / k; return u <= 0 ? 0 : u * u * Math.exp(2 * (1 - u)); };
const noisy = (seed0) => { let s0 = seed0; const r = () => ((s0 = (s0 * 16807) % 2147483647) / 2147483647 - 0.5); let lag = 0; return () => (lag = 0.55 * lag + r()); };
const rainBars = () => [3, 7, 13, 21, 30, 34, 26, 17, 10, 6, 3].map((h, n) => `<rect x="${f1(hx(0.275) + n * 4.6)}" y="8" width="3.6" height="${h}"/>`).join("");
// time along the foot of a chart: small ticks, with their hours
const ticks = (y, list) => `<path class="dg-tick-mark" d="${list.map(([t]) => `M${f1(hx(t))} ${y}v4`).join("")}"/>${list.map(([t, s], i) => `<text class="dg-tick" x="${f1(hx(t))}" y="${y + 15}" text-anchor="${i === 0 ? "start" : i === list.length - 1 ? "end" : "middle"}">${s}</text>`).join("")}`;
const yAxis = (ys, x = 30) => `<path class="dg-tick-mark" d="${ys.map(([y]) => `M${x} ${f1(y)}h-3`).join("")}"/>${ys.map(([y, s]) => `<text class="dg-tick" x="${x - 5}" y="${f1(y + 3.4)}" text-anchor="end">${s}</text>`).join("")}`;
function hydro(a, b, seed) {
  const n = noisy(seed);
  const q = (t) => dwf(t) + a * pulse(t, 0.3, 0.06) + b * pulse(t, 0.3, 0.17);
  const y = (v) => 150 - v * 56;
  const ts = sample(0, 1, 0.004, (t) => t);
  const meas = ts.map(([t]) => [hx(t), y(q(t) + n() * 0.028 * (1 + 2 * a * pulse(t, 0.3, 0.06)))]), base = ts.filter((_, i) => i % 3 === 0).map(([t]) => [hx(t), y(dwf(t))]);
  const band = `M${meas.map(([x, yy]) => `${f1(x)} ${f1(yy)}`).join("L")}L${base.slice().reverse().map(([x, yy]) => `${f1(x)} ${f1(yy)}`).join("L")}Z`;
  return svg(300, 172, `
  <path class="dg-grid" d="${[0.5, 1, 1.5].map((v) => `M30 ${f1(y(v))}H292`).join("")}"/>
  <g class="dg-rain">${rainBars()}</g>
  <path class="dg-axis" d="M30 152H292M30 40V152"/>
  ${yAxis([[y(0), "0"], [y(0.5), "20"], [y(1), "40"], [y(1.5), "60"]])}
  ${ticks(152, [[0, "0 h"], [0.25, "12 h"], [0.5, "24 h"], [0.75, "36 h"], [1, "48 h"]])}
  <path class="dg-band" d="${band}"/>
  <path class="dg-dwf" d="${smooth(base)}"/>
  <path class="dg-meas ch-raw" d="M${meas.map(([x, yy]) => `${f1(x)} ${f1(yy)}`).join("L")}"/>`);
}
// One day of flow, sampled by time or by volume.
function sampling(mode) {
  const n = noisy(mode === "time" ? 101 : 101);
  const q = (t) => 0.32 + 0.12 * Math.sin(2 * Math.PI * t - 1.9) + 0.75 * pulse(t, 0.53, 0.075);
  const y = (v) => 140 - v * 88;
  const ts = sample(0, 1, 0.004, (t) => t);
  const vals = ts.map(([t]) => [t, q(t) + n() * 0.02]);
  const line = vals.map(([t, v]) => [hx(t), y(v)]);
  const k = 12;
  let at;
  if (mode === "time") at = Array.from({ length: k }, (_, i) => (i + 0.5) / k);
  else {
    const cum = [0]; for (let i = 1; i < ts.length; i++) cum.push(cum[i - 1] + q(ts[i][0]) * 0.004);
    const total = cum[cum.length - 1];
    at = Array.from({ length: k }, (_, i) => { const v = ((i + 0.5) / k) * total; const j = cum.findIndex((c) => c >= v); return ts[Math.max(0, j)][0]; });
  }
  const raw = `M${line.map(([x, yy]) => `${f1(x)} ${f1(yy)}`).join("L")}`;
  return svg(300, 172, `
  <path class="dg-grid" d="${[0.5, 1].map((v) => `M30 ${f1(y(v))}H292`).join("")}"/>
  <path class="dg-area" d="${raw}L292 144L30 144Z"/>
  <path class="dg-axis" d="M30 144H292M30 40V144"/>
  ${yAxis([[y(0), "0"], [y(0.5), "10"], [y(1), "20"]])}
  <g class="dg-guide">${at.map((t) => `<path d="M${f1(hx(t))} 144V${f1(y(q(t)) + 4)}"/>`).join("")}</g>
  <path class="dg-meas ch-raw" d="${raw}"/>
  ${at.map((t, i) => `<g class="dg-sample" style="--d:${i * 0.12}s"><rect x="${f1(hx(t) - 2.6)}" y="151" width="5.2" height="9" rx="1"/><rect x="${f1(hx(t) - 1.6)}" y="148.6" width="3.2" height="2.6" rx=".5"/></g>`).join("")}
  ${ticks(160, [[0, "00:00"], [0.25, "06:00"], [0.5, "12:00"], [0.75, "18:00"], [1, "24:00"]])}`, `<linearGradient id="dg-sa-${mode}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4a6" stop-opacity=".26"/><stop offset="1" stop-color="#5fb4a6" stop-opacity=".02"/></linearGradient>`).replace('class="dg-area"', `class="dg-area" style="fill:url(#dg-sa-${mode});fill-opacity:1"`);
}
const KEYS = {
  rain: `<svg viewBox="0 0 16 10"><rect x="3" y="0" width="4" height="10" rx="1" class="dg-rain-key"/><rect x="9" y="3" width="4" height="7" rx="1" class="dg-rain-key"/></svg>`,
  meas: `<svg viewBox="0 0 16 10"><path d="M1 5H15" class="dg-meas"/></svg>`,
  dwf: `<svg viewBox="0 0 16 10"><path d="M1 5H15" class="dg-dwf"/></svg>`,
  band: `<svg viewBox="0 0 16 10"><rect x="1" y="1" width="14" height="8" rx="2" class="dg-band"/></svg>`,
  sample: `<svg viewBox="0 0 16 10"><rect x="5" y="0" width="6" height="10" rx="1.5" class="dg-sample"/></svg>`,
};
const panels = (t, list) => `<div class="dg-panels">${list.map(([title, note, drawing]) => `<div class="dg-panel"><p class="dg-panel-h"><b>${esc(title)}</b>${note ? `<span>${esc(note)}</span>` : ""}</p>${drawing}</div>`).join("")}</div>${t.legend ? `<ul class="dg-legend">${t.legend.map(([k, l]) => `<li>${KEYS[k].replace("<svg ", '<svg aria-hidden="true" ')}${esc(l)}</li>`).join("")}</ul>` : ""}`;

// Drawings in two panels carry their titles and key as page text; the
// others are one picture with an alt text.
const PANELS = new Set(["beforeafter", "sampling", "eflowModes", "eflowObvert", "eflowProfile", "eflowCompare", "eflowXray", "eflowInstall"]);
// The E-Flow 3 drawings sit on a dark instrument screen, like the demo.
const SCREEN = new Set(["eflowModes", "eflowObvert", "eflowProfile", "eflowCompare", "eflowXray", "eflowInstall"]);
const DRAW = {
  thermal: (t) => thermal(t),
  wetwell: (t) => wetwell(t),
  tradewaste: (t) => tradewaste(t),
  wqstation: (t) => wqstation(t),
  connect: (t) => connect(t),
  scatter: (t) => scatter(t),
  rainfall: (t) => rainfall(t),
  fullpipe: (t) => fullpipe(t),
  beforeafter: (t) => panels(t, [[t.panels[0][0], t.panels[0][1], hydro(1.05, 0.28, 17)], [t.panels[1][0], t.panels[1][1], hydro(0.26, 0.06, 23)]]),
  sampling: (t) => panels(t, [[t.panels[0][0], t.panels[0][1], sampling("time")], [t.panels[1][0], t.panels[1][1], sampling("flow")]]),
  hawk: (t) => hawkFig(t),
  alarm2: (t) => alarm2(t),
  msfm: (t) => msfmFig(t),
  eflowModes: (t) => efPanels(t, [eflowNormal(t), eflowSurcharge(t)]) + efLegend(t),
  eflowObvert: (t) => efPanels(t, [invertPanel(t), obvertPanel(t)]) + efLegend(t),
  eflowProfile: (t) => efPanels(t, [profileLong(t), profileCross(t)]) + efSum(t) + efLegend(t),
  eflowCompare: (t) => efRows(t) + efLegend(t),
  eflowXray: (t) => xray(t),
  eflowInstall: (t) => installSteps(t),
};

// The figure: the drawing on a white plate, described for screen readers by
// its alt text, with the caption beneath like a photograph's.
export function diagram(id, t, { i } = {}) {
  if (!DRAW[id] || !t) throw new Error(`No illustration named "${id}" (diagrams.mjs and \`diagrams\` in content.mjs)`);
  return `
<figure class="diagram dg-${id}${SCREEN.has(id) ? " dg-screen ef-dark" : ""}" data-reveal${i != null ? ` style="--i:${i}"` : ""}>
  ${PANELS.has(id) ? `<div class="dg-plate"><p class="sr-only">${esc(t.alt)}</p>${DRAW[id](t)}</div>` : `<div class="dg-plate" role="img" aria-label="${esc(t.alt)}">${DRAW[id](t)}</div>`}
  <figcaption>${esc(t.caption)}</figcaption>
</figure>`;
}
