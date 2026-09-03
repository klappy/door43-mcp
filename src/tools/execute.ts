/**
 * `execute({ method, path, query?, fields?, headers?, continue? })` — the one verb.
 * GET/HEAD to the upstream as the logged-in user; envelope on every answer;
 * `fields` projection; 200 KB cap with `continue`; refresh-on-401 once; teaching errors.
 * SPEC §execute · convention §2 §3 §7 §9 · TENSIONS T2 T6.
 *
 * The core is `runExecute(deps, input)` so tests drive it with an injected fetch and
 * assert what reached the upstream (write-leak and 405 tests assert *no* fetch).
 */
import { envelope, byteLength, type Envelope, type ExecuteCall } from "../envelope";
import { project } from "../projection";
import { capBody, readContinue } from "../cap";
import { linkNext, nearestPaths } from "../upstream";

export const VERSION = "0.3.0";
const API = "/api/v1";
const ARCHIVE = /^\/[\w.-]+\/[\w.-]+\/archive\/[^/?#]+\.zip$/;
const REFRESH_HINT = "refreshed: upstream token was expired; one silent refresh, one retry";

export interface ExecuteInput {
  method: string;
  path: string;
  query?: Record<string, string | number | boolean>;
  fields?: string[];
  headers?: Record<string, string>;
  continue?: string;
}

export interface Grant { accessToken: string; refreshToken?: string }

export interface ExecuteDeps {
  host: string;
  version: string | null;
  fetch: typeof fetch;
  grant: Grant | null;
  /** Refresh the grant once; returns the new grant or null. Persisting it is the caller's job. */
  refresh: (g: Grant) => Promise<Grant | null>;
  swagger: () => Promise<string[]>;
  consumer?: string;
  loginUrl?: string;
}

/** Only these headers may be forwarded; everything else is dropped (T2: passthrough, not a tunnel). */
const HEADER_ALLOW = new Set(["accept", "accept-language", "if-none-match", "if-modified-since", "range"]);

function requestEcho(input: ExecuteInput) {
  return { tool: "execute", method: input.method.toUpperCase(), path: input.path, query: input.query ?? {}, fields: input.fields ?? [] };
}

/** Resolve the caller's path to an upstream URL, or return the reason it is refused. */
export function resolvePath(host: string, method: "GET" | "HEAD", path: string): { url: URL; kind: "api" | "archive" } | { refuse: string } {
  if (typeof path !== "string" || !path.startsWith("/")) return { refuse: "path must start with '/'" };
  if (/[?#]/.test(path) || path.includes("..") || path.includes("//")) return { refuse: "path may not contain '?', '#', '..' or '//' — put parameters in `query`" };
  if (ARCHIVE.test(path)) {
    if (method !== "HEAD") return { refuse: "archive paths are HEAD only; body.url carries the resolved URL" };
    return { url: new URL(`https://${host}${path}`), kind: "archive" };
  }
  const full = path.startsWith(API + "/") || path === API ? path : API + path;
  return { url: new URL(`https://${host}${full}`), kind: "api" };
}

export async function runExecute(deps: ExecuteDeps, input: ExecuteInput): Promise<Envelope> {
  const req = requestEcho(input);
  const upstream = { host: deps.host, version: deps.version };
  const method = req.method;

  if (method !== "GET" && method !== "HEAD") {
    return envelope({ upstream, request: req, status: 405, body: { error: `${method} is not in v1` },
      hints: ["v2 gates writes (convention §3: reads before writes; mutating verbs mirror the upstream's own confirmations)"] });
  }
  const resolved = resolvePath(deps.host, method, input.path);
  if ("refuse" in resolved) {
    return envelope({ upstream, request: req, status: 400, body: { error: resolved.refuse }, hints: ["nothing was sent upstream"] });
  }
  if (!deps.grant?.accessToken) {
    return envelope({ upstream, request: req, status: 401, body: null,
      hints: [`no grant on this session; re-login at ${deps.loginUrl ?? "/authorize"}`] });
  }

  const url = resolved.url;
  for (const [k, v] of Object.entries(input.query ?? {})) url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { accept: "application/json", "user-agent": `door43-mcp/${VERSION} (+https://door43.klappy.dev; consumer=${deps.consumer ?? "unknown"})` };
  for (const [k, v] of Object.entries(input.headers ?? {})) if (HEADER_ALLOW.has(k.toLowerCase())) headers[k.toLowerCase()] = v;

  const hints: string[] = [];
  let grant = deps.grant;
  const call = async () => {
    const t0 = Date.now();
    const r = await deps.fetch(url.toString(), { method, headers: { ...headers, authorization: `token ${grant.accessToken}` }, redirect: "manual" });
    return { r, ms: Date.now() - t0 };
  };

  let { r, ms } = await call();
  if (r.status === 401 && grant.refreshToken) {
    const fresh = await deps.refresh(grant);
    if (fresh) { grant = fresh; hints.push(REFRESH_HINT); ({ r, ms } = await call()); ms += 0; }
  }
  if (r.status === 401) {
    return envelope({ upstream, request: req, status: 401, body: await safeBody(r),
      hints: [`grant expired; re-login at ${deps.loginUrl ?? "/authorize"}`], cost: { bytes: 0, tokens_est: 0, upstream_ms: ms } });
  }

  // Archive: HEAD → resolved URL (redirect target or the URL itself).
  if (resolved.kind === "archive") {
    const loc = r.headers.get("location");
    const body = { url: loc ? new URL(loc, url).toString() : url.toString(), status: r.status };
    return envelope({ upstream, request: req, status: r.status >= 300 && r.status < 400 ? 200 : r.status, body, hints, cost: { bytes: byteLength(body), tokens_est: 0, upstream_ms: ms } });
  }

  const raw = method === "HEAD" ? "" : await r.text();
  let body: unknown = raw;
  if (raw) { try { body = JSON.parse(raw); } catch { /* keep text */ } }
  if (method === "HEAD") body = Object.fromEntries([...r.headers.entries()].filter(([k]) => ["content-type", "content-length", "etag", "last-modified", "x-total-count", "link"].includes(k)));

  if (r.status === 404) {
    const idx = await deps.swagger();
    const near = nearestPaths(url.pathname, idx, 3);
    if (near.length) hints.push(`404: nearest documented paths — ${near.join(" · ")}`);
    return envelope({ upstream, request: req, status: 404, body, hints, cost: { bytes: byteLength(body), tokens_est: 0, upstream_ms: ms } });
  }
  if (r.status >= 400) {
    // Pass DCS's own message through; the hint is the status, not a wall (convention §7).
    return envelope({ upstream, request: req, status: r.status, body, hints: [...hints, `upstream ${r.status}: body carries DCS's message`], cost: { bytes: byteLength(body), tokens_est: 0, upstream_ms: ms } });
  }

  // next: pre-formed execute call from Link rel=next (SPEC: derived from Link / X-Total-Count).
  let next: ExecuteCall | null = null;
  const ln = linkNext(r.headers.get("link"));
  if (ln) next = { method: method as "GET" | "HEAD", path: ln.pathname, query: Object.fromEntries(ln.searchParams.entries()), ...(input.fields?.length ? { fields: input.fields } : {}) };
  const total = r.headers.get("x-total-count");
  if (total) hints.push(`x-total-count ${total}`);

  // fields → cap → continue.
  const projected = project(body, input.fields);
  const serialized = typeof projected === "string" ? projected : JSON.stringify(projected ?? null);
  const tok = readContinue(input.continue);
  if (input.continue && !tok) hints.push("continue token unreadable; served from offset 0");
  const baseCall: Omit<ExecuteCall, "continue"> = { method: method as "GET" | "HEAD", path: input.path, ...(input.query && Object.keys(input.query).length ? { query: input.query } : {}), ...(input.fields?.length ? { fields: input.fields } : {}) };
  const cap = capBody(serialized, tok?.offset ?? 0, baseCall);
  let outBody: unknown = projected;
  if (cap.truncated || (tok && tok.offset > 0)) {
    outBody = cap.text; // a slice of the serialized body; the client concatenates slices
    hints.push(`body is ${cap.total_bytes} bytes serialized; this slice starts at byte ${tok?.offset ?? 0}${cap.truncated ? "; follow `continue` for the rest" : "; last slice"}`);
  }
  return envelope({ upstream, request: req, status: r.status, body: outBody, truncated: cap.truncated, next, continue: cap.continue, hints,
    cost: { bytes: byteLength(outBody), tokens_est: 0, upstream_ms: ms } });
}

async function safeBody(r: Response): Promise<unknown> {
  try { const t = await r.text(); try { return JSON.parse(t); } catch { return t; } } catch { return null; }
}
