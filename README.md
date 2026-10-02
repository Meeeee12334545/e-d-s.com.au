# EDS website

The marketing site for Environmental Data Services. The pages are static (no
framework), so `dist/` can be uploaded to any web host. A small optional Node
server in `server/` serves the same pages and adds a private visit-analytics
dashboard at `/admin`.

```bash
npm install
npm run dev      # builds, then runs the server on http://localhost:4173
npm run build    # writes dist/
npm start        # runs the server on an existing dist/
```

`PREVIEW=1 npm run build` adds a no-index tag, for copies that are not the live site.

Every push to `main` publishes a preview copy to GitHub Pages (`.github/workflows/preview.yml` builds with `PREVIEW=1` and pushes `dist/` to the `gh-pages` branch).

## Where things are

| Path | What |
|---|---|
| `src/data/content.mjs` | Every word on the site, the services and their groups, the product lists and the city districts. Edit copy here. |
| `build.mjs` | Page templates. Generates 46 pages, including `404.html`. |
| `src/css/site.css` | All styles and design tokens. |
| `src/js/site.js` | Navigation, scroll reveals, counters, pointer effects, the flow-field background. |
| `src/js/city.js` | The interactive isometric city on the home page. |
| `src/js/lab.js` | The storm and hydrograph simulator. |
| `src/js/widgets.js` | Office map, LIDoTT Alarm demo, EDS Asset Score dial. |
| `src/assets/img/` | Product photos and logos. Reference one with `img("file-name.png")` in `content.mjs`. |
| `content/privacy.txt` | Privacy policy text, carried over from the old site. |
| `src/js/track.js` | Counts visits for the analytics dashboard. No cookies. |
| `server/index.mjs` | The site server: serves `dist/`, takes visits at `/api/collect`, hosts `/admin`. |
| `server/store.mjs` | The SQLite database (`data/analytics.db`) and the dashboard's queries. |
| `server/collect.mjs` | Checks each visit, filters bots, works out source, device and location. |
| `server/admin.mjs`, `server/admin/` | The sign-in and the dashboard page, styles and charts. |

## Analytics dashboard

Sign in at `/admin` to see visitors, visits, page views, bounce rate and time on
page for any period against the period before, plus top pages, entry pages,
sources and campaigns (`utm_*` tags), locations (Australian states from the time
zone), devices, document downloads, email and phone clicks, form submissions,
links to other sites, pages not found, and each recent visit page by page.
Everything exports to CSV.

- **Turn it on** by setting `ADMIN_PASSWORD`. Locally, copy `.env.example` to `.env`
  (git ignores it). Without a password `/admin` explains how to set one.
- **Privacy.** No cookies, and no IP addresses are stored. A visitor is a hash of IP
  and browser with a salt that is replaced daily, so people cannot be followed from
  one day to the next. Bots are filtered out. On the dashboard, tick "Don't count my
  own visits" to leave your browser out.
- **Hosting.** The dashboard needs the server, which runs on any host with Node 22.13
  or later and a persistent disk for `data/` (a VPS, Render, Railway, Fly.io). Run
  `npm ci && npm run build && npm start` behind HTTPS. To keep the pages on a static
  host instead, run the server somewhere else and build the pages with
  `ANALYTICS_ENDPOINT=https://<that server>/api/collect`.
- GitHub Pages preview copies leave the tracker out, since nothing there can receive visits.

Other settings (`PORT`, `DATA_DIR`, `ANALYTICS_TZ`, `SESSION_SECRET`) are described in `.env.example`.

## Design rules (shared with EDS FlowSense)

- **Brand.** FlowSense tokens: teal `#0c5f59` / `#14706a` / `#0d7c72`, Inter for body, Inter Tight for display.
- **Icons.** Lucide only (https://github.com/lucide-icons/lucide, ISC), inlined at build time by `icon()` in `build.mjs`. Stroke 2, round caps. If Lucide lacks a glyph, draw one in the same style; do not mix in Phosphor or Heroicons.
- **Icon motion.** Ideas after animate-ui (https://github.com/imskyleen/animate-ui), written from scratch in CSS because its licence does not allow copying. Gestures last about a second and carry their own rest. Use the individual `rotate` / `translate` / `scale` properties, never `transform`.
- **Motion is full for everyone.** By EDS's decision (2 October 2026) the site always animates and has no reduced-motion mode or switch; it does not follow a device's Reduce Motion setting.
- **Simulations are labelled.** The flow lab, LIDoTT demo, Asset Score dial and FlowSense screens are illustrations and say so on the page. Do not present them as live data, and do not use client site names in them.

## Before this replaces www.e-d-s.com.au

1. **Documents still load from the old Squarespace site.** Datasheets, white papers and software downloads link to `www.e-d-s.com.au/s/...`, so they break as soon as the domain points at this site. Copy them into the project and change `doc()` at the top of `src/data/content.mjs`. (Images are already local, in `src/assets/img`.)
2. **Forms open the visitor's email program.** For a form that submits on the page, connect a form service (most static hosts include one) in `site.js`.
3. Set up redirects from the old page addresses to the new ones.
4. Replace `assets/favicon.svg` (a placeholder wave) with the EDS mark.
