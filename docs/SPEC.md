# door43-mcp — Spec v1

## What the server knows
- The logged-in user's identity and OAuth grant (access + refresh), per user.
- Its one upstream host (`D43_HOST`) and the live API reference at `/swagger.v1.json`.
- Its own telemetry.

## What the server does NOT know
- Any other user's grant. Any host but its own. Verse/resource semantics (USFM, TSV
  shapes) — those are the caller's or translation-helps-mcp's.

## What this server is NOT
- Not a helps aggregator. Not a multi-host broker. Not a token vault. Not a write
  surface (v1). Not a cache of DCS content.

## Stack
Cloudflare Workers · `agents` (`McpAgent`) · `@cloudflare/workers-oauth-provider`
(upstream = DCS OIDC) · D1 (`TELEMETRY_DB`, exact telemetry) · KV for the provider's grant store.

## Tools

All three share one **response envelope** (Design §3):
```json
{ "observed_at": "ISO-8601", "upstream": { "host": "git.door43.org", "version": "1.27.2+dcs" },
  "request": { "tool": "execute", "method": "GET", "path": "/api/v1/…", "query": {}, "fields": [] },
  "status": 200, "body": {}, "truncated": false,
  "next": null | { "method": "GET", "path": "…", "query": { "page": 2 } },
  "continue": null | { "…same shape, resumes a truncated body…" },
  "hints": [ "one-line, factual, optional" ],
  "cost": { "bytes": 0, "tokens_est": 0, "upstream_ms": 0 } }
```
`next` is derived from upstream `Link` / `X-Total-Count` and pre-formed as an execute call.

### `docs({ rung?, path?, query?, recipe? })`
- No args → **L0 boarding pass** (≤ 2 KB): server version, upstream host+version+observed_at,
  auth state (`logged_in_as` or `login_url`), the three contracts, domain map, journeys.
- `rung: "map"` → L1 map: `catalog`, `repos`, `user`, `users`, `orgs`, `misc` — count + one line + three most-used paths each.
- `path: "/catalog/search"` → L2: that path's params, response shape, one example call.
- `rung: "raw", path` → L3 raw swagger fragment, verbatim.
- `query` → lexical match over path names + summaries (BM25), returns L2 stubs.
- `recipe: "whoami" | "catalog-by-language" | "latest-release-zip" | "repo-tree-at-ref" | "page-through"` → filled execute calls in order (ticket 2026-09-02-door43-mcp-gate2-3 names the five).
- `docs` never calls DCS except for the swagger fetch; the pass makes no upstream call at all.
- Swagger fetched from `https://<D43_HOST>/swagger.v1.json`, ETag-cached, TTL 1h. Canon proxy
  via oddkit when `query` starts with `canon:`.

### `execute({ method, path, query?, fields?, headers? })`
- `method ∈ {GET, HEAD}` in v1; others → 405, body names v2.
- `path`: `/api/v1/…`, or `/{owner}/{repo}/archive/{ref}.zip` (HEAD only → resolved URL in `body.url`).
- `fields`: array of JSON paths (`"release.tag_name"`, `"[].full_name"`) applied to the body after
  upstream returns; deterministic; unknown paths yield `null`, never error.
- Forwards `Authorization: token <access>`; on 401 refreshes once and retries; if still 401,
  `status: 401`, `hints: ["grant expired; re-login at <url>"]`.
- `User-Agent: door43-mcp/<ver> (+https://door43.klappy.dev; consumer=<label>)`.
- Body cap 200 KB **after** `fields`; over cap → `truncated: true` + `continue` payload
  (page/range) — never a silent cut.
- 404 → `hints` lists up to 3 nearest documented paths from the swagger index.

### `telemetry({ sql })`
Read-only SQL against D1 `door43mcp_telemetry` (exact channel; AE sampled channel is T12).
Single `SELECT`, no `;`, no mutating/admin keyword → else `400` envelope and nothing runs.
Columns (`src/telemetry/schema.sql`): `timestamp, event_type, method, tool_name, consumer_label,
consumer_source, worker_version, status, upstream_status, upstream_ms, path_family (/repos|/catalog|
/user|other), duration_ms, bytes_in, bytes_out, tokens_in, tokens_out, cache_hits, cache_lookups,
truncated, count`. No user id, no full path, no query string.

## MCP resources & prompts (not tools; ceiling untouched)
Not shipped in v1 (T8, resolved by observation: the connector UI shows tools only). The boarding
pass lives in `docs()`; `AGENTS.md` is its repo twin. Resources/prompts return when a client shows them.

## Endpoints
`/mcp` (streamable HTTP) · `/authorize`, `/callback`, `/token` (provider) · `/health`
(upstream reachability + version, public, no auth).

## Auth flow
1. `/authorize` (provider) → redirect to `https://<D43_HOST>/login/oauth/authorize`
   with PKCE S256, scopes `openid profile email`.
2. `/callback` ← code → `https://<D43_HOST>/login/oauth/access_token` → store grant
   (encrypted with `COOKIE_ENCRYPTION_KEY`) under the user's `sub`.
3. Gate 0 (spike): access token as `Authorization: token …` on `GET /api/v1/user`
   must return 200. If DCS OAuth tokens do not authorize the API, STOP and re-plan
   (fallback is not PAT paste; it is a ticket).

## Config
Secrets: `D43_CLIENT_ID`, `D43_CLIENT_SECRET`, `COOKIE_ENCRYPTION_KEY`.
Vars: `D43_HOST` (default `git.door43.org`), `CONSUMER_LABEL_SOURCE`.

## Observed facts this spec rests on (2026-09-02)
DCS `1.27.2+dcs`; 323 swagger paths (173 `/repos`, 11 `/catalog`); OIDC discovery
present, no dynamic client registration; `AuthorizationHeaderToken` in security schemes.

---

# v2 (DRAFT — proposed by `2026-09-02-door43-mcp-v2-planning`; nothing below is built)

Everything above this line is v1 and is what `door43.klappy.dev` runs. Everything below is
the driver's-seat pass (`docs/DELTA.md`) written as contracts. Gates and order: `docs/PLAN.md`
§v2. Three read tools remain as they are; one fourth tool (`mutate`) is admitted with a written reason (§`mutate`); every other addition is a parameter, an envelope field, or a recipe.

## Vodka boundaries, v2

**Knows, additionally:** recipe plans (`args`, templates, bounds); the swagger it read
(`version`, `etag`, `observed_at`); the pin a ref resolved to *when the upstream said so*;
how to seal and verify a token it will not remember (`continue`, `confirm`).

**Does NOT know:** your session. What you fetched, what you spent, what you pinned lives in
your envelopes and in `telemetry` — never in the Durable Object, which holds the grant only.
Other users. Other hosts. Resource semantics (T6).

**Is NOT:** a workflow engine (recipes are ≤ 5 straight-line steps, no branching, no jobs —
P0005 is the line: anything that needs a job id is not a recipe); a cache of DCS content
(conditional reads, not copies); a second host; a fifth tool.

## Envelope additions (keys unchanged; objects grow)

```json
"upstream": { "host": "…", "version": "…",
  "swagger":   { "version": "1.27.2+dcs", "etag": "…", "observed_at": "ISO" },   // docs L1–L3, and any execute that read the index
  "etag":      "W/\"…\"" | null,                                                // execute 200/304 when DCS sent one
  "ratelimit": { "remaining": 0, "reset": "ISO" } | null }                      // when DCS sent x-ratelimit-*
```
- `next.query` keeps the caller's value types (number stays number). Same for `continue`.
- `status: 304` is a first-class answer: `body: null`, `cost.bytes: 0`, hint `unchanged since <etag>`.
- Multi-step and hand-off shapes ride in `body` until L1 rules where they live (T15):
  `body.steps[]` (each an envelope), `body.plan`, `body.estimate`, `body.handoff`.

## `docs` v2 — `{ rung?, path?, query?, recipe?, args?, detail?, fields? }`
- `path` L2 returns **compact** by default: `params[]` as `name*:type` strings (* = required; `in`
  implicit — objects cost ~1.9 KB on `/catalog/search` alone, over the 2 KB line; v2.1 recut);
  `response_keys[]` **complete** (never elided); `quirks[]`; `v2` verbs present upstream.
  `detail:"full"` adds descriptions and the 4xx responses. `fields` projects the L2/L3 body
  with the same code `execute` uses.
- `recipe` returns the **filled plan** when `args` is given: `{recipe, about, args{…resolved},
  calls[], handoff?}`; templates `{owner}`, `{repo}`, `{ref}`, `{path}` filled in path and
  query; a missing required arg → `400` naming it, with the arg's `about`.
- `docs({rung:"recipes"})` → every recipe's `about` and `args` schema, no calls. `docs()` L0 lists
  recipe names and the `upstream.swagger` pin.
- Recipes v2: v1's five, plus `map-this-release` (catalog entry → `commit_sha` + `zipball_url`
  → cartographer hand-off), `read-file-at-pin` (`/repos/{owner}/{repo}/contents/{path}?ref={sha}`),
  `my-spend` (a `telemetry` call: bytes and calls for this `consumer_label` since `{since}`).

## `execute` v2 — `{ method, path, query?, fields?, headers?, continue?, pin?, recipe?, args?, dry_run?, confirm?, body? }`
- **One call** (v1 shape) unchanged. Adds `pin:{sha}` on `/repos/*` and archive paths: the
  server sets `ref=<sha>` (query) or `{ref}` (path) to the sha; the echoed `request` shows the
  rewrite; no upstream call is spent to obtain a sha.
- **Recipe run:** `{recipe, args}` runs the filled plan in order as the user. Answer: `status`
  = the last step's status (or the failing step's), `body.steps[]` = one envelope per step in
  order, `body.handoff` if the recipe ends in one, `cost` = the sum. Bounds: ≤ 5 steps; 200 KB
  total after projection; on a step ≥ 400 or the cap, stop — `truncated:true`, `continue` =
  `{recipe, args, from:<k>, …}` pre-formed. One telemetry row per step, plus one for the run
  (`event_type: recipe_run`, `path_family: other`).
- **`dry_run:true`:** the filled plan and `body.estimate` — `{bytes, calls, basis}` where
  `basis` names the source (`"telemetry p50 bytes_out by path_family, last 30d, this host"`)
  or `estimate:null` with `basis:"no history"`. **Zero upstream fetches** (test asserts).
- **Teaching on 200** (rule: never an extra upstream call): `fields` naming a key the swagger's
  response schema lacks → hint; `ref` that is a branch name → hint "moving ref; pin with
  `pin:{sha}`"; `x-total-count` and `ratelimit` surfaced; etag surfaced.
- **No writes in `execute`, ever.** It stays `readOnlyHint: true` and its annotation stays true.

## `mutate` v2 — the fourth tool (named exception to the ceiling; captain ruling 2026-09-03)
`{ method: POST|PUT|PATCH|DELETE, path, query?, body?, headers?, fields? }` → the same envelope.
Annotations: `readOnlyHint:false, destructiveHint:true, idempotentHint:false, openWorldHint:true`.
Registered only when the grant carries scope `dcs:write` (`scopesSupported: ["dcs:read","dcs:write"]`);
a read-only grant never lists it.

**Why `execute` cannot carry it (the written reason the ceiling requires):** MCP consent is
per tool, not per call — clients decide whether to ask the human from a tool's annotations, and
`execute` is declared read-only. A write inside `execute` either falsifies that annotation or
forces a server-side confirmation ritual (the 428/seal draft this replaced) to stand in for a
consent surface MCP does not have per call. OAuth scope is per tool for the same reason. The
mirrored confirmation convention §3 asks for is therefore the *client's* prompt on a
`destructiveHint` tool, backed by the server floor below. First fourth-tool exception in the
house; the ceiling's retraction clause counts a second server needing one as evidence, so this
is an exception, not a precedent.

**Server floor (never relies on the client):**
- Irreversible operations — repo delete/transfer, force operations, org/user deletion —
  **observed** from the swagger's operations, listed in `docs({rung:"map"})` under `refused[]`,
  test-pinned → `403`, 0 upstream fetches, hint naming the DCS UI (HUMAN-ONLY).
- Everything else runs as the user, once; DCS's own 4xx passes through (T2).
- Optional belt for clients that auto-approve: `confirm_required: true` (Worker var, default
  off) → destructive-but-undoable operations answer `428` + a pre-formed `mutate` call with a
  sealed `confirm` (AES-GCM, `COOKIE_ENCRYPTION_KEY`, bound to `{method, path, sha256(body),
  sub, exp ≤ 10 min}`, never stored). Off by default; the class list rides with `refused[]`.
- Telemetry: one row, `tool_name: mutate`, `path_family` only — never body, never path.

`tools/list` = 4 when the grant has `dcs:write`, 3 otherwise; `docs()` cites this section as
the fourth tool's reason (ceiling VERIFICATION).

## `telemetry` v2
- No session column, ever (T13). Adds `event_type: recipe_run` and `consumer_source`
  values `query` \| `grant` \| `none` (ladder, T18).
- `?consumer=<label>` on the MCP URL sets `consumer_label` with `consumer_source: query`;
  absent → grant login with `grant`. Both are transparent self-declarations except `grant`,
  which DCS verified.

## MCP resources & prompts
Unchanged (T8): none until a client shows them.

## Observed facts v2 rests on (2026-09-03, planning pass)
`/catalog/search` entries carry `commit_sha` and `zipball_url` (swagger `CatalogEntry`; L2 hid
them past 12 keys). `next` on the same call echoed `limit:"3"`. L2 for that path is 5,731 bytes.
DCS sends `Link`, `x-total-count`; `x-ratelimit-*` and `etag` presence to be observed at v2.2
fire. `src/seal.ts` already seals the PKCE verifier with `COOKIE_ENCRYPTION_KEY`.
