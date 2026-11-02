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
const leader = (d) => `<path class="dg-leader" d="${d}"/>`;
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
  <path class="dg-fit" d="${smooth(sample(0.06, 0.94, 0.04, (v) => v).map((v) => [X(v), Y(0.06 + 0.82 * v ** 1.6)]))}"/>
  ${usual.map(([x, y]) => `<circle class="dg-pt" cx="${f1(x)}" cy="${f1(y)}" r="3.4"/>`).join("")}
  ${shifted.map(([x, y]) => `<circle class="dg-pt shift" cx="${f1(x)}" cy="${f1(y)}" r="3.4"/>`).join("")}
  ${label(258, 238, L.usual, { cls: "dg-m" })}${leader("M292 225L302 166")}
  ${label(84, 52, L.shift, { cls: "dg-b" })}${leader("M120 84L146 136")}`;
  return svg(480, 296, body);
}

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
const PANELS = new Set(["beforeafter", "sampling"]);
const DRAW = {
  thermal: (t) => thermal(t),
  wetwell: (t) => wetwell(t),
  tradewaste: (t) => tradewaste(t),
  scatter: (t) => scatter(t),
  beforeafter: (t) => panels(t, [[t.panels[0][0], t.panels[0][1], hydro(1.05, 0.28)], [t.panels[1][0], t.panels[1][1], hydro(0.26, 0.06)]]),
  sampling: (t) => panels(t, [[t.panels[0][0], t.panels[0][1], sampling("time")], [t.panels[1][0], t.panels[1][1], sampling("flow")]]),
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
