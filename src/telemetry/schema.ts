/** Mirror of ./schema.sql (the file is the record; test/telemetry.test.ts pins them equal). */
export const SCHEMA_SQL = `-- door43mcp_telemetry — exact channel (D1). Applied by ensureSchema() on first request
-- (CREATE IF NOT EXISTS), never by hand. Columns are the oddkit/cartographer semantic set
-- plus upstream_status, upstream_ms, path_family. Never a raw path, query string, body,
-- token, or user id (docs/TELEMETRY-POLICY.md).
CREATE TABLE IF NOT EXISTS door43mcp_telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,
  method TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  consumer_label TEXT NOT NULL,
  consumer_source TEXT NOT NULL,
  worker_version TEXT NOT NULL,
  status INTEGER NOT NULL,
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
  count INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_d43t_ts ON door43mcp_telemetry (timestamp);
CREATE INDEX IF NOT EXISTS idx_d43t_tool ON door43mcp_telemetry (tool_name, timestamp);
`;
