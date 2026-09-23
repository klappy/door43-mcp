# TICKET — door43-mcp-v1-validation-gate4

**What this is:** A fresh seat validates door43-mcp v1 (0.3.1) as built — the validation every gate 0–3 debrief says was never run — and cooks gate 4's README/DEPLOY recut, before any v2 dish fires.
**Why now:** v2 rewrites `docs.ts` output on top of a v1 nobody has validated with a context break; README still says "planning — no code yet"; DEPLOY names `wrangler.toml` while the repo carries `wrangler.jsonc` (observed 2026-09-03). Captain took the recommendation 2026-09-03 ~00:30 ET.
**Your move:** Read `docs/validation/2026-09-03-v1.md` when the draft PR opens; nothing else until it plates.

Class: entrée. Risk: STANDARD (docs + a findings file; no src, no secrets).
Station: subagent — a seat that did **not** cook gates 0–3 (`klappy://canon/principles/verification-requires-fresh-context`).
Owner: Otto (fresh session). Promise: 3 h (R6). Depends: none (runs beside `2026-09-03-door43-mcp-homepage-readme`, which owns README). Meal: door43-mcp-v2.

Ingredients (fetch live):
- `klappy/door43-mcp` main head (0.3.1, `8e8d484` or later): `docs/SPEC.md` v1 boundaries, `docs/PRD.md` acceptance 1–11, `docs/PLAN.md` rows 0–3, `README.md`, `docs/DEPLOY.md`, `wrangler.jsonc`.
- The live server via the seat's own connector (`https://door43.klappy.dev/mcp`): `tools/list`, `docs()`, one `docs({path})`, one `docs({recipe})`, journey 2 (find-and-pin) end to end, `execute POST` (405), `telemetry` SELECT and one refused statement.
- Kitchen law: HYGIENE 3 (validation runs on the branch and after merge), HYGIENE 19 (version in one place — README/DEPLOY print none).
- Prior art (gate 11): `rail/4-plated/2026-09-02-door43-mcp-gate2-3-docs-telemetry/DEBRIEF.md` §Seat notes names the fresh-seat steps; `docs/DELTA.md` on PR #9 lists two pinches already observed (L2 keys cut at 12; `next` retypes numbers) — confirm, do not re-discover.

Declared product (on `klappy/door43-mcp`, one draft PR):
1. `docs/validation/2026-09-03-v1.md` — one row per PRD acceptance item 1–11: observed / not observed / failed, with the call and the bytes; findings with disposition (accept · iterate · pivot) per `klappy://canon/validation-as-epistemic-mode`.
2. `docs/DEPLOY.md` — `wrangler.jsonc` not `.toml`; steps re-observed against the repo; the one HUMAN-ONLY step stays named; the uW second-operator rehearsal stays a named gap (needs uW ops).
3. `docs/PLAN.md` row 4 — filled with what this dish observed; rehearsal half left open, named.
4. `docs/TENSIONS.md` — one line per finding that is not fixed here.
(README is **not** this dish — `2026-09-03-door43-mcp-homepage-readme` owns it, captain ruling 2026-09-03 ~00:45 ET.)

Done-means:
- The captain can read `docs/validation/2026-09-03-v1.md` and observe every PRD acceptance item 1–11 marked observed, not observed, or failed, each with the call that proved it.
- An operator can follow `docs/DEPLOY.md` against the repo and find every file it names exists.
- A reader can grep the PR for `src/` changes and observe none.
- A reader can find the two DELTA pinches (L2 keys, typed `next`) confirmed or refuted in the findings, not re-derived.
- A cook opening the v2.1 ticket can cite this file's row 4 and row 8 (docs) as the baseline it changes.

## Failure Modes — What Breaks When Validation Is the Cook's Own Seat
- The seat that cooked gates 0–3 runs this (self-review labelled validation).
- Findings fixed in the same PR (validation modifies the artifact).
- Findings filed for README instead of handed to the homepage dish.

## Required Response When Detected
- Same seat → stop; hand to a fresh session; note it in the DEBRIEF.
- Fix in PR → revert the fix; open a TENSIONS line or a ticket instead.
- README finding → one TENSIONS line pointing at `2026-09-03-door43-mcp-homepage-readme`.
