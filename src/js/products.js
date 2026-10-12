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
    $("range").parentElement.hidden = !d.range;
    $("brandLink").textContent = d.brand;
    $("brandLink").href = d.brandHref;
    $("enquire").href = `${root}enquire.html?${new URLSearchParams({ topic: "Product pricing", product: label(d) })}`;
    $("quote").dataset.quote = JSON.stringify(d.quote);
    window.EDS?.quote?.refresh();
    // The first specifications, where the site has them, before the documents.
    const specs = d.specs.flatMap(([, rows]) => rows);
    $("specs").hidden = !specs.length;
    $("specs").querySelector("tbody").innerHTML = specs.slice(0, 6).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("");
    $("specsAll").hidden = !(d.page && specs.length > 6);
    if (d.page) $("specsAll").href = d.page;
    $("page").hidden = !d.page;
    if (d.page) $("page").href = d.page;
    $("docs").hidden = !d.docs.length;
    $("docs").querySelector("ul").innerHTML = d.docs.map((doc) => `<li><a href="${esc(doc.href)}" rel="noopener">${esc(doc.label)}${docIcon}</a></li>`).join("");
    $("count").textContent = `${at + 1} of ${list.length}`;
    dialog.querySelectorAll("[data-qv-step]").forEach((b) => (b.disabled = list.length < 2));
    history.replaceState(null, "", `#${card.id}`);
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
    setTimeout(() => (lbl.textContent = "Copy link"), 2000);
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
  // row any of them has, blank where a product's documents do not state it.
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
      tray.querySelector(".cmp-n").textContent = picked.length === 1 ? "Pick one more to compare" : `${picked.length} to compare`;
      tray.querySelector(".cmp-sel").innerHTML = picked.map((id) => `<button type="button" data-unpick="${esc(id)}" aria-label="Remove ${esc(byId.get(id).product.name)} from the comparison">${esc(byId.get(id).product.name)}${xIcon}</button>`).join("");
      tray.querySelector("[data-cmp-open]").disabled = picked.length < 2;
    }
    const toggle = (id) => {
      picked = picked.includes(id) ? picked.filter((x) => x !== id) : picked.length < MAX ? [...picked, id] : picked;
      save();
      render();
    };
    cards.forEach((c) => c.querySelector(".prod-cmp").addEventListener("click", () => toggle(c.product.id)));
    tray.addEventListener("click", (e) => {
      const un = e.target.closest("[data-unpick]");
      if (un) toggle(un.dataset.unpick);
    });
    tray.querySelector("[data-cmp-clear]").addEventListener("click", () => { picked = []; save(); render(); });

    function openCompare() {
      const items = picked.map((id) => byId.get(id).product);
      const cell = (v) => (v ? `<td>${v}</td>` : `<td class="none" title="Not stated in the documents on this site">—</td>`);
      const row = (th, cells) => `<tr><th scope="row">${th}</th>${cells.map(cell).join("")}</tr>`;
      cmp.querySelector("thead").innerHTML = `<tr><th scope="row"><span class="sr-only">Instrument</span></th>${items.map((p) => `<th scope="col"><span class="cmp-shot"><img src="${esc(p.image)}" alt=""></span><span class="tag">${esc(p.brand)}</span>${esc(p.name)}</th>`).join("")}</tr>`;
      const rows = [
        row("What it is", items.map((p) => esc(p.note))),
        row("Type", items.map((p) => esc(p.type))),
        row("Range", items.map((p) => esc(p.range))),
        row("Documents", items.map((p) => p.docs.map((d) => `<a href="${esc(d.href)}" rel="noopener">${esc(d.label)}</a>`).join("<br>"))),
      ];
      // Every specification row any of them has, in the order first met.
      const specs = new Map();
      for (const p of items) for (const [group, kv] of p.specs) for (const [k, v] of kv) {
        const key = `${group}\u0000${k}`;
        if (!specs.has(key)) specs.set(key, { group, k, vals: new Map() });
        specs.get(key).vals.set(p.id, v);
      }
      let lastGroup = null;
      for (const { group, k, vals } of specs.values()) {
        if (group !== lastGroup) { rows.push(`<tr class="group"><th scope="row" colspan="${items.length + 1}">${esc(group)}</th></tr>`); lastGroup = group; }
        rows.push(row(esc(k), items.map((p) => (vals.has(p.id) ? esc(vals.get(p.id)) : ""))));
      }
      cmp.querySelector("tbody").innerHTML = rows.join("");
      const without = items.filter((p) => !p.specs.length).map((p) => p.name);
      cmp.querySelector("[data-cmp-note]").textContent = without.length
        ? `${without.join(" and ")}: specifications are in the datasheet. The rows above show what the site states.`
        : "Specifications as published on this site.";
      cmp.querySelector("[data-cmp-enquire]").href = `${root}enquire.html?${new URLSearchParams({ topic: "Product pricing", product: items.map(label).join(", ") })}`;
      document.querySelectorAll("dialog[open]").forEach((d) => d.close());
      cmp.showModal();
      cmp.querySelector("[data-cmp-close]").focus();
    }
    tray.querySelector("[data-cmp-open]").addEventListener("click", openCompare);
    cmp.querySelector("[data-cmp-close]").addEventListener("click", () => cmp.close());
    cmp.querySelector("[data-cmp-quote]").addEventListener("click", () => {
      for (const id of picked) {
        const b = byId.get(id).querySelector(".quote-add");
        if (!b.classList.contains("added")) b.click();
      }
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

  function apply() {
    const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const byText = cards.filter((c) => terms.every((t) => c.dataset.search.includes(t)));
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
  finder.querySelector("[data-finder-reset]").addEventListener("click", () => {
    input.value = "";
    groups.forEach((g) => g.querySelector(".cat-opt").click());
    input.focus();
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
  }
})();
