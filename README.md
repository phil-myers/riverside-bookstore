# Riverside Books — Team 5

A four product build for Riverside Books, a single location independent bookstore. One monorepo,
one shared data contract, four products built by four teammates.

## Products

| Product | Owner | Path | What it does |
| :---- | :---- | :---- | :---- |
| A - Customer Ordering & Loyalty App | Jeffrey de la Cruz | `apps/product-a/` | Customer facing ordering and loyalty rewards |
| B — Staff Inventory & Ops Dashboard | Philip Myers | `apps/product-b/` | Flags low/out of stock titles, tracks pending pre orders for staff |
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

- **Product D** (only one built so far): `cd apps/product-d && npm install && npm run dev`
- Products A, B, C: not yet built — see each product's `SESSION_STATE.md` for status.
