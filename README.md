# What's Cooking

A breakfast / lunch / dinner timetable for a Tamil Nadu household.

Every home runs the same negotiation every day: *what do we make?* It gets decided under time
pressure, from memory, by whoever is cooking — so the same four dishes rotate forever. This app
decides, from your own food list, for today or for the whole week.

## Run it

Open `index.html` in a browser. That is the whole setup.

No build step, no `npm install`, no server, no account, no network. Plain HTML, CSS and JavaScript,
written to work straight off the disk over `file://` — classic `<script src>` tags rather than ES
modules, hand-written CSS rather than a CDN, and system fonts only.

Phone first, because that is what you are holding at 7am in the kitchen.

## How a meal is put together

This is the part worth understanding, because everything else follows from it.

```
meal  =  a vegetarian main          (always)
      +  sides from its categories  (all optional)
      +  a protein, if the grid says so   (egg / chicken / fish / mutton / prawn)
```

**The base is always vegetarian.** A household does not stop being vegetarian for the people who
are. On a non-veg day the rice and kuzhambu still land on the table; the chicken is an extra dish
beside it. Modelling it the other way — non-veg *replacing* the meal — was wrong, and it made
"egg with the children's lunch" impossible to express.

Because the protein is a separate slot, both of those are the same mechanism:

| What you want | How it is set |
|---|---|
| Chicken on Sunday | Sun / Lunch → Chicken |
| Egg with lunch every day for the kids | every row, Lunch → Egg |
| Fish midweek | Wed / Dinner → Fish |
| Pure vegetarian | leave the grid alone |

There is no special case for any of them.

## Setup

First run asks two questions — what the house eats, and roughly how often — then shows a plan.
There is a skip button.

The same two questions live in Settings under **Not sure? Answer two questions**, because a house
changes: someone starts eating egg, a month of fasting comes round, a child turns vegetarian.
Re-running it rewrites only the protein timetable — the food list, what you have unticked and your
own dishes are all left alone — and cancelling changes nothing.

## The screens

- **Today** — the meal you are about to cook, large. The other two below as compact rows. A day
  strip looks ahead without leaving the screen.
- **Week** — all 21 meals, today ringed. Keep any meal and it survives the next reroll.
- **Foods** — your food list. Tick what your house eats; anything unticked is never planned. Add
  your own dishes, sides and protein dishes. Separate lists for breakfast, lunch, dinner, sides and
  protein.
- **Settings** — the protein timetable, plus three switches.

Sharing is not a screen. The share button sits in the header of Today and Week, next to the one that
rerolls them, and opens a sheet over whatever you were looking at. From Today it exports that one
day; from Week, all seven. Both go through the same renderer — one day is just a timetable with a
single row — and both offer share, save as image, print and copy-as-text. Drawn on a canvas, so it
works offline with nothing installed.

Everything is kept in `localStorage`. Nothing leaves the device.

## Settings

| Setting | What it does |
|---|---|
| Protein timetable | A 7 × 3 grid. Tap a meal, pick what protein goes beside it. |
| Health conscious | Leans towards millets, low-oil and steamed dishes. Nothing is banned. |
| Light dinners | Soft, low-oil food at night. Nothing heavy or deep-fried after dark. |
| Quick weekday breakfasts | Nothing over 20 minutes Monday to Friday. |

Sunday lunch is always biryani or a full meal. That used to be a switch, but nobody was ever going
to ask for a worse Sunday.

## The generator

Random, but with rules — the rules stop it producing parotta for breakfast on a Tuesday or biryani
three days running. In `js/planner.js`:

- No main repeats within 4 days (breakfast, dinner) or 5 days (lunch)
- Sides are rolled per category, so the same main turns up with different accompaniments
- Candidates are sampled **weighted by score**, never filtered to a narrow band. An earlier version
  used a fixed band, which turned preferences into hard filters: the light-dinner bonus alone
  exceeded the band, so any dinner dish without those tags — including every dish a household adds
  itself, which starts untagged — could never be reached
- Filters relax in order rather than ever returning nothing
- A meal with nothing ticked degrades to an empty slot that says so, rather than breaking

## Your own dishes

Foods → Add. Name, which meals, roughly how long. It joins the rotation immediately.

To ship a dish for everyone, add it to `js/data.js` instead:

```js
{ id: 'kothu-parotta', name: 'Kothu parotta', tamil: 'கொத்து பரோட்டா',
  meals: ['dinner'], mins: 35, tags: ['kid', 'weekend', 'heavy'], health: [],
  sides: { must: ['gravy'], may: ['accompaniment'] } }
```

`must` categories always get one item; `may` categories about half the time.

## Language

English only. Dish records still carry a `tamil` name — unused by the UI, but it is the seed for a
language switch rather than something to retype later.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Four screens, the first-run setup, the sheet and the icon sprite |
| `css/styles.css` | All styling, dark and light |
| `js/data.js` | **The suggested food list** — mains, sides, protein dishes |
| `js/library.js` | What this household actually eats: what is switched off, what they added |
| `js/planner.js` | The generator |
| `js/export.js` | The timetable image, text export, native share |
| `js/app.js` | Storage, rendering, wiring |
| `docs/deployment.md` | Putting it on Vercel |
| `docs/ai-agent.md` | Adding a free AI planner, and why you should not train your own model |
