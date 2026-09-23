# TICKET — door43-mcp-v2-1-l2-truth-teach

**What this is:** Cook v2.1 + v2.2 from SPEC §v2 — `docs` L2 tells the whole truth cheaply (complete `response_keys`, compact by default, `fields` on docs), and `execute` teaches on 200 (typed `next`, `etag`/304, rate-limit tally, free hints).
**Why now:** Both pinches were hit live 2026-09-03T03:56Z (L2 = 5,731 B with keys cut at 12; `next` retyped `limit:3` as `"3"`); cheapest ergonomics in the meal (`docs/DELTA.md`).
**Your move:** Nothing until it plates; then one `docs({path:"/catalog/search"})` on your phone.

Class: entrée. Risk: STANDARD.
Station: subagent. Owner: Otto. Promise: 4 h (R6).
Depends: `2026-09-02-door43-mcp-v2-planning` (at 3-pass; **blocked** until door43-mcp PR #9 plates — the spec this dish cooks); `2026-09-03-door43-mcp-v1-validation-gate4` (baseline rows); `2026-09-03-door43-mcp-homepage-readme` (captain ruling 2026-09-03: README + homepage before v2.1). Meal: door43-mcp-v2.

Ingredients (fetch live):
- `klappy/door43-mcp` `docs/SPEC.md` §v2 `docs` and `execute` (typed `next`, `upstream.etag/ratelimit`, 304), `docs/PLAN.md` rows v2.1 and v2.2 (done-means are the tests), `docs/TENSIONS.md` T16.
- `src/tools/docs.ts` (`responseKeys` L120–132 elides at 12; `l2` L97–111), `src/tools/execute.ts` (`next` L127–131), `src/projection.ts` (reuse for `fields` on docs), `test/fixtures/swagger-slice.json` + the full live swagger (323 paths).
- Observe first: whether DCS sends `etag` and `x-ratelimit-*` on `/api/v1` responses — record in the PR; if absent, the fields stay `null` and the test says so.
- Law: convention §7 §8 §9; HYGIENE 19 (version read from the manifest; do not edit a `VERSION` constant — `2026-09-03-door43-mcp-version-single-source` owns that).
- Prior art (gate 11): oddkit retrieval-disclosure contract (`disclosure` flags + caps — the `detail:"compact"|"full"` shape); cartographer `docs { capability }` (schema on demand).

Declared product (on `klappy/door43-mcp`, one draft PR):
1. `src/tools/docs.ts` — complete `response_keys`; `detail` param; `fields` applied via `project()`.
2. `src/tools/execute.ts` (+ `src/upstream.ts`) — typed `next`/`continue` query values; `upstream.etag`, `upstream.ratelimit`; 304 handling; hints on 200 from response/swagger/request only.
3. `src/mcp.ts` — `docs` input schema gains `detail`, `fields`; descriptions unchanged unless ≤ 80 chars still holds.
4. `test/` — every PLAN v2.1/v2.2 done-means as a test, including the 323-path key walk and "0 extra fetches per hint".
5. `docs/PLAN.md` rows v2.1, v2.2 filled with observed values; `docs/SPEC.md` §v2 recut only where the build diverged (HYGIENE 12); T16 closed.

Done-means:
- An agent can call `docs({path:"/catalog/search"})` and observe ≤ 2 KB with `response_keys` containing `zipball_url` and `commit_sha`.
- An agent can call `docs({path, detail:"full"})` and observe the parameter descriptions v1 showed.
- An agent can replay `next` from a call made with `limit:3` and observe `limit` sent as `3` and echoed as a number.
- An agent can send `headers:{"if-none-match":<etag>}` and observe `status 304`, `body null`, `cost.bytes 0` when DCS supports it, or a PR note that DCS sends no etag.
- A reader can run the test suite and observe every hint-on-200 case asserts zero extra upstream fetches.
- A reader can grep the diff for `VERSION =` and observe no change.

## Failure Modes — What Breaks When L2 Stays a Wall
- Compact drops a param name (not just prose).
- A hint on 200 costs a fetch.
- `fields` on docs starts renaming or defaulting (T6).

## Required Response When Detected
- Dropped name → test walks all 323 paths for name parity with the swagger; fix.
- Fetch → move the hint into the recipe that already fetched, or delete it.
- Semantics → retract; `project()` only.
