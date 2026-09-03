/**
 * The gated /mcp side. OAuthProvider has verified the client token and decrypted
 * THIS grant's props before the agent runs. Gate 1: ONE tool, `execute` (the
 * gate-0 `whoami` spike is retired — same call is `execute({method:"GET", path:"/user"})`).
 * Ceiling: klappy://canon/constraints/mcp-tool-surface-ceiling · convention §2.
 */
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Env, GrantProps } from "./types";
import { runExecute, VERSION, type Grant } from "./tools/execute";
import { loadLatestGrant, newerStored, saveLatestGrant, selectGrant, type StoredGrant } from "./grant";
import { refreshDcs, swaggerPaths, upstreamVersion } from "./upstream";

export { VERSION };

const STORE_KEY = "grant:refreshed";

export class Door43MCP extends McpAgent<Env, Record<string, never>, GrantProps> {
  server = new McpServer({ name: "door43-mcp", version: VERSION });

  /** Latest DCS grant: in-`execute` refresh (DO + sealed KV) vs provider props.
   *  Recency wins so a later `/token` refresh is not stuck behind a stale store.
   *  tokenExchangeCallback (src/index.ts) reads the same KV key after rotation. */
  private async currentGrant(): Promise<Grant | null> {
    const p = this.props;
    if (!p?.accessToken) return null;
    const local = await this.ctx.storage.get<StoredGrant>(STORE_KEY);
    const kv = p.sub ? await loadLatestGrant(this.env, p.sub) : null;
    return selectGrant(p, newerStored(local, kv));
  }

  async init() {
    this.server.registerTool(
      "execute",
      {
        title: "Execute one read against DCS as you",
        description:
          "One call `{method, path, query?, fields?, headers?, continue?}` forwarded to the upstream DCS host as the logged-in user " +
          "(`Authorization: token <access>`). GET/HEAD only in v1 (POST etc → 405, v2 gates writes). `path` is `/api/v1/…` (the `/api/v1` " +
          "prefix is optional: `/user`, `/catalog/search`, `/repos/{o}/{r}/contents/{p}`) or `/{owner}/{repo}/archive/{ref}.zip` (HEAD → body.url). " +
          "`fields` is a deterministic JSON-path projection (`data[].name`, `release.tag_name`) applied after the upstream answers — selection only, never semantics. " +
          "Every answer is the envelope `{observed_at, upstream, request, status, body, truncated, next, continue, hints[], cost}`: `next` is the pre-formed call for the " +
          "upstream's next page, `continue` re-enters a body cut at 200 KB, `hints` teach (401 → refreshed or re-login, 404 → nearest documented paths, 405 → v2).",
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
        inputSchema: {
          method: z.enum(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]).describe("GET or HEAD in v1; others answer 405 without touching the upstream"),
          path: z.string().describe("Upstream path; parameters go in `query`, not here"),
          query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
          fields: z.array(z.string()).optional().describe("JSON paths to keep, e.g. [\"data[].name\",\"data[].owner.login\"]"),
          headers: z.record(z.string(), z.string()).optional().describe("Forwarded only: accept, accept-language, if-none-match, if-modified-since, range"),
          continue: z.string().optional().describe("Opaque token from a truncated answer's `continue`"),
        },
      },
      async (input) => {
        const env = this.env;
        const host = env.D43_HOST;
        const grant = await this.currentGrant();
        const out = await runExecute(
          {
            host,
            version: await upstreamVersion(host),
            fetch: (u, i) => fetch(u, i),
            grant,
            consumer: this.props?.login ?? "unknown",
            loginUrl: "https://door43.klappy.dev/authorize",
            swagger: () => swaggerPaths(host),
            refresh: async (g) => {
              if (!g.refreshToken) return null;
              const t = await refreshDcs(host, env.D43_CLIENT_ID, env.D43_CLIENT_SECRET, g.refreshToken);
              if (!t) return null;
              const fresh: StoredGrant = {
                accessToken: t.access_token, refreshToken: t.refresh_token ?? g.refreshToken,
                sub: this.props?.sub ?? "", at: Date.now(),
              };
              await this.ctx.storage.put(STORE_KEY, fresh);
              await saveLatestGrant(env, fresh);
              return { accessToken: fresh.accessToken, refreshToken: fresh.refreshToken };
            },
          },
          input,
        );
        return { content: [{ type: "text" as const, text: JSON.stringify(out, null, 2) }], isError: out.status >= 400 };
      },
    );
  }
}
