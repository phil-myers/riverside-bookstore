# Product B — Staff Inventory & Ops Dashboard

See root `CLAUDE.md` for team-wide rules, task lanes, and spec-driven development.
See root `docs/schema/riverside-books-schema.md` for the shared schema — link to it, don't
restate it here.

Owner: Philip Myers.

## What it does

Flags low/out-of-stock titles and tracks pending pre-orders for bookstore staff.

## Stack

Next.js (App Router), TypeScript (strict), Tailwind CSS, Supabase (Postgres) — per root
`CLAUDE.md` > Stack.

## Build / test / run

- `npm install`
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm test` — Vitest (run `npm install` first; not yet wired into any CI)
- `npm run lint` — ESLint

## Open items affecting this product

- `docs/schema/riverside-books-schema.md` open item 1: the Pending Preorders feature depends on
  `order_status` including a `preorder` value in Product A's actual data. Blocked on Jeffrey's
  confirmation.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
