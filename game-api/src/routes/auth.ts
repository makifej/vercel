// Fiókok (PRD 13.9): anonim fiók első indításkor, opcionális Apple- vagy
// Google-összekapcsolás; ütközésnél a játékos dönt, csendes felülírás nincs.

import { createHash } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { issueToken, newUserId } from '../auth';
import { HttpError, limitByIp, locals, parseBody, requireAuth, type Deps } from '../http';
import { isValidTimeZone, iso } from '../time';
import { defaultProfile, getProfile, keys, saveProfile } from '../store';

const AnonBody = z.object({
  installId: z.string().min(8).max(128),
  platform: z.enum(['android', 'ios']).default('android'),
  appVersion: z.string().max(32).default('0.0.0'),
  locale: z.string().max(16).default('hu-HU'),
  tz: z.string().max(64).default('Europe/Budapest'),
});

const LinkBody = z.object({
  provider: z.enum(['apple', 'google']),
  idToken: z.string().min(20).max(8192),
  resolve: z.enum(['useExisting', 'moveToCurrent']).optional(),
});

export function authRoutes(deps: Deps): Router {
  const r = Router();

  r.post('/v1/auth/anon', limitByIp(deps, 'anon', 10), async (req, res) => {
    if (!deps.config.authSecret) throw new HttpError(503, { error: 'misconfigured' });
    const body = parseBody(AnonBody, req.body);
    const now = deps.now();
    // Ugyanaz a telepítési azonosító ugyanazt a fiókot kapja (újrapróbálás, kiesés után).
    const installHash = createHash('sha256').update(body.installId).digest('hex').slice(0, 40);
    const candidate = newUserId();
    const created = await deps.kv.set(keys.install(installHash), candidate, { nx: true });
    const userId = created ? candidate : await deps.kv.get(keys.install(installHash));
    if (!userId) throw new HttpError(503, { error: 'unavailable' });

    let profile = await getProfile(deps.kv, userId);
    if (!profile) {
      profile = defaultProfile(userId, now, {
        platform: body.platform,
        appVersion: body.appVersion,
        locale: body.locale,
        tz: isValidTimeZone(body.tz) ? body.tz : 'Europe/Budapest',
        installHash,
      });
    } else {
      profile = { ...profile, appVersion: body.appVersion, locale: body.locale };
    }
    await saveProfile(deps.kv, profile);
    const { token, expiresAt } = issueToken(deps.config.authSecret, userId, now, deps.config.tokenTtlDays);
    res.json({ userId, token, tokenExpiresAt: iso(expiresAt), serverNow: iso(now) });
  });

  r.post('/v1/auth/link', requireAuth(deps), async (req, res) => {
    const body = parseBody(LinkBody, req.body);
    const { profile } = locals(res);
    const identity = await deps.verifyIdToken(body.provider, body.idToken);
    if (!identity) throw new HttpError(401, { error: 'invalid_id_token' });

    const authKey = keys.auth(identity.provider, identity.sub);
    const owner = await deps.kv.get(authKey);
    const now = deps.now();

    if (owner && owner !== profile.userId) {
      if (body.resolve === 'useExisting') {
        // A játékos a már összekapcsolt fiókot választja; ezen az eszközön arra vált.
        const { token } = issueToken(deps.config.authSecret, owner, now, deps.config.tokenTtlDays);
        res.json({ userId: owner, token, switched: true, serverNow: iso(now) });
        return;
      }
      if (body.resolve !== 'moveToCurrent') {
        const other = await getProfile(deps.kv, owner);
        throw new HttpError(409, { error: 'link_conflict', existingHasPet: Boolean(other?.activePetId) });
      }
      const other = await getProfile(deps.kv, owner);
      if (other) {
        delete other.providers[identity.provider];
        await saveProfile(deps.kv, other);
      }
    }

    await deps.kv.set(authKey, profile.userId);
    profile.providers[identity.provider] = identity.sub;
    await saveProfile(deps.kv, profile);
    res.json({ userId: profile.userId, linked: Object.keys(profile.providers), switched: false, serverNow: iso(now) });
  });

  return r;
}
