# Your own food-menu agent, free

> Short version: don't train a model. Write a system prompt, feed it `js/data.js`, run it on
> somebody else's free tier, and keep `js/planner.js` as the fallback. That is a real
> domain-specific agent and it costs nothing.

## What not to do

**Don't train an LLM from scratch.** Millions of dollars. Not a real option, and not a close call.

**Don't fine-tune an open model either** — and this one is worth explaining, because it sounds
reasonable. You would need a few thousand hand-written examples of good Tamil Nadu weekly menus, a
GPU, and a week of work. The result would be *worse* than a plain prompt to a good hosted model,
because the thing you need is not obscure knowledge — every frontier model already knows what
vathal kuzhambu is and what goes with idli. What you need is *your household's rules*, and rules
belong in a prompt, not in weights. Fine-tuning is for teaching a model a format or a style it
genuinely does not know. That is not this problem.

## What "your own agent" actually means here

Four parts, all free:

### 1. A system prompt holding your household's rules

The same rules that are currently in Settings, written out in English. Non-veg days. Elders eat
light at night. Weekday breakfasts under 20 minutes. Kids get one meal a week. Sunday lunch is
special. Nothing repeats inside a week.

### 2. Your dish database as grounding

This is the part that makes the agent *yours*. `js/data.js` is small — 54 dishes, roughly 3–4k
tokens — so the whole thing fits in the prompt with room to spare. Tell the model it may only
choose from that list.

That single constraint kills the failure mode that makes generic AI meal planners useless: it
cannot invent "Butter Chicken Pizza Dosa", cannot suggest something nobody in the house eats, and
cannot pair idli with something absurd, because it is picking from a list your family wrote. Add a
dish to `data.js` and the agent knows it immediately. No retraining, no embeddings, no vector
database — the dataset is far too small to need one.

### 3. Structured output

Force JSON in the exact shape `js/planner.js` already returns, so the UI does not care where a plan
came from:

```js
{ day: 'Mon', breakfast: { id, dish, tamil, sides: [], mins, badges: [] }, lunch: {...}, dinner: {...} }
```

Validate every dish `id` against `DISHES` before rendering. If the model returns an id that is not
in your list, drop that slot and let the offline planner fill it. Never trust the shape blindly.

### 4. The offline planner as the fallback — the load-bearing piece

Free tiers rate-limit, go down, and return malformed JSON. If the app depends on the API, the app is
broken on exactly the evening the family needs it.

It doesn't, because `js/planner.js` already generates a complete valid week with no network at all.
The API becomes an *enhancement*: try it, give it a 5-second timeout, and fall back silently. This
is what makes a free tier genuinely viable rather than a demo.

## Where to run the model, free

All of these have a free tier as of writing. Limits change constantly — check current quotas before
committing to one.

| Option | Why you'd pick it |
|---|---|
| **Google Gemini API** (`gemini-2.0-flash` or `2.5-flash`) | Best default. Generous free tier, native JSON mode, genuinely good on Indian regional food. |
| **Groq** (Llama 3.3 70B) | Very fast responses, free tier. Slightly less reliable at strict JSON. |
| **OpenRouter** (`:free` models) | One key, many models, easy to swap. Free-model availability varies day to day. |
| **Cloudflare Workers AI** | Free daily allowance, runs at the edge. Sensible if you ever move hosting to Cloudflare. |
| **Ollama**, locally | Free forever and fully private, but only works on the machine running it — no good for a phone in the kitchen. |

## The whole thing, in one Vercel function

`api/plan.js`. The key stays server-side. This is the entire integration:

```js
// api/plan.js  — runs on Vercel, never in the browser
export default async function handler(req, res) {
  const { dishes, settings } = req.body;

  const system = [
    'You plan a week of meals for a Tamil Nadu household.',
    'Choose ONLY from the dish list given. Never invent a dish.',
    'Rules:',
    '- Non-veg only on: ' + settings.nonVegDays.join(', ') + '. Every other meal is vegetarian.',
    '- Dinners are light and easy for elders. No parotta or poori at night.',
    '- Weekday breakfasts must be under 20 minutes.',
    '- One meal a week is the children\'s pick.',
    '- Sunday lunch is special: biryani or full meals.',
    '- No dish repeats within the same week.',
    'Return JSON only, matching the given schema.'
  ].join('\n');

  const r = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY   // set in Vercel, not in the repo
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: 'Dishes:\n' + JSON.stringify(dishes) }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  );

  if (!r.ok) { return res.status(502).json({ error: 'upstream' }); }

  const data = await r.json();
  res.status(200).json(JSON.parse(data.candidates[0].content.parts[0].text));
}
```

And on the client, the seam that keeps the app working when that fails:

```js
async function planWeek(settings) {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 5000);

    const r = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dishes: DISHES, settings }),
      signal: ctrl.signal
    });

    if (!r.ok) throw new Error('api');
    return validate(await r.json());       // unknown dish ids get dropped here
  } catch (e) {
    return Planner.generateWeek(settings, {}, null);   // always works, no network
  }
}
```

## Keeping it inside the free tier

- **Only call it on an explicit "new plan".** Never on page load — the plan is already in
  `localStorage`. A family generates maybe one or two plans a week.
- **Rate-limit per IP** in the function. A public URL will eventually get hit by a crawler.
- **Cache** the last AI plan. If the API fails, show the cached one before falling back.
- **Keep the offline generator as the default** and the AI as a "✨ Get ideas" button. That way
  free-tier exhaustion degrades the experience instead of breaking it.

## Is the AI even worth adding?

Honestly: for generating the weekly rotation, barely. `js/planner.js` already does that well, does it
instantly, and does it offline.

Where a model genuinely beats the rule engine:

- **"I have brinjal, coconut and leftover rice — what can I make?"** Open-ended, combinatorial,
  exactly what the rule engine can't do.
- **"Amma is unwell, plan three light days."** Natural language constraints that would each need
  their own hardcoded rule.
- **Festival menus** — Pongal, Deepavali, Karthigai. Rules would have to encode every occasion.
- **Growing the database** — "suggest 20 more Chettinad dinner dishes in this exact JSON format",
  then paste the good ones into `data.js`. This is arguably the highest-value use, and it is a
  one-off you can do in a chat window without writing any integration at all.

That last point is worth sitting with: you may get most of the benefit by using a chatbot to *author
data.js* and never shipping an API call at all.
