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
