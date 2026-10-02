// Products: the quick view behind every product card, and the instrument
// finder on the products page. A product's address is its card's id, so
// /products/hach-flow.html#fl900-portable opens straight onto the FL900.
(() => {
  const dialog = document.querySelector("dialog.qv");
  const cards = [...document.querySelectorAll(".prod[data-product]")];
  if (!dialog || !cards.length) return;
  const root = document.documentElement.dataset.root || "";
  const $ = (k) => dialog.querySelector(`[data-qv="${k}"]`);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const docIcon = $("docIcon").innerHTML;
  let list = cards, at = -1;

  /* ================= quick view ================= */
  function show(card) {
    const d = JSON.parse(card.dataset.product);
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
    const label = d.name === d.brand ? d.name : `${d.name} (${d.brand})`;
    $("enquire").href = `${root}contact.html?${new URLSearchParams({ topic: "Product pricing", product: label })}`;
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
  dialog.addEventListener("click", (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
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
    const label = copy.querySelector("span");
    label.textContent = (await window.EDS.copyText(location.href)) ? "Link copied" : "Copy the address bar";
    setTimeout(() => (label.textContent = "Copy link"), 2000);
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

  /* ================= instrument finder ================= */
  const finder = document.querySelector(".finder");
  if (!finder) return;
  const input = finder.querySelector(".finder-search input");
  const chips = [...finder.querySelectorAll(".fchip")];
  const count = finder.querySelector(".finder-count");
  const empty = finder.querySelector(".finder-empty");
  let type = "";

  function apply() {
    const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const byText = cards.filter((c) => terms.every((t) => c.dataset.search.includes(t)));
    let shown = 0;
    for (const c of cards) {
      c.hidden = !(byText.includes(c) && (!type || c.dataset.type === type));
      if (!c.hidden) { shown++; c.classList.add("in"); }
    }
    // Each chip says how many it would show for the words typed so far.
    for (const chip of chips) {
      const n = chip.dataset.type ? byText.filter((c) => c.dataset.type === chip.dataset.type).length : byText.length;
      chip.querySelector("span").textContent = n;
      chip.classList.toggle("zero", n === 0);
    }
    count.textContent = shown === cards.length ? `Showing all ${shown} instruments` : `Showing ${shown} of ${cards.length} instruments`;
    empty.hidden = shown > 0;
  }
  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      type = chip.dataset.type;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      apply();
    })
  );
  input.addEventListener("input", apply);
  finder.querySelector("[data-finder-reset]").addEventListener("click", () => {
    input.value = "";
    chips[0].click();
    input.focus();
  });
  // Search hands over its query as ?q= when there are more products than it lists.
  const q = new URLSearchParams(location.search).get("q");
  if (q) {
    input.value = q;
    apply();
  }
})();
