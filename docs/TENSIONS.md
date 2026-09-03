# TENSIONS (open)
- T1 ~~Token-as-bearer unproven.~~ **Resolved 2026-09-03T01:47Z:** `Authorization: token <access>` on `GET /api/v1/user` → 200, login `klappy`, TTL 3600 s, refresh present.
- T2 **`execute` breadth vs. authz parity.** Passthrough trusts DCS to enforce
  permissions. Holds for reads; v2 writes need mirrored confirmations. **Observed 2026-09-03 (gate 1):** the edge allowlists method (GET/HEAD) and path shape (`/api/v1/…` or `/{o}/{r}/archive/{ref}.zip` HEAD-only); `?`, `#`, `..`, `//` in `path` → 400 with no upstream fetch (test asserts); forwarded headers are allow-listed (accept, accept-language, if-none-match, if-modified-since, range). Authz itself stays DCS's — every 4xx passes DCS's body through unchanged. Open for v2 as written.
- T3 **Rulings not in canon.** "CF library, never hand-rolled" and "3–4 tools" were
  chat/journal rulings until klappy.dev#315 / kitchen#67. Until merged, this repo cites PRs.
- T4 **oddkit URI case.** `klappy://docs/templates/prd-template` 404s; file is
  `PRD_TEMPLATE.md`. Resolver or file needs a rename. (Observed 2026-09-02.)
- T5 **Templates not yet cut.** This doc set is freehand against the 2026-09-02 meeting
  list; the baseline templates will be extracted from it (captain ruling, option 2).
- T6 **`fields` is a projection, not semantics — hold the line.** The moment someone asks
  for `fields` to understand USFM or TSV, that is translation-helps-mcp's job. Retract `fields`
  before letting it grow.
- T7 **Client secret transited chat twice** (2026-09-02; again 2026-09-03 to fix the clipped value — the Worker held it without the `gto_` prefix, 40/44 chars, DCS `unauthorized_client`). **Captain ruling 2026-09-03:** rotate once the whole server is built and proven (gate 4), not per gate. Until then the transcript is a copy; dashboard only when it happens.
- T8 **Resources/prompts vs. the ceiling.** MCP resources and prompts are not tools, so they sit
  outside the four-tool cap. If canon later counts them, the boarding pass moves into `docs()` only.
- T9 **Single-env DO worker vs. `per-environment-worker-projects`.** `McpAgent` is a Durable Object; canon
  says DO-backed workers get separate dev/staging/prod projects. Gate 0 deploys one `door43-mcp`. **Observed 2026-09-03:** CF issues no version preview for a DO-bound Worker (`has_preview:false` on every green build), so branch previews are structurally unavailable here. Decide now, not gate 1: (b) merge-to-main proves on prod, or a second Worker `door43-mcp-dev` per canon.
- T10 **Door without a deploy credential.** GitHub-write + no CF token = a door that can build but not fly
  (same shape as the 2026-08-31 read-only-door finding). Either seats carry a scoped 1h CF token, or deploy rides
  Workers Builds on push. (Observed 2026-09-02.)
- T11 ~~Convention cited as merged, file says proposed.~~ **Closed 2026-09-03.** Header recut in kitchen#69: `Status: law (merged 2026-09-02)`. Seat miss: read a stale zoom, not the head.
