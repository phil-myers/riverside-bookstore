# OPEN ITEMS — unresolved, read before building against this schema

1. **`order_status` enum conflict, unresolved (Product A vs. schema).** The schema below lists
   `Completed, pending, Shipped, preorder`. Product A's own README.md/CLAUDE.md drafts (if ported
   alongside — check with Jeffrey) may still declare a different enum with no `preorder` value at
   all. If so, Product B's Pending Preorders feature silently breaks. Needs a yes/no from Jeffrey
   before anyone generates real data against this schema.

2. **`orders` / `order_items` tables, agreed on but not yet written into the schema doc.** Decided
   this cycle: `orders` (`order_id`, `order_status`, `customer_id`) and `order_items` (`order_id`,
   `ISBN`, `quantity`) as two separate tables, specifically so `order_status` lives in exactly one
   place per order instead of risking drift across an order's multiple line items. Add these to
   this schema file as soon as the team confirms, not before.

3. **`order_status` enum conflict, confirmed (Product D vs. schema) — discovered during team-repo
   bootstrap, 2026-08-20.** Product D's already-committed `README.md` (now at
   `apps/product-d/README.md`) declares a *third* variant: `Pending, Ready for Pickup, Completed,
   Cancelled`. This matches neither the schema below (`Completed, pending, Shipped, preorder`) nor
   whatever Product A turns out to have (item 1). This is live drift, not a hypothetical — Product
   D has already built and pushed code against its own version. Needs a team conversation to pick
   one canonical enum, then updates to whichever product(s) don't match. See `DECISIONS.md`.

**Resolved, 2026-08-24 — book data is live, not stored.** `book_title` and `author_name` are no
longer synthetic columns — they're fetched from the Google Books API by `ISBN` at read time, along
with a cover image, and cached in a new Supabase `books` table. `ISBN` itself stays a stored
column (still the join key). See "Book Data" section below and `DECISIONS.md`.

---

# Data Schema Template (V2)

**HOW TO USE THIS TEMPLATE:** Make a copy of this document and fill it out together as a team, before anyone opens a code editor. Your team's four products only work together if they all read and write the exact same shape of data. Agree on every shared column now, using the same name, format, and meaning across all four products.

## Team & Project Info

| Team Name | Client Scenario / Business | Date   |
| :---- | :---- | :---- |
| Team 5 | Riverside Books Bookstore | 8/18/2026 |

## Your Shared Columns

List every column your four products need to share. Below are the unified schema columns including customer, order, inventory, book metadata, and event details.

`book_title` and `author_name` are **not** stored columns anymore — see "Book Data" below.

| Column Name | Description | Format | Example Value   |
| :---- | :---- | :---- | :---- |
| customer_id | Unique identifier for a customer | string | cust_00042 |
| signup_date | Date the customer signed up | date (YYYY-MM-DD) | 2026-03-14 |
| ISBN | Universal book identifier — join key for live book data | Number string | 978-1-56592-479-6 |
| Author Events | Author Books Meet and Greet date/time | date (MM-DD-YYYY HH:MM) | September 5, 2026 at 6:30 PM |
| event_title | Name or title of the upcoming event | string | Local Author Evening: Matt Haig |
| event_description | Detailed overview and highlights of the event | string | Join us for an evening reading, Q&A, and book signing with author Matt Haig. |
| Ticket ID (for events) | Ticket ID for events such as book signings | string | 2026-03-14-42 |
| Non Book UPC | Barcode for non-book items | string | 012345678905 |
| order_id | Unique identifier for an order | string | ord_98765 |
| order_status | Current processing state of the order | string (enum) | Completed, pending, Shipped, preorder |
| stock_quantity | Total number of items currently available in inventory | integer | 40 |
| reward_points | Total active loyalty points accumulated by the customer | integer | 250 |
| reorder_threshold | Minimum stock quantity for this title before staff should reorder more copies | integer | 5 |
| quantity | Number of copies of a given title in an order | integer | 1 |

## Book Data — live, not stored (added 2026-08-24)

`book_title`, `author_name`, and cover images are fetched live from the Google Books API by
`ISBN`, not carried as synthetic columns. Results are cached in Supabase so each ISBN only ever
hits the live API once. Full build plan: `docs/google-books-integration-plan.md`.

**`books` table (Supabase) — the cache, source of truth for book display data:**

| Column | Description | Format | Example Value |
| :---- | :---- | :---- | :---- |
| isbn | Primary key — same ISBN used in the shared columns above | string | 978-0-525-55948-1 |
| title | Book title | string | The Midnight Library |
| author | Author name | string | Matt Haig |
| cover_image_url | Cover image, from Google Books | string (URL) | https://books.google.com/... |
| found | False if Google Books had nothing for this ISBN (negative cache — don't re-request) | boolean | true |
| cached_at | When this row was written | timestamp | 2026-08-24T15:02:00Z |

## Team Sign-Off

All four teammates review this schema and agree to build against it exactly as written.

| Name | Product | Signature / Initials   |
| :---- | :---- | :---- |
| Dominic Arlequin | Marketing Content Generator (D) | D.A |
| Philip Myers | Product B: Staff Inventory & Ops Dashboard | P.M |
| Jeffrey de la Cruz | Product A: Customer Ordering & Loyalty App | J.D.LC |
| Priscilla Batroni | Product C: Customer Support Chatbot | P.B |
