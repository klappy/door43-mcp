/**
 * Default handler: the user<->server login leg against DCS OIDC (SPEC §Auth flow).
 *   /authorize — MCP client arrives; parse the provider request; redirect to DCS
 *                with PKCE S256, scopes `openid profile email`. State = sealed
 *                { req, verifier } under COOKIE_ENCRYPTION_KEY.
 *   /callback  — DCS returns code; exchange at /login/oauth/access_token; read
 *                /login/oauth/userinfo for sub+login; completeAuthorization with
 *                the grant as encrypted props.
 *   /health    — upstream reachability + version, public.
 * No PAT path exists here by design (SECURITY: "No PATs, ever").
 */
import type { AuthRequest } from "@cloudflare/workers-oauth-provider";
import type { Env, GrantProps } from "./types";
import { open, randomVerifier, s256, seal } from "./seal";

const html = (body: string, status = 200) =>
  new Response(`<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;max-width:40em;margin:3em auto">${body}</body>`, {
    status, headers: { "content-type": "text/html; charset=utf-8" },
  });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Sealed = { req: AuthRequest; verifier: string };

export const DcsAuthHandler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const base = `https://${env.D43_HOST}`;

    if (url.pathname === "/health") {
      const t0 = Date.now();
      const r = await fetch(`${base}/api/v1/version`);
      const body = r.ok ? await r.json<{ version: string }>() : null;
      return Response.json({ observed_at: new Date().toISOString(), upstream: { host: env.D43_HOST, version: body?.version ?? null }, status: r.status, upstream_ms: Date.now() - t0 });
    }

    if (url.pathname === "/authorize") {
      let req: AuthRequest;
      try { req = await env.OAUTH_PROVIDER.parseAuthRequest(request); }
      catch (e) { return html(`<h2>Bad authorization request.</h2><p>${esc((e as Error).message)}</p><p>MCP clients register at <code>/register</code> first.</p>`, 400); }
      const verifier = randomVerifier();
      const state = await seal(env.COOKIE_ENCRYPTION_KEY, { req, verifier } satisfies Sealed);
      const a = new URL(`${base}/login/oauth/authorize`);
      a.searchParams.set("client_id", env.D43_CLIENT_ID);
      a.searchParams.set("redirect_uri", `${url.origin}/callback`);
      a.searchParams.set("response_type", "code");
      a.searchParams.set("scope", "openid profile email");
      a.searchParams.set("code_challenge", await s256(verifier));
      a.searchParams.set("code_challenge_method", "S256");
      a.searchParams.set("state", state);
      return Response.redirect(a.toString(), 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      if (error) {
        const desc = url.searchParams.get("error_description");
        return html(`<h2>Authorization failed (${esc(error)}).</h2>${desc ? `<p>${esc(desc)}</p>` : ""}`, 400);
      }
      if (!code || !state) return html("<h2>Missing code or state.</h2>", 400);
      let sealed: Sealed;
      try { sealed = await open<Sealed>(env.COOKIE_ENCRYPTION_KEY, state); }
      catch { return html("<h2>State invalid or tampered.</h2><p>Restart the connection from your client.</p>", 400); }

      const tok = await fetch(`${base}/login/oauth/access_token`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          client_id: env.D43_CLIENT_ID, client_secret: env.D43_CLIENT_SECRET,
          code, grant_type: "authorization_code",
          redirect_uri: `${url.origin}/callback`, code_verifier: sealed.verifier,
        }),
      });
      if (!tok.ok) return html(`<h2>DCS token exchange failed (${tok.status}).</h2>`, 502);
      const t = await tok.json<{ access_token: string; refresh_token?: string; expires_in?: number; token_type?: string }>();

      const ui = await fetch(`${base}/login/oauth/userinfo`, { headers: { authorization: `Bearer ${t.access_token}` } });
      if (!ui.ok) return html(`<h2>DCS userinfo failed (${ui.status}).</h2>`, 502);
      const u = await ui.json<{ sub: string; preferred_username?: string; name?: string }>();

      const props: GrantProps = {
        sub: u.sub, login: u.preferred_username ?? u.name ?? u.sub,
        accessToken: t.access_token, refreshToken: t.refresh_token,
        expiresIn: t.expires_in, expiresAt: t.expires_in ? Date.now() + t.expires_in * 1000 : undefined,
      };
      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: sealed.req, userId: u.sub, metadata: { login: props.login },
        scope: sealed.req.scope, props,
      });
      return Response.redirect(redirectTo, 302);
    }

    if (url.pathname === "/") {
      return html(`<h2>door43-mcp 0.1.0 — gate 0 spike</h2><p>Upstream <code>${env.D43_HOST}</code>. MCP endpoint <code>/mcp</code>. Governed by <code>klappy://canon/constraints/mcp-tool-surface-ceiling</code>.</p>`);
    }
    return new Response("Not found", { status: 404 });
  },
};
