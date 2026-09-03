/**
 * `execute({ method, path, query?, fields?, headers?, continue?, pin?, recipe?, args?, dry_run? })` — the one verb.
 * GET/HEAD to the upstream as the logged-in user; envelope on every answer;
 * `fields` projection; 200 KB cap with `continue`; refresh-on-401 once; teaching errors.
 * v2.3 `pin:{sha}` rewrites the ref to the sha the caller already holds (never minted here).
 * v2.4 `{recipe, args, dry_run:true}` prices the filled plan from telemetry — zero upstream fetches.
 * SPEC §execute · convention §2 §3 §7 §9 · TENSIONS T2 T6 · DELTA seeds 2, 4.
 *
 * The core is `runExecute(deps, input)` so tests drive it with an injected fetch and
 * assert what reached the upstream (write-leak and 405 tests assert *no* fetch).
 */
import { envelope, byteLength, type Envelope, type ExecuteCall, type Upstream } from "../envelope";
import { project } from "../projection";
import { capBody, readContinue } from "../cap";
import { linkNext, nearestPaths } from "../upstream";
import { fill, SHA40, type Plan } from "../recipes";
import { pathFamily, type PathFamily } from "../telemetry";

import { VERSION } from "../version";
export { VERSION };
const API = "/api/v1";
const ARCHIVE = /^\/[\w.-]+\/[\w.-]+\/archive\/[^/?#]+\.zip$/;
const REFRESH_HINT = "refreshed: upstream token was expired; one silent refresh, one retry";

export interface ExecuteInput {
  /** Required for a single call; omitted for `{recipe, args, dry_run}`. */
  method?: string;
  path?: string;
  query?: Record<string, string | number | boolean>;
  fields?: string[];
  headers?: Record<string, string>;
  continue?: string;
  /** v2.3: the sha this call is pinned to; `ref` (query) or `{ref}` (archive path) is rewritten to it. */
  pin?: { sha: string };
  /** v2.4: a recipe name + its args; with `dry_run:true` → plan + estimate, no fetch. The run itself is v2.5. */
  recipe?: string;
  args?: Record<string, string | number | boolean>;
  dry_run?: boolean;
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
  /** v2.4 estimate basis: p50 `bytes_out` per path family from this deployment's telemetry (30 d). Absent → "no history". */
  p50BytesByFamily?: () => Promise<Partial<Record<PathFamily, number>>>;
}
export const ESTIMATE_BASIS = "telemetry p50 bytes_out by path_family, last 30d, this host";

/** Only these headers may be forwarded; everything else is dropped (T2: passthrough, not a tunnel). */
const HEADER_ALLOW = new Set(["accept", "accept-language", "if-none-match", "if-modified-since", "range"]);

function requestEcho(input: ExecuteInput) {
  return { tool: "execute", method: (input.method ?? "-").toUpperCase(), path: input.path ?? "", query: { ...(input.query ?? {}), ...(input.pin ? { pin: input.pin.sha } : {}), ...(input.recipe ? { recipe: input.recipe } : {}), ...(input.args ? { args: input.args } : {}), ...(input.dry_run ? { dry_run: true } : {}) }, fields: input.fields ?? [] };
}

/** v2.3: apply `pin:{sha}` — rewrite the ref the caller addressed to the sha they already hold. Pure; no fetch.
 *  `/repos/*` → `query.ref = sha` (set or overridden); archive `/{o}/{r}/archive/{ref}.zip` → `{ref}` = sha.
 *  Anything else has no ref to pin → refused with the reason. */
export function applyPin(path: string, query: Record<string, string | number | boolean> | undefined, sha: string): { path: string; query: Record<string, string | number | boolean>; was: string | null } | { refuse: string } {
  if (!SHA40.test(sha)) return { refuse: "pin.sha must be a 40-hex commit sha the upstream already gave you (catalog commit_sha, git/refs); nothing is minted here" };
  const q = { ...(query ?? {}) };
  if (ARCHIVE.test(path)) { const segs = path.split("/"); const was = segs[4].slice(0, -4); segs[4] = `${sha}.zip`; return { path: segs.join("/"), query: q, was }; }
  const p = path.startsWith(API) ? path.slice(API.length) : path;
  if (p.startsWith("/repos/")) { const was = q.ref !== undefined ? String(q.ref) : null; q.ref = sha; return { path, query: q, was }; }
  return { refuse: "pin applies to /repos/* (query ref) and /{owner}/{repo}/archive/{ref}.zip; this path carries no ref to pin" };
}

/** v2.4 `dry_run`: price a plan from named history. `basis` is a string; a family with no rows → `estimate:null`. */
export async function estimatePlan(plan: Plan, p50?: () => Promise<Partial<Record<PathFamily, number>>>): Promise<{ estimate: { bytes: number; calls: number; basis: string } | null; basis: string }> {
  const fams = plan.calls.map((c) => pathFamily(c.path));
  const hist = p50 ? await p50().catch(() => ({} as Partial<Record<PathFamily, number>>)) : {};
  const missing = fams.filter((f) => hist[f] === undefined);
  if (missing.length) return { estimate: null, basis: `no history${Object.keys(hist).length ? ` for ${[...new Set(missing)].join(", ")}` : ""}` };
  return { estimate: { bytes: fams.reduce((a, f) => a + (hist[f] as number), 0), calls: plan.calls.length, basis: ESTIMATE_BASIS }, basis: ESTIMATE_BASIS };
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
      // Partial misses on this segment are not "selected nothing" if any node survived.
      dead = null; leaf = null;
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

export async function runExecute(deps: ExecuteDeps, input: ExecuteInput): Promise<Envelope> {
  const upstream: Upstream = { host: deps.host, version: deps.version };

  // v2.4 — recipe + args. Only `dry_run` in this plate; the run is v2.5. Nothing below this touches the upstream.
  if (input.recipe !== undefined || input.dry_run) {
    const req0 = requestEcho({ ...input, method: input.method ?? "-", path: input.path ?? "" });
    if (input.recipe === undefined) return envelope({ upstream, request: req0, status: 400, body: { error: "dry_run needs a recipe" }, hints: ["execute({recipe, args, dry_run:true}); docs({rung:\"recipes\"}) lists them; nothing was sent upstream"] });
    const f = fill(input.recipe, input.args);
    if (!f.ok) return envelope({ upstream, request: req0, status: f.status, body: f.status === 404 ? { recipes: f.recipes } : { error: f.error, arg: f.arg, about: f.about }, hints: [f.status === 404 ? "no such recipe; pick one of the listed" : `add args:{${f.arg}:…} and replay; nothing was sent upstream`] });
    if (!input.dry_run) return envelope({ upstream, request: req0, status: 501, body: { plan: f.plan }, hints: ["recipe run lands in v2.5; until then paste plan.calls into execute in order, or add dry_run:true to price it; nothing was sent upstream"] });
    const est = await estimatePlan(f.plan, deps.p50BytesByFamily);
    const body = { plan: f.plan, estimate: est.estimate, ...(est.estimate ? {} : { basis: est.basis }) };
    return envelope({ upstream, request: req0, status: 200, body, hints: [est.estimate ? `estimate is a named basis (${est.basis}), never a promise; 0 upstream fetches` : `${est.basis}; run the plan once and the next dry run has a basis; 0 upstream fetches`] });
  }

  // v2.3 — pin: rewrite before anything else reads path/query. Refused pins cost nothing.
  let pinHint: string | null = null;
  if (input.pin) {
    const pinned = applyPin(input.path ?? "", input.query, input.pin.sha);
    if ("refuse" in pinned) return envelope({ upstream, request: requestEcho(input), status: 400, body: { error: pinned.refuse }, hints: ["nothing was sent upstream"] });
    input = { ...input, path: pinned.path, query: pinned.query };
    pinHint = `pinned to ${pinned.query.ref !== undefined && !ARCHIVE.test(pinned.path) ? String(pinned.query.ref).slice(0, 12) : pinned.path.split("/")[4].slice(0, 12)}${pinned.was ? ` (was ref '${pinned.was}')` : ""}; the same call tomorrow answers the same`;
  }

  const req = requestEcho(input);
  const method = req.method;
  if (!input.method || typeof input.path !== "string") {
    return envelope({ upstream, request: req, status: 400, body: { error: "a single call needs `method` and `path`; a recipe needs `recipe` (+ `args`, `dry_run`)" }, hints: ["nothing was sent upstream"] });
  }
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

  const hints: string[] = pinHint ? [pinHint] : [];
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
