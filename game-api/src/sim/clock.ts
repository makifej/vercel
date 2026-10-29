// Naptári segédek. A napirend helyi időben értendő; az átváltást egy
// beinjektált függvény végzi, így a tesztek rögzített időzónával futnak.

import { DAY_MIN, SLEEPY_BEFORE_BED_MIN } from './params';
import type { Daycare, LocalTime, Schedule } from './types';

/** Az eszköz időzónáját használó átváltás; órás gyorsítótárral (DST-helyes). */
export function deviceLocalTime(): (ms: number) => LocalTime {
  let cachedHour = Number.NaN;
  let cachedOffsetMin = 0;
  return (ms: number) => {
    const hour = Math.floor(ms / 3_600_000);
    if (hour !== cachedHour) {
      cachedHour = hour;
      cachedOffsetMin = -new Date(ms).getTimezoneOffset();
    }
    return fixedOffsetLocal(ms, cachedOffsetMin);
  };
}

/** Rögzített eltolású átváltás (tesztekhez, illetve gyorsítótárazott DST-eltoláshoz). */
export function fixedOffsetLocal(ms: number, offsetMin: number): LocalTime {
  const localMin = Math.floor(ms / 60_000) + offsetMin;
  const minuteOfDay = ((localMin % DAY_MIN) + DAY_MIN) % DAY_MIN;
  const dayIndex = Math.floor(localMin / DAY_MIN);
  // 1970-01-01 csütörtök volt (getDay = 4).
  const weekday = (((dayIndex + 4) % 7) + 7) % 7;
  return { minuteOfDay, weekday };
}

export function inWindow(minuteOfDay: number, start: number, end: number): boolean {
  const s = ((start % DAY_MIN) + DAY_MIN) % DAY_MIN;
  const e = ((end % DAY_MIN) + DAY_MIN) % DAY_MIN;
  if (s === e) return false;
  return s < e ? minuteOfDay >= s && minuteOfDay < e : minuteOfDay >= s || minuteOfDay < e;
}

export function windowLength(start: number, end: number): number {
  return (((end - start) % DAY_MIN) + DAY_MIN) % DAY_MIN;
}

/** A kedvenc alvásablaka: lefekvés előtt 30 perccel kezdődik, ébredéskor ér véget. */
export function petSleepStart(schedule: Schedule): number {
  return (((schedule.bedMin - SLEEPY_BEFORE_BED_MIN) % DAY_MIN) + DAY_MIN) % DAY_MIN;
}

export function isPetSleepTime(local: LocalTime, schedule: Schedule): boolean {
  return inWindow(local.minuteOfDay, petSleepStart(schedule), schedule.wakeMin);
}

/** Csendes órák: a játékos saját alvásideje (PRD 9.3). */
export function isQuietTime(local: LocalTime, schedule: Schedule): boolean {
  return inWindow(local.minuteOfDay, schedule.bedMin, schedule.wakeMin);
}

export function petSleepMinutes(schedule: Schedule): number {
  return windowLength(petSleepStart(schedule), schedule.wakeMin);
}

export function petAwakeMinutes(schedule: Schedule): number {
  return DAY_MIN - petSleepMinutes(schedule);
}

/**
 * Napközi aktív-e. A módonkénti napi felső korlátot az ablak elejétől
 * számítva érvényesítjük; az ablak az indulás napjához tartozik.
 */
export function isDaycareTime(local: LocalTime, daycare: Daycare, maxMin: number): boolean {
  if (!daycare.enabled) return false;
  const len = Math.min(windowLength(daycare.startMin, daycare.endMin), maxMin);
  if (len <= 0) return false;
  const sinceStart = (((local.minuteOfDay - daycare.startMin) % DAY_MIN) + DAY_MIN) % DAY_MIN;
  if (sinceStart >= len) return false;
  const startedYesterday = local.minuteOfDay < daycare.startMin;
  const day = startedYesterday ? (local.weekday + 6) % 7 : local.weekday;
  return Boolean(daycare.days[day]);
}

export function formatMinuteOfDay(minuteOfDay: number): string {
  const m = ((minuteOfDay % DAY_MIN) + DAY_MIN) % DAY_MIN;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
