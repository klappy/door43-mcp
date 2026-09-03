/**
 * door43-mcp — gate 0 (OAuth spike).
 * Library, not hand-rolled (convention §1): `agents` McpAgent behind
 * `@cloudflare/workers-oauth-provider`; upstream = DCS OIDC (PKCE S256).
 */
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { DcsAuthHandler } from "./dcs-auth";
import { Door43MCP } from "./mcp";

export { Door43MCP };

export default new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler: Door43MCP.serve("/mcp") as any,
  defaultHandler: DcsAuthHandler as any,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
  scopesSupported: ["dcs:read"],
});
