/**
 * The one response envelope every tool returns (SPEC §Tools, convention §7).
 * Field names are door43's own: upstream HTTP semantics live here on purpose
 * (ticket 2026-09-02-door43-mcp-gate1-execute, Ingredients: house prior art).
 */
export interface ExecuteCall {
  method: "GET" | "HEAD";
  path: string;
  query?: Record<string, string | number | boolean>;
  fields?: string[];
  /** Opaque resume token minted by a truncated answer. */
  continue?: string;
}

/** v2.5: a pre-formed recipe call — the `continue` of a stopped run. `continue` is opaque and carries `{recipe, args, from}`. */
export interface RecipeCall {
  recipe: string;
  args?: Record<string, string | number | boolean>;
  continue: string;
}

/** SPEC §v2 "Envelope additions": keys unchanged; the `upstream` object grows. All additions optional/null. */
export interface Upstream {
  host: string;
  version: string | null;
  /** docs L1–L3 (and any execute that read the index): the swagger pin the answer was built from. */
  swagger?: { version: string | null; etag: string | null; observed_at: string };
  /** execute 200/304: DCS's etag when it sent one (observed 2026-09-03: DCS 1.27.2+dcs sends none). */
  etag?: string | null;
  /** execute: `{remaining, reset}` when DCS sent x-ratelimit-* (observed 2026-09-03: none sent). */
  ratelimit?: { remaining: number; reset: string } | null;
}

export interface Envelope {
  observed_at: string;
  upstream: Upstream;
  request: { tool: string; method: string; path: string; query: Record<string, unknown>; fields: string[] };
  status: number;
  body: unknown;
  truncated: boolean;
  next: ExecuteCall | null;
  continue: ExecuteCall | RecipeCall | null;
  hints: string[];
  cost: { bytes: number; tokens_est: number; upstream_ms: number };
}

/** Keys pinned by test/execute.test.ts — drift here is a SPEC §7 bug, not a feature. */
export const ENVELOPE_KEYS = [
  "observed_at", "upstream", "request", "status", "body", "truncated", "next", "continue", "hints", "cost",
] as const;

export function envelope(
  p: Pick<Envelope, "upstream" | "request" | "status" | "body"> & Partial<Envelope>,
): Envelope {
  const bytes = p.cost?.bytes ?? byteLength(p.body);
  return {
    observed_at: p.observed_at ?? new Date().toISOString(),
    upstream: p.upstream,
    request: p.request,
    status: p.status,
    body: p.body,
    truncated: p.truncated ?? false,
    next: p.next ?? null,
    continue: p.continue ?? null,
    hints: p.hints ?? [],
    cost: { bytes, tokens_est: Math.ceil(bytes / 4), upstream_ms: p.cost?.upstream_ms ?? 0 },
  };
}

export function byteLength(body: unknown): number {
  const s = typeof body === "string" ? body : JSON.stringify(body ?? null);
  return new TextEncoder().encode(s).length;
}
