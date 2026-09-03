/**
 * Latest DCS grant after an in-`execute` refresh. The provider can rewrite
 * encrypted props only on the client's own `/token` refresh, and DCS refresh
 * tokens rotate on use (SECURITY.md) — both refresh paths share this sealed KV
 * key so they cannot invalidate each other.
 */
import { open, seal } from "./seal";
import type { Env, GrantProps } from "./types";
import type { Grant } from "./tools/execute";

export interface StoredGrant extends Grant {
  sub: string;
  /** Date.now() when this grant was written (in-execute or /token). */
  at: number;
}

export const latestGrantKey = (sub: string) => `dcs:latest:${sub}`;

/** Prefer the stored grant when it is at least as new as the props issuance. */
export function selectGrant(props: GrantProps, stored: StoredGrant | null): Grant | null {
  if (!props?.accessToken) return null;
  if (stored && stored.sub === props.sub) {
    const propsAt = props.expiresAt != null && props.expiresIn != null ? props.expiresAt - props.expiresIn * 1000 : 0;
    if (stored.at >= propsAt) {
      return { accessToken: stored.accessToken, refreshToken: stored.refreshToken ?? props.refreshToken };
    }
  }
  return { accessToken: props.accessToken, refreshToken: props.refreshToken };
}

export function newerStored(a: StoredGrant | null | undefined, b: StoredGrant | null | undefined): StoredGrant | null {
  const xs = [a, b].filter((g): g is StoredGrant => !!g && typeof g.accessToken === "string" && typeof g.at === "number");
  if (xs.length === 0) return null;
  return xs.sort((x, y) => y.at - x.at)[0];
}

export async function loadLatestGrant(env: Pick<Env, "OAUTH_KV" | "COOKIE_ENCRYPTION_KEY">, sub: string): Promise<StoredGrant | null> {
  if (!sub || !env.OAUTH_KV || !env.COOKIE_ENCRYPTION_KEY) return null;
  const raw = await env.OAUTH_KV.get(latestGrantKey(sub));
  if (!raw) return null;
  try {
    const g = await open<StoredGrant>(env.COOKIE_ENCRYPTION_KEY, raw);
    return g?.sub === sub && g.accessToken ? g : null;
  } catch {
    return null;
  }
}

export async function saveLatestGrant(env: Pick<Env, "OAUTH_KV" | "COOKIE_ENCRYPTION_KEY">, g: StoredGrant): Promise<void> {
  if (!g.sub || !env.OAUTH_KV || !env.COOKIE_ENCRYPTION_KEY) return;
  await env.OAUTH_KV.put(latestGrantKey(g.sub), await seal(env.COOKIE_ENCRYPTION_KEY, g));
}
