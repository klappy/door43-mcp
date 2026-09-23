# TICKET — door43-mcp-v2-3-recipe-run

**What this is:** Cook v2.5 — `execute({recipe, args})` runs a filled plan as the user: ≤ 5 straight-line steps, one envelope per step in `body.steps[]`, one summed `cost`, a failed step returns the remainder as a pre-formed `continue`; one telemetry row per step plus one `recipe_run` row.
**Why now:** DELTA seed 3, accepted bounded; the first v2 dish that touches Workers CPU/subrequest budget against real DCS latency (195–700 ms per call observed 2026-09-03).
**Your move:** Nothing until it plates; then read the observed step-timing line in the PR.

Class: entrée. Risk: STANDARD.
Station: subagent. Owner: Otto. Promise: 4 h (R6).
Depends: `2026-09-03-door43-mcp-v2-2-pins-recipe-args` (filled plans). Meal: door43-mcp-v2.

Ingredients (fetch live):
- `docs/SPEC.md` §v2 `execute` "Recipe run"; `docs/PLAN.md` row v2.5; `docs/TENSIONS.md` T14 (bounds) and T13 (no server state); DELTA §Challenge retraction condition for the bound of 5.
- `src/tools/execute.ts` `runExecute` (reuse per step; do not fork it); `src/cap.ts` (`continue` token — extend the sealed/opaque token to carry `{recipe,args,from}`); `src/telemetry/index.ts` (`event_type` gains `recipe_run`, `TELEMETRY_COLUMNS` unchanged).
- Observe first, record in the PR: wall clock of a 3-step recipe against `git.door43.org`; if any run exceeds the Workers budget, the bound drops to 3 (ticket amended before code, HYGIENE 12).
- Law: `klappy://canon/principles/async-by-default-for-long-running-tools` (P0005) — a recipe that would need a job id does not ship; convention §7 (`truncated:true` always ships `continue`).
- Prior art (gate 11): oddkit's per-envelope `debug.trace.spans[]` (per-step accounting shape); AMS `next_after` (the counter-case: raw cursor, not a pre-formed call).

Declared product (on `klappy/door43-mcp`, one draft PR):
1. `src/tools/execute.ts` — recipe run path; bounds enforced at recipe definition (a 6-step recipe fails the suite) and at run (200 KB total after projection).
2. `src/cap.ts` — `continue` for a run: `{recipe, args, from:<k>}`, opaque.
3. `src/telemetry/index.ts` — `recipe_run` row; `path_family: other`.
4. `test/` — PLAN v2.5 done-means: 3 steps → 3 envelopes, cost = Σ; forced 404 at step 2 → `steps.length 2`, `truncated:true`, `continue` from 2, replay runs 2–3 only; row counts.
5. `docs/PLAN.md` row filled with the observed timing line; SPEC recut where diverged; T14 updated.

Done-means:
- An agent can run a 3-step recipe and observe `body.steps.length 3` and `cost.bytes` equal to the sum of the steps.
- An agent can observe a failed step 2 return `steps.length 2`, `truncated:true`, and a `continue` that, replayed, runs steps 2–3 only.
- An agent can query `telemetry` and observe 3 `tool_call` rows and 1 `recipe_run` row for the run.
- A reader can add a 6-step recipe and observe the test suite fail at definition.
- The captain can read the PR and observe the wall-clock line for the 3-step run against live DCS.
- A reader can grep the diff and observe no session or run state written to Durable Object storage.

## Failure Modes — What Breaks When a Run Becomes a Job
- A run needs more than the Workers budget.
- Step results held server-side between calls.
- A recipe ending in a different tool's call passed off as a step.

## Required Response When Detected
- Budget → drop the bound to 3 in the ticket first (HYGIENE 12), then code; never a job id.
- State → reject; `continue` carries the remainder.
- Cross-tool step → it is a hand-off (`body.handoff`, v2.6), not a step.
