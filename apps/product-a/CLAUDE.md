# Product A — Customer Ordering & Loyalty App

See root `CLAUDE.md` for team-wide rules, task lanes, and spec-driven development.
See root `docs/schema/riverside-books-schema.md` for the shared schema — link to it, don't
restate it here.

Owner: Jeffrey de la Cruz.

## Stack

Next.js 16 (App Router), TypeScript (strict), Tailwind CSS v4, React 19, Supabase
(`@supabase/supabase-js`) — matches root `CLAUDE.md` > Stack.

## Build / test / run

- `npm install`
- Copy `.env.example` to `.env.local` and fill in a Supabase project's URL/anon key
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint

## Open items affecting this product

- ~~`docs/schema/riverside-books-schema.md` open item 1~~ — resolved 2026-08-24, see
  `DECISIONS.md`. Product A uses the schema's `order_status` enum as-is: `Completed, pending,
  Shipped, preorder`.
- Building against the `orders`/`order_items` two-table split (schema item 2) as a working
  assumption, not yet full-team-confirmed. See `DECISIONS.md` 2026-08-24 entry.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
