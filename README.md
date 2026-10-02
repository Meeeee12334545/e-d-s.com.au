# EDS website

The marketing site for Environmental Data Services. A static site: no framework
and no server code. `dist/` can be uploaded to any web host.

```bash
npm install
npm run dev      # builds, then serves http://localhost:4173
npm run build    # writes dist/
```

`PREVIEW=1 npm run build` adds a no-index tag and a `Disallow: /` robots.txt, for copies that are not the live site. `SITE_URL=https://... npm run build` changes the address used for canonical links, share cards and the sitemap (default: `site.url` in `content.mjs`).

Every push to `main` publishes a preview copy to GitHub Pages (`.github/workflows/preview.yml` builds with `PREVIEW=1` and the Pages address as `SITE_URL`, and pushes `dist/` to the `gh-pages` branch).

The build stops with an error if a page repeats an element id, since product links, "On this page" lists and form labels all depend on ids being unique.

## Where things are

| Path | What |
|---|---|
| `src/data/content.mjs` | Every word on the site, the services and their groups, the product lists (each product has a `type` from `productTypes`) and the city districts. Edit copy here. |
| `build.mjs` | Page templates. Generates 46 pages, including `404.html`, plus `sitemap.xml`, `robots.txt` and the search index. |
| `src/css/site.css` | All styles and design tokens. |
| `src/js/site.js` | Navigation, scroll reveals, counters, pointer effects, the flow-field background, the enquiry form, the "head office open now" status and the phone action bar. |
| `src/js/search.js` | Site search (Ctrl K, ⌘K or `/`). Its index, `assets/js/search-index.js`, is written by `build.mjs` from `content.mjs` and loads the first time search opens. |
| `src/js/products.js` | Product quick view and the instrument finder on the products page. |
| `src/js/city.js` | The interactive isometric city on the home page. |
| `src/js/lab.js` | The storm and hydrograph simulator. |
| `src/js/widgets.js` | Office map, LIDoTT Alarm demo, EDS Asset Score dial. |
| `src/assets/img/` | Product photos and logos. Reference one with `img("file-name.png")` in `content.mjs`. Also the favicon and touch icon (cut from the EDS mark in the logo) and `og-card.jpg`, the 1200 × 630 image shown when a page is shared. |
| `content/privacy.txt` | Privacy policy text, carried over from the old site. |

## Links that carry context

- **Enquiries.** `contact.html?topic=...&product=...` opens the form with the topic chosen (matched against the option text) and the product named. Use `contactHref()` in `build.mjs` rather than writing these by hand.
- **Products.** Every product card has an id, so `products/hach-flow.html#fl900-portable` opens that product's quick view. On the products page the id is prefixed with the brand: `#hach-flow-fl900-portable`.
- **Instrument finder.** `products/index.html?q=flow#finder` opens the finder already filtered.

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
4. The favicon and touch icon are cut from the logo PNG. A vector EDS mark from the brand files would give a sharper favicon.
5. Check `site.url` and `site.openingHours` in `src/data/content.mjs`. The "open now" status works from the hours alone, so it does not know about public holidays.
