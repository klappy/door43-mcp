import { describe, it, expect } from "vitest";
import { runExecute, resolvePath, type ExecuteDeps } from "../src/tools/execute";
import { ENVELOPE_KEYS } from "../src/envelope";
import { project } from "../src/projection";
import { capBody, readContinue, BODY_CAP_BYTES } from "../src/cap";
import { nearestPaths, linkNext } from "../src/upstream";
import { selectGrant } from "../src/grant";

const SWAGGER = ["/api/v1/user", "/api/v1/users/{username}", "/api/v1/catalog/search", "/api/v1/catalog/entry/{owner}/{repo}/{tag}", "/api/v1/repos/{owner}/{repo}/contents/{filepath}", "/api/v1/version"];

type Hit = { url: string; init: RequestInit };
function deps(handler: (h: Hit) => Response | Promise<Response>, over: Partial<ExecuteDeps> = {}) {
  const hits: Hit[] = [];
  const d: ExecuteDeps = {
    host: "git.door43.org", version: "1.27.2+dcs",
    fetch: (async (url: any, init: any) => { const h = { url: String(url), init }; hits.push(h); return handler(h); }) as any,
    grant: { accessToken: "A1", refreshToken: "R1" },
    refresh: async () => ({ accessToken: "A2", refreshToken: "R1" }),
    swagger: async () => SWAGGER,
    ...over,
  };
  return { d, hits };
}
const json = (b: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", ...headers } });

describe("envelope shape (SPEC §7)", () => {
  it("pins the ten keys in order on a 200", async () => {
    const { d, hits } = deps(() => json({ login: "klappy" }));
    const e = await runExecute(d, { method: "GET", path: "/user" });
    expect(Object.keys(e)).toEqual([...ENVELOPE_KEYS]);
    expect(e.status).toBe(200);
    expect((e.body as any).login).toBe("klappy");
    expect(e.request).toEqual({ tool: "execute", method: "GET", path: "/user", query: {}, fields: [] });
    expect(hits[0].url).toBe("https://git.door43.org/api/v1/user");
    expect((hits[0].init.headers as any).authorization).toBe("token A1");
    expect(e.cost.bytes).toBeGreaterThan(0);
    expect(e.cost.tokens_est).toBe(Math.ceil(e.cost.bytes / 4));
  });
  it("pins the same keys on a 405", async () => {
    const { d } = deps(() => json({}));
    const e = await runExecute(d, { method: "POST", path: "/user" });
    expect(Object.keys(e)).toEqual([...ENVELOPE_KEYS]);
  });
});

describe("reads before writes (convention §3, T2)", () => {
  it("POST → 405, hint names v2, no fetch", async () => {
    const { d, hits } = deps(() => json({}));
    const e = await runExecute(d, { method: "POST", path: "/repos/x/y" });
    expect(e.status).toBe(405);
    expect(e.hints.join(" ")).toMatch(/v2/);
    expect(hits.length).toBe(0);
  });
  it("write leak via path is refused at the edge, no fetch", async () => {
    const { d, hits } = deps(() => json({}));
    for (const p of ["/user?action=delete", "/repos/../admin", "/user#x", "//evil"]) {
      const e = await runExecute(d, { method: "GET", path: p });
      expect(e.status).toBe(400);
    }
    expect(hits.length).toBe(0);
  });
  it("percent-encoded dots cannot leave /api/v1", async () => {
    const { d, hits } = deps(() => json({}));
    for (const p of [
      "/user/%2e%2e/%2e%2e/login/oauth/authorize",
      "/api/v1/%2e%2e/%2e%2e/login/oauth/authorize",
      "/repos/%2e%2e/admin",
      "/%2e%2e/login",
      "/user/%2E%2E/secret",
      "/user/%252e%252e/admin",
    ]) {
      const e = await runExecute(d, { method: "GET", path: p });
      expect(e.status).toBe(400);
    }
    expect(hits.length).toBe(0);
    expect("refuse" in resolvePath("git.door43.org", "GET", "/api/v1/%2e%2e/%2e%2e/login/oauth/authorize")).toBe(true);
  });
  it("archive path is HEAD only", () => {
    expect("refuse" in resolvePath("h", "GET", "/o/r/archive/v1.zip")).toBe(true);
    const r = resolvePath("h", "HEAD", "/o/r/archive/v1.zip");
    expect("kind" in r && r.kind).toBe("archive");
  });
  it("only allow-listed headers are forwarded", async () => {
    const { d, hits } = deps(() => json({}));
    await runExecute(d, { method: "GET", path: "/user", headers: { "If-None-Match": "\"e\"", "X-Forwarded-Host": "evil", cookie: "x" } });
    const h = hits[0].init.headers as Record<string, string>;
    expect(h["if-none-match"]).toBe("\"e\"");
    expect(h["x-forwarded-host"]).toBeUndefined();
    expect(h["cookie"]).toBeUndefined();
  });
});

describe("refresh-on-401 (SPEC §execute)", () => {
  it("one silent refresh, one retry, visible only as a hint", async () => {
    let n = 0;
    const { d, hits } = deps(() => (n++ === 0 ? json({ message: "expired" }, 401) : json({ login: "klappy" })));
    const e = await runExecute(d, { method: "GET", path: "/user" });
    expect(e.status).toBe(200);
    expect(hits.length).toBe(2);
    expect((hits[1].init.headers as any).authorization).toBe("token A2");
    expect(e.hints.some((h) => h.includes("refreshed"))).toBe(true);
  });
  it("second 401 → envelope 401 with re-login hint; never a third try", async () => {
    const { d, hits } = deps(() => json({ message: "nope" }, 401));
    const e = await runExecute(d, { method: "GET", path: "/user" });
    expect(e.status).toBe(401);
    expect(hits.length).toBe(2);
    expect(e.hints.join(" ")).toMatch(/re-login/);
  });
  it("no grant → 401 without touching upstream", async () => {
    const { d, hits } = deps(() => json({}), { grant: null });
    const e = await runExecute(d, { method: "GET", path: "/user" });
    expect(e.status).toBe(401);
    expect(hits.length).toBe(0);
  });
});

describe("teaching errors", () => {
  it("404 → three real swagger paths in hints", async () => {
    const { d } = deps(() => json({ message: "not found" }, 404));
    const e = await runExecute(d, { method: "GET", path: "/catalog/serch" });
    expect(e.status).toBe(404);
    const hint = e.hints.find((h) => h.startsWith("404"))!;
    expect(hint).toContain("/api/v1/catalog/search");
    expect(hint.split(" · ").length).toBe(3);
  });
  it("other 4xx passes DCS's body through", async () => {
    const { d } = deps(() => json({ message: "forbidden" }, 403));
    const e = await runExecute(d, { method: "GET", path: "/repos/a/b" });
    expect(e.status).toBe(403);
    expect((e.body as any).message).toBe("forbidden");
  });
  it("nearestPaths is deterministic", () => {
    expect(nearestPaths("/api/v1/usr", SWAGGER)).toEqual(nearestPaths("/api/v1/usr", SWAGGER));
    expect(nearestPaths("/api/v1/usr", SWAGGER)[0]).toBe("/api/v1/user");
  });
});

describe("next from Link (SPEC: derived from Link / X-Total-Count)", () => {
  it("pre-forms an execute call and echoes fields", async () => {
    const { d } = deps(() => json({ data: [{ name: "a" }] }, 200, {
      link: '<https://git.door43.org/api/v1/catalog/search?q=ult&limit=2&page=2>; rel="next", <https://git.door43.org/api/v1/catalog/search?q=ult&limit=2&page=9>; rel="last"',
      "x-total-count": "17" }));
    const e = await runExecute(d, { method: "GET", path: "/catalog/search", query: { q: "ult", limit: 2 }, fields: ["data[].name"] });
    expect(e.next).toEqual({ method: "GET", path: "/api/v1/catalog/search", query: { q: "ult", limit: "2", page: "2" }, fields: ["data[].name"] });
    expect(e.hints).toContain("x-total-count 17");
  });
  it("linkNext ignores non-next rels", () => { expect(linkNext('<https://x/y?page=3>; rel="last"')).toBeNull(); });
});

describe("fields projection (T6, convention §9)", () => {
  const body = { ok: true, data: [{ name: "en_ult", owner: { login: "unfoldingWord", id: 1 }, extra: 1 }, { name: "en_ust", owner: { login: "uW" } }] };
  it("keeps only the named keys, nested arrays included", () => {
    expect(project(body, ["data[].name", "data[].owner.login"])).toEqual({ data: [{ name: "en_ult", owner: { login: "unfoldingWord" } }, { name: "en_ust", owner: { login: "uW" } }] });
  });
  it("is byte-identical on a second call", async () => {
    const { d } = deps(() => json(body));
    const a = await runExecute(d, { method: "GET", path: "/catalog/search", fields: ["data[].name", "data[].owner.login"] });
    const b = await runExecute(d, { method: "GET", path: "/catalog/search", fields: ["data[].name", "data[].owner.login"] });
    expect(JSON.stringify(a.body)).toBe(JSON.stringify(b.body));
    expect(Object.keys(a.body as any)).toEqual(["data"]);
  });
  it("unknown paths yield null, never throw; no defaults, no renames", () => {
    expect(project(body, ["nope.deeper", "data[].missing"])).toEqual({ nope: { deeper: null }, data: [{ missing: null }, { missing: null }] });
    expect(project([{ full_name: "a/b", x: 1 }], ["[].full_name"])).toEqual([{ full_name: "a/b" }]);
    expect(project({ release: { tag_name: "v1" } }, ["release.tag_name"])).toEqual({ release: { tag_name: "v1" } });
  });
  it("empty fields returns the body unchanged", () => { expect(project(body, [])).toBe(body); });
});

describe("200 KB cap + continue (convention §7: never a silent cut)", () => {
  it("truncated:true always ships a continue that round-trips to the rest", async () => {
    const big = { items: Array.from({ length: 20000 }, (_, i) => ({ i, s: "0123456789abcdef" })) };
    const { d } = deps(() => json(big));
    const e1 = await runExecute(d, { method: "GET", path: "/repos/a/b/contents/x", fields: ["items[].s"] });
    expect(e1.truncated).toBe(true);
    expect(e1.continue).not.toBeNull();
    expect(e1.cost.bytes).toBe(BODY_CAP_BYTES);
    expect(e1.continue!.method).toBe("GET");
    expect(e1.continue!.path).toBe("/repos/a/b/contents/x");
    expect(readContinue(e1.continue!.continue)!.offset).toBe(BODY_CAP_BYTES);
    let text = e1.body as string; let c = e1.continue; let guard = 0;
    while (c && guard++ < 50) { const e = await runExecute(d, { ...c } as any); text += e.body as string; c = e.continue; }
    expect(JSON.parse(text)).toEqual({ items: big.items.map(({ s }) => ({ s })) });
  });
  it("small bodies are not truncated and carry no continue", async () => {
    const { d } = deps(() => json({ a: 1 }));
    const e = await runExecute(d, { method: "GET", path: "/user" });
    expect(e.truncated).toBe(false); expect(e.continue).toBeNull(); expect(e.body).toEqual({ a: 1 });
  });
  it("capBody slices on byte boundaries deterministically", () => {
    const s = "x".repeat(10);
    const a = capBody(s, 0, { method: "GET", path: "/p" }, 4);
    expect(a.text).toBe("xxxx"); expect(a.truncated).toBe(true); expect(readContinue(a.continue!.continue)!.offset).toBe(4);
    const b = capBody(s, 8, { method: "GET", path: "/p" }, 4);
    expect(b.text).toBe("xx"); expect(b.truncated).toBe(false); expect(b.continue).toBeNull();
  });
  it("continue slices do not split UTF-8 characters", () => {
    const s = "xxx" + "你" + "yyy";
    const a = capBody(s, 0, { method: "GET", path: "/p" }, 4);
    expect(a.truncated).toBe(true);
    expect(a.text).toBe("xxx");
    expect(a.text).not.toContain("\uFFFD");
    const off = readContinue(a.continue!.continue)!.offset;
    const b = capBody(s, off, { method: "GET", path: "/p" }, 20);
    expect(a.text + b.text).toBe(s);
    expect(JSON.parse(JSON.stringify(a.text + b.text))).toBe(s);
  });
});

describe("selectGrant (in-execute refresh vs provider props)", () => {
  const issued = 1_700_000_000_000;
  const ttl = 3600;
  const props = { sub: "1", login: "k", accessToken: "A1", refreshToken: "R1", expiresIn: ttl, expiresAt: issued + ttl * 1000 };
  it("uses props when nothing is stored", () => {
    expect(selectGrant(props, null)).toEqual({ accessToken: "A1", refreshToken: "R1" });
  });
  it("uses a stored in-execute refresh that is newer than props", () => {
    expect(selectGrant(props, { sub: "1", accessToken: "A2", refreshToken: "R2", at: issued + 1000 }))
      .toEqual({ accessToken: "A2", refreshToken: "R2" });
  });
  it("lets newer props win so a client /token refresh is not sticky", () => {
    const stored = { sub: "1", accessToken: "A2", refreshToken: "R2", at: issued + 1000 };
    const newer = { ...props, accessToken: "A3", refreshToken: "R3", expiresAt: issued + 10_000 + ttl * 1000 };
    expect(selectGrant(newer, stored)).toEqual({ accessToken: "A3", refreshToken: "R3" });
  });
  it("ignores stored for a different sub", () => {
    expect(selectGrant(props, { sub: "other", accessToken: "A2", refreshToken: "R2", at: issued + 1000 }))
      .toEqual({ accessToken: "A1", refreshToken: "R1" });
  });
});
