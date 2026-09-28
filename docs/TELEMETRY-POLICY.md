# Telemetry policy

One row per tool call, written off the response path (`ctx.waitUntil`) to the **exact channel**:
D1 `door43mcp_telemetry` (`52fa8ea4-7774-4135-b160-f17bb41ac660`, ENAM), unsampled — `COUNT(*)`
is a true count. Schema: `src/telemetry/schema.sql`; shape: kitchen VERDICT §3 (shape survey
2026-09-25), migration `migrations/0001_shared_columns.sql`.

Columns actually written (allowlist `TELEMETRY_COLUMNS`, `src/telemetry/index.ts`; nothing else can
leave the writer):

- **Shared core** (same names on every server): `ts, server, event_type, method, tool_name,
  consumer_label, consumer_source, worker_version, outcome, duration_ms, bytes_in, bytes_out,
  tokens_in, tokens_out, cache_hits, cache_lookups, count`.
- **door43's declared per-server columns:** `path_family, upstream_status, upstream_ms, truncated`.
- **Jev block** (nullable; door43 does not run Jev, so always NULL here): `jev_contract,
  jev_primitive, jev_pick, jev_p_top, jev_margin, jev_escalated, jev_fallback, jev_latency_ms,
  jev_tokens_in`.

Meaning:
- `ts` is the ISO time of the call (was `timestamp`); `server` is always `door43-mcp`.
- `outcome` is the envelope's HTTP-style status code (was `status`; renamed, not re-encoded).
- `path_family` is one of `/repos` · `/catalog` · `/user` · `other` — never the path.
- `upstream_status` / `upstream_ms` are DCS's answer code and latency (execute only); `truncated`
  says the envelope was cut to its cap.
- `consumer_label` is the logged-in DCS login (self-declared to DCS, not verified here);
  `consumer_source` says where it came from (`grant` | `none`).
- `tokens_*` are `bytes/4` estimates, never billing-accurate.

Not tracked: user id/sub, full path, query strings, request or response bodies, tokens, headers.
Retention: D1 rows persist until pruned by the maintainer (no automatic expiry yet).
Same data the maintainer sees is served by the `telemetry` tool (SELECT only) — no asymmetry.
This document is served verbatim by the `telemetry_policy` tool, with the three column sets.

Channels (`telemetry({ sql, source })`):
- `source=exact` (default) — D1 above, the channel of record.
- `source=sampled` — an Analytics Engine mirror (~3-month retention, weight by
  `SUM(_sample_interval)`), answered only where one exists. **This deployment has no mirror**:
  `sampled` answers an explicit "no mirror" with `rows: null` — never invented rows, never D1 rows
  relabelled as sampled. Wiring one needs an AE dataset binding plus a read credential (TENSIONS T12).
