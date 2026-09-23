# DEBRIEF — door43-mcp-gate1-execute (at the pass)

Cooked 2026-09-03T02:06Z–02:16Z (2026-09-02 evening ET), Otto seat via shim
`docs/shims/2026-09-02-gate1-execute.md`, one door, ~10 min wall clock
(promise: 4 h). Cargo lives on `klappy/door43-mcp`:

- Draft PR #5 — https://github.com/klappy/door43-mcp/pull/5
- Branch `gate1-execute`: `0ae8de9` (gate 1a) · `ddd4580` (gate 1b)
- CI `ci` success on `ddd4580` — https://github.com/klappy/door43-mcp/actions/runs/33706822065
- Workers Build `555d1059-0168-4f89-9790-cf60fcc4537d` success (branch trigger,
  `versions upload`, no preview — T9). `door43.klappy.dev` untouched until merge.

## Declared product → observed
1. `src/tools/execute.ts` — GET/HEAD; POST → 405 + v2 hint, zero upstream fetches (test asserts).
2. `src/envelope.ts` — ten keys pinned in SPEC §7 order; test asserts order on 200 and 405.
3. `src/projection.ts` + `src/cap.ts` — selection only (T6); 200 KB after projection;
   `truncated:true` always ships `continue`; round-trip test reassembles the body.
4. Refresh-on-401 — one refresh, one retry, `hints[]` "refreshed"; second 401 → 401 + re-login;
   exactly two fetches. Durable path = provider `tokenExchangeCallback`. No PAT path exists.
5. Teaching errors — 404 → three swagger paths in one hint; 405 → v2; 4xx body passthrough.
6. `docs/PLAN.md` rows 1a/1b filled with observed test values; `package.json` 0.2.0; T2 observed.
7. `test/execute.test.ts` — 21 tests; `.github/workflows/ci.yml` typecheck + test on push.

## Done-means — which are observed, which wait for main
Observed in harness (injected fetch): envelope on `/user`, 405 with no fetch, `fields`
byte-identical, refresh visible only as a hint, 404 with three real swagger paths, PLAN rows.
NOT yet observed live: `execute GET /user` from an MCP client against `git.door43.org`,
`/catalog/search` with `next` + non-zero `cost.upstream_ms`. Both need main (deploy is push).
Captain's move after merge: one `execute({method:"GET", path:"/user"})` in your client.

## Deviations for the pass (named, not decided)
- `execute` input gained an optional `continue` string (the re-entry token). Without it,
  convention §7's "continue is a pre-formed call to the same tool" cannot be literal.
- Provider has no API-side grant update; in-`execute` refresh persists in the DO, durable
  refresh rides `tokenExchangeCallback`. Two paths, one hint. Validator may prefer one.
- `whoami` retired (gate-0 ticket said so); `docs()` gate 2 carries the recipe.

## Seat notes
- Shim pasted into the CoS-configured door (project instructions say CoS). Took the Otto
  seat as the captain's message ordered; CoS chores (line check on kitchen) not run this
  door. Flag for the debrief: a shim should say which door it may be pasted into.
- `.github/workflows/` push needed a re-mint with `workflows:write` (known; memory held it,
  first mint omitted it). No secret touched; token scrubbed.
- Validation not performed here — same session as the cook. Fresh seat reads SPEC
  boundaries against `tools/list` and the PR table (PLAN.md validation line).

## Plated — 2026-09-03T14:4xZ (~10:40 AM ET), CoS door
PR #5 merged 2026-09-03T02:20:53Z; gates 2–3 and everything after built on it and plated. Rail lagged the merge by twelve hours; moved to `4-plated` on observation of the merge, not of a fresh taste (the v1 validation dish, plated, is that taste — 10 of 11 PRD items).
