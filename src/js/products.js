// Products: the quick view behind every product card, the compare tray and
// view, and the instrument finder on the products page (its filter rail,
// grid or table view). A product's address is its card's id, so
// /products/hach-flow.html#fl900-portable opens straight onto the FL900.
(() => {
  const dialog = document.querySelector("dialog.qv");
  const cards = [...document.querySelectorAll(".prod[data-product]")];
  if (!dialog || !cards.length) return;
  const root = document.documentElement.dataset.root || "";
  const $ = (k) => dialog.querySelector(`[data-qv="${k}"]`);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const docIcon = $("docIcon").innerHTML;
  for (const card of cards) card.product = JSON.parse(card.dataset.product);
  const label = (d) => (d.name === d.brand ? d.name : `${d.name} (${d.brand})`);
  let list = cards, at = -1;

  /* ================= quick view ================= */
  function show(card) {
    const d = card.product;
    dialog.scrollTop = 0; // each product opens at its top
    // Step through what the visitor can see: the finder may be filtering.
    list = cards.filter((c) => !c.hidden);
    at = list.indexOf(card);
    const img = $("image");
    img.classList.remove("swap");
    void img.offsetWidth; // restart the fade for the next product
    img.classList.add("swap");
    img.src = d.image;
    img.alt = d.name;
    $("brand").textContent = d.brand;
    $("name").textContent = d.name;
    $("note").textContent = d.note;
    $("note").hidden = !d.note;
    $("type").textContent = d.type;
    $("range").textContent = d.range;
    // The family (the group on its brand page), unless it only repeats the type.
    $("range").parentElement.hidden = !d.range || d.range === d.type;
    $("brandLink").textContent = d.brand;
    $("brandLink").href = d.brandHref;
    $("enquire").href = `${root}enquire.html?${new URLSearchParams({ topic: "Product pricing", product: label(d) })}`;
    $("quote").dataset.quote = JSON.stringify(d.quote);
    window.EDS?.quote?.refresh();
    // The first six specifications, where the site has them, before the
    // documents, under their group names ("Velocity", "Depth") when there are
    // several groups, so a figure says what it measures.
    const specs = d.specs.flatMap(([, rows]) => rows);
    $("specs").hidden = !specs.length;
    const rows = [];
    let n = 0;
    for (const [group, kv] of d.specs) {
      if (n >= 6) break;
      if (d.specs.length > 1) rows.push(`<tr class="group"><th colspan="2" scope="colgroup">${esc(group)}</th></tr>`);
      for (const [k, v] of kv.slice(0, 6 - n)) { rows.push(`<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`); n++; }
    }
    $("specs").querySelector("tbody").innerHTML = rows.join("");
    $("specsAll").hidden = !(d.page && specs.length > 6);
    if (d.page) $("specsAll").href = d.page;
    // One link to the product's page: "All specifications" when it shows.
    $("page").hidden = !d.page || !$("specsAll").hidden;
    if (d.page) $("page").href = d.page;
    $("docs").hidden = !d.docs.length;
    $("docs").querySelector("ul").innerHTML = d.docs.map((doc) => `<li><a href="${esc(doc.href)}" rel="noopener" download>${esc(doc.label)}${docIcon}</a></li>`).join("");
    $("count").textContent = `${at + 1} of ${list.length}`;
    dialog.querySelectorAll("[data-qv-step]").forEach((b) => (b.disabled = list.length < 2));
    history.replaceState(null, "", `#${card.id}`);
    // Stepping keeps focus on Previous or Next, so say which product is showing.
    if (dialog.open) $("say").textContent = `${d.name}, ${at + 1} of ${list.length}`;
  }
  function open(card) {
    show(card);
    if (!dialog.open) {
      document.querySelectorAll("dialog[open]").forEach((d) => d.close());
      dialog.showModal();
      // Arriving on a product link, the browser's own jump to the anchor can
      // take focus back, so place it again once that has happened.
      const close = dialog.querySelector("[data-qv-close]");
      close.focus();
      requestAnimationFrame(() => dialog.contains(document.activeElement) || close.focus());
    }
  }
  const step = (n) => list.length > 1 && show(list[(at + n + list.length) % list.length]);

  cards.forEach((card) => card.querySelector(".prod-open").addEventListener("click", () => open(card)));
  dialog.querySelectorAll("[data-qv-step]").forEach((b) => b.addEventListener("click", () => step(Number(b.dataset.qvStep))));
  dialog.querySelector("[data-qv-close]").addEventListener("click", () => dialog.close());
  document.addEventListener("keydown", (e) => {
    if (!dialog.open) return;
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  const closeOutside = (dlg) => dlg.addEventListener("click", (e) => {
    if (e.target !== dlg) return;
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
  closeOutside(dialog);
  // Closing leaves the visitor on the product they were last looking at.
  dialog.addEventListener("close", () => {
    const card = list[at];
    history.replaceState(null, "", location.pathname + location.search);
    if (card) {
      card.scrollIntoView({ block: "nearest" });
      card.querySelector(".prod-open").focus({ preventScroll: true });
    }
  });

  const copy = dialog.querySelector("[data-qv-copy]");
  copy.addEventListener("click", async () => {
    const lbl = copy.querySelector("span");
    lbl.textContent = (await window.EDS.copyText(location.href)) ? "Link copied" : "Copy the address bar";
    // On a phone the label is hidden until there is something to say.
    copy.classList.add("done");
    $("say").textContent = lbl.textContent;
    setTimeout(() => { lbl.textContent = "Copy link"; copy.classList.remove("done"); }, 2000);
  });

  // Open the product named in the address, on arrival or from search.
  function fromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const card = id && cards.find((c) => c.id === id);
    if (!card) return;
    card.classList.add("in", "flash");
    setTimeout(() => card.classList.remove("flash"), 2400);
    open(card);
  }
  window.addEventListener("hashchange", fromHash);
  fromHash();

  /* ================= compare ================= */
  // Up to three instruments, kept for the visit (sessionStorage) so a pick on
  // a brand page is still there on the products page. The compare view lays
  // them in columns: what the site says about each, then every specification
  // row any of them has, group by group, blank where the site does not state it.
  const tray = document.querySelector(".cmp-tray");
  const cmp = document.querySelector("dialog.cmp");
  if (tray && cmp) {
    const MAX = 3, KEY = "eds-compare";
    const byId = new Map(cards.map((c) => [c.product.id, c]));
    const xIcon = tray.querySelector("[data-cmp='x']").innerHTML;
    let picked = [];
    try { picked = JSON.parse(sessionStorage.getItem(KEY) || "[]").filter((id) => byId.has(id)); } catch { /* storage off */ }
    const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(picked)); } catch { /* storage off */ } };

    function render() {
      const full = picked.length >= MAX;
      for (const c of cards) {
        const b = c.querySelector(".prod-cmp");
        const on = picked.includes(c.product.id);
        b.setAttribute("aria-pressed", String(on));
        b.disabled = !on && full;
        b.title = !on && full ? `Up to ${MAX} instruments at a time` : "";
      }
      tray.hidden = !picked.length;
      // At the limit the other Compare buttons are disabled; the tray says why.
      tray.querySelector(".cmp-n").textContent = picked.length === 1 ? "Pick one more to compare" : full ? `${MAX} to compare, the most at once` : `${picked.length} to compare`;
      tray.querySelector(".cmp-sel").innerHTML = picked.map((id) => `<button type="button" data-unpick="${esc(id)}" aria-label="Remove ${esc(byId.get(id).product.name)} from the comparison">${esc(byId.get(id).product.name)}${xIcon}</button>`).join("");
      tray.querySelector("[data-cmp-open]").disabled = picked.length < 2;
    }
    const toggle = (id) => {
      picked = picked.includes(id) ? picked.filter((x) => x !== id) : picked.length < MAX ? [...picked, id] : picked;
      save();
      render();
    };
    cards.forEach((c) => c.querySelector(".prod-cmp").addEventListener("click", () => toggle(c.product.id)));
    // The tray is rebuilt as it changes, so keep focus with the visitor: on
    // the next chip, or on a product's own Compare button once the tray closes
    // (scrolled to only from the keyboard: a click has no need to move the page).
    const focusCmp = (ids, e) => ids.map((id) => byId.get(id)).find((c) => !c.hidden)?.querySelector(".prod-cmp").focus({ preventScroll: e.detail > 0 });
    tray.addEventListener("click", (e) => {
      const un = e.target.closest("[data-unpick]");
      if (!un) return;
      const id = un.dataset.unpick, i = picked.indexOf(id);
      toggle(id);
      const chips = tray.querySelectorAll("[data-unpick]");
      if (chips.length) chips[Math.min(i, chips.length - 1)].focus();
      else focusCmp([id], e);
    });
    tray.querySelector("[data-cmp-clear]").addEventListener("click", (e) => {
      const was = picked;
      picked = []; save(); render();
      focusCmp(was, e);
    });

    function openCompare() {
      const items = picked.map((id) => byId.get(id).product);
      const cell = (v) => (v ? `<td>${v}</td>` : `<td class="none" title="Not stated in the documents on this site">—</td>`);
      const row = (th, cells) => `<tr><th scope="row">${th}</th>${cells.map(cell).join("")}</tr>`;
      cmp.querySelector("thead").innerHTML = `<tr><th scope="row"><span class="sr-only">Instrument</span></th>${items.map((p) => `<th scope="col"><span class="cmp-shot"><img src="${esc(p.image)}" alt=""></span><span class="tag">${esc(p.brand)}</span>${esc(p.name)}</th>`).join("")}</tr>`;
      // Equal columns; on a phone the table is as wide as the products need.
      cmp.querySelector(".cmp-table").style.setProperty("--n", items.length);
      const rows = [
        row("What it is", items.map((p) => esc(p.note))),
        row("Type", items.map((p) => esc(p.type))),
        // The family (the group on its brand page), unless each only repeats the type.
        ...(items.some((p) => p.range && p.range !== p.type) ? [row("Family", items.map((p) => esc(p.range)))] : []),
        row("Documents", items.map((p) => p.docs.map((d) => `<a href="${esc(d.href)}" rel="noopener" download>${esc(d.label)}</a>`).join("<br>"))),
      ];
      // Every specification group any of them has, in the order first met,
      // each with its rows from all of them. Wiring, lights and order codes
      // belong to one model, so they stay on its page.
      const SKIP = new Set(["Ordering", "Sensor connector wiring", "Status lights"]);
      const groups = new Map();
      for (const p of items) for (const [group, kv] of p.specs) {
        if (SKIP.has(group)) continue;
        if (!groups.has(group)) groups.set(group, new Map());
        const g = groups.get(group);
        for (const [k, v] of kv) { if (!g.has(k)) g.set(k, new Map()); g.get(k).set(p.id, v); }
      }
      for (const [group, keys] of groups) {
        rows.push(`<tr class="group"><th scope="row" colspan="${items.length + 1}"><span>${esc(group)}</span></th></tr>`);
        for (const [k, vals] of keys) rows.push(row(esc(k), items.map((p) => (vals.has(p.id) ? esc(vals.get(p.id)) : ""))));
      }
      cmp.querySelector("tbody").innerHTML = rows.join("");
      const without = items.filter((p) => !p.specs.length).map((p) => p.name);
      cmp.querySelector("[data-cmp-note]").textContent = !without.length
        ? "Specifications as published on this site."
        : without.length === items.length
          ? "This site doesn't list specifications for these instruments. Ask us for the details."
          : `This site doesn't list specifications for the ${new Intl.ListFormat("en-AU", { type: "disjunction" }).format(without)}, so ${without.length === 1 ? "its rows are" : "their rows are"} blank. Ask us for the details.`;
      cmp.querySelector("[data-cmp-enquire]").href = `${root}enquire.html?${new URLSearchParams({ topic: "Product pricing", product: items.map(label).join(", ") })}`;
      syncAddAll();
      document.querySelectorAll("dialog[open]").forEach((d) => d.close());
      const scroller = cmp.querySelector(".table-scroll");
      scroller.scrollTop = scroller.scrollLeft = 0;
      cmp.showModal();
      cmp.querySelector("[data-cmp-close]").focus();
    }
    tray.querySelector("[data-cmp-open]").addEventListener("click", openCompare);
    cmp.querySelector("[data-cmp-close]").addEventListener("click", () => cmp.close());
    // "Add all to quote" adds them in one go, with one toast, then says they
    // are all in the list.
    const addAll = cmp.querySelector("[data-cmp-quote]");
    function syncAddAll() {
      const done = picked.every((id) => byId.get(id).querySelector(".quote-add").classList.contains("added"));
      addAll.disabled = done;
      addAll.lastChild.textContent = done ? " All in your quote list" : " Add all to quote";
    }
    addAll.addEventListener("click", () => {
      const buttons = picked.map((id) => byId.get(id).querySelector(".quote-add"));
      if (window.EDS?.quote?.addMany) window.EDS.quote.addMany(buttons.map((b) => JSON.parse(b.dataset.quote)));
      else buttons.forEach((b) => b.classList.contains("added") || b.click());
      syncAddAll();
      // a disabled button lets go of focus, so hand it to the next step
      if (addAll.disabled) cmp.querySelector("[data-cmp-enquire]").focus();
    });
    closeOutside(cmp);
    render();
  }

  /* ================= instrument finder ================= */
  const finder = document.querySelector(".finder");
  if (!finder) return;
  // The search box sits in the page hero; the filter rail and the view
  // toggle sit beside the results.
  const input = document.querySelector(".finder-search input");
  const groups = [...finder.querySelectorAll("[data-cat-filter]")];
  const count = finder.querySelector(".finder-count");
  const empty = finder.querySelector(".finder-empty");
  const grid = finder.querySelector(".prod-grid");
  const state = { type: "", brand: "", docs: "" };
  const matches = (c, skip) =>
    (skip === "type" || !state.type || c.dataset.type === state.type) &&
    (skip === "brand" || !state.brand || c.dataset.brand === state.brand) &&
    (skip === "docs" || !state.docs || c.dataset.docs === state.docs);

  // A word matches the card's text, or the product's name with spaces and
  // dashes ignored ("eflow" finds E-Flow 3, "nemo1" NEMO 1); a plural also
  // tries its singular ("flow meters").
  const compact = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const names = new Map(cards.map((c) => [c, compact(c.product.name)]));
  const hit = (c, t) => c.dataset.search.includes(t) || (compact(t).length > 2 && names.get(c).includes(compact(t)));
  const live = document.querySelector("[data-finder-live]");

  function apply() {
    const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const byText = cards.filter((c) => terms.every((t) => hit(c, t) || (t.length > 3 && t.endsWith("s") && hit(c, t.slice(0, -1)))));
    let shown = 0;
    for (const c of cards) {
      c.hidden = !(byText.includes(c) && matches(c));
      if (!c.hidden) { shown++; c.classList.add("in"); }
    }
    // Each option says how many it would show, given everything else chosen.
    for (const group of groups) {
      const key = group.dataset.catFilter;
      for (const opt of group.querySelectorAll(".cat-opt")) {
        const v = opt.dataset.value;
        const n = byText.filter((c) => matches(c, key) && (!v || c.dataset[key] === v)).length;
        opt.querySelector("[data-n]").textContent = n;
        opt.classList.toggle("zero", n === 0);
      }
    }
    count.textContent = shown === cards.length ? `Showing all ${shown} instruments` : `Showing ${shown} of ${cards.length} instruments`;
    empty.hidden = shown > 0;
    // The results start below the ranges, so say under the search box what
    // a search found, and name the search beside the results.
    const q = input.value.trim();
    live.parentElement.hidden = !q;
    live.textContent = shown ? `${shown} ${shown === 1 ? "instrument matches" : "instruments match"}.` : "No instruments match.";
    live.nextElementSibling.hidden = !shown;
    if (q) count.textContent += ` for “${q}”`;
    empty.querySelector("h3").textContent = q ? `No instruments match “${q}”` : "No instruments match";
  }
  for (const group of groups) {
    const opts = [...group.querySelectorAll(".cat-opt")];
    opts.forEach((opt) =>
      opt.addEventListener("click", () => {
        state[group.dataset.catFilter] = opt.dataset.value;
        opts.forEach((o) => o.setAttribute("aria-pressed", String(o === opt)));
        apply();
      })
    );
  }
  input.addEventListener("input", apply);
  // Enter goes to the results.
  const toResults = () => document.getElementById("instruments").scrollIntoView();
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); toResults(); }
  });
  finder.querySelector("[data-finder-reset]").addEventListener("click", () => {
    input.value = "";
    groups.forEach((g) => g.querySelector(".cat-opt").click());
    // Stay with the results (the search box is up in the hero): focus moves
    // to "All instruments", since the button that had it goes away.
    groups[0].querySelector(".cat-opt").focus({ preventScroll: true });
    toResults();
  });

  // Grid or table. The choice is kept on this device.
  const views = [...finder.querySelectorAll(".view-btn")];
  const setView = (v) => {
    grid.dataset.view = v;
    views.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
    try { localStorage.setItem("eds-products-view", v); } catch { /* storage off */ }
  };
  views.forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  try { const v = localStorage.getItem("eds-products-view"); if (v === "table") setView(v); } catch { /* storage off */ }

  // Search hands over its query as ?q= when there are more products than it lists.
  const q = new URLSearchParams(location.search).get("q");
  if (q) {
    input.value = q;
    apply();
    toResults();
  }
})();
