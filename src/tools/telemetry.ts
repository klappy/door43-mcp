/**
 * `telemetry({ sql })` — the same numbers the maintainer sees, SELECT only, exact channel (D1).
 * Two channels in house prior art (cartographer): exact = D1, sampled = Analytics Engine.
 * This plate ships exact only; AE is TENSIONS T12 (credential the seat does not hold).
 */
import { envelope, byteLength, type Envelope } from "../envelope";
import { isReadOnlySql, TABLE, TELEMETRY_COLUMNS, type TelemetryDb } from "../telemetry";

export interface TelemetryDeps { host: string; upstreamVersion: string | null; db: TelemetryDb | null }

export async function runTelemetry(d: TelemetryDeps, input: { sql: string }): Promise<Envelope> {
  const req = { tool: "telemetry", method: "-", path: "", query: {}, fields: [] as string[] };
  const upstream = { host: d.host, version: d.upstreamVersion };
  const gate = isReadOnlySql(input.sql ?? "");
  if (!gate.ok) return envelope({ upstream, request: req, status: 400, body: { error: gate.reason, table: TABLE, columns: TELEMETRY_COLUMNS }, hints: ["nothing was run; telemetry is read-only by construction"] });
  if (!d.db) return envelope({ upstream, request: req, status: 503, body: null, hints: ["no TELEMETRY_DB binding on this deployment"] });
  const t0 = Date.now();
  try {
    const res = await d.db.prepare(input.sql).all();
    const rows = res.results ?? [];
    return envelope({ upstream, request: req, status: 200, body: { table: TABLE, exact: true, rows }, hints: [`${rows.length} row(s); exact channel (D1, unsampled) — COUNT(*) is a true count`], cost: { bytes: byteLength({ table: TABLE, exact: true, rows }), tokens_est: 0, upstream_ms: Date.now() - t0 } });
  } catch (e) {
    return envelope({ upstream, request: req, status: 400, body: { error: String((e as Error)?.message ?? e), table: TABLE, columns: TELEMETRY_COLUMNS }, hints: ["D1 refused the statement; see columns"] });
  }
}
