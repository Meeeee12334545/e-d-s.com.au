// The isometric city: drawing only. city.js owns selection, the tour, the
// storm, the underground view and the readouts; this file builds the SVG and
// hands back the groups and nodes those need.
//
// Everything sits on a 15 x 10 tile grid (TW x TH px per tile). A tile at
// (x, y) and height z lands at P(x, y, z). Buildings inside a district are
// sorted by d = x + w + y + d so nearer footprints paint over farther ones;
// footprints in one district must not interleave (an L-shaped building is two
// boxes with a bias). Repeated parts (trees, lamps, vehicles, people) are
// symbols in <defs> placed with <use>, styled through inherited custom
// properties, so a district's palette still tints them.
(() => {
  const NS = "http://www.w3.org/2000/svg", XL = "http://www.w3.org/1999/xlink";
  const TW = 56, TH = 28;
  const P = (x, y, z = 0) => [(x - y) * TW / 2, (x + y) * TH / 2 - z];
  // two decimals: the camera zooms a district to two or three times its
  // size, where a tenth of a unit is most of a device pixel
  const f = (n) => (+n).toFixed(2);
  const pts = (a) => a.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) n.setAttribute(k, attrs[k]);
    parent?.appendChild(n);
    return n;
  };
  const poly = (cls, a, extra) => el("polygon", { class: cls, points: pts(a), ...extra });
  const seg = (cls, a, b, extra) => el("line", { class: cls, x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]), ...extra });
  const pl = (cls, a, extra) => el("polyline", { class: cls, points: pts(a), ...extra });
  const item = (d, ...nodes) => ({ d, nodes: nodes.flat(Infinity).filter(Boolean) });
  // Many small shapes of one kind (windows, joints, posts, roof courses) go
  // into one path, so the fine detail costs one node per kind rather than
  // one per shape: `shapes` closes each outline, `strokes` leaves it open.
  const dOf = (list, close) => list.map((a) => "M" + a.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + (close ? "Z" : "")).join("");
  const shapes = (cls, list, extra) => list.length ? el("path", { class: cls, d: dOf(list, true), ...extra }) : null;
  const strokes = (cls, list, extra) => list.length ? el("path", { class: cls, d: dOf(list, false), ...extra }) : null;
  // a rectangle on a wall: `L` is the face at y + d (facing left), `R` the
  // face at x + w; a and b run along the wall in tiles, z0 and z1 up it
  const onL = (x, yd, a, b, z0, z1) => [P(x + a, yd, z0), P(x + b, yd, z0), P(x + b, yd, z1), P(x + a, yd, z1)];
  const onR = (xw, y, a, b, z0, z1) => [P(xw, y + a, z0), P(xw, y + b, z0), P(xw, y + b, z1), P(xw, y + a, z1)];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // The light: a high sun in the north-north-east, so the east faces are lit
  // and the south faces are in shade (site.css derives both from one
  // material colour), and every block throws a shadow west-south-west across
  // the ground. While a district is being built, box() and cyl() add their
  // footprint to `cast`; build() then draws all of a district's shadows as
  // one path under it, so they cost one node per district.
  const SUN = [-0.35, 1];
  let cast = null;
  const castOf = (foot, h) => {
    const s = 0.04 + 0.0038 * h;
    return hull(foot.concat(foot.map(([x, y]) => [x + SUN[0] * s, y + SUN[1] * s])).map(([x, y]) => P(x, y)));
  };
  const round = (cx, cy, r, n = 10) => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return [cx + Math.cos(t) * r, cy + Math.sin(t) * r]; });
  // the cars, the bin lids and the cafe parasols take their colours in turn
  const CARS = ["#d9453b", "#f2f4f1", "#5b8fd6", "#e9b63b", "#2f3c42", "#8ac1c9", "#c9c9c7", "#7a4f9e"], LIDS = ["#c62828", "#e0b020", "#2e7d32"], PARAS = ["#f4f1e8", "#d9453b", "#2f8d84", "#f2c14e"];
  const turns = { car: 0, bin: 0, para: 0 };

  /* ---- solids ---- */
  function box(x, y, w, d, h, o = {}) {
    const z = o.z || 0, c = o.cls ? ` ${o.cls}` : "", nodes = [];
    if (cast && !z && h >= 4) cast.push(castOf([[x, y], [x + w, y], [x + w, y + d], [x, y + d]], h + (o.rh || 0)));
    const L = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const R = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
    nodes.push(poly("fl" + c, L), poly("fr" + c, R));
    if (o.win) {
      // window grids are patterns skewed to the face, over the themed face so
      // the active tint still shows through; a dark band hides the base seam
      nodes.push(poly("win", L, { style: `fill:url(#win-l-${o.win})` }), poly("win", R, { style: `fill:url(#win-r-${o.win})` }));
      const b = Math.min(7, h / 3);
      nodes.push(poly("pod", [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + b), P(x, y + d, z + b)]));
      nodes.push(poly("pod", [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + b), P(x + w, y, z + b)]));
      // a parapet coping along the roofline, and a lit edge up the near corner
      const c = Math.min(1.8, h / 10);
      nodes.push(shapes("cope", [onL(x, y + d, 0, w, z + h - c, z + h), onR(x + w, y, 0, d, z + h - c, z + h)]), seg("edge", P(x + w, y + d, z + b), P(x + w, y + d, z + h - c)));
      // a lit entrance in the middle of the left face
      if (o.entry) nodes.push(poly("entry", onL(x, y + d, w / 2 - 0.07, w / 2 + 0.07, z, z + Math.min(5.5, b))));
    }
    // corrugated cladding: ribs skewed to each face
    if (o.clad) nodes.push(poly("clad", L, { style: "fill:url(#clad-l)" }), poly("clad", R, { style: "fill:url(#clad-r)" }));
    if (!o.noTop) nodes.push(poly((o.top || "ft") + c, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)]));
    // a windowed block's roof sits inside a parapet
    if (o.win && !o.noTop && w > 0.3 && d > 0.3) { const i = 0.05; nodes.push(poly("roofin", [P(x + i, y + i, z + h), P(x + w - i, y + i, z + h), P(x + w - i, y + d - i, z + h), P(x + i, y + d - i, z + h)])); }
    // the sun catches the two near edges of the top, which keeps every block crisp
    if (!o.noTop && h >= 3) nodes.push(pl("rim-hl", [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y, z + h)]));
    return { d: x + w + y + d + (o.bias || 0), nodes };
  }
  // A hipped roof: four planes named for the way they face, so site.css can
  // light the north and east planes and shade the south and west ones from
  // one roof colour (`m`: tile, slate, cb-grey and so on).
  function roof(x, y, w, d, z, rh, m) {
    const A = P(x + w / 2, y + d / 2, z + rh), c = m ? ` ${m}` : "";
    return [
      poly("rf rf-w" + c, [P(x, y, z), P(x, y + d, z), A]),
      poly("rf rf-n" + c, [P(x, y, z), P(x + w, y, z), A]),
      poly("rf rf-s" + c, [P(x, y + d, z), P(x + w, y + d, z), A]),
      poly("rf rf-e" + c, [P(x + w, y, z), P(x + w, y + d, z), A]),
    ];
  }
  function house(x, y, w, d, h, rh, o = {}) {
    const b = box(x, y, w, d, h, { ...o, noTop: true, rh });
    b.nodes.push(...roof(x, y, w, d, (o.z || 0) + h, rh, o.roof));
    return b;
  }
  // a gabled block: ridge along x or y, with the gable end that faces the viewer
  function prism(x, y, w, d, h, rh, o = {}) {
    const z = o.z || 0, t = z + h, b = box(x, y, w, d, h, { ...o, noTop: true, rh }), c = o.roof ? ` ${o.roof}` : "", wall = o.cls ? ` ${o.cls}` : "";
    if (o.gable === "y") {
      const r0 = P(x + w / 2, y, t + rh), r1 = P(x + w / 2, y + d, t + rh);
      b.nodes.push(
        poly("rf rf-w" + c, [P(x, y, t), P(x, y + d, t), r1, r0]),
        poly("rf rf-e" + c, [P(x + w, y, t), P(x + w, y + d, t), r1, r0]),
        poly("fl" + wall, [P(x, y + d, t), P(x + w, y + d, t), r1])
      );
      if (o.skylight) b.nodes.push(poly("lit sky", [P(x + w * 0.6, y + d * 0.15, t + rh * 0.4), P(x + w * 0.85, y + d * 0.15, t + rh * 0.15), P(x + w * 0.85, y + d * 0.85, t + rh * 0.15), P(x + w * 0.6, y + d * 0.85, t + rh * 0.4)]));
    } else {
      const r0 = P(x, y + d / 2, t + rh), r1 = P(x + w, y + d / 2, t + rh);
      b.nodes.push(
        poly("rf rf-n" + c, [P(x, y, t), P(x + w, y, t), r1, r0]),
        poly("rf rf-s" + c, [P(x, y + d, t), P(x + w, y + d, t), r1, r0]),
        poly("fr" + wall, [P(x + w, y, t), P(x + w, y + d, t), r1])
      );
    }
    return b;
  }
  // What makes a house read as one up close: windows with sills, a shadow
  // under the eaves, tile courses on the roof planes facing the viewer and a
  // light line along the ridge and hips. `roof` is "x" or "y" for a gable
  // whose ridge runs along that axis, "h" for a hip. The windows leave room
  // for a door a third of the way along the left face.
  function homeDetail(x, y, w, d, h, rh, roof, seed = 0) {
    const yd = y + d, xw = x + w, rows = h >= 16 ? [[3, 6.6], [10.6, 14.2]] : [[3.6, 7.6]];
    const dark = [], lit = [], sills = [], tiles = [], ridge = [];
    let n = 0;
    const win = (q, a, b, z0, face) => {
      ((seed * 3 + n++ * 5) % 7 < 2 ? lit : dark).push(q);
      sills.push(face === "L" ? [P(x + a - 0.015, yd, z0 - 0.4), P(x + b + 0.015, yd, z0 - 0.4)] : [P(xw, y + a - 0.015, z0 - 0.4), P(xw, y + b + 0.015, z0 - 0.4)]);
    };
    rows.forEach(([z0, z1], r) => {
      for (const [a, b] of r ? [[0.08, 0.26], [0.4, 0.58], [0.72, 0.9]] : [[0.08, 0.3], [0.62, 0.88]]) win(onL(x, yd, a * w, b * w, z0, z1), a * w, b * w, z0, "L");
      for (const [a, b] of [[0.14, 0.4], [0.6, 0.86]]) win(onR(xw, y, a * d, b * d, z0, z1), a * d, b * d, z0, "R");
    });
    const eave = [onL(x, yd, 0, w, h - 1.4, h), onR(xw, y, 0, d, h - 1.4, h)];
    const S = [0.25, 0.5, 0.75];
    if (roof === "x") {
      for (const s of S) tiles.push([P(x, yd - s * d / 2, h + s * rh), P(xw, yd - s * d / 2, h + s * rh)]);
      ridge.push([P(x, y + d / 2, h + rh), P(xw, y + d / 2, h + rh)], [P(xw, yd, h), P(xw, y + d / 2, h + rh), P(xw, y, h)]);
    } else if (roof === "y") {
      for (const s of S) tiles.push([P(xw - s * w / 2, y, h + s * rh), P(xw - s * w / 2, yd, h + s * rh)]);
      ridge.push([P(x + w / 2, y, h + rh), P(x + w / 2, yd, h + rh)], [P(x, yd, h), P(x + w / 2, yd, h + rh), P(xw, yd, h)]);
    } else {
      const A = P(x + w / 2, y + d / 2, h + rh), a = P(x, yd, h), b = P(xw, yd, h), c = P(xw, y, h);
      for (const s of S) tiles.push([mix(a, A, s), mix(b, A, s), mix(c, A, s)]);
      ridge.push([a, A, c], [A, b]);
    }
    return [shapes("eave", eave), shapes("hwin", dark), shapes("hwin hwin-lit", lit), strokes("sill", sills), strokes("tiles", tiles), strokes("ridge", ridge)];
  }
  // An open transit canopy on its platform (z 1): a glass wall at the back,
  // posts front and back, benches, people waiting, a lit roof on top. It is
  // street furniture, so it stays at street level when the district comes apart.
  const canopy = (x, y, w, d) => {
    const xs = [x + 0.05, x + w / 2, x + w - 0.05], post = (px, py) => seg("det", P(px, py, 1), P(px, py, 9));
    return [
      item(x + y + 0.1, xs.map((px) => post(px, y + 0.04)), poly("glass", [P(x + 0.05, y + 0.04, 1), P(x + w - 0.05, y + 0.04, 1), P(x + w - 0.05, y + 0.04, 8.4), P(x + 0.05, y + 0.04, 8.4)])),
      use("bench", x + 0.3, y + 0.12, 1, { cls: "fine", d: x + y + 0.5 }), use("bench", x + w - 0.5, y + 0.12, 1, { cls: "fine", d: x + w + y - 0.2 }),
      who(x + 0.55, y + 0.3, "#e7fff9", { z: 1 }), who(x + 0.68, y + 0.34, "#f2c14e", { z: 1 }), who(x + w - 0.3, y + 0.28, "#38bdf8", { z: 1 }),
      item(x + w + y + d - 0.01, xs.map((px) => post(px, y + d - 0.04))),
      box(x, y, w, d, 2.4, { z: 9, top: "lit", cls: "white" }),
    ].map(lo);
  };
  // a flat roof in sheeting: ribs running across it, painted with the block
  const ribbed = (b, x, y, w, d, h) => {
    const ribs = [];
    for (let k = x + 0.1; k < x + w - 0.02; k += 0.1) ribs.push([P(k, y, h), P(k, y + d, h)]);
    b.nodes.push(strokes("ribs", ribs));
    return b;
  };
  const arms = [];
  function cyl(cx, cy, r, h, o = {}) {
    const z = o.z || 0, rx = r * TW / Math.SQRT2, ry = r * TH / Math.SQRT2, c = o.cls ? ` ${o.cls}` : "";
    const [bx, by] = P(cx, cy, z), [, ty] = P(cx, cy, z + h);
    if (cast && !z && h >= 4) cast.push(castOf(round(cx, cy, r), h));
    const nodes = [
      el("path", { class: "fr" + c, d: `M${f(bx - rx)} ${f(ty)}L${f(bx - rx)} ${f(by)}A${f(rx)} ${f(ry)} 0 0 0 ${f(bx + rx)} ${f(by)}L${f(bx + rx)} ${f(ty)}Z` }),
      el("path", { class: "fl" + c, d: `M${f(bx - rx)} ${f(ty)}L${f(bx - rx)} ${f(by)}A${f(rx)} ${f(ry)} 0 0 0 ${f(bx)} ${f(by + ry)}L${f(bx)} ${f(ty + ry)}A${f(rx)} ${f(ry)} 0 0 1 ${f(bx - rx)} ${f(ty)}Z` }),
      el("ellipse", { class: (o.top || "ft") + c, cx: f(bx), cy: f(ty), rx: f(rx), ry: f(ry) }),
    ];
    if (o.dome) nodes.push(el("path", { class: "ft dome", d: `M${f(bx - rx)} ${f(ty)}A${f(rx)} ${f(rx * 0.55)} 0 0 1 ${f(bx + rx)} ${f(ty)}Z` }));
    if (o.cap) nodes.push(poly("fr", [[bx - rx, ty], [bx + rx, ty], [bx, ty - rx * 0.7]]));
    if (o.water) nodes.push(el("ellipse", { class: `wtr ${o.water === true ? "" : o.water}`, cx: f(bx), cy: f(ty), rx: f(rx * 0.82), ry: f(ry * 0.82) }));
    if (o.ring) nodes.push(el("ellipse", { class: "det", cx: f(bx), cy: f(ty), rx: f(rx * 0.6), ry: f(ry * 0.6) }));
    // the front half of a ring round the shell at height zz above the base
    const arc = (zz) => `M${f(bx - rx)} ${f(by - zz)}A${f(rx)} ${f(ry)} 0 0 0 ${f(bx + rx)} ${f(by - zz)}`;
    if (h >= 4) nodes.push(el("path", { class: "rim-hl", d: arc(h) }));
    if (o.bands) nodes.push(el("path", { class: "seam", d: Array.from({ length: o.bands }, (_, i) => arc(h * (i + 1) / (o.bands + 1))).join("") }));
    if (o.stripes) nodes.push(el("path", { class: "stripe", d: o.stripes.map((zz) => arc(h - zz)).join("") }));
    if (o.rail) nodes.push(el("ellipse", { class: "tank-rail", cx: f(bx), cy: f(ty - 3), rx: f(rx * 0.94), ry: f(ry * 0.94) }), el("path", { class: "tank-rail", d: [-0.7, -0.25, 0.25, 0.7].map((k) => `M${f(bx + rx * 0.94 * k)} ${f(ty + ry * 0.94 * Math.sqrt(1 - k * k))}v-3`).join("") }));
    if (o.arm) {
      const arm = el("line", { class: "arm" });
      arms.push({ arm, cx, cy, r: r * 0.8, z: z + h, phase: (cx * 7 + cy * 3) % 6 });
      nodes.push(arm);
    }
    return { d: cx + cy + r * 1.42 + (o.bias || 0), nodes };
  }
  const slab = (x, y, w, d, cls, z = 0, extra) => lo(item(x + w + y + d - 0.5, poly(cls, [P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], extra)));
  // (the contact shadows this once drew are cast by box() and cyl() now)
  const ao = () => item(0);
  // `s` says which layer a part travels with when its district is taken
  // apart: "lo" stays at street level (trees, lamps, cars, fences), anything
  // else lifts with the structures. Symbols placed on a roof lift too.
  const use = (sym, x, y, z = 0, o = {}) => {
    const [px, py] = P(x, y, z);
    let style = o.style;
    if (!style && sym.startsWith("car-")) style = `--car:${CARS[turns.car++ % CARS.length]}`;
    if (!style && sym === "bin") style = `--lid:${LIDS[turns.bin++ % LIDS.length]}`;
    if (!style && sym === "parasol") style = `--para:${PARAS[turns.para++ % PARAS.length]}`;
    return { ...item(o.d ?? x + y + 0.05, el("use", { href: `#${sym}`, class: o.cls, transform: `translate(${f(px)} ${f(py)})`, style })), s: z > 0.5 ? "hi" : "lo" };
  };
  const lo = (it) => ({ ...it, s: "lo" });
  // a fence or railing: the top rail at height z, a post every `posts` tiles
  function rail(points, z, o = {}) {
    const c = o.cls ? ` ${o.cls}` : "", nodes = [pl("rail" + c, points.map(([x, y]) => P(x, y, z)))], posts = [];
    if (o.posts) for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i], [x1, y1] = points[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / o.posts));
      for (let k = i ? 1 : 0; k <= n; k++) {
        const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        posts.push([P(x, y), P(x, y, z)]);
      }
    }
    // a mid rail halfway up, on fences and railings alike
    if (o.posts && !/pipe-rack/.test(o.cls || "")) nodes.push(pl("rail mid" + c, points.map(([x, y]) => P(x, y, z / 2))));
    nodes.push(strokes("post" + c, posts));
    return { d: o.d ?? Math.max(...points.map(([x, y]) => x + y)), nodes, s: /fence/.test(o.cls || "") ? "lo" : "hi" };
  }
  const pipeline = (points, z, cls, d) => item(d ?? Math.max(...points.map(([x, y]) => x + y)), pl(cls, points.map(([x, y]) => P(x, y, z))));
  const line = (cls, a, d) => item(d, pl(cls, a));
  const flat = (cls, a, d, extra) => item(d, poly(cls, a, extra));
  const tree = (x, y, s = "m", o = {}) => use(`tree-${s}`, x, y, 0, { d: x + y + 0.1, ...o });
  const gum = (x, y) => use("tree-gum", x, y, 0, { d: x + y + 0.1 });
  const jac = (x, y) => use("tree-jac", x, y, 0, { d: x + y + 0.1 });
  // a person, in their own --shirt
  const who = (x, y, shirt, o = {}) => use("person", x, y, o.z || 0, { d: o.d ?? x + y + 0.06, style: `--shirt:${shirt}`, cls: "fine" });
  const manhole = (x, y, o = {}) => {
    const [cx, cy] = P(x, y);
    return lo(item(x + y, el("ellipse", { class: "mh", cx: f(cx), cy: f(cy), rx: 6, ry: 3 }), el("ellipse", { class: "mh-ring", cx: f(cx), cy: f(cy), rx: 3.4, ry: 1.7 }), o.open && [
      el("ellipse", { class: "mh-open", cx: f(cx), cy: f(cy), rx: 5, ry: 2.5 }),
      ...[0, 1, 2].map((i) => seg("det fine", [cx - 4 + i * 4, cy - 1 + i * 0.4], [cx - 4 + i * 4, cy + 1.6 + i * 0.4])),
    ]));
  };

  /* ---- sensors ---- */
  // a ping at the instrument, a hit target for the pointer, a callout pill for
  // the main instruments and the alarm glyph for the level alarm
  const sensorNodes = {};
  function sensor(s, i, ui) {
    const [x, y, z] = s.at, [cx, cy] = P(x, y, z), g = el("g", { class: "sensor", "data-sensor": s.id, "data-layer": s.layer || "street", style: `--i:${i}` });
    el("circle", { class: "ping", cx: f(cx), cy: f(cy), r: 5, style: `--d:${(i * 0.45 + x * 0.1) % 2.6}` }, g);
    el("circle", { class: "ping-dot", cx: f(cx), cy: f(cy), r: 2.4 }, g);
    // every instrument gets a name pill. The main ones show whenever the
    // district is lifted; the rest only in the expanded view, where each
    // pill also carries its latest reading (city.js fills and fits them).
    const w = Math.round(s.name.length * 5.6 + 20) + (s.alarm ? 46 : 0);
    const c = el("g", { class: `callout${s.major ? "" : " minor"}` }, g);
    c.append(seg("callout-line", [cx, cy - 4], [cx, cy - 15]));
    el("rect", { x: f(cx - w / 2), y: f(cy - 33), width: w, height: 18, rx: 9 }, c);
    const t = el("text", { x: f(cx), y: f(cy - 20.5), "text-anchor": "middle" }, c);
    el("tspan", { class: "cs-name" }, t).textContent = s.name;
    if (s.alarm) el("tspan", { class: "cs-state" }, t).textContent = ` · ${ui.states.normal}`;
    el("tspan", { class: "cs-val" }, t);
    if (s.alarm) {
      // a siren above the unit, drawn in the Lucide stroke style
      const a = el("g", { class: "alarm", transform: `translate(${f(cx)} ${f(cy - 44)})` }, g);
      el("path", { d: "M-5 2a5 5 0 0 1 10 0v3h-10z" }, a);
      el("path", { d: "M-7 5h14M-9 -3l2 1M9 -3l-2 1M0 -7v2" }, a);
    }
    el("circle", { class: "hit", cx: f(cx), cy: f(cy), r: 11 }, g);
    sensorNodes[s.id] = g;
    return g;
  }

  /* ---- cutaways on a district's front edge ---- */
  function cutaway(zone, items) {
    const [, , , y1] = zone.rect, out = [];
    for (const it of items) {
      const [cx, cy] = P(it.x, y1, -5.5);
      if (it.type === "pipe") out.push(el("circle", { class: "cut-pipe", cx: f(cx), cy: f(cy), r: 3.6 }), el("ellipse", { class: "cut-water", cx: f(cx), cy: f(cy + 1.6), rx: 2.6, ry: 1.4 }));
      if (it.type === "well") out.push(el("rect", { class: "cut-pipe", x: f(cx - 6), y: f(cy - 5), width: 12, height: 10, rx: 1 }), el("rect", { class: "cut-well", x: f(cx - 5), y: f(cy - 1), width: 10, height: 5 }));
      if (it.type === "bed") out.push(poly("cut-bed", [P(it.x0, y1, 0), P(it.x1, y1, 0), P(it.x1, y1, -10), P(it.x0, y1, -10)]));
    }
    return out;
  }

  /* ---- defs ---- */
  function defs(svg, data) {
    const D = el("defs", {}, svg);
    const sym = (id, fn) => { const g = el("g", { id }, D); fn(g); return g; };
    const F = (color) => `fill:${color}`;
    // a palette colour that a lifted district mixes toward its highlight, like the faces do
    const FM = (v) => `fill:color-mix(in oklab, var(${v}), var(--lit-mix, #eefcf8) var(--lift, 0%))`;
    // trees: a contact shadow on the ground, the canopy shaded on its far
    // side and caught by the light on its near one
    const SHADE = F("rgba(0,0,0,.2)"), SHEEN = F("rgba(255,255,255,.13)");
    for (const [k, s] of [["s", 0.72], ["m", 1], ["l", 1.3]]) sym(`tree-${k}`, (g) => {
      el("ellipse", { cx: f(2 * s), cy: 0.6, rx: f(5.6 * s), ry: f(2.3 * s), style: SHADE }, g);
      g.append(seg("", [0, 0], [0, -6 * s], { style: "stroke:var(--detail);stroke-width:1" }));
      el("circle", { cx: 0, cy: f(-9 * s), r: f(7 * s), style: FM("--tree-2") }, g);
      el("circle", { cx: f(2.8 * s), cy: f(-7.2 * s), r: f(4 * s), style: F("rgba(0,0,0,.12)") }, g);
      el("circle", { cx: -1.5, cy: f(-13 * s), r: f(5 * s), style: FM("--tree") }, g);
      el("circle", { cx: f(-3.4 * s), cy: f(-15 * s), r: f(2.1 * s), style: SHEEN }, g);
    });
    // a street light on a pole with an arm, the head over the road
    sym("lamp", (g) => {
      el("ellipse", { class: "pool", cx: 0, cy: 0, rx: 13, ry: 6.5, style: F("var(--pool, url(#pool))") }, g);
      g.append(pl("", [[0, 0], [0, -15], [2.2, -16.2]], { style: "fill:none;stroke:rgba(255,255,255,.3);stroke-width:1" }));
      el("ellipse", { cx: 2.4, cy: -16, rx: 2, ry: 1.1, style: F("#fff1c9") }, g);
    });
    // vehicles: one symbol per direction of travel, so the beam leads
    const vehicle = (id, len, wid, h, cols, dir, o = {}) => sym(id, (g) => {
      const x = -len / 2, y = -wid / 2, w = len, d = wid;
      const beam = { e: [P(x + w, y, 2), P(x + w, y + d, 2), P(x + w + 0.42, y + d + 0.1, 0), P(x + w + 0.42, y - 0.1, 0), "url(#beam)"],
        w: [P(x, y, 2), P(x, y + d, 2), P(x - 0.42, y + d + 0.1, 0), P(x - 0.42, y - 0.1, 0), "url(#beam-r)"],
        s: [P(x, y + d, 2), P(x + w, y + d, 2), P(x + w + 0.1, y + d + 0.42, 0), P(x - 0.1, y + d + 0.42, 0), "url(#beam-r)"],
        n: [P(x, y, 2), P(x + w, y, 2), P(x + w + 0.1, y - 0.42, 0), P(x - 0.1, y - 0.42, 0), "url(#beam)"] }[dir];
      if (beam) g.append(poly("beam", beam.slice(0, 4), { style: F(beam[4]) }));
      const bh = o.cabin ? h * 0.62 : h, b = box(x, y, w, d, bh);
      b.nodes[0].style.fill = cols[1]; b.nodes[1].style.fill = cols[2]; b.nodes[2].style.fill = cols[0];
      g.append(...b.nodes);
      if (o.cabin) {
        // a glasshouse set back from the bonnet: dark glass all round, the
        // roof in the body colour, a pillar between the windows
        const along = w >= d, n = along ? w : d, t0 = { e: 0.14, s: 0.14, w: 0.36, n: 0.36 }[dir] ?? 0.25, i = 0.012;
        const c = along ? box(x + n * t0, y + i, n * 0.5, d - 2 * i, h - bh, { z: bh }) : box(x + i, y + n * t0, w - 2 * i, n * 0.5, h - bh, { z: bh });
        c.nodes[0].style.fill = "#101d24"; c.nodes[1].style.fill = "#1a2c35"; c.nodes[2].style.fill = cols[0];
        g.append(...c.nodes);
        const m = along ? seg("", P(x + n * (t0 + 0.25), y + d - i, bh), P(x + n * (t0 + 0.25), y + d - i, h)) : seg("", P(x + w - i, y + n * (t0 + 0.25), bh), P(x + w - i, y + n * (t0 + 0.25), h));
        m.style.cssText = `stroke:${cols[0]};stroke-width:.5`;
        g.append(m);
      }
      if (o.eds) {
        // EDS livery: a teal panel along the long side carrying the EDS logo
        // (the sun-and-wave mark and the wordmark, drawn as vectors and skewed
        // into the face, so they stay sharp at any zoom), a teal band across
        // the end, and a roof beacon whose colour is --vb, which flashes amber
        // while a storm is on (site.css)
        const alongX = w >= d, z0 = 0.7, z1 = h - 1.15;
        const face = alongX ? (t, z) => P(x + w * t, y + d, z) : (t, z) => P(x + w, y + d * (1 - t), z);
        g.append(poly("", [face(0.05, z0), face(0.95, z0), face(0.95, z1), face(0.05, z1)], { style: F("#0d7c72") }));
        g.append(poly("", alongX ? [P(x + w, y, z0), P(x + w, y + d, z0), P(x + w, y + d, z1), P(x + w, y, z1)] : [P(x, y + d, z0), P(x + w, y + d, z0), P(x + w, y + d, z1), P(x, y + d, z1)], { style: F("#119284") }));
        const [ox, oy] = face(0.12, 1.2), logo = el("g", { transform: `matrix(0.894 ${alongX ? 0.447 : -0.447} 0 1 ${f(ox)} ${f(oy)})` }, g);
        const ink = "fill:none;stroke:#ffffff;stroke-width:.42;stroke-linecap:round";
        el("path", { d: "M.3 -1.5a1.05 1.05 0 0 1 2.1 0", style: ink }, logo);
        el("path", { d: "M0 -.35q.55 -.5 1.1 0t1.1 0", style: ink }, logo);
        el("text", { x: 3, y: 0, style: 'font:800 3.15px Geist, "Helvetica Neue", Arial, sans-serif;letter-spacing:-.06px;fill:#ffffff' }, logo).textContent = "EDS";
        const [, by] = P(0, 0, h);
        el("rect", { x: -2, y: f(by - 2.4), width: 4, height: 2.2, rx: 0.9, style: F("var(--vb, #6fcfc1)") }, g);
        // the end the viewer sees: a windscreen when it is the front, windows in the back doors when not
        const end = alongX ? (a, b, z0, z1) => onR(x + w, y, a * d, b * d, z0, z1) : (a, b, z0, z1) => onL(x, y + d, a * w, b * w, z0, z1);
        g.append(dir === "e" || dir === "s" ? poly("", end(0.08, 0.92, h * 0.56, h * 0.88), { style: F("#0c2422") }) : shapes("", [end(0.1, 0.46, h * 0.56, h * 0.84), end(0.54, 0.9, h * 0.56, h * 0.84)], { style: F("#0c2422") }));
      }
      const tail = { e: [[x, y + d * 0.25], [x, y + d * 0.75]], w: [[x + w, y + d * 0.25], [x + w, y + d * 0.75]], s: [[x + w * 0.25, y], [x + w * 0.75, y]], n: [[x + w * 0.25, y + d], [x + w * 0.75, y + d]] }[dir];
      if (tail) for (const [tx, ty] of tail) { const [a, c] = P(tx, ty, h * 0.5); el("circle", { cx: f(a), cy: f(c), r: 0.9, style: F("var(--red)") }, g); }
    });
    const CAR = ["var(--car, #2f8d84)", "color-mix(in oklab, var(--car, #2f8d84), #0a1b24 48%)", "color-mix(in oklab, var(--car, #2f8d84), #0a1b24 26%)"], VAN = ["#f1fffc", "#6fcfc1", "#a9ebe1"], TRK = ["#9ca9ad", "#3b474b", "#5a6a6f"];
    vehicle("car-e", 0.3, 0.16, 4.2, CAR, "e", { cabin: true }); vehicle("car-w", 0.3, 0.16, 4.2, CAR, "w", { cabin: true }); vehicle("car-s", 0.16, 0.3, 4.2, CAR, "s", { cabin: true }); vehicle("car-n", 0.16, 0.3, 4.2, CAR, "n", { cabin: true });
    // the EDS vans, a little larger than the cars to carry the logo
    vehicle("van-e", 0.4, 0.19, 5.6, VAN, "e", { eds: true }); vehicle("van-w", 0.4, 0.19, 5.6, VAN, "w", { eds: true }); vehicle("van-s", 0.19, 0.4, 5.6, VAN, "s", { eds: true }); vehicle("van-n", 0.19, 0.4, 5.6, VAN, "n", { eds: true });
    vehicle("van-x", 0.4, 0.19, 5.6, VAN, "", { eds: true }); vehicle("van-y", 0.19, 0.4, 5.6, VAN, "", { eds: true });
    // light rail: a two-car tram with a dark window band and a pantograph
    for (const dir of ["e", "w"]) sym(`tram-${dir}`, (g) => {
      const b = box(-0.55, -0.1, 1.1, 0.2, 8);
      b.nodes[0].style.fill = "#c9dbd7"; b.nodes[1].style.fill = "#dfeae8"; b.nodes[2].style.fill = "#eef6f4";
      g.append(...b.nodes, poly("", [P(-0.55, 0.1, 4.2), P(0.55, 0.1, 4.2), P(0.55, 0.1, 6.6), P(-0.55, 0.1, 6.6)], { style: F("#123b37") }), seg("", P(0, 0.1, 0.6), P(0, 0.1, 7.6), { style: "stroke:#8aa7a2;stroke-width:1" }));
      g.append(pl("", [P(-0.08, 0, 8), P(0.02, 0, 12.5), P(0.12, 0, 8)], { style: "fill:none;stroke:rgba(255,255,255,.6);stroke-width:.9" }));
      // pillars between the panes, two doors on each car, glass across the end
      g.append(strokes("", [-0.44, -0.33, -0.22, -0.11, 0.11, 0.22, 0.33, 0.44].map((k) => [P(k, 0.1, 4.2), P(k, 0.1, 6.6)]), { style: "fill:none;stroke:#c9dbd7;stroke-width:.5" }));
      g.append(strokes("", [-0.36, -0.2, 0.2, 0.36].map((k) => [P(k - 0.04, 0.1, 0.6), P(k - 0.04, 0.1, 6.6), P(k + 0.04, 0.1, 6.6), P(k + 0.04, 0.1, 0.6)]), { style: "fill:none;stroke:#8aa7a2;stroke-width:.5" }));
      g.append(poly("", onR(0.55, -0.1, 0.03, 0.17, 4.2, 7), { style: F("#123b37") }));
      const [lx, ly] = P(dir === "e" ? 0.55 : -0.55, 0, 3); el("circle", { cx: f(lx), cy: f(ly), r: 1.1, style: F("#fff7d6") }, g);
    });
    // trucks: a box body and, ahead of it, a lower cab with a windscreen
    const truck = (id, along, len, wid, h) => sym(id, (g) => {
      const x = along ? -len / 2 : -wid / 2, y = along ? -wid / 2 : -len / 2, cab = 0.13, gap = 0.015;
      const paint = (b, cols) => { b.nodes.forEach((n, i) => (n.style.fill = cols[i])); g.append(...b.nodes); return b; };
      if (along) {
        // heading +x: the body behind, the cab nearer the viewer
        paint(box(x, y, len - cab - gap, wid, h), [TRK[1], TRK[2], TRK[0]]);
        paint(box(x + len - cab, y, cab, wid, h * 0.72), [TRK[1], TRK[2], "#c6d1d4"]);
        g.append(poly("", onR(x + len, y, 0.02, wid - 0.02, h * 0.42, h * 0.68), { style: F("#0c2422") }), poly("", onL(x + len - cab, y + wid, 0.02, cab - 0.03, h * 0.42, h * 0.68), { style: F("#0c2422") }));
      } else {
        // heading -y: the beam, then the cab, which is farther away
        g.append(poly("beam", [P(x, y, 2), P(x + wid, y, 2), P(x + wid + 0.1, y - 0.42, 0), P(x - 0.1, y - 0.42, 0)], { style: F("url(#beam)") }));
        paint(box(x, y, wid, cab, h * 0.72), [TRK[1], TRK[2], "#c6d1d4"]);
        paint(box(x, y + cab + gap, wid, len - cab - gap, h), [TRK[1], TRK[2], TRK[0]]);
        g.append(poly("", onR(x + wid, y, 0.02, cab - 0.03, h * 0.42, h * 0.68), { style: F("#0c2422") }));
      }
      // ribs down the body's long side
      const n = 5, side = along ? (t) => onL(x + (len - cab) * t, y + wid, 0, 0.012, 1, h - 0.6) : (t) => onR(x + wid, y + cab + (len - cab) * t, 0, 0.012, 1, h - 0.6);
      g.append(shapes("", Array.from({ length: n - 1 }, (_, i) => side((i + 1) / n)), { style: F("rgba(0,0,0,.18)") }));
      if (!along) for (const t of [0.25, 0.75]) { const [tx, ty] = P(x + wid * t, y + len, h * 0.25); el("circle", { cx: f(tx), cy: f(ty), r: 0.9, style: F("var(--red)") }, g); }
    });
    truck("truck-n", false, 0.5, 0.2, 8); truck("truck-x", true, 0.5, 0.2, 7);
    // A low white roadster, unbadged, for the occasional stunt (city.js),
    // drawn in full rather than as a box: a wedge body lower at the nose, a
    // glasshouse with a raked windscreen, four wheels with rims and hubs, a
    // shoulder line and door seam, a full-width light bar across the nose
    // and a red one across the tail. `at(t, s, z)` places a point by length
    // (0 tail to 1 nose), across (0 far side to 1 near side) and height, so
    // one drawing serves all four directions.
    const roadster = (dir) => sym(`roadster-${dir}`, (g) => {
      const ew = dir === "e" || dir === "w", fwd = dir === "e" || dir === "s", L = 0.44, W = 0.19;
      const at = (t, s, z) => { const u = (fwd ? t : 1 - t) * L - L / 2, v = s * W - W / 2; return ew ? P(u, v, z) : P(v, u, z); };
      const h = (t) => 3.4 - 1.7 * t, end = fwd ? 1 : 0, put = (pts, fill, extra = "") => g.append(poly("", pts, { style: `fill:${fill};${extra}` }));
      const line = (a, b, stroke, w = 0.7) => g.append(seg("", a, b, { style: `stroke:${stroke};stroke-width:${w};stroke-linecap:round` }));
      // the beam on the road ahead
      put([at(1, -0.1, 0), at(1.9, -0.25, 0), at(1.9, 1.25, 0), at(1, 1.1, 0)], fwd === ew ? "url(#beam)" : "url(#beam-r)", "opacity:.8");
      // the body: the visible end, the near side, the wedge top
      put([at(end, 0, 0), at(end, 1, 0), at(end, 1, h(end)), at(end, 0, h(end))], "#dfe9e7");
      put([at(0, 1, 0), at(1, 1, 0), at(1, 1, h(1)), at(0, 1, h(0))], "#c3d0ce");
      put([at(0.03, 1, 0), at(0.97, 1, 0), at(0.97, 1, 0.8), at(0.03, 1, 0.8)], "#33403f");
      put([at(0, 0, h(0)), at(1, 0, h(1)), at(1, 1, h(1)), at(0, 1, h(0))], "#f7fbfa");
      line(at(0.05, 1, h(0.05) - 0.7), at(0.95, 1, h(0.95) - 0.45), "#eef5f4", 0.5);
      line(at(0.5, 1, 0.9), at(0.5, 1, h(0.5) - 0.5), "rgba(40,60,58,.45)", 0.4);
      // the glasshouse: roof and raked windscreen (whichever faces away goes first), then the side glass
      const roofT = 2.3, r0 = 0.3, r1 = 0.55, w1 = 0.74, glass = "#0f1f1e";
      const roof = () => put([at(r0, 0.17, h(r0) + roofT), at(r1, 0.17, h(r1) + roofT), at(r1, 0.83, h(r1) + roofT), at(r0, 0.83, h(r0) + roofT)], "#1b2e2c");
      const screen = () => { put([at(r1, 0.17, h(r1) + roofT), at(w1, 0.12, h(w1)), at(w1, 0.88, h(w1)), at(r1, 0.83, h(r1) + roofT)], glass); line(at(r1 + 0.04, 0.3, h(r1) + roofT - 0.4), at(w1 - 0.05, 0.42, h(w1) + 0.3), "rgba(160,205,198,.7)", 0.45); };
      fwd ? (roof(), screen()) : (screen(), roof());
      put([at(r0 - 0.05, 0.83, h(r0 - 0.05)), at(w1, 0.88, h(w1)), at(r1, 0.83, h(r1) + roofT), at(r0, 0.83, h(r0) + roofT)], glass);
      line(at(r0 + 0.02, 0.84, h(r0) + roofT - 0.5), at(r1 - 0.02, 0.84, h(r1) + roofT - 0.5), "rgba(160,205,198,.55)", 0.4);
      // the wheels on the near side: tyre, rim, hub
      const ring = (t0, z0, r, n = 18) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return at(t0 + Math.cos(a) * r / 31.3 / L, 1.02, z0 + Math.sin(a) * r); });
      for (const t0 of [0.2, 0.8]) { put(ring(t0, 1.9, 1.9), "#0a1211"); put(ring(t0, 1.9, 1.15), "#a9b8b6"); put(ring(t0, 1.9, 0.45), "#2a3635"); }
      // the light bars: white across the nose, red across the tail, wrapping round the near side
      // the nose's bar sits in a dark band so it reads as light against the white body
      if (fwd) put([at(1, 0.05, 0.55), at(1, 0.95, 0.55), at(1, 0.95, 1.7), at(1, 0.05, 1.7)], "#14201f");
      line(at(end, 0.08, fwd ? 1.12 : 2.7), at(end, 0.92, fwd ? 1.12 : 2.7), fwd ? "#f2fffc" : "#ff3b4a", fwd ? 0.7 : 0.9);
      line(at(0.94, 1, 1.15), at(1, 1, 1.15), "#ffffff", 0.9);
      line(at(0, 1, 2.7), at(0.06, 1, 2.7), "#ff3b4a", 0.9);
    });
    for (const dir of ["e", "w", "n", "s"]) roadster(dir);
    sym("cone", (g) => { g.append(poly("", [[-2.2, 0], [2.2, 0], [0, -6]], { style: F("var(--amber)") }), seg("", [-3, 0.5], [3, 0.5], { style: "stroke:#06201e;stroke-width:1.2" })); });
    // people: legs, a top in --shirt (set on each one), a head, a small shadow
    sym("person", (g) => {
      el("ellipse", { cx: 0.8, cy: 0.2, rx: 2.2, ry: 0.8, style: SHADE }, g);
      g.append(shapes("", [[[-1.2, 0], [-0.2, 0], [-0.2, -2.8], [-1.2, -2.8]], [[0.2, 0], [1.2, 0], [1.2, -2.8], [0.2, -2.8]]], { style: F("var(--legs, #2b3a4a)") }));
      el("rect", { x: -1.4, y: -6.2, width: 2.8, height: 3.8, rx: 1.1, style: F("var(--shirt, #f2c14e)") }, g);
      el("circle", { cx: 0, cy: -7.7, r: 1.6, style: F("var(--skin, #ffe3b3)") }, g);
    });
    // an EDS crew member: hi-vis orange with a reflective band and a white hard hat
    sym("crew", (g) => {
      el("ellipse", { cx: 0.8, cy: 0.2, rx: 2.3, ry: 0.8, style: SHADE }, g);
      g.append(shapes("", [[[-1.3, 0], [-0.2, 0], [-0.2, -2.8], [-1.3, -2.8]], [[0.2, 0], [1.3, 0], [1.3, -2.8], [0.2, -2.8]]], { style: F("#1e3a5f") }));
      el("rect", { x: -1.5, y: -6.2, width: 3, height: 3.9, rx: 1.1, style: F("#f97316") }, g); el("rect", { x: -1.5, y: -4.3, width: 3, height: 0.8, style: F("#fff4e5") }, g);
      el("circle", { cx: 0, cy: -7.8, r: 1.6, style: F("#ffe3b3") }, g); el("path", { d: "M-2.1 -8.3a2.1 1.8 0 0 1 4.2 0z", style: F("#ffffff") }, g);
    });
    // a gum tree: pale trunk, open clumps of grey-green leaves; and a jacaranda
    sym("tree-gum", (g) => {
      const bark = "fill:none;stroke:var(--bark,#c9c1ad);stroke-linecap:round;stroke-width:";
      el("ellipse", { cx: 2.4, cy: 0.6, rx: 6, ry: 2.4, style: SHADE }, g);
      g.append(pl("", [[0, 0], [0.5, -7], [0.2, -13.5]], { style: `${bark}1.4` }), seg("", [0.4, -8], [-2.8, -12.6], { style: `${bark}.9` }), seg("", [0.3, -10.5], [3, -14.2], { style: `${bark}.9` }));
      [[-3.1, -14.6, 3.8, 2.6, "--gum-2"], [3.3, -15.6, 3.6, 2.5, "--gum-2"], [0.4, -18.6, 4.3, 3, "--gum"], [-2.3, -17.2, 2.8, 2, "--gum"], [2.6, -13.3, 2.4, 1.7, "--gum"]].forEach(([cx, cy, rx, ry, v]) => el("ellipse", { cx, cy, rx, ry, style: FM(v) }, g));
    });
    sym("tree-jac", (g) => {
      el("ellipse", { cx: 2, cy: 0.6, rx: 6, ry: 2.4, style: SHADE }, g);
      g.append(seg("", [0, 0], [0, -6], { style: "stroke:var(--detail);stroke-width:1.1" }));
      el("ellipse", { cx: 0, cy: -9, rx: 7.6, ry: 4.6, style: FM("--jac-2") }, g); el("ellipse", { cx: -1, cy: -11, rx: 5.4, ry: 3.4, style: FM("--jac") }, g);
      // a few fallen flowers on the ground
      el("ellipse", { cx: 4.5, cy: 1.4, rx: 2.6, ry: 1, style: F("var(--jac)"), opacity: 0.35 }, g);
      el("ellipse", { cx: -2.8, cy: -12, rx: 2, ry: 1.2, style: SHEEN }, g);
    });
    sym("tank-rw", (g) => {
      const c = cyl(0, 0, 0.11, 9);
      ["#8d999b", "#b4bfc1", "#e2e8e9"].forEach((col, i) => (c.nodes[i].style.fill = col));
      g.append(...c.nodes);
      const rx = 0.11 * TW / Math.SQRT2, ry = 0.11 * TH / Math.SQRT2;
      for (const z of [3, 6]) el("path", { d: `M${f(-rx)} ${-z}a${f(rx)} ${f(ry)} 0 0 0 ${f(2 * rx)} 0`, style: "fill:none;stroke:rgba(0,0,0,.22);stroke-width:.7" }, g);
    });
    sym("hoist", (g) => {
      const st = "stroke:#c9d1d3;stroke-width:.8;fill:none", top = [0, -9], tips = [P(0.17, 0), P(0, 0.17), P(-0.17, 0), P(0, -0.17)].map(([a, b]) => [a, b - 9]);
      g.append(seg("", [0, 0], top, { style: "stroke:#c9d1d3;stroke-width:1" }), ...tips.map((t) => seg("", top, t, { style: st })), pl("", [...tips, tips[0]], { style: st }));
      g.append(poly("", [[tips[0][0] - 3, tips[0][1]], [tips[0][0] - 1, tips[0][1]], [tips[0][0] - 1.4, tips[0][1] + 3], [tips[0][0] - 3.2, tips[0][1] + 2.6]], { style: F("#e7fff9") }));
    });
    sym("dish", (g) => { g.append(seg("", [0, 0], [0, -3], { style: "stroke:rgba(255,255,255,.6)" })); el("ellipse", { cx: 0, cy: -5, rx: 2.4, ry: 3.4, style: F("rgba(255,255,255,.7)") }, g); });
    sym("solar", (g) => { g.append(poly("", [P(0, 0, 1), P(0.3, 0, 1), P(0.3, 0.22, 3), P(0, 0.22, 3)], { style: F("url(#solar-grad)") })); });
    sym("ac", (g) => { const b = box(0, 0, 0.14, 0.14, 3); b.nodes.forEach((n, i) => (n.style.fill = ["#d6dcdd", "#5c686b", "#8b979a"][[2, 0, 1][i]])); g.append(...b.nodes); });
    sym("chamber", (g) => { el("ellipse", { cx: 0, cy: 0, rx: 7, ry: 3.5, style: "fill:none;stroke:var(--aqua);stroke-width:1;stroke-dasharray:2 3" }, g); g.append(seg("", [-3, -1], [-3, 3], { style: "stroke:var(--aqua);stroke-width:1" }), seg("", [3, -1], [3, 3], { style: "stroke:var(--aqua);stroke-width:1" })); });
    sym("crossing-x", (g) => { for (let i = 0; i < 5; i++) g.append(poly("", [P(i * 0.11, -0.26), P(i * 0.11 + 0.055, -0.26), P(i * 0.11 + 0.055, 0.26), P(i * 0.11, 0.26)], { style: F("rgba(255,255,255,.42)") })); });
    sym("crossing-y", (g) => { for (let i = 0; i < 5; i++) g.append(poly("", [P(-0.26, i * 0.11), P(0.26, i * 0.11), P(0.26, i * 0.11 + 0.055), P(-0.26, i * 0.11 + 0.055)], { style: F("rgba(255,255,255,.42)") })); });
    sym("bench", (g) => { g.append(poly("", [P(0, 0, 3), P(0.22, 0, 3), P(0.22, 0.08, 3), P(0, 0.08, 3)], { style: F("#b07a4a") }), seg("", P(0.02, 0.04, 0), P(0.02, 0.04, 3), { style: "stroke:#8a5d36" }), seg("", P(0.2, 0.04, 0), P(0.2, 0.04, 3), { style: "stroke:#8a5d36" })); });
    sym("reed", (g) => { for (const [dx, h] of [[-1.5, 7], [0, 9], [1.5, 6]]) g.append(seg("", [dx, 0], [dx * 1.4, -h], { style: "stroke:#5fa86a;stroke-width:1" })); });
    sym("gully", (g) => { g.append(poly("", [P(0, 0), P(0.16, 0), P(0.16, 0.08), P(0, 0.08)], { style: "fill:var(--gully,#1b2427);stroke:rgba(255,255,255,.3);stroke-width:1" }), seg("", P(0.03, 0.04), P(0.13, 0.04), { style: "stroke:rgba(255,255,255,.35);stroke-width:1" })); });
    sym("pump-dome", (g) => { const c = cyl(0, 0, 0.13, 4, { dome: true }); g.append(...c.nodes); });
    // street furniture and small parts, placed by the hundred
    // council wheelie bins, dark green with a red, yellow or green lid (--lid)
    sym("bin", (g) => { const b = box(0, 0, 0.08, 0.08, 4); b.nodes.forEach((n, i) => (n.style.fill = ["#1f4d2a", "#2b6a3a", "var(--lid, #2e7d32)"][i])); g.append(...b.nodes); });
    sym("sign", (g) => { g.append(seg("", [0, 0], [0, -10], { style: "stroke:rgba(255,255,255,.55);stroke-width:1" })); el("rect", { x: -2.5, y: -14, width: 5, height: 4, rx: .6, style: F("#2f9e63") }, g); });
    sym("tlight", (g) => { g.append(seg("", [0, 0], [0, -14], { style: "stroke:rgba(255,255,255,.45);stroke-width:1.2" })); el("rect", { x: -1.6, y: -21, width: 3.2, height: 7.5, rx: .8, style: F("#06201e") }, g); [["-18.8", "var(--red)"], ["-17.2", "var(--amber)"], ["-15.6", "var(--green)"]].forEach(([y, c]) => el("circle", { cx: 0, cy: y, r: .75, style: F(c) }, g)); });
    sym("swing", (g) => { const t = P(0, 0, 9), a = P(-0.12, 0.06), b = P(0.12, -0.06), c = P(-0.12, -0.06), d = P(0.12, 0.06); g.append(seg("", a, [t[0] - 4, t[1]], { style: "stroke:#c9d1d3;stroke-width:1" }), seg("", c, [t[0] - 4, t[1]], { style: "stroke:#c9d1d3;stroke-width:1" }), seg("", b, [t[0] + 4, t[1]], { style: "stroke:#c9d1d3;stroke-width:1" }), seg("", d, [t[0] + 4, t[1]], { style: "stroke:#c9d1d3;stroke-width:1" }), seg("", [t[0] - 4, t[1]], [t[0] + 4, t[1]], { style: "stroke:#c9d1d3;stroke-width:1.2" }), seg("", [t[0] - 1.5, t[1]], [t[0] - 1.5, t[1] + 6], { style: "stroke:rgba(255,255,255,.4);stroke-width:.8" }), seg("", [t[0] + 1.5, t[1]], [t[0] + 1.5, t[1] + 6], { style: "stroke:rgba(255,255,255,.4);stroke-width:.8" })); });
    sym("rock", (g) => { g.append(poly("", [[-3, 0], [-2, -2.5], [1, -3], [3.2, -1], [2.4, 0.8], [-1.5, 1.2]], { style: F("#7a8784") })); });
    sym("pallet", (g) => { g.append(poly("", [P(0, 0, 2), P(0.14, 0, 2), P(0.14, 0.14, 2), P(0, 0.14, 2)], { style: F("#b58a55") }), poly("", [P(0, 0.14, 0), P(0.14, 0.14, 0), P(0.14, 0.14, 2), P(0, 0.14, 2)], { style: F("#7a5a35") })); });
    sym("bollard", (g) => { g.append(seg("", [0, 0], [0, -5], { style: "stroke:rgba(255,255,255,.4);stroke-width:1.2" })); el("circle", { cx: 0, cy: -5.5, r: 1, style: F("#e7fff9") }, g); });
    sym("antenna", (g) => { g.append(seg("", [0, 0], [0, -11], { style: "stroke:rgba(255,255,255,.5);stroke-width:1" }), seg("", [-3, -9], [3, -9], { style: "stroke:rgba(255,255,255,.5);stroke-width:1" }), seg("", [-2, -6.5], [2, -6.5], { style: "stroke:rgba(255,255,255,.5);stroke-width:1" })); });
    sym("flag", (g) => { g.append(seg("", [0, 0], [0, -22], { style: "stroke:rgba(255,255,255,.55);stroke-width:1" }), poly("", [[0, -22], [7, -19.5], [0, -17]], { style: F("var(--flag, #6fcfc1)") })); });
    sym("hedge", (g) => { const b = box(0, 0, 0.3, 0.07, 3); b.nodes.forEach((n) => (n.style.cssText = FM("--tree-2"))); b.nodes[2].style.cssText = FM("--tree"); g.append(...b.nodes); });
    sym("letterbox", (g) => { g.append(seg("", [0, 0], [0, -4], { style: "stroke:rgba(255,255,255,.4);stroke-width:1" })); el("rect", { x: -1.5, y: -6.5, width: 3, height: 2.5, style: F("#d8dee0") }, g); });
    // shipping containers: ribbed sides, the doors on the end
    for (const [k, top, l, r] of [["a", "#d98a52", "#7c3d16", "#a8592a"], ["b", "#6cc7bb", "#1d5f58", "#2f8d84"], ["c", "#9cb9d0", "#2f4b61", "#4b6b85"], ["d", "#c76a64", "#6a2522", "#8f3a35"]]) sym(`ctr-${k}`, (g) => {
      const b = box(0, 0, 0.36, 0.15, 5.5);
      [l, r, top].forEach((c, i) => (b.nodes[i].style.fill = c));
      g.append(...b.nodes, poly("", onL(0, 0.15, 0, 0.36, 0, 5.5), { style: F("url(#clad-l)") }), seg("", P(0.36, 0.075, 0.4), P(0.36, 0.075, 5.1), { style: "stroke:rgba(0,0,0,.4);stroke-width:.5" }));
    });
    // a roof ventilator, the kind that spins on a shed
    sym("vent", (g) => { const c = cyl(0, 0, 0.035, 2.2, { dome: true }); ["#7f9995", "#b6c8c5", "#dfe9e7", "#e7f2f0"].forEach((col, i) => (c.nodes[i].style.fill = col)); g.append(...c.nodes); });
    // a cafe table under a market umbrella
    sym("parasol", (g) => {
      el("ellipse", { cx: 1.5, cy: 0.4, rx: 5, ry: 2, style: SHADE }, g);
      g.append(seg("", [0, 0], [0, -8], { style: "stroke:rgba(255,255,255,.5);stroke-width:.6" }));
      el("ellipse", { cx: 0, cy: -3.2, rx: 2.4, ry: 1.2, style: F("#e8e3d6") }, g);
      g.append(poly("", [[-5.2, -7.6], [0, -10.4], [5.2, -7.6], [0, -5.6]], { style: F("var(--para, #f4f1e8)") }), poly("", [[-5.2, -7.6], [0, -5.6], [5.2, -7.6], [5.2, -7], [0, -5], [-5.2, -7]], { style: F("rgba(0,0,0,.2)") }));
    });
    // a kayak and its paddler, drawn heading down the lower reach
    sym("kayak", (g) => {
      const u = [0.82, 0.57], v = [-0.57, 0.82], at = (a, c, z = 0) => P(u[0] * a + v[0] * c, u[1] * a + v[1] * c, z);
      g.append(poly("", [at(-0.12, -0.02), at(-0.34, -0.07), at(-0.34, 0.07), at(-0.12, 0.02)], { style: F("rgba(255,255,255,.16)") }));
      g.append(poly("", [at(-0.13, 0, 0.8), at(-0.04, 0.032, 0), at(0.06, 0.032, 0), at(0.14, 0, 0.8), at(0.06, 0.032, 1.4), at(-0.04, 0.032, 1.4)], { style: F("#b7862a") }));
      g.append(poly("", [at(-0.13, 0, 0.8), at(-0.04, -0.032, 1.4), at(0.06, -0.032, 1.4), at(0.14, 0, 0.8), at(0.06, 0.032, 1.4), at(-0.04, 0.032, 1.4)], { style: F("#f2c14e") }));
      const [px, py] = at(0, 0, 1.4);
      g.append(seg("", at(-0.03, -0.13, 3.6), at(0.03, 0.13, 3.2), { style: "stroke:#e7fff9;stroke-width:.6;stroke-linecap:round" }));
      el("rect", { x: f(px - 1), y: f(py - 3.4), width: 2, height: 3, rx: 0.9, style: F("#ef4444") }, g);
      el("circle", { cx: f(px), cy: f(py - 4.5), r: 1.15, style: F("#ffe3b3") }, g);
    });

    // Window grids, skewed to each face: four bays by four floors per tile,
    // a slab edge at every floor, a mullion in every lit window, and three
    // lighting variants so neighbouring towers don't match. 0 is dark glass,
    // 1 a lit office, 2 a brighter one.
    const LIT = { a: "1020 0110 1001 0201", b: "0100 1002 0010 2100", c: "1101 0120 1011 0210" };
    const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    for (const side of ["l", "r"]) for (const v of ["a", "b", "c"]) {
      const p = el("pattern", { id: `win-${side}-${v}`, width: 28, height: 20, patternUnits: "userSpaceOnUse", patternTransform: `skewY(${side === "l" ? 26.565 : -26.565})` }, D);
      const cells = { 0: [], 1: [], 2: [] }, mull = [];
      LIT[v].split(" ").forEach((row, r) => [...row].forEach((k, c) => {
        cells[k].push(rect(1.1 + c * 7, 0.9 + r * 5, 4.8, 3.2));
        if (k !== "0") mull.push(rect(3.3 + c * 7, 0.9 + r * 5, 0.4, 3.2));
      }));
      p.append(shapes("", [0, 1, 2, 3].map((r) => rect(0, 4.5 + r * 5, 28, 0.5)), { style: F("rgba(255,255,255,.06)") }));
      p.append(...[["0", "rgba(6,16,24,.42)"], ["1", "rgba(255,222,160,.38)"], ["2", "rgba(255,238,200,.58)"]].map(([k, c]) => shapes("", cells[k], { style: F(c) })));
      p.append(shapes("", mull, { style: F("rgba(0,0,0,.28)") }));
    }
    // corrugated cladding: a rib every 2.4 units, skewed to each face
    for (const side of ["l", "r"]) {
      const p = el("pattern", { id: `clad-${side}`, width: 2.4, height: 10, patternUnits: "userSpaceOnUse", patternTransform: `skewY(${side === "l" ? 26.565 : -26.565})` }, D);
      el("rect", { x: 0, y: 0, width: 0.7, height: 10, style: F("rgba(0,0,0,.13)") }, p);
      el("rect", { x: 1.3, y: 0, width: 0.4, height: 10, style: F("rgba(255,255,255,.05)") }, p);
    }
    // a roller door's slats
    const slat = el("pattern", { id: "slats", width: 6, height: 1.6, patternUnits: "userSpaceOnUse", patternTransform: "skewY(26.565)" }, D);
    el("rect", { x: 0, y: 0, width: 6, height: 0.4, style: F("rgba(255,255,255,.1)") }, slat);
    // grass: tufts and darker patches, scattered so the repeat doesn't show
    const turf = el("pattern", { id: "turf", width: 23, height: 13, patternUnits: "userSpaceOnUse" }, D);
    turf.append(strokes("", [[2, 3], [5.5, 9], [9, 2], [12.5, 7], [16, 11.5], [19, 4], [21, 9.5], [7, 12]].map(([x, y]) => [[x, y], [x + 0.5, y - 1.3], [x + 1, y]]), { style: "fill:none;stroke:rgba(255,255,255,.07);stroke-width:.55" }));
    [[4, 6, 1.1], [14, 3.5, 0.8], [18, 8, 1.2], [10, 10.5, 0.7]].forEach(([cx, cy, r]) => el("ellipse", { cx, cy, rx: r * 1.8, ry: r, style: F("rgba(0,0,0,.07)") }, turf));
    // soil: stones and darker clods in the cut faces of the ground
    const soil = el("pattern", { id: "soil", width: 19, height: 9, patternUnits: "userSpaceOnUse" }, D);
    [[2, 2, 1, "rgba(255,255,255,.05)"], [9, 6, 0.8, "rgba(255,255,255,.04)"], [15, 3, 1.3, "rgba(0,0,0,.18)"], [5, 7.5, 0.9, "rgba(0,0,0,.14)"], [12.5, 1, 0.6, "rgba(255,255,255,.05)"], [17, 7, 0.7, "rgba(255,255,255,.04)"]].forEach(([cx, cy, r, c]) => el("ellipse", { cx, cy, rx: r * 1.5, ry: r, style: F(c) }, soil));
    // paving: a fine grid laid on the iso axes, a quarter tile apart
    const pave = el("pattern", { id: "pave", width: TW / 4, height: TH / 4, patternUnits: "userSpaceOnUse" }, D);
    pave.append(strokes("", [[[0, 0], [TW / 4, TH / 4]], [[0, TH / 4], [TW / 4, 0]]], { style: "fill:none;stroke:rgba(255,255,255,.035);stroke-width:.5" }));
    const bays = el("pattern", { id: "bays", width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(26.565)" }, D);
    bays.append(seg("", [0, 0], [0, 8], { style: "stroke:rgba(255,255,255,.12);stroke-width:1" }));
    const grid = el("pattern", { id: "grid", width: TW, height: TH, patternUnits: "userSpaceOnUse" }, D);
    grid.append(seg("", [0, TH / 2], [TW / 2, 0], { style: "stroke:rgba(255,255,255,.06);stroke-width:1" }), seg("", [TW / 2, 0], [TW, TH / 2], { style: "stroke:rgba(255,255,255,.06);stroke-width:1" }));

    const grad = (id, type, stops, attrs = {}) => { const g = el(type, { id, ...attrs }, D); stops.forEach(([o, c]) => el("stop", { offset: o, "stop-color": c }, g)); };
    grad("pool", "radialGradient", [[0, "rgba(255,205,130,.26)"], [1, "rgba(255,205,130,0)"]]);
    grad("pool-bright", "radialGradient", [[0, "rgba(255,226,170,.52)"], [1, "rgba(255,205,130,0)"]]);
    grad("slab-grad", "radialGradient", [[0, "#1b3733"], [1, "#0e2421"]], { cx: 0.5, cy: 0.4, r: 0.7 });
    grad("beam", "linearGradient", [[0, "rgba(255,255,255,.34)"], [1, "rgba(255,255,255,0)"]]);
    grad("beam-r", "linearGradient", [[0, "rgba(255,255,255,0)"], [1, "rgba(255,255,255,.34)"]]);
    grad("lift-shadow", "radialGradient", [[0, "rgba(0,0,0,.55)"], [1, "rgba(0,0,0,0)"]]);
    grad("hub-glow", "radialGradient", [[0, "rgba(95,180,166,.55)"], [1, "rgba(95,180,166,0)"]]);
    grad("water-sheen", "linearGradient", [[0, "rgba(255,255,255,.2)"], [1, "rgba(255,255,255,0)"]], { x1: 0, y1: 0, x2: 0, y2: 1 });
    grad("solar-grad", "linearGradient", [[0, "#2b5c8a"], [1, "#6fa6e0"]]);
    return D;
  }

  /* ---- the base: slab, roads, bridge, lamps; traffic goes to the overlay ---- */
  const S = [-0.6, -0.6, 15.6, 10.6], T = 14;
  const slabTop = [P(S[0], S[1]), P(S[2], S[1]), P(S[2], S[3]), P(S[0], S[3])];
  const ROADS = [[S[0], 4.7, S[2], 5.3], [4.7, S[1], 5.3, S[3]], [9.7, S[1], 10.3, S[3]], [7.3, 5.3, 7.9, S[3]]];
  // footpaths: both sides of every road, and round the edge of the city
  const PATHS = [
    [S[0], 4.6, S[2], 4.7], [S[0], 5.3, S[2], 5.4], [4.6, S[1], 4.7, S[3]], [5.3, S[1], 5.4, S[3]],
    [9.6, S[1], 9.7, S[3]], [10.3, S[1], 10.4, S[3]], [7.2, 5.4, 7.3, S[3]], [7.9, 5.4, 8.0, S[3]],
    [S[0], 10.06, S[2], 10.22], [15.06, S[1], 15.22, S[3]], [S[0], -0.22, S[2], -0.06], [-0.22, S[1], -0.06, S[3]],
  ];
  function base(svg, fx) {
    const g = el("g", { class: "base" }, svg);
    g.append(
      poly("slab-l", [P(S[0], S[3]), P(S[2], S[3]), P(S[2], S[3], -T), P(S[0], S[3], -T)]),
      poly("slab-r", [P(S[2], S[1]), P(S[2], S[3]), P(S[2], S[3], -T), P(S[2], S[1], -T)]),
      ...[-4, -9].map((z) => poly("strata", [P(S[0], S[3], z), P(S[2], S[3], z), P(S[2], S[3], z - 1.5), P(S[0], S[3], z - 1.5)])),
      ...[-4, -9].map((z) => poly("strata", [P(S[2], S[1], z), P(S[2], S[3], z), P(S[2], S[3], z - 1.5), P(S[2], S[1], z - 1.5)])),
      poly("soil", [P(S[0], S[3]), P(S[2], S[3]), P(S[2], S[3], -T), P(S[0], S[3], -T)]), poly("soil", [P(S[2], S[1]), P(S[2], S[3]), P(S[2], S[3], -T), P(S[2], S[1], -T)]),
      poly("slab-top", slabTop),
      pl("rim", [P(S[0], S[3]), P(S[2], S[3]), P(S[2], S[1])])
    );
    // pipes leave the slab where the mains reach its edge
    for (const [x, y] of [[5.18, S[3]], [10.18, S[3]], [S[2], 5.18], [S[2], 2.4]]) { const [cx, cy] = P(x, y, -6); el("ellipse", { class: "mh", cx: f(cx), cy: f(cy), rx: 2.8, ry: 2.2 }, g); }
    // footpaths between the districts and the kerbs, and round the edge of
    // the city, paved in slabs; the roads are laid over them at the corners
    const quad = ([x0, y0, x1, y1]) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
    const joints = [];
    for (const r of PATHS) {
      const [x0, y0, x1, y1] = r, alongX = x1 - x0 > y1 - y0;
      for (let k = alongX ? Math.ceil(x0 / 0.2) * 0.2 : Math.ceil(y0 / 0.2) * 0.2; k < (alongX ? x1 : y1); k += 0.2) joints.push(alongX ? [P(k, y0), P(k, y1)] : [P(x0, k), P(x1, k)]);
    }
    g.append(shapes("footpath", PATHS.map(quad)), strokes("joint fine", joints));
    // roads: a surface, kerbs, lane dashes and crossings
    for (const [x0, y0, x1, y1] of ROADS) g.append(poly("road", [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)]));
    // patched and worn asphalt, so the roads aren't one flat colour up close
    g.append(shapes("patch", [[2.2, 4.74, 2.85, 4.93], [8.05, 5.08, 8.6, 5.27], [12.85, 4.72, 13.3, 4.95], [4.74, 8.35, 4.95, 8.95], [9.73, 0.75, 9.98, 1.4], [10.04, 8.8, 10.27, 9.3], [7.35, 7.2, 7.55, 7.7], [14.2, 5.05, 14.9, 5.26]].map(quad)));
    g.append(strokes("wear", [4.85, 5.15].flatMap((y) => [[P(S[0], y - 0.04), P(S[2], y - 0.04)], [P(S[0], y + 0.04), P(S[2], y + 0.04)]])));
    for (const a of [[P(S[0], 4.7), P(S[2], 4.7)], [P(S[0], 5.3), P(S[2], 5.3)], [P(4.7, S[1]), P(4.7, S[3])], [P(5.3, S[1]), P(5.3, S[3])], [P(9.7, S[1]), P(9.7, S[3])], [P(10.3, S[1]), P(10.3, S[3])], [P(7.3, 5.3), P(7.3, S[3])], [P(7.9, 5.3), P(7.9, S[3])]]) g.append(pl("kerb", a));
    for (const a of [[P(-0.4, 5), P(15.4, 5)], [P(5, -0.4), P(5, 10.4)], [P(10, -0.4), P(10, 10.4)], [P(7.6, 5.4), P(7.6, 10.4)]]) g.append(pl("road-line", a));
    // the light rail's two tracks, set into the main road
    g.append(strokes("tramrail", [4.91, 4.97, 5.03, 5.09].map((y) => [P(S[0], y), P(S[2], y)])));
    for (const [sym, x, y] of [["crossing-y", 5, 4.1], ["crossing-y", 10, 5.6], ["crossing-x", 3.2, 5], ["crossing-x", 11.6, 5]]) g.append(...use(sym, x, y).nodes);
    // the river passes under the x = 5 road: a water strip, the bridge deck, railings and piers
    g.append(poly("wtr river", [P(4.6, 3.18), P(5.4, 3.45), P(5.4, 4.29), P(4.6, 4.02)]));
    g.append(poly("culvert-mouth", [P(5.4, 3.5), P(5.4, 4.25), P(5.4, 4.25, -6), P(5.4, 3.5, -6)]));
    g.append(...[0, 1].map((i) => poly("pier", [P(4.65 + i * 0.6, 3.3, 0), P(4.75 + i * 0.6, 3.3, 0), P(4.75 + i * 0.6, 4.15, 0), P(4.65 + i * 0.6, 4.15, 0)])));
    g.append(poly("road deck", [P(4.6, 3.15, 3), P(5.4, 3.15, 3), P(5.4, 4.3, 3), P(4.6, 4.3, 3)]));
    g.append(...rail([[4.68, 3.15], [4.68, 4.3]], 7, { posts: 0.25, cls: "bridge" }).nodes, ...rail([[5.32, 3.15], [5.32, 4.3]], 7, { posts: 0.25, cls: "bridge" }).nodes);
    // street lamps along every road, gully pits at the kerbs, puddles for the storm
    for (const [x, y] of [[1.0, 4.62], [2.6, 4.62], [6.0, 4.62], [8.0, 4.62], [11.2, 4.62], [13.6, 4.62], [4.62, 1.0], [4.62, 2.6], [4.62, 6.2], [4.62, 8.0], [4.62, 9.4], [9.62, 2.2], [9.62, 7.4], [9.62, 9.0], [13.0, 5.38], [1.6, 5.38]]) g.append(...use("lamp", x, y).nodes);
    for (const [x, y] of [[4.72, 1.2], [4.72, 3.0], [5.2, 6.4], [6.2, 4.72], [9.72, 7.4], [10.2, 2.0], [12.0, 4.72], [3.2, 5.2], [7.8, 7.0]]) g.append(...use("gully", x, y, 0, { cls: "gully" }).nodes);
    for (const [x, y, rx] of [[2.0, 5.05, 9], [6.6, 4.95, 7], [12.6, 5.1, 10], [4.95, 7.6, 6], [9.95, 1.4, 7], [7.6, 8.6, 5]]) { const [cx, cy] = P(x, y); el("ellipse", { class: "puddle", cx: f(cx), cy: f(cy), rx, ry: rx * 0.42 }, g); }
    // traffic: vans and cars on straight routes, moved with SMIL in the overlay
    // so the slab underneath is never repainted for them
    const t = el("g", { class: "traffic" }, fx);
    // walkers behind the traffic go first, so the vehicles pass in front of them
    const behind = el("g", { class: "walkers" }, t);
    const vehicle = (sym, route, dur, begin, cls) => {
      const v = el("g", { class: `veh${sym.startsWith("van") ? " eds" : ""}${cls ? ` ${cls}` : ""}` }, t);
      el("use", { href: `#${sym}`, style: sym.startsWith("car") ? `--car:${CARS[turns.car++ % CARS.length]}` : undefined }, v);
      el("animateMotion", { dur: `${dur}s`, begin: `${begin}s`, repeatCount: "indefinite", path: "M" + route.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") }, v);
    };
    vehicle("van-e", [P(-0.9, 4.85), P(15.9, 4.85)], 17, 0);
    vehicle("van-e", [P(-0.9, 4.85), P(15.9, 4.85)], 17, -9);
    vehicle("car-w", [P(15.9, 5.15), P(-0.9, 5.15)], 19, -3);
    // Australian roads: everyone keeps left
    vehicle("van-s", [P(5.15, -0.9), P(5.15, 10.9)], 13, -4);
    vehicle("car-n", [P(4.85, 10.9), P(4.85, -0.9)], 17, -11);
    vehicle("van-n", [P(9.85, 10.9), P(9.85, -0.9)], 12, -7);
    vehicle("car-s", [P(10.15, -0.9), P(10.15, 10.9)], 15, -6);
    vehicle("truck-n", [P(9.85, 10.9), P(9.85, -0.9)], 23, -1);
    vehicle("car-s", [P(7.6, 5.0), P(7.6, 10.9)], 9, -2);
    // light rail along the main road, one tram each way
    vehicle("tram-e", [P(-1.6, 4.97), P(16.6, 4.97)], 34, -8);
    vehicle("tram-w", [P(16.6, 5.03), P(-1.6, 5.03)], 34, -25);
    // people on the footpaths, along the front of the city, the main road
    // and the river road, at a walking pace
    const walk = (route, dur, begin, shirt, parent = t) => {
      const w = el("g", { class: "walker fine", style: `--shirt:${shirt}` }, parent);
      el("use", { href: "#person" }, w);
      el("animateMotion", { dur: `${dur}s`, begin: `${begin}s`, repeatCount: "indefinite", path: "M" + route.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") }, w);
    };
    const bridge = (a, b) => (a < b ? [P(4.65, 3.05), P(4.65, 3.2, 3), P(4.65, 4.25, 3), P(4.65, 4.4)] : [P(4.65, 4.4), P(4.65, 4.25, 3), P(4.65, 3.2, 3), P(4.65, 3.05)]);
    walk([P(-0.4, 4.65), P(15.4, 4.65)], 120, -10, "#f2c14e", behind);
    walk([P(15.4, 4.65), P(-0.4, 4.65)], 140, -70, "#e7fff9", behind);
    walk([P(-0.4, 10.14), P(15.4, 10.14)], 110, -30, "#38bdf8");
    walk([P(15.4, 10.14), P(-0.4, 10.14)], 130, -90, "#ef4444");
    walk([P(15.14, 10.4), P(15.14, -0.4)], 95, -20, "#8a78c0");
    walk([P(15.14, -0.4), P(15.14, 10.4)], 105, -60, "#5fb4a6");
    walk([P(4.65, -0.4), ...bridge(0, 1), P(4.65, 10.4)], 85, -40, "#fda4af", behind);
    walk([P(4.65, 10.4), ...bridge(1, 0), P(4.65, -0.4)], 90, -5, "#e7fff9", behind);
    // in a storm more of the EDS fleet is on the road, and moving faster
    vehicle("van-e", [P(-0.9, 4.85), P(15.9, 4.85)], 9, -2, "patrol");
    vehicle("van-s", [P(10.15, -0.9), P(10.15, 10.9)], 8, -5, "patrol");
    vehicle("van-n", [P(4.85, 10.9), P(4.85, -0.9)], 8, -1, "patrol");
    vehicle("van-w", [P(15.9, 5.15), P(-0.9, 5.15)], 10, -6, "patrol");
    return g;
  }

  /* ---- the underground: every pipe, chamber and lateral ---- */
  // The still parts sit under the districts; the flowing dashes live in the
  // overlay, clipped to the roads until "Show the sewer" lifts the clip.
  function under(svg, fx) {
    const g = el("g", { class: "under", id: "under" }, svg);
    const a = el("g", { class: "under-fx" }, fx);
    g.append(poly("ugrid", slabTop));
    drawUnder(g, a);
    return g;
  }
  // The network itself, drawn into a still group and an animated one. The
  // whole-city underground uses it once; a district taken apart draws it
  // again, clipped to its own below-ground block.
  // mains and lane sewers in tile coordinates; CONDUITS adds the rising
  // main, the outfall, the trade-waste connection and the culvert, for the
  // pipe ends cut through a below-ground block's faces
  const MAINS = [
    [[15.3, 5.18], [2.3, 5.18], [2.3, 5.5]],
    [[5.18, 0.2], [5.18, 5.18]], [[5.18, 10.2], [5.18, 5.18]],
    [[10.18, 0.2], [10.18, 5.18]], [[10.18, 10.2], [10.18, 5.18]],
    [[6.78, 0.3], [6.78, 5.18]], [[8.13, 0.3], [8.13, 5.18]],
  ];
  const CONDUITS = [...MAINS, [[6.3, 8.05], [6.3, 7.6], [5.18, 7.6]], [[0.6, 5.6], [0.6, 3.1], [1.45, 2.4]], [[10.85, 7.8], [10.18, 7.8]], [[5.4, 3.9], [9.6, 4.3]]];
  function drawUnder(g, a) {
    const pipes = MAINS.map((p) => p.map(([x, y]) => P(x, y)));
    for (const cls of ["pipe-glow", "pipe"]) for (const p of pipes) g.append(pl(cls, p));
    for (const p of pipes) a.append(pl("pipe-flow", p));
    // house laterals into the lane mains, the rising main from the pump
    // station, the plant outfall, the trade-waste connection, the stormwater
    // culvert with three downpipes wrongly connected to it
    const houses = [[5.7, 0.4], [5.7, 1.4], [5.7, 2.4], [5.7, 3.4], [7.05, 1.4], [7.05, 2.4], [7.05, 3.4], [8.4, 1.4], [8.4, 2.4], [8.4, 3.4], [7.05, 0.4]];
    for (const [hx, hy] of houses) { const mx = hx < 6.5 ? 6.78 : hx < 8 ? [6.78, 8.13][Math.round(hy) % 2] : 8.13; g.append(pl("pipe lat", [P(hx + 0.38, hy + 0.38), P(mx, hy + 0.5)])); }
    a.append(pl("pipe-rising", [P(6.3, 8.05), P(6.3, 7.6), P(5.18, 7.6)]));
    a.append(pl("pipe-out", [P(0.6, 5.6), P(0.6, 3.1), P(1.45, 2.4)]));
    g.append(pl("pipe lat", [P(10.85, 7.8), P(10.18, 7.8)]));
    g.append(pl("culvert", [P(5.4, 3.9), P(9.6, 4.3)]));
    for (const [x, y] of [[6.1, 1.0], [7.4, 2.8], [8.8, 2.9]]) { const to = [x + 0.1, 3.9 + (x - 5.4) * 0.095]; g.append(pl("downpipe", [P(x, y), P(...to)])); const [cx, cy] = P(...to); el("circle", { class: "downpipe-dot", cx: f(cx), cy: f(cy), r: 2.2 }, g); }
    for (const [x, y] of [[5.18, 5.18], [10.18, 5.18], [7.6, 5.18], [12.6, 5.18], [5.18, 2.4], [10.18, 7.8], [3.4, 5.18], [6.78, 1.55], [8.13, 3.05], [6.78, 3.05], [6.78, 0.5], [8.13, 1.0]]) g.append(...use("chamber", x, y, -4).nodes);
    // a cracked joint on the north lateral that lets groundwater in
    const [sx, sy] = P(5.18, 3.6);
    for (const k of [0, 1, 2]) el("path", { class: "seep", d: `M${f(sx - 9 - k * 3)} ${f(sy - 1 + k)}q${f(4 + k)} -4 ${f(8 + k * 2)} 0`, style: `--i:${k}` }, a);
    g.append(seg("crack", [sx - 2, sy - 3], [sx + 2, sy + 2]));
    // a thermistor string hung in the lane main
    g.append(pl("therm", [P(6.78, 3.05), P(6.78, 2.25)]));
    [0, 1, 2, 3, 4].forEach((i) => { const [cx, cy] = P(6.78, 3.05 - i * 0.2); el("circle", { class: "bead", cx: f(cx), cy: f(cy), r: 1.6, style: `--i:${i}` }, a); });
    // the instruments in the pipes: area velocity meters banded to the
    // invert with a cable up to a logger at the chamber, level sensors hung
    // from the lids, a sampler intake at the trade-waste connection
    const Z = -4, ins = el("g", { class: "uins" }, g);
    const ping = (x, y, k) => { const [cx, cy] = P(x, y, Z); el("circle", { class: "ping uping", cx: f(cx), cy: f(cy), r: 4, style: `--d:${(k * 0.7) % 2.6}` }, a); el("circle", { class: "ping-dot", cx: f(cx), cy: f(cy), r: 1.8 }, a); };
    const logger = (x, y) => { const b = box(x + 0.1, y - 0.17, 0.1, 0.1, 5); b.nodes.forEach((n) => ins.appendChild(n)); ins.append(seg("uant", P(x + 0.14, y - 0.12, 4), P(x + 0.14, y - 0.12, 12))); };
    [[5.18, 2.4, "y"], [5.18, 7.8, "y"], [10.18, 2.0, "y"], [10.18, 7.8, "y"], [3.4, 5.18, "x"], [12.6, 5.18, "x"], [7.6, 5.18, "x"], [6.78, 1.55, "y"], [8.13, 1.0, "y"], [14.3, 5.18, "x"], [5.18, 6.4, "y"], [10.18, 6.2, "y"], [6.78, 2.9, "y"], [8.13, 2.0, "y"], [1.2, 5.18, "x"]].forEach(([x, y, ax], k) => {
      const band = ax === "x" ? [P(x, y - 0.14, Z), P(x, y + 0.14, Z)] : [P(x - 0.14, y, Z), P(x + 0.14, y, Z)];
      ins.append(seg("uband", band[0], band[1]));
      const [sx, sy] = P(x, y, Z - 1.5);
      ins.append(poly("usensor", [[sx - 3.2, sy + 1.4], [sx + 3.2, sy + 1.4], [sx + 2, sy - 2], [sx - 2, sy - 2]]));
      ins.append(seg("ucable", P(x, y, Z), P(x + 0.1, y - 0.12, 0)));
      logger(x, y);
      ping(x, y, k);
    });
    [[5.18, 5.18], [10.18, 5.18], [6.78, 0.5], [10.18, 4.0], [5.18, 9.0], [7.6, 5.18], [12.6, 5.18], [10.18, 2.0]].forEach(([x, y], k) => {
      const [tx, ty] = P(x, y, 0), [bx, by] = P(x, y, Z + 1);
      ins.append(seg("ucable", [tx, ty], [bx, by]));
      el("rect", { class: "ulevel", x: f(bx - 2), y: f(by), width: 4, height: 5, rx: .8 }, ins);
      ping(x, y, k + 10);
    });
    { const [sx, sy] = P(10.6, 7.8, Z); ins.append(pl("ucable", [[sx, sy], [sx + 6, sy - 3], [sx + 6, sy - 14]])); el("rect", { class: "ulevel", x: f(sx + 4), y: f(sy - 20), width: 4, height: 6, rx: .8 }, ins); }
  }

  /* ---- districts ---- */
  const ZONES = {
    river: {
      rect: [0, 0, 4.6, 4.6], h: 62,
      build(S) {
        const c = [[-0.6, 0.85], [0, 1.0], [1.2, 1.4], [2.3, 2.3], [3.4, 3.2], [4.6, 3.6]];
        const band = (w) => [...c.map(([x, y]) => P(x, y - w)), ...c.map(([x, y]) => P(x, y + w)).reverse()];
        const decals = [
          flat("bank", band(0.56)), flat("flood wtr", band(0.8)), flat("wtr river", band(0.42)), flat("sheen", band(0.42)),
          line("wtr-line", c.map(([x, y]) => P(x, y - 0.12))), line("wtr-line", c.map(([x, y]) => P(x, y + 0.16))),
          flat("track", [P(4.6, 2.45), P(4.6, 2.7), P(2.75, 2.05), P(2.75, 1.82)]),
          line("contour fine", [P(0.2, 4.4), P(0.9, 3.9), P(2.0, 4.1), P(3.2, 4.45)]), line("contour fine", [P(2.7, 0.2), P(3.3, 0.9), P(4.4, 1.5)]),
          flat("wtr pool", [P(3.25, 0.75), P(3.95, 0.75), P(4.1, 1.15), P(3.6, 1.45), P(3.1, 1.2)]),
        ];
        const vol = [
          ...[[0.6, 3.1, "m"], [1.3, 3.8, "l"], [2.2, 4.1, "m"], [0.5, 4.1, "s"], [3.5, 0.6, "l"], [4.1, 1.3, "m"], [2.6, 0.5, "m"], [4.15, 2.3, "s"], [3.1, 1.5, "m"], [0.3, 2.9, "s"], [0.9, 3.4, "m"], [1.6, 4.25, "s"], [0.25, 3.7, "m"], [3.9, 0.3, "s"], [4.35, 0.9, "s"], [2.0, 0.45, "s"], [3.75, 2.05, "m"], [1.0, 2.5, "s"], [0.45, 1.85, "s"]].map(([x, y, s]) => (s === "s" ? tree(x, y, s) : gum(x, y))),
          ...[[3.3, 0.9], [3.55, 0.85], [3.8, 1.0], [3.95, 1.2], [3.45, 1.3], [3.2, 1.05]].map(([x, y]) => use("reed", x, y, 0, { cls: "fine" })),
          use("bench", 0.7, 3.55, 0, { cls: "fine" }), use("bench", 1.15, 4.3, 0, { cls: "fine" }),
          // weather station: mast, instrument box, solar panel, rain gauge
          box(1.45, 0.45, 0.1, 0.1, 30, { cls: "steel" }), box(1.3, 0.3, 0.4, 0.4, 5, { z: 30, top: "lit", cls: "white" }), use("solar", 1.32, 0.3, 35, { d: 2.2 }),
          cyl(0.75, 0.75, 0.16, 9, { cls: "white" }), item(1.7, el("ellipse", { class: "funnel", cx: f(P(0.75, 0.75, 9)[0]), cy: f(P(0.75, 0.75, 9)[1]), rx: 4.5, ry: 2.2 })),
          // the gauging weir with its stilling well and staff gauge
          box(2.12, 1.88, 0.26, 0.84, 3, { cls: "concrete" }), line("foam", [P(2.46, 1.95), P(2.46, 2.75)], 5.3),
          cyl(1.95, 1.25, 0.14, 12, { cls: "concrete" }), item(3.3, seg("det", P(2.62, 2.78), P(2.62, 2.78, 14)), ...[0, 1, 2, 3, 4].map((i) => seg("det fine", P(2.62, 2.78, 2 + i * 3), [P(2.62, 2.78, 2 + i * 3)[0] + 3, P(2.62, 2.78, 2 + i * 3)[1]]))),
          // footbridge over the upper reach
          box(1.07, 0.85, 0.08, 0.1, 4, { cls: "timber" }), box(1.07, 1.9, 0.08, 0.1, 4, { cls: "timber" }),
          flat("deck", [P(1.03, 0.85, 4), P(1.25, 0.85, 4), P(1.25, 2.0, 4), P(1.03, 2.0, 4)], 3.3),
          rail([[1.05, 0.85], [1.05, 2.0]], 8, { posts: 0.3, cls: "fine", d: 3.31 }), rail([[1.23, 0.85], [1.23, 2.0]], 8, { posts: 0.3, cls: "fine", d: 3.32 }),
          // the plant outfall headwall on the south bank, and a thermistor string in the lower reach
          box(1.38, 2.15, 0.32, 0.2, 4, { cls: "concrete" }), item(3.75, el("ellipse", { class: "mh", cx: f(P(1.54, 2.35, 2)[0]), cy: f(P(1.54, 2.35, 2)[1]), rx: 2.6, ry: 2 })),
          lo(line("therm", [P(3.4, 3.85), P(3.4, 3.25)], 7.3)), lo(item(7.31, ...[0, 1, 2, 3].map((i) => { const [cx, cy] = P(3.4, 3.8 - i * 0.18); return el("circle", { class: "bead", cx: f(cx), cy: f(cy), r: 1.5, style: `--i:${i}` }); }))),
        ];
        const [tx, ty] = P(0.75, 0.75, 11);
        // a kayak paddling the lower reach below the weir, fading in and out at the ends
        const kayak = el("g", { class: "kayak fine", "data-layer": "street" }), kg = el("g", {}, kayak);
        el("use", { href: "#kayak" }, kg);
        el("animateMotion", { dur: "44s", repeatCount: "indefinite", path: "M" + [P(2.6, 2.6), P(3.4, 3.26), P(4.4, 3.6)].map(([a, b]) => `${f(a)} ${f(b)}`).join("L") }, kg);
        el("animate", { attributeName: "opacity", values: "0;1;1;0", keyTimes: "0;.08;.9;1", dur: "44s", repeatCount: "indefinite" }, kg);
        const fx = [...S, el("circle", { class: "tip", cx: f(tx), cy: f(ty), r: 1.6 }), kayak];
        return { decals, vol, fx, cut: [{ type: "bed", x0: 0.9, x1: 1.5 }] };
      },
    },
    sewer: {
      rect: [5.4, 0, 9.6, 4.6], h: 46,
      build(S) {
        const decals = [
          slab(6.6, 0.3, 0.35, 4.15, "lane"), slab(7.95, 0.3, 0.35, 4.15, "lane"),
          ...["pipe-glow", "pipe", "pipe-flow"].flatMap((cls) => [6.78, 8.13].map((x) => line(cls, [P(x, 0.3), P(x, 4.45)]))),
          slab(8.5, 0.3, 1.0, 1.0, "park"),
          // the local oval: boundary line, the cricket pitch in the middle
          flat("oval", ringZ(9.0, 0.8, 0, 0.44, 40)), flat("pitch", [P(8.97, 0.66), P(9.03, 0.66), P(9.03, 0.94), P(8.97, 0.94)]),
          ...[[5.7, 1.1], [5.7, 2.1], [7.05, 2.1], [7.05, 3.1], [8.4, 2.1], [8.4, 3.1]].map(([x, y]) => slab(x + 0.5, y + 0.05, 0.25, 0.22, "drive fine")),
          ...[[5.65, 0.3, 5.65, 4.4], [7.0, 1.3, 7.0, 4.4], [8.35, 1.3, 8.35, 4.4]].map(([a, b, c2, d2]) => line("fence fine", [P(a, b), P(c2, d2)])),
        ];
        const vol = [];
        const kinds = ["px", "py", "h", "py", "px", "h", "py", "h", "px", "py", "px"];
        // terracotta tile on most roofs, slate and Colorbond on the rest; the
        // walls rendered cream or pale grey, and brick on every third house
        const roofs = ["tile", "slate", "tile", "cb-green", "tile", "cb-grey", "tile", "slate", "cb-red", "tile", "cb-grey"];
        [[5.7, 0.4], [5.7, 1.4], [5.7, 2.4], [5.7, 3.4], [7.05, 0.4], [7.05, 1.4], [7.05, 2.4], [7.05, 3.4], [8.4, 1.4], [8.4, 2.4], [8.4, 3.4]].forEach(([x, y], i) => {
          const two = (x === 7.05 && y === 1.4) || (x === 8.4 && y === 2.4), h = two ? 18 : 11, k = kinds[i], o = { roof: roofs[i], cls: i % 3 === 2 ? "brick" : i % 3 === 1 ? "render-2" : undefined };
          const home = k === "px" ? prism(x, y, 0.75, 0.7, h, 7, { gable: "x", ...o }) : k === "py" ? prism(x, y, 0.7, 0.75, h, 6, { gable: "y", ...o }) : house(x, y, 0.75, 0.75, h + 1, 9, o);
          home.nodes.push(...(k === "px" ? homeDetail(x, y, 0.75, 0.7, h, 7, "x", i) : k === "py" ? homeDetail(x, y, 0.7, 0.75, h, 6, "y", i) : homeDetail(x, y, 0.75, 0.75, h + 1, 9, "h", i)).filter(Boolean));
          vol.push(home);
          vol.push(flat("door fine", [P(x + 0.28, y + 0.75, 0), P(x + 0.42, y + 0.75, 0), P(x + 0.42, y + 0.75, 6), P(x + 0.28, y + 0.75, 6)], x + 0.75 + y + 0.75 + 0.001));
          if (i % 3 === 0) vol.push(box(x + 0.5, y + 0.12, 0.1, 0.1, 5, { z: h + 3, bias: 0.002, cls: "brick" }));
          if (i % 4 === 1) vol.push(box(x + 0.5, y + 0.05, 0.3, 0.3, 7, { bias: 0.003, cls: "zinc" }));
        });
        vol.push(
          ...[[8.7, 0.5, "m"], [9.3, 0.6, "s"], [9.2, 1.15, "m"], [6.2, 0.2, "s"], [7.6, 0.2, "s"], [9.0, 4.4, "s"], [6.3, 4.4, "s"], [7.7, 4.4, "s"], [5.5, 4.4, "s"], [9.45, 2.0, "s"], [9.45, 3.2, "s"]].map(([x, y, s]) => tree(x, y, s)),
          use("bench", 8.6, 1.05, 0, { cls: "fine" }),
          ...[[6.78, 0.9], [6.78, 2.3], [6.78, 3.7], [8.13, 1.7], [8.13, 3.95]].map(([x, y]) => use("lamp", x, y, 0, { d: x + y + 0.06 })),
          box(9.2, 4.2, 0.4, 0.16, 5, { top: "lit", cls: "white" }),
          manhole(6.78, 1.55), manhole(8.13, 1.0), manhole(6.78, 0.5), manhole(8.13, 3.05),
          // the EDS crew lowering a flow meter down the open manhole
          manhole(6.78, 3.05, { open: true }),
          item(9.84, ...[[-0.14, 0.12], [0.14, 0.1], [0.02, -0.16]].map(([dx, dy]) => seg("det", P(6.78 + dx, 3.05 + dy), P(6.78, 3.05, 17)))),
          item(9.85, ...cyl(6.78, 3.05, 0.055, 3, { z: 7 }).nodes.map((n, i) => (n.classList.add("meter"), (n.style.fill = ["#6fb8ad", "#479086", "#dbf0ec"][i]), n))),
          use("cone", 6.56, 3.3, 0, { d: 9.88 }), use("cone", 7.0, 2.82, 0, { d: 9.84 }),
          use("crew", 6.6, 2.86, 0, { d: 9.47 }), use("crew", 7.0, 3.26, 0, { d: 10.27 }),
          use("van-y", 6.78, 3.95, 0, { d: 10.75 }),
          // the LIDoTT alarm unit on the next manhole
          box(8.06, 2.98, 0.14, 0.14, 5, { top: "lit", bias: 0.01, cls: "white" }), item(11.2, seg("det", P(8.13, 3.05, 5), P(8.13, 3.05, 14)))
        );
        const [sx, sy] = P(8.13, 3.05);
        const fx = [
          el("ellipse", { class: "spill", cx: f(sx), cy: f(sy), rx: 16, ry: 8 }),
          ...[0, 1, 2].map((i) => el("ellipse", { class: "ripple", cx: f(sx), cy: f(sy), rx: 6, ry: 3, style: `--i:${i}` })),
          pl("runoff", [P(8.13, 3.05), P(8.13, 4.7)]),
          ...S,
        ];
        return { decals, vol, fx, cut: [{ type: "pipe", x: 6.78 }, { type: "pipe", x: 8.13 }] };
      },
    },
    cbd: {
      rect: [10.4, 0, 15, 4.6], h: 122,
      build(S) {
        // each tower in its own material: glass, dark glass, sandstone, concrete, brick, rendered white
        const towers = [[10.8, 0.5, 1.1, 1.1, 86, "a", "glass"], [12.4, 0.4, 1.0, 1.0, 118, "b", "glass-dark"], [13.9, 0.6, 0.8, 0.9, 64, "c", "sand"], [10.9, 2.4, 1.2, 0.9, 46, "b", "grey"], [12.6, 2.2, 1.0, 1.2, 72, "a", "glass"], [14.0, 2.5, 0.7, 0.8, 54, "c", "brick"], [14.2, 1.65, 0.5, 0.6, 30, "a", "white"], [11.7, 3.35, 0.7, 0.5, 26, "b", "sand"]];
        const decals = [slab(10.9, 3.75, 1.1, 0.75, "plaza")];
        const vol = [
          ...towers.map(([x, y, w, d, h, v, m]) => box(x, y, w, d, h, { win: v, entry: true, cls: m })),
          box(12.55, 0.55, 0.7, 0.7, 20, { z: 118, cls: "glass-dark" }), box(12.75, 0.75, 0.3, 0.3, 8, { z: 138, top: "lit", cls: "white" }),
          // a tower going up on the vacant lot: the concrete frame to its fourth
          // floor behind a hoarding, with a tower crane in safety yellow
          box(11.95, 1.5, 0.55, 0.6, 24, { cls: "concrete", bias: 0.3 }),
          item(11.95 + 0.55 + 1.5 + 0.6 + 0.301, strokes("floor-line", [6, 12, 18].flatMap((zz) => [[P(11.95, 2.1, zz), P(12.5, 2.1, zz)], [P(12.5, 2.1, zz), P(12.5, 1.5, zz)]]))),
          rail([[11.9, 1.45], [12.75, 1.45], [12.75, 2.15], [11.9, 2.15], [11.9, 1.45]], 4, { posts: 0.2, cls: "hoarding fine", d: 14.92 }),
          item(14.95, seg("crane", P(12.68, 1.48), P(12.68, 1.48, 62)), pl("crane", [P(12.9, 1.48, 60), P(12.68, 1.48, 60), P(11.75, 1.48, 60)]), pl("crane-line", [P(12.9, 1.48, 60), P(12.68, 1.48, 68), P(11.75, 1.48, 60)]), seg("crane-line", P(12.05, 1.48, 60), P(12.05, 1.48, 34)), ...box(12.0, 1.44, 0.1, 0.08, 4, { z: 30, cls: "yellow" }).nodes),
          item(14.9, seg("mast", P(12.9, 0.9, 146), P(12.9, 0.9, 162)), el("circle", { class: "blink", cx: f(P(12.9, 0.9, 163)[0]), cy: f(P(12.9, 0.9, 163)[1]), r: 1.8 })),
          box(12.75, 2.35, 0.7, 0.9, 14, { z: 72, cls: "glass" }),
          ...[[11.0, 0.7, 86], [11.5, 1.2, 86], [14.2, 0.8, 64], [12.9, 2.5, 86], [11.3, 2.6, 46]].map(([x, y, z]) => use("ac", x, y, z, { d: x + y + 0.3 })),
          cyl(11.6, 0.6, 0.11, 6, { z: 86, cls: "steel" }), item(14.9, seg("mast", P(14.3, 0.8, 64), P(14.3, 0.8, 78)), seg("mast", P(14.45, 2.65, 54), P(14.45, 2.65, 66))),
          // the plaza: fountain, trees, a kiosk with the Metalog logger, a transit canopy
          cyl(11.45, 4.1, 0.2, 2, { water: true, ring: true, cls: "concrete" }),
          ...[[10.98, 3.85], [11.9, 3.85], [10.98, 4.4], [11.9, 4.4]].map(([x, y]) => jac(x, y)),
          box(12.05, 4.2, 0.25, 0.25, 6, { top: "lit", cls: "white" }),
          slab(12.85, 3.75, 1.6, 0.65, "platform", 1, {}), ...canopy(12.9, 3.8, 1.5, 0.55),
          ...[[10.8, 1.6, 1.1], [12.4, 1.4, 1.0], [13.9, 1.5, 0.8]].map(([x, y, w]) => flat("lit shop", [P(x, y, 0.4), P(x + w, y, 0.4), P(x + w, y, 4), P(x, y, 4)], x + w + y + 0.002)),
          box(14.55, 4.15, 0.1, 0.1, 6, { cls: "red" }), manhole(14.6, 4.35),
          ...[[10.6, 4.45], [13.0, 4.45], [14.6, 1.0], [14.6, 3.6], [12.3, 4.5]].map(([x, y]) => use("lamp", x, y, 0, { d: x + y + 0.06 })),
          ...[[10.6, 0.3, "s"], [11.9, 0.25, "s"], [13.4, 0.3, "s"], [14.8, 0.6, "s"], [14.8, 2.4, "s"], [14.8, 4.0, "s"], [13.6, 4.5, "s"], [12.0, 3.4, "s"]].map(([x, y, s]) => tree(x, y, s)),
          use("car-e", 12.45, 4.45, 0, { d: 17.0 }), use("car-w", 10.65, 4.45, 0, { d: 15.2 }),
        ];
        return { decals, vol, fx: [...S], cut: [{ type: "pipe", x: 12.6 }] };
      },
    },
    plant: {
      rect: [0, 5.4, 4.6, 10], h: 40,
      build(S) {
        const decals = [
          slab(0.2, 5.55, 4.2, 4.3, "siteroad"), slab(0.45, 5.8, 3.7, 3.8, "ground2"),
        ];
        const [ax, ay] = [2.3, 8.2];
        const vol = [
          // inlet works: screening channel, flume, screen house
          box(0.3, 5.7, 1.2, 0.45, 6, { cls: "concrete" }), item(7.66, ...[0, 1, 2, 3, 4].map((i) => seg("det", P(0.45 + i * 0.22, 6.15, 6), P(0.45 + i * 0.22, 6.15, 1)))),
          flat("wtr flume", [P(0.4, 5.78, 6), P(1.4, 5.78, 6), P(1.4, 6.07, 6), P(0.4, 6.07, 6)], 7.66), box(1.55, 5.7, 0.4, 0.45, 9, { top: "lit", clad: true, cls: "zinc" }),
          // two clarifiers with turning scraper arms, launder rings and walkways
          cyl(1.1, 6.55, 0.78, 5, { water: true, arm: true, ring: true, cls: "concrete" }), cyl(1.1, 8.65, 0.78, 5, { water: true, arm: true, ring: true, cls: "concrete" }),
          cyl(1.1, 6.55, 0.12, 3, { z: 5, bias: 0.01, cls: "steel" }), cyl(1.1, 8.65, 0.12, 3, { z: 5, bias: 0.01, cls: "steel" }),
          rail([[0.32, 6.55], [1.1, 6.55]], 8, { posts: 0.26, cls: "fine safety", d: 7.7 }), rail([[0.32, 8.65], [1.1, 8.65]], 8, { posts: 0.26, cls: "fine safety", d: 9.8 }),
          // aeration basin with diffusers
          box(ax, ay, 1.5, 1.3, 5, { cls: "concrete" }), flat("wtr", [P(ax + 0.12, ay + 0.12, 5), P(ax + 1.38, ay + 0.12, 5), P(ax + 1.38, ay + 1.18, 5), P(ax + 0.12, ay + 1.18, 5)], ax + 1.5 + ay + 1.3 + 0.01),
          line("wtr-line", [P(ax + 0.2, ay + 0.65, 5), P(ax + 1.3, ay + 0.65, 5)], ax + 1.5 + ay + 1.3 + 0.02),
          item(ax + 1.5 + ay + 1.3 + 0.015, ...[0.35, 0.65, 0.95].map((k) => seg("det fine", P(ax + 0.2, ay + k, 5), P(ax + 1.3, ay + k, 5)))),
          // digesters, the flare and the dosing plant
          cyl(3.0, 6.3, 0.55, 30, { dome: true, bands: 3, cls: "green" }), cyl(4.0, 7.0, 0.45, 22, { dome: true, bands: 2, cls: "green" }),
          line("stair fine", [P(2.5, 6.6, 2), P(2.6, 6.5, 10), P(2.75, 6.35, 18), P(2.9, 6.2, 26)], 9.2),
          cyl(4.45, 6.2, 0.07, 34, { cls: "steel" }), box(4.1, 8.3, 0.1, 0.1, 8, { bias: 0.01, cls: "white" }), box(4.3, 8.3, 0.1, 0.1, 8, { bias: 0.011, cls: "white" }), box(4.5, 8.3, 0.1, 0.1, 8, { bias: 0.012, cls: "white" }),
          // chlorine contact tank, admin and laboratory, the ORI sampler cabinet
          box(0.3, 9.3, 1.6, 0.4, 6, { top: "wtr", cls: "concrete" }), item(0.3 + 1.6 + 9.3 + 0.4 + 0.01, seg("det", P(0.8, 9.3, 6), P(0.8, 9.7, 6)), seg("det", P(1.3, 9.3, 6), P(1.3, 9.7, 6))),
          box(3.5, 9.0, 1.0, 0.6, 14, { win: "b", cls: "render" }), flat("lit shop", [P(3.9, 9.6, 0), P(4.1, 9.6, 0), P(4.1, 9.6, 6), P(3.9, 9.6, 6)], 3.5 + 1.0 + 9.0 + 0.6 + 0.002),
          box(3.25, 9.62, 0.25, 0.25, 7, { top: "lit", cls: "white" }),
          // pipe rack linking the process line, the fence, lamps, trees, the service van
          rail([[1.9, 5.95], [2.6, 5.95], [2.6, 8.0], [2.2, 8.0]], 8, { posts: 0.5, cls: "pipe-rack", d: 9.0 }),
          rail([[0.15, 5.5], [4.5, 5.5], [4.5, 9.95]], 5, { posts: 0.55, cls: "fence fine", d: 4.2 }),
          rail([[0.15, 5.5], [0.15, 9.95], [4.5, 9.95]], 5, { posts: 0.55, cls: "fence fine", d: 14.5 }),
          ...[[0.3, 7.6], [1.95, 7.5], [2.0, 9.75], [4.4, 7.9]].map(([x, y]) => use("lamp", x, y, 0, { d: x + y + 0.06 })),
          gum(0.2, 9.9), ...[[4.45, 5.6, "s"], [4.45, 9.85, "s"]].map(([x, y, s]) => tree(x, y, s)),
          use("van-x", 4.05, 9.65, 0, { d: 13.8 }),
        ];
        const [fx0, fy0] = P(4.45, 6.2, 36), bubbles = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const [cx, cy] = P(ax + 0.25 + (i % 4) * 0.33, ay + 0.3 + Math.floor(i / 4) * 0.6, 5); return el("circle", { class: "bubble", cx: f(cx), cy: f(cy), r: 1.4, style: `--d:${(i * 0.37) % 2.4}` }); });
        const fx = [el("path", { class: "flare", d: `M${f(fx0 - 2.5)} ${f(fy0)}q2.5 -7 2.5 -11q0 4 2.5 11z` }), ...bubbles, ...S];
        return { decals, vol, fx, cut: [{ type: "pipe", x: 0.6 }, { type: "bed", x0: 1.0, x1: 1.4 }] };
      },
    },
    pump: {
      rect: [5.4, 5.4, 7.2, 10], h: 34,
      build(S) {
        const decals = [slab(5.55, 5.6, 1.5, 4.3, "ground2"), flat("track", [P(5.4, 8.95), P(5.6, 8.95), P(5.6, 9.2), P(5.4, 9.2)])];
        const vol = [
          rail([[5.55, 5.6], [7.05, 5.6], [7.05, 9.9]], 5, { posts: 0.5, cls: "fence fine", d: 11.1 }), rail([[5.55, 5.6], [5.55, 9.9], [6.5, 9.9]], 5, { posts: 0.5, cls: "fence fine", d: 16.6 }),
          house(5.7, 5.8, 1.15, 1.2, 20, 8, { cls: "brick", roof: "cb-grey" }), flat("door fine", [P(6.1, 7.0, 0), P(6.5, 7.0, 0), P(6.5, 7.0, 12), P(6.1, 7.0, 12)], 5.7 + 1.15 + 5.8 + 1.2 + 0.001),
          cyl(5.75, 5.85, 0.04, 26, { cls: "steel" }), cyl(5.6, 6.1, 0.05, 24, { cap: true, cls: "steel" }),
          line("det", [P(6.3, 7.0), P(6.3, 7.5)], 13.4),
          // the wet well with its two pumps and run lights
          cyl(6.3, 8.05, 0.6, 5, { water: "well", cls: "concrete" }),
          use("pump-dome", 6.12, 7.92, 5, { d: 14.08, style: "--mat:#4f6f85" }), use("pump-dome", 6.48, 8.18, 5, { d: 14.7, style: "--mat:#4f6f85" }),
          cyl(6.8, 6.6, 0.35, 10, { bands: 1, rail: true, cls: "steel" }), box(6.85, 8.6, 0.3, 0.3, 4, { cls: "white" }), item(16.06, el("circle", { class: "det", cx: f(P(6.95, 8.75, 4)[0]), cy: f(P(6.95, 8.75, 4)[1]), r: 1.6 }), el("circle", { class: "det", cx: f(P(7.05, 8.75, 4)[0]), cy: f(P(7.05, 8.75, 4)[1]), r: 1.6 })),
          box(6.4, 9.3, 0.5, 0.3, 7, { cls: "zinc" }),
          // the control cabinet with the Pump Station Manager, its antenna and solar panel
          box(5.75, 9.1, 0.4, 0.4, 12, { top: "lit", cls: "white" }), item(15.66, seg("mast", P(6.1, 9.15, 12), P(6.1, 9.15, 32)), el("circle", { class: "blink", cx: f(P(6.1, 9.15, 33)[0]), cy: f(P(6.1, 9.15, 33)[1]), r: 1.6 })), use("solar", 5.78, 9.2, 12, { d: 15.67 }),
          use("van-y", 5.62, 9.5, 0, { d: 15.2 }), use("crew", 5.95, 9.6, 0, { d: 15.6 }),
          tree(5.5, 6.9, "s"), tree(7.1, 9.6, "s"),
        ];
        const run = [[6.12, 7.92], [6.48, 8.18]].map(([x, y], i) => { const [cx, cy] = P(x, y, 10); return el("circle", { class: i ? "run" : "run run-a", cx: f(cx), cy: f(cy), r: 1.4, style: `--i:${i}` }); });
        return { decals, vol, fx: [...run, ...S], cut: [{ type: "well", x: 6.3 }] };
      },
    },
    ops: {
      rect: [8.0, 5.4, 9.6, 10], h: 84,
      build(S) {
        const decals = [slab(8.3, 9.2, 1.2, 0.7, "yard", 0, { style: "fill:url(#bays)" }), slab(8.2, 8.25, 1.1, 0.95, "ground2")];
        const hub = P(8.8, 6.5, 78);
        const vol = [
          box(8.25, 5.8, 1.1, 2.3, 44, { win: "c", cls: "eds" }), flat("lit", [P(9.35, 6.6, 0.4), P(9.35, 7.3, 0.4), P(9.35, 7.3, 9), P(9.35, 6.6, 9)], 8.25 + 1.1 + 5.8 + 2.3 + 0.002),
          flat("deck", [P(9.35, 6.5, 10), P(9.6, 6.5, 10), P(9.6, 7.4, 10), P(9.35, 7.4, 10)], 8.25 + 1.1 + 5.8 + 2.3 + 0.003),
          // the EDS wordmark lit on the south face, skewed into the wall like the vans' livery
          item(8.25 + 1.1 + 5.8 + 2.3 + 0.0035, (() => { const [ox, oy] = P(8.42, 8.1, 33), t = el("text", { class: "eds-sign", transform: `matrix(0.894 0.447 0 1 ${f(ox)} ${f(oy)})` }); t.textContent = "EDS"; return t; })()),
          item(8.25 + 1.1 + 5.8 + 2.3 + 0.004, ...[0, 1, 2].flatMap((i) => [0, 1].map((j) => poly("screen", [P(8.4 + i * 0.3, 8.1, 20 + j * 9), P(8.62 + i * 0.3, 8.1, 20 + j * 9), P(8.62 + i * 0.3, 8.1, 27 + j * 9), P(8.4 + i * 0.3, 8.1, 27 + j * 9)], { style: `--i:${i + j * 3}` })))),
          ...[[8.4, 6.0, 44], [8.4, 6.5, 44], [8.4, 7.0, 44], [8.4, 7.5, 44]].map(([x, y, z]) => use("solar", x, y, z, { d: x + y + 0.3 })),
          use("ac", 8.95, 7.6, 44, { d: 16.9 }), use("ac", 8.95, 7.2, 44, { d: 16.5 }),
          item(16.95, seg("mast", P(8.8, 6.5, 44), P(8.8, 6.5, 76), { style: "stroke-width:2" }), seg("mast", P(8.72, 6.42, 58), P(8.88, 6.58, 58)), seg("mast", P(8.72, 6.42, 66), P(8.88, 6.58, 66)), seg("mast", P(8.74, 6.44, 72), P(8.86, 6.56, 72))),
          use("dish", 8.8, 6.5, 62, { d: 16.96 }), use("dish", 8.86, 6.56, 70, { d: 16.97 }),
          item(16.98, el("ellipse", { class: "hub", cx: f(hub[0]), cy: f(hub[1]), rx: 16, ry: 10 }), el("circle", { class: "beacon", cx: f(hub[0]), cy: f(hub[1]), r: 4 }), el("circle", { class: "blink", cx: f(hub[0]), cy: f(hub[1] - 2), r: 1.8 })),
          box(8.3, 8.3, 0.9, 0.8, 18, { top: "lit", clad: true, cls: "zinc" }), flat("door fine", [P(8.55, 9.1, 0), P(8.95, 9.1, 0), P(8.95, 9.1, 11), P(8.55, 9.1, 11)], 8.3 + 0.9 + 8.3 + 0.8 + 0.001),
          // the EDS fleet parked nose-in, side by side, so each van's logo shows
          ...[[8.5, 9.4], [8.8, 9.4], [9.1, 9.4]].map(([x, y], i) => use("van-y", x, y, 0, { d: x + y + 0.2, cls: i === 2 ? "yard-van" : undefined })), use("car-e", 8.5, 9.68, 0, { d: 18.4 }), use("car-e", 8.9, 9.68, 0, { d: 18.8 }),
          item(19.3, ...[[-0.1, -0.1], [0.1, -0.1], [0.1, 0.1], [-0.1, 0.1]].map(([dx, dy]) => seg("mast", P(9.4 + dx, 9.7 + dy), P(9.4, 9.7, 40))), ...[12, 24, 34].map((z) => pl("mast fine", [P(9.3, 9.6, z), P(9.5, 9.6, z), P(9.5, 9.8, z), P(9.3, 9.8, z), P(9.3, 9.6, z)])), el("circle", { class: "blink", cx: f(P(9.4, 9.7, 41)[0]), cy: f(P(9.4, 9.7, 41)[1]), r: 1.6 })),
          ...[[8.15, 5.6], [9.5, 8.6], [8.1, 9.6]].map(([x, y]) => use("lamp", x, y, 0, { d: x + y + 0.06 })),
          tree(9.5, 5.6, "s"), tree(8.1, 8.2, "s"),
        ];
        return { decals, vol, fx: [...S], cut: [] };
      },
    },
    industry: {
      rect: [10.4, 5.4, 15, 10], h: 66,
      build(S) {
        const decals = [
          slab(13.35, 5.55, 1.5, 0.7, "yard", 0, { style: "fill:url(#bays)" }), slab(10.6, 9.35, 1.1, 0.5, "yard", 0, { style: "fill:url(#bays)" }),
          flat("zone-line fine", [P(10.42, 7.4), P(11.8, 7.4), P(11.8, 8.05), P(10.42, 8.05)]),
        ];
        const vol = [
          // the big shed with roof monitors and roller doors, trucks at its dock
          ribbed(box(10.8, 5.8, 2.6, 1.6, 22, { clad: true, cls: "zinc" }), 10.8, 5.8, 2.6, 1.6, 22), ...[0, 1, 2].map((i) => box(10.95 + i * 0.85, 5.95, 0.55, 1.3, 6, { z: 22, bias: 0.02 + i * 0.001, clad: true, cls: "zinc" })),
          item(10.8 + 2.6 + 5.8 + 1.6 + 0.002, ...[0, 1, 2].map((i) => { const q = [P(11.0 + i * 0.8, 7.4, 0), P(11.5 + i * 0.8, 7.4, 0), P(11.5 + i * 0.8, 7.4, 12), P(11.0 + i * 0.8, 7.4, 12)]; return [poly("door blue-door", q), poly("slats", q)]; })),
          use("truck-x", 12.3, 7.65, 0, { d: 20.1 }), use("truck-x", 11.3, 7.65, 0, { d: 19.1 }),
          // the sawtooth works and its office
          ...[0, 1, 2].map((i) => prism(13.3 + i * 0.43, 7.9, 0.43, 1.3, 16, 6, { gable: "y", skylight: true, bias: i * 0.001, cls: "brick", roof: "cb-grey" })), box(13.3, 9.2, 1.3, 0.35, 16, { win: "a", cls: "render" }),
          // the stacks and the tank farm inside its bund
          cyl(13.95, 6.2, 0.17, 58, { stripes: [3, 9], bands: 4, cls: "concrete" }), cyl(14.45, 6.7, 0.17, 46, { stripes: [3, 9], bands: 3, cls: "concrete" }), line("ladder fine", [P(14.1, 6.2, 2), P(14.1, 6.2, 56)], 20.5), line("ladder fine", [P(14.6, 6.7, 2), P(14.6, 6.7, 44)], 21.4),
          box(10.75, 8.1, 2.4, 0.06, 3, { cls: "concrete" }), box(10.75, 8.1, 0.06, 1.75, 3, { bias: 0.001, cls: "concrete" }), box(13.1, 8.1, 0.06, 1.75, 3, { cls: "concrete" }), box(10.75, 9.8, 2.4, 0.06, 3, { cls: "concrete" }),
          cyl(11.3, 8.7, 0.5, 18, { bands: 2, rail: true, cls: "steel" }), cyl(12.5, 8.7, 0.5, 18, { bands: 2, rail: true, cls: "steel" }), cyl(11.9, 9.45, 0.28, 12, { bands: 1, cls: "blue" }), cyl(12.85, 9.5, 0.22, 10, { bands: 1, cls: "green" }), box(12.35, 9.55, 0.25, 0.2, 5, { cls: "white" }),
          rail([[11.3, 8.1], [11.3, 7.6], [12.4, 7.6]], 9, { posts: 0.5, cls: "pipe-rack", d: 19.8 }),
          // cooling tower, gate kiosk, weighbridge, gantry and fence
          box(14.3, 9.2, 0.5, 0.5, 14, { cls: "concrete" }), item(14.3 + 0.5 + 9.2 + 0.5 + 0.001, ...[3, 6, 9].map((z) => seg("det fine", P(14.3, 9.7, z), P(14.8, 9.7, z)))),
          slab(10.5, 6.6, 0.4, 0.75, "track"), box(10.5, 6.9, 0.25, 0.25, 7, { top: "lit", cls: "white" }),
          box(13.55, 5.6, 0.08, 0.08, 20, { cls: "yellow" }), box(14.55, 5.6, 0.08, 0.08, 20, { bias: 0.001, cls: "yellow" }), item(20.4, seg("crane", P(13.59, 5.64, 20), P(14.59, 5.64, 20))),
          rail([[10.45, 5.45], [14.95, 5.45]], 5, { posts: 0.6, cls: "fence fine", d: 11 }), rail([[14.95, 5.45], [14.95, 9.95]], 5, { posts: 0.6, cls: "fence fine", d: 25 }),
          // the trade-waste discharge point: inspection chamber, sampling kiosk, meter cabinet
          manhole(10.85, 7.8), box(10.45, 7.45, 0.3, 0.3, 12, { top: "lit", cls: "white" }), box(11.5, 7.85, 0.2, 0.2, 7, { cls: "zinc" }),
          ...[[10.7, 9.45], [10.95, 9.45], [11.2, 9.45], [11.45, 9.45]].map(([x, y]) => use("car-s", x, y, 0, { d: x + y + 0.2 })),
          ...[[10.6, 5.6], [14.8, 7.9], [12.7, 9.9]].map(([x, y]) => use("lamp", x, y, 0, { d: x + y + 0.06 })),
          gum(14.85, 9.4), tree(10.5, 8.6, "s"), tree(12.0, 5.55, "s"),
        ];
        const smoke = [];
        [[13.95, 6.2, 58], [14.45, 6.7, 46], [14.55, 9.45, 14]].forEach(([x, y, z], k) => {
          const [cx, cy] = P(x, y, z + 3);
          for (let i = 0; i < (k === 2 ? 2 : 3); i++) smoke.push(el("circle", { class: k === 2 ? "smoke steam" : "smoke", cx: f(cx), cy: f(cy), r: 4, style: `animation-delay:${(i * 1.2 + k * 0.5).toFixed(1)}s;transform-box:fill-box;transform-origin:center` }));
        });
        return { decals, vol, fx: [...smoke, ...S], cut: [{ type: "pipe", x: 10.85 }] };
      },
    },
  };

  /* ---- the detail pass: small things, placed by the dozen ---- */
  const many = (sym, list, o = {}) => list.map(([x, y, z = 0]) => use(sym, x, y, z, { ...o, d: (o.d ?? x + y) + (z ? 0.3 : 0.05) }));
  const DETAIL = {
    river: () => [
      ...many("rock", [[0.35, 1.7], [0.9, 0.55], [1.7, 0.95], [2.0, 2.95], [2.9, 2.55], [3.9, 2.85], [4.3, 4.2], [1.45, 2.05], [3.05, 3.85]], { cls: "fine" }),
      ...many("reed", [[0.55, 1.55], [2.85, 3.75], [3.15, 3.95], [4.4, 4.25], [0.2, 1.45]], { cls: "fine" }),
      ...[[2.35, 0.3, "s"], [4.45, 1.85, "s"], [0.75, 4.4, "s"]].map(([x, y, k]) => tree(x, y, k)), gum(2.55, 4.4), gum(1.75, 3.55),
      house(3.95, 4.05, 0.3, 0.3, 5, 4, { roof: "cb-green" }), slab(4.1, 2.9, 0.45, 0.5, "track"), use("car-s", 4.2, 3.0, 0, { d: 7.4 }), use("car-s", 4.4, 3.15, 0, { d: 7.75 }),
      rail([[0.5, 0.45], [1.75, 0.45], [1.75, 1.05], [0.5, 1.05], [0.5, 0.45]], 4, { posts: 0.3, cls: "fence fine", d: 2.9 }),
      use("antenna", 1.95, 1.25, 12, { d: 3.3 }), ...many("bollard", [[0.95, 2.25], [1.15, 2.25], [1.35, 2.25]], { cls: "fine" }), use("swing", 1.35, 2.95, 0, { cls: "fine" }),
      ...many("sign", [[4.45, 2.35], [0.4, 0.4]], { cls: "fine" }), use("bench", 2.75, 1.65, 0, { cls: "fine" }),
      lo(flat("bank", [P(2.75, 2.75), P(3.1, 2.85), P(3.2, 3.05), P(2.8, 3.0)])),
    ],
    sewer: () => [
      ...many("solar", [[5.85, 0.55, 14], [7.2, 2.55, 14], [8.55, 3.55, 14], [5.85, 2.55, 14]]),
      ...many("antenna", [[6.1, 1.75, 17], [7.4, 3.75, 17], [8.75, 1.75, 23], [6.1, 3.75, 17], [7.45, 0.75, 17]], { cls: "fine" }),
      ...many("letterbox", [[6.5, 1.15], [6.5, 2.15], [7.85, 2.15], [7.85, 3.15], [9.2, 2.15], [9.2, 3.15]], { cls: "fine" }),
      ...many("bin", [[6.55, 0.55], [6.55, 2.6], [7.9, 1.6], [7.9, 3.6], [9.25, 1.6], [9.25, 3.65]], { cls: "fine" }),
      ...many("car-s", [[6.6, 1.1], [7.95, 3.1], [9.3, 2.1]], { d: 0 }).map((u) => ({ ...u, d: 99 })),
      ...many("hedge", [[5.7, 1.25], [7.05, 2.25], [8.4, 3.25], [5.7, 3.25], [7.05, 1.25]], { cls: "fine" }),
      ...many("sign", [[6.6, 4.45], [8.0, 4.45]], { cls: "fine" }), use("bench", 9.38, 1.18, 0, { cls: "fine" }),
      // Australian backyards: rainwater tanks, Hills Hoists, a pool
      ...many("tank-rw", [[6.32, 1.26], [7.67, 2.26], [9.02, 3.26], [6.32, 3.26], [7.67, 0.26]]),
      ...many("hoist", [[6.3, 0.2], [7.45, 1.2], [8.8, 2.2]], { cls: "fine" }),
      slab(5.78, 0.05, 0.3, 0.2, "pool-b"),
      ...[[6.35, 2.95, "s"], [7.75, 1.0, "s"], [9.15, 2.95, "s"], [9.1, 0.4, "s"], [9.5, 0.95, "s"]].map(([x, y, k]) => tree(x, y, k)),
      jac(6.35, 0.95), jac(7.75, 2.95),
      ...many("lamp", [[6.78, 4.3], [8.13, 0.55]]),
    ],
    cbd: () => [
      box(13.35, 1.55, 0.45, 0.5, 34, { win: "b" }), box(10.5, 1.85, 0.3, 0.4, 20, { win: "a" }),
      ...many("antenna", [[11.3, 0.9, 86], [12.95, 0.6, 138], [14.3, 2.9, 54]], { cls: "fine" }),
      cyl(13.0, 2.95, 0.1, 5, { z: 72 }), cyl(14.3, 1.0, 0.09, 5, { z: 64 }),
      ...many("car-e", [[11.4, 4.45], [13.6, 4.45], [14.2, 4.45]]), ...many("car-s", [[14.8, 1.5], [14.8, 3.0]]),
      ...many("bollard", [[10.95, 3.72], [11.2, 3.72], [11.45, 3.72], [11.7, 3.72], [11.95, 3.72]], { cls: "fine" }),
      ...many("bin", [[11.0, 4.45], [12.4, 3.75], [13.2, 4.5]], { cls: "fine" }), ...many("sign", [[10.6, 2.3], [12.3, 1.4], [14.65, 3.4]], { cls: "fine" }),
      use("bench", 11.1, 4.2, 0, { cls: "fine" }), use("bench", 11.65, 4.2, 0, { cls: "fine" }),
      ...many("flag", [[12.95, 3.7], [13.25, 3.7]], { cls: "fine" }), ...many("ac", [[12.6, 2.4, 86], [13.95, 0.75, 64], [11.0, 2.55, 46]]),
      ...[[13.0, 1.3, "s"], [14.9, 1.9, "s"], [11.5, 2.2, "s"], [13.7, 3.6, "s"]].map(([x, y, k]) => tree(x, y, k)),
    ],
    plant: () => [
      rail([[2.42, 8.32], [3.68, 8.32], [3.68, 9.38], [2.42, 9.38], [2.42, 8.32]], 8, { posts: 0.35, cls: "fine safety", d: 13.2 }),
      rail([[0.3, 9.3], [1.9, 9.3]], 9, { posts: 0.4, cls: "fine safety", d: 11.3 }),
      rail([[3.55, 6.3], [3.55, 5.95], [4.45, 5.95]], 10, { posts: 0.45, cls: "pipe-rack", d: 10.9 }),
      box(2.1, 6.55, 0.5, 0.35, 8, { cls: "zinc" }), box(2.0, 7.2, 0.4, 0.4, 6, { top: "lit", cls: "white" }),
      ...many("bollard", [[0.4, 5.6], [0.7, 5.6], [1.0, 5.6], [1.3, 5.6], [4.2, 9.85], [3.9, 9.85]], { cls: "fine" }),
      ...many("bin", [[3.4, 9.7], [1.95, 6.2]], { cls: "fine" }), ...many("sign", [[0.3, 6.4], [4.4, 8.9]], { cls: "fine" }),
      use("car-e", 3.6, 9.72, 0, { d: 13.5 }), ...many("pallet", [[4.15, 9.1], [4.3, 9.1]], { cls: "fine" }),
      ...[[0.2, 6.9, "s"], [0.2, 8.4, "s"], [2.6, 9.9, "s"], [4.45, 7.3, "s"]].map(([x, y, k]) => tree(x, y, k)),
      item(7.5, ...[0, 1, 2].map((i) => el("circle", { class: "det fine", cx: f(P(0.5 + i * 0.35, 6.3, 7)[0]), cy: f(P(0.5 + i * 0.35, 6.3, 7)[1]), r: 1.6 }))),
    ],
    pump: () => [
      ...many("solar", [[6.55, 5.7, 3], [6.85, 5.7, 3], [6.55, 5.95, 3], [6.85, 5.95, 3]]),
      cyl(7.0, 7.3, 0.14, 8, { cls: "concrete" }), box(6.95, 7.7, 0.2, 0.2, 3, { cls: "white" }), manhole(6.3, 9.0),
      ...many("bollard", [[6.3, 9.95], [6.5, 9.95], [6.7, 9.95], [6.9, 9.95]], { cls: "fine" }), use("sign", 5.5, 9.3, 0, { cls: "fine" }),
      use("bin", 5.75, 7.4, 0, { cls: "fine" }), tree(7.1, 6.1, "s"), tree(5.5, 8.4, "s"),
      item(15.8, seg("det", P(6.65, 9.35, 7), P(6.65, 9.35, 12))),
    ],
    ops: () => [
      ...many("car-e", [[8.5, 9.9], [8.9, 9.9]]), ...many("bollard", [[9.4, 6.4], [9.4, 6.7], [9.4, 7.0], [9.4, 7.3]], { cls: "fine" }),
      ...[0, 1, 2].map((i) => slab(9.35 + i * 0.07, 6.85, 0.07, 0.3, "platform", 3 - i, {})),
      use("flag", 9.5, 6.2, 0, { d: 15.75 }), ...many("bin", [[9.5, 7.6], [8.1, 9.0]], { cls: "fine" }), use("sign", 8.15, 6.0, 0, { cls: "fine" }),
      ...many("solar", [[8.7, 6.0, 44], [8.7, 6.4, 44], [8.7, 7.3, 44], [8.7, 7.7, 44]]), use("antenna", 9.2, 7.9, 44, { cls: "fine" }),
      tree(9.5, 5.95, "s"), tree(8.1, 7.6, "s"),
    ],
    industry: () => [
      ...many("pallet", [[12.05, 7.5], [12.2, 7.5], [12.35, 7.5], [12.5, 7.5], [12.05, 7.65], [12.2, 7.65]], { cls: "fine" }),
      box(13.0, 7.45, 0.16, 0.22, 5, { top: "lit", cls: "fork" }), ...many("car-s", [[11.7, 9.45], [11.95, 9.45]]),
      rail([[13.3, 9.0], [13.3, 8.2], [14.3, 8.2]], 10, { posts: 0.5, cls: "pipe-rack", d: 22.6 }),
      rail([[11.3, 9.2], [12.5, 9.2]], 6, { posts: 0.4, cls: "pipe-rack", d: 21.9 }),
      rail([[10.45, 9.95], [14.95, 9.95]], 5, { posts: 0.6, cls: "fence fine", d: 25.5 }),
      ...many("bollard", [[10.45, 6.55], [10.45, 6.8], [10.45, 7.05]], { cls: "fine" }), ...many("bin", [[10.75, 7.3], [13.7, 9.75]], { cls: "fine" }),
      ...many("sign", [[10.5, 6.45], [14.85, 9.1]], { cls: "fine" }), item(17.5, seg("det", P(10.55, 6.95), P(10.95, 6.95, 0))),
      ...[[14.85, 6.0, "s"], [10.5, 9.85, "s"], [13.0, 5.6, "s"]].map(([x, y, k]) => tree(x, y, k)),
    ],
  };
  const BASE_DETAIL = (g) => {
    for (const [x, y] of [[4.55, 4.55], [5.45, 5.45], [9.55, 4.55], [10.45, 5.45], [4.55, 5.45], [10.45, 4.55]]) g.append(...use("tlight", x, y).nodes);
    for (const a of [[P(4.7, 4.55), P(5.3, 4.55)], [P(4.7, 5.45), P(5.3, 5.45)], [P(9.7, 4.55), P(10.3, 4.55)], [P(9.7, 5.45), P(10.3, 5.45)], [P(4.55, 4.7), P(4.55, 5.3)], [P(5.45, 4.7), P(5.45, 5.3)], [P(9.55, 4.7), P(9.55, 5.3)], [P(10.45, 4.7), P(10.45, 5.3)]]) g.append(pl("stopline", a));
    for (const [x, y] of [[7.3, 6.5], [7.9, 8.2], [7.3, 9.6], [12.1, 5.38], [14.6, 5.38], [8.9, 4.62]]) g.append(...use("lamp", x, y).nodes);
    for (const [x, y] of [[7.84, 6.2], [7.36, 8.8], [14.2, 4.72], [1.4, 5.28], [4.72, 9.6]]) g.append(...use("gully", x, y, 0, { cls: "gully" }).nodes);
    // lane arrows painted on the approach to each intersection (traffic keeps left)
    const arrow = (x, y, dx, dy) => [[-0.17, -0.016], [0.03, -0.016], [0.03, -0.055], [0.12, 0], [0.03, 0.055], [0.03, 0.016], [-0.17, 0.016]].map(([a, c]) => P(x + dx * a - dy * c, y + dy * a + dx * c));
    g.append(shapes("arrow", [[4.1, 4.84, 1, 0], [8.75, 4.84, 1, 0], [13.2, 4.84, 1, 0], [6.25, 5.16, -1, 0], [11.25, 5.16, -1, 0], [1.6, 5.16, -1, 0], [5.16, 2.75, 0, 1], [10.16, 3.75, 0, 1], [4.84, 6.25, 0, -1], [9.84, 6.25, 0, -1], [7.6, 9.6, 0, 1]].map((a) => arrow(...a))));
    // the lids of the instrumented chambers under the road, over the mains
    const lids = [[5.18, 5.18], [10.18, 5.18], [7.6, 5.18], [12.6, 5.18], [3.4, 5.18], [14.3, 5.18], [1.2, 5.18], [5.18, 2.4], [5.18, 6.4], [5.18, 7.8], [5.18, 9.0], [10.18, 2.0], [10.18, 4.0], [10.18, 6.2], [10.18, 7.8]].map(([x, y]) => P(x, y));
    const ell = (rx, ry) => lids.map(([cx, cy]) => `M${f(cx - rx)} ${f(cy)}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`).join("");
    el("path", { class: "lid", d: ell(3.4, 1.7) }, g);
    el("path", { class: "lid-ring", d: ell(2, 1) }, g);
  };

  /* ---- the fine pass: what shows when the camera comes in close ---- */
  // vol items sort by depth like everything else; decals lie flat under them
  const POLES = [0.45, 1.35, 2.25, 3.9];
  const FINE = {
    river: () => ({
      decals: [
        // a gravel walking track from the footbridge through the park to the shelter
        lo(line("trail", [P(1.14, 2.02), P(1.3, 2.6), P(1.9, 3.15), P(2.6, 3.55), P(3.3, 4.0), P(3.45, 4.25), P(4.0, 4.5), P(4.6, 4.55)], 0)),
        lo(line("trail", [P(1.14, 0.83), P(1.25, 0.6), P(1.45, 0.55)], 0)),
      ],
      vol: [
        // a picnic shelter: four posts, a hipped roof, a table under it
        item(3.3 + 4.1 + 0.6, ...[[3.33, 4.13], [3.57, 4.13], [3.57, 4.37], [3.33, 4.37]].map(([x, y]) => seg("det", P(x, y), P(x, y, 8))), box(3.38, 4.2, 0.14, 0.1, 3, { cls: "timber" }).nodes, roof(3.3, 4.1, 0.3, 0.3, 8, 5, "cb-green")),
        // someone fishing from the north bank, and a walker on the footbridge
        who(3.75, 2.66, "#5fb4a6"), lo(item(6.42, seg("rod", P(3.76, 2.66, 6), P(3.95, 2.95, 2)))),
        who(1.14, 1.5, "#e7fff9", { z: 4, d: 3.315 }), who(2.2, 3.4, "#f2c14e"), who(2.35, 3.48, "#8a78c0"),
        ...many("rock", [[2.5, 2.95], [3.25, 3.75], [4.1, 3.0], [0.15, 1.55], [1.75, 1.95]], { cls: "fine" }),
        ...many("reed", [[4.3, 3.85], [4.05, 3.75], [1.9, 2.6], [0.85, 1.75]], { cls: "fine" }),
      ],
    }),
    sewer: () => ({
      vol: [
        // a game of cricket on the oval: batter, bowler, three in the field
        ...[[9.0, 0.64], [9.0, 0.98], [8.72, 0.86], [9.18, 0.86], [8.85, 1.12]].map(([x, y]) => who(x, y, "#f4f6f2")),
        who(6.75, 0.25, "#38bdf8"), who(8.1, 2.6, "#f2c14e"), who(6.72, 4.2, "#ef4444"),
        // timber power poles down the east side of the second lane, two wires
        // sagging between each pair; each span sorts at its nearer pole
        ...POLES.map((y) => lo(item(8.28 + y + 0.05, seg("pole", P(8.28, y), P(8.28, y, 19)), seg("pole", P(8.21, y, 18), P(8.35, y, 18))))),
        ...POLES.slice(1).map((y, i) => { const y0 = POLES[i], m = (y0 + y) / 2; return lo(item(8.35 + y + 0.04, strokes("wire", [-0.06, 0.06].map((k) => [P(8.28 + k, y0, 18), P(8.28 + k, m, 15.5), P(8.28 + k, y, 18)])))); }),
      ],
    }),
    cbd: () => ({
      vol: [
        // rooftops: plant, a tank, solar, and a garden with its own trees.
        // Each sorts just after the tower it stands on (x + w + y + d).
        ...[["ac", 12.05, 1.62, 38, 14.65], ["ac", 12.25, 1.72, 38, 14.66], ["ac", 14.05, 2.6, 54, 18.05], ["ac", 14.3, 2.62, 54, 18.06], ["solar", 14.25, 1.72, 30, 17.0], ["solar", 14.25, 1.95, 30, 17.01],
          ["hedge", 11.78, 3.42, 26, 16.28], ["tree-s", 11.95, 3.55, 26, 16.3], ["tree-s", 12.2, 3.65, 26, 16.32], ["vent", 10.95, 2.55, 46, 15.45], ["vent", 11.85, 2.6, 46, 15.46], ["vent", 13.95, 0.7, 64, 16.25]].map(([k, x, y, z, d]) => use(k, x, y, z, { d })),
        cyl(12.33, 1.95, 0.08, 4, { z: 38, bias: 0.3, cls: "steel" }),
        // the plaza: a cafe, people about the fountain
        ...many("parasol", [[11.25, 3.9], [11.75, 3.95]], { cls: "fine" }),
        who(11.15, 4.15, "#f2c14e"), who(11.62, 4.38, "#e7fff9"), who(11.8, 4.15, "#8a78c0"), who(11.0, 3.92, "#ef4444"),
      ],
    }),
    plant: () => ({
      decals: [
        // sludge drying beds between the digester and the aeration basin
        item(0, shapes("sludge", [[2.78, 7.05, 0.66, 0.28], [2.78, 7.4, 0.66, 0.28], [2.78, 7.75, 0.66, 0.28]].map(([x, y, w, d]) => [P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)]))),
        item(0, strokes("bed-rim", [[2.75, 7.02, 0.72, 0.34], [2.75, 7.37, 0.72, 0.34], [2.75, 7.72, 0.72, 0.34]].map(([x, y, w, d]) => [P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d), P(x, y)]))),
      ],
      vol: [who(3.12, 9.88, "#f97316"), who(2.05, 7.95, "#f97316"), use("cone", 2.7, 7.0, 0, { cls: "fine" })],
    }),
    pump: () => ({
      vol: [
        // the standby generator, its exhaust and fuel tank
        box(5.58, 7.5, 0.2, 0.26, 6, { cls: "yellow" }), cyl(5.7, 7.58, 0.02, 4, { z: 6, bias: 0.2, cls: "steel" }),
      ],
    }),
    industry: () => ({
      vol: [
        // containers under the gantry, two high in places; like the trucks
        // they stay at street level when the district is taken apart
        ...[["a", 13.68, 5.72, 0], ["c", 14.08, 5.72, 0], ["b", 13.68, 5.72, 5.5], ["d", 14.08, 5.9, 0], ["b", 14.08, 5.9, 5.5]].map(([k, x, y, z]) => lo(use(`ctr-${k}`, x, y, z, { d: x + 0.36 + y + 0.15 + z * 0.001 }))),
        // ventilators along the shed roof, beyond the monitors
        ...[11.0, 11.4, 11.8, 12.2, 12.6, 13.0].map((x) => use("vent", x, 7.3, 22, { d: 20.85 })),
        who(12.9, 7.62, "#f97316"), who(10.62, 7.2, "#e7fff9"),
        ...many("bin", [[13.15, 9.75], [10.55, 9.3]], { cls: "fine" }),
      ],
    }),
    ops: () => ({
      vol: [who(9.52, 6.82, "#e7fff9"), who(9.5, 7.15, "#5fb4a6"), who(8.65, 9.2, "#f97316")],
    }),
  };

  /* ---- a district taken apart ---- */
  // Three layers: the structures lift, the street stays, and a block of the
  // ground beneath (with half of each road beside it) drops out below. The
  // block is cut open: its pipes, chambers and instruments show through the
  // top as an x-ray, and the pipes it carries are cut where they leave
  // through its faces. Built the first time the district is opened.
  const DZ = 30, SINK = 60;
  const LIFT = { river: 62, sewer: 58, cbd: 88, plant: 56, pump: 54, ops: 74, industry: 66 };
  const noTop = (b) => b.nodes.slice(0, 2);
  // what a block holds besides the shared network: deep parts, seen through
  // the top, and extra pipes or instruments drawn over it
  const BELOW = {
    pump: { deep: () => [cyl(6.3, 8.05, 0.6, DZ - 4, { z: 4 - DZ, water: "well" }).nodes, cyl(6.8, 6.6, 0.35, 8, { z: -8 }).nodes] },
    cbd: {
      deep: () => [[10.8, 0.5, 1.1, 1.1], [12.4, 0.4, 1.0, 1.0], [13.9, 0.6, 0.8, 0.9], [10.9, 2.4, 1.2, 0.9], [12.6, 2.2, 1.0, 1.2], [14.0, 2.5, 0.7, 0.8]].map(([x, y, w, d]) => noTop(box(x, y, w, d, 18, { z: -18, cls: "found" }))),
      net: (g) => { g.append(pl("water-main", [P(10.4, 4.42), P(15.2, 4.42)]), pl("water-main", [P(14.6, 4.42), P(14.6, 4.2)])); const [hx, hy] = P(14.6, 4.2); el("circle", { class: "hydrant", cx: f(hx), cy: f(hy), r: 2.6 }, g); },
    },
    plant: {
      deep: () => [cyl(1.1, 6.55, 0.78, 12, { z: -12, top: "found" }).nodes, cyl(1.1, 8.65, 0.78, 12, { z: -12, top: "found" }).nodes, noTop(box(2.3, 8.2, 1.5, 1.3, 10, { z: -10, cls: "found" })), cyl(3.0, 6.3, 0.55, 14, { z: -14, top: "found" }).nodes],
      net: (g) => { for (const cls of ["pipe-glow", "pipe"]) g.append(pl(cls, [P(2.3, 5.5), P(2.3, 5.95), P(1.5, 5.95)])); },
    },
    industry: { deep: () => [noTop(box(10.8, 5.8, 2.6, 1.6, 10, { z: -10, cls: "found" })), cyl(11.3, 8.7, 0.5, 8, { z: -8, top: "found" }).nodes, cyl(12.5, 8.7, 0.5, 8, { z: -8, top: "found" }).nodes] },
    ops: { deep: () => [noTop(box(8.25, 5.8, 1.1, 2.3, 14, { z: -14, cls: "found" })), noTop(box(8.3, 8.3, 0.9, 0.8, 8, { z: -8, cls: "found" }))] },
    river: {
      net: (g, a) => {
        const c = [[-0.6, 0.85], [0, 1.0], [1.2, 1.4], [2.3, 2.3], [3.4, 3.2], [4.6, 3.6]];
        g.append(poly("bed", [...c.map(([x, y]) => P(x, y - 0.42)), ...c.map(([x, y]) => P(x, y + 0.42)).reverse()]));
        g.append(pl("therm", [P(3.4, 3.85), P(3.4, 3.25)]));
        [0, 1, 2, 3].forEach((i) => { const [cx, cy] = P(3.4, 3.8 - i * 0.18); el("circle", { class: "bead", cx: f(cx), cy: f(cy), r: 1.6, style: `--i:${i}` }, a); });
      },
    },
  };
  function belowBlock(id, D) {
    const [x0, y0, x1, y1] = ZONES[id].rect, e = 0.62;
    const X0 = Math.max(S[0], x0 - e), Y0 = Math.max(S[1], y0 - e), X1 = Math.min(S[2], x1 + e), Y1 = Math.min(S[3], y1 + e);
    const top = [P(X0, Y0), P(X1, Y0), P(X1, Y1), P(X0, Y1)];
    const g = el("g", { class: "below-block" }), a = el("g", { class: "below-fx" });
    const clip = `below-clip-${id}`;
    el("clipPath", { id: clip }, D).append(poly("", top));
    (BELOW[id]?.deep?.() || []).flat(Infinity).filter(Boolean).forEach((n) => g.appendChild(n));
    g.append(poly("bb-top", top));
    const net = el("g", { class: "bb-net", "clip-path": `url(#${clip})` }, g), netFx = el("g", { "clip-path": `url(#${clip})` }, a);
    drawUnder(net, netFx);
    BELOW[id]?.net?.(net, netFx);
    g.append(poly("bb-l", [P(X0, Y1), P(X1, Y1), P(X1, Y1, -DZ), P(X0, Y1, -DZ)]), poly("bb-r", [P(X1, Y0), P(X1, Y1), P(X1, Y1, -DZ), P(X1, Y0, -DZ)]));
    for (const zz of [-11, -21]) g.append(poly("strata", [P(X0, Y1, zz), P(X1, Y1, zz), P(X1, Y1, zz - 1.5), P(X0, Y1, zz - 1.5)]), poly("strata", [P(X1, Y0, zz), P(X1, Y1, zz), P(X1, Y1, zz - 1.5), P(X1, Y0, zz - 1.5)]));
    // the pipes it carries, cut where they leave through the two front faces
    const cuts = [];
    for (const c of CONDUITS) for (let i = 0; i < c.length - 1; i++) {
      const [ax, ay] = c[i], [bx, by] = c[i + 1];
      if (ay !== by && (ay - Y1) * (by - Y1) <= 0) { const x = ax + (bx - ax) * (Y1 - ay) / (by - ay); if (x > X0 && x < X1) cuts.push(P(x, Y1, -9)); }
      if (ax !== bx && (ax - X1) * (bx - X1) <= 0) { const y = ay + (by - ay) * (X1 - ax) / (bx - ax); if (y > Y0 && y < Y1) cuts.push(P(X1, y, -9)); }
    }
    for (const [cx, cy] of cuts) g.append(el("circle", { class: "cut-pipe", cx: f(cx), cy: f(cy), r: 4.2 }), el("ellipse", { class: "cut-water", cx: f(cx), cy: f(cy + 1.8), rx: 3, ry: 1.6 }));
    g.append(pl("bb-rim", [P(X0, Y1), P(X1, Y1), P(X1, Y0)]), pl("bb-edge", [P(X0, Y1), P(X0, Y0), P(X1, Y0)]));
    return { g, a, rect: [X0, Y0, X1, Y1] };
  }
  // Everything city.js needs to take a district apart: the block, the dashed
  // guides at the footprint's corners, a ghost floor under the lifted
  // structures, marks the layer labels point at, and the box the camera frames.
  function explodeKit(id, zone, zoneFx, D) {
    const [x0, y0, x1, y1] = ZONES[id].rect, rise = LIFT[id];
    const b = belowBlock(id, D);
    zone.insertBefore(b.g, zone.firstChild);
    const fxl = { below: zoneFx.querySelector(".fx-below"), lo: zoneFx.querySelector(".fx-lo"), hi: zoneFx.querySelector(".fx-hi") };
    fxl.below.prepend(b.a);
    const ghost = poly("ghost", [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)]);
    fxl.hi.prepend(ghost);
    const gg = el("g", { class: "guides" });
    zoneFx.prepend(gg);
    const guides = [[x0, y1], [x1, y1], [x1, y0]].map(([x, y]) => ({ p: P(x, y), el: el("line", { class: "guide" }, gg) }));
    const mark = (p, parent) => el("circle", { class: "mark", cx: f(p[0]), cy: f(p[1]), r: 0.6 }, parent);
    const marks = { above: mark(P(x0, y1, 6), fxl.hi), street: mark(P(x0, y1, -5), fxl.lo), below: mark(P(b.rect[0], b.rect[3], -DZ / 2), fxl.below) };
    // the box the camera frames: the lifted structures down to the block's
    // underside, through the district's lift (scaled 1.07, raised 14)
    const [cx, cy] = P((x0 + x1) / 2, (y0 + y1) / 2), h = ZONES[id].h + rise + 14;
    const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].flatMap(([x, y]) => [P(x, y, h), P(x, y, -10)])
      .concat([[b.rect[0], b.rect[1]], [b.rect[2], b.rect[1]], [b.rect[2], b.rect[3]], [b.rect[0], b.rect[3]]].map(([x, y]) => { const [px, py] = P(x, y, -DZ); return [px, py + SINK + 4]; }))
      .map(([px, py]) => [cx + (px - cx) * 1.07, cy + (py - cy) * 1.07 - 14]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return { block: b.g, blockFx: b.a, fxl, ghost, guides, marks, rise, sink: SINK, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
  }

  /* ---- assets, taken apart ---- */
  // Each asset is drawn in its own SVG with the scene's projection, as a
  // set of parts (content.mjs names them; these draw them by id). A part's
  // `off` is where it moves when the asset is apart, in drawing units; the
  // assembled asset is every part at offset zero. Sections follow drawing
  // convention: the front half is cut away, the cut faces are hatched and the
  // removed material is shown as a dashed phantom line.
  const SQ = Math.SQRT2;
  function hull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], hi = [];
    for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length > 1 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  // a circle across a pipe running along x (radius in px), and one lying flat
  const ringX = (x, y, z, r, t0 = 0, t1 = Math.PI * 2, n = 32) => Array.from({ length: n + 1 }, (_, i) => { const t = t0 + (t1 - t0) * i / n; return P(x, y + Math.cos(t) * r / 31.3, z + Math.sin(t) * r); });
  const ringZ = (x, y, z, r, n = 32) => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return P(x + Math.cos(t) * r, y + Math.sin(t) * r, z); });
  const cutFace = (pts) => [poly("cut", pts), poly("cut-h", pts)];
  // a pipe along x; `end` cuts its near end open to show the bore and the flow
  function hpipe(x0, x1, y, z, r, o = {}) {
    const nodes = [poly(o.cls || "fr", hull([...ringX(x0, y, z, r), ...ringX(x1, y, z, r)]))];
    const ty = -0.407 * r / 31.3, tz = 0.913 * r;
    nodes.push(pl("pipe-hi", [P(x0, y + ty, z + tz), P(x1, y + ty, z + tz)]));
    if (o.end) {
      nodes.push(...cutFace(ringX(x1, y, z, r)), poly("bore", ringX(x1, y, z, r * 0.8)));
      if (o.water) { const s = Math.min(1, -1 + 2 * o.water), a = Math.asin(s); nodes.push(poly("water", ringX(x1, y, z, r * 0.8, Math.PI - a, Math.PI * 2 + a, 24))); }
    }
    return nodes;
  }
  // a cylinder or cone (radius r0 at z0, r1 at z1) in half section
  function shell(cx, cy, r0, r1, z0, z1, o = {}) {
    const t = o.t ?? 5, k = TW / SQ, q = TH / SQ, [bx, by] = P(cx, cy, z0), ty = by - (z1 - z0);
    const a0 = r0 * k, b0 = r0 * q, a1 = r1 * k, b1 = r1 * q, i0 = a0 - t, j0 = b0 - t / 2, i1 = a1 - t, j1 = b1 - t / 2;
    const arc = (cx2, y, a, b, sweep) => `${f(cx2 - a)} ${f(y)}A${f(a)} ${f(b)} 0 0 ${sweep} ${f(cx2 + a)} ${f(y)}`;
    const nodes = [];
    if (o.floor) nodes.push(el("ellipse", { class: "in-floor", cx: f(bx), cy: f(by), rx: f(i0), ry: f(j0) }));
    nodes.push(el("path", { class: "in", d: `M${arc(bx, ty, i1, j1, 1)}L${f(bx + i0)} ${f(by)}A${f(i0)} ${f(j0)} 0 0 0 ${f(bx - i0)} ${f(by)}Z` }));
    for (const zj of o.joints || []) { const s = (zj - z0) / (z1 - z0); nodes.push(el("path", { class: "joint", d: `M${arc(bx, by - (zj - z0), i0 + (i1 - i0) * s, j0 + (j1 - j0) * s, 1)}` })); }
    if (o.inside) nodes.push(...o.inside);
    for (const sg of [-1, 1]) nodes.push(...cutFace([[bx + sg * a1, ty], [bx + sg * i1, ty], [bx + sg * i0, by], [bx + sg * a0, by]]));
    nodes.push(el("path", { class: "ft", d: `M${arc(bx, ty, a1, b1, 1)}L${f(bx + i1)} ${f(ty)}A${f(i1)} ${f(j1)} 0 0 0 ${f(bx - i1)} ${f(ty)}Z` }));
    nodes.push(el("path", { class: "phantom", d: `M${arc(bx, ty, a1, b1, 0)}M${arc(bx, by, a0, b0, 0)}` }));
    return nodes;
  }
  // a rectangular chamber in section: the two front walls removed
  function rshell(x0, y0, w, d, z0, z1, t = 0.12) {
    const x1 = x0 + w, y1 = y0 + d;
    return [
      poly("in-floor", [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)]),
      poly("in", [P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1), P(x0, y0, z1)]),
      poly("in in-2", [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)]),
      ...cutFace([P(x1, y0 - t, z0), P(x1, y0, z0), P(x1, y0, z1), P(x1, y0 - t, z1)]),
      ...cutFace([P(x0 - t, y1, z0), P(x0, y1, z0), P(x0, y1, z1), P(x0 - t, y1, z1)]),
      poly("ft", [P(x0 - t, y0 - t, z1), P(x1, y0 - t, z1), P(x1, y0, z1), P(x0, y0, z1), P(x0, y1, z1), P(x0 - t, y1, z1)]),
      pl("phantom", [P(x0, y1, z1), P(x1, y1, z1), P(x1, y0, z1)]), pl("phantom", [P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0)]), seg("phantom", P(x1, y1, z0), P(x1, y1, z1)),
    ];
  }
  const plain = (nodes) => nodes.flat(Infinity).filter(Boolean).map((n) => (n.classList.add("plain"), n));
  const lit = (pts, cls = "screen-lit") => poly(cls, pts);
  // a small box's front-left face, inset, for displays and labels
  const faceL = (x, y, z, w, h, inset = 0.04) => [P(x + inset, y, z + h - 3), P(x + w - inset, y, z + h - 3), P(x + w - inset, y, z + 3), P(x + inset, y, z + 3)];

  const ASSETS = {
    // Manhole 9 and the Detectronic MSFM S2.5T (DNS 51 manual):
    // the sensor on its mounting plate, the stainless ring locked in the
    // pipe by a scissor expander, the cable tied along the ring's trailing
    // edge, the logger fixed to the step irons, the ATEX battery pack beside it.
    mh9() {
      const ringPts = ringX(2.15, 0, 14, 10.5);
      const steps = [38, 52, 66, 80].map((z) => pl("step", [P(0.1, -1.06, z - 3), P(0.1, -1.06, z), P(0.45, -1.0, z), P(0.45, -1.0, z - 3)]));
      // the logger, battery and sensor are drawn larger than life so they read
      const unit = box(-0.86, -0.6, 0.56, 0.42, 32, { z: 62 });
      return {
        paint: [
          ["pipe", hpipe(-2.9, -1.3, 0, 14, 12)],
          ["pipe", hpipe(-1.3, 1.3, 0, 14, 12), { fade: true }],
          ["base", [cyl(0, 0, 1.3, 26).nodes, el("path", { class: "channel", d: `M${P(-1.24, -0.2, 26).map(f).join(" ")}L${P(1.24, -0.2, 26).map(f).join(" ")}L${P(1.24, 0.2, 26).map(f).join(" ")}L${P(-1.24, 0.2, 26).map(f).join(" ")}Z` }), poly("water", [P(-1.2, -0.11, 26), P(1.2, -0.11, 26), P(1.2, 0.11, 26), P(-1.2, 0.11, 26)])]],
          ["pipe", hpipe(1.3, 2.9, 0, 14, 12, { end: true, water: 0.36 })],
          ["ring", [pl("ring", [...ringPts]), seg("ring-x", P(2.15, -0.22, 6), P(2.15, 0.22, 11)), seg("ring-x", P(2.15, 0.22, 6), P(2.15, -0.22, 11)), pl("ring", ringPts, { class: "ring-hi" })]],
          ["sensor", [box(1.95, -0.12, 0.44, 0.24, 8, { z: 3 }).nodes, el("circle", { class: "port", cx: f(P(2.17, 0.12, 7)[0]), cy: f(P(2.17, 0.12, 7)[1]), r: 1.3 })]],
          ["shaft", [shell(0, 0, 1.15, 1.15, 26, 96, { joints: [49, 72], inside: steps }), shell(0, 0, 1.15, 0.62, 96, 116)]],
          ["battery", [box(-0.8, -0.56, 0.4, 0.32, 20, { z: 36 }).nodes, seg("det", P(-0.7, -0.24, 50), P(-0.5, -0.24, 50))]],
          ["unit", [unit.nodes, lit(faceL(-0.86, -0.18, 62, 0.56, 32, 0.09)), seg("frame", P(-0.88, -0.17, 62), P(-0.88, -0.17, 96)), seg("frame", P(-0.28, -0.17, 62), P(-0.28, -0.17, 96))]],
          ["cover", [cyl(0, 0, 0.74, 3, { z: 116 }).nodes, cyl(0, 0, 0.62, 3, { z: 119 }).nodes, ...[-0.3, 0, 0.3].map((d) => seg("det", P(-0.45 + d, -0.45 - d, 122), P(0.45 + d, 0.45 - d, 122)))]],
        ],
        off: { cover: [0, -166], unit: [0, -162], battery: [0, -150], shaft: [0, -56], base: [0, 0], pipe: [0, 42], ring: [52, 68], sensor: [104, 96] },
        anchor: { cover: P(0.52, 0.52, 122), unit: P(-0.58, -0.18, 80), battery: P(-0.6, -0.24, 46), shaft: P(0.81, -0.81, 76), base: P(0.92, 0.92, 13), pipe: P(-2.5, 0, 26), ring: P(2.15, -0.25, 24), sensor: P(2.17, 0.12, 9) },
        cables: [
          [["sensor", 1.98, 0.06, 8], ["ring", 1.95, 0.14, 6], ["pipe", 1.4, 0.16, 6], ["base", 0.9, -0.1, 26], ["base", 0.25, -0.85, 26], ["shaft", -0.05, -1.0, 30], ["shaft", -0.45, -0.92, 58], ["unit", -0.6, -0.62, 62]],
          [["battery", -0.6, -0.4, 56], ["unit", -0.6, -0.4, 62]],
        ],
        axis: [P(0, 0, -36), P(0, 0, 330)],
        guides: [["pipe", P(2.9, 0, 14), P(6.4, 0, 14)]],
      };
    },
    // The wet well: the LIDoTT R at the top of the chamber (radar down to
    // 7 m, pressure above), two pumps on guide rails, the rising main, and the
    // Pump Station Manager in its cabinet.
    wetwell() {
      const lvl = 38, k = TW / SQ, q = TH / SQ, [bx, by] = P(0, 0, 0), wy = by - lvl, ia = 1.3 * k - 5, ib = 1.3 * q - 2.5;
      const water = [el("path", { class: "water", d: `M${f(bx - ia)} ${f(wy)}L${f(bx + ia)} ${f(wy)}L${f(bx + ia)} ${f(by)}L${f(bx - ia)} ${f(by)}Z` }), el("path", { class: "water-top", d: `M${f(bx - ia)} ${f(wy)}A${f(ia)} ${f(ib)} 0 0 1 ${f(bx + ia)} ${f(wy)}Z` })];
      const rails = [[-0.55, -0.1], [-0.1, -0.55]].flatMap(([x, y]) => [seg("rail-g", P(x - 0.1, y - 0.14, 4), P(x - 0.1, y - 0.14, 98)), seg("rail-g", P(x + 0.06, y - 0.16, 4), P(x + 0.06, y - 0.16, 98))]);
      const pump = (x, y) => [cyl(x, y, 0.2, 14).nodes, cyl(x, y, 0.15, 12, { z: 14, dome: true }).nodes];
      const cab = box(-3.3, 0.35, 0.7, 0.45, 30, { z: 104 });
      return {
        paint: [
          ["well", [hpipe(-2.9, -1.25, 0.3, 62, 8), cyl(0, 0, 1.3, 8, { z: -8 }).nodes, shell(0, 0, 1.3, 1.3, 0, 100, { joints: [34, 67], floor: true, inside: [...rails, ...water] })]],
          ["pumps", [pump(-0.55, -0.1), pump(-0.1, -0.55)]],
          ["rising", [cyl(-0.1, -0.55, 0.08, 40, { z: 30 }).nodes, hpipe(-0.1, 2.9, -0.55, 70, 6, { end: true })]],
          ["radar", [seg("bracket", P(0.45, -1.1, 98), P(0.2, -0.55, 98)), cyl(0.2, -0.55, 0.13, 12, { z: 84 }).nodes]],
          ["hatch", [box(-0.5, -0.4, 1.0, 0.8, 4, { z: 100 }).nodes, seg("det", P(-0.35, 0.4, 102), P(0.35, 0.4, 102))]],
          ["cabinet", [plain(box(-3.35, 0.3, 0.8, 0.55, 4, { z: 100 }).nodes), cab.nodes, lit(faceL(-3.3, 0.8, 112, 0.7, 14, 0.12)), seg("mast-a", P(-2.95, 0.6, 134), P(-2.95, 0.6, 176)), poly("solar", [P(-3.1, 0.65, 150), P(-2.8, 0.65, 150), P(-2.8, 0.9, 158), P(-3.1, 0.9, 158)])]],
        ],
        off: { cabinet: [0, -36], hatch: [0, -108], radar: [0, -64], well: [0, 0], pumps: [0, 76], rising: [62, 31] },
        anchor: { cabinet: P(-2.95, 0.8, 122), hatch: P(0.5, 0.0, 104), radar: P(0.33, -0.42, 90), well: P(0.92, -0.92, 50), pumps: P(-0.1, -0.35, 14), rising: P(2.6, -0.4, 76) },
        cables: [[["radar", 0.2, -0.55, 96], ["well", -0.6, -1.05, 99], ["well", -1.6, 0.0, 100], ["cabinet", -2.7, 0.55, 104]]],
        axis: [P(0, 0, -90), P(0, 0, 250)],
        guides: [["rising", P(1.2, -0.55, 70), P(-0.4, -0.55, 70)]],
      };
    },
    // The plant inlet main and a clamp-on ultrasonic meter: a pair of
    // transducers strapped to the pipe, cabled to a wall mounted transmitter
    // with a keypad and display.
    inlet() {
      const tx = box(-1.15, -2.24, 0.56, 0.12, 30, { z: 40 });
      return {
        paint: [
          ["transmitter", [plain(box(-1.6, -2.42, 1.4, 0.16, 92).nodes), tx.nodes, lit(faceL(-1.15, -2.12, 54, 0.56, 14, 0.08)), ...[0, 1, 2].map((i) => seg("keys", P(-1.04 + i * 0.12, -2.12, 47), P(-0.98 + i * 0.12, -2.12, 47)))]],
          ["pipe", [box(-2.2, -0.32, 0.34, 0.64, 12).nodes, box(1.9, -0.32, 0.34, 0.64, 12).nodes, hpipe(-3.0, 3.0, 0, 32, 21, { end: true, water: 1 })]],
          ["straps", [-0.8, 0.8].map((x) => [pl("strap", ringX(x, 0, 32, 22.5, 0, Math.PI * 2, 40))])],
          ["transducers", [-0.8, 0.8].map((x) => box(x - 0.14, -0.4, 0.28, 0.22, 7, { z: 50 }).nodes)],
          ["cable", []],
        ],
        off: { transmitter: [0, -76], transducers: [0, -62], straps: [0, -30], pipe: [0, 0], cable: [0, 0] },
        anchor: { transmitter: P(-0.86, -2.12, 64), transducers: P(0.8, -0.18, 56), straps: P(-0.8, 0.5, 18), pipe: P(-2.7, 0, 52), cable: null },
        cables: [[["transducers", -0.8, -0.3, 57], ["transducers", -0.8, -0.9, 62], ["transmitter", -0.95, -2.12, 40]], [["transducers", 0.8, -0.3, 57], ["transducers", 0.6, -1.0, 64], ["transmitter", -0.75, -2.12, 40]]],
        cableAnchor: { cable: 1 },
        axis: [P(0, 0, 10), P(0, 0, 170)],
      };
    },
    // The trade-waste point: an inspection chamber on the discharge pipe,
    // the ORI ATEX sampler's suction line in the flow, an EDS pH sensor on a
    // pole, and a Dynaflox meter strapped to the pipe downstream.
    tradewaste() {
      const sam = box(-3.2, 0.35, 0.62, 0.5, 48, { z: 70 });
      return {
        paint: [
          ["pipe", hpipe(-2.6, -0.7, 0, 9, 9)],
          ["pipe", hpipe(-0.7, 0.7, 0, 9, 9), { fade: true }],
          ["chamber", [rshell(-0.7, -0.7, 1.4, 1.4, 0, 70), poly("water", [P(-0.7, -0.12, 1), P(0.7, -0.12, 1), P(0.7, 0.12, 1), P(-0.7, 0.12, 1)])]],
          ["pipe", hpipe(0.7, 2.8, 0, 9, 9, { end: true, water: 0.4 })],
          ["meter", [[1.5, 2.2].map((x) => box(x - 0.1, -0.25, 0.2, 0.16, 5, { z: 17 }).nodes), seg("mast-a", P(1.9, -1.4, 70), P(1.9, -1.4, 100)), box(1.72, -1.5, 0.36, 0.1, 18, { z: 92 }).nodes, lit(faceL(1.72, -1.4, 92, 0.36, 18, 0.06))]],
          ["hose", [cyl(0.15, -0.3, 0.05, 6, { z: 2 }).nodes]],
          ["ph", [seg("mast-a", P(-0.35, 0.25, 12), P(-0.35, 0.25, 74)), cyl(-0.35, 0.25, 0.07, 12, { z: 2 }).nodes]],
          ["sampler", [sam.nodes, lit(faceL(-3.2, 0.85, 100, 0.62, 12, 0.14)), seg("det", P(-2.89, 0.85, 72), P(-2.89, 0.85, 96))]],
          ["cover", [box(-0.58, -0.58, 1.16, 1.16, 4, { z: 70 }).nodes, ...[-0.3, 0, 0.3].map((d) => seg("det", P(-0.5, d, 74), P(0.5, d, 74)))]],
        ],
        off: { cover: [0, -124], sampler: [0, -34], meter: [0, -40], hose: [0, -76], ph: [0, -82], chamber: [0, 0], pipe: [0, 44] },
        anchor: { cover: P(0.55, 0.55, 74), sampler: P(-2.9, 0.85, 108), meter: P(1.9, -1.4, 102), hose: P(0.15, -0.25, 5), ph: P(-0.33, 0.32, 9), chamber: P(0.7, -0.76, 40), pipe: P(-2.3, 0, 18) },
        cables: [[["hose", 0.15, -0.3, 8], ["hose", 0.15, -0.45, 60], ["chamber", -0.76, -0.2, 70], ["chamber", -1.6, 0.4, 70], ["sampler", -2.6, 0.6, 76]]],
        axis: [P(0, 0, -60), P(0, 0, 210)],
      };
    },
    // The RIMCO 7499: a bronze funnel on a stainless steel cylinder over a
    // levelling base, the tipping bucket inside.
    raingauge() {
      const tilt = 0.16, piv = 34, rot = ([x, z]) => { const px = x * 31.3, c = Math.cos(tilt), s = Math.sin(tilt); return [(px * c - z * s) / 31.3, px * s + z * c + piv]; };
      const vee = [[-0.58, 13], [0, -3], [0.58, 13], [0.5, 14.5], [0, 1.5], [-0.5, 14.5]].map(rot);
      const face = (y, cls) => poly(cls, vee.map(([x, z]) => P(x, y, z)));
      // the funnel's cone sits down inside the cylinder, under a short collar
      const fun = [...ringZ(0, 0, 100, 0.84), ...ringZ(0, 0, 60, 0.1)];
      return {
        paint: [
          ["base", [[[0.8, 0], [-0.4, 0.69], [-0.4, -0.69]].map(([x, y]) => cyl(x, y, 0.07, 6, { z: -6 }).nodes), cyl(0, 0, 1.1, 6).nodes, el("circle", { class: "bubble-lvl", cx: f(P(0.6, 0.6, 6)[0]), cy: f(P(0.6, 0.6, 6)[1]), r: 2.2 })]],
          ["body", shell(0, 0, 0.82, 0.82, 6, 92, { joints: [] })],
          ["bucket", [seg("post", P(-0.16, -0.32, 12), P(-0.16, -0.32, piv)), seg("post", P(0.16, -0.32, 12), P(0.16, -0.32, piv)), face(-0.28, "fr"), ...vee.map(([x, z]) => seg("rim-l", P(x, -0.28, z), P(x, 0.28, z))), face(0.28, "fl"), seg("post", P(0, -0.36, piv), P(0, 0.36, piv)), seg("det", P(rot([0, 1.5])[0], 0.28, rot([0, 1.5])[1]), P(rot([0, 13])[0], 0.28, rot([0, 13])[1]))]],
          ["funnel", [cyl(0, 0, 0.04, 6, { z: 54, cls: "bronze" }).nodes, poly("bronze", hull(fun)), cyl(0, 0, 0.86, 8, { z: 96, cls: "bronze" }).nodes, el("ellipse", { class: "bore", cx: f(P(0, 0, 104)[0]), cy: f(P(0, 0, 104)[1] + 1), rx: f(0.74 * TW / SQ), ry: f(0.74 * TH / SQ) })]],
        ],
        off: { funnel: [0, -126], bucket: [0, -96], body: [0, 0], base: [0, 40] },
        anchor: { funnel: P(0.6, 0.6, 100), bucket: P(0.5, 0.28, rot([0.58, 13])[1]), body: P(0.58, -0.58, 64), base: P(0.8, 0.8, 4) },
        cables: [[["bucket", 0, 0.28, piv], ["body", 0.42, 0.62, 14], ["base", 0.95, 0.75, 4], ["base", 2.3, 1.45, 0]]],
        axis: [P(0, 0, -50), P(0, 0, 240)],
      };
    },
    // A tower in floors, the Asset Score sensors at critical structure points.
    tower() {
      const W = 0.66, floor = (z, h, v) => box(-W, -W, 2 * W, 2 * W, h, { z, win: v }).nodes;
      const node = (x, y, z) => [box(x - 0.06, y - 0.06, 0.12, 0.12, 4, { z }).nodes, el("circle", { class: "ax-ping", cx: f(P(x, y, z + 4)[0]), cy: f(P(x, y, z + 4)[1]), r: 3 })];
      return {
        paint: [
          ["base", [[[-W, W], [W, W], [W, -W], [0, 0]].map(([x, y]) => seg("pile", P(x * 0.8, y * 0.8, -30), P(x * 0.8, y * 0.8, -62))), box(-W, -W, 2 * W, 2 * W, 30, { z: -30, cls: "found" }).nodes]],
          ["lower", [floor(0, 52, "a"), poly("lobby", [P(-W + 0.1, W, 2), P(W - 0.1, W, 2), P(W - 0.1, W, 12), P(-W + 0.1, W, 12)])]],
          ["eas", [plain(floor(52, 52, "b")), node(-W + 0.1, W - 0.1, 104), node(W - 0.1, W - 0.1, 104), node(W - 0.1, -W + 0.1, 104)]],
          ["upper", floor(104, 52, "c")],
          ["roof", [box(-W - 0.02, -W - 0.02, 2 * W + 0.04, 2 * W + 0.04, 4, { z: 156 }).nodes, box(-0.35, -0.4, 0.4, 0.35, 10, { z: 160 }).nodes, box(0.15, 0.05, 0.3, 0.3, 7, { z: 160 }).nodes, seg("mast-a", P(0.3, -0.35, 160), P(0.3, -0.35, 196))]],
        ],
        off: { roof: [0, -112], upper: [0, -74], eas: [0, -38], lower: [0, 0], base: [0, 46] },
        anchor: { roof: P(0.6, 0.68, 162), upper: P(W, 0.1, 130), eas: P(W - 0.1, W - 0.1, 108), lower: P(W, 0.2, 26), base: P(W, 0.1, -15) },
        axis: [P(0, 0, -110), P(0, 0, 330)],
      };
    },
    // How a reading travels: a stack of plates, instruments at the bottom
    // and the people who act on it at the top.
    datapath() {
      const ids = ["instruments", "loggers", "network", "flowsense", "scada", "people"], plate = (z) => box(-1.1, -1.1, 2.2, 2.2, 6, { z }).nodes;
      const ico = {
        instruments: (z) => [cyl(-0.5, -0.3, 0.18, 14, { z }).nodes, box(0.15, -0.65, 0.36, 0.3, 18, { z }).nodes, cyl(0.45, 0.4, 0.14, 8, { z, dome: true }).nodes],
        loggers: (z) => [[-0.55, -0.1], [0.05, -0.55], [0.45, 0.25]].map(([x, y]) => [box(x - 0.13, y - 0.1, 0.26, 0.2, 10, { z }).nodes, seg("mast-a", P(x, y, z + 10), P(x, y, z + 24))]),
        network: (z) => [[[-0.18, -0.18], [0.18, -0.18], [0.18, 0.18], [-0.18, 0.18]].map(([x, y]) => seg("mast-a", P(x, y, z), P(0, 0, z + 46))), ...[14, 28].map((h) => pl("mast-a", [P(-0.12, -0.12, z + h), P(0.12, -0.12, z + h), P(0.12, 0.12, z + h), P(-0.12, 0.12, z + h), P(-0.12, -0.12, z + h)])), ...[9, 15].map((r) => el("path", { class: "wave", d: `M${f(P(0, 0, z + 46)[0] - r)} ${f(P(0, 0, z + 46)[1] - 2)}a${r} ${r * 0.7} 0 0 1 ${2 * r} 0` }))],
        flowsense: (z) => [box(-0.75, -0.06, 1.5, 0.1, 30, { z: z + 4 }).nodes, seg("mast-a", P(0, 0, z), P(0, 0, z + 4)), pl("chart", [P(-0.62, 0.04, z + 12), P(-0.35, 0.04, z + 18), P(-0.1, 0.04, z + 15), P(0.15, 0.04, z + 25), P(0.4, 0.04, z + 21), P(0.62, 0.04, z + 28)])],
        scada: (z) => [box(-0.3, -0.5, 0.6, 0.4, 30, { z }).nodes, ...[6, 12, 18, 24].map((h) => seg("det", P(-0.26, -0.1, z + h), P(0.26, -0.1, z + h)))],
        people: (z) => [[-0.35, 0.25].map((x) => [box(x, -0.1, 0.24, 0.05, 20, { z }).nodes, lit([P(x + 0.03, -0.05, z + 17), P(x + 0.21, -0.05, z + 17), P(x + 0.21, -0.05, z + 3), P(x + 0.03, -0.05, z + 3)])]), poly("mail", [P(-0.2, 0.35, z), P(0.4, 0.35, z), P(0.4, 0.75, z), P(-0.2, 0.75, z)]), pl("det", [P(-0.2, 0.35, z), P(0.1, 0.55, z), P(0.4, 0.35, z)])],
      };
      const paint = [], off = {}, anchor = {};
      ids.forEach((id, i) => {
        const z = i * 7;
        paint.push([id, plate(z)], [id, ico[id](z + 6), { fade: true }]);
        off[id] = [0, -i * 66];
        anchor[id] = i % 2 ? P(1.1, -1.1, z + 3) : P(-1.1, 1.1, z + 3);
      });
      return { paint, off, anchor, axis: [P(0, 0, 0), P(0, 0, 400)], packets: true };
    },
  };

  // Draw an asset into its SVG. Returns the parts in content order, each
  // with its groups, offset and the mark its label points at, and apply(kp),
  // which places every part for a progress kp(index) from 0 (assembled) to 1
  // (apart), and redraws the cables and guides to match.
  function buildAsset(svg, data) {
    const make = ASSETS[data.id];
    if (!make) return null;
    while (svg.firstChild) svg.firstChild.remove();
    const spec = make(), D = el("defs", {}, svg);
    const hatch = el("pattern", { id: "ax-hatch", width: 4, height: 4, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, D);
    hatch.append(seg("", [0, 0], [0, 4], { style: "stroke:rgba(255,255,255,.28);stroke-width:1" }));
    const root = el("g", { class: "ax-root" }, svg);
    const axis = spec.axis ? seg("ax-axis", spec.axis[0], spec.axis[1]) : null;
    if (axis) root.append(axis);
    const guideLayer = el("g", { class: "ax-guides" }, root);
    const byId = {};
    data.parts.forEach((p, i) => { byId[p.id] = { id: p.id, i, eds: !!p.eds, groups: [], fades: [], off: spec.off[p.id] || [0, 0], at: spec.anchor[p.id] }; });
    for (const [id, nodes, o = {}] of spec.paint) {
      const part = byId[id]; if (!part) continue;
      const g = el("g", { class: `part${part.eds ? " eds" : ""}`, "data-part": id }, root);
      [nodes].flat(Infinity).filter(Boolean).forEach((n) => g.appendChild(n));
      part.groups.push(g);
      if (o.fade) part.fades.push(g);
    }
    const cableLayer = el("g", { class: "ax-cables" }, root);
    const cables = (spec.cables || []).map((pts) => ({ pts, el: el("polyline", { class: "ax-cable" }, cableLayer) }));
    const guides = (spec.guides || []).map(([id, a, b]) => ({ id, a, b, el: seg("ax-guide", a, b) }));
    guides.forEach((gd) => guideLayer.append(gd.el));
    const parts = data.parts.map((p) => byId[p.id]).filter((p) => p.groups.length || spec.cableAnchor?.[p.id] !== undefined);
    for (const p of parts) {
      const host = p.groups[p.groups.length - 1] || cableLayer;
      p.mark = el("circle", { class: "ax-mark", r: 0.6, cx: p.at ? f(p.at[0]) : 0, cy: p.at ? f(p.at[1]) : 0 }, host);
      p.cable = spec.cableAnchor?.[p.id];
    }
    let pk = null;
    if (spec.packets) {
      const top = byId.people, a = P(0, 0, 8), b = P(0, 0, 7 * 5 + 10);
      const path = `M${f(a[0])} ${f(a[1])}L${f(b[0] + top.off[0])} ${f(b[1] + top.off[1])}`;
      pk = el("g", { class: "ax-packets" }, root);
      for (let i = 0; i < 4; i++) { const c = el("circle", { class: "ax-pkt", r: 2.4 }, pk); el("animateMotion", { dur: "3.2s", begin: `${-i * 0.8}s`, repeatCount: "indefinite", path }, c); }
    }
    const pos = (id, x, y, z, kp) => { const p = byId[id], [px, py] = P(x, y, z), t = kp(p.i); return [px + p.off[0] * t, py + p.off[1] * t]; };
    function apply(kp) {
      for (const p of parts) {
        const t = kp(p.i), tr = `translate(${f(p.off[0] * t)} ${f(p.off[1] * t)})`;
        p.groups.forEach((g) => g.setAttribute("transform", tr));
        p.fades.forEach((g) => (g.style.opacity = t.toFixed(3)));
      }
      cables.forEach((c) => c.el.setAttribute("points", c.pts.map(([id, x, y, z]) => pos(id, x, y, z, kp).map(f).join(",")).join(" ")));
      guides.forEach((gd) => { const p = byId[gd.id], t = kp(p.i); gd.el.style.opacity = t.toFixed(3); gd.el.setAttribute("transform", `translate(${f(p.off[0] * t)} ${f(p.off[1] * t)})`); });
      const all = Math.min(...parts.map((p) => kp(p.i)));
      if (axis) axis.style.opacity = (all * 0.9).toFixed(3);
      if (pk) pk.style.opacity = all > 0.98 ? "1" : "0";
      // a part named for a cable points at the middle of that cable
      for (const p of parts) if (p.cable !== undefined) {
        const pts = cables[p.cable].el.getAttribute("points").split(" ").map((s) => s.split(",").map(Number)), m = pts[Math.floor(pts.length / 2)];
        p.mark.setAttribute("cx", f(m[0])); p.mark.setAttribute("cy", f(m[1]));
      }
    }
    return { svg, root, parts, apply };
  }

  /* ---- assemble ---- */
  // Two SVGs share one viewBox: the still city (districts, slab, pipes) and,
  // over it, everything that moves (traffic, pings, flows, packets, labels).
  // The browser then repaints only the overlay each frame. A district's
  // moving parts sit in a matching group in the overlay that lifts with it.
  // The storm's weather is a canvas between the two (city-weather.js).
  const VB = "-330 -52 800 448";
  const TEXTURE = { river: "turf", sewer: "turf", pump: "turf" };
  const MOVING = ".arm,.meter,.blink,.hub,.beacon,.screen,.bead,.wtr-line,.foam,.pipe-flow,.yard-van";
  function build(svg, data) {
    svg.setAttribute("viewBox", VB);
    svg.classList.add("city-svg");
    const fx = el("svg", { id: "city-fx", class: "city-svg city-fx", viewBox: VB, "aria-hidden": "true", focusable: "false" });
    svg.after(fx);
    const ui = data.ui, byZone = Object.fromEntries(data.zones.map((z) => [z.id, z]));
    const D = defs(svg, data);
    // the traffic is clipped to the slab, so it drives in and out at the edge
    el("clipPath", { id: "clip-slab" }, D).append(poly("", slabTop));
    el("clipPath", { id: "clip-roads" }, D).append(...ROADS.map(([x0, y0, x1, y1]) => poly("", [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)])));
    const baseLayer = base(svg, fx); BASE_DETAIL(baseLayer); const underLayer = under(svg, fx);
    const shadowLayer = el("g", { class: "shadows" }, svg), zoneLayer = el("g", { class: "zones" }, svg);
    const zoneFxLayer = el("g", { class: "zones-fx" }, fx), linkLayer = el("g", { class: "links" }, fx), packetLayer = el("g", { class: "packets" }, fx), labelLayer = el("g", { class: "labels" }, fx);
    const zones = {}, zoneFx = {}, labels = {}, links = {}, shadows = {}, anchors = {}, slots = {};
    Object.entries(ZONES)
      .sort((a, b) => a[1].rect[2] + a[1].rect[3] - (b[1].rect[2] + b[1].rect[3]))
      .forEach(([id, z], order) => {
        const [x0, y0, x1, y1] = z.rect, zd = byZone[id] || { name: id, sensors: [] };
        const [cx, cy] = P((x0 + x1) / 2, (y0 + y1) / 2);
        const origin = `transform-origin:${f(cx)}px ${f(cy)}px`;
        const g = el("g", { class: "zone", "data-zone": id, role: "button", tabindex: "-1", "aria-label": (ui.zoneLabel || "{name}").replace("{name}", zd.name), style: origin }, zoneLayer);
        const gf = el("g", { class: "zone-fx", "data-zone": id, style: origin }, zoneFxLayer);
        g.append(
          poly("ge-l", [P(x0, y1), P(x1, y1), P(x1, y1, -10), P(x0, y1, -10)]),
          poly("ge-r", [P(x1, y0), P(x1, y1), P(x1, y1, -10), P(x1, y0, -10)]),
          poly("g", [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)])
        );
        const sensors = (zd.sensors || []).map((s, i) => sensor(s, i, ui));
        cast = [];
        const parts = z.build(sensors);
        parts.vol.push(...(DETAIL[id] ? DETAIL[id]() : []));
        const fine = FINE[id]?.() || {};
        parts.vol.push(...(fine.vol || []));
        parts.decals.push(...(fine.decals || []));
        // every block's shadow on the ground, as one path under the district
        if (cast.length) parts.decals.push(lo(item(0, shapes("cast", cast))));
        cast = null;
        const dec = el("g", { class: "decals" }, g), vol = el("g", { class: "vol" }, g), cut = el("g", { class: "cut" }, g);
        // the ground's grain: grass in the green districts, paving in the built ones
        dec.append(poly("tex", [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], { style: `fill:url(#${TEXTURE[id] || "pave"})` }));
        parts.decals.forEach((p) => p.nodes.forEach((n) => dec.appendChild(n)));
        parts.vol.sort((a, b) => a.d - b.d).forEach((p) => p.nodes.forEach((n) => { n.setAttribute("data-s", p.s || "hi"); vol.appendChild(n); }));
        cutaway(z, parts.cut).forEach((n) => cut.appendChild(n));
        // the overlay keeps one group per layer, so a district taken apart
        // can move its moving parts with the layer they belong to
        const fxl = { below: el("g", { class: "fx-below" }, gf), lo: el("g", { class: "fx-lo" }, gf), hi: el("g", { class: "fx-hi" }, gf) };
        [...g.querySelectorAll(MOVING)].forEach((n) => fxl[n.getAttribute("data-s") || "lo"].appendChild(n));
        parts.fx.forEach((n) => {
          const layer = n.getAttribute("data-layer");
          fxl[layer ? { above: "hi", street: "lo", below: "below" }[layer] : /spill|ripple|runoff/.test(n.getAttribute("class")) ? "lo" : "hi"].appendChild(n);
        });
        zones[id] = g; zoneFx[id] = gf; slots[id] = order;
        // the shadow the lifted district casts, and its label floating above
        shadows[id] = el("ellipse", { class: "shadow", cx: f(cx), cy: f(cy + 10), rx: f((x1 - x0 + y1 - y0) * TW / 4 * 0.98), ry: f((x1 - x0 + y1 - y0) * TH / 4 * 0.98) }, shadowLayer);
        const a = P((x0 + x1) / 2, (y0 + y1) / 2, z.h + (id === "cbd" ? 22 : 18));
        anchors[id] = a;
        const text = zd.name, wpx = text.length * 6.1 + 22;
        // in the expanded view the labels of the other districts drop onto their own tiles
        const lg = el("g", { class: "zlabel", "data-zone": id, style: `--drop:${f(z.h + 4)}px` }, labelLayer);
        el("line", { x1: f(a[0]), y1: f(a[1] + 9), x2: f(a[0]), y2: f(a[1] + 20) }, lg);
        el("rect", { x: f(a[0] - wpx / 2), y: f(a[1] - 11), width: f(wpx), height: 21, rx: 10.5 }, lg);
        el("text", { x: f(a[0]), y: f(a[1] + 3.5), "text-anchor": "middle" }, lg).textContent = text;
        labels[id] = lg;
      });

    // EDS crews that turn out in a storm. Each stands in the street layer of
    // its district, so it lifts and comes apart with it; city.js shows each
    // crew as the storm reaches that district.
    const CREWS = {
      sewer: ["crew-mh14", [["van-y", 8.32, 3.45], ["crew", 8.34, 2.98], ["crew", 7.94, 2.9], ["cone", 8.42, 2.8], ["cone", 7.88, 3.28]]],
      pump: ["crew-pump", [["crew", 6.78, 8.5], ["crew", 6.2, 9.15]]],
      plant: ["crew-plant", [["crew", 2.05, 6.15], ["crew", 2.22, 5.92]]],
      river: ["crew-river", [["crew", 1.72, 2.62], ["crew", 1.95, 2.52]]],
    };
    for (const [id, [cls, items]] of Object.entries(CREWS)) {
      const g = el("g", { class: `crew ${cls}` }, zoneFx[id].querySelector(".fx-lo"));
      items.sort((a, b) => a[1] + a[2] - b[1] - b[2]).forEach(([sym, x, y]) => g.append(...use(sym, x, y).nodes));
    }
    // the van FlowSense sends from the operations yard to MH 14 when the
    // alarm goes out, driven along the roads (on the left) by city.js
    const dispatch = { g: el("g", { class: "dispatch" }, fx.querySelector(".traffic")), route: [[9.1, 9.4], [9.1, 9.12], [7.45, 9.12], [7.45, 4.85], [8.13, 4.85], [8.13, 3.4]] };
    dispatch.use = el("use", { href: "#van-w" }, dispatch.g);

    // data links: every district reports to the operations centre mast, and
    // a dim packet rides each one so the hub reads as the hub even at rest
    const hub = P(8.8, 6.5, 78);
    Object.keys(ZONES).forEach((id, i) => {
      if (id === "ops") return;
      const a = anchors[id], mx = (a[0] + hub[0]) / 2, my = Math.min(a[1], hub[1]) - 46;
      const d = `M${f(a[0])} ${f(a[1] + 12)}Q${f(mx)} ${f(my)} ${f(hub[0])} ${f(hub[1])}`;
      links[id] = el("path", { class: "link", id: `link-${id}`, d }, linkLayer);
      for (const k of [0, 1]) {
        const c = el("circle", { class: "pkt", r: 1.8 }, packetLayer);
        el("animateMotion", { dur: "5.5s", begin: `${-(i * 0.9 + k * 2.75)}s`, repeatCount: "indefinite", path: d }, c);
      }
    });
    const hand = el("circle", { class: "pkt-hand", r: 2.6 }, packetLayer);
    const handMotion = el("animateMotion", { dur: ".8s", begin: "indefinite", fill: "freeze", calcMode: "spline", keySplines: ".2 .8 .3 1", keyTimes: "0;1", path: links.river.getAttribute("d") }, hand);
    const sms = el("rect", { class: "pkt-sms", width: 9, height: 6, rx: 2, x: -4.5, y: -3 }, packetLayer);
    const smsMotion = el("animateMotion", { dur: "1.1s", begin: "indefinite", fill: "freeze", path: links.sewer.getAttribute("d") }, sms);

    // a district's kit for taking it apart is made the first time it is asked for
    const kits = {};
    const explode = (id) => (kits[id] ||= explodeKit(id, zones[id], zoneFx[id], D));
    return { svg, fx, base: baseLayer, under: underLayer, zoneLayer, zoneFxLayer, linkLayer, packetLayer, labelLayer, zones, zoneFx, labels, links, shadows, anchors, slots, sensors: sensorNodes, arms, hand, handMotion, sms, smsMotion, ZONES, explode, buildAsset, VB, dispatch };
  }

  window.CityScene = { TW, TH, P, S, build };
})();
