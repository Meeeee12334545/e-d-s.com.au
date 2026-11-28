// The sound of the city's storm: wind, rain and thunder, made in the browser
// with Web Audio, so there is no file to download. No audio context exists and
// nothing is made until a visitor sends a storm, so a visitor who doesn't is
// never asked to pay for any of it, and browsers only allow sound after a click
// anyway.
//
// The rain is four loops (a hiss, a body of pink noise, and two layers of
// separate drops, fine ones and heavy ones landing on roofs) under a filter that
// opens as the rain gets heavier, so it arrives from a distance. city-weather.js
// reports how hard it is raining as it paints, so what you hear is what is
// falling, squalls included. The wind is noise through two moving filters, a
// broad rush and a thin howl. It comes up at the click, with a far-off roll of
// thunder, because the rain takes a few seconds to build.
//
// Thunder follows the lightning: city-weather.js says what flashed and where,
// and the sound comes from that side of the stage. A bolt is close, with a crack
// timed to its bright return stroke and then a long roll; lightning inside the
// cloud is further off, so it comes later, lower and softer. Small speakers can't
// play the deepest part of it, so each peal is gently saturated, which gives them
// harmonics they can play. After the rain stops the roofs drip for a while.
//
// city.js starts and ends it and silences it whenever the storm itself is paused
// (the stage off screen or the tab hidden); the context is suspended whenever
// nothing is playing. Muting lasts for the visit and isn't stored anywhere.
(() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const rnd = Math.random, range = (a, b) => a + (b - a) * rnd();
  const dB = (d) => Math.pow(10, d / 20);
  const later = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 250 }) : setTimeout(fn, 60));

  // a quick source of noise, -1 to 1: making the buffers calls this millions of times
  let seed = ((rnd() * 0x7fffffff) | 0) || 1;
  const white = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed / 2147483648; };

  /* ---- the looping beds ---- */
  const fillWhite = (out) => { for (let i = 0; i < out.length; i++) out[i] = white(); };
  const fillPink = (out) => {
    let a = 0, b = 0, c = 0;
    for (let i = 0; i < out.length; i++) {
      const w = white();
      a = 0.99765 * a + w * 0.099046; b = 0.963 * b + w * 0.2965164; c = 0.57 * c + w * 1.0526913;
      out[i] = a + b + c + w * 0.1848;
    }
  };
  // Separate drops: scattered impulses, most of them faint, each ringing a
  // resonant filter that is retuned for the next one. Each is scaled to its
  // filter so that a high drop is no louder than a low one, which keeps the top
  // end from crackling.
  const fillDrops = (perSecond, lo, hi, q) => (out, rate) => {
    const p = (2 * perSecond) / rate - 1, damp = 1 / q;
    let low = 0, band = 0, f = 2 * Math.sin((Math.PI * lo) / rate);
    for (let i = 0; i < out.length; i++) {
      let x = 0;
      if (white() < p) {
        const a = white(), u = (white() + 1) / 2;
        f = 2 * Math.sin((Math.PI * lo * Math.pow(hi / lo, u)) / rate);
        x = (a * Math.abs(a)) / f;
      }
      low += f * band;
      band += f * (x - low - damp * band);
      out[i] = band;
    }
  };
  // A stereo loop at a common loudness (an RMS of 1), so the levels below read
  // as the level each layer plays at, before its filter: each channel is made a little too long and the extra is crossfaded into
  // its start, so there is no seam to hear.
  function loopOf(ac, secs, rate, fill) {
    const r = rate || ac.sampleRate, n = Math.round(secs * r), x = Math.round(0.08 * r), b = ac.createBuffer(2, n, r), raw = new Float32Array(n + x);
    for (let ch = 0; ch < 2; ch++) {
      fill(raw, r);
      const out = b.getChannelData(ch);
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const v = i < x ? raw[i] * Math.sqrt(i / x) + raw[n + i] * Math.sqrt(1 - i / x) : raw[i];
        out[i] = v; sum += v * v;
      }
      const g = 1 / (Math.sqrt(sum / n) || 1);
      for (let i = 0; i < n; i++) out[i] *= g;
    }
    return b;
  }
  // lengths differ so no two loops line up the same way twice; a rate of 0 is
  // the context's own, for the layers with the most top end
  const RAIN = {
    hiss: { secs: 3.7, rate: 0, fill: fillWhite, filter: ["highpass", 3500], level: -27 },
    body: { secs: 4.3, rate: 22050, fill: fillPink, filter: ["bandpass", 1300], level: -25 },
    fine: { secs: 6.1, rate: 0, fill: fillDrops(1100, 1200, 6500, 12), filter: ["highpass", 1000], level: -25 },
    heavy: { secs: 7.7, rate: 22050, fill: fillDrops(90, 350, 1500, 14), filter: ["highpass", 180], level: -32 },
  };

  /* ---- thunder ---- */
  // One peal after another, each swelling and falling at its own place across
  // the sky, shaping low-passed noise whose top end dies away as it rolls off.
  function thunder(ac, o) {
    const rate = o.rate, n = Math.round(o.dur * rate), b = ac.createBuffer(2, n, rate);
    const bang = o.crack ? Math.round(0.07 * rate) : 0;
    const peals = [];
    if (o.boom) peals.push({ i: bang, a: o.boom, pan: 0 });
    for (let k = 0; k < o.peals; k++) {
      const at = 0.15 + (o.dur * 0.72 - 0.15) * Math.pow(rnd(), 1.5);
      peals.push({ i: Math.round(at * rate), a: range(0.25, 0.8) * Math.pow(1 - at / o.dur, 1.4), pan: range(-1, 1) });
    }
    peals.sort((p, q) => p.i - q.i);
    const rise = 1 - Math.exp(-1 / (o.rise * rate)), fall = Math.exp(-1 / (o.fall * rate));
    const c0 = 1 - Math.exp((-2 * Math.PI * o.hi) / rate), glide = Math.pow(o.lo / o.hi, 1 / n), dcc = 1 - Math.exp((-2 * Math.PI * 28) / rate);
    let peak = 0;
    for (let ch = 0; ch < 2; ch++) {
      const out = b.getChannelData(ch), side = ch ? 1 : -1;
      let swell = 0, env = 0, lp1 = 0, lp2 = 0, dc = 0, c = c0, next = 0;
      for (let i = 0; i < n; i++) {
        while (next < peals.length && peals[next].i <= i) { const p = peals[next++]; swell += p.a * (1 + side * p.pan * 0.6); }
        swell *= fall; env += (swell - env) * rise;
        lp1 += c * (white() - lp1); lp2 += c * (lp1 - lp2); c *= glide;
        dc += dcc * (lp2 - dc);
        out[i] = env * (lp2 - dc);
      }
      // a low-passed noise is much quieter than its source, so even the crack
      // is scaled to the roll before they are added
      for (let i = 0; i < n; i++) { const a = Math.abs(out[i]); if (a > peak) peak = a; }
    }
    const lift = o.drive / (peak || 1), top = o.drive / (1 + o.drive);
    for (let ch = 0; ch < 2; ch++) {
      const out = b.getChannelData(ch);
      if (o.crack) addCrack(out, rate, bang, o.crack * (peak || 1));
      for (let i = 0; i < n; i++) {
        const v = out[i] * lift;
        // the soft saturation, and a fade so the tail never ends in a step
        out[i] = (v / (1 + Math.abs(v))) / top * Math.min(1, (n - i) / (0.6 * rate));
      }
    }
    return b;
  }
  // The strike itself: a short tearing sound, the bang, and a few echoes off
  // the buildings, with the very top and bottom taken off.
  const SPIKES = [[0, 1, 0.012], [0.014, 0.7, 0.02], [0.04, 0.5, 0.03], [0.09, 0.35, 0.05], [0.17, 0.2, 0.07]];
  function addCrack(out, rate, bang, gain) {
    const n = Math.min(out.length, Math.round(0.5 * rate)), tb = bang / rate;
    let lp = 0, slow = 0;
    for (let i = 0; i < n; i++) {
      const t = i / rate, a = t - tb;
      let e = t < tb ? 0.16 * (t / tb) * (t / tb) : 0;
      if (a >= 0) for (const [t0, s, tau] of SPIKES) if (a >= t0) e += s * Math.exp(-(a - t0) / tau);
      lp += 0.45 * (white() - lp); slow += 0.03 * (lp - slow);
      out[i] += gain * e * (lp - slow);
    }
  }
  const THUNDER = {
    bolt: [
      { rate: 44100, dur: 6.5, peals: 12, hi: 900, lo: 110, rise: 0.012, fall: 0.45, crack: 1.5, boom: 1.8, drive: 1.8 },
      { rate: 44100, dur: 5.5, peals: 10, hi: 700, lo: 100, rise: 0.02, fall: 0.5, crack: 0.8, boom: 1.4, drive: 1.8 },
    ],
    crawl: [
      { rate: 22050, dur: 5, peals: 14, hi: 420, lo: 85, rise: 0.06, fall: 0.55, drive: 1.6 },
      { rate: 22050, dur: 4.2, peals: 11, hi: 480, lo: 90, rise: 0.05, fall: 0.45, drive: 1.6 },
    ],
    sheet: [
      { rate: 22050, dur: 3.6, peals: 6, hi: 360, lo: 80, rise: 0.09, fall: 0.55, drive: 1.6 },
      { rate: 22050, dur: 4.2, peals: 8, hi: 300, lo: 75, rise: 0.08, fall: 0.6, drive: 1.4 },
    ],
  };
  // how loud each is and how long after its flash; a bolt always sounds, but the
  // lightning inside the cloud gives way once this many are rolling
  const VOICE = { bolt: { level: -5, delay: [0.02, 0.5] }, crawl: { level: -13, delay: [0.6, 1.3] }, sheet: { level: -18, delay: [1, 2.2] }, opening: { level: -11, delay: [0.02, 0.02], from: "sheet" } };
  const MAX_VOICES = 3;

  window.CitySound = () => {
    let ac = null, fade, rainBus, rainTone, windBus, windGusts;
    let playing = false, storm = false, muted = false, shown = true, struck = false, quiet = 0, opener = 0, nextMix = 0;
    const buffers = {}, inputs = {}, pool = { bolt: [], crawl: [], sheet: [] }, jobs = [], running = new Set(), voices = new Set();
    const noop = () => {};

    const fadeTo = (v, secs) => { const t = ac.currentTime, g = fade.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + secs); };
    const filterOf = (type, freq, q = 0.5) => { const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; };
    const gainOf = (v) => { const g = ac.createGain(); g.gain.value = v; return g; };
    const place = (node, pan) => {
      if (!ac.createStereoPanner) { node.connect(fade); return; }
      const p = ac.createStereoPanner(); p.pan.value = pan; node.connect(p); p.connect(fade);
    };
    const held = (node) => { running.add(node); return node; };
    function loopInto(buffer, into, offset = 0) {
      const s = held(ac.createBufferSource());
      s.buffer = buffer; s.loop = true; s.connect(into); s.start(0, offset * buffer.duration);
    }
    // a slow wobble on a setting, running only while the storm sounds
    function wobble(param, hz, depth) {
      const o = held(ac.createOscillator()), g = gainOf(depth);
      o.frequency.value = hz; o.connect(g); g.connect(param); o.start();
    }

    /* ---- the graph, and the beds as they are ready ---- */
    function bedOf(name) {
      const r = RAIN[name], out = filterOf(r.filter[0], r.filter[1]), g = gainOf(dB(r.level));
      out.connect(g); g.connect(rainBus);
      return out;
    }
    function boot() {
      ac = new AC({ latencyHint: "playback" });
      fade = gainOf(0);
      const trim = gainOf(dB(-3)), limit = ac.createDynamicsCompressor();
      limit.threshold.value = -8; limit.knee.value = 6; limit.ratio.value = 12; limit.attack.value = 0.003; limit.release.value = 0.25;
      fade.connect(trim); trim.connect(limit); limit.connect(ac.destination);
      rainBus = gainOf(0); rainTone = filterOf("lowpass", 1600, 0.3);
      rainBus.connect(rainTone); rainTone.connect(fade);
      windBus = gainOf(0); windGusts = gainOf(0.8);
      windGusts.connect(windBus); windBus.connect(fade);
      for (const name of Object.keys(RAIN)) inputs[name] = bedOf(name);
      // the wind and one far roll are needed at the click; the rest can wait,
      // since the rain takes seconds to build and the first flash is later still
      buffers.wind = loopOf(ac, 6.7, 22050, fillPink);
      pool.sheet.push(thunder(ac, THUNDER.sheet[0]));
      for (const [name, r] of Object.entries(RAIN)) jobs.push(() => { buffers[name] = loopOf(ac, r.secs, r.rate, r.fill); if (playing) loopInto(buffers[name], inputs[name], rnd()); });
      jobs.push(() => pool.bolt.push(thunder(ac, THUNDER.bolt[0])), () => pool.crawl.push(thunder(ac, THUNDER.crawl[0])), () => pool.sheet.push(thunder(ac, THUNDER.sheet[1])), () => pool.bolt.push(thunder(ac, THUNDER.bolt[1])), () => pool.crawl.push(thunder(ac, THUNDER.crawl[1])));
      const pump = () => { const job = jobs.shift(); if (!job) return; job(); later(pump); };
      later(pump);
    }
    function startBeds() {
      playing = true;
      for (const name of Object.keys(RAIN)) if (buffers[name]) loopInto(buffers[name], inputs[name], rnd());
      // the wind: a broad rush and a thin howl, both wandering
      const rush = filterOf("bandpass", 300, 0.8), howl = filterOf("bandpass", 620, 5), rushG = gainOf(dB(-19)), howlG = gainOf(dB(-20));
      rush.connect(rushG); rushG.connect(windGusts); howl.connect(howlG); howlG.connect(windGusts);
      loopInto(buffers.wind, rush, rnd()); loopInto(buffers.wind, howl, rnd());
      wobble(rush.frequency, 0.11, 110); wobble(howl.frequency, 0.23, 240); wobble(windGusts.gain, 0.37, 0.2);
      windBus.gain.setTargetAtTime(0.6, ac.currentTime, 0.5);
    }
    function stopAll() {
      playing = false; nextMix = 0;
      for (const n of [...running, ...voices]) { try { n.stop(); } catch {} try { n.disconnect(); } catch {} }
      running.clear(); voices.clear();
      const t = ac.currentTime;
      for (const p of [rainBus.gain, windBus.gain]) { p.cancelScheduledValues(t); p.setValueAtTime(0, t); }
      rainTone.frequency.cancelScheduledValues(t); rainTone.frequency.setValueAtTime(1600, t);
    }

    /* ---- what the storm does ---- */
    // Sound up if there should be any. If not, it fades out and the context rests;
    // the sources are let go too, unless the storm is only out of sight for now.
    // A failure here costs the storm its sound, never the storm itself.
    function settle(secs) {
      if (!ac && (!storm || muted)) return;
      try {
        // made and resumed in the click, even off screen: Safari only unlocks it then
        if (!ac) { boot(); ac.resume()?.catch?.(noop); }
        clearTimeout(quiet);
        if (storm && !muted && shown) {
          ac.resume()?.catch?.(noop);
          if (!playing) startBeds();
          fadeTo(1, secs);
        } else {
          fadeTo(0, secs);
          quiet = setTimeout(() => { if (playing && (!storm || muted)) stopAll(); ac.suspend()?.catch?.(noop); }, secs * 1000 + 80);
        }
      } catch {}
    }
    function drip() {
      const t = ac.currentTime + rnd() * 0.1, o = ac.createOscillator(), g = gainOf(0), f = range(900, 2400);
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.04);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(dB(-30) * range(0.4, 1), t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(g); place(g, range(-0.8, 0.8)); o.start(t); o.stop(t + 0.1);
    }
    function flash(kind, x = 0) {
      if (!playing || (kind !== "bolt" && voices.size >= MAX_VOICES)) return;
      const v = VOICE[kind], set = pool[v.from || kind];
      if (!set.length) return;
      // the first bolt of a storm finds the tallest mast, so it is the sharpest
      const first = kind === "bolt" && !struck;
      if (kind === "bolt") struck = true;
      const near = first ? 1 : rnd(), wait = first ? v.delay[0] : range(v.delay[0], v.delay[1]);
      const s = ac.createBufferSource(), g = gainOf(dB(v.level) * (kind === "bolt" ? 0.65 + 0.35 * near : range(0.75, 1)));
      s.buffer = first ? set[0] : set[(rnd() * set.length) | 0];
      s.playbackRate.value = first ? 1 : range(0.88, 1.08);
      s.connect(g); place(g, Math.max(-1, Math.min(1, x)) * 0.7);
      s.onended = () => { voices.delete(s); try { g.disconnect(); } catch {} };
      voices.add(s);
      s.start(ac.currentTime + wait);
    }

    return {
      // Called from the visitor's click, which is what lets a browser play it.
      // Making an audio context can hold the page for a fifth of a second, so it
      // waits for the click's first paint; browsers allow a sound to start that
      // soon after a click.
      start() {
        storm = true; struck = false;
        clearTimeout(opener);
        opener = setTimeout(() => {
          if (!storm) return;
          settle(0.15);
          if (playing) flash("opening", range(-0.5, 0.5));
        }, 40);
      },
      end(cancelled) { storm = false; settle(cancelled ? 0.35 : 2.5); },
      run(onScreen) { shown = onScreen; settle(0.25); },
      // how hard it rains, the gusts, how much cloud and how wet it is, each 0 to about 1
      weather(rain, gust, cloud, wet) {
        if (!playing) return;
        const t = ac.currentTime;
        if (t < nextMix) return;
        nextMix = t + 0.12;
        rainBus.gain.setTargetAtTime(Math.pow(rain, 1.25) * (0.72 + 0.28 * gust), t, 0.25);
        rainTone.frequency.setTargetAtTime(1600 + 9500 * rain * rain, t, 0.4);
        windBus.gain.setTargetAtTime(Math.max(0.6 * cloud, rain) * (0.45 + 0.55 * gust), t, 0.5);
        if (rain < 0.4 && wet > 0.03 && rnd() < 0.55 * wet * (1 - rain / 0.4)) drip();
      },
      flash,
      // flips the mute and says whether it is now muted
      toggle() { muted = !muted; settle(0.2); return muted; },
    };
  };
})();
