// Gondozási műveletek (PRD 7.5) és a távollét eszközei (PRD 8). Minden
// művelet előbb a művelet időpontjáig lépteti az állapotot, így a sorrend
// és az időbélyeg egyértelmű.

import {
  addMistake,
  advanceInPlace,
  cloneState,
  ceilMin,
  cure,
  floorMin,
  rescue,
  rescueReady,
  shortenStage,
} from './engine';
import {
  ACTION,
  DAY_MIN,
  HOUR_MIN,
  MAX_NAGYI_ADJ_DAYS,
  MIN,
  MODE,
  NAGYI_RETURN,
  SCHEDULE_CHANGE_COOLDOWN_MIN,
  SCHEDULE_MAX_SLEEP_MIN,
  SCHEDULE_MIN_SLEEP_MIN,
  VACATION_MIN_CHARGE_MIN,
  VACATION_ROLLING_DAYS,
} from './params';
import { windowLength } from './clock';
import type { Interval, PetState, Schedule, SimContext, SimEvent } from './types';

export type CareAction =
  | { type: 'feed' }
  | { type: 'snack' }
  | { type: 'play'; won: boolean }
  | { type: 'pet' }
  | { type: 'clean' }
  | { type: 'medicine' }
  | { type: 'scold' }
  | { type: 'lights' };

export type RejectReason =
  | 'notAlive'
  | 'asleep'
  | 'awake'
  | 'full'
  | 'tired'
  | 'sick'
  | 'notSick'
  | 'tooSoon'
  | 'petLimit'
  | 'nothingToClean'
  | 'vacation';

export interface ActionResult {
  state: PetState;
  events: SimEvent[];
  rejected: RejectReason | null;
}

/** A játékos jelen van: új „távollét” kezdődik a gondozási hiba plafonjához (PRD 7.6). */
export function markPresence(s: PetState): PetState {
  if (s.absenceMistakes === 0) return s;
  return { ...s, absenceMistakes: 0 };
}

export function applyAction(p: PetState, ctx: SimContext, action: CareAction, now: number): ActionResult {
  const s = cloneState(p);
  const events: SimEvent[] = [];
  advanceInPlace(s, ctx, now, events);
  s.absenceMistakes = 0;
  const t = floorMin(now);
  const reject = (reason: RejectReason): ActionResult => ({ state: s, events, rejected: reason });

  if (s.status !== 'alive') return reject('notAlive');
  if (s.vacation && t >= s.vacation.start && t < s.vacation.end) return reject('vacation');
  const mp = MODE[s.mode];

  switch (action.type) {
    case 'feed':
      if (s.asleep) return reject('asleep');
      // Percrácson a 100 csak etetés után áll fenn pontosan; fél pont tűréssel.
      if (s.hunger >= 99.5) return reject('full');
      s.hunger = Math.min(100, s.hunger + ACTION.feed);
      s.weight += 1;
      break;
    case 'snack': {
      if (s.asleep) return reject('asleep');
      const reduced = s.snacksToday >= ACTION.snackReducedFrom - 1;
      s.snacksToday++;
      s.happiness = Math.min(100, s.happiness + happinessGain(s, reduced ? ACTION.snackReduced : ACTION.snack));
      s.weight += reduced ? 3 : 2;
      break;
    }
    case 'play':
      if (s.asleep) return reject('asleep');
      if (s.sick) return reject('sick');
      if (s.energy < ACTION.minPlayEnergy || s.napMin > 0) return reject('tired');
      s.happiness = Math.min(
        100,
        s.happiness +
          happinessGain(s, action.won ? ACTION.playWin + (s.trait === 'jatekos' ? 5 : 0) : ACTION.playLose),
      );
      s.weight = Math.max(1, s.weight - 1);
      s.energy = Math.max(0, s.energy - ACTION.playEnergyCost);
      if (action.won) {
        s.totalWins++;
        if (s.stage === 'teen') s.teenWins++;
      }
      break;
    case 'pet': {
      if (s.asleep) return reject('asleep');
      const recent = s.petTimes.filter((x) => t - x < HOUR_MIN * MIN);
      if (recent.length >= ACTION.petPerHour) return reject('petLimit');
      s.petTimes = [...recent, t];
      s.happiness = Math.min(100, s.happiness + happinessGain(s, ACTION.pet + (s.trait === 'bujos' ? 5 : 0)));
      break;
    }
    case 'clean':
      if (s.poops.length === 0) return reject('nothingToClean');
      s.poops = [];
      break;
    case 'medicine': {
      if (!s.sick) return reject('notSick');
      if (s.sick.lastDoseMs !== null && t - s.sick.lastDoseMs < ACTION.medicineGap) return reject('tooSoon');
      s.sick.doses++;
      s.sick.lastDoseMs = t;
      if (s.sick.doses >= mp.dosesNeeded) cure(s, t, events);
      break;
    }
    case 'scold': {
      const idx = s.calls.findIndex((c) => c.type === 'misbehave');
      if (idx >= 0) {
        s.calls.splice(idx, 1);
        s.discipline = Math.min(100, s.discipline + ACTION.scoldGain);
        events.push({ t, type: 'callClosed', call: 'misbehave' });
      } else {
        s.happiness = Math.max(0, s.happiness - ACTION.scoldPenalty);
      }
      break;
    }
    case 'lights':
      if (!s.asleep) return reject('awake');
      s.lightsOff = !s.lightsOff;
      break;
  }

  closeSatisfiedCalls(s, t, events);
  if (s.critical && rescueReady(s)) rescue(s, t, events);
  return { state: s, events, rejected: null };
}

function happinessGain(s: PetState, gain: number): number {
  // Lábadozás alatt a boldogságnövelő műveletek hatása felére csökken (PRD 7.8).
  return s.convalescenceMin > 0 ? gain / 2 : gain;
}

function closeSatisfiedCalls(s: PetState, t: number, events: SimEvent[]): void {
  s.calls = s.calls.filter((c) => {
    const satisfied = (c.type === 'hunger' && s.hunger > 0) || (c.type === 'happiness' && s.happiness > 0);
    if (satisfied) events.push({ t, type: 'callClosed', call: c.type });
    return !satisfied;
  });
}

/** Nagyi: ingyenes, egykoppintásos hazahozás (PRD 8.3). */
export function bringHomeFromNagyi(p: PetState, now: number): { state: PetState; events: SimEvent[] } {
  if (p.status !== 'nagyi') return { state: p, events: [] };
  const s = cloneState(p);
  const t = floorMin(now);
  const events: SimEvent[] = [];
  s.status = 'alive';
  s.nagyiSince = null;
  s.lastMs = t;
  s.hunger = NAGYI_RETURN.hunger;
  s.happiness = NAGYI_RETURN.happiness;
  s.health = NAGYI_RETURN.health;
  s.poops = [];
  s.sick = null;
  s.critical = null;
  s.calls = [];
  s.nagyiVisits++;
  for (let i = 0; i < NAGYI_RETURN.mistakes; i++) addMistake(s, 'nagyi', t, events, true);
  if ((s.stage === 'adult' || s.stage === 'senior') && s.nagyiAdjDays < MAX_NAGYI_ADJ_DAYS) {
    s.nagyiAdjDays++;
    shortenStage(s, 1);
  }
  return { state: s, events };
}

/** Klasszikusból Alapba bármikor, Kritikus állapotban is, egyirányúan (FR-13). */
export function downgradeToAlap(p: PetState): PetState {
  if (p.mode === 'alap') return p;
  return { ...cloneState(p), mode: 'alap', downgraded: true };
}

export type ScheduleError = 'cooldown' | 'tooShort' | 'tooLong';

/** Napirend-módosítás: 24 óránként egyszer, a következő ébredéstől érvényes (PRD 7.9). */
export function requestScheduleChange(
  p: PetState,
  schedule: Schedule,
  now: number,
): { state: PetState; error: ScheduleError | null } {
  const len = windowLength(schedule.wakeMin, schedule.bedMin);
  const sleepLen = DAY_MIN - len;
  if (sleepLen < SCHEDULE_MIN_SLEEP_MIN) return { state: p, error: 'tooShort' };
  if (sleepLen > SCHEDULE_MAX_SLEEP_MIN) return { state: p, error: 'tooLong' };
  if (p.scheduleChangedAt !== null && now - p.scheduleChangedAt < SCHEDULE_CHANGE_COOLDOWN_MIN * MIN) {
    return { state: p, error: 'cooldown' };
  }
  const s = cloneState(p);
  if (s.status === 'egg' || s.stage === 'baby') {
    // Keltetés előtt és a bébi szakaszban a napirend azonnal érvényes.
    s.schedule = { ...schedule };
  } else {
    s.pendingSchedule = { ...schedule };
  }
  s.scheduleChangedAt = now;
  return { state: s, error: null };
}

export type VacationError = 'tooLong' | 'budget' | 'notAllowed' | 'invalid' | 'notAlive';

export function vacationBudgetUsedDays(history: Interval[], now: number): number {
  const from = now - VACATION_ROLLING_DAYS * DAY_MIN * MIN;
  let used = 0;
  for (const v of history) {
    if (v.end <= from) continue;
    const charged = Math.max(v.end - v.start, VACATION_MIN_CHARGE_MIN * MIN);
    used += charged;
  }
  return used / (DAY_MIN * MIN);
}

/** Szabadság mód: teljes fagyasztás, módonkénti korlátokkal (PRD 8.1). */
export function startVacation(
  p: PetState,
  ctx: SimContext,
  history: Interval[],
  start: number,
  end: number,
  now: number,
): { state: PetState; error: VacationError | null } {
  if (p.status !== 'alive' && p.status !== 'egg') return { state: p, error: 'notAlive' };
  const s0 = ceilMin(Math.max(start, now));
  const e0 = ceilMin(end);
  if (e0 <= s0 || s0 > now + 30 * DAY_MIN * MIN) return { state: p, error: 'invalid' };
  const mp = MODE[p.mode];
  if (e0 - s0 > mp.vacationMaxDays * DAY_MIN * MIN) return { state: p, error: 'tooLong' };
  const requested = Math.max(e0 - s0, VACATION_MIN_CHARGE_MIN * MIN) / (DAY_MIN * MIN);
  if (vacationBudgetUsedDays(history, now) + requested > mp.vacationBudgetDays + 1e-9) {
    return { state: p, error: 'budget' };
  }
  const { state } = advanceTo(p, ctx, now);
  if (
    state.mode === 'klasszikus' &&
    (state.sick !== null || state.critical !== null || state.hunger <= 0 || state.happiness <= 0)
  ) {
    return { state: p, error: 'notAllowed' };
  }
  state.vacation = { start: s0, end: e0 };
  return { state, error: null };
}

/** Kézi befejezés bármikor; a leghosszabb idő 12 órás minimummal számít a keretbe. */
export function endVacation(p: PetState, ctx: SimContext, now: number): { state: PetState; finished: Interval | null } {
  if (!p.vacation) return { state: p, finished: null };
  const { state } = advanceTo(p, ctx, now);
  const t = floorMin(now);
  if (!state.vacation) return { state, finished: null };
  const { start, end } = state.vacation;
  state.vacation = null;
  // Még el nem kezdődött szabadság lemondása nem terheli a keretet.
  if (t < start) return { state, finished: null };
  return { state, finished: { start, end: Math.min(t, end) } };
}

function advanceTo(p: PetState, ctx: SimContext, now: number): { state: PetState } {
  const s = cloneState(p);
  advanceInPlace(s, ctx, now, []);
  return { state: s };
}
