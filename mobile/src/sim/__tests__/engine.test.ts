import {
  advance,
  applyAction,
  bringHomeFromNagyi,
  createEgg,
  createSuccessorEgg,
  downgradeToAlap,
  endVacation,
  forceStage,
  memorialFromPet,
  MIN,
  nextAttention,
  requestScheduleChange,
  startVacation,
  vacationBudgetUsedDays,
  warmEgg,
} from '..';
import type { PetState } from '..';
import { ctx, H, makePet, minutesFromT0, SCHEDULE, T0 } from './helpers';

const DAY = 24 * H;

describe('determinizmus', () => {
  it('a felosztás nem változtat az eredményen', () => {
    const pet = makePet('child', 'gomboc', 'klasszikus', { scheduledMisbehave: [90, 400], scheduledSickness: [300] });
    const once = advance(pet, ctx, T0 + 30 * H);
    let s: PetState = pet;
    const events = [];
    let t = T0;
    const steps = [7, 13, 61, 5, 240, 1, 600, 30];
    let i = 0;
    while (t < T0 + 30 * H) {
      t = Math.min(T0 + 30 * H, t + steps[i++ % steps.length] * MIN + 17_000);
      const r = advance(s, ctx, t);
      s = r.state;
      events.push(...r.events);
    }
    expect(s).toEqual(once.state);
    expect(events).toEqual(once.events);
  });

  it('visszafelé járó óra nem változtat az állapoton', () => {
    const pet = advance(makePet('adult', 'ragyogo', 'alap'), ctx, T0 + 3 * H).state;
    const back = advance(pet, ctx, T0 + H);
    expect(back.state).toEqual(pet);
    expect(back.events).toHaveLength(0);
  });
});

describe('alvás', () => {
  it('alvásablakban nincs fogyás, kaki és betegség', () => {
    const pet = makePet('adult', 'ragyogo', 'klasszikus');
    const atSleep = advance(pet, ctx, T0 + 16 * H + MIN).state;
    expect(atSleep.asleep).toBe(true);
    const beforeWake = advance(atSleep, ctx, T0 + 24 * H - MIN).state;
    expect(beforeWake.hunger).toBe(atSleep.hunger);
    expect(beforeWake.happiness).toBe(atSleep.happiness);
    expect(beforeWake.poops).toEqual(atSleep.poops);
    expect(beforeWake.health).toBe(atSleep.health);
    expect(beforeWake.energy).toBeGreaterThan(atSleep.energy);
  });

  it('ébredéskor a kor egy évvel nő', () => {
    const pet = makePet('adult', 'ragyogo', 'alap', { ageYears: 3 });
    const { state, events } = advance(pet, ctx, T0 + 25 * H);
    expect(state.ageYears).toBe(4);
    expect(events.some((e) => e.type === 'woke')).toBe(true);
  });

  it('a villanyoltás elmulasztása Klasszikus módban 30 perc után gondozási hiba', () => {
    const pet = makePet('adult', 'ragyogo', 'klasszikus');
    const atSleep = advance(pet, ctx, T0 + 16 * H + MIN).state;
    const lightsOff = applyAction(atSleep, ctx, { type: 'lights' }, T0 + 16 * H + 5 * MIN).state;
    const later = advance(lightsOff, ctx, T0 + 17 * H);
    expect(later.events.filter((e) => e.type === 'mistake' && e.mistake === 'lights')).toHaveLength(0);
    const neglected = advance(atSleep, ctx, T0 + 17 * H);
    expect(neglected.events.filter((e) => e.type === 'mistake' && e.mistake === 'lights')).toHaveLength(1);
  });
});

describe('tojás és bébi', () => {
  it('a tojás a melegítés után 5 perccel kel, a bébi 65 perc után Gyerek', () => {
    const egg = createEgg({
      id: 'e',
      name: 'Pötty',
      mode: 'alap',
      now: T0,
      schedule: SCHEDULE,
      daycare: { enabled: false, startMin: 0, endMin: 0, days: [] },
      autoLights: true,
      seed: 1,
    });
    expect(advance(egg, ctx, T0 + H).state.status).toBe('egg');
    const warm = warmEgg(egg, T0);
    const { state, events } = advance(warm, ctx, T0 + 5 * MIN + 65 * MIN);
    expect(minutesFromT0(events.find((e) => e.type === 'hatched')!.t)).toBe(5);
    const evolved = events.find((e) => e.type === 'evolved');
    expect(minutesFromT0(evolved!.t)).toBe(70);
    expect(state.stage).toBe('child');
    expect(state.form).toBe('gomboc');
  });
});

describe('napközi', () => {
  it('a jelzők nem esnek 1 szív alá, nincs gondozási hiba, a végén takarítás', () => {
    const days = [true, true, true, true, true, true, true];
    const pet = makePet('adult', 'ragyogo', 'klasszikus', {
      hunger: 40,
      happiness: 40,
      daycare: { enabled: true, startMin: 8 * 60, endMin: 16 * 60, days },
      lastMs: T0 + H,
    });
    const { state, events } = advance(pet, ctx, T0 + 8 * H + 30 * MIN);
    expect(state.inDaycare).toBe(true);
    expect(state.hunger).toBeGreaterThanOrEqual(25);
    expect(state.happiness).toBeGreaterThanOrEqual(25);
    expect(events.some((e) => e.type === 'mistake')).toBe(false);
    const after = advance(state, ctx, T0 + 9 * H + 5 * MIN);
    expect(after.state.inDaycare).toBe(false);
    expect(after.events.some((e) => e.type === 'daycareEnd')).toBe(true);
    expect(after.state.poops).toHaveLength(0);
  });

  it('Klasszikus módban legfeljebb 8 óra', () => {
    const days = [true, true, true, true, true, true, true];
    const pet = makePet('adult', 'ragyogo', 'klasszikus', {
      daycare: { enabled: true, startMin: 7 * 60, endMin: 19 * 60, days },
    });
    const at = advance(pet, ctx, T0 + 8 * H + 30 * MIN).state;
    expect(at.inDaycare).toBe(false);
  });
});

describe('gondozási műveletek', () => {
  it('etetés lezárja az éhség-hívást, telítettségnél elutasít', () => {
    const pet = makePet('adult', 'ragyogo', 'alap', { hunger: 0.05 });
    const called = advance(pet, ctx, T0 + 2 * MIN).state;
    expect(called.calls.some((c) => c.type === 'hunger')).toBe(true);
    const fed = applyAction(called, ctx, { type: 'feed' }, T0 + 3 * MIN);
    expect(fed.rejected).toBeNull();
    expect(fed.state.calls.some((c) => c.type === 'hunger')).toBe(false);
    expect(fed.state.hunger).toBeCloseTo(25, 0);
    const full = applyAction({ ...fed.state, hunger: 100 }, ctx, { type: 'feed' }, T0 + 4 * MIN);
    expect(full.rejected).toBe('full');
  });

  it('alvó kedvenc nem eszik', () => {
    const asleep = advance(makePet('adult', 'ragyogo', 'alap'), ctx, T0 + 16 * H + 2 * MIN).state;
    expect(applyAction(asleep, ctx, { type: 'feed' }, T0 + 16 * H + 3 * MIN).rejected).toBe('asleep');
  });

  it('Klasszikus módban 2 adag gyógyszer kell, legalább 1 perc különbséggel', () => {
    const pet = makePet('adult', 'ragyogo', 'klasszikus', {
      sick: { cause: 'utemezett', doses: 0, lastDoseMs: null, awakeMin: 0 },
    });
    const d1 = applyAction(pet, ctx, { type: 'medicine' }, T0 + MIN);
    expect(d1.state.sick?.doses).toBe(1);
    expect(applyAction(d1.state, ctx, { type: 'medicine' }, T0 + MIN + 10_000).rejected).toBe('tooSoon');
    const d2 = applyAction(d1.state, ctx, { type: 'medicine' }, T0 + 2 * MIN);
    expect(d2.state.sick).toBeNull();
    expect(d2.events.some((e) => e.type === 'cured')).toBe(true);
  });

  it('szidás hiszti közben fegyelmet ad, anélkül boldogságot vesz el', () => {
    const pet = makePet('teen', 'csillagszemu', 'alap', { calls: [{ type: 'misbehave', countedMin: 0, mistakes: 0 }] });
    const ok = applyAction(pet, ctx, { type: 'scold' }, T0 + MIN);
    expect(ok.state.discipline).toBe(25);
    const again = applyAction(ok.state, ctx, { type: 'scold' }, T0 + 2 * MIN);
    expect(again.state.discipline).toBe(25);
    expect(again.state.happiness).toBeLessThan(ok.state.happiness);
  });

  it('simogatás óránként legfeljebb 3', () => {
    let s = makePet('adult', 'ragyogo', 'alap', { happiness: 10 });
    for (let i = 1; i <= 3; i++) s = applyAction(s, ctx, { type: 'pet' }, T0 + i * MIN).state;
    expect(applyAction(s, ctx, { type: 'pet' }, T0 + 4 * MIN).rejected).toBe('petLimit');
    expect(applyAction(s, ctx, { type: 'pet' }, T0 + 62 * MIN).rejected).toBeNull();
  });
});

describe('kritikus állapot, Nagyi, halál', () => {
  it('a kritikus állapotból gondozással ki lehet menteni', () => {
    const pet = makePet('adult', 'ragyogo', 'klasszikus');
    let s = advance(pet, ctx, T0 + 15 * H).state;
    expect(s.critical).not.toBeNull();
    const t = T0 + 15 * H;
    s = applyAction(s, ctx, { type: 'clean' }, t).state;
    s = applyAction(s, ctx, { type: 'medicine' }, t).state;
    s = applyAction(s, ctx, { type: 'medicine' }, t + MIN).state;
    s = applyAction(s, ctx, { type: 'feed' }, t + 2 * MIN).state;
    const r = applyAction(s, ctx, { type: 'snack' }, t + 3 * MIN);
    expect(r.state.critical).toBeNull();
    expect(r.events.some((e) => e.type === 'rescued')).toBe(true);
    expect(r.state.health).toBeGreaterThanOrEqual(20);
  });

  it('Nagyitól egy koppintással hazahozható, a következmények érvényesek', () => {
    const pet = makePet('adult', 'ragyogo', 'alap');
    const atNagyi = advance(pet, ctx, T0 + 60 * H).state;
    expect(atNagyi.status).toBe('nagyi');
    const frozen = advance(atNagyi, ctx, T0 + 30 * DAY).state;
    expect(frozen.lifeMin).toBe(atNagyi.lifeMin);
    const before = frozen.mistakes.adult;
    const home = bringHomeFromNagyi(frozen, T0 + 30 * DAY).state;
    expect(home.status).toBe('alive');
    expect(home.health).toBe(60);
    expect(home.mistakes.adult).toBe(before + 2);
    expect(home.stageLenMin).toBe(atNagyi.stageLenMin - 24 * 60);
  });

  it('a Klasszikus kedvenc Alapra váltva nem hal meg, hanem Nagyihoz kerül', () => {
    const pet = makePet('adult', 'ragyogo', 'klasszikus');
    const critical = advance(pet, ctx, T0 + 15 * H).state;
    const alap = downgradeToAlap(critical);
    expect(alap.mode).toBe('alap');
    const later = advance(alap, ctx, T0 + 40 * H).state;
    expect(later.status).toBe('nagyi');
  });

  it('természetes halál az idős szakasz után, elalváskor; az utód örököl', () => {
    const senior = forceStage(makePet('adult', 'ragyogo', 'alap', { lastMs: T0 }), 'senior', 'ragyogo');
    const pet: PetState = { ...senior, stageMin: senior.stageLenMin - 60, hunger: 100, happiness: 100, health: 100 };
    const { state, events } = advance(pet, ctx, T0 + 20 * H);
    expect(events.some((e) => e.type === 'farewell')).toBe(true);
    expect(state.status).toBe('dead');
    expect(state.deathCause).toBe('oregkor');
    expect(minutesFromT0(events.find((e) => e.type === 'died')!.t)).toBe(16 * 60 + 1);
    const memorial = memorialFromPet(state, state.diedAt!, 'oregkor');
    expect(memorial.cause).toBe('oregkor');
    const child = createSuccessorEgg({
      parent: state,
      id: 'p2',
      name: 'Folt',
      mode: 'alap',
      now: T0 + 20 * H,
      seed: 7,
      inheritance: true,
    });
    expect(child.generation).toBe(state.generation + 1);
    expect(child.familyName).toBe(state.familyName);
    expect(child.discipline).toBe(25);
    expect(child.status).toBe('egg');
  });
});

describe('fejlődés', () => {
  it('a gyerekkori hibák döntik el a kamasz ágat', () => {
    const base = makePet('child', 'gomboc', 'alap', { stageMin: 48 * 60 - 1 });
    expect(advance({ ...base, mistakes: { ...base.mistakes, child: 2 } }, ctx, T0 + 2 * MIN).state.form).toBe(
      'csillagszemu',
    );
    expect(advance({ ...base, mistakes: { ...base.mistakes, child: 3 } }, ctx, T0 + 2 * MIN).state.form).toBe('kope');
  });

  it('kamaszkori hibák és fegyelem a felnőtt formához', () => {
    const teen = makePet('teen', 'csillagszemu', 'alap', { stageMin: 96 * 60 - 1 });
    const form = (mistakes: number, discipline: number) =>
      advance({ ...teen, discipline, mistakes: { ...teen.mistakes, teen: mistakes } }, ctx, T0 + 2 * MIN).state.form;
    expect(form(0, 100)).toBe('ragyogo');
    expect(form(2, 50)).toBe('kiegyensulyozott');
    expect(form(3, 75)).toBe('joszivu');
    expect(form(5, 0)).toBe('durcas');
  });
});

describe('szabadság', () => {
  it('teljes fagyasztás, majd a szimuláció folytatódik', () => {
    const pet = makePet('adult', 'ragyogo', 'alap');
    const v = startVacation(pet, ctx, [], T0, T0 + 3 * DAY, T0);
    expect(v.error).toBeNull();
    const during = advance(v.state, ctx, T0 + 2 * DAY).state;
    expect(during.hunger).toBe(pet.hunger);
    expect(during.lifeMin).toBe(pet.lifeMin);
    const after = advance(v.state, ctx, T0 + 3 * DAY + H);
    expect(after.state.vacation).toBeNull();
    expect(after.events[0].type).toBe('vacationEnd');
    expect(after.state.lifeMin).toBe(60);
  });

  it('módonkénti korlát és gördülő keret', () => {
    const klass = makePet('adult', 'ragyogo', 'klasszikus');
    expect(startVacation(klass, ctx, [], T0, T0 + 8 * DAY, T0).error).toBe('tooLong');
    const history = [{ start: T0 - 20 * DAY, end: T0 - 13 * DAY }, { start: T0 - 10 * DAY, end: T0 - 4 * DAY }];
    expect(vacationBudgetUsedDays(history, T0)).toBeCloseTo(13, 5);
    expect(startVacation(klass, ctx, history, T0, T0 + 2 * DAY, T0).error).toBe('budget');
    const sick = { ...klass, sick: { cause: 'kaki' as const, doses: 0, lastDoseMs: null, awakeMin: 0 } };
    expect(startVacation(sick, ctx, [], T0, T0 + DAY, T0).error).toBe('notAllowed');
  });

  it('kézi befejezés', () => {
    const pet = makePet('adult', 'ragyogo', 'alap');
    const v = startVacation(pet, ctx, [], T0, T0 + 5 * DAY, T0).state;
    const ended = endVacation(v, ctx, T0 + DAY);
    expect(ended.state.vacation).toBeNull();
    expect(ended.finished).toEqual({ start: T0, end: T0 + DAY });
  });
});

describe('napirend és előrejelzés', () => {
  it('a napirend-módosítás a következő ébredéstől érvényes, 24 óránként egyszer', () => {
    const pet = makePet('adult', 'ragyogo', 'alap');
    const r = requestScheduleChange(pet, { bedMin: 22 * 60, wakeMin: 6 * 60 }, T0);
    expect(r.error).toBeNull();
    expect(r.state.schedule).toEqual(SCHEDULE);
    expect(requestScheduleChange(r.state, { bedMin: 22 * 60, wakeMin: 6 * 60 }, T0 + H).error).toBe('cooldown');
    const nextDay = advance(r.state, ctx, T0 + 25 * H).state;
    expect(nextDay.schedule).toEqual({ bedMin: 22 * 60, wakeMin: 6 * 60 });
    expect(requestScheduleChange(pet, { bedMin: 23 * 60, wakeMin: 5 * 60 }, T0).error).toBe('tooShort');
  });

  it('a következő ellenőrzés időpontja az első hívás', () => {
    const pet = makePet('adult', 'ragyogo', 'alap');
    const next = nextAttention(pet, ctx, T0);
    expect(next).not.toBeNull();
    expect(minutesFromT0(next!)).toBe(8 * 60);
  });
});
