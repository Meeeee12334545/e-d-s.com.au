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
//
// Kids ride e-bikes in the traffic too, and now and then (city.js says when)
// the police pull one or two of them over (pullOver, below). A vehicle can
// leave its line for the kerb (`side`, in tiles toward its left), stop at a
// set point (`hold`), and stand `aside`, where the traffic passes it.
(() => {
  window.CityTraffic = (sc) => {
    if (!sc.traffic) return null;
    const { lanes, vehicles, heads, roads, span } = sc.traffic, P = CityScene.P;
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
      L[id] = { from: l.from, ax, sign, len, far: l.far, near: l.near, road: l.road, stops: l.stops.map(([c, node, axis]) => ({ s: (c - l.from[ax]) * sign, node, axis })), cars: [] };
    }
    for (const v of vehicles) { L[v.lane].cars.push(v); v.v = v.speed; v.pass = null; v.braking = null; }
    // The stunt (city.js) puts its car and, once it lands, its roadster into
    // the traffic, so they queue and stop at the lights like everyone else;
    // a vehicle spawned this way leaves at the end of its lane instead of
    // coming round again. `clear` says whether a stretch of lane is free.
    const clear = (laneId, s, margin) => !L[laneId].cars.some((c) => !c.aside && Math.abs(c.s - s) < margin);
    const spawn = (laneId, what, s, o = {}) => {
      const l = L[laneId], own = typeof what === "string";
      if (!o.force && !clear(laneId, s, o.margin ?? 0.9)) return null;
      let el = what;
      const ns = "http://www.w3.org/2000/svg";
      let slot = null;
      if (own) {
        slot = document.createElementNS(ns, "g"); slot.setAttribute("class", "veh-slot"); l.far.appendChild(slot);
        el = document.createElementNS(ns, "g"); el.setAttribute("class", "veh"); slot.appendChild(el);
        const u = document.createElementNS(ns, "use"); u.setAttribute("href", what); el.appendChild(u);
      }
      const v = { el, slot, lane: laneId, s, len: o.len ?? 0.3, speed: o.speed ?? 1.0, v: o.speed ?? 1.0, pass: null, braking: null, once: true, done: false };
      put(l, v);
      l.cars.push(v);
      return v;
    };
    const despawn = (v) => { const l = L[v.lane], i = l.cars.indexOf(v); if (i >= 0) l.cars.splice(i, 1); (v.slot || v.el).remove(); };
    // Each frame: where it is on screen, and when these change, which stretch of
    // road's clip it goes through and, on a side road, which side of the main
    // road's traffic it paints: it crosses to the group over that traffic as it
    // passes the middle of the junction, and back when it comes round. (The stunt's
    // roadster has no slot: it stays in the stunt's group, with the road's clip.)
    const put = (l, v) => {
      const p = [l.from[0], l.from[1]];
      p[l.ax] += l.sign * v.s;
      if (v.side) p[1 - l.ax] += (l.ax ? l.sign : -l.sign) * v.side;
      const [px, py] = P(p[0], p[1]);
      v.el.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
      if (!v.slot) return;
      const r = roads[l.road], k = Math.max(0, Math.min(r.n - 1, Math.floor((p[l.ax] - r.from) / span)));
      if (v.k !== k) { v.k = k; v.slot.setAttribute("clip-path", `url(#clip-${l.road}-${k})`); }
      if (l.near) { const near = p[1] > 5; if (v.near !== near) { v.near = near; (near ? l.near : l.far).appendChild(v.slot); } }
    };
    // in tiles a second: how hard a vehicle pulls away and eases off, and
    // the speed from which a distance is enough to stop in comfortably
    const ACC = 0.9, TRAM_ACC = 0.4, BRAKE = 0.75, EASE = 1.8, GAP = 0.14;
    const reach = (dist) => Math.sqrt(2 * BRAKE * Math.max(0, dist));
    let time = 0, last = 0, raf = 0, running = false;
    // what else runs with the traffic, each frame before it moves (the police)
    const hooks = [];
    function frame(now) {
      if (!running) { raf = 0; return; }
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now; time += dt;
      for (const h of hooks) h(dt);
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
          // stopped at the kerb: nothing in the lane concerns it, only where it is to stop
          if (v.aside) target = v.hold == null ? 0 : Math.min(target, reach(v.hold - v.s));
          else {
            // the vehicle ahead: the next up the lane, round the end, skipping patrol vans that are not out and anything at the kerb
            const by = (c) => c.aside || (c.patrol && !storm);
            let j = (i + 1) % cars.length, n = 0;
            while (n++ < cars.length && cars[j] !== v && by(cars[j])) j = (j + 1) % cars.length;
            const lead = cars[j];
            if (lead !== v && !by(lead)) {
              let gap = lead.s - v.s;
              if (j <= i) gap += l.len;
              target = Math.min(target, reach(gap - lead.len / 2 - v.len / 2 - GAP));
            }
            if (v.hold != null) target = Math.min(target, reach(v.hold - v.s));
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
          }
          if (target > v.v) v.v = Math.min(target, v.v + (v.tram ? TRAM_ACC : ACC) * dt);
          else v.v = Math.max(target, v.v - EASE * dt);
          v.s += v.v * dt;
          if (v.s > l.len) { if (v.once) v.done = true; else { v.s -= l.len; v.pass = null; v.braking = null; } }
          put(l, v);
        }
      }
      raf = requestAnimationFrame(frame);
    }
    // everything in place before the first frame, so nothing is seen to jump
    for (const l of Object.values(L)) for (const v of l.cars) put(l, v);
    const run = (on) => {
      running = on;
      if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };

    /* ---- the police pull over kids on e-bikes ---- */
    // One or two kids ride in along the main road with a police car behind
    // them, lights going, and all three pull over onto the far footpath
    // (city-scene.js, KERB). An officer walks up to the kids and radios in; a
    // second car comes towing a trailer and pulls in ahead of them. The kids
    // get off, the officers wheel the bikes up the ramp onto the trailer, and
    // it drives off with them. Then the kids are handcuffed, walked back to
    // the first car and driven away, lights still going.
    //
    // The story is written as generators, one per thing going on at once,
    // stepped each frame with the time since the last (so it pauses with the
    // traffic when the city is off screen): `yield` waits a frame, and
    // `until`, `wait` and `tween` wait for longer. People move on their own
    // toward wherever they were last sent (walkTo), a step at a time.
    const K = sc.traffic.kerb, NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]); parent?.appendChild(n); return n; };
    const ease = (u) => u * u * (3 - 2 * u), unit = (u) => Math.max(0, Math.min(1, u));
    const threads = [], people = [];
    const go = (gen) => { const t = { gen, done: false }; threads.push(t); return t; };
    function* until(fn) { while (!fn()) yield; }
    function* wait(sec) { let t = 0; while (t < sec) t += yield; }
    function* tween(sec, fn) { let t = 0; while (t < sec) { t += yield; fn(ease(unit(t / sec))); } }
    // someone (or a bike being wheeled) on the footpath, at (x, y) in tiles
    const at = (o) => { const [px, py] = P(o.x, o.y); o.g.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)})`); };
    const person = (sym, x, y, parent, style) => {
      const g = mk("g", { style }, parent), o = { g, use: mk("use", { href: `#${sym}` }, g), x, y, tx: x, ty: y, pace: 0.3 };
      at(o); people.push(o); return o;
    };
    const walkTo = (o, x, y = o.y, pace = 0.3) => Object.assign(o, { tx: x, ty: y, pace });
    const there = (o) => o.x === o.tx && o.y === o.ty;
    const gone = (o) => { o.g.remove(); people.splice(people.indexOf(o), 1); };
    hooks.push((dt) => {
      for (const o of people) {
        const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy), moving = d > 1e-6;
        if (moving) { if (d <= o.pace * dt) { o.x = o.tx; o.y = o.ty; } else { o.x += dx / d * o.pace * dt; o.y += dy / d * o.pace * dt; } at(o); }
        if (o.moving !== moving) { o.moving = moving; o.g.classList.toggle("stepping", moving); }
      }
      for (let i = threads.length - 1; i >= 0; i--) if (threads[i].gen.next(dt).done) { threads[i].done = true; threads.splice(i, 1); }
    });
    if (!K) return { run, lanes: L, spawn, despawn, clear };
    const l = L[K.lane], [gKids, gCops, gBikes] = K.groups, scene = gKids.parentNode;
    // where a point on the road is along the lane, and how far across from its line
    const along = (x) => (x - l.from[l.ax]) * l.sign, across = (c) => (l.ax ? c - l.from[0] : l.from[1] - c) * l.sign;
    // over to the kerb: easing across from `from` and stopping with its middle at x, y
    function* pull(v, x, y, from) {
      const s0 = along(from), s1 = along(x), k = across(y);
      v.hold = s1;
      for (;;) {
        const u = ease(unit((v.s - s0) / (s1 - s0)));
        v.side = k * u;
        // at the kerb it is farther off than the lane, so it paints under the traffic passing it
        if (u > 0.92 && !v.aside) { v.aside = true; l.far.insertBefore(v.slot, scene.nextSibling); }
        if (v.aside && v.v < 0.01 && Math.abs(s1 - v.s) < 0.01) return;
        yield;
      }
    }
    // back out into the lane once there is a gap in the traffic coming up
    // behind, then on to the end of the lane, where it goes
    function* away(v) {
      yield* until(() => l.cars.every((c) => c === v || c.aside || c.s > v.s + 0.5 || c.s < v.s - 1.3));
      const s0 = v.s, k = v.side;
      v.aside = false; v.hold = null;
      while (v.side > 0) { v.side = k * (1 - ease(unit((v.s - s0) / 0.6))); if (v.side < 1e-3) v.side = 0; yield; }
      yield* until(() => v.done);
      despawn(v);
    }
    // radio waves over an officer's head while they call in
    function* radio(o, sec) {
      const [px, py] = P(o.x, o.y), g = mk("g", { class: "radio", transform: `translate(${px.toFixed(1)} ${py.toFixed(1)})` }, gCops);
      const a = mk("path", { d: "M-1.6 -11.4a2.3 2.3 0 0 1 3.2 0" }, g), b = mk("path", { d: "M-2.9 -12.8a4.1 4.1 0 0 1 5.8 0" }, g);
      let t = 0;
      while (t < sec) { t += yield; const k = Math.floor(t / 0.22) % 3; a.style.visibility = k ? "" : "hidden"; b.style.visibility = k > 1 ? "" : "hidden"; }
      g.remove();
    }
    // the click of the cuffs: a glint at the kid's wrists
    function* glint(o) {
      const [px, py] = P(o.x, o.y), s = mk("path", { class: "glint", d: "M0 -1.7L.4 -.4 1.7 0 .4 .4 0 1.7 -.4 .4 -1.7 0 -.4 -.4Z", transform: `translate(${(px + 1.8).toFixed(1)} ${(py - 2.9).toFixed(1)})` }, gCops);
      yield* wait(0.5);
      s.remove();
    }
    const TRAILER = { rear: K.at.p2 - 0.32, mid: K.at.p2 - 0.17, car: 0.17 };
    // an officer takes a bike: alongside it, wheels it to the foot of the
    // ramp, then pushes it up onto the trailer, where it rides with the trailer
    function* load(o, b, p2, car, slot) {
      walkTo(o, b.x - 0.05, K.y.cop); yield* until(() => there(o));
      yield* wait(0.3);
      const foot = TRAILER.rear - 0.09 - 0.12;
      walkTo(o, foot - 0.05, K.y.cop, 0.24); walkTo(b, foot, K.y.bike, 0.24);
      yield* until(() => there(b));
      const u = mk("use", { href: "#bike-e", style: b.g.getAttribute("style") });
      p2.el.insertBefore(u, car);
      gone(b);
      yield* tween(1.1, (t) => {
        const x = foot + (TRAILER.mid - foot) * t, y = K.y.bike + (slot - K.y.bike) * t, [px, py] = P(x - K.at.p2, y - K.y.car, 1.6 * unit(t / 0.6));
        u.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
      });
    }
    function* story(kids, done) {
      // the police come in behind the kids, lights going
      let p1 = null;
      yield* until(() => (p1 = spawn(K.lane, "#police-e", -0.4, { len: 0.3, speed: 1.45, margin: 0.55 })));
      p1.el.classList.add("cop", "lit");
      const parked = [...kids.map((k, i) => go(pull(k, K.at.kids[i], K.y.bike, 1.4))), go(pull(p1, K.at.p1, K.y.car, 1.0))];
      yield* until(() => parked.every((t) => t.done));
      yield* wait(0.6);
      // an officer gets out (on the far side, so behind the car) and walks up to the kids, then calls in
      const o1 = person("officer", K.at.p1 + 0.05, K.y.cop, gCops), last = K.at.kids[kids.length - 1];
      walkTo(o1, last - 0.07);
      yield* until(() => there(o1));
      yield* wait(0.5);
      yield* radio(o1, 1.8);
      // the backup comes towing the trailer and pulls in ahead of the kids
      let p2 = null;
      yield* until(() => (p2 = spawn(K.lane, "#trailer-e", -0.6, { len: 0.64, speed: 1.5, margin: 0.7 })));
      const [cx, cy] = P(TRAILER.car, 0), car = mk("use", { href: "#police-e", transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)})` }, p2.el);
      p2.el.classList.add("cop", "lit");
      const t2 = go(pull(p2, K.at.p2, K.y.car, K.at.p2 - 0.48));
      yield* until(() => t2.done);
      yield* wait(0.5);
      const o2 = person("officer", K.at.p2 + 0.15, K.y.cop, gCops);
      // the kids get off and stand back, and the officers take the bikes
      yield* wait(0.4);
      const off = kids.map((k, i) => {
        const x = K.at.kids[i], style = k.el.getAttribute("style");
        despawn(k);
        return { kid: person("kid", x - 0.04, K.y.kid, gKids, style), bike: person("bike-e", x, K.y.bike, gBikes, style) };
      });
      const slots = kids.length === 2 ? [K.y.car - 0.035, K.y.car + 0.035] : [K.y.car];
      const loading = [go(load(o2, off[0].bike, p2, car, slots[0]))];
      if (off[1]) { yield* wait(0.8); loading.push(go(load(o1, off[1].bike, p2, car, slots[1]))); }
      yield* until(() => loading.every((t) => t.done));
      // the bikes go off on the trailer
      walkTo(o2, K.at.p2 + 0.12, K.y.cop);
      yield* until(() => there(o2));
      gone(o2);
      yield* wait(0.4);
      go(away(p2));
      // the kids are cuffed, one at a time, and walked back to the car
      for (const { kid } of off) {
        walkTo(o1, kid.x + 0.06, K.y.cop); yield* until(() => there(o1));
        yield* wait(0.5);
        kid.use.setAttribute("href", "#kid-cuffed");
        yield* glint(kid);
        yield* wait(0.4);
      }
      off.forEach(({ kid }, i) => walkTo(kid, K.at.p1 + 0.02 - i * 0.07, K.y.kid, 0.22));
      yield* wait(0.3);
      walkTo(o1, K.at.p1 + 0.08, K.y.cop, 0.22);
      yield* until(() => off.every(({ kid }) => there(kid)));
      for (const { kid } of off) { gone(kid); yield* wait(0.35); }
      yield* until(() => there(o1));
      gone(o1);
      yield* wait(0.6);
      // and away, lights going
      yield* away(p1);
      done?.();
    }
    let busy = null;
    // Start it now if the start of the lane is clear: nothing on the first
    // stretch of road, and nothing about to come round the end to come in
    // between the kids and the police. One kid or two, a different look each.
    const pullOver = (done) => {
      if ((busy && !busy.done) || !running) return false;
      if (l.cars.some((c) => !c.aside && (c.s < 1.2 || c.s > l.len - 1.5))) return false;
      const looks = K.kids.slice().sort(() => Math.random() - 0.5), n = Math.random() < 0.5 ? 1 : 2;
      const kids = Array.from({ length: n }, (_, i) => {
        const v = spawn(K.lane, "#bike-e", -0.4 * i, { len: 0.24, speed: 1.3, force: true });
        v.el.setAttribute("style", looks[i]);
        mk("use", { href: "#rider-e" }, v.el);
        return v;
      });
      busy = go(story(kids, done));
      return true;
    };
    return { run, lanes: L, spawn, despawn, clear, pullOver };
  };
})();
