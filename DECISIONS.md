# Decisions

Cross-team decision log — schema changes, interface agreements. A separate file from any single
product's `SESSION_STATE.md` so four people aren't merge-conflicting on one file for unrelated
build notes.

---

## 2026-08-20 — Team repo bootstrap

Set up this repo as the shared build workspace for Team 5's four-product Riverside Books build:
root `CLAUDE.md` (task lanes, spec-driven development, workflow rules), `SPEC.md` /
`ARCHIVED_SPECS.md`, the shared schema at `docs/schema/riverside-books-schema.md`, and
`apps/product-{a,b,c,d}/` scaffolding. Product D's already-built app (previously at repo root) was
relocated into `apps/product-d/` with git history preserved.

Three open schema items carried forward or discovered during this bootstrap — **all unresolved,
none silently picked one way or the other:**

1. **`order_status` enum conflict, Product A vs. schema** — schema says
   `Completed, pending, Shipped, preorder`; Product A's own docs may declare a different enum with
   no `preorder` value. Needs a yes/no from Jeffrey. See
   `docs/schema/riverside-books-schema.md` item 1.
2. **`orders` / `order_items` tables** — agreed in principle (two tables, so `order_status` lives
   in one place per order) but not yet written into the schema doc. Needs team confirmation before
   it's added. See `docs/schema/riverside-books-schema.md` item 2.
3. **`order_status` enum conflict, Product D vs. schema — discovered during this bootstrap.**
   Product D's committed `README.md` declares a third variant:
   `Pending, Ready for Pickup, Completed, Cancelled`. Matches neither the schema doc nor whatever
   Product A turns out to have. Product D has already shipped code against its own version, so
   this is live drift, not a hypothetical. Needs a team conversation to pick one canonical enum.
   See `docs/schema/riverside-books-schema.md` item 3.

**Nothing above has been resolved by this bootstrap.** All three are blockers for anyone
generating real data or building order-status logic until the team picks an answer.

---

## 2026-08-24 — Book data (title, author, cover) sourced live from Google Books API

Product D needs cover images; Philip raised it with the group. Relayed as team-confirmed: Dominic
and Jeffrey are on board (both using Claude for their own build work); Priscilla's involvement is
still unknown — no confirmed AI tooling on her end — not a blocker since Product C hasn't started.

**What's changing:**
- `ISBN` stays a stored column (it's still the join key), but `book_title`, `author_name`, and a
  new cover-image field are no longer stored in the synthetic dataset. They're fetched live, by
  ISBN, from the Google Books API (`https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`).
- Everything else in the shared schema (customer, order, inventory, loyalty, event columns) is
  unchanged — still fully synthetic.
- Live lookups are cached in a new Supabase table, `books` (`isbn` PK, `title`, `author`,
  `cover_image_url`, `found`, `cached_at`), so each ISBN is fetched from Google Books once, ever —
  not once per page view. Full build plan: `docs/google-books-integration-plan.md`.

**Conflict surfaced during planning — flagged here so it doesn't get silently overwritten:**
Dominic already built and tested a working ISBN → book-metadata lookup against a *different* API,
Open Library, on branch `product-d/session-openlibrary-integration` (pushed, not yet a PR) —
caching, genre classification, 12 passing tests, verified against real ISBNs. His own session
notes name this exact sourcing question as a blocker, logged before this decision existed. The
team's call is Google Books instead. **His Open Library branch needs migrating, not discarding**
— the caching and genre-classification shape carry over; only the fetch source changes. This still
needs Dominic's explicit sign-off on the migration itself, not just the general API choice, before
that branch's work is reworked. See `docs/google-books-integration-plan.md`, Product D section.

This does not touch or resolve the three `order_status` items above — still open.
