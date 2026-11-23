// The open channel flow calculator (open-channel-flow-calculator.html).
// Flow is the wetted area times the mean velocity, Q = A × v. Each shape
// gives its wetted section at a depth (area, wetted perimeter and width at
// the surface) and its outline for the drawing, in metres up from the bottom
// of the section (the invert). The drawing is to scale, in the light kit of
// the illustrations (site.css: .fc-*, .ef-*), and the figures go into the
// address so a calculation can be shared or kept.
//
// build.mjs runs this same file to draw the first example into the page, so
// the page shows a worked example before (and without) the script and the
// drawing does not jump when it loads. Everything above the DOM wiring at
// the end must run without a document.
(() => {
  const { sqrt, acos, sin, cos, atan2, hypot, abs, max, min, PI } = Math;
  const G = 9.80665;
  const f1 = (n) => Math.round(n * 10) / 10;

  // Points [x, h] along an arc about (cx, ch), from angle a0 to a1.
  const arcPts = (cx, ch, r, a0, a1, n = 96) => Array.from({ length: n + 1 }, (_, k) => {
    const a = a0 + ((a1 - a0) * k) / n;
    return [cx + r * cos(a), ch + r * sin(a)];
  });
  // A circle of diameter d filled to y (0 to d): the circular segment.
  const segment = (d, y) => {
    const r = d / 2, th = 2 * acos(max(-1, min(1, 1 - (2 * y) / d)));
    return { A: (r * r * (th - sin(th))) / 2, P: r * th, T: 2 * sqrt(max(0, y * (d - y))) };
  };
  // The section to depth y under an outline given as points [x, h] up its
  // right half from the bottom centre, rising all the way (the egg).
  const fromPoints = (pts, y) => {
    let A = 0, P = 0, T = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, h0] = pts[i - 1];
      let [x1, h1] = pts[i];
      if (h0 >= y) break;
      if (h1 > y) { x1 = x0 + ((x1 - x0) * (y - h0)) / (h1 - h0); h1 = y; }
      A += (x0 + x1) * (h1 - h0);
      P += 2 * hypot(x1 - x0, h1 - h0);
      T = 2 * x1;
    }
    return { A, P, T };
  };
  // The standard egg, width w: 1.5 w high, its top radius half the width,
  // its bottom radius a quarter and its sides 1.5 w, each arc meeting the
  // next on a common tangent. `o` grows every radius by the same amount
  // from the same centres, which draws the outside of the pipe wall.
  const EGG_JOIN = atan2(-0.6, 0.8);
  const eggPts = (w, o = 0, n = 24) => {
    const R = w / 2;
    return [
      ...arcPts(0, R / 2, R / 2 + o, -PI / 2, EGG_JOIN, n),
      ...arcPts(-2 * R, 2 * R, 3 * R + o, EGG_JOIN, 0, n).slice(1),
      ...arcPts(0, 2 * R, R + o, 0, PI / 2, n).slice(1),
    ];
  };
  // A straight side of slope z (horizontal to 1 vertical) moved out by o.
  const slopeOff = (z, o) => o * sqrt(1 + z * z);

  // Each shape, sized by `s` (metres; z is a ratio; c means a closed top):
  //   closed  whether it is a pipe or culvert, which runs full
  //   height  its height, or 0 for an open channel of no stated depth
  //   width   its width across the top dimension line (0 for none)
  //   at      the section at depth y
  //   full    the section when running full, where `at` would miss the roof
  //   outline its right half for the drawing, moved out by o, to height top
  //   draw    how high to draw an open channel of no stated depth
  const SHAPES = {
    circle: {
      closed: () => true,
      height: (s) => s.d,
      width: (s) => s.d,
      at: (s, y) => segment(s.d, y),
      outline: (s, o) => arcPts(0, s.d / 2, s.d / 2 + o, -PI / 2, PI / 2, 48),
    },
    egg: {
      closed: () => true,
      height: (s) => 1.5 * s.w,
      width: (s) => s.w,
      at: (s, y) => fromPoints(eggPts(s.w, 0, 480), y),
      outline: (s, o) => eggPts(s.w, o),
    },
    rect: {
      closed: (s) => Boolean(s.c),
      height: (s) => s.h || 0,
      width: (s) => s.b,
      at: (s, y) => ({ A: s.b * y, P: s.b + 2 * y, T: s.b }),
      full: (s) => ({ A: s.b * s.h, P: 2 * (s.b + s.h), T: 0 }),
      outline: (s, o, top) => (s.c
        ? [[0, -o], [s.b / 2 + o, -o], [s.b / 2 + o, s.h + o], [0, s.h + o]]
        : [[0, -o], [s.b / 2 + o, -o], [s.b / 2 + o, top]]),
      draw: (s, y) => max(1.3 * y, 0.5 * s.b),
    },
    trap: {
      closed: () => false,
      height: (s) => s.h || 0,
      width: () => 0,
      at: (s, y) => ({ A: (s.b + s.z * y) * y, P: s.b + 2 * y * sqrt(1 + s.z * s.z), T: s.b + 2 * s.z * y }),
      outline: (s, o, top) => { const k = slopeOff(s.z, o); return [[0, -o], [s.b / 2 - s.z * o + k, -o], [s.b / 2 + s.z * top + k, top]]; },
      draw: (s, y) => max(1.3 * y, 0.4 * s.b),
    },
    u: {
      closed: () => false,
      height: (s) => s.h || 0,
      width: (s) => s.w,
      at: (s, y) => {
        const r = s.w / 2;
        return y <= r ? segment(s.w, y) : { A: (PI * r * r) / 2 + s.w * (y - r), P: PI * r + 2 * (y - r), T: s.w };
      },
      outline: (s, o, top) => [...arcPts(0, s.w / 2, s.w / 2 + o, -PI / 2, 0, 24), [s.w / 2 + o, max(top, s.w / 2)]],
      draw: (s, y) => max(1.3 * y, 0.8 * s.w),
    },
    v: {
      closed: () => false,
      height: (s) => s.h || 0,
      width: () => 0,
      at: (s, y) => ({ A: s.z * y * y, P: 2 * y * sqrt(1 + s.z * s.z), T: 2 * s.z * y }),
      outline: (s, o, top) => { const k = slopeOff(s.z, o); return [[0, -k / s.z], [s.z * top + k, top]]; },
      draw: (s, y) => max(1.3 * y, 0.1),
    },
  };
  const fullOf = (S, s) => (S.full ? S.full(s) : { ...S.at(s, S.height(s)), T: 0 });

  // The answer at depth y (m) and mean velocity v (m/s): the section, the
  // flow (m³/s), the hydraulic radius, the Froude number where there is a
  // free surface, and how full a pipe or channel of known height is.
  function solve(shape, s, y, v) {
    const S = SHAPES[shape], H = S.height(s), closed = S.closed(s);
    const full = closed && y >= H;
    const sec = full ? fullOf(S, s) : S.at(s, y);
    const Af = closed ? fullOf(S, s).A : 0;
    return {
      ...sec,
      Q: sec.A * v,
      R: sec.P > 0 ? sec.A / sec.P : 0,
      Fr: !full && sec.T > 0 && sec.A > 0 ? abs(v) / sqrt((G * sec.A) / sec.T) : null,
      full, closed, H,
      depthShare: H > 0 ? y / H : null,
      areaShare: Af > 0 ? sec.A / Af : null,
      over: !closed && H > 0 && y > H,
    };
  }

  // The drawing: a cross-section on a 520 × 340 plate, the pipe or channel
  // wall cut and hatched, air above the water, and dimension lines for the
  // size and the depth. y is the depth drawn (it moves when the depth is
  // changed); `label` is the depth written beside it.
  const VB = { w: 520, h: 340 }, BOX = { l: 104, r: 392, t: 54, b: 282 }, WALL = 9;
  const mm = (m) => new Intl.NumberFormat("en-AU", { maximumFractionDigits: 1 }).format(m * 1000);
  const slopeText = (z) => new Intl.NumberFormat("en-AU", { maximumFractionDigits: 2 }).format(z);
  // The half width of an outline at height h, read off its points.
  const halfAt = (pts, h) => {
    if (h <= pts[0][1]) return pts[0][0];
    for (let i = 1; i < pts.length; i++) {
      const [x0, h0] = pts[i - 1], [x1, h1] = pts[i];
      if (h1 >= h && h1 > h0) return x0 + ((x1 - x0) * (h - h0)) / (h1 - h0);
    }
    return pts[pts.length - 1][0];
  };
  const extent = (pts) => pts.reduce(([xw, lo, hi], [x, h]) => [max(xw, x), min(lo, h), max(hi, h)], [0, Infinity, -Infinity]);
  const text = (x, y, lines, a = "start") => `<text x="${f1(x)}" y="${f1(y)}"${a === "start" ? "" : ` text-anchor="${a}"`} class="dg-h"><tspan class="dg-b">${lines[0]}</tspan>${lines[1] ? `<tspan class="dg-m" x="${f1(x)}" dy="1.3em">${lines[1]}</tspan>` : ""}</text>`;
  const tick = (x, y) => `M${f1(x - 4)} ${f1(y + 4)}l8-8`;

  function draw(shape, s, y, words, label = y) {
    const S = SHAPES[shape], closed = S.closed(s), H = S.height(s);
    const top = closed ? H : H || S.draw(s, y);
    const yy = max(0, min(y, top));
    // fit the inside to the plate, give the wall its thickness, then fit
    // the outside
    let [xw, lo, hi] = extent(S.outline(s, 0, top));
    const sc0 = min((BOX.r - BOX.l - 2 * WALL) / (2 * xw), (BOX.b - BOX.t - 2 * WALL) / (hi - lo));
    const o = WALL / sc0, outR = S.outline(s, o, top);
    [xw, lo, hi] = extent(outR);
    const sc = min((BOX.r - BOX.l) / (2 * xw), (BOX.b - BOX.t) / (hi - lo));
    const cx = (BOX.l + BOX.r) / 2, inv = BOX.t + (BOX.b - BOX.t - (hi - lo) * sc) / 2 + hi * sc;
    const X = (x) => f1(cx + x * sc), Y = (h) => f1(inv - h * sc);
    const both = (pts) => [...pts.slice(1).reverse().map(([x, h]) => [-x, h]), ...pts];
    const line = (pts) => pts.map(([x, h], i) => `${i ? "L" : "M"}${X(x)} ${Y(h)}`).join("");
    const inR = S.outline(s, 0, top), inner = both(inR), outer = both(outR);
    const wall = closed ? `${line(outer)}Z${line(inner)}Z` : `${line([...outer, ...inner.slice().reverse()])}Z`;
    const full = closed && y >= H;
    const surf = Y(full ? top : yy);
    const T = full ? 0 : S.at(s, yy).T;
    const parts = [];
    parts.push(`<defs><clipPath id="fc-clip"><path d="${line(inner)}Z"/></clipPath><linearGradient id="fc-wg" gradientUnits="userSpaceOnUse" x1="0" y1="${surf}" x2="0" y2="${Y(0)}"><stop offset="0" class="ef-w0"/><stop offset=".18" class="ef-w1"/><stop offset="1" class="ef-w2"/></linearGradient></defs>`);
    parts.push(`<path d="${line(inner)}Z" fill="url(#fc-air)"/>`);
    if (yy > 0 || full) parts.push(`<rect clip-path="url(#fc-clip)" x="0" y="${surf}" width="${VB.w}" height="${f1(Y(0) - surf + WALL)}" fill="url(#fc-wg)"/>`);
    if (T > 0 && yy > 0) parts.push(`<path class="ef-surf-g" d="M${X(-T / 2)} ${surf}H${X(T / 2)}"/><path class="ef-surf" d="M${X(-T / 2)} ${surf}H${X(T / 2)}"/>`);
    parts.push(`<path d="${wall}" fill="url(#fc-cut)" fill-rule="evenodd"/><path class="ef-edge" d="${wall}"/>`);
    // the depth, on the right
    const xr = cx + xw * sc + 22;
    const ext = (h, from) => `M${f1(cx + from * sc + 4)} ${Y(h)}H${f1(xr + 5)}`;
    const depthTo = full ? H : yy;
    if (depthTo * sc > 1.5) {
      parts.push(`<path class="fc-ext" d="${ext(0, halfAt(outR, 0))}${ext(depthTo, halfAt(outR, depthTo))}"/><path class="fc-dim" d="M${f1(xr)} ${Y(0)}V${Y(depthTo)}${tick(xr, Y(0))}${tick(xr, +Y(depthTo))}"/>`);
    }
    const mid = (+Y(0) + +Y(depthTo)) / 2;
    parts.push(text(xr + 10, max(BOX.t, mid - 4), full ? [words.full, words.surcharged] : [`${mm(label)} mm`, words.depth]));
    // the size: across the top, or the bottom width of a trapezoid
    const W = S.width(s, top);
    if (W > 0) {
      const yt = +Y(hi) - 16;
      const from = (x) => { let h = lo; for (const [px, ph] of outR) if (px >= x - 1e-9) h = ph; return h; };
      const hx = from(W / 2);
      parts.push(`<path class="fc-ext" d="M${X(-W / 2)} ${f1(+Y(hx) - 3)}V${f1(yt - 5)}M${X(W / 2)} ${f1(+Y(hx) - 3)}V${f1(yt - 5)}"/><path class="fc-dim" d="M${X(-W / 2)} ${f1(yt)}H${X(W / 2)}${tick(+X(-W / 2), yt)}${tick(+X(W / 2), yt)}"/>`);
      parts.push(text(cx, yt - 7, [`${shape === "circle" ? "Ø " : ""}${mm(W)} mm`], "middle"));
    }
    if (shape === "trap") {
      const yb = +Y(lo) + 16;
      parts.push(`<path class="fc-ext" d="M${X(-s.b / 2)} ${f1(+Y(lo) + 3)}V${f1(yb + 5)}M${X(s.b / 2)} ${f1(+Y(lo) + 3)}V${f1(yb + 5)}"/><path class="fc-dim" d="M${X(-s.b / 2)} ${f1(yb)}H${X(s.b / 2)}${tick(+X(-s.b / 2), yb)}${tick(+X(s.b / 2), yb)}"/>`);
      parts.push(text(cx, yb + 16, [`${mm(s.b)} mm`], "middle"));
    }
    // the height of a pipe or culvert, on the left
    if (closed) {
      const xl = cx - xw * sc - 22;
      const extL = (h) => `M${f1(cx - halfAt(outR, h) * sc - 4)} ${Y(h)}H${f1(xl - 5)}`;
      if (shape !== "circle") {
        parts.push(`<path class="fc-ext" d="${extL(0)}${extL(H)}"/><path class="fc-dim" d="M${f1(xl)} ${Y(0)}V${Y(H)}${tick(xl, +Y(0))}${tick(xl, +Y(H))}"/>`);
        parts.push(text(xl - 9, (+Y(0) + +Y(H)) / 2 - 4, [`${mm(H)} mm`, words.high], "end"));
      }
    }
    // the side slope of a trapezoid or V, on the left
    if (shape === "trap" || shape === "v") {
      // clear of the sloping wall all the way up the label
      const hm = top * 0.5, hTop = min(top, hm + 18 / sc);
      parts.push(text(cx - halfAt(outR, hTop) * sc - 10, +Y(hm), [`${slopeText(s.z)} : 1`, words.slope], "end"));
    }
    return parts.join("");
  }

  const api = { SHAPES, solve, draw, VB };
  if (typeof window !== "undefined") window.EDSFlowCalc = api;
  if (typeof document === "undefined") return;

  /* ---- the page ---- */
  const root = document.querySelector("[data-flowcalc]");
  if (!root) return;
  const words = JSON.parse(root.dataset.flowcalc);
  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];
  const shapes = $$('input[name="fc-shape"]');
  const groups = Object.fromEntries($$("[data-fields]").map((g) => [g.dataset.fields, g]));
  const depth = $("#fc-depth"), vel = $("#fc-vel"), factor = $("#fc-factor");
  const kinds = $$('input[name="fc-kind"]');
  const art = $("[data-fc-draw]"), svgEl = art.closest("svg");
  const out = Object.fromEntries($$("[data-fc]").map((el) => [el.dataset.fc, el]));
  const live = $("[data-fc-live]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const sig = new Intl.NumberFormat("en-AU", { minimumSignificantDigits: 3, maximumSignificantDigits: 3 });
  const num3 = (n) => (n === 0 ? "0" : sig.format(n));
  const pct = (n) => `${new Intl.NumberFormat("en-AU", { maximumFractionDigits: n < 0.1 ? 1 : 0 }).format(n * 100)}%`;
  const touched = new WeakSet();

  const shapeNow = () => shapes.find((i) => i.checked)?.value || "circle";
  const surface = () => kinds.find((i) => i.checked)?.value === "surface";
  const value = (el) => (el.value.trim() === "" ? null : Number(el.value));

  // What is wrong with a field, if anything. The rule is on the input:
  // size (above zero), optional (above zero or blank), slope (zero or more;
  // above zero for a V), depth (zero or more), velocity (any number),
  // factor (above zero, up to 1.5).
  function fault(el) {
    const rule = el.dataset.rule, v = value(el), e = words.errors;
    if (el.validity.badInput) return e.number;
    if (v == null) return rule === "optional" ? "" : e[`empty_${el.dataset.k}`] || e.empty;
    if (!Number.isFinite(v)) return e.number;
    if (rule === "size" || rule === "optional") return v > 0 ? "" : e.size;
    if (rule === "slope") return v > 0 || (v === 0 && el.dataset.zero) ? "" : el.dataset.zero ? e.slopeZero : e.slope;
    if (rule === "depth") return v >= 0 ? "" : e.depth;
    if (rule === "factor") return v > 0 && v <= 1.5 ? "" : e.factor;
    return "";
  }
  function mark(el, msg) {
    const err = document.getElementById(`${el.id}-err`);
    // a blank field is only called out once it has been left
    const show = msg && (touched.has(el) || value(el) != null || el.validity.badInput);
    el.setAttribute("aria-invalid", show ? "true" : "false");
    if (err) { err.hidden = !show; err.textContent = show ? msg : ""; }
    return !msg;
  }

  function read() {
    const shape = shapeNow(), g = groups[shape], s = {};
    let ok = true;
    for (const el of g.querySelectorAll("input[data-k]")) {
      if (el.type === "checkbox") { s[el.dataset.k] = el.checked; continue; }
      const v = value(el);
      ok = mark(el, fault(el)) && ok;
      s[el.dataset.k] = v == null ? 0 : el.dataset.unit === "mm" ? v / 1000 : v;
    }
    let y = value(depth), v = value(vel), k = 1;
    ok = mark(depth, fault(depth)) && ok;
    ok = mark(vel, fault(vel)) && ok;
    if (surface()) { ok = mark(factor, fault(factor)) && ok; k = value(factor); }
    y = (y ?? 0) / 1000;
    // the checks between fields
    const hEl = g.querySelector('[data-k="h"]');
    if (hEl && ok) {
      if (shape === "rect" && s.c && !s.h) ok = mark(hEl, words.errors.culvert);
      else if (shape === "u" && s.h && s.h < s.w / 2) ok = mark(hEl, words.errors.uHeight);
      else if (!(shape === "rect" && s.c) && s.h && y > s.h) ok = mark(depth, words.errors.over);
    }
    return { ok, s, y, v: (v ?? 0) * (k ?? 1) };
  }

  // The drawing follows a new depth over a quarter of a second (a tenth
  // with reduced motion); a new shape or size is drawn at once.
  let shownY = null, drawnKey = "", anim = 0;
  const paint = (shape, s, y) => {
    const key = shape + JSON.stringify(s);
    cancelAnimationFrame(anim);
    const frame = (yy) => { shownY = yy; art.innerHTML = draw(shape, s, yy, words, y); };
    if (key !== drawnKey || shownY == null || document.hidden || abs(shownY - y) < 1e-6) { drawnKey = key; frame(y); return; }
    const from = shownY, t0 = performance.now(), dur = reduce.matches ? 110 : 260;
    const step = (now) => {
      const t = min(1, (now - t0) / dur), e = 1 - (1 - t) ** 3;
      frame(from + (y - from) * e);
      if (t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };

  let liveTimer = 0, urlTimer = 0, changed = false;
  function update() {
    const shape = shapeNow();
    for (const [id, g] of Object.entries(groups)) g.hidden = id !== shape;
    const surf = surface();
    $("[data-fc-factor]").hidden = !surf;
    $("[data-fc-vel-label]").textContent = surf ? words.surfaceVelocity : words.meanVelocity;
    $("[data-fc-kind-hint]").textContent = surf ? words.surfaceHint : words.meanHint;
    const { ok, s, y, v } = read();
    root.classList.toggle("is-off", !ok);
    if (!ok) {
      for (const el of Object.values(out)) if (el.dataset.fc !== "note") el.textContent = "—";
      $("[data-fc-state]").hidden = true;
      return;
    }
    const r = solve(shape, s, y, v);
    const q = r.Q * 1000;
    out.q.textContent = num3(q);
    out.m3s.textContent = num3(r.Q);
    out.m3h.textContent = num3(r.Q * 3600);
    out.mld.textContent = num3(r.Q * 86.4);
    // a row's figure with its unit (data-unit), or its words
    const put = (key, n) => { const el = out[key]; el.textContent = typeof n === "number" ? `${num3(n)}${el.dataset.unit ? ` ${el.dataset.unit}` : ""}` : n; };
    put("A", r.A);
    put("P", r.P);
    put("R", r.R);
    put("T", r.full ? "—" : r.T);
    out.depthShare.textContent = r.full ? `${words.full}, ${words.surcharged}` : r.depthShare == null ? "—" : words.ofHeight.replace("{n}", pct(r.depthShare));
    out.depthShare.closest("div").hidden = r.depthShare == null;
    out.areaShare.textContent = r.areaShare == null ? "—" : words.ofFull.replace("{n}", pct(r.areaShare));
    out.areaShare.closest("div").hidden = r.areaShare == null;
    put("vMean", v);
    out.vMean.closest("div").hidden = !surf;
    out.Fr.textContent = r.Fr == null ? "—" : `${r.Fr.toFixed(2)}, ${r.Fr < 0.95 ? words.sub : r.Fr <= 1.05 ? words.near : words.super}`;
    const notes = [r.full && words.fullNote, v < 0 && words.reverseNote].filter(Boolean);
    const state = $("[data-fc-state]");
    state.hidden = !notes.length;
    state.querySelector("span").textContent = notes.join(" ");
    paint(shape, s, y);
    svgEl.setAttribute("aria-label", (r.full ? words.altFull : words.alt).replace("{shape}", words.shapes[shape]).replace("{depth}", `${mm(y)} mm`));
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { live.textContent = words.live.replace("{q}", num3(q)); }, 900);
    if (changed) { clearTimeout(urlTimer); urlTimer = setTimeout(() => history.replaceState(history.state, "", `${location.pathname}?${params()}${location.hash}`), 300); }
  }

  // The figures in the address: the shape, its size, the depth and the
  // velocity, and the factor when the velocity is read at the surface.
  function params() {
    const p = new URLSearchParams(), shape = shapeNow();
    p.set("shape", shape);
    for (const el of groups[shape].querySelectorAll("input[data-k]")) {
      if (el.type === "checkbox") { if (el.checked) p.set(el.dataset.k, "1"); } else if (el.value.trim()) p.set(el.dataset.k, el.value.trim());
    }
    p.set("depth", depth.value.trim());
    p.set("v", vel.value.trim());
    if (surface()) p.set("surface", factor.value.trim());
    return p;
  }
  function restore() {
    const p = new URLSearchParams(location.search);
    const shape = p.get("shape");
    if (!groups[shape]) return;
    for (const i of shapes) i.checked = i.value === shape;
    for (const el of groups[shape].querySelectorAll("input[data-k]")) {
      if (el.type === "checkbox") el.checked = p.get(el.dataset.k) === "1";
      else if (p.has(el.dataset.k)) el.value = p.get(el.dataset.k);
    }
    if (p.has("depth")) depth.value = p.get("depth");
    if (p.has("v")) vel.value = p.get("v");
    for (const i of kinds) i.checked = i.value === (p.has("surface") ? "surface" : "mean");
    if (p.has("surface")) factor.value = p.get("surface");
  }

  root.addEventListener("input", () => { changed = true; update(); });
  root.addEventListener("change", (e) => { if (e.target.matches("input[type=number]")) touched.add(e.target); changed = true; update(); });
  root.addEventListener("focusout", (e) => { if (e.target.matches("input[type=number]")) { touched.add(e.target); update(); } });
  $("[data-fc-reset]").addEventListener("click", () => {
    for (const el of $$("input")) {
      if (el.type === "radio" || el.type === "checkbox") el.checked = el.defaultChecked;
      else el.value = el.defaultValue;
    }
    changed = false;
    history.replaceState(history.state, "", `${location.pathname}${location.hash}`);
    update();
  });
  const copyBtn = $("[data-fc-copy]"), copyLabel = copyBtn.querySelector("span");
  let copyTimer = 0;
  copyBtn.addEventListener("click", async () => {
    const url = `${location.origin}${location.pathname}?${params()}`;
    let done = false;
    try { await navigator.clipboard.writeText(url); done = true; } catch {}
    clearTimeout(copyTimer);
    copyLabel.textContent = done ? words.copied : words.copyFailed;
    copyTimer = setTimeout(() => { copyLabel.textContent = words.copy; }, 2400);
  });

  restore();
  // the page was drawn at the first example; the script takes over from it
  shownY = null;
  update();
})();
