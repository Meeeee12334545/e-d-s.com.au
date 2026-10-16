---
name: asset-exploded-view
description: Build interactive exploded and cutaway views of physical assets (maintenance holes, wet wells, pump stations, tanks, towers, instruments, whole city districts) as live isometric SVG in this website, with every part labelled from the real datasheets. Use this whenever someone asks to explode, take apart, deconstruct, peel back, cut away or "see inside" anything on the home page city or any other drawing on the site, or asks for an "exploded view", "expanded view", "layers view", "x-ray" or "what's inside" of an asset or product, even if they don't say SVG. Not for generating raster images.
---

# Asset exploded view

An exploded view takes an object apart along an axis so every part, and how the parts fit, can be
seen at once. On this site it is a teaching tool: it shows a water engineer exactly where each EDS
instrument sits in a real asset, so the drawing has to be true before it is pretty.

The output is always live SVG in the city's isometric style, driven by clicks. Never a generated
image: a picture cannot be clicked, cannot carry a live reading and would not match the vector city.

## 1. Choose the style

Pick one per object. Each is a decision about what the visitor should understand.

| Style | How it moves | Use it for |
| --- | --- | --- |
| Mechanical | Parts separate along one axis (usually height), evenly spaced, keeping their order and their outline | Built assets: a maintenance hole, a wet well, a rain gauge, a sampler |
| Slide-out | One part leaves along a second axis, with a dashed guide back to where it sits | A sensor inside a pipe, a battery out of a logger |
| Layered peel (strata) | Horizontal layers lift apart: structures, street, below ground | A whole district, a building's floors |
| Conceptual stack | Plates for stages of a flow, stacked in order | The data path: instrument, logger, network, FlowSense, alarms |

Keep the assembled silhouette recognisable when exploded: same axis, same order, even gaps.

## 2. Get the parts right before drawing

Accuracy is what makes the drawing worth looking at. Do not invent parts, and above all do not
invent product claims.

1. Read the datasheet or manual for each instrument in `src/assets/docs`. To get the text out
   (no installs needed on macOS):
   `osascript -l JavaScript .claude/skills/asset-exploded-view/scripts/pdf2txt.js "$PWD/src/assets/docs/<file>.pdf"`
2. Read what `src/data/content.mjs` already says about the product or service. Every visible word
   on the site must come from the old site or those documents (README rule).
3. List 5 to 10 parts, top to bottom, in assembly order. Generic civil parts (cover and frame,
   shaft rings, step irons, benching, pipe) need no source; anything EDS sells does.
4. For each EDS part, note the one fact that matters to a buyer, quoted from the source, and the
   reading the city already simulates for it (`city[].sensors[].reads`), if any.

## 3. Where things live

- Words (part names, notes, captions, button labels, announcements) go in `content.mjs`
  (`city[].asset` with its `pin` sensor, `city[].strata`, each sensor's `layer`,
  `cityUi.explode`). city.js shows only words from there.
- Geometry goes in `src/js/city-scene.js`, keyed by the part ids used in `content.mjs`:
  a new asset is one entry in `ASSETS` returning `paint` (parts in paint order; a part may have
  several pieces, and `{ fade: true }` for a piece hidden while assembled, like the length of
  pipe inside a chamber), `off`, `anchor` (where its label points), `cables`, `axis`, `guides`.
  Draw with the scene's own helpers: `P(x, y, z)` (tile x, tile y, height in px), `box`, `cyl`,
  `prism`, `poly`, `pl`, `seg`, and the section helpers `shell` (a cylinder or cone with its
  front half cut away), `rshell` (a rectangular chamber), `hpipe` (a pipe along x, its near end
  cut to show the flow), `cutFace` (hatched), `plain` (keeps a generic part grey inside an EDS
  one). A district's layers come from `explodeKit`; what its below-ground block holds beyond
  the shared network is `BELOW[id]`.
- Behaviour goes in `src/js/city.js`. The view is a small state machine:
  `city` -> `district` (`setDistrict`, layers apart, camera on the district) -> `asset`
  (`openAsset`, one asset apart) and back. Escape and the back buttons step back one level.
  A storm puts everything back first. Labels are `setNotes` / `layoutNotes`.
- Styles go in the city block of `src/css/site.css` ("the city taken apart").

## 4. Motion

One tween drives everything that moves together: a progress value `k` from 0 (assembled) to 1
(apart). Each frame sets every part's translate from `k`, recomputes cables and guides from the
same `k`, and re-lays the labels. Because all of it reads one number, the parts, cables and
leader lines never drift apart, and the tween can reverse from wherever it is if the visitor
changes their mind.

- Apart: about 650 ms, ease-out (`--ease-out`), parts staggered 40 to 60 ms from the top part
  down. Together again: about 70 per cent of that. No bounce or spring on parts.
- The camera (the viewBox of both city SVGs, always at the 800:448 aspect so the page never
  shifts) moves first, then the parts come apart, so the eye arrives before the action.
- Under `prefers-reduced-motion` keep the motion and soften it (shorter, no stagger). The site
  owner's Mac reports reduced motion, and freezing the city was reported as a bug.
- Nothing moves on hover and nothing opens by itself: a view changes only on a click, a tap or a
  key (house rule since 13 October 2026). Ambient animation (traffic, pings, flows) keeps running.

## 5. Performance

The city is two SVGs on one viewBox: `#city` (still) and `#city-fx` (everything that animates).
Keep any looping animation out of `#city`. Tweens may touch `#city` while they run, then stop.
Build heavy things lazily (a district's below-ground block is drawn the first time it is opened).
Measure: median frame interval with Playwright, reduced motion off, should stay near 8 ms at rest.

## 6. Labels

Labels are HTML, not SVG text, so they stay crisp and the same size at any zoom and can be real
buttons. A notes layer over the stage holds them plus one SVG of leader lines in CSS pixels.

- Wide stage: two columns, left and right of the drawing. Each label sits level with its part,
  pushed apart to a minimum gap, with an elbowed leader line ending in a dot on the part.
- Narrow stage (phones): small numbered balloons on the parts and a list of the same numbers under
  the stage. Numbers are fine here: they follow assembly order, top to bottom.
- EDS parts are aqua, carry their live reading and link to the product page. Generic parts are
  quiet. Clicking a label highlights its part and dims the rest; clicking again clears it.

## 7. Accessibility

- Every control is a `<button>` with a name that says what it does ("Take it apart",
  "Put it back", "See inside maintenance hole 9", "Back to the district").
- Opening a view moves focus to its first control; closing returns focus where it came from.
  Announce changes once through `#city-live`.
- Labels are in reading order (top to bottom), so a screen reader hears the parts in order.
- Targets are at least 44 px on touch screens.

## 8. Things learned building it

- Move parts with the SVG `transform` attribute, not the CSS `translate` property: `getBBox()`
  (used to frame the asset) counts the attribute, and `getBoundingClientRect()` (used to place
  labels) counts both.
- Patterns defined in one inline SVG (the city's window grids) can be used from another on the
  same page by `url(#id)`; the asset SVG borrows them.
- Symbols placed with `<use>` cannot be reached by page selectors. Colour them through inherited
  custom properties, and animate a registered `@property` on the `<use>` host to animate
  something inside the symbol (the vans' storm beacon does this with `--vb`).
- Anything that zooms (the camera) also zooms SVG text, so labels belong in HTML; and with the
  camera in close, clip the view or the city spills past its frame.
- Labels are rebuilt when a view changes, so focus that should return to a label has to find
  the new copy.
- Keep left: in this projection +x is east and +y is south, so an eastbound lane sits at a
  smaller y and a southbound lane at a larger x.

## 9. Check it

Run `python3 -I .claude/skills/asset-exploded-view/scripts/check_city.py --out <folder>` with the
site built and served (see the script's header). It screenshots every district apart and every
asset apart at desktop and phone widths, reports console errors, labels that overlap or leave the
stage, and the median frame interval. Headless Chromium caps frames at 60 Hz, so the script turns
the cap off: about 3.8 ms at rest on the development Mac, the same as before the exploded views
existed, and about 5 ms with a district apart (the camera enlarges the moving overlay). Treat
8 ms apart as the ceiling. Then judge the screenshots, not the code:

1. One second: what do you see? It should be the object, not the labels.
2. Is every part readable, nothing overlapping, every leader reaching its part?
3. Could a water engineer point to where the meter sits and how it is held?
4. Is the accent (aqua) only on EDS parts?

Fix the top three problems, re-shoot, and stop after three rounds.
