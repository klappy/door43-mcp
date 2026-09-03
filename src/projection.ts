/**
 * `fields`: deterministic JSON-path selection over a body. Selection only —
 * no renames, no defaults, no computed values (TENSIONS T6, convention §9).
 * Grammar: `a.b`, `a[].b`, `[].b`, `a.b[]`. Unknown paths yield `null`, never throw.
 */
type Seg = { key: string; each: boolean };

export function parseField(field: string): Seg[] {
  const out: Seg[] = [];
  for (const raw of field.split(".")) {
    if (raw === "") continue;
    const each = raw.endsWith("[]");
    out.push({ key: each ? raw.slice(0, -2) : raw, each });
  }
  return out;
}

function select(node: unknown, segs: Seg[], i = 0): unknown {
  if (i === segs.length) return node === undefined ? null : node;
  const { key, each } = segs[i];
  const base = key === "" ? node : (node !== null && typeof node === "object" && !Array.isArray(node) ? (node as Record<string, unknown>)[key] : undefined);
  if (each) {
    if (!Array.isArray(base)) return null;
    return base.map((el) => select(el, segs, i + 1));
  }
  return select(base, segs, i + 1);
}

/** Merge a selected value into the result tree along the same path shape. */
function place(target: Record<string, unknown> | unknown[], segs: Seg[], value: unknown, i = 0): void {
  const { key, each } = segs[i];
  const last = i === segs.length - 1;
  const t = target as Record<string, unknown>;
  if (key === "") {
    // leading `[]`: target is the array itself
    if (!each || !Array.isArray(value)) return;
    const arr = target as unknown[];
    value.forEach((v, k) => {
      if (last) arr[k] = v === undefined ? null : v;
      else { if (arr[k] === undefined) arr[k] = segs[i + 1].key === "" ? [] : {}; place(arr[k] as Record<string, unknown>, segs, v, i + 1); }
    });
    return;
  }
  if (!each) {
    if (last) { t[key] = value; return; }
    if (t[key] === undefined || t[key] === null) t[key] = {};
    if (typeof t[key] !== "object") return;
    place(t[key] as Record<string, unknown>, segs, value, i + 1);
    return;
  }
  // each: t[key] is an array of per-element selections
  if (!Array.isArray(value)) { t[key] = null; return; }
  if (!Array.isArray(t[key])) t[key] = [];
  const arr = t[key] as unknown[];
  value.forEach((v, k) => {
    if (last) arr[k] = v === undefined ? null : v;
    else { if (arr[k] === undefined || arr[k] === null) arr[k] = {}; place(arr[k] as Record<string, unknown>, segs, v, i + 1); }
  });
}

/** Apply `fields` to `body`. Empty/undefined fields → body unchanged. */
export function project(body: unknown, fields: string[] | undefined): unknown {
  if (!fields || fields.length === 0) return body;
  const uniq = [...new Set(fields)];
  const leadingArray = uniq.every((f) => f.startsWith("[]"));
  const result: Record<string, unknown> | unknown[] = leadingArray ? [] : {};
  for (const f of uniq) {
    const segs = parseField(f);
    if (segs.length === 0) continue;
    const value = select(body, segs);
    if (leadingArray) place(result, segs, value);
    else if (segs[0].key === "") (result as Record<string, unknown>)[f] = value; // mixed: keep literal key
    else place(result, segs, value);
  }
  return result;
}
