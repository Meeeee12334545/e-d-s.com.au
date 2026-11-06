// The traffic: this file moves every vehicle in the overlay along its lane
// each frame and runs the signals at the two lit intersections (November
// 2026). city-scene.js builds the vehicles, the lanes and the signal heads
// (sc.traffic); city.js starts and stops the loop with the rest of the
// overlay (run), so nothing moves while the city is off screen.
//
// A vehicle keeps a gap to the one ahead in its lane and brakes for a red
// light, so a queue forms at the stop line and moves off again in turn when
// the light goes green. At amber the approaching traffic slows to half pace
// and stops at the line if it gets there before the green returns; anything
// already close to the line when the amber comes is committed and goes
// through, as a driver would. The trams run the same lanes under the same
// signals. The patrol vans are out only in a storm, so until then the other
// traffic drives as if they were not there.
(() => {
  window.CityTraffic = (sc) => {
    if (!sc.traffic) return null;
    const { lanes, vehicles, heads } = sc.traffic, P = CityScene.P;
    // the signal cycle at each intersection, in seconds: the main road's
    // green, amber and all-red, then the side road's. The second intersection
    // runs the same cycle offset, so the two never change in step.
    const CYCLE = [["main", "g", 9.5], ["main", "a", 2.4], ["main", "r", 1.2], ["side", "g", 6.5], ["side", "a", 2.4], ["side", "r", 1.2]];
    const TOTAL = CYCLE.reduce((a, [, , t]) => a + t, 0), OFFSET = { A: 0, B: 11.3 };
    const lit = {};
    const stateAt = (node, t) => {
      let u = (t + OFFSET[node]) % TOTAL;
      const s = { main: "r", side: "r" };
      for (const [axis, k, dur] of CYCLE) { if (u < dur) { s[axis] = k; break; } u -= dur; }
      return s;
    };
    // each lane as a line of travel: the axis it runs along, its direction,
    // its length and its stops as distances from the start
    const L = {};
    for (const [id, l] of Object.entries(lanes)) {
      const ax = l.from[0] === l.to[0] ? 1 : 0, sign = Math.sign(l.to[ax] - l.from[ax]), len = Math.abs(l.to[ax] - l.from[ax]);
      L[id] = { from: l.from, ax, sign, len, stops: l.stops.map(([c, node, axis]) => ({ s: (c - l.from[ax]) * sign, node, axis })), cars: [] };
    }
    for (const v of vehicles) { L[v.lane].cars.push(v); v.v = v.speed; v.pass = null; v.braking = null; }
    // The stunt (city.js) puts its car and, once it lands, its roadster into
    // the traffic, so they queue and stop at the lights like everyone else;
    // a vehicle spawned this way leaves at the end of its lane instead of
    // coming round again. `clear` says whether a stretch of lane is free.
    const clear = (laneId, s, margin) => !L[laneId].cars.some((c) => Math.abs(c.s - s) < margin);
    const spawn = (laneId, what, s, o = {}) => {
      const l = L[laneId], own = typeof what === "string";
      if (!o.force && !clear(laneId, s, o.margin ?? 0.9)) return null;
      let el = what;
      if (own) { el = document.createElementNS("http://www.w3.org/2000/svg", "g"); el.setAttribute("class", "veh"); const u = document.createElementNS("http://www.w3.org/2000/svg", "use"); u.setAttribute("href", what); el.appendChild(u); sc.traffic.layer.appendChild(el); }
      const v = { el, own, lane: laneId, s, len: o.len ?? 0.3, speed: o.speed ?? 1.0, v: o.speed ?? 1.0, pass: null, braking: null, once: true, done: false };
      const [px, py] = place(l, s);
      el.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
      l.cars.push(v);
      return v;
    };
    const despawn = (v) => { const l = L[v.lane], i = l.cars.indexOf(v); if (i >= 0) l.cars.splice(i, 1); if (v.own) v.el.remove(); };
    const place = (l, s) => { const p = [l.from[0], l.from[1]]; p[l.ax] += l.sign * s; return P(p[0], p[1]); };
    // in tiles a second: how hard a vehicle pulls away and eases off, and
    // the speed from which a distance is enough to stop in comfortably
    const ACC = 0.9, TRAM_ACC = 0.4, BRAKE = 0.75, EASE = 1.8, GAP = 0.14;
    const reach = (dist) => Math.sqrt(2 * BRAKE * Math.max(0, dist));
    let time = 0, last = 0, raf = 0, running = false;
    function frame(now) {
      if (!running) { raf = 0; return; }
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now; time += dt;
      for (const node of ["A", "B"]) {
        const s = stateAt(node, time);
        if (lit[node]?.main === s.main && lit[node]?.side === s.side) continue;
        lit[node] = s;
        for (const h of heads) if (h.dataset.node === node) h.dataset.state = s[h.dataset.axis];
      }
      const storm = sc.fx.classList.contains("is-storm");
      for (const l of Object.values(L)) {
        const cars = l.cars;
        cars.sort((a, b) => a.s - b.s);
        for (let i = 0; i < cars.length; i++) {
          const v = cars[i];
          let target = v.speed;
          // the vehicle ahead: the next up the lane, round the end, skipping patrol vans that are not out
          let j = (i + 1) % cars.length, n = 0;
          while (n++ < cars.length && cars[j] !== v && cars[j].patrol && !storm) j = (j + 1) % cars.length;
          const lead = cars[j];
          if (lead !== v) {
            let gap = lead.s - v.s;
            if (j <= i) gap += l.len;
            target = Math.min(target, reach(gap - lead.len / 2 - v.len / 2 - GAP));
          }
          // the signals ahead
          const nose = v.s + v.len / 2;
          for (const st of l.stops) {
            const d = st.s - nose;
            if (d < -0.02) { if (v.pass === st) v.pass = null; continue; }
            if (v.pass === st) continue;
            const k = lit[st.node][st.axis];
            if (k === "g") { if (v.braking === st) v.braking = null; continue; }
            // caught close to the line by the change: through you go
            if (v.braking !== st && d < 0.3 && v.v > 0.3) { v.pass = st; continue; }
            v.braking = st;
            target = Math.min(target, reach(d), k === "a" ? v.speed * 0.5 : Infinity);
          }
          if (target > v.v) v.v = Math.min(target, v.v + (v.tram ? TRAM_ACC : ACC) * dt);
          else v.v = Math.max(target, v.v - EASE * dt);
          v.s += v.v * dt;
          if (v.s > l.len) { if (v.once) v.done = true; else { v.s -= l.len; v.pass = null; v.braking = null; } }
          const [px, py] = place(l, v.s);
          v.el.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
        }
      }
      raf = requestAnimationFrame(frame);
    }
    // everything in place before the first frame, so nothing is seen to jump
    for (const l of Object.values(L)) for (const v of l.cars) { const [px, py] = place(l, v.s); v.el.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)})`); }
    const run = (on) => {
      running = on;
      if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    return { run, lanes: L, spawn, despawn, clear };
  };
})();
