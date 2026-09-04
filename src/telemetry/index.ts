/**
 * Telemetry — exact channel over D1 `door43mcp_telemetry` (ticket 2026-09-02-door43-mcp-gate2-3).
 * One row per tool call, written through `ctx.waitUntil` (canon observation
 * 2026-05-16-telemetry-wrapper-intermittent-emit-loss: emit inside waitUntil or lose it).
 * Column allowlist lives in `TELEMETRY_COLUMNS`; the writer cannot store anything else.
 * Reads: `isReadOnlySql` is the parser gate — SELECT only, single statement.
 */
import { SCHEMA_SQL } from "./schema";

export const TABLE = "door43mcp_telemetry";

/** The minimum D1 surface the code touches; tests inject a fake. */
export interface TelemetryDb {
  prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown>; all<T = Record<string, unknown>>(): Promise<{ results?: T[] }> }; run(): Promise<unknown>; all<T = Record<string, unknown>>(): Promise<{ results?: T[] }> };
  exec(sql: string): Promise<unknown>;
}

export const TELEMETRY_COLUMNS = [
  "timestamp", "event_type", "method", "tool_name", "consumer_label", "consumer_source", "worker_version",
  "status", "upstream_status", "upstream_ms", "path_family", "duration_ms", "bytes_in", "bytes_out",
  "tokens_in", "tokens_out", "cache_hits", "cache_lookups", "truncated", "count",
] as const;
export type TelemetryColumn = (typeof TELEMETRY_COLUMNS)[number];
export type TelemetryRow = Record<TelemetryColumn, string | number | null>;

export type PathFamily = "/repos" | "/catalog" | "/user" | "other";
/** Two-segment family of a request path; never the path itself. */
export function pathFamily(path: string | undefined): PathFamily {
  if (!path) return "other";
  const p = path.startsWith("/api/v1/") ? path.slice(7) : path;
  const seg = "/" + (p.split("/").filter(Boolean)[0] ?? "");
  if (seg === "/repos" || seg === "/catalog" || seg === "/user") return seg;
  return "other";
}

const schemaApplied = new WeakSet<object>();
/** Statements of schema.sql, comment lines stripped. Exported so the test can pin file == constant. */
export function schemaStatements(): string[] {
  return SCHEMA_SQL.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n")
    .split(";").map((x) => x.trim()).filter(Boolean);
}
export async function ensureSchema(db: TelemetryDb): Promise<void> {
  if (schemaApplied.has(db)) return;
  for (const stmt of schemaStatements()) await db.prepare(stmt).run();
  schemaApplied.add(db);
}

export interface Emit {
  /** `tool_call` (default) or, v2.5, `recipe_run` — one per run beside its per-step `tool_call` rows. */
  event_type?: "tool_call" | "recipe_run";
  tool_name: string;
  method?: string;
  path?: string;
  status: number;
  upstream_status?: number | null;
  upstream_ms?: number;
  duration_ms: number;
  bytes_in: number;
  bytes_out: number;
  truncated?: boolean;
  cache_hits?: number;
  cache_lookups?: number;
  consumer_label: string;
  consumer_source: string;
  worker_version: string;
}

/** Build the row from the allowlist only — a stray key on `e` never reaches the table. */
export function toRow(e: Emit, now = new Date()): TelemetryRow {
  return {
    timestamp: now.toISOString(), event_type: e.event_type ?? "tool_call", method: e.method ?? "-", tool_name: e.tool_name,
    consumer_label: e.consumer_label, consumer_source: e.consumer_source, worker_version: e.worker_version,
    status: e.status, upstream_status: e.upstream_status ?? null, upstream_ms: e.upstream_ms ?? 0,
    path_family: pathFamily(e.path), duration_ms: e.duration_ms, bytes_in: e.bytes_in, bytes_out: e.bytes_out,
    tokens_in: Math.ceil(e.bytes_in / 4), tokens_out: Math.ceil(e.bytes_out / 4),
    cache_hits: e.cache_hits ?? 0, cache_lookups: e.cache_lookups ?? 0, truncated: e.truncated ? 1 : 0, count: 1,
  };
}

export async function writeRow(db: TelemetryDb, e: Emit): Promise<void> {
  await ensureSchema(db);
  const row = toRow(e);
  const cols = TELEMETRY_COLUMNS.join(", ");
  const marks = TELEMETRY_COLUMNS.map(() => "?").join(", ");
  await db.prepare(`INSERT INTO ${TABLE} (${cols}) VALUES (${marks})`).bind(...TELEMETRY_COLUMNS.map((c) => row[c])).run();
}

const FORBIDDEN = /\b(insert|update|delete|drop|create|alter|attach|detach|pragma|replace|vacuum|reindex|truncate|grant|revoke|begin|commit|rollback|savepoint|release)\b(?!\s*\()/i;
/** SELECT only, single statement, no `;`, no mutating or admin keyword outside quotes/comments (the allowlist is the shape, the denylist is belt-and-braces). */
export function isReadOnlySql(sql: string): { ok: true } | { ok: false; reason: string } {
  const s = sql.trim();
  if (!s) return { ok: false, reason: "empty sql" };
  if (s.includes(";")) return { ok: false, reason: "one statement only — ';' is refused" };
  if (!/^(select|with)\b/i.test(s)) return { ok: false, reason: "SELECT only" };
  // Quotes first so `'-- grant'` / `'grant'` stay literals; then comments. `(?!\s*\()` keeps REPLACE(…).
  const bare = s
    .replace(/'(?:[^']|'')*'/g, " ")
    .replace(/"(?:[^"]|"")*"/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
  const m = bare.match(FORBIDDEN);
  if (m) return { ok: false, reason: `'${m[1].toUpperCase()}' is not allowed — telemetry is read-only` };
  return { ok: true };
}

/** v2.4 estimate basis: p50 `bytes_out` per `path_family` for `execute` calls in the last `days` (default 30),
 *  this deployment only (the table IS this host). Median is taken here — D1/SQLite has no percentile function.
 *  Bounded read: newest 5,000 rows. A family with no rows is absent from the result (the caller says "no history"). */
export async function p50BytesByFamily(db: TelemetryDb, days = 30, now = new Date()): Promise<Partial<Record<PathFamily, number>>> {
  const since = new Date(now.getTime() - days * 86_400_000).toISOString();
  const res = await db.prepare(`SELECT path_family, bytes_out FROM ${TABLE} WHERE tool_name = 'execute' AND event_type = 'tool_call' AND status < 400 AND timestamp > ? ORDER BY timestamp DESC LIMIT 5000`).bind(since).all<{ path_family: string; bytes_out: number }>();
  const by: Record<string, number[]> = {};
  for (const r of res.results ?? []) (by[r.path_family] ??= []).push(Number(r.bytes_out));
  const out: Partial<Record<PathFamily, number>> = {};
  for (const [f, xs] of Object.entries(by)) { xs.sort((a, b) => a - b); const m = xs.length >> 1; out[f as PathFamily] = xs.length % 2 ? xs[m] : Math.round((xs[m - 1] + xs[m]) / 2); }
  return out;
}
