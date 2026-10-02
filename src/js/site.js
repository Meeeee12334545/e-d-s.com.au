// Shared behaviour for every page: navigation, scroll
// reveals, counters, pointer effects and the flow-field canvas.
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---- header ---- */
  const header = $(".header");
  const progress = $(".progress");
  const onScroll = () => {
    header?.classList.toggle("scrolled", window.scrollY > 16);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.scale = `${max > 0 ? Math.min(1, window.scrollY / max) : 0} 1`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mega menus open on hover and on click, and close on Escape or outside
  // click. A menu opened by a click stays open when the pointer leaves, and a
  // click on a menu that hover has just opened keeps it open rather than
  // shutting it in the visitor's face.
  const items = $$(".nav-item.has-mega");
  const shut = (i) => { i.classList.remove("open"); delete i.dataset.by; $("button", i)?.setAttribute("aria-expanded", "false"); };
  const closeAll = (except) => items.forEach((i) => { if (i !== except) shut(i); });
  items.forEach((item) => {
    const btn = $("button", item);
    let timer;
    const open = (by) => { clearTimeout(timer); closeAll(item); item.classList.add("open"); item.dataset.by = by; btn.setAttribute("aria-expanded", "true"); };
    item.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && item.dataset.by !== "click") open("hover"); else clearTimeout(timer); });
    item.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && item.dataset.by === "hover") timer = setTimeout(() => shut(item), 140); });
    btn.addEventListener("click", () => (item.dataset.by === "click" ? shut(item) : open("click")));
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".nav-item")) closeAll(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeAll(); setDrawer(false); } });

  const drawer = $(".drawer");
  const burger = $(".burger");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    burger?.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $(".drawer-close", drawer)?.focus();
  }
  burger?.addEventListener("click", () => setDrawer(true));
  $$(".drawer-close, .drawer-scrim").forEach((b) => b.addEventListener("click", () => setDrawer(false)));

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      io.unobserve(en.target);
      if (en.target.matches("[data-count]")) count(en.target);
      $$("[data-count]", en.target).forEach(count);
    }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  $$("[data-reveal], [data-count]").forEach((el) => io.observe(el));

  /* ---- counters ---- */
  function count(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    const to = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const from = el.dataset.from ? parseFloat(el.dataset.from) : 0;
    const fmt = (v) => (el.dataset.plain ? v.toFixed(dec) : v.toLocaleString("en-AU", { minimumFractionDigits: dec, maximumFractionDigits: dec }));
    const t0 = performance.now(), dur = 1700;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(2, -10 * p);
      el.textContent = fmt(p === 1 ? to : from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---- pointer effects: spotlight, tilt, magnetic buttons ---- */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) {
    $$(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
        if (card.classList.contains("tilt")) {
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
        }
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
    $$("[data-magnetic]").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${((e.clientX - r.left) / r.width - 0.5) * 10}px ${((e.clientY - r.top) / r.height - 0.5) * 8}px`;
      });
      b.addEventListener("pointerleave", () => { b.style.translate = ""; });
    });
  }

  /* ---- product rail: drag to scroll + buttons ---- */
  $$(".rail").forEach((rail) => {
    let down = false, startX = 0, startL = 0, moved = 0;
    rail.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; startX = e.clientX; startL = rail.scrollLeft; moved = 0; });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      moved = e.clientX - startX;
      if (Math.abs(moved) > 5) rail.classList.add("dragging");
      rail.scrollLeft = startL - moved;
    });
    window.addEventListener("pointerup", () => { down = false; setTimeout(() => rail.classList.remove("dragging"), 0); });
    rail.addEventListener("dragstart", (e) => e.preventDefault());
    const step = () => ($(".brand-card", rail)?.offsetWidth || 320) + 18;
    $$(`[data-rail="${rail.id}"]`).forEach((b) =>
      b.addEventListener("click", () => rail.scrollBy({ left: step() * (b.dataset.dir === "prev" ? -1 : 1), behavior: "smooth" }))
    );
  });

  /* ---- timeline fill ---- */
  const tl = $(".timeline");
  if (tl) {
    const fill = $(".timeline-fill", tl);
    const upd = () => {
      const r = tl.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight * 0.6 - r.top) / r.height));
      fill.style.height = `${p * (r.height - 16)}px`;
    };
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  }

  /* ---- FlowSense tabs ---- */
  const fsItems = $$(".fs-item");
  if (fsItems.length) {
    let i = 0, auto = true;
    const show = (n) => {
      i = n;
      fsItems.forEach((b, k) => b.setAttribute("aria-selected", String(k === n)));
      $$(".fs-view").forEach((v, k) => v.classList.toggle("active", k === n));
    };
    fsItems.forEach((b, k) => {
      b.addEventListener("click", () => { auto = false; show(k); });
      b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { auto = false; show(k); } });
    });
    setInterval(() => { if (auto && !document.hidden) show((i + 1) % fsItems.length); }, 4200);
  }

  /* ---- contact + register forms: compose an email (no server needed) ---- */
  $$("form[data-mailto]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const lines = [];
      data.forEach((v, k) => { if (k !== "subject" && String(v).trim()) lines.push(`${k}: ${v}`); });
      const subject = data.get("subject") || form.dataset.subject || "Website enquiry";
      window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    });
  });

  /* ---- flow field: streamlines that part around the pointer ---- */
  function flowField(canvas) {
    const ctx = canvas.getContext("2d");
    const dense = canvas.dataset.flowfield === "dense";
    let w = 0, h = 0, dpr = 1, parts = [], raf = 0, visible = false, t = 0;
    const pointer = { x: -9999, y: -9999, active: false };
    const BG = "4, 21, 19";

    const spawn = (p, anywhere) => {
      p.x = anywhere ? Math.random() * w : -10;
      p.y = Math.random() * h;
      p.life = 120 + Math.random() * 260;
      p.speed = 0.6 + Math.random() * 1.3;
      p.hue = Math.random();
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.max(160, Math.min(dense ? 1100 : 700, (w * h) / (dense ? 1300 : 2200))));
      parts = Array.from({ length: n }, () => { const p = {}; spawn(p, true); return p; });
      ctx.fillStyle = `rgb(${BG})`; ctx.fillRect(0, 0, w, h);
    };
    const step = () => {
      t += 1;
      ctx.fillStyle = `rgba(${BG}, .07)`; ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 1.1;
      ctx.lineCap = "round";
      for (const p of parts) {
        const a = Math.sin(p.x * 0.0023 + t * 0.0016) * 1.1 + Math.cos(p.y * 0.0036 - t * 0.0021) * 0.9 + Math.sin((p.x + p.y) * 0.0013) * 0.6;
        let vx = (0.9 + Math.cos(a) * 0.75) * p.speed, vy = Math.sin(a) * 0.8 * p.speed;
        if (pointer.active) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy, R = 170;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 3.2;
            // push out and swirl, like water passing an obstruction
            vx += (dx / d) * f - (dy / d) * f * 0.7;
            vy += (dy / d) * f + (dx / d) * f * 0.7;
          }
        }
        const nx = p.x + vx, ny = p.y + vy;
        ctx.strokeStyle = p.hue < 0.72 ? "rgba(114, 202, 187, .55)" : p.hue < 0.93 ? "rgba(56, 189, 248, .5)" : "rgba(255, 255, 255, .6)";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny;
        if (--p.life < 0 || nx > w + 10 || ny < -10 || ny > h + 10) spawn(p, Math.random() < 0.35);
      }
    };
    const loop = () => { step(); raf = requestAnimationFrame(loop); };
    const sync = () => {
      cancelAnimationFrame(raf); raf = 0;
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }).observe(canvas);
    document.addEventListener("visibilitychange", sync);
    const host = canvas.parentElement;
    host.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
    });
    host.addEventListener("pointerleave", () => { pointer.active = false; });
    resize();
  }
  $$("canvas[data-flowfield]").forEach(flowField);
})();
