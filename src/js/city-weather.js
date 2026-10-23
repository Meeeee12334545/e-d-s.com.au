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
// (the river, ponds, tanks, the storm's puddles) ring it with ripples. A few
// big drops fall close to the camera, in front of everything.
//
// The cloud is three layers of fractal noise shaded as a volume (each point
// is shadowed by the cloud between it and the light, so the billows round
// over, the base goes dark and the thin fringes glow through) and painted at
// the stage's own resolution, so it is as sharp as the city under it: a far
// bank across the top of the sky, the heavy near bank whose base follows the
// skyline, and ragged scud racing under it on the wind. Rain shafts hang from
// the base and sweep across, the sky goes dark under it all, and lightning
// is a branching channel from the base to the ground, a crawler along the
// base inside the cloud, or a flash within it; each lights the cloud from
// inside, and the sky, the rain and the wet streets with it.
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

  // value noise and its fractal sum, for the cloud, the rain shafts and the
  // spray. `per` makes it repeat every `per` cells along x, for a strip that
  // tiles; octaves o0 to o1 alone let a field be built broadly on a coarse
  // grid and finished finely on the full one.
  const hash = (i, j, s) => {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s, per) => {
    let i = Math.floor(x);
    const j = Math.floor(y), fx = x - i, fy = y - j;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let i1 = i + 1;
    if (per) { i = ((i % per) + per) % per; i1 = (i + 1) % per; }
    const a = hash(i, j, s), b = hash(i1, j, s), c = hash(i, j + 1, s), d = hash(i1, j + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, s, oct = 5, o0 = 0, o1 = oct, per = 0) => {
    let t = 0, amp = 0.5, sum = 0;
    const lac = per ? 2 : 2.03;
    for (let o = 0; o < oct; o++) {
      if (o >= o0 && o < o1) t += amp * noise(x, y, s + o * 17, per);
      sum += amp; x *= lac; y *= lac; amp *= 0.5;
      if (per) per *= 2;
    }
    return t / sum;
  };
  const canvasOf = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  // a canvas filled pixel by pixel: fn(x, y) returns [r, g, b, alpha 0..1];
  // `paint` at once for a small one, `painting` a few rows at a time
  function* painting(w, h, fn) {
    const c = canvasOf(w, h), cg = c.getContext("2d"), img = cg.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = fn(x, y);
        if (!p || p[3] <= 0) continue;
        const i = (y * w + x) * 4;
        d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = 255 * clamp(p[3]);
      }
      if (y % 6 === 5) yield;
    }
    cg.putImageData(img, 0, 0);
    return c;
  }
  const paint = (w, h, fn) => { const job = painting(w, h, fn); let r; do r = job.next(); while (!r.done); return r.value; };
  // a box blur of radius r (running sums, one axis then the other)
  function blur(src, W, H, r, dst, tmp) {
    const n = 2 * r + 1;
    for (let y = 0; y < H; y++) {
      const o = y * W;
      let acc = 0;
      for (let x = -r; x <= r; x++) acc += src[o + clamp(x, 0, W - 1)];
      for (let x = 0; x < W; x++) { tmp[o + x] = acc / n; acc += src[o + clamp(x + r + 1, 0, W - 1)] - src[o + clamp(x - r, 0, W - 1)]; }
    }
    for (let x = 0; x < W; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[clamp(y, 0, H - 1) * W + x];
      for (let y = 0; y < H; y++) { dst[y * W + x] = acc / n; acc += tmp[clamp(y + r + 1, 0, H - 1) * W + x] - tmp[clamp(y - r, 0, H - 1) * W + x]; }
    }
  }
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  // the drops: fine, steady and heavy, each with its fall speed (scene
  // units a second), streak length, width and brightness; and the few big
  // ones that pass close to the camera, in front of everything
  const KIND = [
    { v: [430, 520], len: [7, 11], w: 0.45, a: 0.22 },
    { v: [570, 670], len: [12, 18], w: 0.62, a: 0.36 },
    { v: [720, 830], len: [18, 28], w: 0.88, a: 0.44 },
    { v: [980, 1150], len: [26, 40], w: 1.6, a: 0.12 },
  ];
  const NEAR = 3;
  // a splash's life in seconds: a steady drop, a heavy one, a ripple on water
  const LIFE = [0, 0.22, 0.32, 0.9];
  // the cloud banks cover this part of the scene
  const CX0 = -360, CX1 = 490, CY0 = -60, CY1 = 140, CW = CX1 - CX0, CH = CY1 - CY0;
  // the scud: this many fragments, each this big
  const SCUD_N = 6, SCUD_W = 96, SCUD_H = 44;
  // the rain shafts that hang from the cloud, and the spray over the streets
  const RY0 = -44, RY1 = 240, MX0 = -430, MX1 = 610, MY0 = -40, MY1 = 400;
  // the cloud is painted at the stage's own pixels a unit, up to this many
  const RMAX = 3;

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
    const clipSlab = (c, dy = 0) => { c.beginPath(); c.moveTo(L[0], L[1] + dy); c.lineTo(B[0], B[1] + dy); c.lineTo(R[0], R[1] + dy); c.lineTo(F[0], F[1] + dy); c.closePath(); c.clip(); };

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
    // gusts; the squalls that thicken and thin the rain; and the heavier
    // sheets of it the wind drives across the city
    const slope = (t) => -0.21 - 0.09 * (0.5 + 0.5 * Math.sin(t * 0.7)) - 0.045 * Math.sin(t * 1.9 + 1) - 0.025 * Math.sin(t * 5.3);
    const gust = (t) => clamp(0.8 + 0.2 * Math.sin(t * 0.83) + 0.14 * Math.sin(t * 2.1 + 2) + 0.08 * Math.sin(t * 4.7), 0.5, 1.2);
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
    // `tex` holds the finished set, painted at `res` pixels a scene unit
    let tex = null, res = 0, job = null;
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
    // A field of cloud over W x H pixels at r pixels a unit, from fractal
    // noise folded over itself (a warp) so it billows: above 0 is cloud.
    // `env(ux, uy)` says where cloud may be (0..1). The warp and the broad
    // octaves are worked out on a grid a third as fine and interpolated;
    // only the fine octaves are evaluated at every pixel, which is what
    // makes a bank at the stage's full resolution affordable.
    function* field(seed, r, W, H, x0, y0, env, o) {
      const n = new Float32Array(W * H).fill(-1);
      const lr = r / 3, LW = Math.ceil(W / 3) + 2, LH = Math.ceil(H / 3) + 2;
      const low = new Float32Array(LW * LH), wx = new Float32Array(LW * LH), wy = new Float32Array(LW * LH);
      const [sx, sy] = o.scale, [vx, vy] = o.vscale, per = o.per || 0, vper = o.vper || 0;
      for (let j = 0; j < LH; j++) {
        const uy = y0 + j / lr;
        for (let i = 0; i < LW; i++) {
          const ux = x0 + i / lr, k = j * LW + i;
          const qx = fbm(ux / vx, uy / vy, seed + 3, 3, 0, 3, vper), qy = fbm(ux / vx + 5.2, uy / vy + 1.3, seed + 5, 3, 0, 3, vper);
          wx[k] = ux / sx + o.warp * qx; wy[k] = uy / sy + o.warp * qy;
          low[k] = fbm(wx[k], wy[k], seed, 6, 0, 3, per);
        }
        if (j % 3 === 2) yield;
      }
      const at = (arr, i, j) => arr[Math.min(LH - 1, j) * LW + Math.min(LW - 1, i)];
      for (let y = 0; y < H; y++) {
        const uy = y0 + y / r, fy = y / 3, j = fy | 0, ty = fy - j;
        for (let x = 0; x < W; x++) {
          const ux = x0 + x / r, e = env(ux, uy);
          if (e < 0.04) continue;
          const fx = x / 3, i = fx | 0, tx = fx - i;
          const a = (1 - tx) * (1 - ty), b = tx * (1 - ty), c = (1 - tx) * ty, d = tx * ty;
          const bil = (arr) => a * at(arr, i, j) + b * at(arr, i + 1, j) + c * at(arr, i, j + 1) + d * at(arr, i + 1, j + 1);
          n[y * W + x] = bil(low) + fbm(bil(wx), bil(wy), seed, 6, 3, 6, per) + o.lift * e + o.bias;
        }
        if (y % 4 === 3) yield;
      }
      return { n, W, H };
    }
    // The field as a picture: a relief lit from above and to the left, each
    // point shadowed by the cloud between it and the light (a short march
    // toward it), so the billows round over, the heavy base goes dark and
    // the thin fringes glow through. The second picture is the same cloud
    // lit from inside, as lightning shows it.
    function* shade(f, r, o) {
      const { n, W, H } = f, rad = Math.max(1, Math.round(1.5 * r));
      const pos = new Float32Array(W * H), tmp = new Float32Array(W * H), soft = new Float32Array(W * H);
      for (let i = 0; i < n.length; i++) pos[i] = Math.max(-0.1, n[i]);
      yield;
      blur(pos, W, H, rad, soft, tmp);
      yield;
      const img = canvasOf(W, H), lit = canvasOf(W, H), ig = img.getContext("2d"), lg = lit.getContext("2d");
      const id = ig.createImageData(W, H), ld = lg.createImageData(W, H);
      const at = (x, y) => soft[clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1)];
      const dens = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : Math.max(0, n[y * W + x]));
      const G = Math.max(1, Math.round(2 * r)), ST = Math.max(1, Math.round(2 * r)), LX = -0.55 * ST, LY = -0.83 * ST;
      const { dark, mid, light } = o;
      for (let y = 0; y < H; y++) {
        const uy = o.y0 + y / r;
        for (let x = 0; x < W; x++) {
          const j = y * W + x, c = n[j];
          if (c <= 0) continue;
          const gx = (at(x + G, y) - at(x - G, y)) * 2.4, gy = (at(x, y + G) - at(x, y - G)) * 2.4, nl = Math.hypot(gx, gy, 1);
          const lit0 = clamp((gx * 0.5 + gy * 0.8 + 0.55) / nl / 1.12);
          let occ = 0;
          for (let m = 1; m <= o.march; m++) occ += dens(Math.round(x + LX * m), Math.round(y + LY * m));
          const shadow = Math.exp(-occ * o.dense), thin = 1 - smooth(0.03, 0.3, c);
          let sh = (0.2 + lit0 * (0.45 + 0.45 * shadow) + 0.22 * thin * lit0) * (1 - 0.15 * smooth(0.1, 0.5, c));
          // darker toward the base, as a storm cloud's underside is
          if (o.base) { const b = o.base(o.x0 + x / r); sh *= lerp(1, 0.45, smooth(b - 44, b, uy)); }
          sh = clamp(sh);
          const col = sh < 0.5 ? mix(dark, mid, sh * 2) : mix(mid, light, (sh - 0.5) * 2), a = smooth(0, 0.12, c), p = j * 4;
          id.data[p] = col[0]; id.data[p + 1] = col[1]; id.data[p + 2] = col[2]; id.data[p + 3] = 255 * a * o.alpha;
          ld.data[p] = 200; ld.data[p + 1] = 212; ld.data[p + 2] = 255; ld.data[p + 3] = 255 * a * (0.3 + 0.3 * sh + 0.4 * thin);
        }
        if (y % 8 === 7) yield;
      }
      ig.putImageData(id, 0, 0); lg.putImageData(ld, 0, 0);
      const scratch = canvasOf(W, H);
      return { img, lit, scratch, sg: scratch.getContext("2d"), r };
    }
    const side = (ux) => smooth(VX - 10, VX + 50, ux) * (1 - smooth(VX + VW - 50, VX + VW + 10, ux));
    // a bank fills the sky down to its base (less far for the far bank),
    // thins to nothing at the top and the sides of the stage
    const bankEnv = (rise, floor) => (ux, uy) => { const b = Math.max(floor, baseAt(ux) - rise); return smooth(b + 8, b - 22, uy) * smooth(VY, VY + 22, uy) * side(ux); };
    const BANK = { scale: [70, 30], vscale: [90, 40], warp: 1.3, lift: 0.8, bias: -0.74 };
    // each scud fragment is a torn lump filling one cell of a strip of them
    const scudEnv = (ux, uy) => {
      const i = Math.min(SCUD_N - 1, Math.floor(ux / SCUD_W)), lx = (ux - i * SCUD_W - SCUD_W / 2) / (SCUD_W * 0.46), ly = (uy - SCUD_H / 2) / (SCUD_H * 0.42);
      return 1 - smooth(0.2, 1.05, Math.hypot(lx * (0.85 + 0.3 * hash(i, 1, 9)), ly));
    };
    function* make(r) {
      if (!tex) yield* skyline();
      const T = {};
      const fr = r * 0.7;
      T.far = yield* shade(yield* field(31, fr, Math.round(CW * fr), Math.round(CH * fr), CX0, CY0, bankEnv(22, VY + 40), BANK), fr,
        { dark: [38, 48, 58], mid: [76, 90, 102], light: [128, 142, 154], alpha: 0.74, march: 5, dense: 0.4, base: (ux) => Math.max(VY + 40, baseAt(ux) - 22), x0: CX0, y0: CY0 });
      T.near = yield* shade(yield* field(7, r, Math.round(CW * r), Math.round(CH * r), CX0, CY0, bankEnv(0, VY), BANK), r,
        { dark: [12, 16, 23], mid: [50, 60, 70], light: [152, 164, 174], alpha: 0.97, march: 8, dense: 0.45, base: (ux) => Math.max(VY, baseAt(ux)), x0: CX0, y0: CY0 });
      // the scud: torn fragments that race under the base on the wind
      T.scud = yield* shade(yield* field(53, r, Math.round(SCUD_N * SCUD_W * r), Math.round(SCUD_H * r), 0, 0, scudEnv,
        { scale: [18, 8], vscale: [60, 26], warp: 1, lift: 0.8, bias: -1 }), r,
        { dark: [8, 11, 16], mid: [22, 28, 36], light: [50, 60, 70], alpha: 0.9, march: 3, dense: 0.5, x0: 0, y0: 0 });
      // rain shafts under the cloud: broad columns of fine streaks, fading as they fall
      const cr = Math.min(r, 1.6);
      T.curtain = yield* painting(Math.round((CW + 140) * cr), Math.round((RY1 - RY0) * cr), (x, y) => {
        const ux = CX0 + x / cr, uy = RY0 + y / cr;
        const shaft = smooth(0.45, 0.7, fbm(ux / 48, uy / 700, 71, 2)), streak = smooth(0.42, 0.76, fbm(ux / 3, uy / 120, 77, 3));
        return [150, 168, 178, shaft * (0.25 + 0.75 * streak) * smooth(RY0, -10, uy) * (1 - smooth(40, RY1, uy))];
      });
      // the spray, wisps of it over the streets
      const mr = Math.min(0.8, r * 0.3);
      T.mist = yield* painting(Math.round((MX1 - MX0) * mr), Math.round((MY1 - MY0) * mr), (x, y) => {
        const ux = x / mr, uy = y / mr, d = fbm(ux / 70, uy / 30, 91, 5), w = fbm(ux / 18, uy / 9, 93, 3);
        return [178, 200, 208, smooth(0.42, 0.7, d) * (0.5 + 0.5 * smooth(0.35, 0.7, w)) * 0.8];
      });
      tex = T; res = r;
    }
    // the job runs while the page is idle; a storm that starts before it is
    // done pushes it along a few milliseconds a frame
    const wantRes = () => clamp(k || 2, 1.2, RMAX);
    function prepare() {
      if (job) return;
      const mine = (job = make(wantRes()));
      const idle = window.requestIdleCallback || ((fn) => setTimeout(() => fn({ timeRemaining: () => 6 }), 40));
      const work = (dl) => {
        if (job !== mine) return;
        while (dl.timeRemaining() > 2) if (mine.next().done) { job = null; return; }
        idle(work);
      };
      idle(work);
    }
    function advance(ms) {
      if (!job) return;
      const end = performance.now() + ms;
      while (performance.now() < end) if (job.next().done) { job = null; return; }
    }
    // the sky under the cloud: an overcast gloom over the stage, and the same
    // shape in the pale light of a flash
    const GW = 128, GH = 72;
    const skyShape = (i, j) => {
      const ux = VX + ((i + 0.5) * VW) / GW, uy = VY + ((j + 0.5) * VH) / GH;
      return Math.pow(1 - smooth(VY, VY + 250, uy), 2.2) * smooth(VY - 1, VY + 22, uy) * smooth(VX, VX + 70, ux) * (1 - smooth(VX + VW - 70, VX + VW, ux));
    };
    const gloom = paint(GW, GH, (i, j) => [30, 40, 52, skyShape(i, j)]);
    const glare = paint(GW, GH, (i, j) => [172, 192, 236, skyShape(i, j)]);
    // the rain's grey veil, worked out each frame at a coarse grid and
    // stretched over the stage; it is thickest where the most rain is in view
    const HW = 128, HH = 72, haze = canvasOf(HW, HH), hg = haze.getContext("2d"), hd = hg.createImageData(HW, HH);
    // the column of air over the slab, as a soft mask: the rain shafts are
    // drawn through it so they hang only where rain falls
    const column = paint(HW, HH, (i, j) => {
      const ux = VX + ((i + 0.5) * VW) / HW, uy = VY + ((j + 0.5) * VH) / HH;
      return [0, 0, 0, ux > L[0] && ux < R[0] ? clamp(((near(ux) - Math.max(uy, far(ux))) / DEPTH) * 2.2) * smooth(VY, VY + 30, uy) : 0];
    });
    const CS = 1.2, sheets = canvasOf(Math.round(VW * CS), Math.round(VH * CS)), sg = sheets.getContext("2d");

    /* ---- drops and splashes ---- */
    const MAX = 2200;
    const tx = new Float32Array(MAX), ty = new Float32Array(MAX), h = new Float32Array(MAX), v = new Float32Array(MAX), len = new Float32Array(MAX);
    const kind = new Uint8Array(MAX), on = new Uint8Array(MAX), wet = new Uint8Array(MAX);
    for (let i = 0; i < MAX; i++) { const r = rnd(); kind[i] = r < 0.48 ? 0 : r < 0.82 ? 1 : r < 0.96 ? 2 : NEAR; }
    let flying = 0;
    function aim(i, y0) {
      const K = KIND[kind[i]];
      v[i] = range(K.v[0], K.v[1]); len[i] = range(K.len[0], K.len[1]); wet[i] = 0;
      let x = 0, y = 0, w = 0;
      if (kind[i] && kind[i] !== NEAR && sites.length && rnd() < 0.2) {
        const s = sites[(rnd() * sites.length) | 0];
        if (rnd() < s.vis) { [x, y] = lift(s.x, s.y, s.zone); w = 1; }
      }
      // anywhere on the slab, but more often under the heavier sheets
      if (!w) for (let k = 0; k < 4; k++) { [x, y] = P(range(S[0], S[2]), range(S[1], S[3])); if (rnd() < sheet(x, tw)) break; }
      tx[i] = x; ty[i] = y; wet[i] = w;
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
    let bolts = [], crawlers = [], glows = [], nextBolt = 0, nextGlow = 0, lastGlow = -9, struck = false, flash = 0;
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
    // A channel from one point to another: a jagged trunk in `pieces` that
    // thin toward its end, branches leaning the way it goes, and branches
    // off those. Every piece lands in `out` in the order it forms.
    function channel(x0, y0, x1, y1, depth, rough, w, level, pieces, out) {
      const pts = zigzag(x0, y0, x1, y1, depth, rough), n = pts.length / 2;
      for (let s = 0; s < pieces; s++) {
        const a = Math.floor((s * (n - 1)) / pieces), b = Math.floor(((s + 1) * (n - 1)) / pieces);
        out.push({ d: pathOf(pts.slice(a * 2, b * 2 + 2)), w: w * (1 - (0.5 * s) / pieces), level });
      }
      if (level >= 2) return;
      const dir = Math.atan2(y1 - y0, x1 - x0), long = Math.hypot(x1 - x0, y1 - y0), nb = level ? (rnd() < 0.6 ? 1 : 2) : 3 + ((rnd() * 3) | 0);
      for (let b = 0; b < nb; b++) {
        const k = ((range(0.1, 0.8) * (n - 1)) | 0) * 2, px = pts[k], py = pts[k + 1];
        const a = dir + (rnd() < 0.5 ? -1 : 1) * range(0.3, 0.95), l = long * range(0.12, 0.3) * (1 - 0.3 * level);
        channel(px, py, px + Math.cos(a) * l, py + Math.sin(a) * l, Math.max(3, depth - 2), rough * 1.1, w * 0.5, level + 1, 2, out);
      }
    }
    // a strike: the leader, a brighter return stroke a moment later, then the
    // fade with a flicker in it; a crawler spreads along the cloud for a
    // moment and dies away; a flash inside the cloud swells and fades
    const strokeAt = (ms) => (ms < 0 ? 0 : ms < 30 ? (0.8 * ms) / 30 : ms < 85 ? lerp(0.8, 0.16, (ms - 30) / 55) : ms < 115 ? lerp(0.16, 1, (ms - 85) / 30) : Math.exp(-(ms - 115) / 160) * (0.86 + 0.14 * Math.sin(ms * 0.23)));
    const crawlAt = (ms, dur) => (ms < 0 ? 0 : (ms < dur ? 0.45 + (0.55 * ms) / dur : Math.exp(-(ms - dur) / 200)) * (0.82 + 0.18 * Math.sin(ms * 0.11)));
    const sheetAt = (ms, pk) => (ms < 0 ? 0 : (ms < 70 ? ms / 70 : Math.exp(-(ms - 70) / 120)) * pk * (0.82 + 0.18 * Math.sin(ms * 0.09)));
    const glowI = (l) => { const ms = (tw - l.t0) * 1000; return l.bolt ? strokeAt(ms) : l.crawl ? 0.6 * crawlAt(ms, l.dur) : sheetAt(ms, l.pk); };
    // the city itself lights up with a strike: two pulses, never more than
    // two a second, softer for visitors who ask for reduced motion
    const pulse = (frames, ms) => { try { sc.svg.animate(frames, { duration: ms }); } catch {} };
    function strike() {
      const t = !struck && tips.length ? tips[0] : rnd() < 0.35 && tips.length ? tips[(rnd() * Math.min(4, tips.length)) | 0] : null;
      struck = true;
      const [x1, y1] = t ? lift(t.x, t.y, t.zone) : P(range(S[0] + 1, S[2] - 1), range(S[1] + 1, S[3] - 1));
      const x0 = clamp(x1 + range(-90, 90), VX + 60, VX + VW - 60), y0 = Math.max(VY + 6, baseAt(x0) - range(6, 18));
      const paths = [];
      channel(x0, y0, x1, y1, 8, 0.5, 1, 0, 3, paths);
      bolts.push({ paths, t0: tw, x1, y1 });
      glows.push({ x: x0, y: y0, r: 170, t0: tw, bolt: true });
      const soft = calm.matches, b1 = soft ? 0.95 : 1.4, b2 = soft ? 0.9 : 1.25;
      pulse([{ offset: 0.06, filter: `brightness(${b1}) saturate(.6)` }, { offset: 0.16, filter: "brightness(.84) saturate(.68)" }, { offset: 0.22, filter: `brightness(${b2}) saturate(.6)` }, { offset: 0.5, filter: "brightness(.95) saturate(.66)" }], 520);
    }
    // a crawler: a channel that spreads along the cloud's base, inside it
    function crawl() {
      const long = range(160, 300), x0 = range(VX + 70, VX + VW - 70 - long), x1 = x0 + long;
      const y0 = Math.max(VY + 8, baseAt(x0) - range(14, 36)), y1 = Math.max(VY + 8, baseAt(x1) - range(14, 36)), paths = [], dur = range(320, 560);
      channel(x0, y0, x1, y1, 7, 0.3, 0.8, 0, 7, paths);
      crawlers.push({ paths, t0: tw, dur });
      glows.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, r: 210, t0: tw, crawl: true, dur });
      pulse([{ offset: 0.2, filter: `brightness(${calm.matches ? 1.06 : 1.12}) saturate(.64)` }, { offset: 0.6, filter: "brightness(.9) saturate(.68)" }], 480);
    }
    // lightning inside the cloud, with no channel to see
    const sheetFlash = () => { const x = range(VX + 60, VX + VW - 60); glows.push({ x, y: Math.max(VY + 4, baseAt(x) - range(10, 40)), r: range(120, 190), t0: tw, pk: range(0.4, 0.75) }); };

    /* ---- the canvas, fitted to the stage ---- */
    let k = 0, ox = 0, oy = 0, cap = 0;
    function fit() {
      const w = canvas.clientWidth, hh = canvas.clientHeight;
      if (!w || !hh) { k = 0; return; }
      let d = Math.min(window.devicePixelRatio || 1, 2);
      if (w * hh * d * d > 7e6) d = Math.sqrt(7e6 / (w * hh));
      canvas.width = Math.round(w * d); canvas.height = Math.round(hh * d);
      k = Math.min(canvas.width / VW, canvas.height / VH);
      ox = (canvas.width - VW * k) / 2 - VX * k; oy = (canvas.height - VH * k) / 2 - VY * k;
      // fewer drops on a small stage, so the rain stays rain and not a fog
      cap = Math.round(1700 * clamp(w / 1000, 0.45, 1.15));
      // a bigger stage (the city expanded) gets a sharper cloud, made while
      // the page is idle and swapped in when it is done
      if (live && tex && !job && res < RMAX && k > res * 1.3) prepare();
    }

    /* ---- each frame ---- */
    let raf = 0, live = false, quick = false, last = 0, tw = 0, rain = 0, cloud = 0, wetness = 0, waterAt = 0;
    const busy = () => clock() != null || rain > 0.003 || cloud > 0.003 || wetness > 0.003 || flying || ns || bolts.length || crawlers.length || glows.length;
    function step(t, dt) {
      tw += dt;
      readLift();
      if (tw >= waterAt) { readWater(); waterAt = tw + 0.5; }
      rain = ease(rain, rainAt(t), dt, quick ? 0.35 : 0.7);
      const clouded = t != null && t < dryAt + 1.5 ? 1 : 0;
      cloud = ease(cloud, clouded, dt, clouded > cloud ? 1.1 : quick ? 0.5 : 1.6);
      wetness = rain > 0.04 ? Math.min(1, wetness + dt * 0.45 * rain) : Math.max(0, wetness - dt / (quick ? 2.5 : 6));
      // drops: the first `want` of them are in the air, more in a squall
      const want = Math.min(MAX, Math.round(cap * rain * gust(tw)));
      flying = 0;
      for (let i = 0; i < MAX; i++) {
        if (!on[i]) { if (i < want) { aim(i, VY - 10 - rnd() * 140); on[i] = 1; } else continue; }
        h[i] -= v[i] * dt;
        if (h[i] <= 0) {
          if (kind[i] && kind[i] !== NEAR) splash(tx[i], ty[i], wet[i] ? 3 : kind[i]);
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
      // lightning while it pours: flickers and crawlers in the cloud, and now
      // and then a bolt, never on the heels of a crawler
      if (t != null && rain > 0.6) {
        if (t >= nextBolt && t >= lastGlow + 0.8) { strike(); nextBolt = t + range(3.4, 6.5); nextGlow = Math.max(nextGlow, t + 1.3); }
        else if (t >= nextGlow) { if (rnd() < 0.45) crawl(); else sheetFlash(); lastGlow = t; nextGlow = t + range(1.6, 3.6); }
      }
      bolts = bolts.filter((b) => tw - b.t0 < 0.9);
      crawlers = crawlers.filter((c) => tw - c.t0 < 1.4);
      glows = glows.filter((l) => tw - l.t0 < 1.4);
      flash = 0;
      for (const l of glows) flash = Math.max(flash, (l.bolt ? 1 : l.crawl ? 0.5 : 0.4) * glowI(l));
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
    // a bank lit from inside around a point: its lit picture, cut to a soft
    // disc (only the part of it the disc covers is touched)
    function litSpot(layer, x, y, r, I, dx) {
      const s = layer.r, cx = (x - CX0 - dx) * s, cy = (y - CY0) * s, R = r * s;
      const x0 = Math.max(0, Math.floor(cx - R)), y0 = Math.max(0, Math.floor(cy - R)), x1 = Math.min(layer.img.width, Math.ceil(cx + R)), y1 = Math.min(layer.img.height, Math.ceil(cy + R));
      if (x1 <= x0 || y1 <= y0) return;
      const c = layer.sg;
      c.globalCompositeOperation = "copy"; c.drawImage(layer.lit, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
      c.globalCompositeOperation = "destination-in";
      const rg = c.createRadialGradient(cx, cy, 0, cx, cy, R);
      rg.addColorStop(0, "#000"); rg.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = rg; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.globalCompositeOperation = "lighter"; g.globalAlpha = clamp(I * cloud);
      g.drawImage(layer.scratch, x0, y0, x1 - x0, y1 - y0, CX0 + dx + x0 / s, CY0 + y0 / s, (x1 - x0) / s, (y1 - y0) / s);
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    }
    // the scud: each fragment drifts across under the cloud's base at its
    // own speed and comes round again at the far side
    const scuds = Array.from({ length: 14 }, (_, i) => ({ shape: i % SCUD_N, x: ((i + 0.5) / 14) * (VW + 240) + range(-20, 20), v: range(4, 9), dy: range(-36, -18), s: range(0.7, 1.2), a: range(0.6, 1) }));
    function drawScud() {
      const { img, r } = tex.scud, span = VW + 240;
      for (const f of scuds) {
        const x = VX - 120 + ((((f.x - tw * f.v) % span) + span) % span), fade = side(x);
        if (fade < 0.02) continue;
        const w = SCUD_W * f.s, hh = SCUD_H * f.s;
        g.globalAlpha = cloud * f.a * fade;
        g.drawImage(img, f.shape * SCUD_W * r, 0, SCUD_W * r, SCUD_H * r, x - w / 2, baseAt(x) + f.dy - hh / 2, w, hh);
      }
      g.globalAlpha = 1;
    }
    // bolts and crawlers: each piece glows wide and faint, then narrow and
    // bright; a crawler shows piece by piece as it spreads, a bolt's
    // branches dim before the return stroke
    function drawChannels(list, inCloud, px) {
      g.globalCompositeOperation = "lighter";
      for (const b of list) {
        const ms = (tw - b.t0) * 1000, I = inCloud ? crawlAt(ms, b.dur) : strokeAt(ms);
        if (I < 0.01) continue;
        if (!inCloud) {
          const rg = g.createRadialGradient(b.x1, b.y1, 0, b.x1, b.y1, 46);
          rg.addColorStop(0, `rgba(200,215,255,${0.5 * I})`); rg.addColorStop(0.4, `rgba(200,215,255,${0.16 * I})`); rg.addColorStop(1, "rgba(200,215,255,0)");
          g.fillStyle = rg; g.fillRect(b.x1 - 46, b.y1 - 46, 92, 92);
        }
        const shown = inCloud ? Math.ceil(b.paths.length * clamp(ms / b.dur)) : b.paths.length;
        for (let i = 0; i < shown; i++) {
          const p = b.paths[i], a = I * (p.level && ms > 85 && !inCloud ? (p.level > 1 ? 0.3 : 0.5) : 1);
          if (inCloud) {
            g.strokeStyle = `rgba(150,175,255,${0.1 * a})`; g.lineWidth = 16 * p.w; g.stroke(p.d);
            g.strokeStyle = `rgba(200,215,255,${0.3 * a})`; g.lineWidth = 4 * p.w; g.stroke(p.d);
            g.strokeStyle = `rgba(240,245,255,${0.6 * a})`; g.lineWidth = Math.max(1.2 * p.w, 0.9 * px); g.stroke(p.d);
          } else {
            g.strokeStyle = `rgba(140,170,255,${0.07 * a})`; g.lineWidth = 10 * p.w; g.stroke(p.d);
            g.strokeStyle = `rgba(180,200,255,${0.22 * a})`; g.lineWidth = 3.2 * p.w; g.stroke(p.d);
            g.strokeStyle = `rgba(246,248,255,${0.95 * a})`; g.lineWidth = Math.max(1.1 * p.w, 0.9 * px); g.stroke(p.d);
          }
        }
      }
      g.globalCompositeOperation = "source-over";
    }
    // A ring in iso: an ellipse half as tall as it is wide.
    const ring = (p, x, y, rx) => { p.moveTo(x + rx, y); p.ellipse(x, y, rx, rx * 0.46, 0, 0, TAU); };
    function draw() {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      if (!k) return;
      g.setTransform(k, 0, 0, k, ox, oy);
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.lineCap = "round"; g.lineJoin = "round";
      const s = slope(tw), px = 1 / k, boost = 1 + flash, T = tex;

      // the sky goes dark under the cloud, and lights up with every flash
      if (cloud > 0.003) {
        g.globalAlpha = 0.55 * cloud; g.drawImage(gloom, VX, VY, VW, VH);
        if (flash > 0.01) { g.globalAlpha = clamp(0.55 * flash * cloud); g.drawImage(glare, VX, VY, VW, VH); }
        g.globalAlpha = 1;
      }
      // wet roads: every lamp's light smeared down the wet surface under it,
      // and the whole wet slab catching each flash
      if (wetness > 0.01) {
        g.globalCompositeOperation = "lighter";
        lamps.forEach((l, i) => {
          const [x, y] = lift(l.x, l.y, l.zone);
          g.globalAlpha = clamp(wetness * (0.6 + 0.22 * Math.sin(tw * 5.1 + i * 1.7) + 0.12 * Math.sin(tw * 12.7 + i)) * (1 + flash * 0.5));
          g.drawImage(glint, x - 2.5 + Math.sin(tw * 9 + i) * 0.25, y + 1, 5, 26);
        });
        if (flash > 0.02) {
          g.save(); clipSlab(g, -2); g.globalAlpha = 1;
          g.fillStyle = `rgba(170,195,240,${0.12 * flash * wetness})`; g.fillRect(L[0], B[1] - 2, R[0] - L[0], F[1] - B[1]);
          g.restore();
        }
        g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      }
      // spray hanging low over the streets, two drifts of it
      if (T && rain > 0.01) {
        g.save(); clipSlab(g, -3);
        g.globalAlpha = 0.13 * rain; g.drawImage(T.mist, MX0 - tw * 3.5, MY0, MX1 - MX0, MY1 - MY0);
        g.globalAlpha = 0.09 * rain; g.drawImage(T.mist, MX0 - 300 - tw * 6, MY0 + 24, MX1 - MX0, MY1 - MY0);
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
          if (!on[i] || kind[i] === NEAR) continue;
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
          g.strokeStyle = `rgba(198,220,230,${a * 0.45})`; g.stroke(tails[kd]);
          g.strokeStyle = `rgba(212,232,240,${a})`; g.stroke(heads[kd]);
        }
      }
      // the cloud: the far bank, then what flashes behind the near bank (so
      // its billows stand against the light), the crawlers inside it, the
      // rain shafts leaning with the wind, the near bank lit from inside
      // where lightning is, and the scud racing under it
      if (T && cloud > 0.003) {
        // the banks barely move, so they stay clear of the towers; the scud
        // and the rain under them sweep across
        const dB = -tw * 0.3, dF = -tw * 0.5, dC = -tw * 2.2;
        g.globalAlpha = cloud; g.drawImage(T.far.img, CX0 + dB, CY0, CW, CH);
        for (const l of glows) {
          const I = glowI(l);
          if (I < 0.01) continue;
          if (!l.bolt) litSpot(T.far, l.x, l.y, l.r * 1.1, I * 0.9, dB);
          const r = l.r * 1.4, rg = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
          rg.addColorStop(0, "rgba(190,205,255,1)"); rg.addColorStop(1, "rgba(190,205,255,0)");
          g.globalCompositeOperation = "lighter"; g.globalAlpha = clamp(I * cloud * (l.bolt ? 0.35 : 0.55));
          g.fillStyle = rg; g.fillRect(l.x - r, l.y - r, 2 * r, 2 * r);
          g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
        }
        if (crawlers.length) drawChannels(crawlers, true, px);
        if (rain > 0.01) {
          sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = "source-over"; sg.clearRect(0, 0, sheets.width, sheets.height);
          sg.setTransform(CS, 0, 0, CS, -VX * CS, -VY * CS); sg.transform(1, 0, s, 1, -s * RY0, 0);
          sg.drawImage(T.curtain, CX0 + dC, RY0, CW + 140, RY1 - RY0);
          sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = "destination-in";
          sg.drawImage(column, 0, 0, sheets.width, sheets.height);
          g.globalAlpha = 0.42 * rain * cloud * (1 + 0.8 * flash); g.drawImage(sheets, VX, VY, VW, VH);
        }
        g.globalAlpha = cloud; g.drawImage(T.near.img, CX0 + dF, CY0, CW, CH);
        if (flash > 0.01) {
          g.globalCompositeOperation = "lighter"; g.globalAlpha = clamp(0.2 * flash * cloud);
          g.drawImage(T.near.lit, CX0 + dF, CY0, CW, CH);
          g.globalCompositeOperation = "source-over";
        }
        for (const l of glows) { const I = glowI(l); if (I >= 0.01) litSpot(T.near, l.x, l.y, l.r, I, dF); }
        drawScud();
      }
      // lightning, over the cloud's base it leaves from
      if (bolts.length) drawChannels(bolts, false, px);
      // the drops close to the camera, soft and quick, over everything
      if (flying) {
        const nearPath = new Path2D();
        for (let i = 0; i < MAX; i++) {
          if (!on[i] || kind[i] !== NEAR) continue;
          const y = ty[i] - h[i];
          if (y < VY - 60) continue;
          const x = tx[i] - s * h[i], l = len[i];
          nearPath.moveTo(x - s * l, y - l); nearPath.lineTo(x, y);
        }
        const a = KIND[NEAR].a * (1 + 1.2 * flash);
        g.lineWidth = 3.4; g.strokeStyle = `rgba(205,222,235,${0.3 * a})`; g.stroke(nearPath);
        g.lineWidth = 1.5; g.strokeStyle = `rgba(216,230,240,${a})`; g.stroke(nearPath);
      }
    }

    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (job && clock() != null) advance(5);
      step(clock(), dt);
      draw();
      if (busy()) { if (live) raf = requestAnimationFrame(frame); }
      else { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height); }
    }
    const kick = () => { if (live && !raf && busy()) { last = 0; raf = requestAnimationFrame(frame); } };
    new ResizeObserver(() => { fit(); kick(); }).observe(canvas);

    return {
      start() {
        if (!tex) prepare();
        advance(30);
        tw = 0; quick = false; struck = false;
        // the first bolt just before the alarm, the first flicker sooner
        nextBolt = 7.4; nextGlow = 4.5; lastGlow = -9;
        kick();
      },
      end(cancelled) { quick = !!cancelled; kick(); },
      run(onScreen) {
        live = onScreen;
        if (live) { if (!tex) prepare(); kick(); } else { cancelAnimationFrame(raf); raf = 0; }
      },
    };
  };
})();
