// A PRD 7.13 idővonalai kötelező golden tesztek (FR-07). A percrács miatt
// az analitikus időpontoktól néhány perc eltérés megengedett. Az elvárt
// értékek a 7.4 szabályát is tartalmazzák (betegség alatt a boldogság ×1,5
// sebességgel fogy).

import { advance } from '..';
import type { SimEvent } from '..';
import { ctx, H, makePet, minutesFromT0, T0 } from './helpers';

function first(events: SimEvent[], pred: (e: SimEvent) => boolean): number {
  const e = events.find(pred);
  if (!e) throw new Error('esemény nem található');
  return minutesFromT0(e.t);
}

function expectNear(actual: number, expected: number, tolerance: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

describe('PRD 7.13 idővonal 1: Klasszikus, Felnőtt', () => {
  const pet = makePet('adult', 'kiegyensulyozott', 'klasszikus');
  const { state, events } = advance(pet, ctx, T0 + 40 * H);

  it('éhség-hívás 5:33-kor', () => {
    expectNear(first(events, (e) => e.type === 'call' && e.call === 'hunger'), 5 * 60 + 33, 2);
  });

  it('betegség 6:00-kor (a kaki 2 órája a képernyőn)', () => {
    expectNear(first(events, (e) => e.type === 'sick'), 6 * 60, 1);
  });

  it('első gondozási hiba 6:33-kor', () => {
    expectNear(first(events, (e) => e.type === 'mistake' && e.mistake === 'hunger'), 6 * 60 + 33, 2);
  });

  it('boldogság-hívás 6:27-kor (betegség alatt gyorsabb fogyás)', () => {
    expectNear(first(events, (e) => e.type === 'call' && e.call === 'happiness'), 6 * 60 + 27, 2);
  });

  it('„Gyengélkedik” 10:23-kor', () => {
    expectNear(first(events, (e) => e.type === 'weak'), 10 * 60 + 23, 3);
  });

  it('Kritikus 14:41-kor (faliórában az 1. nap 21:41)', () => {
    expectNear(first(events, (e) => e.type === 'critical'), 14 * 60 + 41, 3);
  });

  it('halál a 2. nap 17:41-kor, az alvás nem számít bele', () => {
    expectNear(first(events, (e) => e.type === 'died'), 24 * 60 + 10 * 60 + 41, 4);
    expect(state.status).toBe('dead');
    expect(state.deathCause).toBe('elhanyagolas');
  });

  it('figyelmeztetés 4 és 1 órával a halál előtt', () => {
    const died = first(events, (e) => e.type === 'died');
    const warns = events.filter((e) => e.type === 'criticalWarn').map((e) => minutesFromT0(e.t));
    expect(warns).toHaveLength(2);
    expectNear(died - warns[0], 4 * 60, 1);
    expectNear(died - warns[1], 60, 1);
  });

  it('alvás alatt semmi nem történik', () => {
    const night = events.filter((e) => {
      const m = minutesFromT0(e.t);
      return m > 16 * 60 && m < 24 * 60;
    });
    expect(night.map((e) => e.type).every((t) => t === 'fellAsleep' || t === 'mistake')).toBe(true);
  });
});

describe('PRD 7.13 idővonal 2: Klasszikus, Gyerek', () => {
  const pet = makePet('child', 'gomboc', 'klasszikus');
  const { events } = advance(pet, ctx, T0 + 40 * H);

  it('éhség-hívás 4:10, Kritikus 12:40, halál 24:40 számlálható órában', () => {
    expectNear(first(events, (e) => e.type === 'call' && e.call === 'hunger'), 4 * 60 + 10, 2);
    expectNear(first(events, (e) => e.type === 'critical'), 12 * 60 + 40, 3);
    // 12:40 számlálható = 19:40 faliórában; 23:00-ig 200 perc, a maradék 520 perc 07:00-tól.
    expectNear(first(events, (e) => e.type === 'died'), 24 * 60 + 8 * 60 + 40, 4);
  });
});

describe('PRD 7.13 idővonal 3: Alap, Felnőtt', () => {
  const pet = makePet('adult', 'kiegyensulyozott', 'alap');
  const { state, events } = advance(pet, ctx, T0 + 60 * H);

  it('betegség 8:00, éhség-hívás 8:20, boldogság-hívás 9:20', () => {
    expectNear(first(events, (e) => e.type === 'sick'), 8 * 60, 1);
    expectNear(first(events, (e) => e.type === 'call' && e.call === 'hunger'), 8 * 60 + 20, 2);
    expectNear(first(events, (e) => e.type === 'call' && e.call === 'happiness'), 9 * 60 + 20, 2);
  });

  it('három gondozási hiba (plafon), utána nincs több', () => {
    const mistakes = events.filter((e) => e.type === 'mistake').map((e) => minutesFromT0(e.t));
    expect(mistakes).toHaveLength(3);
    expectNear(mistakes[0], 11 * 60 + 20, 2);
    expectNear(mistakes[1], 12 * 60 + 20, 2);
    // 17:20 számlálható = a 2. nap 08:20 faliórában.
    expectNear(mistakes[2], 24 * 60 + 60 + 20, 2);
    expect(events.some((e) => e.type === 'mistakeWaived')).toBe(true);
  });

  it('Kritikus a 2. nap 16:23-kor, Nagyi a 3. nap 12:23-kor, halál nincs', () => {
    expectNear(first(events, (e) => e.type === 'critical'), 24 * 60 + 9 * 60 + 23, 4);
    expectNear(first(events, (e) => e.type === 'nagyi'), 48 * 60 + 5 * 60 + 23, 5);
    expect(events.some((e) => e.type === 'died')).toBe(false);
    expect(state.status).toBe('nagyi');
  });
});
