// The flow lab: an illustrative sewer hydrograph. Dry weather flow follows a
// daily pattern; a storm adds a fast inflow peak and a slow infiltration tail,
// scaled by how leaky the network is. Flow = wetted area x velocity, as an
// area-velocity meter measures it. This is a teaching model, not live data.
(() => {
  const canvas = document.getElementById("lab-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);

  const WINDOW = 30 * 60; // minutes shown
  const STEP = 5; // minutes per stored sample
  const Q_MAX = 360, RAIN_MAX = 60, D = 0.6; // L/s, mm/h, pipe diameter m
  const TAU_FAST = 50, TAU_SLOW = 600, K_FAST = 6, K_SLOW = 2.2;

  let t = 6 * 60, fast = 0, slow = 0, storms = [], hist = [], lastStorm = -1e9;
  const leak = () => parseFloat($("lab-leak").value);
  const size = () => parseFloat($("lab-size").value);

  const dwf = (min) => {
    const h = (min / 60) % 24;
    const bump = (c, w) => Math.exp(-(((h - c + 36) % 24 - 12) ** 2) / (2 * w * w));
    return 26 + 20 * bump(7.5, 1.6) + 15 * bump(19, 2.1) + 6 * bump(13, 2.5);
  };
  const rainAt = (min) => {
    let i = 0;
    for (const s of storms) {
      const u = (min - s.start) / s.dur;
      if (u > 0 && u < 1) i += (s.depth / (s.dur / 60)) * 2 * Math.sin(Math.PI * u) ** 2;
    }
    return i;
  };
  const advance = (minutes) => {
    for (let k = 0; k < minutes; k++) {
      const i = rainAt(t);
      fast += ((K_FAST * i - fast) / TAU_FAST);
      slow += ((K_SLOW * i - slow) / TAU_SLOW);
      t += 1;
      if (t % STEP === 0) {
        const base = dwf(t);
        const q = base + leak() * (fast + slow) + Math.sin(t * 0.21) * 0.8 + Math.sin(t * 0.057) * 1.1;
        hist.push({ t, q: Math.max(0, q), base, rain: i });
        if (hist.length > WINDOW / STEP + 2) hist.shift();
      }
    }
    storms = storms.filter((s) => s.start + s.dur > t - WINDOW);
  };
  const storm = (delay = 20) => { storms.push({ start: t + delay, dur: 120, depth: size() }); lastStorm = t; };

  // hydraulics of a part-full circular pipe
  const depthRatio = (q) => Math.min(0.97, 0.14 + 0.8 * Math.pow(Math.min(q, Q_MAX) / 320, 0.62));
  const area = (hr) => { const th = 2 * Math.acos(1 - 2 * hr); return (D * D / 8) * (th - Math.sin(th)); };
  const qAt = (hr) => 320 * Math.pow((hr - 0.14) / 0.8, 1 / 0.62);
  const Q_HIGH = qAt(0.6), Q_HH = qAt(0.85);

  /* ---- drawing ---- */
  let w = 0, h = 0;
  const resize = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };
  function draw() {
    if (!w) return;
    const L = 44, R = 14, T = 12, B = 26, pw = w - L - R, ph = h - T - B;
    const X = (min) => L + ((min - (t - WINDOW)) / WINDOW) * pw;
    const Y = (q) => T + ph - (Math.min(q, Q_MAX) / Q_MAX) * ph;
    ctx.clearRect(0, 0, w, h);
    ctx.font = "500 11px Inter, sans-serif";
    ctx.textBaseline = "middle";

    // grid + axes
    ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1;
    ctx.textAlign = "right";
    for (let q = 0; q <= Q_MAX; q += 100) {
      ctx.beginPath(); ctx.moveTo(L, Y(q)); ctx.lineTo(w - R, Y(q)); ctx.stroke();
      ctx.fillText(q, L - 8, Y(q));
    }
    ctx.textAlign = "center";
    const first = Math.ceil((t - WINDOW) / 360) * 360;
    for (let m = first; m <= t; m += 360) {
      const x = X(m);
      ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, T + ph); ctx.stroke();
      const hh = Math.floor((m / 60) % 24);
      if (x > L + 16 && x < w - R - 16) ctx.fillText(`${String(hh).padStart(2, "0")}:00`, x, h - 10);
    }
    ctx.save(); ctx.translate(11, T + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("Flow, L/s", 0, 0); ctx.restore();

    // alarm thresholds
    ctx.setLineDash([4, 5]); ctx.textAlign = "left";
    [[Q_HIGH, "245,158,11", "High"], [Q_HH, "239,68,68", "High-high"]].forEach(([q, c, label]) => {
      ctx.strokeStyle = `rgba(${c},.55)`; ctx.fillStyle = `rgba(${c},.9)`;
      ctx.beginPath(); ctx.moveTo(L, Y(q)); ctx.lineTo(w - R, Y(q)); ctx.stroke();
      ctx.fillText(label, L + 6, Y(q) - 8);
    });
    ctx.setLineDash([]);
    if (!hist.length) return;

    // rainfall, hanging from the top
    ctx.fillStyle = "rgba(56,189,248,.75)";
    const bw = Math.max(1.5, pw / (WINDOW / STEP) - 0.6);
    for (const p of hist) if (p.rain > 0.2) ctx.fillRect(X(p.t) - bw / 2, T, bw, Math.min(1, p.rain / RAIN_MAX) * ph * 0.3);

    // measured flow
    const g = ctx.createLinearGradient(0, T, 0, T + ph);
    g.addColorStop(0, "rgba(114,202,187,.42)"); g.addColorStop(1, "rgba(114,202,187,0)");
    ctx.beginPath();
    hist.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.q)) : ctx.moveTo(X(p.t), Y(p.q))));
    ctx.lineTo(X(hist[hist.length - 1].t), T + ph); ctx.lineTo(X(hist[0].t), T + ph); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath();
    hist.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.q)) : ctx.moveTo(X(p.t), Y(p.q))));
    ctx.strokeStyle = "#72cabb"; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.stroke();

    // expected dry weather flow
    ctx.beginPath(); ctx.setLineDash([4, 4]);
    hist.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.base)) : ctx.moveTo(X(p.t), Y(p.base))));
    ctx.strokeStyle = "rgba(255,255,255,.65)"; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);

    // now
    const last = hist[hist.length - 1];
    ctx.fillStyle = "#72cabb"; ctx.beginPath(); ctx.arc(X(last.t), Y(last.q), 4, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(114,202,187,.35)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(X(last.t), Y(last.q), 7, 0, 7); ctx.stroke();
  }

  /* ---- readouts + pipe section ---- */
  const water = $("lab-water"), surface = $("lab-surface"), arrows = $("lab-arrows");
  const state = $("lab-state");
  let lastLevel = -1;
  function readouts() {
    const last = hist[hist.length - 1];
    if (!last) return;
    const hr = depthRatio(last.q), v = last.q / 1000 / area(hr);
    $("lab-q").textContent = last.q.toFixed(1);
    $("lab-d").textContent = Math.round(hr * D * 1000);
    $("lab-v").textContent = v.toFixed(2);
    const y = 180 - hr * 160; // pipe drawn from y=20 to y=180
    water.setAttribute("y", y.toFixed(1)); water.setAttribute("height", (180 - y).toFixed(1));
    surface.setAttribute("y1", y.toFixed(1)); surface.setAttribute("y2", y.toFixed(1));
    arrows.style.setProperty("--dur", `${Math.max(0.45, 1.9 - v * 1.2).toFixed(2)}s`);
    arrows.setAttribute("transform", `translate(0 ${(y + (180 - y) / 2 - 100).toFixed(1)})`);
    const level = hr >= 0.85 ? 2 : hr >= 0.6 ? 1 : 0;
    if (level !== lastLevel) {
      lastLevel = level;
      state.dataset.level = level;
      state.querySelector("b").textContent = ["Normal", "High level alarm", "High-high level alarm"][level];
      state.querySelector("small").textContent = ["Flow is tracking the dry weather pattern.", "Depth has passed 60% of the pipe.", "Depth has passed 85% of the pipe. Overflow risk."][level];
    }
    const extra = hist.reduce((s, p) => s + Math.max(0, p.q - p.base) * STEP * 60, 0) / 1000;
    $("lab-extra").textContent = Math.round(extra).toLocaleString("en-AU");
  }

  /* ---- loop ---- */
  let raf = 0, visible = false, prev = 0, acc = 0;
  const frame = (now) => {
    const dt = Math.min(64, now - prev); prev = now;
    acc += (dt / 1000) * 100; // 100 simulated minutes a second
    const whole = Math.floor(acc);
    if (whole) { acc -= whole; advance(whole); }
    if (t - lastStorm > 34 * 60) storm(120); // keep the chart alive when nobody is driving
    draw(); readouts();
    raf = requestAnimationFrame(frame);
  };
  const sync = () => {
    cancelAnimationFrame(raf); raf = 0;
    if (visible && !document.hidden) { prev = performance.now(); raf = requestAnimationFrame(frame); }
  };

  // start with a day of history that already contains a storm
  storms.push({ start: t + 9 * 60, dur: 120, depth: 22 });
  lastStorm = t + 9 * 60;
  advance(WINDOW);

  $("lab-storm").addEventListener("click", () => storm(20));
  ["lab-leak", "lab-size"].forEach((id) => {
    const input = $(id), out = $(`${id}-out`);
    const label = () => {
      const v = parseFloat(input.value);
      out.textContent = id === "lab-size" ? `${v} mm` : v < 0.5 ? "Tight" : v < 1.1 ? "Typical" : "Leaky";
    };
    input.addEventListener("input", label); label();
  });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }).observe(canvas);
  document.addEventListener("visibilitychange", sync);
  resize(); readouts();
})();
