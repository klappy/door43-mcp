-- 0001_shared_columns — door43mcp_telemetry onto the shared telemetry shape
-- (kitchen rail/3-pass/2026-09-25-mcp-telemetry-shape-survey VERDICT §3; ticket
-- rail/2-cooking/2026-09-27-door43-telemetry-shared-columns S1).
-- ensureSchema() is CREATE IF NOT EXISTS, so it cannot move an existing table: this file does.
-- Apply BEFORE deploying the writer that inserts ts/server/outcome:
--   wrangler d1 migrations apply door43mcp_telemetry --remote
-- No row is dropped or rewritten: two renames (SQLite RENAME COLUMN also rewrites the
-- idx_d43t_ts / idx_d43t_tool definitions) and ten ADD COLUMNs.
ALTER TABLE door43mcp_telemetry RENAME COLUMN timestamp TO ts;
ALTER TABLE door43mcp_telemetry RENAME COLUMN status TO outcome;
ALTER TABLE door43mcp_telemetry ADD COLUMN server TEXT NOT NULL DEFAULT 'door43-mcp';
ALTER TABLE door43mcp_telemetry ADD COLUMN jev_contract TEXT;
ALTER TABLE door43mcp_telemetry ADD COLUMN jev_primitive TEXT;
ALTER TABLE door43mcp_telemetry ADD COLUMN jev_pick TEXT;
ALTER TABLE door43mcp_telemetry ADD COLUMN jev_p_top REAL;
ALTER TABLE door43mcp_telemetry ADD COLUMN jev_margin REAL;
ALTER TABLE door43mcp_telemetry ADD COLUMN jev_escalated INTEGER;
ALTER TABLE door43mcp_telemetry ADD COLUMN jev_fallback INTEGER;
ALTER TABLE door43mcp_telemetry ADD COLUMN jev_latency_ms INTEGER;
ALTER TABLE door43mcp_telemetry ADD COLUMN jev_tokens_in INTEGER;
