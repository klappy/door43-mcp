/** Body cap after projection: 200 KB, never a silent cut (SPEC §execute, convention §7). */
import type { ExecuteCall } from "./envelope";

export const BODY_CAP_BYTES = 200 * 1024;

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64u = (u: Uint8Array) => btoa(String.fromCharCode(...u)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export interface ContinueToken { offset: number }

export function mintContinue(t: ContinueToken): string { return b64u(enc.encode(JSON.stringify(t))); }
export function readContinue(token: string | undefined): ContinueToken | null {
  if (!token) return null;
  try { const t = JSON.parse(dec.decode(unb64u(token))); return typeof t?.offset === "number" && t.offset >= 0 ? { offset: t.offset } : null; }
  catch { return null; }
}

/**
 * Slice a serialized body at `offset`. Returns the slice, whether more remains,
 * and the pre-formed call that fetches the rest (same call + continue token).
 */
export function capBody(serialized: string, offset: number, call: Omit<ExecuteCall, "continue">, cap = BODY_CAP_BYTES) {
  const all = enc.encode(serialized);
  const slice = all.subarray(offset, offset + cap);
  const end = offset + slice.length;
  const truncated = end < all.length;
  return {
    text: dec.decode(slice),
    total_bytes: all.length,
    truncated,
    continue: truncated ? ({ ...call, continue: mintContinue({ offset: end }) } as ExecuteCall) : null,
  };
}
