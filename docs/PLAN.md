# door43-mcp — Plan

| Gate | Work | Done-means | Owner |
|---|---|---|---|
| 0 | **Spike**: register OAuth app (HUMAN-ONLY), minimal worker, login, `GET /api/v1/user` | 200 with login name, screenshot in PR | Otto |
| 0 · observed 2026-09-03 | **Build green** — Workers Builds `5490c87a` on `bb0efae`, version `66df4da0`, alias `gate0-oauth-spike`. Fixes on the way: `.npmrc legacy-peer-deps` (npm ci mismatch), DO migration `v1` applied by API (versions upload rejects migrations, CF 10211), one transient CF API reset. **Preview URL does not exist:** every version reports `has_preview:false` — CF issues no version previews for a Worker with a Durable Object binding (`McpAgent`). So `gate0-oauth-spike-door43-mcp.klappy.workers.dev` cannot host the DCS round-trip; path (a) is closed by observation. **Still blank:** login round-trip, `GET /api/v1/user` status/login, header shape, token TTL. Prod `door43.klappy.dev` = placeholder 503 + DO class. | gate 0 open; needs path (b) or a per-env Worker | Otto |
| 1a | `execute` GET + envelope + refresh-on-401 + teaching errors | Acceptance 2, 3, 5, 11 | Otto |
| 1b | `fields` projection + cap + `continue`/`next` | Acceptance 9, 10 | Otto |
| 2 | `docs` ladder L0–L3 + recipes + boarding-pass resource | Acceptance 4, 8 | Otto |
| 3 | `telemetry` + Analytics Engine binding | Acceptance 6 | Otto |
| 4 | README/DEPLOY, second-deploy rehearsal on `qa.door43.org` | Acceptance 7 | Otto + uW |
| 5 | Directory-listing gauntlet (optional, public) | Listing submitted | captain |

Observed 2026-09-02: OAuth app registered (client id `4d2afcd1-…`), Worker `door43-mcp`
exists with three secrets + `D43_HOST`; secret to be rotated after gate 0 (transcript exposure).
HUMAN-ONLY: gate 5 listing account; secret rotation after gate 0.
Challenge (`oddkit_challenge`, planning) re-run after gate 0 with the spike result.
Validation: external validator reads SPEC boundaries against `tools/list` and one
transcript of journey 2.
