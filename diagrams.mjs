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
// Soil, shared by the drawings that cut through the ground.
const soil = (id) => `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#f5f2ea"/><circle cx="3" cy="4" r=".9" fill="#ddd5c4"/><circle cx="10" cy="10" r=".7" fill="#e3dccd"/></pattern>`;

/* ---- thermal: a thermistor string finds where groundwater gets in ---- */
function thermal(t) {
  const L = t.labels;
  const beads = Array.from({ length: 15 }, (_, k) => 86 + k * 22);
  const at = 242; // the defective joint
  const temp = (x) => 262 + 32 * Math.exp(-(((x - at) / 30) ** 2));
  const hot = beads.filter((x) => temp(x) - 262 > 5);
  const body = `
  <rect x="0" y="52" width="480" height="172" fill="url(#dg-soil-t)"/>
  <rect x="0" y="104" width="480" height="120" class="dg-ground-water"/>
  <path class="dg-table" d="M0 104H480"/>
  <path class="dg-table-mark" d="M122 96h10l-5 7z"/>
  ${label(138, 99, L.groundwater, { cls: "dg-m" })}
  <path class="dg-surface" d="M0 52H480"/>
  <g class="dg-shaft"><rect x="58" y="52" width="28" height="104"/><rect x="394" y="52" width="28" height="104"/></g>
  <rect x="44" y="140" width="392" height="36" class="dg-pipe-in"/>
  <path class="dg-pipe" d="M44 140H58M86 140H394M422 140H436M44 176H436"/>
  <g class="dg-joint">${[104, 150, 196, 288, 334, 380].map((x) => `<path d="M${x} 136v8M${x} 172v8"/>`).join("")}</g>
  <rect x="44" y="160" width="392" height="16" class="dg-sewage"/>
  <path class="dg-sewage-top" d="M44 160H436"/>
  <path class="dg-flow" d="M100 168H360"/>
  <path class="dg-crack" d="M236 134l5 4-3 3 6 4 4-4M248 133v14"/>
  <g class="dg-seep"><path d="M214 114q14 8 22 20"/><path d="M272 114q-14 8-22 20"/></g>
  <g class="dg-drips">${[0, 1, 2].map((n) => `<ellipse cx="${240 + n * 3}" cy="146" rx="1.6" ry="2.4" style="--d:${n * 0.6}s"/>`).join("")}</g>
  ${label(262, 124, L.defect, { cls: "dg-b" })}${leader("M258 120L247 135")}
  <path class="dg-cable" d="M38 44H64V172H400V156"/>
  ${beads.map((x) => `<circle class="dg-bead${hot.includes(x) ? " hot" : ""}" cx="${x}" cy="172" r="3.3"/>`).join("")}
  ${label(98, 206, L.string, { cls: "dg-b" })}${leader("M108 194L108 178")}
  <rect class="dg-box" x="16" y="30" width="22" height="22" rx="3"/>
  ${label(16, 22, L.logger, { cls: "dg-b" })}
  <rect class="dg-sensor" x="368" y="167" width="18" height="7" rx="2"/>
  <path class="dg-cable" d="M386 171H416V44H442"/>
  <rect class="dg-box" x="442" y="30" width="22" height="22" rx="3"/>
  ${label(464, 22, L.meter, { a: "end", cls: "dg-b" })}
  <g class="dg-guide">${hot.map((x) => `<path d="M${x} 180V${f1(temp(x)) - 5}"/>`).join("")}</g>
  <path class="dg-axis" d="M44 326H436"/>
  <path class="dg-trace" d="${smooth(sample(44, 436, 8, temp))}"/>
  ${beads.map((x) => `<circle class="dg-bead${hot.includes(x) ? " hot" : ""}" cx="${x}" cy="${f1(temp(x))}" r="3.3"/>`).join("")}
  ${label(44, 346, L.chart, { cls: "dg-b" })}
  ${label(292, 290, L.change, { cls: "dg-m" })}${leader("M288 287L256 293")}`;
  return svg(480, 354, body, soil("dg-soil-t"));
}

/* ---- wetwell: a pump station under watch ---- */
function wetwell(t) {
  const L = t.labels;
  const lv = { overflow: 132, surcharge: 174, start: 222, stop: 296 };
  const body = `
  <rect x="0" y="86" width="480" height="294" fill="url(#dg-soil-w)"/>
  <path class="dg-surface" d="M0 86H480"/>
  <rect class="dg-concrete" x="168" y="86" width="160" height="274"/>
  <rect class="dg-pipe-in" x="176" y="86" width="144" height="266"/>
  <rect class="dg-concrete" x="160" y="80" width="176" height="7" rx="1"/>
  <rect class="dg-pipe-in" x="0" y="150" width="176" height="24"/>
  <path class="dg-pipe" d="M0 150H168M0 174H168"/>
  <rect class="dg-sewage" x="0" y="162" width="176" height="12"/>
  <path class="dg-flow" d="M14 168H150"/>
  <path class="dg-fall" d="M176 170q8 2 10 22"/>
  <g clip-path="url(#dg-well)"><g class="dg-water"><rect class="dg-sewage" x="176" y="${lv.start}" width="144" height="140"/><path class="dg-sewage-top" d="M176 ${lv.start}H320"/></g></g>
  <g class="dg-level alarm"><path d="M176 ${lv.overflow}H336M176 ${lv.surcharge}H336"/></g>
  <g class="dg-level"><path d="M176 ${lv.start}H336M176 ${lv.stop}H336"/></g>
  ${label(342, lv.overflow + 4, L.overflow)}${label(342, lv.surcharge + 4, L.surcharge)}
  ${label(342, lv.start + 4, L.start, { cls: "dg-b" })}${label(342, lv.stop + 4, L.stop, { cls: "dg-b" })}
  <path class="dg-main" d="M213 318V300H304V118H480M261 318V300"/>
  <path class="dg-main-flow" d="M304 290V118H470"/>
  ${[196, 244].map((x, n) => `<g class="dg-pump"><rect x="${x}" y="318" width="34" height="32" rx="6"/><rect x="${x + 6}" y="350" width="22" height="2"/><circle class="dg-run" cx="${x + 17}" cy="334" r="4" style="--d:${n * 0.25}s"/></g>`).join("")}
  ${label(474, 106, L.main, { a: "end", cls: "dg-m" })}
  <path class="dg-beam" d="M196 104L178 ${lv.stop - 6}H214Z"/>
  <rect class="dg-radar" x="186" y="88" width="20" height="18" rx="3"/>
  ${label(12, 108, L.radar, { cls: "dg-b" })}${leader("M150 104L184 98")}
  ${label(12, 196, L.inlet, { cls: "dg-m" })}
  ${label(12, 334, L.pumps, { cls: "dg-b" })}${leader("M140 330L194 334")}
  <path class="dg-cable" d="M196 88V84H104V70M213 318V310H182V84"/>
  <rect class="dg-cabinet" x="44" y="40" width="60" height="46" rx="3"/>
  <path class="dg-cabinet-line" d="M74 40V86M50 52h18M50 60h12"/>
  <path class="dg-cable" d="M60 40V24"/><circle class="dg-antenna" cx="60" cy="22" r="3"/>
  <circle class="dg-ping" cx="60" cy="22" r="9"/>
  ${label(110, 64, L.manager, { cls: "dg-b" })}
  <path class="dg-link" d="M72 22H240"/>
  ${label(474, 26, L.data, { a: "end", cls: "dg-m" })}`;
  const defs = `${soil("dg-soil-w")}<clipPath id="dg-well"><rect x="176" y="86" width="144" height="266"/></clipPath>`;
  return svg(480, 372, body, defs);
}

/* ---- tradewaste: flow, sampling and quality at one discharge point ---- */
function tradewaste(t) {
  const L = t.labels;
  const body = `
  <rect x="0" y="118" width="480" height="196" fill="url(#dg-soil-x)"/>
  <path class="dg-surface" d="M0 118H480"/>
  <path class="dg-building" d="M14 118V66l26-18v18l26-18v18l26-18v18l26-18v70z"/>
  <g class="dg-window"><rect x="26" y="80" width="16" height="10" rx="1"/><rect x="54" y="80" width="16" height="10" rx="1"/><rect x="82" y="80" width="16" height="10" rx="1"/><rect x="58" y="100" width="14" height="18" rx="1"/></g>
  ${label(70, 36, L.site, { a: "middle", cls: "dg-m" })}
  <rect class="dg-pipe-in" x="100" y="118" width="14" height="106"/>
  <rect class="dg-pipe-in" x="100" y="214" width="380" height="20"/>
  <path class="dg-pipe" d="M100 118V234M114 118V214H228M288 214H480M100 234H480"/>
  <rect class="dg-concrete" x="222" y="114" width="72" height="6" rx="1"/>
  <rect class="dg-pit" x="228" y="120" width="60" height="114"/>
  <rect class="dg-sewage" x="100" y="225" width="380" height="9"/>
  <path class="dg-sewage-top" d="M100 225H480"/>
  <path class="dg-flow" d="M124 230H470"/>
  ${label(470, 206, L.sewer, { a: "end", cls: "dg-m" })}
  <rect class="dg-sensor" x="238" y="227" width="16" height="6" rx="2"/>
  <path class="dg-cable" d="M238 230H232V100H212"/>
  <path class="dg-cable" d="M272 206V100"/><rect class="dg-probe" x="268" y="206" width="8" height="24" rx="3"/>
  <rect class="dg-cabinet" x="180" y="82" width="32" height="36" rx="3"/>
  <path class="dg-cable" d="M196 82V66"/><circle class="dg-antenna" cx="196" cy="64" r="3"/><circle class="dg-ping" cx="196" cy="64" r="9"/>
  <rect class="dg-sampler" x="312" y="74" width="40" height="44" rx="5"/>
  <rect class="dg-bottle" x="322" y="90" width="20" height="22" rx="3"/>
  <path class="dg-cable" d="M312 84H300V100"/>
  <path class="dg-hose" d="M300 100Q300 160 282 228"/>
  <path class="dg-hose-flow" d="M282 228Q300 160 300 100"/>
  ${label(196, 44, L.data, { a: "middle", cls: "dg-b" })}
  ${label(332, 60, L.sampling, { a: "middle", cls: "dg-b" })}
  ${label(312, 186, L.quality, { cls: "dg-b" })}${leader("M308 182L278 200")}
  ${label(176, 284, L.flow, { cls: "dg-b" })}${leader("M206 272L242 236")}`;
  return svg(480, 300, body, soil("dg-soil-x"));
}

/* ---- scatter: a shift in the depth to velocity relationship ---- */
function scatter(t) {
  const L = t.labels;
  // a fixed scatter, so every build draws the same points
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const X = (v) => 64 + v * 380, Y = (d) => 262 - d * 230;
  const usual = Array.from({ length: 70 }, () => { const v = 0.08 + rnd() * 0.84; return [X(v + (rnd() - 0.5) * 0.03), Y(0.06 + 0.82 * v ** 1.6 + (rnd() - 0.5) * 0.04)]; });
  const shifted = Array.from({ length: 22 }, () => { const v = 0.12 + rnd() * 0.4; return [X(v + (rnd() - 0.5) * 0.03), Y(0.3 + 0.95 * v ** 1.2 + (rnd() - 0.5) * 0.05)]; });
  const body = `
  <path class="dg-grid" d="${[0.25, 0.5, 0.75, 1].map((d) => `M64 ${Y(d)}H444`).join("")}"/>
  <path class="dg-axis" d="M64 24V262H444"/>
  ${label(64, 284, L.velocity, { cls: "dg-m" })}
  ${label(54, 24, L.depth, { a: "end", cls: "dg-m" })}
  <path class="dg-fit" d="${smooth(sample(0.06, 0.94, 0.04, (v) => v).map(([v]) => [X(v), Y(0.06 + 0.82 * v ** 1.6)]))}"/>
  ${usual.map(([x, y]) => `<circle class="dg-pt" cx="${f1(x)}" cy="${f1(y)}" r="3.4"/>`).join("")}
  ${shifted.map(([x, y]) => `<circle class="dg-pt shift" cx="${f1(x)}" cy="${f1(y)}" r="3.4"/>`).join("")}
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
// An equation or symbol set in italic serif, with "_x" written as a subscript.
const sub = (s) => esc(s).replace(/_([0-9a-z]+)/g, '<tspan baseline-shift="sub" font-size="72%">$1</tspan>');
const eqn = (x, y, s, { a = "start", cls = "dg-eqn" } = {}) => `<text class="${cls}" x="${x}" y="${y}"${a !== "start" ? ` text-anchor="${a}"` : ""}>${sub(s)}</text>`;
// A specification tag: frequency, beam and range, set like an instrument label.
const tag = (x, y, lines, { a = "start", cls = "" } = {}) => label(x, y, lines, { a, cls: `dg-tag${cls ? ` ${cls}` : ""}` });
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
    ? `<path fill="url(#${p}-wg)" d="M0 ${crown}H${s0}V${f1(level)}H${s1}V${crown}H${w}V${inv}H0Z"/><path class="ef-surf" d="M${s0} ${f1(level)}H${s1}"/>`
    : `<rect x="0" y="${f1(level)}" width="${w}" height="${f1(inv - level)}" fill="url(#${p}-wg)"/><path class="ef-surf" d="M0 ${f1(level)}H${w}"/><path class="ef-surf-hi" d="M0 ${f1(level + 2.6)}H${w}"/>`;
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
  const pr = efProfile(118, level + 1, LS.inv - 1, 70, { surface: true, dip: true });
  const w = efWater(p, level, false);
  const [f0, f1x] = bv.foot;
  const [vx, vy] = ef.vel, [dx] = ef.depth;
  return svg(LS.w, LS.h, efSection(p, w.body, `
  ${pr.draw}
  ${bv.draw}${bd.draw}
  <path class="ef-foot r" d="M${f1(f0)} ${level}H${f1(f1x)}"/>
  ${ef.draw}
  ${efPin(f0 + 2, level - 30, 1, "radar")}${efPin(ef.depth[0] + 14, level - 16, 2, "radar")}
  ${tag(16, 124, L.vtag, { cls: "r" })}${leader(`M${f1(vx - 112)} 127L${f1(vx - 18)} ${f1(vy + 13)}`)}
  ${tag(316, 149, L.dtag, { cls: "r" })}${leader(`M312 156L${f1(dx + 6)} 156`)}
  ${label(f1(f0 - 8), level - 8, L.surface, { a: "end", cls: "dg-h" })}
  ${label(16, level + 24, L.profile, { cls: "dg-w" })}
  ${label(f1(pr.mean + 6), LS.inv - 8, L.mean, { cls: "dg-w dg-b" })}
  ${flowMark(386, LS.inv - 10, L.flow)}
  ${label(16, 50, L.above, { cls: "dg-b dg-h" })}`), `${efDefs(p)}${w.grad}${bv.defs}${bd.defs}`);
}
function eflowSurcharge(t) {
  const L = t.labels, p = "efs", level = 56;
  const ef = efSensor(p, 226, LS.crown, 1, { cable: LOGGER_CABLE });
  // the dual transducers, one above the other on the nose face, 5° beams
  const [ux, uy, udx, udy] = ef.us;
  const bu = efBeam(p, "bu", [ux - 0.8, uy - 2, udx, udy], 2.5, { len: 132, kind: "u", waves: 5 }), bu2 = efBeam(p, "bu2", [ux + 0.7, uy + 2.4, udx, udy], 2.5, { len: 122, kind: "u", waves: 5 });
  const pr = efProfile(118, LS.crown + 1, LS.inv - 1, 72, { full: true });
  const w = efWater(p, level, true);
  const [px, py] = ef.press, dim = 394;
  const head = `
  <path class="ef-ext" d="M${f1(px + 5)} ${f1(py)}H${dim + 6}M${LS.shaft[1] + 12} ${level}H${dim + 6}"/>
  <path class="ef-dim" d="M${dim} ${f1(py - 2)}V${level + 2}m-4 6 4-6 4 6M${dim - 4} ${f1(py - 8)}l4 6 4-6"/>
  ${label(dim + 9, f1((py + level) / 2 - 6), L.head, { cls: "dg-b dg-h" })}`;
  const bits = `<g class="dg-bits">${[[20, 168, 0], [60, 192, -2.4], [8, 212, -4.6], [40, 182, -6.8], [14, 150, -8.4], [70, 130, -3.6]].map(([x, y, d]) => `<circle cx="${x}" cy="${y}" r="2.2" style="--d:${d}s"/>`).join("")}</g>`;
  return svg(LS.w, LS.h, efSection(p, w.body, `
  ${bits}${pr.draw}
  ${bu.draw}${bu2.draw}
  <g class="dg-ping-u">${[0, 1, 2].map((n) => `<path d="M${f1(px - 7)} ${f1(py + 6)}q7 5 14 0" style="--d:${n * 0.5}s"/>`).join("")}</g>
  ${ef.draw}${head}
  ${efPin(ef.us[0] - 52, ef.us[1] + 30, 3, "us")}${efPin(px + 18, py + 13, 4, "us")}
  ${label(16, 124, L.standby, { cls: "dg-w" })}
  ${label(16, 206, L.profile, { cls: "dg-w" })}
  ${tag(300, 188, L.utag, { cls: "u w" })}${leader(`M296 185L${f1(ux - 56)} ${f1(uy + 42)}`, "w")}
  ${tag(dim + 9, 136, L.ptag, { cls: "u" })}
  ${flowMark(386, LS.inv - 10, L.flow)}
  ${label(16, 50, L.full, { cls: "dg-b dg-h" })}`), `${efDefs(p)}${w.grad}${bu.defs}${bu2.defs}`);
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
  ${flowMark(16, inv - 8, L.flow)}`);
  return svg(OB.w, OB.h, sc.body, `${efDefs(p)}${sc.grad}`);
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
  ${flowMark(16, inv - 8, L.flow)}`);
  return svg(OB.w, OB.h, sc.body, `${efDefs(p)}${sc.grad}${bv.defs}${bd.defs}`);
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
  const [vx, vy] = ef.vel, ang = (a) => { const r = (a * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r); return [vx + 46 * (-0.77 * c - 0.64 * sn), vy + 46 * (-0.77 * sn + 0.64 * c)]; };
  const [a0, a1] = [ang(-12), ang(12)];
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
  ${efPin(f0 - 6, level - 26, 1, "radar")}
  <path class="ef-arc" d="M${f1(a0[0])} ${f1(a0[1])}A46 46 0 0 1 ${f1(a1[0])} ${f1(a1[1])}"/>
  ${tag(f1(a1[0] - 6), f1(a1[1] - 6), L.angle, { a: "end", cls: "r" })}
  ${tag(f1(pr.vs[0] + 7), f1(pr.vs[1] + 4), L.vs, { cls: "r w" })}
  ${tag(f1(pr.vmax[0] + 7), f1(pr.vmax[1] + 4), L.vmax, { cls: "w" })}
  ${tag(f1(pr.mean + 6), g.inv - 10, L.vmean, { cls: "w" })}
  ${label(24, 76, L.surface, { cls: "dg-h" })}${leader(`M${f1(f0 - 14)} ${level - 28}L${f1(f0 - 40)} 92`)}
  ${label(24, 232, L.mean, { cls: "dg-w dg-b" })}${leader(`M180 248L${f1(pr.mean - 2)} 262`, "w")}
  ${flowMark(24, g.inv - 12, L.flow)}`;
  return svg(g.w, g.h, body, `${efDefs(p)}${w.grad}${bv.defs}${bd.defs}`);
}
function profileCross(t) {
  const L = t.labels, p = "epc", cx = 190, cy = 168, R = 126, wall = 11, surf = 152;
  const half = Math.sqrt(R * R - (cy - surf) ** 2), xl = cx - half, xr = cx + half;
  const seg = `M${f1(xl)} ${surf}H${f1(xr)}A${R} ${R} 0 1 1 ${f1(xl)} ${surf}Z`;
  const bands = [["#2f887d", 1.0], ["#3f998d", 0.82], ["#57ab9e", 0.64], ["#79c0b3", 0.47], ["#a6dace", 0.31], ["#d3efe8", 0.16]];
  const iso = bands.map(([c, k]) => `<ellipse cx="${cx}" cy="${surf + 18}" rx="${f1(150 * k)}" ry="${f1(150 * k * 0.86)}" fill="${c}"/>`).join("");
  const lines = bands.slice(1).map(([, k]) => `<ellipse cx="${cx}" cy="${surf + 18}" rx="${f1(150 * k)}" ry="${f1(150 * k * 0.86)}"/>`).join("");
  const beamL = cx - Math.tan((10 * Math.PI) / 180) * (surf - 60), beamR = cx + (cx - beamL);
  const body = `
  <rect width="380" height="330" fill="url(#${p}-soil)"/>
  <path fill="url(#${p}-cut)" fill-rule="evenodd" d="M${cx - R - wall} ${cy}a${R + wall} ${R + wall} 0 1 0 ${2 * (R + wall)} 0a${R + wall} ${R + wall} 0 1 0 -${2 * (R + wall)} 0ZM${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 -${2 * R} 0Z"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${p}-air)"/>
  <clipPath id="${p}-seg"><path d="${seg}"/></clipPath>
  <g clip-path="url(#${p}-seg)">${iso}<g class="dg-isovel">${lines}</g></g>
  <path class="ef-surf" d="M${f1(xl)} ${surf}H${f1(xr)}"/>
  <path class="ef-edge" fill="none" d="M${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 -${2 * R} 0M${cx - R - wall} ${cy}a${R + wall} ${R + wall} 0 1 0 ${2 * (R + wall)} 0a${R + wall} ${R + wall} 0 1 0 -${2 * (R + wall)} 0"/>
  <path class="ef-beam r" fill="url(#${p}-xb)" d="M${cx} 60L${f1(beamL)} ${surf}H${f1(beamR)}Z"/>
  <path class="ef-foot r" d="M${f1(beamL)} ${surf}H${f1(beamR)}"/>
  <rect x="${cx - 13}" y="${cy - R}" width="26" height="18" rx="5" fill="url(#${p}-body)"/>
  <ellipse cx="${cx}" cy="${cy - R + 18}" rx="5" ry="2.4" fill="url(#${p}-dome)"/>
  <path class="ef-ext" d="M${f1(xr - 6)} ${surf}H352M${cx + 30} ${cy + R}H352"/>
  <path class="ef-dim d" d="M346 ${surf + 2}V${cy + R - 2}m-4-6 4 6 4-6M342 ${surf + 8}l4-6 4 6"/>
  ${label(338, 250, "h", { a: "end", cls: "dg-b dg-h dg-i" })}
  ${bands.slice(1).map(([, k], i) => tag(cx, f1(surf + 18 + 150 * k * 0.86 - 3), L.iso[i], { a: "middle", cls: "w s" })).join("")}
  ${label(cx - 70, 214, L.area, { a: "middle", cls: "dg-w dg-b" })}
  <rect x="16" y="306" width="120" height="8" rx="2" fill="url(#${p}-key)"/>
  ${tag(16, 300, L.key)}${tag(16, 326, "0", { cls: "s" })}${tag(136, 326, "1", { a: "end", cls: "s" })}`;
  const defs = `${efDefs(p)}<linearGradient id="${p}-xb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef-g0 r"/><stop offset="1" class="ef-g1 r"/></linearGradient>
  <linearGradient id="${p}-key" x1="0" y1="0" x2="1" y2="0">${bands.map(([c], i) => `<stop offset="${(i / (bands.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join("")}</linearGradient>`;
  return svg(380, 330, body, defs);
}

/* ---- eflowPrinciples: the physics behind each radar reading ---- */
// Three small technical drawings: the Doppler shift that gives surface
// velocity (brochure, "How Doppler velocity works"), the 120 GHz FMCW sweep
// that gives the distance to the surface and so depth, and the two radar
// footprints on the water seen from above (datasheet, radar geometry).
// A wave along a straight run, as a sine offset from the line.
const waveAlong = ([ax, ay], [bx, by], { off = 0, len = 14, amp = 3.6 } = {}) => {
  const L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L, nx = -uy, ny = ux, pts = [];
  for (let d = 0; d <= L; d += 1.4) { const o = off + amp * Math.sin((2 * Math.PI * d) / len); pts.push([ax + ux * d + nx * o, ay + uy * d + ny * o]); }
  return `M${pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join("L")}`;
};
function principleDoppler(t) {
  const L = t.labels.doppler, p = "epd", A = [58, 42], H = [196, 126];
  const peak = (c, w, hgt) => smooth(sample(c - 3.2 * w, c + 3.2 * w, w / 3, (x) => 214 - hgt * Math.exp(-(((x - c) / w) ** 2))));
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const floor = sample(20, 300, 6, () => 0).map(([x]) => `${x === 20 ? "M" : "L"}${x} ${f1(213 - rnd() * 2.4)}`).join("");
  const body = `
  <rect x="96" y="${H[1]}" width="224" height="34" fill="url(#${p}-w)"/>
  <path class="ef-surf" d="M96 ${H[1]}q8-2.4 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0"/>
  <path class="dg-arrow w" d="M226 146h56m-6-4 6 4-6 4"/>${eqn(214, 151, "v", { a: "end", cls: "dg-eqn w" })}
  <rect x="18" y="26" width="42" height="16" rx="4" fill="url(#${p}-body)"/><path class="ef-aperture" d="M44 42h14"/>
  ${tag(18, 18, L.radar, { cls: "r" })}
  <path class="ef-tx" d="${waveAlong(A, H, { off: -9, len: 14, amp: 3 })}"/>
  <path class="ef-rx" d="${waveAlong(H, A, { off: -9, len: 10, amp: 3 })}"/>
  <path class="ef-tx" d="M${f1(H[0] - 22)} ${f1(H[1] - 26)}l7.6 1.4-2.6 7.2"/>
  <path class="ef-rx" d="M${f1(A[0] + 12)} ${f1(A[1] + 22)}l-7.6-1.4 2.6-7.2"/>
  <path class="ef-arc" d="M${H[0] - 26} ${H[1]}A26 26 0 0 1 ${f1(H[0] - 26 * 0.853)} ${f1(H[1] - 26 * 0.521)}"/>${eqn(H[0] - 36, H[1] - 3, "θ", { a: "end" })}
  ${tag(146, 62, L.tx, { cls: "r" })}${tag(112, 116, L.rx, { a: "end", cls: "t" })}
  ${eqn(304, 26, L.eqn, { a: "end" })}
  <rect class="dg-inset" x="12" y="170" width="296" height="54" rx="6"/>
  <path class="dg-axis" d="M20 214H300"/><path class="dg-noise" d="${floor}"/>
  <path class="dg-f0" d="M96 178V214"/>${eqn(96, 225, "f_0", { a: "middle", cls: "dg-eqn s" })}
  <path class="dg-peak" d="${peak(194, 9, 30)}"/>${eqn(194, 225, "f_0 + Δf", { a: "middle", cls: "dg-eqn s r" })}
  <path class="dg-span" d="M100 184H188m-5-3.6 5 3.6-5 3.6M105 180.4 100 184l5 3.6"/>${tag(144, 180, "Δf", { a: "middle", cls: "r" })}
  ${tag(300, 194, L.spectrum, { a: "end", cls: "s" })}`;
  return svg(320, 232, body, `${efDefs(p)}<linearGradient id="${p}-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ef-w0"/><stop offset="1" class="ef-w2"/></linearGradient>`);
}
function principleFmcw(t) {
  const L = t.labels.fmcw, Y0 = 150, Y1 = 46, ramp = (x0, x1) => `M${x0} ${Y0}L${x1} ${Y1}`;
  const tx = `${ramp(44, 164)}${ramp(164, 284)}`, rx = `${ramp(68, 188)}M188 ${Y0}L304 ${f1(Y0 - ((304 - 188) / 120) * (Y0 - Y1))}`;
  const yAt = (x, x0) => Y0 - ((x - x0) / 120) * (Y0 - Y1), bx = 128;
  return svg(320, 232, `
  <path class="dg-grid" d="${[70, 98, 126].map((y) => `M36 ${y}H304`).join("")}"/>
  <path class="dg-axis" d="M36 30V${Y0}H306"/>
  ${eqn(30, 36, "f", { a: "end" })}${tag(304, Y0 + 14, L.time, { a: "end", cls: "s" })}
  <path class="dg-drop" d="M164 ${Y1}V${Y0}M284 ${Y1}V${Y0}"/>
  <path class="ef-chirp tx" d="${tx}"/><path class="ef-chirp rx" d="${rx}"/>
  <path class="dg-span" d="M${bx} ${f1(yAt(bx, 44) + 2)}V${f1(yAt(bx, 68) - 2)}m-3.6-5 3.6 5 3.6-5M${bx - 3.6} ${f1(yAt(bx, 44) + 7)}l3.6-5 3.6 5"/>${eqn(bx - 7, f1((yAt(bx, 44) + yAt(bx, 68)) / 2 + 5), "f_b", { a: "end" })}
  <path class="dg-span" d="M166 ${Y1 - 8}H186m-5-3.6 5 3.6-5 3.6M171 ${Y1 - 11.6}l-5 3.6 5 3.6"/>${eqn(176, Y1 - 14, "τ", { a: "middle" })}
  ${tag(44, 62, L.tx, { cls: "r" })}${tag(104, 142, L.rx, { cls: "t" })}
  ${eqn(36, 190, L.eqn1)}${eqn(36, 214, L.eqn2)}`);
}
function principleFootprint(t) {
  const L = t.labels.foot, p = "epf", top = 34, bot = 196, mid = (top + bot) / 2;
  const inV = (x, y) => ((x - 118) / 54) ** 2 + ((y - mid) / 28) ** 2 <= 1;
  const arrows = [];
  for (let y = top + 12; y < bot - 6; y += 16) for (let x = 18; x < 300; x += 38) {
    const l = 24 * Math.pow(Math.max(0, 1 - ((y - mid) / ((bot - top) / 2)) ** 2), 0.35);
    if (l > 5) arrows.push([inV(x + l / 2, y), `M${x} ${y}h${f1(l)}m-3.6-2.4 3.6 2.4-3.6 2.4`]);
  }
  return svg(320, 232, `
  <rect x="0" y="${top}" width="320" height="${bot - top}" fill="url(#${p}-s)"/>
  <path fill="url(#${p}-cut)" d="M0 ${top - 10}H320V${top}H0ZM0 ${bot}H320V${bot + 10}H0Z"/>
  <path class="ef-edge" d="M0 ${top}H320M0 ${bot}H320M0 ${top - 10}H320M0 ${bot + 10}H320"/>
  <path class="dg-sv" d="${arrows.filter(([k]) => !k).map(([, d]) => d).join("")}"/>
  <ellipse class="ef-fp" cx="118" cy="${mid}" rx="54" ry="28"/>
  <path class="dg-sv r" d="${arrows.filter(([k]) => k).map(([, d]) => d).join("")}"/>
  <ellipse class="ef-fp" cx="214" cy="${mid}" rx="14" ry="10"/>
  <path class="ef-aim" d="M206 ${mid}H174"/>
  <path class="ef-cable" d="M252 ${mid}H320"/>
  <rect x="204" y="${mid - 10}" width="48" height="20" rx="7" fill="url(#${p}-body)"/>
  <rect class="ef-label" x="228" y="${mid - 5}" width="16" height="10" rx="1.5"/><circle cx="214" cy="${mid}" r="4.6" fill="url(#${p}-dome)"/>
  ${tag(118, top + 22, L.vfoot, { a: "middle", cls: "r" })}
  ${tag(214, bot - 30, L.dfoot, { a: "middle", cls: "r" })}
  ${tag(4, bot + 26, L.up, { cls: "s" })}
  <path class="dg-arrow" d="M262 ${bot + 22}h40m-6-4 6 4-6 4"/>${tag(256, bot + 26, L.flow, { a: "end", cls: "s" })}`,
  `${efDefs(p)}<linearGradient id="${p}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9dcd1"/><stop offset=".5" stop-color="#c9ece4"/><stop offset="1" stop-color="#a9dcd1"/></linearGradient>`);
}

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
  let rec = "";
  if (kind === "radar") rec = `<path class="dg-rec r" d="${line(stormQ, (t) => t < s0 || t > s1)}"/><rect class="dg-gap" x="${f1(CX(s0) + 2)}" y="8" width="${f1(CX(s1) - CX(s0) - 4)}" height="76" rx="4"/><text class="dg-gap-t" x="${f1((CX(s0) + CX(s1)) / 2)}" y="56" text-anchor="middle">${esc(gap)}</text>`;
  else if (kind === "wetted") rec = `<path class="dg-rec w" d="${line((t) => stormQ(t) * (1 - 0.34 * Math.min(1, Math.max(0, (t - 0.08) / 0.92))) + rnd() * 0.035)}"/>`;
  else rec = `<path class="dg-rec r" d="${line(stormQ, (t) => t <= s0 + 0.0026)}"/><path class="dg-rec u" d="${line(stormQ, (t) => t >= s0 && t <= s1 + 0.0026)}"/><path class="dg-rec r" d="${line(stormQ, (t) => t >= s1)}"/>`;
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
const rainBars = () => [5, 13, 24, 32, 21, 11, 5].map((h, n) => `<rect x="${f1(hx(0.29) + n * 9)}" y="8" width="6" height="${h}" rx="1"/>`).join("");
function hydro(a, b) {
  const q = (t) => dwf(t) + a * pulse(t, 0.3, 0.06) + b * pulse(t, 0.3, 0.17);
  const y = (v) => 158 - v * 60;
  const ts = sample(0, 1, 0.01, (t) => t);
  const meas = ts.map(([t]) => [hx(t), y(q(t))]), base = ts.map(([t]) => [hx(t), y(dwf(t))]);
  const band = `${smooth(meas)}L${base.slice().reverse().map(([x, yy]) => `${f1(x)} ${f1(yy)}`).join("L")}Z`;
  return svg(300, 170, `
  <g class="dg-rain">${rainBars()}</g>
  <path class="dg-axis" d="M8 160H292"/>
  <path class="dg-band" d="${band}"/>
  <path class="dg-dwf" d="${smooth(base)}"/>
  <path class="dg-meas" d="${smooth(meas)}"/>`);
}
// One day of flow, sampled by time or by volume.
function sampling(mode) {
  const q = (t) => 0.32 + 0.12 * Math.sin(2 * Math.PI * t - 1.9) + 0.75 * pulse(t, 0.53, 0.075);
  const y = (v) => 146 - v * 92;
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
  <path class="dg-area" d="${smooth(line)}L292 150L8 150Z"/>
  <path class="dg-axis" d="M8 150H292"/>
  <g class="dg-guide">${at.map((t) => `<path d="M${f1(hx(t))} 150V${f1(y(q(t)) + 4)}"/>`).join("")}</g>
  <path class="dg-meas" d="${smooth(line)}"/>
  ${at.map((t, i) => `<rect class="dg-sample" x="${f1(hx(t) - 3)}" y="156" width="6" height="10" rx="1.5" style="--d:${i * 0.12}s"/>`).join("")}`);
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
const PANELS = new Set(["beforeafter", "sampling", "eflowModes", "eflowObvert", "eflowProfile", "eflowCompare", "eflowPrinciples"]);
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
  eflowPrinciples: (t) => efPanels(t, [principleDoppler(t), principleFmcw(t), principleFootprint(t)]),
};

// The figure: the drawing on a white plate, described for screen readers by
// its alt text, with the caption beneath like a photograph's.
export function diagram(id, t, { i } = {}) {
  if (!DRAW[id] || !t) throw new Error(`No illustration named "${id}" (diagrams.mjs and \`diagrams\` in content.mjs)`);
  return `
<figure class="diagram dg-${id}" data-reveal${i != null ? ` style="--i:${i}"` : ""}>
  ${PANELS.has(id) ? `<div class="dg-plate"><p class="sr-only">${esc(t.alt)}</p>${DRAW[id](t)}</div>` : `<div class="dg-plate" role="img" aria-label="${esc(t.alt)}">${DRAW[id](t)}</div>`}
  <figcaption>${esc(t.caption)}</figcaption>
</figure>`;
}
