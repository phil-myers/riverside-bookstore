- 2026-08-20 — Relocated from repo root into `apps/product-d/` during team-repo bootstrap; no
  functional changes, git history preserved via `git mv`. Prior work (marketing content generator
  app, `generate_post.py`, synthetic dataset) was built against an earlier draft of the shared
  data contract — see this product's `CLAUDE.md` > Open items and
  `docs/schema/riverside-books-schema.md` item 3 for the `order_status` enum conflict that needs
  resolving before this product's order-status-related content generation can be trusted.

- 2026-08-24 — Session: built an ISBN → Open Library book-metadata lookup, wired it into
  `generateContent()`, added test coverage, tightened genre classification, and opened a spec for
  a follow-up refactor. Details:
  - Built `lib/fetchBookMetadata.ts`: ISBN → Open Library lookup, in-memory caching, local-catalog
    fallback (`lib/localCatalog.ts`) behind a `USE_LOCAL_CATALOG_FALLBACK` env flag. Verified
    against a real ISBN (9780547928227, *The Hobbit*) — confirmed `source: "openlibrary"` in the
    return.
  - Added a `source` field (`"openlibrary" | "local-fallback"`) to the `BookMetadata` type.
  - Wired `fetchBookMetadata()` into `generateContent()` (now `async`), added `bookMetadata` to
    its return shape.
  - Wrote 12 messy-input tests in `app/contentGenerator.test.js` (missing/malformed/unmatched
    ISBN, missing/malformed/whitespace Author Events, empty input) — all 12 passing. Added
    `vitest` as a devDependency + `test` script (no test runner existed before).
  - Fixed a real bug found via testing: a whitespace-only `Author Events` value was passing the
    truthy check and skipping the `eventDataIncomplete` guard — fixed with a `.trim()`, test
    updated to lock in the correct behavior.
  - Tightened `GENRE_KEYWORD_RULES`: added `horror`/`romance`/`self-help`/`cookbook` buckets,
    fixed false positives in `children's`/`mystery`/`nonfiction` (5 fixes total), evidence-backed
    against 18 real Open Library ISBN lookups plus a full regression check. One accepted open edge
    case, documented in a code comment: *The Hobbit* and *Charlotte's Web* share identical
    Children's-family subject tags, so keyword-based matching can't distinguish "genuinely
    children's" from "adult classic also catalogued as children's" — not fixable by tightening
    further.
  - Opened PR #2 (`docs/spec-generatecontent-pure-refactor`, `SPEC.md` only, no code changes)
    proposing `generateContent()` move to a pure function: `{ title, author, genre, event_title?,
    event_date? }` in, no ISBN, no `bookMetadata` in the return. Corrected once already — the
    "current contract" section originally described the standalone repo's state instead of the
    actual canonical `apps/product-d/` version (plain sync `generateContent()`, no lookup). PR #2
    has 4 open questions awaiting team input: (1) does `eventDataIncomplete` survive the new
    contract, (2) does `genre` get a default or stay required, (3) monorepo-vs-standalone-repo
    sync — resolved, see below, (4) what happens to the ISBN form field on `app/page.tsx` in the
    interim.
  - Discovered and resolved the monorepo sync question: `apps/product-d/` was stale/pre-refactor,
    none of this session's work had reached it. Brought it over on a new branch,
    `product-d/session-openlibrary-integration` (pushed, not yet a PR — intentionally parked
    pending PR #2's sourcing decision). Includes the Open Library integration, all 12 tests, and
    the genre-bucket fixes, applied identically to both the standalone repo and this branch so
    they don't drift again. Verified: `npm install` clean, `npm test` 12/12, `tsc --noEmit` clean
    on both.
  - The `order_status` enum conflict noted in this file's 2026-08-20 entry and in `DECISIONS.md`
    remains unresolved as of this session — not newly discovered, just still outstanding.

  **Currently blocked on:** a team decision on the sourcing approach (Open Library kept as
  fallback vs. dropped for Supabase-only) — needed before `generateContent()` can actually be
  refactored per PR #2's proposal and PR #2 can move from spec to real code — and the
  `order_status` enum conflict, for anything touching that field.
