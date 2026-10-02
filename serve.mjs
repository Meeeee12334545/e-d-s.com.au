// A tiny static server for previewing dist/ locally: node serve.mjs
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
const PORT = Number(process.env.PORT) || 4173;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif" };

http
  .createServer(async (req, res) => {
    try {
      let file = path.normalize(path.join(DIST, decodeURIComponent(new URL(req.url, "http://x").pathname)));
      if (!file.startsWith(DIST)) throw new Error("outside dist");
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(await readFile(file));
    } catch {
      const page = await readFile(path.join(DIST, "404.html")).catch(() => "Not found");
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(page);
    }
  })
  .listen(PORT, () => console.log(`EDS site on http://localhost:${PORT}`));
