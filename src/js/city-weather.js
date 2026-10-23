// The storm's weather over the home page city: rain, splashes and ripples,
// wet roads, spray, cloud and lightning. It is painted on a canvas that sits
// between the still city (#city) and the overlay (#city-fx), so the labels and
// pills stay above the rain and the still city is never repainted for it.
//
// Every drop lives in the scene's own coordinates. It is aimed at a point on
// the slab, falls straight down onto it (leaning with the wind) and splashes
// there, so the rain fills the column of air over the city the way it would
// over a model on a table: thickest where the most air is in the line of
// sight, and landing on whatever is drawn at that spot. Drops aimed at water
// (the river, ponds, tanks, the storm's puddles) ring it with ripples.
//
// city.js starts and ends it and pauses it with the rest of the city when the
// stage is off screen. How hard it rains follows the rain readings in the
// storm script (cityStorm in content.mjs); lightning comes while it pours.
(() => {
  if (!window.CityScene) return;
  const { P, S } = CityScene;
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = Math.random;
  const range = (a, b) => a + (b - a) * rnd();
  const ease = (v, to, dt, tau) => v + (to - v) * (1 - Math.exp(-dt / tau));

  // value noise and its fractal sum, for the cloud banks and the spray
  const hash = (i, j, s) => {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, s, oct = 5) => {
    let t = 0, amp = 0.5, sum = 0;
    for (let o = 0; o < oct; o++) { t += amp * noise(x, y, s + o * 17); sum += amp; x *= 2.03; y *= 2.03; amp *= 0.5; }
    return t / sum;
  };
  const canvasOf = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  // a small canvas filled pixel by pixel: fn(x, y) returns [r, g, b, alpha 0..1]
  function paint(w, h, fn) {
    const c = canvasOf(w, h), cg = c.getContext("2d"), img = cg.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = fn(x, y);
      if (!p || p[3] <= 0) continue;
      const i = (y * w + x) * 4;
      d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = 255 * clamp(p[3]);
    }
    cg.putImageData(img, 0, 0);
    return c;
  }

  // the drops: fine, steady and heavy, each with its fall speed (scene
  // units a second), streak length, width and brightness
  const KIND = [
    { v: [420, 500], len: [7, 11], w: 0.45, a: 0.24 },
    { v: [560, 650], len: [12, 18], w: 0.65, a: 0.38 },
    { v: [700, 800], len: [18, 27], w: 0.9, a: 0.46 },
  ];
  // a splash's life in seconds: a steady drop, a heavy one, a ripple on water
  const LIFE = [0, 0.22, 0.32, 0.9];
  // the cloud banks cover this part of the scene
  const CX0 = -360, CX1 = 490, CY0 = -60, CY1 = 140, CW = CX1 - CX0, CH = CY1 - CY0;
  // the rain curtains that hang from the cloud, and the spray over the streets
  const RY0 = -44, RY1 = 240, MX0 = -430, MX1 = 610, MY0 = -40, MY1 = 400, MR = 0.25;

  window.CityWeather = (sc, { clock, script }) => {
    const canvas = document.createElement("canvas");
    canvas.className = "city-weather";
    canvas.setAttribute("aria-hidden", "true");
    sc.svg.after(canvas);
    const g = canvas.getContext("2d");
    if (!g) return { start() {}, end() {}, run() {} };
    const vb = sc.svg.viewBox.baseVal, VX = vb.x, VY = vb.y, VW = vb.width, VH = vb.height;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    // the slab's corners on screen (left, front, right, back) and its near and
    // far edges, which bound the column of rain over it
    const L = P(S[0], S[3]), F = P(S[2], S[3]), R = P(S[2], S[1]), B = P(S[0], S[1]);
    const edge = (x, a, b) => a[1] + (b[1] - a[1]) * clamp((x - a[0]) / (b[0] - a[0]));
    const near = (x) => (x < F[0] ? edge(x, L, F) : edge(x, F, R));
    const far = (x) => (x < B[0] ? edge(x, L, B) : edge(x, B, R));
    const DEPTH = near(B[0]) - B[1];

    // how hard it rains, from the readings in the storm script, built up over
    // the first seconds; the cloud stays a little after the rain stops
    const marks = script.steps.filter((s) => s.hud).map((s) => [s.at, s.hud.rain]);
    const peak = Math.max(1, ...marks.map((m) => m[1]));
    const dryAt = (marks.find((m, i) => i && !m[1]) || [script.duration])[0];
    const rainAt = (t) => {
      if (t == null || !marks.length) return 0;
      let r = marks[marks.length - 1][1];
      for (let i = 0; i < marks.length - 1; i++) {
        if (t >= marks[i + 1][0]) continue;
        const [a, ra] = marks[i], [b, rb] = marks[i + 1];
        r = t < a ? ra : lerp(ra, rb, (t - a) / (b - a));
        break;
      }
      return (r / peak) * smooth(0, 3, t);
    };
    // the wind: how far a drop drifts sideways for each unit it falls, in
    // gusts; and the heavier sheets of rain it drives across the city
    const slope = (t) => -0.2 - 0.07 * (0.5 + 0.5 * Math.sin(t * 0.7)) - 0.035 * Math.sin(t * 1.9 + 1);
    const sheet = (x, t) => clamp(0.5 + 0.32 * Math.sin(x * 0.0105 + t * 0.6) + 0.22 * Math.sin(x * 0.027 - 1.1 + t * 1.05), 0.12, 1);

    /* ---- what the weather lands on, read from the drawn city ---- */
    // A lifted district carries its water, lamps and masts with it.
    let lifted = null, lt = [0, 0], ls = 1, lo = [0, 0];
    const readLift = () => {
      lifted = sc.zoneLayer.querySelector(".zone.active");
      if (!lifted) return;
      const cs = getComputedStyle(lifted), tr = (cs.translate || "").split(" ").map(parseFloat);
      lt = [tr[0] || 0, tr[1] || 0];
      ls = parseFloat(cs.scale) || 1;
      const m = /(-?[\d.]+)px\s+(-?[\d.]+)px/.exec(lifted.style.transformOrigin);
      lo = m ? [+m[1], +m[2]] : [0, 0];
    };
    const lift = (x, y, zone) => (zone && zone === lifted ? [lo[0] + lt[0] + (x - lo[0]) * ls, lo[1] + lt[1] + (y - lo[1]) * ls] : [x, y]);
    const placed = (name, dy = 0) => [...sc.svg.querySelectorAll("use")]
      .filter((u) => u.getAttribute("href") === `#${name}` && !u.closest("defs, symbol"))
      .map((u) => { const m = /translate\((-?[\d.]+)[ ,]+(-?[\d.]+)\)/.exec(u.getAttribute("transform")); return m && { x: +m[1], y: +m[2] + dy, zone: u.closest(".zone") }; })
      .filter(Boolean);
    const lamps = placed("lamp");
    // lightning often finds a mast, the highest on screen on its first strike
    const tips = placed("antenna", -11).sort((a, b) => a.y - b.y);
    // points on open water, a few to each pond, tank, river reach and puddle
    const sites = [];
    sc.svg.querySelectorAll(".wtr, .puddle").forEach((el) => {
      if (el.closest("defs, symbol") || el.classList.contains("wtr-line") || !el.isPointInFill) return;
      let b; try { b = el.getBBox(); } catch { return; }
      if (b.width * b.height < 6) return;
      const zone = el.closest(".zone"), want = clamp(Math.round(Math.sqrt(b.width * b.height) / 5), 2, 16);
      for (let k = 0, got = 0; k < want * 8 && got < want; k++) {
        const x = b.x + rnd() * b.width, y = b.y + rnd() * b.height;
        let inside = false;
        try { inside = el.isPointInFill(new DOMPoint(x, y)); } catch { return; }
        if (inside) { sites.push({ x, y, el, zone, vis: 1 }); got++; }
      }
    });
    // puddles and floodwater only take ripples once the storm has shown them
    const readWater = () => { const seen = new Map(); for (const s of sites) { if (!seen.has(s.el)) seen.set(s.el, parseFloat(getComputedStyle(s.el).opacity) || 0); s.vis = seen.get(s.el); } };

    /* ---- the textures: made a few rows at a time while the page is idle ---- */
    let banks = null, mist = null, curtain = null, glowLayer = null, gg = null;
    const glint = paint(10, 44, (x, y) => {
      const u = (x + 0.5) / 10 - 0.5, t = (y + 0.5) / 44;
      return [255, 224, 176, Math.exp((-u * u) / 0.03) * Math.pow(1 - t, 1.4) * (0.72 + 0.28 * Math.cos(t * 26 + Math.sin(t * 9) * 2))];
    });
    // The cloud hangs in the open sky over the slab and never across the
    // buildings: its base follows the city's skyline, read from the drawn
    // volumes (each column of the stage, 4 units wide, takes the highest
    // thing standing in it, or the slab's far edge where nothing does).
    let baseAt = () => -30, hidden = () => VY;
    function* skyline() {
      const N = Math.ceil(VW / 4) + 1, top = new Float32Array(N);
      for (let c = 0; c < N; c++) top[c] = far(VX + c * 4);
      let i = 0;
      for (const el of sc.svg.querySelectorAll(".vol > *")) {
        let b; try { b = el.getBBox(); } catch { continue; }
        const m = /translate\((-?[\d.]+)[ ,]+(-?[\d.]+)\)/.exec(el.getAttribute("transform") || ""), dx = m ? +m[1] : 0, dy = m ? +m[2] : 0;
        for (let c = Math.max(0, Math.floor((b.x + dx - VX) / 4)), c1 = Math.min(N - 1, Math.floor((b.x + dx + b.width - VX) / 4)); c <= c1; c++) top[c] = Math.min(top[c], b.y + dy);
        if (++i % 300 === 0) yield;
      }
      // clear of everything by a margin, and eased into a smooth line
      let base = top.map((_, c) => { let lo = Infinity; for (let d = -4; d <= 4; d++) lo = Math.min(lo, top[clamp(c + d, 0, N - 1)]); return clamp(lo - 26, VY + 14, VY + 100); });
      for (let pass = 0; pass < 3; pass++) base = base.map((_, c) => { let t = 0; for (let d = -3; d <= 3; d++) t += base[clamp(c + d, 0, N - 1)]; return t / 7; });
      baseAt = (x) => { const u = clamp((x - VX) / 4, 0, N - 1), c = Math.floor(u), f = u - c; return lerp(base[c], base[Math.min(N - 1, c + 1)], f); };
      // a drop is out of sight until it falls out of the cloud's base (the
      // far bank reaches 40 units down everywhere)
      hidden = (x) => Math.max(baseAt(x), VY + 40) - 16;
    }
    // A bank of cloud: fractal noise, folded over itself so it billows,
    // filling the sky down to its base (less far for the far bank) and thinned
    // to nothing at the stage's edges. It is shaded as a relief lit from above
    // and to the left, so each billow rounds over; the thin fringes glow and
    // the heavy bases go dark. The second picture is the same cloud as
    // lightning inside it shows it.
    function* bank(seed, res, rise, floor, dark, light, alpha) {
      const W = Math.round(CW * res), H = Math.round(CH * res), n = new Float32Array(W * H).fill(-1);
      for (let y = 0; y < H; y++) {
        const uy = CY0 + y / res, top = smooth(VY, VY + 34, uy);
        for (let x = 0; x < W; x++) {
          const ux = CX0 + x / res, b = Math.max(floor, baseAt(ux) - rise);
          const env = smooth(b + 8, b - 34, uy) * top * smooth(VX - 10, VX + 50, ux) * (1 - smooth(VX + VW - 50, VX + VW + 10, ux));
          if (env < 0.04) continue;
          const qx = fbm(ux / 90, uy / 40, seed + 3, 3), qy = fbm(ux / 90 + 5.2, uy / 40 + 1.3, seed + 5, 3);
          n[y * W + x] = fbm(ux / 70 + 1.3 * qx, uy / 30 + 1.3 * qy, seed, 6) + 0.72 * env - 0.74;
        }
        if (y % 6 === 5) yield;
      }
      // darker toward the base, as a storm cloud's underside is
      const shadeAt = (ux, uy) => { const b = Math.max(floor, baseAt(ux) - rise); return lerp(1, 0.42, smooth(b - 70, b, uy)); };
      const img = canvasOf(W, H), lit = canvasOf(W, H), ig = img.getContext("2d"), lg = lit.getContext("2d");
      // the relief is read from a softened copy, so it rounds over broadly
      const soft = new Float32Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let t = 0;
        for (let d = -2; d <= 2; d++) t += Math.max(-0.1, n[clamp(y + d, 0, H - 1) * W + x]) + Math.max(-0.1, n[y * W + clamp(x + d, 0, W - 1)]);
        soft[y * W + x] = t / 10;
      }
      yield;
      const id = ig.createImageData(W, H), ld = lg.createImageData(W, H), at = (x, y) => soft[clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1)];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const j = y * W + x, c = n[j];
          if (c <= 0) continue;
          // the billows as a relief, lit from above and to the left
          const gx = (at(x + 2, y) - at(x - 2, y)) * 2.2 * res, gy = (at(x, y + 2) - at(x, y - 2)) * 2.2 * res, nl = Math.hypot(gx, gy, 1);
          const lit0 = clamp((gx * 0.5 + gy * 0.8 + 0.55) / nl / 1.12);
          const sh = clamp((0.36 + 0.64 * lit0) * (1 - 0.3 * smooth(0.05, 0.45, c)) + (0.1 - c) * 0.8) * shadeAt(x / res + CX0, CY0 + y / res), a = smooth(0, 0.16, c), o = j * 4;
          id.data[o] = lerp(dark[0], light[0], sh); id.data[o + 1] = lerp(dark[1], light[1], sh); id.data[o + 2] = lerp(dark[2], light[2], sh); id.data[o + 3] = 255 * a * alpha;
          ld.data[o] = 205; ld.data[o + 1] = 220; ld.data[o + 2] = 255; ld.data[o + 3] = 255 * a * (0.5 + 0.5 * sh);
        }
        if (y % 12 === 11) yield;
      }
      ig.putImageData(id, 0, 0); lg.putImageData(ld, 0, 0);
      return { img, lit };
    }
    function* make() {
      yield* skyline();
      const near = yield* bank(7, 1.1, 0, VY, [24, 34, 38], [154, 168, 172], 0.96);
      // the far bank also reaches across the top, so no rain falls from clear sky
      const far = yield* bank(31, 0.6, 22, VY + 40, [40, 54, 58], [150, 166, 170], 0.7);
      // streaky, wind-blown sheets under the cloud, fading out as they fall
      curtain = paint(Math.round((CW + 140) * 0.6), Math.round((RY1 - RY0) * 0.6), (x, y) => {
        const ux = CX0 + x / 0.6, uy = RY0 + y / 0.6;
        return [150, 170, 176, smooth(0.5, 0.78, fbm(ux / 6, uy / 150, 77, 3)) * smooth(RY0, -12, uy) * (1 - smooth(50, RY1, uy))];
      });
      yield;
      mist = paint(Math.round((MX1 - MX0) * MR), Math.round((MY1 - MY0) * MR), (x, y) => [178, 205, 210, smooth(0.45, 0.72, fbm(x / MR / 80, y / MR / 36, 91, 4)) * 0.8]);
      glowLayer = canvasOf(near.lit.width, near.lit.height); gg = glowLayer.getContext("2d");
      banks = { near, far };
    }
    let job = null;
    function prepare(now) {
      if (banks) return;
      const fresh = !job;
      job = job || make();
      if (now) { while (!job.next().done); return; }
      if (!fresh) return;
      const idle = window.requestIdleCallback || ((fn) => setTimeout(() => fn({ timeRemaining: () => 6 }), 40));
      const work = (dl) => { while (dl.timeRemaining() > 2) if (job.next().done) return; idle(work); };
      idle(work);
    }
    // the rain's grey veil, worked out each frame at a coarse grid and
    // stretched over the stage; it is thickest where the most rain is in view
    const HW = 96, HH = 54, haze = canvasOf(HW, HH), hg = haze.getContext("2d"), hd = hg.createImageData(HW, HH);
    // the column of air over the slab, as a soft mask: the rain curtains are
    // drawn through it so they hang only where rain falls
    const column = paint(HW, HH, (i, j) => {
      const ux = VX + ((i + 0.5) * VW) / HW, uy = VY + ((j + 0.5) * VH) / HH;
      return [0, 0, 0, ux > L[0] && ux < R[0] ? clamp(((near(ux) - Math.max(uy, far(ux))) / DEPTH) * 2.2) * smooth(VY, VY + 30, uy) : 0];
    });
    const CS = 0.7, sheets = canvasOf(Math.round(VW * CS), Math.round(VH * CS)), sg = sheets.getContext("2d");

    /* ---- drops and splashes ---- */
    const MAX = 1700;
    const tx = new Float32Array(MAX), ty = new Float32Array(MAX), h = new Float32Array(MAX), v = new Float32Array(MAX), len = new Float32Array(MAX);
    const kind = new Uint8Array(MAX), on = new Uint8Array(MAX), wet = new Uint8Array(MAX);
    for (let i = 0; i < MAX; i++) { const r = rnd(); kind[i] = r < 0.5 ? 0 : r < 0.85 ? 1 : 2; }
    let flying = 0;
    function aim(i, y0) {
      let x = 0, y = 0, w = 0;
      if (kind[i] && sites.length && rnd() < 0.2) {
        const s = sites[(rnd() * sites.length) | 0];
        if (rnd() < s.vis) { [x, y] = lift(s.x, s.y, s.zone); w = 1; }
      }
      // anywhere on the slab, but more often under the heavier sheets
      if (!w) for (let k = 0; k < 4; k++) { [x, y] = P(range(S[0], S[2]), range(S[1], S[3])); if (rnd() < sheet(x, tw)) break; }
      const K = KIND[kind[i]];
      tx[i] = x; ty[i] = y; wet[i] = w; v[i] = range(K.v[0], K.v[1]); len[i] = range(K.len[0], K.len[1]);
      h[i] = y - y0;
    }
    const SP = 1400;
    const sx = new Float32Array(SP), sy = new Float32Array(SP), age = new Float32Array(SP), sk = new Uint8Array(SP), svx = new Float32Array(SP * 3), svy = new Float32Array(SP * 3);
    let ns = 0;
    function splash(x, y, k) {
      if (ns >= SP) return;
      const j = ns++;
      sx[j] = x; sy[j] = y; age[j] = 0; sk[j] = k;
      for (let d = 0; d < 3; d++) { svx[j * 3 + d] = range(-1, 1) * range(5, 15); svy[j * 3 + d] = range(16, 32) * (k === 2 ? 1 : 0.7); }
    }

    /* ---- lightning ---- */
    let bolts = [], glows = [], nextBolt = 0, nextGlow = 0, struck = false, flash = 0;
    function zigzag(x0, y0, x1, y1, depth, rough) {
      let pts = [x0, y0, x1, y1];
      for (let d = 0; d < depth; d++) {
        const next = [pts[0], pts[1]];
        for (let i = 0; i < pts.length - 2; i += 2) {
          const ax = pts[i], ay = pts[i + 1], bx = pts[i + 2], by = pts[i + 3], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, off = (rnd() - 0.5) * l * rough;
          next.push((ax + bx) / 2 - (dy / l) * off, (ay + by) / 2 + (dx / l) * off, bx, by);
        }
        pts = next;
      }
      return pts;
    }
    const pathOf = (pts) => { const p = new Path2D(); p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); return p; };
    // a strike: the leader, a bright return stroke a moment later, then the fade
    const strokeAt = (ms) => (ms < 0 ? 0 : ms < 30 ? ms / 30 : ms < 85 ? lerp(1, 0.18, (ms - 30) / 55) : ms < 115 ? lerp(0.18, 0.85, (ms - 85) / 30) : 0.85 * Math.exp(-(ms - 115) / 150));
    const sheetAt = (ms, pk) => (ms < 0 ? 0 : (ms < 70 ? ms / 70 : Math.exp(-(ms - 70) / 120)) * pk * (0.82 + 0.18 * Math.sin(ms * 0.09)));
    function strike() {
      const t = !struck && tips.length ? tips[0] : rnd() < 0.35 && tips.length ? tips[(rnd() * Math.min(4, tips.length)) | 0] : null;
      struck = true;
      const [x1, y1] = t ? lift(t.x, t.y, t.zone) : P(range(S[0] + 1, S[2] - 1), range(S[1] + 1, S[3] - 1));
      const x0 = clamp(x1 + range(-80, 80), VX + 60, VX + VW - 60), y0 = Math.max(VY + 6, baseAt(x0) - range(6, 18));
      const main = zigzag(x0, y0, x1, y1, 7, 0.5), paths = [{ d: pathOf(main), w: 1 }];
      const n = main.length / 2, dir = Math.atan2(y1 - y0, x1 - x0), long = Math.hypot(x1 - x0, y1 - y0);
      for (let b = 0, nb = 2 + ((rnd() * 3) | 0); b < nb; b++) {
        const k = ((range(0.08, 0.7) * n) | 0) * 2, px = main[k], py = main[k + 1];
        const a = dir + (rnd() < 0.5 ? -1 : 1) * range(0.35, 0.9), l = long * range(0.12, 0.3);
        paths.push({ d: pathOf(zigzag(px, py, px + Math.cos(a) * l, py + Math.sin(a) * l, 5, 0.6)), w: 0.55 });
      }
      bolts.push({ paths, t0: tw, x1, y1 });
      glows.push({ x: x0, y: y0, r: 170, t0: tw, bolt: true });
      // the city itself lights up: two pulses, never more than two a second
      const soft = calm.matches, b1 = soft ? 0.95 : 1.4, b2 = soft ? 0.9 : 1.25;
      try { sc.svg.animate([{ offset: 0.06, filter: `brightness(${b1}) saturate(.6)` }, { offset: 0.16, filter: "brightness(.84) saturate(.68)" }, { offset: 0.22, filter: `brightness(${b2}) saturate(.6)` }, { offset: 0.5, filter: "brightness(.95) saturate(.66)" }], { duration: 520 }); } catch {}
    }
    // lightning inside the cloud, with no bolt
    const sheetFlash = () => { const x = range(VX + 60, VX + VW - 60); glows.push({ x, y: Math.max(VY + 4, baseAt(x) - range(10, 40)), r: range(110, 180), t0: tw, pk: range(0.4, 0.7) }); };

    /* ---- the canvas, fitted to the stage ---- */
    let k = 0, ox = 0, oy = 0, cap = 0;
    function fit() {
      const w = canvas.clientWidth, hh = canvas.clientHeight;
      if (!w || !hh) { k = 0; return; }
      let d = Math.min(window.devicePixelRatio || 1, 2);
      if (w * hh * d * d > 4.5e6) d = Math.sqrt(4.5e6 / (w * hh));
      canvas.width = Math.round(w * d); canvas.height = Math.round(hh * d);
      k = Math.min(canvas.width / VW, canvas.height / VH);
      ox = (canvas.width - VW * k) / 2 - VX * k; oy = (canvas.height - VH * k) / 2 - VY * k;
      // fewer drops on a small stage, so the rain stays rain and not a fog
      cap = Math.round(1500 * clamp(w / 1000, 0.45, 1.1));
    }

    /* ---- each frame ---- */
    let raf = 0, live = false, quick = false, last = 0, tw = 0, rain = 0, cloud = 0, wetness = 0, waterAt = 0;
    const busy = () => clock() != null || rain > 0.003 || cloud > 0.003 || wetness > 0.003 || flying || ns || bolts.length || glows.length;
    function step(t, dt) {
      tw += dt;
      readLift();
      if (tw >= waterAt) { readWater(); waterAt = tw + 0.5; }
      rain = ease(rain, rainAt(t), dt, quick ? 0.35 : 0.7);
      const clouded = t != null && t < dryAt + 1.5 ? 1 : 0;
      cloud = ease(cloud, clouded, dt, clouded > cloud ? 1.1 : quick ? 0.5 : 1.6);
      wetness = rain > 0.04 ? Math.min(1, wetness + dt * 0.45 * rain) : Math.max(0, wetness - dt / (quick ? 2.5 : 6));
      // drops: the first `want` of them are in the air
      const want = Math.min(MAX, Math.round(cap * rain));
      flying = 0;
      for (let i = 0; i < MAX; i++) {
        if (!on[i]) { if (i < want) { aim(i, VY - 10 - rnd() * 140); on[i] = 1; } else continue; }
        h[i] -= v[i] * dt;
        if (h[i] <= 0) {
          if (kind[i]) splash(tx[i], ty[i], wet[i] ? 3 : kind[i]);
          if (i < want) aim(i, VY - 10 - rnd() * 40); else { on[i] = 0; continue; }
        }
        flying++;
      }
      for (let j = 0; j < ns; j++) {
        age[j] += dt;
        if (age[j] < LIFE[sk[j]]) continue;
        const e = --ns;
        sx[j] = sx[e]; sy[j] = sy[e]; age[j] = age[e]; sk[j] = sk[e];
        for (let d = 0; d < 3; d++) { svx[j * 3 + d] = svx[e * 3 + d]; svy[j * 3 + d] = svy[e * 3 + d]; }
        j--;
      }
      // lightning while it pours: in-cloud flickers, and now and then a bolt
      if (t != null && rain > 0.6) {
        if (t >= nextBolt) { strike(); nextBolt = t + range(3.4, 6.5); nextGlow = Math.max(nextGlow, t + 1.3); }
        else if (t >= nextGlow) { sheetFlash(); nextGlow = t + range(1.6, 3.6); }
      }
      bolts = bolts.filter((b) => tw - b.t0 < 0.9);
      glows = glows.filter((l) => tw - l.t0 < 0.9);
      flash = 0;
      for (const l of glows) flash = Math.max(flash, l.bolt ? strokeAt((tw - l.t0) * 1000) : 0.4 * sheetAt((tw - l.t0) * 1000, l.pk));
    }

    function paintHaze(s) {
      const d = hd.data;
      for (let j = 0; j < HH; j++) {
        const uy = VY + ((j + 0.5) * VH) / HH, top = smooth(VY, VY + 34, uy);
        for (let i = 0; i < HW; i++) {
          const ux = VX + ((i + 0.5) * VW) / HW, gx = ux + s * (near(ux) - uy), o = (j * HW + i) * 4;
          let a = 0;
          if (top && gx > L[0] && gx < R[0]) {
            const sh = sheet(gx, tw);
            a = rain * 0.17 * sh * sh * clamp((near(gx) - Math.max(uy, far(gx))) / DEPTH) * top * (1 + 2.5 * flash);
          }
          d[o] = 150 + 60 * flash; d[o + 1] = 172 + 50 * flash; d[o + 2] = 178 + 60 * flash; d[o + 3] = 255 * clamp(a);
        }
      }
      hg.putImageData(hd, 0, 0);
    }

    // A ring in iso: an ellipse half as tall as it is wide.
    const ring = (p, x, y, rx) => { p.moveTo(x + rx, y); p.ellipse(x, y, rx, rx * 0.46, 0, 0, TAU); };
    function draw() {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      if (!k) return;
      g.setTransform(k, 0, 0, k, ox, oy);
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.lineCap = "round"; g.lineJoin = "round";
      const s = slope(tw), px = 1 / k;

      // wet roads: every lamp's light smeared down the wet surface under it
      if (wetness > 0.01) {
        g.globalCompositeOperation = "lighter";
        lamps.forEach((l, i) => {
          const [x, y] = lift(l.x, l.y, l.zone);
          g.globalAlpha = clamp(wetness * (0.6 + 0.22 * Math.sin(tw * 5.1 + i * 1.7) + 0.12 * Math.sin(tw * 12.7 + i)) * (1 + flash * 0.5));
          g.drawImage(glint, x - 2.5 + Math.sin(tw * 9 + i) * 0.25, y + 1, 5, 26);
        });
        g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      }
      // spray hanging low over the streets
      if (mist && rain > 0.01) {
        g.save();
        g.beginPath(); g.moveTo(L[0], L[1] - 3); g.lineTo(B[0], B[1] - 3); g.lineTo(R[0], R[1] - 3); g.lineTo(F[0], F[1] - 3); g.closePath(); g.clip();
        g.globalAlpha = 0.2 * rain;
        g.drawImage(mist, MX0 - tw * 3.5, MY0, MX1 - MX0, MY1 - MY0);
        g.restore();
      }
      // splashes: a ring, and from a heavy drop a crown of droplets; on water, ripples
      if (ns) {
        const rings = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], rips = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], dots = new Path2D();
        for (let j = 0; j < ns; j++) {
          const kk = sk[j], p = age[j] / LIFE[kk], b = Math.min(3, (p * 4) | 0), x = sx[j], y = sy[j];
          if (kk === 3) {
            ring(rips[b], x, y, 0.6 + 4.6 * p);
            const q = (age[j] - 0.18) / LIFE[3];
            if (q > 0) ring(rips[Math.min(3, (q * 4) | 0)], x, y, 0.5 + 3.4 * q);
            continue;
          }
          ring(rings[b], x, y, kk === 2 ? 0.7 + 2.4 * p : 0.5 + 1.6 * p);
          if (kk === 1 && j & 1) continue;
          const a = age[j];
          for (let d = 0; d < 3; d++) {
            const dy = svy[j * 3 + d] * a - 90 * a * a;
            if (dy > 0) dots.rect(x + svx[j * 3 + d] * a - 0.3, y - dy - 0.3, 0.6, 0.6);
          }
        }
        const boost = 1 + flash;
        g.lineWidth = Math.max(0.42, 0.9 * px);
        for (let b = 0; b < 4; b++) {
          const fade = Math.pow(1 - (b + 0.5) / 4, 1.4);
          g.strokeStyle = `rgba(215,236,242,${0.5 * fade * boost})`; g.stroke(rings[b]);
          g.strokeStyle = `rgba(190,232,245,${0.6 * fade * boost})`; g.stroke(rips[b]);
        }
        g.fillStyle = `rgba(225,242,248,${0.55 * boost})`; g.fill(dots);
      }
      // the grey veil of the rain, then the drops themselves: each streak
      // fades toward its tail, as a falling drop does to a camera
      if (rain > 0.005) {
        paintHaze(s);
        g.drawImage(haze, VX, VY, VW, VH);
      }
      if (flying) {
        const tails = [new Path2D(), new Path2D(), new Path2D()], heads = [new Path2D(), new Path2D(), new Path2D()];
        for (let i = 0; i < MAX; i++) {
          if (!on[i]) continue;
          const y = ty[i] - h[i];
          if (y < VY) continue;
          const x = tx[i] - s * h[i], l = len[i], kd = kind[i];
          if (y < hidden(x)) continue;
          tails[kd].moveTo(x - s * l, y - l); tails[kd].lineTo(x - s * l * 0.45, y - l * 0.45);
          heads[kd].moveTo(x - s * l * 0.45, y - l * 0.45); heads[kd].lineTo(x, y);
        }
        for (let kd = 0; kd < 3; kd++) {
          const a = KIND[kd].a * (0.7 + 0.3 * rain) * (1 + 1.6 * flash);
          g.lineWidth = Math.max(KIND[kd].w, 0.8 * px);
          g.strokeStyle = `rgba(200,224,232,${a * 0.45})`; g.stroke(tails[kd]);
          g.strokeStyle = `rgba(214,236,242,${a})`; g.stroke(heads[kd]);
        }
      }
      // the cloud: two banks drifting on the wind at different speeds, the
      // rain hanging from them in sheets that lean with the wind, and the
      // near bank lit from inside where lightning flickers
      if (banks && cloud > 0.003) {
        // the banks barely move, so they stay clear of the towers; the rain
        // under them sweeps across
        const dB = -tw * 0.25, dF = -tw * 0.5, dC = -tw * 2.2;
        g.globalAlpha = cloud; g.drawImage(banks.far.img, CX0 + dB, CY0, CW, CH);
        if (rain > 0.01) {
          sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = "source-over"; sg.clearRect(0, 0, sheets.width, sheets.height);
          sg.setTransform(CS, 0, 0, CS, -VX * CS, -VY * CS); sg.transform(1, 0, s, 1, -s * RY0, 0);
          sg.drawImage(curtain, CX0 + dC, RY0, CW + 140, RY1 - RY0);
          sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = "destination-in";
          sg.drawImage(column, 0, 0, sheets.width, sheets.height);
          g.globalAlpha = 0.4 * rain * cloud; g.drawImage(sheets, VX, VY, VW, VH);
        }
        g.globalAlpha = cloud; g.drawImage(banks.near.img, CX0 + dF, CY0, CW, CH);
        for (const l of glows) {
          const I = l.bolt ? strokeAt((tw - l.t0) * 1000) : sheetAt((tw - l.t0) * 1000, l.pk);
          if (I < 0.01) continue;
          const sx = glowLayer.width / CW, cx = (l.x - CX0 - dF) * sx, cy = (l.y - CY0) * sx, r = l.r * sx;
          gg.globalCompositeOperation = "copy"; gg.drawImage(banks.near.lit, 0, 0);
          gg.globalCompositeOperation = "destination-in";
          const rg = gg.createRadialGradient(cx, cy, 0, cx, cy, r);
          rg.addColorStop(0, "#000"); rg.addColorStop(1, "rgba(0,0,0,0)");
          gg.fillStyle = rg; gg.fillRect(0, 0, glowLayer.width, glowLayer.height);
          g.globalCompositeOperation = "lighter"; g.globalAlpha = clamp(I * cloud);
          g.drawImage(glowLayer, CX0 + dF, CY0, CW, CH);
          g.globalCompositeOperation = "source-over";
        }
        g.globalAlpha = 1;
      }
      // lightning, over the cloud's base it leaves from: a glow where it
      // strikes, then the channel, its branches dimming before the return stroke
      if (bolts.length) {
        g.globalCompositeOperation = "lighter";
        for (const b of bolts) {
          const ms = (tw - b.t0) * 1000, I = strokeAt(ms);
          if (I < 0.01) continue;
          const rg = g.createRadialGradient(b.x1, b.y1, 0, b.x1, b.y1, 34);
          rg.addColorStop(0, `rgba(200,215,255,${0.45 * I})`); rg.addColorStop(1, "rgba(200,215,255,0)");
          g.fillStyle = rg; g.fillRect(b.x1 - 34, b.y1 - 34, 68, 68);
          for (const p of b.paths) {
            const a = I * (p.w < 1 && ms > 85 ? 0.5 : 1);
            g.strokeStyle = `rgba(150,180,255,${0.08 * a})`; g.lineWidth = 7 * p.w; g.stroke(p.d);
            g.strokeStyle = `rgba(185,205,255,${0.22 * a})`; g.lineWidth = 2.8 * p.w; g.stroke(p.d);
            g.strokeStyle = `rgba(245,248,255,${0.95 * a})`; g.lineWidth = Math.max(0.9 * p.w, 0.9 * px); g.stroke(p.d);
          }
        }
        g.globalCompositeOperation = "source-over";
      }
    }

    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      step(clock(), dt);
      draw();
      if (busy()) { if (live) raf = requestAnimationFrame(frame); }
      else { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height); }
    }
    const kick = () => { if (live && !raf && busy()) { last = 0; raf = requestAnimationFrame(frame); } };
    new ResizeObserver(() => { fit(); kick(); }).observe(canvas);

    return {
      start() {
        prepare(true);
        tw = 0; quick = false; struck = false;
        // the first bolt just before the alarm, the first flicker sooner
        nextBolt = 7.4; nextGlow = 4.5;
        kick();
      },
      end(cancelled) { quick = !!cancelled; kick(); },
      run(onScreen) {
        live = onScreen;
        if (live) { prepare(false); kick(); } else { cancelAnimationFrame(raf); raf = 0; }
      },
    };
  };
})();
