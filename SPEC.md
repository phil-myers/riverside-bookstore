# SPEC

# [SPEC] Product B — low-stock inventory flagging

- Objective: Give bookstore staff a dashboard view flagging which titles are low on or out of
  stock, so they know what needs reordering without eyeballing raw numbers.

- Approach: Server-side fetch of `stock_quantity`/`reorder_threshold` per book from the shared
  `books` table, computed into a status (Out of Stock / Low Stock / OK) by a pure, deterministic
  function — no AI involved in the classification, matching the repo's Bounded AI rule. Classify:
  `stock_quantity <= 0` → Out of Stock; `0 < stock_quantity <= reorder_threshold` → Low Stock;
  else → OK. Sorted most-urgent-first, then alphabetically within a status.
  Alternative considered: client-side fetch + compute. Rejected — this is a read-only staff view
  with no interactivity yet, so a server component avoids an unnecessary API surface.

- Inputs/Outputs:
  - Reads `books`: `isbn`, `title`, `author`, `stock_quantity`, `reorder_threshold` (column names
    per `0005_google_books_schema.sql`'s rename, not the original `0001_books.sql` names).
  - `lib/inventory.ts`: `classifyStock(stock, threshold): StockStatus` (pure, unit-testable
    without a live DB) and `getInventoryStatus(): Promise<{ books: BookStockRow[], source:
    "supabase" | "sample" }>`.
  - A page rendering a table: Title / Author / Stock / Reorder Threshold / Status badge.

- Verification: Unit tests on `classifyStock()` covering the three states plus the boundary case
  (`stock === threshold` → Low Stock, and the defensive negative-stock case). Manual check against
  a local sample-data fallback (mirrors Product A's `SAMPLE_BOOKS` pattern, since
  `reorder_threshold` doesn't exist on the live table yet — see Open Questions) confirming correct
  badges and sort order, `npm run build` clean, zero console errors. Live-Supabase verification is
  explicitly deferred until Open Question 1 below is resolved.

- Files: `apps/product-b/lib/inventory.ts`, `apps/product-b/lib/inventory.test.ts`,
  `apps/product-b/lib/supabase.ts`, `apps/product-b/app/page.tsx`,
  `apps/product-b/.env.example`. (5, at the cap — `package.json`/`package-lock.json`/
  `vitest.config.ts` also change, but only to add the `@supabase/supabase-js` dependency and test
  runner, mechanically required to use them, not additional design surface.)

- Edge Cases: `reorder_threshold` missing/null (see Open Questions — blocks live-data
  verification specifically, not the classification logic itself, which still runs correctly
  against sample data); empty catalog → empty state, not a crash; `stock_quantity` negative
  (shouldn't happen given Product A's DB check constraint, but defended anyway — treated as Out
  of Stock); tied urgency → secondary sort by title.

- Open Questions:
  1. `reorder_threshold` doesn't exist on the live `books` table yet — confirmed by reading
     every one of Product A's actual migrations in order (`isbn`/`title`/`author`/
     `stock_quantity`/`price` exist there, after `0005`'s rename from the original
     `"ISBN"`/`book_title`/`author_name`, plus the Google Books columns). It's in
     the team-signed-off shared schema doc and the synthetic CSV, but never added to the real
     table. Per root `CLAUDE.md`'s "don't invent a shared column unilaterally" — even though it's
     already schema-approved, actually adding it to Product A's live table/migrations needs
     Jeffrey's nod, since Product B doesn't own that table. **This blocks live verification, not
     the build** — sample-data mode unblocks starting now.
  2. Does this need staff auth, or is read-only-unauthenticated fine for v1 (`books` is already
     publicly readable via existing RLS policy, no PII involved either way)? Assumed fine for v1
     given no PII is exposed; flag if that assumption turns out wrong.

- Tipping Point: filtering/sorting UI, CSV export, or a "mark as reordered" workflow is a
  follow-up spec — this one is view-only.
