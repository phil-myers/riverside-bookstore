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

## 2026-08-24 — order_status enum resolved for Product A; orders/order_items adopted as Product A working assumption

Jeffrey confirmed, ahead of starting Product A's build:

1. **Item 1 resolved.** Product A uses the schema's `order_status` enum as-is —
   `Completed, pending, Shipped, preorder`. No local variant. Updated in
   `docs/schema/riverside-books-schema.md`.
2. **Item 2 not yet fully resolved, but Product A is proceeding against it.** The
   `orders`/`order_items` two-table split is still only "agreed in principle" per the team, not
   confirmed by Philip, Priscilla, or Dominic. Jeffrey signed off on it for Product A's own build
   starting today. The tables are **not** added to the canonical schema list in
   `riverside-books-schema.md` — that still needs the full team's nod first. If another product
   ends up needing a different shape for orders, this working assumption may need revisiting.
3. **Item 3 (Product D's order_status variant) is still open.** Not addressed by this decision —
   still needs a team conversation with Dominic.

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

---

## 2026-08-25 — Fixed 11 invalid ISBNs in the synthetic dataset (corrects earlier "3" figure)

Jeffrey's Google Books lookup work surfaced 3 ISBNs in
`docs/schema/riverside-books-integration-chaos-test.csv` that fail ISBN-13 checksum validation.
Checking every ISBN in the file (not just the ones one lookup happened to hit) found the real
number is **11, not 3** — 9 fail checksum outright; 2 more (`Hamnet`, `The Four Winds`) pass
checksum but resolved to the wrong book or nothing at all when looked up, so checksum validity
alone doesn't prove an ISBN is correct. (The file has 23 distinct raw ISBN string values, but
one of those is a deliberate chaos-row duplicate — Klara and the Sun's ISBN appears once
hyphenated and once without hyphens, the same book both times — so 22 is the count of distinct
actual books.)

All 11 replaced with real, verified ISBN-13s — each one confirmed to both pass checksum and
resolve to the correct title via an external lookup, not just generated to satisfy the check
digit:

| Title | Old (broken) | New (verified) |
|---|---|---|
| A Court of Thorns and Roses | 978-1-61963-091-4 | 978-1-490-67662-3 |
| Anxious People | 978-1-9848-2528-7 | 978-1-797-10582-6 |
| Circe | 978-0-316-55635-9 | 978-0-316-55634-7 |
| The Silent Patient | 978-1-250-30170-7 | 978-1-250-30169-7 |
| Where the Forest Meets the Stars | 978-1-4926-5808-6 | 978-1-503-95991-0 |
| The Seven Husbands of Evelyn Hugo | 978-1-5011-6193-4 | 978-1-668-08178-5 |
| The Song of Achilles | 978-0-06-201671-9 | 978-1-408-82613-3 |
| Normal People | 978-1-9848-2214-9 | 978-1-528-81312-9 |
| The Guest List | 978-0-06-294628-4 | 978-1-094-15644-6 |
| Hamnet | 978-0-525-65733-0 | 978-0-525-61717-4 |
| The Four Winds | 978-1-250-17821-3 | 978-1-529-05457-6 |

Note for whoever runs Dominic's genre-classification spot-check: a few of these verified ISBNs
are audiobook/large-print editions rather than the primary print edition. They're real and
correctly titled, so they're valid for that purpose, but their category metadata may be sparser
than a mainstream print edition's — worth knowing if match-rate results look off for these
specific titles.

**The rest of the file (the 100-row structure, the two clean/chaos zones, the one remaining
intentionally-invalid ISBN in the chaos section) is unchanged.** See the new
`docs/schema/README.md` for what the chaos section is for and why it should never be "cleaned."

---

## 2026-08-25 — `order_status` enum extended to 6 values (resolves schema item 3, pending Jeffrey)

Dominic gave Philip explicit sign-off to resolve Product D's `order_status` mismatch (schema item
3) directly, since Dominic was present but not driving at the time.

Investigated before picking a fix, rather than just relabeling Product D's data to fit the
existing 4 values:

- Checked whether "pickup" as a fulfillment concept exists anywhere else in the real system — it
  doesn't. Not in the shared schema, not in Product A's actual `orders` table. It only existed in
  Product D's own invented enum and in Product C's chatbot FAQ copy (generic canned text, not
  backed by real order data).
- Checked whether Product D's actual code (`generate_post.py`, `contentGenerator.js`) branches on
  `order_status` at all — it doesn't, today. But Product D's own `README.md` describes a planned
  feature: a social-share post triggered by `order_status` becoming `Completed`. Labeling an
  in-store pickup order as `Shipped` (the closest existing value) would eventually make that
  feature generate factually wrong customer-facing copy — telling a customer their book shipped
  when it's sitting on a shelf waiting for them. That's a real, concrete harm, not just an
  imprecise label.
- `Cancelled` had no equivalent in the schema at all — none of `preorder, pending, Shipped,
  Completed` represent a voided order, and misclassifying it as any of them would corrupt future
  fulfillment/sales reporting.

**Decision:** extend the canonical `order_status` enum from 4 values to 6:
`preorder, pending, Shipped, ready_for_pickup, Completed, cancelled`. Purely additive — Product
A's live `order_status` column is plain `text` with no DB-level enum constraint, so this doesn't
break anything already built; it just makes two more values legal.

Applied to `docs/schema/riverside-books-schema.md` (open item 3, marked resolved) and
`apps/product-d/README.md`/`CLAUDE.md` (updated to reference the canonical enum instead of its
own variant), plus a relabel of the affected rows in
`apps/product-d/marketing_content_generator_synthetic_data.csv` (`Pending` → `pending`,
`Ready for Pickup` → `ready_for_pickup`, `Cancelled` → `cancelled`; same underlying 30 rows, no
data added or removed). Also found and fixed one unrelated pre-existing slip while in the file: a
single row had `processing` (lowercase, matching none of Product D's original 4 values either) —
folded into `pending`, a low-stakes call since it's one row with no distinct meaning worth
preserving separately, unlike the pickup/cancelled cases above. Confirmed first that nothing in
Product D's actual code (`generate_post.py`, `contentGenerator.js`) reads `order_status` at all
today, so none of this affects live behavior — it's a correctness/consistency fix for the data
and docs only.

**Not fully closed:** Jeffrey wasn't part of this conversation. Since `order_status` is a column
Product A also writes, he should still get a look at this — the change is additive and shouldn't
require any code change on his end, but he owns that column in practice and deserves the chance
to object before this is treated as fully settled.
