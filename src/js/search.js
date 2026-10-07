// The search palette. Ctrl K (⌘K on a Mac), "/" or any [data-search-open]
// button opens it. The index, search-index.js, is written by build.mjs and
// loads the first time search is wanted, so pages do not pay for it upfront.
(() => {
  const dialog = document.querySelector("dialog.search");
  if (!dialog) return;
  const input = dialog.querySelector("input");
  const list = dialog.querySelector(".search-results");
  const root = document.documentElement.dataset.root || "";
  // The index address carries the content version build.mjs put on this script tag.
  const indexV = document.currentScript?.dataset.indexV || "";
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll("[data-kbd]").forEach((k) => (k.textContent = mac ? "⌘K" : "Ctrl K"));

  const PER_GROUP = 6;
  // Ties go to pages people navigate to over things inside them.
  const ORDER = ["Pages", "Services", "Solutions", "Product ranges", "Products", "Documents", "Contact", "Offices", "Sign in"];
  let data = null, loading = null, rows = [], active = -1;

  // Lower case, no accents, and "I&I", "I/I" and "inflow and infiltration"
  // all read as "ii", so every spelling finds the same pages.
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b([a-z])\s?[&/]\s?([a-z])\b/g, "$1$2").replace(/&/g, " and ").replace(/inflow and infiltration/g, "$& ii");
  const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const href = (h) => (/^[a-z]+:/i.test(h) ? h : root + h);
  const svg = (name) => (data?.icons[name] ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${data.icons[name]}</svg>` : "");

  function load() {
    if (!loading) {
      loading = new Promise((resolve, reject) => {
        if (window.EDS_SEARCH) return resolve();
        const s = document.createElement("script");
        s.src = `${root}assets/js/search-index.js${indexV ? `?v=${indexV}` : ""}`;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      }).then(() => {
        data = window.EDS_SEARCH;
        for (const e of data.items) {
          e._t = norm(e.t); e._s = norm(e.s); e._b = norm(e.b);
          e._w = e._t.split(/[^a-z0-9]+/).filter(Boolean);
          e._o = ORDER.indexOf(e.g);
        }
      }, (err) => { loading = null; throw err; });
    }
    return loading;
  }

  /* ---- matching: every word must be found; titles count most ---- */
  function score(e, terms, phrase) {
    let total = 0;
    for (const q of terms) {
      const s = e._w.includes(q) ? 12 : e._w.some((w) => w.startsWith(q)) ? 9 : e._t.includes(q) ? 6 : e._s.includes(q) ? 4 : inBody(e, q);
      if (!s) return 0;
      total += s;
    }
    if (e._t.startsWith(phrase)) total += 8;
    return total - e._o * 0.01;
  }
  // A page that keeps mentioning a word is more about it than one that
  // mentions it once.
  function inBody(e, q) {
    let n = 0;
    for (let i = e._b.indexOf(q); i !== -1 && n < 5; i = e._b.indexOf(q, i + q.length)) n++;
    return n ? 1.5 + (n - 1) * 0.75 : 0;
  }
  function search(raw) {
    const phrase = norm(raw).trim().replace(/\s+/g, " ");
    let terms = phrase.split(" ").filter((t) => t.length > 1);
    if (!terms.length) terms = [phrase];
    return data.items.map((e) => [e, score(e, terms, phrase)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([e]) => e);
  }

  // Marks the parts of a title the query matched, escaping everything else.
  function highlight(title, raw) {
    const words = norm(raw).split(/\s+/).filter((t) => t.length > 1);
    const lower = title.toLowerCase(), spans = [];
    for (const w of words) {
      let i = lower.indexOf(w);
      while (i !== -1) {
        if (i === 0 || /[^a-z0-9]/.test(lower[i - 1])) { spans.push([i, i + w.length]); break; }
        i = lower.indexOf(w, i + 1);
      }
    }
    spans.sort((a, b) => a[0] - b[0]);
    let out = "", at = 0;
    for (const [a, b] of spans) {
      if (a < at) continue;
      out += escHtml(title.slice(at, a)) + `<mark>${escHtml(title.slice(a, b))}</mark>`;
      at = b;
    }
    return out + escHtml(title.slice(at));
  }

  /* ---- rendering ---- */
  const row = (e, raw = "") => {
    const icon = e.img ? `<img src="${href(e.img)}" alt="" loading="lazy">` : svg(e.i);
    const ext = e.x ? ' target="_blank" rel="noopener"' : "";
    return `<a class="sr${e.img ? " sr-img" : ""}" role="option" href="${escHtml(href(e.h))}"${ext} data-h="${escHtml(e.h)}"><span class="sr-icon">${icon}</span><span class="sr-text"><b>${highlight(e.t, raw)}</b><small>${escHtml(e.s)}</small></span>${svg(e.x ? "arrow-up-right" : "arrow-right")}</a>`;
  };
  const group = (label, html) => `<div class="sr-group" role="group" aria-label="${escHtml(label)}"><p aria-hidden="true">${escHtml(label)}</p>${html}</div>`;

  function render() {
    const raw = input.value.trim();
    if (!data) {
      list.innerHTML = `<p class="sr-empty">Loading search…</p>`;
      return;
    }
    let html = "";
    if (!raw) {
      const byH = (h) => data.items.find((e) => e.h === h);
      const recent = readRecent().map(byH).filter(Boolean);
      if (recent.length) html += group("Recent", recent.map((e) => row(e)).join(""));
      html += group("Suggested", data.suggested.map(byH).filter((e) => e && !recent.includes(e)).map((e) => row(e)).join(""));
    } else {
      const found = search(raw);
      if (!found.length) {
        html = `<div class="sr-empty">${svg("search-x")}<p>No results for “${escHtml(raw)}”.</p><small>Try another word, or ask the people who know: call ${escHtml(data.items.find((e) => e.g === "Contact").t.replace(/^Call /, ""))} or send an enquiry.</small></div>`;
        html += group("Contact", data.items.filter((e) => e.g === "Contact").slice(0, 2).map((e) => row(e)).join(""));
      } else {
        const groups = new Map();
        for (const e of found) {
          if (!groups.has(e.g)) groups.set(e.g, []);
          groups.get(e.g).push(e);
        }
        for (const [label, items] of groups) {
          let body = items.slice(0, PER_GROUP).map((e) => row(e, raw)).join("");
          if (label === "Products" && items.length > PER_GROUP) {
            body += `<a class="sr sr-more" role="option" href="${root}products/index.html?q=${encodeURIComponent(raw)}#finder"><span class="sr-icon">${svg("package-search") || svg("arrow-right")}</span><span class="sr-text"><b>See all ${items.length} matching instruments</b><small>In the instrument finder</small></span>${svg("arrow-right")}</a>`;
          }
          html += group(label, body);
        }
      }
    }
    list.innerHTML = html;
    rows = [...list.querySelectorAll(".sr")];
    rows.forEach((r, i) => (r.id = `sr-${i}`));
    setActive(rows.length ? 0 : -1, false);
  }

  function setActive(i, scroll = true) {
    rows[active]?.setAttribute("aria-selected", "false");
    active = i;
    const r = rows[i];
    if (!r) return input.removeAttribute("aria-activedescendant");
    r.setAttribute("aria-selected", "true");
    input.setAttribute("aria-activedescendant", r.id);
    if (scroll) r.scrollIntoView({ block: "nearest" });
  }

  /* ---- recent picks, kept in this browser only ---- */
  function readRecent() {
    try { return JSON.parse(localStorage.getItem("eds-search-recent") || "[]"); } catch { return []; }
  }
  function remember(h) {
    try { localStorage.setItem("eds-search-recent", JSON.stringify([h, ...readRecent().filter((x) => x !== h)].slice(0, 4))); } catch { /* private mode */ }
  }

  /* ---- opening and closing ---- */
  function open() {
    if (dialog.open) return;
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());
    dialog.showModal();
    input.focus();
    input.select();
    render();
    load().then(render, () => { list.innerHTML = `<p class="sr-empty">Search could not load. Check your connection and try again.</p>`; });
  }
  const close = () => dialog.open && dialog.close();

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-search-open]");
    if (b) { e.preventDefault(); open(); }
  });
  // Warm the index as soon as someone reaches for search.
  document.querySelectorAll("[data-search-open]").forEach((b) => {
    b.addEventListener("pointerenter", () => load().catch(() => {}), { once: true });
    b.addEventListener("focus", () => load().catch(() => {}), { once: true });
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      dialog.open ? close() : open();
    } else if (e.key === "/" && !dialog.open && !e.target.closest("input, textarea, select, [contenteditable]")) {
      e.preventDefault();
      open();
    }
  });
  dialog.querySelector("[data-search-close]").addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  });

  input.addEventListener("input", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (rows.length) setActive((active + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length);
    } else if (e.key === "Enter" && rows[active]) {
      e.preventDefault();
      rows[active].click();
    }
  });
  list.addEventListener("pointermove", (e) => {
    const r = e.target.closest(".sr");
    if (r && rows.indexOf(r) !== active) setActive(rows.indexOf(r), false);
  });
  list.addEventListener("click", (e) => {
    const r = e.target.closest(".sr");
    if (!r) return;
    if (r.dataset.h) remember(r.dataset.h);
    // Links to a spot on this same page do not reload it, so step aside.
    if (!r.target && !e.metaKey && !e.ctrlKey && !e.shiftKey) setTimeout(close, 0);
  });
})();
