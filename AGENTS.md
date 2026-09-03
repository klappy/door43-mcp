# AGENTS.md — boarding pass for this repo

You are an agent. Read this, then go straight to work. Same shape as `docs()` on the
live server: identity → state → contracts → map → journeys.

## Identity
`klappy/door43-mcp` — Cloudflare Worker MCP server fronting a DCS/Gitea host as the
logged-in user. Three tools. Governed by `klappy://canon/constraints/mcp-tool-surface-ceiling`
(klappy.dev#315) and `klappy/kitchen` `health-code/mcp-server-build-convention.md` (kitchen#67).

## State (authoritative here, in this order)
1. `docs/PLAN.md` — which gate is open, with observed values. **This is the resume point.**
2. `docs/TENSIONS.md` — what is unresolved. Read before proposing anything.
3. `docs/SPEC.md` — the contracts. Build only what it says.
Everything else (CHARTER, PRD, DESIGN, SECURITY, DEPLOY, BORROW-EVALUATION) is why/who.

## Contracts in one glance
- `docs({ rung?, path?, query?, recipe?, args?, detail?, fields? })` → boarding pass (no args) / `rung:"map"` / `path` / `rung:"raw"` / `query` / `rung:"recipes"` / `recipe`+`args` (the filled plan).
- `execute({ method, path, query?, fields?, headers?, continue?, pin? })` → envelope (below). GET/HEAD in v1. `pin:{sha}` rewrites the ref to a sha you already hold.
- `execute({ recipe, args, dry_run:true })` → `body.plan` + `body.estimate{bytes,calls,basis}`, zero upstream fetches.
- `telemetry({ sql })` → rows from D1 `door43mcp_telemetry` (exact channel). SELECT only.
- Every response: `{ observed_at, upstream, request, status, body, truncated, next, hints, cost }`.

## Map of the upstream (DCS 1.27.2+dcs, observed 2026-09-02)
`/catalog/*` (11 paths — search, entry, metadata, validation, lists) ·
`/repos/*` (173 — contents, releases, tags, git/trees) · `/user`, `/users`, `/orgs` ·
`/{owner}/{repo}/archive/{ref}.zip` (HEAD → resolved URL).

## Journeys (run these; do not improvise)
1. `execute GET /user` — who am I.
2. `docs({recipe:"latest-release-zip", args:{owner:"unfoldingWord", repo:"en_ult"}})` → a filled call that returns `zipball_url` (also: whoami · catalog-by-language · repo-tree-at-ref · page-through · read-file-at-pin; `docs({rung:"recipes"})` lists their args). Price it first: `execute({recipe, args, dry_run:true})`.
3. `execute GET /repos/{o}/{r}/contents/{p}?ref={tag}` with `fields:["content","sha"]`.
4. Deploy your own: `docs/DEPLOY.md`.

## Rules of the road
- Observe, then claim. `observed_at` on everything you report.
- Never widen the tool surface. New capability = a `docs` recipe or an `execute` path.
- Secrets never in repo, logs, URLs, or chat. Rotate on any doubt.
- Tension found → `docs/TENSIONS.md` + GitHub issue, tagged per `docs/OWNERS.md`.
