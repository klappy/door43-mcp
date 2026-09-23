# DEBRIEF — door43-mcp-v1-validation-gate4 (at the pass)

Cooked 2026-09-03T04:36Z–04:39Z (2026-09-03 ~00:40 ET), Otto seat, ~4 min wall
clock (promise 3 h). Cargo on `klappy/door43-mcp`:

- **Draft PR #11** — https://github.com/klappy/door43-mcp/pull/11 — not merged; captain reads.
- Branch `otto/v1-validation-gate4` @ `5136f8f`. Base main `acb19aa` (0.3.2 — ticket said
  0.3.1-or-later; #10 had landed).

## Fresh-seat declaration (ticket failure mode 1)
Gates 0–3 were cooked in other doors. This door cooked #8 (callback 302) and #10 (version
source) on the same repo. Neither is a gate-0–3 artifact, but both touched files the
validation exercised (`dcs-auth.ts` root page, `version.ts`). Named in the validation file's
header. If the captain reads that as same-seat, the required response is a second fresh pass —
the validation file stands as evidence either way.

## Declared product → observed
1. `docs/validation/2026-09-03-v1.md` — 11 rows; 10 observed, #7 not observed (uW ops); 7 findings with disposition.
2. `README.md` — one status line recut; no version string typed (HYGIENE 19); links the validation.
3. `docs/DEPLOY.md` — `wrangler.jsonc`; three fork-must-create bindings named (F5); HUMAN-ONLY step kept; uW rehearsal gap kept.
4. `docs/PLAN.md` row 4 — half-cooked row appended; rehearsal half open.
5. `docs/TENSIONS.md` — T18, T19.
`git diff --name-only main` → 5 files, zero `src/`.

## Done-means
- PRD 1–11 each marked with the call ✅ · README live/three tools/no version ✅ · DEPLOY files
  all exist (`src/telemetry/schema.sql` observed) ✅ · no `src/` ✅ · DELTA pinches confirmed ✅ ·
  v2.1 can cite rows 4 and 8 ✅ — **all observed in harness; PR merge is the captain's read.**

## Seat notes
- Item 10 cost ~71k tokens of context for one call (two 200 KB slices). T19 names it. A
  cheaper proof exists (any body >200 KB with a tiny `fields`) — next validator should pick one.
- DELETE FROM telemetry was the refused statement: server said "nothing was run"; row counts
  before/after unchanged in the same window (21).
- Validation not merged by this seat — same seat as the cook (HYGIENE 3).

## Plated 2026-09-03T05:03Z
PR #11 merged `85e0a33` (captain read; auto-merge armed by Otto 04:56Z; Bugbot success). Acceptance 7 (uW rehearsal) stays open on PLAN row 4.
