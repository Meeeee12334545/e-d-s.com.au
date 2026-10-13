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
  const f = (n) => (+n).toFixed(1);
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

  /* ---- solids ---- */
  function box(x, y, w, d, h, o = {}) {
    const z = o.z || 0, c = o.cls ? ` ${o.cls}` : "", nodes = [];
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
    }
    if (!o.noTop) nodes.push(poly((o.top || "ft") + c, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)]));
    return { d: x + w + y + d + (o.bias || 0), nodes };
  }
  function roof(x, y, w, d, z, rh) {
    const A = P(x + w / 2, y + d / 2, z + rh);
    return [
      poly("ft", [P(x, y, z), P(x, y + d, z), A]),
      poly("ft", [P(x, y, z), P(x + w, y, z), A]),
      poly("fr", [P(x, y + d, z), P(x + w, y + d, z), A]),
      poly("fr", [P(x + w, y, z), P(x + w, y + d, z), A]),
    ];
  }
  function house(x, y, w, d, h, rh, o = {}) {
    const b = box(x, y, w, d, h, { ...o, noTop: true });
    b.nodes.push(...roof(x, y, w, d, (o.z || 0) + h, rh));
    return b;
  }
  // a gabled block: ridge along x or y, with the gable end that faces the viewer
  function prism(x, y, w, d, h, rh, o = {}) {
    const z = o.z || 0, t = z + h, b = box(x, y, w, d, h, { ...o, noTop: true });
    if (o.gable === "y") {
      const r0 = P(x + w / 2, y, t + rh), r1 = P(x + w / 2, y + d, t + rh);
      b.nodes.push(
        poly("ft", [P(x, y, t), P(x, y + d, t), r1, r0]),
        poly("fr", [P(x + w, y, t), P(x + w, y + d, t), r1, r0]),
        poly("fl", [P(x, y + d, t), P(x + w, y + d, t), r1])
      );
      if (o.skylight) b.nodes.push(poly("lit sky", [P(x + w * 0.6, y + d * 0.15, t + rh * 0.4), P(x + w * 0.85, y + d * 0.15, t + rh * 0.15), P(x + w * 0.85, y + d * 0.85, t + rh * 0.15), P(x + w * 0.6, y + d * 0.85, t + rh * 0.4)]));
    } else {
      const r0 = P(x, y + d / 2, t + rh), r1 = P(x + w, y + d / 2, t + rh);
      b.nodes.push(
        poly("ft", [P(x, y, t), P(x + w, y, t), r1, r0]),
        poly("fr", [P(x, y + d, t), P(x + w, y + d, t), r1, r0]),
        poly("fr", [P(x + w, y, t), P(x + w, y + d, t), r1])
      );
    }
    return b;
  }
  const arms = [];
  function cyl(cx, cy, r, h, o = {}) {
    const z = o.z || 0, rx = r * TW / Math.SQRT2, ry = r * TH / Math.SQRT2, c = o.cls ? ` ${o.cls}` : "";
    const [bx, by] = P(cx, cy, z), [, ty] = P(cx, cy, z + h);
    const nodes = [
      el("path", { class: "fr" + c, d: `M${f(bx - rx)} ${f(ty)}L${f(bx - rx)} ${f(by)}A${f(rx)} ${f(ry)} 0 0 0 ${f(bx + rx)} ${f(by)}L${f(bx + rx)} ${f(ty)}Z` }),
      el("path", { class: "fl" + c, d: `M${f(bx - rx)} ${f(ty)}L${f(bx - rx)} ${f(by)}A${f(rx)} ${f(ry)} 0 0 0 ${f(bx)} ${f(by + ry)}L${f(bx)} ${f(ty + ry)}A${f(rx)} ${f(ry)} 0 0 1 ${f(bx - rx)} ${f(ty)}Z` }),
      el("ellipse", { class: (o.top || "ft") + c, cx: f(bx), cy: f(ty), rx: f(rx), ry: f(ry) }),
    ];
    if (o.dome) nodes.push(el("path", { class: "ft dome", d: `M${f(bx - rx)} ${f(ty)}A${f(rx)} ${f(rx * 0.55)} 0 0 1 ${f(bx + rx)} ${f(ty)}Z` }));
    if (o.cap) nodes.push(poly("fr", [[bx - rx, ty], [bx + rx, ty], [bx, ty - rx * 0.7]]));
    if (o.water) nodes.push(el("ellipse", { class: `wtr ${o.water === true ? "" : o.water}`, cx: f(bx), cy: f(ty), rx: f(rx * 0.82), ry: f(ry * 0.82) }));
    if (o.ring) nodes.push(el("ellipse", { class: "det", cx: f(bx), cy: f(ty), rx: f(rx * 0.6), ry: f(ry * 0.6) }));
    if (o.arm) {
      const arm = el("line", { class: "arm" });
      arms.push({ arm, cx, cy, r: r * 0.8, z: z + h, phase: (cx * 7 + cy * 3) % 6 });
      nodes.push(arm);
    }
    return { d: cx + cy + r * 1.42 + (o.bias || 0), nodes };
  }
  const slab = (x, y, w, d, cls, z = 0, extra) => item(x + w + y + d - 0.5, poly(cls, [P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], extra));
  // contact shadow under a tall block: the footprint nudged toward the light's far side
  const ao = (x, y, w, d, h) => {
    const o = Math.min(14, h * 0.18), k = [P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)].map(([a, b]) => [a + o, b + o * 0.45]);
    return item(0, poly("ao", k));
  };
  const use = (sym, x, y, z = 0, o = {}) => {
    const [px, py] = P(x, y, z);
    return item(o.d ?? x + y + 0.05, el("use", { href: `#${sym}`, class: o.cls, transform: `translate(${f(px)} ${f(py)})`, style: o.style }));
  };
  // a fence or railing: the top rail at height z, a post every `posts` tiles
  function rail(points, z, o = {}) {
    const c = o.cls ? ` ${o.cls}` : "", nodes = [pl("rail" + c, points.map(([x, y]) => P(x, y, z)))];
    if (o.posts) for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i], [x1, y1] = points[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / o.posts));
      for (let k = i ? 1 : 0; k <= n; k++) {
        const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        nodes.push(seg("post" + c, P(x, y), P(x, y, z)));
      }
    }
    return { d: o.d ?? Math.max(...points.map(([x, y]) => x + y)), nodes };
  }
  const pipeline = (points, z, cls, d) => item(d ?? Math.max(...points.map(([x, y]) => x + y)), pl(cls, points.map(([x, y]) => P(x, y, z))));
  const line = (cls, a, d) => item(d, pl(cls, a));
  const flat = (cls, a, d, extra) => item(d, poly(cls, a, extra));
  const tree = (x, y, s = "m", o = {}) => use(`tree-${s}`, x, y, 0, { d: x + y + 0.1, ...o });
  const manhole = (x, y, o = {}) => {
    const [cx, cy] = P(x, y);
    return item(x + y, el("ellipse", { class: "mh", cx: f(cx), cy: f(cy), rx: 6, ry: 3 }), el("ellipse", { class: "mh-ring", cx: f(cx), cy: f(cy), rx: 3.4, ry: 1.7 }), o.open && [
      el("ellipse", { class: "mh-open", cx: f(cx), cy: f(cy), rx: 5, ry: 2.5 }),
      ...[0, 1, 2].map((i) => seg("det fine", [cx - 4 + i * 4, cy - 1 + i * 0.4], [cx - 4 + i * 4, cy + 1.6 + i * 0.4])),
    ]);
  };

  /* ---- sensors ---- */
  // a ping at the instrument, a hit target for the pointer, a callout pill for
  // the main instruments and the alarm glyph for the level alarm
  const sensorNodes = {};
  function sensor(s, i, ui) {
    const [x, y, z] = s.at, [cx, cy] = P(x, y, z), g = el("g", { class: "sensor", "data-sensor": s.id, style: `--i:${i}` });
    el("circle", { class: "ping", cx: f(cx), cy: f(cy), r: 5, style: `--d:${(i * 0.45 + x * 0.1) % 2.6}` }, g);
    el("circle", { class: "ping-dot", cx: f(cx), cy: f(cy), r: 2.4 }, g);
    if (s.major) {
      const name = s.name, w = Math.round(name.length * 5.6 + 20) + (s.alarm ? 46 : 0);
      const c = el("g", { class: "callout" }, g);
      c.append(seg("callout-line", [cx, cy - 4], [cx, cy - 15]));
      el("rect", { x: f(cx - w / 2), y: f(cy - 33), width: w, height: 18, rx: 9 }, c);
      const t = el("text", { x: f(cx), y: f(cy - 20.5), "text-anchor": "middle" }, c);
      t.textContent = name;
      if (s.alarm) { const sp = el("tspan", { class: "cs-state" }, t); sp.textContent = ` · ${ui.states.normal}`; }
    }
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
    for (const [k, s] of [["s", 0.72], ["m", 1], ["l", 1.3]]) sym(`tree-${k}`, (g) => {
      g.append(seg("", [0, 0], [0, -6 * s], { style: "stroke:var(--detail);stroke-width:1" }));
      el("circle", { cx: 0, cy: f(-9 * s), r: f(7 * s), style: F("var(--tree-2)") }, g);
      el("circle", { cx: -1.5, cy: f(-13 * s), r: f(5 * s), style: F("var(--tree)") }, g);
    });
    sym("lamp", (g) => {
      el("ellipse", { class: "pool", cx: 0, cy: 0, rx: 13, ry: 6.5, style: F("var(--pool, url(#pool))") }, g);
      g.append(seg("", [0, 0], [0, -15], { style: "stroke:rgba(255,255,255,.3);stroke-width:1" }));
      el("circle", { cx: 0, cy: -15, r: 1.8, style: F("#e7fff9") }, g);
    });
    // vehicles: one symbol per direction of travel, so the beam leads
    const vehicle = (id, len, wid, h, cols, dir, o = {}) => sym(id, (g) => {
      const x = -len / 2, y = -wid / 2, w = len, d = wid;
      const beam = { e: [P(x + w, y, 2), P(x + w, y + d, 2), P(x + w + 0.42, y + d + 0.1, 0), P(x + w + 0.42, y - 0.1, 0), "url(#beam)"],
        w: [P(x, y, 2), P(x, y + d, 2), P(x - 0.42, y + d + 0.1, 0), P(x - 0.42, y - 0.1, 0), "url(#beam-r)"],
        s: [P(x, y + d, 2), P(x + w, y + d, 2), P(x + w + 0.1, y + d + 0.42, 0), P(x - 0.1, y + d + 0.42, 0), "url(#beam-r)"],
        n: [P(x, y, 2), P(x + w, y, 2), P(x + w + 0.1, y - 0.42, 0), P(x - 0.1, y - 0.42, 0), "url(#beam)"] }[dir];
      if (beam) g.append(poly("beam", beam.slice(0, 4), { style: F(beam[4]) }));
      const b = box(x, y, w, d, h);
      b.nodes[0].style.fill = cols[1]; b.nodes[1].style.fill = cols[2]; b.nodes[2].style.fill = cols[0];
      g.append(...b.nodes);
      if (o.light) el("circle", { cx: 0, cy: f(P(0, 0, h)[1]), r: 1.3, style: F("var(--aqua)") }, g);
      const tail = { e: [[x, y + d * 0.25], [x, y + d * 0.75]], w: [[x + w, y + d * 0.25], [x + w, y + d * 0.75]], s: [[x + w * 0.25, y], [x + w * 0.75, y]], n: [[x + w * 0.25, y + d], [x + w * 0.75, y + d]] }[dir];
      if (tail) for (const [tx, ty] of tail) { const [a, c] = P(tx, ty, h * 0.5); el("circle", { cx: f(a), cy: f(c), r: 0.9, style: F("var(--red)") }, g); }
    });
    const CAR = ["var(--car, #2f8d84)", "#123b37", "#1c5a54"], VAN = ["#f1fffc", "#6fcfc1", "#a9ebe1"], TRK = ["#8ea9a5", "#2a4744", "#40645f"];
    vehicle("car-e", 0.3, 0.16, 4, CAR, "e"); vehicle("car-w", 0.3, 0.16, 4, CAR, "w"); vehicle("car-s", 0.16, 0.3, 4, CAR, "s"); vehicle("car-n", 0.16, 0.3, 4, CAR, "n");
    vehicle("van-e", 0.34, 0.18, 5, VAN, "e", { light: true }); vehicle("van-s", 0.18, 0.34, 5, VAN, "s", { light: true }); vehicle("van-n", 0.18, 0.34, 5, VAN, "n", { light: true });
    vehicle("van-x", 0.34, 0.18, 5, VAN, "", { light: true }); vehicle("van-y", 0.18, 0.34, 5, VAN, "", { light: true });
    vehicle("truck-n", 0.2, 0.5, 8, TRK, "n"); vehicle("truck-x", 0.5, 0.2, 7, TRK, "");
    sym("cone", (g) => { g.append(poly("", [[-2.2, 0], [2.2, 0], [0, -6]], { style: F("var(--amber)") }), seg("", [-3, 0.5], [3, 0.5], { style: "stroke:#06201e;stroke-width:1.2" })); });
    sym("person", (g) => { el("rect", { x: -1.4, y: -6, width: 2.8, height: 6, rx: 1.2, style: F("#f2c14e") }, g); el("circle", { cx: 0, cy: -7.6, r: 1.7, style: F("#ffe3b3") }, g); });
    sym("dish", (g) => { g.append(seg("", [0, 0], [0, -3], { style: "stroke:rgba(255,255,255,.6)" })); el("ellipse", { cx: 0, cy: -5, rx: 2.4, ry: 3.4, style: F("rgba(255,255,255,.7)") }, g); });
    sym("solar", (g) => { g.append(poly("", [P(0, 0, 1), P(0.3, 0, 1), P(0.3, 0.22, 3), P(0, 0.22, 3)], { style: F("url(#solar-grad)") })); });
    sym("ac", (g) => { const b = box(0, 0, 0.14, 0.14, 3); b.nodes.forEach((n, i) => (n.style.fill = ["#8fbfb8", "#2a5955", "#3f7a73"][[2, 0, 1][i]])); g.append(...b.nodes); });
    sym("chamber", (g) => { el("ellipse", { cx: 0, cy: 0, rx: 7, ry: 3.5, style: "fill:none;stroke:var(--aqua);stroke-width:1;stroke-dasharray:2 3" }, g); g.append(seg("", [-3, -1], [-3, 3], { style: "stroke:var(--aqua);stroke-width:1" }), seg("", [3, -1], [3, 3], { style: "stroke:var(--aqua);stroke-width:1" })); });
    sym("crossing-x", (g) => { for (let i = 0; i < 5; i++) g.append(poly("", [P(i * 0.11, -0.26), P(i * 0.11 + 0.055, -0.26), P(i * 0.11 + 0.055, 0.26), P(i * 0.11, 0.26)], { style: F("rgba(255,255,255,.16)") })); });
    sym("crossing-y", (g) => { for (let i = 0; i < 5; i++) g.append(poly("", [P(-0.26, i * 0.11), P(0.26, i * 0.11), P(0.26, i * 0.11 + 0.055), P(-0.26, i * 0.11 + 0.055)], { style: F("rgba(255,255,255,.16)") })); });
    sym("bench", (g) => { g.append(poly("", [P(0, 0, 3), P(0.22, 0, 3), P(0.22, 0.08, 3), P(0, 0.08, 3)], { style: F("#6fa39b") }), seg("", P(0.02, 0.04, 0), P(0.02, 0.04, 3), { style: "stroke:#6fa39b" }), seg("", P(0.2, 0.04, 0), P(0.2, 0.04, 3), { style: "stroke:#6fa39b" })); });
    sym("reed", (g) => { for (const [dx, h] of [[-1.5, 7], [0, 9], [1.5, 6]]) g.append(seg("", [dx, 0], [dx * 1.4, -h], { style: "stroke:#4ea58d;stroke-width:1" })); });
    sym("gully", (g) => { g.append(poly("", [P(0, 0), P(0.16, 0), P(0.16, 0.08), P(0, 0.08)], { style: "fill:var(--gully,#06201e);stroke:rgba(95,180,166,.45);stroke-width:1" }), seg("", P(0.03, 0.04), P(0.13, 0.04), { style: "stroke:rgba(95,180,166,.6);stroke-width:1" })); });
    sym("pump-dome", (g) => { const c = cyl(0, 0, 0.13, 4, { dome: true }); g.append(...c.nodes); });
    // street furniture and small parts, placed by the hundred
    sym("bin", (g) => { const b = box(0, 0, 0.08, 0.08, 4); b.nodes.forEach((n, i) => (n.style.fill = ["#0d3a36", "#164f49", "#2a7a70"][i])); g.append(...b.nodes); });
    sym("sign", (g) => { g.append(seg("", [0, 0], [0, -10], { style: "stroke:rgba(255,255,255,.45);stroke-width:1" })); el("rect", { x: -2.5, y: -14, width: 5, height: 4, rx: .6, style: F("#6fcfc1") }, g); });
    sym("tlight", (g) => { g.append(seg("", [0, 0], [0, -14], { style: "stroke:rgba(255,255,255,.45);stroke-width:1.2" })); el("rect", { x: -1.6, y: -21, width: 3.2, height: 7.5, rx: .8, style: F("#06201e") }, g); [["-18.8", "var(--red)"], ["-17.2", "var(--amber)"], ["-15.6", "var(--green)"]].forEach(([y, c]) => el("circle", { cx: 0, cy: y, r: .75, style: F(c) }, g)); });
    sym("swing", (g) => { const t = P(0, 0, 9), a = P(-0.12, 0.06), b = P(0.12, -0.06), c = P(-0.12, -0.06), d = P(0.12, 0.06); g.append(seg("", a, [t[0] - 4, t[1]], { style: "stroke:#8fbfb8;stroke-width:1" }), seg("", c, [t[0] - 4, t[1]], { style: "stroke:#8fbfb8;stroke-width:1" }), seg("", b, [t[0] + 4, t[1]], { style: "stroke:#8fbfb8;stroke-width:1" }), seg("", d, [t[0] + 4, t[1]], { style: "stroke:#8fbfb8;stroke-width:1" }), seg("", [t[0] - 4, t[1]], [t[0] + 4, t[1]], { style: "stroke:#8fbfb8;stroke-width:1.2" }), seg("", [t[0] - 1.5, t[1]], [t[0] - 1.5, t[1] + 6], { style: "stroke:rgba(255,255,255,.4);stroke-width:.8" }), seg("", [t[0] + 1.5, t[1]], [t[0] + 1.5, t[1] + 6], { style: "stroke:rgba(255,255,255,.4);stroke-width:.8" })); });
    sym("rock", (g) => { g.append(poly("", [[-3, 0], [-2, -2.5], [1, -3], [3.2, -1], [2.4, 0.8], [-1.5, 1.2]], { style: F("#3d6d66") })); });
    sym("pallet", (g) => { g.append(poly("", [P(0, 0, 2), P(0.14, 0, 2), P(0.14, 0.14, 2), P(0, 0.14, 2)], { style: F("#7f9d98") }), poly("", [P(0, 0.14, 0), P(0.14, 0.14, 0), P(0.14, 0.14, 2), P(0, 0.14, 2)], { style: F("#365a55") })); });
    sym("bollard", (g) => { g.append(seg("", [0, 0], [0, -5], { style: "stroke:rgba(255,255,255,.4);stroke-width:1.2" })); el("circle", { cx: 0, cy: -5.5, r: 1, style: F("#e7fff9") }, g); });
    sym("antenna", (g) => { g.append(seg("", [0, 0], [0, -11], { style: "stroke:rgba(255,255,255,.5);stroke-width:1" }), seg("", [-3, -9], [3, -9], { style: "stroke:rgba(255,255,255,.5);stroke-width:1" }), seg("", [-2, -6.5], [2, -6.5], { style: "stroke:rgba(255,255,255,.5);stroke-width:1" })); });
    sym("flag", (g) => { g.append(seg("", [0, 0], [0, -22], { style: "stroke:rgba(255,255,255,.55);stroke-width:1" }), poly("", [[0, -22], [7, -19.5], [0, -17]], { style: F("#6fcfc1") })); });
    sym("hedge", (g) => { const b = box(0, 0, 0.3, 0.07, 3); b.nodes.forEach((n) => (n.style.fill = "var(--tree-2)")); b.nodes[2].style.fill = "var(--tree)"; g.append(...b.nodes); });
    sym("letterbox", (g) => { g.append(seg("", [0, 0], [0, -4], { style: "stroke:rgba(255,255,255,.4);stroke-width:1" })); el("rect", { x: -1.5, y: -6.5, width: 3, height: 2.5, style: F("#8fbfb8") }, g); });

    // window grids: a lit and a dark cell, three lighting variants, skewed to each face
    for (const side of ["l", "r"]) for (const v of ["a", "b", "c"]) {
      const p = el("pattern", { id: `win-${side}-${v}`, width: 14, height: 12, patternUnits: "userSpaceOnUse", patternTransform: `skewY(${side === "l" ? 26.565 : -26.565})` }, D);
      const lit = { a: ["00", "11"], b: ["10"], c: ["00", "01", "10"] }[v];
      for (const cx of [0, 1]) for (const cy of [0, 1]) el("rect", { x: 1.5 + cx * 7, y: 1.5 + cy * 6, width: 4, height: 3, style: F(lit.includes(`${cx}${cy}`) ? "rgba(255,255,255,.24)" : "rgba(0,0,0,.3)") }, p);
    }
    const rain = el("pattern", { id: "rain", width: 24, height: 24, patternUnits: "userSpaceOnUse" }, D);
    for (const [x, y] of [[4, 0], [14, 8], [21, 16]]) rain.append(seg("", [x, y], [x - 2.5, y + 9], { style: "stroke:rgba(56,189,248,.5);stroke-width:1" }));
    const bays = el("pattern", { id: "bays", width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(26.565)" }, D);
    bays.append(seg("", [0, 0], [0, 8], { style: "stroke:rgba(255,255,255,.12);stroke-width:1" }));
    const grid = el("pattern", { id: "grid", width: TW, height: TH, patternUnits: "userSpaceOnUse" }, D);
    grid.append(seg("", [0, TH / 2], [TW / 2, 0], { style: "stroke:rgba(255,255,255,.06);stroke-width:1" }), seg("", [TW / 2, 0], [TW, TH / 2], { style: "stroke:rgba(255,255,255,.06);stroke-width:1" }));

    const grad = (id, type, stops, attrs = {}) => { const g = el(type, { id, ...attrs }, D); stops.forEach(([o, c]) => el("stop", { offset: o, "stop-color": c }, g)); };
    grad("pool", "radialGradient", [[0, "rgba(95,180,166,.26)"], [1, "rgba(95,180,166,0)"]]);
    grad("pool-bright", "radialGradient", [[0, "rgba(167,230,220,.5)"], [1, "rgba(95,180,166,0)"]]);
    grad("beam", "linearGradient", [[0, "rgba(255,255,255,.34)"], [1, "rgba(255,255,255,0)"]]);
    grad("beam-r", "linearGradient", [[0, "rgba(255,255,255,0)"], [1, "rgba(255,255,255,.34)"]]);
    grad("lift-shadow", "radialGradient", [[0, "rgba(0,0,0,.55)"], [1, "rgba(0,0,0,0)"]]);
    grad("hub-glow", "radialGradient", [[0, "rgba(95,180,166,.55)"], [1, "rgba(95,180,166,0)"]]);
    grad("water-sheen", "linearGradient", [[0, "rgba(255,255,255,.2)"], [1, "rgba(255,255,255,0)"]], { x1: 0, y1: 0, x2: 0, y2: 1 });
    grad("solar-grad", "linearGradient", [[0, "#2b5c8a"], [1, "#6fa6e0"]]);
    grad("sky", "linearGradient", [[0, "rgba(4,21,19,.0)"], [1, "rgba(4,21,19,.55)"]], { x1: 0, y1: 0, x2: 0, y2: 1 });
    return D;
  }

  /* ---- the base: slab, roads, bridge, lamps; traffic goes to the overlay ---- */
  const S = [-0.6, -0.6, 15.6, 10.6], T = 14;
  const slabTop = [P(S[0], S[1]), P(S[2], S[1]), P(S[2], S[3]), P(S[0], S[3])];
  const ROADS = [[S[0], 4.7, S[2], 5.3], [4.7, S[1], 5.3, S[3]], [9.7, S[1], 10.3, S[3]], [7.3, 5.3, 7.9, S[3]]];
  function base(svg, fx) {
    const g = el("g", { class: "base" }, svg);
    g.append(
      poly("slab-l", [P(S[0], S[3]), P(S[2], S[3]), P(S[2], S[3], -T), P(S[0], S[3], -T)]),
      poly("slab-r", [P(S[2], S[1]), P(S[2], S[3]), P(S[2], S[3], -T), P(S[2], S[1], -T)]),
      ...[-4, -9].map((z) => poly("strata", [P(S[0], S[3], z), P(S[2], S[3], z), P(S[2], S[3], z - 1.5), P(S[0], S[3], z - 1.5)])),
      ...[-4, -9].map((z) => poly("strata", [P(S[2], S[1], z), P(S[2], S[3], z), P(S[2], S[3], z - 1.5), P(S[2], S[1], z - 1.5)])),
      poly("slab-top", slabTop),
      pl("rim", [P(S[0], S[3]), P(S[2], S[3]), P(S[2], S[1])])
    );
    // pipes leave the slab where the mains reach its edge
    for (const [x, y] of [[5.18, S[3]], [10.18, S[3]], [S[2], 5.18], [S[2], 2.4]]) { const [cx, cy] = P(x, y, -6); el("ellipse", { class: "mh", cx: f(cx), cy: f(cy), rx: 2.8, ry: 2.2 }, g); }
    // roads: a surface, kerbs, lane dashes and crossings
    for (const [x0, y0, x1, y1] of ROADS) g.append(poly("road", [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)]));
    for (const a of [[P(S[0], 4.7), P(S[2], 4.7)], [P(S[0], 5.3), P(S[2], 5.3)], [P(4.7, S[1]), P(4.7, S[3])], [P(5.3, S[1]), P(5.3, S[3])], [P(9.7, S[1]), P(9.7, S[3])], [P(10.3, S[1]), P(10.3, S[3])], [P(7.3, 5.3), P(7.3, S[3])], [P(7.9, 5.3), P(7.9, S[3])]]) g.append(pl("kerb", a));
    for (const a of [[P(-0.4, 5), P(15.4, 5)], [P(5, -0.4), P(5, 10.4)], [P(10, -0.4), P(10, 10.4)], [P(7.6, 5.4), P(7.6, 10.4)]]) g.append(pl("road-line", a));
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
    const vehicle = (sym, route, dur, begin) => {
      const v = el("g", { class: "veh" }, t);
      el("use", { href: `#${sym}` }, v);
      el("animateMotion", { dur: `${dur}s`, begin: `${begin}s`, repeatCount: "indefinite", path: "M" + route.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") }, v);
    };
    vehicle("van-e", [P(-0.9, 4.85), P(15.9, 4.85)], 17, 0);
    vehicle("van-e", [P(-0.9, 4.85), P(15.9, 4.85)], 17, -9);
    vehicle("car-w", [P(15.9, 5.15), P(-0.9, 5.15)], 19, -3);
    vehicle("van-s", [P(4.85, -0.9), P(4.85, 10.9)], 13, -4);
    vehicle("car-n", [P(5.15, 10.9), P(5.15, -0.9)], 17, -11);
    vehicle("van-n", [P(9.85, 10.9), P(9.85, -0.9)], 12, -7);
    vehicle("car-s", [P(10.15, -0.9), P(10.15, 10.9)], 15, -6);
    vehicle("truck-n", [P(10.15, 10.9), P(10.15, -0.9)], 23, -1);
    vehicle("car-s", [P(7.6, 5.0), P(7.6, 10.9)], 9, -2);
    return g;
  }

  /* ---- the underground: every pipe, chamber and lateral ---- */
  // The still parts sit under the districts; the flowing dashes live in the
  // overlay, clipped to the roads until "Show the sewer" lifts the clip.
  function under(svg, fx) {
    const g = el("g", { class: "under", id: "under" }, svg);
    const a = el("g", { class: "under-fx" }, fx);
    g.append(poly("ugrid", slabTop));
    const pipes = [
      [P(15.3, 5.18), P(2.3, 5.18), P(2.3, 5.5)],
      [P(5.18, 0.2), P(5.18, 5.18)], [P(5.18, 10.2), P(5.18, 5.18)],
      [P(10.18, 0.2), P(10.18, 5.18)], [P(10.18, 10.2), P(10.18, 5.18)],
      [P(6.78, 0.3), P(6.78, 5.18)], [P(8.13, 0.3), P(8.13, 5.18)],
    ];
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
    return g;
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
          ...[[0.6, 3.1, "m"], [1.3, 3.8, "l"], [2.2, 4.1, "m"], [0.5, 4.1, "s"], [3.5, 0.6, "l"], [4.1, 1.3, "m"], [2.6, 0.5, "m"], [4.15, 2.3, "s"], [3.1, 1.5, "m"], [0.3, 2.9, "s"], [0.9, 3.4, "m"], [1.6, 4.25, "s"], [0.25, 3.7, "m"], [3.9, 0.3, "s"], [4.35, 0.9, "s"], [2.0, 0.45, "s"], [3.75, 2.05, "m"], [1.0, 2.5, "s"], [0.45, 1.85, "s"]].map(([x, y, s]) => tree(x, y, s)),
          ...[[3.3, 0.9], [3.55, 0.85], [3.8, 1.0], [3.95, 1.2], [3.45, 1.3], [3.2, 1.05]].map(([x, y]) => use("reed", x, y, 0, { cls: "fine" })),
          use("bench", 0.7, 3.55, 0, { cls: "fine" }), use("bench", 1.15, 4.3, 0, { cls: "fine" }),
          // weather station: mast, instrument box, solar panel, rain gauge
          ao(1.45, 0.45, 0.1, 0.1, 30), box(1.45, 0.45, 0.1, 0.1, 30), box(1.3, 0.3, 0.4, 0.4, 5, { z: 30, top: "lit" }), use("solar", 1.32, 0.3, 35, { d: 2.2 }),
          cyl(0.75, 0.75, 0.16, 9), item(1.7, el("ellipse", { class: "funnel", cx: f(P(0.75, 0.75, 9)[0]), cy: f(P(0.75, 0.75, 9)[1]), rx: 4.5, ry: 2.2 })),
          // the gauging weir with its stilling well and staff gauge
          box(2.12, 1.88, 0.26, 0.84, 3, { cls: "weir" }), line("foam", [P(2.46, 1.95), P(2.46, 2.75)], 5.3),
          cyl(1.95, 1.25, 0.14, 12), item(3.3, seg("det", P(2.62, 2.78), P(2.62, 2.78, 14)), ...[0, 1, 2, 3, 4].map((i) => seg("det fine", P(2.62, 2.78, 2 + i * 3), [P(2.62, 2.78, 2 + i * 3)[0] + 3, P(2.62, 2.78, 2 + i * 3)[1]]))),
          // footbridge over the upper reach
          box(1.07, 0.85, 0.08, 0.1, 4), box(1.07, 1.9, 0.08, 0.1, 4),
          flat("deck", [P(1.03, 0.85, 4), P(1.25, 0.85, 4), P(1.25, 2.0, 4), P(1.03, 2.0, 4)], 3.3),
          rail([[1.05, 0.85], [1.05, 2.0]], 8, { posts: 0.3, cls: "fine", d: 3.31 }), rail([[1.23, 0.85], [1.23, 2.0]], 8, { posts: 0.3, cls: "fine", d: 3.32 }),
          // the plant outfall headwall on the south bank, and a thermistor string in the lower reach
          box(1.38, 2.15, 0.32, 0.2, 4), item(3.75, el("ellipse", { class: "mh", cx: f(P(1.54, 2.35, 2)[0]), cy: f(P(1.54, 2.35, 2)[1]), rx: 2.6, ry: 2 })),
          line("therm", [P(3.4, 3.85), P(3.4, 3.25)], 7.3), item(7.31, ...[0, 1, 2, 3].map((i) => { const [cx, cy] = P(3.4, 3.8 - i * 0.18); return el("circle", { class: "bead", cx: f(cx), cy: f(cy), r: 1.5, style: `--i:${i}` }); })),
        ];
        const [tx, ty] = P(0.75, 0.75, 11);
        const fx = [...S, el("circle", { class: "tip", cx: f(tx), cy: f(ty), r: 1.6 })];
        return { decals, vol, fx, cut: [{ type: "bed", x0: 0.9, x1: 1.5 }] };
      },
    },
    sewer: {
      rect: [5.4, 0, 9.6, 4.6], h: 46,
      build(S) {
        const decals = [
          slab(6.6, 0.3, 0.35, 4.15, "lane"), slab(7.95, 0.3, 0.35, 4.15, "lane"),
          ...["pipe-glow", "pipe", "pipe-flow"].flatMap((cls) => [6.78, 8.13].map((x) => line(cls, [P(x, 0.3), P(x, 4.45)]))),
          slab(8.5, 0.3, 1.0, 1.0, "park"), line("path fine", [P(8.55, 0.8), P(9.45, 0.8)]),
          ...[[5.7, 1.1], [5.7, 2.1], [7.05, 2.1], [7.05, 3.1], [8.4, 2.1], [8.4, 3.1]].map(([x, y]) => slab(x + 0.5, y + 0.05, 0.25, 0.22, "drive fine")),
          ...[[5.65, 0.3, 5.65, 4.4], [7.0, 1.3, 7.0, 4.4], [8.35, 1.3, 8.35, 4.4]].map(([a, b, c2, d2]) => line("fence fine", [P(a, b), P(c2, d2)])),
          ao(7.05, 1.4, 0.75, 0.75, 18), ao(8.4, 2.4, 0.75, 0.75, 18),
        ];
        const vol = [];
        const kinds = ["px", "py", "h", "py", "px", "h", "py", "h", "px", "py", "px"];
        [[5.7, 0.4], [5.7, 1.4], [5.7, 2.4], [5.7, 3.4], [7.05, 0.4], [7.05, 1.4], [7.05, 2.4], [7.05, 3.4], [8.4, 1.4], [8.4, 2.4], [8.4, 3.4]].forEach(([x, y], i) => {
          const two = (x === 7.05 && y === 1.4) || (x === 8.4 && y === 2.4), h = two ? 18 : 11, k = kinds[i];
          vol.push(k === "px" ? prism(x, y, 0.75, 0.7, h, 7, { gable: "x" }) : k === "py" ? prism(x, y, 0.7, 0.75, h, 6, { gable: "y" }) : house(x, y, 0.75, 0.75, h + 1, 9));
          vol.push(flat("door fine", [P(x + 0.28, y + 0.75, 0), P(x + 0.42, y + 0.75, 0), P(x + 0.42, y + 0.75, 6), P(x + 0.28, y + 0.75, 6)], x + 0.75 + y + 0.75 + 0.001));
          if (i % 3 === 0) vol.push(box(x + 0.5, y + 0.12, 0.1, 0.1, 5, { z: h + 3, bias: 0.002 }));
          if (i % 4 === 1) vol.push(box(x + 0.5, y + 0.05, 0.3, 0.3, 7, { bias: 0.003 }));
        });
        vol.push(
          ...[[8.7, 0.5, "m"], [9.3, 0.6, "s"], [9.2, 1.15, "m"], [6.2, 0.2, "s"], [7.6, 0.2, "s"], [9.0, 4.4, "s"], [6.3, 4.4, "s"], [7.7, 4.4, "s"], [5.5, 4.4, "s"], [9.45, 2.0, "s"], [9.45, 3.2, "s"]].map(([x, y, s]) => tree(x, y, s)),
          use("bench", 8.6, 1.05, 0, { cls: "fine" }),
          ...[[6.78, 0.9], [6.78, 2.3], [6.78, 3.7], [8.13, 1.7], [8.13, 3.95]].map(([x, y]) => use("lamp", x, y, 0, { d: x + y + 0.06 })),
          box(9.2, 4.2, 0.4, 0.16, 5, { top: "lit" }),
          manhole(6.78, 1.55), manhole(8.13, 1.0), manhole(6.78, 0.5), manhole(8.13, 3.05),
          // the EDS crew lowering a flow meter down the open maintenance hole
          manhole(6.78, 3.05, { open: true }),
          item(9.84, ...[[-0.14, 0.12], [0.14, 0.1], [0.02, -0.16]].map(([dx, dy]) => seg("det", P(6.78 + dx, 3.05 + dy), P(6.78, 3.05, 17)))),
          item(9.85, ...cyl(6.78, 3.05, 0.055, 3, { z: 7 }).nodes.map((n, i) => (n.classList.add("meter"), (n.style.fill = ["#6fb8ad", "#479086", "#dbf0ec"][i]), n))),
          use("cone", 6.56, 3.3, 0, { d: 9.88 }), use("cone", 7.0, 2.82, 0, { d: 9.84 }),
          use("person", 6.6, 2.86, 0, { d: 9.47 }), use("person", 7.0, 3.26, 0, { d: 10.27 }),
          use("van-y", 6.78, 3.95, 0, { d: 10.75 }),
          // the LIDoTT alarm unit on the next manhole
          box(8.06, 2.98, 0.14, 0.14, 5, { top: "lit", bias: 0.01 }), item(11.2, seg("det", P(8.13, 3.05, 5), P(8.13, 3.05, 14)))
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
        const towers = [[10.8, 0.5, 1.1, 1.1, 86, "a"], [12.4, 0.4, 1.0, 1.0, 118, "b"], [13.9, 0.6, 0.8, 0.9, 64, "c"], [10.9, 2.4, 1.2, 0.9, 46, "b"], [12.6, 2.2, 1.0, 1.2, 72, "a"], [14.0, 2.5, 0.7, 0.8, 54, "c"], [11.95, 1.5, 0.55, 0.6, 38, "c"], [14.2, 1.65, 0.5, 0.6, 30, "a"], [11.7, 3.35, 0.7, 0.5, 26, "b"]];
        const decals = [slab(10.9, 3.75, 1.1, 0.75, "plaza"), ...towers.filter((t) => t[4] > 40).map(([x, y, w, d, h]) => ao(x, y, w, d, h))];
        const vol = [
          ...towers.map(([x, y, w, d, h, v]) => box(x, y, w, d, h, { win: v })),
          box(12.55, 0.55, 0.7, 0.7, 20, { z: 118 }), box(12.75, 0.75, 0.3, 0.3, 8, { z: 138, top: "lit" }),
          item(14.9, seg("mast", P(12.9, 0.9, 146), P(12.9, 0.9, 162)), el("circle", { class: "blink", cx: f(P(12.9, 0.9, 163)[0]), cy: f(P(12.9, 0.9, 163)[1]), r: 1.8 })),
          box(12.75, 2.35, 0.7, 0.9, 14, { z: 72 }),
          ...[[11.0, 0.7, 86], [11.5, 1.2, 86], [14.2, 0.8, 64], [12.9, 2.5, 86], [11.3, 2.6, 46]].map(([x, y, z]) => use("ac", x, y, z, { d: x + y + 0.3 })),
          cyl(11.6, 0.6, 0.11, 6, { z: 86 }), item(14.9, seg("mast", P(14.3, 0.8, 64), P(14.3, 0.8, 78)), seg("mast", P(14.45, 2.65, 54), P(14.45, 2.65, 66))),
          // the plaza: fountain, trees, a kiosk with the Metalog logger, a transit canopy
          cyl(11.45, 4.1, 0.2, 2, { water: true, ring: true }),
          ...[[10.98, 3.85, "s"], [11.9, 3.85, "s"], [10.98, 4.4, "s"], [11.9, 4.4, "s"]].map(([x, y, s]) => tree(x, y, s)),
          box(12.05, 4.2, 0.25, 0.25, 6, { top: "lit" }),
          slab(12.85, 3.75, 1.6, 0.65, "platform", 1, {}), box(12.9, 3.8, 1.5, 0.55, 12, { top: "lit" }),
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
          ao(3.0, 6.3, 0.9, 0.9, 30), ao(4.0, 7.0, 0.7, 0.7, 22),
        ];
        const [ax, ay] = [2.3, 8.2];
        const vol = [
          // inlet works: screening channel, flume, screen house
          box(0.3, 5.7, 1.2, 0.45, 6), item(7.66, ...[0, 1, 2, 3, 4].map((i) => seg("det", P(0.45 + i * 0.22, 6.15, 6), P(0.45 + i * 0.22, 6.15, 1)))),
          flat("wtr flume", [P(0.4, 5.78, 6), P(1.4, 5.78, 6), P(1.4, 6.07, 6), P(0.4, 6.07, 6)], 7.66), box(1.55, 5.7, 0.4, 0.45, 9, { top: "lit" }),
          // two clarifiers with turning scraper arms, launder rings and walkways
          cyl(1.1, 6.55, 0.78, 5, { water: true, arm: true, ring: true }), cyl(1.1, 8.65, 0.78, 5, { water: true, arm: true, ring: true }),
          cyl(1.1, 6.55, 0.12, 3, { z: 5, bias: 0.01 }), cyl(1.1, 8.65, 0.12, 3, { z: 5, bias: 0.01 }),
          rail([[0.32, 6.55], [1.1, 6.55]], 8, { posts: 0.26, cls: "fine", d: 7.7 }), rail([[0.32, 8.65], [1.1, 8.65]], 8, { posts: 0.26, cls: "fine", d: 9.8 }),
          // aeration basin with diffusers
          box(ax, ay, 1.5, 1.3, 5), flat("wtr", [P(ax + 0.12, ay + 0.12, 5), P(ax + 1.38, ay + 0.12, 5), P(ax + 1.38, ay + 1.18, 5), P(ax + 0.12, ay + 1.18, 5)], ax + 1.5 + ay + 1.3 + 0.01),
          line("wtr-line", [P(ax + 0.2, ay + 0.65, 5), P(ax + 1.3, ay + 0.65, 5)], ax + 1.5 + ay + 1.3 + 0.02),
          item(ax + 1.5 + ay + 1.3 + 0.015, ...[0.35, 0.65, 0.95].map((k) => seg("det fine", P(ax + 0.2, ay + k, 5), P(ax + 1.3, ay + k, 5)))),
          // digesters, the flare and the dosing plant
          cyl(3.0, 6.3, 0.55, 30, { dome: true }), cyl(4.0, 7.0, 0.45, 22, { dome: true }),
          line("stair fine", [P(2.5, 6.6, 2), P(2.6, 6.5, 10), P(2.75, 6.35, 18), P(2.9, 6.2, 26)], 9.2),
          cyl(4.45, 6.2, 0.07, 34), box(4.1, 8.3, 0.1, 0.1, 8, { bias: 0.01 }), box(4.3, 8.3, 0.1, 0.1, 8, { bias: 0.011 }), box(4.5, 8.3, 0.1, 0.1, 8, { bias: 0.012 }),
          // chlorine contact tank, admin and laboratory, the ORI sampler cabinet
          box(0.3, 9.3, 1.6, 0.4, 6, { top: "wtr" }), item(0.3 + 1.6 + 9.3 + 0.4 + 0.01, seg("det", P(0.8, 9.3, 6), P(0.8, 9.7, 6)), seg("det", P(1.3, 9.3, 6), P(1.3, 9.7, 6))),
          box(3.5, 9.0, 1.0, 0.6, 14, { win: "b" }), flat("lit", [P(3.9, 9.6, 0), P(4.1, 9.6, 0), P(4.1, 9.6, 6), P(3.9, 9.6, 6)], 3.5 + 1.0 + 9.0 + 0.6 + 0.002),
          box(3.25, 9.62, 0.25, 0.25, 7, { top: "lit" }),
          // pipe rack linking the process line, the fence, lamps, trees, the service van
          rail([[1.9, 5.95], [2.6, 5.95], [2.6, 8.0], [2.2, 8.0]], 8, { posts: 0.5, cls: "pipe-rack", d: 9.0 }),
          rail([[0.15, 5.5], [4.5, 5.5], [4.5, 9.95]], 5, { posts: 0.55, cls: "fence fine", d: 4.2 }),
          rail([[0.15, 5.5], [0.15, 9.95], [4.5, 9.95]], 5, { posts: 0.55, cls: "fence fine", d: 14.5 }),
          ...[[0.3, 7.6], [1.95, 7.5], [2.0, 9.75], [4.4, 7.9]].map(([x, y]) => use("lamp", x, y, 0, { d: x + y + 0.06 })),
          ...[[0.2, 9.9, "s"], [4.45, 5.6, "s"], [4.45, 9.85, "s"]].map(([x, y, s]) => tree(x, y, s)),
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
        const decals = [slab(5.55, 5.6, 1.5, 4.3, "ground2"), flat("track", [P(5.4, 8.95), P(5.6, 8.95), P(5.6, 9.2), P(5.4, 9.2)]), ao(5.7, 5.8, 1.15, 1.2, 20)];
        const vol = [
          rail([[5.55, 5.6], [7.05, 5.6], [7.05, 9.9]], 5, { posts: 0.5, cls: "fence fine", d: 11.1 }), rail([[5.55, 5.6], [5.55, 9.9], [6.5, 9.9]], 5, { posts: 0.5, cls: "fence fine", d: 16.6 }),
          house(5.7, 5.8, 1.15, 1.2, 20, 8), flat("door fine", [P(6.1, 7.0, 0), P(6.5, 7.0, 0), P(6.5, 7.0, 12), P(6.1, 7.0, 12)], 5.7 + 1.15 + 5.8 + 1.2 + 0.001),
          cyl(5.75, 5.85, 0.04, 26), cyl(5.6, 6.1, 0.05, 24, { cap: true }),
          line("det", [P(6.3, 7.0), P(6.3, 7.5)], 13.4),
          // the wet well with its two pumps and run lights
          cyl(6.3, 8.05, 0.6, 5, { water: "well" }),
          use("pump-dome", 6.12, 7.92, 5, { d: 14.08 }), use("pump-dome", 6.48, 8.18, 5, { d: 14.7 }),
          cyl(6.8, 6.6, 0.35, 10), box(6.85, 8.6, 0.3, 0.3, 4), item(16.06, el("circle", { class: "det", cx: f(P(6.95, 8.75, 4)[0]), cy: f(P(6.95, 8.75, 4)[1]), r: 1.6 }), el("circle", { class: "det", cx: f(P(7.05, 8.75, 4)[0]), cy: f(P(7.05, 8.75, 4)[1]), r: 1.6 })),
          box(6.4, 9.3, 0.5, 0.3, 7),
          // the control cabinet with the Pump Station Manager, its antenna and solar panel
          box(5.75, 9.1, 0.4, 0.4, 12, { top: "lit" }), item(15.66, seg("mast", P(6.1, 9.15, 12), P(6.1, 9.15, 32)), el("circle", { class: "blink", cx: f(P(6.1, 9.15, 33)[0]), cy: f(P(6.1, 9.15, 33)[1]), r: 1.6 })), use("solar", 5.78, 9.2, 12, { d: 15.67 }),
          use("van-y", 5.62, 9.5, 0, { d: 15.2 }), use("person", 5.95, 9.6, 0, { d: 15.6 }),
          tree(5.5, 6.9, "s"), tree(7.1, 9.6, "s"),
        ];
        const run = [[6.12, 7.92], [6.48, 8.18]].map(([x, y], i) => { const [cx, cy] = P(x, y, 10); return el("circle", { class: i ? "run" : "run run-a", cx: f(cx), cy: f(cy), r: 1.4, style: `--i:${i}` }); });
        return { decals, vol, fx: [...run, ...S], cut: [{ type: "well", x: 6.3 }] };
      },
    },
    ops: {
      rect: [8.0, 5.4, 9.6, 10], h: 84,
      build(S) {
        const decals = [slab(8.3, 9.2, 1.2, 0.7, "yard", 0, { style: "fill:url(#bays)" }), slab(8.2, 8.25, 1.1, 0.95, "ground2"), ao(8.25, 5.8, 1.1, 2.3, 44)];
        const hub = P(8.8, 6.5, 78);
        const vol = [
          box(8.25, 5.8, 1.1, 2.3, 44, { win: "c" }), flat("lit", [P(9.35, 6.6, 0.4), P(9.35, 7.3, 0.4), P(9.35, 7.3, 9), P(9.35, 6.6, 9)], 8.25 + 1.1 + 5.8 + 2.3 + 0.002),
          flat("deck", [P(9.35, 6.5, 10), P(9.6, 6.5, 10), P(9.6, 7.4, 10), P(9.35, 7.4, 10)], 8.25 + 1.1 + 5.8 + 2.3 + 0.003),
          item(8.25 + 1.1 + 5.8 + 2.3 + 0.004, ...[0, 1, 2].flatMap((i) => [0, 1].map((j) => poly("screen", [P(8.4 + i * 0.3, 8.1, 20 + j * 9), P(8.62 + i * 0.3, 8.1, 20 + j * 9), P(8.62 + i * 0.3, 8.1, 27 + j * 9), P(8.4 + i * 0.3, 8.1, 27 + j * 9)], { style: `--i:${i + j * 3}` })))),
          ...[[8.4, 6.0, 44], [8.4, 6.5, 44], [8.4, 7.0, 44], [8.4, 7.5, 44]].map(([x, y, z]) => use("solar", x, y, z, { d: x + y + 0.3 })),
          use("ac", 8.95, 7.6, 44, { d: 16.9 }), use("ac", 8.95, 7.2, 44, { d: 16.5 }),
          item(16.95, seg("mast", P(8.8, 6.5, 44), P(8.8, 6.5, 76), { style: "stroke-width:2" }), seg("mast", P(8.72, 6.42, 58), P(8.88, 6.58, 58)), seg("mast", P(8.72, 6.42, 66), P(8.88, 6.58, 66)), seg("mast", P(8.74, 6.44, 72), P(8.86, 6.56, 72))),
          use("dish", 8.8, 6.5, 62, { d: 16.96 }), use("dish", 8.86, 6.56, 70, { d: 16.97 }),
          item(16.98, el("ellipse", { class: "hub", cx: f(hub[0]), cy: f(hub[1]), rx: 16, ry: 10 }), el("circle", { class: "beacon", cx: f(hub[0]), cy: f(hub[1]), r: 4 }), el("circle", { class: "blink", cx: f(hub[0]), cy: f(hub[1] - 2), r: 1.8 })),
          box(8.3, 8.3, 0.9, 0.8, 18, { top: "lit" }), flat("door fine", [P(8.55, 9.1, 0), P(8.95, 9.1, 0), P(8.95, 9.1, 11), P(8.55, 9.1, 11)], 8.3 + 0.9 + 8.3 + 0.8 + 0.001),
          ...[[8.38, 9.3], [8.72, 9.3], [9.06, 9.3]].map(([x, y]) => use("van-x", x, y, 0, { d: x + y + 0.2 })), use("car-e", 8.5, 9.68, 0, { d: 18.4 }), use("car-e", 8.9, 9.68, 0, { d: 18.8 }),
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
          ao(10.8, 5.8, 2.6, 1.6, 22), ao(13.95, 6.2, 0.34, 0.34, 58), ao(14.45, 6.7, 0.34, 0.34, 46), ao(13.3, 7.9, 1.3, 1.7, 16),
        ];
        const vol = [
          // the big shed with roof monitors and roller doors, trucks at its dock
          box(10.8, 5.8, 2.6, 1.6, 22), ...[0, 1, 2].map((i) => box(10.95 + i * 0.85, 5.95, 0.55, 1.3, 6, { z: 22, bias: 0.02 + i * 0.001 })),
          item(10.8 + 2.6 + 5.8 + 1.6 + 0.002, ...[0, 1, 2].map((i) => poly("door", [P(11.0 + i * 0.8, 7.4, 0), P(11.5 + i * 0.8, 7.4, 0), P(11.5 + i * 0.8, 7.4, 12), P(11.0 + i * 0.8, 7.4, 12)]))),
          use("truck-x", 12.3, 7.65, 0, { d: 20.1 }), use("truck-x", 11.3, 7.65, 0, { d: 19.1 }),
          // the sawtooth works and its office
          ...[0, 1, 2].map((i) => prism(13.3 + i * 0.43, 7.9, 0.43, 1.3, 16, 6, { gable: "y", skylight: true, bias: i * 0.001 })), box(13.3, 9.2, 1.3, 0.35, 16, { win: "a" }),
          // the stacks and the tank farm inside its bund
          cyl(13.95, 6.2, 0.17, 58), cyl(14.45, 6.7, 0.17, 46), line("ladder fine", [P(14.1, 6.2, 2), P(14.1, 6.2, 56)], 20.5), line("ladder fine", [P(14.6, 6.7, 2), P(14.6, 6.7, 44)], 21.4),
          box(10.75, 8.1, 2.4, 0.06, 3), box(10.75, 8.1, 0.06, 1.75, 3, { bias: 0.001 }), box(13.1, 8.1, 0.06, 1.75, 3), box(10.75, 9.8, 2.4, 0.06, 3),
          cyl(11.3, 8.7, 0.5, 18), cyl(12.5, 8.7, 0.5, 18), cyl(11.9, 9.45, 0.28, 12), cyl(12.85, 9.5, 0.22, 10), box(12.35, 9.55, 0.25, 0.2, 5),
          rail([[11.3, 8.1], [11.3, 7.6], [12.4, 7.6]], 9, { posts: 0.5, cls: "pipe-rack", d: 19.8 }),
          // cooling tower, gate kiosk, weighbridge, gantry and fence
          box(14.3, 9.2, 0.5, 0.5, 14), item(14.3 + 0.5 + 9.2 + 0.5 + 0.001, ...[3, 6, 9].map((z) => seg("det fine", P(14.3, 9.7, z), P(14.8, 9.7, z)))),
          slab(10.5, 6.6, 0.4, 0.75, "track"), box(10.5, 6.9, 0.25, 0.25, 7, { top: "lit" }),
          box(13.55, 5.6, 0.08, 0.08, 20), box(14.55, 5.6, 0.08, 0.08, 20, { bias: 0.001 }), item(20.4, seg("mast", P(13.59, 5.64, 20), P(14.59, 5.64, 20))),
          rail([[10.45, 5.45], [14.95, 5.45]], 5, { posts: 0.6, cls: "fence fine", d: 11 }), rail([[14.95, 5.45], [14.95, 9.95]], 5, { posts: 0.6, cls: "fence fine", d: 25 }),
          // the trade-waste discharge point: inspection chamber, sampling kiosk, meter cabinet
          manhole(10.85, 7.8), box(10.45, 7.45, 0.3, 0.3, 12, { top: "lit" }), box(11.5, 7.85, 0.2, 0.2, 7),
          ...[[10.7, 9.45], [10.95, 9.45], [11.2, 9.45], [11.45, 9.45]].map(([x, y]) => use("car-s", x, y, 0, { d: x + y + 0.2 })),
          ...[[10.6, 5.6], [14.8, 7.9], [12.7, 9.9]].map(([x, y]) => use("lamp", x, y, 0, { d: x + y + 0.06 })),
          tree(14.85, 9.4, "s"), tree(10.5, 8.6, "s"), tree(12.0, 5.55, "s"),
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
      ...[[2.35, 0.3, "s"], [4.45, 1.85, "s"], [0.75, 4.4, "s"], [2.55, 4.4, "s"], [1.75, 3.55, "s"]].map(([x, y, k]) => tree(x, y, k)),
      house(3.95, 4.05, 0.3, 0.3, 5, 4), slab(4.1, 2.9, 0.45, 0.5, "track"), use("car-s", 4.2, 3.0, 0, { d: 7.4 }), use("car-s", 4.4, 3.15, 0, { d: 7.75 }),
      rail([[0.5, 0.45], [1.75, 0.45], [1.75, 1.05], [0.5, 1.05], [0.5, 0.45]], 4, { posts: 0.3, cls: "fence fine", d: 2.9 }),
      use("antenna", 1.95, 1.25, 12, { d: 3.3 }), ...many("bollard", [[0.95, 2.25], [1.15, 2.25], [1.35, 2.25]], { cls: "fine" }),
      ...many("sign", [[4.45, 2.35], [0.4, 0.4]], { cls: "fine" }), use("bench", 2.75, 1.65, 0, { cls: "fine" }),
      flat("bank", [P(2.75, 2.75), P(3.1, 2.85), P(3.2, 3.05), P(2.8, 3.0)]),
    ],
    sewer: () => [
      ...many("solar", [[5.85, 0.55, 14], [7.2, 2.55, 14], [8.55, 3.55, 14], [5.85, 2.55, 14]]),
      ...many("antenna", [[6.1, 1.75, 17], [7.4, 3.75, 17], [8.75, 1.75, 23], [6.1, 3.75, 17], [7.45, 0.75, 17]], { cls: "fine" }),
      ...many("letterbox", [[6.5, 1.15], [6.5, 2.15], [7.85, 2.15], [7.85, 3.15], [9.2, 2.15], [9.2, 3.15]], { cls: "fine" }),
      ...many("bin", [[6.55, 0.55], [6.55, 2.6], [7.9, 1.6], [7.9, 3.6], [9.25, 1.6], [9.25, 3.65]], { cls: "fine" }),
      ...many("car-s", [[6.6, 1.1], [7.95, 3.1], [9.3, 2.1]], { d: 0 }).map((u) => ({ ...u, d: 99 })),
      ...many("hedge", [[5.7, 1.25], [7.05, 2.25], [8.4, 3.25], [5.7, 3.25], [7.05, 1.25]], { cls: "fine" }),
      ...many("sign", [[6.6, 4.45], [8.0, 4.45]], { cls: "fine" }), use("swing", 8.95, 0.75, 0, { cls: "fine" }), use("bench", 9.3, 1.1, 0, { cls: "fine" }),
      ...[[6.35, 0.95, "s"], [6.35, 2.95, "s"], [7.75, 1.0, "s"], [7.75, 2.95, "s"], [9.15, 2.95, "s"], [9.1, 0.4, "s"], [9.5, 0.95, "s"]].map(([x, y, k]) => tree(x, y, k)),
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
      rail([[2.42, 8.32], [3.68, 8.32], [3.68, 9.38], [2.42, 9.38], [2.42, 8.32]], 8, { posts: 0.35, cls: "fine", d: 13.2 }),
      rail([[0.3, 9.3], [1.9, 9.3]], 9, { posts: 0.4, cls: "fine", d: 11.3 }),
      rail([[3.55, 6.3], [3.55, 5.95], [4.45, 5.95]], 10, { posts: 0.45, cls: "pipe-rack", d: 10.9 }),
      box(2.1, 6.55, 0.5, 0.35, 8), box(2.0, 7.2, 0.4, 0.4, 6, { top: "lit" }),
      ...many("bollard", [[0.4, 5.6], [0.7, 5.6], [1.0, 5.6], [1.3, 5.6], [4.2, 9.85], [3.9, 9.85]], { cls: "fine" }),
      ...many("bin", [[3.4, 9.7], [1.95, 6.2]], { cls: "fine" }), ...many("sign", [[0.3, 6.4], [4.4, 8.9]], { cls: "fine" }),
      use("car-e", 3.6, 9.72, 0, { d: 13.5 }), ...many("pallet", [[4.15, 9.1], [4.3, 9.1]], { cls: "fine" }),
      ...[[0.2, 6.9, "s"], [0.2, 8.4, "s"], [2.6, 9.9, "s"], [4.45, 7.3, "s"]].map(([x, y, k]) => tree(x, y, k)),
      item(7.5, ...[0, 1, 2].map((i) => el("circle", { class: "det fine", cx: f(P(0.5 + i * 0.35, 6.3, 7)[0]), cy: f(P(0.5 + i * 0.35, 6.3, 7)[1]), r: 1.6 }))),
    ],
    pump: () => [
      ...many("solar", [[6.55, 5.7, 3], [6.85, 5.7, 3], [6.55, 5.95, 3], [6.85, 5.95, 3]]),
      cyl(7.0, 7.3, 0.14, 8), box(6.95, 7.7, 0.2, 0.2, 3), manhole(6.3, 9.0),
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
  };

  /* ---- assemble ---- */
  // Two SVGs share one viewBox: the still city (districts, slab, pipes) and,
  // over it, everything that moves (traffic, pings, flows, packets, labels,
  // the storm). The browser then repaints only the overlay each frame. A
  // district's moving parts sit in a matching group in the overlay that lifts
  // with it.
  const VB = "-330 -52 800 448";
  const MOVING = ".arm,.meter,.blink,.hub,.beacon,.screen,.bead,.wtr-line,.foam,.pipe-flow";
  function build(svg, data) {
    svg.setAttribute("viewBox", VB);
    svg.classList.add("city-svg");
    const fx = el("svg", { id: "city-fx", class: "city-svg city-fx", viewBox: VB, "aria-hidden": "true", focusable: "false" });
    svg.after(fx);
    const ui = data.ui, byZone = Object.fromEntries(data.zones.map((z) => [z.id, z]));
    const D = defs(svg, data);
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
        const parts = z.build(sensors);
        parts.vol.push(...(DETAIL[id] ? DETAIL[id]() : []));
        const dec = el("g", { class: "decals" }, g), vol = el("g", { class: "vol" }, g), cut = el("g", { class: "cut" }, g);
        parts.decals.forEach((p) => p.nodes.forEach((n) => dec.appendChild(n)));
        parts.vol.sort((a, b) => a.d - b.d).forEach((p) => p.nodes.forEach((n) => vol.appendChild(n)));
        cutaway(z, parts.cut).forEach((n) => cut.appendChild(n));
        [...g.querySelectorAll(MOVING)].forEach((n) => gf.appendChild(n));
        parts.fx.forEach((n) => gf.appendChild(n));
        zones[id] = g; zoneFx[id] = gf; slots[id] = order;
        // the shadow the lifted district casts, and its label floating above
        shadows[id] = el("ellipse", { class: "shadow", cx: f(cx), cy: f(cy + 10), rx: f((x1 - x0 + y1 - y0) * TW / 4 * 0.98), ry: f((x1 - x0 + y1 - y0) * TH / 4 * 0.98) }, shadowLayer);
        const a = P((x0 + x1) / 2, (y0 + y1) / 2, z.h + (id === "cbd" ? 22 : 18));
        anchors[id] = a;
        const text = zd.name, wpx = text.length * 6.1 + 22;
        const lg = el("g", { class: "zlabel", "data-zone": id }, labelLayer);
        el("line", { x1: f(a[0]), y1: f(a[1] + 9), x2: f(a[0]), y2: f(a[1] + 20) }, lg);
        el("rect", { x: f(a[0] - wpx / 2), y: f(a[1] - 11), width: f(wpx), height: 21, rx: 10.5 }, lg);
        el("text", { x: f(a[0]), y: f(a[1] + 3.5), "text-anchor": "middle" }, lg).textContent = text;
        labels[id] = lg;
      });

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

    // the storm: a darker sky, cloud banks and rain, all clipped to the slab
    const storm = el("g", { class: "storm" }, fx);
    storm.append(poly("sky", slabTop));
    const clouds = el("g", { class: "clouds" }, storm);
    [[-300, -40], [120, -60], [360, -20]].forEach(([x, y], k) => { const c = el("g", { class: "cloud", style: `--i:${k}` }, clouds); [[0, 0, 42, 14], [30, -8, 36, 13], [-28, -4, 30, 11], [58, 2, 28, 10]].forEach(([dx, dy, rx, ry]) => el("ellipse", { cx: x + dx, cy: y + dy, rx, ry }, c)); });
    const rain = el("g", { class: "rain", "clip-path": "url(#clip-slab)" }, storm);
    el("rect", { class: "rain-fill", x: -340, y: -120, width: 820, height: 560 }, rain);

    return { svg, fx, base: baseLayer, under: underLayer, zoneLayer, zoneFxLayer, linkLayer, packetLayer, labelLayer, storm, zones, zoneFx, labels, links, shadows, anchors, slots, sensors: sensorNodes, arms, hand, handMotion, sms, smsMotion, ZONES };
  }

  window.CityScene = { TW, TH, P, build };
})();
