# TICKET — door43-mcp-gate2-3-docs-telemetry

**What this is:** The other two tools. Gate 2: `docs` — the server explains
itself and DCS live, in a ladder from a 2 KB boarding pass down to raw swagger,
plus recipes. Gate 3: `telemetry` — the same numbers the maintainer sees,
SELECT-only. After this plate `door43-mcp` is the three-tool server the ceiling
describes, not a one-tool Worker.
**Why now:** Captain, 2026-09-02 ~22:30 ET, connector installed on his phone:
one tool showing, "this is janky… we need to finish this tonight." Gate 1
proved live from two seats at 02:31Z (`/user` → `klappy`, 96 ms; catalog
search projected, `next` populated).
**Your move:** Nothing until it plates. Then reconnect the connector and read
the three tools; call `docs()` with no arguments and read the boarding pass.

Class: entrée. Risk: STANDARD (no secrets; D1 already created; no law).
Station: subagent (fresh Otto seat; shim `docs/shims/2026-09-02-gate2-3.md`).
Owner: Otto. Promise: 4 h (R6).
Depends: none (gate 1 merged `ff3cd71`, proven live 2026-09-03T02:31Z).
Meal: door43-mcp.

Ingredients (fetch live):
- `klappy/door43-mcp` main — `docs/SPEC.md` §docs ladder (L0 boarding pass
  ≤2 KB → L1 map → L2 path → L3 raw swagger; `query`; `recipe`), §telemetry,
  `docs/PRD.md` acceptance 4, 6, 8; `docs/PLAN.md` rows 2, 3; `docs/TENSIONS.md`
  T8 (resources/prompts vs ceiling — resolve by observing what this app shows).
- Law: `klappy/kitchen` `health-code/mcp-server-build-convention.md` §2 (three
  tools; `docs` never executes; `telemetry` never writes), §8 (boarding pass),
  §10 (deploy is push); `klappy://canon/constraints/mcp-tool-surface-ceiling`
  VERIFICATION — **`docs()` must cite this URI**;
  `klappy://canon/constraints/infra-config-is-seat-work`.
- House prior art (gate 11) — copy the shape, not the code:
  `klappy/cartographer` `docs` (no args = capability index + policy topics;
  `{capability}` = schema; `{topic}` = policy verbatim) and its `telemetry`
  (two channels: **exact** = D1 table, no credential, `COUNT(*)` true;
  **sampled** = Analytics Engine, `SUM(_sample_interval)`, needs a CF read
  credential). `klappy/oddkit` `telemetry_public` column set (event_type,
  method, tool_name, consumer_label, consumer_source, duration_ms, bytes_in/
  out, tokens_in/out, cache_hits/lookups). door43 uses the same semantic
  columns plus `upstream_status`, `upstream_ms`, `path_family`
  (`/repos|/catalog|/user|other`). Never a raw path or query in telemetry.
- **Telemetry store, created by CoS 2026-09-03T02:32Z by API:** D1
  `door43mcp_telemetry` id `52fa8ea4-7774-4135-b160-f17bb41ac660` (ENAM).
  Bind in `wrangler.jsonc` as `TELEMETRY_DB`; push deploys it. Exact channel
  only in this plate; AE sampled channel is a follow-up (needs a credential
  the seat does not hold — name it HUMAN-ONLY(secret) in TENSIONS, do not cook).
- Upstream for `docs`: `https://git.door43.org/swagger.v1.json` fetched live
  with a 1 h cache; 323 paths observed 2026-09-02. Catalog entries carry
  `owner` as a **string**, not an object (observed 02:31Z: `data[].owner.login`
  → `null`) — the L2 path doc for `/catalog/search` must say so.
- What this app shows for a connector: tool name + description as the whole
  UI (captain screenshot 2026-09-02 22:29 ET). The three descriptions are
  therefore product copy: one line each, verb-first, ≤80 chars.

Declared product (on `klappy/door43-mcp`):
1. `src/tools/docs.ts` — `docs({rung?, path?, query?, recipe?})`:
   no args → L0 boarding pass (≤2 KB: what/what-not/is-not, three tools, cites
   `klappy://canon/constraints/mcp-tool-surface-ceiling` and
   `…/infra-config-is-seat-work`, `server.version`, `upstream.version`, login
   status); `rung:"map"` → L1 path families with counts; `path:"/catalog/search"`
   → L2 params/response/quirks (owner-is-string); `rung:"raw"` → L3 swagger
   slice by path; `query:"…"` → BM25 over summaries; `recipe:"…"` → 5 shipped
   recipes (whoami, catalog-by-language, latest-release-zip, repo-tree-at-ref,
   page-through).
2. `src/tools/telemetry.ts` — `telemetry({sql})`, SELECT-only (parser rejects
   anything else; no `;`, no `ATTACH`, no `PRAGMA`), against D1
   `door43mcp_telemetry`; every tool call writes one row via `ctx.waitUntil`.
3. `src/telemetry/schema.sql` — table + indexes; applied by a migration on
   first request (`CREATE TABLE IF NOT EXISTS`), not by hand.
4. `wrangler.jsonc` — `d1_databases: [{binding:"TELEMETRY_DB",
   database_name:"door43mcp_telemetry", database_id:"52fa8ea4-…"}]`.
5. Tool descriptions (the connector UI): `docs` "Explain this server and DCS —
   boarding pass, map, any path, recipes"; `execute` "Run one GET/HEAD against
   DCS as you, with a resume-point envelope"; `telemetry` "Read this server's
   own usage numbers (SELECT only)".
6. `docs/PLAN.md` rows 2, 3 observed; `docs/TENSIONS.md` T8 resolved by
   observation, new T12 (AE sampled channel needs credential); `package.json`
   `0.3.0`; `docs/TELEMETRY-POLICY.md` amended to name the D1 exact channel and
   the columns actually written.
7. Tests: boarding pass ≤2048 bytes and contains both URIs; `telemetry` rejects
   `INSERT`/`DROP`/`;`; a call to `execute` produces exactly one telemetry row;
   L2 for `/catalog/search` contains "owner is a string".

Done-means:
- The captain can reconnect the connector on his phone and observe three tools
  with the descriptions in product 5.
- A client can call `docs()` with no args and observe ≤2 KB containing both
  constraint URIs, `server.version: 0.3.0`, and `upstream.version: 1.27.2+dcs`.
- A client can call `docs({path:"/catalog/search"})` and observe the params,
  the response keys, and the sentence that `owner` is a string.
- A client can call `docs({recipe:"latest-release-zip"})` and observe an
  `execute` call it can paste that returns a `zipball_url`.
- A client can call `execute` once, then `telemetry({sql:"SELECT tool_name,
  COUNT(*) FROM door43mcp_telemetry GROUP BY 1"})` and observe the count
  incremented by one.
- A client can call `telemetry({sql:"DROP TABLE door43mcp_telemetry"})` and
  observe a `400` envelope and an unchanged count.
- A reader can grep `src/` for raw `path` or `query` values in the telemetry
  write and observe only `path_family`.

## Failure Modes — What Breaks When Docs Explain by Executing
- `docs` calls DCS to answer (docs becomes a second execute).
- Boarding pass grows past 2 KB — the connector shows a tool, the seat reads
  the pass; a long pass is skipped.
- `telemetry` accepts a string that mutates (`;`, subquery write, `PRAGMA`).
- Telemetry row stores the query string or a repo path — user data in the
  maintainer's numbers.
- Seat rebinds D1 by creating a new database instead of using the id above.

## Required Response When Detected
- Docs executes → only the swagger fetch is allowed; anything else is `hints:
  ["use execute"]`; test asserts zero DCS calls from `docs`.
- Pass overflow → test fails the build at 2049 bytes; cut text, not the URIs.
- Mutation → parser allowlist (`SELECT` only, single statement); test the four
  mutators.
- Data leak → column allowlist in the writer; test greps the row.
- Second D1 → delete it by API and bind the named id; note in TENSIONS.
