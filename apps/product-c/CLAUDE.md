# Product C — Customer Support Chatbot

See root `CLAUDE.md` for team-wide rules, task lanes, and spec-driven development.
See root `docs/schema/riverside-books-schema.md` for the shared schema — link to it, don't
restate it here.

Owner: Priscilla Batroni.

## What it does

A customer-facing support chatbot answering three kinds of questions:
- **Order status** — "where's my order?" using the shared `order_status` column.
- **Book info & availability** — title/author lookup and in-stock status using shared book data.
- **Store info & policies** — hours, returns, events, general FAQ (no live data needed for this
  part).

## Stack

Deliberately **not** matching Products A/B/D's Next.js/Tailwind/Supabase-via-server stack — a
standalone static site (HTML/CSS/JS, no build step), same approach as this owner's other
projects. Still plugs into the **same shared data**, not a separate copy of it: reads
`order_status` and book data from the team's Supabase project directly via the Supabase JS client
(`@supabase/supabase-js` loaded client-side), so it's a separate codebase but the same live data
source as everyone else — not a fork of the schema.

## Build / test / run

Not yet set up — commands go here once the project is scaffolded.

## Open items affecting this product

- `docs/schema/riverside-books-schema.md` open item 1 and item 3: the `order_status` enum has
  three different candidate values across the schema doc, Product A, and Product D, still
  unresolved. The order-status feature above can't be built against a real value set until the
  team picks one — see `DECISIONS.md`.
- **Order status is also blocked on two backend gaps, flagged in PR #17 review (Phil, 2026-08-25):**
  no Row Level Security policies exist yet on `orders`/`order_items` (Jeffrey's open follow-up from
  the order-placement work), so a public page reading orders with the anon key — combined with
  sequential, guessable order IDs (`ord_01000`, `ord_01001`, ...) — could page through every
  customer's order history. And separately, even once RLS exists, this chatbot has no login, so
  there's no logged-in identity for RLS to filter on and no way yet for a customer to prove a given
  order is theirs. Order-status lookup needs an answer to that identity question before it's built,
  not just RLS turned on. Book info/availability and the store FAQ are unaffected — read-only
  public data, no identity question involved.
- Whether this product needs write access to Supabase (vs. read-only) hasn't come up yet — current
  scope (status lookup, info lookup) is read-only, so likely just an anon/read key, but flag this
  if that changes.
