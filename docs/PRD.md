# door43-mcp — PRD v1

Status: proposed 2026-09-02. Cut for v1; new ideas go to v2.

## Users and jobs
| User | Job |
|---|---|
| Agent seat (CoS, Auggie, BT Servant worker) | Find a resource in the catalog, pin a release, fetch files, without knowing DCS URL shapes |
| Cartographer | Obtain a release-pinned archive URL to map via `zip_url` |
| uW operator | Deploy their own instance in under an hour with one HUMAN-ONLY step |
| DCS admin | See what the server does and does not do, and revoke it in one click |

## User journeys
1. **First connect.** User adds `https://door43.klappy.dev/mcp` → login button →
   git.door43.org OAuth consent → back in chat, `execute GET /user` returns them.
2. **Find and pin.** `docs("catalog search")` → `execute GET /catalog/search?subject=Bible&lang=en&stage=prod`
   → `execute GET /catalog/entry/{owner}/{repo}/{ref}` → archive URL → cartographer.
3. **Read a file.** `execute GET /repos/{owner}/{repo}/contents/{path}?ref={tag}`.
4. **Operator deploy.** Fork → register OAuth app → three secrets → `wrangler deploy` → journey 1 on their host.

## Requirements
- R1 Three tools only: `docs`, `execute`, `telemetry`. No fourth in v1.
- R2 `execute` v1 = `GET`/`HEAD` only; any `path` under `/api/v1/`; runs as the logged-in user.
- R3 `docs` serves the live `swagger.v1.json` (cached, TTL stated) + oddkit canon proxy.
- R4 Login via DCS OIDC (authorize/access_token, PKCE S256, refresh). No PATs.
- R5 Many users per deployment; grants stored per user; never shared.
- R6 `telemetry` = read-only SQL over `door43mcp_telemetry`; no user data columns.
- R7 Response cap on `execute` (bytes/tokens) with a truncation flag, never silent cuts.
- R8 One `D43_HOST` var; works against prod, qa, and dcs-local.

## Acceptance (agent-observable, per P0007)
1. `tools/list` returns exactly three tools.
2. Login round-trip completes; `execute GET /user` returns the user's login.
3. `execute GET /catalog/search?limit=1` returns a catalog entry.
4. `docs` returns the current DCS version string from the live swagger.
5. `execute POST ...` is refused with a message naming v2.
6. `telemetry` answers `SELECT tool_name, COUNT(*) ...` and refuses non-SELECT.
7. A second operator deploys from README alone; journey 1 succeeds on their host.

## v2 (parked)
Mutating verbs behind gates; irreversible actions HUMAN-ONLY; per-user host selection.
