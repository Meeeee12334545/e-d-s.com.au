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

`STATIC_HOST=1 npm run build` leaves out the visit tracker, for hosts with no server (GitHub Pages). `PREVIEW=1 npm run build` does the same and adds a no-index tag and a `Disallow: /` robots.txt, for copies that are not the live site. `SITE_URL=https://... npm run build` changes the address used for canonical links, share cards and the sitemap (default: `site.url` in `content.mjs`).

Every push to `main` publishes the site to GitHub Pages at www.e-d-s.com.au (`.github/workflows/publish.yml` builds with `STATIC_HOST=1`, adds a `CNAME` file for the domain and pushes `dist/` to the `gh-pages` branch). The domain's DNS is at Digital Pacific: `www` is a CNAME to `meeeee12334545.github.io`, and the bare domain has GitHub's four A records.

Old Squarespace addresses (`/hach-flow`, `/what-we-do` and so on) forward to their new pages through small pages the build writes from `oldPages` in `content.mjs`. Documents the old site served from `/s/<file name>` still work: the build copies each document listed in `oldFiles` to its old address.

The build stops with an error if a page repeats an element id, since product links, "On this page" lists and form labels all depend on ids being unique.

## Where things are

| Path | What |
|---|---|
| `src/data/content.mjs` | Every word on the site, the services and their groups, the product lists (each product has a `type` from `productTypes`) and the city districts. Edit copy here. Also the selling points shared across pages: `ways` (buy, hire or Data as a Service), `results` (project outcomes, each shown on the service pages it lists; the four marked `home` fill the home page row) and `programSteps` (how a monitoring program runs, on services marked `process: true`), `glance` (three or four facts per service and solution page, shown "At a glance" in its hero; each repeats something the page already says) and `homeLede` (the home hero's paragraph, 20 words at most). Service, solution and product range pages take `blocks`: each has a `heading`, an optional `lede`, and then feature cards (`items`), a checklist (`list`, numbered with `steps: true`), a two column comparison (`table`, with `neutral: true` when neither side is the EDS way) or questions and answers (`faq`, also described to search engines as an FAQPage). Every claim in the copy comes from the old site or the documents in `src/assets/docs`; keep it that way. |
| `build.mjs` | Page templates. Generates 50 pages, including `404.html`, plus `sitemap.xml`, `robots.txt` and the search index. |
| `src/css/site.css` | All styles and design tokens. The stylesheet and scripts are linked with a hash of their contents (`asset()` in `build.mjs`), so browsers fetch the new ones with new pages instead of using a cached copy. Visitors whose system asks for reduced motion get fades instead of slides and no card tilt (the end of the file). |
| `src/js/site.js` | Navigation, scroll reveals, counters, pointer effects, the flow-field background, the illustrative flow meter card in the home hero, sidebars that stay in view when they fit, the section bar on service and solution pages (it marks the section in view), the enquiry form, the "head office open now" status and the phone action bar. The enquiry form has a page of its own, `enquire.html`, where every "Start an enquiry", "Request pricing" and quote list link leads, and also sits beside the contact details on `contact.html` (one template, `enquiryForm()` in `build.mjs`). It runs in three numbered parts that tick off as they are filled in: a topic, picked from tiles (`enquiryTopics`; "A monitoring service" opens the list of services and solutions), the project, and how to reply, by email or a call. Once sent it sums up what went. The enquiry and updates sign-up forms send from the page through Web3Forms (https://web3forms.com), using the access key in `formKey` in `content.mjs`; the build stops if it is empty. Nothing on the site opens the visitor's email program: the addresses are shown as plain text (footer, contact cards), the cards and other contact links go to the enquiry form, and if sending fails the form keeps what was typed and asks the visitor to try again or call. Submissions go to the email address of the Web3Forms account that owns the key (set the recipient in its dashboard). |
| `src/js/search.js` | Site search (Ctrl K, ⌘K or `/`). Its index, `assets/js/search-index.js`, is written by `build.mjs` from `content.mjs` and loads the first time search opens. |
| `src/js/products.js` | Product quick view and the instrument finder on the products page (its search box and type chips sit in the page hero, the results below the range tiles). |
| `src/js/quote.js` | The quote list. "Add to quote" on product cards, the quick view and product pages collects products in the visitor's browser (localStorage, nothing sent); the header and phone action bar show the count, and the enquiry form lists them with quantities and adds them to the email. |
| `src/js/city.js` | The interactive isometric city on the home page. |
| `src/js/lab.js` | The storm and hydrograph simulator: the flow lab on the home page and the sewer flow monitoring and inflow and infiltration pages. Values can be read off the chart with the pointer or the arrow keys, the simulation can be paused, and the band between measured flow and the dry weather pattern is shaded as inflow and infiltration. |
| `src/js/widgets.js` | Office map, LIDoTT Alarm demo, EDS Asset Score dial. |
| `src/assets/img/` | Product photos and logos. Reference one with `img("file-name.png")` in `content.mjs`. Also the favicon and touch icon (cut from the EDS mark in the logo) and `og-card.jpg`, the 1200 × 630 image shown when a page is shared. |
| `src/assets/img/photos/` | Photographs of EDS sites and work, each as `<name>-<width>x<height>.jpg` with a WebP twin at two widths, written by `tools/photos.py` (needs Python with Pillow) from the originals on the EDS Synology drive (`EDS Portal/Website/Website Images`); `sh tools/photos.sh` regenerates them all. Every photo gets the same grade (levels and colour evened out by the script, the brand teal laid over it by `site.css`) and the same 3:2 frame, so photos from different cameras and days read as one set. A page names one as `{ photo: "<name>", alt, caption }`: `figure` or a pair as `figures` on a service or solution page, `homePhoto` and `field.photos` in `about`, and `figure` on the LIDoTT Alarm page. `asideFigure` puts a product shot in a page's sidebar instead. The script drops the camera's metadata, can crop, and can patch out a date stamp. `pos` on a photo says which part to keep when the frame crops it; `plain: true` shows a drawing whole and ungraded. |
| `src/assets/docs/` | Datasheets, brochures, manuals, white papers and software downloads. Reference one with `localDoc("file-name.pdf")` in `content.mjs`. |
| `content/privacy.txt` | Privacy policy text, carried over from the old site. |
| `src/js/track.js` | Counts visits and records each click, search and form choice for the analytics dashboard. No cookies. |
| `server/index.mjs` | The site server: serves `dist/`, takes visits at `/api/collect`, hosts `/admin`. |
| `server/store.mjs` | The SQLite database (`data/analytics.db`) and the dashboard's queries. |
| `server/collect.mjs` | Checks each visit, filters bots, works out source, device and location. |
| `server/admin.mjs`, `server/admin/` | The sign-in and the dashboard page, styles and charts. |

## Analytics dashboard

Sign in at `/admin` to see visitors, visits, page views, bounce rate and time on
page for any period against the period before, plus top pages, entry pages,
sources and campaigns (`utm_*` tags), locations (Australian states from the time
zone), devices, document downloads, email and phone clicks, form submissions,
links to other sites and pages not found. "What people clicked" lists every link,
button, menu, tab and question clicked, named by the words on it, what it belonged
to (a product, say) and where on the page it was (the header, the footer, a section
by its heading), plus searches and the options picked in forms. "Visitor activity"
shows each visit in the period with every step in order, labelled in plain words
("Clicked the button “Add to quote” for Hach FL900"). Nothing typed into a form is
recorded. Everything exports to CSV, with an `action` column in plain words. A
button or link can name itself for the dashboard with `data-track-label`, and a
card can name what its buttons belong to with `data-track-item`.

- **Turn it on** by setting `ADMIN_PASSWORD`. Locally, copy `.env.example` to `.env`
  (git ignores it). Without a password `/admin` explains how to set one.
- **Privacy.** No cookies, and no IP addresses are stored. A visitor is a hash of IP
  and browser with a salt that is replaced daily, so people cannot be followed from
  one day to the next.
- **Organisations and cities.** After each page view the server looks up who holds the
  visitor's network in the internet registries (RDAP, cached per network range) and the
  nearest city in DB-IP's free City Lite database, which it downloads monthly into
  `DATA_DIR`. Then the IP is dropped (`server/lookup.mjs`). `ANALYTICS_LOOKUP=off` turns this off. Bots are filtered out. On the dashboard, tick "Don't count my
  own visits" to leave your browser out.
- **Hosting.** The dashboard needs the server, which runs on any host with Node 22.13
  or later and a persistent disk for `data/` (a VPS, Render, Railway, Fly.io). Run
  `npm ci && npm run build && npm start` behind HTTPS. To keep the pages on a static
  host instead, run the server somewhere else and build the pages with
  `ANALYTICS_ENDPOINT=https://<that server>/api/collect`.
- **Live setup.** The pages are on GitHub Pages at www.e-d-s.com.au. The server runs on
  Render from `render.yaml` at analytics.e-d-s.com.au, so the dashboard is at
  https://analytics.e-d-s.com.au/admin. `PAGES_URL` sends any page request there back to www.
  Every route to a Render service, the custom domain and the `*.onrender.com` address alike,
  passes through Cloudflare, which overwrites `CF-Connecting-IP` with the caller's address. So
  `CLIENT_IP_HEADER=cf-connecting-ip` gives the server each visitor's own address (for the
  per-address limits and the organisation and city lookup). Set it only where nothing can reach
  the server around Cloudflare; on any other host a caller could choose their own address.
- GitHub Pages preview copies leave the tracker out, since nothing there can receive visits.

Other settings (`PORT`, `DATA_DIR`, `ANALYTICS_TZ`, `SESSION_SECRET`, `TRUSTED_PROXIES`, `CLIENT_IP_HEADER`, `PAGES_URL`) are described in `.env.example`.

## Links that carry context

- **Enquiries.** `enquire.html?topic=...&product=...&mode=...` opens the form with the topic chosen (matched against a tile's subject, or a service or solution title), the product named and the way of working ticked (`buy`, `hire`, `managed` or `unsure`). The same works on `contact.html`, where the Sales and Service cards use it to choose their topic without reloading the page. Use `contactHref()` in `build.mjs` rather than writing these by hand. The old site's `/enquire` address is now the enquiry page itself.
- **Products.** Every product card has an id, so `products/hach-flow.html#fl900-portable` opens that product's quick view. On the products page the id is prefixed with the brand: `#hach-flow-fl900-portable`.
- **Instrument finder.** `products/index.html?q=flow#finder` opens the finder already filtered.

## Design rules (shared with EDS FlowSense)

- **Brand.** FlowSense tokens: teal `#0c5f59` / `#14706a` / `#0d7c72`, Geist for body and display.
- **Icons.** Lucide only (https://github.com/lucide-icons/lucide, ISC), inlined at build time by `icon()` in `build.mjs`. Stroke 2, round caps. If Lucide lacks a glyph, draw one in the same style; do not mix in Phosphor or Heroicons.
- **Icon motion.** Ideas after animate-ui (https://github.com/imskyleen/animate-ui), written from scratch in CSS because its licence does not allow copying. Gestures last about a second and carry their own rest. Use the individual `rotate` / `translate` / `scale` properties, never `transform`.
- **Surface effects.** The card edge spotlight, the beam round the hero meter card and the drawn link underline follow VengeanceUI components (https://github.com/Ashutoshx7/VengeanceUI, MIT), rewritten in plain CSS. The film grain on dark bands, teal-tinted shadows, the home services bento and the sparing use of eyebrow labels follow taste-skill (https://github.com/Leonxlnx/taste-skill, MIT).
- **Motion is full for everyone.** By EDS's decision (2 October 2026) the site always animates and has no reduced-motion mode or switch; it does not follow a device's Reduce Motion setting.
- **Page layout.** From the October 2026 layout review, after taste-skill, Anthropic's frontend-design and the FlowSense design-review skill:
  - The home page tells one story in ten bands: hero, client logos with the key figures, services, results, the city, buy, hire or DaaS, FlowSense, products, the EDS story with offices and industries, and the call to action. The city is its one interactive showpiece; the flow lab lives on the sewer flow and I&I pages, the office map on About and Contact, the white papers on Resources.
  - A hero holds four text groups at most (label, headline, a paragraph of 20 words or fewer, buttons) and is sized to its content, so what follows is in the first screen. The client logos sit directly under the home hero.
  - Dark bands run on a schedule: the hero, one showpiece or demo, and the closing call to action. Light bands alternate white and pale grey.
  - Service and solution pages give each section a full-width band in a layout that suits it, so no two neighbours look alike (`bandsOf()` in `build.mjs`). A slim section bar replaces the old numbered contents list, and the related links share one band near the end.
  - Small uppercase labels above headings: at most one for every three sections.
  - One label per action, everywhere: "Start an enquiry" opens the enquiry form, "Request pricing" asks for a price, "Contact us" goes to the contact page.
- **Simulations are labelled.** The flow lab, LIDoTT demo, Asset Score dial and FlowSense screens are illustrations and say so on the page. Do not present them as live data, and do not use client site names in them.
- **Photographs are EDS's own, or were on the old site.** Captions describe what is in the picture and claim nothing the copy does not already say; no client or site names. Blue Siren material is not used: EDS no longer sells that range.

## Still to do

1. The favicon and touch icon are cut from the logo PNG. A vector EDS mark from the brand files would give a sharper favicon.
2. Check `site.openingHours` in `src/data/content.mjs`. The "open now" status works from the hours alone, so it does not know about public holidays.
