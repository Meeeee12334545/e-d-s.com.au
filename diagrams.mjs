// Illustrations: schematic drawings that show how a method works, on the
// service and solution pages that have no photograph of it. Each is inline
// SVG drawn in the site's own lines (site.css: .diagram), so it is sharp at
// any size and costs no download. The words in them, the alt text and the
// captions live in `diagrams` in content.mjs; a page names one with
// `diagram: "<id>"`. Every caption says it is an illustration.
//
// Labels are set in the drawing's own units and grow a step when the figure
// is narrow (a container query in site.css), so each label is placed with
// room to grow into. Moving parts are few and use transforms, dashes and
// fill-opacity, and pause off screen like the other ambient loops.

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
/* ---- the light kit: sections on a white plate ----
   The service and solution figures draw with the E-Flow kit's materials in
   their light variant (efDefs, dark: false): stippled soil, cut concrete
   hatched, air and water gradients under a glowing surface, and instruments
   as shaded bodies rather than boxes. One family with the instrument
   screens, on white. Shared pieces first; each drawing then places them. */
const LW = 6; // the cut wall of a pipe or shaft
// a sewer in long section: air between crown and invert, the cut walls
// hatched above and below; `gaps` leaves the top wall open where a shaft
// comes down through it
const ltPipe = (p, x0, x1, crown, inv, { gaps = [], w = LW } = {}) => {
  const tops = [], top = [];
  let x = x0;
  for (const [a, b] of gaps) { tops.push([x, a]); x = b; }
  tops.push([x, x1]);
  for (const [a, b] of tops) top.push(`M${a} ${crown - w}H${b}V${crown}H${a}Z`);
  return `
  <rect x="${x0}" y="${crown}" width="${x1 - x0}" height="${inv - crown}" fill="url(#${p}-air)"/>
  <path fill="url(#${p}-cut)" d="${top.join("")}M${x0} ${inv}H${x1}V${inv + w}H${x0}Z"/>
  <path class="ef-edge" d="${tops.map(([a, b]) => `M${a} ${crown - w}H${b}M${a} ${crown}H${b}`).join("")}M${x0} ${inv}H${x1}M${x0} ${inv + w}H${x1}"/>`;
};
// a manhole shaft from the ground to the pipe crown: air, hatched walls, the
// frame and lid at the surface, step irons down one wall
const ltShaft = (p, a, b, ground, crown, inv, { steps = "right", w = LW } = {}) => `
  <rect x="${a}" y="${ground}" width="${b - a}" height="${inv - ground}" fill="url(#${p}-air)"/>
  <path fill="url(#${p}-cut)" d="M${a - w} ${ground}H${a}V${crown - w}H${a - w}ZM${b} ${ground}H${b + w}V${crown - w}H${b}Z"/>
  <path class="ef-edge" d="M${a - w} ${ground}V${crown - w}M${a} ${ground}V${crown}M${b} ${ground}V${crown}M${b + w} ${ground}V${crown - w}"/>
  <rect class="ef-frame" x="${a - w - 4}" y="${ground - 7}" width="${b - a + 2 * w + 8}" height="3.4" rx="1"/>
  <rect class="ef-lid" x="${a - 1}" y="${ground - 8.6}" width="${b - a + 2}" height="3.2" rx="1"/>
  ${steps ? [1, 2, 3, 4].map((k) => ground + 16 * k).filter((y) => y < crown - 10).map((y) => `<path class="ef-step" d="M${steps === "right" ? b : a} ${y}h${steps === "right" ? -6 : 6}v4h${steps === "right" ? 6 : -6}"/>`).join("") : ""}`;
// water in a pipe or channel: the gradient under its glowing surface, and
// the flow marked by dashes moving along it
const ltWater = (p, x0, x1, level, inv, { flow = true } = {}) => `
  <rect x="${x0}" y="${level}" width="${x1 - x0}" height="${inv - level}" fill="url(#${p}-wg)"/>
  <path class="ef-surf-g" d="M${x0} ${level}H${x1}"/><path class="ef-surf" d="M${x0} ${level}H${x1}"/>
  ${flow ? `<path class="dg-flow" d="M${x0 + 14} ${f1((level + inv) / 2 + 1)}H${x1 - 14}"/>` : ""}`;
const ltWaterGrad = (p) => `<linearGradient id="${p}-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef-w0"/><stop offset=".18" class="ef-w1"/><stop offset="1" class="ef-w2"/></linearGradient>`;
const ltGroundGrad = (p) => `<linearGradient id="${p}-gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="dg-gw0"/><stop offset="1" class="dg-gw1"/></linearGradient>`;
// a data logger hung from a strap: cream body, graphite cap, a status LED
const ltLogger = (x, y, w = 15, h = 28) => `
  <path class="ef-strap" d="M${x - 4} ${y + 3}h${w + 8}"/>
  <rect class="ef-logger" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>
  <rect class="ef-logger-cap" x="${x}" y="${y}" width="${w}" height="${f1(h * 0.24)}" rx="3"/>
  <path class="dg-inst-print" d="M${x + 3} ${y + h - 10}h${w - 6}M${x + 3} ${y + h - 7}h${w - 9}"/>
  <circle class="dg-led-ok" cx="${x + w - 3.5}" cy="${y + h - 4}" r="1.3"/>`;
// an area velocity sensor on the invert, its sloping face upstream (left)
const ltAv = (x, y, w = 24) => `
  <path class="dg-inst" d="M${x} ${y - 1}l${f1(w * 0.32)} -7H${f1(x + w - 3)}q3 0 3 3v4z"/>
  <path class="dg-inst-print" d="M${f1(x + w * 0.42)} ${y - 5.5}h${f1(w * 0.36)}"/>
  <rect class="dg-inst-base" x="${x - 1}" y="${y - 2}" width="${w + 3}" height="2.4" rx="1"/>`;
// a radar level sensor hung looking down: cream body, the dome beneath
const ltRadar = (p, cx, y, w = 20, h = 15) => `
  <rect class="dg-inst" x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="3"/>
  <rect class="ef-mark" x="${cx - w / 2 + 3}" y="${y + 3}" width="2" height="${h - 6}" rx="1"/>
  <path class="dg-inst-print" d="M${cx - w / 2 + 7} ${y + 5}h${w - 11}M${cx - w / 2 + 7} ${y + 8}h${w - 14}"/>
  <path d="M${cx - 6} ${y + h}A6 6 0 0 0 ${cx + 6} ${y + h}Z" fill="url(#${p}-dome)" class="ef-dome"/>`;
// a cabinet at the surface: steel, a door seam, a handle and a status lamp
const ltCabinet = (p, x, y, w, h) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" fill="url(#${p}-steel)" class="dg-cab"/>
  <path class="dg-cab-seam" d="M${f1(x + w * 0.5)} ${y + 4}V${y + h - 4}"/>
  <rect class="dg-cab-handle" x="${f1(x + w * 0.5 + 3)}" y="${f1(y + h * 0.48)}" width="2" height="7" rx="1"/>
  <path class="dg-cab-seam" d="M${x + 5} ${y + h - 9}h${f1(w * 0.5 - 10)}M${x + 5} ${y + h - 6}h${f1(w * 0.5 - 10)}"/>
  <circle class="dg-lamp" cx="${x + 9}" cy="${y + 8}" r="2.2"/>
  <rect class="dg-cab-foot" x="${x - 2}" y="${y + h - 1}" width="${w + 4}" height="2.4" rx="1"/>`;
// an antenna on a mast with its ping
const ltAntenna = (x, y, h = 14) => `<path class="dg-cable" d="M${x} ${y}V${y - h}"/><circle class="dg-antenna" cx="${x}" cy="${y - h - 2}" r="2.6"/><circle class="dg-ping" cx="${x}" cy="${y - h - 2}" r="9"/>`;
// an automatic sampler at the surface: a cabinet with the bottle carousel
// seen through its window
const ltSampler = (x, y, w = 40, h = 46) => `
  <rect class="dg-sampler" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>
  <rect class="dg-sampler-top" x="${x}" y="${y}" width="${w}" height="9" rx="4"/>
  <rect class="dg-sampler-win" x="${x + 6}" y="${y + 15}" width="${w - 12}" height="${h - 21}" rx="3"/>
  ${[0, 1, 2].map((k) => `<rect class="dg-bottle" x="${x + 9.5 + k * 7.6}" y="${y + 21}" width="5" height="${h - 30}" rx="2"/>`).join("")}
  <path class="dg-cab-seam" d="M${x + 6} ${y + 12}h${w - 12}"/>
  <circle class="dg-lamp" cx="${x + w - 7}" cy="${y + 4.5}" r="1.8"/>`;
// a flow mark inside a pipe on the light plate
const ltFlow = (x, y, text) => `<text x="${x}" y="${y}" class="dg-m">${esc(text)}</text><path class="dg-arrow" d="M${x + 38} ${y - 4}h14m-4-3.5 4 3.5-4 3.5"/>`;

/* ---- thermal: a thermistor string finds where groundwater gets in ---- */
function thermal(t) {
  const L = t.labels, p = "ltt";
  const G = 52, TABLE = 104, CROWN = 140, INV = 176, SOIL = 224;
  const SA = [58, 86], SB = [394, 422]; // the two shafts (inside faces)
  const beads = Array.from({ length: 12 }, (_, k) => 100 + k * 22);
  const at = 242; // the defective joint
  const temp = (x) => 262 + 32 * Math.exp(-(((x - at) / 30) ** 2));
  const hot = beads.filter((x) => temp(x) - 262 > 5);
  const bead = (x, y) => `${hot.includes(x) ? `<circle class="dg-bead-g" cx="${x}" cy="${y}" r="3.2"/>` : ""}<circle class="dg-bead${hot.includes(x) ? " hot" : ""}" cx="${x}" cy="${y}" r="3.2"/>`;
  const body = `
  <rect x="0" y="${G}" width="480" height="${SOIL - G}" fill="url(#${p}-soil)"/>
  <rect x="0" y="${TABLE}" width="480" height="${SOIL - TABLE}" fill="url(#${p}-gw)"/>
  <rect class="ef-road" x="0" y="${G - 5}" width="480" height="5"/>
  <path class="dg-table" d="M0 ${TABLE}H480"/>
  <path class="dg-table-mark" d="M122 96h10l-5 7z"/>
  ${label(138, 100, L.groundwater, { cls: "dg-m dg-h" })}
  ${ltPipe(p, 0, 480, CROWN, INV, { gaps: [[SA[0] - LW, SA[1] + LW], [SB[0] - LW, SB[1] + LW]] })}
  ${ltShaft(p, SA[0], SA[1], G, CROWN, INV, { steps: "right" })}
  ${ltShaft(p, SB[0], SB[1], G, CROWN, INV, { steps: "left" })}
  ${ltWater(p, 0, 480, 160, INV)}
  ${[104, 150, 196, 288, 334, 380].map((x) => `<path class="dg-joint" d="M${x} ${CROWN - LW}V${CROWN}M${x} ${INV}V${INV + LW}"/>`).join("")}
  <path class="dg-crack" d="M238 ${CROWN - LW - 1}l4 4-2 3 5 3 3-4M248 ${CROWN - LW - 1}v8"/>
  <g class="dg-seep"><path d="M216 112q12 8 22 22"/><path d="M270 112q-12 8-22 22"/></g>
  <g class="dg-drips">${[0, 1, 2].map((n) => `<ellipse cx="${240 + n * 3}" cy="146" rx="1.5" ry="2.3" style="--d:${n * 0.6}s"/>`).join("")}</g>
  ${label(262, 124, L.defect, { cls: "dg-b dg-h" })}${leader("M258 120L249 134")}
  <path class="ef-cable" d="M70 86V173H346"/>
  ${beads.map((x) => bead(x, 173)).join("")}
  ${ltLogger(63, 58)}
  ${ltAv(360, INV)}
  <path class="ef-cable" d="M384 171H400V86"/>
  ${ltLogger(401, 58)}
  ${ltFlow(422, 156, L.flow || "Flow")}
  ${label(100, 73, L.logger, { cls: "dg-b dg-h" })}${leader("M97 69L80 69")}
  ${label(380, 73, L.meter, { a: "end", cls: "dg-b dg-h" })}${leader("M372 77V166")}
  ${label(98, 208, L.string, { cls: "dg-b dg-h" })}${leader("M108 196V182")}
  <g class="dg-guide">${hot.map((x) => `<path d="M${x} 182V${f1(temp(x)) - 5}"/>`).join("")}</g>
  <path class="dg-grid" d="M92 262H388"/>
  <path class="dg-band-cool" d="${smooth(sample(92, 388, 8, temp))}L388 262H92Z"/>
  <path class="dg-axis" d="M92 326H388"/>
  <path class="dg-trace" d="${smooth(sample(92, 388, 8, temp))}"/>
  ${beads.map((x) => bead(x, f1(temp(x)))).join("")}
  ${label(92, 346, L.chart, { cls: "dg-b" })}
  ${label(292, 290, L.change, { cls: "dg-m" })}${leader("M288 287L256 293")}`;
  return svg(480, 354, body, `${efDefs(p)}${ltWaterGrad(p)}${ltGroundGrad(p)}`);
}

/* ---- wetwell: a pump station under watch ---- */
function wetwell(t) {
  const L = t.labels, p = "ltw";
  const G = 86, WL = 176, WR = 320, WW = 8, FLOOR = 352;
  const lv = { overflow: 132, surcharge: 174, start: 222, stop: 296 };
  const radar = { cx: 196, y: 90 };
  const beam = efBeam(p, "bm", [radar.cx, radar.y + 21, 0, 1], 5, { toY: lv.stop - 4, waves: 3 });
  const pump = (x, n) => `
  <g class="dg-pump">
    <rect class="dg-pump-body" x="${x}" y="318" width="34" height="32" rx="5" fill="url(#${p}-steel)"/>
    <rect class="dg-pump-cap" x="${x + 5}" y="312" width="24" height="8" rx="3"/>
    <path class="dg-cab-seam" d="M${x + 6} 334h22M${x + 6} 340h22"/>
    <rect class="dg-inst-base" x="${x - 2}" y="350" width="38" height="2.4" rx="1"/>
    <circle class="dg-run" cx="${x + 17}" cy="327" r="3.4" style="--d:${n * 0.25}s"/>
  </g>`;
  const body = `
  <rect x="0" y="${G}" width="480" height="${372 - G}" fill="url(#${p}-soil)"/>
  <rect class="ef-road" x="0" y="${G - 5}" width="480" height="5"/>
  <rect x="${WL}" y="${G}" width="${WR - WL}" height="${FLOOR - G}" fill="url(#${p}-air)"/>
  ${ltPipe(p, 0, WL, 150, 174, { w: 5 })}
  ${ltWater(p, 0, WL - 2, 162, 174)}
  <path class="dg-fall" d="M${WL - 1} 170q8 3 10 24"/>
  <g clip-path="url(#${p}-well)"><g class="dg-water"><rect x="${WL}" y="${lv.start}" width="${WR - WL}" height="${FLOOR - lv.start + 80}" fill="url(#${p}-wg)"/><path class="ef-surf-g" d="M${WL} ${lv.start}H${WR}"/><path class="ef-surf" d="M${WL} ${lv.start}H${WR}"/></g></g>
  <path fill="url(#${p}-cut)" d="M${WL - WW} ${G}H${WL}V145H${WL - WW}ZM${WL - WW} 179H${WL}V${FLOOR}H${WL - WW}ZM${WR} ${G}H${WR + WW}V${FLOOR}H${WR}ZM${WL - WW} ${FLOOR}H${WR + WW}V${FLOOR + WW}H${WL - WW}ZM156 ${G - 10}H340V${G}H156Z"/>
  <path class="ef-edge" d="M${WL - WW} ${G}V145M${WL - WW} 179V${FLOOR + WW}H${WR + WW}V${G}M${WL} ${G}V150M${WL} 174V${FLOOR}H${WR}V${G}M156 ${G - 10}H340M156 ${G}H340"/>
  <rect class="ef-frame" x="170" y="${G - 14}" width="52" height="3.4" rx="1"/>
  <rect class="ef-lid" x="175" y="${G - 15.6}" width="42" height="3.2" rx="1"/>
  ${[1, 2, 3].map((k) => `<path class="ef-step" d="M${WR} ${G + 18 * k}h-6v4h6"/>`).join("")}
  <g class="dg-level alarm"><path d="M${WL} ${lv.overflow}H${WR + 16}M${WL} ${lv.surcharge}H${WR + 16}"/></g>
  <g class="dg-level"><path d="M${WL} ${lv.start}H${WR + 16}M${WL} ${lv.stop}H${WR + 16}"/></g>
  ${label(342, lv.overflow + 4, L.overflow, { cls: "dg-alarm" })}${label(342, lv.surcharge + 4, L.surcharge, { cls: "dg-alarm" })}
  ${label(342, lv.start + 4, L.start, { cls: "dg-b" })}${label(342, lv.stop + 4, L.stop, { cls: "dg-b" })}
  <path class="dg-main" d="M213 318V300H304V118H480M261 318V300"/>
  <path class="dg-main-core" d="M213 318V300H304V118H480M261 318V300"/>
  <path class="dg-main-flow" d="M304 290V118H470"/>
  ${pump(196, 0)}${pump(244, 1)}
  ${label(474, 108, L.main, { a: "end", cls: "dg-m dg-h" })}
  ${beam.draw}
  ${ltRadar(p, radar.cx, radar.y)}
  ${label(12, 108, L.radar, { cls: "dg-b dg-h" })}${leader("M136 104L183 98")}
  ${label(12, 196, L.inlet, { cls: "dg-m dg-h" })}
  ${label(12, 334, L.pumps, { cls: "dg-b dg-h" })}${leader("M138 330L192 334")}
  <path class="ef-cable" d="M74 86V94H190V${radar.y}M213 318V310H184V94"/>
  ${ltCabinet(p, 44, 40, 60, 46)}
  ${ltAntenna(60, 40)}
  ${label(110, 64, L.manager, { cls: "dg-b" })}
  <path class="dg-link" d="M72 24H276"/>
  ${label(474, 28, L.data, { a: "end", cls: "dg-m" })}`;
  const defs = `${efDefs(p)}${ltWaterGrad(p)}${beam.defs}<clipPath id="${p}-well"><rect x="${WL}" y="${G}" width="${WR - WL}" height="${FLOOR - G}"/></clipPath>`;
  return svg(480, 372, body, defs);
}

/* ---- tradewaste: flow, sampling and quality at one discharge point ---- */
function tradewaste(t) {
  const L = t.labels, p = "ltx";
  const G = 118, CROWN = 214, INV = 234, PA = 228, PB = 288; // the pit, inside faces
  const body = `
  <rect x="0" y="${G}" width="480" height="${300 - G}" fill="url(#${p}-soil)"/>
  <rect class="ef-road" x="0" y="${G - 5}" width="480" height="5"/>
  <g class="dg-building">
    <path class="dg-wall" d="M14 ${G}V66h120V${G}z"/>
    <path class="dg-roof" d="M14 66V46l30-14v14l30-14v14l30-14v14l30-14v34z"/>
    <path class="dg-glazing" d="M14 66V46l30-14v34zM74 66V46l30-14v34z"/>
    <rect class="dg-stack" x="118" y="30" width="9" height="36" rx="1"/>
    <path class="dg-wall-line" d="M14 66h120"/>
    <g class="dg-window"><rect x="26" y="80" width="16" height="11" rx="1"/><rect x="54" y="80" width="16" height="11" rx="1"/><rect x="82" y="80" width="16" height="11" rx="1"/><rect x="110" y="80" width="16" height="11" rx="1"/></g>
    <rect class="dg-door" x="56" y="98" width="14" height="20" rx="1"/>
  </g>
  ${label(76, 24, L.site, { a: "middle", cls: "dg-m" })}
  <rect x="100" y="${G}" width="14" height="${CROWN - G}" fill="url(#${p}-air)"/>
  <path fill="url(#${p}-cut)" d="M96 ${G}H100V${CROWN}H96ZM114 ${G}H118V${CROWN - 4}H114Z"/>
  <path class="ef-edge" d="M96 ${G}V${CROWN}M100 ${G}V${CROWN}M114 ${G}V${CROWN - 4}M118 ${G}V${CROWN - 4}"/>
  ${ltPipe(p, 96, 480, CROWN, INV, { gaps: [[96, 118], [PA - LW, PB + LW]], w: 4 })}
  <rect x="${PA}" y="120" width="${PB - PA}" height="${INV - 120}" fill="url(#${p}-air)"/>
  <path fill="url(#${p}-cut)" d="M${PA - LW} 120H${PA}V${CROWN - 4}H${PA - LW}ZM${PB} 120H${PB + LW}V${CROWN - 4}H${PB}Z"/>
  <path class="ef-edge" d="M${PA - LW} 120V${CROWN - 4}M${PA} 120V${CROWN}M${PB} 120V${CROWN}M${PB + LW} 120V${CROWN - 4}"/>
  <rect class="ef-frame" x="${PA - LW - 4}" y="${G - 7}" width="${PB - PA + 2 * LW + 8}" height="3.4" rx="1"/>
  <rect class="ef-lid" x="${PA - 1}" y="${G - 8.6}" width="${PB - PA + 2}" height="3.2" rx="1"/>
  ${ltWater(p, 100, 480, 225, INV)}
  ${label(470, 206, L.sewer, { a: "end", cls: "dg-m dg-h" })}
  ${ltAv(246, INV)}
  <path class="ef-cable" d="M195 118V126H236V228H246"/>
  <path class="ef-cable" d="M236 132H274V206"/>
  <rect class="dg-probe" x="270" y="206" width="8" height="24" rx="3"/>
  <path class="dg-probe-tip" d="M272 230h4"/>
  ${ltCabinet(p, 178, 82, 34, 36)}
  ${ltAntenna(195, 82)}
  ${ltSampler(312, 72)}
  <path class="dg-hose" d="M320 118C318 160 302 192 284 228"/>
  <path class="dg-hose-flow" d="M284 228C302 192 318 160 320 118"/>
  ${label(195, 48, L.data, { a: "middle", cls: "dg-b" })}
  ${label(332, 62, L.sampling, { a: "middle", cls: "dg-b" })}
  ${label(314, 186, L.quality, { cls: "dg-b dg-h" })}${leader("M310 182L281 202")}
  ${label(176, 284, L.flow, { cls: "dg-b dg-h" })}${leader("M208 272L250 238")}`;
  return svg(480, 300, body, `${efDefs(p)}${ltWaterGrad(p)}`);
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
const RAGS = ["q8 5 18 2t20 4", "q10-5 20 0t18-2", "q7 6 16 3t14 5", "q9-4 18 1t16-1"];
// a strand of rag that arrives n-th (1 to 4) and stays where it is drawn
const smRag = (x, y, n, k = n, dx = -170) => `<path class="dg-rag sfm-in n${n}" style="--dx:${dx}px" d="M${x} ${y}${RAGS[k % 4]}"/>`;
const smScene = (p, inner, { shaft = null, water = null } = {}) => {
  const { w, h, crown, inv, surf } = SM;
  return svg(w, h, `
  <rect width="${w}" height="${h}" fill="url(#${p}-soil)"/>
  ${shaft ? `<rect x="${shaft[0]}" y="0" width="${shaft[1] - shaft[0]}" height="${crown}" fill="url(#${p}-air)"/>
  <path fill="url(#${p}-cut)" d="M${shaft[0] - LW} 0H${shaft[0]}V${crown - LW}H${shaft[0] - LW}ZM${shaft[1]} 0H${shaft[1] + LW}V${crown - LW}H${shaft[1]}Z"/>
  <path class="ef-edge" d="M${shaft[0] - LW} 0V${crown - LW}M${shaft[0]} 0V${crown}M${shaft[1]} 0V${crown}M${shaft[1] + LW} 0V${crown - LW}"/>
  ${[14, 32].map((y) => `<path class="ef-step" d="M${shaft[1]} ${y}h-7v4h7"/>`).join("")}` : ""}
  ${ltPipe(p, 0, w, crown, inv, { gaps: shaft ? [[shaft[0] - LW, shaft[1] + LW]] : [] })}
  ${water || ltWater(p, 0, w, surf, inv)}
  ${inner}
  <path class="dg-arrow" d="M276 ${inv - 9}h22m-6-4 6 4-6 4"/>
  <g class="sfm-x"><circle cx="${w - 22}" cy="22" r="12"/><path d="M${w - 27} 17l10 10m0-10l-10 10"/></g>`, `${efDefs(p)}${ltWaterGrad(p)}`);
};
const SF_METHODS = {
  // a probe hung down the manhole on a chain or its own cable: it swings in
  // the flow, and rag collects on the probe and the chain
  chain: (p) => smScene(p, `
  <g class="sfm-swing" style="transform-origin:160px 0">
    <path class="dg-chain" d="M160 0V108"/>
    <rect class="dg-probe" x="151" y="106" width="18" height="24" rx="4"/><path class="dg-probe-tip" d="M156 131h8"/>
    ${smRag(154, SM.surf + 2, 1)}${smRag(150, 110, 2)}${smRag(153, 119, 3)}${smRag(151, 127, 4)}
  </g>`, { shaft: [128, 192] }),
  // a probe strapped to a ring in the pipe, as a flow sensor is: the probe,
  // its carrier and its cable all sit in the flow
  ring: (p) => smScene(p, `
  <path class="dg-band-ring" d="M156 ${SM.crown + 1.5}h14M144 ${SM.inv - 1.5}h54"/>
  <path class="dg-cable" d="M152 ${SM.inv - 8}C120 ${SM.inv - 3} 84 ${SM.inv - 11} 0 ${SM.inv - 6}"/>
  <rect class="dg-probe" x="150" y="${SM.inv - 16}" width="40" height="14" rx="4"/><path class="dg-probe-tip" d="M190 ${SM.inv - 9}h4"/>
  <path class="dg-clamp" d="M158 ${SM.inv - 18}h6v18h-6zM176 ${SM.inv - 18}h6v18h-6z"/>
  ${smRag(146, SM.inv - 19, 1)}${smRag(156, SM.inv - 25, 2, 3)}${smRag(86, SM.inv - 10, 3, 1, -110)}${smRag(60, SM.inv - 15, 4, 0, -90)}`),
  // a bracket bolted to the manhole wall, reaching down into the flow: it has
  // to be drilled and fixed from inside, and then it catches rag itself
  bracket: (p) => smScene(p, `
  <path class="dg-bracket" d="M128 10h16v118h-5V42h-11z"/>
  <circle class="dg-bolt" cx="133" cy="18" r="1.9"/><circle class="dg-bolt" cx="133" cy="34" r="1.9"/>
  <rect class="dg-probe" x="144" y="112" width="24" height="14" rx="4"/><path class="dg-probe-tip" d="M168 119h4"/>
  <path class="dg-clamp" d="M150 110h6v18h-6z"/>
  ${smRag(137, SM.surf + 2, 1)}${smRag(138, 109, 2)}${smRag(137, 118, 3)}${smRag(146, 108, 4, 1)}`, { shaft: [128, 192] }),
  // a pump lifting a sample up a line to a cabinet: the intake blocks, the
  // flow stops, and there is a pump, a line and a cabinet to look after
  cabinet: (p) => smScene(p, `
  <path class="dg-hose" d="M158 126V40Q158 22 176 22"/>
  <path class="dg-hose-flow sfm-choke" d="M158 126V40Q158 22 176 22"/>
  <rect class="dg-inst" x="174" y="10" width="26" height="25" rx="3"/><path class="dg-inst-print" d="M180 17h13M180 22h9"/><circle class="sfm-led" cx="193" cy="29" r="2"/>
  <path class="dg-hose" d="M200 22h14"/><path class="dg-hose-flow sfm-choke" d="M200 22h14"/>
  <rect class="dg-cell" x="214" y="11" width="34" height="22" rx="3"/><rect class="dg-foul sfm-grow" x="216" y="13" width="30" height="18" rx="2"/><rect class="dg-probe" x="227" y="3" width="8" height="20" rx="2.5"/>
  <path class="dg-intake" d="M153 126h10v6h-10z"/>
  ${lumps([[146, 128, 0, 0, "sfm-in n1"], [156, 133, 1, 0, "sfm-in n2"], [162, 126, 2, 0, "sfm-in n3"]])}
  ${smRag(146, 124, 2, 1)}${smRag(150, 134, 4, 3)}`, { shaft: [128, 262] }),
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
const sfBody = (X, Y) => `<path class="sfd-body" d="${sfWall(X, Y)}"/><path class="sfd-boot" d="${sfBoot(X, Y)}"/><path class="sfd-strip" d="${sfStrip(X, Y)}"/>`;
// a dimension: a line between two points with a slash at each end, and its
// figure beside it
const sfDim = (x1, y1, x2, y2, text, { dx = 0, dy = -6, a = "middle" } = {}) => `
  <path class="sfd-dim" d="M${x1} ${y1}L${x2} ${y2}M${x1 - 4} ${y1 + 4}l8-8M${x2 - 4} ${y2 + 4}l8-8"/>
  <text class="sfd-fig" x="${f1((x1 + x2) / 2 + dx)}" y="${f1((y1 + y2) / 2 + dy)}" text-anchor="${a}">${esc(text)}</text>`;
const sfDot = (x, y) => `<circle class="sfd-dot" cx="${x}" cy="${y}" r="4.2"/>`;
const sfBadge = (n, bx, by, dx, dy) => `<path class="sfd-lead" d="M${bx} ${by}L${dx} ${dy}"/>${sfDot(dx, dy)}<g class="sf-b" style="transform-origin:${bx}px ${by}px"><circle cx="${bx}" cy="${by}" r="13"/><text x="${bx}" y="${by}">${n}</text></g>`;

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
  const defs = `${efDefs(p)}
  <linearGradient id="${p}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c9d93"/><stop offset="1" stop-color="#2a7b74"/></linearGradient>
  <linearGradient id="${p}-cheek" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fcdc2"/><stop offset=".45" stop-color="#49b1a6"/><stop offset="1" stop-color="#2f8a82"/></linearGradient>
  <linearGradient id="${p}-boot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a7173"/><stop offset="1" stop-color="#3b4142"/></linearGradient>
  <linearGradient id="${p}-bore" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dfe7e5"/><stop offset="1" stop-color="#f3f7f6"/></linearGradient>
  <linearGradient id="${p}-sw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78cdc2" stop-opacity=".3"/><stop offset="1" stop-color="#0a6860" stop-opacity=".55"/></linearGradient>`;
  const back = `<defs>${defs}</defs>
  <rect width="${W}" height="${H}" fill="url(#${p}-air)"/>
  <path class="sfd-bench" d="M0 ${f1(BENCH)}H${XS}V${INV}H0Z"/><path class="ef-edge" d="M0 ${f1(BENCH)}H${XS}"/>
  <rect x="${XS}" y="${OBV}" width="${W - XS}" height="${INV - OBV}" fill="url(#${p}-bore)"/>
  <path fill="url(#${p}-cut)" d="M0 ${INV}H${W}V${H}H0ZM${XS} 0H${W}V${OBV}H${XS}Z"/>
  <path class="ef-edge" d="M0 ${INV}H${W}M${XS} 0V${OBV}H${W}"/>
  <path class="ef-step" d="M${XS} 34h-12v6h12"/>
  <path d="${sfWall(X, Y)}" fill="url(#${p}-wall)"/>
  <path d="${sfBoot(X, Y)}" fill="url(#${p}-boot)"/>
  <path d="M${X(124)} ${Y(3)}C${X(124)} ${Y(72)} ${X(138)} ${Y(113)} ${X(170)} ${Y(111)}L${X(345)} ${Y(64)}V${Y(3)}Z" fill="url(#${p}-cheek)"/>
  <path class="sfd-strip" d="${sfStrip(X, Y)}"/>
  <path class="sfd-route" d="${sfRoute(X, Y)}"/>
  <path class="sfd-sensor" d="${sfSensor(X, Y)}"/>
  <path class="sfd-tip" d="${sfSensor(X, Y, { tip: 351, len: 6, dia: 15 })}"/>
  <path class="sfd-edge" d="${sfWall(X, Y)}"/>
  <path class="sfd-floor b" d="M${X(0)} ${Y(0)}V${Y(0.8)}L${X(47)} ${Y(3)}V${Y(0)}Z"/><path class="sfd-floor" d="M${X(47)} ${Y(0)}V${Y(3)}H${X(345)}V${Y(0)}Z"/>
  <path class="sfd-tether" d="M${X(336)} ${Y(175)}C${X(336)} ${Y(205)} ${X(339)} ${Y(225)} ${X(339)} ${Y(250)}"/>
  <path class="sfd-cable" d="M${X(323)} ${Y(175)}C${X(323)} ${Y(200)} ${X(330)} ${Y(218)} ${X(330)} ${Y(250)}"/>`;
  const still = `<path fill="url(#${p}-sw)" d="M${surf.map(([x, y]) => `${x} ${y}`).join("L")}L${[...bed].reverse().map(([x, y]) => `${f1(x)} ${f1(y)}`).join("L")}Z"/><path class="ef-surf" d="M${surf.map(([x, y]) => `${x} ${y}`).join("L")}"/>`;
  const front = `
  <text class="sfd-where" x="16" y="${f1(BENCH + 22)}">Benching</text>
  <text class="sfd-where" x="${W - 16}" y="30" text-anchor="end">Manhole wall</text>
  <text class="sfd-where" x="${W - 16}" y="${OBV + 24}" text-anchor="end">Outlet pipe</text>
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
  <style>${keys(`${p}-mount`, (f) => `translate(${f1(f.x)}px,${f1(f.y)}px) rotate(${f1(-f.a)}deg)`)}${keys(`${p}-rope`, (f) => `translate(${f1(f.hx)}px,${f1(f.hy)}px)`)}</style>
  <rect width="${W}" height="${H}" fill="url(#${p}-air)"/>
  <path class="sfd-bench" d="M0 ${f1(F - 147 * K)}H${WALL}V${F}H0Z"/><path class="ef-edge" d="M0 ${f1(F - 147 * K)}H${WALL}"/>
  <rect x="${WALL}" y="${F - 150 * K}" width="${W - WALL}" height="${150 * K}" fill="url(#${p}-bore)"/>
  <path fill="url(#${p}-cut)" d="M0 ${F}H${W}V${H}H0ZM${WALL} 0H${W}V${F - 150 * K}H${WALL}Z"/>
  <path class="ef-edge" d="M0 ${F}H${W}M${WALL} 0V${F - 150 * K}H${W}"/>
  <path class="ef-step" d="M${WALL} 40h-11v6h11M${WALL} 110h-11v6h11"/>
  ${ltWater(p, 0, W, F - 44, F)}
  <text class="sfd-where" x="${W - 14}" y="26" text-anchor="end">Manhole wall</text>
  <text class="sfd-where" x="${W - 14}" y="${F - 150 * K + 22}" text-anchor="end">Outlet pipe</text>
  <text class="sfd-where" x="14" y="${f1(F - 147 * K - 9)}">Chase</text>
  <g class="sfi-go">
    <g class="sfi-rope" style="animation-name:${p}-rope;transform:translate(${f1(end.hx)}px,${f1(end.hy)}px)"><path class="sfd-rope sfi-taut" d="M0 0V-${H}"/></g>
    <path class="sfd-rope sfi-slack" d="M${f1(end.hx)} ${f1(end.hy)}C${f1(end.hx - 30)} ${f1(end.hy - 60)} ${WALL - 46} 150 ${WALL - 8} 113V0"/>
    <g class="sfi-mount" style="animation-name:${p}-mount;transform:translate(${f1(end.x)}px,${f1(end.y)}px)">${sfBody(X, Y)}</g>
  </g>
  <path class="dg-arrow sfi-push" d="M34 ${F - 22}h64m-9-6 9 6-9 6"/>`;
  return svg(W, H, body, `${efDefs(p)}${ltWaterGrad(p)}<linearGradient id="${p}-bore" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dfe7e5"/><stop offset="1" stop-color="#f3f7f6"/></linearGradient>`);
}

// Where the SF 150 fits: the chase from the side with the three figures to
// measure, and across with its width.
export function sfSite(p = "sfw") {
  const K = 0.9, N = 196, INV = 214;
  const X = (mm) => f1(N + mm * K), Y = (mm) => f1(INV - mm * K);
  const XS = N + 345 * K, OBV = INV - 165 * K, TOP = INV - 137 * K;
  const side = svg(720, 290, `
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
  ${sfDim(f1(XS + 112), INV, f1(XS + 112), f1(OBV), "obvert 165 max", { dx: 9, dy: 4, a: "start" })}`, efDefs(p));
  // across the chase: a U channel in the benching, the mount in it
  const C = 150, R = 73.45, WAT = 54, IR = R - 15, half = Math.sqrt(IR ** 2 - (IR + 15 - WAT) ** 2);
  const end = svg(300, 290, `
  <path fill="url(#${p}e-cut)" d="M18 62L75 84V163A75 75 0 0 0 225 163V84L282 62V268H18Z"/>
  <path class="ef-edge" d="M18 62L75 84V163A75 75 0 0 0 225 163V84L282 62"/>
  <path class="sfd-body" d="M${C - R} 103V${f1(238 - R)}A${R} ${R} 0 0 0 ${C + R} ${f1(238 - R)}V103H${C + IR}V${f1(238 - R)}A${IR} ${IR} 0 0 1 ${C - IR} ${f1(238 - R)}V103Z"/>
  <path class="sfd-water" d="M${f1(C - half)} ${238 - WAT}A${IR} ${IR} 0 0 0 ${f1(C + half)} ${238 - WAT}Z"/>
  <path class="sfd-strip" d="M75 101h17v3H75zM208 101h17v3h-17z"/>
  <path class="sfd-ext" d="M75 78V38M225 78V38"/>
  ${sfDim(75, 46, 225, 46, "147 to 153", { dy: -9 })}`, efDefs(`${p}e`));
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
function scatter(t) {
  const L = t.labels;
  // a fixed scatter, so every build draws the same points
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const X = (v) => 64 + v * 380, Y = (d) => 262 - d * 230;
  const fit = (v) => 0.06 + 0.82 * v ** 1.6;
  const usual = Array.from({ length: 70 }, () => { const v = 0.08 + rnd() * 0.84; return [X(v + (rnd() - 0.5) * 0.03), Y(fit(v) + (rnd() - 0.5) * 0.04)]; });
  const shifted = Array.from({ length: 22 }, () => { const v = 0.12 + rnd() * 0.4; return [X(v + (rnd() - 0.5) * 0.03), Y(0.3 + 0.95 * v ** 1.2 + (rnd() - 0.5) * 0.05)]; });
  const vs = sample(0.06, 0.94, 0.04, (v) => v).map(([v]) => v);
  const band = `${smooth(vs.map((v) => [X(v), Y(fit(v) + 0.045)]))}L${vs.slice().reverse().map((v) => `${f1(X(v))} ${f1(Y(fit(v) - 0.045))}`).join("L")}Z`;
  const body = `
  <path class="dg-grid" d="${[0.25, 0.5, 0.75, 1].map((d) => `M64 ${Y(d)}H444`).join("")}${[0.25, 0.5, 0.75, 1].map((v) => `M${X(v)} 24V262`).join("")}"/>
  <path class="dg-axis" d="M64 24V262H444"/>
  <path class="dg-axis-arrow" d="M64 18l-4 8h8zM450 262l-8-4v8z"/>
  ${label(64, 284, L.velocity, { cls: "dg-m" })}
  ${label(54, 24, L.depth, { a: "end", cls: "dg-m" })}
  <path class="dg-fit-band" d="${band}"/>
  <path class="dg-fit" d="${smooth(vs.map((v) => [X(v), Y(fit(v))]))}"/>
  ${usual.map(([x, y]) => `<circle class="dg-pt" cx="${f1(x)}" cy="${f1(y)}" r="3.2"/>`).join("")}
  ${shifted.map(([x, y]) => `<circle class="dg-pt-g" cx="${f1(x)}" cy="${f1(y)}" r="3.2"/>`).join("")}
  ${shifted.map(([x, y]) => `<circle class="dg-pt shift" cx="${f1(x)}" cy="${f1(y)}" r="3.2"/>`).join("")}
  ${label(258, 238, L.usual, { cls: "dg-m" })}${leader("M292 225L302 166")}
  ${label(84, 52, L.shift, { cls: "dg-b" })}${leader("M120 84L146 136")}`;
  return svg(480, 296, body);
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
export function efDefs(p, { dark = false } = {}) {
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
// The sensor with its upstream end at the crown (x, y), scaled by s, and its
// cable running on along `cable` (a path continuing from the gland).
export function efSensor(p, x, y, s, { cable = "" } = {}) {
  const at = ([u, v, dx, dy]) => [x + u * s, y + v * s, dx, dy];
  const draw = `
  ${cable ? `<path class="ef-cable" d="M${f1(x + 83 * s)} ${f1(y + 9 * s)}${cable}"/>` : ""}
  <g class="ef-sensor" transform="translate(${x} ${y}) scale(${s})">
    <rect x="4" y="-3.4" width="70" height="3.6" rx=".8" fill="url(#${p}-steel)" class="ef-bracket"/>
    <circle class="ef-bolt" cx="10" cy="-1.6" r="1.1"/><circle class="ef-bolt" cx="68" cy="-1.6" r="1.1"/>
    <path d="${EF.body}" fill="url(#${p}-body)" class="ef-body"/>
    <path class="ef-shine" d="M10 1.6H68"/>
    <path d="M27.6 18L47.6 34.2L52 30.6L35.6 18Z" fill="url(#${p}-face)" class="ef-face"/>
    <path class="ef-grille" d="M35 19.4l12.6 10.2M39 19.4l11 8.9"/>
    <path d="M10.2 18A5.8 5.8 0 0 0 21.8 18Z" fill="url(#${p}-dome)" class="ef-dome"/>
    <ellipse class="ef-glint" cx="14" cy="19.5" rx="1.7" ry=".8"/>
    <rect class="ef-label" x="44.6" y="4.2" width="21.4" height="9.8" rx="1.2"/>
    <rect class="ef-mark" x="44.6" y="4.2" width="2.8" height="9.8" rx="1"/>
    <path class="ef-print" d="M49.6 7.4h9.4M49.6 9.7h13.4M49.6 11.8h7"/>
    <path d="M48.2 33.8L51 43.4L53.6 42.4L50.9 32.8Z" fill="url(#${p}-gold)" class="ef-us"/>
    <ellipse cx="59.5" cy="46.3" rx="3.3" ry="1.2" fill="url(#${p}-steel)" class="ef-port"/>
    <rect class="ef-gland" x="77.6" y="4.8" width="6" height="8.4" rx="1.2"/>
    <path class="ef-rib" d="M79.6 4.8v8.4M81.6 4.8v8.4"/>
  </g>`;
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
// Something the sewer carries: a lump of rag, grease and silt.
const LUMPS = ["M0 0q3-6 9-4q6-3 8 3q3 5-3 7q-6 2-10-1q-6-1-4-5z", "M0 0q2-5 7-4q5 0 6 4q1 5-5 5q-7 1-8-5z", "M0 0q4-4 10-2q4 2 2 6q-3 3-8 1q-5-1-4-5z"];
const lumps = (list) => list.map(([x, y, k, d, cls = ""]) => `<path class="dg-solid${cls ? ` ${cls}` : ""}" d="M${x} ${y}${LUMPS[k % 3].slice(4)}" style="--d:${d}s"/>`).join("");
const efPin = (x, y, n, pair) => `<g class="dg-pin ${pair}"><circle cx="${f1(x)}" cy="${f1(y)}" r="9"/><text x="${f1(x)}" y="${f1(y + 4.2)}" text-anchor="middle">${n}</text></g>`;
// What the sensor sees, as a lit status: amber for the radar pair, blue for
// ultrasonic and pressure.
const efStatus = (x, y, text, kind) => `<circle class="dg-led-g ${kind}" cx="${x + 5}" cy="${y - 4}" r="8"/><circle class="dg-led ${kind}" cx="${x + 5}" cy="${y - 4}" r="3.6"/>${label(x + 17, y, text, { cls: "dg-b dg-h" })}`;
const flowMark = (x, y, label) => `<text x="${x}" y="${y}" class="dg-w">${esc(label)}</text><path class="dg-arrow w" d="M${x + 34} ${y - 4}h26m-6-4 6 4-6 4"/>`;

// A sewer in long section with a manhole beside the sensor: road and soil,
// the pipe and shaft walls cut and hatched, a cover and frame, step irons,
// and a logger hung near the top of the shaft. `level` is the water surface
// (in the shaft when `full`). Light or dark, as `p` was defined.
export const LS = { w: 480, h: 250, ground: 18, crown: 104, inv: 226, wall: 10, shaft: [326, 370] };
export function efWater(p, level, full, g = LS) {
  const { w, crown, inv } = g, [s0, s1] = g.shaft;
  const grad = `<linearGradient id="${p}-wg" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(level)}" x2="0" y2="${inv}"><stop offset="0" class="ef-w0"/><stop offset=".18" class="ef-w1"/><stop offset="1" class="ef-w2"/></linearGradient>`;
  const body = full
    ? `<path fill="url(#${p}-wg)" d="M0 ${crown}H${s0}V${f1(level)}H${s1}V${crown}H${w}V${inv}H0Z"/><path class="ef-surf-g" d="M${s0} ${f1(level)}H${s1}"/><path class="ef-surf" d="M${s0} ${f1(level)}H${s1}"/>`
    : `<rect x="0" y="${f1(level)}" width="${w}" height="${f1(inv - level)}" fill="url(#${p}-wg)"/><path class="ef-surf-g" d="M0 ${f1(level)}H${w}"/><path class="ef-surf" d="M0 ${f1(level)}H${w}"/>`;
  return { grad, body };
}
export function efSection(p, water, inner, g = LS) {
  const { w, h, ground, crown, inv, wall } = g, [s0, s1] = g.shaft;
  return `
  <rect x="0" y="${ground}" width="${w}" height="${h - ground}" fill="url(#${p}-soil)"/>
  <rect class="ef-road" x="0" y="${ground - 5}" width="${w}" height="5"/>
  <rect x="0" y="${crown}" width="${w}" height="${inv - crown}" fill="url(#${p}-air)"/>
  <rect x="${s0}" y="${ground}" width="${s1 - s0}" height="${crown - ground}" fill="url(#${p}-air)"/>
  ${water}
  <path fill="url(#${p}-cut)" d="M0 ${crown - wall}H${s0 - wall}V${ground}H${s0}V${crown}H0ZM${s1} ${ground}H${s1 + wall}V${crown - wall}H${w}V${crown}H${s1}ZM0 ${inv}H${w}V${inv + wall}H0Z"/>
  <path class="ef-edge" d="M0 ${crown}H${s0}V${ground}M${s1} ${ground}V${crown}H${w}M0 ${inv}H${w}M0 ${crown - wall}H${s0 - wall}V${ground}M${s1 + wall} ${ground}V${crown - wall}H${w}M0 ${inv + wall}H${w}"/>
  <rect class="ef-frame" x="${s0 - wall - 5}" y="${ground - 8}" width="${s1 - s0 + 2 * wall + 10}" height="4" rx="1"/>
  <rect class="ef-lid" x="${s0 - 1}" y="${ground - 9.5}" width="${s1 - s0 + 2}" height="3.6" rx="1"/>
  ${Array.from({ length: 10 }, (_, k) => ground + 18 + 16 * k).filter((y) => y < crown - 6).map((y) => `<path class="ef-step" d="M${s1} ${y}h-7v5h7"/>`).join("")}
  <path class="ef-strap" d="M${s0} ${ground + 9}h7"/><rect class="ef-logger" x="${s0 + 5}" y="${ground + 6}" width="15" height="28" rx="4"/><rect class="ef-logger-cap" x="${s0 + 5}" y="${ground + 6}" width="15" height="6.5" rx="3"/>
  ${inner}`;
}

/* ---- eflowModes: radar in normal flow, ultrasonic and pressure in surcharge ---- */
const LOGGER_CABLE = `C322 113 339 110 339 96V52`;
function eflowNormal(t) {
  const L = t.labels, p = "efn", level = 170;
  const ef = efSensor(p, 226, LS.crown, 1, { cable: LOGGER_CABLE });
  const bv = efBeam(p, "bv", ef.vel, 12, { toY: level }), bd = efBeam(p, "bd", ef.depth, 7, { toY: level, waves: 3 });
  const pr = efProfile(136, level + 1, LS.inv - 1, 70, { surface: true, dip: true });
  const w = efWater(p, level, false);
  const [f0, f1x] = bv.foot;
  return svg(LS.w, LS.h, efSection(p, w.body, `
  ${pr.draw}
  ${bv.draw}${bd.draw}
  <path class="ef-foot r" d="M${f1(f0)} ${level}H${f1(f1x)}"/>
  ${ef.draw}
  ${efPin(f0 + 2, level - 30, 1, "radar")}${efPin(ef.depth[0] + 14, level - 16, 2, "radar")}
  ${label(f1(f0 - 8), level - 8, L.surface, { a: "end", cls: "dg-h" })}
  ${label(16, level + 24, L.profile, { cls: "dg-w" })}
  ${label(f1(pr.mean + 6), LS.inv - 8, L.mean, { cls: "dg-w dg-b" })}
  ${flowMark(386, LS.inv - 10, L.flow)}
  ${efStatus(16, 50, L.above, "r")}`), `${efDefs(p, { dark: true })}${w.grad}${bv.defs}${bd.defs}`);
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
  ${label(dim + 9, 68, L.head, { cls: "dg-b dg-h" })}`;
  const bits = `<g class="dg-bits">${[[20, 168, 0], [60, 192, -2.4], [8, 212, -4.6], [40, 182, -6.8], [14, 150, -8.4], [70, 130, -3.6]].map(([x, y, d]) => `<circle cx="${x}" cy="${y}" r="2.2" style="--d:${d}s"/>`).join("")}</g>`;
  return svg(LS.w, LS.h, efSection(p, w.body, `
  ${bits}${pr.draw}
  ${bu.draw}${bu2.draw}
  <g class="dg-ping-u">${[0, 1, 2].map((n) => `<path d="M${f1(px - 7)} ${f1(py + 6)}q7 5 14 0" style="--d:${n * 0.5}s"/>`).join("")}</g>
  ${ef.draw}${head}
  ${efPin(ef.us[0] - 46, ef.us[1] + 22, 3, "us")}${efPin(px + 18, py + 13, 4, "us")}
  ${label(16, 206, L.profile, { cls: "dg-w" })}
  ${flowMark(386, LS.inv - 10, L.flow)}
  ${efStatus(16, 50, L.full, "u")}`), `${efDefs(p, { dark: true })}${w.grad}${bu.defs}${bu2.defs}`);
}

/* ---- eflowObvert: a sensor on the invert, against E-Flow 3 at the obvert ---- */
const OB = { w: 480, h: 196, crown: 42, inv: 168, wall: 10, surf: 116 };
function obvertScene(p, inner) {
  const { w, h, crown, inv, wall, surf } = OB;
  const water = efWater(p, surf, false, { ...LS, w, crown, inv });
  return { grad: water.grad, body: `
  <rect width="${w}" height="${h}" fill="url(#${p}-soil)"/>
  <rect x="0" y="${crown}" width="${w}" height="${inv - crown}" fill="url(#${p}-air)"/>
  ${water.body}
  <path fill="url(#${p}-cut)" d="M0 ${crown - wall}H${w}V${crown}H0ZM0 ${inv}H${w}V${inv + wall}H0Z"/>
  <path class="ef-edge" d="M0 ${crown}H${w}M0 ${crown - wall}H${w}M0 ${inv}H${w}M0 ${inv + wall}H${w}"/>
  ${inner}` };
}
function invertPanel(t) {
  const L = t.labels, p = "eoa", { inv, surf } = OB;
  const sc = obvertScene(p, `
  ${lumps([[10, 150, 0, 0], [6, 134, 1, -2.2], [14, 158, 2, -4.4], [4, 142, 0, -6.6]].map(([x, y, k, d]) => [x, y, k, d, "stop"]))}
  <path class="ef-cable" d="M0 ${inv - 3}H236"/>
  <path class="dg-mound" d="M212 ${inv}q4-15 16-19q6-11 19-9q10-8 23-2q14-2 19 11q12 4 12 19z"/>
  <path class="dg-mound-tx" d="M226 ${inv - 12}q10-6 20-3M244 ${inv - 20}q12-4 22 2M262 ${inv - 9}q10-5 22 0"/>
  <path class="dg-rag" d="M298 ${inv - 10}q14 4 24-2t24 2M294 ${inv - 3}q12 2 22-2t22 3"/>
  <path d="M234 ${inv}l9-9q3-3 8-3h24q6 0 6 6v6z" fill="url(#${p}-body)"/>
  ${[[150, 0], [340, 1], [420, 2]].map(([x, k]) => `<ellipse class="dg-grease" cx="${x}" cy="${surf + 1}" rx="${7 + k * 2}" ry="2.2"/>`).join("")}
  ${label(16, 70, L.invert, { cls: "dg-b dg-h" })}${leader(`M118 74L234 ${inv - 14}`)}
  ${label(300, 70, L.fouled, { cls: "dg-h dg-m" })}${leader(`M318 92L286 ${inv - 20}`)}
  ${flowMark(388, inv - 8, L.flow)}`);
  return svg(OB.w, OB.h, sc.body, `${efDefs(p, { dark: true })}${sc.grad}`);
}
function obvertPanel(t) {
  const L = t.labels, p = "eob", { crown, inv, surf } = OB;
  const ef = efSensor(p, 200, crown, 1.05, { cable: "H480" });
  const bv = efBeam(p, "bv", ef.vel, 12, { toY: surf }), bd = efBeam(p, "bd", ef.depth, 7, { toY: surf, waves: 3 });
  const sc = obvertScene(p, `
  ${lumps([[10, 150, 0, 0], [6, 134, 1, -2.2], [14, 158, 2, -4.4], [4, 142, 0, -6.6]].map(([x, y, k, d]) => [x, y, k, d, "pass"]))}
  ${bv.draw}${bd.draw}
  <path class="ef-foot r" d="M${f1(bv.foot[0])} ${surf}H${f1(bv.foot[1])}"/>
  ${ef.draw}
  ${label(16, 70, L.obvert, { cls: "dg-b dg-h" })}${leader("M152 64L198 56")}
  ${label(330, 86, L.clear, { cls: "dg-h dg-m" })}
  ${flowMark(388, inv - 8, L.flow)}`);
  return svg(OB.w, OB.h, sc.body, `${efDefs(p, { dark: true })}${sc.grad}${bv.defs}${bd.defs}`);
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
  <rect width="${g.w}" height="${g.h}" fill="url(#${p}-soil)"/>
  <rect x="0" y="${g.crown}" width="${g.w}" height="${g.inv - g.crown}" fill="url(#${p}-air)"/>
  ${w.body}
  <path fill="url(#${p}-cut)" d="M0 ${g.crown - g.wall}H${g.w}V${g.crown}H0ZM0 ${g.inv}H${g.w}V${g.inv + g.wall}H0Z"/>
  <path class="ef-edge" d="M0 ${g.crown}H${g.w}M0 ${g.crown - g.wall}H${g.w}M0 ${g.inv}H${g.w}M0 ${g.inv + g.wall}H${g.w}"/>
  ${pr.draw}${bv.draw}${bd.draw}
  <path class="ef-foot r" d="M${f1(f0)} ${level}H${f1(f1x)}"/>
  ${ef.draw}
  <path class="ef-ext" d="M${f1(ef.depth[0] + 10)} ${level}H${dim + 6}M${dim - 30} ${g.inv}H${dim + 6}"/>
  <path class="ef-dim d" d="M${dim} ${level + 2}V${g.inv - 2}m-4-6 4 6 4-6M${dim - 4} ${level + 8}l4-6 4 6"/>
  ${label(dim - 8, 236, L.depth, { a: "end", cls: "dg-w dg-b" })}
  ${label(24, 76, L.surface, { cls: "dg-h" })}${leader(`M214 88L${f1(f0 + 6)} ${level - 2}`)}
  ${label(24, 232, L.mean, { cls: "dg-w dg-b" })}${leader(`M180 248L${f1(pr.mean - 2)} 262`, "w")}
  ${flowMark(24, g.inv - 12, L.flow)}`;
  return svg(g.w, g.h, body, `${efDefs(p, { dark: true })}${w.grad}${bv.defs}${bd.defs}`);
}
function profileCross(t) {
  const L = t.labels, p = "epc", cx = 190, cy = 168, R = 126, wall = 11, surf = 152;
  const half = Math.sqrt(R * R - (cy - surf) ** 2), xl = cx - half, xr = cx + half;
  const seg = `M${f1(xl)} ${surf}H${f1(xr)}A${R} ${R} 0 1 1 ${f1(xl)} ${surf}Z`;
  const bands = [["#0d5049", 1.0], ["#126259", 0.82], ["#1b7a70", 0.64], ["#2c9789", 0.47], ["#55bdae", 0.31], ["#a3eee1", 0.16]];
  const iso = bands.map(([c, k]) => `<ellipse cx="${cx}" cy="${surf + 18}" rx="${f1(150 * k)}" ry="${f1(150 * k * 0.86)}" fill="${c}"/>`).join("");
  const lines = bands.slice(1).map(([, k]) => `<ellipse cx="${cx}" cy="${surf + 18}" rx="${f1(150 * k)}" ry="${f1(150 * k * 0.86)}"/>`).join("");
  const beamL = cx - Math.tan((10 * Math.PI) / 180) * (surf - 60), beamR = cx + (cx - beamL);
  const body = `
  <rect width="380" height="330" fill="url(#${p}-soil)"/>
  <path fill="url(#${p}-cut)" fill-rule="evenodd" d="M${cx - R - wall} ${cy}a${R + wall} ${R + wall} 0 1 0 ${2 * (R + wall)} 0a${R + wall} ${R + wall} 0 1 0 -${2 * (R + wall)} 0ZM${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 -${2 * R} 0Z"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${p}-air)"/>
  <clipPath id="${p}-seg"><path d="${seg}"/></clipPath>
  <g clip-path="url(#${p}-seg)">${iso}<g class="dg-isovel">${lines}</g></g>
  <path class="ef-surf-g" d="M${f1(xl)} ${surf}H${f1(xr)}"/><path class="ef-surf" d="M${f1(xl)} ${surf}H${f1(xr)}"/>
  <path class="ef-edge" fill="none" d="M${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 -${2 * R} 0M${cx - R - wall} ${cy}a${R + wall} ${R + wall} 0 1 0 ${2 * (R + wall)} 0a${R + wall} ${R + wall} 0 1 0 -${2 * (R + wall)} 0"/>
  <path class="ef-beam r" fill="url(#${p}-xb)" d="M${cx} 60L${f1(beamL)} ${surf}H${f1(beamR)}Z"/>
  <path class="ef-foot r" d="M${f1(beamL)} ${surf}H${f1(beamR)}"/>
  <rect x="${cx - 13}" y="${cy - R}" width="26" height="18" rx="5" fill="url(#${p}-body)"/>
  <ellipse cx="${cx}" cy="${cy - R + 18}" rx="5" ry="2.4" fill="url(#${p}-dome)"/>
  <path class="ef-ext" d="M${f1(xr - 6)} ${surf}H352M${cx + 30} ${cy + R}H352"/>
  <path class="ef-dim d" d="M346 ${surf + 2}V${cy + R - 2}m-4-6 4 6 4-6M342 ${surf + 8}l4-6 4 6"/>
  ${label(338, 250, "h", { a: "end", cls: "dg-b dg-h dg-i" })}
  ${label(cx, 238, L.area, { a: "middle", cls: "dg-w dg-b" })}
  <rect x="62" y="308" width="110" height="7" rx="3.5" fill="url(#${p}-key)"/>
  ${label(56, 315, L.key[0], { a: "end", cls: "dg-m" })}${label(178, 315, L.key[1], { cls: "dg-m" })}`;
  const defs = `${efDefs(p, { dark: true })}<linearGradient id="${p}-xb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef-g0 r"/><stop offset="1" class="ef-g1 r"/></linearGradient>
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
  const p = "exr", s = 4.6, x0 = 236, crownY = 58, y0 = crownY + 16.6;
  const P = (u, v) => [x0 + u * s, y0 + v * s];
  const sens = { vel: [...P(40, 25.8), -0.77, 0.64], depth: [...P(16, 23.6), 0, 1], us: [...P(50.4, 38.4), -0.8, 0.6] };
  const water = 306;
  const bv = efBeam(p, "bv", sens.vel, 12, { toY: water }), bd = efBeam(p, "bd", sens.depth, 7, { toY: water, waves: 3 });
  const pins = [[1, P(4, -2), [x0 - 12, crownY + 6]], [2, P(68, 30), [x0 + 68 * s + 30, y0 + 30 * s]], [3, P(22, 9), null], [4, P(59.5, 46.6), [x0 + 59.5 * s + 34, 300]], [5, P(50, 38), [x0 + 50 * s - 40, y0 + 38 * s + 14]], [6, P(83.6, 9), [x0 + 83.6 * s + 22, y0 + 9 * s + 30]]];
  const body = `
  <rect x="0" y="${water}" width="900" height="${330 - water}" fill="url(#${p}-wg)"/><path class="ef-surf-g" d="M0 ${water}H900"/><path class="ef-surf" d="M0 ${water}H900"/>
  <path fill="url(#${p}-cut)" d="M0 ${crownY - 22}H900V${crownY}H0Z"/><path class="ef-edge" d="M0 ${crownY}H900M0 ${crownY - 22}H900"/>
  ${bv.draw}${bd.draw}
  <path class="ef-cable xr" d="M${f1(x0 + 83.6 * s)} ${f1(y0 + 9 * s)}C700 ${f1(y0 + 9 * s)} 700 ${crownY + 10} 760 ${crownY + 10}H900"/>
  <rect x="${x0 + 4 * s}" y="${crownY}" width="${70 * s}" height="${16.6}" rx="3" fill="url(#${p}-steel)"/>
  ${[10, 68].map((u) => `<circle class="ef-bolt" cx="${f1(x0 + u * s)}" cy="${crownY + 8}" r="3.4"/>`).join("")}
  <clipPath id="${p}-in"><path transform="translate(${x0} ${y0}) scale(${s})" d="${EF.body}"/></clipPath>
  <g clip-path="url(#${p}-in)">
    <rect x="${x0}" y="${y0}" width="${84 * s}" height="${46 * s}" fill="url(#${p}-glass)"/>
    <rect x="${x0}" y="${y0}" width="${84 * s}" height="${46 * s}" fill="url(#${p}-pot)"/>
    <g class="xr-pcb" transform="translate(${x0} ${y0}) scale(${s})">
      <rect class="xr-chip" x="14" y="5" width="9" height="5.5" rx=".6"/><rect class="xr-chip" x="30" y="4" width="7" height="7" rx=".6"/><rect class="xr-chip" x="56" y="20" width="8" height="9" rx=".6"/>
      <path d="M6 8H14M23 7.6H30M37 7.6H50V20H56M23 9.6H27V15H45M60 29V36M64 24H66M10 12V15H22"/>
    </g>
  </g>
  <g transform="translate(${x0} ${y0}) scale(${s})">
    <path class="xr-edge-g" d="${EF.body}"/><path class="xr-edge" d="${EF.body}"/>
    <path class="xr-radar" d="M27.6 18L47.6 34.2L52 30.6L35.6 18Z"/>
    <path class="xr-radar" d="M10.2 18A5.8 5.8 0 0 0 21.8 18Z"/>
    <path class="xr-us" d="M48.2 33.8L51 43.4L53.6 42.4L50.9 32.8Z"/>
    <ellipse class="xr-us" cx="59.5" cy="46.3" rx="3.3" ry="1.2"/>
    <rect class="xr-gland" x="77.6" y="4.8" width="6" height="8.4" rx="1.2"/>
  </g>
  ${pins.map(([n, [tx, ty], at]) => (at ? `${leader(`M${f1(at[0])} ${f1(at[1])}L${f1(tx)} ${f1(ty)}`)}${efPin(at[0], at[1], n, "xr")}` : efPin(tx, ty, n, "xr"))).join("")}`;
  const defs = `${efDefs(p, { dark: true })}${bv.defs}${bd.defs}
  <linearGradient id="${p}-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd1c4" stop-opacity=".22"/><stop offset="1" stop-color="#7fd1c4" stop-opacity=".06"/></linearGradient>
  <pattern id="${p}-pot" width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".9" fill="#7fd1c4" fill-opacity=".22"/><circle cx="7.5" cy="8" r=".7" fill="#7fd1c4" fill-opacity=".16"/></pattern>
  <linearGradient id="${p}-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef-w0"/><stop offset="1" class="ef-w2"/></linearGradient>`;
  return `<div class="dg-xray">${svg(900, 330, body, defs).replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ')}</div><ol class="dg-facts dg-numbered">${t.items.map(([title, line], i) => `<li><span class="dg-n xr" aria-hidden="true">${i + 1}</span><span><b>${esc(title)}</b> ${esc(line)}</span></li>`).join("")}</ol>`;
}

/* ---- eflowInstall: installed and commissioned from the surface ---- */
// Four small scenes of one manhole, each adding the next part: the sensor
// at the crown, the cable up the shaft, the logger near the top, and the
// phone or tablet at the surface that commissions it through the logger.
const IN = { ground: 44, crown: 134, inv: 188, wall: 8, shaft: [108, 148], surf: 168 };
function installScene(step) {
  const p = `ein${step}`, { ground, crown, inv, wall, surf } = IN, [s0, s1] = IN.shaft;
  const ef = efSensor(p, 40, crown, 0.62);
  const part = (k, html) => (k <= step ? html : "");
  const [hx, hy, hr] = [[70, crown + 16, 44], [112, 100, 34], [s0 + 12, ground + 15, 30], [201, ground - 26, 32]][step - 1];
  const body = `
  <rect x="0" y="${ground}" width="240" height="${200 - ground}" fill="url(#${p}-soil)"/>
  <rect class="ef-road" x="0" y="${ground - 4}" width="240" height="4"/>
  <rect x="0" y="${crown}" width="240" height="${inv - crown}" fill="url(#${p}-air)"/>
  <rect x="${s0}" y="${ground}" width="${s1 - s0}" height="${crown - ground}" fill="url(#${p}-air)"/>
  <rect x="0" y="${surf}" width="240" height="${inv - surf}" fill="url(#${p}-wg)"/><path class="ef-surf" d="M0 ${surf}H240"/>
  <path fill="url(#${p}-cut)" d="M0 ${crown - wall}H${s0 - wall}V${ground}H${s0}V${crown}H0ZM${s1} ${ground}H${s1 + wall}V${crown - wall}H240V${crown}H${s1}ZM0 ${inv}H240V${inv + wall}H0Z"/>
  <path class="ef-edge" d="M0 ${crown}H${s0}V${ground}M${s1} ${ground}V${crown}H240M0 ${inv}H240"/>
  <rect class="ef-frame" x="${s0 - wall - 4}" y="${ground - 7}" width="${s1 - s0 + 2 * wall + 8}" height="3.4" rx="1"/>
  <ellipse class="ef-lid" cx="${s1 + 40}" cy="${ground - 3}" rx="18" ry="3"/>
  <circle cx="${hx}" cy="${hy}" r="${hr}" fill="url(#${p}-halo)"/>
  ${step === 1 ? `<path class="ins-move" d="M${(s0 + s1) / 2} ${ground + 4}V${crown - 14}Q${(s0 + s1) / 2} ${crown} ${s0 - 6} ${crown + 4}H100m6-4-6 4 6 4"/>` : ""}
  ${part(1, ef.draw)}
  ${part(2, `<path class="ef-cable" d="M95.5 139.6H112V70H${s0 + 12}"/>${[86, 102, 118].map((y) => `<path class="ins-clip" d="M109 ${y}h6"/>`).join("")}`)}
  ${part(3, `<path class="ef-strap" d="M${s0} ${ground + 6}h8"/><rect class="ef-logger" x="${s0 + 6}" y="${ground + 4}" width="12" height="22" rx="3"/><rect class="ef-logger-cap" x="${s0 + 6}" y="${ground + 4}" width="12" height="5" rx="2.5"/>${[0, 1, 2].map((n) => `<path class="ins-wave" style="--d:${n * 0.4}s" d="M${s0 + 4 - n * 6} ${ground - 14 - n * 6}q${8 + n * 6} -${6 + n * 4} ${16 + n * 12} 0"/>`).join("")}`)}
  ${part(4, `<path class="ins-link" d="M${s0 + 12} ${ground + 4}C${s0 + 14} ${ground - 18} 190 ${ground - 26} 196 ${ground - 22}"/><rect class="ins-tablet" x="186" y="${ground - 36}" width="30" height="20" rx="3"/><rect class="ins-screen" x="189" y="${ground - 33}" width="24" height="14" rx="1.5"/>`)}`;
  return svg(240, 200, body, `${efDefs(p, { dark: true })}<linearGradient id="${p}-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef-w0"/><stop offset="1" class="ef-w2"/></linearGradient><radialGradient id="${p}-halo"><stop offset="0" stop-color="#9fe7da" stop-opacity=".34"/><stop offset="1" stop-color="#9fe7da" stop-opacity="0"/></radialGradient>`);
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
  solid: `<svg viewBox="0 0 16 10"><path d="M3 6q2-5 6-3q5-2 5 2q1 4-4 4q-6 1-7-3z" class="dg-solid"/></svg>`,
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
// The Hawk on its wall bracket near the top of the shaft, an E-Flow 3 at
// the pipe crown on its RS485 cable, and the 4G link out through the lid.
// Nothing above the road: that is the point of the drawing.
function hawk(t) {
  const L = t.labels, p = "lth";
  const G = 74, S0 = 296, S1 = 344, CROWN = 230, INV = 302, LEVEL = 278, SURCH = 168;
  const ef = efSensor(p, 150, CROWN, 0.86, { cable: `H${S0 + 9}V${G + 74}` });
  const bv = efBeam(p, "bv", ef.vel, 11, { toY: LEVEL }), bd = efBeam(p, "bd", ef.depth, 7, { toY: LEVEL, waves: 3 });
  const hx = S0 + 4, hy = G + 26, hw = 24, hh = 44; // the canister
  const body = `
  <rect x="0" y="${G}" width="480" height="${336 - G}" fill="url(#${p}-soil)"/>
  <rect class="ef-road" x="0" y="${G - 5}" width="480" height="5"/>
  ${ltPipe(p, 0, 480, CROWN, INV, { gaps: [[S0 - LW, S1 + LW]] })}
  ${ltShaft(p, S0, S1, G, CROWN, INV, { steps: "right" })}
  ${ltWater(p, 0, 480, LEVEL, INV)}
  <g class="dg-level alarm"><path d="M${S0 - 30} ${SURCH}H${S1}"/></g>
  ${label(S0 - 36, SURCH - 3, L.surcharge, { a: "end", cls: "dg-alarm dg-h" })}
  ${bd.draw}${bv.draw}
  ${ef.draw}
  <rect class="ef-bracket" x="${S0}" y="${hy - 6}" width="3" height="34" rx="1" fill="url(#${p}-steel)"/>
  <path class="ef-strap" d="M${S0 + 3} ${hy + 1}h5"/>
  <rect x="${hx + 2}" y="${hy}" width="${hw - 4}" height="${hh}" rx="3" fill="url(#${p}-body)" class="ef-body"/>
  <rect x="${hx}" y="${hy - 4}" width="${hw}" height="5" rx="1.4" fill="url(#${p}-body)" class="ef-body"/>
  <path class="ef-shine" d="M${hx + 6} ${hy + 6}V${hy + hh - 6}"/>
  <path class="ef-cable" d="M${hx + 7} ${hy - 4}v-5h10v5"/>
  <rect class="ef-gland" x="${hx + 10.5}" y="${hy - 16}" width="3" height="12" rx="1.2"/>
  <circle class="dg-ping" cx="${hx + 12}" cy="${hy - 18}" r="9"/>
  <path class="dg-link" d="M${hx + 12} ${hy - 26}V${G - 30}"/>
  ${label(hx + 12, G - 40, L.data, { a: "middle", cls: "dg-b" })}
  ${label(S0 - 18, hy + 10, L.hawk, { a: "end", cls: "dg-b dg-h" })}${leader(`M${S0 - 14} ${hy + 6}L${hx + 1} ${hy + 14}`)}
  ${label(S0 - 18, 214, L.cable, { a: "end", cls: "dg-b dg-h" })}${leader(`M${S0 - 14} 210L${S0 + 7} 210`)}
  ${label(24, 214, L.sensor, { cls: "dg-b dg-h" })}${leader("M84 214L166 236")}
  ${label(472, G - 14, L.surface, { a: "end", cls: "dg-m" })}
  ${ltFlow(18, 268, L.flow || "Flow")}`;
  return svg(480, 336, body, `${efDefs(p)}${ltWaterGrad(p)}${bd.defs}${bv.defs}`);
}

/* ---- alarm2: a radar level alarm at the top of a chamber ---- */
// Alarm2 looking down from under the cover, its beam reaching the water, the
// alarm set-points dashed across the chamber and the link out through its
// external antenna.
function alarm2(t) {
  const L = t.labels, p = "lta";
  const G = 74, WL = 204, WR = 348, FLOOR = 318, PIPE = [256, 290], LEVEL = 274;
  const lv = { high: 176, low: 302 };
  const ax = 254, ay = G + 10, aw = 46, ah = 20; // the unit, lens down
  const lens = [ax + aw - 15, ay + ah + 1, 0, 1];
  const beam = efBeam(p, "bm", lens, 9, { toY: LEVEL, waves: 4 });
  const body = `
  <rect x="0" y="${G}" width="480" height="${336 - G}" fill="url(#${p}-soil)"/>
  <rect class="ef-road" x="0" y="${G - 5}" width="480" height="5"/>
  <rect x="${WL}" y="${G}" width="${WR - WL}" height="${FLOOR - G}" fill="url(#${p}-air)"/>
  ${ltPipe(p, 0, WL, PIPE[0], PIPE[1], { w: 5 })}
  ${ltPipe(p, WR, 480, PIPE[0], PIPE[1], { w: 5 })}
  <rect x="${WL}" y="${LEVEL}" width="${WR - WL}" height="${FLOOR - LEVEL}" fill="url(#${p}-wg)"/>
  <rect x="0" y="${LEVEL}" width="480" height="${PIPE[1] - LEVEL}" fill="url(#${p}-wg)"/>
  <path class="ef-surf-g" d="M0 ${LEVEL}H480"/><path class="ef-surf" d="M0 ${LEVEL}H480"/>
  <path class="dg-flow" d="M14 ${PIPE[1] - 7}H${WL - 10}M${WR + 10} ${PIPE[1] - 7}H466"/>
  <path fill="url(#${p}-cut)" d="M${WL - LW} ${G}H${WL}V${PIPE[0] - 5}H${WL - LW}ZM${WL - LW} ${PIPE[1] + 5}H${WL}V${FLOOR}H${WL - LW}ZM${WR} ${G}H${WR + LW}V${PIPE[0] - 5}H${WR}ZM${WR} ${PIPE[1] + 5}H${WR + LW}V${FLOOR}H${WR}ZM${WL - LW} ${FLOOR}H${WR + LW}V${FLOOR + LW}H${WL - LW}ZM${WL - 26} ${G - 8}H${WR + 26}V${G}H${WL - 26}Z"/>
  <path class="ef-edge" d="M${WL - LW} ${G}V${PIPE[0] - 5}M${WL - LW} ${PIPE[1] + 5}V${FLOOR + LW}H${WR + LW}V${PIPE[1] + 5}M${WR + LW} ${PIPE[0] - 5}V${G}M${WL} ${G}V${PIPE[0]}M${WL} ${PIPE[1]}V${FLOOR}H${WR}V${PIPE[1]}M${WR} ${PIPE[0]}V${G}M${WL - 26} ${G - 8}H${WR + 26}M${WL - 26} ${G}H${WR + 26}"/>
  <rect class="ef-frame" x="${WL + 6}" y="${G - 14}" width="${WR - WL - 12}" height="3.4" rx="1"/>
  <rect class="ef-lid" x="${WL + 12}" y="${G - 15.6}" width="${WR - WL - 24}" height="3.2" rx="1"/>
  ${[1, 2, 3, 4].map((k) => `<path class="ef-step" d="M${WR} ${G + 30 + 18 * k}h-6v4h6"/>`).join("")}
  <g class="dg-level alarm"><path d="M${WL} ${lv.high}H${WR + 18}"/></g>
  <g class="dg-level"><path d="M${WL} ${lv.low}H${WR + 18}"/></g>
  ${label(WR + 24, lv.high + 4, L.high, { cls: "dg-alarm" })}
  ${label(WR + 24, lv.low + 4, L.low, { cls: "dg-b dg-h" })}
  ${beam.draw}
  <rect class="ef-bracket" x="${ax - 4}" y="${G}" width="${aw + 8}" height="3" rx="1" fill="url(#${p}-steel)"/>
  <circle class="ef-bolt" cx="${ax}" cy="${G + 1.5}" r="1.1"/><circle class="ef-bolt" cx="${ax + aw}" cy="${G + 1.5}" r="1.1"/>
  <path class="ef-strap" d="M${ax + 4} ${G + 3}V${ay}M${ax + aw - 4} ${G + 3}V${ay}"/>
  <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" rx="3" fill="url(#${p}-body)" class="ef-body"/>
  <path class="ef-shine" d="M${ax + 4} ${ay + 3}H${ax + aw - 4}"/>
  <rect class="ef-label" x="${ax + 5}" y="${ay + 6}" width="18" height="9" rx="1"/>
  <rect class="ef-mark" x="${ax + 5}" y="${ay + 6}" width="2.6" height="9" rx="1"/>
  <path d="M${lens[0] - 9} ${ay + ah}A9 5 0 0 0 ${lens[0] + 9} ${ay + ah}Z" fill="url(#${p}-dome)" class="ef-dome"/>
  <path class="ef-cable" d="M${ax} ${ay + 8}H${ax - 22}V${G + 3}"/>
  <rect class="ef-bracket" x="${ax - 27}" y="${G}" width="10" height="3" rx="1" fill="url(#${p}-steel)"/>
  <rect class="ef-gland" x="${ax - 24}" y="${G + 3}" width="4" height="15" rx="1.6"/>
  <circle class="dg-ping" cx="${ax - 22}" cy="${G + 20}" r="9"/>
  <path class="dg-link" d="M${ax - 22} ${G - 18}V${G - 54}"/>
  ${label(ax - 12, G - 46, L.data, { cls: "dg-b" })}
  ${label(WL - 18, ay + 10, L.unit, { a: "end", cls: "dg-b dg-h" })}${leader(`M${WL - 14} ${ay + 6}L${ax - 2} ${ay + 10}`)}
  ${label(WL - 18, 200, L.radar, { a: "end", cls: "dg-b dg-h" })}${leader(`M${WL - 14} 196L${lens[0] - 4} 196`)}
`;
  return svg(480, 336, body, `${efDefs(p)}${ltWaterGrad(p)}${beam.defs}`);
}

/* ---- two-panel charts: HTML titles and legend, a small SVG each ---- */
// Hydrographs over two days: dry weather flow with a daily pattern, and the
// response to one storm.
const hx = (t) => 8 + t * 284;
const dwf = (t) => 0.45 + 0.17 * Math.sin(2 * Math.PI * (2 * t) - 1.9);
// a storm's response: a gamma curve that rises over `k` and peaks at 1
const pulse = (t, t0, k) => { const u = (t - t0) / k; return u <= 0 ? 0 : u * u * Math.exp(2 * (1 - u)); };
const rainBars = () => [5, 13, 24, 32, 21, 11, 5].map((h, n) => `<rect x="${f1(hx(0.29) + n * 9)}" y="8" width="6" height="${h}" rx="1.5"/>`).join("");
// time along the foot of a chart: small ticks, with their hours
const ticks = (y, list) => `<path class="dg-tick-mark" d="${list.map(([t]) => `M${f1(hx(t))} ${y}v4`).join("")}"/>${list.map(([t, s], i) => `<text class="dg-tick" x="${f1(hx(t))}" y="${y + 15}" text-anchor="${i === 0 ? "start" : i === list.length - 1 ? "end" : "middle"}">${s}</text>`).join("")}`;
function hydro(a, b) {
  const q = (t) => dwf(t) + a * pulse(t, 0.3, 0.06) + b * pulse(t, 0.3, 0.17);
  const y = (v) => 150 - v * 56;
  const ts = sample(0, 1, 0.01, (t) => t);
  const meas = ts.map(([t]) => [hx(t), y(q(t))]), base = ts.map(([t]) => [hx(t), y(dwf(t))]);
  const band = `${smooth(meas)}L${base.slice().reverse().map(([x, yy]) => `${f1(x)} ${f1(yy)}`).join("L")}Z`;
  return svg(300, 172, `
  <path class="dg-grid" d="${[0.5, 1, 1.5].map((v) => `M8 ${f1(y(v))}H292`).join("")}"/>
  <g class="dg-rain">${rainBars()}</g>
  <path class="dg-axis" d="M8 152H292"/>
  ${ticks(152, [[0, "0 h"], [0.5, "24 h"], [1, "48 h"]])}
  <path class="dg-band" d="${band}"/>
  <path class="dg-dwf" d="${smooth(base)}"/>
  <path class="dg-meas-g" d="${smooth(meas)}"/>
  <path class="dg-meas" d="${smooth(meas)}"/>`);
}
// One day of flow, sampled by time or by volume.
function sampling(mode) {
  const q = (t) => 0.32 + 0.12 * Math.sin(2 * Math.PI * t - 1.9) + 0.75 * pulse(t, 0.53, 0.075);
  const y = (v) => 140 - v * 88;
  const ts = sample(0, 1, 0.01, (t) => t);
  const line = ts.map(([t]) => [hx(t), y(q(t))]);
  const n = 12;
  let at;
  if (mode === "time") at = Array.from({ length: n }, (_, i) => (i + 0.5) / n);
  else {
    const cum = [0]; for (let i = 1; i < ts.length; i++) cum.push(cum[i - 1] + q(ts[i][0]) * 0.01);
    const total = cum[cum.length - 1];
    at = Array.from({ length: n }, (_, i) => { const v = ((i + 0.5) / n) * total; const j = cum.findIndex((c) => c >= v); return ts[Math.max(0, j)][0]; });
  }
  return svg(300, 172, `
  <path class="dg-grid" d="${[0.5, 1].map((v) => `M8 ${f1(y(v))}H292`).join("")}"/>
  <path class="dg-area" d="${smooth(line)}L292 144L8 144Z"/>
  <path class="dg-axis" d="M8 144H292"/>
  <g class="dg-guide">${at.map((t) => `<path d="M${f1(hx(t))} 144V${f1(y(q(t)) + 4)}"/>`).join("")}</g>
  <path class="dg-meas-g" d="${smooth(line)}"/>
  <path class="dg-meas" d="${smooth(line)}"/>
  ${at.map((t, i) => `<rect class="dg-sample" x="${f1(hx(t) - 3)}" y="150" width="6" height="10" rx="1.5" style="--d:${i * 0.12}s"/>`).join("")}
  ${ticks(160, [[0, "00:00"], [0.25, "06:00"], [0.5, "12:00"], [0.75, "18:00"], [1, "24:00"]])}`, `<linearGradient id="dg-sa-${mode}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4a6" stop-opacity=".26"/><stop offset="1" stop-color="#5fb4a6" stop-opacity=".02"/></linearGradient>`).replace('class="dg-area"', `class="dg-area" fill="url(#dg-sa-${mode})"`);
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
  scatter: (t) => scatter(t),
  beforeafter: (t) => panels(t, [[t.panels[0][0], t.panels[0][1], hydro(1.05, 0.28)], [t.panels[1][0], t.panels[1][1], hydro(0.26, 0.06)]]),
  sampling: (t) => panels(t, [[t.panels[0][0], t.panels[0][1], sampling("time")], [t.panels[1][0], t.panels[1][1], sampling("flow")]]),
  hawk: (t) => hawk(t),
  alarm2: (t) => alarm2(t),
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
