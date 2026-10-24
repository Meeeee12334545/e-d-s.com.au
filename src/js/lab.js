// The flow lab: an illustrative sewer hydrograph. Dry weather flow follows a
// daily pattern; a storm adds a fast inflow peak and a slow infiltration tail,
// scaled by how leaky the network is. Flow = wetted area x velocity, as an
// area-velocity meter measures it. This is a teaching model, not live data.
//
// Around the model: a cursor for reading values off the chart (pointer, touch
// or arrow keys), a pause control, a simulated clock, a rain chip while a storm
// is falling, and the inflow and infiltration shaded between the two lines.
(() => {
  const canvas = document.getElementById("lab-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const lab = canvas.closest(".lab");

  const WINDOW = 30 * 60; // minutes shown
  const STEP = 5; // minutes per stored sample
  const N = WINDOW / STEP; // samples across the chart
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
        if (hist.length > N + 2) hist.shift();
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

  const pad = (n) => String(n).padStart(2, "0");
  const hhmm = (min) => `${pad(Math.floor((min / 60) % 24))}:${pad(Math.floor(min % 60))}`;
  const day = (min) => Math.floor(min / 1440) + 1;
  const fmt = (v, dp = 0) => v.toLocaleString("en-AU", { minimumFractionDigits: dp, maximumFractionDigits: dp });

  /* ---- the cursor: a point on the chart being read ---- */
  // Kept as a fraction of the plot width so it stays put while the data
  // slides underneath and when the chart is resized.
  let cursor = null, cursorBy = "";
  const tip = $("lab-tip"), tipOut = Object.fromEntries([...tip.querySelectorAll("[data-tip]")].map((el) => [el.dataset.tip, el]));
  const srCursor = $("lab-cursor-sr");
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const sampleAt = (u) => {
    if (!hist.length) return null;
    const i = Math.round((t - WINDOW + u * WINDOW - hist[0].t) / STEP);
    return hist[Math.min(hist.length - 1, Math.max(0, i))];
  };
  const describe = (p) => {
    const extra = Math.max(0, p.q - p.base);
    return `Day ${day(p.t)} · ${hhmm(p.t)}. Flow ${fmt(p.q, 1)} litres a second, dry weather ${fmt(p.base, 1)}, inflow and infiltration ${fmt(extra, 1)}, rain ${fmt(p.rain)} millimetres an hour.`;
  };
  const clearCursor = () => { cursor = null; cursorBy = ""; tip.classList.remove("on"); draw(); };

  /* ---- drawing ---- */
  const L = 48, R = 14, T = 14, B = 26;
  let w = 0, h = 0, hatch = null;
  const resize = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };
  // Diagonal hatching for the inflow and infiltration band, so it reads as a
  // different thing from the rain bars without relying on colour alone.
  const makeHatch = () => {
    const c = document.createElement("canvas"); c.width = c.height = 8;
    const g = c.getContext("2d");
    g.strokeStyle = "rgba(56,189,248,.5)"; g.lineWidth = 1.4; g.lineCap = "square";
    g.beginPath(); g.moveTo(-1, 9); g.lineTo(9, -1); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(7, 9); g.lineTo(9, 7); g.stroke();
    return ctx.createPattern(c, "repeat");
  };
  function draw() {
    if (!w) return;
    const pw = w - L - R, ph = h - T - B;
    const X = (min) => L + ((min - (t - WINDOW)) / WINDOW) * pw;
    const Y = (q) => T + ph - (Math.min(q, Q_MAX) / Q_MAX) * ph;
    ctx.clearRect(0, 0, w, h);
    ctx.font = "500 11px Geist, sans-serif";
    ctx.textBaseline = "middle";

    // grid + axes
    ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.fillStyle = "rgba(255,255,255,.62)"; ctx.lineWidth = 1;
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
      if (x > L + 16 && x < w - R - 16) ctx.fillText(hhmm(m), x, h - 10);
    }
    ctx.save(); ctx.translate(11, T + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("Flow, L/s", 0, 0); ctx.restore();
    ctx.textAlign = "right"; ctx.fillStyle = "rgba(56,189,248,.7)";
    ctx.fillText("Rain, mm/h", w - R - 6, T + 9);

    // alarm thresholds
    ctx.setLineDash([4, 5]); ctx.textAlign = "left";
    [[Q_HIGH, "245,158,11", "High · 60% full"], [Q_HH, "239,68,68", "High-high · 85% full"]].forEach(([q, c, label]) => {
      ctx.strokeStyle = `rgba(${c},.55)`; ctx.fillStyle = `rgba(${c},.9)`;
      ctx.beginPath(); ctx.moveTo(L, Y(q)); ctx.lineTo(w - R, Y(q)); ctx.stroke();
      ctx.fillText(label, L + 6, Y(q) - 8);
    });
    ctx.setLineDash([]);
    if (!hist.length) return;

    // rainfall, hanging from the top
    ctx.fillStyle = "rgba(56,189,248,.75)";
    const bw = Math.max(1.5, pw / N - 0.6);
    for (const p of hist) if (p.rain > 0.2) ctx.fillRect(X(p.t) - bw / 2, T, bw, Math.min(1, p.rain / RAIN_MAX) * ph * 0.3);

    // measured flow, filled to the floor
    const g = ctx.createLinearGradient(0, T, 0, T + ph);
    g.addColorStop(0, "rgba(95,180,166,.3)"); g.addColorStop(1, "rgba(95,180,166,0)");
    ctx.beginPath();
    hist.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.q)) : ctx.moveTo(X(p.t), Y(p.q))));
    ctx.lineTo(X(hist[hist.length - 1].t), T + ph); ctx.lineTo(X(hist[0].t), T + ph); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();

    // inflow and infiltration: the band between measured flow and the dry
    // weather pattern, wherever the measured line is the higher one
    hatch ||= makeHatch();
    ctx.beginPath();
    hist.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(Math.max(p.q, p.base))) : ctx.moveTo(X(p.t), Y(Math.max(p.q, p.base)))));
    for (let i = hist.length - 1; i >= 0; i--) ctx.lineTo(X(hist[i].t), Y(hist[i].base));
    ctx.closePath();
    ctx.fillStyle = "rgba(56,189,248,.1)"; ctx.fill();
    ctx.fillStyle = hatch; ctx.fill();

    ctx.beginPath();
    hist.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.q)) : ctx.moveTo(X(p.t), Y(p.q))));
    ctx.strokeStyle = "#5fb4a6"; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.stroke();

    // expected dry weather flow
    ctx.beginPath(); ctx.setLineDash([4, 4]);
    hist.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.base)) : ctx.moveTo(X(p.t), Y(p.base))));
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);

    // now
    const last = hist[hist.length - 1];
    ctx.fillStyle = "#5fb4a6"; ctx.beginPath(); ctx.arc(X(last.t), Y(last.q), 4, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(95,180,166,.2)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(X(last.t), Y(last.q), 7, 0, 7); ctx.stroke();

    // the cursor and its readout
    if (cursor === null) return;
    const p = sampleAt(cursor), x = X(p.t);
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, T + ph); ctx.stroke();
    const dot = (y, fill, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#041513"; ctx.stroke(); };
    dot(Y(p.base), "#fff", 3.5); dot(Y(p.q), "#5fb4a6", 4.5);
    const extra = Math.max(0, p.q - p.base);
    tipOut.time.textContent = `Day ${day(p.t)} · ${hhmm(p.t)}`;
    tipOut.q.textContent = fmt(p.q, 1); tipOut.base.textContent = fmt(p.base, 1);
    tipOut.extra.textContent = (extra > 0.05 ? "+" : "") + fmt(extra, 1); tipOut.rain.textContent = fmt(p.rain);
    tip.style.transform = `translateX(${x.toFixed(1)}px)`;
    tip.classList.toggle("flip", x > L + pw * 0.62);
    tip.classList.add("on");
  }

  /* ---- readouts + pipe section ---- */
  const waterG = $("lab-water-g"), arrows = $("lab-arrows"), beam = $("lab-beam");
  const state = $("lab-state"), stateText = state.querySelector("div");
  const chip = $("lab-raining"), rainOut = $("lab-rain-out"), clock = $("lab-clock"), delta = $("lab-dq"), summary = $("lab-summary");
  let lastLevel = -1, swapTimer = 0, frames = 0;
  const LEVELS = [["Normal", "Flow is tracking the dry weather pattern."], ["High level alarm", "Depth has passed 60% of the pipe."], ["High-high level alarm", "Depth has passed 85% of the pipe. Overflow risk."]];
  function readouts() {
    const last = hist[hist.length - 1];
    if (!last) return;
    const hr = depthRatio(last.q), v = last.q / 1000 / area(hr);
    $("lab-q").textContent = last.q.toFixed(1);
    $("lab-d").textContent = Math.round(hr * D * 1000);
    $("lab-v").textContent = v.toFixed(2);
    const dq = Math.max(0, last.q - last.base);
    delta.textContent = `${dq < 0 ? "−" : "+"}${Math.abs(dq).toFixed(1)}`;
    delta.parentElement.toggleAttribute("data-up", dq > 8);
    clock.textContent = `Day ${day(last.t)} · ${hhmm(last.t)}`;
    const raining = last.rain > 0.5;
    chip.classList.toggle("on", raining);
    if (raining) rainOut.textContent = Math.round(last.rain);

    // the pipe is drawn from y=20 to y=180; the water slides down from full
    const dy = (1 - hr) * 160;
    waterG.style.transform = `translateY(${dy.toFixed(1)}px)`;
    beam.setAttribute("y2", (20 + dy + 1).toFixed(1));
    arrows.style.setProperty("--dur", `${Math.max(0.45, 1.9 - v * 1.2).toFixed(2)}s`);
    arrows.setAttribute("transform", `translate(0 ${(20 + dy + (160 - dy) / 2 - 100).toFixed(1)})`);

    const level = hr >= 0.85 ? 2 : hr >= 0.6 ? 1 : 0;
    if (level !== lastLevel) {
      lastLevel = level;
      state.dataset.level = level;
      // a short blur crossfade so the words change rather than teleport
      stateText.classList.add("swap");
      clearTimeout(swapTimer);
      swapTimer = setTimeout(() => {
        state.querySelector("b").textContent = LEVELS[level][0];
        state.querySelector("small").textContent = LEVELS[level][1];
        stateText.classList.remove("swap");
      }, 150);
    }
    const extra = hist.reduce((s, p) => s + Math.max(0, p.q - p.base) * STEP * 60, 0) / 1000;
    $("lab-extra").textContent = fmt(Math.round(extra));
    // a plain-language description for screen readers, refreshed now and then
    if (frames++ % 180 === 0) summary.textContent = `Simulated day ${day(last.t)}, ${hhmm(last.t)}. Flow ${fmt(last.q, 1)} litres a second, ${Math.round(hr * D * 1000)} millimetres deep, ${v.toFixed(2)} metres a second. ${LEVELS[level][0]}. ${fmt(Math.round(extra))} kilolitres above dry weather flow in the last 30 hours.${raining ? ` Raining at ${Math.round(last.rain)} millimetres an hour.` : ""}`;
  }

  /* ---- loop ---- */
  let raf = 0, visible = false, paused = false, prev = 0, acc = 0;
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
    if (visible && !paused && !document.hidden) { prev = performance.now(); raf = requestAnimationFrame(frame); }
  };
  const pauseBtn = $("lab-pause");
  const setPaused = (p) => {
    paused = p;
    lab.classList.toggle("paused", p);
    pauseBtn.setAttribute("aria-pressed", String(p));
    pauseBtn.setAttribute("aria-label", p ? "Resume the simulation" : "Pause the simulation");
    pauseBtn.querySelector(".when-running").hidden = p;
    pauseBtn.querySelector(".when-paused").hidden = !p;
    sync();
  };
  pauseBtn.addEventListener("click", () => setPaused(!paused));

  // start with a day of history that already contains a storm
  storms.push({ start: t + 9 * 60, dur: 120, depth: 22 });
  lastStorm = t + 9 * 60;
  advance(WINDOW);

  $("lab-storm").addEventListener("click", () => { storm(20); if (paused) setPaused(false); });
  ["lab-leak", "lab-size"].forEach((id) => {
    const input = $(id), out = $(`${id}-out`);
    const label = () => {
      const v = parseFloat(input.value);
      out.textContent = id === "lab-size" ? `${v} mm` : v < 0.5 ? "Tight" : v < 1.1 ? "Typical" : "Leaky";
    };
    input.addEventListener("input", label); label();
  });

  // reading values: point at the chart, or focus it and use the arrow keys
  const pointAt = (e) => {
    const r = canvas.getBoundingClientRect();
    cursor = clamp01((e.clientX - r.left - L) / (r.width - L - R));
    cursorBy = "pointer";
    if (!raf) draw();
  };
  canvas.addEventListener("pointermove", pointAt);
  canvas.addEventListener("pointerdown", pointAt);
  canvas.addEventListener("pointerleave", () => { if (cursorBy === "pointer") clearCursor(); });
  canvas.addEventListener("focus", () => { if (cursor === null) { cursor = 1; cursorBy = "key"; draw(); srCursor.textContent = describe(sampleAt(cursor)); } });
  canvas.addEventListener("blur", () => { if (cursorBy === "key") clearCursor(); });
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { clearCursor(); return; }
    const step = { ArrowLeft: -1 / N, ArrowRight: 1 / N, Home: -1, End: 1 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    cursor = clamp01((cursor ?? 1) + step * (e.shiftKey ? 12 : 1));
    cursorBy = "key";
    draw();
    srCursor.textContent = describe(sampleAt(cursor));
  });

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }).observe(canvas);
  document.addEventListener("visibilitychange", sync);
  resize(); readouts();
})();
