// The private link for the FlowSense video tour. The film tells competitors
// too much to sit on the public site (EDS, 11 November 2026), and this
// repository is public, so the film is never committed: EDS uploads it in the
// admin dashboard and it stays on the server's disk, in DATA_DIR/video.
// It plays at /watch/<code>, where <code> is 32 random characters. Nothing
// links there and search engines are told to stay away, so only people who
// are sent the link can find it. Making a new link in the dashboard stops the
// old one working. The only thing recorded is how many times it was played.
import { randomBytes, timingSafeEqual } from "node:crypto";
import { createReadStream, createWriteStream, mkdirSync, readFileSync } from "node:fs";
import { open, rename, rm, stat, statfs, truncate, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { site } from "../src/data/content.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "..", "dist");
const MAX_BYTES = 500e6; // the disk is shared with the analytics database
const CHUNK_MAX = 16 * 2 ** 20; // the dashboard sends 8 MiB at a time

const ASSETS = {
  "watch.css": [path.join(HERE, "watch", "watch.css"), "text/css; charset=utf-8"],
  "watch.js": [path.join(HERE, "watch", "watch.js"), "text/javascript; charset=utf-8"],
  "logo.png": [path.join(DIST, "assets/img/eds-logo-colour.png"), "image/png"],
  "favicon.png": [path.join(DIST, "assets/img/favicon-32.png"), "image/png"],
  "saira.woff2": [path.join(DIST, "assets/fonts/saira-semiexpanded-latin.woff2"), "font/woff2"],
  "aileron-400.woff2": [path.join(DIST, "assets/fonts/aileron-latin-400-normal.woff2"), "font/woff2"],
  "aileron-600.woff2": [path.join(DIST, "assets/fonts/aileron-latin-600-normal.woff2"), "font/woff2"],
};

// Inline styles are allowed only because WebKit's own video controls use them.
const HEADERS = {
  "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; form-action 'none'; base-uri 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cross-Origin-Resource-Policy": "same-origin",
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const mail = `<a href="mailto:${site.email}">${site.email}</a>`;
const call = `<a href="${site.phoneHref}">${site.phone}</a>`;

const page = (title, main) => `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>${title}</title>
<link rel="icon" type="image/png" sizes="32x32" href="/watch/assets/favicon.png">
<link rel="stylesheet" href="/watch/assets/watch.css">
<script src="/watch/assets/watch.js" defer></script>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="logo" href="${site.url}/"><img src="/watch/assets/logo.png" alt="EDS, Environmental Data Services" width="189" height="48"></a>
</div></header>
<main class="wrap">
${main}
</main>
<footer class="foot"><div class="wrap">
  <p>${site.name} · ${call} · ${mail}</p>
</div></footer>
</body>
</html>`;

const filmPage = (code, seconds) => page("FlowSense video tour | EDS", `
  <p class="eyebrow">EDS FlowSense</p>
  <h1>The FlowSense video tour</h1>
  <p class="lede">${seconds >= 90 ? `A ${Math.round(seconds / 60)}-minute` : "A"} narrated tour of every screen.</p>
  <div class="player">
    <video controls playsinline preload="metadata" controlslist="nodownload" src="/watch/${code}/tour.mp4#t=0.1" data-played="/watch/${code}/played">
      <p>Your browser can't play this video. Call ${call} and we'll show you FlowSense another way.</p>
    </video>
  </div>
  <div class="after">
    <p>Questions about what you've seen? Call ${call} or email ${mail}.</p>
    <a class="btn" href="${site.url}/enquire.html?topic=EDS+FlowSense">Request a walkthrough</a>
  </div>
  <p class="fine">This link is private. Please keep it within your organisation.</p>`);

const goneHtml = page("Link not found | EDS", `
  <p class="eyebrow">EDS FlowSense</p>
  <h1>This link isn't working</h1>
  <p class="lede">It may have been replaced with a new one. Ask the person who sent it, or call ${call} or email ${mail} and we'll send you the current link.</p>`);

// The film's running time, from the mvhd box inside moov. 0 if it can't be read.
async function duration(file) {
  const fh = await open(file);
  try {
    const { size } = await fh.stat();
    const box = Buffer.alloc(16);
    const find = async (type, from, to) => {
      for (let at = from; at + 8 <= to;) {
        await fh.read(box, 0, 16, at);
        let len = box.readUInt32BE(0), head = 8;
        if (len === 1) { len = Number(box.readBigUInt64BE(8)); head = 16; } else if (len === 0) len = to - at;
        if (len < head) return null;
        if (box.toString("latin1", 4, 8) === type) return { at: at + head, end: at + len };
        at += len;
      }
      return null;
    };
    const moov = await find("moov", 0, size);
    const mvhd = moov && await find("mvhd", moov.at, moov.end);
    if (!mvhd) return 0;
    const b = Buffer.alloc(32);
    await fh.read(b, 0, 32, mvhd.at);
    const v1 = b[0] === 1;
    const scale = b.readUInt32BE(v1 ? 20 : 12);
    const units = v1 ? Number(b.readBigUInt64BE(24)) : b.readUInt32BE(16);
    return scale ? Math.round(units / scale) : 0;
  } finally {
    await fh.close();
  }
}

export function openVideo(dataDir) {
  const DIR = path.join(dataDir, "video");
  const FILM = path.join(DIR, "tour.mp4");
  const PART = path.join(DIR, "upload.part");
  const STATE = path.join(DIR, "link.json");
  mkdirSync(DIR, { recursive: true });

  // code: the link's secret part; made: when it was made; plays and lastPlay
  // count plays of this link; name, size, seconds and uploaded describe the film.
  let state = { code: "", made: 0, plays: 0, lastPlay: 0, name: "", size: 0, seconds: 0, uploaded: 0 };
  try { state = { ...state, ...JSON.parse(readFileSync(STATE, "utf8")) }; } catch {}
  let saving = Promise.resolve();
  const save = () => (saving = saving
    .then(() => writeFile(`${STATE}.tmp`, JSON.stringify(state, null, 2)))
    .then(() => rename(`${STATE}.tmp`, STATE))
    .catch((err) => console.error("video: could not save the link", err)));
  const newCode = () => { state.code = randomBytes(24).toString("base64url"); state.made = Date.now(); state.plays = 0; state.lastPlay = 0; };
  const isCode = (given) => {
    const a = Buffer.from(given || ""), b = Buffer.from(state.code);
    return b.length > 0 && a.length === b.length && timingSafeEqual(a, b);
  };

  const send = (res, code, type, body, extra = {}) => { res.writeHead(code, { ...HEADERS, "Content-Type": type, ...extra }); res.end(body); };
  const gone = (req, res) => send(res, 404, "text/html; charset=utf-8", req.method === "HEAD" ? undefined : goneHtml, { "Cache-Control": "no-store" });

  // The film, in whatever byte range the player asks for, so it can seek.
  async function sendFilm(req, res) {
    let info;
    try { info = await stat(FILM); } catch { return gone(req, res); }
    const size = info.size;
    const modified = info.mtime.toUTCString();
    const headers = { ...HEADERS, "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600", "Last-Modified": modified };
    let start = 0, end = size - 1, status = 200;
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || "").trim());
    const ifRange = req.headers["if-range"];
    if (m && (m[1] || m[2]) && (!ifRange || ifRange === modified)) {
      if (m[1]) { start = Number(m[1]); if (m[2]) end = Math.min(Number(m[2]), size - 1); }
      else start = Math.max(0, size - Number(m[2]));
      if (start > end) { res.writeHead(416, { ...headers, "Content-Range": `bytes */${size}` }); return res.end(); }
      status = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
    }
    headers["Content-Length"] = end - start + 1;
    res.writeHead(status, headers);
    if (req.method === "HEAD") return res.end();
    await pipeline(createReadStream(FILM, { start, end }), res).catch(() => {}); // the viewer seeked or left
  }

  // Public: /watch/assets/<file>, /watch/<code>, /watch/<code>/tour.mp4 and
  // /watch/<code>/played (the page posts it once, when the film first plays).
  async function watch(req, res, url) {
    const [, , first = "", second = "", ...rest] = url.pathname.split("/");
    if (first === "assets" && ASSETS[second] && !rest.length) {
      const [file, type] = ASSETS[second];
      try { return send(res, 200, type, readFileSync(file), { "Cache-Control": "public, max-age=86400" }); } catch { return gone(req, res); }
    }
    if (!isCode(first) || rest.length || !state.size) return gone(req, res);
    const read = req.method === "GET" || req.method === "HEAD";
    if (!second && read) return send(res, 200, "text/html; charset=utf-8", req.method === "HEAD" ? undefined : filmPage(state.code, state.seconds), { "Cache-Control": "no-store" });
    if (second === "tour.mp4" && read) return sendFilm(req, res);
    if (second === "played" && req.method === "POST") {
      req.resume();
      state.plays += 1;
      state.lastPlay = Date.now();
      save();
      res.writeHead(204, HEADERS);
      return res.end();
    }
    return gone(req, res);
  }

  const view = (origin) => ({
    link: state.code && state.size ? `${origin}/watch/${state.code}` : null,
    made: state.made, plays: state.plays, lastPlay: state.lastPlay,
    name: state.name, size: state.size, seconds: state.seconds, uploaded: state.uploaded,
  });
  const refuse = (req, status, error) => { req.resume(); return [status, { error }]; };

  // One piece of an upload, sent in order: ?offset=<bytes so far>&total=<file size>&name=<file name>.
  // The last piece checks the file is an MP4 and puts it in place of the old one.
  async function upload(req, q, origin) {
    const offset = Number(q.offset), total = Number(q.total);
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(total) || offset < 0 || offset >= total) return refuse(req, 400, "That upload request wasn't complete.");
    if (total > MAX_BYTES) return refuse(req, 413, `That file is over ${MAX_BYTES / 1e6} MB.`);
    if (offset === 0) {
      const disk = await statfs(DIR).catch(() => null);
      if (disk && disk.bavail * disk.bsize < total + 50e6) return refuse(req, 507, "There isn't room for that file on the server's disk.");
    } else {
      // A piece sent again (its answer was lost) replaces what came of it before.
      const have = await stat(PART).then((s) => s.size, () => -1);
      if (have < offset) return refuse(req, 409, "The upload was interrupted. Please start it again.");
      if (have > offset) await truncate(PART, offset);
    }
    const limit = Math.min(CHUNK_MAX, total - offset);
    let received = 0;
    try {
      await pipeline(req, async function* (chunks) {
        for await (const chunk of chunks) {
          received += chunk.length;
          if (received > limit) throw new Error("piece too big");
          yield chunk;
        }
      }, createWriteStream(PART, { flags: offset === 0 ? "w" : "a" }));
    } catch {
      if (offset > 0) await truncate(PART, offset).catch(() => {}); // so the piece can be sent again
      return [400, { error: "The upload was interrupted. Please start it again." }];
    }
    if (offset + received < total) return [200, { received: offset + received }];

    const head = Buffer.alloc(8);
    const fh = await open(PART);
    await fh.read(head, 0, 8, 0).finally(() => fh.close());
    if (head.toString("latin1", 4, 8) !== "ftyp") {
      await rm(PART, { force: true });
      return [415, { error: "That file isn't an MP4 video." }];
    }
    const seconds = await duration(PART).catch(() => 0);
    await rename(PART, FILM);
    Object.assign(state, { name: String(q.name || "").replace(/[^\w .()-]/g, "").slice(0, 120) || "video.mp4", size: total, seconds, uploaded: Date.now() });
    if (!state.code) newCode();
    await save();
    return [200, { received: total, ...view(origin) }];
  }

  // The dashboard's calls, behind its sign-in: GET /admin/api/video for the
  // link and the film's details, PUT .../upload, POST .../new-link.
  async function api(req, route, q, origin) {
    if (route === "/admin/api/video" && req.method === "GET") return [200, view(origin)];
    // A custom header makes another site's script ask permission first, which it never gets.
    if (req.headers["x-eds-admin"] !== "1") return refuse(req, 403, "Not allowed.");
    if (route === "/admin/api/video/upload" && req.method === "PUT") return upload(req, q, origin);
    if (route === "/admin/api/video/new-link" && req.method === "POST") {
      req.resume();
      if (!state.size) return [409, { error: "Upload the video first." }];
      newCode();
      await save();
      return [200, view(origin)];
    }
    return refuse(req, 404, "Not found.");
  }

  return { watch, api };
}
