# TICKET — door43-mcp-homepage-readme

**What this is:** The two human doors of door43-mcp get real docs — `README.md` rewritten as the front page of the repo, and the app's root `/` becomes a homepage in glass-morphism design (frosted translucent cards on a layered gradient) — so a person landing on either knows what this is, sees it is live, and can connect in three steps.
**Why now:** Captain ruling 2026-09-03 ~00:45 ET: "In order for 1 to happen… both readme needs good docs and so does the root homepage of the app! Use glass-morphism design." Observed now: `/` serves 288 bytes of unstyled text (`src/dcs-auth.ts` L115–117); README still says "planning — no code yet".
**Your move:** Taste the homepage on your phone when the draft PR opens (screenshot + branch preview URL in the PR); nothing else until then.

**Amended 2026-09-03 ~01:20 ET (captain ruling, verbatim):** "homepage and readme need updating after every PR change unless read from policies that drive the build. Then it self resolves." → Neither surface is hand-written. Both are **generated at build** from the sources that already drive the server: `package.json` (version), `src/descriptions.ts` (the tool lines), the recipe table (journeys), SPEC's vodka boundaries (what it is / is not), `/health` (live status at runtime). `README.md` is a committed build output with a test that fails when it drifts from its generator; `/` renders from the same generator at request time. A PR that changes a source changes both doors, or CI says so.

Class: entrée. Risk: STANDARD (no law, no secrets; captain tastes the look before plate).
Station: subagent. Owner: Otto. Promise: 4 h (R6).
Depends: none (may run beside `2026-09-03-door43-mcp-v1-validation-gate4`; dish `v2-1` now depends on this). Meal: door43-mcp-v2.

Ingredients (fetch live):
- `klappy/door43-mcp` main head (0.3.2 live at 2026-09-03T04:5xZ): `src/dcs-auth.ts` (the `/` handler and the inline `page()` helper L17), `src/index.ts` (default handler route), `README.md`, `AGENTS.md`, `docs/CHARTER.md` §Success, `docs/PRD.md` §User journeys, `docs/DEPLOY.md`, `package.json` (the one version, HYGIENE 19).
- The live `/health` answer (upstream reachability + version) — the homepage's status line reads it; nothing on the page is typed from memory.
- Design ruling, verbatim: **glass-morphism** — translucent frosted panels (`backdrop-filter: blur`), thin light borders, soft depth, over a layered gradient; readable on a phone in light and dark; no external fonts, scripts, or images (one inline `<style>`, one optional inline `<script>` for the `/health` fetch and the copy-URL button); page ≤ 24 KB; CSP-clean (no inline event handlers if a CSP header is set — observe whether one is).
- If the cook's harness offers a `frontend-design` skill, read it first (gate 11: house prior art on the harness side); house pages to look at before drawing: `klappy.dev` (canon site) and `cartographer.klappy.dev` / `oddkit.klappy.dev` roots — observe what each serves at `/` and name the divergence.
- Copy on the page is seat-authored product text, not captain voice; the law line cites `klappy://canon/constraints/mcp-tool-surface-ceiling`.

Declared product (on `klappy/door43-mcp`, one draft PR):
0. `scripts/docs.ts` (new) + `src/surface.ts` (new) — **the one generator**: reads `package.json`, `src/descriptions.ts`, the recipe table, and a small `docs/SURFACE.md` (the only hand-written copy: the one-paragraph "what", the is-not line, the three connect steps) and emits (a) `README.md` and (b) the data the homepage renders. `npm run docs` regenerates README; `test/surface.test.ts` fails if the committed README ≠ generator output or if any tool line in README/home ≠ `DESCRIPTIONS`.
1. `src/home.ts` (new) — the homepage rendered from `src/surface.ts` at request time: identity + one-line what; live status (server version from the manifest via build, upstream host + version + `observed_at` from `/health`); the three tools with their one-line contracts (`src/descriptions.ts` verbatim); **Connect in three steps** (MCP URL with copy button → login → `execute GET /user`); the four journeys as filled calls; links to `AGENTS.md`, `docs/`, `/health`, the repo; the law line. Glass-morphism per the ruling.
2. `src/dcs-auth.ts` — `/` serves `home.ts`; `page()` helper untouched for the auth/STOP pages (or restyled to match — cook's call, named in the PR).
3. `README.md` — **generated** by `scripts/docs.ts`: what it is, status (live; version from `package.json`), connect in three steps, the three tools table (`DESCRIPTIONS` verbatim), the journeys (recipe table), "deploy your own" pointer, governance line, the docs table. Header comment says "generated — edit `docs/SURFACE.md` or the sources". Agents still start at `AGENTS.md`. Note: PR #11 (validation) already edited README on main — start from head; the generator replaces it.
4. `test/home.test.ts` + `test/surface.test.ts` — `/` returns 200 `text/html`, ≤ 24 KB, contains the three tool names and the MCP URL, no external `src=`/`href=` to fonts/scripts, version string equals `package.json` (HYGIENE 19); README == generator output; tool lines == `DESCRIPTIONS`. CI (`.github/workflows/ci.yml`) runs both — a PR that changes a source without regenerating README goes red.
5. PR body: branch preview URL (`<branch>-door43-mcp.klappy.workers.dev`, convention §10 — login will not complete there, the page will), one phone screenshot light + dark, the observed `/` of the three house roots.

Done-means:
- A person can open `https://door43.klappy.dev/` on a phone and observe frosted translucent panels over a gradient, the server and upstream versions, and a "connect in three steps" panel with a working copy button.
- A person can read `README.md` top to bottom and connect without opening any other file, and observe no version number typed into it.
- A cook can change one line in `src/descriptions.ts`, push, and observe CI fail until `npm run docs` is run — and observe `/` already shows the new line with no other change.
- The captain can open the PR and observe a branch-preview URL and two screenshots before ruling.
- A reader can run the tests and observe `/` ≤ 24 KB with zero external assets and the version equal to `package.json`.
- An agent can still hit `/mcp`, `/authorize`, `/callback`, `/health` unchanged (auth tests still pass).
- A reader can grep the diff and observe no change under `src/tools/` or to `tools/list`.

## Failure Modes — What Breaks When the Homepage Is a Poster
- Version, tool line, or journey typed by hand into the page or README instead of read from the source that drives the build (captain ruling 2026-09-03).
- External font/script/CDN dependency.
- Status shown as static text instead of read from `/health`.
- Glass styling unreadable in dark mode or on a phone.

## Required Response When Detected
- Hand-typed → move it to the source or to `docs/SURFACE.md`; the generator is the only writer; test pins equality.
- External asset → inline it or drop it.
- Static status → fetch `/health` client-side; show `observed_at`.
- Unreadable → contrast fix; screenshots in both modes are the gate.
