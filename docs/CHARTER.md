# door43-mcp — Charter

Status: proposed 2026-09-02 (CoS door, captain-directed). Ratifies on captain merge.

## Why
git.door43.org (DCS) holds the open-licensed Bible translation corpus. Agents reach it
today through hand-rolled fetchers or generic Gitea wrappers that know nothing of the
catalog. One remote MCP server gives any agent the whole DCS API, as the logged-in
user, through three tools.

## What (one line)
A Cloudflare Worker MCP server: `docs` · `execute` · `telemetry`, per-user Door43 login,
routing every call to `https://<D43_HOST>/api/v1`.

## Who
- Deployment 1: klappy — `door43.klappy.dev`.
- Deployment 2: unfoldingWord — their host, their OAuth app registration.
- Users: anyone with a Door43 account; consumers include BT Servant V3, cartographer,
  Servant Bible standard adopters.

## Not-goals (v1)
- Not a verse-level helps aggregator (that is `unfoldingWord/translation-helps-mcp`).
- Not a multi-host broker; one `D43_HOST` per deployment.
- Not a write surface; mutating verbs are v2, gated.
- Not a token store users paste into.

## Success
A blank agent with only this connector can log in, read the live API reference, search
the catalog, and fetch a release-pinned archive URL — in one session, no human help.

## Governs
`klappy://canon/constraints/mcp-tool-surface-ceiling` (L1, PR klappy.dev#315) and
`klappy/kitchen` `health-code/mcp-server-build-convention.md` (L4, PR kitchen#67).
