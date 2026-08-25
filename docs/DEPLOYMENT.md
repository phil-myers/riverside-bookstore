# Deployment guide

Written 2026-08-25. Everything in this doc was verified directly against the actual code on
`main` at the time of writing (env files read, `package.json` scripts read, source grepped for
`process.env` usage) — not assumed. If it's stale by the time you read it, trust the code over
this file and update it.

## Status: one real blocker, and it's not code

As of 2026-08-25, all four products have real, working, verified code on `main`. RLS is live,
`order_status` is resolved, every product's `.env.example` (where one is needed) is accurate.
**The only thing stopping a real deploy is that nobody has a hosting account set up yet.** This
doc exists so that once one exists, the actual deploy is a short mechanical task instead of a
research project.

## Recommended platform: Vercel

The stack is 3 Next.js apps + 1 static site, in one monorepo. Vercel is built for exactly this
shape: each product becomes its own Vercel *project*, all pointed at the same GitHub repo, each
with a different **Root Directory** setting (`apps/product-a`, `apps/product-b`, etc.) — no
extra config files needed in the repo itself, it's a per-project dashboard setting. Free tier
comfortably covers four small apps like these.

Alternatives (Netlify, Render, Railway) would work too, but Vercel is the path of least
resistance for Next.js specifically and needs the least explaining.

## Before deploying anything: the real open questions

These are genuine decisions, not defaults to silently pick:

1. **Which Supabase project is "production"?** Jeffrey's been developing and verifying against a
   real Supabase project all day (migrations `0001`–`0009` all applied, RLS live, verified end to
   end). Is that project the one Products A and B point at in production, or does a fresh one get
   provisioned? If fresh, **all 9 migrations need to be run on it, in order, before Product A
   works at all** — this isn't optional setup, `place_order()`, RLS, and loyalty points don't
   exist without them.
2. **Who holds the Vercel account** (and its billing, if it ever grows past free tier)?
3. **What seeds the production database?** The synthetic chaos-test CSV
   (`docs/schema/riverside-books-integration-chaos-test.csv`) is explicitly test fixture data —
   see `docs/schema/README.md` — not something to seed a real customer-facing deploy with as-is.

## Per-product deploy steps

### Product A — Customer Ordering & Loyalty App
- **Root Directory:** `apps/product-a`
- **Build command:** `next build` (Vercel auto-detects this)
- **Environment variables** (from `apps/product-a/.env.example`, verified current):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GOOGLE_BOOKS_API_KEY` — optional; catalog works without it, just no cover art. Server-side
    only, no `NEXT_PUBLIC_` prefix (never sent to the browser — see note below).
- **Depends on:** the target Supabase project having all 9 migrations applied (see open question
  1 above). Without them, this deploys fine but every real feature (RLS, orders, loyalty points)
  is broken.

### Product B — Staff Inventory & Ops Dashboard
- **Root Directory:** `apps/product-b`
- **Build command:** `next build`
- **Environment variables** (from `apps/product-b/.env.example`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Known limitation, not a deploy blocker:** the live `books` table doesn't have a
  `reorder_threshold` column yet (schema `SPEC.md` Open Question 1, needs Jeffrey). Until that's
  added, this product will show its sample-data fallback in production instead of real inventory
  — it'll deploy and run fine, just not with live data yet.

### Product C — Customer Support Chatbot
- **Root Directory:** `apps/product-c`
- **Build command:** none — static HTML/CSS/JS, no build step. On Vercel, set Framework Preset to
  "Other" and leave the build command blank.
- **Environment variables:** none. No Supabase, no API keys, fully self-contained.
- Simplest of the four to deploy — genuinely zero configuration beyond the root directory.

### Product D — Marketing Content Generator
- **Root Directory:** `apps/product-d`
- **Build command:** `next build`
- **Environment variables:** none currently. Verified directly — nothing in `apps/product-d/app/`
  or `apps/product-d/lib/` reads `process.env` at all. Cover/metadata fetching uses Open Library,
  which needs no key. (The Google Books key situation mentioned earlier today, in
  `apps/product-d/.env.local`, was for a separate, never-merged genre-classification spot-check —
  not something the deployed app needs.)

## A note on `NEXT_PUBLIC_` prefixes, since it matters for security

Anything prefixed `NEXT_PUBLIC_` gets bundled into client-side JavaScript and is visible to
anyone who views the page source — that's fine for `NEXT_PUBLIC_SUPABASE_ANON_KEY` (it's public
by design; real protection comes from Row Level Security, already verified live). It is **not**
fine for anything else — `GOOGLE_BOOKS_API_KEY` must stay unprefixed so it only runs server-side.
Setting env vars in Vercel's dashboard is safe either way (never commit real values to git); the
prefix is what actually controls exposure.

## Post-deploy checklist

- [ ] Smoke-test each of the 4 live URLs — page loads, no console errors.
- [ ] Product A: sign up, add to cart, place an order, confirm it appears in order history and
  loyalty points update — the actual RLS/`place_order` path, not just that the page renders.
- [ ] Product B: confirm it shows sample data cleanly (expected until Jeffrey adds
  `reorder_threshold`) rather than crashing.
- [ ] Document the 4 live URLs somewhere the team can find them — root `README.md` currently has
  no live-link section; add one once URLs exist.
