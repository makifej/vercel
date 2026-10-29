// Próbaidő, promókód és RevenueCat webhook (PRD 10.8, 13.10). A fizetés maga a
// boltban és a RevenueCatben történik; a szerver csak a jogosultságot tükrözi.

import { Router, type Request } from 'express';
import { z } from 'zod';
import { safeEqual } from '../auth';
import { HttpError, locals, parseBody, requireAuth, type Deps } from '../http';
import { ensureTrial, entitlementView, getEntitlements } from '../services/entitlements';
import { getProfile, keys, saveProfile, type Profile } from '../store';
import { iso } from '../time';

const TrialBody = z.object({ deviceFingerprint: z.string().min(4).max(256).optional() });
const PromoBody = z.object({ code: z.string().trim().min(3).max(64) });

const GRANT = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'NON_RENEWING_PURCHASE',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'SUBSCRIPTION_EXTENDED',
  'TEMPORARY_ENTITLEMENT_GRANT',
  'REFUND_REVERSED',
]);

interface RcEvent {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  entitlement_ids?: string[] | null;
  cancel_reason?: string;
  transferred_from?: string[];
  transferred_to?: string[];
}

function applyEntitlements(profile: Profile, ids: string[], grant: boolean, now: number) {
  for (const id of ids) {
    if (id === 'full') profile.entitlements.full = grant;
    else if (id.startsWith('cosmetic_')) {
      const set = new Set(profile.entitlements.cosmetics);
      if (grant) set.add(id);
      else set.delete(id);
      profile.entitlements.cosmetics = [...set];
    }
  }
  profile.entitlements.updatedAt = now;
}

async function findProfile(deps: Deps, ids: (string | undefined)[]): Promise<Profile | null> {
  for (const id of ids) {
    if (!id) continue;
    const p = await getProfile(deps.kv, id);
    if (p) return p;
  }
  return null;
}

function webhookAuthorized(deps: Deps, req: Request): boolean {
  const expected = deps.config.revenueCatWebhookAuth;
  const got = String(req.headers.authorization ?? '');
  return safeEqual(got, expected) || safeEqual(got, `Bearer ${expected}`);
}

export function commerceRoutes(deps: Deps): Router {
  const r = Router();
  const auth = requireAuth(deps);

  r.post('/v1/trial', auth, async (req, res) => {
    const body = parseBody(TrialBody, req.body ?? {});
    const { profile } = locals(res);
    const now = deps.now();
    const t = await ensureTrial(deps.kv, profile.userId, now, body.deviceFingerprint);
    const ent = await getEntitlements(deps.kv, profile, now);
    res.json({
      startedAt: iso(t.startedAt),
      endsAt: ent.trialEndsAt !== null ? iso(ent.trialEndsAt) : null,
      active: ent.trialActive,
      serverNow: iso(now),
      entitlements: entitlementView(ent),
    });
  });

  // Promókód: csak nem árusított juttatás (béta-hozzáférés, alapító kozmetikum), egy kód
  // egyszer, atomi SET NX-szel, Redis-hibánál fail-closed (a meglévő /promo mintája).
  r.post('/v1/promo', auth, async (req, res) => {
    const body = parseBody(PromoBody, req.body);
    const { profile } = locals(res);
    const code = body.code.toUpperCase();
    const perk = deps.config.promoCodes.get(code);
    if (!perk) {
      res.json({ ok: false, reason: 'invalid' });
      return;
    }
    const claimed = await deps.kv.set(keys.promo(code), `${profile.userId}|${iso(deps.now())}`, { nx: true });
    if (!claimed) {
      res.json({ ok: false, reason: 'used' });
      return;
    }
    profile.perks = [...new Set([...profile.perks, perk])];
    await saveProfile(deps.kv, profile);
    res.json({ ok: true, perk });
  });

  r.get('/v1/promo/stats', async (req, res) => {
    const key = deps.config.promoStatsKey;
    if (!key || !safeEqual(String(req.query.key ?? ''), key)) throw new HttpError(403, { error: 'forbidden' });
    const codes = [...deps.config.promoCodes.keys()];
    const values = await deps.kv.mget(codes.map((c) => keys.promo(c)));
    const rows = codes.map((code, i) => {
      const v = values[i];
      if (!v) return { code, perk: deps.config.promoCodes.get(code), status: 'unused' };
      const [userId, redeemedAt] = v.split('|');
      return { code, perk: deps.config.promoCodes.get(code), status: 'redeemed', userId, redeemedAt };
    });
    res.json({ redeemed: rows.filter((x) => x.status === 'redeemed').length, total: codes.length, rows });
  });

  // RevenueCat webhook. Az eseménytípusok és mezők a RevenueCat dokumentációja szerint
  // értelmezendők; a pontos lista élesítés előtt egyeztetendő [ELLENŐRIZENDŐ].
  r.post('/v1/webhooks/revenuecat', async (req, res) => {
    if (!deps.config.revenueCatWebhookAuth || !webhookAuthorized(deps, req)) {
      throw new HttpError(401, { error: 'unauthorized' });
    }
    const event = (req.body?.event ?? {}) as RcEvent;
    if (!event.type) throw new HttpError(422, { error: 'invalid_event' });
    if (event.id) {
      const first = await deps.kv.set(keys.rcEvent(event.id), '1', { nx: true, exSeconds: 7 * 86_400 });
      if (!first) {
        res.json({ ok: true, duplicate: true });
        return;
      }
    }
    const now = deps.now();
    const ids = event.entitlement_ids ?? [];

    if (event.type === 'TRANSFER') {
      const from = await findProfile(deps, event.transferred_from ?? []);
      const to = await findProfile(deps, event.transferred_to ?? []);
      if (from && to) {
        const moved = [...(from.entitlements.full ? ['full'] : []), ...from.entitlements.cosmetics];
        applyEntitlements(to, moved, true, now);
        applyEntitlements(from, moved, false, now);
        await saveProfile(deps.kv, from);
        await saveProfile(deps.kv, to);
      }
      res.json({ ok: true });
      return;
    }

    const profile = await findProfile(deps, [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])]);
    if (!profile) {
      // Ismeretlen felhasználó: nyugtázzuk, hogy a RevenueCat ne próbálja újra végtelenül.
      res.json({ ok: true, ignored: 'unknown_user' });
      return;
    }
    const revoke = event.type === 'EXPIRATION' || (event.type === 'CANCELLATION' && event.cancel_reason === 'CUSTOMER_SUPPORT');
    if (GRANT.has(event.type)) applyEntitlements(profile, ids, true, now);
    else if (revoke) applyEntitlements(profile, ids, false, now);
    await saveProfile(deps.kv, profile);
    res.json({ ok: true });
  });

  return r;
}
