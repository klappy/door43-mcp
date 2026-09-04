/**
 * v2.6 hand-off + v2.7 consumer ladder. Each `it` is one ticket done-means
 * (klappy/kitchen 2026-09-03-door43-mcp-v2-4-handoff-consumer; VERDICT T18 beside it).
 * The cartographer `consult_repo` schema was fetched live 2026-09-04T05:2xZ before this file was typed:
 * `zip_url` (string, format uri) is a valid payload on its own; provenance is 'unpinned' for a zip.
 */
import { describe, it, expect } from "vitest";
import { runExecute, type ExecuteDeps } from "../src/tools/execute";
import { runDocs, type DocsDeps } from "../src/tools/docs";
import { RECIPES, fill, CARTOGRAPHER_URL } from "../src/recipes";
import { consumerLadder, labelMode, toRow, TELEMETRY_COLUMNS, isReadOnlySql } from "../src/telemetry";
import { pickPath } from "../src/projection";
import { ENVELOPE_KEYS } from "../src/envelope";
import { readFileSync } from "node:fs";

const SHA = "a3c1f0e9b2d4c6a8e0f2b4d6c8a0e2f4b6d8c0a2";
const ZIP = "https://git.door43.org/unfoldingWord/en_ult/archive/v86.zip";
const catalog = { ok: true, data: [{ full_name: "unfoldingWord/en_ult", branch_or_tag_name: "v86", commit_sha: SHA, zipball_url: ZIP, released: "2026-01-01T00:00:00Z", noise: 1 }] };
type Hit = { url: string; init: RequestInit };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
function xdeps(handler: (h: Hit) => Response, over: Partial<ExecuteDeps> = {}) {
  const hits: Hit[] = [];
  const d: ExecuteDeps = { host: "git.door43.org", version: "1.27.2+dcs", fetch: (async (url: any, init: any) => { const h = { url: String(url), init }; hits.push(h); return handler(h); }) as any,
    grant: { accessToken: "A1" }, refresh: async () => null, swagger: async () => [], ...over };
  return { d, hits };
}
const ddeps = (over: Partial<DocsDeps> = {}): DocsDeps => ({ host: "git.door43.org", version: "0.7.0", upstreamVersion: "1.27.2+dcs", swagger: async () => null, login: "klappy", loginUrl: "https://door43.klappy.dev/authorize", serverUrl: "https://door43.klappy.dev", ...over });

describe("v2.6 — map-this-release ends in body.handoff", () => {
  it("execute({recipe:map-this-release, args:{owner,repo}}) → body.handoff with a cartographer consult_repo input and provenance.sha; one fetch; no new envelope key", async () => {
    const { d, hits } = xdeps(() => json(catalog));
    const e = await runExecute(d, { recipe: "map-this-release", args: { owner: "unfoldingWord", repo: "en_ult" } });
    expect(e.status).toBe(200); expect(hits.length).toBe(1);
    const u = new URL(hits[0].url); expect(u.pathname).toBe("/api/v1/catalog/search"); expect(u.searchParams.get("owner")).toBe("unfoldingWord"); expect(u.searchParams.get("stage")).toBe("prod");
    const h = (e.body as any).handoff;
    expect(h).toEqual({ server: "cartographer", url: CARTOGRAPHER_URL, tool: "execute", input: { capability: "consult_repo", payload: { zip_url: ZIP } }, provenance: { sha: SHA, ref: "v86", observed_at: (e.body as any).steps[0].observed_at } });
    expect(Object.keys(e)).toEqual([...ENVELOPE_KEYS]); // T15: handoff rides in body, not on the envelope
    expect(e.hints.join(" ")).toContain("cartographer");
    expect((e.body as any).steps[0].body.data[0]).not.toHaveProperty("noise"); // projection applied before the pick
  });
  it("empty catalog answer → no hand-off, a hint says why; the pick never fetches", async () => {
    const { d, hits } = xdeps(() => json({ ok: true, data: [] }));
    const e = await runExecute(d, { recipe: "map-this-release", args: { owner: "x", repo: "y" } });
    expect((e.body as any).handoff).toBeUndefined(); expect(e.hints.join(" ")).toContain("no hand-off"); expect(hits.length).toBe(1);
    expect(pickPath({ data: [] }, "data[0].zipball_url")).toBeUndefined(); expect(pickPath(catalog, "data[0].commit_sha")).toBe(SHA);
  });
  it("the hand-off payload validates against the fetched consult_repo schema: only `zip_url` (a uri), no owner/repo/ref/sha keys", async () => {
    const { d } = xdeps(() => json(catalog));
    const e = await runExecute(d, { recipe: "map-this-release", args: { owner: "unfoldingWord", repo: "en_ult" } });
    const payload = (e.body as any).handoff.input.payload;
    expect(Object.keys(payload)).toEqual(["zip_url"]); // additionalProperties:false on the live schema; zip_url alone is the non-GitHub kind
    expect(() => new URL(payload.zip_url)).not.toThrow();
  });
});

describe("v2.7 — consumer ladder (VERDICT T18) and my-spend", () => {
  const rungs = { login: "klappy", query: "probe", clientInfo: { name: "claude-ai", version: "1.2" }, userAgent: "node/22 fetch" };
  it("TELEMETRY_LABEL unset → the model (client-info, else user-agent); the login is never the label", () => {
    expect(labelMode(undefined)).toBe("model"); expect(labelMode("bogus")).toBe("model");
    expect(consumerLadder("model", rungs)).toEqual({ label: "claude-ai/1.2", source: "client-info" });
    expect(consumerLadder("model", { ...rungs, clientInfo: null })).toEqual({ label: "node/22", source: "user-agent" });
    expect(consumerLadder("model", { login: "klappy" })).toEqual({ label: "unknown", source: "none" });
  });
  it("TELEMETRY_LABEL=query → ?consumer=probe → {probe, query}; absent → falls to the model; TELEMETRY_LABEL=grant → {login, grant}", () => {
    expect(consumerLadder("query", rungs)).toEqual({ label: "probe", source: "query" });
    expect(consumerLadder("query", { ...rungs, query: null })).toEqual({ label: "claude-ai/1.2", source: "client-info" });
    expect(consumerLadder("grant", rungs)).toEqual({ label: "klappy", source: "grant" });
    expect(consumerLadder("grant", { ...rungs, login: null })).toEqual({ label: "probe", source: "query" });
  });
  it("a row under the default carries consumer_source and no DCS login anywhere; columns unchanged", () => {
    const c = consumerLadder("model", rungs);
    const row = toRow({ tool_name: "execute", method: "GET", path: "/user", status: 200, duration_ms: 1, bytes_in: 1, bytes_out: 1, consumer_label: c.label, consumer_source: c.source, worker_version: "t" });
    expect(JSON.stringify(row)).not.toContain("klappy"); expect(row.consumer_source).toBe("client-info");
    expect(Object.keys(row)).toEqual([...TELEMETRY_COLUMNS]);
  });
  it("mcp.ts never writes props.login into a row except through the ladder (grep)", () => {
    const src = readFileSync(new URL("../src/mcp.ts", import.meta.url), "utf8");
    expect(src).not.toMatch(/consumer_label:\s*this\.props/); expect(src).toMatch(/consumerLadder\(/);
  });
  it("docs({recipe:my-spend, args:{since}}) → a telemetry call for this label; execute refuses to run it (400, 0 fetches); the SQL passes the read gate", async () => {
    const e = await runDocs(ddeps({ consumerLabel: "claude-ai/1.2" }), { recipe: "my-spend", args: { since: "2026-09-03T00:00:00Z" } });
    expect(e.status).toBe(200);
    const call = (e.body as any).calls[0];
    expect(call.tool).toBe("telemetry"); expect(call.sql).toContain("'claude-ai/1.2'"); expect(call.sql).toContain("2026-09-03T00:00:00Z");
    expect(isReadOnlySql(call.sql)).toEqual({ ok: true });
    expect((await runDocs(ddeps(), { recipe: "my-spend", args: { since: "yesterday" } })).status).toBe(400);
    expect(fill("my-spend", { since: "2026-09-03", label: "x'; DROP" }).ok).toBe(false);
    const { d, hits } = xdeps(() => json({}));
    const r = await runExecute(d, { recipe: "my-spend", args: { since: "2026-09-03T00:00:00Z", label: "probe" } });
    expect(r.status).toBe(400); expect(hits.length).toBe(0); expect(r.hints.join(" ")).toContain("telemetry");
  });
  it("no fourth tool: the registered tool names in mcp.ts are still docs, execute, telemetry", () => {
    const src = readFileSync(new URL("../src/mcp.ts", import.meta.url), "utf8");
    expect([...src.matchAll(/registerTool\(\s*"([a-z]+)"/g)].map((m) => m[1])).toEqual(["docs", "execute", "telemetry"]);
    expect(RECIPES["map-this-release"].calls.length).toBe(1);
  });
});
