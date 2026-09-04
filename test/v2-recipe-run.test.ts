/**
 * v2.5 — recipe run. Each `it` is one ticket done-means (klappy/kitchen 2026-09-03-door43-mcp-v2-3-recipe-run).
 * Fetch is injected; every case asserts what reached the upstream. No case holds state between calls
 * except the `continue` token the client carries back (T13).
 */
import { describe, it, expect } from "vitest";
import { runExecute, type ExecuteDeps } from "../src/tools/execute";
import { RECIPES, defineRecipes, fill, MAX_STEPS, type Recipe } from "../src/recipes";
import { readRunContinue, mintRunContinue, BODY_CAP_BYTES } from "../src/cap";
import { toRow, TELEMETRY_COLUMNS, pathFamily } from "../src/telemetry";
import type { Envelope, ExecuteCall } from "../src/envelope";

type Hit = { url: string; init: RequestInit };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
const THREE: Record<string, Recipe> = {
  three: { about: "three reads", args: { owner: { about: "owner", required: true } }, calls: [
    { method: "GET", path: "/repos/{owner}/r", fields: ["full_name"] },
    { method: "GET", path: "/repos/{owner}/r/releases/latest", fields: ["tag_name"] },
    { method: "GET", path: "/repos/{owner}/r/git/trees/master", fields: ["sha"] },
  ] },
};
function xdeps(handler: (h: Hit, n: number) => Response | Promise<Response>, over: Partial<ExecuteDeps> = {}) {
  const hits: Hit[] = []; const steps: { call: ExecuteCall; out: Envelope }[] = [];
  const d: ExecuteDeps = { host: "git.door43.org", version: "1.27.2+dcs", fetch: (async (url: any, init: any) => { const h = { url: String(url), init }; hits.push(h); return handler(h, hits.length); }) as any,
    grant: { accessToken: "A1" }, refresh: async () => null, swagger: async () => ["/repos/{owner}/{repo}"], recipes: THREE, onStep: (call, out) => steps.push({ call, out }), ...over };
  return { d, hits, steps };
}
const bodies = [{ full_name: "o/r", x: 1 }, { tag_name: "v1" }, { sha: "abc", tree: [] }];

describe("v2.5 — recipe run", () => {
  it("3-step recipe → body.steps.length 3, status = last step, cost.bytes = Σ steps, 3 fetches in order", async () => {
    const { d, hits, steps } = xdeps((_h, n) => json(bodies[n - 1]));
    const e = await runExecute(d, { recipe: "three", args: { owner: "o" } });
    expect(e.status).toBe(200);
    const b = e.body as any;
    expect(b.steps.length).toBe(3);
    expect(hits.map((h) => new URL(h.url).pathname)).toEqual(["/api/v1/repos/o/r", "/api/v1/repos/o/r/releases/latest", "/api/v1/repos/o/r/git/trees/master"]);
    expect(e.cost.bytes).toBe(b.steps.reduce((a: number, s: Envelope) => a + s.cost.bytes, 0));
    expect(b.steps[0].body).toEqual({ full_name: "o/r" }); // per-step projection applied
    expect(e.truncated).toBe(false); expect(e.continue).toBeNull(); expect(e.next).toBeNull();
    expect(steps.length).toBe(3); // one onStep per step → one telemetry row per step
    expect(e.request.query).toMatchObject({ recipe: "three", args: { owner: "o" } });
  });
  it("step 2 forced to 404 → steps.length 2, truncated:true, continue = {recipe,args,continue:<from 2>}; replaying it runs steps 2–3 only", async () => {
    let fail = true;
    const { d, hits } = xdeps((_h, n) => (fail && n === 2 ? json({ message: "nope" }, 404) : json(bodies[(n - 1) % 3])));
    const e = await runExecute(d, { recipe: "three", args: { owner: "o" } });
    expect(e.status).toBe(404); expect(e.truncated).toBe(true);
    const b = e.body as any;
    expect(b.steps.length).toBe(2); expect(b.stopped_at).toBe(2);
    expect(e.continue).toMatchObject({ recipe: "three", args: { owner: "o" } });
    const tok = (e.continue as any).continue as string;
    expect(readRunContinue(tok)).toEqual({ recipe: "three", args: { owner: "o" }, from: 2 });
    expect(e.hints.join(" ")).toContain("resumes at step 2");
    // replay
    fail = false; hits.length = 0;
    const r = await runExecute(d, { ...(e.continue as any) });
    expect(hits.map((h) => new URL(h.url).pathname)).toEqual(["/api/v1/repos/o/r/releases/latest", "/api/v1/repos/o/r/git/trees/master"]);
    expect(r.status).toBe(200); expect(r.truncated).toBe(false); expect(r.continue).toBeNull();
    expect((r.body as any).from).toBe(2); expect((r.body as any).steps.length).toBe(2);
  });
  it("telemetry: 3 tool_call rows (one per step, path_family from the step) + 1 recipe_run row (path_family other); columns unchanged", async () => {
    const { d, steps } = xdeps((_h, n) => json(bodies[n - 1]));
    const e = await runExecute(d, { recipe: "three", args: { owner: "o" } });
    const base = { duration_ms: 1, bytes_in: 1, consumer_label: "t", consumer_source: "grant", worker_version: "t" };
    const rows = [...steps.map((s) => toRow({ ...base, tool_name: "execute", method: s.call.method, path: s.call.path, status: s.out.status, bytes_out: s.out.cost.bytes })),
      toRow({ ...base, event_type: "recipe_run", tool_name: "execute", method: e.request.method, path: e.request.path, status: e.status, bytes_out: e.cost.bytes })];
    expect(rows.filter((r) => r.event_type === "tool_call").length).toBe(3);
    expect(rows.filter((r) => r.event_type === "recipe_run").length).toBe(1);
    expect(rows[0].path_family).toBe("/repos"); expect(rows[3].path_family).toBe("other");
    expect(Object.keys(rows[3])).toEqual([...TELEMETRY_COLUMNS]);
    expect(pathFamily(e.request.path)).toBe("other");
  });
  it("a 6-step recipe fails at definition; a write verb fails at definition; the shipped table is within the bound", () => {
    const six = { six: { about: "", args: {}, calls: Array.from({ length: MAX_STEPS + 1 }, () => ({ method: "GET" as const, path: "/user" })) } };
    expect(() => defineRecipes(six)).toThrow(/6 steps/);
    expect(() => defineRecipes({ w: { about: "", args: {}, calls: [{ method: "POST" as any, path: "/user" }] } })).toThrow(/write verb/);
    for (const r of Object.values(RECIPES)) expect(r.calls.length).toBeLessThanOrEqual(MAX_STEPS);
    expect(RECIPES["repo-at-a-glance"].calls.length).toBe(3); // the live 3-step recipe the PR timed
  });
  it("run cap: bytes over 200 KB after a step stop the run with a continue from the next step", async () => {
    const big = "x".repeat(150 * 1024);
    const { d } = xdeps(() => json({ full_name: big, tag_name: big, sha: "s" }));
    const e = await runExecute(d, { recipe: "three", args: { owner: "o" } });
    expect((e.body as any).steps.length).toBe(2); expect(e.cost.bytes).toBeGreaterThan(BODY_CAP_BYTES);
    expect(readRunContinue((e.continue as any).continue)!.from).toBe(3);
  });
  it("no grant → step 1 answers 401 and the run stops there; a foreign or stale token starts at step 1; from beyond the end → 400", async () => {
    const { d, hits } = xdeps(() => json({}), { grant: null });
    const e = await runExecute(d, { recipe: "three", args: { owner: "o" } });
    expect(e.status).toBe(401); expect((e.body as any).steps.length).toBe(1); expect(hits.length).toBe(0);
    const { d: d2, hits: h2 } = xdeps((_h, n) => json(bodies[n - 1]));
    const bad = await runExecute(d2, { recipe: "three", args: { owner: "o" }, continue: "garbage" });
    expect(h2.length).toBe(3); expect(bad.hints.join(" ")).toContain("starts at step 1");
    const over = await runExecute(d2, { recipe: "three", args: { owner: "o" }, continue: mintRunContinue({ recipe: "three", args: { owner: "o" }, from: 9 }) });
    expect(over.status).toBe(400); expect(h2.length).toBe(3);
  });
  it("no server-side state: a run's continue is self-contained (fill from the token alone reproduces the plan)", () => {
    const t = readRunContinue(mintRunContinue({ recipe: "repo-at-a-glance", args: { owner: "unfoldingWord", repo: "en_ult" }, from: 2 }))!;
    const f = fill(t.recipe, t.args);
    expect(f.ok && f.plan.calls.length).toBe(3);
  });
});
