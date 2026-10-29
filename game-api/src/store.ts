// Adatmodell a PRD 13.6 szerint. A profil és az emlékkert JSON-dokumentum,
// a kedvenc pillanatképe optimista zárolással (verziókulcs) íródik.

import type { Daycare, Interval, MemorialEntry, PetState, Schedule } from './sim';
import type { Kv } from './kv';

export type NotifyCategory = 'osszesito' | 'gondozas' | 'egeszseg' | 'alvas' | 'kritikus' | 'eletut' | 'szabadsag';

export interface VacationEntry extends Interval {
  id: string;
  petId: string;
}

export interface Profile {
  userId: string;
  createdAt: number;
  platform: string;
  appVersion: string;
  locale: string;
  tz: string;
  schedule: Schedule;
  daycare: Daycare;
  autoLights: boolean;
  notify: { overrides: Partial<Record<NotifyCategory, boolean>>; digestTimes: number[] };
  providers: Partial<Record<'apple' | 'google', string>>;
  entitlements: { full: boolean; cosmetics: string[]; updatedAt: number | null };
  perks: string[];
  activePetId: string | null;
  vacations: VacationEntry[];
  installHash: string | null;
  deletionCode: string | null;
}

export interface PetRecord {
  userId: string;
  state: PetState;
  /** Az utolsó szerveroldali léptetés ideje (a push-tartalék frissességéhez). */
  syncedAt: number;
}

export const keys = {
  user: (id: string) => `u:${id}`,
  userPets: (id: string) => `u:${id}:pets`,
  auth: (provider: string, sub: string) => `auth:${provider}:${sub}`,
  install: (hash: string) => `auth:install:${hash}`,
  pet: (id: string) => `p:${id}`,
  petRev: (id: string) => `p:${id}:v`,
  petDue: (id: string) => `p:${id}:due`,
  memorial: (id: string) => `mem:${id}`,
  duePush: 'due:push',
  pushTokens: (userId: string) => `push:${userId}`,
  trial: (userId: string) => `trial:${userId}`,
  trialFp: (hash: string) => `trial:fp:${hash}`,
  promo: (code: string) => `promo:used:${code}`,
  action: (petId: string, actionId: string) => `act:${petId}:${actionId}`,
  rcEvent: (id: string) => `rc:evt:${id}`,
  deletionCode: (code: string) => `delcode:${code}`,
  flags: 'sys:flags',
  incidents: 'sys:incidents',
};

export function defaultProfile(userId: string, now: number, init: Partial<Profile> = {}): Profile {
  return {
    userId,
    createdAt: now,
    platform: 'android',
    appVersion: '0.0.0',
    locale: 'hu-HU',
    tz: 'Europe/Budapest',
    schedule: { bedMin: 23 * 60, wakeMin: 7 * 60 },
    daycare: { enabled: false, startMin: 8 * 60 + 30, endMin: 17 * 60, days: [false, true, true, true, true, true, false] },
    autoLights: true,
    notify: { overrides: {}, digestTimes: [8 * 60, 12 * 60 + 30, 18 * 60 + 30] },
    providers: {},
    entitlements: { full: false, cosmetics: [], updatedAt: null },
    perks: [],
    activePetId: null,
    vacations: [],
    installHash: null,
    deletionCode: null,
    ...init,
  };
}

export async function getProfile(kv: Kv, userId: string): Promise<Profile | null> {
  const raw = await kv.get(keys.user(userId));
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export async function saveProfile(kv: Kv, profile: Profile): Promise<void> {
  await kv.set(keys.user(profile.userId), JSON.stringify(profile));
}

export async function getPet(kv: Kv, petId: string): Promise<{ record: PetRecord; rev: number } | null> {
  const [raw, rev] = await kv.mget([keys.pet(petId), keys.petRev(petId)]);
  if (!raw) return null;
  return { record: JSON.parse(raw) as PetRecord, rev: Number(rev ?? 0) };
}

export async function savePet(kv: Kv, petId: string, record: PetRecord, expectedRev: number): Promise<boolean> {
  return kv.casSet(keys.pet(petId), keys.petRev(petId), expectedRev, JSON.stringify(record));
}

export async function getMemorial(kv: Kv, petId: string): Promise<MemorialEntry | null> {
  const raw = await kv.get(keys.memorial(petId));
  return raw ? (JSON.parse(raw) as MemorialEntry) : null;
}

export async function saveMemorial(kv: Kv, entry: MemorialEntry): Promise<void> {
  await kv.set(keys.memorial(entry.id), JSON.stringify(entry));
}

export interface Flags {
  deathEnabled: boolean;
  minAppVersion: string | null;
}

/** Rendszerflag-ek JSON-dokumentumként (a PRD hash-t ír; a tartalom azonos). */
export async function getFlags(kv: Kv): Promise<Flags> {
  const raw = await kv.get(keys.flags);
  const parsed = raw ? (JSON.parse(raw) as Partial<Flags>) : {};
  return { deathEnabled: parsed.deathEnabled !== false, minAppVersion: parsed.minAppVersion ?? null };
}

/** Szolgáltatáskiesések JSON-listaként (PRD 8.5). */
export async function getIncidents(kv: Kv): Promise<Interval[]> {
  const raw = await kv.get(keys.incidents);
  return raw ? (JSON.parse(raw) as Interval[]) : [];
}
