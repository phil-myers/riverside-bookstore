# Riverside Books — Team Plan

Rewritten 2026-08-25 evening. The previous version of this file described 2026-08-24 evening's
state (PR #5/#13 as the day's first blockers) — all of that resolved many hours and ~20 pull
requests ago. This is a fresh pass, not an edit of the old one.

If you're using an AI assistant to help you work, point it at `AGENTS.md` (same folder) —
written for a coding AI to follow directly. This file is the explanation for you as a human;
that one is the checklist for your tool. **Both files are snapshots — always `git fetch origin`
and check `gh pr list --state all` before trusting anything here, including this sentence.**

---

## Where things actually stand

All four products now have real, working code on `main`, not just scaffolds:

- **Product A** (Jeffrey): full customer app — auth, catalog, cart, order placement, Row Level
  Security, loyalty points, live Google Books cover lookup. Verified end-to-end against a real
  Supabase project, not just sample data.
- **Product B** (Philip): a low-stock inventory dashboard, built and tested. Currently running on
  local sample data only — see "Blocked" below.
- **Product C** (Priscilla): a support chatbot answering order status, pickup/delivery, hours,
  and returns via hardcoded keyword matching. No live data access at all, deliberately — see
  Priscilla's section.
- **Product D** (Dominic): the content generator, refactored, plus live Open Library cover
  fetching. Needs no environment variables or API keys to run.

Security is in real shape: RLS is live on `books`/`customers`/`orders`/`order_items`, and
`place_order`/customer-row-creation are both hardened against a client spoofing another
customer's data (found and fixed via a follow-up review today, not shipped broken).

The shared schema's three original open items are resolved or as-resolved-as-they-can-be without
more people in the room — see "Still needs a human" below for the one piece each isn't fully
closed on.

---

## Blocked items — the two things actually stopping more progress

1. **Product B's live data.** The `books` table doesn't have a `reorder_threshold` column yet.
   It's in the shared schema and the synthetic data, but never got added to Product A's real
   migrations. Someone (Jeffrey, since he owns that table) needs to add it — small, additive,
   should not require a decision, just needs doing.
2. **Deployment.** Every product is ready to go live except for one thing: nobody has a hosting
   account yet. See `docs/DEPLOYMENT.md` for exactly what's needed once one exists — it's a short
   mechanical task at that point, not a research problem. Which Supabase project is production is
   now decided (Jeffrey's existing one — see `DECISIONS.md` 2026-08-25) — but before treating it
   as truly live, **Jeffrey needs to review and clear out his own test data from it.**

---

## Still needs a human — logged as pending, not silently assumed

- **`order_status` enum extension, pending Jeffrey.** Extended from 4 to 6 values (added
  `ready_for_pickup` and `cancelled` — see `DECISIONS.md` 2026-08-25 for the reasoning) with
  Dominic's explicit sign-off, since it resolves his product's mismatch. It's additive and
  shouldn't require any code change, but Jeffrey wasn't part of that conversation and owns the
  column in practice — flag it to him, don't treat it as fully settled until he's seen it.
- **`orders`/`order_items` table split, still not in the canonical schema table.** Product A has
  been building against this shape all day (migrations, RLS, everything). Priscilla and Dominic
  haven't weighed in yet — low urgency since neither product touches orders directly right now,
  but it's a real decision still sitting open, not resolved by default.
- **Deployment account/platform.** `docs/DEPLOYMENT.md` recommends Vercel and explains why; the
  actual account and who holds it is a real decision, not something to default into.

---

## File contention — lower-stakes than yesterday, but still check

- **`SPEC.md`** — currently clear ("No active spec"). Still holds exactly one active spec at a
  time by design; check it's actually empty before writing a new one in.
- **`DECISIONS.md`, `docs/schema/riverside-books-schema.md`** — much of today's churn here is
  done, but if you're about to open a PR touching either, still pull `main` and check
  `gh pr list` first. Multiple people editing these at once is exactly what caused today's merge
  conflicts.

---

## Jeffrey — Product A

1. **Add `reorder_threshold` to the live `books` table.** This is what's blocking Product B from
   showing real data instead of its sample-data fallback. Small, additive migration.
2. **Look at the `order_status` enum extension** (`DECISIONS.md` 2026-08-25) and confirm you're
   good with it, or flag if it needs adjusting.
3. **Before deployment: review your Supabase project's data and clear out your own test
   accounts/orders.** It's been decided as the production database as-is (`DECISIONS.md`
   2026-08-25) — nobody else can see what's currently in it to check this for you.
4. **Share the project URL and anon key directly with whoever configures Vercel** — not through
   the repo, not through an AI session, same as how the Google Books key got handled earlier
   today.
5. Whatever's next on the backup-repo work you're focused on — not tracked here.

## Philip — Product B (you)

1. Once Jeffrey adds `reorder_threshold`, confirm Product B's dashboard shows real data correctly
   against a live Supabase project (it's only been verified against sample data so far).
2. Deployment: the real open questions are the account/platform decision and which Supabase
   project is production — see `docs/DEPLOYMENT.md`.
3. Pending Preorders is still blocked on the `orders`/`order_items` full-team confirmation above.

## Dominic — Product D

1. Your `order_status` mismatch is resolved (see `DECISIONS.md` 2026-08-25) — nothing further
   needed from you there.
2. The genre-classification spot-check (comparing Google Books' `categories` field against Open
   Library's) was blocked on a working API key — worth checking whether that's still relevant
   given Product D's actual shipped cover-fetching uses Open Library, not Google Books.

## Priscilla — Product C

Your chatbot is merged and working — good first PR, and a good call keeping it read-only with no
live data access given RLS considerations. Nothing currently blocking you. If you want to expand
it (a real order-status lookup instead of the generic answer, for example), that would need a way
to identify which customer is asking, which is a real design question worth raising with the team
before building — not something to guess at.

---

## Open questions — need a human decision, not a guess

- **Which Supabase project is "production."**
- **Hosting account/platform for deployment.**
- **`orders`/`order_items` full-team confirmation** (Priscilla, Dominic).
- **`order_status` enum extension confirmation** (Jeffrey).
- **What seeds production data** — the synthetic chaos-test CSV is explicitly test fixture data,
  not something to seed a real deploy with as-is.
