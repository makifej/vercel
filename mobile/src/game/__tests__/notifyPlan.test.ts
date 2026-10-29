import { MIN, isQuietTime } from '../../sim';
import { ctx, H, makePet, T0 } from '../../sim/__tests__/helpers';
import { emptySave } from '../save';
import { DAILY_CAP, FORBIDDEN_PHRASES, MAX_PENDING, planNotifications } from '../notifyPlan';

const settings = emptySave().settings;

describe('értesítési terv', () => {
  it('legfeljebb 8 függő értesítés, időrendben, csendes órán kívül', () => {
    for (const mode of ['alap', 'klasszikus'] as const) {
      const plan = planNotifications(makePet('adult', 'ragyogo', mode), ctx, T0, settings);
      expect(plan.length).toBeGreaterThan(0);
      expect(plan.length).toBeLessThanOrEqual(MAX_PENDING);
      const times = plan.map((p) => p.at);
      expect([...times].sort((a, b) => a - b)).toEqual(times);
      for (const p of plan) {
        if (!p.critical) expect(isQuietTime(ctx.local(p.at), makePet('adult', 'ragyogo', mode).schedule)).toBe(false);
      }
    }
  });

  it('Alap módban napi összesítő, Klasszikusban eseményalapú hívás', () => {
    const alap = planNotifications(makePet('adult', 'ragyogo', 'alap'), ctx, T0, settings);
    expect(alap.some((p) => p.category === 'osszesito')).toBe(true);
    expect(alap.some((p) => p.category === 'gondozas')).toBe(false);
    const klass = planNotifications(makePet('adult', 'ragyogo', 'klasszikus'), ctx, T0, settings);
    expect(klass.some((p) => p.category === 'gondozas')).toBe(true);
    expect(klass.some((p) => p.category === 'osszesito')).toBe(false);
  });

  it('a nem kritikus értesítések napi kerete érvényesül', () => {
    const plan = planNotifications(makePet('child', 'gomboc', 'klasszikus'), ctx, T0, settings);
    const byDay = new Map<number, number>();
    for (const p of plan.filter((x) => !x.critical)) {
      const local = ctx.local(p.at);
      const key = Math.floor((p.at - local.minuteOfDay * MIN) / (24 * H));
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    for (const n of byDay.values()) expect(n).toBeLessThanOrEqual(DAILY_CAP.klasszikus);
  });

  it('a Klasszikus kritikus lánc értesít, a halálról nincs értesítés', () => {
    const pet = makePet('adult', 'ragyogo', 'klasszikus', { hunger: 0, happiness: 0, health: 5 });
    const plan = planNotifications(pet, ctx, T0, settings);
    const critical = plan.filter((p) => p.critical);
    expect(critical.length).toBeGreaterThanOrEqual(1);
    expect(critical.length).toBeLessThanOrEqual(3);
    expect(plan.some((p) => /meghalt|halál/i.test(p.body))).toBe(false);
  });

  it('nincs bűntudatkeltő vagy sürgető szöveg', () => {
    for (const mode of ['alap', 'klasszikus'] as const) {
      const pet = makePet('adult', 'ragyogo', mode, { hunger: 10, happiness: 10, health: 20 });
      for (const p of planNotifications(pet, ctx, T0, settings)) {
        for (const phrase of FORBIDDEN_PHRASES) expect(p.body.includes(phrase)).toBe(false);
      }
    }
  });

  it('kikapcsolt kategória nem kerül a tervbe', () => {
    const off = { ...settings, notifyOverrides: { osszesito: false, egeszseg: false } };
    const plan = planNotifications(makePet('adult', 'ragyogo', 'alap'), ctx, T0, off);
    expect(plan.some((p) => p.category === 'osszesito' || p.category === 'egeszseg')).toBe(false);
  });
});
