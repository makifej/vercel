// A szerver által használt kiegészítések: vészleállító, kiesés-jóváírás, minijáték-seed.

import { advance, directionRounds, MIN, numberRounds, scoreMinigame } from '..';
import { ctx, H, makePet, minutesFromT0, T0 } from './helpers';

describe('vészleállító (holdDeath)', () => {
  it('a Klasszikus kedvenc nem hal meg, Kritikus állapotban marad, majd kikapcsoláskor meghal', () => {
    const pet = makePet('adult', 'ragyogo', 'klasszikus');
    const held = advance(pet, { ...ctx, holdDeath: true }, T0 + 36 * H);
    expect(held.state.status).toBe('alive');
    expect(held.state.critical).not.toBeNull();
    expect(held.events.some((e) => e.type === 'died')).toBe(false);
    const released = advance(held.state, ctx, T0 + 36 * H + 2 * MIN);
    expect(released.state.status).toBe('dead');
  });

  it('Alap módban nincs hatása, a kedvenc Nagyihoz kerül', () => {
    const pet = makePet('adult', 'ragyogo', 'alap');
    expect(advance(pet, { ...ctx, holdDeath: true }, T0 + 60 * H).state.status).toBe('nagyi');
  });
});

describe('szolgáltatáskiesés (frozen)', () => {
  it('a kiesés alatt semmi nem történik, utána a szimuláció folytatódik', () => {
    const pet = makePet('adult', 'ragyogo', 'klasszikus');
    const frozen = [{ start: T0 + 2 * H, end: T0 + 12 * H }];
    const { state, events } = advance(pet, { ...ctx, frozen }, T0 + 13 * H);
    expect(state.lifeMin).toBe(3 * 60);
    const hunger = events.find((e) => e.type === 'call' && e.call === 'hunger');
    expect(hunger).toBeUndefined();
    const later = advance(pet, { ...ctx, frozen }, T0 + 20 * H).events.find((e) => e.type === 'call' && e.call === 'hunger');
    expect(minutesFromT0(later!.t)).toBeGreaterThan(12 * 60);
  });
});

describe('minijáték-seed', () => {
  it('determinisztikus fordulók', () => {
    expect(directionRounds(123)).toEqual(directionRounds(123));
    const nums = numberRounds(99);
    expect(nums).toHaveLength(6);
    for (let i = 1; i < nums.length; i++) expect(nums[i]).not.toBe(nums[i - 1]);
  });

  it('pontos tippekkel győzelem, érvénytelen tippsorozat elutasítva', () => {
    const dirs = directionRounds(7);
    expect(scoreMinigame('merre', 7, dirs)).toEqual({ hits: 5, won: true });
    const wrong = dirs.map((d) => (d === 'bal' ? 'jobb' : 'bal'));
    expect(scoreMinigame('merre', 7, wrong)).toEqual({ hits: 0, won: false });
    expect(scoreMinigame('merre', 7, ['bal'])).toBeNull();
    const nums = numberRounds(7);
    const guesses = nums.slice(1).map((n, i) => (n > nums[i] ? 'nagyobb' : 'kisebb'));
    expect(scoreMinigame('nagyobb', 7, guesses)?.won).toBe(true);
    expect(scoreMinigame('nagyobb', 7, ['x', 'x', 'x', 'x', 'x'])).toBeNull();
  });
});
