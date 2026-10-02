// The interactive city: an isometric town drawn in SVG. Hovering (or tapping,
// or tabbing to) a district lifts it out and shows what EDS does there.
(() => {
  const svg = document.getElementById("city");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const TW = 56, TH = 28; // one ground tile, in px
  const P = (x, y, z = 0) => [(x - y) * TW / 2, (x + y) * TH / 2 - z];
  const pts = (a) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent?.appendChild(n);
    return n;
  };
  const poly = (cls, a) => el("polygon", { class: cls, points: pts(a) });

  /* ---- primitives: each returns { d: depth, nodes: [...] } ---- */
  function box(x, y, w, d, h, o = {}) {
    const z = o.z || 0, nodes = [];
    nodes.push(poly("fl", [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)]));
    nodes.push(poly("fr", [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)]));
    nodes.push(poly(o.top || "ft", [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)]));
    if (o.windows) {
      for (let zz = z + 8; zz < z + h - 3; zz += o.windows) {
        const a = P(x, y + d, zz), b = P(x + w, y + d, zz), c = P(x + w, y, zz);
        nodes.push(el("polyline", { class: "det", points: pts([a, b, c]) }));
      }
    }
    return { d: x + w + y + d + (o.bias || 0), nodes };
  }
  function roof(x, y, w, d, z, rh) {
    const A = P(x + w / 2, y + d / 2, z + rh);
    return [
      poly("ft", [P(x, y, z), P(x, y + d, z), A]),
      poly("ft", [P(x, y, z), P(x + w, y, z), A]),
      poly("fr", [P(x, y + d, z), P(x + w, y + d, z), A]),
      poly("ft", [P(x + w, y, z), P(x + w, y + d, z), A]),
    ];
  }
  function house(x, y, w, d, h, rh) {
    const b = box(x, y, w, d, h);
    b.nodes.pop(); // the roof covers the top face
    b.nodes.push(...roof(x, y, w, d, h, rh));
    return b;
  }
  function cyl(cx, cy, r, h, o = {}) {
    const z = o.z || 0, rx = r * TW / Math.SQRT2, ry = r * TH / Math.SQRT2;
    const [bx, by] = P(cx, cy, z), [, ty] = P(cx, cy, z + h);
    const f = (n) => n.toFixed(1);
    const nodes = [
      el("path", { class: "fr", d: `M${f(bx - rx)} ${f(ty)}L${f(bx - rx)} ${f(by)}A${f(rx)} ${f(ry)} 0 0 0 ${f(bx + rx)} ${f(by)}L${f(bx + rx)} ${f(ty)}Z` }),
      el("path", { class: "fl", d: `M${f(bx - rx)} ${f(ty)}L${f(bx - rx)} ${f(by)}A${f(rx)} ${f(ry)} 0 0 0 ${f(bx)} ${f(by + ry)}L${f(bx)} ${f(ty + ry)}A${f(rx)} ${f(ry)} 0 0 1 ${f(bx - rx)} ${f(ty)}Z` }),
      el("ellipse", { class: "ft", cx: f(bx), cy: f(ty), rx: f(rx), ry: f(ry) }),
    ];
    if (o.water) nodes.push(el("ellipse", { class: `wtr ${o.water === true ? "" : o.water}`, cx: f(bx), cy: f(ty), rx: f(rx * 0.82), ry: f(ry * 0.82) }));
    if (o.arm) {
      const arm = el("line", { class: "arm" });
      arms.push({ arm, cx, cy, r: r * 0.8, z: z + h, phase: Math.random() * 6 });
      nodes.push(arm);
    }
    return { d: cx + cy + r * 1.42, nodes };
  }
  function tree(x, y, s = 1) {
    const [a, b] = P(x, y, 9 * s), [c, d] = P(x, y, 13 * s);
    const [tx, ty] = P(x, y);
    return {
      d: x + y + 0.1,
      nodes: [
        el("line", { class: "det", x1: tx, y1: ty, x2: tx, y2: ty - 6 * s }),
        el("circle", { class: "tree-2", cx: a.toFixed(1), cy: b.toFixed(1), r: 7 * s }),
        el("circle", { class: "tree", cx: (c - 1.5).toFixed(1), cy: d.toFixed(1), r: 5 * s }),
      ],
    };
  }
  function ping(x, y, z = 0, delay = 0) {
    const [cx, cy] = P(x, y, z);
    return {
      d: 99, // sensors always sit on top of their district
      nodes: [
        el("circle", { class: "ping", cx, cy, r: 5, style: `--d:${delay}` }),
        el("circle", { class: "ping-dot", cx, cy, r: 2.4 }),
      ],
    };
  }
  function manhole(x, y, delay = 0) {
    const [cx, cy] = P(x, y);
    const p = ping(x, y, 0, delay);
    return { d: x + y, nodes: [el("ellipse", { class: "mh", cx, cy, rx: 6, ry: 3 }), ...p.nodes] };
  }
  const flat = (cls, a, d) => ({ d, nodes: [poly(cls, a)] });
  const line = (cls, a, d) => ({ d, nodes: [el("polyline", { class: cls, points: pts(a) })] });

  const arms = [];

  /* ---- districts ---- */
  const ZONES = {
    river: {
      rect: [0, 0, 4.6, 4.6], h: 34, build() {
        const c = [[0, 1.0], [1.2, 1.4], [2.3, 2.3], [3.4, 3.2], [4.6, 3.6]];
        const up = c.map(([x, y]) => P(x, y - 0.42)), lo = c.map(([x, y]) => P(x, y + 0.42)).reverse();
        return [
          flat("wtr", [...up, ...lo], 0),
          line("wtr-line", c.map(([x, y]) => P(x, y - 0.12)), 0.01),
          line("wtr-line", c.map(([x, y]) => P(x, y + 0.16)), 0.02),
          ...[[0.6, 3.1], [1.3, 3.8], [2.2, 4.1], [0.5, 4.1], [3.5, 0.6], [4.1, 1.3], [2.6, 0.5], [4.15, 2.3], [3.1, 1.5]].map(([x, y], i) => tree(x, y, i % 3 ? 1 : 1.25)),
          box(1.45, 0.45, 0.1, 0.1, 30), // weather station mast
          box(1.3, 0.3, 0.4, 0.4, 5, { z: 30, top: "lit" }),
          cyl(0.75, 0.75, 0.16, 9), // rain gauge
          ping(2.3, 2.3, 0, 0.2), ping(1.5, 0.5, 37, 1.1), ping(3.7, 3.35, 0, 1.7),
        ];
      },
    },
    sewer: {
      rect: [5.4, 0, 9.6, 4.6], h: 26, build() {
        const out = [];
        for (const x of [5.7, 7.05, 8.4]) for (const y of [0.4, 1.9, 3.4]) out.push(house(x, y, 0.8, 0.8, 12, 9));
        for (const x of [6.78, 8.13]) out.push(line("pipe-flow", [P(x, 0.3), P(x, 4.5)], 0.01));
        out.push(manhole(6.78, 1.55, 0), manhole(8.13, 3.05, 0.8), manhole(6.78, 3.05, 1.5));
        return out;
      },
    },
    cbd: {
      rect: [10.4, 0, 15, 4.6], h: 122, build() {
        return [
          box(10.8, 0.5, 1.1, 1.1, 86, { windows: 9 }),
          box(12.4, 0.4, 1.0, 1.0, 118, { windows: 9 }),
          box(12.75, 0.75, 0.3, 0.3, 10, { z: 118, top: "lit" }),
          box(13.9, 0.6, 0.8, 0.9, 64, { windows: 9 }),
          box(10.9, 2.4, 1.2, 0.9, 46, { windows: 9 }),
          box(12.6, 2.2, 1.0, 1.2, 72, { windows: 9 }),
          box(14.0, 2.5, 0.7, 0.8, 54, { windows: 9 }),
          box(11.0, 3.75, 0.9, 0.6, 18),
          box(12.9, 3.8, 1.5, 0.55, 12, { top: "lit" }),
          ping(11.35, 1.05, 88, 0.3), ping(13.1, 2.8, 74, 1.2), ping(14.6, 4.2, 0, 1.9),
        ];
      },
    },
    plant: {
      rect: [0, 5.4, 4.6, 10], h: 40, build() {
        return [
          cyl(1.1, 6.55, 0.78, 5, { water: true, arm: true }),
          cyl(1.1, 8.65, 0.78, 5, { water: true, arm: true }),
          cyl(3.0, 6.3, 0.55, 30),
          cyl(4.0, 7.0, 0.45, 22),
          box(2.3, 8.2, 1.5, 1.3, 5),
          flat("wtr", [P(2.42, 8.32, 5), P(3.68, 8.32, 5), P(3.68, 9.38, 5), P(2.42, 9.38, 5)], 2.3 + 1.5 + 8.2 + 1.3 + 0.01),
          line("wtr-line", [P(2.5, 8.85, 5), P(3.6, 8.85, 5)], 2.3 + 1.5 + 8.2 + 1.3 + 0.02),
          box(4.0, 8.4, 0.42, 1.0, 14),
          ping(2.3, 5.75, 0, 0.5), ping(3.05, 8.85, 5, 1.4), ping(0.4, 9.6, 0, 2.1),
        ];
      },
    },
    pump: {
      rect: [5.4, 5.4, 7.2, 10], h: 34, build() {
        return [
          house(5.7, 5.8, 1.15, 1.2, 20, 8),
          line("det", [P(6.3, 7.0), P(6.3, 7.5)], 13.4),
          cyl(6.3, 8.05, 0.56, 4, { water: "well" }),
          box(5.75, 9.1, 0.4, 0.4, 12, { top: "lit" }),
          ping(6.3, 8.05, 5, 0.4), ping(5.95, 9.3, 14, 1.6),
        ];
      },
    },
    ops: {
      rect: [8.0, 5.4, 9.6, 10], h: 84, build() {
        const mast = [P(8.8, 6.5, 44), P(8.8, 6.5, 76)];
        return [
          box(8.25, 5.8, 1.1, 2.3, 44, { windows: 7 }),
          { d: 8.25 + 1.1 + 5.8 + 2.3 + 0.01, nodes: [el("line", { class: "det", x1: mast[0][0], y1: mast[0][1], x2: mast[1][0], y2: mast[1][1], style: "stroke-width:2" })] },
          ping(8.8, 6.5, 76, 0), ping(8.8, 6.5, 76, 1.3),
          box(8.3, 8.8, 1.0, 0.8, 13, { top: "lit" }),
        ];
      },
    },
    industry: {
      rect: [10.4, 5.4, 15, 10], h: 66, build() {
        const out = [
          box(10.8, 5.8, 2.6, 1.6, 22),
          ...[0, 1, 2].map((i) => box(10.95 + i * 0.85, 5.95, 0.55, 1.3, 6, { z: 22, bias: 0.02 + i * 0.001 })),
          cyl(13.95, 6.2, 0.17, 58),
          cyl(14.45, 6.7, 0.17, 46),
          cyl(11.3, 8.7, 0.5, 18),
          cyl(12.5, 8.7, 0.5, 18),
          box(13.3, 7.9, 1.3, 1.7, 16, { windows: 5 }),
          manhole(10.85, 7.8, 0.6),
          ping(11.9, 9.6, 0, 1.5),
        ];
        const smoke = [];
        [[13.95, 6.2, 58], [14.45, 6.7, 46]].forEach(([x, y, z], k) => {
          const [cx, cy] = P(x, y, z + 3);
          for (let i = 0; i < 3; i++) smoke.push(el("circle", { class: "smoke", cx, cy, r: 4, style: `animation-delay:${(i * 1.2 + k * 0.5).toFixed(1)}s;transform-box:fill-box;transform-origin:center` }));
        });
        out.push({ d: 98, nodes: smoke });
        return out;
      },
    },
  };

  /* ---- assemble ---- */
  svg.setAttribute("viewBox", "-330 -52 800 448");
  const base = el("g", {}, svg);
  const S = [-0.6, -0.6, 15.6, 10.6], T = 14;
  base.append(
    poly("slab-l", [P(S[0], S[3]), P(S[2], S[3]), P(S[2], S[3], -T), P(S[0], S[3], -T)]),
    poly("slab-r", [P(S[2], S[1]), P(S[2], S[3]), P(S[2], S[3], -T), P(S[2], S[1], -T)]),
    poly("slab-top", [P(S[0], S[1]), P(S[2], S[1]), P(S[2], S[3]), P(S[0], S[3])])
  );
  // road centre lines, then the trunk sewer and laterals glowing beneath them
  for (const a of [[P(-0.4, 5), P(15.4, 5)], [P(5, -0.4), P(5, 10.4)], [P(10, -0.4), P(10, 10.4)], [P(7.6, 5.2), P(7.6, 10.4)]]) {
    el("polyline", { class: "road-line", points: pts(a) }, base);
  }
  const pipes = [
    [P(15.3, 5.18), P(2.3, 5.18), P(2.3, 5.5)],
    [P(5.18, 0.2), P(5.18, 5.18)], [P(5.18, 10.2), P(5.18, 5.18)],
    [P(10.18, 0.2), P(10.18, 5.18)], [P(10.18, 10.2), P(10.18, 5.18)],
  ];
  for (const cls of ["pipe-glow", "pipe", "pipe-flow"]) for (const a of pipes) el("polyline", { class: cls, points: pts(a) }, base);
  [[5.18, 5.18, 0], [10.18, 5.18, 0.7], [7.6, 5.18, 1.3], [12.6, 5.18, 2], [5.18, 2.4, 0.4], [10.18, 7.8, 1.1], [3.4, 5.18, 1.8]].forEach(([x, y, d]) => manhole(x, y, d).nodes.forEach((n) => base.appendChild(n)));

  // EDS service vans doing the rounds, moved along the roads with SMIL
  const van = (alongX, route, dur, begin) => {
    const g = el("g", { class: "van" }, base);
    const b = alongX ? box(-0.17, -0.09, 0.34, 0.18, 5) : box(-0.09, -0.17, 0.18, 0.34, 5);
    b.nodes.forEach((n) => g.appendChild(n));
    el("animateMotion", { dur: `${dur}s`, begin: `${begin}s`, repeatCount: "indefinite", path: "M" + route.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") }, g);
  };
  van(true, [P(-0.5, 4.8), P(15.5, 4.8)], 16, 0);
  van(true, [P(-0.5, 4.8), P(15.5, 4.8)], 16, -9);
  van(false, [P(4.8, -0.5), P(4.8, 10.5)], 13, -4);
  van(false, [P(9.8, 10.5), P(9.8, -0.5)], 12, -7);

  const zoneLayer = el("g", {}, svg), linkLayer = el("g", {}, svg), labelLayer = el("g", {}, svg);
  const cards = [...document.querySelectorAll(".city-card")];
  const tabs = [...document.querySelectorAll(".city-tab")];
  const names = Object.fromEntries(cards.map((c) => [c.dataset.zone, c.dataset.name]));
  const zones = {}, labels = {}, links = {}, anchors = {};

  Object.entries(ZONES)
    .sort((a, b) => a[1].rect[2] + a[1].rect[3] - (b[1].rect[2] + b[1].rect[3]))
    .forEach(([id, z]) => {
      const [x0, y0, x1, y1] = z.rect;
      const g = el("g", { class: "zone", "data-zone": id, role: "button", tabindex: "0", "aria-label": `${names[id] || id}: show EDS services and products` }, zoneLayer);
      g.append(
        poly("ge-l", [P(x0, y1), P(x1, y1), P(x1, y1, -6), P(x0, y1, -6)]),
        poly("ge-r", [P(x1, y0), P(x1, y1), P(x1, y1, -6), P(x1, y0, -6)]),
        poly("g", [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)])
      );
      z.build().sort((a, b) => a.d - b.d).forEach((p) => p.nodes.forEach((n) => g.appendChild(n)));
      zones[id] = g;

      // label, floating above the district
      const a = P((x0 + x1) / 2, (y0 + y1) / 2, z.h + 18);
      anchors[id] = a;
      const text = names[id] || id, wpx = text.length * 6.1 + 22;
      const lg = el("g", { class: "zlabel", "data-zone": id }, labelLayer);
      el("line", { x1: a[0], y1: a[1] + 9, x2: a[0], y2: a[1] + 20 }, lg);
      el("rect", { x: a[0] - wpx / 2, y: a[1] - 11, width: wpx, height: 21, rx: 10.5 }, lg);
      el("text", { x: a[0], y: a[1] + 3.5, "text-anchor": "middle" }, lg).textContent = text;
      labels[id] = lg;
    });

  // data links: every district reports to the operations centre mast
  const hub = P(8.8, 6.5, 78);
  Object.keys(ZONES).forEach((id) => {
    if (id === "ops") return;
    const a = anchors[id], mx = (a[0] + hub[0]) / 2, my = Math.min(a[1], hub[1]) - 46;
    links[id] = el("path", { class: "link", d: `M${a[0].toFixed(1)} ${(a[1] + 12).toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${hub[0].toFixed(1)} ${hub[1].toFixed(1)}` }, linkLayer);
  });

  /* ---- interaction ---- */
  let active = null, touched = false;
  function setActive(id) {
    if (id === active) return;
    active = id;
    svg.classList.toggle("has-active", !!id);
    for (const k in zones) {
      zones[k].classList.toggle("active", k === id);
      labels[k].classList.toggle("active", k === id);
      links[k]?.classList.toggle("on", k === id || id === "ops");
    }
    cards.forEach((c) => c.classList.toggle("active", c.dataset.zone === id));
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.zone === id)));
  }
  const user = (id) => { touched = true; setActive(id); };
  Object.entries(zones).forEach(([id, g]) => {
    g.addEventListener("pointerenter", () => user(id));
    g.addEventListener("click", () => user(id));
    g.addEventListener("focus", () => user(id));
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.querySelector(`.city-card[data-zone="${id}"] a`)?.focus(); }
    });
  });
  tabs.forEach((t) => {
    t.addEventListener("click", () => user(t.dataset.zone));
    t.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && user(t.dataset.zone));
  });
  document.querySelector(".city-panel")?.addEventListener("pointerenter", () => { touched = true; });

  // Until someone takes over, tour the districts so the page is never still.
  const order = ["sewer", "pump", "plant", "industry", "river", "cbd", "ops"];
  let tour = 0, inView = false;
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; }, { threshold: 0.3 }).observe(svg);
  setActive(order[0]);
  setInterval(() => {
    if (touched || !inView || document.hidden) return;
    tour = (tour + 1) % order.length;
    setActive(order[tour]);
  }, 3400);

  // clarifier scraper arms turn (true rotation in the ground plane)
  let raf = 0;
  const spin = (now) => {
    for (const a of arms) {
      const t = now / 2600 + a.phase, dx = Math.cos(t) * a.r, dy = Math.sin(t) * a.r;
      const [x1, y1] = P(a.cx - dx, a.cy - dy, a.z), [x2, y2] = P(a.cx + dx, a.cy + dy, a.z);
      a.arm.setAttribute("x1", x1.toFixed(1)); a.arm.setAttribute("y1", y1.toFixed(1));
      a.arm.setAttribute("x2", x2.toFixed(1)); a.arm.setAttribute("y2", y2.toFixed(1));
    }
    raf = inView ? requestAnimationFrame(spin) : 0;
  };
  spin(0);
  const kick = () => { if (!raf) raf = requestAnimationFrame(spin); };
  window.addEventListener("scroll", kick, { passive: true });
  kick();
})();
