// Tells the IndexNow search engines (Bing, whose index also serves Copilot
// and DuckDuckGo, and Yandex, Naver, Seznam and Yep) which pages a publish
// changed, so they crawl them within hours rather than on their next round.
//
//   node tools/indexnow.mjs <dates from the last publish> [<new dates>]
//   DRY_RUN=1 node tools/indexnow.mjs ...   lists the pages and sends nothing
//
// The publish workflow runs it once the new pages are on gh-pages. Both files
// are page-dates.json (see build.mjs); a page whose fingerprint differs from
// the last publish goes out, and every page goes out when there are no last
// dates or the last publish did not carry the key file (a first run, or a new
// key). It waits until GitHub Pages serves the new dates, so the engines
// fetch the new pages and can find the key. Needs Node 22.
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { site } from "../src/data/content.mjs";

const [lastFile, newFile = "dist/assets/page-dates.json"] = process.argv.slice(2);
const SITE_URL = site.url.replace(/\/+$/, "");
const key = site.indexNowKey;
const read = (f) => (f && existsSync(f) && readFileSync(f, "utf8").trim() ? JSON.parse(readFileSync(f, "utf8")) : null);
const last = read(lastFile);
const next = read(newFile);
if (!next) throw new Error(`No page dates at ${newFile}; run the build first`);

// The workflow fetched the last publish into FETCH_HEAD to read its dates.
let keyWasLive = false;
try {
  execFileSync("git", ["cat-file", "-e", `FETCH_HEAD:${key}.txt`], { stdio: "ignore" });
  keyWasLive = true;
} catch {}
const all = !last || !keyWasLive;
const files = Object.keys(next).filter((f) => f !== "404.html" && (all || last[f]?.hash !== next[f].hash));
if (!files.length) {
  console.log("No page changed since the last publish, so there is nothing to send.");
  process.exit(0);
}
const urlList = files.map((f) => `${SITE_URL}/${f === "index.html" ? "" : f}`);
if (process.env.DRY_RUN) {
  console.log(`Would send ${urlList.length} ${all ? "pages (all of them)" : "changed pages"}:\n${urlList.join("\n")}`);
  process.exit(0);
}

// GitHub Pages takes a minute or two to serve a push to gh-pages.
const want = JSON.stringify(next);
for (let i = 0; ; i++) {
  const live = await fetch(`${SITE_URL}/assets/page-dates.json`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (live && JSON.stringify(live) === want) break;
  if (i === 40) throw new Error("GitHub Pages is still serving the last publish after 10 minutes, so nothing was sent");
  await new Promise((done) => setTimeout(done, 15000));
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE_URL).host, key, keyLocation: `${SITE_URL}/${key}.txt`, urlList }),
});
// 200 and 202 both mean the list was taken; 202 while the key is checked.
if (res.status !== 200 && res.status !== 202) throw new Error(`IndexNow answered ${res.status}: ${await res.text()}`);
console.log(`Sent ${urlList.length} ${all ? "pages (all of them)" : "changed pages"} to IndexNow (${res.status}):\n${urlList.join("\n")}`);
