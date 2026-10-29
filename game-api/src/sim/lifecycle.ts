// Életvég, emlékkert és öröklődés (PRD 7.14, 8.3).

import { createEgg } from './engine';
import {
  DAY_MIN,
  LEGACY_DISCIPLINE,
  LEGACY_DISCIPLINE_FORMS,
  MIN,
  PALETTE_COUNT,
  TRAITS,
} from './params';
import { nextRandom, pick } from './rng';
import type { AdultForm, FormId, Mode, PetState, Stage } from './types';

export type MemorialCause = 'oregkor' | 'elhanyagolas' | 'betegseg' | 'nagyinal';

export interface MemorialEntry {
  id: string;
  name: string;
  familyName: string;
  generation: number;
  mode: Mode;
  stage: Stage;
  form: FormId | null;
  palette: number;
  cause: MemorialCause;
  bornAt: number;
  endedAt: number;
  lifeDays: number;
  ageYears: number;
  totalMistakes: number;
  epitaph: string;
  flowers: number;
  lastFlowerDay: string | null;
}

export function memorialFromPet(p: PetState, endedAt: number, cause: MemorialCause): MemorialEntry {
  const totalMistakes = Object.values(p.mistakes).reduce((a, b) => a + b, 0);
  return {
    id: p.id,
    name: p.name,
    familyName: p.familyName,
    generation: p.generation,
    mode: p.mode,
    stage: p.stage,
    form: p.form,
    palette: p.palette,
    cause,
    bornAt: p.hatchedAt ?? p.createdAt,
    endedAt,
    lifeDays: Math.round((p.lifeMin / DAY_MIN) * 10) / 10,
    ageYears: p.ageYears,
    totalMistakes,
    epitaph: '',
    flowers: 0,
    lastFlowerDay: null,
  };
}

/** Természetes halál után a kedvenc tojást hagy (PRD 7.14). */
export function canLeaveEgg(p: PetState): boolean {
  return p.status === 'dead' && p.deathCause === 'oregkor';
}

export interface SuccessorInput {
  parent: PetState | null;
  id: string;
  name: string;
  mode: Mode;
  now: number;
  seed: number;
  /** Teljes verzió nélkül az öröklődés zárolt (PRD 10.4); ebben a buildben mindig igaz. */
  inheritance: boolean;
}

export function createSuccessorEgg(input: SuccessorInput): PetState {
  const { parent } = input;
  const rngState = { rng: input.seed | 0 };
  const inherits = input.inheritance && parent !== null && canLeaveEgg(parent);
  const palette =
    inherits && nextRandom(rngState) < 0.7 ? parent.palette : Math.floor(nextRandom(rngState) * PALETTE_COUNT);
  const trait = inherits && nextRandom(rngState) < 0.5 ? parent.trait : pick(rngState, TRAITS);
  const legacy = inherits && LEGACY_DISCIPLINE_FORMS.includes(parent.form as AdultForm);
  const classicLine =
    inherits && parent.mode === 'klasszikus' && !parent.downgraded ? parent.lineageClassic + 1 : 0;
  const template = parent ?? null;
  return createEgg({
    id: input.id,
    name: input.name,
    mode: input.mode,
    now: input.now,
    schedule: template?.pendingSchedule ?? template?.schedule ?? { bedMin: 23 * 60, wakeMin: 7 * 60 },
    daycare: template?.daycare ?? { enabled: false, startMin: 8 * 60 + 30, endMin: 17 * 60, days: weekdays() },
    autoLights: template?.autoLights ?? true,
    seed: rngState.rng,
    generation: inherits ? parent.generation + 1 : 1,
    familyName: parent ? parent.familyName : input.name,
    lineageClassic: classicLine,
    palette,
    trait,
    discipline: legacy ? LEGACY_DISCIPLINE : 0,
  });
}

export function weekdays(): boolean[] {
  return [false, true, true, true, true, true, false];
}

/** Hátralévő napok az idős szakaszból (az előjelzéshez, PRD 7.14). */
export function remainingSeniorDays(p: PetState): number {
  if (p.stage !== 'senior') return 0;
  return Math.max(0, Math.ceil((p.stageLenMin - p.stageMin) / DAY_MIN));
}

/** Nagyinál töltött napok (30 nap után választható a „Nagyinál marad”). */
export function daysAtNagyi(p: PetState, now: number): number {
  if (p.status !== 'nagyi' || p.nagyiSince === null) return 0;
  return (now - p.nagyiSince) / (DAY_MIN * MIN);
}
