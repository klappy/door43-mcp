/**
 * The gated /mcp side. OAuthProvider has verified the client token and decrypted
 * THIS grant's props before the agent runs. Gates 2+3: the three tools the ceiling
 * describes — `docs`, `execute`, `telemetry` — and nothing else.
 * Ceiling: klappy://canon/constraints/mcp-tool-surface-ceiling · convention §2.
 * Every tool call writes one telemetry row through `ctx.waitUntil` (src/telemetry).
 * Tool descriptions are the connector's whole UI on the phone: one line, verb-first, ≤ 80 chars.
 */
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Env, GrantProps } from "./types";
import type { Envelope } from "./envelope";
import { byteLength } from "./envelope";
import { runExecute, VERSION, type Grant } from "./tools/execute";
import { runDocs } from "./tools/docs";
import { runTelemetry } from "./tools/telemetry";
import { writeRow, p50BytesByFamily, type TelemetryDb } from "./telemetry";
import { DESCRIPTIONS } from "./descriptions";
import { refreshDcs, swaggerDoc, swaggerPaths, upstreamVersion } from "./upstream";

export { VERSION };

const STORE_KEY = "grant:refreshed";
const SERVER_URL = "https://door43.klappy.dev";

export { DESCRIPTIONS };

export class Door43MCP extends McpAgent<Env, Record<string, never>, GrantProps> {
  server = new McpServer({ name: "door43-mcp", version: VERSION });

  /** The provider's props are per-token; a refresh done inside `execute` is kept in this
   *  Durable Object's storage so later calls on the same session reuse it. The durable
   *  path is the provider's `tokenExchangeCallback` (src/index.ts) on the client's own refresh. */
  private async currentGrant(): Promise<Grant | null> {
    const p = this.props;
    if (!p?.accessToken) return null;
    const stored = await this.ctx.storage.get<Grant & { sub: string }>(STORE_KEY);
    if (stored && stored.sub === p.sub) return { accessToken: stored.accessToken, refreshToken: stored.refreshToken ?? p.refreshToken };
    return { accessToken: p.accessToken, refreshToken: p.refreshToken };
  }

  /** One row per call, off the response path. Only allowlisted columns leave here (src/telemetry toRow). */
  private emit(tool: "docs" | "execute" | "telemetry", input: unknown, out: Envelope, t0: number) {
    const db = this.env.TELEMETRY_DB as TelemetryDb | undefined;
    if (!db) return;
    const p = this.ctx.waitUntil(writeRow(db, {
      tool_name: tool, method: out.request.method, path: tool === "execute" ? out.request.path : undefined,
      status: out.status, upstream_status: tool === "execute" ? out.status : null, upstream_ms: out.cost.upstream_ms,
      duration_ms: Date.now() - t0, bytes_in: byteLength(input), bytes_out: out.cost.bytes, truncated: out.truncated,
      consumer_label: this.props?.login ?? "unknown", consumer_source: this.props?.login ? "grant" : "none", worker_version: VERSION,
    }).catch(() => undefined));
    void p;
  }

  private reply(out: Envelope) {
    return { content: [{ type: "text" as const, text: JSON.stringify(out, null, 2) }], isError: out.status >= 400 };
  }

  async init() {
    const env = this.env;
    const host = env.D43_HOST;

    this.server.registerTool(
      "docs",
      {
        title: "Explain this server and DCS",
        description: DESCRIPTIONS.docs,
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
        inputSchema: {
          rung: z.enum(["map", "raw", "recipes"]).optional().describe("map = L1 path families; raw (with path) = L3 swagger slice; recipes = every recipe's args; omit for the boarding pass"),
          path: z.string().optional().describe("L2: one documented path, e.g. /catalog/search"),
          query: z.string().optional().describe("Lexical search over path names + summaries"),
          recipe: z.string().optional().describe("whoami · catalog-by-language · latest-release-zip · repo-tree-at-ref · page-through · read-file-at-pin — with `args`, the filled plan"),
          args: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe("Recipe args, e.g. {owner:\"unfoldingWord\", repo:\"en_ult\"}; a missing required arg answers 400 naming it"),
          detail: z.enum(["compact", "full"]).optional().describe("L2 only: compact (default) = names and types; full = descriptions + error responses"),
          fields: z.array(z.string()).optional().describe("Project the L2/L3 body, same selectors as execute"),
        },
      },
      async (input) => {
        const t0 = Date.now();
        const out = await runDocs({ host, version: VERSION, upstreamVersion: await upstreamVersion(host), swagger: () => swaggerDoc(host),
          login: this.props?.login ?? null, loginUrl: `${SERVER_URL}/authorize`, serverUrl: SERVER_URL }, input);
        this.emit("docs", input, out, t0);
        return this.reply(out);
      },
    );

    this.server.registerTool(
      "execute",
      {
        title: "Run one read against DCS as you",
        description: DESCRIPTIONS.execute,
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
        inputSchema: {
          method: z.enum(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]).optional().describe("GET or HEAD in v1; others answer 405 without touching the upstream; omit for {recipe, args, dry_run}"),
          path: z.string().optional().describe("Upstream path: /api/v1/… (prefix optional: /user, /catalog/search) or /{owner}/{repo}/archive/{ref}.zip (HEAD → body.url); parameters go in `query`"),
          query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
          fields: z.array(z.string()).optional().describe("JSON paths to keep, e.g. [\"data[].name\",\"data[].owner\"] — selection only"),
          headers: z.record(z.string(), z.string()).optional().describe("Forwarded only: accept, accept-language, if-none-match, if-modified-since, range"),
          continue: z.string().optional().describe("Opaque token from a truncated answer's `continue`"),
          pin: z.object({ sha: z.string() }).optional().describe("Pin this read to a 40-hex sha you already hold: ref (query) or {ref} (archive) is rewritten to it; no fetch is spent"),
          recipe: z.string().optional().describe("With `args` and `dry_run:true`: the filled plan + estimate{bytes,calls,basis}, zero upstream fetches"),
          args: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe("Recipe args"),
          dry_run: z.boolean().optional().describe("Price the recipe without spending"),
        },
      },
      async (input) => {
        const t0 = Date.now();
        const grant = await this.currentGrant();
        const out = await runExecute(
          {
            host, version: await upstreamVersion(host), fetch: (u, i) => fetch(u, i), grant,
            consumer: this.props?.login ?? "unknown", loginUrl: `${SERVER_URL}/authorize`, swagger: () => swaggerPaths(host),
            p50BytesByFamily: env.TELEMETRY_DB ? () => p50BytesByFamily(env.TELEMETRY_DB as TelemetryDb) : undefined,
            refresh: async (g) => {
              if (!g.refreshToken) return null;
              const t = await refreshDcs(host, env.D43_CLIENT_ID, env.D43_CLIENT_SECRET, g.refreshToken);
              if (!t) return null;
              const fresh: Grant = { accessToken: t.access_token, refreshToken: t.refresh_token ?? g.refreshToken };
              await this.ctx.storage.put(STORE_KEY, { ...fresh, sub: this.props?.sub ?? "" });
              return fresh;
            },
          },
          input,
        );
        this.emit("execute", input, out, t0);
        return this.reply(out);
      },
    );

    this.server.registerTool(
      "telemetry",
      {
        title: "Read this server's own usage numbers",
        description: DESCRIPTIONS.telemetry,
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
        inputSchema: { sql: z.string().describe("One SELECT over door43mcp_telemetry; no ';', no writes") },
      },
      async (input) => {
        const t0 = Date.now();
        const out = await runTelemetry({ host, upstreamVersion: await upstreamVersion(host), db: (env.TELEMETRY_DB as TelemetryDb | undefined) ?? null }, input);
        this.emit("telemetry", input, out, t0);
        return this.reply(out);
      },
    );
  }
}
