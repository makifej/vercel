// Játékparaméterek, 1. verzió (PRD 7. fejezet). Minden érték [JAVASLAT]:
// kezdeti hangolás, amelyet a zárt bétában validálni kell. A kedvenc a
// létrehozásakor érvényes paraméterverzióhoz kötött (PRD 7.16).

import type { AdultForm, Mode, Stage, TraitId } from './types';

export const PARAMS_VERSION = 1;

export const MIN = 60_000;
export const HOUR_MIN = 60;
export const DAY_MIN = 1440;

export const EGG_MIN = 5;
export const BABY_AWAKE_MIN = 60;
export const BABY_TOTAL_MIN = 65;

export const STAGE_MIN: Record<'child' | 'teen', number> = {
  child: 48 * HOUR_MIN,
  teen: 96 * HOUR_MIN,
};

/** Fogyás pont / ébrenléti óra, Alap mód (PRD 7.4). */
export const DECAY: Record<Exclude<Stage, 'egg'>, { hunger: number; happiness: number }> = {
  baby: { hunger: 30, happiness: 25 },
  child: { hunger: 16, happiness: 14 },
  teen: { hunger: 14, happiness: 12 },
  adult: { hunger: 12, happiness: 10 },
  senior: { hunger: 13, happiness: 11 },
};

/** Kakigyakoriság ébrenléti percben (PRD 7.3). */
export const POOP_EVERY_MIN: Record<Exclude<Stage, 'egg'>, number> = {
  baby: 20,
  child: 120,
  teen: 180,
  adult: 240,
  senior: 240,
};

export const MAX_POOPS = 4;

/** Szakaszonkénti alapsúly grammban (PRD 7.5). */
export const BASE_WEIGHT: Record<Exclude<Stage, 'egg'>, number> = {
  baby: 5,
  child: 10,
  teen: 20,
  adult: 30,
  senior: 28,
};

export interface ModeParams {
  decayMult: number;
  healthMult: number;
  graceMin: number;
  repeatMistakeMin: number;
  lightsGraceMin: number;
  misbehaveWindowMin: number;
  poopSickMin: number;
  dosesNeeded: number;
  absenceMistakeCap: number;
  criticalMin: number;
  daycareMaxMin: number;
  vacationMaxDays: number;
  vacationBudgetDays: number;
}

/** A két mód eltérései (PRD 7.12, 8.1, 8.2). */
export const MODE: Record<Mode, ModeParams> = {
  alap: {
    decayMult: 1,
    healthMult: 0.5,
    graceMin: 180,
    repeatMistakeMin: 360,
    lightsGraceMin: 120,
    misbehaveWindowMin: 240,
    poopSickMin: 240,
    dosesNeeded: 1,
    absenceMistakeCap: 3,
    criticalMin: 12 * HOUR_MIN,
    daycareMaxMin: 10 * HOUR_MIN,
    vacationMaxDays: 14,
    vacationBudgetDays: 30,
  },
  klasszikus: {
    decayMult: 1.5,
    healthMult: 1,
    graceMin: 60,
    repeatMistakeMin: 360,
    lightsGraceMin: 30,
    misbehaveWindowMin: 120,
    poopSickMin: 120,
    dosesNeeded: 2,
    absenceMistakeCap: Number.POSITIVE_INFINITY,
    criticalMin: 12 * HOUR_MIN,
    daycareMaxMin: 8 * HOUR_MIN,
    vacationMaxDays: 7,
    vacationBudgetDays: 14,
  },
};

/** Egészségváltozás ébrenléti óránként, Klasszikus értékek (PRD 7.8). */
export const HEALTH = {
  hungerZero: 6,
  happinessZero: 2,
  sick: 3,
  poops3: 1,
  overweight: 1,
  regen: 4,
  weakThreshold: 50,
  sickBelow: 30,
  overweightOver: 15,
  sickOverweightOver: 25,
  rescueHealth: 20,
  convalescenceMin: 12 * HOUR_MIN,
};

export const ACTION = {
  feed: 25,
  snack: 25,
  snackReduced: 12,
  snackReducedFrom: 5,
  playWin: 25,
  playLose: 5,
  pet: 10,
  petPerHour: 3,
  scoldGain: 25,
  scoldPenalty: 10,
  medicineGap: MIN,
  cureHealth: 10,
  immuneAfterCureMin: 6 * HOUR_MIN,
  playEnergyCost: 5,
  minPlayEnergy: 15,
  napMin: 30,
  energyAfterNap: 20,
  energyAtBedtime: 10,
};

/** A kedvenc alvásablaka a lefekvés előtti 30. perctől az ébredésig tart (PRD 7.9). */
export const SLEEPY_BEFORE_BED_MIN = 30;
export const SCHEDULE_MIN_SLEEP_MIN = 7 * HOUR_MIN;
export const SCHEDULE_MAX_SLEEP_MIN = 11 * HOUR_MIN;

/** Felnőtt és idős szakasz napokban, formánként (PRD 7.11). */
export const LIFESPAN: Record<AdultForm, { adult: number; senior: number }> = {
  legenda: { adult: 22, senior: 5 },
  ragyogo: { adult: 20, senior: 5 },
  kiegyensulyozott: { adult: 18, senior: 5 },
  joszivu: { adult: 16, senior: 4 },
  mokamester: { adult: 14, senior: 4 },
  durcas: { adult: 12, senior: 4 },
  nyugos: { adult: 9, senior: 3 },
};

export const MIN_ADULT_DAYS = 6;
export const MAX_NAGYI_ADJ_DAYS = 3;
export const MAX_CLASSIC_ADJ_DAYS = 4;
export const CLASSIC_MISTAKES_PER_DAY_LOSS = 5;

/** Ütemezett betegség és hiszti (PRD 7.3). */
export const SCHEDULED = {
  childSickness: 1,
  childMisbehave: 2,
  teenSickness: 1,
  adultSicknessEveryDays: 5,
  seniorSicknessEveryDays: 2,
  minSpacingMin: 4 * HOUR_MIN,
};

export const CRITICAL_WARN_AT_REMAINING = [4 * HOUR_MIN, HOUR_MIN];

export const TRAITS: TraitId[] = ['falank', 'jatekos', 'almos', 'rendes', 'bujos', 'kivancsi'];
export const PALETTE_COUNT = 8;
export const LEGACY_DISCIPLINE_FORMS: AdultForm[] = ['ragyogo', 'kiegyensulyozott', 'legenda'];
export const LEGACY_DISCIPLINE = 25;
export const LEGENDA_MIN_TEEN_WINS = 10;

export const NAGYI_RETURN = { hunger: 50, happiness: 50, health: 60, mistakes: 2 };
export const NAGYI_STAY_OPTION_DAYS = 30;
export const VACATION_MIN_CHARGE_MIN = 12 * HOUR_MIN;
export const VACATION_ROLLING_DAYS = 90;
export const SCHEDULE_CHANGE_COOLDOWN_MIN = 24 * HOUR_MIN;
