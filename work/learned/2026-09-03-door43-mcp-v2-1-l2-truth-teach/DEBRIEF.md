# DEBRIEF — door43-mcp-v2-1-l2-truth-teach (at the pass)

Cooked 2026-09-03T04:47Z–04:57Z (2026-09-03 ~00:55 ET), Otto seat, ~10 min wall clock
(promise 4 h). Cargo on `klappy/door43-mcp`:

- **Draft PR #12** — https://github.com/klappy/door43-mcp/pull/12 — not merged; captain reads.
- Branch `otto/v2-1-l2-truth-teach` @ `9574cb1`; base main `6ec2c1a` (#9 merged). 0.4.0.

## Declared product → observed
1. `docs.ts` — `responseKeys` complete (no `slice(0,12)`); `detail` compact/full; `fields` via `project()`; `upstream.swagger` pin on L1–L3. `/catalog/search`: 1,690 B compact (was 5,731), 41 keys.
2. `execute.ts` — `typedQuery()` for `next`; `upstream.etag`/`ratelimit`; 304 branch; `fieldsTeach()` + moving-ref hint from request/response only. `envelope.ts` `Upstream` type grows; keys unchanged.
3. `mcp.ts` — `docs` schema + `detail`, `fields`. Descriptions untouched.
4. `test/v2-l2-teach.test.ts` — 14 tests, one per done-means incl. the 323-path walk (246 ops with 200 schemas, >1,000 key checks) and 1-fetch assertions on every hint. New fixture `swagger-full-slim.json` (275 KB, schema shape only, provenance + sha256 of the 995 KB original inside). 59/59 total.
5. PLAN v2.1/v2.2 rows filled with observed values; SPEC §v2 recut once (compact params as strings — the objects cost more than the 2 KB budget); T16 closed.

## Observe-first result (ticket Ingredients L3)
DCS 1.27.2+dcs sends no `etag`, `last-modified`, or `x-ratelimit-*` on six paths incl. the swagger itself (04:45:58Z). Fields ship `null` live; both surface with hints when present (tested with injected headers). Recorded on PLAN v2.2 and in the PR.

## Deviations for the pass (named, not decided)
- Compact `params` are `name*:type` strings, not SPEC's `{name,in,type,required}` — `in` implicit.
- `fields` on docs addresses the method key too (`GET.response_keys`), since L2 nests per method.
- `pin:{sha}` (SPEC execute v2) not cooked — not in this ticket's product; the moving-ref hint points at it.
- Dependency note: validation baseline (`gate4`) is on draft #11 `d43e66a`, not main; the rows exist and were cited.

## Seat notes
- Legibility miss earlier this door (PR bodies #9/#11) — both recut 04:46Z; #12 written to the standard first time.
- Validation not performed here — same seat as the cook.

## Plated 2026-09-03T05:24Z
PR #12 merged `9585f31` (captain approved 05:0xZ; Bugbot success). Two things learned at the pass:
- Cursor Agent pushed `455e6b6` (real bug: false "selected nothing" on heterogeneous arrays) — accepted with its test.
- The autofix commit did NOT get a Bugbot check on its own, so the required check never appeared and auto-merge stalled ~10 min; the PR also flipped back to draft on the head change. An empty commit did not trigger Bugbot; **mark-ready-for-review did**. Fix for `hit-list-automerge-autofix-gate11`: after any autofix push → re-mark ready + re-arm auto-merge (both flags drop on head change).
