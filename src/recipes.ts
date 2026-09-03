/**
 * Recipes — the straight-line lists of `execute` calls an agent would make by hand (DELTA seed 3,
 * T6: no semantics). v2.4 grammar: each recipe declares `args` (name → about, required, default)
 * and its calls carry `{owner}`-style templates in path and query; `fill()` resolves them.
 * Shared by `docs` (the plan) and `execute` (`dry_run`, and the run in v2.5).
 * Bounds enforced at definition (SPEC §execute v2): ≤ 5 steps, no branches, no conditionals —
 * a recipe is data, never code. Rail: klappy/kitchen 2026-09-03-door43-mcp-v2-2-pins-recipe-args.
 */
import type { ExecuteCall } from "./envelope";

export const MAX_STEPS = 5;
export const SHA40 = /^[0-9a-f]{40}$/i;

export interface RecipeArg {
  /** One line the 400 quotes back when the arg is missing. */
  about: string;
  required?: boolean;
  default?: string;
  /** Shape check, no fetch: e.g. a pin must be a 40-hex sha. */
  pattern?: RegExp;
}
export interface Recipe { about: string; args: Record<string, RecipeArg>; calls: ExecuteCall[] }
export interface Plan { recipe: string; about: string; args: Record<string, string>; calls: ExecuteCall[] }

const OWNER: RecipeArg = { about: "repo owner (user or org login), e.g. unfoldingWord", required: true };
const REPO: RecipeArg = { about: "repo name, e.g. en_ult", required: true };

/** The table. v1's five (now parameterised; nothing hard-coded to unfoldingWord/en_ult — DELTA seed 4) + `read-file-at-pin` (SPEC §docs v2).
 *  `map-this-release` (v2.6) and `my-spend` (v2.7) land with their own tickets. */
export const RECIPES: Record<string, Recipe> = {
  whoami: { about: "Who is the logged-in user.", args: {},
    calls: [{ method: "GET", path: "/user", fields: ["login", "id", "full_name"] }] },
  "catalog-by-language": { about: "Latest catalog entries for one language.",
    args: { lang: { about: "language code, e.g. en", default: "en" }, stage: { about: "catalog stage: prod · preprod · latest", default: "prod" } },
    calls: [{ method: "GET", path: "/catalog/search", query: { lang: "{lang}", stage: "{stage}", limit: 20 }, fields: ["data[].full_name", "data[].subject", "data[].branch_or_tag_name", "data[].zipball_url"] }] },
  "latest-release-zip": { about: "The latest release of a repo and its zipball.",
    args: { owner: OWNER, repo: REPO },
    calls: [{ method: "GET", path: "/repos/{owner}/{repo}/releases/latest", fields: ["tag_name", "name", "published_at", "zipball_url"] }] },
  "repo-tree-at-ref": { about: "The file tree of a repo at a ref (use `recursive:true` for the whole tree).",
    args: { owner: OWNER, repo: REPO, ref: { about: "branch, tag, or sha; a sha is the only pin", default: "master" } },
    calls: [{ method: "GET", path: "/repos/{owner}/{repo}/git/trees/{ref}", query: { recursive: true, per_page: 1000 }, fields: ["sha", "truncated", "tree[].path", "tree[].type", "tree[].sha"] }] },
  "page-through": { about: "Walk a paged list: call once, then replay `next` from each envelope until it is null; `hints` carries `x-total-count`.",
    args: { limit: { about: "page size", default: "50" } },
    calls: [{ method: "GET", path: "/catalog/search", query: { limit: "{limit}", page: 1 }, fields: ["data[].full_name"] }] },
  "read-file-at-pin": { about: "One file's content at a pinned sha (the ref the upstream already gave you; never minted here).",
    args: { owner: OWNER, repo: REPO, path: { about: "file path inside the repo, e.g. README.md", required: true }, sha: { about: "40-hex commit sha (from /catalog/* commit_sha or a git/refs answer)", required: true, pattern: SHA40 } },
    calls: [{ method: "GET", path: "/repos/{owner}/{repo}/contents/{path}", query: { ref: "{sha}" }, fields: ["name", "sha", "size", "encoding", "content"] }] },
};

// Bound at definition: a recipe with 6 steps, a write verb, or a raw '?' fails the suite (test pins these).
for (const [n, r] of Object.entries(RECIPES)) {
  if (r.calls.length > MAX_STEPS) throw new Error(`recipe '${n}' has ${r.calls.length} steps; the bound is ${MAX_STEPS}`);
}

const TEMPLATE = /\{([a-zA-Z_]+)\}/g;

export type FillResult = { ok: true; plan: Plan } | { ok: false; status: 400 | 404; error: string; arg?: string; about?: string; args?: Record<string, RecipeArg>; recipes?: string[] };

/** Resolve a recipe's templates from `args` (+ defaults). Pure; zero fetches. The first missing or
 *  malformed arg is named with its `about` — the agent fixes one thing and replays. */
export function fill(name: string, args: Record<string, string | number | boolean> = {}): FillResult {
  const r = RECIPES[name];
  if (!r) return { ok: false, status: 404, error: `no recipe '${name}'`, recipes: Object.keys(RECIPES) };
  const resolved: Record<string, string> = {};
  for (const [k, a] of Object.entries(r.args)) {
    // "" is absent (Bugbot #14, low): an empty optional arg takes its default; an empty required one is missing.
    const given = args[k] !== undefined && String(args[k]) !== "" ? String(args[k]) : undefined;
    const v = given ?? a.default;
    if (v === undefined) { if (a.required) return { ok: false, status: 400, error: `missing arg '${k}'`, arg: k, about: a.about, args: r.args }; continue; }
    if (a.pattern && !a.pattern.test(v)) return { ok: false, status: 400, error: `arg '${k}' does not match its shape`, arg: k, about: a.about, args: r.args };
    if (/[/?#]/.test(v) && k !== "path") return { ok: false, status: 400, error: `arg '${k}' may not contain '/', '?' or '#'`, arg: k, about: a.about, args: r.args };
    if (k === "path" && (/[?#]/.test(v) || v.includes("..") || v.startsWith("/"))) return { ok: false, status: 400, error: `arg 'path' is a repo-relative file path; no '?', '#', '..' or leading '/'`, arg: k, about: a.about, args: r.args };
    resolved[k] = v;
  }
  for (const k of Object.keys(args)) if (!(k in r.args)) return { ok: false, status: 400, error: `unknown arg '${k}'`, arg: k, about: `this recipe takes: ${Object.keys(r.args).join(", ") || "no args"}`, args: r.args };
  const sub = (s: string) => s.replace(TEMPLATE, (_, k) => resolved[k] ?? `{${k}}`);
  const calls: ExecuteCall[] = r.calls.map((c) => {
    const out: ExecuteCall = { method: c.method, path: sub(c.path) };
    if (c.query) out.query = Object.fromEntries(Object.entries(c.query).map(([k, v]) => [k, typeof v === "string" ? retype(sub(v)) : v]));
    if (c.fields) out.fields = [...c.fields];
    return out;
  });
  return { ok: true, plan: { recipe: name, about: r.about, args: resolved, calls } };
}

/** A template that filled to an integer or boolean string becomes that type (typed query, SPEC §v2). */
function retype(v: string): string | number | boolean { return /^-?\d+$/.test(v) ? Number(v) : v === "true" ? true : v === "false" ? false : v; }

/** Public schema for `docs({rung:"recipes"})`: about + args, no calls. RegExp rendered as its source. */
export function recipeSchema(): Record<string, { about: string; steps: number; args: Record<string, { about: string; required: boolean; default?: string; pattern?: string }> }> {
  return Object.fromEntries(Object.entries(RECIPES).map(([n, r]) => [n, { about: r.about, steps: r.calls.length,
    args: Object.fromEntries(Object.entries(r.args).map(([k, a]) => [k, { about: a.about, required: !!a.required, ...(a.default !== undefined ? { default: a.default } : {}), ...(a.pattern ? { pattern: a.pattern.source } : {}) }])) }]));
}
