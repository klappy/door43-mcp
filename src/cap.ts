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

/** Exclusive end index that does not split a UTF-8 character. */
function utf8End(bytes: Uint8Array, start: number, end: number): number {
  if (end >= bytes.length) return bytes.length;
  let i = end;
  while (i > start && (bytes[i] & 0xc0) === 0x80) i--;
  if (i === start && end < bytes.length) {
    const b = bytes[start];
    const n = b < 0x80 ? 1 : b < 0xe0 ? 2 : b < 0xf0 ? 3 : 4;
    return Math.min(bytes.length, start + n);
  }
  return i;
}

/**
 * Slice a serialized body at `offset`. Returns the slice, whether more remains,
 * and the pre-formed call that fetches the rest (same call + continue token).
 * Cuts land on UTF-8 character boundaries so concatenating slices reproduces the body.
 */
export function capBody(serialized: string, offset: number, call: Omit<ExecuteCall, "continue">, cap = BODY_CAP_BYTES) {
  const all = enc.encode(serialized);
  const end = utf8End(all, offset, Math.min(all.length, offset + cap));
  const slice = all.subarray(offset, end);
  const truncated = end < all.length;
  return {
    text: dec.decode(slice),
    total_bytes: all.length,
    truncated,
    continue: truncated ? ({ ...call, continue: mintContinue({ offset: end }) } as ExecuteCall) : null,
  };
}
