# `docs/schema/` — what's in this folder

- `riverside-books-schema.md` — the canonical shared data contract. See its own "OPEN ITEMS"
  section for unresolved columns/enums.
- `riverside-books-integration-chaos-test.csv` — synthetic sample data. **Read this before
  touching it; it is two different things stitched into one file, and treating both halves the
  same way has already caused confusion twice.**

## The CSV has two zones

**Rows 2–66: clean baseline.** One book per row, `YYYY-MM-DD` dates, consistent `order_status`
casing, no event data. This is the "normal" data most product code should build/test against.

**Rows 67–101: deliberately dirty QA fixture.** Built to force explicit handling decisions —
mainly for Product B's ingestion/cleaning logic — before real data hits anything. Do not "fix"
these rows; the mess is the point. Patterns present, all verified directly against the file:

1. **Inconsistent date formats** — `signup_date` appears as `YYYY-MM-DD`, `MM/DD/YYYY`, and
   `DD-MM-YYYY`. `Author Events` timestamps appear in three formats too (a plain-English one, a
   `MM-DD-YYYY HH:MM` one, and ISO). Note: `riverside-books-schema.md` itself states the
   `Author Events` format as `MM-DD-YYYY HH:MM` but its own example value doesn't match that
   format either — "correct" here is genuinely ambiguous until the schema doc itself is fixed.
2. **Missing required fields** — one blank field per row, rotating through `customer_id`,
   `order_id`, `ISBN`, `book_title`, `author_name`.
3. **`order_status` values outside the schema's enum** (`Completed, pending, Shipped, preorder`)
   — the fixture includes `CANCELLED`, `Processing`, `DELIVERED`, and lowercase `shipped`. Do not
   write a cleanup mapping for these until the team picks one canonical enum — see
   `DECISIONS.md` items 1 and 3, still open as of this writing.
4. **Bad/out-of-range numeric values** — negative `stock_quantity`, `reorder_threshold`,
   `quantity`, `reward_points`; an outlier `stock_quantity` of 1,000,000; an outlier `quantity`
   of 500.
5. **Malformed identifiers** — an ISBN missing hyphens, an ISBN with the letter `O` substituted
   for digit `0`, and a `Non Book UPC` too short to be real (5 digits instead of 12).
6. **Multi-line orders** — `order_id`s `ord_70001`/`ord_70002`/`ord_70003` each span two rows,
   one per book in that order, same customer, same `order_status` — this exercises the
   `orders`/`order_items` table-split design (`DECISIONS.md` item 2, agreed in principle, not yet
   written into the canonical schema).
7. **A true duplicate/conflicting order** — `ord_80001` appears three times with the same ISBN
   but `order_status` flip-flopping (`Completed`, `Shipped`, `Completed`) — this tests
   dedup/conflict-resolution logic specifically, not the multi-item-order case above; don't
   conflate the two.

**Do not regenerate this file wholesale.** `apps/product-a/supabase/migrations/0002_customers.sql`
hardcodes `cust_00094` as the customer-ID ceiling sourced from it, and Product A's `SAMPLE_BOOKS`
fallback data in `apps/product-a/lib/books.ts` is pulled from specific rows.

## ISBN quality — history, so this doesn't get "fixed" twice

As of 2026-08-25, all 21 real book ISBNs in the file pass ISBN-13 checksum validation and were
verified to resolve to the correct title via a live lookup (not just a passing checksum — two
of the corrections needed here had *valid* checksums but pointed at the wrong book or nothing at
all, so checksum validity alone is not sufficient proof an ISBN is right). See `DECISIONS.md` for
the corrected count and the list of what changed. The one ISBN that still fails checksum
(`978-O-6O-2O1671-9`, on a row in the chaos section) is intentional — see pattern 5 above.
