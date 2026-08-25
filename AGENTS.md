# Instructions for AI coding agents working in this repo

Rewritten 2026-08-25 evening. If you're an AI assistant helping someone on this team, read this
file and `TEAM_PLAN.md` (same folder) before making any changes. `TEAM_PLAN.md` explains the
reasoning; this file is the checklist. Also read root `CLAUDE.md` — it's the standing rules for
this repo and takes precedence over anything here if they ever conflict.

This file is named `AGENTS.md` on purpose, not `CLAUDE.md` — the team isn't standardized on one
AI tool. Whatever you are, follow this file.

**Before doing anything else: run `git fetch origin` and `git log --oneline origin/main -10`, and
check `gh pr list --state all`.** This repo moves extremely fast — dozens of PRs can land in a
single day. Any snapshot of "current state" in this file or `TEAM_PLAN.md` is stale the moment
someone merges something. If what you find on `main` doesn't match either file, trust `main`, and
tell the person you're working with about the mismatch rather than silently proceeding on
outdated assumptions. Don't trust a PR number's position to indicate recency or ancestry either —
verify with `git merge-base`, not by comparing numbers or timestamps.

## Do not touch these files without checking first

| File(s) | Rule |
|---|---|
| `SPEC.md` | Holds exactly one active spec at a time, by design. Check its current contents before writing to it. If it already contains an active spec that isn't yours, **do not overwrite it** — tell your user there's a conflict and wait for direction. |
| `DECISIONS.md`, `docs/schema/riverside-books-schema.md` | Multiple people may have open, unmerged PRs touching these at once. Before opening a PR that edits either, run `git pull origin main` first and check `gh pr list` for other open PRs touching the same files. |
| `README.md` | Check which section you're editing — the product table (top) vs. in-flight-work notes (bottom) are separate concerns; don't rewrite both in one PR unless asked. |

## The standing workflow (same for every task)

1. `git checkout main && git pull`
2. `git checkout -b <your-name>/<short-description>`
3. If the task is INVARIANT-lane (a wrong answer would be silent — a calculation, a join, a
   security check, a schema change): write a short spec first (see root `CLAUDE.md`'s spec
   format), get a human nod, *then* write code. Don't skip straight to implementation.
4. Commit with Conventional Commits, one concern per commit.
5. Push, open a PR into `main` with `gh pr create`.
6. Wait for 1 approval from a teammate other than the PR's author — enforced by GitHub branch
   protection, not just a norm. **Exception:** Jeffrey and Philip may merge their own PRs without
   waiting for a second approval (see root `CLAUDE.md` > Git protocol) — a PR is still required
   either way, this only removes the approval wait for those two specific people. Do not attempt
   to push directly to `main` regardless of who you are; it will be rejected for everyone.
7. If a review comes back asking for changes twice in a row on the same point, stop and get your
   human's input rather than guessing a third time.

## Never do these things

- Never commit secrets, API keys, or `.env*` files. Check `.gitignore` covers them before your
  first commit in a new location — don't assume it's already handled. Note that a monorepo
  subfolder can have its own `.gitignore` that's stricter than the root one (this bit Product B
  today — its scaffold-generated `.gitignore` was missing the root's `!.env.example` exception).
- Never invent a shared column, join key, or business rule (e.g. a loyalty-points earn rate, a
  price, a status enum value) that isn't already in `docs/schema/riverside-books-schema.md` or
  explicitly given to you. If you need one that doesn't exist, stop and ask — this is the single
  most load-bearing rule in this repo, since a wrong guess here breaks three other people's
  builds, not just the one you're working on.
- Never treat your own output, or another agent's, as verified just because it compiles or looks
  plausible. Actually run it — build, tests, or a real browser check — before calling it done.
  Twice today, a genuine bug survived a passing build/lint/test cycle and was only caught by a
  second read of the actual diff: stale column names after a table rename, and an RLS policy that
  correctly scoped row access but didn't constrain which column values a client could write.
- Never force-push, delete a branch, or rewrite history on `main` or a shared branch without your
  human explicitly asking for that specific action.
- Never assume a Postgres `text` column with no DB-level constraint is safe to write anything to
  just because nothing stops you — check whether an RLS policy is scoping rows but not columns
  before assuming a table is fully locked down.

## Current state (2026-08-25 evening — verify against `main`, this drifts fast)

- All four products have real, working code merged to `main`. See `TEAM_PLAN.md` for what's
  actually still open.
- Row Level Security is live on `books`/`customers`/`orders`/`order_items`. All writes to
  `orders`/`order_items`/`customers` go through `SECURITY DEFINER` functions, not direct table
  access — don't add a new direct-write policy without understanding why that pattern was chosen
  (see `apps/product-a/supabase/migrations/0006_rls_and_order_security.sql` and `0008`).
- `order_status` is a 6-value enum: `preorder, pending, Shipped, ready_for_pickup, Completed,
  cancelled` — extended from the original 4 today, pending Jeffrey's confirmation since he wasn't
  part of that decision. See `DECISIONS.md`.
- The shared synthetic CSV (`docs/schema/riverside-books-integration-chaos-test.csv`) has two
  zones: a clean baseline and a deliberately dirty section for Product B's future ingestion
  testing. **Read `docs/schema/README.md` before touching this file** — it explains exactly which
  parts are bugs (fixable) and which are intentional test fixtures (never "clean" these).
- Deployment isn't blocked on code — see `docs/DEPLOYMENT.md`. The only real blocker is that no
  hosting account exists yet.

For the full reasoning behind all of this, read `TEAM_PLAN.md`.
