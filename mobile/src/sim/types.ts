// A szimuláció adattípusai. Minden időpont UTC epoch ms; a szimuláció
// percrácson lép (lastMs mindig egész perc), így a felosztás-invariancia
// pontos: advance(a→b) majd advance(b→c) azonos advance(a→c)-vel.

export type Mode = 'alap' | 'klasszikus';
export type Stage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'senior';
export type Status = 'egg' | 'alive' | 'nagyi' | 'dead';

export type FormId =
  | 'gomboc'
  | 'csillagszemu'
  | 'kope'
  | 'legenda'
  | 'ragyogo'
  | 'kiegyensulyozott'
  | 'joszivu'
  | 'durcas'
  | 'mokamester'
  | 'nyugos';

export type AdultForm = Extract<
  FormId,
  'legenda' | 'ragyogo' | 'kiegyensulyozott' | 'joszivu' | 'durcas' | 'mokamester' | 'nyugos'
>;

export type TraitId = 'falank' | 'jatekos' | 'almos' | 'rendes' | 'bujos' | 'kivancsi';
export type CallType = 'hunger' | 'happiness' | 'misbehave';
export type DeathCause = 'oregkor' | 'elhanyagolas' | 'betegseg';
export type SicknessCause = 'kaki' | 'utemezett' | 'tulsuly' | 'gyengeseg';
export type MistakeKind = 'hunger' | 'happiness' | 'lights' | 'critical' | 'nagyi';

/** A játékos napirendje helyi időben, a nap perceiben (0-1439). */
export interface Schedule {
  bedMin: number;
  wakeMin: number;
}

/** Napközi: hetente ismétlődő ablak; days[0] = vasárnap (JS getDay szerint). */
export interface Daycare {
  enabled: boolean;
  startMin: number;
  endMin: number;
  days: boolean[];
}

export interface Interval {
  start: number;
  end: number;
}

export interface OpenCall {
  type: CallType;
  /** Számlálható percek a hívás megnyitása, illetve az utolsó gondozási hiba óta. */
  countedMin: number;
  mistakes: number;
}

export interface Sickness {
  cause: SicknessCause;
  doses: number;
  lastDoseMs: number | null;
  /** Ébrenléti percek a betegség kezdete óta (az egészség-értesítéshez). */
  awakeMin: number;
}

export interface Critical {
  cause: 'elhanyagolas' | 'betegseg';
  countedMin: number;
}

export interface PetState {
  v: 1;
  paramsVersion: number;
  id: string;
  name: string;
  mode: Mode;
  downgraded: boolean;
  status: Status;
  stage: Stage;
  form: FormId | null;

  generation: number;
  familyName: string;
  lineageClassic: number;
  palette: number;
  trait: TraitId;

  createdAt: number;
  hatchedAt: number | null;
  /** null: a tojást még nem kezdte melegíteni a játékos. */
  eggWarmMin: number | null;
  lastMs: number;

  lifeMin: number;
  stageMin: number;
  /** A szakasz hossza életkor-percben; az élettartam-módosítók ezt rövidítik. */
  stageLenMin: number;
  stageCountedMin: number;
  ageYears: number;

  hunger: number;
  happiness: number;
  energy: number;
  health: number;
  discipline: number;
  weight: number;

  /** Minden látható kaki ébrenléti percben mért kora. */
  poops: number[];
  poopTimer: number;
  weightTimer: number;
  sick: Sickness | null;
  immuneMin: number;
  sicknessThisStage: number;

  asleep: boolean;
  napMin: number;
  lightsOff: boolean;
  lightsMin: number;
  lightsMistake: boolean;
  inDaycare: boolean;

  calls: OpenCall[];
  mistakes: Record<Stage, number>;
  absenceMistakes: number;
  critical: Critical | null;
  convalescenceMin: number;

  scheduledSickness: number[];
  scheduledMisbehave: number[];
  sicknessCountdown: number;

  snacksToday: number;
  petTimes: number[];
  teenWins: number;
  totalWins: number;

  /** Elvesztett élettartam napokban: Nagyi-látogatások és Klasszikus felnőttkori hibák. */
  nagyiAdjDays: number;
  classicAdjDays: number;
  nagyiVisits: number;
  farewell: boolean;
  nagyiSince: number | null;
  vacation: Interval | null;

  schedule: Schedule;
  pendingSchedule: Schedule | null;
  scheduleChangedAt: number | null;
  daycare: Daycare;
  autoLights: boolean;

  diedAt: number | null;
  deathCause: DeathCause | null;
  rng: number;
}

export type SimEventType =
  | 'hatched'
  | 'evolved'
  | 'senior'
  | 'farewell'
  | 'poop'
  | 'sick'
  | 'cured'
  | 'call'
  | 'callClosed'
  | 'mistake'
  | 'mistakeWaived'
  | 'weak'
  | 'critical'
  | 'criticalWarn'
  | 'rescued'
  | 'nagyi'
  | 'died'
  | 'fellAsleep'
  | 'woke'
  | 'nap'
  | 'daycareStart'
  | 'daycareEnd'
  | 'vacationEnd'
  | 'misbehaveMissed';

export interface SimEvent {
  t: number;
  type: SimEventType;
  call?: CallType;
  stage?: Stage;
  form?: FormId | null;
  cause?: string;
  /** criticalWarn: hátralévő számlálható percek. */
  remainingMin?: number;
  mistake?: MistakeKind;
}

/** Helyi naptári adatok egy időponthoz (időzóna-tudatos, DST-helyes). */
export interface LocalTime {
  minuteOfDay: number;
  weekday: number;
}

export interface SimContext {
  local: (ms: number) => LocalTime;
  /**
   * Vészleállító (PRD 13.13, `sys:flags.deathEnabled = false`): a lejárt
   * Klasszikus Kritikus óra nem okoz halált, a kedvenc Kritikus állapotban marad.
   */
  holdDeath?: boolean;
  /** Szolgáltatáskiesések (PRD 8.5): ezekben az intervallumokban a szimuláció áll. */
  frozen?: Interval[];
}
