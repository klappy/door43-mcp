/**
 * `docs({ rung?, path?, query?, recipe?, args?, detail?, fields? })` — the server explains itself and DCS, live.
 * Ladder: no args → L0 boarding pass (≤ 2 KB) · rung:"map" → L1 path families ·
 * path → L2 one path (params, response keys, quirks) · rung:"raw" + path → L3 swagger slice ·
 * query → lexical (BM25) over path names + summaries · recipe (+args) → the filled plan (v2.4) ·
 * rung:"recipes" → every recipe's about + args schema, no calls.
 * `docs` never calls DCS except for the swagger fetch (convention §2, ticket failure mode 1):
 * every answer here is built from the cached swagger and the session's own state.
 * SPEC §docs · convention §8 · ceiling VERIFICATION (the pass cites the constraint URI).
 */
import { envelope, type Envelope, type Upstream } from "../envelope";
import { project } from "../projection";
import { RECIPES, fill, recipeSchema } from "../recipes";
export { RECIPES };
import type { SwaggerDoc, SwaggerOp } from "../upstream";

export const CEILING_URI = "klappy://canon/constraints/mcp-tool-surface-ceiling";
export const SEAT_WORK_URI = "klappy://canon/constraints/infra-config-is-seat-work";
export const PASS_CAP_BYTES = 2048;

export interface DocsInput { rung?: "map" | "raw" | "recipes"; path?: string; query?: string; recipe?: string; args?: Record<string, string | number | boolean>; detail?: "compact" | "full"; fields?: string[] }
export interface DocsDeps {
  host: string;
  version: string;
  upstreamVersion: string | null;
  swagger: () => Promise<SwaggerDoc | null>;
  login: string | null;
  loginUrl: string;
  serverUrl: string;
}

const FAMILY_NOTES: Record<string, string> = {
  catalog: "published resources: search, entry, metadata, validation",
  repos: "any repo as you: contents, releases, tags, git/trees",
  user: "you: identity, repos, orgs, tokens (read)",
  users: "other users by name",
  orgs: "organizations and their repos",
  misc: "version, settings, packages, notifications, admin (needs rights)",
};
const FAMILY_TOP: Record<string, string[]> = {
  catalog: ["/catalog/search", "/catalog/entry/{owner}/{repo}/{ref}", "/catalog/list/subjects"],
  repos: ["/repos/{owner}/{repo}/contents/{filepath}", "/repos/{owner}/{repo}/releases/latest", "/repos/{owner}/{repo}/git/trees/{sha}"],
  user: ["/user", "/user/repos", "/user/orgs"],
  users: ["/users/{username}", "/users/{username}/repos", "/users/search"],
  orgs: ["/orgs/{org}", "/orgs/{org}/repos", "/orgs"],
  misc: ["/version", "/settings/api", "/packages/{owner}"],
};

/** Quirks observed live; keyed by swagger path. Text, not code — the seat reads it. */
const QUIRKS: Record<string, string[]> = {
  "/catalog/search": [
    "owner is a string (the login), not an object — `fields:[\"data[].owner\"]`; `data[].owner.login` yields null (observed 2026-09-03T02:31Z)",
    "results are `body.data[]`; `body.ok` and `body.last_updated` sit beside it",
    "pages with `page`/`limit`; a `next` call is pre-formed on the envelope when the upstream sends Link rel=next",
  ],
};


function request(input: DocsInput) {
  return { tool: "docs", method: "-", path: input.path ?? "", query: { ...(input.rung ? { rung: input.rung } : {}), ...(input.query ? { query: input.query } : {}), ...(input.recipe ? { recipe: input.recipe } : {}), ...(input.args ? { args: input.args } : {}), ...(input.detail ? { detail: input.detail } : {}) }, fields: input.fields ?? [] };
}

const norm = (p: string) => (p.startsWith("/api/v1") ? p.slice(7) : p) || "/";
function familyOf(p: string): string { const s = p.split("/").filter(Boolean)[0] ?? ""; return FAMILY_NOTES[s] ? s : "misc"; }

function boardingPass(d: DocsDeps) {
  return {
    what: `door43-mcp ${d.version}: DCS as you. Three tools; reads only (v1).`,
    is_not: "not a helps aggregator, host broker, token vault, write surface, or content cache",
    server: { version: d.version, url: d.serverUrl },
    upstream: { host: d.host, version: d.upstreamVersion },
    auth: d.login ? { logged_in_as: d.login } : { login_url: d.loginUrl },
    tools: {
      docs: "{rung?:map|raw|recipes, path?, query?, recipe?, args?} → this pass · map · one path · swagger slice · search · recipe schema · filled plan",
      execute: "{method:GET|HEAD, path, query?, fields?, headers?, continue?, pin?:{sha}, recipe?, args?, dry_run?} → envelope; path = /api/v1/… or /{o}/{r}/archive/{ref}.zip",
      telemetry: "{sql} → rows; SELECT only over door43mcp_telemetry",
    },
    map: "catalog · repos · user · users · orgs · misc — docs({rung:\"map\"})",
    recipes: Object.keys(RECIPES),
    journeys: [
      { docs: { recipe: "whoami" } },
      { docs: { recipe: "latest-release-zip", args: { owner: "unfoldingWord", repo: "en_ult" } } },
      { execute: { recipe: "latest-release-zip", args: { owner: "unfoldingWord", repo: "en_ult" }, dry_run: true } },
      { execute: { method: "GET", path: "/catalog/search", query: { lang: "en", limit: 5 }, fields: ["data[].full_name"] } },
      { telemetry: { sql: "SELECT tool_name, COUNT(*) FROM door43mcp_telemetry GROUP BY 1" } },
    ],
    law: [CEILING_URI, SEAT_WORK_URI],
    agents_md: "https://github.com/klappy/door43-mcp/blob/main/AGENTS.md",
  };
}

function l2(doc: SwaggerDoc, path: string, detail: "compact" | "full" = "compact") {
  const ops = doc.paths[path];
  if (!ops) return null;
  const out: Record<string, unknown> = { path: doc.basePath + path, quirks: QUIRKS[path] ?? [] };
  for (const [m, op] of Object.entries(ops)) {
    if (!["get", "head"].includes(m)) continue;
    // compact (default): every param NAME survives — `q:string`, `owner*:string` — prose does not (SPEC §v2 docs).
    // full: v1's prose strings, plus the non-200 responses' descriptions.
    const params = detail === "full"
      ? (op.parameters ?? []).map((p) => `${p.name}${p.required ? "*" : ""} (${p.in}${p.type ? ":" + p.type : ""})${p.description ? " — " + p.description : ""}`)
      : (op.parameters ?? []).map((p) => `${p.name}${p.required ? "*" : ""}:${p.type ?? p.in}`);
    const r200 = op.responses?.["200"];
    const entry: Record<string, unknown> = { summary: op.summary ?? "", params, response_keys: responseKeys(doc, r200), responses: Object.keys(op.responses ?? {}) };
    if (detail === "full") {
      entry.description = op.description ?? "";
      entry.errors = Object.fromEntries(Object.entries(op.responses ?? {}).filter(([c]) => c !== "200").map(([c, r]) => [c, (r as any)?.$ref ? String((deref(doc, (r as any).$ref) as any)?.description ?? (r as any).$ref) : String((r as any)?.description ?? "")]));
    }
    entry.example = { method: m.toUpperCase(), path: doc.basePath + path };
    out[m.toUpperCase()] = entry;
  }
  const others = Object.keys(ops).filter((m) => !["get", "head"].includes(m));
  if (others.length) out.v2 = `${others.map((x) => x.toUpperCase()).join("/")} exist upstream; execute refuses them in v1 (405)`;
  return out;
}

function deref(doc: SwaggerDoc, ref: string | undefined): unknown {
  if (!ref) return null;
  const parts = ref.replace(/^#\//, "").split("/");
  let node: any = parts[0] === "definitions" ? doc.definitions : parts[0] === "responses" ? doc.responses : null;
  for (const k of parts.slice(1)) node = node?.[k];
  return node ?? null;
}
/** Every key a 200 body can carry, never elided (T16 closed by v2.1). Array-of-object properties list
 *  ALL item keys as `name[]{k1,k2,…}`; nested objects one level as `name{k1,k2}`. `fields` selects from these. */
export function responseKeys(doc: SwaggerDoc, r: { $ref?: string; schema?: unknown } | undefined): string[] {
  const resp: any = r?.$ref ? deref(doc, r.$ref) : r;
  let schema: any = resp?.schema;
  if (schema?.$ref) schema = deref(doc, schema.$ref);
  const itemKeys = (it: any): string[] => { const x = it?.$ref ? deref(doc, it.$ref) : it; return Object.keys((x as any)?.properties ?? {}); };
  if (schema?.type === "array" && schema.items) return itemKeys(schema.items).map((k) => `[].${k}`);
  const props = schema?.properties ?? {};
  const keys: string[] = [];
  for (const [k, v] of Object.entries<any>(props)) {
    if (v?.type === "array" && v.items && (v.items.$ref || v.items.properties)) keys.push(`${k}[]{${itemKeys(v.items).join(",")}}`);
    else if (v?.$ref || v?.properties) { const sub = itemKeys(v); keys.push(sub.length ? `${k}{${sub.join(",")}}` : k); }
    else keys.push(k);
  }
  return keys;
}

/** Lexical search over path + summary. Plain BM25 over a tiny corpus; deterministic. */
export function searchOps(doc: SwaggerDoc, query: string, k = 10): Array<{ path: string; method: string; summary: string; score: number }> {
  const tok = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const q = tok(query); if (!q.length) return [];
  const docs: Array<{ path: string; method: string; summary: string; terms: string[] }> = [];
  for (const [p, ops] of Object.entries(doc.paths)) for (const [m, op] of Object.entries(ops)) if (m === "get" || m === "head")
    docs.push({ path: p, method: m.toUpperCase(), summary: op.summary ?? "", terms: tok(p + " " + (op.summary ?? "") + " " + (op.tags ?? []).join(" ")) });
  const N = docs.length, avg = docs.reduce((a, d) => a + d.terms.length, 0) / Math.max(1, N);
  const df = new Map<string, number>(); for (const d of docs) for (const t of new Set(d.terms)) df.set(t, (df.get(t) ?? 0) + 1);
  const k1 = 1.2, b = 0.75;
  return docs.map((d) => {
    let s = 0;
    for (const t of q) { const tf = d.terms.filter((x) => x === t).length; if (!tf) continue; const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5)); s += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * d.terms.length / avg)); }
    return { path: doc.basePath + d.path, method: d.method, summary: d.summary, score: Math.round(s * 1000) / 1000 };
  }).filter((x) => x.score > 0).sort((a, c) => c.score - a.score || a.path.localeCompare(c.path)).slice(0, k);
}

export async function runDocs(d: DocsDeps, input: DocsInput = {}): Promise<Envelope> {
  const req = request(input);
  const upstream = { host: d.host, version: d.upstreamVersion };
  const hints: string[] = [];

  if (input.recipe !== undefined) {
    // v2.4: the filled plan. Zero fetches — the table and the args are all it takes (SPEC §docs v2).
    const f = fill(input.recipe, input.args);
    if (!f.ok) {
      if (f.status === 404) return envelope({ upstream, request: req, status: 404, body: { recipes: f.recipes }, hints: [`no recipe '${input.recipe}'; pick one of the listed, or docs({rung:"recipes"}) for their args`] });
      return envelope({ upstream, request: req, status: 400, body: { error: f.error, arg: f.arg, about: f.about, args: recipeSchema()[input.recipe]?.args ?? {} }, hints: [`add args:{${f.arg}:…} and replay; nothing was sent upstream`] });
    }
    return envelope({ upstream, request: req, status: 200, body: f.plan, hints: ["paste each call into execute in order, or execute({recipe, args, dry_run:true}) to price it first"] });
  }
  if (input.rung === "recipes") {
    return envelope({ upstream, request: req, status: 200, body: { recipes: recipeSchema() }, hints: ["docs({recipe, args}) fills one; required args without a default must be given"] });
  }
  if (!input.rung && !input.path && !input.query) {
    const body = boardingPass(d);
    return envelope({ upstream, request: req, status: 200, body, hints: ["descend: docs({rung:\"map\"}) · docs({path:\"/catalog/search\"}) · docs({query:\"release\"}) · docs({recipe:\"whoami\"})"] });
  }
  const doc = await d.swagger();
  if (!doc) return envelope({ upstream, request: req, status: 503, body: null, hints: ["swagger unavailable and nothing cached; retry, or execute GET /version to test reachability"] });
  hints.push(`swagger ${doc.version ?? "?"} observed ${doc.observed_at}, cached 1h`);
  const pinned: Upstream = { ...upstream, swagger: { version: doc.version, etag: doc.etag, observed_at: doc.observed_at } };

  if (input.query) {
    const hits = searchOps(doc, input.query, 10);
    return envelope({ upstream: pinned, request: req, status: hits.length ? 200 : 404, body: { query: input.query, hits: hits.map((h) => ({ ...h, l2: { docs: { path: norm(h.path) } } })) },
      hints: hits.length ? [...hints, "each hit's `l2` is the docs call for that path"] : [...hints, "no lexical match; try a path segment (catalog, releases, contents, trees)"] });
  }
  if (input.path) {
    const p = norm(input.path);
    if (!doc.paths[p]) {
      const near = Object.keys(doc.paths).filter((x) => x.includes(p.split("/").filter(Boolean)[0] ?? "\u0000")).slice(0, 5);
      return envelope({ upstream: pinned, request: req, status: 404, body: { path: p, nearest: near.map((x) => doc.basePath + x) }, hints: [...hints, "not a documented path; docs({query}) searches summaries"] });
    }
    // fields on docs: the same `project()` execute uses — selection only, no renames, no defaults (T6).
    const pick = (b: unknown) => (input.fields?.length ? project(b, input.fields) : b);
    if (input.rung === "raw") return envelope({ upstream: pinned, request: req, status: 200, body: pick({ path: doc.basePath + p, swagger: doc.paths[p] }), hints: [...hints, "raw swagger fragment, verbatim; $ref targets live in the upstream document"] });
    const detail = input.detail === "full" ? "full" : "compact";
    return envelope({ upstream: pinned, request: req, status: 200, body: pick(l2(doc, p, detail)), hints: [...hints,
      detail === "compact" ? "params are `name*:type` (* = required); `detail:\"full\"` adds descriptions; `response_keys` are complete and are what `fields` can select" : "params marked * are required; `response_keys` are complete and are what `fields` can select"] });
  }
  // rung: map (L1) — families with counts and three most-used paths each.
  const counts: Record<string, number> = {};
  for (const p of Object.keys(doc.paths)) counts[familyOf(p)] = (counts[familyOf(p)] ?? 0) + 1;
  const families = Object.keys(FAMILY_NOTES).map((f) => ({ family: f, paths: counts[f] ?? 0, about: FAMILY_NOTES[f], top: FAMILY_TOP[f].map((x) => doc.basePath + x) }));
  if (input.rung === "raw") return envelope({ upstream: pinned, request: req, status: 400, body: { paths: Object.keys(doc.paths).length }, hints: [...hints, "rung:\"raw\" needs a `path`; this is the map"] });
  return envelope({ upstream: pinned, request: req, status: 200, body: { paths_total: Object.keys(doc.paths).length, families }, hints: [...hints, "descend with docs({path}) on any of the listed paths"] });
}
