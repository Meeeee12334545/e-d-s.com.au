// Shared behaviour for every page: navigation, scroll
// reveals, counters, pointer effects and the flow-field canvas.
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // Visitors who ask their system for less motion keep the ambient animation
  // but lose the pointer-driven tilt and the smooth scrolling (see site.css).
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  // While the drawer is open the page behind it is inert, so keyboard focus
  // stays in the menu; closing it hands focus back to the menu button.
  const drawer = $(".drawer");
  const burger = $(".burger");
  function setDrawer(open) {
    if (!drawer || drawer.classList.contains("open") === open) return;
    drawer.classList.toggle("open", open);
    burger?.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    $$("body > :not(.drawer, dialog, script)").forEach((el) => (el.inert = open));
    if (open) $(".drawer-close", drawer)?.focus();
    else burger?.focus();
  }
  burger?.addEventListener("click", () => setDrawer(true));
  $$(".drawer-close, .drawer-scrim").forEach((b) => b.addEventListener("click", () => setDrawer(false)));
  // Search opens over the drawer, so close the drawer first.
  if (drawer) $$("[data-search-open]", drawer).forEach((b) => b.addEventListener("click", () => setDrawer(false)));

  /* ---- tabs: arrow keys move between tabs, as in any tab list ---- */
  $$('[role="tablist"]').forEach((list) => {
    list.addEventListener("keydown", (e) => {
      const tabs = $$('[role="tab"]', list);
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      const tab = tabs[(next + tabs.length) % tabs.length];
      tab.focus();
      tab.click();
    });
  });

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
  // The spotlight (on the card and along its edge) only lights what is under
  // the pointer, so it stays for everyone; tilt and magnetic pull move things
  // and are left out for visitors who ask for less motion.
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) {
    $$(".card, .quote").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
        if (!calm && card.classList.contains("tilt")) {
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
        }
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
    if (!calm) $$("[data-magnetic]").forEach((b) => {
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
      b.addEventListener("click", () => rail.scrollBy({ left: step() * (b.dataset.dir === "prev" ? -1 : 1), behavior: calm ? "auto" : "smooth" }))
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

  /* ---- sidebars follow the page only when they fit on screen ---- */
  // A sticky sidebar taller than the window hides its last cards until the
  // end of the page, so those scroll with the page instead.
  const asides = $$(".aside");
  if (asides.length) {
    const fit = () => asides.forEach((a) => a.classList.toggle("fits", a.offsetHeight < window.innerHeight - 140));
    const ro = new ResizeObserver(fit);
    asides.forEach((a) => ro.observe(a));
    window.addEventListener("resize", fit, { passive: true });
  }

  /* ---- home hero: an illustrative flow meter reporting in ---- */
  // The last day of readings at half-hour steps, against the dry weather
  // pattern, moved on by one reading every few seconds. Not live data.
  const live = $(".live");
  if (live) {
    const N = 48, W = 300, H = 86;
    const bump = (h, c, w) => Math.exp(-(((h - c + 36) % 24 - 12) ** 2) / (2 * w * w));
    const dwf = (h) => 26 + 20 * bump(h, 7.5, 1.6) + 15 * bump(h, 19, 2.1) + 6 * bump(h, 13, 2.5);
    let t = 0, wobble = 0;
    const next = () => {
      const h = (t++ / 2) % 24, base = dwf(h);
      wobble = wobble * 0.6 + (Math.random() - 0.5) * 2.4;
      return { base, q: Math.max(4, base + wobble) };
    };
    const pts = Array.from({ length: N }, next);
    const x = (i) => (i / (N - 1)) * W, y = (q) => H - 4 - (q / 64) * (H - 10);
    const trace = (k) => pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[k]).toFixed(1)}`).join("");
    const out = Object.fromEntries($$("[data-live]", live).map((el) => [el.dataset.live, el]));
    const draw = () => {
      const line = trace("q"), q = pts[N - 1].q;
      $(".live-line", live).setAttribute("d", line);
      $(".live-area", live).setAttribute("d", `${line}L${W} ${H}L0 ${H}Z`);
      $(".live-dwf", live).setAttribute("d", trace("base"));
      $(".live-dot", live).setAttribute("cx", W);
      $(".live-dot", live).setAttribute("cy", y(q).toFixed(1));
      out.q.textContent = q.toFixed(1);
      out.d.textContent = Math.round(118 + q * 2.3);
      out.v.textContent = (0.32 + q / 95).toFixed(2);
    };
    draw();
    let seen = false;
    new IntersectionObserver(([en]) => { seen = en.isIntersecting; }).observe(live);
    setInterval(() => {
      if (!seen || document.hidden) return;
      pts.shift();
      pts.push(next());
      draw();
    }, 2800);
  }

  /* ---- copying to the clipboard, shared with products.js ---- */
  // The Clipboard API is refused in some browsers and embedded views, so fall
  // back to selecting a hidden text box and copying that.
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const box = Object.assign(document.createElement("textarea"), { value: text, readOnly: true });
      box.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      (document.querySelector("dialog[open]") || document.body).appendChild(box);
      box.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { /* nothing more to try */ }
      box.remove();
      return ok;
    }
  }
  window.EDS = { copyText };

  /* ---- contact + register forms: send, or compose an email ---- */
  // With a Web3Forms key (data-key) the form is sent from the page to
  // site.email. Without one, or if sending fails, it opens a mailto link.
  // That only works where an email program is set up, so the enquiry form
  // also offers to copy the enquiry for any webmail.
  const compose = (form) => {
    const data = new FormData(form);
    const lines = [];
    data.forEach((v, k) => { if (k !== "subject" && String(v).trim()) lines.push(`${k}: ${v}`); });
    const product = data.get("Product");
    const subject = [data.get("subject") || form.dataset.subject || "Website enquiry", product].filter(Boolean).join(": ");
    return { to: form.dataset.mailto, subject, body: lines.join("\n") };
  };
  async function send(form, m) {
    const data = new FormData(form);
    const body = new FormData();
    body.set("access_key", form.dataset.key);
    body.set("subject", `Website: ${m.subject}`);
    body.set("from_name", "EDS website");
    if (data.get("Email")) body.set("replyto", data.get("Email"));
    if (data.get("subject")) body.set("Interested in", data.get("subject"));
    data.forEach((v, k) => { if (k !== "subject" && String(v).trim()) body.append(k, v); });
    try {
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body, headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
      return (await res.json()).success === true;
    } catch {
      return false;
    }
  }
  const ERRORS = { Name: "Please tell us your name.", Email: "Please enter an email address we can reply to.", Message: "Please add a short message." };
  function check(field) {
    const ok = field.checkValidity();
    field.setAttribute("aria-invalid", String(!ok));
    let msg = field.parentElement.querySelector(".field-error");
    if (ok) { msg?.remove(); return true; }
    if (!msg) {
      msg = document.createElement("small");
      msg.className = "field-error";
      msg.id = `err-${field.name}`;
      field.after(msg);
      field.setAttribute("aria-describedby", msg.id);
    }
    msg.textContent = field.validity.typeMismatch ? "That email address does not look quite right." : ERRORS[field.name] || "Please fill this in.";
    return false;
  }

  $$("form[data-mailto]").forEach((form) => {
    const fields = $$("[required]", form);
    // Once a field has been flagged, re-check it as the visitor fixes it.
    fields.forEach((f) => f.addEventListener("input", () => f.hasAttribute("aria-invalid") && check(f)));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.hasAttribute("aria-busy")) return;
      if (form.classList.contains("form")) {
        const bad = fields.filter((f) => !check(f));
        if (bad.length) {
          bad[0].focus({ preventScroll: true });
          bad[0].scrollIntoView({ block: "center" });
          return;
        }
      }
      const m = compose(form);
      let sent = false;
      if (form.dataset.key) {
        const btn = $("button[type=submit]", form), label = $("span", btn), was = label?.textContent;
        form.setAttribute("aria-busy", "true");
        btn.disabled = true;
        if (label) label.textContent = "Sending…";
        sent = await send(form, m);
        form.removeAttribute("aria-busy");
        btn.disabled = false;
        if (label) label.textContent = was;
      }
      const mailto = `mailto:${m.to}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;
      if (sent) {
        // Clear everything that was sent (topic, product, way of working, quote
        // list, message), keeping name and contact details for another.
        const keep = ["Name", "Organisation", "Email", "Phone"].map((k) => [k, form.elements[k]?.value]);
        form.reset();
        if (form.classList.contains("form")) {
          keep.forEach(([k, v]) => form.elements[k] && (form.elements[k].value = v));
          const ctx = $(".form-context", form);
          if (ctx) { ctx.hidden = true; $("input", ctx).value = ""; } // hidden inputs keep their value through reset()
          window.EDS?.quote?.clear();
        }
      } else if (form.dataset.key) {
        // Sending took a while, so the click no longer counts as the visitor's
        // own and browsers may block opening the email program. They open it
        // from the link in the message instead.
        $$("[data-mail-link]", form).forEach((a) => (a.href = mailto));
      } else {
        window.location.href = mailto;
      }
      $$("[data-done]", form).forEach((d) => (d.hidden = true));
      const done = $(`[data-done=${sent ? "sent" : "mail"}]`, form);
      if (!done) return;
      done.hidden = false;
      const fieldset = $(".form-fields", form);
      if (fieldset) { fieldset.hidden = true; done.focus(); }
    });
  });

  const enquiry = $("form.form[data-mailto]");
  if (enquiry) {
    $$("[data-form-edit]", enquiry).forEach((b) => b.addEventListener("click", () => {
      $$(".form-done", enquiry).forEach((d) => (d.hidden = true));
      $(".form-fields", enquiry).hidden = false;
      $("textarea[name=Message]", enquiry).focus();
    }));
    $$("[data-copy]", enquiry).forEach((b) =>
      b.addEventListener("click", async () => {
        const m = compose(enquiry);
        const label = $("span", b), was = label.textContent;
        const text = b.dataset.copy === "address" ? m.to : `To: ${m.to}\nSubject: ${m.subject}\n\n${m.body}`;
        label.textContent = (await copyText(text)) ? "Copied" : "Could not copy";
        setTimeout(() => (label.textContent = was), 2000);
      })
    );

    // Arriving from a "Request pricing" or "Enquire now" button: choose the
    // topic it was about and name the product, if there was one.
    const params = new URLSearchParams(location.search);
    const topic = params.get("topic"), product = params.get("product");
    const select = $("select[name=subject]", enquiry);
    if (topic) {
      const opt = [...select.options].find((o) => o.text.toLowerCase() === topic.toLowerCase());
      if (opt) select.value = opt.value;
    }
    // From a "Buy, hire or Data as a Service" card: tick that way of working.
    const mode = params.get("mode");
    const modeInput = mode && $$("input[data-mode]", enquiry).find((i) => i.dataset.mode === mode);
    if (modeInput) modeInput.checked = true;
    const ctx = $(".form-context", enquiry);
    if (product && ctx) {
      $("b", ctx).textContent = product;
      $("input", ctx).value = product;
      ctx.hidden = false;
      $("[data-context-clear]", ctx).addEventListener("click", () => {
        $("input", ctx).value = "";
        ctx.hidden = true;
        $("input[name=Name]", enquiry).focus();
      });
    }
    if (topic || product || modeInput) {
      // Bring the form into view and start them typing.
      enquiry.classList.add("in");
      requestAnimationFrame(() => {
        enquiry.scrollIntoView({ block: "center" });
        $("input[name=Name]", enquiry).focus({ preventScroll: true });
      });
    }
  }

  /* ---- head office: open now, or when it next opens ---- */
  // The hours come from site.openingHours in content.mjs, via the footer.
  const hours = $("[data-open-status]");
  if (hours) {
    const spec = JSON.parse(hours.dataset.openStatus);
    const mins = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
    const clock = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${h % 12 || 12}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`; };
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const update = () => {
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-AU", { timeZone: spec.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date()).map((p) => [p.type, p.value]));
      const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
      const now = Number(parts.hour) * 60 + Number(parts.minute);
      const open = spec.days.includes(day) && now >= mins(spec.opens) && now < mins(spec.closes);
      let text = `Head office open now, until ${clock(mins(spec.closes))}`;
      if (!open) {
        let d = day, ahead = 0;
        if (!(spec.days.includes(day) && now < mins(spec.opens))) do { d = (d + 1) % 7; ahead++; } while (!spec.days.includes(d));
        text = `Head office closed, opens ${clock(mins(spec.opens))} ${ahead === 0 ? "today" : ahead === 1 ? "tomorrow" : DAYS[d]}`;
      }
      const tz = spec.timeZone === "Australia/Brisbane" ? " (Brisbane time)" : "";
      $$("[data-open-status]").forEach((el) => {
        el.hidden = false;
        el.classList.toggle("is-open", open);
        $("span", el).textContent = text + tz;
      });
      $$("[data-open-dot]").forEach((el) => el.classList.toggle("is-open", open));
    };
    update();
    setInterval(update, 60000);
  }

  /* ---- phone action bar: out of the way at the top and by the footer ---- */
  const bar = $(".actionbar");
  if (bar) {
    let past = false, near = false;
    const sync = () => bar.classList.toggle("show", past && !near);
    window.addEventListener("scroll", () => { const p = window.scrollY > 320; if (p !== past) { past = p; sync(); } }, { passive: true });
    const seen = new Set();
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)));
      near = seen.size > 0;
      sync();
    });
    $$(".footer, .cta, .contact-grid").forEach((el) => io2.observe(el));
  }

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
        ctx.strokeStyle = p.hue < 0.72 ? "rgba(95, 180, 166, .4)" : p.hue < 0.93 ? "rgba(56, 189, 248, .5)" : "rgba(255, 255, 255, .6)";
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
