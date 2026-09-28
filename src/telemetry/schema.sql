-- door43mcp_telemetry — exact channel (D1). Applied by ensureSchema() on first request
-- (CREATE IF NOT EXISTS), never by hand — an existing table is moved by migrations/ (explicit).
-- Columns: the shared core set (ts, server, …, outcome, …), the 9 nullable jev_* (null: door43
-- makes no Jev call), and door43's declared per-server path_family, upstream_status, upstream_ms, truncated. Never a raw path, query string, body,
-- token, or user id (docs/TELEMETRY-POLICY.md).
CREATE TABLE IF NOT EXISTS door43mcp_telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  server TEXT NOT NULL DEFAULT 'door43-mcp',
  event_type TEXT NOT NULL,
  method TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  consumer_label TEXT NOT NULL,
  consumer_source TEXT NOT NULL,
  worker_version TEXT NOT NULL,
  outcome INTEGER NOT NULL,
  upstream_status INTEGER,
  upstream_ms INTEGER NOT NULL DEFAULT 0,
  path_family TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  bytes_in INTEGER NOT NULL DEFAULT 0,
  bytes_out INTEGER NOT NULL DEFAULT 0,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cache_hits INTEGER NOT NULL DEFAULT 0,
  cache_lookups INTEGER NOT NULL DEFAULT 0,
  truncated INTEGER NOT NULL DEFAULT 0,
  count INTEGER NOT NULL DEFAULT 1,
  jev_contract TEXT,
  jev_primitive TEXT,
  jev_pick TEXT,
  jev_p_top REAL,
  jev_margin REAL,
  jev_escalated INTEGER,
  jev_fallback INTEGER,
  jev_latency_ms INTEGER,
  jev_tokens_in INTEGER
);
CREATE INDEX IF NOT EXISTS idx_d43t_ts ON door43mcp_telemetry (ts);
CREATE INDEX IF NOT EXISTS idx_d43t_tool ON door43mcp_telemetry (tool_name, ts);
