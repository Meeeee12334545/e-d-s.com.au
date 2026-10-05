// The EDS site server. Serves the built site in dist/, records visits at
// /api/collect and hosts the password-protected analytics dashboard at /admin.
//   npm run build && npm start   -> http://localhost:4173
// Settings are environment variables (see .env.example and the README).
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStore } from "./store.mjs";
import { collect } from "./collect.mjs";
import { admin } from "./admin.mjs";
import { openLookup } from "./lookup.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 4173;
const DATA = path.resolve(ROOT, process.env.DATA_DIR || "data");
const store = openStore(DATA);
const lookup = openLookup(store, DATA);
// When the pages live on another host (GitHub Pages) and this server only runs
// analytics, page requests here are sent there so the site has one address.
const PAGES_URL = (process.env.PAGES_URL || "").replace(/\/+$/, "");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".pdf": "application/pdf", ".zip": "application/zip",
};

async function serveStatic(req, res, pathname) {
  try {
    let file = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    if (file !== DIST && !file.startsWith(DIST + path.sep)) throw new Error("outside dist");
    let info = await stat(file);
    if (info.isDirectory()) { file = path.join(file, "index.html"); info = await stat(file); }
    const modified = info.mtime.toUTCString();
    const headers = { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Last-Modified": modified, "Cache-Control": "no-cache" };
    if (req.headers["if-modified-since"] === modified) { res.writeHead(304, headers); return res.end(); }
    res.writeHead(200, headers);
    res.end(req.method === "HEAD" ? undefined : await readFile(file));
  } catch {
    const page = await readFile(path.join(DIST, "404.html")).catch(() => "Not found");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(page);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/collect") return await collect(req, res, store, lookup);
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return await admin(req, res, url, store);
    if (PAGES_URL) { res.writeHead(301, { Location: PAGES_URL + url.pathname + url.search }); return res.end(); }
    await serveStatic(req, res, url.pathname);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
});
server.listen(PORT, () => {
  console.log(`EDS site on http://localhost:${PORT}`);
  console.log(process.env.ADMIN_PASSWORD ? `Analytics dashboard on http://localhost:${PORT}/admin` : "Analytics dashboard is off: set ADMIN_PASSWORD to turn it on");
});
const stop = () => { server.close(() => { store.close(); process.exit(0); }); server.closeAllConnections(); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
