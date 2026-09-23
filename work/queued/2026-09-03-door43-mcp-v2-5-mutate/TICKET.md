# TICKET — door43-mcp-v2-5-mutate

**What this is:** Cook v2.8 — the fourth tool `mutate` (`POST/PUT/PATCH/DELETE` as the user, `destructiveHint:true`, registered only under scope `dcs:write`), with the server floor: an **observed** `refused[]` list of irreversible DCS operations → 403 HUMAN-ONLY, and an off-by-default sealed `confirm` belt.
**Why now:** Captain ruling 2026-09-03 ~00:15 ET on PR #9 (T17): consent is per tool, so writes leave `execute`. First fourth-tool exception in the house; the ceiling's written reason is SPEC §`mutate`.
**Your move:** Nothing until it plates — `VERDICT.md` beside this ticket is your ruling (2026-09-03 ~01:25 ET, pick 1: six REFUSE rows; every refusal carries a pre-formed GitHub-issue link; `REFUSED_ALLOW` per-deployment operator override). Read the PR when it opens.

Class: entrée. Risk: ALLERGY (irreversible upstream actions; first ceiling exception).
Station: subagent. Owner: Otto. Promise: 4 h (R6).
Depends: `2026-09-03-door43-mcp-v2-4-handoff-consumer` (last read-side dish; PLAN order). VERDICT present. Meal: door43-mcp-v2.

Ingredients (fetch live):
- `docs/SPEC.md` §`mutate` (the written reason, the floor, the belt); `docs/PLAN.md` row v2.8; `docs/TENSIONS.md` T17 (ruled) and T2 (authz stays DCS's).
- **Observe first (blocker named in the meal):** whether `@cloudflare/workers-oauth-provider` + `McpAgent.init` can see the grant's scopes so `mutate` registers only under `dcs:write` (`scopesSupported` in `src/index.ts`; props in `src/types.ts`). If not: always register, refuse with 403 without the scope — say so in the PR and in SPEC.
- The swagger's write operations, live (POST/PUT/PATCH/DELETE across 323 paths): the seat lists candidates for `refused[]` (repo delete/transfer, force pushes, org/user deletion, anything the DCS UI cannot undo) in the PR as a checklist for the captain; nothing is refused or allowed from memory.
- `src/seal.ts` (the belt), `src/tools/execute.ts` (envelope reuse; `execute POST` keeps answering 405, now naming `mutate`), `src/descriptions.ts` (fourth line, ≤ 80 chars), `src/mcp.ts` annotations.
- Law: `klappy://canon/constraints/mcp-tool-surface-ceiling` (§WHAT 2, VERIFICATION: `docs()` cites the reason); convention §2 §3; MCP tool annotations (`readOnlyHint`, `destructiveHint`) — verify the spec version the `agents` package implements at cook.
- Prior art (gate 11): gitauth `github_token` (write scope explicit, read by default — the same posture); `klappy://docs/planning/E0005_2-session-4-notes` (why not confirm-everything).

Declared product (on `klappy/door43-mcp`, one draft PR — DRAFT until VERDICT):
1. `src/tools/mutate.ts` (new), `src/mcp.ts` registration + annotations + scope gate, `src/index.ts` `scopesSupported` + consent screen text for `dcs:write`.
2. `src/refused.ts` — generated from `VERDICT.md` (six REFUSE rows; CONFIRM rows for the belt), test-pinned; every 403 carries the pre-formed issue link and the DCS UI path in `hints[]`; `REFUSED_ALLOW` (Worker var) opens a row per deployment, logged as `override: 1` (telemetry column added to `TELEMETRY_COLUMNS`, policy recut).
3. `src/seal.ts` reuse — `confirm` belt behind `CONFIRM_REQUIRED` (Worker var, default off).
4. `src/descriptions.ts` — `mutate` line; `docs()` pass cites SPEC §`mutate` as the fourth tool's reason.
5. `test/` — PLAN v2.8 done-means; `tools/list` 3 vs 4 by scope; 403 with 0 fetches; belt on/off; telemetry row has `path_family` only.
6. `docs/PLAN.md` row filled; `docs/SPEC.md` recut where diverged; `docs/SECURITY.md` gains the write posture; `docs/PRD.md` v2 parked line resolved.
7. `VERDICT.md` beside this ticket — captain's `refused[]` ruling, verbatim.

Done-means:
- A user with a `dcs:read` grant can list tools and observe 3; with `dcs:write`, 4 — or, if scope-gating is impossible, the PR and SPEC say so and 403 without scope is observed.
- An agent can call `mutate POST /repos/{o}/{r}/issues` and observe one upstream POST (test asserts one fetch) and a 201 envelope.
- An agent can call `mutate DELETE /repos/{o}/{r}` and observe `403`, 0 fetches, and `hints[]` carrying a filled `issues/new?title=mutate:+DELETE+/repos/…` link plus the DCS UI path.
- An operator can set `REFUSED_ALLOW="DELETE /repos/{owner}/{repo}"` on their deployment and observe the same call reach DCS once, with `override 1` on its telemetry row; unset, the row stays refused.
- A reader can diff `src/refused.ts` against `VERDICT.md` and observe the six REFUSE rows match exactly.
- An operator can set `CONFIRM_REQUIRED=true` and observe `428` + a pre-formed `confirm` call on a branch delete, one fetch on replay, `400` on a tampered seal.
- An agent can call `docs()` and observe the fourth tool's reason cited; `execute POST` still answers 405 naming `mutate`.
- A reader can query `telemetry` for a `mutate` row and observe `path_family` and no path or body.

## Failure Modes — What Breaks When the Floor Is Typed From Memory
- `refused[]` written from recollection of Gitea, not from the swagger.
- `mutate` registered without a written reason in `docs()`.
- A fifth tool appears ("destroy", "confirm").
- Seal stored server-side to "make replay work".
- A per-call override parameter appears ("force", "i_am_sure").

## Required Response When Detected
- Memory → stop; `VERDICT.md` is the source; regenerate.
- No reason → `docs()` cites SPEC §`mutate`; test pins the citation.
- Fifth → ceiling; fold into `mutate` params or drop.
- Stored seal → remove; the seal is minted and verified, never kept.
- Per-call override → remove; `REFUSED_ALLOW` is operator-only, per deployment.
