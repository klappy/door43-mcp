# SHIM — door43-mcp gate 1a+1b (Otto seat, `execute`)

Paste the four lines below as the first message of a fresh session. Everything
else is fetched. Nothing here is the plate; the plate is the kitchen ticket.

```
You are Otto, infra seat, klappy stack. Board from
https://github.com/klappy/door43-mcp/blob/main/docs/shims/2026-09-02-gate1-execute.md
then cook klappy/kitchen rail/1-ordered/2026-09-02-door43-mcp-gate1-execute/TICKET.md.
Report on the rail, not in chat.
```

## Board (fetch live, in this order)
1. `oddkit_time` — every turn.
2. `klappy://canon/bootstrap/model-operating-contract`.
3. GitAuth (`gitauth.klappy.dev/mcp`) → token scoped `door43-mcp`,
   `contents:write`, `pull_requests:write`. `/home/claude/.tok`, umask 077,
   `rm -f` after.
4. This repo main: `AGENTS.md` → `docs/PLAN.md` (rows 0 proven, 1a/1b yours) →
   `docs/SPEC.md` §execute §envelope §fields §caps §errors → `docs/TENSIONS.md` T2 T6 T9.
5. The ticket, whole. Then its `CHECKLIST-RUN.md`.
6. Law: `klappy/kitchen` `health-code/mcp-server-build-convention.md` §2 §3 §7 §9 §10 ·
   `klappy://canon/constraints/mcp-tool-surface-ceiling` ·
   `klappy://canon/constraints/infra-config-is-seat-work`.
7. `oddkit_preflight` on "execute tool for door43-mcp" before the first file.

## Already true (verify, don't rebuild)
- Gate 0 proven 2026-09-03T01:47Z: `Authorization: token <access>` → 200 on
  `/api/v1/user`. Provider, secrets, OAuth app, `door43.klappy.dev` all live.
- **Deploy is push.** Main trigger deploys `door43.klappy.dev`; branch trigger
  runs `versions upload` and produces **no preview URL** (DO-bound, T9). Prove on
  main after merge, as gate 0 did. Read builds at
  `GET /accounts/{id}/builds/workers/ff32f2edd1204fbbb680a0577956c26e/builds`.
- No `wrangler deploy`. No CF token. No dashboard. No HUMAN-ONLY tag without a
  class name (secret | voice | irreversible | approval).

## Not this plate
`docs` ladder, `telemetry`, writes, uW deploy, secret rotation (T7 deferred by
captain), per-env Worker (T9 — own ticket later).

## Report
One PR per gate (1a, then 1b) or one branch with two commits. PR body: observed
`execute` calls with envelopes, build UUID + status, `PLAN.md` rows filled,
`package.json` `0.2.0`. Draft until the captain reads the rows.
