import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";

export interface Env {
  /** DCS OAuth2 app (confidential client). Worker secrets. */
  D43_CLIENT_ID: string;
  D43_CLIENT_SECRET: string;
  /** AES-GCM key (hex) sealing the PKCE verifier + auth request across the DCS redirect. Worker secret. */
  COOKIE_ENCRYPTION_KEY: string;
  /** One upstream host per deployment (convention §4). */
  D43_HOST: string;
  /** Provider grant store. */
  OAUTH_KV: KVNamespace;
  /** Telemetry exact channel: D1 `door43mcp_telemetry` (id 52fa8ea4-…, bound in wrangler.jsonc; never created by code). */
  TELEMETRY_DB?: D1Database;
  /** McpAgent Durable Object namespace. */
  MCP_OBJECT: DurableObjectNamespace;
  /** Injected by OAuthProvider on the default handler. */
  OAUTH_PROVIDER: OAuthHelpers;
}

/** Per-grant props: the logged-in DCS user's grant. Encrypted at rest by the provider. */
export interface GrantProps extends Record<string, unknown> {
  sub: string;
  login: string;
  accessToken: string;
  refreshToken?: string;
  /** ms epoch when the access token expires, as reported by DCS at exchange. */
  expiresAt?: number;
  /** DCS-reported expires_in (seconds) — observed value for PLAN gate 0. */
  expiresIn?: number;
}
