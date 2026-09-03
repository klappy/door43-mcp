# door43-mcp — Plan

| Gate | Work | Done-means | Owner |
|---|---|---|---|
| 0 | **Spike**: register OAuth app (HUMAN-ONLY), minimal worker, login, `GET /api/v1/user` | 200 with login name, screenshot in PR | Otto |
| 0 · observed 2026-09-02 | Scaffold on branch `gate0-oauth-spike` (draft PR). Typecheck clean. Local `wrangler dev`: `/health` 200 (upstream `1.27.2+dcs`), `/mcp` unauth 401, AS metadata served. **Not observed:** `/register`→`/authorize` redirect, DCS round-trip, `GET /api/v1/user` status, header shape (`token` coded, unverified), token TTL. **Deploy blocked:** cooking door had GitHub write but no Cloudflare credential (no `CLOUDFLARE_API_TOKEN`; token-mint API 9109; no Workers Builds). Route `door43.klappy.dev` absent on CF (first `wrangler deploy` creates it via `custom_domain`, else HUMAN-ONLY). KV `door43-mcp-oauth` created. | gate 0 stays open | Otto |
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
