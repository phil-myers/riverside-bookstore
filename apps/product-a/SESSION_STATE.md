## 2026-08-24 — Scaffold

Scaffolded the Next.js app (App Router, TypeScript strict, Tailwind v4, Supabase client) on
`product-a/scaffold-nextjs-app`. Placeholder home page only — no catalog, ordering, or loyalty
UI yet.

**Not verified locally**: no Node.js runtime was available in the environment this scaffold was
built in, so `npm install` / `npm run dev` / `npm run build` have not been run. The config files
mirror Product D's working setup exactly (same Next/React/Tailwind versions), but run these
before trusting the scaffold:

```
cd apps/product-a
npm install
npm run dev
```

No Supabase project is wired up yet — `.env.example` lists the two env vars needed
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`); without them `lib/supabase.ts`
throws on import.

## 2026-08-24 — Catalog browse

Built per `SPEC.md` (still active — not archived, see below) on `product-a/catalog-browse`,
stacked on the scaffold branch:

- `lib/supabase.ts` — `getSupabaseClient()` now returns `null` when env vars are missing instead
  of throwing, so the route can render a message instead of crashing.
- `lib/books.ts` — `getBooks()` queries a Supabase `books` table
  (`ISBN, book_title, author_name, stock_quantity`, straight off the shared schema) and returns
  `{ books, configured }`.
- `types/book.ts` — `Book` type.
- `app/page.tsx` — server component rendering the list, with states for "not configured", "empty
  catalog", and populated.

**Not verified**: same no-Node.js constraint as the scaffold — `npm run build` / `npm run dev`
have not been run, and there is no live Supabase project with a `books` table to test the
populated-list path against. There is also no seed script yet for a `books` table — someone
needs to create the table in Supabase and load rows (e.g. from
`docs/schema/riverside-books-integration-chaos-test.csv`'s ISBN/book_title/author_name/
stock_quantity columns) before the populated path can be checked. `SPEC.md` stays active
(not moved to `ARCHIVED_SPECS.md`) until a human runs the Verification steps.

Next up: order the ordering-flow spec once catalog browse is verified — building order logic
before that would touch the `orders`/`order_items` working assumption from `DECISIONS.md`
2026-08-24, which is genuinely INVARIANT (money/state, not just display) and needs its own
spec + nod first.

## 2026-08-24 — Cart UI

Client-side "add to cart" on `product-a/cart-ui`, stacked on `product-a/catalog-browse`. OBSERVABLE
lane — no schema writes, no money math, no spec required:

- `lib/cart.ts` — cart read/write against `localStorage` (key `riverside-books-cart`). Not
  persisted anywhere server-side; this is a browser-only cart, not an order.
- `components/AddToCartButton.tsx` — per-book button on the catalog page, disabled when
  `stockQuantity` is 0.
- `app/cart/page.tsx` — view/edit quantities, remove items. Explicitly does **not** show a dollar
  total: the shared schema has no `price` column, so nothing is fabricated. Flagged in the page
  copy itself.
- `app/page.tsx` — wired up the button per row and added a "View cart" link.

**Data-model gap surfaced by this work**: there is no `price` column anywhere in
`docs/schema/riverside-books-schema.md` or the sample CSV. Checkout/order-total math is
impossible without one. This is a schema-change decision (root `CLAUDE.md` — needs a proposal +
nod from each product owner), not something to invent here. Worth raising with the team before
the order-placement spec below is written, since it may end up needing a price field too.

**Not verified**: same no-Node.js constraint — the localStorage read/write logic, the
add/remove/quantity flows, and the empty-cart state have not been run in a browser in this
session.

Next up: order-placement spec (writes `orders`/`order_items`, decrements `stock_quantity`) — this
is genuinely INVARIANT (silent-wrong risk: double-counted stock, orphaned order rows) and per
root `CLAUDE.md` needs a written `SPEC.md` and a human nod before any code, not just a scope
answer. Draft proposed to Jeffrey on 2026-08-24 pending approval.

## 2026-08-24 — Minimal customer auth

Built per `SPEC.md` on `product-a/auth-spec`, stacked on `product-a/cart-ui`, after Jeffrey
resolved the three open questions (customers table is Product-A-internal; customer_id is
sequential, matching the synthetic dataset's `cust_XXXXX` style; no email verification for this
MVP):

- `apps/product-a/supabase/migrations/0001_books.sql` — the `books` table's create statement,
  finally checked in (it existed only as instructions in this file before now).
- `apps/product-a/supabase/migrations/0002_customers.sql` — `customers` table + a
  `customer_id_seq` Postgres sequence starting at 1000, so generated IDs (`cust_01000` upward)
  never collide with the synthetic dataset, which tops out at `cust_00094`.
- `lib/auth.ts` — `signUp`, `signIn`, `signOut`, `getCurrentCustomerId()`, plus an internal
  `ensureCustomerRow()` used by both signup and login (covers the case where the `customers`
  insert failed after `auth.signUp()` succeeded).
- `app/signup/page.tsx`, `app/login/page.tsx` — plain email/password forms, client-side calls
  into `lib/auth.ts`, redirect to `/` on success.

**Not wired up yet**: no "Log in" / "Sign out" link anywhere in the UI (only reachable by typing
`/signup` or `/login`), and no route guarding — `/cart` works whether or not you're logged in.
Both are the order-placement spec's job, not this one's, per this spec's stated Edge Cases.

**Not verified**: same no-Node.js constraint as everything else in this session, plus these two
migrations have never been run against a real Supabase project. Before trusting any of this:

```
cd apps/product-a
# in the Supabase SQL editor, run supabase/migrations/0001_books.sql then 0002_customers.sql
# enable Auth (email provider) in the Supabase project if not already on
npm install && npm run dev
```

Then walk the spec's Verification steps by hand: sign up, confirm a `customers` row appears,
log out/in, try a duplicate email.

Next up: with a real `customer_id` now obtainable, the order-placement spec (writes
`orders`/`order_items`, decrements `stock_quantity`) is unblocked on the identity side — still
needs its own `SPEC.md` and a human nod before code, being INVARIANT.

## 2026-08-24 — Correction: this environment can actually run the app

Every "not verified, no Node.js runtime" note above was written believing `npm`/`node` were
unavailable. They are, but `bun` (a JS runtime, already on `PATH`) is installed and runs this
Next.js app fine: `bun install`, `bun run build`, and `bun run dev` all work. Verified for real
in this session, in an actual browser (via gstack's `/browse`):

- `bun run build` on the full stack (scaffold + catalog-browse + cart-ui + auth-spec +
  order-placement) compiles clean — TypeScript strict, zero errors, all 5 routes
  (`/`, `/cart`, `/login`, `/signup`) generate.
- Loaded all four pages in a real headless browser — zero console errors on any of them.
- **Found and traced a real click-automation bug** (not an app bug): clicking a button
  immediately after `snapshot` right after page navigation sometimes resolves to the wrong
  element (browser-automation ref/hydration race). Adding `wait --networkidle` between
  navigation and the next snapshot fixed it. Confirmed the underlying cart logic itself is
  correct: clicking "Add to cart" on the same book twice correctly increments quantity to 2
  (verified via `localStorage` directly), not a duplicate line item.
- Added a **sample-data fallback** to `lib/books.ts` (`SAMPLE_BOOKS`, 8 real titles pulled from
  `docs/schema/riverside-books-integration-chaos-test.csv`, not invented) so the catalog page
  shows something real without a live Supabase project — `getBooks()` now returns
  `{ books, source: "supabase" | "sample" }` instead of the old `configured` boolean.
  `app/page.tsx` updated to match; verified live with a screenshot showing all 8 books, correct
  out-of-stock disabling on one.
- Verified the signup form's "Supabase isn't configured yet." error path renders correctly with
  no crash and no console error when Supabase env vars aren't set.

**Still not verified**: anything that requires an actual Supabase project (real signup/login,
real catalog rows from the `books` table, the `place_order` RPC below) — there is no live
Supabase project connected in this environment, sample-data/error-path fallbacks aside. That
needs either a real project's URL + anon key, or someone running the migrations and testing by
hand.

## 2026-08-24 — Order placement

Built per `SPEC.md` on `product-a/order-placement`, stacked on `product-a/auth-spec`:

- `supabase/migrations/0003_orders.sql` — `orders`/`order_items` tables (per `DECISIONS.md`'s
  working assumption) plus `place_order(p_customer_id, p_items)`, a Postgres function doing the
  whole checkout atomically: create the order, lock + check + decrement `stock_quantity` per
  item, insert `order_items`, raising (rolling back everything) if any item is short on stock.
  `order_id` generated the same way as `customer_id` — a sequence, `ord_01000` upward.
- `lib/orders.ts` — `placeOrder(customerId, items)` wrapping the RPC call.
- `lib/cart.ts` — added `clearCart()`.
- `app/cart/page.tsx` — "Place order" button when logged in; "Log in to place an order" link
  when not (the route-guarding auth's spec deferred to here); order confirmation state showing
  the new `order_id`, cart cleared on success.

**Deliberately not built**: loyalty points. `reward_points` exists in the shared schema but
there's no defined earn rate anywhere (per item? per dollar — which still needs the missing
`price` column?) and guessing one would be exactly the "invent a number that should have been
computed" mistake root `CLAUDE.md`'s Bounded AI rule warns against. Needs a decision from
Jeffrey before it's built.

**Verified live** (real browser, `bun run dev`): the logged-out `/cart` correctly shows "Log in
to place an order" instead of a broken button, zero console errors, build compiles clean.
**Not verified**: the actual `place_order` RPC — no live Supabase project to run it against, so
the insufficient-stock rollback and the real order/stock-decrement path are unverified beyond
the SQL logic itself.

Product A now has, top to bottom: browse (sample or live data) → add to cart → sign up / log in
→ place order. What's left for a fuller "finished" product: wiring a live Supabase project (real
data, real accounts, real orders — I don't have credentials to create one myself), a nav
link for login/logout state, and loyalty points once an earn rate is decided.

## 2026-08-24 — Nav login/logout link

Built on `product-a/nav-auth-links`, stacked on `product-a/order-placement`:

- `components/AuthNav.tsx` — client component, shows "Log in" / "Sign up" links when signed
  out, or the current `customer_id` + a "Log out" button when signed in.
- `app/layout.tsx` — added a shared header (site name, "Cart" link, `AuthNav`) so it's on every
  page instead of just being reachable by typing `/login` or `/signup`.
- `app/page.tsx` — removed its own "Riverside Books" heading and "View cart" link, now redundant
  with the shared header.

**Verified live** (real browser, `bun run dev`, fresh port 3000 since 3001 was still held by the
prior session's server): build compiles clean, header renders correctly on both `/` and `/cart`
with "Cart / Log in / Sign up" all present, zero console errors on either page.
**Not verified**: the logged-in state (customer_id + "Log out") — needs a real Supabase session,
which needs a live project.

This was the one item from the three offered ("keep going") that didn't need anything from
Jeffrey — the other two (live Supabase project, loyalty earn rate) are still waiting on him.

## 2026-08-24 — Real prices and totals (unblocked by the schema's new `price` column)

While waiting on Jeffrey's answers above, someone else pushed a resolution to
`docs/flag-missing-price-column` directly: `price` (decimal USD, per `ISBN`) is now in the
canonical shared schema — see `DECISIONS.md`. Worth Jeffrey's attention: that commit doesn't show
sign-off from Philip, Priscilla, or Dominic, which is what root `CLAUDE.md`'s schema-change rule
calls for; not something to unilaterally undo, just flagging it.

That said, it unblocks real Product A work, done on `product-a/pricing`, stacked on
`product-a/nav-auth-links`:

- `supabase/migrations/0004_add_price_to_books.sql` — `alter table books add column price` (a
  new migration, not an edit to the already-committed `0001_books.sql`).
- `types/book.ts`, `lib/books.ts` — `Book` now carries `price`. `SAMPLE_BOOKS` gets placeholder
  demo prices (the synthetic CSV has none) since sample mode is still the demo path per Jeffrey's
  "skip Supabase for now" answer above. Supabase's `numeric` columns come back as strings, not
  numbers — `getBooks()` explicitly coerces with `Number(row.price)`, a real correctness fix, not
  cosmetic (`.toFixed()` would otherwise throw on the live-data path).
- `lib/cart.ts` — `CartItem` carries `price`, captured at add-to-cart time.
- `app/page.tsx` — shows each book's price.
- `app/cart/page.tsx` — shows a per-line subtotal, a cart grand total, and the order total on the
  confirmation screen. Removed the old "no total shown" disclaimer, now inaccurate.

**Loyalty points are still not built.** Jeffrey chose points-per-dollar, which needed exactly
this column — it now exists, but the actual rate (points per dollar — 1:1? 10:1?) is still
undecided. That's the next real question before writing the loyalty code, not implied by
"points per dollar" on its own.

**Verified live** (real browser, `bun run dev`, port 3000): build compiles clean, catalog shows
all 8 sample prices correctly, added two different books to cart and confirmed both the per-line
math and the grand total ($17.99 + $18.99 = $36.98) are correct, zero console errors throughout.

## 2026-08-24 — Fix: real lint error in the cart's hydration pattern

Ran `bun run lint` for the first time this session on `product-a/cart-lint-fix`, stacked on
`product-a/pricing` — hadn't been checked before now. Found a real `react-hooks/set-state-in-effect`
error in `app/cart/page.tsx`: the "read localStorage in a `useEffect`, gate on a `hydrated` flag"
pattern used throughout this session is legitimate (SSR has no `window`) but the newer React
hooks lint rule flags synchronous `setState` in effects generically.

Fixed properly rather than suppressing the rule — switched `lib/cart.ts` to
`useSyncExternalStore`, React's own sanctioned solution for exactly this (external, client-only,
mutable state):

- `lib/cart.ts` now keeps a stable in-memory `cachedItems` snapshot, notifies subscribers on
  every mutation (`addToCart`/`removeFromCart`/`setQuantity`/`clearCart` all funnel through
  `writeCart`), and exports `useCartItems()` — no more manual `hydrated` flag, no more
  `setItems(...)` calls after every mutation, components just re-render automatically.
- `app/cart/page.tsx` — uses `useCartItems()` instead of local `useState` + `useEffect` for
  cart contents. The `customerId` fetch stays a normal effect (that one's fine — the lint rule
  explicitly allows `setState` inside an async callback, only flags synchronous calls in the
  effect body).

**Caught my own bug while verifying this**: first pass had `getServerSnapshot` return a fresh
`[]` literal each call, which triggered "getServerSnapshot should be cached to avoid an infinite
loop" in the browser console. `useSyncExternalStore` requires a stable reference from *both*
snapshot functions, not just the client one. Fixed with a shared `EMPTY_CART` constant.

**Verified live** (real browser, `bun run dev`): `bun run lint` now passes clean, build compiles,
cart reactivity re-tested end to end — added 2 books (math correct: $17.99 + $16.99 = $34.98),
removed one, total updated instantly to $16.99, zero console errors throughout. This is the
first time cart mutations were confirmed to update the UI reactively without a manual
`setItems(...)` call after each one.

## 2026-08-24 — Order history

Built on `product-a/order-history`, stacked on `product-a/cart-lint-fix`. Closes a real gap:
until now, placing an order only ever showed a one-time confirmation screen — there was no way
to see it again afterward.

- `types/order.ts` — `Order` / `OrderLineItem` types.
- `lib/orders.ts` — `getOrderHistory(customerId)`, using Supabase's nested-select syntax to join
  `orders` → `order_items` → `books` in one query instead of three round-trips.
- `app/orders/page.tsx` — lists past orders with line items, per-order total, and status; "Log in
  to see your order history" when signed out.
- `components/AuthNav.tsx` — added a "My orders" link, shown only when signed in.

**Real TypeScript catch while building this**: without an explicit Supabase `Database` type
passed to `createClient()`, PostgREST's embedded-relation types come back as arrays even for a
to-one foreign key (`order_items.ISBN → books.ISBN`, one book per row) — `item.books.book_title`
doesn't type-check, it has to be `item.books[0]?.book_title`. Caught by `bun run build`'s
TypeScript pass, not a runtime surprise.

**Verified live** (real browser, `bun run dev`): build compiles clean, `bun run lint` passes,
logged-out `/orders` correctly shows "Log in to see your order history" with zero console
errors. **Not verified**: the actual populated order-history view — needs a real Supabase
session with real orders in it, same constraint as everywhere else this session.

## 2026-08-24 — Books schema retrofit for the Google Books plan (live fetching NOT built)

Discovered mid-session: `docs/google-books-integration-plan.md` (branch
`docs/google-books-live-data-plan`, team-confirmed 2026-08-24, unmerged) — a team decision to
source `book_title`/`author_name`/cover art live from the Google Books API, cached in a `books`
table shaped `isbn`/`title`/`author`/`cover_image_url`/`found`/`cached_at`. Written assuming
Product A hadn't started yet; it had, with a different column shape entirely
(`"ISBN"`/`book_title`/`author_name`, no cache-bookkeeping columns).

**Tested the actual Google Books API from this environment before doing anything else**:
unauthenticated requests return `429 Quota exceeded... quota_limit_value: "0"` — completely
blocked, not just low-volume, matching what the plan's own author already found. Confirmed
general internet access works fine (`google.com` → 200) and that Open Library (Dominic's
original, already-proven source, which the team explicitly moved away from) works perfectly
right now with no key. Reported this to Jeffrey before proceeding — he chose to do the schema
retrofit now but hold off on building live fetching until the API-key question is resolved.

Built on `product-a/books-schema-retrofit`, stacked on `product-a/order-history`:

- `supabase/migrations/0005_google_books_schema.sql` — renames `books."ISBN"` → `isbn`,
  `book_title` → `title`, `author_name` → `author`; adds `cover_image_url`, `found`,
  `cached_at`; renames `order_items."ISBN"` → `isbn` to match; re-creates `place_order()` (new
  migration, not an edit to `0003_orders.sql`) against the new column names.
- `types/book.ts` — added optional `coverImageUrl`, null/undefined until live fetching exists.
- `lib/books.ts`, `lib/orders.ts` — updated every Supabase query/mapping to the renamed columns.
- `app/page.tsx` — renders a cover thumbnail when `coverImageUrl` is present (plain `<img>`, not
  `next/image` — no confirmed remote-image domain to allowlist yet since nothing fetches covers).

**Deliberately not built**: `getBook(isbn)`, the actual Google Books fetch/cache-on-miss
function the plan describes. Schema is ready for it; the fetch logic isn't written because it
can't be verified live from here without a real `GOOGLE_BOOKS_API_KEY`.

**Verified live** (real browser, `bun run dev`): build compiles clean, `bun run lint` passes
(one `eslint-disable` for the intentional plain `<img>`, justified inline), catalog renders all
8 sample books correctly post-rename, zero console errors. Sample data has no cover images by
design (real ones need the live fetch this branch doesn't build) — the conditional thumbnail
render itself is unverified against a real image URL.

## 2026-08-24 — Accessibility: real `<label>` elements on every form input

Built on `product-a/accessibility-labels`, stacked on `product-a/books-schema-retrofit`. Root
`CLAUDE.md`'s quality standards call for semantic HTML on anything user-facing — every input in
the app relied on `placeholder` as its only label, which fails that: placeholder text disappears
once typing starts and isn't a reliable accessible name for all screen readers.

- `app/signup/page.tsx`, `app/login/page.tsx` — real `<label htmlFor>` for email/password,
  `placeholder` removed (redundant with a visible label), added `autoComplete` (`email`,
  `new-password` / `current-password`) since that's free once real labels exist.
- `app/cart/page.tsx` — the quantity input's label is visually hidden (`sr-only`) but present —
  "Quantity" alone would be redundant on-screen next to the book title, but the input still
  needs an accessible name distinguishing it from every other item's quantity field.

**Verified live** (real browser, `bun run dev`): build compiles, `bun run lint` passes, and the
accessibility tree snapshot on `/signup` now shows `[textbox] "Email"` / `[textbox] "Password"`
resolved from the real labels (previously placeholder-derived, less reliable) — confirmed via
screenshot too, not just the accessibility tree.

## 2026-08-24 — Account page

Built on `product-a/account-page`, stacked on `product-a/accessibility-labels`. Closes another
real gap: `customer_id` and `signup_date` were tracked since the very first auth work but never
shown anywhere.

- `lib/auth.ts` — added `getCurrentCustomer()` (customer_id, email, signup_date in one call);
  `getCurrentCustomerId()` now calls it internally instead of duplicating the session/customers
  query.
- `app/account/page.tsx` — shows customer ID, email, member-since date, and an honest "Loyalty
  points: not built yet — no earn rate has been decided" line rather than a fake 0 or hiding the
  row entirely.
- `components/AuthNav.tsx` — the customer_id text in the nav is now a link to `/account`
  (avoided adding a whole separate nav item for one more link).

**Verified live** (real browser, `bun run dev`): build compiles, lint passes, logged-out
`/account` shows the correct login gate with zero console errors. The populated view — real
customer_id/email/signup_date — is unverified, same live-Supabase constraint as `/orders`.

## 2026-08-24 — Cart logic tests

Built on `product-a/cart-tests`, stacked on `product-a/account-page`. First real automated tests
in Product A — everything until now was verified by hand in a browser each time, which doesn't
scale and doesn't run in CI. Matches the repo's existing convention: Product D uses Vitest
(`apps/product-d/app/contentGenerator.test.js`, on `product-d/session-openlibrary-integration`),
so Product A does too rather than introducing a second test runner.

- `vitest.config.ts` — `environment: "jsdom"` (needed — `lib/cart.ts` reads `window`/
  `localStorage`, which don't exist in Vitest's default Node environment).
- `package.json` — added `vitest`/`jsdom` devDependencies, a `test` script, and `"type":
  "module"` (fixes a real Vite config-loader warning about ESM syntax in a CommonJS-loaded file,
  not just cosmetic — confirmed `lint`/`build` still pass clean after the change).
- `lib/cart.test.ts` — 11 tests: add-new vs. increment-existing, multiple distinct line items,
  remove (found and not-found isbn), set-quantity (update, and remove at 0 / negative — this is
  the exact path the cart page's quantity input hits when someone types 0), clear, and a direct
  `localStorage` assertion so persistence itself is covered, not just the in-memory state.

**Actually run, not just written**: `bun run test` → 11 passed (11), real output pasted into
this note, not claimed from reading the code. Re-ran `bun run lint` and `bun run build` after
the `package.json` change to confirm nothing broke — both still pass.

## 2026-08-24 — Live Google Books cover lookup (`getBook(isbn)`, finally built)

Built on `product-a/google-books-lookup`, stacked on `product-a/cart-tests`. Jeffrey provided a
real `GOOGLE_BOOKS_API_KEY` (in `.env.local`, gitignored, never committed) — the API-key blocker
noted in the "Books schema retrofit" entry above is resolved, so `getBook(isbn)` (called
`getBookCoverByIsbn` here since cover art is all it's used for right now) is finally built.

- `lib/googleBooks.ts` — `getBookCoverByIsbn(isbn)`, server-side only (`GOOGLE_BOOKS_API_KEY` has
  no `NEXT_PUBLIC_` prefix, so this must run in a Server Component, never the browser bundle).
  Caches successful lookups for 24h via Next's `fetch(..., { next: { revalidate: 86400 } })`
  instead of hammering the API on every request.
- `lib/books.ts` — `getBooks()`'s sample-data path now enriches each `SAMPLE_BOOKS` entry with a
  live cover via `getBookCoverByIsbn`; no-ops cleanly (no cover, same as before) if the env var
  isn't set, so this never breaks the sample-data path for anyone without a key.
- `.env.example` — documented `GOOGLE_BOOKS_API_KEY` as optional, server-side only.

**Two real bugs found and fixed via live verification, not assumed correct from the code:**

1. **Transient 5xx from Google's API.** First live screenshot showed only 2 of 8 covers loading;
   individually curl-testing each ISBN showed some 503'd once and returned 200 moments later —
   backend flakiness under bursts, not permanent misses. Fixed with one retry (400ms backoff) on
   5xx before giving up. Re-verified: 5 of 8 loaded next pass (the other 3 are the checksum issue
   below, correctly excluded).
2. **Wrong cover displayed, not just a missing one — the more serious bug.** `Circe`'s ISBN in the
   team's own synthetic dataset (`978-0-316-55635-9`,
   `docs/schema/riverside-books-integration-chaos-test.csv`) fails ISBN-13 checksum validation.
   Google's fuzzy `q=isbn:` search matched the malformed number to an unrelated book ("SEAL TEAM
   SIX") and the app displayed that cover under Circe's title/author with full confidence — worse
   than showing nothing. Checked all 8 sample ISBNs: `The Silent Patient` and `The Seven Husbands
   of Evelyn Hugo` are also checksum-invalid (pre-existing in the CSV, not introduced this
   session — the file is literally named "chaos-test"). Fixed with an ISBN-13 checksum guard in
   `getBookCoverByIsbn` that rejects invalid ISBNs before ever querying Google, so a bad ISBN now
   correctly yields no cover instead of an untrustworthy one.

**Verified live** (real browser, `bun run dev`, real API key, `bun run lint` and `bun run build`
clean before and after each fix): final screenshot shows correct covers for all 5 valid-ISBN
books (`The Midnight Library`, `Educated`, `Where the Crawdads Sing`, `Atomic Habits`,
`Project Hail Mary`) and correctly no cover for the 3 checksum-invalid ones, zero console errors.

**Not fixed here, flagged instead**: the 3 invalid ISBNs are a data-quality issue in the shared
synthetic CSV, not a Product A bug — worth the team's attention if that dataset gets used for
anything ISBN-keyed elsewhere, but correcting the dataset itself is out of this branch's scope.
