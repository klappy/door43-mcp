# DEBRIEF — door43-mcp-v2-2-pins-recipe-args (at the pass)

Cooked 2026-09-03T18:03Z–2026-09-03T20:18Z (2026-09-03 ~2:03–4:30 PM ET), Otto seat in the CoS door
(captain order 2026-09-03: "Board as Otto … cook"). Promise 4 h; ~2 h 30 wall clock, of which
~2 h was a dead harness between turns (state survived). Cargo on `klappy/door43-mcp`:

- **Draft PR #14** — https://github.com/klappy/door43-mcp/pull/14 — not merged; captain reads.
- Branch `otto/v2-2-pins-recipe-args` @ `d15bed2`; base main `f18fd74` (#13 merged). 0.4.0 → 0.5.0.

## Declared product → observed
1. `src/recipes.ts` — table `{about, args{about,required,default,pattern}, calls}`; templates `{owner}` `{repo}` `{ref}` `{path}` (+ `{lang}` `{stage}` `{limit}` `{sha}`) in path and query; `fill()` pure; ≤ 5 steps thrown at definition. v1's five parameterised — no call hard-codes `unfoldingWord/en_ult` (test). `read-file-at-pin` added.
2. `docs.ts` — `args` → filled plan `{recipe, about, args, calls}`; missing required → 400 `{error, arg, about, args}` (`owner` observed); `rung:"recipes"` → schema, no calls, 0 swagger reads; L0 lists recipe names, still ≤ 2 KB.
3. `execute.ts` — `pin:{sha}` via pure `applyPin`: `/repos/*` query `ref` set/overridden, archive `{ref}.zip` rewritten; echoed `request.query.ref` = sha, `request.query.pin` = sha; upstream URL observed with `?ref=<sha>` (1 fetch); non-40-hex or no-ref path → 400, 0 fetches. `{recipe, args, dry_run:true}` → `body.plan` + `body.estimate{bytes,calls,basis}` or `estimate:null, basis:"no history[ for <family>]"`; runs before the grant check — 0 fetches, no grant. `recipe` without `dry_run` → 501 with the plan (v2.5 fills it).
4. `test/v2-pins-recipe-args.test.ts` — 13 tests, one per done-means + failure modes; `p50BytesByFamily` median test. 88/88 total.
5. PLAN v2.3/v2.4 rows with observed values; SPEC recut in three places (`method`/`path` optional for the recipe form; 400 shape; 501 until v2.5); DELTA seeds 2/4 re-checked one line each; AGENTS/README regenerated.

## Deviations for the pass (named, not decided)
- `read-file-at-pin` shipped (SPEC §docs v2 names it; the ticket's product list did not).
- `recipe` without `dry_run` → 501, not 400.
- Existing recipe test recut to pass args (the no-args call is now the ticket's 400).
- `upstream.swagger.etag` asserted with an injected etag; DCS sends none live (v2.2 observation).

## Seat notes
- Validation not performed here — same seat as the cook. Live proof on `door43.klappy.dev` after merge (T9: no branch preview).
- **Tension (standing, not new):** Otto card §1 dispatch-never-execute vs. this surface has no flight lane and the captain ordered the cook in-seat. Cooked under the order; same gap as the 2026-08-31 read-only-door finding — a seat that can push but cannot dispatch. Owner: CoS (route to the dispatch-lane ticket when ordered).
- Harness died ~2 h between turns; `/home/claude` survived, so no refire. Token re-minted.
- Merge procedure on captain's "merge" (v2-1 lesson): mark ready → arm auto-merge; after any Bugbot autofix push → re-mark ready + re-arm (both flags drop on head change).

## Plated 2026-09-03T22:1xZ
PR #14 merged `15fe2d2` (captain approved the three named decisions in the door, 21:5xZ; marked ready 21:51:33Z, auto-merge armed same second; Bugbot in_progress ~6 min → success; merged on its own, no autofix push this time, so no re-mark/re-arm was needed). Main build success; **observed live on `door43.klappy.dev`**: homepage prints `0.5.0`, lists `read-file-at-pin`, `dry_run`, and per-recipe args (`owner* repo*`, `lang=en stage=prod`). The `/mcp` calls (`docs({rung:"recipes"})`, one pinned read, one dry run) not observed from this seat — the connector's tool call waited on a phone-side approval that did not arrive; next seat with an approved door43 connection runs the three.
Bugbot, one finding (low): `""` on an optional arg left `{ref}`/`{limit}` unfilled in a plan. Real; fixed in follow-up PR #15 (`otto/v2-2-empty-arg-default`, auto-merge armed, 88/88 + 1 case) — not a re-open of this plate.
Review lesson (captain, in the door): a 15-file diff is not a review surface. The pass ask must be the decisions only — here three — with the rest named as test-gated. Bind into the DEBRIEF genre / reviewability practice.
