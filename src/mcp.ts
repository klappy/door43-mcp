/**
 * The gated /mcp side. OAuthProvider has verified the client token and decrypted
 * THIS grant's props before the agent runs. Gate 0 exposes ONE tool, `whoami`
 * (deleted before gate 1; `execute` replaces it — ticket 2026-09-02-door43-mcp-gate0).
 * Response envelope per health-code/mcp-server-build-convention.md §7, even for the spike.
 */
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env, GrantProps } from "./types";

export const VERSION = "0.1.0";

export class Door43MCP extends McpAgent<Env, Record<string, never>, GrantProps> {
  server = new McpServer({ name: "door43-mcp", version: VERSION });

  async init() {
    this.server.registerTool(
      "whoami",
      {
        title: "Who am I on DCS",
        description: "Gate 0 spike: GET /api/v1/user on the upstream DCS host as the logged-in user, with `Authorization: token <access>`. Returns the convention §7 envelope; body carries the DCS user (login field). Read-only.",
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
        inputSchema: {},
      },
      async () => {
        const env = this.env;
        const props = this.props;
        if (!props?.accessToken) {
          return { content: [{ type: "text" as const, text: JSON.stringify({ observed_at: new Date().toISOString(), status: 401, hints: ["no grant on this session; re-login via /authorize"] }) }], isError: true };
        }
        const host = env.D43_HOST;
        const path = "/api/v1/user";
        const t0 = Date.now();
        const r = await fetch(`https://${host}${path}`, {
          headers: { authorization: `token ${props.accessToken}`, accept: "application/json",
            "user-agent": `door43-mcp/${VERSION} (+https://door43.klappy.dev)` },
        });
        const upstream_ms = Date.now() - t0;
        const text = await r.text();
        let body: unknown = text; try { body = JSON.parse(text); } catch { /* keep text */ }
        const v = await fetch(`https://${host}/api/v1/version`).then((x) => x.ok ? x.json<{ version: string }>() : null).catch(() => null);
        const hints: string[] = [];
        if (r.status === 401 || r.status === 403) hints.push(`DCS returned ${r.status} for header shape 'Authorization: token'; STOP per ticket — open T1, no PAT fallback.`);
        const envelope = {
          observed_at: new Date().toISOString(),
          upstream: { host, version: v?.version ?? null },
          request: { tool: "whoami", method: "GET", path, query: {}, fields: [], header_shape: "Authorization: token <access>" },
          status: r.status,
          body,
          truncated: false, next: null, continue: null,
          hints,
          cost: { bytes: text.length, tokens_est: Math.ceil(text.length / 4), upstream_ms },
          grant: { login: props.login, expires_in_s: props.expiresIn ?? null, has_refresh: Boolean(props.refreshToken) },
        };
        return { content: [{ type: "text" as const, text: JSON.stringify(envelope, null, 2) }], isError: !r.ok };
      },
    );
  }
}
