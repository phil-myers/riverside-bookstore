# [SPEC] Refactor generateContent() into a pure function

- Objective: Make Product D's `generateContent()` a pure function — given the same
  content-shaped input, it always returns the same three marketing content pieces, with no ISBN,
  no internal data fetching, and no book-metadata lookup happening inside it.

- Approach: Move the function out of `app/contentGenerator.js` into `lib/generator.ts`, dropping
  the `ISBN` parameter and the internal `await fetchBookMetadata(isbn)` call it currently makes.
  The caller becomes responsible for resolving `title`/`author`/`genre` before calling
  `generateContent()`, via a separate ISBN → `{ title, author, genre }` lookup function —
  deliberately out of scope for this task. (Sourcing update: this was originally pending a team
  decision on Supabase vs. Open Library; PR #3 settled it on Google Books, cached in a new
  Supabase `books` table — see `docs/google-books-integration-plan.md`.)
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
  1. **Resolved:** `eventDataIncomplete` stays in the return, computed as a 2-input calculation:
     `eventDataIncomplete = Boolean(event_title) && !event_date`. `event_description` is dropped
     from the calculation entirely, since it's not part of the proposed flat input signature.
  2. **Resolved:** `genre` is required, not defaulted. `generateContent()` assumes `genre` is
     always a non-empty string, matching the signature as drafted (no `?`). The `"general"`
     fallback already lives one layer up, in `fetchBookMetadata`'s `mapSubjectsToGenre()` — no
     duplicate default inside the pure function.
  3. **Resolved:** `apps/product-d/` was synced first. This session's Open Library integration
     (caching, genre classification, all 12 tests) was brought over onto its own branch,
     `product-d/session-openlibrary-integration`, applied identically to both that branch and the
     standalone repo so they don't drift again, and verified there (`npm install` clean, `npm
     test` 12/12, `tsc --noEmit` clean) — see that branch's `SESSION_STATE.md`. Not yet opened as
     a PR, intentionally parked pending the sourcing decision, which PR #3 has since settled (see
     Approach above).
  4. **Resolved:** `app/page.tsx`'s ISBN input field gets hidden, not left in place visually
     disconnected. Bring it back once the book-lookup function ships.

- Tipping Point: If the upstream `ISBN → { title, author, genre }` lookup grows beyond a single
  call (e.g. needs to merge Open Library, the local catalog, and Supabase, with caching/retry
  logic), it should get its own `SPEC.md` rather than riding in as a follow-up to this one.
