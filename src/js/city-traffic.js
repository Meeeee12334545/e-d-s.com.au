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
      L[id] = { id, from: l.from, ax, sign, len, far: l.far, near: l.near, road: l.road, stops: l.stops.map(([c, node, axis]) => ({ s: (c - l.from[ax]) * sign, node, axis })), cars: [] };
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
        slot = document.createElementNS(ns, "g"); slot.setAttribute("class", "veh-slot"); seat(slot, l.far);
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
    //
    // Where a vehicle is, in tiles: along its lane and across it toward the
    // kerb (`side`), or, coming round a corner into the lane (`arc`), on the
    // arc. A vehicle that turns faces its new way halfway round.
    const pos = (l, v) => {
      const a = v.arc;
      if (a && v.s < a.s0 + a.len) { const th = a.a0 + a.da * Math.max(0, (v.s - a.s0) / a.len); return [a.c[0] + a.r * Math.cos(th), a.c[1] + a.r * Math.sin(th)]; }
      const p = [l.from[0], l.from[1]];
      p[l.ax] += l.sign * v.s;
      if (v.side) p[1 - l.ax] += (l.ax ? l.sign : -l.sign) * v.side;
      return p;
    };
    const face = (v, dir) => { for (const u of v.el.querySelectorAll("use")) u.setAttribute("href", u.getAttribute("href").replace(/-[ewns]$/, `-${dir}`)); };
    // into a group of traffic, under anything pulled over at the near kerb
    const seat = (slot, g) => g.insertBefore(slot, slot.classList.contains("kerb-near") ? null : g.querySelector(":scope > .kerb-near"));
    const put = (l, v) => {
      const p = pos(l, v), a = v.arc;
      if (a && !a.faced && v.s >= a.s0 + a.len / 2) { a.faced = true; face(v, a.dir); }
      if (a && v.s >= a.s0 + a.len) v.arc = null;
      const [px, py] = P(p[0], p[1]);
      v.el.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
      if (!v.slot) return;
      const r = roads[l.road], k = Math.max(0, Math.min(r.n - 1, Math.floor((p[l.ax] - r.from) / span)));
      if (v.k !== k) { v.k = k; v.slot.setAttribute("clip-path", `url(#clip-${l.road}-${k})`); }
      if (l.near) { const near = p[1] > 5; if (v.near !== near) { v.near = near; seat(v.slot, near ? l.near : l.far); } }
    };
    // in tiles a second: how hard a vehicle pulls away and eases off, and
    // the speed from which a distance is enough to stop in comfortably
    const ACC = 0.9, TRAM_ACC = 0.4, BRAKE = 0.75, EASE = 1.8, GAP = 0.14;
    const reach = (dist) => Math.sqrt(2 * BRAKE * Math.max(0, dist));
    let time = 0, last = 0, raf = 0, running = false;
    // what else runs with the traffic, each frame before it moves (the police)
    const hooks = [];
    // A chase (`chase` on the vehicles in it) has right of way: the traffic
    // holds back at a junction it is near (`yieldAt`, set each frame by the
    // police below) whatever the lights say, and the chase runs the lights
    // but waits while anything else is still in the junction. A vehicle with
    // a `route` goes on from lane to lane (onward, below), and one that
    // `follows` another keeps its distance round the corners as well.
    const NODES = { A: [5, 5], B: [10, 5] }, yieldAt = { A: false, B: false };
    const inJunction = (node, l, c) => {
      const [x, y] = pos(l, c), [cx, cy] = NODES[node], h = c.len / 2;
      // (the crossing itself, inside the kerbs: a vehicle waiting at its stop line is not in it)
      return Math.abs((l.ax ? y : x) - (l.ax ? cy : cx)) < 0.3 + h && Math.abs((l.ax ? x : y) - (l.ax ? cx : cy)) < 0.38;
    };
    let occupied = {};
    const busyAt = (node, storm) => (occupied[node] ??= Object.values(L).some((l) => l.cars.some((c) => !c.chase && !c.aside && !(c.patrol && !storm) && inJunction(node, l, c))));
    function frame(now) {
      if (!running) { raf = 0; return; }
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now; time += dt;
      for (const h of hooks) h(dt);
      occupied = {};
      const onward = [];
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
            // (one on a route leaves at the end of the lane, so nothing round the end is ahead of it)
            if (lead !== v && !by(lead) && !(v.route && j <= i)) {
              let gap = lead.s - v.s;
              if (j <= i) gap += l.len;
              target = Math.min(target, reach(gap - lead.len / 2 - v.len / 2 - GAP));
            }
            if (v.hold != null) target = Math.min(target, reach(v.hold - v.s));
            if (v.follows) target = Math.min(target, reach(v.follows.dist - v.dist - v.follows.len / 2 - v.len / 2 - GAP));
            // the signals ahead
            const nose = v.s + v.len / 2;
            for (const st of l.stops) {
              const d = st.s - nose;
              if (d < -0.02) { if (v.pass === st) v.pass = null; continue; }
              if (v.pass === st) continue;
              if (v.chase) { if (d < 1.2 && busyAt(st.node, storm)) target = Math.min(target, reach(d)); continue; }
              const k = yieldAt[st.node] ? "r" : lit[st.node][st.axis];
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
          if (v.dist != null) v.dist += v.v * dt;
          if (v.route) { onward.push([l, v]); put(l, v); continue; }
          if (v.s > l.len) { if (v.once) v.done = true; else { v.s -= l.len; v.pass = null; v.braking = null; } }
          put(l, v);
        }
      }
      onward.sort((a, b) => b[1].dist - a[1].dist);
      for (const [l, v] of onward) onto(l, v);
      raf = requestAnimationFrame(frame);
    }
    // From lane to lane along a route. Into a lane at right angles it turns
    // left round the corner, on an arc of radius TURN from where the two lanes
    // cross; into one running back the other way it turns round out of sight,
    // beyond the end of the lane, once the start of the other is clear.
    const TURN = 0.25;
    const dirOf = (l) => (l.ax ? (l.sign > 0 ? "s" : "n") : (l.sign > 0 ? "e" : "w"));
    const legs = (ids) => ids.slice(0, -1).map((id, i) => {
      const a = L[id], b = L[ids[i + 1]];
      if (a.ax === b.ax) return { next: b.id };
      const X = [0, 0], ha = [0, 0], hb = [0, 0];
      X[a.ax] = b.from[a.ax]; X[b.ax] = a.from[b.ax]; ha[a.ax] = a.sign; hb[b.ax] = b.sign;
      const start = [X[0] - ha[0] * TURN, X[1] - ha[1] * TURN], end = [X[0] + hb[0] * TURN, X[1] + hb[1] * TURN], c = [start[0] + ha[1] * TURN, start[1] - ha[0] * TURN];
      const a0 = Math.atan2(start[1] - c[1], start[0] - c[0]), a1 = Math.atan2(end[1] - c[1], end[0] - c[0]);
      const da = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0)), len = TURN * Math.abs(da), sIn = (end[b.ax] - b.from[b.ax]) * b.sign;
      return { next: b.id, out: (start[a.ax] - a.from[a.ax]) * a.sign, arc: { c, r: TURN, a0, da, len, s0: sIn - len, dir: dirOf(b) } };
    });
    const onto = (l, v) => {
      const leg = v.route[v.leg];
      // (never ahead of the one it follows: that one goes on first)
      if (!leg || (v.follows?.route && v.follows.leg <= v.leg)) return;
      const b = L[leg.next];
      let s;
      if (leg.arc) { if (v.s < leg.out) return; s = leg.arc.s0 + (v.s - leg.out); }
      else {
        if (v.s < l.len) return;
        // (clear at the start, and nothing about to come round the end of that lane onto it)
        if (!clear(b.id, 0, 0.55) || b.cars.some((c) => !c.patrol && c.s > b.len - 0.6)) { v.hold = l.len; return; }
        v.hold = null; s = 0;
      }
      l.cars.splice(l.cars.indexOf(v), 1); b.cars.push(v);
      Object.assign(v, { lane: b.id, s, arc: leg.arc ? { ...leg.arc } : null, pass: null, braking: null, k: undefined, near: undefined });
      v.leg++;
      seat(v.slot, b.far);
      if (!leg.arc) face(v, dirOf(b));
      put(b, v);
    };
    // everything in place before the first frame, so nothing is seen to jump
    for (const l of Object.values(L)) for (const v of l.cars) put(l, v);
    const run = (on) => {
      running = on;
      if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };

    /* ---- the police chase kids on e-bikes ---- */
    // One or two kids burst in from the front of the city with a police car
    // behind them, lights going, and lead it round the city (city-scene.js,
    // CHASE): left onto the main road, left down the other side road, off
    // the front edge and back up, left onto the main road again, off the
    // west edge and back. The traffic pulls over to let them through and
    // holds back at the junctions. A police helicopter joins in and follows
    // them with its searchlight. Back on the main road they give up and pull
    // over onto the far footpath (KERB). An officer walks up to the kids and
    // radios in; a second car comes towing a trailer and pulls in ahead of
    // them. The kids get off, the officers wheel the bikes up the ramp onto
    // the trailer, and it drives off with them. Once it is on its way the
    // kids are handcuffed and walked back to the first car, and get in the
    // back (they can be seen through its side windows). The helicopter hovers
    // over it all, and when the police pull out and drive the kids away,
    // lights still going, it follows them a moment and then flies off.
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
    const stop = (t) => { const i = threads.indexOf(t); if (i >= 0) threads.splice(i, 1); t.done = true; };
    // Each frame while a chase is on: the junctions it is near hold their
    // traffic back, and anything in its lane not far ahead of it pulls over to
    // the kerb (giveWay) until it has gone by.
    hooks.push(() => {
      yieldAt.A = yieldAt.B = false;
      for (const ln of Object.values(L)) for (const v of ln.cars) {
        if (!v.chase) continue;
        const [x, y] = pos(ln, v);
        for (const [node, [cx, cy]] of Object.entries(NODES)) if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) < 2.4) yieldAt[node] = true;
        for (const c of ln.cars) if (!c.chase && !c.yielding && !c.aside && !c.tram && !c.patrol && c.slot && c.s > v.s && c.s - v.s < 1.5 && canYield(ln, c)) go(giveWay(ln, c));
      }
    });
    // Not in a junction, and not on its way into one: what is driving into a
    // junction goes on through it, and what waits at the line pulls over there.
    const canYield = (ln, c) => {
      if (inJunction("A", ln, c) || inJunction("B", ln, c)) return false;
      if (c.v > 0.3) for (const st of ln.stops) { const d = st.s - c.s - c.len / 2; if (d > -0.02 && d < 1) return false; }
      return true;
    };
    // Over to the kerb on the driver's left, and stopped, until the chase has
    // gone by; then back out once there is a gap. At the kerb it paints under
    // the lane's traffic on the far side of a road and over it on the near.
    function* giveWay(ln, c) {
      // (far enough over for a police car to pass: a bike a little, a van or truck a little more than a car)
      const k = c.len < 0.25 ? 0.12 : c.len < 0.35 ? 0.17 : 0.19, near = (ln.ax ? ln.sign : -ln.sign) > 0;
      c.yielding = true; c.side ||= 0;
      c.hold = c.s + 0.1 + c.v * c.v / (2 * BRAKE);
      for (let t = 0; c.side < k;) {
        t += yield;
        c.side = Math.min(k, k * t / 0.6);
        if (!c.aside && c.side > 0.9 * k) {
          c.aside = true; c.hold = Math.min(c.hold, c.s + 0.05);
          const g = c.slot.parentNode;
          if (near) { c.slot.classList.add("kerb-near"); g.appendChild(c.slot); } else g.insertBefore(c.slot, g.querySelector(":scope > .veh-slot"));
        }
      }
      yield* wait(0.5);
      yield* until(() => ln.cars.every((o) => !o.chase || o.s > c.s + 0.6));
      yield* until(() => ln.cars.every((o) => o === c || o.aside || o.s > c.s + 0.45 || o.s < c.s - 1.2));
      c.aside = false; c.hold = null;
      if (near) { c.slot.classList.remove("kerb-near"); seat(c.slot, c.slot.parentNode); }
      for (let t = 0, s0 = c.side; c.side > 0;) { t += yield; c.side = Math.max(0, s0 * (1 - t / 0.7)); }
      c.yielding = false;
    }
    // The helicopter flies in from beyond the right of the city and hovers a
    // little behind and north-west of whatever it is following (`follow`, a
    // point in tiles), easing after it, with its searchlight on it once it is
    // close. `leaving` sends it off the way it came. ALT is its height.
    const H = sc.traffic.heli, ALT = 64;
    function* fly(h) {
      const shadow = mk("ellipse", { class: "heli-shadow", rx: 10, ry: 4.4 }, H.ground), spot = mk("ellipse", { class: "heli-spot", rx: 10, ry: 5, "fill-opacity": 0 }, H.ground);
      const beam = mk("polygon", { class: "heli-beam", "fill-opacity": 0 }, H.air), body = mk("g", { class: "heli-body" }, H.air);
      const craft = mk("use", { href: "#heli" }, body), blades = mk("path", { class: "heli-blades" }, body);
      body.insertBefore(mk("ellipse", { class: "heli-disc", cx: 0, cy: -8.9, rx: 15, ry: 7.5 }), blades);
      for (;;) {
        const dt = yield;
        // it stays over the city: while what it follows is off the edge, it waits at the edge with its light off
        if (!h.leaving) { const [fx, fy] = h.follow(); h.over = fx > -0.5 && fx < 15.5 && fy > -0.5 && fy < 10.5; h.last = [Math.max(-0.4, Math.min(15.4, fx)), Math.max(-0.4, Math.min(10.4, fy))]; }
        const [tx, ty] = h.last, [wx, wy] = h.leaving ? [19, -7] : [tx - 0.5, ty - 0.7], dx = wx - h.x, dy = wy - h.y;
        h.vx += (dx * 2.2 - h.vx * 2.4) * dt; h.vy += (dy * 2.2 - h.vy * 2.4) * dt;
        const sp = Math.hypot(h.vx, h.vy), max = h.leaving ? 4 : 3.2;
        if (sp > max) { h.vx *= max / sp; h.vy *= max / sp; }
        h.x += h.vx * dt; h.y += h.vy * dt; h.th += 31 * dt;
        h.light = unit(h.light + (!h.leaving && h.over && Math.hypot(dx, dy) < 2.5 ? 1.2 : -2) * dt);
        const [gx, gy] = P(h.x, h.y), ay = gy - ALT, vs = (h.vx - h.vy) * 28;
        if (vs > 6) h.face = 1; else if (vs < -6) h.face = -1;
        shadow.setAttribute("cx", gx.toFixed(1)); shadow.setAttribute("cy", gy.toFixed(1));
        body.setAttribute("transform", `translate(${gx.toFixed(1)} ${ay.toFixed(1)})`);
        craft.setAttribute("transform", `rotate(${Math.max(-12, Math.min(12, vs * 0.12)).toFixed(1)}) scale(${h.face} 1)`);
        const c = Math.cos(h.th), sn = Math.sin(h.th), q = (n) => n.toFixed(1);
        blades.setAttribute("d", `M${q(-15 * c)} ${q(-8.9 - 7.5 * sn)}L${q(15 * c)} ${q(-8.9 + 7.5 * sn)}M${q(15 * sn)} ${q(-8.9 - 7.5 * c)}L${q(-15 * sn)} ${q(-8.9 + 7.5 * c)}`);
        const [sx, sy] = P(tx, ty), bx = gx + 5.4 * h.face, by = ay + 3.4;
        spot.setAttribute("cx", q(sx)); spot.setAttribute("cy", q(sy)); spot.setAttribute("fill-opacity", h.light.toFixed(2));
        beam.setAttribute("points", `${q(bx - 1)},${q(by)} ${q(bx + 1)},${q(by)} ${q(sx + 9)},${q(sy)} ${q(sx - 9)},${q(sy)}`);
        beam.setAttribute("fill-opacity", h.light.toFixed(2));
        if (h.leaving && (ay < -120 || gx > 520 || gx < -380)) { [shadow, spot, beam, body].forEach((n) => n.remove()); return; }
      }
    }
    const chopper = (follow) => { const h = { x: 17, y: -4, vx: -2, vy: 0.6, th: 0, light: 0, face: -1, follow, leaving: false }; go(fly(h)); return h; };
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
    // Someone aboard a police car, seen through its side windows: a kid in
    // the back, in their own --helmet or --hair, or an officer in front, in
    // the cap. `u` is how far along the car from its middle, in tiles.
    const aboard = (v, u, style) => {
      const g = mk("g", { class: "aboard", style }, v.el), [px, py] = P(u, 0.045, 3.25), cap = !style;
      mk("circle", { cx: px.toFixed(2), cy: py.toFixed(2), r: 0.75, style: cap ? "fill:var(--skin, #ffe3b3)" : "fill:var(--helmet, var(--skin, #ffe3b3))" }, g);
      mk("path", { d: `M${(px - 0.75).toFixed(2)} ${(py - 0.05).toFixed(2)}a.75 .75 0 0 1 1.5 0z`, style: cap ? "fill:#1c2b4a" : "fill:var(--hair, transparent)" }, g);
    };
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
    function* story(kids, p1, done) {
      // the chase: the helicopter joins in a few seconds after the police
      const all = [...kids, p1];
      yield* wait(3);
      const h = chopper(() => pos(L[kids[0].lane], kids[0]));
      // back on the main road heading east, each gives up and pulls over
      const parked = all.map((v, i) => go((function* () {
        yield* until(() => v.leg >= v.route.length);
        Object.assign(v, { chase: false, route: null, follows: null });
        yield* pull(v, i < kids.length ? K.at.kids[i] : K.at.p1, i < kids.length ? K.y.bike : K.y.car, i < kids.length ? 1.4 : 1.0);
      })()));
      // (and if anything ever holds it up for good, the chase is called off)
      for (let t = 0; !parked.every((p) => p.done); t += yield) if (t > 90) {
        parked.forEach(stop);
        for (const v of all) { v.chase = false; despawn(v); }
        h.leaving = true;
        done?.();
        return;
      }
      h.follow = () => [(K.at.kids[0] + K.at.kids[kids.length - 1]) / 2, K.y.bike];
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
      h.follow = () => [off[0].kid.x, off[0].kid.y];
      const slots = kids.length === 2 ? [K.y.car - 0.035, K.y.car + 0.035] : [K.y.car];
      const loading = [go(load(o2, off[0].bike, p2, car, slots[0]))];
      if (off[1]) { yield* wait(0.8); loading.push(go(load(o1, off[1].bike, p2, car, slots[1]))); }
      yield* until(() => loading.every((t) => t.done));
      // the bikes go off on the trailer
      walkTo(o2, K.at.p2 + 0.12, K.y.cop);
      yield* until(() => there(o2));
      gone(o2); aboard(p2, TRAILER.car + 0.01);
      yield* wait(0.4);
      const towed = go(away(p2)), from = p2.s;
      // once the trailer is on its way, the kids are cuffed, one at a time
      for (let t = 0; !towed.done && p2.s < from + 1.2 && t < 6; t += yield);
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
      // into the back of the car, the officer in front, the helicopter overhead
      for (const [i, { kid }] of off.entries()) { gone(kid); aboard(p1, off.length === 2 ? -0.085 + i * 0.03 : -0.07, kid.g.getAttribute("style")); yield* wait(0.35); }
      h.follow = () => pos(l, p1);
      yield* until(() => there(o1));
      gone(o1); aboard(p1, 0.01);
      yield* wait(0.8);
      // and away with them, lights going; the helicopter sees them off, then goes
      const taken = go(away(p1));
      yield* until(() => taken.done || !p1.aside);
      yield* wait(2.5);
      h.leaving = true;
      yield* until(() => taken.done);
      done?.();
    }
    let busy = null;
    const ROUTE = legs(sc.traffic.chase);
    // Start it now if the start of the first lane is clear: nothing on the
    // first stretch of road, and nothing about to come round the end to come
    // in between the kids and the police. One kid or two, a different look
    // each, and each following the one ahead round the corners.
    const pullOver = (done) => {
      if ((busy && !busy.done) || !running) return false;
      const start = L[sc.traffic.chase[0]], d0 = dirOf(start);
      if (start.cars.some((c) => !c.aside && !c.patrol && (c.s < 1.4 || c.s > start.len - 1.5))) return false;
      const looks = K.kids.slice().sort(() => Math.random() - 0.5), n = Math.random() < 0.5 ? 1 : 2;
      const kids = Array.from({ length: n }, (_, i) => {
        const v = spawn(start.id, `#bike-${d0}`, -0.4 * i, { len: 0.24, speed: 1.65, force: true });
        v.el.setAttribute("style", looks[i]);
        mk("use", { href: `#rider-${d0}` }, v.el);
        return v;
      });
      const p1 = spawn(start.id, `#police-${d0}`, -0.4 * n - 0.05, { len: 0.3, speed: 1.7, force: true });
      p1.el.classList.add("cop", "lit");
      const all = [...kids, p1];
      all.forEach((v, i) => Object.assign(v, { route: ROUTE, leg: 0, chase: true, dist: v.s, follows: all[i - 1] || null }));
      busy = go(story(kids, p1, done));
      return true;
    };
    // (`where` gives a vehicle's place in tiles, for the check scripts)
    return { run, lanes: L, spawn, despawn, clear, pullOver, where: (v) => pos(L[v.lane], v) };
  };
})();
