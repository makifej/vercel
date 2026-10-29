// A játékállás sémája és alapértékei. Ebben az offline buildben minden a
// telefonon marad (AsyncStorage); szerveroldali szinkron a PRD 13. fejezete
// szerint későbbi lépés.

import type { FormId, Interval, MemorialEntry, Mode, PetState } from '../sim';
import { REAL_TIME, type TimeScale } from './time';

export type NotifyCategory =
  | 'osszesito'
  | 'gondozas'
  | 'egeszseg'
  | 'alvas'
  | 'kritikus'
  | 'eletut'
  | 'szabadsag';

export const NOTIFY_CATEGORIES: NotifyCategory[] = [
  'osszesito',
  'gondozas',
  'egeszseg',
  'alvas',
  'kritikus',
  'eletut',
  'szabadsag',
];

/** Kategóriák alapértéke módonként (PRD 9.3). */
export const NOTIFY_DEFAULTS: Record<Mode, Record<NotifyCategory, boolean>> = {
  alap: {
    osszesito: true,
    gondozas: false,
    egeszseg: true,
    alvas: false,
    kritikus: true,
    eletut: true,
    szabadsag: true,
  },
  klasszikus: {
    osszesito: false,
    gondozas: true,
    egeszseg: true,
    alvas: true,
    kritikus: true,
    eletut: true,
    szabadsag: true,
  },
};

export interface Settings {
  /** A játék-backend címe; null: helyi mód (PRD 13: szerver-autoritatív mód, ha van). */
  serverUrl: string | null;
  notifyOverrides: Partial<Record<NotifyCategory, boolean>>;
  digestTimes: number[];
  deathStyle: 'csillag' | 'sirko';
  haptics: boolean;
}

export interface Meta {
  notifAsked: boolean;
  firstCare: { fed: boolean; cleaned: boolean };
  seenForms: FormId[];
  /** Az utolsó előtérbe kerülés valós ideje (a visszatérési összefoglalóhoz). */
  lastBackgroundReal: number | null;
}

export interface SaveData {
  v: 1;
  pet: PetState | null;
  memorial: MemorialEntry[];
  vacationHistory: Interval[];
  settings: Settings;
  time: TimeScale;
  meta: Meta;
}

export function emptySave(): SaveData {
  return {
    v: 1,
    pet: null,
    memorial: [],
    vacationHistory: [],
    settings: {
      serverUrl: defaultServerUrl(),
      notifyOverrides: {},
      digestTimes: [8 * 60, 12 * 60 + 30, 18 * 60 + 30],
      deathStyle: 'csillag',
      haptics: true,
    },
    time: REAL_TIME,
    meta: {
      notifAsked: false,
      firstCare: { fed: false, cleaned: false },
      seenForms: [],
      lastBackgroundReal: null,
    },
  };
}

/** Build-időben beégetett backend-cím (`EXPO_PUBLIC_API_URL`), ha van. */
export function defaultServerUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_API_URL;
  return url && /^https?:\/\//.test(url) ? url.replace(/\/+$/, '') : null;
}

export function notifyEnabled(settings: Settings, mode: Mode, cat: NotifyCategory): boolean {
  return settings.notifyOverrides[cat] ?? NOTIFY_DEFAULTS[mode][cat];
}

export const SAVE_KEY = 'pixeltojas:save:v1';

export function parseSave(raw: string | null): SaveData {
  if (!raw) return emptySave();
  try {
    const data = JSON.parse(raw) as SaveData;
    if (data.v !== 1) return emptySave();
    const base = emptySave();
    return {
      ...base,
      ...data,
      settings: { ...base.settings, ...data.settings },
      meta: { ...base.meta, ...data.meta },
    };
  } catch {
    return emptySave();
  }
}
