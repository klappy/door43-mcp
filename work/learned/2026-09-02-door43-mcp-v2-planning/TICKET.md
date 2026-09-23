# TICKET — door43-mcp-v2-planning

**What this is:** Spec v2 of `door43-mcp` from the driver's seat — a planning
seat runs the driver's-seat pass over the whole design set, edits the docs, and
lands `SPEC.md` v2 (draft) + `DELTA.md`. No code. The first receipt for the
driver's-seat policy.
**Why now:** v1 (`0.3.x`) is live and proven from three seats 2026-09-03. The
captain asked, 2026-09-02 23:58 ET, what an overachiever's v2 looks like, and
made the pass a policy in the same breath. CoS's own driver's-seat notes from
using it tonight are the seed (Ingredients).
**Your move:** Read `DELTA.md` and the v2 `SPEC.md` diff when the draft PR
opens; rule which v2 items become the next meal. Nothing before that.

Class: entrée. Risk: STANDARD (docs only; no captain voice — SPEC/PLAN are
seat-authored; CHARTER is not in scope for edits).
Station: subagent — planning seat, Fable class, exploration→planning modes
only; no execution. Owner: CoS (planning), Otto consulted.
Promise: 4 h (R6). Depends: none (policy ticket lands beside; this dish may
run first and be its receipt). Meal: door43-mcp.

Ingredients (fetch live):
- `klappy/door43-mcp` main: `AGENTS.md`, every `docs/*.md`, `src/` (read the
  envelope, projection, docs ladder, telemetry as built — the pass is on the
  system as it *is*), `docs/PLAN.md` rows 0–3 with observed values.
- The prompt: `klappy://canon/methods/driver-seat-pass` once landed; until
  then, verbatim in `2026-09-02-driver-seat-pass-policy/TICKET.md`.
- CoS driver's-seat notes, 2026-09-02, from using v1 as the agent — seed, not
  spec; the pass may reject any of them with a reason in DELTA:
  1. Session map in `docs()`: what I've fetched, what's pinned, cost so far —
     stateless, carried in the `continue` token.
  2. Pin-first: every envelope carries the `ref`/zip sha it resolved against;
     `execute` accepts `pin:` so later calls cannot drift.
  3. Executable recipes: `execute({recipe, args})` → plan + per-step envelopes
     + one cost line; recipes stop being prose; ceiling holds (one verb).
  4. `dry_run:true` → the plan and estimated bytes/pages before spending.
  5. Teaching successes: hints on 200 (owner-is-string; newer release exists).
  6. Hand-offs as resume points: `execute({recipe:"map-this-release"})` returns
     a cartographer `consult_repo` payload; servers pass envelopes, the seat
     stops being the wire.
  7. House shape: envelope, boarding pass, telemetry columns, recipe grammar
     identical across cartographer / oddkit / door43 / gitauth — L1 says the
     shape, L4 the wire, each server is a leaf. Name what this needs at L1.
- Constraints the pass works under: `klappy://canon/constraints/mcp-tool-
  surface-ceiling` (three tools; breadth in params), `…/infra-config-is-seat-
  work`, convention §2 §7 §9, TENSIONS T2 T6 T8 T9 T12.
- House prior art (gate 11): cartographer `docs` progressive disclosure and
  `continent` receipt (coverage honesty — the "unzoomed states" lesson); oddkit
  retrieval-disclosure contract (flags + caps); AMS resume-point tokens
  (D0028 stream resumability). The pass reads these before proposing shapes.

Declared product (on `klappy/door43-mcp`, one draft PR):
1. `docs/DELTA.md` — the pass receipt: for each of the seven seeds and anything
   the pass adds, accept / reject / defer with one reason; what was
   considered and rejected; the system picture in ≤300 words ("the tower").
2. `docs/SPEC.md` v2 section (draft, clearly fenced from v1): tool params,
   envelope additions, recipe grammar, `pin`/`dry_run`/session-map semantics,
   vodka boundaries updated.
3. `docs/PLAN.md` — v2 gate rows (6+), each with done-means in P0007 form,
   ordered by ergonomics-per-cost.
4. `docs/TENSIONS.md` — new tensions the pass opens (expect: statelessness vs
   session map; recipe execution vs ceiling; cross-server shape ownership).
5. Proposed L1 items, if any, as a list in DELTA with target URIs — not
   written to klappy.dev by this dish.
6. `oddkit_challenge` (planning mode) run on the v2 plan *after* the pass;
   result appended to DELTA.

Done-means:
- The captain can read `DELTA.md` and observe every seed dispositioned with a
  reason, plus at least one idea the seed list did not contain.
- A cook can read SPEC v2 and PLAN v2 and cut the first v2 dish without asking
  a question (gate 9 on the plan).
- A reader can find the challenge result in DELTA and observe the plan changed
  in response to at least one challenge, or a reason it did not.
- A reader can grep the PR for `src/` changes and observe none.
- The v2 SPEC keeps `tools/list` at three.

## Failure Modes — What Breaks When v2 Is a Feature List
- Seven seeds become seven features with no system picture.
- The pass adds a fourth tool because it is "cleaner."
- Session state moves server-side and the deployment stops being stateless.
- The pass edits CHARTER (captain voice).

## Required Response When Detected
- Feature list → DELTA's "tower" section is mandatory; PR returned without it.
- Fourth tool → ceiling; breadth in `execute` params or it is rejected.
- Server state → reject; state rides in tokens or in the client.
- Charter edit → revert; HUMAN-ONLY(voice).
