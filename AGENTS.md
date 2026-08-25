# Instructions for AI coding agents working in this repo

Written 2026-08-24. If you're an AI assistant helping someone on this team, read this file and
`TEAM_PLAN.md` (same folder) before making any changes. `TEAM_PLAN.md` explains the reasoning;
this file is the checklist. Also read root `CLAUDE.md` — it's the standing rules for this repo
and takes precedence over anything here if they ever conflict.

This file is named `AGENTS.md` on purpose, not `CLAUDE.md` — the team isn't standardized on one
AI tool. Philip, Jeffrey, and Dominic are using Claude; Priscilla's tooling isn't settled yet, and
nothing here should assume a specific product or paid tier. Whatever you are, follow this file.

**Before doing anything else: run `git fetch origin` and `git log --oneline origin/main -10`.**
This repo moves fast — state described below was accurate as of 2026-08-24 evening, and may
already be stale by the time you read it. If what you find on `main` doesn't match this file,
trust `main`, not this file, and tell the person you're working with about the mismatch rather
than silently proceeding on outdated assumptions.

**Specifically check for PR #5 and PR #13** (the PR that added this file and `TEAM_PLAN.md`) in
that log. Both needed a human approval as of this writing. If either isn't merged into `main` yet,
stop and tell your human rather than proceeding — the rest of this plan, and the fact that you're
even able to read this file from a local pull, assumes both already landed. Approving or merging
a PR is a human decision; don't do it yourself even if you technically could.

## Do not touch these files without checking first

| File(s) | Rule |
|---|---|
| `SPEC.md` | Holds exactly one active spec at a time, by design. Check its current contents before writing to it. If it already contains an active spec that isn't yours, **do not overwrite it** — tell your user there's a conflict and wait for direction. |
| `DECISIONS.md`, `docs/schema/riverside-books-schema.md` | Multiple people may have open, unmerged PRs touching these at once. Before opening a PR that edits either, run `git pull origin main` first and check `gh pr list` for other open PRs touching the same files. |
| `README.md` | Check which section you're editing — the product table (top) vs. in-flight-work notes (bottom) are separate concerns; don't rewrite both in one PR unless asked. |
| `apps/product-d/` | As of this writing, PR #4 is broken (based on a stale, pre-monorepo repo state) and unmerged. Do not build new work on top of that branch. Start from current `main` instead. |

## The standing workflow (same for every task)

1. `git checkout main && git pull`
2. `git checkout -b <your-name>/<short-description>`
3. If the task is INVARIANT-lane (a wrong answer would be silent — a calculation, a join, a
   security check, a schema change): write a short spec first (see root `CLAUDE.md`'s spec
   format), get a human nod, *then* write code. Don't skip straight to implementation.
4. Commit with Conventional Commits, one concern per commit.
5. Push, open a PR into `main` with `gh pr create`.
6. Wait for 1 approval from a teammate other than the PR's author — this is enforced by GitHub
   branch protection, not just a norm. Do not attempt to push directly to `main`; it will be
   rejected.
7. If a review comes back asking for changes twice in a row on the same point, stop and get your
   human's input rather than guessing a third time.

## Never do these things

- Never commit secrets, API keys, or `.env*` files. Check `.gitignore` covers them before your
  first commit in a new location — don't assume it's already handled.
- Never invent a shared column, join key, or business rule (e.g. a loyalty-points earn rate, a
  price, a status enum value) that isn't already in `docs/schema/riverside-books-schema.md` or
  explicitly given to you. If you need one that doesn't exist, stop and ask — this is the single
  most load-bearing rule in this repo, since a wrong guess here breaks three other people's
  builds, not just the one you're working on.
- Never treat your own output, or another agent's, as verified just because it compiles or looks
  plausible. Actually run it — build, tests, or a real browser check — before calling it done.
- Never force-push, delete a branch, or rewrite history on `main` or a shared branch without your
  human explicitly asking for that specific action.

## Current state snapshot (2026-08-24 evening — verify against `main` before trusting this)

- Merged to `main`: PR #1 (workflow docs), #6 (Product B scaffold), #12 (gitignore chore).
- Approved, not yet merged: PR #10 (Product A — catalog, cart, auth, order placement; has two
  known follow-ups: no Row Level Security yet, and order price isn't recorded per line item).
- Closed, superseded: #8, #9, #11 (earlier checkpoints of the same work now in #10).
- Closed, needs redoing later: #2 (conflicted with #10 over `SPEC.md`; Dominic re-opens after
  #10's spec is archived).
- Still open, unresolved: #5 (price column — needs a real approval), #7 (a "formatting fix" that
  actually removes correct hyphens — needs fixing before approval), #3 (Google Books plan — not
  ready, needs reconciling with Product A's already-built live lookup), #4 (broken, needs a full
  rebase from Dominic).
- Known data-quality issue: 3 ISBNs in `docs/schema/riverside-books-integration-chaos-test.csv`
  fail ISBN-13 checksum validation (found by Jeffrey while building Product A's live cover
  lookup). Don't be surprised if a lookup against one of these returns nothing or an error — this
  is a known, pre-existing issue with the sample data, not a bug in your code.

For the full reasoning behind all of this, read `TEAM_PLAN.md`.
