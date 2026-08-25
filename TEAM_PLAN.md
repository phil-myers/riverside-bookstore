# Riverside Books — Team Plan

Written 2026-08-24 evening, after a full pull-request review pass. Read this before starting
work tomorrow — it tells you what's done, what's waiting on what, and exactly what not to touch
until something else lands, so nobody edits the same file as someone else at the same time.

If you're using an AI assistant to help you work, point it at `AGENTS.md` (same folder) —
written for a coding AI to follow directly. This file is the explanation for you as a human;
that one is the checklist for your tool.

---

## Tonight's pull request results (already done, nothing for you to do here)

| PR | What happened | Why |
|---|---|---|
| #8, #9, #11 | Closed, not merged | Each was an earlier checkpoint of the exact same branch history that #10 already fully contains, confirmed directly against git's commit history. Nothing lost — merging #10 covers all of it. |
| #10 | Approved | Reviewed the full thing — all 5 database migrations, the order-placement function, auth, cart, tests. The core logic is correct and well-tested. Two follow-ups flagged in the review (not blocking): no Row Level Security anywhere yet, and the price a customer pays isn't recorded on the order itself. |
| #2 | Closed, not merged | Directly conflicted with #10 — both rewrote the same line of `SPEC.md` into two different documents. #10 goes first since it has real code riding on it; Dominic re-opens this spec after #10's is archived (see the `SPEC.md` rule below). |
| #5 | Still open, still needs a real approval | You (Philip) can't approve your own PR. Needs Jeffrey or Dominic. |
| #7 | Untouched | Its "formatting fix" actually strips correct hyphens ("four-product" → "four product"). Needs Dominic to reconsider before anyone approves it. |
| #3 | Untouched | Still not ready — needs updating for what's below, plus Dominic's genre spot-check. |
| #4 | Untouched | Still broken — based on Dominic's old standalone repo, would delete other people's files if merged. Needs a full rebase from scratch. |

---

## The rule that matters most: which files are contested right now

Before touching any of these files, check this table. If your work touches one of them, read
the "wait for" column — merging out of order causes real conflicts, not just messy history.

| File(s) | Who's touching them | Wait for |
|---|---|---|
| `DECISIONS.md`, `docs/schema/riverside-books-schema.md` | PR #5 (price), Jeffrey's order-status branch (not a PR yet), PR #3 (Google Books, not ready) | Merge one at a time, in that order, pulling `main` before each. Never merge two of these at once. |
| `SPEC.md` | About to hold Jeffrey's order-placement spec once #10 merges | **Nobody else writes to this file until that spec is verified against a live Supabase project and archived to `ARCHIVED_SPECS.md`.** This file holds exactly one active spec, by design. Dominic's refactor spec waits here. |
| `README.md` | PR #7 (top section: product table) and Jeffrey's `docs/update-readme-product-a-status` branch (bottom section: in-flight work) | Different sections of the file, low conflict risk — but land PR #7's fix first so the in-flight-work update doesn't reference a wrong version of the top section. |
| `apps/product-d/` | PR #4 (broken) | Nobody builds new Product D work on top of PR #4 until Dominic rebases it onto current `main`. |

---

## Tomorrow morning, in order

**Step zero, before anything else: approve and merge PR #5, then PR #13 (the PR that adds this
file and `AGENTS.md`).** You're reading this because you already pulled `main` — but if anyone
hasn't yet, or their AI assistant hasn't, none of the rest of this sequence works: PR #13 has to
actually be merged and pulled before "point your AI at `AGENTS.md`" means anything. Do this part
first, literally before opening or reviewing any other PR.

1. **Approve PR #5** (price). It's clean, already matches what Jeffrey's own code independently
   built against — just needs the actual GitHub approval click.
2. **Approve PR #13** (this file plus `AGENTS.md`).
3. **Merge both** (order between these two doesn't matter — they don't touch any of the same
   files).
4. **Everyone pulls `main` locally** before starting anything else, so your own working copy and
   your AI assistant both actually have `AGENTS.md` and the rest of this plan.
5. **Jeffrey opens a PR for `docs/resolve-order-status-enum-product-a`** (real, finished work — it
   just never got opened as a PR). Get it approved, then merge it — after #5, not before, since
   both touch the same two files.
6. **Merge PR #10** — already approved, no file conflicts with anything above, can genuinely
   happen any time, even before step 1 if someone wants to.
7. **Once #10 is merged:** Jeffrey (or whoever verifies it) sets up a real Supabase project and
   checks the order-placement flow works live — add to cart, place an order, confirm stock
   decrements, confirm an over-order correctly fails. Once verified, archive that spec into
   `ARCHIVED_SPECS.md` and clear `SPEC.md`. This step is what unblocks Dominic.

---

## Jeffrey — Product A

**Do first (you're blocking Philip and, indirectly, Dominic):**
1. Open the PR for `docs/resolve-order-status-enum-product-a`.

**Then, in no particular order:**
2. Add Row Level Security policies to `orders`, `order_items`, and `customers` — right now a
   logged-in customer could read another customer's order history, since nothing at the database
   level checks whose data is whose.
3. Record the price paid on each order line (add a `price` column to `order_items`, filled in at
   order-placement time) so a later price change doesn't erase the historical record of what was
   actually charged.
4. Open a PR for `product-a/google-books-lookup` — it's already built and verified working. Two
   things worth calling out in that PR's description so the team knows:
   - **You found 3 ISBNs in the shared synthetic dataset that fail ISBN-13 checksum validation.**
     This is a real data-quality problem in `docs/schema/riverside-books-integration-chaos-test.csv`
     that affects everyone using that dataset, not just you. Flag it in `DECISIONS.md`.
   - Your caching approach (Next.js's 24-hour fetch revalidation) is different from the Supabase
     `books`-table cache-forever approach in the still-open Google Books plan (PR #3). These are
     two different strategies solving the same problem — worth a note to Dominic/Philip so PR #3
     gets reconciled with what you actually built, rather than describing something that no longer
     matches reality.
5. Open the PR for `docs/update-readme-product-a-status` — after PR #7 lands (see file-contention
   table above).
6. **Loyalty points** — flagged as not-yet-built in your own SPEC.md note, and it's a real open
   question, not something to guess at: what's the earn rate (points per item? per dollar, now
   that `price` exists)? Don't build this until that's decided — ask, don't assume, per this
   repo's own rule about bounded AI.

---

## Philip — Product B (you)

1. Nudge whoever's around to approve #5 — nothing else to do there.
2. Once the schema dust settles, resume the low-stock feature: the spec draft is already written
   (see the earlier conversation) — give it your own nod, then build it against the synthetic CSV
   directly. Doesn't need Supabase wired up yet.
3. **Pending Preorders stays blocked** — not just on Jeffrey's `order_status` answer (resolved)
   but on the `orders`/`order_items` table shape being *fully* team-confirmed, not just Jeffrey's
   working assumption for his own product. Check where that stands before starting.
4. Optional, low priority: book-cover thumbnails on the inventory list, once Google Books
   settles.

---

## Dominic — Product D

**Blocked on `SPEC.md` until Jeffrey's spec is archived** (see the file-contention table) — but
there's real, unblocked work to do in the meantime:

1. **Rebase PR #4 from scratch.** This is the priority — real, good code (Open Library cover
   fetching, the generator refactor, visual fixes) is stuck behind a branch based on your old
   standalone repo. Start from current `main`, re-apply your changes inside `apps/product-d/`
   only. Don't touch anything outside that folder.
2. **Run the genre-classification spot-check** now that a real API key exists — this is what your
   own review of PR #3 was waiting on. One more thing to factor in: Jeffrey found 3 invalid ISBNs
   in the shared dataset while testing his own lookup (see his section above) — worth excluding
   those from your spot-check sample, or you'll get a false read on match quality from ISBNs that
   were never going to resolve to anything.
3. **Fix PR #7** — the "formatting fix" currently removes correct hyphens. Either fix the actual
   punctuation issues it was meant to address, or close it.
4. **Resolve Product D's own `order_status` mismatch** (schema item 3) — your `README.md` still
   declares a variant that matches neither the shared schema nor Product A's. This needs a team
   conversation, not a unilateral pick.
5. **Once Jeffrey's spec is archived:** re-open your pure-function refactor spec (previously
   PR #2) as a fresh PR against the then-current `SPEC.md`.

---

## Priscilla — Product C

You're starting tomorrow, so here's a first-day checklist — not a prescribed technical plan,
since your stack and approach are genuinely your call, not something anyone should decide for
you in advance.

1. Read root `CLAUDE.md` first — the team's workflow rules, how specs work, and the git process
   (no direct pushes to `main`, everything through a reviewed pull request).
2. Read `docs/schema/riverside-books-schema.md` — the shared data contract the other three
   products build against. You don't have to use all of it, but you should know what exists.
3. Decide your stack. The other three use Next.js, TypeScript, Tailwind, and Supabase, but
   nothing requires you to match that — say what you're actually planning to build with.
4. Replace the placeholder in `apps/product-c/CLAUDE.md` with your real plan once you've decided:
   what it does, your stack, build/test/run commands — same shape as the other products' files.
5. Think about what shared data your chatbot actually needs. Likely candidates: `order_status`
   (for "where's my order" questions) and book data (title/author/cover), which by the time you
   start may be available through the same lookup pattern the others are using — check in with
   the team on where that stands.
6. Same rule as everyone else: if a feature involves a calculation or a judgment call that could
   be silently wrong (not just a copy or styling choice), write a short spec first and get a nod
   before building it.

---

## Open questions — need a human decision, not a guess

- **Loyalty points earn rate** (Product A) — no rule defined yet.
- **Google Books caching strategy** — Jeffrey's Next.js fetch-revalidate approach vs. the
  Supabase `books`-table cache-forever approach in PR #3. Two different answers to the same
  problem; someone needs to reconcile which one the team actually wants.
- **3 invalid ISBNs in the shared synthetic dataset** — needs a data fix, not just a workaround
  in each product separately.
- **Product D's `order_status` enum** (schema item 3) — still needs a team conversation.
- **Whether Priscilla's product needs Supabase at all** — genuinely her call.
