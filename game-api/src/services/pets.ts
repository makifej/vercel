// Kedvenc-szinkron (PRD 13.4): a szerver szerveridővel lépteti az állapotot,
// optimista zárolással ment, majd frissíti a push-tartalékot és az emlékkertet.

import {
  advance,
  forecast,
  memorialFromPet,
  minigameSeed,
  nextAttention,
  type MemorialCause,
  type PetState,
  type SimContext,
  type SimEvent,
} from '../sim';
import type { Deps } from '../http';
import { HttpError } from '../http';
import { iso, zoneLocalTime } from '../time';
import {
  getFlags,
  getIncidents,
  getMemorial,
  getPet,
  keys,
  saveMemorial,
  savePet,
  type PetRecord,
  type Profile,
} from '../store';

const FORECAST_MS = 48 * 3_600_000;

export async function simContextFor(deps: Deps, profile: Profile): Promise<SimContext> {
  const [flags, incidents] = await Promise.all([getFlags(deps.kv), getIncidents(deps.kv)]);
  return { local: zoneLocalTime(profile.tz), holdDeath: !flags.deathEnabled, frozen: incidents };
}

export interface SyncResult {
  record: PetRecord;
  rev: number;
  events: SimEvent[];
}

export async function loadOwnedPet(deps: Deps, profile: Profile, petId: string) {
  const loaded = await getPet(deps.kv, petId);
  if (!loaded || loaded.record.userId !== profile.userId) throw new HttpError(404, { error: 'pet_not_found' });
  return loaded;
}

/**
 * Léptetés szerveridőre, majd opcionális módosítás és mentés. Ha `expectedRev`
 * meg van adva és eltér, 409; párhuzamos írásnál a CAS szintén 409-et ad.
 */
export async function mutatePet(
  deps: Deps,
  profile: Profile,
  petId: string,
  ctx: SimContext,
  expectedRev: number | null,
  change: (state: PetState, now: number, events: SimEvent[]) => PetState = (s) => s,
): Promise<SyncResult> {
  const loaded = await loadOwnedPet(deps, profile, petId);
  if (expectedRev !== null && expectedRev !== loaded.rev) {
    throw new HttpError(409, { error: 'version_conflict', currentVersion: loaded.rev });
  }
  const now = deps.now();
  const advanced = advance(loaded.record.state, ctx, now);
  const events = [...advanced.events];
  const state = change(advanced.state, now, events);
  const record: PetRecord = { ...loaded.record, state, syncedAt: now };
  const saved = await savePet(deps.kv, petId, record, loaded.rev);
  if (!saved) {
    const current = await getPet(deps.kv, petId);
    throw new HttpError(409, { error: 'version_conflict', currentVersion: current?.rev ?? loaded.rev });
  }
  await afterSave(deps, petId, state, events, ctx, now);
  return { record, rev: loaded.rev + 1, events };
}

/** Olvasáskori léptetés: ütközésnél nem hibázik, a kiszámolt állapotot adja vissza. */
export async function syncPet(deps: Deps, profile: Profile, petId: string, ctx: SimContext): Promise<SyncResult> {
  try {
    return await mutatePet(deps, profile, petId, ctx, null);
  } catch (e) {
    if (!(e instanceof HttpError) || e.status !== 409) throw e;
    const loaded = await loadOwnedPet(deps, profile, petId);
    const advanced = advance(loaded.record.state, ctx, deps.now());
    return { record: { ...loaded.record, state: advanced.state }, rev: loaded.rev, events: advanced.events };
  }
}

async function afterSave(deps: Deps, petId: string, state: PetState, events: SimEvent[], ctx: SimContext, now: number) {
  await refreshDuePush(deps, petId, state, ctx, now);
  const died = events.find((e) => e.type === 'died');
  if (died && state.deathCause && !(await getMemorial(deps.kv, petId))) {
    await saveMemorial(deps.kv, memorialFromPet(state, state.diedAt ?? died.t, state.deathCause));
  }
}

export async function writeMemorial(deps: Deps, state: PetState, cause: MemorialCause, endedAt: number) {
  if (!(await getMemorial(deps.kv, state.id))) await saveMemorial(deps.kv, memorialFromPet(state, endedAt, cause));
}

/**
 * Szerverpush tartalék (PRD 13.8, FR-22): csak a Klasszikus Kritikus kezdete és a
 * szabadság lejárata előtti nap. A tag kódolja a számítás idejét; minden szinkron
 * lecseréli a kedvenc tagjait, így a régi előrejelzés nem kerül kiküldésre.
 */
export async function refreshDuePush(deps: Deps, petId: string, state: PetState, ctx: SimContext, now: number) {
  const { kv } = deps;
  const old = await kv.smembers(keys.petDue(petId));
  if (old.length) {
    await kv.zrem(keys.duePush, old);
    await kv.del([keys.petDue(petId)]);
  }
  const entries: { score: number; member: string }[] = [];
  if (state.status === 'alive' && state.mode === 'klasszikus' && !state.critical) {
    const ev = forecast(state, ctx, now, FORECAST_MS).find((e) => e.type === 'critical');
    if (ev) entries.push({ score: ev.t, member: `${petId}|critical|${ev.t}|${now}` });
  }
  if (state.vacation) {
    const at = state.vacation.end - 24 * 3_600_000;
    if (at > now) entries.push({ score: at, member: `${petId}|vacation|${at}|${now}` });
  }
  if (entries.length) {
    await kv.zadd(keys.duePush, entries);
    await kv.sadd(keys.petDue(petId), entries.map((e) => e.member));
  }
}

const FORECAST_TYPES: SimEvent['type'][] = [
  'call',
  'sick',
  'critical',
  'criticalWarn',
  'nagyi',
  'died',
  'fellAsleep',
  'woke',
  'evolved',
  'senior',
  'farewell',
  'vacationEnd',
];

export function petView(deps: Deps, ctx: SimContext, result: SyncResult) {
  const { state } = result.record;
  const now = deps.now();
  const upcoming = state.status === 'alive' || state.status === 'egg' ? forecast(state, ctx, now, FORECAST_MS) : [];
  const next = nextAttention(state, ctx, now);
  return {
    version: result.rev,
    pet: state,
    minigameSeed: minigameSeed(deps.config.minigameSalt, state.id, result.rev),
    nextAttentionAt: next !== null ? iso(next) : null,
    forecast: upcoming
      .filter((e) => FORECAST_TYPES.includes(e.type) && !(e.type === 'call' && e.call === 'misbehave'))
      .slice(0, 30)
      .map((e) => ({ type: e.type, at: iso(e.t), call: e.call, stage: e.stage, form: e.form, remainingMin: e.remainingMin })),
    events: result.events.map((e) => ({ ...e, at: iso(e.t) })),
  };
}
