# TICKET — door43-mcp-gate1-execute

**What this is:** Gates 1a+1b of `klappy/door43-mcp` — the `execute` tool: one
verb that forwards a logged-in user's GET/HEAD to `git.door43.org/api/v1`, wraps
every answer in the resume-point envelope, and projects with `fields`. After this
plate the server does something a user can use.
**Why now:** Gate 0 proved 2026-09-03T01:47Z (`docs/PLAN.md` row 0, main
`8c3d813`): DCS OAuth tokens authorize `/api/v1` with `Authorization: token`. The
STOP condition is cleared; nothing else on the plan can move before `execute`.
**Your move:** Nothing until it plates. Then one MCP call in your own client:
`execute({method:"GET", path:"/user"})` and read your login in the envelope.

Class: entrée. Risk: STANDARD (reads only; no secrets touched; no law).
Station: subagent (fresh Otto seat, shim `docs/shims/` — see Ingredients).
Owner: Otto. Promise: 4 h wall clock across attempts (R6).
Depends: none (gate 0 plated 2026-09-02, `rail/4-plated/2026-09-02-door43-mcp-gate0`).
Meal: door43-mcp.

Ingredients (fetch live, do not paste):
- `klappy/door43-mcp` main `8c3d813` — `AGENTS.md`, `docs/SPEC.md` (§execute,
  §response envelope, §fields projection, §caps, §teaching errors, §Auth flow
  refresh-on-401), `docs/PRD.md` acceptance 2, 3, 5, 9, 10, 11, `docs/PLAN.md`
  rows 1a/1b, `docs/TENSIONS.md` T2 (execute breadth vs authz parity), T6
  (`fields` is projection, never semantics).
- `klappy/kitchen` `health-code/mcp-server-build-convention.md` §2 (three tools
  table), §3 (reads before writes), §7 (envelope), §9 (projection not semantics),
  §10 (deploy is push).
- `klappy://canon/constraints/mcp-tool-surface-ceiling` (ratified) — `docs()`
  boarding pass must cite it; `execute` is the one verb.
- `klappy://canon/constraints/infra-config-is-seat-work` (ratified) — no
  HUMAN-ONLY tag without a class name; deploy is push.
- Upstream: `https://git.door43.org/swagger.v1.json` (323 paths; 173 `/repos/*`,
  11 `/catalog/*`; page 100 default / 500 max) — observed 2026-09-02.
- House prior art (gate 11): `klappy/cartographer` `execute` capability
  (`capability` + `payload` shape, `docs { capability }` schema fetch) and
  `klappy/oddkit` disclosure-contract envelope (`uri+title` floor, flags,
  caps). Envelope field names come from door43 SPEC §7, not from either — the
  divergence is deliberate: door43 returns upstream HTTP semantics (`status`,
  `upstream`, `cost.upstream_ms`) that neither house server has.
- Live Worker: `door43-mcp` on `door43.klappy.dev`, main-trigger deploy by push;
  branch trigger `versions upload` (no preview URL for DO-bound Workers — T9).
  Prove on main after merge, same as gate 0.

Declared product (on `klappy/door43-mcp`, one PR per gate, both may be one branch):
1. `src/tools/execute.ts` — `execute({method, path, query?, fields?, headers?})`;
   GET/HEAD only; anything else → envelope `status:405`, hint "v2 gates writes".
2. `src/envelope.ts` — every tool answer is
   `{observed_at, upstream:{host,version}, request:{method,path,query}, status,
   body, truncated, next, continue, hints[], cost:{bytes,tokens_est,upstream_ms}}`
   per SPEC §7. `next` carries the upstream `Link: rel=next` page when present;
   `continue` is the opaque token to re-enter a truncated body.
3. `src/projection.ts` — `fields` as deterministic JSON-path selection over
   `body`; no renames, no computed values, no defaults (T6). 200 KB body cap
   applied after projection; `truncated:true` + `continue` when cut.
4. Refresh-on-401: one silent refresh via the provider, one retry; second 401 →
   envelope `status:401`, hint "re-login". Never a PAT path.
5. Teaching errors: 404 → `hints[]` lists the nearest three swagger paths by
   prefix; 405 → v2 hint; 4xx from DCS passed through with DCS's message in
   `body`.
6. `docs/PLAN.md` rows 1a and 1b filled with observed values; `package.json`
   `0.2.0`; `docs/TENSIONS.md` T2 status updated with what was observed.
7. `test/execute.test.ts` — envelope shape, 405 on POST, `fields` determinism
   (same input → same output), cap + `continue` round-trip. Runs in CI on push.

Done-means:
- A logged-in MCP client can call `execute({method:"GET", path:"/user"})` and
  observe its own login inside `body.login` with `status:200`.
- A client can call `execute` with `path:"/catalog/search"` and `query:
  {q:"ult", limit:2}` and observe two entries, `next` populated, and
  `cost.upstream_ms` non-zero.
- A client can call `execute` with `fields:["data[].name","data[].owner.login"]`
  and observe a body containing only those keys, byte-identical on a second call.
- A client can call `execute` with `method:"POST"` and observe `status:405` and a
  hint naming v2, with no request sent upstream (test asserts no fetch).
- A client with an expired access token can call `execute` and observe a `200`
  after one silent refresh, visible only as `hints[]` containing "refreshed".
- A client can call `execute` with a misspelled path and observe `status:404`
  plus three real swagger paths in `hints[]`.
- The captain can open `docs/PLAN.md` on main and read rows 1a/1b with observed
  status, byte counts, and the commit each landed in.

## Failure Modes — What Breaks When Execute Is Wider Than the Ceiling
- `fields` grows a rename, a default, or a computed value → projection has
  become semantics (T6) and every consumer now depends on door43's opinion.
- A write verb slips through under a GET wrapper (e.g. `path` with `?action=`).
- Envelope fields drift from SPEC §7 (a renamed key, an omitted `cost`).
- Refresh loops or falls back to a stored PAT.
- Seat describes deploy as `wrangler deploy` or tags any step HUMAN-ONLY without
  a class (eighth recurrence).

## Required Response When Detected
- Projection semantics → strip to selection only; add the case to the
  determinism test; note in T6.
- Write leak → allowlist method+path at the edge; test asserts upstream never
  sees it; T2 amended.
- Envelope drift → SPEC §7 wins; code changes, not the spec; test pins the keys.
- Refresh loop / PAT → stop; envelope `401`; open a tension; no PAT ever.
- Deploy/HUMAN-ONLY misframe → return the PR body unread with the URI
  `klappy://canon/constraints/infra-config-is-seat-work`.
