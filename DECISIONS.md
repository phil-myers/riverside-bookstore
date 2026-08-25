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

## 2026-08-24 — Missing `price` column flagged (new open item 4)

While building Product A's cart, found there is no `price` column anywhere in
`docs/schema/riverside-books-schema.md` or the sample CSV. Product A's cart deliberately shows no
dollar total rather than invent one. This blocks anyone building checkout, an order total, or a
receipt — not just Product A. Needs a team decision on adding a `price` column (and where it
belongs — likely a book attribute alongside `ISBN`/`book_title`, not per-order). Logged as
schema item 4; not resolved by this entry, just surfaced.

---

## 2026-08-24 — `price` column added (resolves item 4)

Added `price` to `docs/schema/riverside-books-schema.md`'s shared columns: one value per `ISBN`
(decimal, USD — e.g. `19.99`), sitting next to `stock_quantity` and `reorder_threshold` since it's
a book attribute, not a per-order value — matches Jeffrey's own suggestion in the flag above.
Deliberately **not** sourced from the Google Books API (`docs/google-books-integration-plan.md`,
still under review) — retail price is Riverside's own decision, not book metadata, and Google's
pricing data (where present at all) reflects Google Play Books sales, not what the store charges.
Product A can now compute real cart/order totals instead of omitting them.
