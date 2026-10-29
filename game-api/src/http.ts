import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { verifyToken, issueToken } from './auth';
import type { Config } from './config';
import { KvError, type Kv } from './kv';
import type { PushSender } from './services/push';
import type { IdTokenVerifier } from './services/idtoken';
import { getProfile, type Profile } from './store';

export interface Deps {
  kv: Kv;
  now: () => number;
  config: Config;
  push: PushSender;
  verifyIdToken: IdTokenVerifier;
  /** RevenueCat-oldali adattörlés indítása fióktörléskor (FR-35 d). */
  revenueCatDelete: (userId: string) => Promise<void>;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: Record<string, unknown>,
  ) {
    super(String(body.error ?? status));
  }
}

export function parseBody<T>(schema: ZodType<T>, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new HttpError(422, { error: 'invalid_request', issues: r.error.issues.map((i) => i.message) });
  return r.data;
}

export function clientIp(req: Request): string {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '');
  return forwarded.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
}

export interface AuthedLocals {
  userId: string;
  profile: Profile;
}

/** Bearer token ellenőrzése és profil betöltése; a lejárat felénél új tokent ad fejlécben. */
export function requireAuth(deps: Deps) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!deps.config.authSecret) throw new HttpError(503, { error: 'misconfigured' });
    const header = String(req.headers.authorization ?? '');
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const now = deps.now();
    const verified = token ? verifyToken(deps.config.authSecret, token, now) : null;
    if (!verified) throw new HttpError(401, { error: 'unauthorized' });
    const profile = await getProfile(deps.kv, verified.userId);
    if (!profile) throw new HttpError(401, { error: 'unauthorized' });
    if (verified.expiresAt - now < (deps.config.tokenTtlDays / 2) * 86_400_000) {
      res.setHeader('X-Refreshed-Token', issueToken(deps.config.authSecret, profile.userId, now, deps.config.tokenTtlDays).token);
    }
    res.locals.userId = profile.userId;
    res.locals.profile = profile;
    const minute = Math.floor(now / 60_000);
    const count = await deps.kv.incrWindow(`rl:u:${profile.userId}:${minute}`, 120);
    if (count > deps.config.rateLimitPerUserPerMin) throw new HttpError(429, { error: 'rate_limited' });
    next();
  };
}

/** IP-alapú korlát a hitelesítés nélküli végpontokra. */
export function limitByIp(deps: Deps, bucket: string, perMinute?: number) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const minute = Math.floor(deps.now() / 60_000);
    const count = await deps.kv.incrWindow(`rl:ip:${bucket}:${clientIp(req)}:${minute}`, 120);
    if (count > (perMinute ?? deps.config.rateLimitPerIpPerMin)) throw new HttpError(429, { error: 'rate_limited' });
    next();
  };
}

export function locals(res: Response): AuthedLocals {
  return res.locals as AuthedLocals;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json(err.body);
    return;
  }
  if (err instanceof KvError) {
    // Tárhiba: nem találgatunk, a kliens újrapróbál (a meglévő backend fail-closed mintája).
    res.status(503).json({ error: 'unavailable' });
    return;
  }
  if (err instanceof ZodError) {
    res.status(422).json({ error: 'invalid_request' });
    return;
  }
  if (err instanceof SyntaxError) {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }
  console.error('[game-api] váratlan hiba', err);
  res.status(500).json({ error: 'internal' });
}
