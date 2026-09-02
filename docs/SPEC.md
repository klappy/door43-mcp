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
(upstream = DCS OIDC) · Analytics Engine · KV for the provider's grant store.

## Tools
### `docs({ query?, section? })`
Fetches `https://<D43_HOST>/swagger.v1.json` (cache TTL 1h, ETag), returns matching
paths/params/schemas for `query`; `section` narrows (e.g. `catalog`, `repos`). Also
proxies `oddkit` canon for `query` when asked (`docs-proxy-canon-as-tool`). Never bundles.

### `execute({ method, path, query?, headers? })`
- `method ∈ {GET, HEAD}` in v1; others → 405 with `"mutations land in v2"`.
- `path` must start with `/api/v1/` or be `/{owner}/{repo}/archive/{ref}.zip` (archive
  passthrough, HEAD only — returns the resolved URL, not bytes).
- Forwards `Authorization: token <user access token>`; refreshes on 401 once.
- Response: `{ status, headers: {content-type, x-total-count, link}, body, truncated }`.
  Body capped at 200 KB; `truncated: true` names the cap.

### `telemetry({ sql })`
Read-only SQL against `door43mcp_telemetry`. Columns: `event_type, tool_name, method,
path_prefix (first two segments only), status, consumer_label, duration_ms, bytes_out,
tokens_out, count`. No user id, no full path, no query string.

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
