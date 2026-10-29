import { createEgg, fixedOffsetLocal, forceStage, MIN } from '..';
import type { FormId, Mode, PetState, SimContext, Stage } from '..';

/** Budapest, téli idő (UTC+1). */
export const ctx: SimContext = { local: (ms) => fixedOffsetLocal(ms, 60) };

/** 2026-11-02 (hétfő) 07:00 helyi idő. */
export const T0 = Date.UTC(2026, 10, 2, 6, 0);
export const H = 60 * MIN;

/** A kedvenc alvásablaka 23:00-07:00 (a lefekvés 23:30, az elálmosodás fél órával előtte). */
export const SCHEDULE = { bedMin: 23 * 60 + 30, wakeMin: 7 * 60 };

export function makePet(
  stage: Exclude<Stage, 'egg' | 'baby'>,
  form: FormId,
  mode: Mode,
  overrides: Partial<PetState> = {},
): PetState {
  const egg = createEgg({
    id: 'pet-1',
    name: 'Pötty',
    mode,
    now: T0,
    schedule: SCHEDULE,
    daycare: { enabled: false, startMin: 8 * 60, endMin: 16 * 60, days: [false, true, true, true, true, true, false] },
    autoLights: mode === 'alap',
    seed: 42,
  });
  const p = forceStage({ ...egg, lastMs: T0 }, stage, form);
  return {
    ...p,
    hunger: 100,
    happiness: 100,
    energy: 100,
    health: 100,
    poops: [],
    poopTimer: 0,
    scheduledSickness: [],
    scheduledMisbehave: [],
    sicknessCountdown: 1_000_000,
    ...overrides,
  };
}

export function minutesFromT0(t: number): number {
  return Math.round((t - T0) / MIN);
}
