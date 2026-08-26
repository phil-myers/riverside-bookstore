# Deployment guide

Written 2026-08-25. Everything in this doc was verified directly against the actual code on
`main` at the time of writing (env files read, `package.json` scripts read, source grepped for
`process.env` usage) — not assumed. If it's stale by the time you read it, trust the code over
this file and update it.

## Status: one real blocker left, and it's not code

As of 2026-08-25, all four products have real, working, verified code on `main`. RLS is live,
`order_status` is resolved, every product's `.env.example` (where one is needed) is accurate.
Which Supabase project is production is now decided (below). **The only thing stopping a real
deploy is that nobody has a hosting account set up yet.** This doc exists so that once one
exists, the actual deploy is a short mechanical task instead of a research project.

## Recommended platform: Vercel

The stack is 3 Next.js apps + 1 static site, in one monorepo. Vercel is built for exactly this
shape: each product becomes its own Vercel *project*, all pointed at the same GitHub repo, each
with a different **Root Directory** setting (`apps/product-a`, `apps/product-b`, etc.) — no
extra config files needed in the repo itself, it's a per-project dashboard setting. Free tier
comfortably covers four small apps like these.

Alternatives (Netlify, Render, Railway) would work too, but Vercel is the path of least
resistance for Next.js specifically and needs the least explaining.

## Which Supabase project is production — decided 2026-08-25

**Jeffrey's existing Supabase project becomes production.** No fresh project gets provisioned.
It already has all 9 migrations applied, RLS live, and has been verified end-to-end all day — so
this avoids redoing real setup work. Products A and B both point their
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` at it.

**The tradeoff, worth knowing before calling this fully "live":** this project has been Jeffrey's
own testing ground all day — whatever accounts, orders, or other rows he created while verifying
things (signup flows, test orders, the insufficient-stock rejection case, and so on) are sitting
in what's now the production database. Nobody on this end can see what's actually in there —
Philip and Claude have never had the URL or key, only Jeffrey does. Worth having Jeffrey take a
look and clear out anything that shouldn't be visible to a real customer before treating this as
truly live, rather than assuming it's already clean.

**The actual credentials still need to move from Jeffrey to whoever configures Vercel.** That
should happen directly between people, not through this repo or through an AI session — the same
way the Google Books key was handled earlier today. Once Jeffrey shares the project URL and anon
key, they get typed straight into Vercel's environment variable settings for Products A and B.

## Other open question

**Who holds the Vercel account** (and its billing, if it ever grows past free tier)? Still an
open decision.

## Per-product deploy steps

**Updated 2026-08-26** — the staff login (PR #33), the Product A "Chat" link (PR #34), and the
Product D build fix (PR #36) all added or changed env vars since this doc was first written.
Re-verified directly against each product's current `.env.example`.

**Deploy order matters here, more than it might look:** Products A → C link to each other in two
different ways. Product A's homepage links to B, C, and D via `NEXT_PUBLIC_*` env vars, which is
easy to update later — but those vars are baked in at *build* time, not read live, so changing one
in Vercel's dashboard requires a **redeploy** to take effect, not just a save. Product C's links
back to Product A, on the other hand, are plain hardcoded URLs in `index.html` (no build step to
inject an env var there) — changing those means an actual code change and a new PR, not a
dashboard setting. Cheapest path: **deploy all four first** to get their real URLs, *then* go back
and (a) set Product A's three `NEXT_PUBLIC_PRODUCT_*_URL` vars and redeploy it, and (b) open a
quick PR updating Product C's hardcoded links. Don't try to get the cross-links perfect on the
first pass — it'll just mean redeploying Product A twice.

### Product A — Customer Ordering & Loyalty App
- **Root Directory:** `apps/product-a`
- **Build command:** `next build` (Vercel auto-detects this)
- **Environment variables** (from `apps/product-a/.env.example`, verified current):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GOOGLE_BOOKS_API_KEY` — optional; catalog works without it, just no cover art. Server-side
    only, no `NEXT_PUBLIC_` prefix (never sent to the browser — see note below). Already has a
    working value locally as of 2026-08-26 — same key Jeffrey and Dominic both use.
  - `NEXT_PUBLIC_PRODUCT_B_URL`, `NEXT_PUBLIC_PRODUCT_D_URL`, `NEXT_PUBLIC_PRODUCT_C_URL` —
    optional, default to local dev ports if blank. Set these to the real B/D/C URLs *after* all
    four are deployed (see deploy-order note above), then redeploy Product A.
- **Points at:** Jeffrey's existing Supabase project (decided above) — already has all 9
  migrations applied, so this is ready as-is, not something to set up from scratch.

### Product B — Staff Inventory & Ops Dashboard
- **Root Directory:** `apps/product-b`
- **Build command:** `next build`
- **Environment variables** (from `apps/product-b/.env.example`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `STAFF_USERNAME`, `STAFF_PASSWORD`, `STAFF_SESSION_SECRET` — the shared staff login added
    2026-08-26 (PR #33). Server-side only, no `NEXT_PUBLIC_` prefix. Use the same three values
    already set in `apps/product-b/.env.local` locally, or pick new ones — just keep them
    identical across Products B and D so one login works for both.
- **Known limitation, not a deploy blocker:** the live `books` table doesn't have a
  `reorder_threshold` column yet (schema `SPEC.md` Open Question 1, needs Jeffrey). Until that's
  added, this product will show its sample-data fallback in production instead of real inventory
  — it'll deploy and run fine, just not with live data yet.

### Product C — Customer Support Chatbot
- **Root Directory:** `apps/product-c`
- **Build command:** none — static HTML/CSS/JS, no build step. On Vercel, set Framework Preset to
  "Other" and leave the build command blank.
- **Environment variables:** none. No Supabase, no API keys, fully self-contained.
- **After Product A is deployed:** its `index.html` has two hardcoded links back to Product A
  (the back arrow and "Store") currently pointing at `localhost:3000` — needs a small follow-up
  PR once Product A's real URL exists (see deploy-order note above).
- Otherwise the simplest of the four to deploy — no other configuration beyond the root directory.

### Product D — Marketing Content Generator
- **Root Directory:** `apps/product-d`
- **Build command:** `next build`
- **Environment variables:**
  - `STAFF_USERNAME`, `STAFF_PASSWORD`, `STAFF_SESSION_SECRET` — same shared staff login as
    Product B (PR #33), same three values so one login works for both. This was previously listed
    as "none currently" — that was accurate before 2026-08-26, no longer is.
  - Cover/metadata fetching still uses Open Library, which needs no key.

## A note on `NEXT_PUBLIC_` prefixes, since it matters for security

Anything prefixed `NEXT_PUBLIC_` gets bundled into client-side JavaScript and is visible to
anyone who views the page source — that's fine for `NEXT_PUBLIC_SUPABASE_ANON_KEY` (it's public
by design; real protection comes from Row Level Security, already verified live). It is **not**
fine for anything else — `GOOGLE_BOOKS_API_KEY` must stay unprefixed so it only runs server-side.
Setting env vars in Vercel's dashboard is safe either way (never commit real values to git); the
prefix is what actually controls exposure.

## Post-deploy checklist

- [ ] **Before going live: Jeffrey reviews his Supabase project's data** and clears out anything
  from his own testing that shouldn't be visible to a real customer (test accounts, test orders,
  etc.) — see the tradeoff noted above.
- [ ] Smoke-test each of the 4 live URLs — page loads, no console errors.
- [ ] Product A: sign up, add to cart, place an order, confirm it appears in order history and
  loyalty points update — the actual RLS/`place_order` path, not just that the page renders.
- [ ] Product B: confirm it shows sample data cleanly (expected until Jeffrey adds
  `reorder_threshold`) rather than crashing.
- [ ] Document the 4 live URLs somewhere the team can find them — root `README.md` currently has
  no live-link section; add one once URLs exist.
