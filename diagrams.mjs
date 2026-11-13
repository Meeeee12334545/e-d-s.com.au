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
// another, and what else goes wrong follows (a ring of fat, silt in the lee,
// a float grounded at low flow, a blocked intake). Each carries a red cross,
// so the four read as what does not work before a word is read. The words
// are page text under each drawing (build.mjs: problemBand); the motion is
// CSS (site.css: .sfm-*), paused off screen with the other illustrations.
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
  // a pole down the manhole with the sensor at its foot: rag where the pole
  // pierces the surface and on the sensor, fat in a ring at the waterline
  pole: (p) => smScene(p, `
  <rect class="dg-pole" x="157" y="0" width="6" height="118" rx="1.5"/>
  <path class="dg-inst-base" d="M154 30h12v5h-12zM154 70h12v5h-12z"/>
  <rect class="dg-probe" x="149" y="112" width="22" height="18" rx="4"/><path class="dg-probe-tip" d="M171 124h4"/>
  <ellipse class="dg-grease sfm-grow" cx="146" cy="${SM.surf}" rx="11" ry="2.6"/><ellipse class="dg-grease sfm-grow" cx="175" cy="${SM.surf}" rx="12" ry="2.8"/>
  ${smRag(150, SM.surf + 3, 1)}${smRag(157, SM.surf + 9, 2)}${smRag(164, 116, 3)}${smRag(160, 126, 4)}`, { shaft: [128, 192] }),
  // a sensor strapped to a band on the invert, its cable in the flow: rag on
  // the body, the clamps and the cable, silt settling in its lee
  band: (p) => smScene(p, `
  <path class="dg-band-ring" d="M156 ${SM.crown + 1.5}h14M144 ${SM.inv - 1.5}h54"/>
  <path class="dg-cable" d="M152 ${SM.inv - 8}C120 ${SM.inv - 3} 84 ${SM.inv - 11} 0 ${SM.inv - 6}"/>
  <path class="dg-mound sfm-grow" d="M190 ${SM.inv}q5-11 17-12q13-5 23 4q12 0 15 8z"/>
  <rect class="dg-probe" x="150" y="${SM.inv - 16}" width="40" height="14" rx="4"/><path class="dg-probe-tip" d="M190 ${SM.inv - 9}h4"/>
  <path class="dg-clamp" d="M158 ${SM.inv - 18}h6v18h-6zM176 ${SM.inv - 18}h6v18h-6z"/>
  ${smRag(146, SM.inv - 19, 1)}${smRag(156, SM.inv - 25, 2, 3)}${smRag(86, SM.inv - 10, 3, 1, -110)}${smRag(60, SM.inv - 15, 4, 0, -90)}`),
  // a float on a tether, the sensor beneath it: rag on the tether and the
  // float, and at low flow the float grounds and tips over
  float: (p) => smScene(p, `
  <path class="dg-cable sfm-tether" style="transform-origin:66px ${SM.crown}px" d="M66 ${SM.crown}L166 ${SM.surf - 4}"/>
  <g class="sfm-sink">
    <rect class="dg-probe" x="182" y="${SM.surf + 6}" width="9" height="15" rx="3"/><path class="dg-probe-tip" d="M184 ${SM.surf + 22}h5"/>
    <path class="dg-inst" d="M166 ${SM.surf - 8}h42q5 0 5 5v6q0 5-5 5h-42q-5 0-5-5v-6q0-5 5-5z"/><path class="dg-inst-print" d="M172 ${SM.surf - 3}h22"/>
    ${smRag(150, SM.surf - 1, 1, 0, -150)}${smRag(158, SM.surf + 8, 2, 2, -160)}${smRag(170, SM.surf + 14, 3, 3)}
  </g>`, { water: `<g class="sfm-ebb" style="transform-origin:0 ${SM.inv}px">${ltWater(p, 0, SM.w, SM.surf, SM.inv, { flow: false })}</g><path class="dg-flow" d="M14 ${SM.inv - 6}H${SM.w - 14}"/>` }),
  // a pump lifting a sample up a hose to a flow cell: the intake blocks, the
  // flow stops and the cell fouls
  bypass: (p) => smScene(p, `
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
