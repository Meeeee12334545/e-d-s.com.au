// The quote list: "Add to quote" on any product collects it here, the header
// shows how many are waiting, and the enquiry form (enquire.html, and on
// contact.html) lists them
// with a quantity each and sends them with the enquiry. Kept in this browser
// only (localStorage), so nothing is stored or sent until the visitor sends
// the enquiry themselves.
(() => {
  const KEY = "eds-quote";
  const root = document.documentElement.dataset.root || "";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Storage can be blocked (private windows, embedded views), so fall back to
  // a list that lasts as long as the page.
  let memory = [];
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return memory; }
  };
  const save = (list) => {
    memory = list;
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* memory only */ }
    refresh();
  };
  const has = (id) => load().some((x) => x.id === id);
  const inList = (n) => `${n} ${n === 1 ? "product" : "products"} in your quote list`;
  const bump = () => $$("[data-quote-link]").forEach((el) => {
    el.classList.remove("bump");
    void el.offsetWidth; // restart the animation
    el.classList.add("bump");
  });

  function add(item) {
    const list = load();
    if (!list.some((x) => x.id === item.id)) list.push({ ...item, qty: 1 });
    save(list);
    toast(`${item.name} added. ${inList(list.length)}.`);
    bump();
  }
  // Several at once (the compare view's "Add all to quote"), with one toast.
  function addMany(items) {
    const list = load();
    const fresh = items.filter((i) => !list.some((x) => x.id === i.id));
    if (!fresh.length) return;
    save([...list, ...fresh.map((i) => ({ ...i, qty: 1 }))]);
    toast(`${fresh.length === 1 ? fresh[0].name : `${fresh.length} instruments`} added. ${inList(list.length + fresh.length)}.`);
    bump();
  }
  const remove = (id) => save(load().filter((x) => x.id !== id));

  /* ---- buttons, counts and the toast ---- */
  function refresh() {
    const list = load();
    const n = list.length;
    $$(".quote-add[data-quote]").forEach((b) => {
      let item;
      try { item = JSON.parse(b.dataset.quote); } catch { return; }
      const added = list.some((x) => x.id === item.id);
      b.classList.toggle("added", added);
      // Pressing it again takes the product out, so a screen reader says so.
      $("span", b).innerHTML = added ? 'Added to quote<span class="sr-only">, press to remove</span>' : "Add to quote";
    });
    $$("[data-quote-count]").forEach((el) => {
      el.textContent = n;
      if (!el.closest("[data-quote-link]")) el.hidden = !n;
    });
    $$("[data-quote-link]").forEach((el) => {
      el.hidden = !n;
      el.title = inList(n);
    });
    renderBox(list);
  }

  let toastEl, toastTimer;
  function toast(text, link = true) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "quote-toast";
      toastEl.setAttribute("role", "status");
      toastEl.innerHTML = `<span></span><a href="${root}enquire.html">View list</a>`;
    }
    // A modal dialog (the quick view) sits above everything in the body, so
    // the toast goes inside it while one is open.
    const dlg = document.querySelector("dialog[open]");
    const host = dlg || document.body;
    const moved = toastEl.parentNode !== host;
    if (moved) host.appendChild(toastEl);
    // Above the compare tray when one is showing, or the compare view's
    // buttons, so neither hides the other (the tray by offsetTop, since its
    // entrance moves it with translate).
    const tray = !dlg && $(".cmp-tray:not([hidden])");
    const foot = dlg && $(".cmp-foot", dlg);
    const top = tray ? tray.offsetTop : foot ? foot.getBoundingClientRect().top : 0;
    toastEl.style.bottom = top ? `${Math.round(innerHeight - top + 12)}px` : "";
    // Where the form is on the page the list is already there, so no link.
    $("a", toastEl).hidden = !link || !!$("[data-quote-box]");
    const say = () => {
      $("span", toastEl).textContent = text;
      toastEl.classList.add("show");
      toastTimer = setTimeout(() => toastEl.classList.remove("show"), 4200);
    };
    clearTimeout(toastTimer);
    // A live region is read out only when its words change after it is in
    // place, so a toast just put in place gets its words a beat later.
    if (moved) {
      $("span", toastEl).textContent = "";
      toastTimer = setTimeout(say, 100);
    } else say();
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest(".quote-add[data-quote]");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    let item;
    try { item = JSON.parse(b.dataset.quote); } catch { return; }
    if (has(item.id)) {
      // A second press takes it out again: say so, with no link once the list is empty.
      remove(item.id);
      const n = load().length;
      toast(n ? `${item.name} removed. ${inList(n)}.` : `${item.name} removed. Your quote list is empty.`, n > 0);
    } else add(item);
  });

  /* ---- the list inside the enquiry form ---- */
  const box = $("[data-quote-box]");
  const rowTpl = $("template[data-quote-row]");
  const field = box && $("textarea[name=Products]");

  function renderBox(list) {
    if (!box) return;
    box.hidden = !list.length;
    $("[data-quote-summary]", box).textContent = `${list.length} ${list.length === 1 ? "product" : "products"}`;
    const ul = $("[data-quote-items]", box);
    // Rebuild only when the products change, so typing a quantity keeps focus.
    const ids = list.map((x) => x.id).join("|");
    if (ul.dataset.ids !== ids) {
      ul.dataset.ids = ids;
      ul.replaceChildren(...list.map((x) => {
        const li = rowTpl.content.firstElementChild.cloneNode(true);
        li.dataset.id = x.id;
        $("img", li).src = root + x.image;
        const a = $("a", li);
        a.href = root + x.href;
        a.textContent = x.name;
        $("small", li).textContent = x.brand;
        const input = $("input", li);
        input.setAttribute("aria-label", `Quantity of ${x.name}`);
        $("[data-step='-1']", li).setAttribute("aria-label", `One fewer ${x.name}`);
        $("[data-step='1']", li).setAttribute("aria-label", `One more ${x.name}`);
        $(".quote-remove", li).setAttribute("aria-label", `Remove ${x.name} from the quote list`);
        return li;
      }));
    }
    for (const x of list) {
      const input = $(`li[data-id="${CSS.escape(x.id)}"] input`, ul);
      if (input && document.activeElement !== input) input.value = x.qty;
    }
    field.disabled = !list.length;
    field.value = list.length ? `\n${list.map((x) => `- ${x.qty} × ${x.name} (${x.brand})`).join("\n")}` : "";
  }

  if (box) {
    const setQty = (id, qty) => {
      const list = load();
      const item = list.find((x) => x.id === id);
      if (!item) return;
      item.qty = Math.min(999, Math.max(1, Math.round(Number(qty)) || 1));
      save(list);
    };
    box.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-id]");
      const step = e.target.closest("[data-step]");
      if (li && step) setQty(li.dataset.id, Number($("input", li).value) + Number(step.dataset.step));
      if (li && e.target.closest(".quote-remove")) {
        // Keep focus in the list: on the next row's remove button, or on the
        // details box once the list is empty.
        const next = (li.nextElementSibling || li.previousElementSibling)?.dataset.id;
        remove(li.dataset.id);
        (next ? $(`li[data-id="${CSS.escape(next)}"] .quote-remove`, box) : $("textarea[name=Message]"))?.focus();
      }
    });
    box.addEventListener("change", (e) => {
      const li = e.target.closest("li[data-id]");
      if (li && e.target.matches("input")) setQty(li.dataset.id, e.target.value);
    });
    $("[data-quote-clear]", box).addEventListener("click", () => {
      save([]);
      $("textarea[name=Message]")?.focus();
    });

    // Arriving with products in the list and no topic chosen: ask for pricing.
    const params = new URLSearchParams(location.search);
    if (load().length && !params.get("topic")) window.EDS?.enquiry?.setTopic("Product pricing");
  }

  // Another tab added or removed something.
  window.addEventListener("storage", (e) => e.key === KEY && refresh());

  window.EDS = Object.assign(window.EDS || {}, { quote: { refresh, clear: () => save([]), addMany } });
  refresh();
})();
