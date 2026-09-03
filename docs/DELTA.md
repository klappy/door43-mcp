# DELTA — driver's-seat pass, v1 → v2 (draft)

Receipt for `klappy/kitchen` `rail/…/2026-09-02-door43-mcp-v2-planning`. Pass run
2026-09-03T03:53Z–04:2xZ (2026-09-02 late night ET) by the planning seat on main
`8e8d484` (0.3.1). Prompt: `2026-09-02-driver-seat-pass-policy/TICKET.md`, verbatim.
The pass drove the live server as the agent before it wrote anything; the calls it
made are listed at the end. Nothing here is built. `src/` is untouched.

## The tower — the system as one thing (≤ 300 words)

An agent touches exactly four shapes here, and every tool speaks all four:

1. **The envelope.** Every answer is `{observed_at, upstream, request, status, body,
   truncated, next, continue, hints, cost}` — the only thing the agent reads; a dead
   session resumes from its last one.
2. **The call.** Anything the server wants the agent to do next is a *pre-formed call*
   — `next`, `continue`, a recipe step, a hand-off — never a cursor, never prose. A call
   the agent can paste is one it cannot get wrong. In v2 a call may name a sibling
   server (`handoff`); a list of calls is a *plan*.
3. **The pin.** Every answer says what it testifies about: the swagger it read
   (`upstream.swagger`), the sha a ref resolved to when the upstream already said so.
   A pin rides forward in the call so a later call cannot drift; the server never spends
   a fetch to mint one (seed 2).
4. **The tally.** `cost` on the envelope equals the telemetry row for the same call.
   "What did I spend" is a `telemetry` SELECT, not a feeling.

One ladder: **orient → plan → run → resume.** `docs()` orients. `docs({recipe, args})`
returns a plan. `execute({…, dry_run})` prices it without spending. `execute({recipe,
args})` runs it — per-step envelopes, one summed tally, a failed step returns the rest as
`continue`. `execute({method, path})` is a one-step plan.

State lives in three places: the client's envelopes, sealed tokens the server mints
and forgets (`continue`, `confirm`), and the Durable Object, which holds the
grant and nothing about the session (T13). Three read tools plus one write tool (`mutate`, the named
whole surface; breadth lives in parameters and in `docs`, per the ceiling.

Across the house the four shapes are the shared grammar; each server fills them from its
own upstream. That grammar is L1 work — named below, not written here.

## Seeds — disposition, one reason each

| # | Seed | Verdict | Reason |
|---|---|---|---|
| 1 | Session map in `docs()` (fetched, pinned, cost so far) carried in the `continue` token | **Reject as specified; accept derived** | A per-session map is server state or an unbounded token — `continue` is per-truncation, not per-session, and grows with every call. The parts that matter are already derivable: cost so far = `telemetry` SELECT by `consumer_label` over a time window (v2.7 documents it as a recipe); "what's pinned" is seed 2. |
| 2 | Pin-first: envelopes carry the ref/sha resolved against; `execute` accepts `pin:` | **Accept, narrowed** | Pin only where the upstream already returns a sha (`/catalog/*` `commit_sha`, `git/refs`, releases → `target_commitish` is a branch, not a sha). Never spend an upstream call to mint a pin. `upstream.swagger{version,etag,observed_at}` is the docs-side pin. `pin` on `/repos/*` rewrites `ref` to the sha in the echoed request. (v2.3) |
| 3 | Executable recipes: `execute({recipe,args})` → plan + per-step envelopes + one cost line | **Accept, bounded** | One verb still; breadth in params (ceiling §3). Bounds: ≤ 5 steps, no branching, total cap 200 KB, a failed step stops and returns `continue` = the rest. P0005 (async-by-default) is the ceiling on duration — a recipe that would need a job id does not ship in v2. (v2.5) |
| 4 | `dry_run:true` → the plan and estimated bytes/pages before spending | **Accept** | Zero upstream calls. The estimate is a *named basis* (telemetry p50 `bytes_out` per `path_family` for this deployment), never a promise; absent history → `estimate: null` with the reason. (v2.4) |
| 5 | Teaching successes: hints on 200 | **Accept, with one rule** | A hint on 200 never costs an upstream call. Sources that are free: the response itself (`x-ratelimit-*`, `etag`, `link`), the swagger (a `fields` path that names a key the schema lacks), the request (a `ref` that is a branch name when a tag was probably meant). "A newer release exists" needs a fetch → only inside a recipe that already fetched it. (v2.2) |
| 6 | Hand-offs as resume points: `map-this-release` returns a cartographer `consult_repo` payload | **Accept** | A hand-off is a pre-formed call addressed to a sibling: `{server, url, tool, input, provenance}`. Cartographer's `zip_url` kind is honestly `unpinned`; door43 sends `commit_sha` beside it as provenance. Where it rides on the envelope is an L1 question (T15); until ruled it rides in `body.handoff`. (v2.6) |
| 7 | House shape identical across cartographer / oddkit / door43 / gitauth; name what L1 needs | **Accept as L1 proposals; not this repo** | Observed tonight: four servers, four shapes — cartographer answers carry `next` as prose and no `cost`; oddkit carries `server_time`/`assistant_text`/`debug`; gitauth carries flat `quota`. door43 is the first §7 envelope. The L1 items are listed below with target URIs; door43 ships nothing for its siblings. |

## What the seeds did not contain — added by the pass

| Added | Observed pinch | Where |
|---|---|---|
| **Complete `response_keys` on L2.** | `docs({path:"/catalog/search"})` lists 12 keys then `…`; `zipball_url` and `commit_sha` — the two keys the driver needed — were hidden. The pass selected them from memory, which is the failure the ladder exists to prevent. | v2.1 |
| **Compact L2 by default.** | The same call is 5,731 bytes, mostly parameter prose. Names + in + type + required first (`detail:"compact"`, default); prose behind `detail:"full"`. `fields` works on `docs` too — it is the same projection code. | v2.1 |
| **Typed `next`.** | The pre-formed `next` carried `limit:"3"`, `page:"2"` (strings) for a call made with numbers. Replay works; the call is still a lie-shaped echo. `next.query` keeps the input's types. | v2.2 |
| **Conditional reads.** | `if-none-match` is already forwarded; nothing surfaces the etag to send back. `upstream.etag` on 200; a 304 returns `status 304, body null, cost.bytes 0`, hint "unchanged". Free bytes on every re-read. | v2.2 |
| **Rate-limit tally.** | DCS sends `x-ratelimit-*`; the agent cannot see its budget. `upstream.ratelimit{remaining,reset}` when present. | v2.2 |
| **Path templates + `args`.** | Recipes hard-code `unfoldingWord/en_ult` and say "swap owner/repo". `args` fills `{owner}`/`{repo}`/`{ref}` in paths and queries; an unfilled template is a 400 that names the arg. Same grammar for a one-off `execute` call. | v2.4 |
| **Writes.** | PRD v2 parks "mutating verbs behind gates" without a shape. Pass draft 1: sealed `confirm` on every write inside `execute`; draft 2 (after the challenge): progressive protection. **Captain's ruling on reading the PR (2026-09-03): a fourth tool `mutate`** — MCP consent and OAuth scope are per tool, `execute` stays read-only and its annotation stays true, the client's `destructiveHint` prompt is the mirrored confirmation, the server floor is an observed `refused[]` list. The ceiling's written-reason clause is satisfied in SPEC §`mutate`. The seal survives as an off-by-default belt. | v2.8, T17 |
| **Consumer label ladder parity.** | `consumer_label` is the grant login (`consumer_source: grant`); oddkit/cartographer read `?consumer=`. Both, with the source named; the grant is verified, the query label is self-declared. | v2.7, T18 |

## Considered and rejected

- **A fourth tool for `recipe` or `plan`.** Ceiling. Breadth is `execute` params. (A fourth tool for *writes* was rejected by the pass and then admitted by captain ruling with the written reason the ceiling requires — see §Writes and T17; the distinction is consent surface, not breadth.)
- **Server-side session map** (DO storage keyed by session). The DO holds the grant only;
  a session ledger there is the state the ticket forbids and the thing that dies with the DO.
- **Session map inside `continue`.** Grows unbounded; a per-truncation token is not a session.
- **Minting a pin with an extra upstream call** (`git/refs/tags/{tag}` on every `/repos` call).
  Doubles upstream cost on the hot path; pin only what the upstream already said.
- **Refusing unknown `fields`.** T6 holds: unknown → `null`. v2.2 adds a *hint* from the swagger; the
  server still does not interpret.
- **Caching upstream content to make recipes cheap.** DESIGN "what we do not do"; conditional reads
  (etag) are the honest version.
- **Per-user host selection** (PRD v2 parked). Convention §4: one host per deployment; a second host is
  a second Worker.
- **MCP resources/prompts for the plan/hand-off.** T8 stands: no client surface for them today.
- **Pagination of L2 via `continue`.** Compact-by-default removes the need; `continue` stays an execute concern.

## Proposed L1 items (not written by this dish; target URIs)

| Target | What it would say | Today |
|---|---|---|
| `klappy://canon/patterns/house-envelope` | The resume-point envelope as L1: the ten keys, `upstream{host,version,swagger?,etag?,ratelimit?}`, tally = telemetry row. Convention §7 becomes the kitchen wire of it. | L4 only (kitchen §7); door43 is the sole instance |
| `klappy://canon/patterns/pre-formed-calls` | A call is `{server?, tool, input}`; `next`/`continue` are same-tool, `handoff` names a sibling, a plan is `calls[]`; never a raw cursor. | Implied by §7; hand-off shape unowned (T15) |
| `klappy://canon/patterns/recipe-grammar` | `{about, args{name:{required,default,about}}, calls[], handoff?}`; templates `{arg}` in path/query; `dry_run` semantics; bounds (steps, bytes, P0005). | door43 `RECIPES` constant; cartographer `docs {recipe}` prose |
| `klappy://canon/constraints/telemetry-semantic-columns` | The shared column set (oddkit = cartographer = door43) plus the consumer-label ladder (`query` \| `header` \| `client-info` \| `user-agent` \| `grant` \| `none`). | Three servers agree by copying; no L1 names the set |
| `klappy://canon/methods/driver-seat-pass` | The prompt and its place in the loop — the sibling ticket's product 1. | Verbatim in the kitchen ticket |

Kitchen (L4) amendments implied: convention §7 gains `handoff` and `steps[]`; §8 boarding
pass gains `pin` (swagger observed) and the recipe list. Not this dish.

## Calls the pass made as the user (the list gate 13 asks for)

`docs()` 1215 B · `docs({recipe:"latest-release-zip"})` 273 B ·
`execute GET /catalog/search {lang:en,stage:prod,limit:3} fields[full_name,branch_or_tag_name,zipball_url,owner]` 478 B, `next` typed as strings, `x-total-count 29` ·
`docs({path:"/catalog/search"})` 5731 B, `response_keys` truncated at 12 ·
`telemetry SELECT tool_name,status,COUNT(*),SUM(bytes_out),AVG(upstream_ms) GROUP BY 1,2` 385 B.
Every pinch above traces to one of these five.

## Challenge (`oddkit_challenge`, planning mode) — run after the pass


**Run 2026-09-03T04:01:50Z, mode planning.** Types matched: pattern-coinage, principle-extraction,
assumption, strong-claim, proposal, comparative-positioning. Prerequisites the challenge called
missing, answered here so the plan carries them:

- **Confidence.** Working belief, not fact: the four-shape tower and every v2 gate rest on one
  night's driving (five calls) plus the source at `8e8d484`. Treated as hypotheses; each gate's
  done-means is its test.
- **Prior art for the coinage.** *Envelope* = the HTTP response with HATEOAS affordances;
  *pre-formed call* = a HATEOAS link the client can follow without constructing it; *pin* =
  content addressing / `ETag` / cartographer's `pinned <sha>`; *tally* = cost accounting as
  cartographer/oddkit telemetry already do. The house names are shorthand, not new ideas; the
  L1 items should cite those lineages.
- **Cases.** Envelope + pre-formed calls: door43 (built), cartographer (`consult_repo` → `next`
  prose; partial), oddkit (`server_time`, no `next`), AMS (`next_after` cursors — the
  counter-case: raw cursors). Two instances and two half-instances; a pattern, not yet a
  principle. The L1 items are proposals for that reason.
- **Retraction re-check (2026-09-03T20:16Z, v2.3/v2.4 cook).** Seed 2 (pins without fetch): holds — no code path fetches `git/refs`; the condition (cartographer hand-offs drifting on stale `commit_sha`) cannot fire before v2.6 ships a hand-off, so it is re-checked there. Seed 4 (`dry_run`, named basis): holds — `basis` is a string on every answer; the live table has few `execute` rows today, so most dry runs answer `no history` until the host is used; that is the condition working, not failing.
- **Retraction conditions.** Compact-by-default L2 (v2.1): retract if an agent asks for
  `detail:"full"` on more than half of L2 calls in a week of telemetry. Pins without fetch
  (v2.3): retract if cartographer hand-offs still drift because `commit_sha` is stale vs the
  tag — then a `git/refs` fetch is worth its cost. Recipe bound of 5 (v2.5): retract upward only
  with a named recipe that needs 6 and a P0005 argument for why it is not a job. Progressive
  protection (v2.8): retract to confirm-everything if one reversible-class write proves not
  reversible in the DCS UI.
- **Alternatives considered.** Listed in §Considered and rejected; the strongest opposing view
  is "recipes are semantics" (T6) — answered by the bound (straight-line, no branching, no
  interpretation of bodies) and by the fact that a recipe is a list of the same calls the agent
  would make by hand.
- **Reversibility.** This dish: docs only, fully reversible. v2.8 when built: writes to DCS are
  the one-way door; the classification of operations is the point of no return and is why it
  must be observed from the swagger and tested, not typed from memory.
- **Disconfirmer for the whole plan.** If v2.1 lands and a fresh seat still selects fields from
  memory (telemetry shows `docs({path})` calls not preceding `fields` use), the ladder is not
  the bottleneck and the plan should pivot to teaching-on-200 first.

**The plan changed in response to one challenge.** The canon citation
`klappy://docs/planning/E0005_2-session-4-notes` — a two-step propose/commit on every write was
ritual; one action, progressive protection — flipped v2.8 from "sealed `confirm` on every
write" to **progressive protection**: reversible writes in one call, a sealed `confirm` only for
destructive-but-undoable operations, refusal for irreversible ones. SPEC §v2 `execute`, PLAN
v2.8, and T17 were recut accordingly. The other citations (mode discipline, seeded response,
substrate-becomes-the-wire) are already honored by the shape of this receipt and did not move
the plan.

## Captain's ruling on reading the PR — 2026-09-03 (~00:15 ET)

Writes move out of `execute` into a fourth tool, `mutate`, as a named exception to the ceiling.
Reason recorded in SPEC §`mutate`: MCP consent (`readOnlyHint`/`destructiveHint`) and OAuth scope
are per tool; a per-call confirmation surface does not exist, so the 428/seal draft was a server
standing in for the harness. One fourth tool, not one per class — five is the frame error. The
seal is kept only as an off-by-default belt. Open after the ruling: the observed `refused[]` list
(captain names it at taste) and whether v2.8 is dish 5 or its own meal. Done-means 5 of the ticket
("keeps `tools/list` at three") is superseded by this ruling: three under `dcs:read`, four under
`dcs:write`, the reason cited in `docs()`.
