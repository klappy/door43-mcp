/**
 * Upstream (DCS) helpers shared by the provider callback and `execute`:
 * refresh a grant, read the host version, index the live swagger for 404 hints.
 * Nothing here holds a token beyond the call that used it.
 */
export interface DcsTokens { access_token: string; refresh_token?: string; expires_in?: number }

export async function refreshDcs(
  host: string, clientId: string, clientSecret: string, refreshToken: string, fetchFn: typeof fetch = fetch,
): Promise<DcsTokens | null> {
  const r = await fetchFn(`https://${host}/login/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!r.ok) return null;
  try { const t = (await r.json()) as DcsTokens; return t.access_token ? t : null; } catch { return null; }
}

/** In-isolate caches, TTL 1h (SPEC §docs: swagger ETag-cached, TTL 1h). */
const TTL_MS = 60 * 60 * 1000;
let versionCache: { host: string; at: number; version: string | null } | null = null;

export async function upstreamVersion(host: string, fetchFn: typeof fetch = fetch): Promise<string | null> {
  if (versionCache && versionCache.host === host && Date.now() - versionCache.at < TTL_MS) return versionCache.version;
  const version = await fetchFn(`https://${host}/api/v1/version`).then((x) => (x.ok ? x.json<{ version: string }>() : null)).then((j) => j?.version ?? null).catch(() => null);
  versionCache = { host, at: Date.now(), version };
  return version;
}

/** The live swagger, parsed. `docs` reads it; `execute` uses only its path list for 404 hints. */
export interface SwaggerOp { summary?: string; description?: string; operationId?: string; tags?: string[];
  parameters?: Array<{ name: string; in: string; type?: string; required?: boolean; description?: string; schema?: unknown }>;
  responses?: Record<string, { description?: string; schema?: unknown; $ref?: string }> }
export interface SwaggerDoc { basePath: string; version: string | null; etag: string | null; observed_at: string;
  paths: Record<string, Record<string, SwaggerOp>>; definitions: Record<string, unknown>; responses: Record<string, unknown> }
let swaggerCache: { host: string; at: number; doc: SwaggerDoc } | null = null;

export async function swaggerDoc(host: string, fetchFn: typeof fetch = fetch): Promise<SwaggerDoc | null> {
  if (swaggerCache && swaggerCache.host === host && Date.now() - swaggerCache.at < TTL_MS) return swaggerCache.doc;
  const headers: Record<string, string> = {};
  if (swaggerCache?.doc.etag && swaggerCache.host === host) headers["if-none-match"] = swaggerCache.doc.etag;
  try {
    const r = await fetchFn(`https://${host}/swagger.v1.json`, { headers });
    if (r.status === 304 && swaggerCache) { swaggerCache.at = Date.now(); return swaggerCache.doc; }
    if (!r.ok) return swaggerCache?.doc ?? null;
    const j = (await r.json()) as { basePath?: string; info?: { version?: string }; paths?: SwaggerDoc["paths"]; definitions?: Record<string, unknown>; responses?: Record<string, unknown> };
    const doc: SwaggerDoc = { basePath: j.basePath ?? "/api/v1", version: j.info?.version ?? null, etag: r.headers.get("etag"),
      observed_at: new Date().toISOString(), paths: j.paths ?? {}, definitions: j.definitions ?? {}, responses: j.responses ?? {} };
    swaggerCache = { host, at: Date.now(), doc };
    return doc;
  } catch { return swaggerCache?.doc ?? null; }
}

export async function swaggerPaths(host: string, fetchFn: typeof fetch = fetch): Promise<string[]> {
  const doc = await swaggerDoc(host, fetchFn);
  if (!doc) return [];
  return Object.keys(doc.paths).map((p) => doc.basePath + p).sort();
}

/** Nearest documented paths by shared prefix, then shared segments. Pure; tested. */
export function nearestPaths(path: string, index: string[], n = 3): string[] {
  const segs = path.split("/").filter(Boolean);
  const score = (p: string) => {
    let i = 0; while (i < p.length && i < path.length && p[i] === path[i]) i++;
    const ps = p.split("/").filter(Boolean);
    let shared = 0; for (const s of ps) if (segs.includes(s)) shared++;
    return i * 10 + shared * 3 - Math.abs(ps.length - segs.length);
  };
  return [...index].map((p) => [score(p), p] as const).sort((a, b) => b[0] - a[0] || a[1].localeCompare(b[1])).slice(0, n).map((x) => x[1]);
}

/** Parse an RFC 8288 Link header for rel="next" → the URL. */
export function linkNext(link: string | null): URL | null {
  if (!link) return null;
  for (const part of link.split(",")) {
    const m = part.match(/<([^>]+)>\s*;\s*rel="?next"?/);
    if (m) { try { return new URL(m[1]); } catch { return null; } }
  }
  return null;
}
