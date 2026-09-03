/**
 * door43-mcp — gate 1 (`execute`).
 * Library, not hand-rolled (convention §1): `agents` McpAgent behind
 * `@cloudflare/workers-oauth-provider`; upstream = DCS OIDC (PKCE S256).
 * The durable refresh path is the provider's own: when a client refreshes its
 * door43 token, the DCS grant is refreshed too and the new props are stored.
 */
import OAuthProvider, { OAuthError } from "@cloudflare/workers-oauth-provider";
import { DcsAuthHandler } from "./dcs-auth";
import { Door43MCP } from "./mcp";
import { refreshDcs } from "./upstream";
import type { Env, GrantProps } from "./types";

export { Door43MCP };

const provider = new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler: Door43MCP.serve("/mcp") as any,
  defaultHandler: DcsAuthHandler as any,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
  scopesSupported: ["dcs:read"],
  tokenExchangeCallback: async (o) => {
    if (o.grantType !== "refresh_token") return;
    const props = o.props as GrantProps;
    if (!props?.refreshToken) return;
    const env = (globalThis as any).__door43Env as Env | undefined;
    if (!env) return; // set by fetch() below; absent only in tests
    const t = await refreshDcs(env.D43_HOST, env.D43_CLIENT_ID, env.D43_CLIENT_SECRET, props.refreshToken);
    if (!t) throw new OAuthError("invalid_grant", { description: "upstream DCS refresh failed; re-login" });
    const newProps: GrantProps = { ...props, accessToken: t.access_token, refreshToken: t.refresh_token ?? props.refreshToken,
      expiresIn: t.expires_in, expiresAt: t.expires_in ? Date.now() + t.expires_in * 1000 : undefined };
    return { newProps };
  },
});

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    (globalThis as any).__door43Env = env;
    return provider.fetch(request, env, ctx);
  },
};
