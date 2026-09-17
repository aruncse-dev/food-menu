# What's Cooking

A breakfast / lunch / dinner timetable for a Tamil Nadu household.

Every home runs the same negotiation every single day: *what do we make?* It gets decided under time
pressure, from memory, by whoever is cooking — so the same four dishes rotate forever. This app just
decides, from a curated list of Tamil Nadu dishes with their proper combinations, for today or for
the whole week.

## Run it

Open `index.html` in a browser. That is the whole setup.

No build step, no `npm install`, no server, no account, no network. Plain HTML, CSS and JavaScript,
written to work straight off the disk over `file://` — so the scripts are classic `<script src>`
tags rather than ES modules, and the CSS is hand-written rather than pulled from a CDN.

Designed for a phone, because that is what you are holding at 7am in the kitchen. On a desktop it
is the same column, centred.

## What it does

- **Today** — the meal you are about to cook, large, as the answer to "what do I make now". The
  other two sit under it as compact rows. A day strip lets you look ahead without leaving the screen.
- **Week** — all 21 meals, grouped by day, today ringed in green. Keep any meal and it survives the
  next reroll.
- **Share** — the week as a picture for the fridge or the family group, plus print and copy-as-text.
  Drawn on a canvas, so it works offline with nothing installed.
- **Settings** — five household switches.

Deliberately *not* per-person preference profiles. Making every family member fill in a form before
the app serves a single meal is how these things get abandoned in week one. Four household switches
cover most of it:

| Switch | Default | What it does |
|---|---|---|
| Non-veg days | Wed, Sun | Non-veg appears only on these days — lunch at the weekend, dinner on a working day. Everything else stays veg. |
| Kids' pick | Sat dinner | One meal a week comes from the pasta / noodles / fried rice end of the list. |
| Easy on the elders | on | Dinners stay soft and light. No parotta or poori at night. |
| Quick weekday breakfasts | on | Nothing over 20 minutes Mon–Fri. Poori and pongal wait for the weekend. |
| Sunday special | on | Biryani or full meals for Sunday lunch. |

Everything is kept in the browser's `localStorage`. Nothing leaves the device.

## The generator

Random, but with rules — the rules are what stop it producing parotta for breakfast on a Tuesday or
biryani three days running. In `js/planner.js`:

- No dish repeats within 4 days (breakfast, dinner) or 5 days (lunch)
- Non-veg only in the household's configured slot
- Elaborate dishes are weekend-weighted; on a weekday morning they are excluded outright
- Sides are rolled from groups of alternatives, so idli turns up with coconut chutney one day and
  tomato chutney the next
- Filters relax in order rather than ever returning nothing — a household would rather see poori on
  a Tuesday than an empty box

Verified across 400 generated weeks: every rule holds, and 45 of the 54 dishes stay in rotation.

## Adding your family's dishes

`js/data.js` is the only file worth editing. Add an entry and the planner picks it up with no other
changes:

```js
{ id: 'kothu-parotta', name: 'Kothu parotta', tamil: 'கொத்து பரோட்டா',
  meals: ['dinner'], kind: 'nonveg', mins: 35,
  tags: ['kid', 'weekend', 'heavy'],
  sides: [['Onion raita'], ['Chicken salna']] }
```

`sides` is a list of *groups*; one item is picked from each, which is where the day-to-day variety
comes from.

## Language

The interface is English only for now. Dish records still carry their `tamil` name — unused by the
UI, but it is the seed for a language switch rather than something to retype later. Adding Tamil
means rendering that field and moving the interface strings in `js/app.js` into a lookup.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Four screens and the icon sprite |
| `css/styles.css` | All styling, light and dark |
| `js/data.js` | **The dish database** — the part worth editing |
| `js/planner.js` | The generator |
| `js/export.js` | Canvas timetable image, text export, share sheet |
| `js/app.js` | Storage, rendering, wiring |
| `docs/deployment.md` | Putting it on Vercel |
| `docs/ai-agent.md` | Adding a free AI planner, and why you should not train your own model |
