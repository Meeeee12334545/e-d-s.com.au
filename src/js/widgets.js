// Smaller interactive pieces: the office map, the LIDoTT Alarm demo and the
// EDS Asset Score dial. Each one starts only if its element is on the page.
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
      const g = el("g", { class: "pin", tabindex: "0", role: "button", "aria-label": `${o.city}, ${o.state}` }, map);
      el("circle", { class: "ring", cx: x, cy: y, r: 8, style: `animation-delay:${i * 0.5}s` }, g);
      el("circle", { class: "core", cx: x, cy: y, r: 6 }, g);
      const left = o.lon > 152;
      el("text", { x: x + (left ? -14 : 14), y: y + 5, "text-anchor": left ? "end" : "start" }, g).textContent = o.city;
      return g;
    });
    const pick = (i) => {
      pins.forEach((p, k) => p.classList.toggle("active", k === i));
      buttons.forEach((b, k) => b.classList.toggle("active", k === i));
    };
    pins.forEach((p, i) => { p.addEventListener("pointerenter", () => pick(i)); p.addEventListener("focus", () => pick(i)); p.addEventListener("click", () => pick(i)); });
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
