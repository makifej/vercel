// IANA-időzóna szerinti helyi idő a szimulációnak (PRD 7.9). A szerver UTC-ben
// fut; az eltolást órás gyorsítótárral számoljuk, így a DST-váltás pontos.

import { fixedOffsetLocal, type LocalTime } from './sim';

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function offsetMinutes(fmt: Intl.DateTimeFormat, ms: number): number {
  const parts = fmt.formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = get('hour') % 24;
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60_000);
}

export function zoneLocalTime(tz: string): (ms: number) => LocalTime {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: isValidTimeZone(tz) ? tz : 'UTC',
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
  const cache = new Map<number, number>();
  return (ms: number) => {
    const hour = Math.floor(ms / 3_600_000);
    let off = cache.get(hour);
    if (off === undefined) {
      off = offsetMinutes(fmt, hour * 3_600_000);
      if (cache.size > 512) cache.clear();
      cache.set(hour, off);
    }
    return fixedOffsetLocal(ms, off);
  };
}

/** „HH:MM” a nap perceire; érvénytelen formátumnál null. */
export function parseHhMm(v: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(v);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function iso(ms: number): string {
  return new Date(ms).toISOString();
}
