// Jogosultságok (PRD 10.4, 13.10): Teljes verzió a RevenueCat webhook alapján,
// 7 napos próbaidő a `userId`-hoz kötve, `SET NX`-szel (a meglévő /trial mintája).

import { createHash } from 'node:crypto';
import type { Kv } from '../kv';
import { keys, type Profile } from '../store';

export const TRIAL_DAYS = 7;

export interface Entitlements {
  full: boolean;
  cosmetics: string[];
  perks: string[];
  trialStartedAt: number | null;
  trialEndsAt: number | null;
  trialActive: boolean;
}

export async function getEntitlements(kv: Kv, profile: Profile, now: number): Promise<Entitlements> {
  const started = await kv.get(keys.trial(profile.userId));
  const startedAt = started ? Date.parse(started) : null;
  const endsAt = startedAt !== null ? startedAt + TRIAL_DAYS * 86_400_000 : null;
  return {
    full: profile.entitlements.full,
    cosmetics: profile.entitlements.cosmetics,
    perks: profile.perks,
    trialStartedAt: startedAt,
    trialEndsAt: endsAt,
    trialActive: endsAt !== null && now < endsAt,
  };
}

/** Klasszikus mód új tojásnál, öröklődés, második minijáték (PRD 10.4). */
export function hasPremium(e: Entitlements): boolean {
  return e.full || e.trialActive;
}

/** A próbaidő kezdetének rögzítése; a kulcsnak szándékosan nincs lejárata. */
export async function ensureTrial(kv: Kv, userId: string, now: number, fingerprint?: string): Promise<{ startedAt: number; fingerprintSeen: boolean }> {
  const iso = new Date(now).toISOString();
  const created = await kv.set(keys.trial(userId), iso, { nx: true });
  const startedRaw = created ? iso : await kv.get(keys.trial(userId));
  let fingerprintSeen = false;
  if (fingerprint) {
    // Az ujjlenyomat csak visszaélés-jelzés (PRD 13.9), hash-elve tároljuk.
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 32);
    const first = await kv.set(keys.trialFp(hash), userId, { nx: true });
    if (!first) fingerprintSeen = (await kv.get(keys.trialFp(hash))) !== userId;
  }
  return { startedAt: Date.parse(startedRaw ?? iso), fingerprintSeen };
}

export function entitlementView(e: Entitlements) {
  return {
    full: e.full,
    cosmetics: e.cosmetics,
    perks: e.perks,
    trialActive: e.trialActive,
    trialEndsAt: e.trialEndsAt !== null ? new Date(e.trialEndsAt).toISOString() : null,
  };
}
