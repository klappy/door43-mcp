/**
 * `execute({ method, path, query?, fields?, headers?, continue? })` — the one verb.
 * GET/HEAD to the upstream as the logged-in user; envelope on every answer;
 * `fields` projection; 200 KB cap with `continue`; refresh-on-401 once; teaching errors.
 * SPEC §execute · convention §2 §3 §7 §9 · TENSIONS T2 T6.
 *
 * The core is `runExecute(deps, input)` so tests drive it with an injected fetch and
 * assert what reached the upstream (write-leak and 405 tests assert *no* fetch).
 */
import { envelope, byteLength, type Envelope, type ExecuteCall, type Upstream } from "../envelope";
import { project } from "../projection";
import { capBody, readContinue } from "../cap";
import { linkNext, nearestPaths } from "../upstream";

import { VERSION } from "../version";
export { VERSION };
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

/** `next.query` keeps the caller's value types (SPEC §v2): a key the caller sent keeps the caller's type;
 *  a key the upstream added (`page`) is typed by its shape — integer string → number, true/false → boolean. */
export function typedQuery(fromLink: URLSearchParams, callerQuery: Record<string, string | number | boolean> | undefined): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of fromLink.entries()) {
    const was = callerQuery?.[k];
    if (typeof was === "number") out[k] = Number(v);
    else if (typeof was === "boolean") out[k] = v === "true";
    else if (typeof was === "string") out[k] = v;
    else if (/^-?\d+$/.test(v)) out[k] = Number(v);
    else if (v === "true" || v === "false") out[k] = v === "true";
    else out[k] = v;
  }
  return out;
}

/** Teaching on 200, from the response only (never a fetch): a `fields` selector that resolved to nothing
 *  names the keys that exist at that level. `data[].owner.login` → "owner is a string; keys at data[]: …". */
export function fieldsTeach(body: unknown, fields: string[] | undefined): string[] {
  if (!fields?.length || body === null || typeof body !== "object") return [];
  const out: string[] = [];
  for (const f of fields) {
    const segs = f.split(".").filter(Boolean);
    let nodes: unknown[] = [body];
    let keysHere: string[] = Object.keys(body as object);
    let dead: string | null = null; let leaf: string | null = null;
    for (const seg of segs) {
      const arr = seg.endsWith("[]"); const key = arr ? seg.slice(0, -2) : seg;
      const nextNodes: unknown[] = [];
      for (const n of nodes) {
        if (n === null || typeof n !== "object") { dead = seg; leaf = n === null ? "null" : typeof n; continue; }
        const v = key ? (n as any)[key] : n;
        if (v === undefined) { dead = seg; continue; }
        if (arr) { if (Array.isArray(v)) nextNodes.push(...v); else dead = seg; }
        else nextNodes.push(v);
      }
      if (!nextNodes.length) break;
      nodes = nextNodes;
      const objs = nodes.filter((n): n is object => n !== null && typeof n === "object");
      if (objs.length) keysHere = [...new Set(objs.flatMap((o) => Object.keys(o)))];
    }
    if (dead) {
      out.push(`fields '${f}' selected nothing: '${dead}' is not a key here${leaf ? ` (the value before it is a ${leaf})` : ""}; keys at this level: ${keysHere.slice(0, 20).join(", ")}${keysHere.length > 20 ? ", …" : ""}`);
    }
  }
  return out;
}

const SHA40 = /^[0-9a-f]{40}$/i;

export async function runExecute(deps: ExecuteDeps, input: ExecuteInput): Promise<Envelope> {
  const req = requestEcho(input);
  const upstream: Upstream = { host: deps.host, version: deps.version };
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

  // SPEC §v2 envelope additions: surface what DCS sent, null when it sent nothing (observed 2026-09-03: nothing).
  upstream.etag = r.headers.get("etag");
  const rlRem = r.headers.get("x-ratelimit-remaining"), rlReset = r.headers.get("x-ratelimit-reset");
  upstream.ratelimit = rlRem !== null ? { remaining: Number(rlRem), reset: rlReset ? (/^\d+$/.test(rlReset) ? new Date(Number(rlReset) * 1000).toISOString() : rlReset) : "" } : null;
  if (upstream.ratelimit) hints.push(`ratelimit: ${upstream.ratelimit.remaining} remaining${upstream.ratelimit.reset ? `, resets ${upstream.ratelimit.reset}` : ""}`);

  // 304 is a first-class answer (SPEC §v2): nothing moved, nothing paid.
  if (r.status === 304) {
    return envelope({ upstream, request: req, status: 304, body: null, hints: [...hints, `unchanged since ${upstream.etag ?? headers["if-none-match"] ?? "the etag you sent"}`], cost: { bytes: 0, tokens_est: 0, upstream_ms: ms } });
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
  if (ln) next = { method: method as "GET" | "HEAD", path: ln.pathname, query: typedQuery(ln.searchParams, input.query), ...(input.fields?.length ? { fields: input.fields } : {}) };
  const total = r.headers.get("x-total-count");
  if (total) hints.push(`x-total-count ${total}`);
  if (upstream.etag) hints.push(`etag ${upstream.etag}; send headers:{"if-none-match":…} to get 304 for free`);
  // Teaching on 200 — from the request and the response only; never an extra upstream call.
  hints.push(...fieldsTeach(body, input.fields));
  const ref = input.query?.ref;
  if (typeof ref === "string" && ref && !SHA40.test(ref)) hints.push(`ref '${ref}' is a moving ref; the same call tomorrow may answer differently — pin to a sha`);

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
