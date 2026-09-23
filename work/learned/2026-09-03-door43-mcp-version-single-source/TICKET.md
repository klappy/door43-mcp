# TICKET — door43-mcp-version-single-source

**What this is:** One version number in `klappy/door43-mcp`, read from
`package.json` everywhere a version is printed or sent; and a HYGIENE practice
so no repo in this kitchen spells its version twice.
**Why now:** Captain, 2026-09-03 ~00:05 ET: "is there a sync version issue? If
so single source of truth for version numbers! That should have a hygiene rule."
Observed on main `8e8d484`: `package.json` 0.3.1, `src/tools/execute.ts` 0.3.0,
root page 0.2.0 — three answers to one question.
**Your move:** Read the proposed HYGIENE text below (your voice, your law) and
pick: bind as written, or edit. The code half is cooked and auto-merging.

Class: fast-food. Risk: STANDARD (code) + law text awaiting captain review.
Station: subagent (Otto). Owner: Otto. Promise: 20 min (R6). Depends: none.
Meal: door43-mcp.

Ingredients:
- `klappy/door43-mcp` main `8e8d484`: `package.json` L3, `src/tools/execute.ts`
  L15 (`VERSION`), `src/dcs-auth.ts` L116 (root page), `src/mcp.ts` L30/L51/L79
  (consumers of `VERSION`).
- `health-code/HYGIENE.md` 1.25.0 — practice 9 (Naming) is the nearest block.

Declared product:
1. `src/version.ts` — `VERSION = package.json.version`; all consumers read it.
   Cooked: door43-mcp PR #10 (auto-merge on).
2. `test/auth.test.ts` — asserts `VERSION === package.json.version` and the root
   page prints it.
3. HYGIENE practice (proposed, NOT bound — captain reviews exact text):

   > **19. One version, one place.** A repo's version lives in exactly one file
   > (`package.json`, `pyproject.toml`, `wrangler` name — whatever the stack's
   > manifest is). Every other surface that prints, sends, or logs a version reads
   > it from there at build time. A version string typed anywhere else is a lie
   > waiting to age. Bump = one line, one commit.

   Bind = HYGIENE 1.26.0 (MINOR: practice added), by PR per §3 L65.

Done-means:
- A cook can `grep -rn '"0\.[0-9]\.[0-9]"' src` in door43-mcp and observe only
  `version.ts`, which spells no number.
- A client can call `docs()` and observe `version` equal to `package.json`.
- A captain can open `/` on `door43.klappy.dev` after deploy and observe the
  same number as `package.json` on main.
- A captain can read practice 19 in HYGIENE 1.26.0 (after his bind) and a waking
  seat can cite it when a second version string appears.

## Failure Modes — What Breaks When a Version Is Spelled Twice
- Telemetry `worker_version`, MCP server version, and the root page disagree;
  a debrief pins a bug to the wrong build.
- A bump touches one file and forgets two; "0.2.0" survives to 0.3.1 (observed).

## Required Response When Detected
- Delete the second spelling; import from the manifest; add a test that the
  printed version equals the manifest.
