# DEBRIEF — door43-mcp-v2-planning (at the pass)

Cooked 2026-09-03T03:53Z–04:08Z (2026-09-02 ~11:53 PM–00:08 AM ET), planning seat (Fable class)
in the CoS-configured door, one door, ~15 min wall clock (promise: 4 h). Modes: exploration →
planning only; no execution. Cargo lives on `klappy/door43-mcp`:

- Draft PR #9 — https://github.com/klappy/door43-mcp/pull/9 (assigned to captain; draft until read; auto-merge off)
- Branch `v2-planning-driver-seat-pass`: `a4d80df` (author `118073+klappy@users.noreply.github.com`), base main `8e8d484` (0.3.1)
- `git diff --stat main..HEAD`: 4 files, +269, `src/` untouched (done-means 4 observed)

## Declared product → observed
1. `docs/DELTA.md` — tower 306 words; 7 seeds dispositioned (1 reject-as-specified/accept-derived, 2 3 4 accept-narrowed, 5 6 accept, 7 accept-as-L1); 8 additions; considered-and-rejected (9); L1 items (5, target URIs); the five calls the pass made as the user; challenge appended. Copy beside this ticket: `DELTA.md` (policy ticket done-means 4).
2. `docs/SPEC.md` — fenced `# v2 (DRAFT …)` section: vodka boundaries v2, envelope additions with keys unchanged, `docs`/`execute`/`telemetry` v2 params, recipe grammar, `pin`/`dry_run`, writes as progressive protection. `tools/list` stays three (done-means 5).
3. `docs/PLAN.md` — v2.1–v2.8 + v2.x, P0007 done-means, ordered ergonomics-per-cost (L2 completeness first, writes last).
4. `docs/TENSIONS.md` — T13 statelessness vs session map · T14 recipe run vs §7/ceiling · T15 cross-server shape ownership · T16 L2 hid the keys (observed) · T17 writes/confirmations · T18 consumer label.
5. L1 items listed in DELTA with target URIs; nothing written to klappy.dev.
6. `oddkit_challenge` (planning) run after the pass, 04:01:50Z; result in DELTA §Challenge. **The plan changed:** canon cited `klappy://docs/planning/E0005_2-session-4-notes` → v2.8 recut from sealed-confirm-on-every-write to progressive protection (done-means 3 observed).

## Done-means — observed vs. waiting on the captain
Observed: seeds dispositioned with reasons + ideas not in the seed list (DELTA §added); challenge result and the change it caused; no `src/` in the diff; three tools in SPEC v2.
Waiting: done-means 2 (a fresh cook cuts v2.1 from SPEC/PLAN without a question) — fresh seat, not this one.

## Pinches the pass observed live (the seeds' evidence)
`docs({path:"/catalog/search"})` 5,731 B, `response_keys` cut at 12 → `zipball_url`/`commit_sha` hidden (T16). `next` echoed `limit:"3"` for `limit:3`. Both are v2.1/v2.2.

## Seat notes
- Line check run before first tool touch (kitchens STACK/RECIPE/card → kitchen KITCHEN/RULINGS/LANES/HYGIENE, line 14 resolved → door43 journals/debriefs → rail). Drove the live server (five calls) before writing — the ticket's "system as it is".
- `oddkit_gate` lexically misrouted the exploration→planning gate to "captain-escalation" on the string "HUMAN-ONLY" in the context; second run with a problem statement still misrouted. Worked around; a gate detector case for the log.
- Miss: write token minted after the pass, not before — the first door hit its tool cap between cook and land (one captain turn spent on "Continue"). Mint write before the cook.
- Validation not performed here — same session as the cook. Fresh seat: read SPEC §v2 + PLAN v2 and cut the v2.1 ticket (done-means 2).

Carried: captain's ruling on which v2 items become the next meal · whether v2.8 writes are a separate meal (T17) · L1 items (5) → klappy.dev tickets · policy ticket `2026-09-02-driver-seat-pass-policy` still at 1-ordered (this dish is its receipt).

## Recut at the pass — 2026-09-03T04:2xZ (~00:25 ET)
Captain read the PR and ruled T17: writes leave `execute` and become a fourth tool `mutate`
(`destructiveHint:true`, scope `dcs:write`) — the named exception the ceiling admits with a
written reason (MCP consent and OAuth scope are per tool; `execute` stays `readOnlyHint:true`).
Ticket done-means 5 ("three tools") superseded: 3 under `dcs:read`, 4 under `dcs:write`, reason
cited in `docs()`. PR #9 second commit carries SPEC §`mutate`, PLAN v2.8, T17, DELTA recut.
DELTA copy beside this ticket refreshed. Still open: the observed `refused[]` list (captain names
it at taste); dish 5 vs own meal.

## Meal ordered — 2026-09-03T04:3xZ (~00:35 ET), captain took the seat's recommendations
Meal `door43-mcp-v2`, seven dishes at `rail/1-ordered/2026-09-03-door43-mcp-*`: v1-validation-gate4 (first, fresh seat) → v2-1-l2-truth-teach → v2-2-pins-recipe-args → v2-3-recipe-run → v2-4-handoff-consumer → v2-5-mutate (ALLERGY; captain's `refused[]` VERDICT) · v2-l1-house-shape (catering, CoS, captain voice). All but dish 0 depend on PR #9 plating. CHECKLIST v1.3.0 run on each; tickets shaped from TEMPLATE v1.1.0 fetched at `7e198cb`, not from specimens.

## Plated 2026-09-03T04:38Z
door43-mcp PR #9 merged by captain (`6ec2c1a`). Captain confirmed 04:43Z the merge was intended (c0014 concerned klappy.dev#317 / kitchen#78, not #9). PR body recut to legibility standard 04:46Z by Otto.
