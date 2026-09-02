# DESIGN — agent-facing design principles for door43-mcp

Headless product; the "UI" is the shape of what an agent reads. Six principles, each
with the mechanism that enforces it.

| # | Principle | Mechanism |
|---|---|---|
| 1 | **Rung 0 in one call.** An agent orients with `docs()` and nothing else. | Boarding pass = identity + auth state + contracts + map + journeys, ≤ 2 KB. |
| 2 | **Ladder, not manual.** Detail is bought a rung at a time. | `docs` levels L0–L3; `query` for lexical jumps; `recipe` for filled calls. |
| 3 | **Every response is a resume point.** A dead session resumes from its last response. | Envelope: `observed_at, upstream, request, status, body, truncated, next, hints, cost`. `next`/`continue` are execute payloads, not cursors. |
| 4 | **Errors teach.** Failure hands over the next rung. | 401 → refreshed-and-retried or login URL; 404 → nearest documented paths; 405 → v2 pointer; 413 → `continue` payload. |
| 5 | **Projection, not semantics.** The server trims, never interprets. | `fields` (JSON paths) applied deterministically; no resource-type logic in the server. |
| 6 | **Cost is visible.** An agent knows what it spent. | `cost: { bytes, tokens_est, upstream_ms }` on every response; same numbers in telemetry. |

Naming: paths and params mirror upstream names exactly (`owner`, `repo`, `ref`) so docs
and swagger agree. Error voice: one sentence of fact, one of next step, no apology.

What we do not do: cache upstream content; rename upstream fields; infer resource
semantics (USFM, TSV); expose more than three tools. Resources and prompts (MCP) are
allowed — they are not tools — and carry the boarding pass and the journeys.
