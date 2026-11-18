// The "FlowSense video link" card: the private link to copy, the film's
// details and how often it has been played, uploading the film (8 MiB at a
// time, so no single request is large) and making a new link. The server
// side is server/watch.mjs.
(() => {
  const body = document.getElementById("video-body");
  if (!body) return;
  const PIECE = 8 * 2 ** 20;
  const NS = "http://www.w3.org/2000/svg";
  const h = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };
  const icon = (name) => {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(NS, "use");
    use.setAttribute("href", `#i-${name}`);
    svg.append(use);
    return svg;
  };
  const button = (cls, name, label) => {
    const b = h("button", `btn ${cls}`);
    b.type = "button";
    b.append(icon(name), h("span", null, label));
    return b;
  };
  const mb = (n) => `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)} MB`;
  const time = new Intl.DateTimeFormat("en-AU", { timeZone: document.getElementById("dash")?.dataset.tz, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  const when = (ms) => time.format(ms);
  const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const hold = (e) => { e.preventDefault(); e.returnValue = ""; };

  async function call(path, opts = {}) {
    const res = await fetch(`/admin/api/video${path}`, { ...opts, headers: { "X-EDS-Admin": "1" } });
    if (res.status === 401) { location.reload(); throw new Error("You've been signed out."); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "That didn't work. Please try again."), { status: res.status });
    return data;
  }

  function render(v, note, failed) {
    body.replaceChildren();
    if (v.link) {
      const row = h("div", "video-row");
      const url = h("input", "video-url");
      url.type = "text";
      url.readOnly = true;
      url.value = v.link;
      url.setAttribute("aria-label", "Private link");
      url.addEventListener("focus", () => url.select());
      const copy = button("btn-primary", "copy", "Copy link");
      copy.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(v.link); } catch { url.focus(); document.execCommand("copy"); }
        copy.lastChild.textContent = "Copied";
        setTimeout(() => { copy.lastChild.textContent = "Copy link"; }, 2000);
      });
      const open = h("a", "btn btn-quiet");
      open.href = v.link;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.append(icon("external-link"), h("span", null, "Open"));
      row.append(url, copy, open);
      const facts = h("ul", "video-facts");
      facts.append(h("li", null, `${v.name} · ${mb(v.size)}${v.seconds ? ` · ${clock(v.seconds)}` : ""} · uploaded ${when(v.uploaded)}`));
      facts.append(h("li", null, v.plays
        ? `Played ${v.plays} ${v.plays === 1 ? "time" : "times"} since this link was made on ${when(v.made)}, most recently ${when(v.lastPlay)}.`
        : `Not played yet. This link was made on ${when(v.made)}.`));
      body.append(row, facts);
    } else {
      body.append(h("p", "sub", "No video yet. Upload the MP4 and its private link appears here."));
    }

    const actions = h("div", "video-actions");
    const pick = h("input");
    pick.type = "file";
    pick.accept = "video/mp4,.mp4";
    pick.hidden = true;
    pick.addEventListener("change", () => { if (pick.files[0]) upload(pick.files[0], v); });
    const up = button(v.link ? "btn-quiet" : "btn-primary", "upload", v.link ? "Replace the video" : "Upload the video");
    up.addEventListener("click", () => pick.click());
    actions.append(up, pick);
    if (v.link) {
      const fresh = button("btn-quiet", "refresh-cw", "Make a new link");
      fresh.addEventListener("click", async () => {
        if (!confirm("Make a new link? The current link will stop working for everyone you've sent it to.")) return;
        try { render(await call("/new-link", { method: "POST" }), "New link made. The old one no longer works."); } catch (err) { render(v, err.message, true); }
      });
      actions.append(fresh);
    }
    body.append(actions);
    if (note) {
      const p = h("p", failed ? "error video-note" : "video-note", note);
      if (failed) p.setAttribute("role", "alert");
      body.append(p);
    }
  }

  async function upload(file, v) {
    window.addEventListener("beforeunload", hold);
    const bar = h("progress", "video-progress");
    bar.max = file.size;
    bar.value = 0;
    bar.setAttribute("aria-label", "Upload progress");
    const label = h("p", "video-note", `Uploading ${file.name}. Keep this tab open.`);
    body.replaceChildren(bar, label);
    try {
      let sent = 0, data;
      while (sent < file.size) {
        const q = new URLSearchParams({ offset: sent, total: file.size, name: file.name });
        const piece = file.slice(sent, sent + PIECE);
        for (let tries = 1; ; tries++) {
          try { data = await call(`/upload?${q}`, { method: "PUT", body: piece }); break; } catch (err) {
            if (tries === 3 || (err.status && err.status !== 400 && err.status < 500)) throw err;
            await new Promise((r) => setTimeout(r, 1500 * tries));
          }
        }
        sent = data.received;
        bar.value = sent;
        label.textContent = `Uploading ${file.name}: ${mb(sent)} of ${mb(file.size)}. Keep this tab open.`;
      }
      render(data, v.link ? "Video replaced. The link hasn't changed." : "Uploaded. Copy the link and send it to your clients.");
    } catch (err) {
      render(v, err.message, true);
    } finally {
      window.removeEventListener("beforeunload", hold);
    }
  }

  call("").then((v) => render(v)).catch((err) => { body.replaceChildren(h("p", "error", err.message)); });
})();
