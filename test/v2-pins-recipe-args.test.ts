/**
 * v2.3 (pins) + v2.4 (recipe grammar: args, templates, dry_run). Each `it` is one ticket done-means.
 * Rail: klappy/kitchen 2026-09-03-door43-mcp-v2-2-pins-recipe-args. Failure modes pinned at the end:
 * no case here spends a fetch to obtain a sha (grep `hits.length` — every pin/dry-run case asserts 0 or 1).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { runDocs, type DocsDeps } from "../src/tools/docs";
import { runExecute, applyPin, estimatePlan, ESTIMATE_BASIS, type ExecuteDeps } from "../src/tools/execute";
import { RECIPES, fill, recipeSchema, MAX_STEPS } from "../src/recipes";
import { p50BytesByFamily, type TelemetryDb } from "../src/telemetry";
import type { SwaggerDoc } from "../src/upstream";

const SHA = "a3c1f0e9b2d4c6a8e0f2b4d6c8a0e2f4b6d8c0a2";
const raw = JSON.parse(readFileSync(new URL("./fixtures/swagger-full-slim.json", import.meta.url), "utf8"));
const SW: SwaggerDoc = { basePath: raw.basePath, version: raw.info.version, etag: 'W/"swag-1"', observed_at: raw._provenance.observed_at, paths: raw.paths, definitions: raw.definitions, responses: raw.responses };
const ddeps = (over: Partial<DocsDeps> = {}): DocsDeps => ({ host: "git.door43.org", version: "0.5.0", upstreamVersion: "1.27.2+dcs", swagger: async () => SW, login: "klappy", loginUrl: "https://door43.klappy.dev/authorize", serverUrl: "https://door43.klappy.dev", ...over });

type Hit = { url: string; init: RequestInit };
function xdeps(handler: (h: Hit) => Response | Promise<Response>, over: Partial<ExecuteDeps> = {}) {
  const hits: Hit[] = [];
  const d: ExecuteDeps = { host: "git.door43.org", version: "1.27.2+dcs", fetch: (async (url: any, init: any) => { const h = { url: String(url), init }; hits.push(h); return handler(h); }) as any,
    grant: { accessToken: "A1", refreshToken: "R1" }, refresh: async () => null, swagger: async () => [], ...over };
  return { d, hits };
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });

describe("v2.4 — recipe grammar: args and templates (docs)", () => {
  it("docs({recipe:latest-release-zip, args:{owner,repo}}) → calls with that path; nothing hard-coded", async () => {
    const e = await runDocs(ddeps(), { recipe: "latest-release-zip", args: { owner: "unfoldingWord", repo: "en_ust" } });
    expect(e.status).toBe(200);
    const b = e.body as any;
    expect(b.calls[0].path).toBe("/repos/unfoldingWord/en_ust/releases/latest");
    expect(b.args).toEqual({ owner: "unfoldingWord", repo: "en_ust" });
    expect(b.about).toBe(RECIPES["latest-release-zip"].about);
    expect(JSON.stringify(Object.values(RECIPES).map((r) => r.calls))).not.toContain("en_ult"); // DELTA seed 4: no call hard-codes a repo
    expect(e.request.query).toMatchObject({ recipe: "latest-release-zip", args: { owner: "unfoldingWord", repo: "en_ust" } });
  });
  it("omit owner → 400 naming `owner` with its about", async () => {
    const e = await runDocs(ddeps(), { recipe: "latest-release-zip", args: { repo: "en_ust" } });
    expect(e.status).toBe(400);
    const b = e.body as any;
    expect(b.arg).toBe("owner");
    expect(b.about).toBe(RECIPES["latest-release-zip"].args.owner.about);
    expect(b.args.owner.required).toBe(true);
    expect(e.hints.join(" ")).toContain("owner");
  });
  it("defaults fill (ref=master, limit typed as number); a pattern arg is shape-checked, not fetched", () => {
    const t = fill("repo-tree-at-ref", { owner: "o", repo: "r" });
    expect(t.ok && t.plan.calls[0].path).toBe("/repos/o/r/git/trees/master");
    const p = fill("page-through", { limit: 7 });
    expect(p.ok && p.plan.calls[0].query?.limit).toBe(7);
    const bad = fill("read-file-at-pin", { owner: "o", repo: "r", path: "README.md", sha: "master" });
    expect(!bad.ok && bad.status === 400 && bad.arg).toBe("sha");
    const good = fill("read-file-at-pin", { owner: "o", repo: "r", path: "tn/README.md", sha: SHA });
    expect(good.ok && good.plan.calls[0]).toEqual({ method: "GET", path: "/repos/o/r/contents/tn/README.md", query: { ref: SHA }, fields: ["name", "sha", "size", "encoding", "content"] });
    const slash = fill("latest-release-zip", { owner: "o/x", repo: "r" });
    expect(!slash.ok && slash.arg).toBe("owner");
    // "" on an optional arg takes the default; no template survives into the plan (Bugbot #14).
    const empty = fill("repo-tree-at-ref", { owner: "o", repo: "r", ref: "" });
    expect(empty.ok && empty.plan.calls[0].path).toBe("/repos/o/r/git/trees/master");
    expect(JSON.stringify(empty.ok && empty.plan.calls)).not.toMatch(/\{[a-z]+\}/);
    const emptyReq = fill("latest-release-zip", { owner: "", repo: "r" });
    expect(!emptyReq.ok && emptyReq.arg).toBe("owner");
    const unknown = fill("whoami", { owner: "o" });
    expect(!unknown.ok && unknown.status).toBe(400);
  });
  it("docs({rung:recipes}) → every recipe's about + args schema, no calls, zero swagger reads", async () => {
    let reads = 0;
    const e = await runDocs(ddeps({ swagger: async () => { reads++; return SW; } }), { rung: "recipes" });
    expect(e.status).toBe(200);
    const r = (e.body as any).recipes;
    expect(Object.keys(r)).toEqual(Object.keys(RECIPES));
    expect(r["latest-release-zip"].args.owner).toEqual({ about: RECIPES["latest-release-zip"].args.owner.about, required: true });
    expect(r["repo-tree-at-ref"].args.ref.default).toBe("master");
    expect(JSON.stringify(r)).not.toContain('"calls"');
    expect(reads).toBe(0);
    expect(recipeSchema()["read-file-at-pin"].args.sha.pattern).toBe("^[0-9a-f]{40}$");
  });
  it("bound at definition: ≤ 5 steps, GET/HEAD only, no '?' in a path", () => {
    for (const [n, r] of Object.entries(RECIPES)) { expect(r.calls.length, n).toBeLessThanOrEqual(MAX_STEPS); for (const c of r.calls) { expect(["GET", "HEAD"]).toContain(c.method); expect(c.path).not.toMatch(/[?#]/); } }
  });
});

describe("v2.4 — dry_run prices the plan with a named basis (execute)", () => {
  it("execute({recipe, args, dry_run:true}) → body.plan, body.estimate.basis is a string, zero upstream fetches", async () => {
    const { d, hits } = xdeps(() => json({}), { p50BytesByFamily: async () => ({ "/repos": 1200, "/catalog": 1690, "/user": 300, other: 100 }) });
    const e = await runExecute(d, { recipe: "latest-release-zip", args: { owner: "unfoldingWord", repo: "en_ust" }, dry_run: true });
    expect(e.status).toBe(200);
    const b = e.body as any;
    expect(b.plan.calls[0].path).toBe("/repos/unfoldingWord/en_ust/releases/latest");
    expect(b.estimate).toEqual({ bytes: 1200, calls: 1, basis: ESTIMATE_BASIS });
    expect(typeof b.estimate.basis).toBe("string");
    expect(hits.length).toBe(0);
    expect(e.request.query).toMatchObject({ recipe: "latest-release-zip", dry_run: true });
  });
  it("no history → estimate:null, basis:\"no history\"; still zero fetches, and no grant needed", async () => {
    const { d, hits } = xdeps(() => json({}), { grant: null });
    const e = await runExecute(d, { recipe: "whoami", dry_run: true });
    expect(e.status).toBe(200);
    expect((e.body as any).estimate).toBeNull();
    expect((e.body as any).basis).toBe("no history");
    expect(hits.length).toBe(0);
    const part = await estimatePlan(fill("whoami").ok ? (fill("whoami") as any).plan : null, async () => ({ "/repos": 5 }));
    expect(part.estimate).toBeNull(); expect(part.basis).toBe("no history for /user");
  });
  it("missing arg → 400 naming it; unknown recipe → 404; malformed run inputs → 400; all with zero fetches (the run itself is v2.5, test/v2-recipe-run.test.ts)", async () => {
    const { d, hits } = xdeps(() => json({}));
    expect((await runExecute(d, { recipe: "latest-release-zip", args: { repo: "x" }, dry_run: true })).body).toMatchObject({ arg: "owner" });
    expect((await runExecute(d, { recipe: "nope", dry_run: true })).status).toBe(404);
    expect((await runExecute(d, { recipe: "latest-release-zip", args: { repo: "x" } })).status).toBe(400);
    expect((await runExecute(d, { dry_run: true })).status).toBe(400);
    expect((await runExecute(d, { path: "/user" } as any)).status).toBe(400);
    expect(hits.length).toBe(0);
  });
  it("p50BytesByFamily reads only execute rows in the window and takes the median per family", async () => {
    const sqls: string[] = []; const binds: unknown[] = [];
    const db: TelemetryDb = { exec: async () => null, prepare: (sql) => { sqls.push(sql); return { bind: (...v) => { binds.push(...v); return { run: async () => null, all: async () => ({ results: [
      { path_family: "/repos", bytes_out: 100 }, { path_family: "/repos", bytes_out: 900 }, { path_family: "/repos", bytes_out: 300 }, { path_family: "/catalog", bytes_out: 40 }, { path_family: "/catalog", bytes_out: 60 },
    ] as any }) }; }, run: async () => null, all: async () => ({ results: [] }) }; } };
    const r = await p50BytesByFamily(db, 30, new Date("2026-09-03T18:00:00Z"));
    expect(r).toEqual({ "/repos": 300, "/catalog": 50 });
    expect(sqls[0]).toMatch(/tool_name = 'execute'/); expect(sqls[0]).toMatch(/bytes_out/); expect(sqls[0]).not.toMatch(/path\b[^_]/);
    expect(binds[0]).toBe("2026-08-04T18:00:00.000Z");
  });
});

describe("v2.3 — pins: the sha you already hold, never one we fetch", () => {
  it("execute GET /repos/{o}/{r}/contents/README.md {ref:master} pin:{sha} → echoed request.query.ref is the sha and the upstream URL had ?ref=<sha>; one fetch", async () => {
    const { d, hits } = xdeps(() => json({ name: "README.md", sha: "blob1" }));
    const e = await runExecute(d, { method: "GET", path: "/repos/unfoldingWord/en_ust/contents/README.md", query: { ref: "master" }, pin: { sha: SHA } });
    expect(e.status).toBe(200);
    expect(e.request.query.ref).toBe(SHA);
    expect(e.request.query.pin).toBe(SHA);
    expect(hits.length).toBe(1);
    expect(new URL(hits[0].url).searchParams.get("ref")).toBe(SHA);
    expect(e.hints.some((h) => h.startsWith("pinned to") && h.includes("was ref 'master'"))).toBe(true);
    expect(e.hints.some((h) => h.includes("moving ref"))).toBe(false);
  });
  it("pin sets ref when none was given; archive HEAD rewrites {ref}.zip; a non-sha or a path with no ref → 400, zero fetches", async () => {
    const { d, hits } = xdeps(() => new Response(null, { status: 302, headers: { location: `https://git.door43.org/o/r/archive/${SHA}.zip` } }));
    const a = await runExecute(d, { method: "GET", path: "/repos/o/r/git/trees/master", pin: { sha: SHA } });
    expect(a.request.query.ref).toBe(SHA); expect(new URL(hits[0].url).searchParams.get("ref")).toBe(SHA);
    const z = await runExecute(d, { method: "HEAD", path: "/o/r/archive/master.zip", pin: { sha: SHA } });
    expect(z.request.path).toBe(`/o/r/archive/${SHA}.zip`); expect(hits[1].url).toBe(`https://git.door43.org/o/r/archive/${SHA}.zip`);
    expect(hits.length).toBe(2);
    const bad = await runExecute(d, { method: "GET", path: "/repos/o/r/contents/x", pin: { sha: "master" } });
    expect(bad.status).toBe(400); expect((bad.body as any).error).toMatch(/40-hex/);
    const none = await runExecute(d, { method: "GET", path: "/user", pin: { sha: SHA } });
    expect(none.status).toBe(400); expect((none.body as any).error).toMatch(/no ref to pin/);
    expect(hits.length).toBe(2);
    expect(applyPin("/api/v1/repos/o/r/contents/x", undefined, SHA)).toEqual({ path: "/api/v1/repos/o/r/contents/x", query: { ref: SHA }, was: null });
  });
  it("docs({rung:map}) carries upstream.swagger.etag and observed_at (the docs-side pin)", async () => {
    const e = await runDocs(ddeps(), { rung: "map" });
    expect(e.status).toBe(200);
    expect(e.upstream.swagger).toEqual({ version: "1.27.2+dcs", etag: 'W/"swag-1"', observed_at: SW.observed_at });
  });
  it("no case here spends a fetch to obtain a sha (failure mode 1): the only fetches are the pinned reads themselves", () => {
    const src = readFileSync(new URL(import.meta.url), "utf8");
    expect(src).not.toMatch(/git\/refs/);
    expect(readFileSync(new URL("../src/recipes.ts", import.meta.url), "utf8")).not.toMatch(/fetch\(/);
    for (const r of Object.values(RECIPES)) for (const c of r.calls) expect(c.path).not.toMatch(/git\/refs/);
    // applyPin and estimatePlan are pure: neither takes a fetch.
    expect(applyPin.length).toBe(3); expect(estimatePlan.length).toBeLessThanOrEqual(2);
  });
});
