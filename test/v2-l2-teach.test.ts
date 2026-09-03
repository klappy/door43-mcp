/**
 * v2.1 (L2 tells the whole truth, cheaply) + v2.2 (teach on 200; typed next; 304; ratelimit).
 * Each `it` is one PLAN done-means. Rail: klappy/kitchen 2026-09-03-door43-mcp-v2-1-l2-truth-teach.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { runDocs, responseKeys, type DocsDeps } from "../src/tools/docs";
import { runExecute, typedQuery, fieldsTeach, type ExecuteDeps } from "../src/tools/execute";
import { byteLength } from "../src/envelope";
import type { SwaggerDoc } from "../src/upstream";

// Full live swagger, slimmed to schema shape (provenance inside the file). 323 paths.
const raw = JSON.parse(readFileSync(new URL("./fixtures/swagger-full-slim.json", import.meta.url), "utf8"));
const SW: SwaggerDoc = { basePath: raw.basePath, version: raw.info.version, etag: null, observed_at: raw._provenance.observed_at, paths: raw.paths, definitions: raw.definitions, responses: raw.responses };
const deps = (over: Partial<DocsDeps> = {}): DocsDeps => ({
  host: "git.door43.org", version: "0.3.2", upstreamVersion: "1.27.2+dcs", swagger: async () => SW,
  login: "klappy", loginUrl: "https://door43.klappy.dev/authorize", serverUrl: "https://door43.klappy.dev", ...over,
});

describe("v2.1 — L2 tells the whole truth, cheaply", () => {
  it("docs({path:/catalog/search}) ≤ 2 KB and response_keys contains zipball_url and commit_sha (T16)", async () => {
    const e = await runDocs(deps(), { path: "/catalog/search" });
    expect(e.status).toBe(200);
    expect(byteLength(e.body)).toBeLessThanOrEqual(2048);
    const keys = ((e.body as any).GET.response_keys as string[]).join(" ");
    expect(keys).toContain("zipball_url");
    expect(keys).toContain("commit_sha");
    expect(keys).not.toContain("…");
    expect((e.body as any).GET.params).toContain("limit:integer");
    expect(e.upstream.swagger?.version).toBe("1.27.2+dcs");
  });
  it("detail:\"full\" returns the param prose and error responses", async () => {
    const c = await runDocs(deps(), { path: "/catalog/search" });
    const f = await runDocs(deps(), { path: "/catalog/search", detail: "full" });
    const fp = (f.body as any).GET.params as string[];
    expect(fp.some((p) => p.startsWith("limit") && p.includes("—"))).toBe(true);
    expect((f.body as any).GET.errors).toHaveProperty("422");
    expect(byteLength(f.body)).toBeGreaterThan(byteLength(c.body));
    // compact keeps every NAME full has (failure mode 1: compact drops a param name).
    const names = (ps: string[]) => ps.map((p) => p.split(/[:( ]/)[0].replace("*", "")).sort();
    expect(names((c.body as any).GET.params)).toEqual(names(fp));
  });
  it("docs({path, fields:[\"GET.response_keys\"]}) returns only that key (project(), T6)", async () => {
    const e = await runDocs(deps(), { path: "/catalog/search", fields: ["GET.response_keys"] });
    expect(e.status).toBe(200);
    expect(Object.keys(e.body as object)).toEqual(["GET"]);
    expect(Object.keys((e.body as any).GET)).toEqual(["response_keys"]);
    expect(e.request.fields).toEqual(["GET.response_keys"]);
  });
  it("L2 lists every key for every path with a 200 schema (walks all 323 paths, name parity with the swagger)", () => {
    const deref = (ref: string) => { const [, kind, name] = ref.split("/"); return (kind === "definitions" ? SW.definitions : SW.responses)[name] as any; };
    let paths = 0, ops = 0, checked = 0;
    for (const [p, methods] of Object.entries(SW.paths)) {
      paths++;
      for (const [m, op] of Object.entries(methods)) {
        if (m !== "get" && m !== "head") continue;
        const r200: any = op.responses?.["200"]; if (!r200) continue;
        ops++;
        const resp = r200.$ref ? deref(r200.$ref) : r200;
        let schema: any = resp?.schema; if (schema?.$ref) schema = deref(schema.$ref);
        if (!schema) continue;
        const keys = responseKeys(SW, r200).join("|");
        const expectKeys = (s: any, prefix = "") => {
          const props = s?.properties ?? {};
          for (const [k, v] of Object.entries<any>(props)) {
            expect(keys, `${m.toUpperCase()} ${p} lacks ${prefix}${k}`).toMatch(new RegExp(`(^|[|{,\\.])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([|{,}\\[]|$)`));
            checked++;
            const inner = v?.$ref ? deref(v.$ref) : v?.items?.$ref ? deref(v.items.$ref) : v?.items?.properties ? v.items : v?.properties ? v : null;
            if (inner) for (const ik of Object.keys(inner.properties ?? {})) { expect(keys, `${m.toUpperCase()} ${p} lacks ${k}…${ik}`).toContain(ik); checked++; }
          }
        };
        if (schema.type === "array" && schema.items) { const it = schema.items.$ref ? deref(schema.items.$ref) : schema.items; for (const k of Object.keys(it?.properties ?? {})) { expect(keys).toContain(`[].${k}`); checked++; } }
        else expectKeys(schema);
      }
    }
    expect(paths).toBe(323);
    expect(ops).toBeGreaterThan(200);
    expect(checked).toBeGreaterThan(1000);
  });
});

// ---- execute harness (same shape as execute.test.ts) ----
type Hit = { url: string; init: RequestInit };
function edeps(handler: (h: Hit) => Response | Promise<Response>, over: Partial<ExecuteDeps> = {}) {
  const hits: Hit[] = [];
  const d: ExecuteDeps = {
    host: "git.door43.org", version: "1.27.2+dcs",
    fetch: (async (url: any, init: any) => { const h = { url: String(url), init }; hits.push(h); return handler(h); }) as any,
    grant: { accessToken: "A1", refreshToken: "R1" }, refresh: async () => null, swagger: async () => ["/api/v1/catalog/search"], ...over,
  };
  return { d, hits };
}
const json = (b: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", ...headers } });

describe("v2.2 — typed next", () => {
  it("replay of next from a call made with limit:3 sends limit=3 and echoes next.query.limit as a number", async () => {
    const link = '<https://git.door43.org/api/v1/catalog/search?limit=3&page=2&stage=prod&showIngredients=true>; rel="next"';
    const { d, hits } = edeps(() => json({ data: [] }, 200, { link }));
    const e = await runExecute(d, { method: "GET", path: "/catalog/search", query: { limit: 3, stage: "prod", showIngredients: true } });
    expect(e.next?.query).toEqual({ limit: 3, page: 2, stage: "prod", showIngredients: true });
    expect(typeof e.next?.query?.limit).toBe("number");
    const e2 = await runExecute(d, e.next!);
    expect(new URL(hits[1].url).searchParams.get("limit")).toBe("3");
    expect(e2.request.query).toEqual({ limit: 3, page: 2, stage: "prod", showIngredients: true });
  });
  it("typedQuery: caller's type wins; upstream-added keys typed by shape; strings stay strings", () => {
    const q = typedQuery(new URLSearchParams("limit=3&page=2&q=42&flag=false"), { limit: 3, q: "42" });
    expect(q).toEqual({ limit: 3, page: 2, q: "42", flag: false });
  });
});

describe("v2.2 — conditional reads and ratelimit", () => {
  it("if-none-match → 304, body null, cost.bytes 0, hint unchanged (DCS sends no etag live; proven with injected fetch)", async () => {
    const { d, hits } = edeps(() => new Response(null, { status: 304, headers: { etag: 'W/"abc"' } }));
    const e = await runExecute(d, { method: "GET", path: "/catalog/search", headers: { "if-none-match": 'W/"abc"' } });
    expect(e.status).toBe(304);
    expect(e.body).toBeNull();
    expect(e.cost.bytes).toBe(0);
    expect(e.upstream.etag).toBe('W/"abc"');
    expect(e.hints.join(" ")).toMatch(/unchanged since W\/"abc"/);
    expect((hits[0].init.headers as any)["if-none-match"]).toBe('W/"abc"');
    expect(hits.length).toBe(1);
  });
  it("upstream.etag and ratelimit are null when DCS sent nothing (the live case, observed 2026-09-03)", async () => {
    const { d } = edeps(() => json({ login: "klappy" }));
    const e = await runExecute(d, { method: "GET", path: "/user" });
    expect(e.upstream.etag).toBeNull();
    expect(e.upstream.ratelimit).toBeNull();
    expect(e.hints.some((h) => h.startsWith("ratelimit"))).toBe(false);
  });
  it("upstream.ratelimit present (+hint) when DCS sends x-ratelimit-*; etag surfaced with a hint", async () => {
    const { d } = edeps(() => json({ login: "klappy" }, 200, { etag: '"e1"', "x-ratelimit-remaining": "42", "x-ratelimit-reset": "1788412800" }));
    const e = await runExecute(d, { method: "GET", path: "/user" });
    expect(e.upstream.ratelimit).toEqual({ remaining: 42, reset: "2026-09-03T05:20:00.000Z" });
    expect(e.upstream.etag).toBe('"e1"');
    expect(e.hints.join(" ")).toMatch(/ratelimit: 42 remaining/);
    expect(e.hints.join(" ")).toMatch(/etag "e1"/);
  });
});

describe("v2.2 — teaching on 200 costs zero fetches", () => {
  const catalog = { ok: true, data: [{ full_name: "OBS-TLF/ahr_obs", owner: "OBS-TLF", commit_sha: "abc" }] };
  it("fields data[].owner.login on /catalog/search → hint naming the shape (owner is a string); 1 fetch", async () => {
    const { d, hits } = edeps(() => json(catalog));
    const e = await runExecute(d, { method: "GET", path: "/catalog/search", fields: ["data[].owner.login"] });
    expect(e.status).toBe(200);
    const h = e.hints.find((x) => x.includes("data[].owner.login"))!;
    expect(h).toMatch(/is a string/);
    expect(h).toMatch(/keys at this level: .*full_name/);
    expect(hits.length).toBe(1);
  });
  it("a field that exists → no teaching hint; a key that is not there → hint with the real keys; still 1 fetch", async () => {
    const { d, hits } = edeps(() => json(catalog));
    const ok = await runExecute(d, { method: "GET", path: "/catalog/search", fields: ["data[].full_name"] });
    expect(ok.hints.some((x) => x.includes("selected nothing"))).toBe(false);
    const bad = await runExecute(d, { method: "GET", path: "/catalog/search", fields: ["data[].zipball"] });
    expect(bad.hints.find((x) => x.includes("data[].zipball"))).toMatch(/keys at this level: full_name, owner, commit_sha/);
    expect(hits.length).toBe(2);
  });
  it("ref that is a branch name → moving-ref hint; a 40-hex ref → none; 1 fetch each", async () => {
    const { d, hits } = edeps(() => json({ content: "x" }));
    const a = await runExecute(d, { method: "GET", path: "/repos/o/r/contents/README.md", query: { ref: "master" } });
    expect(a.hints.join(" ")).toMatch(/moving ref/);
    const b = await runExecute(d, { method: "GET", path: "/repos/o/r/contents/README.md", query: { ref: "a".repeat(40) } });
    expect(b.hints.join(" ")).not.toMatch(/moving ref/);
    expect(hits.length).toBe(2);
  });
  it("fieldsTeach is pure and never touches the network", () => {
    expect(fieldsTeach({ a: { b: 1 } }, ["a.c"])).toHaveLength(1);
    expect(fieldsTeach({ a: { b: 1 } }, ["a.b"])).toHaveLength(0);
    expect(fieldsTeach("text", ["a"])).toHaveLength(0);
    // Heterogeneous array: some items have the key — selector resolved; no "selected nothing".
    expect(fieldsTeach({ data: [{ extra: 1 }, { name: "b" }] }, ["data[].extra"])).toHaveLength(0);
    expect(fieldsTeach({ data: [{ name: "a" }, { name: "b" }] }, ["data[].extra"])).toHaveLength(1);
  });
});

describe("HYGIENE 19 guard", () => {
  it("no VERSION constant re-appears in src/", () => {
    const files = ["execute", "docs"].map((f) => readFileSync(new URL(`../src/tools/${f}.ts`, import.meta.url), "utf8"));
    for (const src of files) expect(src).not.toMatch(/VERSION\s*=\s*"/);
  });
});
