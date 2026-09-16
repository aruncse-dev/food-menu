# Deploying to Vercel

The app is static: HTML, CSS and three JavaScript files, no build step. Vercel serves that as-is.

## First deploy

1. Push this branch and merge it to `main`.
2. Go to [vercel.com/new](https://vercel.com/new), import `aruncse-dev/food-menu`.
3. Framework preset: **Other**. Build command: **leave empty**. Output directory: **leave empty**
   (the repo root *is* the site).
4. Deploy.

You get `food-menu-<something>.vercel.app`, plus a fresh preview URL on every push and every PR.
The free Hobby plan covers this comfortably — it is a few hundred KB of static files.

## Why Vercel and not GitHub Pages

For the app *as it stands today*, Pages would do the identical job. Vercel earns its place the moment
you add the AI planner, because an API key cannot live in client-side JavaScript on a public site —
anyone can open devtools and read it. That needs a server-side function, which Pages cannot run and
Vercel gives you for free in the same repo.

So the deployment target is chosen for where this is going, not where it is.

## Adding the API function later

Vercel turns any file in `/api` into a serverless function automatically. No config, no framework.

```
food-menu/
  index.html         ← served statically
  css/ js/
  api/
    plan.js          ← becomes https://your-app.vercel.app/api/plan
```

The key goes in **Project → Settings → Environment Variables**, never in the repo. It is readable
inside `api/plan.js` as `process.env.GEMINI_API_KEY` and is never sent to the browser.

See [ai-agent.md](./ai-agent.md) for what goes in that function.

## Making it feel like an app on a phone

Worth doing once deployed, since the whole point is standing in the kitchen holding a phone:

- **Add to Home Screen** already works — iOS and Android will bookmark it with the 🍛 icon.
- To make it launch fullscreen without browser chrome, add a `manifest.json` with
  `"display": "standalone"` and link it from `index.html`. About ten lines.
- To make it work with no signal at all, add a service worker that caches the four files. The app
  already holds its plan in `localStorage`, so it genuinely works offline once cached — there is no
  server call in the current version at all.

Neither is needed for it to be useful. Both are small.

## Custom domain

Free on Vercel if you own one — Project → Settings → Domains, then point a CNAME at it. Something
like `sappadu.yourdomain.com` reads better in a family WhatsApp group than a `.vercel.app` URL.
