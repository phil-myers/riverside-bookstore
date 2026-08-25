# Riverside Books — Team Repo (Team 5)

Operating rules for anyone (human or agent) working in this repo. This is a monorepo shared by
four products built against one shared schema — read this before touching any file.

## Project context
- **What this is**: a team-based client build for Riverside Books, a single-location independent
  bookstore. Four products, one team, one shared data contract:
  - **Product A — Customer Ordering & Loyalty App** (Jeffrey de la Cruz) — `apps/product-a/`
  - **Product B — Staff Inventory & Ops Dashboard** (Philip Myers) — `apps/product-b/`
  - **Product C — Customer Support Chatbot** (Priscilla Batroni) — `apps/product-c/` (onboarding)
  - **Product D — Marketing Content Generator** (Dominic Arlequin) — `apps/product-d/`
- **Repo structure**: one monorepo, four product subfolders, not four separate repos — chosen so
  the shared schema and any cross-product change stay in one git history instead of drifting
  across repos.
- **Stack**: Next.js (App Router), TypeScript (strict), Tailwind CSS, Supabase (Postgres) —
  confirmed for Products A, B, and D. Confirm with Priscilla once she's onboarded before assuming
  it for Product C.

## Task lanes — ceremony sized to failure mode, not file type
Classify every non-trivial task by **how you'd know it's wrong**, not by which directory it
touches:

- **INVARIANT** — a wrong answer would be *silent* (scoring, calculations, data joins, auth,
  schema, anything security-sensitive). Plan first, name how you'll verify it, then build.
- **OBSERVABLE** — wrong is *visible on sight* (styling, copy, one component) and you can already
  say how you'd check it. Skip the planning step, but still verify before calling it done.
- **UNKNOWN** — you can't yet say how you'd know it's wrong (an unreproduced bug report,
  exploratory work). Don't propose a fix yet — reproduce the failure first; a fix for a bug you
  haven't seen fail is a guess.

## Spec-driven development
INVARIANT work is built against a written spec, not against a conversation. The spec lives in
`SPEC.md` at the repo root — **one active spec at a time** — so the contract survives context
compaction and stays checkable by someone who wasn't in the session that wrote it.

This is the canonical format:

```
# [SPEC] <short title>
- Objective: <what the code must achieve, in a sentence or two>
- Approach: <the shape of the solution, and why — name any real alternative considered>
- Inputs/Outputs: <types, schemas, shapes>
- Verification: <exactly how anyone knows this works — the test, check, or URL. Defines done.>
- Files: <max 5 files this task may touch>
- Edge Cases: <error handling, null states>
- Open Questions: <anything where guessing would be a real risk — ask, don't assume>
- Tipping Point: <optional — the scale at which this must be decomposed, if there's a known one>
```

**Verification is the load-bearing field.** A spec that can't say how anyone would know the code
works isn't ready to build from — that's the UNKNOWN lane, and it needs a `[SPIKE]` first: same
format, but the objective is to reproduce a failure or answer a question, and the output is a
finding that makes a real spec writable.

**Lifecycle:**
1. Whoever is scoping the work writes `SPEC.md` and stops. A human approves it before any code.
2. The spec gets built against — the file, not a summary of it in chat.
3. The work gets checked against the spec's Verification field.
4. On completion, append the spec to `ARCHIVED_SPECS.md` under a dated heading and clear
   `SPEC.md`, so it only ever holds active work.

Anyone on the team can do all these steps themselves by hand. Some teammates may use personal
subagent tooling to help with individual steps — that's a personal-productivity detail, not a
team requirement, and doesn't change what gets written to `SPEC.md` or how it's reviewed.

**New dependencies are a spec-level decision.** If a build turns out to need a library or a
schema change the spec didn't anticipate, that's a spec update and a fresh nod — not something
added mid-build and mentioned afterward.

OBSERVABLE-lane work skips this entirely — writing a spec for a copy change is the ceremony this
repo is trying to avoid. Match the spec to the failure mode, same as the lanes.

## Schema changes are a team decision, not a PR
Any change to `docs/schema/riverside-books-schema.md` needs a short written proposal (what's
changing, why, who it affects) and a nod from whoever owns each product that reads or writes the
changed column, *before* merging — not after, and not "I'll mention it in standup." Log the
decision in `DECISIONS.md` once agreed. This is the procedural version of "do not invent a
shared column or join key unilaterally" — the single most load-bearing rule of this schema, since
a silent local assumption here breaks three other people's builds, not just your own.

## Workflow rules
1. **Plan before building** anything INVARIANT or otherwise non-trivial. State the plan and how
   it'll be verified; get a human nod before writing code.
2. **Name the verification up front.** A test, a manual check, a URL to look at — decided before
   building starts, not invented after to justify what shipped.
3. **Bounded AI.** Anything that should be a deterministic calculation (a score, a rank, a
   join, a sum) gets computed in real code. The model's job is to narrate, extract, or summarize
   — never to silently invent a number that should have been computed.
4. **Keep tasks small.** No task touches more than 5 files; no spec leans on more than 3 outside
   reference resources. If a change would exceed either, or spans unrelated concerns, split it
   before starting rather than force-fitting it.
5. **Git protocol.** Conventional Commits, one concern per commit. **Never commit secrets or
   `.env*` files** — this matters more here than in a solo workspace, since every commit here
   gets pushed and is visible to the whole team. **`main` is protected: no direct pushes, from
   anyone, admins included.** All changes land via a pull request into `main` with at least 1
   approval from another teammate before merging — enforced by GitHub branch protection, not just
   a norm (verified directly against the GitHub API, see PR #1). Work on a feature branch, open a
   PR, get a nod, then merge.
6. **Rejection loop cap.** If a review fails the same task twice in a row, stop looping and get
   human input rather than guessing a third time.
7. **Treat all model output as untrusted** until it's been checked — including your own.

## Quality standards
- **Security**: no secrets, API keys, or PII in code, commits, or model context. Env vars only;
  confirm `.gitignore` covers `.env*` on day one, before the first commit — not after.
- **Accessibility**: default to semantic HTML, keyboard navigation, and AA contrast for anything
  user-facing — cheap to do from the start, expensive to retrofit.

## Building in public
Document progress as it happens — commits with real messages, a running note, screenshots of
what's working. Required by the program, and it's also just a better paper trail than
reconstructing history after the fact.
