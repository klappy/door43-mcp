# Telemetry policy

One row per tool call, written off the response path (`ctx.waitUntil`) to the **exact channel**:
D1 `door43mcp_telemetry` (`52fa8ea4-7774-4135-b160-f17bb41ac660`, ENAM), unsampled — `COUNT(*)`
is a true count. Schema: `src/telemetry/schema.sql`.

Columns actually written (allowlist `TELEMETRY_COLUMNS`, `src/telemetry/index.ts`; nothing else can
leave the writer): `timestamp, event_type, method, tool_name, consumer_label, consumer_source,
worker_version, status, upstream_status, upstream_ms, path_family, duration_ms, bytes_in, bytes_out,
tokens_in, tokens_out, cache_hits, cache_lookups, truncated, count`.

- `path_family` is one of `/repos` · `/catalog` · `/user` · `other` — never the path.
- `consumer_label` is the logged-in DCS login (self-declared to DCS, not verified here);
  `consumer_source` says where it came from (`grant` | `none`).
- `tokens_*` are `bytes/4` estimates, never billing-accurate.

Not tracked: user id/sub, full path, query strings, request or response bodies, tokens, headers.
Retention: D1 rows persist until pruned by the maintainer (no automatic expiry yet).
Same data the maintainer sees is served by the `telemetry` tool (SELECT only) — no asymmetry.

Sampled channel (Analytics Engine, ~3-month retention, `SUM(_sample_interval)`): **not wired** —
needs a read credential (TENSIONS T12).
