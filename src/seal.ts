/** Seal/open a small JSON payload with AES-GCM under COOKIE_ENCRYPTION_KEY.
 *  Used for the OAuth `state` param so the PKCE verifier never travels in clear. */
const enc = new TextEncoder();
const dec = new TextDecoder();

async function key(hex: string): Promise<CryptoKey> {
  const raw = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
const b64u = (u: Uint8Array) => btoa(String.fromCharCode(...u)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export async function seal(hex: string, obj: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(hex), enc.encode(JSON.stringify(obj))));
  return `${b64u(iv)}.${b64u(ct)}`;
}
export async function open<T>(hex: string, token: string): Promise<T> {
  const [iv, ct] = token.split(".");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv) }, await key(hex), unb64u(ct));
  return JSON.parse(dec.decode(pt)) as T;
}
export function randomVerifier(): string {
  return b64u(crypto.getRandomValues(new Uint8Array(32)));
}
export async function s256(verifier: string): Promise<string> {
  return b64u(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(verifier))));
}
