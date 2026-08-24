# [SPEC] Refactor generateContent() into a pure function

- Objective: Make Product D's `generateContent()` a pure function — given the same
  content-shaped input, it always returns the same three marketing content pieces, with no ISBN,
  no internal data fetching, and no book-metadata lookup happening inside it.

- Approach: Move the function out of `app/contentGenerator.js` into `lib/generator.ts`, dropping
  the `ISBN` parameter and the internal `await fetchBookMetadata(isbn)` call it currently makes.
  The caller becomes responsible for resolving `title`/`author`/`genre` before calling
  `generateContent()`, via a separate ISBN → `{ title, author, genre }` lookup function —
  deliberately out of scope for this task, pending a team decision on whether that lookup reads
  from Supabase or Open Library.
  Real alternative considered: keep `bookMetadata` in the return but have the caller pass it in,
  instead of flattening to bare fields. Rejected — downstream consumers (e.g. `app/page.tsx`)
  would still have to unwrap a nested, possibly-null object just to read a title; flat fields are
  simpler at the call site.

- Inputs/Outputs:
  - **Current** (canonical, `apps/product-d/app/contentGenerator.js`): `export function
    generateContent(book: { book_title, author_name?, ISBN?, event_title?, 'Author Events'?,
    event_description? })` → `{ instagramCaption, newsletterBlurb, staffPickCard: { title, note,
    badge }, eventDataIncomplete }`. Synchronous, no `Promise`. `book.ISBN` is read into a local
    variable but never used for anything — no lookup, no fetch, nothing in this repo's version of
    the function resolves ISBN to book metadata. There is no `bookMetadata` field in the return;
    it was never added here.

    This session's Open Library integration (ISBN lookup, `fetchBookMetadata`, async wiring,
    `bookMetadata` in the return) exists only in the standalone repo
    (`dominicarlequin-design/marketing-content-generator`) and has not reached `apps/product-d/`
    — see `SESSION_STATE.md` and this product's `CLAUDE.md` > Open items for the `order_status`
    conflict this also intersects with.
  - **Proposed**: `generateContent({ title, author, genre, event_title?, event_date? })` →
    `{ instagramCaption, newsletterBlurb, staffPickCard, ... }` — no `ISBN`, no `bookMetadata`, no
    internal fetch. Field names are intentionally renamed off the shared schema's
    `book_title`/`author_name`/`Author Events` — mapping schema-shaped fields onto this input is
    the future lookup function's job, not this one's. `event_description` (a real shared-schema
    column) is dropped from the input entirely — confirmed intentional per this task's brief, not
    an oversight; see Open Questions for its effect on `eventDataIncomplete`. `genre` is not a
    shared-schema column at all; it's Product D's own derived field from
    `fetchBookMetadata`'s subject-keyword mapping. Exact full return shape — see Open Questions.

- Verification:
  - `npm test` passes against an updated test suite (moved alongside the function) covering:
    missing/empty `title` still throws a clear error; `event_title` present with `event_date`
    missing/empty/whitespace-only still yields "incomplete" event handling (carrying forward the
    whitespace-trim fix already shipped this cycle); `genre` is accepted and threaded through
    without error regardless of value.
  - `npx tsc --noEmit` passes (file becomes `.ts`).
  - `grep -rn "fetchBookMetadata\|ISBN\|bookMetadata" lib/generator.ts` returns nothing —
    confirms the function is genuinely decoupled from the lookup.
  - Manual: `app/page.tsx`, updated to call the new signature, still renders and generates all
    three cards without a runtime error.

- Files (max 5):
  1. `lib/generator.ts` — new, moved + refactored from `app/contentGenerator.js`
  2. `app/contentGenerator.js` — removed (superseded by the move)
  3. `app/contentGenerator.test.js` — moved/updated alongside (e.g. `lib/generator.test.ts`)
  4. `app/page.tsx` — caller; must build the new flat input and decide what happens to the ISBN
     form field until the lookup function exists (see Open Questions)

- Edge Cases:
  - `title` missing/empty → throws explicitly (mirrors today's `book_title is required`, renamed
    to match the new field name).
  - `author` missing → defaults to empty string, same as today's `author_name`.
  - `event_title` present, `event_date` missing/empty/whitespace-only → event section omitted,
    `eventDataIncomplete` true (carries forward this session's whitespace-trim fix).
  - `event_title` missing, `event_date` present → inherited from current behavior: event section
    is silently omitted (no error), since the existing guard keys off `event_title`, not
    `event_date`. Not a new problem introduced by this task — flagged here for visibility only.

- Open Questions:
  1. Does `eventDataIncomplete` stay in the return, computed from just `event_title` +
     `event_date`, or does it get dropped along with `event_description`? ("3 cards out" was
     explicit in the brief; whether a 4th non-card flag survives alongside them wasn't.)
  2. `genre` has no default/validation rule yet. If it's missing or empty, does `generateContent()`
     default it (e.g. to `"general"`, matching `fetchBookMetadata`'s own bucket default), or is it
     required and always guaranteed non-empty by the caller?
  3. `apps/product-d/` in this monorepo is still on the pre-ISBN-lookup version of
     `contentGenerator.js` as of the 2026-08-20 bootstrap (per `SESSION_STATE.md`) — this refactor
     is scoped against Dominic's standalone working repo
     (`dominicarlequin-design/marketing-content-generator`), which has since diverged with the
     `fetchBookMetadata`/`lib/` work built this cycle. Does this refactor happen there and get
     synced into `apps/product-d/` afterward, or does `apps/product-d/` need syncing first?
  4. `app/page.tsx` currently has an ISBN input field wired to the old signature. Once
     `generateContent()` no longer accepts ISBN, does that field get hidden/removed from the form
     until the lookup function ships, or left in place but visually disconnected?

- Tipping Point: If the upstream `ISBN → { title, author, genre }` lookup grows beyond a single
  call (e.g. needs to merge Open Library, the local catalog, and Supabase, with caching/retry
  logic), it should get its own `SPEC.md` rather than riding in as a follow-up to this one.
