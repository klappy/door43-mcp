/** Gates 2+3 — ticket 2026-09-02-door43-mcp-gate2-3-docs-telemetry, product 7. */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { runDocs, searchOps, RECIPES, CEILING_URI, SEAT_WORK_URI, PASS_CAP_BYTES, type DocsDeps } from "../src/tools/docs";
import { runTelemetry } from "../src/tools/telemetry";
import { isReadOnlySql, toRow, writeRow, pathFamily, schemaStatements, TELEMETRY_COLUMNS, type TelemetryDb } from "../src/telemetry";
import { SCHEMA_SQL } from "../src/telemetry/schema";
import { ENVELOPE_KEYS, byteLength } from "../src/envelope";
import { DESCRIPTIONS } from "../src/descriptions";
import { runExecute } from "../src/tools/execute";
import type { SwaggerDoc } from "../src/upstream";

// A slice of git.door43.org/swagger.v1.json observed 2026-09-03T02:50Z (323 paths live; 11 kept here).
const raw = JSON.parse(readFileSync(new URL("./fixtures/swagger-slice.json", import.meta.url), "utf8"));
const SW: SwaggerDoc = { basePath: raw.basePath, version: raw.info.version, etag: null, observed_at: "2026-09-03T02:50:00Z", paths: raw.paths, definitions: raw.definitions, responses: raw.responses };

let swaggerCalls = 0;
const deps = (over: Partial<DocsDeps> = {}): DocsDeps => ({
  host: "git.door43.org", version: "0.3.0", upstreamVersion: "1.27.2+dcs", swagger: async () => { swaggerCalls++; return SW; },
  login: "klappy", loginUrl: "https://door43.klappy.dev/authorize", serverUrl: "https://door43.klappy.dev", ...over,
});

describe("docs L0 boarding pass (convention §8, acceptance 4, 8)", () => {
  it("≤ 2048 bytes, cites both constraint URIs, names the user and versions, envelope keys pinned", async () => {
    const e = await runDocs(deps(), {});
    expect(Object.keys(e)).toEqual([...ENVELOPE_KEYS]);
    expect(e.status).toBe(200);
    const bytes = byteLength(e.body);
    expect(bytes).toBeLessThanOrEqual(PASS_CAP_BYTES);
    const text = JSON.stringify(e.body);
    expect(text).toContain(CEILING_URI);
    expect(text).toContain(SEAT_WORK_URI);
    expect((e.body as any).server.version).toBe("0.3.0");
    expect((e.body as any).upstream.version).toBe("1.27.2+dcs");
    expect((e.body as any).auth).toEqual({ logged_in_as: "klappy" });
    expect(Object.keys((e.body as any).tools)).toEqual(["docs", "execute", "telemetry"]);
  });
  it("logged-out pass carries login_url instead", async () => {
    const e = await runDocs(deps({ login: null }), {});
    expect((e.body as any).auth.login_url).toMatch(/\/authorize$/);
  });
  it("the pass makes zero swagger/DCS calls", async () => {
    swaggerCalls = 0;
    await runDocs(deps(), {});
    expect(swaggerCalls).toBe(0);
  });
});

describe("docs L1/L2/L3/query (SPEC §docs)", () => {
  it("map: families with counts and three paths each", async () => {
    const e = await runDocs(deps(), { rung: "map" });
    expect(e.status).toBe(200);
    const b = e.body as any;
    expect(b.paths_total).toBe(Object.keys(SW.paths).length);
    expect(b.families.map((f: any) => f.family)).toEqual(["catalog", "repos", "user", "users", "orgs", "misc"]);
    expect(b.families[0].top).toHaveLength(3);
  });
  it("L2 /catalog/search: params, response keys, and the sentence that owner is a string", async () => {
    const e = await runDocs(deps(), { path: "/catalog/search" });
    expect(e.status).toBe(200);
    const b = e.body as any;
    expect(b.GET.params.join(" ")).toMatch(/lang/);
    expect(b.GET.response_keys.join(" ")).toMatch(/data\[\]\{/);
    expect(b.quirks.join(" ")).toContain("owner is a string");
    expect(SW.definitions.CatalogEntry).toMatchObject({ properties: { owner: { type: "string" } } }); // the swagger agrees
  });
  it("L2 accepts the /api/v1 prefix; unknown path → 404 with nearest", async () => {
    const ok = await runDocs(deps(), { path: "/api/v1/catalog/search" });
    expect(ok.status).toBe(200);
    const no = await runDocs(deps(), { path: "/catalog/nope" });
    expect(no.status).toBe(404);
    expect((no.body as any).nearest.length).toBeGreaterThan(0);
  });
  it("L3 raw: the swagger fragment verbatim", async () => {
    const e = await runDocs(deps(), { rung: "raw", path: "/repos/{owner}/{repo}/releases/latest" });
    expect(e.status).toBe(200);
    expect((e.body as any).swagger).toEqual(SW.paths["/repos/{owner}/{repo}/releases/latest"]);
  });
  it("query: BM25 hits carry an l2 docs call", async () => {
    const hits = searchOps(SW, "latest release");
    expect(hits[0].path).toBe("/api/v1/repos/{owner}/{repo}/releases/latest");
    const e = await runDocs(deps(), { query: "catalog search" });
    expect(e.status).toBe(200);
    expect((e.body as any).hits[0].l2).toEqual({ docs: { path: "/catalog/search" } });
    expect((await runDocs(deps(), { query: "zzzz" })).status).toBe(404);
  });
});

describe("docs recipes", () => {
  it("ships v1's five recipes (+ read-file-at-pin, SPEC §docs v2); latest-release-zip selects zipball_url", async () => {
    expect(Object.keys(RECIPES)).toEqual(["whoami", "catalog-by-language", "latest-release-zip", "repo-tree-at-ref", "page-through", "repo-at-a-glance", "map-this-release", "my-spend", "read-file-at-pin"]);
    // v2.4: owner/repo are args, no longer hard-coded (DELTA seed 4) — see test/v2-pins-recipe-args.test.ts for the 400.
    const e = await runDocs(deps(), { recipe: "latest-release-zip", args: { owner: "unfoldingWord", repo: "en_ult" } });
    expect(e.status).toBe(200);
    const call = (e.body as any).calls[0];
    expect(call.method).toBe("GET");
    expect(call.path).toMatch(/\/releases\/latest$/);
    expect(call.fields).toContain("zipball_url");
    expect((await runDocs(deps(), { recipe: "nope" })).status).toBe(404);
  });
  it("every recipe call is a GET/HEAD execute call the edge would accept", () => {
    for (const r of Object.values(RECIPES)) for (const c of r.calls) { if ("tool" in c) { expect(c.tool).toBe("telemetry"); expect(c.sql).toMatch(/^SELECT/); continue; } expect(["GET", "HEAD"]).toContain(c.method); expect(c.path.startsWith("/")).toBe(true); expect(c.path).not.toMatch(/[?#]/); }
    // templates only in a filled position; every template names a declared arg.
    for (const [n, r] of Object.entries(RECIPES)) for (const c of r.calls) for (const m of ("tool" in c ? c.sql : `${c.path} ${JSON.stringify(c.query ?? {})}`).matchAll(/\{([a-zA-Z_]+)\}/g)) expect(Object.keys(r.args), `${n} template {${m[1]}}`).toContain(m[1]);
  });
});

describe("tool descriptions are product copy (ticket product 5)", () => {
  it("verbatim, one line, ≤ 80 chars", () => {
    expect(DESCRIPTIONS.docs).toBe("Explain this server and DCS — boarding pass, map, any path, recipes");
    expect(DESCRIPTIONS.execute).toBe("Run one GET/HEAD against DCS as you, with a resume-point envelope");
    expect(DESCRIPTIONS.telemetry).toBe("Read this server's own usage numbers (SELECT only)");
    for (const d of Object.values(DESCRIPTIONS)) { expect(d.length).toBeLessThanOrEqual(80); expect(d).not.toContain("\n"); }
  });
});

/** Fake D1: records every prepared statement; answers SELECTs from an in-memory row list. */
function fakeDb() {
  const rows: Record<string, unknown>[] = [];
  const stmts: string[] = [];
  const db: TelemetryDb = {
    exec: async (s) => { stmts.push(s); },
    prepare: (sql) => {
      const mk = (vals: unknown[]) => ({
        run: async () => { stmts.push(sql); if (/^INSERT/i.test(sql)) { const cols = sql.match(/\(([^)]+)\)/)![1].split(",").map((c) => c.trim()); rows.push(Object.fromEntries(cols.map((c, i) => [c, vals[i]]))); } },
        all: async () => { stmts.push(sql); return { results: /COUNT/i.test(sql) ? [{ tool_name: "execute", n: rows.length }] : rows }; },
      });
      return { bind: (...v: unknown[]) => mk(v), ...mk([]) } as any;
    },
  };
  return { db, rows, stmts };
}

describe("telemetry read gate (acceptance 6, ticket failure mode 3)", () => {
  it("rejects INSERT, DROP, ';', PRAGMA, ATTACH, UPDATE, DELETE — nothing runs", async () => {
    const { db, stmts } = fakeDb();
    for (const sql of ["INSERT INTO door43mcp_telemetry (tool_name) VALUES ('x')", "DROP TABLE door43mcp_telemetry", "SELECT 1; DROP TABLE door43mcp_telemetry", "PRAGMA table_info(door43mcp_telemetry)", "ATTACH DATABASE 'x' AS y", "UPDATE door43mcp_telemetry SET count=2", "DELETE FROM door43mcp_telemetry", "SELECT * FROM door43mcp_telemetry WHERE 1=1 OR (SELECT 1 FROM (DELETE FROM x))"]) {
      expect(isReadOnlySql(sql).ok, sql).toBe(false);
      const e = await runTelemetry({ host: "git.door43.org", upstreamVersion: "1.27.2+dcs", db }, { sql });
      expect(e.status).toBe(400);
      expect(Object.keys(e)).toEqual([...ENVELOPE_KEYS]);
    }
    expect(stmts.length).toBe(0);
  });
  it("accepts a single SELECT and returns rows on the exact channel", async () => {
    const { db } = fakeDb();
    const e = await runTelemetry({ host: "git.door43.org", upstreamVersion: "1.27.2+dcs", db }, { sql: "SELECT tool_name, COUNT(*) AS n FROM door43mcp_telemetry GROUP BY 1" });
    expect(e.status).toBe(200);
    expect((e.body as any).exact).toBe(true);
    expect(e.hints.join(" ")).toMatch(/COUNT\(\*\) is a true count/);
  });
  it("accepts SELECT filtered by stored values that collide with the denylist", async () => {
    const { db, stmts } = fakeDb();
    for (const sql of [
      "SELECT * FROM door43mcp_telemetry WHERE consumer_source = 'grant'",
      "SELECT REPLACE(tool_name, 'x', 'y') FROM door43mcp_telemetry",
      "SELECT * FROM door43mcp_telemetry WHERE tool_name = 'release'",
    ]) {
      expect(isReadOnlySql(sql).ok, sql).toBe(true);
      const e = await runTelemetry({ host: "git.door43.org", upstreamVersion: "1.27.2+dcs", db }, { sql });
      expect(e.status).toBe(200);
    }
    expect(stmts.length).toBe(3);
  });
});

describe("telemetry write (one row per call; column allowlist; no raw path)", () => {
  it("an execute call produces exactly one row, with path_family not path", async () => {
    const { db, rows } = fakeDb();
    const e = await runExecute({ host: "git.door43.org", version: "1.27.2+dcs", fetch: (async () => new Response(JSON.stringify({ data: [] }), { status: 200, headers: { "content-type": "application/json" } })) as any,
      grant: { accessToken: "A1" }, refresh: async () => null, swagger: async () => [] }, { method: "GET", path: "/repos/unfoldingWord/en_ult/contents/README.md", query: { ref: "v86", secret: "no" } });
    await writeRow(db, { tool_name: "execute", method: e.request.method, path: e.request.path, status: e.status, upstream_status: e.status, upstream_ms: e.cost.upstream_ms, duration_ms: 5, bytes_in: 40, bytes_out: e.cost.bytes, truncated: e.truncated, consumer_label: "klappy", consumer_source: "grant", worker_version: "0.3.0" });
    expect(rows.length).toBe(1);
    const row = JSON.stringify(rows[0]);
    expect(rows[0].path_family).toBe("/repos");
    expect(row).not.toContain("unfoldingWord");
    expect(row).not.toContain("README");
    expect(row).not.toContain("v86");
    expect(row).not.toContain("secret");
    expect(Object.keys(rows[0]).sort()).toEqual([...TELEMETRY_COLUMNS].sort());
  });
  it("path_family is one of four values", () => {
    expect(pathFamily("/api/v1/repos/x/y")).toBe("/repos"); expect(pathFamily("/catalog/search")).toBe("/catalog");
    expect(pathFamily("/user")).toBe("/user"); expect(pathFamily("/users/klappy")).toBe("other"); expect(pathFamily("/orgs")).toBe("other"); expect(pathFamily(undefined)).toBe("other");
  });
  it("toRow never carries a key outside the allowlist", () => {
    const r = toRow({ tool_name: "docs", status: 200, duration_ms: 1, bytes_in: 2, bytes_out: 3, consumer_label: "x", consumer_source: "grant", worker_version: "0.3.0", ...( { raw_path: "/leak", query: "q=1" } as any) });
    expect(Object.keys(r).sort()).toEqual([...TELEMETRY_COLUMNS].sort());
  });
  it("schema.ts mirrors schema.sql and applies as CREATE IF NOT EXISTS", () => {
    expect(SCHEMA_SQL).toBe(readFileSync(new URL("../src/telemetry/schema.sql", import.meta.url), "utf8"));
    const st = schemaStatements();
    expect(st.length).toBe(3);
    expect(st.every((s) => /^CREATE (TABLE|INDEX) IF NOT EXISTS/.test(s))).toBe(true);
  });
});
