import request from 'supertest';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import type { Deps } from '../src/http';
import { MemoryKv } from '../src/kv';
import type { VerifiedIdentity } from '../src/services/idtoken';
import type { PushMessage } from '../src/services/push';

/** 2026-11-02 (hétfő) 07:00 Budapest (UTC+1). */
export const T0 = Date.UTC(2026, 10, 2, 6, 0);
export const MIN = 60_000;
export const H = 60 * MIN;

export interface TestEnv {
  deps: Deps;
  kv: MemoryKv;
  clock: { now: number };
  pushed: PushMessage[];
  identities: Map<string, VerifiedIdentity>;
  revenueCatDeleted: string[];
  app: ReturnType<typeof createApp>;
}

export function makeEnv(env: Record<string, string> = {}): TestEnv {
  const clock = { now: T0 };
  const kv = new MemoryKv(() => clock.now);
  const pushed: PushMessage[] = [];
  const identities = new Map<string, VerifiedIdentity>();
  const revenueCatDeleted: string[] = [];
  const deps: Deps = {
    kv,
    now: () => clock.now,
    config: loadConfig({
      AUTH_SECRET: 'teszt-titok',
      CRON_SECRET: 'cron-titok',
      REVENUECAT_WEBHOOK_AUTH: 'rc-titok',
      PET_PROMO_CODES: 'BETA26:beta,ALAPITO:alapito',
      PROMO_STATS_KEY: 'stat-kulcs',
      RL_PER_USER_PER_MIN: '1000',
      RL_PER_IP_PER_MIN: '1000',
      ...env,
    }),
    push: async (messages) => {
      pushed.push(...messages);
      return { sent: messages.length, invalidTokens: messages.filter((m) => m.to.includes('Halott')).map((m) => m.to) };
    },
    verifyIdToken: async (_provider, idToken) => identities.get(idToken) ?? null,
    revenueCatDelete: async (userId) => {
      revenueCatDeleted.push(userId);
    },
  };
  return { deps, kv, clock, pushed, identities, revenueCatDeleted, app: createApp(deps) };
}

export async function signUp(t: TestEnv, installId = `install-${Math.random()}`) {
  const res = await request(t.app).post('/v1/auth/anon').send({ installId, tz: 'Europe/Budapest' });
  return { token: res.body.token as string, userId: res.body.userId as string, res };
}

export function api(t: TestEnv, token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  return {
    get: (path: string) => request(t.app).get(path).set(auth),
    post: (path: string, body: object = {}) => request(t.app).post(path).set(auth).send(body),
    put: (path: string, body: object = {}) => request(t.app).put(path).set(auth).send(body),
    del: (path: string) => request(t.app).delete(path).set(auth),
  };
}

/** Új tojás, melegítés, majd kelés: élő bébi kedvenc. */
export async function hatchPet(t: TestEnv, token: string, mode: 'alap' | 'klasszikus' = 'alap', name = 'Pötty') {
  const a = api(t, token);
  const created = await a.post('/v1/pets', { name, mode });
  const petId = created.body.pet.id as string;
  const warmed = await a.post(`/v1/pets/${petId}/actions`, {
    expectedVersion: created.body.version,
    actions: [{ id: 'warm-1', type: 'warm' }],
  });
  t.clock.now += 6 * MIN;
  const state = await a.get('/v1/state');
  return { petId, created, warmed, state };
}
