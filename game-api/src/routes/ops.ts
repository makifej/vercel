// Push-token regisztráció, tartalék push kiküldése (PRD 13.8) és állapotellenőrzés.

import { createHash, createHmac } from 'node:crypto';
import { Router, type Request } from 'express';
import { z } from 'zod';
import { safeEqual } from '../auth';
import { HttpError, locals, parseBody, requireAuth, type Deps } from '../http';
import { EXPO_TOKEN_RE, type PushMessage } from '../services/push';
import { getPet, getProfile, keys } from '../store';
import { iso } from '../time';

const TokenBody = z.object({ token: z.string().regex(EXPO_TOKEN_RE) });

/**
 * QStash aláírás (HS256 JWT az `Upstash-Signature` fejlécben): kibocsátó,
 * lejárat, a törzs SHA-256 lenyomata és opcionálisan a cél-URL. A formátum
 * az Upstash SDK viselkedése alapján; élesítés előtt egyeztetendő [ELLENŐRIZENDŐ].
 */
export function verifyQstashSignature(
  signature: string,
  rawBody: string,
  signingKeys: string[],
  now: number,
  expectedUrl: string | null,
): boolean {
  const parts = signature.split('.');
  if (parts.length !== 3) return false;
  const signed = `${parts[0]}.${parts[1]}`;
  const valid = signingKeys.some((key) => safeEqual(createHmac('sha256', key).update(signed).digest('base64url'), parts[2]));
  if (!valid) return false;
  let claims: { iss?: string; sub?: string; exp?: number; nbf?: number; body?: string };
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return false;
  }
  const sec = Math.floor(now / 1000);
  if (claims.iss !== 'Upstash') return false;
  if (!claims.exp || claims.exp < sec) return false;
  if (claims.nbf && claims.nbf > sec + 60) return false;
  if (expectedUrl && claims.sub !== expectedUrl) return false;
  const bodyHash = createHash('sha256').update(rawBody).digest('base64url');
  return (claims.body ?? '').replace(/=+$/, '') === bodyHash.replace(/=+$/, '');
}

function cronAuthorized(deps: Deps, req: Request): boolean {
  // Vercel Cron: a CRON_SECRET Bearer-fejlécként érkezik.
  if (safeEqual(String(req.headers.authorization ?? ''), deps.config.cronSecret ? `Bearer ${deps.config.cronSecret}` : null)) {
    return true;
  }
  const sig = String(req.headers['upstash-signature'] ?? '');
  if (!sig || deps.config.qstashSigningKeys.length === 0) return false;
  const raw = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? '';
  const url = deps.config.publicBaseUrl ? `${deps.config.publicBaseUrl.replace(/\/$/, '')}/v1/cron/tick` : null;
  return verifyQstashSignature(sig, raw, deps.config.qstashSigningKeys, deps.now(), url);
}

const MESSAGES: Record<string, (name: string) => { title: string; body: string; channelId: string }> = {
  critical: (name) => ({
    title: name,
    body: `${name} állapota kritikus. Klasszikus módban kb. 12 óra van hátra, az alvásidő nem számít bele. Ha most nem alkalmas, Alap módra válthatsz.`,
    channelId: 'kritikus',
  }),
  vacation: () => ({
    title: 'Szabadság',
    body: 'A szabadság holnap véget ér. Ha még úton vagy, meghosszabbíthatod.',
    channelId: 'gondozas',
  }),
};

export async function runTick(deps: Deps, limit = 200) {
  const now = deps.now();
  const due = await deps.kv.zrangeByScore(keys.duePush, now, limit);
  const messages: PushMessage[] = [];
  const tokenOwner = new Map<string, string>();
  let skipped = 0;
  for (const member of due) {
    const [petId, type, , computedAtStr] = member.split('|');
    await deps.kv.zrem(keys.duePush, [member]);
    await deps.kv.srem(keys.petDue(petId), [member]);
    const pet = await getPet(deps.kv, petId);
    // Csak akkor küldünk, ha a számítás óta nem volt szinkron (PRD 13.8).
    if (!pet || pet.record.syncedAt > Number(computedAtStr) || !MESSAGES[type]) {
      skipped++;
      continue;
    }
    const profile = await getProfile(deps.kv, pet.record.userId);
    const category = type === 'critical' ? 'kritikus' : 'szabadsag';
    if (!profile || profile.notify.overrides[category] === false) {
      skipped++;
      continue;
    }
    const text = MESSAGES[type](pet.record.state.name);
    for (const token of await deps.kv.smembers(keys.pushTokens(profile.userId))) {
      messages.push({ to: token, ...text, data: { petId, type } });
      tokenOwner.set(token, profile.userId);
    }
  }
  let sent = 0;
  if (messages.length) {
    const result = await deps.push(messages);
    sent = result.sent;
    for (const token of result.invalidTokens) {
      const owner = tokenOwner.get(token);
      if (owner) await deps.kv.srem(keys.pushTokens(owner), [token]);
    }
  }
  return { processed: due.length, sent, skipped, serverNow: iso(now) };
}

export function opsRoutes(deps: Deps): Router {
  const r = Router();

  r.post('/v1/push/tokens', requireAuth(deps), async (req, res) => {
    const body = parseBody(TokenBody, req.body);
    const { profile } = locals(res);
    await deps.kv.sadd(keys.pushTokens(profile.userId), [body.token]);
    res.json({ ok: true });
  });

  const tick = async (req: Request, res: import('express').Response) => {
    if (!cronAuthorized(deps, req)) throw new HttpError(401, { error: 'unauthorized' });
    res.json(await runTick(deps));
  };
  // A Vercel Cron GET-tel hív, a QStash POST-tal.
  r.get('/v1/cron/tick', tick);
  r.post('/v1/cron/tick', tick);

  r.get('/v1/health', async (_req, res) => {
    const kv = await deps.kv.ping();
    res.status(kv ? 200 : 503).json({ ok: kv, kv, serverNow: iso(deps.now()) });
  });

  return r;
}
