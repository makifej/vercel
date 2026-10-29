import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { directionRounds, minigameSeed } from '../src/sim';
import { keys } from '../src/store';
import { api, H, hatchPet, makeEnv, MIN, signUp, T0 } from './helpers';

describe('fiókok', () => {
  it('anonim fiók tokennel; ugyanaz a telepítés ugyanazt a fiókot kapja', async () => {
    const t = makeEnv();
    const a = await signUp(t, 'telepites-1');
    const b = await signUp(t, 'telepites-1');
    expect(a.userId).toMatch(/^u_/);
    expect(b.userId).toBe(a.userId);
    expect(a.res.body.serverNow).toBe(new Date(T0).toISOString());
    const state = await api(t, a.token).get('/v1/state');
    expect(state.status).toBe(200);
    expect(state.body.pet).toBeNull();
  });

  it('érvénytelen token 401', async () => {
    const t = makeEnv();
    const res = await request(t.app).get('/v1/state').set('Authorization', 'Bearer v1.u_x.1.hamis');
    expect(res.status).toBe(401);
  });

  it('összekapcsolás ütközéssel: a játékos dönt', async () => {
    const t = makeEnv();
    t.identities.set('apple-token-123456789012', { provider: 'apple', sub: 'apple-sub', email: null });
    const first = await signUp(t);
    const second = await signUp(t);
    const linked = await api(t, first.token).post('/v1/auth/link', { provider: 'apple', idToken: 'apple-token-123456789012' });
    expect(linked.body.linked).toEqual(['apple']);
    const conflict = await api(t, second.token).post('/v1/auth/link', { provider: 'apple', idToken: 'apple-token-123456789012' });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error).toBe('link_conflict');
    const switched = await api(t, second.token).post('/v1/auth/link', {
      provider: 'apple',
      idToken: 'apple-token-123456789012',
      resolve: 'useExisting',
    });
    expect(switched.body.userId).toBe(first.userId);
    const bad = await api(t, second.token).post('/v1/auth/link', { provider: 'apple', idToken: 'ismeretlen-token-123456' });
    expect(bad.status).toBe(401);
  });
});

describe('kedvenc és gondozás', () => {
  it('tojás, melegítés, kelés szerveridővel', async () => {
    const t = makeEnv();
    const { token } = await signUp(t);
    const { created, warmed, state } = await hatchPet(t, token);
    expect(created.status).toBe(201);
    expect(created.body.pet.status).toBe('egg');
    expect(created.body.entitlements.trialActive).toBe(true);
    expect(warmed.body.rejected).toEqual([]);
    expect(state.body.pet.status).toBe('alive');
    expect(state.body.pet.stage).toBe('baby');
    expect(state.body.events.some((e: { type: string }) => e.type === 'hatched')).toBe(true);
  });

  it('élő kedvenc mellett nem kérhető új tojás', async () => {
    const t = makeEnv();
    const { token } = await signUp(t);
    await hatchPet(t, token);
    const again = await api(t, token).post('/v1/pets', { name: 'Folt', mode: 'alap' });
    expect(again.status).toBe(409);
    expect(again.body.error).toBe('active_pet_exists');
  });

  it('verzióütközés 409, idempotens műveletazonosító', async () => {
    const t = makeEnv();
    const { token } = await signUp(t);
    const { petId, state } = await hatchPet(t, token);
    const a = api(t, token);
    const v = state.body.version;
    const fed = await a.post(`/v1/pets/${petId}/actions`, { expectedVersion: v, actions: [{ id: 'f1', type: 'feed' }, { id: 'c1', type: 'clean' }] });
    expect(fed.status).toBe(200);
    expect(fed.body.pet.hunger).toBeGreaterThan(state.body.pet.hunger);
    expect(fed.body.rejected.map((r: { reason: string }) => r.reason)).toEqual(['nothingToClean']);
    const stale = await a.post(`/v1/pets/${petId}/actions`, { expectedVersion: v, actions: [{ id: 'f2', type: 'feed' }] });
    expect(stale.status).toBe(409);
    expect(stale.body.currentVersion).toBe(fed.body.version);
    const dup = await a.post(`/v1/pets/${petId}/actions`, { expectedVersion: fed.body.version, actions: [{ id: 'f1', type: 'feed' }] });
    expect(dup.body.rejected).toEqual([{ id: 'f1', reason: 'duplicate' }]);
  });

  it('más felhasználó kedvencéhez nem fér hozzá', async () => {
    const t = makeEnv();
    const owner = await signUp(t);
    const { petId } = await hatchPet(t, owner.token);
    const other = await signUp(t);
    const res = await api(t, other.token).post(`/v1/pets/${petId}/actions`, { expectedVersion: 1, actions: [{ id: 'x', type: 'feed' }] });
    expect(res.status).toBe(404);
  });

  it('Klasszikus mód próbaidő után jogosultságot kér', async () => {
    const t = makeEnv();
    const { token, userId } = await signUp(t);
    await t.kv.set(keys.trial(userId), new Date(T0 - 8 * 24 * H).toISOString());
    const res = await api(t, token).post('/v1/pets', { name: 'Pötty', mode: 'klasszikus' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('entitlement_required');
  });

  it('minijáték seed-validálással', async () => {
    const t = makeEnv();
    const { token } = await signUp(t);
    const { petId, state } = await hatchPet(t, token);
    const v = state.body.version;
    expect(state.body.minigameSeed).toBe(minigameSeed(t.deps.config.minigameSalt, petId, v));
    const guesses = directionRounds(state.body.minigameSeed);
    const res = await api(t, token).post(`/v1/pets/${petId}/minigame`, { expectedVersion: v, game: 'merre', guesses });
    expect(res.status).toBe(200);
    expect(res.body.score).toEqual({ hits: 5, won: true });
    expect(res.body.pet.happiness).toBeGreaterThan(state.body.pet.happiness);
    const bad = await api(t, token).post(`/v1/pets/${petId}/minigame`, { expectedVersion: res.body.version, game: 'merre', guesses: ['x', 'x', 'x', 'x', 'x'] });
    expect(bad.status).toBe(422);
  });
});

describe('napirend, szabadság', () => {
  it('érvényesít, a változás a következő ébredéstől érvényes, 24 órás korláttal', async () => {
    const t = makeEnv();
    const { token } = await signUp(t);
    await hatchPet(t, token);
    t.clock.now += 2 * H;
    const a = api(t, token);
    expect((await a.put('/v1/settings/schedule', { sleep: { start: '23:00', end: '04:00' } })).status).toBe(422);
    const limit = await a.put('/v1/settings/schedule', { napkozi: [{ days: [1, 2, 3, 4, 5], start: '07:00', end: '18:00' }] });
    expect(limit.status).toBe(422);
    expect(limit.body).toEqual({ error: 'napkozi_limit', maxHours: 10 });
    const ok = await a.put('/v1/settings/schedule', { sleep: { start: '22:30', end: '06:45' }, autoLights: false });
    expect(ok.status).toBe(200);
    expect(ok.body.effectiveFrom).not.toBeNull();
    const again = await a.put('/v1/settings/schedule', { sleep: { start: '22:00', end: '06:30' } });
    expect(again.status).toBe(409);
    expect(again.body.error).toBe('cooldown');
    const st = await a.get('/v1/state');
    expect(st.body.pet.pendingSchedule).toEqual({ bedMin: 22 * 60 + 30, wakeMin: 6 * 60 + 45 });
    expect(st.body.pet.autoLights).toBe(false);
  });

  it('szabadság indítása és befejezése', async () => {
    const t = makeEnv();
    const { token } = await signUp(t);
    await hatchPet(t, token);
    t.clock.now += 2 * H;
    const a = api(t, token);
    const end = new Date(t.clock.now + 3 * 24 * H).toISOString();
    const started = await a.post('/v1/vacations', { start: 'now', end });
    expect(started.status).toBe(200);
    expect(started.body.remainingDays90).toBeCloseTo(27, 0);
    t.clock.now += 24 * H;
    const during = await a.get('/v1/state');
    expect(during.body.pet.vacation).not.toBeNull();
    const ended = await a.del(`/v1/vacations/${started.body.vacation.id}`);
    expect(ended.body.pet.vacation).toBeNull();
    const tooLong = await a.post('/v1/vacations', { start: 'now', end: new Date(t.clock.now + 20 * 24 * H).toISOString() });
    expect(tooLong.status).toBe(422);
    expect(tooLong.body.error).toBe('vacation_too_long');
  });
});

describe('Klasszikus kritikus állapot: push-tartalék, halál, emlékkert, vészleállító', () => {
  async function neglectedClassic(env: Record<string, string> = {}) {
    const t = makeEnv(env);
    const { token, userId } = await signUp(t);
    const { petId } = await hatchPet(t, token, 'klasszikus');
    await api(t, token).post('/v1/push/tokens', { token: 'ExponentPushToken[abc123]' });
    // A bébi szakasz után Gyerek; elhanyagolás, majd az első szinkron kiszámolja a tartalék push-t.
    t.clock.now += 70 * MIN;
    await api(t, token).get('/v1/state');
    return { t, token, userId, petId };
  }

  it('a tartalék push kiküldődik, ha a számítás óta nem volt szinkron', async () => {
    const { t, petId } = await neglectedClassic();
    const due = await t.kv.zrangeByScore(keys.duePush, Number.MAX_SAFE_INTEGER, 10);
    expect(due).toHaveLength(1);
    expect(due[0]).toContain(`${petId}|critical|`);
    const unauthorized = await request(t.app).get('/v1/cron/tick');
    expect(unauthorized.status).toBe(401);
    t.clock.now = Number(due[0].split('|')[2]) + MIN;
    const tick = await request(t.app).get('/v1/cron/tick').set('Authorization', 'Bearer cron-titok');
    expect(tick.status).toBe(200);
    expect(tick.body.sent).toBe(1);
    expect(t.pushed[0].body).toContain('kritikus');
    expect(t.pushed[0].to).toBe('ExponentPushToken[abc123]');
  });

  it('halál után emlékkert-bejegyzés, sírfelirat és napi egy virág', async () => {
    const { t, token, petId } = await neglectedClassic();
    t.clock.now += 3 * 24 * H;
    const st = await api(t, token).get('/v1/state');
    expect(st.body.pet.status).toBe('dead');
    const mem = await api(t, token).get('/v1/memorial');
    expect(mem.body.entries).toHaveLength(1);
    expect(mem.body.entries[0].cause).not.toBe('oregkor');
    const put = await api(t, token).put(`/v1/memorial/${petId}`, { epitaph: 'Kicsi volt, de a miénk.', flower: true });
    expect(put.body.entry.flowers).toBe(1);
    const again = await api(t, token).put(`/v1/memorial/${petId}`, { flower: true });
    expect(again.body.entry.flowers).toBe(1);
    const next = await api(t, token).post('/v1/pets', { name: 'Folt', mode: 'alap' });
    expect(next.status).toBe(201);
    expect(next.body.pet.familyName).toBe('Pötty');
  });

  it('vészleállítóval nincs halál', async () => {
    const { t, token } = await neglectedClassic();
    await t.kv.set(keys.flags, JSON.stringify({ deathEnabled: false }));
    t.clock.now += 3 * 24 * H;
    const st = await api(t, token).get('/v1/state');
    expect(st.body.pet.status).toBe('alive');
    expect(st.body.pet.critical).not.toBeNull();
  });
});

describe('Alap mód: Nagyi és hazahozás', () => {
  it('elhanyagolás után Nagyi, egy koppintással haza', async () => {
    const t = makeEnv();
    const { token } = await signUp(t);
    const { petId } = await hatchPet(t, token, 'alap');
    t.clock.now += 4 * 24 * H;
    const st = await api(t, token).get('/v1/state');
    expect(st.body.pet.status).toBe('nagyi');
    const early = await api(t, token).post(`/v1/pets/${petId}/retrieve`, { choice: 'stay' });
    expect(early.status).toBe(409);
    const home = await api(t, token).post(`/v1/pets/${petId}/retrieve`, { choice: 'home' });
    expect(home.status).toBe(200);
    expect(home.body.pet.status).toBe('alive');
    expect(home.body.pet.health).toBe(60);
  });
});

describe('vásárlás, próbaidő, promóció', () => {
  it('RevenueCat webhook: titok, jogosultság, idempotencia, visszavonás', async () => {
    const t = makeEnv();
    const { token, userId } = await signUp(t);
    const hook = (auth: string, event: object) =>
      request(t.app).post('/v1/webhooks/revenuecat').set('Authorization', auth).send({ event });
    expect((await hook('rossz', { type: 'TEST' })).status).toBe(401);
    const buy = { id: 'evt-1', type: 'NON_RENEWING_PURCHASE', app_user_id: userId, entitlement_ids: ['full', 'cosmetic_retro'] };
    expect((await hook('rc-titok', buy)).body).toEqual({ ok: true });
    expect((await hook('rc-titok', buy)).body.duplicate).toBe(true);
    let st = await api(t, token).get('/v1/state');
    expect(st.body.entitlements.full).toBe(true);
    expect(st.body.entitlements.cosmetics).toEqual(['cosmetic_retro']);
    await hook('Bearer rc-titok', { id: 'evt-2', type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT', app_user_id: userId, entitlement_ids: ['full'] });
    st = await api(t, token).get('/v1/state');
    expect(st.body.entitlements.full).toBe(false);
  });

  it('próbaidő userId-hoz kötve, ujjlenyomat csak jelzés', async () => {
    const t = makeEnv();
    const a = await signUp(t);
    const b = await signUp(t);
    const r1 = await api(t, a.token).post('/v1/trial', { deviceFingerprint: 'eszkoz-1' });
    expect(r1.body.active).toBe(true);
    t.clock.now += 3 * H;
    const r2 = await api(t, a.token).post('/v1/trial', {});
    expect(r2.body.startedAt).toBe(r1.body.startedAt);
    const r3 = await api(t, b.token).post('/v1/trial', { deviceFingerprint: 'eszkoz-1' });
    expect(r3.body.active).toBe(true);
    expect(await t.kv.get(keys.trialFp((await import('node:crypto')).createHash('sha256').update('eszkoz-1').digest('hex').slice(0, 32)))).toBe(a.userId);
  });

  it('promókód egyszer váltható be; statisztika admin-kulccsal', async () => {
    const t = makeEnv();
    const a = await signUp(t);
    const b = await signUp(t);
    expect((await api(t, a.token).post('/v1/promo', { code: 'beta26' })).body).toEqual({ ok: true, perk: 'beta' });
    expect((await api(t, b.token).post('/v1/promo', { code: 'BETA26' })).body).toEqual({ ok: false, reason: 'used' });
    expect((await api(t, b.token).post('/v1/promo', { code: 'NINCS' })).body).toEqual({ ok: false, reason: 'invalid' });
    expect((await request(t.app).get('/v1/promo/stats?key=rossz')).status).toBe(403);
    const stats = await request(t.app).get('/v1/promo/stats?key=stat-kulcs');
    expect(stats.body.redeemed).toBe(1);
  });
});

describe('adatok: export és törlés', () => {
  it('export, majd alkalmazáson belüli törlés minden kulccsal', async () => {
    const t = makeEnv();
    const { token, userId } = await signUp(t);
    await hatchPet(t, token, 'klasszikus');
    await api(t, token).post('/v1/push/tokens', { token: 'ExponentPushToken[abc123]' });
    const exp = await api(t, token).get('/v1/account/export');
    expect(exp.body.pets).toHaveLength(1);
    expect(exp.body.profile.installHash).toBeUndefined();
    const del = await api(t, token).del('/v1/account');
    expect(del.body.deleted).toBe(true);
    expect(t.revenueCatDeleted).toEqual([userId]);
    const leftovers = t.kv.keys().filter((k) => k.includes(userId) && !k.startsWith('rl:'));
    expect(leftovers).toEqual([]);
    expect((await api(t, token).get('/v1/state')).status).toBe(401);
  });

  it('webes törlés törlési kóddal (Google Play)', async () => {
    const t = makeEnv();
    const { token } = await signUp(t);
    const code = (await api(t, token).get('/v1/account/deletion-code')).body.code as string;
    expect(code).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
    expect((await request(t.app).get('/delete-account')).text).toContain('Törlési kód');
    const wrong = await request(t.app).post('/delete-account').type('form').send({ code: 'XXXXX-XXXXX' });
    expect(wrong.status).toBe(404);
    const ok = await request(t.app).post('/delete-account').type('form').send({ code: code.toLowerCase() });
    expect(ok.status).toBe(200);
    expect((await api(t, token).get('/v1/state')).status).toBe(401);
  });
});

describe('üzemeltetés', () => {
  it('health és config', async () => {
    const t = makeEnv();
    expect((await request(t.app).get('/v1/health')).body.ok).toBe(true);
    const cfg = await request(t.app).get('/v1/config');
    expect(cfg.body.paramsVersion).toBe(1);
    expect(cfg.body.flags.deathEnabled).toBe(true);
    expect((await request(t.app).get('/nincs-ilyen')).status).toBe(404);
  });

  it('kérés-korlátozás felhasználónként', async () => {
    const t = makeEnv({ RL_PER_USER_PER_MIN: '3' });
    const { token } = await signUp(t);
    const a = api(t, token);
    for (let i = 0; i < 3; i++) expect((await a.get('/v1/state')).status).toBe(200);
    expect((await a.get('/v1/state')).status).toBe(429);
  });
});
