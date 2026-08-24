# Riverside Books — Team 5

A four-product build for Riverside Books, a single-location independent bookstore. One monorepo,
one shared data contract, four products built by four teammates.

## Products

| Product | Owner | Path | What it does |
| :---- | :---- | :---- | :---- |
| A — Customer Ordering & Loyalty App | Jeffrey de la Cruz | `apps/product-a/` | Customer-facing ordering and loyalty rewards |
| B — Staff Inventory & Ops Dashboard | Philip Myers | `apps/product-b/` | Flags low/out-of-stock titles, tracks pending pre-orders for staff |
| C — Customer Support Chatbot | Priscilla Batroni | `apps/product-c/` | Onboarding — plan not yet set |
| D — Marketing Content Generator | Dominic Arlequin | `apps/product-d/` | Generates email campaigns, social posts, and event promos |

## Shared schema

All four products read and write the same shape of data — see
`docs/schema/riverside-books-schema.md` for the canonical column list. **Three items in that file
are currently open and unresolved** (an `order_status` enum conflict on two different fronts, and
an `orders`/`order_items` split not yet written into the doc) — read the flagged items at the top
of that file, and `DECISIONS.md`, before building anything that touches order status.

## Working in this repo

Read the root `CLAUDE.md` before making changes — it covers task lanes, spec-driven development
for schema/scoring/join work, and the rule that schema changes are a team decision, not a solo
PR. Each product's own `apps/*/CLAUDE.md` covers that product's build/test/run commands.

## Running each product

- **Product D**: `cd apps/product-d && npm install && npm run dev`
- **Product A**: `cd apps/product-a && npm install && npm run dev` (or `bun install && bun run dev`
  if you don't have Node — this repo's `package.json` scripts work with either). Not yet merged
  to `main` — see "In-flight work" below.
- Products B, C: not yet built on `main` — see each product's `SESSION_STATE.md` for status.
  (Product B has a scaffold branch in flight too; check `git branch -r`.)

## In-flight work (not yet merged to `main`)

Product A has a stack of feature branches ready for PR review, each building on the last:
`product-a/scaffold-nextjs-app` → `catalog-browse` → `cart-ui` → `auth-spec` →
`order-placement` → `nav-auth-links` → `pricing` → `cart-lint-fix`. Together they cover: catalog
browse, a client-side cart with real per-line and order totals, email/password auth via Supabase,
and order placement (atomic stock decrement, no partial writes on failure). Loyalty points are
not built yet. See `apps/product-a/SESSION_STATE.md` for exactly what's verified live vs. not —
most of it was built and tested without a live Supabase project connected, so read that before
assuming any of it works against real data.

Two docs branches are also open: `docs/resolve-order-status-enum-product-a` (resolves schema
open item 1) and `docs/flag-missing-price-column` (added the `price` column — see `DECISIONS.md`
for a note on that one's missing team sign-off).
