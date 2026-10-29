// Játékvégpontok (PRD 13.7). Minden mutáció szerveridővel bélyegez, a kedvenc
// állapotát előbb a szerveridőre lépteti, és optimista zárolással ment.

import { Router } from 'express';
import { z } from 'zod';
import {
  applyAction,
  bringHomeFromNagyi,
  createSuccessorEgg,
  DAY_MIN,
  daysAtNagyi,
  downgradeToAlap,
  endVacation,
  MODE,
  NAGYI_STAY_OPTION_DAYS,
  PARAMS_VERSION,
  requestScheduleChange,
  SCHEDULE_CHANGE_COOLDOWN_MIN,
  SCHEDULE_MAX_SLEEP_MIN,
  SCHEDULE_MIN_SLEEP_MIN,
  scoreMinigame,
  minigameSeed,
  startVacation,
  vacationBudgetUsedDays,
  warmEgg,
  windowLength,
  type CareAction,
  type PetState,
  type RejectReason,
} from '../sim';
import { newId } from '../auth';
import { HttpError, locals, parseBody, requireAuth, type Deps } from '../http';
import { ensureTrial, entitlementView, getEntitlements, hasPremium } from '../services/entitlements';
import { mutatePet, petView, simContextFor, syncPet, writeMemorial, loadOwnedPet } from '../services/pets';
import { getFlags, getMemorial, getPet, keys, saveMemorial, saveProfile, savePet, type Profile } from '../store';
import { isValidTimeZone, iso, parseHhMm } from '../time';

const CARE_TYPES = ['warm', 'feed', 'snack', 'pet', 'clean', 'medicine', 'scold', 'lights'] as const;

const ActionsBody = z.object({
  expectedVersion: z.number().int().nonnegative(),
  actions: z
    .array(z.object({ id: z.string().min(1).max(64), type: z.enum(CARE_TYPES) }))
    .min(1)
    .max(10),
});

const MinigameBody = z.object({
  expectedVersion: z.number().int().nonnegative(),
  game: z.enum(['merre', 'nagyobb']),
  guesses: z.array(z.string()).length(5),
});

const NewPetBody = z.object({
  name: z.string().trim().min(1).max(12),
  mode: z.enum(['alap', 'klasszikus']).default('alap'),
});

const RetrieveBody = z.object({ choice: z.enum(['home', 'stay']) });

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const ScheduleBody = z.object({
  tz: z.string().max(64).optional(),
  sleep: z.object({ start: hhmm, end: hhmm }).optional(),
  napkozi: z
    .array(z.object({ days: z.array(z.number().int().min(0).max(6)).max(7), start: hhmm, end: hhmm }))
    .max(1)
    .optional(),
  autoLights: z.boolean().optional(),
});

const NotifyBody = z.object({
  overrides: z.record(z.enum(['osszesito', 'gondozas', 'egeszseg', 'alvas', 'kritikus', 'eletut', 'szabadsag']), z.boolean()).optional(),
  digestTimes: z.array(hhmm).max(3).optional(),
});

const VacationBody = z.object({
  petId: z.string().optional(),
  start: z.union([z.literal('now'), z.string().datetime({ offset: true })]),
  end: z.string().datetime({ offset: true }),
});

const MemorialBody = z.object({ epitaph: z.string().max(140).optional(), flower: z.boolean().optional() });

const VACATION_ERRORS: Record<string, string> = {
  tooLong: 'vacation_too_long',
  budget: 'vacation_budget_exceeded',
  notAllowed: 'klasszikus_pet_not_eligible',
  invalid: 'vacation_invalid',
  notAlive: 'pet_not_alive',
};

function activePetId(profile: Profile): string {
  if (!profile.activePetId) throw new HttpError(404, { error: 'no_active_pet' });
  return profile.activePetId;
}

/** Az aktív kedvenc folyamatban lévő vagy ütemezett szabadságának azonosítója. */
function activeVacationId(profile: Profile, state: PetState): string | null {
  if (!state.vacation) return null;
  const v = profile.vacations.find((x) => x.petId === state.id && x.start === state.vacation!.start);
  return v?.id ?? null;
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function gameRoutes(deps: Deps): Router {
  const r = Router();
  const auth = requireAuth(deps);

  r.get('/v1/config', async (_req, res) => {
    const flags = await getFlags(deps.kv);
    res.json({
      paramsVersion: PARAMS_VERSION,
      flags: { deathEnabled: flags.deathEnabled },
      minAppVersion: flags.minAppVersion ?? deps.config.minAppVersion,
      serverNow: iso(deps.now()),
    });
  });

  r.get('/v1/state', auth, async (_req, res) => {
    const { profile } = locals(res);
    const now = deps.now();
    const ent = await getEntitlements(deps.kv, profile, now);
    if (!profile.activePetId) {
      res.json({ serverNow: iso(now), pet: null, entitlements: entitlementView(ent) });
      return;
    }
    const ctx = await simContextFor(deps, profile);
    const result = await syncPet(deps, profile, profile.activePetId, ctx);
    res.json({
      serverNow: iso(now),
      ...petView(deps, ctx, result),
      activeVacationId: activeVacationId(profile, result.record.state),
      entitlements: entitlementView(ent),
    });
  });

  r.post('/v1/pets', auth, async (req, res) => {
    const body = parseBody(NewPetBody, req.body);
    const { profile } = locals(res);
    const now = deps.now();
    let parent: PetState | null = null;
    if (profile.activePetId) {
      const ctx = await simContextFor(deps, profile);
      const current = await syncPet(deps, profile, profile.activePetId, ctx);
      const st = current.record.state;
      if (st.status !== 'dead') throw new HttpError(409, { error: 'active_pet_exists', status: st.status });
      parent = st;
    }
    // A próbaidő az első tojással indul (PRD 10.4).
    await ensureTrial(deps.kv, profile.userId, now);
    const ent = await getEntitlements(deps.kv, profile, now);
    if (body.mode === 'klasszikus' && !hasPremium(ent)) throw new HttpError(403, { error: 'entitlement_required', feature: 'klasszikus' });

    const petId = newId('p');
    const egg = createSuccessorEgg({
      parent,
      id: petId,
      name: body.name,
      mode: body.mode,
      now,
      seed: Math.floor(Math.random() * 0x7fffffff),
      inheritance: hasPremium(ent),
    });
    egg.schedule = { ...profile.schedule };
    egg.daycare = { ...profile.daycare, days: [...profile.daycare.days] };
    egg.autoLights = profile.autoLights;
    const ok = await savePet(deps.kv, petId, { userId: profile.userId, state: egg, syncedAt: now }, 0);
    if (!ok) throw new HttpError(409, { error: 'version_conflict', currentVersion: 1 });
    await deps.kv.rpush(keys.userPets(profile.userId), petId);
    profile.activePetId = petId;
    await saveProfile(deps.kv, profile);
    const ctx = await simContextFor(deps, profile);
    res.status(201).json({
      serverNow: iso(now),
      ...petView(deps, ctx, { record: { userId: profile.userId, state: egg, syncedAt: now }, rev: 1, events: [] }),
      entitlements: entitlementView(ent),
    });
  });

  r.post('/v1/pets/:id/actions', auth, async (req, res) => {
    const body = parseBody(ActionsBody, req.body);
    const { profile } = locals(res);
    const petId = String(req.params.id);
    const ctx = await simContextFor(deps, profile);
    // Idempotencia: a már feldolgozott műveletazonosítókat kihagyjuk (PRD 13.6, 48 óra).
    const seen = await deps.kv.mget(body.actions.map((a) => keys.action(petId, a.id)));
    const rejected: { id: string; reason: RejectReason | 'duplicate' }[] = [];
    const applied: string[] = [];
    const result = await mutatePet(deps, profile, petId, ctx, body.expectedVersion, (state, now, events) => {
      let s = state;
      body.actions.forEach((a, i) => {
        if (seen[i]) {
          rejected.push({ id: a.id, reason: 'duplicate' });
          return;
        }
        if (a.type === 'warm') {
          if (s.status !== 'egg' || s.eggWarmMin !== null) rejected.push({ id: a.id, reason: 'notAlive' });
          else {
            s = warmEgg(s, now);
            applied.push(a.id);
          }
          return;
        }
        const r = applyAction(s, ctx, { type: a.type } as CareAction, now);
        events.push(...r.events);
        if (r.rejected) rejected.push({ id: a.id, reason: r.rejected });
        else applied.push(a.id);
        s = r.state;
      });
      return s;
    });
    await Promise.all(applied.map((id) => deps.kv.set(keys.action(petId, id), '1', { nx: true, exSeconds: 48 * 3600 })));
    const ent = await getEntitlements(deps.kv, profile, deps.now());
    res.json({ serverNow: iso(deps.now()), ...petView(deps, ctx, result), rejected, entitlements: entitlementView(ent) });
  });

  r.post('/v1/pets/:id/minigame', auth, async (req, res) => {
    const body = parseBody(MinigameBody, req.body);
    const { profile } = locals(res);
    const petId = String(req.params.id);
    const now = deps.now();
    if (body.game === 'nagyobb' && !hasPremium(await getEntitlements(deps.kv, profile, now))) {
      throw new HttpError(403, { error: 'entitlement_required', feature: 'nagyobb' });
    }
    // A seed az aktuális verzióhoz tartozik; a kliens a legutóbbi válaszból ismeri.
    const score = scoreMinigame(body.game, minigameSeed(deps.config.minigameSalt, petId, body.expectedVersion), body.guesses);
    if (!score) throw new HttpError(422, { error: 'invalid_guesses' });
    const ctx = await simContextFor(deps, profile);
    let rejected: RejectReason | null = null;
    const result = await mutatePet(deps, profile, petId, ctx, body.expectedVersion, (state, t, events) => {
      const r = applyAction(state, ctx, { type: 'play', won: score.won }, t);
      events.push(...r.events);
      rejected = r.rejected;
      return r.state;
    });
    res.json({ serverNow: iso(deps.now()), score, rejected, ...petView(deps, ctx, result) });
  });

  r.post('/v1/pets/:id/downgrade', auth, async (req, res) => {
    const { profile } = locals(res);
    const ctx = await simContextFor(deps, profile);
    const result = await mutatePet(deps, profile, String(req.params.id), ctx, null, (s) => downgradeToAlap(s));
    res.json({ serverNow: iso(deps.now()), ...petView(deps, ctx, result) });
  });

  r.post('/v1/pets/:id/retrieve', auth, async (req, res) => {
    const body = parseBody(RetrieveBody, req.body);
    const { profile } = locals(res);
    const petId = String(req.params.id);
    const ctx = await simContextFor(deps, profile);
    const current = await loadOwnedPet(deps, profile, petId);
    if (current.record.state.status !== 'nagyi') throw new HttpError(409, { error: 'not_at_nagyi' });
    const now = deps.now();
    if (body.choice === 'stay') {
      if (daysAtNagyi(current.record.state, now) < NAGYI_STAY_OPTION_DAYS) {
        throw new HttpError(409, { error: 'stay_not_yet_available', afterDays: NAGYI_STAY_OPTION_DAYS });
      }
      await writeMemorial(deps, current.record.state, 'nagyinal', now);
      // A kedvenc Nagyinál marad: az élete lezárul (halál nélkül), így új tojás
      // indulhat ugyanabban a családfában, új ágon (PRD 8.3).
      const result = await mutatePet(deps, profile, petId, ctx, current.rev, (s, t) => ({
        ...s,
        status: 'dead',
        diedAt: t,
        deathCause: null,
      }));
      res.json({ serverNow: iso(deps.now()), ...petView(deps, ctx, result), memorial: await getMemorial(deps.kv, petId) });
      return;
    }
    const result = await mutatePet(deps, profile, petId, ctx, current.rev, (s, t, events) => {
      const r = bringHomeFromNagyi(s, t);
      events.push(...r.events);
      return r.state;
    });
    res.json({ serverNow: iso(deps.now()), ...petView(deps, ctx, result) });
  });

  r.put('/v1/settings/schedule', auth, async (req, res) => {
    const body = parseBody(ScheduleBody, req.body);
    const { profile } = locals(res);
    const now = deps.now();
    if (body.tz !== undefined) {
      if (!isValidTimeZone(body.tz)) throw new HttpError(422, { error: 'invalid_tz' });
      profile.tz = body.tz;
    }
    const pet = profile.activePetId ? await getPet(deps.kv, profile.activePetId) : null;
    const mode = pet?.record.state.mode ?? 'alap';

    let schedule = profile.schedule;
    if (body.sleep) {
      schedule = { bedMin: parseHhMm(body.sleep.start)!, wakeMin: parseHhMm(body.sleep.end)! };
      const sleepLen = DAY_MIN - windowLength(schedule.wakeMin, schedule.bedMin);
      if (sleepLen < SCHEDULE_MIN_SLEEP_MIN || sleepLen > SCHEDULE_MAX_SLEEP_MIN) {
        throw new HttpError(422, { error: 'sleep_window_invalid', minHours: 7, maxHours: 11 });
      }
    }
    let daycare = profile.daycare;
    if (body.napkozi) {
      const w = body.napkozi[0];
      if (!w) daycare = { ...daycare, enabled: false };
      else {
        const start = parseHhMm(w.start)!;
        const end = parseHhMm(w.end)!;
        const maxMin = MODE[mode].daycareMaxMin;
        if (windowLength(start, end) > maxMin) throw new HttpError(422, { error: 'napkozi_limit', maxHours: maxMin / 60 });
        const days = [0, 1, 2, 3, 4, 5, 6].map((d) => w.days.includes(d));
        daycare = { enabled: true, startMin: start, endMin: end, days };
      }
    }

    let effectiveFrom: string | null = null;
    let nextChangeAllowedAt: string | null = null;
    if (pet && profile.activePetId) {
      const ctx = await simContextFor(deps, profile);
      const ps = pet.record.state;
      const target = ps.pendingSchedule ?? ps.schedule;
      const changedSleep = Boolean(body.sleep) && (schedule.bedMin !== target.bedMin || schedule.wakeMin !== target.wakeMin);
      const cooldownMs = SCHEDULE_CHANGE_COOLDOWN_MIN * 60_000;
      // Napirend 24 óránként egyszer (PRD 7.9); ütközésnél semmit nem módosítunk.
      if (changedSleep && ps.scheduleChangedAt !== null && now - ps.scheduleChangedAt < cooldownMs) {
        throw new HttpError(409, { error: 'cooldown', nextChangeAllowedAt: iso(ps.scheduleChangedAt + cooldownMs) });
      }
      const result = await mutatePet(deps, profile, profile.activePetId, ctx, null, (s, t) => {
        const next: PetState = { ...s, daycare, autoLights: body.autoLights ?? s.autoLights };
        return changedSleep ? requestScheduleChange(next, schedule, t).state : next;
      });
      const st = result.record.state;
      if (st.scheduleChangedAt !== null) nextChangeAllowedAt = iso(st.scheduleChangedAt + cooldownMs);
      if (changedSleep) {
        const wake = st.pendingSchedule ? nextLocalMinute(ctx.local, now, st.schedule.wakeMin) : now;
        effectiveFrom = iso(wake);
      }
    }
    profile.schedule = schedule;
    profile.daycare = daycare;
    if (body.autoLights !== undefined) profile.autoLights = body.autoLights;
    await saveProfile(deps.kv, profile);
    res.json({ effectiveFrom, nextChangeAllowedAt, schedule, daycare, autoLights: profile.autoLights, tz: profile.tz });
  });

  r.put('/v1/settings/notifications', auth, async (req, res) => {
    const body = parseBody(NotifyBody, req.body);
    const { profile } = locals(res);
    if (body.overrides) profile.notify.overrides = { ...profile.notify.overrides, ...body.overrides };
    if (body.digestTimes) profile.notify.digestTimes = body.digestTimes.map((t) => parseHhMm(t)!);
    await saveProfile(deps.kv, profile);
    res.json({ notify: profile.notify });
  });

  r.post('/v1/vacations', auth, async (req, res) => {
    const body = parseBody(VacationBody, req.body);
    const { profile } = locals(res);
    const petId = body.petId ?? activePetId(profile);
    const now = deps.now();
    const start = body.start === 'now' ? now : Date.parse(body.start);
    const end = Date.parse(body.end);
    const ctx = await simContextFor(deps, profile);
    let error: string | null = null;
    const result = await mutatePet(deps, profile, petId, ctx, null, (s, t) => {
      const v = startVacation(s, ctx, profile.vacations, start, end, t);
      if (v.error) {
        error = v.error;
        return s;
      }
      return v.state;
    });
    if (error) {
      const st = result.record.state;
      throw new HttpError(422, {
        error: VACATION_ERRORS[error] ?? error,
        reason: st.sick ? 'sick' : st.critical ? 'critical' : st.hunger <= 0 || st.happiness <= 0 ? 'stat_zero' : undefined,
      });
    }
    const vac = result.record.state.vacation!;
    const entry = { id: newId('vac'), petId, start: vac.start, end: vac.end };
    profile.vacations = [...profile.vacations, entry];
    await saveProfile(deps.kv, profile);
    const mode = result.record.state.mode;
    res.json({
      serverNow: iso(deps.now()),
      activeVacationId: entry.id,
      vacation: { id: entry.id, start: iso(entry.start), end: iso(entry.end) },
      remainingDays90: Math.max(0, MODE[mode].vacationBudgetDays - vacationBudgetUsedDays(profile.vacations, now)),
      ...petView(deps, ctx, result),
    });
  });

  r.delete('/v1/vacations/:id', auth, async (req, res) => {
    const { profile } = locals(res);
    const entry = profile.vacations.find((v) => v.id === req.params.id);
    if (!entry) throw new HttpError(404, { error: 'vacation_not_found' });
    const ctx = await simContextFor(deps, profile);
    let finished: { start: number; end: number } | null = null;
    const result = await mutatePet(deps, profile, entry.petId, ctx, null, (s, t) => {
      const r = endVacation(s, ctx, t);
      finished = r.finished;
      return r.state;
    });
    const done = finished as { start: number; end: number } | null;
    profile.vacations = profile.vacations.flatMap((v) => (v.id !== entry.id ? [v] : done ? [{ ...v, ...done }] : []));
    await saveProfile(deps.kv, profile);
    res.json({ serverNow: iso(deps.now()), ended: true, activeVacationId: null, ...petView(deps, ctx, result) });
  });

  r.get('/v1/memorial', auth, async (_req, res) => {
    const { profile } = locals(res);
    const ids = await deps.kv.lrange(keys.userPets(profile.userId));
    const raw = await deps.kv.mget(ids.map((id) => keys.memorial(id)));
    const entries = raw.filter((x): x is string => x !== null).map((x) => JSON.parse(x));
    res.json({ entries: entries.reverse() });
  });

  r.put('/v1/memorial/:petId', auth, async (req, res) => {
    const body = parseBody(MemorialBody, req.body);
    const { profile } = locals(res);
    const petId = String(req.params.petId);
    const pet = await getPet(deps.kv, petId);
    if (!pet || pet.record.userId !== profile.userId) throw new HttpError(404, { error: 'not_found' });
    const entry = await getMemorial(deps.kv, petId);
    if (!entry) throw new HttpError(404, { error: 'not_found' });
    if (body.epitaph !== undefined) entry.epitaph = body.epitaph;
    if (body.flower) {
      const today = dayKey(deps.now());
      if (entry.lastFlowerDay !== today) {
        entry.flowers += 1;
        entry.lastFlowerDay = today;
      }
    }
    await saveMemorial(deps.kv, entry);
    res.json({ entry });
  });

  return r;
}

/** A következő időpont, amikor a helyi idő `minuteOfDay`; legfeljebb 48 órát keres. */
function nextLocalMinute(local: (ms: number) => { minuteOfDay: number }, from: number, minuteOfDay: number): number {
  const start = Math.ceil(from / 60_000) * 60_000;
  for (let t = start; t < start + 48 * 3_600_000; t += 60_000) {
    if (local(t).minuteOfDay === minuteOfDay) return t;
  }
  return start;
}
