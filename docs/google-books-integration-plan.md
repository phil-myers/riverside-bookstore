# Google Books Integration Plan

Team-confirmed 2026-08-24 (see `DECISIONS.md`). Dominic and Jeffrey are on board; Priscilla's
involvement is still unknown, not a blocker since Product C hasn't started.

This doc is written for two audiences at once: teammates reading it directly, and each person's
own AI assistant breaking a section down into real code. The spec-shaped blocks (Objective /
Approach / Inputs-Outputs / Verification / Files / Edge Cases) match this repo's own `SPEC.md`
format on purpose — copy one straight into `SPEC.md` when you're ready to build it.

## The one-sentence version

Book data (ISBN, title, author, cover image) comes live from the Google Books API, cached in
Supabase so it's only ever fetched once per book. Everything else — customers, orders, inventory,
loyalty points, events — stays exactly the synthetic data already built.

## Why this shape

- **Images** were the trigger (Product D needs cover art), but title/author come along for free in
  the same API response, so there's no reason to keep them as separate synthetic columns that can
  drift from reality.
- **ISBN stays the join key.** Synthetic orders/inventory still reference an ISBN; they just don't
  carry the book's title/author/cover alongside it anymore.
- **Caching isn't optional** — without it, every page view of a book list re-hits Google Books for
  the same data. See "Caching architecture" below.

## Important — this is not a green field

Dominic already built and tested a working ISBN → book-metadata lookup on branch
`product-d/session-openlibrary-integration`, against **Open Library**, not Google Books:
`lib/fetchBookMetadata.ts`, in-memory caching, genre classification from subject tags, a
local-catalog fallback, 12 passing tests. It's pushed but not yet a PR — intentionally parked,
per his own session notes, on exactly this sourcing decision.

**That work does not get thrown away.** The shape — a single module other code calls into, a
cache-first lookup, a documented fallback for a miss — carries over directly. Only the fetch
source changes, and the cache moves from in-memory (resets every server restart) to the shared
Supabase `books` table (persists, and every other product can read it too). See the Product D
section below for the specific migration. **This still needs Dominic's own sign-off before his
branch gets reworked** — the team agreeing to Google Books in general isn't the same as Dominic
agreeing to redo this specific work.

## Caching architecture

One new Supabase table, `books` — full column definition is in
`docs/schema/riverside-books-schema.md`. Short version: `isbn` (primary key), `title`, `author`,
`cover_image_url`, `found` (false = "looked up, Google Books had nothing, don't retry"),
`cached_at`.

**Two ways rows get in:**

1. **Bulk, at seed time.** Building the real-ISBN pool for the synthetic dataset means querying
   Google Books anyway (see "Real ISBN pool" below) — every result gets written into `books` as
   part of that same pass. By the time synthetic orders/inventory exist, every book they reference
   is already cached. Normal app usage makes zero live API calls.
2. **One-off, for anything added later.** If staff add a title that isn't in the pool (e.g.
   Product B's future "add inventory" flow), the lookup checks `books` first; on a miss, it calls
   Google Books exactly once, writes the result (or `found: false`), and returns it. Every later
   call for that ISBN is a local read.

**The lookup function**, wherever it's implemented:

```
getBook(isbn):
  row = supabase.select("books").where(isbn).one()
  if row: return row
  result = fetch Google Books by isbn
  if result: upsert books row (found: true, ...)
  else:      upsert books row (found: false, title/author/cover: null)
  return result or null
```

Deliberately left out: any refresh/expiry policy. Book metadata essentially never changes —
adding TTL logic here solves a problem nobody has.

## Real ISBN pool

The synthetic dataset's ISBNs need to actually resolve. The existing chaos-test data
(`docs/schema/riverside-books-integration-chaos-test.csv`) uses recognizable real titles (*The
Midnight Library*, *Educated*, *Where the Crawdads Sing*...) but the exact ISBN digits attached to
them haven't been confirmed against a live API response — direct verification from this session's
environment was rate-limited before it could return a result (network-level restriction, not proof
either way). Product D's own `BOOK_CATALOG` dict is definitely fabricated — invented titles like
"The Salt and the Silence" by "Marguerite Voss" — those ISBNs will never resolve.

**Build order, whoever picks this up:**
1. Query Google Books for ~30-50 real titles (bestseller lists, genre searches — anything that
   returns real results with cover images).
2. Confirm each one actually returns a title/author/`imageLinks.thumbnail`.
3. Write every result into the `books` table (this *is* the seed step from "Caching architecture"
   above).
4. Regenerate the synthetic customer/order/inventory rows against this confirmed pool — same
   shape, same generation logic, just real ISBNs instead of fabricated ones.

## Open questions for whoever builds the lookup function

- **No shared package exists yet** — each `apps/product-*` is its own independent app with its own
  `package.json`, no monorepo workspace tooling. Setting one up just for this would be solving a
  bigger problem than asked. Default: **each product that needs it gets its own small copy** of
  the `getBook(isbn)` function — a few dozen lines, calling the same Supabase table. This matches
  the repo's own rule against premature abstraction; revisit only if a third or fourth product
  needs it and the duplication actually starts hurting.
- **API key or not?** Unauthenticated Google Books requests work at low volume. Getting a key
  raises the daily quota and is worth doing once seeding starts for real — env var only
  (`GOOGLE_BOOKS_API_KEY`), never committed, per the repo's existing security rule.

---

## Per-product breakdown

### Product D (Dominic) — migrate, don't rebuild

Objective: point the existing `fetchBookMetadata()` shape at Google Books + the shared Supabase
cache instead of Open Library + in-memory cache.

Approach: keep the module boundary Dominic already built (`lib/fetchBookMetadata.ts` as "the only
place book data enters the app"). Swap `fetchFromOpenLibrary()` for a Google Books equivalent;
swap the in-memory `Map` cache for `books` table reads/writes. Google Books' `volumeInfo.categories`
is a reasonable analogue to Open Library's `subjects` — the existing `GENRE_KEYWORD_RULES` genre
classifier likely ports over with field-name changes, not a rewrite. The `local-fallback` behind
`USE_LOCAL_CATALOG_FALLBACK` can stay as a last-resort if both Supabase and Google Books miss.

Inputs/Outputs: same `BookMetadata` shape Dominic already defined
(`{ title, author, coverUrl, genre, source }`), `source` gains a `"google-books"` variant.

Verification: re-run the 12 existing tests in `app/contentGenerator.test.js` against the new
source (they test messy-input handling, not the API itself, so most should need no changes) plus
one new test confirming a Supabase cache hit skips the Google Books call.

Files (≤5): `apps/product-d/lib/fetchBookMetadata.ts`, `apps/product-d/lib/localCatalog.ts`,
`apps/product-d/app/contentGenerator.test.js`, `apps/product-d/package.json`.

Edge Cases: ISBN with no Google Books match (existing `found: false` path); the accepted
Hobbit/Charlotte's Web genre-tag ambiguity Dominic already documented likely still applies since
Google Books' category taxonomy has the same problem shape.

Open Questions: PR #2's pure-function refactor (`docs/spec-generatecontent-pure-refactor`) asked
whether `bookMetadata` stays in `generateContent()`'s return at all — this plan doesn't answer that
for him, but it does mean the sourcing question his spec was blocked on now has a team answer.

### Product A (Jeffrey) — not started yet

No code exists yet to wire this into. Once Product A's ordering/browsing views exist: call
`getBook(isbn)` (own copy of the lookup function, per "Open questions" above) wherever a book's
title, author, or cover needs to display. Worth scaffolding with this in mind from the start
rather than retrofitting it later.

### Product B (Philip) — optional, low priority

The Ops Dashboard's core features (low-stock flagging, pending preorders) don't need cover images
to function. A thumbnail next to each title in the inventory list is a nice-to-have, not a
blocker — pick it up after the two INVARIANT features are built and spec'd, not before.

### Product C (Priscilla) — not applicable yet

Still onboarding, no build started, no confirmed AI tooling. Nothing here should block on her or
assume her stack.

## What this does not resolve

The three `order_status` enum conflicts in `docs/schema/riverside-books-schema.md` (items 1-3) are
untouched by this decision — still open, still need Jeffrey's input and a team conversation.
