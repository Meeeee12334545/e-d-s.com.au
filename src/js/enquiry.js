// The enquiry form (enquiryForm() in build.mjs). On enquire.html and
// contact.html it is part of the page; everywhere else it sits in a panel
// (dialog.ask) that slides in over the page from any link to enquire.html,
// so asking never means leaving the page. Links carry ?topic=, ?product=
// and ?mode=: they pick the topic, name the product and note the way of
// working. If this script doesn't run, the links simply open enquire.html.
// Sending, and the error under a field, are site.js's (EDS.form).
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const { send, check } = window.EDS?.form || {};
  if (!send) return;
  const fine = matchMedia("(pointer: fine)");
  const dialog = $("dialog.ask");
  const pageForm = $("main form.enquiry");
  let form = pageForm;
  let api = pageForm && setup(pageForm);

  /* ---- the form ---- */
  function setup(form) {
    const el = form.elements;
    const topics = $$("input[name=Topic]", form);
    const detail = $("[data-topic-detail]", form);
    const pick = $("select", detail);
    const message = el.Message;
    const phone = el.Phone;
    const wantsCall = $("[data-wants-call]", form);
    const ctx = $("[data-context]", form);
    const fields = $(".form-fields", form);
    const modes = JSON.parse(form.dataset.modes || "{}");

    function sync() {
      const tile = topics.find((t) => t.checked);
      detail.hidden = tile?.dataset.topic !== "monitoring";
      el.subject.value = tile ? tile.dataset.subject || pick.value || "Monitoring services" : "General enquiry";
      message.placeholder = tile?.dataset.prompt || message.dataset.prompt;
      // Asking for a call makes the phone number the one thing we need.
      phone.required = wantsCall.checked;
      el["Reply by"].value = wantsCall.checked ? "Phone call" : "Email";
      phone.closest(".field").classList.toggle("needed", wantsCall.checked);
      if (!phone.required && phone.hasAttribute("aria-invalid")) check(phone);
    }

    // Picks the topic (or the service under "Monitoring service") whose
    // subject matches, as the ?topic= links and the quote list ask for.
    function setTopic(text) {
      const t = String(text || "").trim().toLowerCase();
      if (!t) return false;
      const tile = topics.find((i) => i.dataset.subject.toLowerCase() === t);
      const opt = [...pick.options].find((o) => o.value && o.text.toLowerCase() === t);
      if (tile) tile.checked = true;
      else if (opt) {
        topics.find((i) => i.dataset.topic === "monitoring").checked = true;
        pick.value = opt.value;
      } else return false;
      sync();
      return true;
    }

    // The product and way of working the link named, shown above the
    // message so the visitor can see what goes with it (or take it off).
    function setContext(product = "", way = "") {
      el.Product.value = product;
      el["Way of working"].value = way;
      $("[data-context-label]", ctx).textContent = product ? "Enquiring about" : "Way of working";
      $("[data-context-product]", ctx).textContent = product || way;
      const w = $("[data-context-way]", ctx);
      w.textContent = product && way ? `Way of working: ${way}` : "";
      w.hidden = !w.textContent;
      ctx.hidden = !product && !way;
    }
    $("[data-context-clear]", ctx).addEventListener("click", () => {
      setContext();
      message.focus();
    });

    // A link's ?topic=, ?product= and ?mode=. A link that names any of them
    // replaces what the last one named; one that names none (the footer's
    // "Start an enquiry") leaves the form as the visitor left it. Says
    // whether the link named anything, so the caller can start them on the
    // message.
    function apply(params) {
      const named = ["topic", "product", "mode"].some((k) => params.get(k));
      if (named) {
        setTopic(params.get("topic"));
        setContext(params.get("product") || "", modes[params.get("mode")] || "");
      }
      // Products waiting in the quote list and no topic yet: it's about pricing.
      if (!topics.some((t) => t.checked) && window.EDS.quote?.count()) setTopic("Product pricing");
      sync();
      return named;
    }

    function summarise() {
      const listed = el.Products.disabled ? 0 : el.Products.value.trim().split("\n").filter(Boolean).length;
      return {
        name: el.Name.value.trim().split(/\s+/)[0],
        topic: el.subject.value,
        products: [el.Product.value, listed ? `${listed} ${listed === 1 ? "product" : "products"} from your quote list` : ""].filter(Boolean).join(", "),
        way: el["Way of working"].value,
        reply: wantsCall.checked ? `By phone, on ${phone.value.trim()}` : `By email, to ${el.Email.value.trim()}`,
      };
    }
    function showSummary(s) {
      $("[data-done-title]", form).textContent = s.name ? `Thanks, ${s.name}. Your enquiry is with our team.` : "Thanks. Your enquiry is with our team.";
      $$("[data-sum]", form).forEach((dd) => {
        dd.textContent = s[dd.dataset.sum] || "";
        dd.parentElement.hidden = !dd.textContent;
      });
    }
    // Back from the thank-you to an empty form (the name and contact details stay).
    function showFields() {
      if (!fields.hidden) return;
      $$("[data-done]", form).forEach((d) => (d.hidden = true));
      fields.hidden = false;
      sync();
    }

    form.addEventListener("input", sync);
    form.addEventListener("change", sync);
    // Once a field has been flagged, re-check it as the visitor fixes it.
    form.addEventListener("input", (e) => e.target.hasAttribute?.("aria-invalid") && check(e.target));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.hasAttribute("aria-busy")) return;
      const bad = $$("[required]", form).filter((f) => !check(f));
      if (bad.length) {
        bad[0].focus({ preventScroll: true });
        bad[0].scrollIntoView({ block: "center" });
        return;
      }
      const btn = $("button[type=submit]", form), label = $("span", btn), was = label.textContent;
      $$("[data-done]", form).forEach((d) => (d.hidden = true));
      form.setAttribute("aria-busy", "true");
      btn.setAttribute("aria-disabled", "true");
      label.textContent = "Sending…";
      const summary = summarise();
      const subject = el.subject.value;
      const sent = await send(form);
      // For the analytics dashboard (track.js): whether it actually went.
      form.dispatchEvent(new CustomEvent("eds:form", { bubbles: true, detail: { sent, subject } }));
      form.removeAttribute("aria-busy");
      btn.removeAttribute("aria-disabled");
      label.textContent = was;
      if (sent) {
        // Clear everything that was sent (topic, product, quote list,
        // message), keeping name and contact details for another.
        const keep = ["Name", "Organisation", "Email", "Phone"].map((k) => [k, el[k].value]);
        form.reset();
        keep.forEach(([k, v]) => (el[k].value = v));
        setContext(); // hidden inputs keep their value through reset()
        window.EDS.quote?.clear();
        showSummary(summary);
        sync();
      }
      const done = $(`[data-done=${sent ? "sent" : "error"}]`, form);
      done.hidden = false;
      // a live region that appears already full is often not read out: show it
      // empty, then put its words back on the next frame
      if (done.getAttribute("role") === "status") { const words = done.innerHTML; done.innerHTML = ""; requestAnimationFrame(() => (done.innerHTML = words)); }
      if (sent) {
        fields.hidden = true;
        done.focus({ preventScroll: true });
        const panel = form.closest("dialog");
        if (panel) panel.scrollTop = 0;
        else form.scrollIntoView({ block: "start" });
      }
    });
    form.addEventListener("click", (e) => {
      if (!e.target.closest("[data-form-edit]")) return;
      showFields();
      (topics.find((t) => t.checked) || topics[0]).focus();
    });

    // Where to start: the message once the link has said what it's about,
    // otherwise the topics. On a touch screen, opening the keyboard at once
    // would cover what the link filled in, so the topics there too.
    const start = (named) => (named && fine.matches ? message : topics.find((t) => t.checked) || topics[0]);
    return { apply, setTopic, showFields, start };
  }

  /* ---- links that start an enquiry ---- */
  // Any link to enquire.html, the header's "Contact us" (data-ask: without
  // this script it goes to the contact page), and on the contact page its
  // own ?topic= links (the Sales and Service cards). A click with a modifier
  // key, or one that opens a new tab, goes through as a link.
  function enquiryLink(e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
    const a = e.target.closest("a[href]");
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return null;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return null;
    if (a.hasAttribute("data-ask")) return new URL(location.pathname, location.href); // names no topic or product
    if (/\/enquire(\.html)?$/.test(url.pathname)) return url;
    return pageForm && url.pathname === location.pathname && url.search ? url : null;
  }

  if (pageForm) {
    // Arriving from a "Request pricing" or "Start an enquiry" link: pick its
    // topic, name its product, and bring the form into view (on the contact
    // page it starts below the contact details).
    const named = api.apply(new URLSearchParams(location.search));
    if (named) {
      requestAnimationFrame(() => {
        if (pageForm.getBoundingClientRect().top > innerHeight / 2) pageForm.scrollIntoView({ block: "start" });
        // On a touch screen, nothing has been touched yet: leave focus be.
        if (fine.matches) api.start(true).focus({ preventScroll: true });
      });
    }
    // Links on this page that start an enquiry fill the form in place
    // rather than loading the page again.
    document.addEventListener("click", (e) => {
      const url = enquiryLink(e);
      if (!url) return;
      e.preventDefault();
      api.showFields();
      const named = api.apply(url.searchParams);
      pageForm.scrollIntoView({ block: "start" });
      api.start(named).focus({ preventScroll: true });
    });
  } else if (dialog) {
    const slot = $("[data-ask-slot]", dialog);
    const open = (params = new URLSearchParams()) => {
      if (!api) {
        // First time: the form comes out of its template, and the quote
        // list is drawn into it.
        slot.replaceWith($("template[data-ask-form]", dialog).content.cloneNode(true));
        form = $("form.enquiry", dialog);
        api = setup(form);
        window.EDS.quote?.refresh();
      }
      // Out of the way first: the phone menu, and any other dialog (the
      // product quick view or compare, search).
      $(".drawer.open .drawer-close")?.click();
      $$("dialog[open]").forEach((d) => d !== dialog && d.close());
      api.showFields();
      const named = api.apply(params);
      if (!dialog.open) {
        dialog.showModal();
        dialog.scrollTop = 0;
      }
      api.start(named).focus({ preventScroll: true });
    };
    document.addEventListener("click", (e) => {
      const url = enquiryLink(e);
      if (!url) return;
      e.preventDefault();
      open(url.searchParams);
    });

    dialog.addEventListener("click", (e) => {
      // The close button, and "Done" once it has gone.
      if (e.target.closest("[data-ask-close]")) return dialog.close();
      // A click on the dimmed page beside the panel.
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
        return;
      }
      // A link to somewhere on this same page ("Add more products" on the
      // products page): close the panel so the page can be seen.
      const a = e.target.closest("a[href]");
      if (a && a.pathname === location.pathname && a.hash) dialog.close();
    });
    // Closed after sending: the next time it opens, it's a fresh form.
    dialog.addEventListener("close", () => api?.showFields());

    window.EDS.enquiry = { open };
  }
})();
