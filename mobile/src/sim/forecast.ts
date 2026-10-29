// Előrejelzés: ugyanaz a léptető fut beavatkozás nélkül előre. Ebből jön a
// „következő ellenőrzés legkésőbb” időpont és a helyi értesítések terve.

import { advanceInPlace, cloneState } from './engine';
import { MIN } from './params';
import type { PetState, SimContext, SimEvent } from './types';

export function forecast(p: PetState, ctx: SimContext, from: number, horizonMs: number): SimEvent[] {
  const s = cloneState(p);
  const events: SimEvent[] = [];
  advanceInPlace(s, ctx, from, []);
  advanceInPlace(s, ctx, from + horizonMs, events);
  return events;
}

export function stateAt(p: PetState, ctx: SimContext, t: number): PetState {
  const s = cloneState(p);
  advanceInPlace(s, ctx, t, []);
  return s;
}

const ATTENTION: SimEvent['type'][] = ['call', 'sick', 'critical', 'nagyi', 'died'];

/**
 * A legkorábbi időpont, amikor beavatkozás kell (hívás, betegség, kritikus
 * állapot). Ha jelenleg is van nyitott ügy, az aktuális időt adja.
 */
export function nextAttention(p: PetState, ctx: SimContext, now: number, horizonMs = 48 * 60 * MIN): number | null {
  if (p.status !== 'alive') return null;
  if (needsAttentionNow(p)) return now;
  const ev = forecast(p, ctx, now, horizonMs).find(
    (e) => ATTENTION.includes(e.type) && !(e.type === 'call' && e.call === 'misbehave'),
  );
  return ev ? ev.t : null;
}

export function needsAttentionNow(p: PetState): boolean {
  return (
    p.status === 'alive' &&
    (p.calls.some((c) => c.type !== 'misbehave') || p.sick !== null || p.critical !== null || p.poops.length >= 3)
  );
}
