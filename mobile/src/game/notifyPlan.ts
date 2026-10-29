// Helyi értesítések terve a determinisztikus előrejelzésből (PRD 9). Tiszta
// függvény: a tényleges ütemezést a notifications.ts végzi.

import { DAY_MIN, forecast, isQuietTime, LIFESPAN, MIN, stateAt } from '../sim';
import type { AdultForm, PetState, SimContext, SimEvent } from '../sim';
import { notifyEnabled, type NotifyCategory, type Settings } from './save';
import { hearts, STAGE_NAMES } from './texts';

export interface PlannedNotification {
  key: string;
  at: number;
  category: NotifyCategory;
  critical: boolean;
  title: string;
  body: string;
}

export const MAX_PENDING = 8;
export const DAILY_CAP = { alap: 3, klasszikus: 4 } as const;
const HORIZON_MS = 48 * 60 * MIN;
const SICK_NOTIFY_AFTER_MS = 2 * 60 * MIN;

export function planNotifications(
  pet: PetState | null,
  ctx: SimContext,
  now: number,
  settings: Settings,
): PlannedNotification[] {
  if (!pet || pet.status === 'dead') return [];
  const name = pet.name;
  const mode = pet.mode;
  const on = (c: NotifyCategory) => notifyEnabled(settings, mode, c);
  const out: PlannedNotification[] = [];
  const add = (n: Omit<PlannedNotification, 'key'>) => {
    if (n.at <= now + MIN) return;
    out.push({ ...n, key: `${n.category}:${n.at}` });
  };

  if (pet.vacation && on('szabadsag')) {
    const end = pet.vacation.end;
    const offsets = mode === 'klasszikus' ? [24 * 60, 2 * 60] : [24 * 60];
    for (const off of offsets) {
      add({
        at: end - off * MIN,
        category: 'szabadsag',
        critical: false,
        title: 'Szabadság',
        body: `A szabadság ${off >= 24 * 60 ? 'holnap' : 'két óra múlva'} véget ér. Ha még úton vagy, meghosszabbíthatod.`,
      });
    }
  }

  if (pet.status === 'alive' || pet.status === 'egg') {
    const events = forecast(pet, ctx, now, HORIZON_MS);
    for (const e of events) addFromEvent(e, pet, ctx, add, on);

    if (on('osszesito') && pet.status === 'alive') {
      const firstStop = events.find((e) => e.type === 'nagyi' || e.type === 'died');
      const limit = firstStop ? firstStop.t : now + HORIZON_MS;
      for (let t = Math.ceil(now / MIN) * MIN + MIN; t < limit; t += MIN) {
        if (!settings.digestTimes.includes(ctx.local(t).minuteOfDay)) continue;
        const s = stateAt(pet, ctx, t);
        add({ at: t, category: 'osszesito', critical: false, title: name, body: digestText(s) });
      }
    }
  }

  return applyLimits(out, pet, ctx);
}

function addFromEvent(
  e: SimEvent,
  pet: PetState,
  ctx: SimContext,
  add: (n: Omit<PlannedNotification, 'key'>) => void,
  on: (c: NotifyCategory) => boolean,
): void {
  const name = pet.name;
  const classic = pet.mode === 'klasszikus';
  switch (e.type) {
    case 'call':
      if (!on('gondozas') || e.call === 'misbehave') return;
      add({
        at: e.t,
        category: 'gondozas',
        critical: false,
        title: name,
        body: e.call === 'hunger' ? `${name} megéhezett. Egy-két étel rendbe hozza.` : `${name} unatkozik. Egy kis játék jól esne neki.`,
      });
      return;
    case 'sick': {
      if (!on('egeszseg')) return;
      const at = e.t + SICK_NOTIFY_AFTER_MS;
      if (isQuietTime(ctx.local(at), pet.schedule)) return;
      add({ at, category: 'egeszseg', critical: false, title: name, body: `${name} gyengélkedik. Egy adag gyógyszer segít neki.` });
      return;
    }
    case 'fellAsleep':
      if (!on('alvas') || (!classic && pet.autoLights)) return;
      add({ at: e.t, category: 'alvas', critical: false, title: name, body: `${name} elálmosodott. Villanyoltás a lefekvésedig.` });
      return;
    case 'critical':
      if (!on('kritikus')) return;
      add({
        at: e.t,
        category: 'kritikus',
        critical: true,
        title: name,
        body: classic
          ? `${name} állapota kritikus. Klasszikus módban kb. 12 óra van hátra, az alvásidő nem számít bele. Ha most nem alkalmas, Alap módra válthatsz.`
          : `${name} állapota kritikus. Ha a következő órákban nem érsz rá, Nagyi vigyáz rá.`,
      });
      return;
    case 'criticalWarn': {
      if (!on('kritikus')) return;
      const hours = Math.round((e.remainingMin ?? 0) / 60);
      add({
        at: e.t,
        category: 'kritikus',
        critical: true,
        title: name,
        body: classic
          ? `${name} állapota még kritikus. Kb. ${hours} óra van hátra.`
          : `${name} állapota még kritikus. Kb. ${hours} óra múlva Nagyi vigyáz rá.`,
      });
      return;
    }
    case 'nagyi':
      if (!on('kritikus')) return;
      add({ at: e.t, category: 'kritikus', critical: true, title: name, body: `${name} átment Nagyihoz, amíg ráérsz. Jól van, és vár.` });
      return;
    case 'evolved':
      if (!on('eletut')) return;
      add({
        at: e.t,
        category: 'eletut',
        critical: false,
        title: name,
        body: `${name} ${STAGE_NAMES[e.stage ?? 'child']} lett. Megnézheted, mivé fejlődött.`,
      });
      return;
    case 'senior': {
      if (!on('eletut')) return;
      const form = (e.form ?? pet.form) as AdultForm | null;
      const days = form && form in LIFESPAN ? LIFESPAN[form].senior : 4;
      add({
        at: e.t,
        category: 'eletut',
        critical: false,
        title: name,
        body: `${name} belépett az idős korba. Még nagyjából ${days} napot tölthettek együtt.`,
      });
      return;
    }
    default:
      return;
  }
}

export function digestText(s: PetState): string {
  if (s.status === 'nagyi') return `${s.name} Nagyinál van. Jól van, és vár.`;
  if (s.status !== 'alive') return `${s.name} vár rád.`;
  const parts: string[] = [];
  parts.push(`Jóllakottság: ${hearts(s.hunger)} szív`);
  parts.push(`boldogság: ${hearts(s.happiness)} szív`);
  if (s.poops.length > 0) parts.push(s.poops.length === 1 ? 'egy kaki vár takarításra' : `${s.poops.length} kaki vár takarításra`);
  if (s.sick) parts.push('beteg');
  const status = s.critical
    ? `${s.name} állapota kritikus.`
    : s.calls.length > 0 || s.sick || s.poops.length >= 2
      ? `${s.name} figyelmet kér.`
      : `${s.name} jól van.`;
  return `${status} ${parts.join(', ')}.`;
}

/** Csendes órák, napi keret, kritikus epizódonként legfeljebb 3, összesen legfeljebb 8. */
function applyLimits(list: PlannedNotification[], pet: PetState, ctx: SimContext): PlannedNotification[] {
  const sorted = [...list].sort((a, b) => a.at - b.at);
  const perDay = new Map<number, number>();
  const cap = DAILY_CAP[pet.mode];
  const seen = new Set<string>();
  const out: PlannedNotification[] = [];
  let criticalCount = 0;
  for (const n of sorted) {
    if (seen.has(n.key)) continue;
    seen.add(n.key);
    const local = ctx.local(n.at);
    if (!n.critical && isQuietTime(local, pet.schedule)) continue;
    if (n.critical) {
      if (criticalCount >= 3) continue;
      criticalCount++;
    } else {
      const dayKey = Math.floor((n.at - local.minuteOfDay * MIN) / (DAY_MIN * MIN));
      const used = perDay.get(dayKey) ?? 0;
      if (used >= cap) continue;
      perDay.set(dayKey, used + 1);
    }
    out.push(n);
    if (out.length >= MAX_PENDING) break;
  }
  return out;
}

/** Tiltott minták (PRD 9.4); a teszt ellenőrzi, hogy egyik szöveg sem tartalmazza. */
export const FORBIDDEN_PHRASES = ['sír', 'elhagytad', 'Ne hagyd', 'Utolsó esély', 'nem szereted', 'nem érdekel', '!'];
