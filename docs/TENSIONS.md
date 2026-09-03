# TENSIONS (open)
- T1 **Token-as-bearer unproven.** SPEC assumes DCS OAuth tokens authorize `/api/v1`.
  Gate 0 decides. If false: re-plan, not PAT.
- T2 **`execute` breadth vs. authz parity.** Passthrough trusts DCS to enforce
  permissions. Holds for reads; v2 writes need mirrored confirmations.
- T3 **Rulings not in canon.** "CF library, never hand-rolled" and "3–4 tools" were
  chat/journal rulings until klappy.dev#315 / kitchen#67. Until merged, this repo cites PRs.
- T4 **oddkit URI case.** `klappy://docs/templates/prd-template` 404s; file is
  `PRD_TEMPLATE.md`. Resolver or file needs a rename. (Observed 2026-09-02.)
- T5 **Templates not yet cut.** This doc set is freehand against the 2026-09-02 meeting
  list; the baseline templates will be extracted from it (captain ruling, option 2).
- T6 **`fields` is a projection, not semantics — hold the line.** The moment someone asks
  for `fields` to understand USFM or TSV, that is translation-helps-mcp's job. Retract `fields`
  before letting it grow.
- T7 **Client secret transited chat** (2026-09-02, captain's call, option 1). Rotate after gate 0;
  until then the transcript is a copy. Screenshot may also have clipped the value — gate 0 tells.
- T8 **Resources/prompts vs. the ceiling.** MCP resources and prompts are not tools, so they sit
  outside the four-tool cap. If canon later counts them, the boarding pass moves into `docs()` only.
- T9 **Single-env DO worker vs. `per-environment-worker-projects`.** `McpAgent` is a Durable Object; canon
  says DO-backed workers get separate dev/staging/prod projects. Gate 0 deploys one `door43-mcp`. Decide before gate 1.
- T10 **Door without a deploy credential.** GitHub-write + no CF token = a door that can build but not fly
  (same shape as the 2026-08-31 read-only-door finding). Either seats carry a scoped 1h CF token, or deploy rides
  Workers Builds on push. (Observed 2026-09-02.)
- T11 **Convention cited as merged, file says proposed.** `health-code/mcp-server-build-convention.md` L3 still reads
  `Status: proposed`; it is on kitchen main. Recut the header or the citations.
