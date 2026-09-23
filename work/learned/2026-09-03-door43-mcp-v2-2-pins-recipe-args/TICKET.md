# TICKET — door43-mcp-v2-2-pins-recipe-args

**What this is:** Cook v2.3 + v2.4 — pins (`upstream.swagger`, `pin:{sha}`, sha carried where DCS already gave one) and the recipe grammar (`args`, `{owner}` templates, `docs({rung:"recipes"})`, `execute({recipe,args,dry_run:true})` with a named-basis estimate).
**Why now:** Hand-offs to cartographer are unpinned today, and every recipe hard-codes `unfoldingWord/en_ult`; both are the seeds captain marked accept (DELTA seeds 2, 4).
**Your move:** Nothing until it plates.

Class: entrée. Risk: STANDARD.
Station: subagent. Owner: Otto. Promise: 4 h (R6).
Depends: `2026-09-03-door43-mcp-v2-1-l2-truth-teach` (typed calls; `upstream` object growth). Meal: door43-mcp-v2.

Ingredients (fetch live):
- `docs/SPEC.md` §v2 `docs` (recipe, args, rung:recipes), §v2 `execute` (pin, dry_run, estimate basis); `docs/PLAN.md` rows v2.3, v2.4; DELTA seeds 2 and 4 with their retraction conditions.
- `src/tools/docs.ts` `RECIPES` (L54–64) — becomes `{about, args, calls}`; `src/tools/execute.ts` `resolvePath`; `src/telemetry/index.ts` for the p50 read (`SELECT` over `bytes_out` by `path_family`, last 30 d, this deployment).
- Observed facts: `/catalog/search` entries carry `commit_sha` (swagger `CatalogEntry`); releases carry `target_commitish` (a branch, **not** a sha — do not pin from it).
- Law: convention §7 (pre-formed calls) §9; T6 (no semantics); no extra upstream fetch to mint a pin (DELTA seed 2 retraction condition named).
- Prior art (gate 11): cartographer `consult_repo` `resolved:{ref,sha,observed_at}` + "follow head or stay put" (docs `guide`); cartographer `docs {recipe}` grammar (`whoami · catalog-by-language …` as prose — the thing this dish replaces with args).

Declared product (on `klappy/door43-mcp`, one draft PR):
1. `src/recipes.ts` (new) — recipe table with `args` schema and templates; filler shared by docs and execute.
2. `src/tools/docs.ts` — `args` filling, `rung:"recipes"`, `upstream.swagger{version,etag,observed_at}` on L1–L3, 400-naming-the-arg.
3. `src/tools/execute.ts` — `pin:{sha}` rewrite (echoed in `request`), `recipe`+`args`+`dry_run` → `body.plan` + `body.estimate{bytes,calls,basis}`, zero fetches on dry run.
4. `test/` — PLAN v2.3/v2.4 done-means as tests.
5. `docs/PLAN.md` rows filled; `docs/SPEC.md` recut where diverged; `docs/DELTA.md` retraction conditions re-checked in one line each.

Done-means:
- An agent can call `docs({recipe:"latest-release-zip", args:{owner:"unfoldingWord",repo:"en_ust"}})` and observe calls with that path.
- An agent can omit `owner` and observe a 400 naming `owner` with its `about`.
- An agent can call `execute({recipe, args, dry_run:true})` and observe `body.plan`, `body.estimate.basis` as a string, and (in tests) zero upstream fetches.
- An agent can call `execute GET /repos/{o}/{r}/contents/README.md {ref:"master"} pin:{sha}` and observe the echoed `request.query.ref` equals the sha.
- An agent can call `docs({rung:"map"})` and observe `upstream.swagger.etag` and `observed_at`.
- A reader can grep the tests and observe no case spends a fetch to obtain a sha.

## Failure Modes — What Breaks When Pins Cost Fetches or Recipes Grow Logic
- A pin minted by calling `git/refs`.
- A recipe with a branch or a conditional.
- `estimate` presented without `basis`.

## Required Response When Detected
- Fetch → remove; pin only what the upstream said (DELTA retraction condition governs the exception).
- Logic → reject; recipes are straight-line lists of the calls the agent would make.
- No basis → `estimate:null, basis:"no history"`.
