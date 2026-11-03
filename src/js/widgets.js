// Smaller interactive pieces: the office map, the LIDoTT Alarm demo, the E-Flow 3
// changeover demo and the EDS Asset Score dial. Each one starts only if its
// element is on the page.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent?.appendChild(n);
    return n;
  };

  /* ================= Australia, as a dot map ================= */
  const map = document.getElementById("ausmap");
  if (map) {
    // A simplified coastline (lon, lat). It only decides which dots are land.
    const MAIN = [[114, -21.8], [113.4, -24.5], [113.2, -26.2], [114.6, -28.8], [115.7, -31.9], [115, -34.2], [117.9, -35.1], [121.9, -33.9], [126, -32.3], [129, -31.6], [131.2, -31.5], [133.7, -32.2], [135.9, -34.8], [137.8, -32.6], [137.5, -35.1], [138.5, -34.9], [139.5, -36], [140.9, -38], [143.5, -38.8], [144.9, -38], [146.4, -39.1], [149.9, -37.5], [150.2, -36], [151.2, -33.9], [152.5, -32.2], [153.1, -30.3], [153.6, -28.6], [153.1, -27.2], [152.9, -25.3], [151, -23.5], [149.2, -21.1], [146.8, -19.3], [146, -17.5], [145.3, -15.5], [143.6, -14.2], [143.2, -12], [142.5, -10.7], [141.6, -12.6], [141.7, -15], [140.8, -17.5], [139.5, -17.5], [137.7, -16], [135.8, -15], [136, -13.3], [136.9, -12.2], [135.2, -12.2], [132.6, -11.5], [130.8, -12.4], [129.6, -14.9], [128.2, -14.9], [127, -13.9], [125, -15.5], [123.6, -17.3], [122.2, -18], [121, -19.6], [118.6, -20.3], [116.7, -20.7]];
    const TAS = [[144.7, -40.7], [146.5, -41.1], [148.3, -40.9], [148.3, -42.2], [147.9, -43.2], [146.8, -43.6], [145.9, -43.3], [145.2, -42.2], [144.7, -41.2]];
    const inside = (p, poly) => {
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const K = 14, XY = (lon, lat) => [(lon - 111) * K, (-lat - 9) * K * 1.13];
    map.setAttribute("viewBox", `0 0 ${45 * K} ${36.5 * K * 1.13}`);
    const land = el("g", { class: "land" }, map);
    for (let lat = -10; lat >= -44; lat -= 0.82) {
      for (let lon = 112.5; lon <= 154; lon += 0.92) {
        if (inside([lon, lat], MAIN) || inside([lon, lat], TAS)) {
          const [x, y] = XY(lon, lat);
          el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: 2.6 }, land);
        }
      }
    }
    const offices = JSON.parse(map.dataset.offices);
    const head = offices.find((o) => o.head);
    const [hx, hy] = XY(head.lon, head.lat);
    const buttons = [...document.querySelectorAll(".office")];
    const pins = offices.map((o, i) => {
      const [x, y] = XY(o.lon, o.lat);
      if (!o.head) {
        const mx = (x + hx) / 2, my = Math.min(y, hy) - Math.abs(x - hx) * 0.22 - 20;
        el("path", { class: "arc", d: `M${hx.toFixed(1)} ${hy.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}` }, map);
      }
      // The map is one image to assistive technology; the office buttons beside it are the controls.
      const g = el("g", { class: "pin" }, map);
      el("circle", { class: "ring", cx: x, cy: y, r: 8, style: `animation-delay:${i * 0.5}s` }, g);
      el("circle", { class: "core", cx: x, cy: y, r: 6 }, g);
      const left = o.lon > 152;
      el("text", { x: x + (left ? -14 : 14), y: y + 5, "text-anchor": left ? "end" : "start" }, g).textContent = o.city;
      return g;
    });
    const pick = (i) => {
      pins.forEach((p, k) => p.classList.toggle("active", k === i));
      buttons.forEach((b, k) => { b.classList.toggle("active", k === i); b.setAttribute("aria-pressed", String(k === i)); });
    };
    pins.forEach((p, i) => { p.addEventListener("pointerenter", () => pick(i)); p.addEventListener("click", () => pick(i)); });
    buttons.forEach((b, i) => { b.addEventListener("pointerenter", () => pick(i)); b.addEventListener("focus", () => pick(i)); b.addEventListener("click", () => pick(i)); });
    pick(0);
  }

  /* ================= LIDoTT Alarm: drag the water level ================= */
  const lid = document.getElementById("lidott-svg");
  if (lid) {
    const range = document.getElementById("lidott-level");
    const TOP = 70, BOT = 380, DEPTH = 4; // chamber drawn between these y's, metres deep
    const HIGH = 2.0, HH = 3.0;
    const y = (m) => BOT - (m / DEPTH) * (BOT - TOP);
    const water = lid.querySelector("#lid-water"), beam = lid.querySelector("#lid-beam"), dim = lid.querySelector("#lid-dim");
    const log = document.getElementById("lidott-log");
    const out = { level: document.getElementById("lid-level"), dist: document.getElementById("lid-dist"), state: document.getElementById("lid-state") };
    let last = 0, minute = 9 * 60 + 12;
    const stamp = () => { minute += 5; return `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`; };
    const sms = (text) => {
      const d = document.createElement("div");
      d.innerHTML = `<small>${stamp()} · SMS and email</small>${text}`;
      log.prepend(d);
      while (log.children.length > 3) log.lastChild.remove();
    };
    const set = (m) => {
      m = Math.max(0.2, Math.min(3.8, m));
      range.value = m;
      range.setAttribute("aria-valuetext", `${m.toFixed(2)} metres`);
      const wy = y(m);
      water.setAttribute("y", wy); water.setAttribute("height", BOT - wy);
      beam.setAttribute("points", `180,${TOP + 26} ${180 - (wy - TOP - 26) * 0.09 - 3},${wy} ${180 + (wy - TOP - 26) * 0.09 + 3},${wy}`);
      dim.setAttribute("y2", wy);
      const level = m >= HH ? 2 : m >= HIGH ? 1 : 0;
      out.level.textContent = m.toFixed(2);
      out.dist.textContent = (DEPTH - m).toFixed(2);
      out.state.dataset.level = level;
      out.state.querySelector("b").textContent = ["Normal", "High level", "High-high level"][level];
      lid.dataset.level = level;
      if (level !== last) {
        if (level > last) sms(`<b>ALARM</b> ${level === 2 ? "High-high" : "High"} level: ${m.toFixed(2)} m`);
        else sms(level === 0 ? `Return to normal: ${m.toFixed(2)} m` : `Level falling, now High: ${m.toFixed(2)} m`);
        last = level;
      }
    };
    range.addEventListener("input", () => set(parseFloat(range.value)));
    let drag = false;
    const fromEvent = (e) => {
      const r = lid.getBoundingClientRect(), sy = ((e.clientY - r.top) / r.height) * 420;
      set(((BOT - sy) / (BOT - TOP)) * DEPTH);
    };
    lid.addEventListener("pointerdown", (e) => { drag = true; lid.setPointerCapture(e.pointerId); fromEvent(e); });
    lid.addEventListener("pointermove", (e) => drag && fromEvent(e));
    lid.addEventListener("pointerup", () => { drag = false; });
    set(1.1);
    sms("Daily heartbeat: sensor operational");
    // a slow rise the first time it scrolls into view, to show what it does
    new IntersectionObserver(([en], obs) => {
      if (!en.isIntersecting) return;
      obs.disconnect();
      let m = 1.1;
      const id = setInterval(() => { if (drag || m >= 2.25) return clearInterval(id); m += 0.03; set(m); }, 40);
      lid.addEventListener("pointerdown", () => clearInterval(id), { once: true });
      range.addEventListener("pointerdown", () => clearInterval(id), { once: true });
    }, { threshold: 0.5 }).observe(lid);
  }

  /* ================= E-Flow 3: fill the pipe, watch it change over ================= */
  // A 600 mm sewer in section (build.mjs: eflowDemo). The level maps to the
  // drawing in two scales: the pipe from invert to crown, then the manhole
  // above it. The radar pair leads while there is a free surface below the
  // sensor; once the water reaches the radar faces, ultrasonic and pressure
  // lead until it drops back (a little hysteresis, so a level held at the
  // boundary does not flicker).
  const ef = document.getElementById("ef-svg");
  if (ef) {
    const D = 0.6, TOP = 2.6, INV = 296, CROWN = 176, SHAFT_TOP = 48;
    const WET = 0.41, UP = 0.47, DOWN = 0.45; // ultrasonic face under water; radar faces under, and clear again
    const yOf = (h) => (h <= D ? INV - (h / D) * (INV - CROWN) : CROWN - ((h - D) / (TOP - D)) * (CROWN - SHAFT_TOP));
    const hOf = (y) => (y >= CROWN ? ((INV - y) / (INV - CROWN)) * D : D + ((CROWN - y) / (CROWN - SHAFT_TOP)) * (TOP - D));
    const $ = (id) => document.getElementById(id);
    const range = $("ef-range"), play = $("ef-play"), live = $("ef-live"), state = $("ef-state");
    const water = $("ef-water"), surf = $("ef-surf"), clip = $("ef-clip-r"), foot = $("ef-foot");
    const wv = [...$("ef-wv").children], wd = [...$("ef-wd").children], vtag = $("ef-vtag");
    const pf = { base: $("ef-pf-base"), env: $("ef-pf-env"), arrows: $("ef-pf"), top: $("ef-pf-top"), mean: $("ef-pf-mean") };
    const bv = $("ef-bv"), bd = $("ef-bd"), hExt = $("ef-head-ext"), hDim = $("ef-head-dim"), hText = $("ef-head-t"), hVal = $("ef-head-v");
    const trR = $("ef-tr-r"), trU = $("ef-tr-u");
    const out = { level: $("ef-level"), d: $("ef-d"), v: $("ef-v"), q: $("ef-q") };
    const rows = Object.fromEntries([...document.querySelectorAll(".ef-sensors li")].map((li) => [li.dataset.s, li]));
    // where the elements sit (the sensor is drawn at the crown from x 310,
    // as diagrams.mjs draws it), and the station the velocity profile is drawn at
    const VEL = [350, 201.8, -0.77, 0.64], DEP = [326, 199.6, 0, 1], PORT = [369.5, 222.6], X0 = 186;
    const n1 = (n) => n.toFixed(1);
    const turn = (dx, dy, a) => { const r = (a * Math.PI) / 180; return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)]; };
    // a radar beam to the surface, its wavefronts, and its footprint
    const beam = (path, waves, [ox, oy, dx, dy], half, toY) => {
      const [ax, ay] = turn(dx, dy, -half), [bx, by] = turn(dx, dy, half), ta = (toY - oy) / ay, tb = (toY - oy) / by;
      path.setAttribute("d", `M${ox} ${oy}L${n1(ox + ax * ta)} ${n1(toY)}L${n1(ox + bx * tb)} ${n1(toY)}Z`);
      const near = Math.min(ta, tb);
      waves.forEach((w, k) => {
        const r = (near * (k + 0.7)) / (waves.length + 0.2);
        w.setAttribute("d", `M${n1(ox + ax * r)} ${n1(oy + ay * r)}A${n1(r)} ${n1(r)} 0 0 1 ${n1(ox + bx * r)} ${n1(oy + by * r)}`);
        w.style.setProperty("--d", `${(k * 0.3).toFixed(1)}s`);
      });
      return [Math.min(ox + ax * ta, ox + bx * tb), Math.max(ox + ax * ta, ox + bx * tb)];
    };
    // velocity through the depth: a power law from the bed under a free
    // surface, or from both walls with the pipe full; the mean dashed
    const profile = (top, bottom, len, full) => {
      const v = (y) => (full ? Math.pow(Math.max(0, 1 - Math.abs((2 * y - top - bottom) / (bottom - top))), 1 / 7) : Math.pow(Math.max(0, (bottom - y) / (bottom - top)), 1 / 6));
      const arrow = (y) => { const l = len * v(y); return l < 7 ? "" : `M${X0} ${n1(y)}H${n1(X0 + l)}m-4.4-2.8 4.4 2.8-4.4 2.8`; };
      const ys = []; for (let y = top + 4.2; y < bottom - 2; y += 7) ys.push(y);
      let env = ""; for (let k = 0; k <= 20; k++) { const y = top + ((bottom - top) * k) / 20; env += `${k ? "L" : "M"}${n1(X0 + len * v(y))} ${n1(y)}`; }
      const mean = X0 + len * (full ? 0.82 : 0.857);
      pf.base.setAttribute("d", `M${X0} ${n1(top)}V${n1(bottom)}`);
      pf.env.setAttribute("d", env);
      pf.arrows.setAttribute("d", (full ? ys : ys.slice(1)).map(arrow).join(""));
      pf.top.setAttribute("d", full ? "" : arrow(ys[0]));
      pf.mean.setAttribute("d", `M${n1(mean)} ${n1(top + 3)}V${n1(bottom - 3)}`);
      return mean;
    };
    // an illustrative site: velocity rises with depth, and a little more
    // with head once the pipe is full; flow is velocity times wetted area
    const vOf = (h) => (h <= D ? 0.3 + Math.pow(h / D, 0.67) : 1.3 + 0.08 * (h - D));
    const aOf = (h) => { const r = D / 2; if (h >= D) return Math.PI * r * r; const th = 2 * Math.acos((r - h) / r); return (r * r * (th - Math.sin(th))) / 2; };
    let h = 0.2, pair = "radar", storm = null, drag = false, inView = false;
    const N = 300, hist = [];
    const traceY = (x) => (x <= D ? 78 - (x / D) * 38 : 40 - ((x - D) / (TOP - D)) * 34);

    const draw = () => {
      const y = yOf(h), full = h >= D;
      if (pair === "radar" && h >= UP) pair = "us";
      else if (pair === "us" && h < DOWN) pair = "radar";
      // water in the pipe, then up the shaft
      const py = Math.max(CROWN, y), wy = n1(y);
      water.setAttribute("d", full ? `M0 ${CROWN}H400V${wy}H456V${CROWN}H560V${INV}H0Z` : `M0 ${wy}H560V${INV}H0Z`);
      clip.setAttribute("d", `M0 ${n1(py)}H560V${INV}H0Z`);
      surf.setAttribute("d", full ? `M400 ${wy}H456` : `M0 ${wy}H560`);
      if (pair === "radar") {
        const [a, b] = beam(bv, wv, VEL, 12, y);
        beam(bd, wd, DEP, 7, y);
        foot.setAttribute("d", `M${n1(a)} ${wy}H${n1(b)}`);
      }
      // the head of water over the pressure port, measured beside the shaft
      const top = Math.min(y, PORT[1] - 6);
      hExt.setAttribute("d", `M${PORT[0] + 4} ${PORT[1]}H482M${full ? 468 : 392} ${wy}H482`);
      hDim.setAttribute("d", `M476 ${PORT[1] - 2}V${(top + 2).toFixed(1)}m-4 6 4-6 4 6M472 ${PORT[1] - 8}l4 6 4-6`);
      hText.setAttribute("y", ((PORT[1] + top) / 2 - 4).toFixed(1));
      hVal.textContent = `${Math.max(0, h - ((INV - PORT[1]) / (INV - CROWN)) * D).toFixed(2)} m`;
      ef.dataset.pair = pair;
      ef.dataset.wet = h >= WET ? "1" : "0";
      // what the sensor reports
      const v = vOf(h) + (Math.random() - 0.5) * 0.008, q = v * aOf(h) * 1000;
      out.level.textContent = h.toFixed(2);
      range.value = h; range.setAttribute("aria-valuetext", `${h.toFixed(2)} metres`);
      out.d.textContent = h.toFixed(3); out.v.textContent = v.toFixed(2); out.q.textContent = Math.round(q);
      const mean = profile(py + 1, INV - 1, 46 * v, py <= CROWN);
      vtag.setAttribute("x", n1(mean + 6)); vtag.setAttribute("y", n1(INV - 8));
      vtag.textContent = `v\u0304 ${v.toFixed(2)} m/s`;
      const set = (k, s) => { if (rows[k].dataset.state !== s) { rows[k].dataset.state = s; rows[k].querySelector("em").textContent = { primary: "Primary", check: "Cross-checking", standby: "Standing by" }[s]; } };
      set("vel", pair === "radar" ? "primary" : "standby");
      set("dep", pair === "radar" ? "primary" : "standby");
      set("us", pair === "us" ? "primary" : h >= WET ? "check" : "standby");
      set("pr", pair === "us" ? "primary" : "check");
      if (state.dataset.pair !== pair) {
        state.dataset.pair = pair;
        state.querySelector("b").textContent = pair === "radar" ? "Dual radar, non-contact" : "Ultrasonic and pressure";
        live.textContent = pair === "radar" ? "Free surface back: dual radar is primary again." : "No free surface: ultrasonic and pressure have taken over.";
      }
      state.querySelector("small").textContent = pair === "radar"
        ? h >= WET ? "Free surface present. Ultrasonic and pressure cross-check in the background." : "Free surface below the sensor. Pressure cross-checks in the background."
        : full ? `Surcharged ${(h - D).toFixed(2)} m above the obvert. Radar stands by.` : "Water up to the sensor, no free surface. Radar stands by.";
    };
    // the record: the last N readings, each stretch in the colour of the pair that made it
    const record = () => {
      hist.push([h, pair]);
      if (hist.length > N) hist.shift();
      const dx = 560 / (N - 1), x0 = 560 - (hist.length - 1) * dx;
      const d = { radar: "", us: "" };
      for (let i = 1; i < hist.length; i++) {
        const [a] = hist[i - 1], [b, p] = hist[i], ax = (x0 + (i - 1) * dx).toFixed(1), bx = (x0 + i * dx).toFixed(1);
        const joined = i > 1 && hist[i - 1][1] === p;
        d[p] += `${joined ? "" : `M${ax} ${traceY(a).toFixed(1)}`}L${bx} ${traceY(b).toFixed(1)}`;
      }
      trR.setAttribute("d", d.radar); trU.setAttribute("d", d.us);
    };
    // a storm: the level rises to a surcharge up the manhole and drains away
    const STORM = 30, base = 0.2, peak = 2.1, at = (t) => { const u = t / 8; return base + (peak - base) * u ** 3 * Math.exp(3 * (1 - u)); };
    const startStorm = () => { storm = 0; };
    const stopStorm = () => { storm = null; };
    setInterval(() => {
      if (!inView || document.hidden) return;
      if (storm !== null) { storm += 0.1; h = at(storm); if (storm >= STORM) stopStorm(); }
      draw(); record();
    }, 100);
    range.addEventListener("input", () => { stopStorm(); h = parseFloat(range.value); draw(); });
    play.addEventListener("click", startStorm);
    const fromEvent = (e) => {
      const r = ef.getBoundingClientRect(), sy = ((e.clientY - r.top) / r.height) * 312;
      h = Math.max(0.05, Math.min(TOP, hOf(sy))); draw();
    };
    ef.addEventListener("pointerdown", (e) => { drag = true; stopStorm(); ef.setPointerCapture(e.pointerId); fromEvent(e); });
    ef.addEventListener("pointermove", (e) => drag && fromEvent(e));
    ef.addEventListener("pointerup", () => { drag = false; });
    draw();
    // a storm plays the first time the demo comes into view, to show the changeover
    let first = true;
    new IntersectionObserver(([en]) => {
      inView = en.isIntersecting;
      if (inView && first) { first = false; startStorm(); }
    }, { threshold: 0.35 }).observe(ef);
  }

  /* ================= EDS Asset Score dial ================= */
  const eas = document.getElementById("eas-svg");
  if (eas) {
    const needle = eas.querySelector("#eas-needle"), num = eas.querySelector("#eas-num"), spark = eas.querySelector("#eas-spark");
    const state = document.getElementById("eas-state");
    let score = 930, target = 930, hist = Array(60).fill(930), alarmed = false;
    const render = () => {
      const a = -90 + (score / 1000) * 180;
      needle.setAttribute("transform", `rotate(${a.toFixed(1)} 200 200)`);
      num.textContent = Math.round(score);
      spark.setAttribute("points", hist.map((v, i) => `${(110 + i * 3.05).toFixed(1)},${(300 - ((v - 300) / 700) * 40).toFixed(1)}`).join(" "));
      // the rule from the EAS write-up: more than 5% change inside 60 minutes
      const change = Math.abs(hist[hist.length - 1] - hist[0]) / hist[0];
      const now = change > 0.05;
      if (now !== alarmed) {
        alarmed = now;
        state.dataset.level = now ? 2 : 0;
        state.querySelector("b").textContent = now ? "Alarm sent to site managers" : "Stable";
        state.querySelector("small").textContent = now ? `Score changed ${(change * 100).toFixed(1)}% within 60 minutes.` : "No change beyond 5% in the last 60 minutes.";
      }
    };
    const tick = () => {
      score += (target - score) * 0.12 + (Math.random() - 0.5) * 3;
      hist.push(score); hist.shift();
      render();
    };
    document.querySelectorAll("[data-eas]").forEach((b) =>
      b.addEventListener("click", () => {
        target = { subtle: 868, adverse: 430, reset: 930 }[b.dataset.eas];
      })
    );
    render();
    setInterval(() => { if (!document.hidden) tick(); }, 260); // one tick stands for a minute
  }
})();
