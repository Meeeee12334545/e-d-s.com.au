/* Sensor Fort: water moving through the mount (products/sensor-fort.html).

   The figure is the brochure's section on the centre line. build.mjs
   (sfStage) stacks it as the pipe and the render, this canvas, then the
   outline, dimensions and badges, and hands the canvas the brochure's own
   geometry in drawing units: the calculated water surface (`surf`) and the
   floor the water runs over (`bed`: the thin skin, the ramp of the valley up
   to the spill lip, the stern). Everything here is drawn between those two.

   What moves is an illustration of that flow, not a simulation of it:
   - the surface ripples, most where the water spills over the lip;
   - lines of flow run from the floor to the surface, each streak moving at a
     speed that goes with one over the depth (the same flow through less
     water), so they crawl in the pool, race over the lip and stay fast
     across the sensor tips, with a tail as long as they are fast;
   - foam forms where the sheet leaves the lip and is carried off;
   - strands of rag ride over the mount and grit rolls up the ramp and over,
     and neither stops.

   The canvas is drawn at the screen's own pixel density, runs only while it
   is in view, and keeps moving (a little slower) under reduced motion. */
(() => {
  const stage = document.querySelector(".sf-stage[data-flow]");
  const canvas = stage && stage.querySelector("canvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const D = JSON.parse(stage.dataset.flow);
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.6 : 1;

  /* ---- geometry ---- */
  // y on a line through [x, y] points, x ascending (a step where two share an x)
  const along = (pts) => (x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return x1 - x0 < 0.01 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); }
    }
    return pts[pts.length - 1][1];
  };
  const still = along(D.surf), bed = along(D.bed);
  const INV = D.bed[0][1], DEEP = INV - D.surf[0][1];
  // the spill lip: the highest point of the floor
  const LIP = D.bed.reduce((a, b) => (b[1] < a[1] ? b : a));
  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  // the floor the flow follows: the bed as far as the lip, then the sheet
  // falling away from it to the invert
  const FALL = 150;
  const floor = (x) => (x <= LIP[0] ? bed(x) : LIP[1] + (INV - LIP[1]) * smooth((x - LIP[0]) / FALL));
  // how much faster the water runs than in the pool upstream
  const pace = (x) => Math.min(4.6, Math.max(1, DEEP / Math.max(18, floor(x) - still(x))));
  // ripples: three trains of small waves moving downstream, largest where the
  // water spills and settles again
  const swell = (x) => 0.75 + 2.3 * Math.exp(-(((x - LIP[0] - 86) / 84) ** 2)) + 0.55 * smooth((x - LIP[0]) / 60);
  let now = 0;
  const ripple = (x, lag = 0) => {
    const t = now - lag;
    return calm * swell(x) * (0.55 * Math.sin(0.052 * x - 3.1 * t) + 0.38 * Math.sin(0.097 * x - 5.2 * t + 1.1) + 0.3 * Math.sin(0.023 * x - 1.4 * t + 0.6));
  };
  const top = (x) => still(x) + ripple(x);
  // a point a fraction f of the way from the floor to the surface
  const at = (x, f) => { const b = floor(x); return b + f * (top(x) - b); };

  /* ---- what the water carries ---- */
  let seed = 20261114;
  const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const V0 = 62 * calm; // drawing units a second, in the pool
  const streak = (x) => ({ x, f: 0.05 + 0.9 * rnd(), a: 0.28 + 0.6 * rnd(), w: 0.8 + 1.1 * rnd(), l: 0.7 + 0.7 * rnd() });
  const streaks = Array.from({ length: 150 }, () => streak(-40 + rnd() * (D.w + 80)));
  const grit = Array.from({ length: 22 }, () => ({ x: rnd() * D.w, f: 0.015 + 0.05 * rnd(), r: 0.8 + 0.9 * rnd(), p: rnd() * 6.3 }));
  const rag = [0.06, 0.3, 0.55, 0.82].map((u, i) => ({ x: u * (D.w + 420) - 210, f: [0.74, 0.46, 0.62, 0.8][i], len: 46 + 14 * rnd(), p: rnd() * 6.3 }));
  const foam = [];

  /* ---- drawing ---- */
  let scale = 1;
  const size = () => {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(box.width * dpr));
    if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round((w * D.h) / D.w); }
    scale = canvas.width / D.w;
  };
  // the water: under the rippling surface, over the bed
  const waterPath = () => {
    ctx.beginPath();
    ctx.moveTo(0, top(0));
    for (let x = 4; x <= D.w + 4; x += 4) ctx.lineTo(x, top(x));
    for (let i = D.bed.length - 1; i >= 0; i--) ctx.lineTo(D.bed[i][0], D.bed[i][1]);
    ctx.closePath();
  };
  const tone = (y0, y1, stops) => { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };

  function frame(dt) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, D.w, D.h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.save();
    waterPath();
    ctx.clip();
    // the body of the water, deepening towards the invert
    ctx.fillStyle = tone(D.surf[0][1], INV, [[0, "rgba(120, 205, 194, .30)"], [0.45, "rgba(52, 160, 149, .40)"], [1, "rgba(10, 104, 96, .56)"]]);
    ctx.fillRect(0, 0, D.w, D.h);
    // light let down from the surface: bands that follow its ripples
    [[5, 0.34, 1.5, 0.12], [12, 0.2, 1.2, 0.3], [21, 0.12, 1, 0.5]].forEach(([d, a, w, lag]) => {
      ctx.beginPath();
      for (let x = -4; x <= D.w + 4; x += 6) {
        const y = still(x) + ripple(x, lag) * 1.5 + d * Math.min(1, (floor(x) - still(x)) / 60);
        x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
      ctx.lineWidth = w;
      ctx.stroke();
    });

    // lines of flow: each streak a head with a tail as long as it is fast
    for (const s of streaks) {
      const k = pace(s.x);
      s.x += V0 * k * dt;
      if (s.x > D.w + 40) Object.assign(s, streak(-40 - rnd() * 30));
      const len = (7 + 8.5 * k) * s.l;
      for (let j = 0; j < 5; j++) {
        const xa = s.x - (len * j) / 5, xb = s.x - (len * (j + 1)) / 5;
        ctx.beginPath();
        ctx.moveTo(xa, at(xa, s.f));
        ctx.lineTo(xb, at(xb, s.f));
        ctx.strokeStyle = `rgba(255, 255, 255, ${(s.a * (1 - j / 5) ** 1.6).toFixed(3)})`;
        ctx.lineWidth = s.w * (1 - j * 0.12);
        ctx.stroke();
      }
    }

    // grit rolling along the floor, up the ramp and over the lip
    ctx.fillStyle = "rgba(62, 52, 40, .78)";
    for (const g of grit) {
      g.x += V0 * pace(g.x) * 0.5 * dt;
      if (g.x > D.w + 10) { g.x = -10; g.f = 0.015 + 0.05 * rnd(); }
      const hop = Math.abs(Math.sin(g.p + now * 5.5)) * 1.6;
      ctx.beginPath();
      ctx.arc(g.x, at(g.x, g.f) - g.r - hop, g.r, 0, 6.3);
      ctx.fill();
    }

    // rag: two strands that trail from a leading end and ripple as they go
    for (const r of rag) {
      r.x += V0 * pace(r.x) * 0.9 * dt;
      if (r.x - r.len > D.w + 20) { r.x = -40 - rnd() * 260; r.f = 0.4 + 0.42 * rnd(); }
      for (const [off, w, col] of [[0, 3.4, "#6b563c"], [5.5, 2.6, "#8a7252"]]) {
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) {
          const x = r.x - (r.len * i) / 12 - off * 1.4;
          const y = at(x, r.f) + off + Math.sin(r.p + i * 0.85 - now * 6) * (1 + i * 0.22);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.stroke();
      }
    }

    // foam where the sheet leaves the lip, mixed down and carried off
    for (let n = 0; n < 2; n++) {
      if (foam.length < 90 && rnd() < 46 * dt) foam.push({ x: LIP[0] - 10 + rnd() * 46, d: rnd() * 5, sink: 3 + rnd() * 16, r: 0.7 + rnd() * 1.7, age: 0, life: 0.7 + rnd() * 1.1 });
    }
    for (let i = foam.length - 1; i >= 0; i--) {
      const b = foam[i];
      b.age += dt;
      if (b.age > b.life) { foam.splice(i, 1); continue; }
      b.x += V0 * pace(b.x) * 0.95 * dt;
      const u = b.age / b.life;
      ctx.beginPath();
      ctx.arc(b.x, top(b.x) + b.d + b.sink * u, b.r * (1 - 0.4 * u), 0, 6.3);
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.85 * (1 - u) ** 1.3).toFixed(3)})`;
      ctx.fill();
    }
    ctx.restore();

    // the surface: a soft sheen under it, the line itself, and glints that
    // run along it with the ripples
    ctx.beginPath();
    for (let x = 0; x <= D.w + 4; x += 4) x ? ctx.lineTo(x, top(x) + 2.2) : ctx.moveTo(x, top(x) + 2.2);
    ctx.strokeStyle = "rgba(255, 255, 255, .34)";
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.beginPath();
    for (let x = 0; x <= D.w + 4; x += 4) x ? ctx.lineTo(x, top(x)) : ctx.moveTo(x, top(x));
    ctx.strokeStyle = "#2a8f85";
    ctx.lineWidth = 2.3;
    ctx.stroke();
    for (let x = 0; x < D.w; x += 5) {
      const glint = Math.max(0, Math.sin(0.052 * x - 3.1 * now + 0.9)) ** 3;
      if (glint < 0.05) continue;
      ctx.beginPath();
      ctx.moveTo(x, top(x) - 0.2);
      ctx.lineTo(x + 5, top(x + 5) - 0.2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.95 * glint).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  /* ---- running: while in view, at the screen's own density ---- */
  let seen = false, raf = 0, last = 0;
  const tick = (ms) => {
    raf = 0;
    const dt = Math.min(0.05, last ? (ms - last) / 1000 : 0.016);
    last = ms;
    now += dt;
    frame(dt);
    if (seen) raf = requestAnimationFrame(tick);
  };
  const run = () => { if (seen && !raf) { last = 0; raf = requestAnimationFrame(tick); } };
  size();
  // a settled first picture, so the water is already through the mount
  for (let i = 0; i < 40; i++) { now += 0.05; frame(0.05); }
  stage.classList.add("is-flowing");
  // on a phone the figure is wider than its plate and scrolls sideways:
  // start it on the spill lip and the sensor tips, where the story is
  const plate = stage.parentElement;
  if (plate && plate.scrollWidth > plate.clientWidth + 4) plate.scrollLeft = (LIP[0] / D.w) * plate.scrollWidth - plate.clientWidth * 0.6;
  new IntersectionObserver(([en]) => { seen = en.isIntersecting; run(); }, { rootMargin: "60px 0px" }).observe(stage);
  if ("ResizeObserver" in window) new ResizeObserver(() => { size(); if (!raf) frame(0); }).observe(canvas);
  stage.sfFlow = { get time() { return now; }, streaks, foam };
})();
