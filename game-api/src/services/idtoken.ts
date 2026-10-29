// Sign in with Apple és Google ID-token ellenőrzése (PRD 13.9, FR-34): RS256
// aláírás a szolgáltató nyilvános JWKS-kulcsaival, kibocsátó, közönség és lejárat.
// A JWKS-végpontok és a kibocsátók az ismert, dokumentált értékek; az élő
// összekapcsolás előtt a szolgáltatói dokumentációval egyeztetendő [ELLENŐRIZENDŐ].

import { createPublicKey, verify, type JsonWebKey } from 'node:crypto';

export type Provider = 'apple' | 'google';

export interface VerifiedIdentity {
  provider: Provider;
  sub: string;
  email: string | null;
}

export type IdTokenVerifier = (provider: Provider, idToken: string) => Promise<VerifiedIdentity | null>;

const PROVIDERS: Record<Provider, { jwks: string; issuers: string[] }> = {
  apple: { jwks: 'https://appleid.apple.com/auth/keys', issuers: ['https://appleid.apple.com'] },
  google: {
    jwks: 'https://www.googleapis.com/oauth2/v3/certs',
    issuers: ['https://accounts.google.com', 'accounts.google.com'],
  },
};

type Jwk = JsonWebKey & { kid?: string };
export type JwksFetcher = (url: string) => Promise<Jwk[]>;

const defaultFetcher: JwksFetcher = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`JWKS HTTP ${res.status}`);
  const body = (await res.json()) as { keys?: Jwk[] };
  return body.keys ?? [];
};

function decodePart<T>(part: string): T | null {
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export function createIdTokenVerifier(opts: {
  audiences: Record<Provider, string[]>;
  now: () => number;
  fetchJwks?: JwksFetcher;
}): IdTokenVerifier {
  const fetchJwks = opts.fetchJwks ?? defaultFetcher;
  const cache = new Map<string, { keys: Jwk[]; at: number }>();

  const keysFor = async (url: string, refresh: boolean) => {
    const hit = cache.get(url);
    if (hit && !refresh && opts.now() - hit.at < 3_600_000) return hit.keys;
    const keys = await fetchJwks(url);
    cache.set(url, { keys, at: opts.now() });
    return keys;
  };

  return async (provider, idToken) => {
    const cfg = PROVIDERS[provider];
    const audiences = opts.audiences[provider];
    if (!cfg || audiences.length === 0) return null;
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const header = decodePart<{ alg?: string; kid?: string }>(parts[0]);
    const claims = decodePart<{ iss?: string; aud?: string | string[]; exp?: number; sub?: string; email?: string }>(
      parts[1],
    );
    if (!header || !claims || header.alg !== 'RS256' || !header.kid) return null;

    let jwk = (await keysFor(cfg.jwks, false)).find((k) => k.kid === header.kid);
    if (!jwk) jwk = (await keysFor(cfg.jwks, true)).find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const ok = verify(
      'RSA-SHA256',
      Buffer.from(`${parts[0]}.${parts[1]}`),
      createPublicKey({ key: jwk, format: 'jwk' }),
      Buffer.from(parts[2], 'base64url'),
    );
    if (!ok) return null;

    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!claims.iss || !cfg.issuers.includes(claims.iss)) return null;
    if (!aud.some((a) => a !== undefined && audiences.includes(a))) return null;
    if (!claims.exp || claims.exp * 1000 <= opts.now()) return null;
    if (!claims.sub) return null;
    return { provider, sub: claims.sub, email: claims.email ?? null };
  };
}
