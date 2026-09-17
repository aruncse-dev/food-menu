# What's Cooking

A breakfast / lunch / dinner timetable for a Tamil Nadu household.

Every home runs the same negotiation every day: *what do we make?* It gets decided under time
pressure, from memory, by whoever is cooking — so the same four dishes rotate forever. This app
decides, from your own food list, for today or for the whole week.

## Run it

Open `index.html` in a browser. That is the whole setup.

No build step, no `npm install`, no server, no account, no network. Plain HTML, CSS and JavaScript,
written to work straight off the disk over `file://` — classic `<script src>` tags rather than ES
modules, hand-written CSS rather than a CDN, and system fonts only. SQLite is vendored into
`vendor/sqlite/` for the same reason: nothing is fetched from a CDN at runtime.

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

First run asks three things — which language, what the house eats, and roughly how often — then
shows a plan. There is a skip button.

First run asks the language too, before anything else, so the questions themselves are readable.

The same two food questions live in Settings under **Not sure? Answer two questions**, because a house
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
- **Settings** — households, language, the protein timetable, three switches and a reset. Nothing else.

Sharing is not a screen. The share button sits in the header of Today and Week, next to the one that
rerolls them, and opens a sheet over whatever you were looking at. From Today it exports that one
day; from Week, all seven. Both go through the same renderer — one day is just a timetable with a
single row — and both offer share, save as image, print and copy-as-text. Drawn on a canvas, so it
works offline with nothing installed.

Nothing leaves the device.

## Where your data lives

A SQLite database, held by the browser. The plan, your food list, your own dishes and the protein
timetable are rows in it. It survives reloads, tab closes, browser restarts and reboots.

Being straight about what that does and does not buy:

- **Moving off `localStorage` is not what makes it durable.** Chrome keeps every storage API for an
  origin in one bucket and evicts the bucket whole, so `localStorage` was never the weak link.
- **`navigator.storage.persist()` is.** The app asks for it on every start. Granted, Chrome will not
  clear the data to reclaim space. Chrome decides based on how much you use the site, and installing
  it to the home screen makes it a yes.
- **Private windows are wiped, by design.** Chrome throws away everything an incognito session
  stored the moment its last window closes, and no web app can change that. Inside the session the
  database is real — reload, open another tab, it is all still there. Settings says so in one line
  rather than implying a promise it cannot keep.
- **There is no export.** Nothing leaves the device, which also means nothing survives it: clear
  this site's data and the plan is gone. That is the deliberate trade for a settings screen with
  nothing on it to administer. What gets shared is the timetable image, not the database.

The shape of it:

| Table | What is in it |
|---|---|
| `house` | The households |
| `setting` | Health conscious, light dinners, quick breakfasts |
| `protein` | The 7 × 3 grid, one row per meal |
| `off_item` | Everything the house has unticked |
| `custom_item` | Dishes, sides and protein dishes the house added |
| `plan` | The current week, one row per meal, with what is kept |

Every table but `house` carries a `house` column, so the same query answers "what is this household
eating" for any of them.

The database is stored as bytes in IndexedDB and loaded into the engine at startup. The obvious
alternative is OPFS, where SQLite writes the file directly and incrementally — but that VFS needs
`createSyncAccessHandle`, which the spec exposes to dedicated workers only, in every browser. Moving
the whole database into a worker to avoid re-serialising something this small would buy complexity
and nothing else. If the data grows past a few hundred kilobytes, that is the change to make.

Where SQLite cannot load at all — off `file://`, mainly, where a dynamic `import()` is blocked — the
app falls back to IndexedDB and then `localStorage`, and the plan still persists.

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

English and Tamil, both complete — interface, dish names, the exported timetable, the lot. The first
run asks which, defaulting to whatever the phone is already set to, and Settings can change it any
time. Switching relabels the plan you already have rather than regenerating it: a slot stores dish
ids, so the names are resolved at the moment they are drawn.

Settings also lists हिन्दी, తెలుగు, ಕನ್ನಡ and മലയാളം, marked *soon* and not selectable. They are shown
so a house can see what is coming instead of wondering. Adding one is a translation job, not a code
job — copy the `en` block in `js/i18n.js`, translate the values, flip `ready` to true. Food words
live with the food, as a `tamil` field beside `name` in `js/data.js`.

## Households

One app, several houses. House 1 and House 2 share nothing but the app itself: their own food list,
their own protein timetable, their own cooking-style switches, their own week. Settings → Households
adds, renames, removes and switches.

It stays out of the way until you want it. A single household sees one row it never has to think
about; the list only becomes a thing to manage once there are two.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Four screens, the first-run setup, the sheet and the icon sprite |
| `css/styles.css` | All styling, dark and light |
| `js/db.js` | The database, households and every fallback under it |
| `js/i18n.js` | Every interface string, in each language |
| `js/data.js` | **The suggested food list** — mains, sides, protein dishes |
| `js/library.js` | What this household actually eats: what is switched off, what they added |
| `js/planner.js` | The generator |
| `js/export.js` | The timetable image, text export, native share |
| `js/app.js` | Storage, rendering, wiring |
| `vendor/sqlite/` | SQLite compiled to WebAssembly, vendored so it works offline |
| `docs/deployment.md` | Putting it on Vercel |
| `docs/ai-agent.md` | Adding a free AI planner, and why you should not train your own model |
