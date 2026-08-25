# Archived Specs

Completed specs are appended here, under a dated heading, when their work is done and verified.

## 2026-08-25 — Product A — order placement

Fully verified live this session against a real Supabase project (see
`apps/product-a/SESSION_STATE.md`, 2026-08-25 entry) — the manual-flow verification this spec's
own "Verification" field called for, which no earlier session had a live project to run. Also
hardened past what this spec originally called for: `place_order` now derives `customer_id` from
`auth.uid()` instead of trusting the `p_customer_id` argument (RLS was blocking all queries on a
fresh project with zero policies, and while adding policies it became clear the client-supplied
`customer_id` was a real authorization gap — see PR #18).

- Objective: Let a logged-in customer turn their cart into a real order — writes to
  `orders`/`order_items`, correctly decrements `stock_quantity`, and never leaves partial state
  (an order with no items, or stock decremented with no order) if something fails mid-way.
- Approach: A single Postgres function (`place_order(p_customer_id, p_items jsonb)`), called via
  `supabase.rpc()`, doing everything inside one DB transaction: create the `orders` row
  (`order_status = 'pending'`, the schema's confirmed enum), loop the items, lock and check each
  book's `stock_quantity` before decrementing it, insert each `order_items` row, and raise an
  exception (rolling back the whole transaction — no order, no decrement) if any item doesn't
  have enough stock. `order_id` is DB-generated the same way `customer_id` was: a Postgres
  sequence in the `ord_XXXXX` format, matching the synthetic dataset's style.
  Alternative considered: doing the inserts/decrements as separate calls from the Next.js app
  (create order → insert items → decrement stock) — rejected. That's exactly the "silent-wrong"
  failure mode the repo's INVARIANT lane exists to prevent: a network blip between steps could
  create an order with no items, or decrement stock twice under concurrent checkouts, with
  nothing in the app layer to catch it. A single DB function with row-level locking
  (`SELECT ... FOR UPDATE`) is the standard correct pattern for this, and keeps the invariant
  enforced in one place instead of trusted to application-level sequencing.
  Cart clearing and route guarding (redirect/prompt to `/login` if not signed in) happen on
  `/cart`, since that's where "Place order" lives and where auth's spec explicitly deferred them.
  **Superseded during live verification**: `place_order` now takes only `p_items jsonb` and
  derives `customer_id` server-side via `auth.uid()` — see `0006_rls_and_order_security.sql`.
- Inputs/Outputs:
  - Input: `customer_id` (from `getCurrentCustomerId()`, built in the auth spec) and cart items
    (`{ isbn, quantity }[]`, from `lib/cart.ts`).
  - `place_order(p_customer_id text, p_items jsonb) returns text` — returns the new `order_id` on
    success, raises on insufficient stock (surfaced to the customer as an error, cart untouched
    so they can adjust quantity and retry).
  - `lib/orders.ts`: `placeOrder(customerId, items): Promise<{ orderId: string } | { error: string }>`
    wrapping the RPC call.
  - New tables (already agreed in `DECISIONS.md` 2026-08-24 — Product A building against them,
    not yet in the canonical shared schema pending full-team confirmation): `orders` (`order_id`
    text PK, `customer_id` text, `order_status` text), `order_items` (`order_id` text, `ISBN`
    text, `quantity` integer).
- Verification: `npm run build` typechecks. Manual flow against a configured Supabase project
  with the `books`/`customers` tables seeded and a logged-in test customer: add items to cart,
  place order, confirm an `orders` row and matching `order_items` rows exist, confirm
  `stock_quantity` decreased by the ordered amount, confirm the cart is empty afterward. Then:
  try to order more than `stock_quantity` allows, confirm the function raises and neither the
  order nor the stock decrement happened (query the DB directly to check, not just the UI).
  **Now fully run** (2026-08-25, real Supabase project, `/browse`): order placed successfully
  ($33.98 total, correct order ID), order history and account page confirmed correct, and the
  insufficient-stock case (10 requested vs. 4 available) rejected with the correct error and no
  partial state (stock unchanged, no orphan order row).
- Files: `apps/product-a/supabase/migrations/0003_orders.sql` (not counted against the cap, same
  reasoning as the earlier migrations), `apps/product-a/lib/orders.ts`, `apps/product-a/lib/cart.ts`
  (add `clearCart()`), `apps/product-a/app/cart/page.tsx` (add "Place order" button, login gate,
  order confirmation state), `apps/product-a/SESSION_STATE.md`.
- Edge Cases: not logged in — `/cart` shows "Log in to place an order" linking to `/login`
  instead of a broken/silently-failing button. Empty cart — no "Place order" button shown.
  Insufficient stock on one item among several — whole order rejected (transaction rolls back),
  not a partial order; error message names which title. Two customers racing for the last copy —
  handled by the row lock in `place_order`; the second caller's transaction sees the
  already-decremented `stock_quantity` and correctly raises.
- Open Questions: none blocking implementation. Loyalty points are explicitly **not** part of
  this spec — `reward_points` exists in the shared schema but there's no defined earn rate
  anywhere (points per item? per dollar, which needs the still-missing `price` column from
  `DECISIONS.md`?). Building that now would mean guessing a business rule, which is exactly what
  the repo's Bounded AI rule says not to do. Flagging as the next open question for Jeffrey once
  this spec ships.
- Tipping Point: order cancellation / status transitions (`pending` → `Shipped` → `Completed`) is
  Product B's ops-dashboard territory and/or a follow-up spec, not part of placing an order.
