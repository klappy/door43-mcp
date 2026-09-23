# TICKET — door43-mcp-gate0

**What this is:** Gate 0 of `klappy/door43-mcp` — the OAuth spike. Prove that a
Door43 (DCS) OAuth2 access token, obtained through `workers-oauth-provider`,
authorizes `GET /api/v1/user`. Everything downstream (execute, docs, telemetry)
rests on this one observation.
**Why now:** Planning set landed on `door43-mcp` main `c97f0cd` (2026-09-02).
SPEC §Auth flow names gate 0 as a STOP condition. Captain is registering the
OAuth app tonight; secrets arrive as Worker secrets.
**Your move:** Scaffold the Worker now; run the final round-trip when secrets land.
Draft PR on `door43-mcp`. Show the `GET /api/v1/user` response body (login field)
in the door, not a PR page.

Ordered: 2026-09-02 ET (CoS door)
Plate: klappy / Chris Klapp

Class: build/spike. Risk: LOW (read-only upstream; no user data stored beyond the grant).
Station: single dish. Owner: Otto (infra seat).
Promise: set at fire. Depends: HUMAN-ONLY — captain's OAuth app registration
(`door43-mcp`, redirect `https://door43.klappy.dev/callback`) + three Worker secrets.

Authority:
- Captain, 2026-09-02 CoS door: "we always use CF mcp library not hand rolled …
  3-4 tool surface max … tools are docs, execute, telemetry … We connect the user
  to login to their D43 account."
- Canon (proposed, cite until merged): klappy.dev#315 `mcp-tool-surface-ceiling`;
  kitchen#67 `health-code/mcp-server-build-convention.md`.

Ingredients (fetch live; do not paste bodies):
- `klappy/door43-mcp` main `c97f0cd`: `docs/SPEC.md` (§Stack, §Auth flow, §Config),
  `docs/PLAN.md` gate 0 row, `docs/SECURITY.md`.
- DCS OIDC discovery `https://git.door43.org/.well-known/openid-configuration`
  (observed 2026-09-02: PKCE S256, refresh_token, no dynamic registration).
- `@cloudflare/workers-oauth-provider` README; `agents` `McpAgent` docs (Cloudflare).
- Sibling specimen for shape only: `klappy/bee-ai-auth-mcp` (Worker + OAuth provider).

Declared product:
1. `wrangler.toml`, `src/index.ts`: `McpAgent` behind `OAuthProvider`, upstream =
   DCS OIDC, `D43_HOST` var, three secret bindings, KV for grants.
2. One tool only for the spike: `whoami` → `GET /api/v1/user` with
   `Authorization: token <access>`. (Deleted before gate 1; `execute` replaces it.)
3. Observed result recorded in `docs/PLAN.md` gate 0 row: HTTP status + login field,
   header shape that worked (`token` vs `Bearer`), token TTL as observed.
4. If 401/403: STOP. Record exactly what DCS returned. Do not fall back to PAT.
   Open a tension on `door43-mcp` (T1) with the evidence; captain re-plans.

Done-means:
- Login button → DCS consent → back to client; `whoami` returns the captain's login.
- Screenshot or response body shown in the door.
- Draft PR on `door43-mcp`, not merged. Cites #315/#67 (or their merged URIs).
- `docs/PLAN.md` gate 0 row filled with observed values.

Not this plate:
- No `execute`, `docs`, or `telemetry` tools. No response caps. No uW deployment.
- No PAT path. No localhost-only proof — must run on `door43.klappy.dev`.

## Failure Modes — What Breaks When This OAuth Spike Is Violated
- Secrets in repo, log, or URL.
- Hand-rolled JSON-RPC or transport "to save time."
- Gate declared green from a `Bearer` guess without observing the response.

## Required Response When Detected
- Stop, rotate (captain deletes + recreates app), redo.
- Stop; that is the ruling this plate exists to obey.
- Stop; observe.

---
Plated 2026-09-02 (ET). Proven 2026-09-03T01:47:36Z on `door43.klappy.dev`:
`GET /api/v1/user` → 200, login `klappy`, `Authorization: token`, TTL 3600 s,
refresh present. Record: `klappy/door43-mcp` main `8c3d813` `docs/PLAN.md` row 0
(PR #2 scaffold, PR #3 row). Deviations from order: "draft, not merged" waived by
CoS ruling on #2 (prod already ran the branch via the 01:12Z bootstrap upload);
CHECKLIST-RUN never written at order time (CoS miss, named in gate1's run).
