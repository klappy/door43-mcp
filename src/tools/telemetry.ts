/**
 * `telemetry({ sql, source? })` — the same numbers the maintainer sees, SELECT only.
 * Two channels (VERDICT §3 / RULING Q1): `exact` = D1 `door43mcp_telemetry` (channel of record, default);
 * `sampled` = an Analytics Engine mirror, answered only if this deployment has one. With no mirror,
 * `sampled` says so explicitly ("no mirror") and returns no rows — never invented or D1-copied rows.
 * `telemetry_policy()` — the governance doc (docs/TELEMETRY-POLICY.md) plus the declared column sets.
 */
import { envelope, byteLength, type Envelope } from "../envelope";
import { isReadOnlySql, TABLE, SERVER, TELEMETRY_COLUMNS, JEV_COLUMNS, type TelemetryDb } from "../telemetry";
import policyMd from "../../docs/TELEMETRY-POLICY.md";

export const SOURCES = ["exact", "sampled"] as const;
export type TelemetrySource = (typeof SOURCES)[number];

/** door43's declared per-server columns (VERDICT §3); everything else in TELEMETRY_COLUMNS is shared core or `jev_*`. */
export const PER_SERVER_COLUMNS = ["path_family", "upstream_status", "upstream_ms", "truncated"] as const;
export const CORE_COLUMNS = TELEMETRY_COLUMNS.filter((c) => !(PER_SERVER_COLUMNS as readonly string[]).includes(c) && !(JEV_COLUMNS as readonly string[]).includes(c));

/** An AE mirror of the same rows. AE bindings only write; reading needs the AE SQL API and a read credential. */
export interface SampledMirror { dataset: string; query(sql: string): Promise<Record<string, unknown>[]> }

export interface TelemetryDeps { host: string; upstreamVersion: string | null; db: TelemetryDb | null; mirror?: SampledMirror | null }

export const NO_MIRROR = "no mirror: this deployment has no Analytics Engine mirror of door43mcp_telemetry — nothing was run, no rows exist on the sampled channel; use source=exact (D1, unsampled)";

export async function runTelemetry(d: TelemetryDeps, input: { sql: string; source?: TelemetrySource }): Promise<Envelope> {
  const source = input.source ?? "exact";
  const req = { tool: "telemetry", method: "-", path: "", query: { source }, fields: [] as string[] };
  const upstream = { host: d.host, version: d.upstreamVersion };
  if (!(SOURCES as readonly string[]).includes(source)) return envelope({ upstream, request: req, status: 400, body: { error: `source must be one of ${SOURCES.join("|")}`, table: TABLE }, hints: ["nothing was run"] });
  const gate = isReadOnlySql(input.sql ?? "");
  if (!gate.ok) return envelope({ upstream, request: req, status: 400, body: { error: gate.reason, table: TABLE, columns: TELEMETRY_COLUMNS }, hints: ["nothing was run; telemetry is read-only by construction"] });
  if (source === "sampled") return sampled(d, input.sql, upstream, req);
  if (!d.db) return envelope({ upstream, request: req, status: 503, body: null, hints: ["no TELEMETRY_DB binding on this deployment"] });
  const t0 = Date.now();
  try {
    const res = await d.db.prepare(input.sql).all();
    const rows = res.results ?? [];
    const body = { table: TABLE, source: "exact" as const, exact: true, rows };
    return envelope({ upstream, request: req, status: 200, body, hints: [`${rows.length} row(s); exact channel (D1, unsampled) — COUNT(*) is a true count`], cost: { bytes: byteLength(body), tokens_est: 0, upstream_ms: Date.now() - t0 } });
  } catch (e) {
    return envelope({ upstream, request: req, status: 400, body: { error: String((e as Error)?.message ?? e), table: TABLE, columns: TELEMETRY_COLUMNS }, hints: ["D1 refused the statement; see columns"] });
  }
}

async function sampled(d: TelemetryDeps, sql: string, upstream: { host: string; version: string | null }, req: Envelope["request"]): Promise<Envelope> {
  if (!d.mirror) return envelope({ upstream, request: req, status: 200, body: { table: TABLE, source: "sampled", mirror: null, exact: false, rows: null, answer: NO_MIRROR }, hints: [NO_MIRROR] });
  const t0 = Date.now();
  try {
    const rows = await d.mirror.query(sql);
    const body = { table: TABLE, source: "sampled" as const, mirror: d.mirror.dataset, exact: false, rows };
    return envelope({ upstream, request: req, status: 200, body, hints: [`${rows.length} row(s); sampled channel (Analytics Engine ${d.mirror.dataset}) — weight counts by SUM(_sample_interval); COUNT(*) is not a true count`], cost: { bytes: byteLength(body), tokens_est: 0, upstream_ms: Date.now() - t0 } });
  } catch (e) {
    return envelope({ upstream, request: req, status: 400, body: { error: String((e as Error)?.message ?? e), table: TABLE, source: "sampled", mirror: d.mirror.dataset }, hints: ["the AE mirror refused the statement"] });
  }
}

export function runTelemetryPolicy(d: { host: string; upstreamVersion: string | null; mirror?: SampledMirror | null }): Envelope {
  const req = { tool: "telemetry_policy", method: "-", path: "", query: {}, fields: [] as string[] };
  const body = {
    server: SERVER, table: TABLE,
    channels: { exact: `D1 ${TABLE} (channel of record, unsampled)`, sampled: d.mirror ? `Analytics Engine ${d.mirror.dataset}` : "no mirror" },
    columns: { core: CORE_COLUMNS, per_server: PER_SERVER_COLUMNS, jev: JEV_COLUMNS },
    policy_doc: "https://github.com/klappy/door43-mcp/blob/main/docs/TELEMETRY-POLICY.md",
    policy: policyMd,
  };
  return envelope({ upstream: { host: d.host, version: d.upstreamVersion }, request: req, status: 200, body, hints: ["structure only, never content; per_server columns are door43's declared extension of the shared core"], cost: { bytes: byteLength(body), tokens_est: 0, upstream_ms: 0 } });
}
