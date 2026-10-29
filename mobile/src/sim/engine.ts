// Determinisztikus, percrácsos szimuláció (PRD 7. és 8.4). Nincs háttérben
// futó tick: az állapotot visszatéréskor egy lépésben léptetjük a mostani
// időpontig, és ugyanez a függvény adja az előrejelzést is.

import {
  isDaycareTime,
  isPetSleepTime,
  petAwakeMinutes,
  petSleepMinutes,
} from './clock';
import {
  ACTION,
  BABY_AWAKE_MIN,
  BABY_TOTAL_MIN,
  BASE_WEIGHT,
  CLASSIC_MISTAKES_PER_DAY_LOSS,
  CRITICAL_WARN_AT_REMAINING,
  DAY_MIN,
  DECAY,
  EGG_MIN,
  HEALTH,
  LEGENDA_MIN_TEEN_WINS,
  LIFESPAN,
  MAX_CLASSIC_ADJ_DAYS,
  MAX_POOPS,
  MIN,
  MIN_ADULT_DAYS,
  MODE,
  PARAMS_VERSION,
  POOP_EVERY_MIN,
  SCHEDULED,
  STAGE_MIN,
} from './params';
import { randomBetween } from './rng';
import type {
  AdultForm,
  CallType,
  Daycare,
  FormId,
  LocalTime,
  MistakeKind,
  Mode,
  PetState,
  Schedule,
  SicknessCause,
  SimContext,
  SimEvent,
  Stage,
  TraitId,
} from './types';

type LiveStage = Exclude<Stage, 'egg'>;
type Events = SimEvent[];

export const floorMin = (ms: number): number => Math.floor(ms / MIN) * MIN;
export const ceilMin = (ms: number): number => Math.ceil(ms / MIN) * MIN;

export function cloneState(s: PetState): PetState {
  return JSON.parse(JSON.stringify(s)) as PetState;
}

export interface NewEggInput {
  id: string;
  name: string;
  mode: Mode;
  now: number;
  schedule: Schedule;
  daycare: Daycare;
  autoLights: boolean;
  seed: number;
  generation?: number;
  familyName?: string;
  lineageClassic?: number;
  palette?: number;
  trait?: TraitId;
  discipline?: number;
}

export function createEgg(input: NewEggInput): PetState {
  return {
    v: 1,
    paramsVersion: PARAMS_VERSION,
    id: input.id,
    name: input.name,
    mode: input.mode,
    downgraded: false,
    status: 'egg',
    stage: 'egg',
    form: null,
    generation: input.generation ?? 1,
    familyName: input.familyName ?? input.name,
    lineageClassic: input.lineageClassic ?? 0,
    palette: input.palette ?? 0,
    trait: input.trait ?? 'bujos',
    createdAt: input.now,
    hatchedAt: null,
    eggWarmMin: null,
    lastMs: floorMin(input.now),
    lifeMin: 0,
    stageMin: 0,
    stageLenMin: EGG_MIN,
    stageCountedMin: 0,
    ageYears: 0,
    hunger: 50,
    happiness: 50,
    energy: 100,
    health: 100,
    discipline: input.discipline ?? 0,
    weight: BASE_WEIGHT.baby,
    poops: [],
    poopTimer: 0,
    weightTimer: 0,
    sick: null,
    immuneMin: 0,
    sicknessThisStage: 0,
    asleep: false,
    napMin: 0,
    lightsOff: false,
    lightsMin: 0,
    lightsMistake: false,
    inDaycare: false,
    calls: [],
    mistakes: { egg: 0, baby: 0, child: 0, teen: 0, adult: 0, senior: 0 },
    absenceMistakes: 0,
    critical: null,
    convalescenceMin: 0,
    scheduledSickness: [],
    scheduledMisbehave: [],
    sicknessCountdown: 0,
    snacksToday: 0,
    petTimes: [],
    teenWins: 0,
    totalWins: 0,
    nagyiAdjDays: 0,
    classicAdjDays: 0,
    nagyiVisits: 0,
    farewell: false,
    nagyiSince: null,
    vacation: null,
    schedule: { ...input.schedule },
    pendingSchedule: null,
    scheduleChangedAt: null,
    daycare: { ...input.daycare, days: [...input.daycare.days] },
    autoLights: input.autoLights,
    diedAt: null,
    deathCause: null,
    rng: input.seed | 0,
  };
}

/** A játékos elindítja a tojás melegítését; 5 perc múlva kel (PRD 7.3). */
export function warmEgg(p: PetState, now: number): PetState {
  if (p.status !== 'egg' || p.eggWarmMin !== null) return p;
  const s = cloneState(p);
  s.eggWarmMin = 0;
  s.lastMs = floorMin(now);
  return s;
}

export function advance(p: PetState, ctx: SimContext, toMs: number): { state: PetState; events: SimEvent[] } {
  const s = cloneState(p);
  const events: Events = [];
  advanceInPlace(s, ctx, toMs, events);
  return { state: s, events };
}

/**
 * Helyben léptet a `toMs` előtti utolsó egész percig. Visszafelé járó óra
 * esetén nem csinál semmit: az idő a szimulációban nem fordulhat vissza.
 */
export function advanceInPlace(s: PetState, ctx: SimContext, toMs: number, events: Events): void {
  const target = floorMin(toMs);
  while (s.lastMs < target) {
    if (isFrozen(s)) {
      s.lastMs = target;
      return;
    }
    const t0 = s.lastMs;
    if (s.vacation) {
      if (t0 >= s.vacation.end) {
        s.vacation = null;
        events.push({ t: t0, type: 'vacationEnd' });
        continue;
      }
      if (t0 >= s.vacation.start) {
        s.lastMs = Math.min(target, s.vacation.end);
        continue;
      }
    }
    stepMinute(s, ctx, t0, events);
    s.lastMs = t0 + MIN;
  }
}

export function isFrozen(s: PetState): boolean {
  return s.status === 'dead' || s.status === 'nagyi' || (s.status === 'egg' && s.eggWarmMin === null);
}

function stepMinute(s: PetState, ctx: SimContext, t0: number, ev: Events): void {
  const t = t0 + MIN;
  if (s.status === 'egg') {
    s.eggWarmMin = (s.eggWarmMin ?? 0) + 1;
    if (s.eggWarmMin >= EGG_MIN) hatch(s, t, ev);
    return;
  }
  s.lifeMin++;
  s.stageMin++;
  if (s.convalescenceMin > 0) s.convalescenceMin--;

  const local = ctx.local(t0);
  if (s.stage === 'baby') {
    babyMinute(s, local, t, ev);
    return;
  }

  const sleepTime = isPetSleepTime(local, s.schedule);
  if (sleepTime && !s.asleep) {
    fallAsleep(s, t, ev);
    if (s.status !== 'alive') return;
  } else if (!sleepTime && s.asleep) {
    wake(s, t, ev);
  }

  if (s.asleep) {
    sleepMinute(s, t, ev);
    return;
  }

  if (s.stageMin >= s.stageLenMin) {
    onStageEnd(s, t, ev);
    if (s.status !== 'alive') return;
  }
  awakeMinute(s, local, t, ev, false);
}

function babyMinute(s: PetState, local: LocalTime, t: number, ev: Events): void {
  if (s.stageMin > BABY_AWAKE_MIN) {
    if (!s.asleep) {
      s.asleep = true;
      ev.push({ t, type: 'nap' });
    }
    if (s.stageMin >= BABY_TOTAL_MIN) {
      s.asleep = false;
      enterStage(s, 'child', 'gomboc', t, ev);
    }
    return;
  }
  awakeMinute(s, local, t, ev, true);
}

function hatch(s: PetState, t: number, ev: Events): void {
  s.status = 'alive';
  s.hatchedAt = t;
  s.stage = 'baby';
  s.form = null;
  s.stageMin = 0;
  s.stageLenMin = BABY_TOTAL_MIN;
  s.stageCountedMin = 0;
  s.hunger = 50;
  s.happiness = 50;
  s.energy = 100;
  s.health = 100;
  s.weight = BASE_WEIGHT.baby;
  ev.push({ t, type: 'hatched' });
}

function fallAsleep(s: PetState, t: number, ev: Events): void {
  if (s.stage === 'senior' && s.farewell) {
    die(s, 'oregkor', t, ev);
    return;
  }
  s.asleep = true;
  s.napMin = 0;
  s.lightsOff = s.mode === 'alap' && s.autoLights;
  s.lightsMin = 0;
  s.lightsMistake = false;
  ev.push({ t, type: 'fellAsleep' });
}

function wake(s: PetState, t: number, ev: Events): void {
  s.asleep = false;
  s.lightsOff = false;
  s.ageYears++;
  s.snacksToday = 0;
  if (s.pendingSchedule) {
    s.schedule = s.pendingSchedule;
    s.pendingSchedule = null;
  }
  ev.push({ t, type: 'woke' });
}

function sleepMinute(s: PetState, t: number, ev: Events): void {
  const mp = MODE[s.mode];
  const recharge = ((100 - ACTION.energyAtBedtime) / petSleepMinutes(s.schedule)) * (s.lightsOff ? 1 : 0.5);
  s.energy = Math.min(100, s.energy + recharge);
  if (!s.lightsOff) {
    s.lightsMin++;
    if (s.lightsMin >= mp.lightsGraceMin && !s.lightsMistake) {
      s.lightsMistake = true;
      addMistake(s, 'lights', t, ev);
    }
  }
}

function traitMult(s: PetState, trait: TraitId): number {
  return s.trait === trait ? 1.1 : 1;
}

function awakeMinute(s: PetState, local: LocalTime, t: number, ev: Events, isBaby: boolean): void {
  const mp = MODE[s.mode];
  const stage = s.stage as LiveStage;

  const daycare = !isBaby && isDaycareTime(local, s.daycare, mp.daycareMaxMin);
  if (daycare !== s.inDaycare) {
    s.inDaycare = daycare;
    if (daycare) {
      ev.push({ t, type: 'daycareStart' });
    } else {
      s.poops = [];
      ev.push({ t, type: 'daycareEnd' });
    }
  }
  const counted = !daycare;
  if (daycare && s.sick && s.mode === 'alap') cure(s, t, ev);

  if (s.napMin > 0) {
    s.napMin--;
    if (s.napMin === 0) s.energy = Math.max(s.energy, ACTION.energyAfterNap);
  } else {
    const drain = ((100 - ACTION.energyAtBedtime) / petAwakeMinutes(s.schedule)) * traitMult(s, 'almos');
    s.energy = Math.max(0, s.energy - drain);
    if (s.energy <= 0) {
      s.napMin = ACTION.napMin;
      ev.push({ t, type: 'nap' });
    }
  }

  const d = DECAY[stage];
  const hungerRate = (d.hunger * mp.decayMult * traitMult(s, 'falank')) / 60;
  let happyRate = (d.happiness * mp.decayMult * traitMult(s, 'jatekos')) / 60;
  if (s.poops.length >= MAX_POOPS) happyRate *= 1.5;
  if (s.sick) happyRate *= 1.5;
  s.hunger = decayStat(s.hunger, hungerRate, daycare);
  s.happiness = decayStat(s.happiness, happyRate, daycare);

  s.weightTimer++;
  if (s.weightTimer >= 12 * 60) {
    s.weightTimer = 0;
    if (s.weight > BASE_WEIGHT[stage] - 5) s.weight -= 1;
  }

  for (let i = 0; i < s.poops.length; i++) s.poops[i] += 1;
  s.poopTimer++;
  const poopEvery = POOP_EVERY_MIN[stage] + (s.trait === 'rendes' ? 30 : 0);
  if (s.poopTimer >= poopEvery) {
    s.poopTimer = 0;
    if (s.poops.length < MAX_POOPS) {
      s.poops.push(0);
      ev.push({ t, type: 'poop' });
    }
  }
  if (!s.sick && s.poops.length > 0 && Math.max(...s.poops) >= mp.poopSickMin) {
    getSick(s, 'kaki', t, ev);
    s.poops = s.poops.map(() => 0);
  }

  if (counted && !isBaby) {
    s.stageCountedMin++;
    while (s.scheduledSickness.length > 0 && s.scheduledSickness[0] <= s.stageCountedMin) {
      s.scheduledSickness.shift();
      if (!s.sick) getSick(s, 'utemezett', t, ev);
    }
    if (stage === 'adult' || stage === 'senior') {
      s.sicknessCountdown--;
      if (s.sicknessCountdown <= 0) {
        if (!s.sick) getSick(s, 'utemezett', t, ev);
        s.sicknessCountdown = drawSicknessCountdown(s);
      }
    }
    while (s.scheduledMisbehave.length > 0 && s.scheduledMisbehave[0] <= s.stageCountedMin) {
      s.scheduledMisbehave.shift();
      openCall(s, 'misbehave', t, ev);
    }
  }

  if (s.immuneMin > 0) s.immuneMin--;
  const base = BASE_WEIGHT[stage];
  if (!isBaby && !s.sick && s.immuneMin === 0) {
    if (s.weight >= base + HEALTH.sickOverweightOver) getSick(s, 'tulsuly', t, ev);
    else if (s.health < HEALTH.sickBelow) getSick(s, 'gyengeseg', t, ev);
  }
  if (s.sick) s.sick.awakeMin++;

  let neg = 0;
  if (s.hunger <= 0) neg += HEALTH.hungerZero;
  if (s.happiness <= 0) neg += HEALTH.happinessZero;
  if (s.sick) neg += HEALTH.sick;
  if (s.poops.length >= 3) neg += HEALTH.poops3;
  if (s.weight >= base + HEALTH.overweightOver) neg += HEALTH.overweight;
  const prevHealth = s.health;
  if (neg > 0) s.health = Math.max(0, s.health - (neg * mp.healthMult) / 60);
  else if (!s.critical) s.health = Math.min(100, s.health + HEALTH.regen / 60);
  if (prevHealth >= HEALTH.weakThreshold && s.health < HEALTH.weakThreshold) ev.push({ t, type: 'weak' });
  if (!isBaby && s.health <= 0 && !s.critical) {
    const sicknessDominant = s.sick !== null && s.hunger > 0 && s.happiness > 0;
    startCritical(s, sicknessDominant ? 'betegseg' : 'elhanyagolas', t, ev);
  }

  syncCall(s, 'hunger', s.hunger <= 0, t, ev);
  syncCall(s, 'happiness', s.happiness <= 0, t, ev);
  if (counted) {
    const expired: number[] = [];
    s.calls.forEach((c, i) => {
      c.countedMin++;
      if (c.type === 'misbehave') {
        const window = mp.misbehaveWindowMin + (s.trait === 'kivancsi' ? 30 : 0);
        if (c.countedMin >= window) {
          expired.push(i);
          ev.push({ t, type: 'misbehaveMissed' });
        }
        return;
      }
      const limit = c.mistakes === 0 ? mp.graceMin : mp.repeatMistakeMin;
      if (c.countedMin >= limit) {
        c.mistakes++;
        c.countedMin = 0;
        if (!isBaby) addMistake(s, c.type as MistakeKind, t, ev);
      }
    });
    if (expired.length > 0) s.calls = s.calls.filter((_, i) => !expired.includes(i));
  }

  if (s.critical) {
    if (rescueReady(s)) {
      rescue(s, t, ev);
    } else if (counted && !isBaby) {
      s.critical.countedMin++;
      const remaining = mp.criticalMin - s.critical.countedMin;
      if (CRITICAL_WARN_AT_REMAINING.includes(remaining)) {
        ev.push({ t, type: 'criticalWarn', remainingMin: remaining });
      }
      if (remaining <= 0) {
        if (s.mode === 'klasszikus') die(s, s.critical.cause, t, ev);
        else toNagyi(s, t, ev);
      }
    }
  }
}

function decayStat(value: number, rate: number, daycare: boolean): number {
  if (!daycare) return Math.max(0, value - rate);
  // Napköziben a gondozó legalább 1 szíven tartja a jelzőt (PRD 8.2).
  if (value <= 25) return 25;
  return Math.max(25, value - rate);
}

function syncCall(s: PetState, type: CallType, active: boolean, t: number, ev: Events): void {
  const idx = s.calls.findIndex((c) => c.type === type);
  if (active && idx < 0) openCall(s, type, t, ev);
  else if (!active && idx >= 0) {
    s.calls.splice(idx, 1);
    ev.push({ t, type: 'callClosed', call: type });
  }
}

function openCall(s: PetState, type: CallType, t: number, ev: Events): void {
  if (s.calls.some((c) => c.type === type)) return;
  s.calls.push({ type, countedMin: 0, mistakes: 0 });
  ev.push({ t, type: 'call', call: type });
}

export function addMistake(s: PetState, kind: MistakeKind, t: number, ev: Events, bypassCap = false): void {
  if (s.stage === 'baby' || s.stage === 'egg') return;
  const mp = MODE[s.mode];
  if (!bypassCap && s.absenceMistakes >= mp.absenceMistakeCap) {
    ev.push({ t, type: 'mistakeWaived', mistake: kind });
    return;
  }
  if (!bypassCap) s.absenceMistakes++;
  s.mistakes[s.stage]++;
  ev.push({ t, type: 'mistake', mistake: kind });
  if (
    s.mode === 'klasszikus' &&
    s.stage === 'adult' &&
    s.mistakes.adult % CLASSIC_MISTAKES_PER_DAY_LOSS === 0 &&
    s.classicAdjDays < MAX_CLASSIC_ADJ_DAYS
  ) {
    s.classicAdjDays++;
    shortenStage(s, 1);
  }
}

/** Az aktuális (felnőtt vagy idős) szakasz rövidítése a minimumok betartásával. */
export function shortenStage(s: PetState, days: number): void {
  const min = s.stage === 'adult' ? MIN_ADULT_DAYS * DAY_MIN : DAY_MIN;
  s.stageLenMin = Math.max(min, s.stageLenMin - days * DAY_MIN);
}

export function getSick(s: PetState, cause: SicknessCause, t: number, ev: Events): void {
  s.sick = { cause, doses: 0, lastDoseMs: null, awakeMin: 0 };
  s.sicknessThisStage++;
  ev.push({ t, type: 'sick', cause });
  if (s.mode === 'klasszikus' && s.sicknessThisStage >= 5 && !s.critical) {
    startCritical(s, 'betegseg', t, ev);
  }
}

export function cure(s: PetState, t: number, ev: Events): void {
  if (!s.sick) return;
  s.sick = null;
  s.health = Math.min(100, s.health + ACTION.cureHealth);
  s.immuneMin = ACTION.immuneAfterCureMin;
  ev.push({ t, type: 'cured' });
}

function startCritical(s: PetState, cause: 'elhanyagolas' | 'betegseg', t: number, ev: Events): void {
  s.critical = { cause, countedMin: 0 };
  ev.push({ t, type: 'critical', cause });
  addMistake(s, 'critical', t, ev);
  addMistake(s, 'critical', t, ev);
}

export function rescueReady(s: PetState): boolean {
  if (s.stage === 'egg') return false;
  const base = BASE_WEIGHT[s.stage as LiveStage];
  return (
    s.hunger > 0 &&
    s.happiness > 0 &&
    s.sick === null &&
    s.poops.length < 3 &&
    s.weight < base + HEALTH.overweightOver
  );
}

export function rescue(s: PetState, t: number, ev: Events): void {
  s.critical = null;
  s.health = Math.max(s.health, HEALTH.rescueHealth);
  s.convalescenceMin = HEALTH.convalescenceMin;
  ev.push({ t, type: 'rescued' });
}

function toNagyi(s: PetState, t: number, ev: Events): void {
  s.status = 'nagyi';
  s.nagyiSince = t;
  s.critical = null;
  s.calls = [];
  ev.push({ t, type: 'nagyi' });
}

function die(s: PetState, cause: 'oregkor' | 'elhanyagolas' | 'betegseg', t: number, ev: Events): void {
  s.status = 'dead';
  s.diedAt = t;
  s.deathCause = cause;
  s.critical = null;
  s.calls = [];
  ev.push({ t, type: 'died', cause });
}

function onStageEnd(s: PetState, t: number, ev: Events): void {
  switch (s.stage) {
    case 'child':
      enterStage(s, 'teen', s.mistakes.child <= 2 ? 'csillagszemu' : 'kope', t, ev);
      break;
    case 'teen':
      enterStage(s, 'adult', adultForm(s), t, ev);
      break;
    case 'adult':
      enterStage(s, 'senior', s.form, t, ev);
      break;
    case 'senior':
      if (!s.farewell) {
        s.farewell = true;
        ev.push({ t, type: 'farewell' });
      }
      break;
    default:
      break;
  }
}

/** Fejlődési táblázat (PRD 7.10). A fegyelem 25-ös lépésekben mozog. */
export function adultForm(s: PetState): AdultForm {
  const h = s.mistakes.teen;
  const f = s.discipline;
  if (s.form === 'csillagszemu') {
    const legend =
      s.mode === 'klasszikus' &&
      !s.downgraded &&
      s.mistakes.child + s.mistakes.teen === 0 &&
      f >= 100 &&
      s.teenWins >= LEGENDA_MIN_TEEN_WINS;
    if (legend) return 'legenda';
    if (h <= 2) return f >= 75 ? 'ragyogo' : 'kiegyensulyozott';
    return f >= 75 ? 'joszivu' : 'durcas';
  }
  return h <= 4 ? 'mokamester' : 'nyugos';
}

function enterStage(s: PetState, stage: LiveStage, form: FormId | null, t: number, ev: Events): void {
  s.stage = stage;
  s.form = form;
  s.stageMin = 0;
  s.stageCountedMin = 0;
  s.sicknessThisStage = 0;
  s.weight = Math.max(s.weight, BASE_WEIGHT[stage]);
  s.stageLenMin = stageLength(s);
  scheduleStageEvents(s);
  ev.push({ t, type: stage === 'senior' ? 'senior' : 'evolved', stage, form });
}

function stageLength(s: PetState): number {
  switch (s.stage) {
    case 'baby':
      return BABY_TOTAL_MIN;
    case 'child':
      return STAGE_MIN.child;
    case 'teen':
      return STAGE_MIN.teen;
    case 'adult':
      return LIFESPAN[s.form as AdultForm].adult * DAY_MIN;
    case 'senior':
      return LIFESPAN[s.form as AdultForm].senior * DAY_MIN;
    default:
      return EGG_MIN;
  }
}

function countedEstimate(s: PetState): number {
  return s.stageLenMin * (petAwakeMinutes(s.schedule) / DAY_MIN) * 0.85;
}

function spread(s: PetState, n: number, est: number): number[] {
  const out: number[] = [];
  let prev = -SCHEDULED.minSpacingMin;
  for (let i = 0; i < n; i++) {
    const slot = est / (n + 1);
    const value = Math.round(slot * (i + 1) + randomBetween(s, -0.4, 0.4) * slot);
    const spaced = Math.max(value, prev + SCHEDULED.minSpacingMin, 1);
    out.push(spaced);
    prev = spaced;
  }
  return out;
}

function scheduleStageEvents(s: PetState): void {
  const est = countedEstimate(s);
  s.scheduledSickness = [];
  s.scheduledMisbehave = [];
  if (s.stage === 'child') {
    s.scheduledSickness = [Math.round(randomBetween(s, 0.15, 0.85) * est)];
    s.scheduledMisbehave = spread(s, SCHEDULED.childMisbehave, est);
  } else if (s.stage === 'teen') {
    s.scheduledSickness = [Math.round(randomBetween(s, 0.15, 0.85) * est)];
    const needed = Math.max(0, Math.ceil((100 - s.discipline) / 25));
    s.scheduledMisbehave = spread(s, needed, est);
  } else if (s.stage === 'adult' || s.stage === 'senior') {
    s.sicknessCountdown = drawSicknessCountdown(s);
  }
}

function drawSicknessCountdown(s: PetState): number {
  const days = s.stage === 'senior' ? SCHEDULED.seniorSicknessEveryDays : SCHEDULED.adultSicknessEveryDays;
  const mean = days * DAY_MIN * (petAwakeMinutes(s.schedule) / DAY_MIN) * 0.85;
  return Math.max(60, Math.round(mean * randomBetween(s, 0.6, 1.4)));
}

/** Teszt- és hibakeresési segéd: egy szakasz közvetlen beállítása. */
export function forceStage(s: PetState, stage: LiveStage, form: FormId | null): PetState {
  const c = cloneState(s);
  c.status = 'alive';
  c.hatchedAt = c.hatchedAt ?? c.lastMs;
  enterStage(c, stage, form, c.lastMs, []);
  return c;
}
