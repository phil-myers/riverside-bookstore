# SPEC

# [SPEC] Real book cover images for Product A's live catalog and Product B's dashboard

- Objective: Show real book cover images on Product A's live `/shop` catalog and Product B's
  inventory dashboard, currently both blank (`cover_image_url` is `null` on every row of the
  live shared `books` table — no code path ever populates it).

- Approach: A one-time Node script (`scripts/fetch-book-covers.mjs`) reads every ISBN from the
  live `books` table (read-only), looks up a cover via Google Books first, Open Library as a
  fallback for the real coverage gaps Google Books has, and writes the results to a static JSON
  file committed into each product's own `lib/` directory (no shared runtime code between
  products, matching this repo's existing convention). Each product reads its local copy by ISBN
  at render time — no live API calls at runtime, no database write, ever. Deliberately **not**
  writing the result back to the shared `books` table: that table is Jeffrey's, shared with his
  own live product, and this repo's app has no write access to it today — a static file avoids
  that question entirely rather than raising it.
  Alternative considered (compared directly with Jeffrey over Slack): cache the looked-up URL
  into a `books` column instead of a static file, the way his separate project does it. Rejected
  for this repo specifically because it requires write access to the shared table; his two-source
  fallback logic (Google Books → Open Library) is adopted here, his storage choice isn't.

- Inputs/Outputs:
  - `scripts/fetch-book-covers.mjs`: reads ISBNs from the live `books` table via the public anon
    key (read-only), outputs `{ [isbn]: { coverUrl: string | null, source: "google-books" |
    "open-library" | null } }` to `apps/product-a/lib/bookCovers.json` and
    `apps/product-b/lib/bookCovers.json`.
  - `apps/product-a/lib/books.ts`: live-Supabase path falls back to the local JSON when
    `cover_image_url` is null (currently always, since nothing populates that column).
  - `apps/product-b/lib/inventory.ts` / `app/page.tsx`: adds a cover thumbnail to each row,
    sourced from the local JSON.

- Verification: run the script once, confirm the JSON files have real cover URLs for most of the
  8 live books (spot-check 2-3 against the actual titles); `npm run lint`/`npm run build` clean
  on both products; live check on both deployed URLs that real cover thumbnails render, with a
  clean "no cover" fallback for any ISBN neither source had.
  **Now fully run** (2026-08-26, local dev against the real live `books` table): 8/8 books
  looked up, 5 real covers found (all via Google Books), 3 correctly show "no cover" — those 3
  all have invalid ISBN-13 checksums in the live table (a separate, pre-existing data issue, not
  a bug in this script — see Edge Cases). A real bug was caught and fixed during this
  verification: the Open Library fallback initially used a `HEAD` request to detect its "no
  cover" placeholder image via `Content-Length`, but Open Library doesn't send that header on
  `HEAD` responses, so the check silently never fired — confirmed by comparing a real ISBN
  against a fabricated one and getting the identical 43-byte placeholder GIF back for both.
  Fixed by switching to a real `GET` and checking the downloaded body's actual byte length.
  Verified live on both `localhost:3000/shop` and Product B's dashboard (using a throwaway test
  login, not real credentials) — cover thumbnails render correctly, "no cover" placeholder is
  clean for the 3 books without one.

- Files: `scripts/fetch-book-covers.mjs`, `apps/product-a/lib/bookCovers.json`,
  `apps/product-a/lib/books.ts`, `apps/product-b/lib/bookCovers.json`,
  `apps/product-b/lib/inventory.ts`, `apps/product-b/app/page.tsx`. Six — one shared script plus
  two thin read-sites, not six independent design decisions; noted and accepted when this was
  scoped with Philip rather than force-fit to 5.

- Edge Cases: ISBN with no cover from either source → `null`, rendered as a clean placeholder,
  never a broken image. Script run against a books table that's changed since last run — safe,
  it always reads the live table fresh and overwrites both JSON files completely. Google Books
  transient 5xx — one retry with backoff, same pattern already proven in
  `apps/product-a/lib/googleBooks.ts`. Open Library's known quirk of serving a tiny placeholder
  image instead of a 404 for a missing cover — checked via actual downloaded byte length (not a
  `HEAD` request's `Content-Length`, which Open Library doesn't reliably send — see Verification).
  **Found during this build, not fixed here**: the 3 books with no cover from either source all
  have invalid ISBN-13 checksums in the live `books` table — the same ones `DECISIONS.md`
  documents as fixed in the synthetic CSV fixture a few days ago, but that fix apparently never
  reached the live table. Flagged to Philip; not silently corrected, since it's a write to
  Jeffrey's shared table and a data-integrity issue outside this spec's scope.

- Open Questions: none blocking. Staleness is a known, accepted tradeoff — rerun the script by
  hand if the catalog changes; not automated.

- Tipping Point: if the catalog grows large enough that manually rerunning the script becomes a
  real burden, or if per-book manual cover overrides become a real ask, that's a follow-up spec
  for a live-fetch-and-cache approach — not a reason to build that now.
