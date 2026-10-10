// Visit counting for the admin dashboard (server/). No cookies, and nothing
// is stored on the visitor's device. Reports page views, time on screen,
// scroll depth, and each thing a visitor does: every link and button they
// click (named by its words and where on the page it is), downloads, email
// and phone clicks, links to other sites, what they type into site search,
// options they pick in forms (never what they type) and form submissions.
(() => {
  const me = document.currentScript;
  if (!me || location.protocol === "file:" || navigator.webdriver) return;
  try { if (localStorage.getItem("eds-analytics-ignore")) return; } catch {}
  const endpoint = me.dataset.endpoint || new URL("../../api/collect", me.src).href;

  // text/plain keeps the request "simple", so it works across origins too
  const send = (data) => {
    const body = JSON.stringify({ ...data, url: location.href });
    if (!navigator.sendBeacon?.(endpoint, body)) fetch(endpoint, { method: "POST", body, keepalive: true, mode: "no-cors" }).catch(() => {});
  };

  /* ---- page views, time on screen, scroll depth ---- */
  let pid, shownAt, engaged, reported, depth;
  const pageview = () => {
    pid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    engaged = reported = depth = 0;
    shownAt = document.visibilityState === "visible" ? performance.now() : 0;
    send({
      type: "pageview", pid, title: document.title, referrer: document.referrer, width: window.innerWidth || screen.width,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone, status: Number(me.dataset.status) || undefined,
    });
  };
  const measure = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    depth = Math.max(depth, max > 0 ? Math.round(Math.min(1, window.scrollY / max) * 100) : 100);
  };
  const flush = () => {
    if (shownAt) { engaged += performance.now() - shownAt; shownAt = 0; }
    measure();
    if (engaged - reported > 500) { reported = engaged; send({ type: "engagement", pid, engaged: Math.round(engaged), scroll: depth }); }
  };
  window.addEventListener("scroll", measure, { passive: true });
  document.addEventListener("visibilitychange", () => (document.visibilityState === "hidden" ? flush() : (shownAt = performance.now())));
  window.addEventListener("pagehide", flush);
  window.addEventListener("pageshow", (e) => { if (e.persisted) pageview(); }); // back/forward cache

  /* ---- what was clicked, named the way a person would name it ---- */
  const FILE = /\.(pdf|zip|exe|msi|dmg|docx?|xlsx?|pptx?|csv)$/i;
  const words = (s, max = 120) => (s || "").replace(/\s+/g, " ").trim().slice(0, max);
  // the element's words, with a space between nested elements ("Datasheet PDF", not "DatasheetPDF")
  const text = (el) => {
    const parts = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest("kbd, [hidden]") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    while (walk.nextNode()) parts.push(walk.currentNode.nodeValue);
    return words(parts.join(" "));
  };
  // A card that is one big link reads as its heading, not every word on it.
  const nameOf = (el) => {
    const own = el.dataset.trackLabel || el.getAttribute("aria-label");
    if (own) return words(own);
    const all = text(el);
    const head = all.length > 60 && el.querySelector("h2, h3, h4, b, strong");
    return (head && text(head)) || all || words(el.querySelector("img[alt]")?.alt || el.title || el.value);
  };
  // Which product, way of working or question a button belongs to, when its own words do not say.
  const itemOf = (el, label) => {
    const holder = el.closest("[data-track-item], article, dialog.qv, .way, .result, .office, .faq-item");
    const name = holder && words(holder.dataset.trackItem || text(holder.querySelector("#qv-name, h2, h3, h4, summary") || document.createElement("i")), 100);
    return name && !label.includes(name) ? name : undefined;
  };
  // Where on the page it was: the header, the footer, a named section…
  const AREAS = [
    [".header", "Header"], [".drawer", "Phone menu"], [".actionbar", "Phone action bar"], ["dialog.search", "Site search"],
    ["dialog.qv", "Product quick view"], [".quote-toast", "Quote list message"], [".crumbs", "Breadcrumb trail"], [".hero-toc", "“On this page” list"],
    [".footer", "Footer"], [".aside", "Sidebar"], ["#enquiry, .enquiry", "Enquiry form"], [".finder", "Instrument finder"],
  ];
  const areaOf = (el) => {
    for (const [sel, name] of AREAS) {
      if (!el.closest(sel)) continue;
      const menu = sel === ".header" && el.closest(".nav-item.has-mega")?.querySelector(".nav-link");
      return menu && menu !== el ? `Header › ${text(menu)} menu` : name;
    }
    const section = el.closest("section");
    if (!section) return "Page";
    if (section.matches(".hero, .page-hero")) return "Top of the page";
    const head = section.querySelector("h1, h2");
    return head ? `“${text(head).slice(0, 80)}” section` : section.id ? `${section.id.replace(/-/g, " ")} section` : "Page";
  };

  /* ---- searches: what people typed into site search and the instrument finder ---- */
  let typed = null, typedTimer, lastSearch = "";
  const flushSearch = () => {
    clearTimeout(typedTimer);
    if (!typed) return;
    const q = words(typed.value, 100), el = typed;
    typed = null;
    if (q.length < 2 || q.toLowerCase() === lastSearch) return;
    lastSearch = q.toLowerCase();
    send({ type: "search", label: q, area: areaOf(el) });
  };
  document.addEventListener("input", (e) => {
    if (!e.target.matches?.("input[type=search]")) return;
    typed = e.target;
    clearTimeout(typedTimer);
    typedTimer = setTimeout(flushSearch, 1500);
  }, true);
  document.addEventListener("focusout", (e) => { if (e.target === typed) flushSearch(); }, true);

  /* ---- clicks: every link and button ---- */
  let lastClick = "", lastClickAt = 0;
  const report = (data) => {
    // a double click, or one click seen twice, is one action
    const key = JSON.stringify(data);
    if (key === lastClick && performance.now() - lastClickAt < 800) return;
    lastClick = key;
    lastClickAt = performance.now();
    send(data);
  };
  const CLICKABLE = "a[href], button, summary, [role=button], [role=tab], [role=menuitem], input[type=submit], input[type=button]";
  const onClick = (e) => {
    if (e.type === "auxclick" && e.button !== 1) return;
    const el = e.target.closest?.(CLICKABLE);
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
    flushSearch();
    let label = nameOf(el);
    const area = areaOf(el);
    // In search, the words searched for say which results these were.
    const item = el.closest("dialog.search") ? (() => { const q = words(el.closest("dialog").querySelector("input")?.value, 100); return q ? `search results for “${q}”` : "suggested search results"; })() : itemOf(el, label);
    if (el.matches("a[href]")) {
      if (/^(mailto|tel):/i.test(el.href)) return report({ type: "contact", target: el.href.split("?")[0], label, area });
      let u;
      try { u = new URL(el.href); } catch { return; }
      if (FILE.test(u.pathname)) return report({ type: "download", target: u.origin + u.pathname, label, area, item });
      if (u.host !== location.host) return /^https?:$/.test(u.protocol) && report({ type: "outbound", target: u.origin + u.pathname, label, area, item });
      // a link on this site: where it goes, from the site root, with any section it jumps to
      const samePage = u.pathname === location.pathname && u.search === location.search;
      return report({ type: "link", target: samePage && u.hash ? u.hash : u.pathname + u.search + u.hash, label, area, item });
    }
    // Menus, questions and panels that open and close say which way they went.
    const expandable = el.matches("summary") ? el.parentElement : el.hasAttribute("aria-expanded") ? el : null;
    if (expandable) {
      // A header menu that hover has opened stays open when clicked (site.js).
      const open = expandable.matches("details") ? expandable.open : el.matches(".nav-link") ? el.parentElement.dataset.by === "click" : el.getAttribute("aria-expanded") === "true";
      if (el.matches(".nav-link")) label += " menu";
      return report({ type: "toggle", target: open ? "close" : "open", label, area, item });
    }
    if (el.getAttribute("role") === "tab") return report({ type: "tab", label, area, item });
    if (el.matches(".quote-add")) label = el.classList.contains("added") ? "Remove from quote" : "Add to quote";
    report({ type: "button", label, area, item });
  };
  document.addEventListener("click", onClick, true);
  document.addEventListener("auxclick", onClick, true);

  /* ---- choices in forms: the option picked, never anything typed ---- */
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (!el.matches?.("select, input[type=radio], input[type=checkbox]") || el.hidden || el.name === "botcheck") return;
    const field = words(el.getAttribute("aria-label") || el.closest("fieldset")?.querySelector("legend")?.textContent || (el.type === "checkbox" ? "" : el.labels?.[0]?.firstChild?.nodeValue) || el.name, 80).replace(/\s*\(?optional\)?$/i, "");
    let label;
    if (el.matches("select")) label = words(el.selectedOptions[0]?.textContent);
    else if (el.type === "radio") label = text(el.labels?.[0] || el) || el.value;
    else label = `${el.checked ? "Ticked" : "Unticked"} “${text(el.labels?.[0] || el) || el.name}”`;
    if (label) send({ type: "choice", label, item: field || undefined, area: areaOf(el) });
  }, true);

  /* ---- forms ---- */
  document.addEventListener("submit", (e) => {
    const f = e.target;
    // The enquiry form is novalidate, so it fires submit while incomplete;
    // site.js stops those, and so do we.
    if (f.checkValidity && !f.checkValidity()) return;
    const subject = f.elements?.subject?.value;
    send({ type: "form", label: `${f.dataset.track || "Form"}${subject ? ` · ${subject}` : ""}`, area: areaOf(f) });
  }, true);
  window.addEventListener("pagehide", flushSearch);

  pageview();
})();
