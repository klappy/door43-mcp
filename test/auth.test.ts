import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DcsAuthHandler } from "../src/dcs-auth";
import { seal } from "../src/seal";

// 32-byte AES-GCM key, hex. Test-only.
const KEY = "00".repeat(32);
const ORIGIN = "https://door43.test";
const CLIENT_REDIRECT = "http://localhost:6274/oauth/callback";

function env(over: Partial<Record<string, unknown>> = {}) {
  return {
    D43_CLIENT_ID: "cid", D43_CLIENT_SECRET: "gto_secret", COOKIE_ENCRYPTION_KEY: KEY, D43_HOST: "git.door43.org",
    OAUTH_PROVIDER: {
      parseAuthRequest: async () => ({ clientId: "c1", redirectUri: CLIENT_REDIRECT, scope: [], state: "s" }),
      completeAuthorization: async () => ({ redirectTo: `${CLIENT_REDIRECT}?code=XYZ&state=s` }),
    },
    ...over,
  } as any;
}

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });

let realFetch: typeof fetch;
beforeEach(() => { realFetch = globalThis.fetch; });
afterEach(() => { globalThis.fetch = realFetch; });

function upstream(exchangeOk: boolean) {
  globalThis.fetch = (async (url: any) => {
    const u = String(url);
    if (u.endsWith("/login/oauth/access_token")) {
      return exchangeOk
        ? json({ access_token: "A1", refresh_token: "R1", expires_in: 3600, token_type: "bearer" })
        : json({ error: "unauthorized_client", error_description: "bad secret" }, 401);
    }
    if (u.endsWith("/api/v1/user")) return json({ id: 42, login: "klappy" });
    return new Response("unexpected " + u, { status: 500 });
  }) as any;
}

async function callback(debug?: boolean) {
  const req = await env().OAUTH_PROVIDER.parseAuthRequest();
  const state = await seal(KEY, { req, verifier: "v", ...(debug === undefined ? {} : { debug }) });
  return DcsAuthHandler.fetch(new Request(`${ORIGIN}/callback?code=c&state=${state}`), env());
}

describe("/authorize (no page of ours before DCS)", () => {
  it("302s straight to DCS; state carries debug=false by default", async () => {
    const r = await DcsAuthHandler.fetch(new Request(`${ORIGIN}/authorize?client_id=c1`), env());
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toMatch(/^https:\/\/git\.door43\.org\/login\/oauth\/authorize\?/);
  });
});

describe("/callback success (ticket 2026-09-02-door43-mcp-callback-redirect)", () => {
  it("→ 302 with Location = client redirect; no intermediate page", async () => {
    upstream(true);
    const r = await callback();
    expect(r.status).toBe(302);
    expect(r.headers.get("location")!.startsWith(CLIENT_REDIRECT)).toBe(true);
  });
  it("?debug=1 sealed into state → 200 HTML, login only, no token-adjacent fields", async () => {
    upstream(true);
    const r = await callback(true);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toMatch(/text\/html/);
    const body = await r.text();
    expect(body).toContain("klappy");
    expect(body).toContain(CLIENT_REDIRECT);
    for (const leak of ["expires_in", "has_refresh", "token_type", "A1", "R1"]) expect(body).not.toContain(leak);
  });
  it("debug on the callback query alone does NOT open the page (flag must be sealed)", async () => {
    upstream(true);
    const req = await env().OAUTH_PROVIDER.parseAuthRequest();
    const state = await seal(KEY, { req, verifier: "v" });
    const r = await DcsAuthHandler.fetch(new Request(`${ORIGIN}/callback?code=c&state=${state}&debug=1`), env());
    expect(r.status).toBe(302);
  });
});

describe("/callback exchange failure (unchanged)", () => {
  it("→ 502 HTML with DCS's error, never the secret", async () => {
    upstream(false);
    const r = await callback();
    expect(r.status).toBe(502);
    const body = await r.text();
    expect(body).toContain("unauthorized_client");
    expect(body).not.toContain("gto_secret");
  });
});
