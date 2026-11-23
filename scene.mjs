// The cutaway kit: what the drawings are made of, drawn as near to the real
// thing as an inline SVG allows. Cut faces carry photographic materials
// (tools/textures.py writes the tiles: soil, sawn concrete, formed concrete,
// asphalt, bedding gravel); the far walls of a shaft or a pipe are lit as the
// curved surfaces they are; the instruments are drawn from their product
// photographs, with their real housings, labels, glands and fixings. Every
// edge, label and moving part stays vector, so a drawing is sharp at any size
// and its words can still grow on a phone.
//
// Each drawing passes its own id prefix `p` (several sit on one page), then
// calls texDefs(p, k) and matDefs(p) for its <defs>, k being how many drawing
// units a 512 px texture tile spans relative to the default (so a close-up
// can show bigger stones than a street section). Light comes from the upper
// left everywhere. Units are the drawing's own; sizes here assume a manhole
// a few hundred units across, and take a scale where that varies.

const f1 = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/* ---------------------------------------------------------------- materials */
// texture name → file and the tile's size in drawing units at k = 1
const TEX = { soil: ["soil", 150], conc: ["concrete", 92], wall: ["wall", 150], asph: ["asphalt", 56], grav: ["gravel", 52] };
export function texDefs(p, k = 1, only = Object.keys(TEX)) {
  // each drawing starts its tiles somewhere else, so two figures on a page
  // never show the same stones in the same places
  const h = hash(p);
  return only.map((key) => {
    const [file, size] = TEX[key], w = f1(size * k);
    return `<pattern id="${p}-${key}" patternUnits="userSpaceOnUse" width="${w}" height="${w}" patternTransform="translate(${h % 97} ${(h >> 7) % 89})"><image href="@root/assets/img/tex/${file}.webp" width="${w}" height="${w}" preserveAspectRatio="none"/></pattern>`;
  }).join("");
}
const stops = (list) => list.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a < 1 ? ` stop-opacity="${a}"` : ""}/>`).join("");
const lin = (id, x2, y2, list, extra = "") => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"${extra}>${stops(list)}</linearGradient>`;
// Gradients for metals, plastics, water and the shading laid over surfaces.
// "v" variants run across (a vertical bar or cylinder), the rest down.
export function matDefs(p) {
  return [
    // stainless: bright bands either side of a dark reflection
    lin(`${p}-ss`, 0, 1, [[0, "#f6f9fa"], [0.28, "#c9d1d5"], [0.5, "#eef2f4"], [0.72, "#8e999e"], [1, "#c3cacd"]]),
    lin(`${p}-ssv`, 1, 0, [[0, "#9aa5aa"], [0.22, "#eef2f4"], [0.42, "#c2cacd"], [0.7, "#f5f8f9"], [1, "#8b969b"]]),
    // galvanised: duller, a touch warmer
    lin(`${p}-galv`, 0, 1, [[0, "#e2e5e2"], [0.4, "#b7bdb9"], [0.62, "#d3d7d4"], [1, "#868d89"]]),
    lin(`${p}-galvv`, 1, 0, [[0, "#80878a"], [0.3, "#d6dad8"], [0.55, "#aab1ae"], [1, "#6f7673"]]),
    // cast iron, painted black and worn on its edges
    lin(`${p}-ci`, 0, 1, [[0, "#5b6164"], [0.18, "#3a3f42"], [0.7, "#25292b"], [1, "#16191a"]]),
    // black engineering plastic: a soft sheen along the top, falling to the base
    lin(`${p}-blk`, 0, 1, [[0, "#5d666b"], [0.1, "#3c4448"], [0.34, "#2a3034"], [0.78, "#1a1e21"], [1, "#101315"]]),
    lin(`${p}-blkv`, 1, 0, [[0, "#121416"], [0.18, "#2d3337"], [0.36, "#4d565b"], [0.5, "#353c40"], [0.82, "#1b1f22"], [1, "#0d0f10"]]),
    // a glossy dark window and a gloss black dome
    lin(`${p}-glz`, 1, 1, [[0, "#6c777c"], [0.35, "#2e3538"], [0.6, "#1d2225"], [1, "#3e474b"]]),
    `<radialGradient id="${p}-dome" cx=".34" cy=".18" r=".95">${stops([[0, "#c2cbcf"], [0.12, "#59636a"], [0.42, "#1b2023"], [1, "#050607"]])}</radialGradient>`,
    // brass ultrasonic face
    lin(`${p}-brass`, 1, 1, [[0, "#f7e4a8"], [0.4, "#cfa456"], [0.75, "#8d6524"], [1, "#b38a45"]]),
    // label stock, slightly off white
    lin(`${p}-label`, 0, 1, [[0, "#f4f6f6"], [1, "#dfe4e4"]]),
    // shading laid over the inside of a pipe (down) and a shaft (across): the
    // surface turns away at its edges, so it darkens there
    lin(`${p}-in-pipe`, 0, 1, [[0, "#000", 0.62], [0.12, "#000", 0.3], [0.38, "#000", 0.02], [0.62, "#000", 0.06], [0.86, "#000", 0.34], [1, "#000", 0.66]]),
    lin(`${p}-in-shaft`, 1, 0, [[0, "#000", 0.66], [0.1, "#000", 0.34], [0.34, "#000", 0.02], [0.6, "#000", 0.08], [0.88, "#000", 0.38], [1, "#000", 0.68]]),
    // benching: a sloped concrete surface catching the light from above
    lin(`${p}-bench`, 0, 1, [[0, "#fff", 0.1], [1, "#fff", 0.28]]),
    // less light the deeper you look
    lin(`${p}-fall`, 0, 1, [[0, "#000", 0], [0.5, "#000", 0.14], [1, "#000", 0.34]]),
    // a dark ground for anything seen through an opening
    lin(`${p}-void`, 0, 1, [[0, "#1d2325"], [1, "#0e1213"]]),
    // the topsoil darkens the first few units under a surface
    lin(`${p}-humus`, 0, 1, [[0, "#3a2818", 0.42], [1, "#3a2818", 0]]),
    // groundwater: the soil below the table is wetter, so darker and cooler
    lin(`${p}-wet`, 0, 1, [[0, "#1d3a48", 0.1], [0.18, "#1d3a48", 0.26], [1, "#1d3a48", 0.32]]),
    // wastewater: grey green, lighter just under the surface
    lin(`${p}-wtr`, 0, 1, [[0, "#9db4a8"], [0.05, "#7f9a8d"], [0.35, "#5f7c70"], [1, "#344d45"]]),
    lin(`${p}-wtr-a`, 0, 1, [[0, "#9db4a8", 0.9], [0.05, "#7f9a8d", 0.9], [0.35, "#5f7c70", 0.92], [1, "#344d45", 0.95]]),
    // soft contact shadow
    `<radialGradient id="${p}-shd">${stops([[0, "#000", 0.42], [0.55, "#000", 0.16], [1, "#000", 0]])}</radialGradient>`,
  ].join("");
}

/* ---------------------------------------------------------------- ground */
// A street in section: asphalt over a crushed rock base, then soil; the
// first few units of soil darker. x0..x1 across, y the road surface, down to
// `bottom`. `road` false gives a grass verge instead of a road.
export function ground(p, { x0 = 0, x1, y, bottom, asph = 4.5, base = 7, road = true, holes = [] }) {
  const w = x1 - x0;
  // the road layers stop where a shaft's frame comes through them
  const spans = [];
  let x = x0;
  for (const [a, b] of [...holes].sort((m, n) => m[0] - n[0])) { if (a > x) spans.push([x, a]); x = Math.max(x, b); }
  if (x < x1) spans.push([x, x1]);
  const layer = (top, h, fill) => spans.map(([a, b]) => `<rect x="${f1(a)}" y="${f1(top)}" width="${f1(b - a)}" height="${f1(h)}" fill="${fill}"/>`).join("");
  const line = (yy, cls) => `<path class="${cls}" d="${spans.map(([a, b]) => `M${f1(a)} ${f1(yy)}H${f1(b)}`).join("")}"/>`;
  if (!road) {
    return `<rect x="${x0}" y="${y}" width="${w}" height="${f1(bottom - y)}" fill="url(#${p}-soil)"/>
  <rect x="${x0}" y="${y}" width="${w}" height="16" fill="url(#${p}-humus)"/>
  ${line(y, "sc-turf")}`;
  }
  return `<rect x="${x0}" y="${f1(y + asph + base)}" width="${w}" height="${f1(bottom - y - asph - base)}" fill="url(#${p}-soil)"/>
  <rect x="${x0}" y="${f1(y + asph + base)}" width="${w}" height="14" fill="url(#${p}-humus)"/>
  ${layer(y + asph, base, `url(#${p}-grav)`)}${layer(y + asph, base, "rgba(150, 128, 98, .35)")}
  ${layer(y, asph, `url(#${p}-asph)`)}
  ${line(y + asph + base, "sc-layer")}${line(y + asph, "sc-layer")}${line(y + 0.4, "sc-road")}`;
}
// the water table: the soil below it darkened, a dashed line and the ▽ mark
export const waterTable = (p, { x0 = 0, x1, y, bottom, mark }) => `
  <rect x="${x0}" y="${y}" width="${x1 - x0}" height="${f1(bottom - y)}" fill="url(#${p}-wet)"/>
  <path class="sc-table" d="M${x0} ${y}H${x1}"/>
  ${mark != null ? `<path class="sc-table-mark" d="M${mark - 5} ${y - 8}h10l-5 7z"/><path class="sc-table-tick" d="M${mark - 3.5} ${y + 3}h7M${mark - 2} ${y + 6}h4"/>` : ""}`;

/* ---------------------------------------------------------------- pipes */
// A concrete pipe in long section, cut down its centre line: the far half of
// its bore lit as the curved surface it is, the cut walls showing aggregate,
// a spigot and socket joint (with its rubber ring) at each of `joints`, and
// the bedding gravel it lies on. `gaps` leaves the crown open where a shaft
// comes down into it. `stain` draws the tide line of everyday flow.
export function pipeLong(p, { x0, x1, crown, inv, t = 8, joints = [], gaps = [], bed = 9, overlay = 0, stain, open = [], mat = "conc" }) {
  const pvc = mat === "pvc", wallFill = pvc ? `url(#${p}-pvc)` : `url(#${p}-conc)`;
  const w = x1 - x0, D = inv - crown;
  // the runs of top wall left between shafts, and of bore left between
  // chambers (where a chamber draws its own inside)
  const runs = (cuts) => {
    const out = [];
    let x = x0;
    for (const [a, b] of [...cuts].sort((m, n) => m[0] - n[0])) { if (a > x) out.push([x, a]); x = Math.max(x, b); }
    if (x < x1) out.push([x, x1]);
    return out;
  };
  const tops = runs(gaps), bores = runs(open);
  const rect = (list, y, h, fill, extra = "") => list.map(([a, b]) => `<rect x="${f1(a)}" y="${f1(y)}" width="${f1(b - a)}" height="${f1(h)}" fill="${fill}"${extra}/>`).join("");
  const hl = (list, y) => list.map(([a, b]) => `M${f1(a)} ${f1(y)}H${f1(b)}`).join("");
  // a socket: the wall thickens a little over the joint, chamfered both ways
  const sk = Math.max(1, t * 0.24), sl = t * 1.8;
  const collar = (jx, y, dir) => `M${f1(jx - sl - sk)} ${f1(y)}l${f1(sk)} ${f1(dir * sk)}H${f1(jx + sl * 0.5)}l${f1(sk)} ${f1(-dir * sk)}`;
  const joint = (jx) => {
    if (pvc) return "";
    const top = tops.some(([a, b]) => jx > a + sl + sk && jx < b - sl - sk);
    const one = (y, dir) => `<path fill="url(#${p}-conc)" d="${collar(jx, y, dir)}Z"/><path class="sc-cut-edge" d="${collar(jx, y, dir)}"/>
    <path class="sc-joint" d="M${f1(jx)} ${f1(y - dir * t)}V${f1(y - dir * t * 0.45)}H${f1(jx + 1.4)}V${f1(y + dir * sk * 0.8)}"/>
    <rect class="sc-ring" x="${f1(jx + 0.15)}" y="${f1(dir > 0 ? y - t * 0.42 : y + t * 0.12)}" width="1.6" height="${f1(t * 0.3)}" rx=".6"/>`;
    return `${top ? one(crown - t, -1) : ""}${one(inv + t, 1)}`;
  };
  const gid = `${p}-inp-${f1(x0)}-${f1(crown)}`;
  return `
  <linearGradient id="${gid}" href="#${p}-in-pipe" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(crown)}" x2="0" y2="${f1(inv)}"/>
  ${bed ? `<rect x="${x0}" y="${f1(inv + t)}" width="${w}" height="${bed}" fill="url(#${p}-grav)"/><path class="sc-layer" d="M${x0} ${f1(inv + t + bed)}H${x1}"/>` : ""}
  ${overlay ? rect(tops, crown - t - overlay, overlay, `url(#${p}-grav)`) + rect(tops, crown - t - overlay, overlay, "rgba(201, 180, 143, .45)") : ""}
  ${rect(bores, crown, D, pvc ? "#d6dbd9" : `url(#${p}-wall)`)}${rect(bores, crown, D, `url(#${gid})`)}
  ${stain != null ? rect(bores, stain, inv - stain, "#3f4a2c", ' fill-opacity=".14"') + `<path class="sc-tide" d="${hl(bores, stain)}"/>` : ""}
  <path class="sc-bore-joint" d="${joints.map((jx) => `M${f1(jx)} ${f1(crown)}V${f1(inv)}`).join("")}"/>
  <path class="sc-bore-joint l" d="${joints.map((jx) => `M${f1(jx + 1)} ${f1(crown)}V${f1(inv)}`).join("")}"/>
  ${rect(tops, crown - t, t, wallFill)}
  <rect x="${x0}" y="${inv}" width="${w}" height="${t}" fill="${wallFill}"/>
  ${joints.map(joint).join("")}
  <path class="sc-cut-edge" d="${hl(tops, crown - t)}${hl(tops, crown)}M${x0} ${inv}H${x1}M${x0} ${f1(inv + t)}H${x1}"/>
  <path class="sc-ao" d="${hl(tops.map(([a, b]) => [a, b]).filter(([a, b]) => bores.some(([c, d]) => c < b && d > a)), crown + 0.9)}"/>`;
}

// A manhole chamber on a smaller sewer, cut along the pipe: the pipe comes
// in through one wall and leaves through the other, and between them the
// flow runs in a half round channel formed in the benching. Seen past the
// cut: the channel's far half, the benching sloping up to the far wall, and
// the far wall with its step irons, ring joints and the light falling off
// with depth. Below, the base slab. The shaft above is shaft(); this draws
// from its walls' foot at `crown` down.
export function chamber(p, { a, b, crown, inv, t = 9, base = 12, bench }) {
  const W = b - a, D = inv - crown, spring = crown + D / 2;
  bench = bench ?? crown + D * 0.1; // the benching meets the far wall a little under the crown line
  const gid = `${p}-ch-${f1(a)}`, sid = `${p}-chs-${f1(a)}`;
  return `
  <linearGradient id="${gid}" href="#${p}-in-pipe" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(crown)}" x2="0" y2="${f1(inv)}"/>
  <linearGradient id="${sid}" href="#${p}-in-shaft" gradientUnits="userSpaceOnUse" x1="${a}" y1="0" x2="${b}" y2="0"/>
  <rect x="${a}" y="${f1(crown - 1)}" width="${W}" height="${f1(bench - crown + 1)}" fill="url(#${p}-wall)"/>
  <rect x="${a}" y="${f1(crown - 1)}" width="${W}" height="${f1(bench - crown + 1)}" fill="url(#${sid})"/>
  <rect x="${a}" y="${f1(crown - 1)}" width="${W}" height="${f1(bench - crown + 1)}" fill="#000" fill-opacity=".3"/>
  <path fill="url(#${p}-wall)" d="M${a} ${f1(bench)}H${b}V${f1(spring)}H${a}Z"/>
  <path fill="url(#${p}-bench)" d="M${a} ${f1(bench)}H${b}V${f1(spring)}H${a}Z"/>
  <path fill="url(#${sid})" d="M${a} ${f1(bench)}H${b}V${f1(spring)}H${a}Z" fill-opacity=".55"/>
  <path class="sc-bench-edge" d="M${a} ${f1(spring)}H${b}"/>
  <rect x="${a}" y="${f1(spring)}" width="${W}" height="${f1(inv - spring)}" fill="url(#${p}-wall)"/>
  <rect x="${a}" y="${f1(spring)}" width="${W}" height="${f1(inv - spring)}" fill="url(#${gid})"/>
  <rect x="${f1(a - t)}" y="${inv}" width="${f1(W + 2 * t)}" height="${f1(base + t)}" fill="url(#${p}-conc)"/>
  <path class="sc-cut-edge" d="M${f1(a - t)} ${inv}H${f1(b + t)}M${f1(a - t)} ${f1(inv + t + base)}H${f1(b + t)}"/>`;
}
// The cut walls of a chamber either side, from the foot of its shaft down
// to its base, open where the pipes pass through.
export const chamberWalls = (p, { a, b, top, crown, inv, t = 9, base = 12 }) => `
  <path fill="url(#${p}-conc)" d="M${f1(a - t)} ${f1(top)}H${a}V${f1(crown)}H${f1(a - t)}ZM${b} ${f1(top)}H${f1(b + t)}V${f1(crown)}H${b}Z"/>
  <path fill="url(#${p}-conc)" d="M${f1(a - t)} ${f1(inv)}H${a}V${f1(inv + t + base)}H${f1(a - t)}ZM${b} ${f1(inv)}H${f1(b + t)}V${f1(inv + t + base)}H${b}Z"/>
  <path class="sc-cut-edge" d="M${f1(a - t)} ${f1(top)}V${f1(crown)}M${a} ${f1(top)}V${f1(crown)}M${b} ${f1(top)}V${f1(crown)}M${f1(b + t)} ${f1(top)}V${f1(crown)}M${f1(a - t)} ${f1(inv)}V${f1(inv + t + base)}M${f1(b + t)} ${f1(inv)}V${f1(inv + t + base)}"/>`;

/* ---------------------------------------------------------------- shafts */
// A precast manhole shaft cut through its centre: the far wall lit as the
// inside of a cylinder and darker with depth, ring joints every `ring`
// units, galvanised step irons on the far wall, a cover slab carrying a cast
// iron frame and lid flush with the road at `top`, and the shaft walls cut
// down to `bottom` (the top of the pipe or chamber it serves). `open` is the
// clear opening of the frame, centred on `oc`.
export function shaft(p, { a, b, top, bottom, t = 9, ring = 0, slab = 9, open, oc, steps = [], stepW, frame = 5.5, wallTo, lid = true }) {
  const W = b - a;
  open = open ?? Math.min(W, W * 0.72);
  oc = oc ?? (a + b) / 2;
  const o0 = oc - open / 2, o1 = oc + open / 2;
  const sTop = top + frame; // underside of the frame: top of the slab
  const rings = [];
  if (ring) for (let y = sTop + slab + ring; y < bottom - 4; y += ring) rings.push(y);
  const wallBottom = wallTo ?? bottom;
  stepW = stepW ?? Math.min(26, W * 0.34);
  const shadeId = `${p}-in-shaft-${f1(a)}`, fallId = `${p}-fall-${f1(a)}`;
  return `
  <linearGradient id="${shadeId}" href="#${p}-in-shaft" gradientUnits="userSpaceOnUse" x1="${a}" y1="0" x2="${b}" y2="0"/>
  <linearGradient id="${fallId}" href="#${p}-fall" gradientUnits="userSpaceOnUse" x1="0" y1="${sTop}" x2="0" y2="${bottom}"/>
  <rect x="${f1(o0)}" y="${f1(top + 2)}" width="${f1(open)}" height="${f1(frame + slab)}" fill="url(#${p}-void)"/>
  <rect x="${a}" y="${f1(sTop + slab)}" width="${W}" height="${f1(bottom - sTop - slab)}" fill="url(#${p}-wall)"/>
  <rect x="${a}" y="${f1(sTop + slab)}" width="${W}" height="${f1(bottom - sTop - slab)}" fill="url(#${shadeId})"/>
  <rect x="${a}" y="${f1(sTop + slab)}" width="${W}" height="${f1(bottom - sTop - slab)}" fill="url(#${fallId})"/>
  <path class="sc-bore-joint" d="${rings.map((y) => `M${a} ${f1(y)}H${b}`).join("")}"/>
  <path class="sc-bore-joint l" d="${rings.map((y) => `M${a} ${f1(y + 0.9)}H${b}`).join("")}"/>
  ${steps.map((y) => stepIron(p, oc, y, stepW)).join("")}
  <path fill="url(#${p}-conc)" d="M${f1(a - t)} ${f1(sTop + slab)}H${a}V${f1(wallBottom)}H${f1(a - t)}ZM${b} ${f1(sTop + slab)}H${f1(b + t)}V${f1(wallBottom)}H${b}Z"/>
  ${rings.map((y) => `<path class="sc-joint" d="M${f1(a - t)} ${f1(y)}H${a}M${b} ${f1(y)}H${f1(b + t)}"/><path class="sc-mortar" d="M${f1(a - 0.6)} ${f1(y)}h1.2M${f1(b - 0.6)} ${f1(y)}h1.2"/>`).join("")}
  <path class="sc-cut-edge" d="M${f1(a - t)} ${f1(sTop + slab)}V${f1(wallBottom)}M${a} ${f1(sTop + slab)}V${f1(bottom)}M${b} ${f1(sTop + slab)}V${f1(bottom)}M${f1(b + t)} ${f1(sTop + slab)}V${f1(wallBottom)}"/>
  <path fill="url(#${p}-conc)" d="M${f1(a - t - 6)} ${f1(sTop)}H${f1(o0)}V${f1(sTop + slab)}H${f1(a - t - 6)}ZM${f1(o1)} ${f1(sTop)}H${f1(b + t + 6)}V${f1(sTop + slab)}H${f1(o1)}Z"/>
  <path class="sc-cut-edge" d="M${f1(a - t - 6)} ${f1(sTop)}H${f1(o0)}V${f1(sTop + slab)}H${f1(a - t - 6)}ZM${f1(o1)} ${f1(sTop)}H${f1(b + t + 6)}V${f1(sTop + slab)}H${f1(o1)}Z"/>
  ${coverFrame(p, o0, o1, top, frame, { lid })}`;
}
// A cast iron frame and lid in section, flush with the road: the frame's
// flange bedded on mortar over the slab, its seat, and the lid with the
// raised pattern of its top just showing.
export function coverFrame(p, o0, o1, top, frame = 5.5, { lid: closed = true } = {}) {
  const fl = Math.max(5, frame * 1.3), lid = Math.max(2.2, frame * 0.42);
  const bumps = [];
  for (let x = o0 + 1.5; x < o1 - 2; x += 3.2) bumps.push(`M${f1(x)} ${f1(top - 0.25)}h1.5`);
  return `
  ${closed ? `<rect x="${f1(o0)}" y="${f1(top + lid)}" width="${f1(o1 - o0)}" height="${f1(frame - lid + 0.2)}" fill="url(#${p}-void)"/>` : ""}
  <rect class="sc-mortar-bed" x="${f1(o0 - fl - 0.6)}" y="${f1(top + frame - 1.3)}" width="${f1(o1 - o0 + 2 * fl + 1.2)}" height="1.3"/>
  <path fill="url(#${p}-ci)" d="M${f1(o0 - fl)} ${f1(top + frame - 1.3)}V${f1(top + 1.6)}L${f1(o0 - fl + 1.4)} ${f1(top + 0.3)}H${f1(o0 - 1.4)}V${f1(top + lid + 0.6)}H${f1(o0)}V${f1(top + frame - 1.3)}ZM${f1(o1 + fl)} ${f1(top + frame - 1.3)}V${f1(top + 1.6)}L${f1(o1 + fl - 1.4)} ${f1(top + 0.3)}H${f1(o1 + 1.4)}V${f1(top + lid + 0.6)}H${f1(o1)}V${f1(top + frame - 1.3)}Z"/>
  ${closed ? `<path fill="url(#${p}-ci)" d="M${f1(o0 - 1.2)} ${f1(top)}H${f1(o1 + 1.2)}V${f1(top + lid)}H${f1(o1 - 2.5)}V${f1(top + lid + 1.4)}H${f1(o0 + 2.5)}V${f1(top + lid)}H${f1(o0 - 1.2)}Z"/>
  <path class="sc-edge-dk" d="M${f1(o0 - 1.3)} ${f1(top)}V${f1(top + lid)}M${f1(o1 + 1.3)} ${f1(top)}V${f1(top + lid)}"/>
  <path class="sc-ci-pat" d="${bumps.join("")}"/>` : ""}
  <path class="sc-ci-hi" d="M${f1(o0 - fl + 1.4)} ${f1(top + 0.6)}H${f1(o0 - 1.6)}M${f1(o1 + 1.6)} ${f1(top + 0.6)}H${f1(o1 + fl - 1.4)}${closed ? `M${f1(o0 - 1.2)} ${f1(top + 0.3)}H${f1(o1 + 1.2)}` : ""}"/>`;
}
// A lid lifted off and laid on the road: a cast plate seen edge on, its
// pattern up.
export const lidAside = (p, x0, x1, top) => {
  const bumps = [];
  for (let x = x0 + 1.5; x < x1 - 2; x += 3.2) bumps.push(`M${f1(x)} ${f1(top - 2.6)}h1.5`);
  return `<path fill="url(#${p}-ci)" d="M${f1(x0)} ${f1(top)}V${f1(top - 2.4)}H${f1(x1)}V${f1(top)}Z"/><path class="sc-ci-pat" d="${bumps.join("")}"/><path class="sc-ci-hi" d="M${f1(x0)} ${f1(top - 2.2)}H${f1(x1)}"/>`;
};
// A rugged tablet held up at the surface, its screen showing the logger's
// live reading as a small trace. (x, y): top left; w wide.
export function tablet(p, x, y, w = 30) {
  const h = w * 0.66;
  return `<g class="sc-tablet"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(w * 0.08)}" fill="#1b2023"/>
  <rect x="${f1(x + w * 0.04)}" y="${f1(y + h * 0.06)}" width="${f1(w * 0.92)}" height="${f1(h * 0.88)}" rx="${f1(w * 0.05)}" fill="#e9eef0"/>
  <rect x="${f1(x + w * 0.08)}" y="${f1(y + h * 0.12)}" width="${f1(w * 0.84)}" height="${f1(h * 0.76)}" rx="1" fill="#f7faf9"/>
  <rect x="${f1(x + w * 0.08)}" y="${f1(y + h * 0.12)}" width="${f1(w * 0.84)}" height="${f1(h * 0.14)}" fill="#0d7c72"/>
  <path class="sc-tab-tr" d="M${f1(x + w * 0.12)} ${f1(y + h * 0.7)}C${f1(x + w * 0.3)} ${f1(y + h * 0.66)} ${f1(x + w * 0.38)} ${f1(y + h * 0.42)} ${f1(x + w * 0.52)} ${f1(y + h * 0.48)}S${f1(x + w * 0.76)} ${f1(y + h * 0.62)} ${f1(x + w * 0.88)} ${f1(y + h * 0.5)}"/>
  <path class="sc-glint" d="M${f1(x + w * 0.1)} ${f1(y + h * 0.3)}l${f1(w * 0.14)} ${f1(-h * 0.1)}"/></g>`;
}
// A galvanised step iron on the far wall, seen from the front: the rung,
// its two lugs and the shadow it throws down the wall.
export const stepIron = (p, cx, y, w = 24) => `
  <ellipse cx="${f1(cx + 2)}" cy="${f1(y + 4.5)}" rx="${f1(w * 0.56)}" ry="3.4" fill="url(#${p}-shd)"/>
  <path class="sc-step-leg" d="M${f1(cx - w / 2 + 1.2)} ${f1(y - 1.4)}v3.6M${f1(cx + w / 2 - 1.2)} ${f1(y - 1.4)}v3.6"/>
  <rect x="${f1(cx - w / 2)}" y="${f1(y - 1.4)}" width="${w}" height="2.8" rx="1.4" fill="url(#${p}-galv)"/>
  <path class="sc-step-lug" d="M${f1(cx - w / 2 + 0.8)} ${f1(y - 1.2)}v-2.2M${f1(cx + w / 2 - 0.8)} ${f1(y - 1.2)}v-2.2"/>`;

/* ---------------------------------------------------------------- water */
// Wastewater in a section: its cut face from `level` down to `bottom`, the
// surface catching the light, suspended matter, and the flow shown by faint
// streaks drifting downstream (CSS: .sc-streak). `x0`..`x1` across.
export function water(p, { x0, x1, level, bottom, id = "", streaks = true, alpha = false, cls = "" }) {
  const w = x1 - x0, h = bottom - level;
  const gid = `${p}-wt-${f1(x0)}-${f1(level)}-${f1(bottom)}`;
  const lines = [];
  if (streaks && h > 8) {
    for (let k = 0; k < Math.min(5, Math.floor(h / 7)); k++) {
      const yy = level + 3.5 + ((k + 0.5) * (h - 6)) / Math.min(5, Math.floor(h / 7));
      const dash = [[9, 31], [14, 40], [6, 27], [11, 36], [8, 44]][k];
      lines.push(`<path class="sc-streak" style="--d:${(-k * 0.83).toFixed(2)}s;stroke-dasharray:${dash[0]} ${dash[1]};--len:-${dash[0] + dash[1]}" d="M${f1(x0)} ${f1(yy)}H${f1(x1)}"/>`);
    }
  }
  return `<g class="sc-water${cls ? ` ${cls}` : ""}"${id ? ` id="${id}"` : ""}>
  <linearGradient id="${gid}" href="#${p}-wtr${alpha === true ? "-a" : alpha ? `-${alpha}` : ""}" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(level)}" x2="0" y2="${f1(bottom)}"/>
  <rect x="${f1(x0)}" y="${f1(level)}" width="${f1(w)}" height="${f1(h)}" fill="url(#${gid})"/>
  ${lines.join("")}
  <path class="sc-surf-lo" d="M${f1(x0)} ${f1(level + 1.6)}H${f1(x1)}"/>
  <path class="sc-surf" d="M${f1(x0)} ${f1(level + 0.4)}H${f1(x1)}"/>
  </g>`;
}

/* ---------------------------------------------------------------- instruments */
// E-Flow 3, drawn after its product photograph and datasheet figure: a long
// black composite housing on a stainless bracket at the crown, the depth
// radar's gloss dome under its upstream end, the velocity radar behind the
// sloping window, the brass ultrasonic face on the nose and the pressure port
// under it, the EDS label, and the cable leaving through a gland with its
// ribbed strain relief. Upstream is to the left. Sensor units: 84 long, 46
// deep, (0, 0) at the crown under the upstream end of the bracket. The
// elements are where diagrams.mjs (EF) aims its beams.
export const EF_BODY = "M8 0H70A8 8 0 0 1 78 8V10A8 8 0 0 1 70 18H68V40Q68 46 62 46H55Q52 46 51 43L48 33L30 18H8A8 8 0 0 1 0 10V8A8 8 0 0 1 8 0Z";
export function eflow3(p, { detail = 1 } = {}) {
  const lines = detail > 0.6
    ? `<text class="sc-lbl-t" x="51.4" y="8.4" style='font:700 2.5px "EDS Text", Arial, sans-serif;fill:#17302d;stroke:none'>E-Flow 3</text><text class="sc-lbl-s" x="51.4" y="10.3" style='font:400 1.2px "EDS Text", Arial, sans-serif;fill:#4b5b59;stroke:none'>Dual mode sewer flowmeter</text><path class="sc-lbl-r" d="M51.4 11.9h12.4M51.4 13.1h8.6"/>`
    : `<path class="sc-lbl-r" d="M51.4 7.4h9.4M51.4 9.7h12.4M51.4 11.8h7"/>`;
  return `
  <g class="sc-ef3">
    <rect x="-5" y="-3.6" width="88" height="3.8" rx=".6" fill="url(#${p}-ss)"/>
    <path class="sc-edge-dk" d="M-5 .2H83"/>
    ${[-2.4, 80.4].map((x) => `<path d="M${x - 2} .2h4v1.5l-.7.7h-2.6l-.7-.7z" fill="url(#${p}-ss)"/><path class="sc-edge-dk" d="M${x - 2} .2h4v1.5l-.7.7h-2.6l-.7-.7z"/><path class="sc-edge-dk" d="M${x - 0.7} .3v2.2M${x + 0.7} .3v2.2"/>`).join("")}
    <path d="${EF_BODY}" fill="url(#${p}-blk)"/>
    <path d="M68 18V40Q68 46 62 46H55Q52 46 51 43L48 33L30 18Z" fill="#0d1012" fill-opacity=".35"/>
    <path class="sc-sheen" d="M9 1.1H69.5"/>
    <path class="sc-sheen-w" d="M10 3.2H68"/>
    <path class="sc-part" d="M1.2 9.4H76.8"/>
    <path class="sc-part-l" d="M1.4 10.2H76.6"/>
    <path class="sc-edge-hi" d="M67.3 19V39.6Q67.3 45.2 61.8 45.2"/>
    <path d="M27.6 18L47.6 34.2L52 30.6L35.6 18Z" fill="url(#${p}-glz)"/>
    <path class="sc-glint" d="M33 18.9L46.2 29.6"/>
    <path d="M10.2 18A5.8 5.8 0 0 0 21.8 18Z" fill="url(#${p}-dome)"/>
    <ellipse cx="13.4" cy="19.5" rx="1.8" ry=".75" fill="#fff" fill-opacity=".55"/>
    <path class="sc-edge-dk" d="M9.6 18H22.4"/>
    <path d="M48.2 33.8L51 43.4L53.6 42.4L50.9 32.8Z" fill="url(#${p}-brass)"/>
    <path class="sc-edge-dk" d="M48.2 33.8L51 43.4L53.6 42.4L50.9 32.8Z"/>
    <ellipse cx="59.5" cy="46.2" rx="3.4" ry="1.15" fill="url(#${p}-ss)"/>
    <path class="sc-port" d="M57.4 46.2h.01M59.5 46.2h.01M61.6 46.2h.01"/>
    <rect x="44.6" y="4.2" width="21.4" height="10" rx=".7" fill="url(#${p}-label)"/>
    <path d="M45.9 6.4q.9 -.8 1.8 0t1.8 0M45.9 7.6q.9 -.8 1.8 0t1.8 0" class="sc-lbl-logo"/>
    <text class="sc-lbl-eds" x="45.8" y="10.4" style='font:700 1.55px "EDS Text", Arial, sans-serif;fill:#3d9991;stroke:none'>EDS</text>
    ${lines}
    <path class="sc-edge-dk" d="M44.6 4.2h21.4v10H44.6z"/>
    <rect x="77.6" y="4.4" width="5.6" height="9.2" rx=".8" fill="url(#${p}-blkv)"/>
    <path class="sc-gland-flat" d="M78.4 4.4v9.2M80.4 4.4v9.2M82.4 4.4v9.2"/>
    <path d="M83.2 5.6L90 7.2V10.8L83.2 12.4Z" fill="url(#${p}-blk)"/>
    <path class="sc-gland-rib" d="M84.6 6v6M86 6.3v5.4M87.4 6.6v4.8M88.8 6.9v4.2"/>
  </g>`;
}
// A cable: black sheath with a line of light along it
export const cable = (d, { w = 1.5, cls = "" } = {}) => `<path class="sc-cable${cls ? ` ${cls}` : ""}" style="stroke-width:${w}" d="${d}"/><path class="sc-cable-hi" style="stroke-width:${f1(w * 0.3)}" d="${d}"/>`;

// The EDS Hawk logger, after its photograph: a dark grey cylinder under a
// flanged lid, two connectors and a stubby antenna on top, a carry handle,
// hung on a stainless hook. (x, y) is the top of the lid at its centre; w is
// the body's diameter (the photo's proportions follow from it).
export function hawk(p, x, y, w = 14) {
  const h = w * 1.78, lw = w * 1.14, lh = w * 0.16;
  const L = x - w / 2;
  return `
  <g class="sc-hawk">
    <path class="sc-handle" d="M${f1(x - w * 0.3)} ${f1(y)}V${f1(y - w * 0.32)}H${f1(x + w * 0.3)}V${f1(y)}"/>
    <rect x="${f1(x + w * 0.2)}" y="${f1(y - w * 0.62)}" width="${f1(w * 0.12)}" height="${f1(w * 0.62)}" rx="${f1(w * 0.06)}" fill="#14171a"/>
    <rect x="${f1(x - w * 0.18)}" y="${f1(y - w * 0.11)}" width="${f1(w * 0.1)}" height="${f1(w * 0.11)}" fill="url(#${p}-brass)"/>
    <rect x="${f1(x - w * 0.02)}" y="${f1(y - w * 0.11)}" width="${f1(w * 0.1)}" height="${f1(w * 0.11)}" fill="url(#${p}-brass)"/>
    <rect x="${f1(x - lw / 2)}" y="${f1(y)}" width="${f1(lw)}" height="${f1(lh)}" rx=".5" fill="#22272a"/>
    <rect x="${f1(x - lw / 2)}" y="${f1(y + lh)}" width="${f1(lw)}" height="${f1(lh * 0.7)}" fill="#3a4246"/>
    <path class="sc-sheen" d="M${f1(x - lw / 2 + 0.6)} ${f1(y + 0.4)}H${f1(x + lw / 2 - 0.6)}"/>
    <rect x="${f1(L)}" y="${f1(y + lh * 1.7)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(w * 0.06)}" fill="url(#${p}-blkv)"/>
    <rect x="${f1(x - w * 0.3)}" y="${f1(y + lh * 1.7 + w * 0.12)}" width="${f1(w * 0.6)}" height="${f1(w * 0.16)}" rx=".3" fill="#cfe1dd"/>
    <path class="sc-edge-dk" d="M${f1(L)} ${f1(y + lh * 1.7 + h * 0.97)}H${f1(L + w)}"/>
  </g>`;
}
// An area velocity sensor on the invert, on its stainless mounting band: a
// low wedge facing upstream (left), its transducer window on the slope and
// the cable leaving downstream along the band. (x, y): upstream toe on the
// invert. w: length.
export function avSensor(p, x, y, w = 26) {
  const h = w * 0.2;
  return `
  <rect x="${f1(x - w * 0.25)}" y="${f1(y - 1.2)}" width="${f1(w * 1.5)}" height="1.2" fill="url(#${p}-ss)"/>
  <path d="M${f1(x)} ${f1(y - 1.2)}L${f1(x + w * 0.34)} ${f1(y - h - 1.2)}H${f1(x + w - 2.4)}Q${f1(x + w)} ${f1(y - h - 1.2)} ${f1(x + w)} ${f1(y - h + 1.2)}V${f1(y - 1.2)}Z" fill="url(#${p}-blk)"/>
  <path d="M${f1(x + w * 0.08)} ${f1(y - 1.9)}L${f1(x + w * 0.24)} ${f1(y - h * 0.78)}L${f1(x + w * 0.3)} ${f1(y - h * 0.62)}L${f1(x + w * 0.15)} ${f1(y - 1.5)}Z" fill="url(#${p}-brass)"/>
  <path class="sc-sheen" d="M${f1(x + w * 0.36)} ${f1(y - h - 0.7)}H${f1(x + w - 2.6)}"/>
  <path class="sc-edge-dk" d="M${f1(x + w * 0.62)} ${f1(y - h - 1)}v${f1(h - 0.4)}"/>`;
}
// A LIDoTT radar sensor (Detectronic), from the front: the orange housing
// tapering to its top, label, lower skirt and the blue cable. (x, y): top
// centre; w: width at the base.
export function lidottR(p, x, y, w = 18) {
  const h = w * 1.5;
  return `
  <g class="sc-lidott-r">
    <path d="M${f1(x - w * 0.36)} ${f1(y + h * 0.1)}Q${f1(x - w * 0.34)} ${f1(y)} ${f1(x - w * 0.16)} ${f1(y)}H${f1(x + w * 0.22)}Q${f1(x + w * 0.42)} ${f1(y)} ${f1(x + w * 0.44)} ${f1(y + h * 0.16)}L${f1(x + w * 0.48)} ${f1(y + h * 0.72)}H${f1(x - w * 0.48)}Z" fill="url(#${p}-orange)"/>
    <path d="M${f1(x - w / 2)} ${f1(y + h * 0.72)}H${f1(x + w / 2)}V${f1(y + h)}H${f1(x - w / 2)}Z" fill="url(#${p}-orange2)"/>
    <path class="sc-edge-dk" d="M${f1(x - w / 2)} ${f1(y + h * 0.72)}H${f1(x + w / 2)}"/>
    <rect x="${f1(x - w * 0.27)}" y="${f1(y + h * 0.17)}" width="${f1(w * 0.5)}" height="${f1(h * 0.38)}" rx=".5" fill="url(#${p}-label)"/>
    <path d="M${f1(x - w * 0.22)} ${f1(y + h * 0.22)}h${f1(w * 0.12)}v${f1(h * 0.07)}h${f1(-w * 0.12)}z" fill="#1d4f9c"/>
    <path class="sc-lbl-r" d="M${f1(x - w * 0.22)} ${f1(y + h * 0.36)}h${f1(w * 0.36)}M${f1(x - w * 0.22)} ${f1(y + h * 0.41)}h${f1(w * 0.3)}M${f1(x - w * 0.22)} ${f1(y + h * 0.46)}h${f1(w * 0.34)}"/>
    <path class="sc-sheen" d="M${f1(x - w * 0.3)} ${f1(y + h * 0.12)}L${f1(x - w * 0.38)} ${f1(y + h * 0.66)}"/>
  </g>`;
}
// A BeadedStream D605 temperature logger, from the front: a dark grey
// case with its blue bezel and screen, connectors underneath, on a stainless
// wall bracket. (x, y): top left; w wide.
export function d605(p, x, y, w = 16) {
  const h = w * 1.06;
  return `
  <g class="sc-d605">
    <rect x="${f1(x - 1.5)}" y="${f1(y + h * 0.2)}" width="${f1(w + 3)}" height="${f1(h * 0.16)}" rx=".4" fill="url(#${p}-ss)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${f1(h)}" rx="${f1(w * 0.12)}" fill="url(#${p}-blkv)"/>
    <rect x="${f1(x + w * 0.1)}" y="${f1(y + h * 0.08)}" width="${f1(w * 0.8)}" height="${f1(h * 0.78)}" rx="${f1(w * 0.1)}" fill="#22408f"/>
    <rect x="${f1(x + w * 0.18)}" y="${f1(y + h * 0.15)}" width="${f1(w * 0.64)}" height="${f1(h * 0.6)}" rx="${f1(w * 0.06)}" fill="url(#${p}-glz)"/>
    <path class="sc-glint" d="M${f1(x + w * 0.24)} ${f1(y + h * 0.2)}l${f1(w * 0.2)} 0"/>
    ${[0.22, 0.42, 0.62, 0.82].map((k) => `<rect x="${f1(x + w * k - w * 0.07)}" y="${f1(y + h)}" width="${f1(w * 0.14)}" height="${f1(h * 0.1)}" rx=".3" fill="url(#${p}-ssv)"/>`).join("")}
  </g>`;
}
// A string of digital temperature sensors along a cable (BeadedStream DTC):
// the yellow cable, with a blue moulded sleeve over each sensor. `beads` are
// x positions along a straight run at height y.
export function dtc(p, x0, x1, y, beads, { hot = [] } = {}) {
  return `
  <path class="sc-dtc" d="M${f1(x0)} ${f1(y)}H${f1(x1)}"/><path class="sc-dtc-hi" d="M${f1(x0)} ${f1(y - 0.5)}H${f1(x1)}"/>
  ${beads.map((x) => `${hot.includes(x) ? `<circle class="sc-hot" cx="${f1(x)}" cy="${f1(y)}" r="5.2"/>` : ""}<rect x="${f1(x - 3.6)}" y="${f1(y - 1.75)}" width="7.2" height="3.5" rx="1.75" fill="url(#${p}-sleeve)"/><path class="sc-sleeve-hi" d="M${f1(x - 2.6)} ${f1(y - 0.9)}h5.2"/>`).join("")}`;
}
// A stainless hanger bolted to a shaft wall at `wx`, reaching out to (x, y),
// for a logger to hang from.
export const hanger = (p, wx, x, y) => {
  const dir = Math.sign(x - wx) || 1;
  return `<path class="sc-hanger" d="M${f1(wx)} ${f1(y - 5)}H${f1(x)}V${f1(y + 1.6)}"/><path class="sc-hanger-hi" d="M${f1(wx)} ${f1(y - 5.4)}H${f1(x)}"/><circle class="sc-bolt" cx="${f1(wx + dir * 2.2)}" cy="${f1(y - 5)}" r=".9"/>`;
};
// where a frame's flange reaches either side, so the road can stop there
export const frameSpan = (open, oc, frame = 5.5) => { const fl = Math.max(5, frame * 1.3); return [oc - open / 2 - fl - 1, oc + open / 2 + fl + 1]; };

// A submersible sewage pump on its duckfoot bend, from the front: the
// cast duckfoot bolted to the floor with its discharge flange turned up,
// the pump docked against it (volute below, ribbed motor housing above, the
// lifting hoop and its chain, the power cable), and two stainless guide
// rails up from the duckfoot. (x, floor): the pump's centre line on the
// floor; w its width. Returns the drawing and where the discharge leaves.
export function subPump(p, x, floor, w = 34, { rails = 0, run = "" } = {}) {
  const vh = w * 0.36, mh = w * 0.9, mw = w * 0.66;
  const dx = x + w * 0.62, dw = w * 0.42; // the duckfoot, to the right
  const vy = floor - w * 0.08 - vh; // top of the volute
  const top = vy - mh;
  const ribs = Array.from({ length: 5 }, (_, k) => `M${f1(x - mw / 2 + 1)} ${f1(vy - mh * (0.18 + k * 0.13))}H${f1(x + mw / 2 - 1)}`).join("");
  return {
    out: [dx + dw / 2, floor - w * 0.62],
    draw: `
  <g class="sc-pump">
    ${rails ? `<path class="sc-rail" d="M${f1(dx + dw * 0.22)} ${f1(floor - w * 0.5)}V${f1(rails)}M${f1(dx + dw * 0.78)} ${f1(floor - w * 0.5)}V${f1(rails)}"/><path class="sc-rail-hi" d="M${f1(dx + dw * 0.22 - 0.5)} ${f1(floor - w * 0.5)}V${f1(rails)}M${f1(dx + dw * 0.78 - 0.5)} ${f1(floor - w * 0.5)}V${f1(rails)}"/>` : ""}
    <path class="sc-chain" d="M${f1(x)} ${f1(top - w * 0.18)}V${f1(rails || top - w)}"/>
    <path d="M${f1(dx)} ${f1(floor)}V${f1(floor - w * 0.36)}Q${f1(dx)} ${f1(floor - w * 0.5)} ${f1(dx + dw * 0.3)} ${f1(floor - w * 0.5)}H${f1(dx + dw)}V${f1(floor)}Z" fill="url(#${p}-pump)"/>
    <rect x="${f1(dx - 1)}" y="${f1(floor - 1.6)}" width="${f1(dw + 4)}" height="1.6" fill="#1f2a31"/>
    <rect x="${f1(dx + dw * 0.08)}" y="${f1(floor - w * 0.62)}" width="${f1(dw * 0.84)}" height="${f1(w * 0.12)}" fill="url(#${p}-pump)"/>
    <path d="M${f1(x - w / 2)} ${f1(vy + vh * 0.55)}Q${f1(x - w / 2)} ${f1(vy)} ${f1(x - w * 0.2)} ${f1(vy)}H${f1(x + w * 0.42)}Q${f1(x + w * 0.62)} ${f1(vy + vh * 0.1)} ${f1(x + w * 0.62)} ${f1(vy + vh * 0.5)}V${f1(vy + vh * 0.8)}Q${f1(x + w * 0.5)} ${f1(vy + vh)} ${f1(x + w * 0.2)} ${f1(vy + vh)}H${f1(x - w * 0.3)}Q${f1(x - w / 2)} ${f1(vy + vh)} ${f1(x - w / 2)} ${f1(vy + vh * 0.55)}Z" fill="url(#${p}-pump)"/>
    <rect x="${f1(x - w * 0.18)}" y="${f1(vy + vh)}" width="${f1(w * 0.36)}" height="${f1(w * 0.08)}" fill="#1f2a31"/>
    <rect x="${f1(x - mw / 2)}" y="${f1(top)}" width="${f1(mw)}" height="${f1(mh + 1)}" rx="${f1(w * 0.05)}" fill="url(#${p}-pump)"/>
    <path class="sc-rib" d="${ribs}"/>
    <rect x="${f1(x - mw / 2 - 1)}" y="${f1(top)}" width="${f1(mw + 2)}" height="${f1(w * 0.1)}" rx="1" fill="url(#${p}-pump)"/>
    <path class="sc-hoop" d="M${f1(x - w * 0.14)} ${f1(top)}V${f1(top - w * 0.12)}Q${f1(x - w * 0.14)} ${f1(top - w * 0.2)} ${f1(x)} ${f1(top - w * 0.2)}Q${f1(x + w * 0.14)} ${f1(top - w * 0.2)} ${f1(x + w * 0.14)} ${f1(top - w * 0.12)}V${f1(top)}"/>
    <rect x="${f1(x + mw * 0.18)}" y="${f1(top - w * 0.08)}" width="${f1(w * 0.1)}" height="${f1(w * 0.09)}" fill="#1b2328"/>
    <rect x="${f1(x - mw * 0.32)}" y="${f1(top + mh * 0.4)}" width="${f1(mw * 0.42)}" height="${f1(mh * 0.16)}" rx=".4" fill="url(#${p}-label)"/>
    ${run ? `<circle class="${run}" cx="${f1(x + mw * 0.24)}" cy="${f1(top + mh * 0.48)}" r="${f1(w * 0.06)}"/>` : ""}
  </g>`,
  };
}
// A ductile iron riser with its flanges (vertical), a gate valve with its
// handwheel and a swing check valve on it.
export function riser(p, x, y0, y1, d = 7, { valves = null } = {}) {
  const fl = (y) => `<rect x="${f1(x - d * 0.85)}" y="${f1(y - 1)}" width="${f1(d * 1.7)}" height="2" rx=".4" fill="url(#${p}-pipe-extv)"/>`;
  let v = "";
  if (valves) {
    const [cy, gy] = valves; // check valve and gate valve centres
    v = `<rect x="${f1(x - d * 0.95)}" y="${f1(cy - d * 0.9)}" width="${f1(d * 1.9)}" height="${f1(d * 1.8)}" rx="${f1(d * 0.5)}" fill="url(#${p}-pipe-extv)"/><path class="sc-edge-dk" d="M${f1(x + d * 0.95)} ${f1(cy - d * 0.5)}h${f1(d * 0.5)}v${f1(d)}h${f1(-d * 0.5)}"/>${fl(cy - d * 0.9)}${fl(cy + d * 0.9)}
    <rect x="${f1(x - d * 0.8)}" y="${f1(gy - d * 0.7)}" width="${f1(d * 1.6)}" height="${f1(d * 1.4)}" fill="url(#${p}-pipe-extv)"/>${fl(gy - d * 0.7)}${fl(gy + d * 0.7)}
    <path class="sc-stem" d="M${f1(x + d * 0.8)} ${f1(gy)}h${f1(d * 1.4)}"/><ellipse cx="${f1(x + d * 2.3)}" cy="${f1(gy)}" rx="${f1(d * 0.3)}" ry="${f1(d * 1)}" class="sc-wheel"/>`;
  }
  return `<rect x="${f1(x - d / 2)}" y="${f1(Math.min(y0, y1))}" width="${d}" height="${f1(Math.abs(y1 - y0))}" fill="url(#${p}-pipe-extv)"/>${fl(y0)}${v}`;
}
// A horizontal pipe seen from the side (its outside), with flanges at `fl`.
export const pipeRun = (p, x0, x1, y, d = 7, fl = []) => `<rect x="${f1(x0)}" y="${f1(y - d / 2)}" width="${f1(x1 - x0)}" height="${d}" fill="url(#${p}-pipe-ext)"/>${fl.map((x) => `<rect x="${f1(x - 1)}" y="${f1(y - d * 0.85)}" width="2" height="${f1(d * 1.7)}" rx=".4" fill="url(#${p}-pipe-ext)"/>`).join("")}`;
// An aluminium access hatch in section, flush with the surface: its frame
// cast into the slab and the checker plate lid.
export const hatch = (p, x0, x1, top) => `
  <rect x="${f1(x0 - 2)}" y="${f1(top)}" width="${f1(x1 - x0 + 4)}" height="3.6" fill="url(#${p}-ss)"/>
  <rect x="${f1(x0)}" y="${f1(top - 0.3)}" width="${f1(x1 - x0)}" height="1.8" fill="url(#${p}-ss)"/>
  <path class="sc-checker" d="M${f1(x0 + 1)} ${f1(top - 0.4)}H${f1(x1 - 1)}"/>
  <path class="sc-edge-dk" d="M${f1(x0 - 2)} ${f1(top)}h${f1(x1 - x0 + 4)}v3.6h${f1(-(x1 - x0 + 4))}z"/>`;
// A vent stack on a slab: a pipe up and a gooseneck over.
export const vent = (p, x, top, h = 22, d = 4) => `<rect x="${f1(x - d / 2)}" y="${f1(top - h)}" width="${d}" height="${h}" fill="url(#${p}-pipe-extv)"/><path class="sc-gooseneck" style="stroke-width:${d}" d="M${f1(x)} ${f1(top - h)}q0 -${f1(d * 1.6)} ${f1(d * 1.6)} -${f1(d * 1.6)}q${f1(d * 1.6)} 0 ${f1(d * 1.6)} ${f1(d * 1.6)}v${f1(d)}"/>`;

// A portable composite sampler (ORI BASIC mobil type), from the front: the
// two tone blue drum that holds the bottles on ice, its latches, and the
// controller on top under a clear lid, with a carry handle. (x, base): the
// centre of its foot on the ground; w its width.
export function sampler(p, x, base, w = 34) {
  const h = w * 0.98, L = x - w / 2;
  const top = base - h;
  const cw = w * 0.86, ch = w * 0.5, cx0 = x - cw / 2, cy0 = top - ch;
  return `
  <g class="sc-sampler">
    <ellipse cx="${f1(x + 1)}" cy="${f1(base)}" rx="${f1(w * 0.55)}" ry="1.6" fill="url(#${p}-shd)"/>
    <rect x="${f1(L)}" y="${f1(top + h * 0.34)}" width="${f1(w)}" height="${f1(h * 0.66)}" rx="${f1(w * 0.05)}" fill="url(#${p}-blue)"/>
    <rect x="${f1(L)}" y="${f1(top)}" width="${f1(w)}" height="${f1(h * 0.36)}" rx="${f1(w * 0.05)}" fill="url(#${p}-blue-lt)"/>
    <path class="sc-edge-dk" d="M${f1(L)} ${f1(top + h * 0.35)}H${f1(L + w)}"/>
    <rect x="${f1(L - 1.2)}" y="${f1(top + h * 0.42)}" width="2.4" height="${f1(h * 0.16)}" rx=".6" fill="#1d2326"/><rect x="${f1(L + w - 1.2)}" y="${f1(top + h * 0.42)}" width="2.4" height="${f1(h * 0.16)}" rx=".6" fill="#1d2326"/>
    <rect x="${f1(x - w * 0.36)}" y="${f1(top - 1.6)}" width="2" height="2.4" fill="#3b4246"/><rect x="${f1(x + w * 0.36 - 2)}" y="${f1(top - 1.6)}" width="2" height="2.4" fill="#3b4246"/>
    <rect x="${f1(cx0)}" y="${f1(cy0)}" width="${f1(cw)}" height="${f1(ch)}" rx="1" fill="url(#${p}-brushed)"/>
    <rect x="${f1(cx0 + 1.6)}" y="${f1(cy0 + 1.6)}" width="${f1(cw - 3.2)}" height="${f1(ch - 3.2)}" rx=".6" fill="#2a3236"/>
    <rect x="${f1(cx0 + 3.2)}" y="${f1(cy0 + 3)}" width="${f1(cw * 0.5)}" height="${f1(ch * 0.42)}" fill="#3d5a58"/>
    <path class="sc-screen-t" d="M${f1(cx0 + 4.4)} ${f1(cy0 + 4.6)}h${f1(cw * 0.3)}M${f1(cx0 + 4.4)} ${f1(cy0 + 6.4)}h${f1(cw * 0.22)}"/>
    ${[0, 1, 2].map((k) => `<circle cx="${f1(cx0 + cw * 0.72 + (k % 2) * 3)}" cy="${f1(cy0 + ch * 0.32 + k * 2.6)}" r=".9" fill="#c3cbce"/>`).join("")}
    <path class="sc-glint" d="M${f1(cx0 + 2)} ${f1(cy0 + 1.2)}l${f1(cw * 0.3)} 0"/>
    <path class="sc-handle" d="M${f1(x - cw * 0.3)} ${f1(cy0)}V${f1(cy0 - 4)}H${f1(x + cw * 0.3)}V${f1(cy0)}"/>
  </g>`;
}
// An industrial building in elevation behind the section: a concrete
// plinth, ribbed metal cladding, a roller door, a personnel door under its
// awning, high windows, the gutter and a downpipe. (x0, x1) across, `top`
// the eaves, `ground` the floor line.
export function building(p, x0, x1, top, ground) {
  const w = x1 - x0, h = ground - top, rd = [x0 + w * 0.08, x0 + w * 0.4], pd = [x0 + w * 0.5, x0 + w * 0.6];
  const slats = [];
  for (let y = top + h * 0.36; y < ground - 1; y += 2.2) slats.push(`M${f1(rd[0] + 1)} ${f1(y)}H${f1(rd[1] - 1)}`);
  return `
  <g class="sc-building">
    <rect x="${f1(x0)}" y="${f1(top)}" width="${f1(w)}" height="${f1(h)}" fill="url(#${p}-clad)"/>
    <rect x="${f1(x0)}" y="${f1(top)}" width="${f1(w)}" height="${f1(h)}" fill="url(#${p}-clad-sh)"/>
    <rect x="${f1(x0)}" y="${f1(ground - h * 0.13)}" width="${f1(w)}" height="${f1(h * 0.13)}" fill="url(#${p}-conc)"/>
    <path class="sc-cut-edge" d="M${f1(x0)} ${f1(ground - h * 0.13)}H${f1(x1)}"/>
    <rect x="${f1(x0 - 1.5)}" y="${f1(top - 4)}" width="${f1(w + 3)}" height="4" fill="url(#${p}-ss)"/>
    <path class="sc-edge-dk" d="M${f1(x0 - 1.5)} ${f1(top)}H${f1(x1 + 1.5)}"/>
    <rect x="${f1(x0 + w * 0.64)}" y="${f1(top + h * 0.12)}" width="${f1(w * 0.3)}" height="${f1(h * 0.14)}" fill="url(#${p}-glz)"/>
    <path class="sc-mullion" d="M${f1(x0 + w * 0.74)} ${f1(top + h * 0.12)}v${f1(h * 0.14)}M${f1(x0 + w * 0.84)} ${f1(top + h * 0.12)}v${f1(h * 0.14)}"/>
    <path class="sc-glint" d="M${f1(x0 + w * 0.66)} ${f1(top + h * 0.15)}l${f1(w * 0.05)} 0"/>
    <rect x="${f1(rd[0] - 1.5)}" y="${f1(top + h * 0.32)}" width="${f1(rd[1] - rd[0] + 3)}" height="${f1(ground - top - h * 0.32)}" fill="#7d878b"/>
    <rect x="${f1(rd[0])}" y="${f1(top + h * 0.35)}" width="${f1(rd[1] - rd[0])}" height="${f1(ground - top - h * 0.35)}" fill="url(#${p}-door)"/>
    <path class="sc-slat" d="${slats.join("")}"/>
    <rect x="${f1(pd[0])}" y="${f1(top + h * 0.5)}" width="${f1(pd[1] - pd[0])}" height="${f1(h * 0.5)}" fill="#5f6b70"/>
    <rect x="${f1(pd[1] - 3)}" y="${f1(top + h * 0.74)}" width="1.6" height=".9" fill="#c9cfd1"/>
    <path d="M${f1(pd[0] - 3)} ${f1(top + h * 0.47)}H${f1(pd[1] + 3)}L${f1(pd[1] + 2)} ${f1(top + h * 0.44)}H${f1(pd[0] - 2)}Z" fill="url(#${p}-ss)"/>
    <rect x="${f1(x1 - 4)}" y="${f1(top - 1)}" width="2.2" height="${f1(h + 1)}" fill="url(#${p}-ssv)"/>
    <rect x="${f1(x0)}" y="${f1(ground - 1.2)}" width="${f1(w)}" height="1.2" fill="#000" fill-opacity=".25"/>
  </g>`;
}

// A multiparameter water quality sonde hung on its cable: a dark body with
// its label and the slotted stainless guard over the sensors. (x, y0) the
// top of the body, down to y1; d across.
export function sonde(p, x, y0, y1, d = 7) {
  const g = (y1 - y0) * 0.3, slots = [];
  for (let k = 0; k < 3; k++) slots.push(`<rect x="${f1(x - d / 2 + 1.2 + k * (d - 2.4) / 3)}" y="${f1(y1 - g + 1.6)}" width="${f1((d - 2.4) / 3 - 0.8)}" height="${f1(g - 3.6)}" rx=".4" fill="#1f2629"/>`);
  return `
  <rect x="${f1(x - d / 2)}" y="${f1(y0)}" width="${d}" height="${f1(y1 - y0 - g)}" rx="${f1(d * 0.18)}" fill="url(#${p}-blkv)"/>
  <rect x="${f1(x - d / 2 + 0.8)}" y="${f1(y0 + (y1 - y0) * 0.18)}" width="${f1(d - 1.6)}" height="${f1((y1 - y0) * 0.16)}" fill="url(#${p}-label)"/>
  <rect x="${f1(x - d / 2)}" y="${f1(y1 - g)}" width="${d}" height="${f1(g)}" rx="${f1(d * 0.12)}" fill="url(#${p}-ssv)"/>
  ${slots.join("")}`;
}

// Detectronic Alarm2, from its photograph: a black composite box with its
// label on the side and the big round radar lens on a flange underneath,
// hung from a stainless bracket. (x, y): top left of the box; w long. The
// lens is at its downstream end. Returns the drawing and the lens centre.
export function alarm2Unit(p, x, y, w = 46) {
  const h = w * 0.42, lx = x + w * 0.7, lr = w * 0.24;
  return {
    lens: [lx, y + h + 2.6],
    draw: `
  <rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(w * 0.05)}" fill="url(#${p}-blk)"/>
  <path class="sc-part" d="M${f1(x + 1)} ${f1(y + h * 0.3)}H${f1(x + w - 1)}"/>
  <path class="sc-sheen" d="M${f1(x + 2)} ${f1(y + 1)}H${f1(x + w - 2)}"/>
  <rect x="${f1(x + w * 0.07)}" y="${f1(y + h * 0.38)}" width="${f1(w * 0.42)}" height="${f1(h * 0.48)}" rx=".5" fill="url(#${p}-label)"/>
  <path d="M${f1(x + w * 0.09)} ${f1(y + h * 0.44)}h${f1(w * 0.05)}q${f1(w * 0.03)} 0 ${f1(w * 0.03)} ${f1(h * 0.08)}t${f1(-w * 0.03)} ${f1(h * 0.08)}h${f1(-w * 0.05)}z" fill="#1d4f9c"/>
  <path class="sc-lbl-r" d="M${f1(x + w * 0.2)} ${f1(y + h * 0.5)}h${f1(w * 0.24)}M${f1(x + w * 0.09)} ${f1(y + h * 0.66)}h${f1(w * 0.35)}M${f1(x + w * 0.09)} ${f1(y + h * 0.76)}h${f1(w * 0.3)}"/>
  <rect x="${f1(lx - lr * 1.25)}" y="${f1(y + h - 0.4)}" width="${f1(lr * 2.5)}" height="2.4" rx=".6" fill="#202427"/>
  <circle class="sc-bolt" cx="${f1(lx - lr * 1.05)}" cy="${f1(y + h + 0.8)}" r=".7"/><circle class="sc-bolt" cx="${f1(lx + lr * 1.05)}" cy="${f1(y + h + 0.8)}" r=".7"/>
  <path d="M${f1(lx - lr)} ${f1(y + h + 2)}A${f1(lr)} ${f1(lr * 0.36)} 0 0 0 ${f1(lx + lr)} ${f1(y + h + 2)}Z" fill="url(#${p}-dome)"/>`,
  };
}
// A tipping bucket rain gauge (RIMCO 7499 type), after its photograph: a
// brushed stainless cylinder under a bronze collar round the funnel, a black
// cast base with its feet, on a galvanised post set in concrete. (cx, top):
// the top of the collar; `ground` where the post meets the ground.
export function rainGauge(p, cx, top, ground, w = 30) {
  const x = cx - w / 2, neck = top + w * 0.3, foot = top + w * 1.55;
  return `
  <rect x="${f1(cx - 2.2)}" y="${f1(foot + 2)}" width="4.4" height="${f1(ground - foot - 2)}" fill="url(#${p}-galvv)"/>
  <rect x="${f1(cx - 7)}" y="${f1(ground - 1)}" width="14" height="6" fill="url(#${p}-conc)"/><path class="sc-cut-edge" d="M${f1(cx - 7)} ${f1(ground - 1)}h14v6h-14z"/>
  <path d="M${f1(x)} ${f1(neck)}H${f1(x + w)}V${f1(foot)}H${f1(x)}Z" fill="url(#${p}-ssv)"/>
  <path d="M${f1(x - 2.5)} ${f1(top)}H${f1(x + w + 2.5)}L${f1(x + w)} ${f1(neck)}H${f1(x)}Z" fill="url(#${p}-brass)"/>
  <path class="sc-edge-dk" d="M${f1(x - 2.5)} ${f1(top)}H${f1(x + w + 2.5)}"/>
  <ellipse cx="${f1(cx)}" cy="${f1(top + 0.2)}" rx="${f1(w / 2 + 2.4)}" ry="1.2" fill="#6b4c17"/>
  <path d="M${f1(x - 1.6)} ${f1(foot)}H${f1(x + w + 1.6)}V${f1(foot + 3)}H${f1(x - 1.6)}Z" fill="#26292b"/>
  <path d="M${f1(x - 4)} ${f1(foot + 3)}h6v-1.6h-6zM${f1(x + w - 2)} ${f1(foot + 3)}h6v-1.6h-6z" fill="#26292b"/>
  <circle cx="${f1(x + w - 4)}" cy="${f1(neck + 3)}" r=".6" fill="#7d878b"/><circle cx="${f1(x + w - 4)}" cy="${f1(foot - 3)}" r=".6" fill="#7d878b"/>`;
}
// A solar panel on its arm: an aluminium frame round dark blue cells with
// their grid, tilted to the sun. (x, y) the arm's top; w across.
export const solarPanel = (p, x, y, w = 40, tilt = -20) => `
  <g transform="translate(${f1(x)} ${f1(y)}) rotate(${tilt})">
    <rect x="${f1(-w / 2)}" y="-4.5" width="${f1(w)}" height="9" rx=".6" fill="#c3cacd"/>
    <rect x="${f1(-w / 2 + 1)}" y="-3.5" width="${f1(w - 2)}" height="7" fill="url(#${p}-cells)"/>
    <path class="sc-cell-grid" d="${Array.from({ length: 5 }, (_, k) => `M${f1(-w / 2 + 1 + ((w - 2) * (k + 1)) / 6)} -3.5v7`).join("")}M${f1(-w / 2 + 1)} 0h${f1(w - 2)}"/>
    <path class="sc-glint" d="M${f1(-w / 2 + 3)} -2.6l${f1(w * 0.3)} 0"/>
  </g>`;
// A transmitter on its bracket: a grey wall box with its display and keys.
export const transmitter = (p, x, y, w = 30) => `
  <rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(w * 0.76)}" rx="1.6" fill="url(#${p}-brushed)"/>
  <rect x="${f1(x + w * 0.12)}" y="${f1(y + w * 0.12)}" width="${f1(w * 0.76)}" height="${f1(w * 0.24)}" rx=".6" fill="#22343a"/>
  <path class="sc-screen-t" d="M${f1(x + w * 0.18)} ${f1(y + w * 0.2)}h${f1(w * 0.36)}M${f1(x + w * 0.18)} ${f1(y + w * 0.28)}h${f1(w * 0.24)}"/>
  ${[0, 1, 2, 3].map((k) => `<rect x="${f1(x + w * (0.16 + k * 0.19))}" y="${f1(y + w * 0.47)}" width="${f1(w * 0.12)}" height="${f1(w * 0.08)}" rx=".5" fill="#5f6b70"/><rect x="${f1(x + w * (0.16 + k * 0.19))}" y="${f1(y + w * 0.6)}" width="${f1(w * 0.12)}" height="${f1(w * 0.08)}" rx=".5" fill="#5f6b70"/>`).join("")}`;
// Grass along a surface: short blades in two greens over a turf line.
export function turf(x0, x1, yOf, { seed = "g", step = 1.6 } = {}) {
  const r = rng(seed), blades = [];
  for (let x = x0; x <= x1; x += step * (0.6 + r() * 0.8)) {
    const y = yOf(x), h = 2 + r() * 3.4, lean = (r() - 0.4) * 2;
    blades.push(`M${f1(x)} ${f1(y + 0.6)}q${f1(lean * 0.3)} ${f1(-h * 0.6)} ${f1(lean)} ${f1(-h)}`);
  }
  const half = Math.floor(blades.length / 2);
  return `<path class="sc-blade" d="${blades.filter((_, i) => i % 2).join("")}"/><path class="sc-blade l" d="${blades.filter((_, i) => !(i % 2)).join("")}"/>`;
}

// A stainless steel kiosk on its concrete plinth, as telemetry and samplers
// live in: brushed panels, a roof cap, double doors with hinges and a
// T-handle, louvres, and the status lamp behind its window. (x, y): top left
// of the body; plinth below to `ground` plus a little.
export function kiosk(p, x, y, w, h, { lamp = true, antenna = 0 } = {}) {
  const louvres = [];
  for (let k = 0; k < 4; k++) louvres.push(`M${f1(x + w * 0.12)} ${f1(y + h - 8 + k * 1.6)}h${f1(w * 0.28)}M${f1(x + w * 0.6)} ${f1(y + h - 8 + k * 1.6)}h${f1(w * 0.28)}`);
  return `
  <g class="sc-kiosk">
    ${antenna ? `<path class="sc-mast" d="M${f1(x + w - 5)} ${f1(y)}V${f1(y - antenna)}"/><rect x="${f1(x + w - 6.1)}" y="${f1(y - antenna - 7)}" width="2.2" height="9" rx="1.1" fill="#1b1f22"/>` : ""}
    <rect x="${f1(x - 2)}" y="${f1(y + h)}" width="${f1(w + 4)}" height="5" fill="url(#${p}-conc)"/>
    <path class="sc-cut-edge" d="M${f1(x - 2)} ${f1(y + h)}h${f1(w + 4)}v5h${f1(-w - 4)}z"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${p}-brushed)"/>
    <path d="M${f1(x - 1.5)} ${f1(y + 1.6)}L${f1(x + 1)} ${f1(y - 1.4)}H${f1(x + w - 1)}L${f1(x + w + 1.5)} ${f1(y + 1.6)}Z" fill="url(#${p}-ss)"/>
    <path class="sc-edge-dk" d="M${f1(x - 1.5)} ${f1(y + 1.6)}H${f1(x + w + 1.5)}"/>
    <path class="sc-seam" d="M${f1(x + w / 2)} ${f1(y + 3)}V${f1(y + h - 1.5)}M${f1(x + 1.5)} ${f1(y + 3)}V${f1(y + h - 1.5)}H${f1(x + w - 1.5)}V${f1(y + 3)}Z"/>
    ${[0.22, 0.72].map((k) => `<rect x="${f1(x + 0.6)}" y="${f1(y + h * k)}" width="1.6" height="4" rx=".4" fill="#7d878b"/><rect x="${f1(x + w - 2.2)}" y="${f1(y + h * k)}" width="1.6" height="4" rx=".4" fill="#7d878b"/>`).join("")}
    <rect x="${f1(x + w / 2 + 1.6)}" y="${f1(y + h * 0.42)}" width="2" height="7" rx=".9" fill="#30373a"/>
    <circle cx="${f1(x + w / 2 + 2.6)}" cy="${f1(y + h * 0.42 - 2)}" r="1" fill="#30373a"/>
    <path class="sc-louvre" d="${louvres.join("")}"/>
    ${lamp ? `<rect x="${f1(x + 4)}" y="${f1(y + 5)}" width="6" height="4.4" rx=".4" fill="#20282b"/><circle class="sc-lamp" cx="${f1(x + 7)}" cy="${f1(y + 7.2)}" r="1.2"/>` : ""}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${p}-kiosk-sh)"/>
  </g>`;
}
// extra materials for the instruments that need them
export function instDefs(p) {
  return [
    lin(`${p}-orange`, 1, 0, [[0, "#f39a4e"], [0.35, "#e5772c"], [1, "#b4531a"]]),
    lin(`${p}-orange2`, 1, 0, [[0, "#e38440"], [0.4, "#d56a24"], [1, "#a24814"]]),
    lin(`${p}-redp`, 1, 0, [[0, "#e8584c"], [0.3, "#cf3a2f"], [0.75, "#b02b22"], [1, "#8f211b"]]),
    lin(`${p}-brushed`, 1, 0, [[0, "#c9d0d3"], [0.18, "#e9eef0"], [0.45, "#d3d9dc"], [0.7, "#eef2f3"], [1, "#a9b2b6"]]),
    lin(`${p}-kiosk-sh`, 0, 1, [[0, "#000", 0], [0.7, "#000", 0.04], [1, "#000", 0.14]]),
    lin(`${p}-blue`, 1, 0, [[0, "#2f6fae"], [0.3, "#4f93d1"], [0.55, "#3b7cbc"], [1, "#24548a"]]),
    lin(`${p}-blue-lt`, 1, 0, [[0, "#4fa6c9"], [0.3, "#7cc6e2"], [0.55, "#62b2d3"], [1, "#3a87a8"]]),
    lin(`${p}-pump`, 1, 0, [[0, "#22303a"], [0.25, "#4d6474"], [0.42, "#6b8494"], [0.6, "#3f5563"], [1, "#1c2730"]]),
    lin(`${p}-pipe-ext`, 0, 1, [[0, "#7c868a"], [0.3, "#c9d0d3"], [0.55, "#8f999d"], [1, "#4d5559"]]),
    lin(`${p}-sleeve`, 0, 1, [[0, "#7fc0ec"], [0.35, "#2f8fd6"], [1, "#1c5f9a"]]),
    `<pattern id="${p}-clad" patternUnits="userSpaceOnUse" width="4.2" height="10"><rect width="4.2" height="10" fill="#d7dcdc"/><rect x="0" width="1" height="10" fill="#eef1f1"/><rect x="1" width=".5" height="10" fill="#b4bbbc"/><rect x="3.6" width=".6" height="10" fill="#c5cbcc"/></pattern>`,
    lin(`${p}-clad-sh`, 0, 1, [[0, "#000", 0.14], [0.2, "#000", 0.02], [1, "#000", 0.08]]),
    lin(`${p}-door`, 0, 1, [[0, "#b6bec1"], [1, "#98a2a6"]]),
    lin(`${p}-pvc`, 0, 1, [[0, "#e7ebe9"], [0.5, "#cfd5d3"], [1, "#b9c0be"]]),
    lin(`${p}-pvcv`, 1, 0, [[0, "#a9b0ae"], [0.3, "#e9edeb"], [0.55, "#d3d9d7"], [1, "#9aa19f"]]),
    `<radialGradient id="${p}-fog" cx=".4" cy=".35" r=".75">${stops([[0, "#f6efd2"], [0.55, "#e2d3a4"], [1, "#a8956a"]])}</radialGradient>`,
    `<radialGradient id="${p}-foul" cx=".45" cy=".3" r=".8">${stops([[0, "#8e8068"], [0.6, "#6a5d48"], [1, "#4a4134"]])}</radialGradient>`,
    lin(`${p}-cells`, 1, 1, [[0, "#38557c"], [0.5, "#1c2f4d"], [1, "#2b4466"]]),
    lin(`${p}-river`, 0, 1, [[0, "#9aab8e"], [0.06, "#7d9273"], [0.4, "#5d7357"], [1, "#3b4a36"]]),
    lin(`${p}-pipe-extv`, 1, 0, [[0, "#4d5559"], [0.3, "#a7b0b4"], [0.5, "#d3d9dc"], [0.72, "#8f999d"], [1, "#4d5559"]]),
  ].join("");
}

/* ---------------------------------------------------------------- what a sewer carries */
// A small seeded random, so a drawing is the same on every build.
const rng = (seed) => { let x = (hash(seed) % 2147483646) + 1; return () => ((x = (x * 16807) % 2147483647) / 2147483647); };
// A smooth line through points (Catmull-Rom as cubic Béziers).
const smoothD = (pts) => pts.map(([x, y], i) => {
  if (!i) return `M${f1(x)} ${f1(y)}`;
  const [x0, y0] = pts[i - 2] || pts[i - 1], [x1, y1] = pts[i - 1], [x3, y3] = pts[i + 1] || [x, y];
  return `C${f1(x1 + (x - x0) / 6)} ${f1(y1 + (y - y0) / 6)} ${f1(x - (x3 - x1) / 6)} ${f1(y - (y3 - y1) / 6)} ${f1(x)} ${f1(y)}`;
}).join("");
// A strand of rag (a wet wipe or cloth, twisted by the flow): a dark,
// soft-edged rope that waves along the current, with a paler thread of
// fibre along it. (x, y) its upstream end, len along the flow.
export function rag(x, y, len = 22, { seed = "r", bend = 3, tone = 0 } = {}) {
  const r = rng(`${seed}${x}${y}`);
  const cols = [["#a2967d", "#625846"], ["#aaa69b", "#6c685f"], ["#968868", "#574c3a"]][tone % 3];
  const n = 7, ph = r() * 6;
  const pts = Array.from({ length: n }, (_, i) => [x + (len * i) / (n - 1), y + Math.sin(i * 1.15 + ph) * bend * (0.5 + 0.5 * (i / (n - 1)))]);
  const d = smoothD(pts);
  return `<g class="sc-rag"><path class="sc-rag-core" style="stroke:${cols[1]}" d="${d}"/><path class="sc-rag-th" style="stroke:${cols[0]}" d="${smoothD(pts.map(([a, b], i) => [a, b - 0.5 + (i % 2) * 0.3]))}"/></g>`;
}
// A lump of fat, oil and grease: pale and waxy, darker underneath.
export const grease = (p, x, y, rx = 5, ry = 3.2) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="url(#${p}-fog)"/><ellipse class="sc-fog-hi" cx="${f1(x - rx * 0.3)}" cy="${f1(y - ry * 0.35)}" rx="${f1(rx * 0.35)}" ry="${f1(ry * 0.22)}"/>`;
// Grit and silt settled along the invert: a low bank of fine gravel.
export const silt = (p, x0, x1, inv, h = 4) => `<path fill="url(#${p}-grav)" d="M${f1(x0)} ${f1(inv)}C${f1(x0 + (x1 - x0) * 0.25)} ${f1(inv - h)} ${f1(x0 + (x1 - x0) * 0.6)} ${f1(inv - h * 1.1)} ${f1(x1)} ${f1(inv)}Z"/><path fill="rgba(120, 98, 70, .45)" d="M${f1(x0)} ${f1(inv)}C${f1(x0 + (x1 - x0) * 0.25)} ${f1(inv - h)} ${f1(x0 + (x1 - x0) * 0.6)} ${f1(inv - h * 1.1)} ${f1(x1)} ${f1(inv)}Z"/>`;
// The mass that builds on anything in the flow: rag matted round it into a
// lump, grease caught in it, fibres standing out of its skin, strands
// streaming off downstream, and grit banked against its upstream toe.
// (x, inv): its upstream toe; w long, h high.
export function fouling(p, x, inv, w = 60, h = 16, seed = "f") {
  const r = rng(seed);
  // an irregular, lumpy outline
  const n = 14, out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, bump = 1 + (r() - 0.5) * 0.28;
    const yy = inv - h * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.5) * bump;
    out.push([x + w * u, Math.min(inv, yy)]);
  }
  const body = `${smoothD(out)}L${f1(x + w)} ${f1(inv)}L${f1(x)} ${f1(inv)}Z`;
  const cid = `${p}-fc-${f1(x)}`;
  const fibres = Array.from({ length: 38 }, () => {
    const fx = x + w * (0.04 + r() * 0.9), fy = inv - h * (0.08 + r() * 0.95), l = 3 + r() * 6, a = (r() - 0.5) * 0.9;
    return `M${f1(fx)} ${f1(fy)}q${f1(l * 0.5)} ${f1(-1.2 + r() * 2.4)} ${f1(l * Math.cos(a))} ${f1(l * Math.sin(a))}`;
  }).join("");
  const tails = [0, 1, 2, 3].map((i) => rag(x + w * (0.7 + r() * 0.2), inv - h * (0.2 + i * 0.2), w * (0.45 + r() * 0.35), { seed: `${seed}t${i}`, bend: 1.6 + r() * 1.6, tone: i })).join("");
  return `
  ${silt(p, x - w * 0.22, x + w * 0.14, inv, h * 0.32)}
  ${tails}
  <path d="${body}" fill="url(#${p}-foul)"/>
  <clipPath id="${cid}"><path d="${body}"/></clipPath>
  <g clip-path="url(#${cid})"><path class="sc-fibre" d="${fibres}"/><path class="sc-fibre l" d="${fibres.split("M").slice(1, 18).map((q) => `M${q}`).join("")}" transform="translate(.6 -.8)"/>
  <rect x="${f1(x)}" y="${f1(inv - h * 0.35)}" width="${f1(w)}" height="${f1(h * 0.35)}" fill="#1e1a14" fill-opacity=".28"/></g>
  <path class="sc-fibre o" d="${Array.from({ length: 10 }, () => { const u = 0.08 + r() * 0.84, i = Math.round(u * n), [ox, oy] = out[i]; return `M${f1(ox)} ${f1(oy + 0.5)}q${f1(1 + r() * 2)} ${f1(-2 - r() * 2)} ${f1(3 + r() * 3)} ${f1(-1 - r() * 2)}`; }).join("")}"/>
  ${grease(p, x + w * 0.34, inv - h * 0.66, w * 0.075, h * 0.15)}${grease(p, x + w * 0.6, inv - h * 0.48, w * 0.055, h * 0.12)}`;
}

/* ---------------------------------------------------------------- words */
// A rough width for a run of text in the site's text face, so a plate can be
// drawn to fit it (em per character, by shape).
const NARROW = new Set([..."iljtfrI.,:;'!|() "]), WIDE = new Set([..."mwMWOQGDH%@"]);
export const textW = (s, size, weight = 400) => [...String(s)].reduce((w, c) => w + (NARROW.has(c) ? 0.3 : WIDE.has(c) ? 0.84 : /[A-Z0-9]/.test(c) ? 0.66 : 0.54), 0) * size * (weight > 500 ? 1.05 : 1);
// A label on a plate, one or two lines, anchored at (x, y) (the first
// baseline; `a` start, middle or end). The plate scales with the words when a
// figure is narrow (site.css: .sc-tag), about the anchor.
export function tag(x, y, lines, { a = "start", size = 11, bold = false, cls = "", pad = 4 } = {}) {
  const L = [].concat(lines);
  const w = Math.max(...L.map((s) => textW(s, size, bold ? 600 : 400))) + pad * 2;
  const lh = size * 1.25, h = lh * L.length + pad * 1.1;
  const x0 = a === "start" ? x - pad : a === "end" ? x - w + pad : x - w / 2;
  return `<g class="sc-tag${bold ? " b" : ""}${cls ? ` ${cls}` : ""}" style="transform-origin:${f1(x)}px ${f1(y)}px">
    <rect x="${f1(x0)}" y="${f1(y - size * 0.92 - pad * 0.55)}" width="${f1(w)}" height="${f1(h)}" rx="2"/>
    <text x="${f1(x)}" y="${f1(y)}"${a !== "start" ? ` text-anchor="${a}"` : ""}>${esc(L[0])}${L.slice(1).map((l) => `<tspan x="${f1(x)}" dy="1.25em">${esc(l)}</tspan>`).join("")}</text>
  </g>`;
}
// A leader from a label to the thing it names, ending in a dot on the thing.
export const lead = (pts, { dot = true, cls = "" } = {}) => {
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${f1(x)} ${f1(y)}`).join("");
  const [ex, ey] = pts[pts.length - 1];
  return `<path class="sc-lead${cls ? ` ${cls}` : ""}" d="${d}"/>${dot ? `<circle class="sc-lead-dot${cls ? ` ${cls}` : ""}" cx="${f1(ex)}" cy="${f1(ey)}" r="1.9"/>` : ""}`;
};
// A flow arrow: the word and a long arrow, on a plate so it reads on water.
export const flowArrow = (x, y, text = "Flow", { size = 10.5, len = 26 } = {}) => {
  const w = textW(text, size, 600);
  return `<g class="sc-flow" style="transform-origin:${f1(x)}px ${f1(y)}px"><text x="${f1(x)}" y="${f1(y)}">${esc(text)}</text><path d="M${f1(x + w + 5)} ${f1(y - size * 0.34)}h${len}m-5-3.6 5 3.6-5 3.6"/></g>`;
};
