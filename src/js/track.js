// Visit counting for the admin dashboard (server/). No cookies, and nothing
// is stored on the visitor's device. Reports page views, time on screen,
// scroll depth, document downloads, email and phone clicks, links to other
// sites and form submissions.
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

  /* ---- clicks: downloads, email and phone, other sites ---- */
  const FILE = /\.(pdf|zip|exe|msi|dmg|docx?|xlsx?|pptx?|csv)$/i;
  // the link's words, with a space between nested elements ("Datasheet PDF", not "DatasheetPDF")
  const text = (el) => {
    const parts = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) parts.push(walk.currentNode.nodeValue);
    return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 120);
  };
  const onClick = (e) => {
    if (e.type === "auxclick" && e.button !== 1) return;
    const a = e.target.closest?.("a[href]");
    if (!a) return;
    const label = text(a) || a.getAttribute("aria-label") || "";
    if (/^(mailto|tel):/i.test(a.href)) return send({ type: "contact", target: a.href.split("?")[0], label });
    let u;
    try { u = new URL(a.href); } catch { return; }
    if (FILE.test(u.pathname)) send({ type: "download", target: u.origin + u.pathname, label });
    else if (u.host !== location.host && /^https?:$/.test(u.protocol)) send({ type: "outbound", target: u.origin + u.pathname, label });
  };
  document.addEventListener("click", onClick, true);
  document.addEventListener("auxclick", onClick, true);

  /* ---- forms ---- */
  document.addEventListener("submit", (e) => {
    const f = e.target;
    const subject = f.elements?.subject?.value;
    send({ type: "form", label: `${f.dataset.track || "Form"}${subject ? ` · ${subject}` : ""}` });
  }, true);

  pageview();
})();
