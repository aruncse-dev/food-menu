# இன்று என்ன சமையல்? — What's Cooking Today

A breakfast / lunch / dinner timetable for a Tamil Nadu household.

Every home runs the same negotiation every single day: *what do we make?* It gets decided under time
pressure, from memory, by whoever is cooking — so the same four dishes rotate forever. This app just
decides, from a curated list of Tamil Nadu dishes with their proper combinations, for a day or a
whole week.

## Run it

Open `index.html` in a browser. That's it.

No build step, no `npm install`, no server, no account. Plain HTML, CSS and JavaScript, written to
work straight off the disk over `file://` — so the scripts are classic `<script src>` tags rather
than ES modules, and the CSS is hand-written rather than pulled from a CDN.

## What it does

- **Today** — breakfast, lunch and dinner with their sides and rough cooking time.
- **This week** — a 7 × 3 grid you can regenerate, with any meal lockable so it survives a reroll.
- **Copy** — the plan as plain text, ready to paste into the family WhatsApp group.
- **Settings** — four household switches: which days are non-veg, one kids' slot a week, lighter
  dinners for the elders, and quick weekday breakfasts.

Deliberately *not* per-person preference profiles. Making every member fill in a form before the app
serves a single meal is how these things get abandoned in week one. Four household switches cover
most of it; personalisation can come later if the house actually misses it.

Everything is kept in the browser's `localStorage`. Nothing leaves the device.

## Status

**Step 1 of 2 — UI shell.** The screens are real and clickable, but they render the fixed sample plan
in `js/sample-data.js`. "New plan", "Surprise me" and the per-meal shuffle are placeholders for now.

**Step 2** adds `js/data.js` (the dish database and combination table) and `js/planner.js` (the
generator), and wires those buttons up.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Both screens |
| `css/styles.css` | All styling, light and dark |
| `js/sample-data.js` | Placeholder plan — replaced in step 2 |
| `js/app.js` | Rendering and event wiring |
