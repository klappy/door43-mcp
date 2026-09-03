# door43-mcp — Plan

| Gate | Work | Done-means | Owner |
|---|---|---|---|
| 0 | **Spike**: register OAuth app (HUMAN-ONLY), minimal worker, login, `GET /api/v1/user` | 200 with login name, screenshot in PR | Otto |
| 0 · **observed 2026-09-03T01:47:36Z** | **Gate 0 open→proven.** On `door43.klappy.dev` (main `1ba92e9`, build `6935df60`, deploy by push): DCS consent (`openid profile email`) → `/callback` → token exchange OK → `GET /api/v1/user` with **`Authorization: token <access>` → 200** `application/json`, **login `klappy`**, `expires_in 3600s`, refresh token present, `token_type bearer`, upstream 313 ms. T1 resolved: DCS OAuth tokens authorize `/api/v1`. Blockers on the way: `D43_CLIENT_SECRET` stored without its `gto_` prefix (40 vs 44 chars, `unauthorized_client`) — reset by API 01:36Z; userinfo path returned HTML, replaced by the `/api/v1/user` observation. Not observed: `whoami` via `/mcp` (client code not exchanged yet) — same call, same header, behind the provider. Prod deploy history: 01:12Z API upload (bootstrap exception, stub), then every deploy by push. | 200 + login `klappy` observed; screenshot in PR | Otto |
| 1a | `execute` GET + envelope + refresh-on-401 + teaching errors | Acceptance 2, 3, 5, 11 | Otto |
| 1b | `fields` projection + cap + `continue`/`next` | Acceptance 9, 10 | Otto |
| 2 | `docs` ladder L0–L3 + recipes + boarding-pass resource | Acceptance 4, 8 | Otto |
| 3 | `telemetry` + Analytics Engine binding | Acceptance 6 | Otto |
| 4 | README/DEPLOY, second-deploy rehearsal on `qa.door43.org` | Acceptance 7 | Otto + uW |
| 5 | Directory-listing gauntlet (optional, public) | Listing submitted | captain |

Observed 2026-09-02: OAuth app registered (client id `4d2afcd1-…`), Worker `door43-mcp`
exists with three secrets + `D43_HOST`; secret to be rotated after gate 0 (transcript exposure).
HUMAN-ONLY: gate 5 listing account; secret rotation after the full build is proven (captain ruling 2026-09-03; `D43_CLIENT_SECRET` transited chat twice).
Challenge (`oddkit_challenge`, planning) re-run after gate 0 with the spike result.
Validation: external validator reads SPEC boundaries against `tools/list` and one
transcript of journey 2.
