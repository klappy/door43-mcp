/**
 * Default handler: the user<->server login leg against DCS OIDC (SPEC §Auth flow).
 *   /authorize — MCP client arrives; parse the provider request; redirect to DCS
 *                with PKCE S256, scopes `openid profile email`. State = sealed
 *                { req, verifier } under COOKIE_ENCRYPTION_KEY.
 *   /callback  — DCS returns code; exchange at /login/oauth/access_token; read
 *                /login/oauth/userinfo for sub+login; completeAuthorization with
 *                the grant as encrypted props.
 *   /health    — upstream reachability + version, public.
 *   /          — the homepage (src/home.ts), rendered from src/surface.ts.
 * No PAT path exists here by design (SECURITY: "No PATs, ever").
 */
import type { AuthRequest } from "@cloudflare/workers-oauth-provider";
import type { Env, GrantProps } from "./types";
import { open, randomVerifier, s256, seal } from "./seal";
import { renderHome } from "./home";

const html = (body: string, status = 200) =>
  new Response(`<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;max-width:40em;margin:3em auto">${body}</body>`, {
    status, headers: { "content-type": "text/html; charset=utf-8" },
  });

/** `debug` is sealed at /authorize (`?debug=1`) so the callback cannot be talked into the page by a query param. */
type Sealed = { req: AuthRequest; verifier: string; debug?: boolean };

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
      catch (e) { return html(`<h2>Bad authorization request.</h2><p>${(e as Error).message}</p><p>MCP clients register at <code>/register</code> first.</p>`, 400); }
      const verifier = randomVerifier();
      const debug = url.searchParams.get("debug") === "1";
      const state = await seal(env.COOKIE_ENCRYPTION_KEY, { req, verifier, debug } satisfies Sealed);
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
      if (!tok.ok) {
        // Surface DCS's own error (error/error_description only — never the secret, never the code).
        const errText = await tok.text();
        let err: any = {}; try { err = JSON.parse(errText); } catch { err = { raw: errText.slice(0, 300) }; }
        const shown = JSON.stringify({ error: err.error, error_description: err.error_description, raw: err.raw }, null, 2);
        return html(`<h2>DCS token exchange failed (${tok.status}).</h2><pre>${shown.replace(/</g, "&lt;")}</pre><p>observed_at ${new Date().toISOString()} · sent: grant_type=authorization_code, redirect_uri=${url.origin}/callback, code_verifier present, client_secret present (${env.D43_CLIENT_SECRET.length} chars)</p>`, 502);
      }
      const tokText = await tok.text();
      let t: { access_token: string; refresh_token?: string; expires_in?: number; token_type?: string };
      try { t = JSON.parse(tokText); } catch {
        return html(`<h2>DCS token endpoint returned non-JSON (${tok.status}, ${tok.headers.get("content-type")}).</h2><pre>${tokText.slice(0, 200).replace(/</g, "&lt;")}</pre>`, 502);
      }

      // Gate 0 observation: does the DCS OAuth access token authorize /api/v1/user with `Authorization: token`?
      const t0 = Date.now();
      const me = await fetch(`${base}/api/v1/user`, { headers: { authorization: `token ${t.access_token}`, accept: "application/json" } });
      const upstream_ms = Date.now() - t0;
      const meText = await me.text();
      let u: { id?: number; login?: string; sub?: string } = {};
      try { u = JSON.parse(meText); } catch { /* non-JSON handled below */ }
      const observed = { observed_at: new Date().toISOString(), header_shape: "Authorization: token <access>", status: me.status, content_type: me.headers.get("content-type"), login: u.login ?? null, expires_in_s: t.expires_in ?? null, has_refresh: Boolean(t.refresh_token), token_type: t.token_type ?? null, upstream_ms };
      if (me.status !== 200 || !u.login) {
        // STOP condition (ticket): record exactly, no PAT fallback. Body is DCS's, not ours.
        return html(`<h2>Gate 0 STOP — GET /api/v1/user did not return the user.</h2><pre>${JSON.stringify(observed, null, 2)}</pre><pre>${meText.slice(0, 300).replace(/</g, "&lt;")}</pre>`, 502);
      }
      u.sub = String(u.id);
      const props: GrantProps = {
        sub: u.sub, login: u.login,
        accessToken: t.access_token, refreshToken: t.refresh_token,
        expiresIn: t.expires_in, expiresAt: t.expires_in ? Date.now() + t.expires_in * 1000 : undefined,
      };
      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: sealed.req, userId: u.sub, metadata: { login: props.login },
        scope: sealed.req.scope, props,
      });
      // Success → straight back to the client. Gate 0 is closed; its proof page lives only behind
      // `?debug=1` on the authorize URL (sealed into state), and prints login only — no token-adjacent fields.
      if (sealed.debug) {
        const shown = { observed_at: observed.observed_at, status: observed.status, login: observed.login, upstream_ms };
        return html(`<h2>Debug — logged in as <b>${u.login}</b>.</h2><pre>${JSON.stringify(shown, null, 2)}</pre><p><a href="${redirectTo}">Continue to client</a></p>`);
      }
      return Response.redirect(redirectTo, 302);
    }

    if (url.pathname === "/") {
      // The human door: rendered from src/surface.ts every request (ticket 2026-09-03-door43-mcp-homepage-readme).
      return new Response(renderHome({ host: env.D43_HOST, serverUrl: url.origin }), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return new Response("Not found", { status: 404 });
  },
};
