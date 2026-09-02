# door43-mcp — Plan

| Gate | Work | Done-means | Owner |
|---|---|---|---|
| 0 | **Spike**: register OAuth app (HUMAN-ONLY), minimal worker, login, `GET /api/v1/user` | 200 with login name, screenshot in PR | Otto |
| 1 | `execute` GET + response cap + refresh-on-401 | Acceptance 2, 3, 5, 7-shape | Otto |
| 2 | `docs` live swagger + oddkit proxy | Acceptance 4 | Otto |
| 3 | `telemetry` + Analytics Engine binding | Acceptance 6 | Otto |
| 4 | README/DEPLOY, second-deploy rehearsal on `qa.door43.org` | Acceptance 7 | Otto + uW |
| 5 | Directory-listing gauntlet (optional, public) | Listing submitted | captain |

HUMAN-ONLY: gate 0 registration + secrets; gate 5 listing account.
Challenge (`oddkit_challenge`, planning) re-run after gate 0 with the spike result.
Validation: external validator reads SPEC boundaries against `tools/list` and one
transcript of journey 2.
