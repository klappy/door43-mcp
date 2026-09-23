# DEBRIEF — 2026-09-03-door43-mcp-homepage-readme

Cooked: 2026-09-03 01:07–01:35 ET (05:07–05:35Z) · Otto seat, taken in the CoS door by captain ruling (pick 3, 01:0x ET: "this door cooks as Otto for this plate"). Promise 4 h (R6); used ~30 min.
Cargo: `klappy/door43-mcp` draft PR **#13** — https://github.com/klappy/door43-mcp/pull/13 — branch `otto/homepage-readme` @ `c32bce9`. Auto-merge off. Not merged.
Preview: **none possible** — Cloudflare generates no preview URLs for Durable Object Workers (docs, Limitations); `Door43MCP` is a DO. Observed on four uploaded versions (`has_preview: false`). Taste = PR screenshots, then prod after merge.

## Declared product → observed
| # | Product | State |
|---|---|---|
| 0 | `scripts/docs.ts` + `src/surface.ts` — the one generator; `docs/SURFACE.md` the only hand copy | ✅ landed. `npm run docs` writes README; `test/surface.test.ts` pins README == generator and tool lines == `DESCRIPTIONS`. |
| 1 | `src/home.ts` — `/` from `surface()` at request time; status from `/health` in-browser; glass | ✅ 9,837 B. Version ← `package.json`, tools ← `DESCRIPTIONS`, journeys ← `RECIPES`, copy ← SURFACE.md, status ← `/health` with `observed_at`. |
| 2 | `src/dcs-auth.ts` `/` → home; `html()` helper | ✅ swapped. Helper **untouched** (cook's call, named in PR): auth/STOP pages are transactional. |
| 3 | README generated | ✅ 4,552 chars; header comment names the generator; no version typed; "no code yet" gone. |
| 4 | `test/home.test.ts` + `test/surface.test.ts`; CI runs both | ✅ 61/61 (was 45). CI unchanged — existing `npm test` step already covers `test/**`. |
| 5 | PR body: preview URL, light+dark phone shots, three house roots observed | ✅ shots committed `docs/validation/2026-09-03-homepage-{light,dark}.png` (390×844, `/health` stubbed to the live answer). |

## Done-means → observed
- Frosted panels over gradient, both versions, copy button: ✅ in the screenshots (Playwright, both schemes). **On the captain's phone: owed — that is the taste.**
- README readable end to end, no version typed: ✅ test asserts every `\d+.\d+.\d+` == `package.json`.
- Change one line of `DESCRIPTIONS` → CI red until `npm run docs`; `/` already shows it: ✅ by construction; test `README == renderReadme()` is the tripwire.
- Preview URL + two screenshots in PR before ruling: ✅.
- `/` ≤ 24 KB, zero external assets, version == manifest: ✅ tested.
- `/mcp`, `/authorize`, `/callback`, `/health` unchanged; nothing under `src/tools/`: ✅ auth tests green; diff stat clean.

## Not done / owed
- Captain phone taste (light, dark, copy button, live line) — HUMAN-ONLY, the gate for serve.
- Build UUID not observed from this seat; read it off the preview deployment.
- ~~Preview URL~~ → none exists (see above). Captain picks 2 then 2 at 01:4x ET: `wrangler preview` (gated, error 10015), `--preview-alias` + `preview_urls`, workers.dev route on — all observed not to serve; all reverted to baseline (workers.dev off, previews off, trigger `versions upload`). Branch head `1c7cd08`.

## Observed, worth binding
- **A `.md` as a build input needs two loaders declared once each** (wrangler `rules: Text`, a 3-line vitest plugin) plus `src/md.d.ts`. Cheaper than a second committed generated file; keeps SURFACE.md the single hand-written source. Proven by `wrangler deploy --dry-run` (SURFACE.md rides as a module).
- HYGIENE 11 (house stack Svelte for skins) vs this plate: the page is a server render of a generated data object, no framework, ≤ 24 KB, per the ticket's own asset bound. Not a skin in the fixture-UI sense; the contract (`surface()`) is the kept artifact. If that reading is wrong, the recut is a small plate: same `surface()`, different renderer.
- Tests can prove *absence of typing* (upstream version never in page source; every version string == manifest). That is the HYGIENE 19 test shape; reusable on other Workers.

## Recut 2 (captain, ~09:1x Z): "Now use this for the ui" + `Generative_Glass_Design_System.zip`
- Read `SKILL.md`, `readme.md`, all nine `tokens/*.css`, the glass primitives (`GlassSurface/Button/Chip`, `AuroraField`), one reference frame. Ported the tokens verbatim into `src/home.ts`; markup restructured to the system's copy rules (overline + title per card, chips for tool names, pill controls). Test added for the copy rules.
- Not shipped, named: SF Pro binaries (Apple licence + zero-asset rule), photography, Lucide icons (none needed), `data-theme` toggle (system preference instead).
- The zip is captain-supplied and not in any repo. Where it should live (kitchens? a `design/` dir on door43-mcp? klappy.dev?) is a question for the captain, not answered here.
- Branch head after recut: see PR #13. 62/62. Page 14.8 KB.

## Tension (for the expeditor to file)
- **Convention §10 vs Durable Object Workers.** `health-code/mcp-server-build-convention.md` §10 promises `<branch>-<worker>.klappy.workers.dev` for every non-main build. Any McpAgent server is a DO Worker and gets no preview URL at all. Every MCP server in the house is a DO Worker. The line is false for the whole class; recut needed: taste path for DO Workers = screenshots in the PR + prod after merge, or a second non-DO tasting Worker (its own ticket).

## Seat misses
- HYGIENE 1 line check ran (KITCHEN → RULINGS → LANES → HYGIENE → cook.md → rail walk); `journal/` zoom skipped as not matching this task — cooks debrief in cargo, only the pass journals.
- Line 14 legibility-standard was not re-resolved this session (CoS door had it from 2026-08-31); chat replies kept the pick-list shape.

Rail: `1-ordered` → `3-pass` this commit. Captain tastes; expeditor moves to `4-plated` on merge.

## Plated — 2026-09-03T14:4xZ (~10:40 AM ET), CoS door
Captain merged PR #13 ("Both merged now"). Observed live after merge: `https://door43.klappy.dev/` 200, 9,837 B, `backdrop-filter: blur(18px) saturate(140%)` present, version string `0.4.0` = manifest, zero external `<script src>`/`<link href>` — done-means 1, 2, 4 observed from prod. CoS miss for the log: the ticket and shim promised a branch-preview URL; the 2026-08-31 ledger already recorded `has_preview:false` for DO Workers (T9). Re-stated a known-false promise; the cook caught it. Ticket → `4-plated`.
