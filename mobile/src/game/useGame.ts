// A játék állapota és műveletei egy hookban. A szimuláció tiszta függvényeit
// hívja, az eredményt AsyncStorage-ba menti, és újratervezi az értesítéseket.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  advance,
  applyAction,
  bringHomeFromNagyi,
  createEgg,
  createSuccessorEgg,
  deviceLocalTime,
  downgradeToAlap,
  endVacation,
  floorMin,
  markPresence,
  memorialFromPet,
  MIN,
  PALETTE_COUNT,
  pick,
  requestScheduleChange,
  startVacation,
  TRAITS,
  warmEgg,
} from '../sim';
import type {
  CareAction,
  Daycare,
  Mode,
  PetState,
  RejectReason,
  Schedule,
  ScheduleError,
  SimContext,
  SimEvent,
  VacationError,
} from '../sim';
import { clearSchedule, getPermission, requestPermission, setupNotifications, syncSchedule, type PermissionState } from './notifications';
import { planNotifications } from './notifyPlan';
import { emptySave, parseSave, SAVE_KEY, type NotifyCategory, type SaveData, type Settings } from './save';
import { absenceSummary, eventText } from './texts';
import { rescale, virtualNow } from './time';

const SUMMARY_AFTER_MS = 5 * 60_000;

export interface FirstEggInput {
  name: string;
  mode: Mode;
  schedule: Schedule;
}

export interface GameApi {
  ready: boolean;
  save: SaveData;
  pet: PetState | null;
  now: number;
  ctx: SimContext;
  lastMessage: string | null;
  summary: string | null;
  permission: PermissionState;
  dismissSummary: () => void;
  createFirstEgg: (input: FirstEggInput) => void;
  warm: () => void;
  care: (action: CareAction) => RejectReason | null;
  bringHome: () => void;
  leaveWithNagyi: () => void;
  closeLife: (name: string, mode: Mode) => void;
  startVacationDays: (days: number) => VacationError | null;
  endVacationNow: () => void;
  changeSchedule: (schedule: Schedule) => ScheduleError | null;
  setDaycare: (daycare: Daycare) => void;
  setAutoLights: (value: boolean) => void;
  downgrade: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setNotifyCategory: (cat: NotifyCategory, value: boolean) => void;
  askPermission: () => Promise<void>;
  markNotifAsked: () => void;
  setEpitaph: (id: string, text: string) => void;
  giveFlower: (id: string) => void;
  setTimeScale: (scale: number) => void;
  resetAll: () => Promise<void>;
  exportJson: () => string;
}

function newId(): string {
  return `p_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function newSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) | 0;
}

function todayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function useGame(): GameApi {
  const ctx = useMemo<SimContext>(() => ({ local: deviceLocalTime() }), []);
  const [ready, setReady] = useState(false);
  const [save, setSave] = useState<SaveData>(emptySave);
  const saveRef = useRef(save);
  const [now, setNow] = useState(() => Date.now());
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>('undetermined');

  const update = useCallback((fn: (s: SaveData) => SaveData) => {
    const next = fn(saveRef.current);
    if (next === saveRef.current) return;
    saveRef.current = next;
    setSave(next);
  }, []);

  const noteEvents = useCallback((events: SimEvent[], pet: PetState) => {
    for (let i = events.length - 1; i >= 0; i--) {
      const text = eventText(events[i], pet.name);
      if (text) {
        setLastMessage(text);
        break;
      }
    }
  }, []);

  /** Léptetés a mostani játékidőig; visszaadja az eseményeket. */
  const catchUp = useCallback(
    (presence: boolean): SimEvent[] => {
      const s = saveRef.current;
      const v = virtualNow(s.time);
      setNow(v);
      if (!s.pet) return [];
      if (floorMin(v) <= s.pet.lastMs && !presence) return [];
      const { state, events } = advance(s.pet, ctx, v);
      const pet = presence ? markPresence(state) : state;
      const seen = new Set(s.meta.seenForms);
      for (const e of events) if (e.form) seen.add(e.form);
      if (pet.form) seen.add(pet.form);
      update((cur) => ({ ...cur, pet, meta: { ...cur.meta, seenForms: [...seen] } }));
      if (events.length) noteEvents(events, pet);
      return events;
    },
    [ctx, noteEvents, update],
  );

  // Betöltés.
  useEffect(() => {
    let alive = true;
    (async () => {
      await setupNotifications().catch(() => undefined);
      const raw = await AsyncStorage.getItem(SAVE_KEY).catch(() => null);
      if (!alive) return;
      const data = parseSave(raw);
      saveRef.current = data;
      setSave(data);
      setPermission(await getPermission().catch(() => 'undetermined' as const));
      const events = catchUp(true);
      const away = data.meta.lastBackgroundReal;
      if (away !== null && Date.now() - away > SUMMARY_AFTER_MS) setSummary(absenceSummary(events));
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [catchUp]);

  // Óra: gyorsított időben másodpercenként, egyébként 10 másodpercenként.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => catchUp(false), save.time.scale > 1 ? 1000 : 10_000);
    return () => clearInterval(id);
  }, [ready, save.time.scale, catchUp]);

  // Előtér és háttér.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const away = saveRef.current.meta.lastBackgroundReal;
        const events = catchUp(true);
        if (away !== null && Date.now() - away > SUMMARY_AFTER_MS) setSummary(absenceSummary(events));
        getPermission().then(setPermission).catch(() => undefined);
      } else if (state === 'background') {
        update((cur) => ({ ...cur, meta: { ...cur.meta, lastBackgroundReal: Date.now() } }));
        AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saveRef.current)).catch(() => undefined);
      }
    });
    return () => sub.remove();
  }, [catchUp, update]);

  // Mentés (késleltetve).
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => {
      AsyncStorage.setItem(SAVE_KEY, JSON.stringify(save)).catch(() => undefined);
    }, 400);
    return () => clearTimeout(id);
  }, [save, ready]);

  // Értesítések újratervezése állapotváltozáskor (FR-21).
  const planKey = save.pet
    ? `${save.pet.status}|${save.pet.stage}|${Math.round(save.pet.hunger / 5)}|${Math.round(save.pet.happiness / 5)}|${save.pet.poops.length}|${save.pet.sick ? 1 : 0}|${save.pet.critical ? 1 : 0}|${save.pet.mode}|${save.pet.vacation?.end ?? 0}|${JSON.stringify(save.pet.schedule)}|${JSON.stringify(save.settings)}|${save.time.scale}|${permission}`
    : 'none';
  useEffect(() => {
    if (!ready || permission !== 'granted') return;
    const id = setTimeout(() => {
      const s = saveRef.current;
      const plan = planNotifications(s.pet, ctx, virtualNow(s.time), s.settings);
      syncSchedule(plan, s.time).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(id);
  }, [planKey, ready, permission, ctx]);

  const withPet = useCallback(
    (fn: (pet: PetState, v: number) => PetState | null) => {
      catchUp(false);
      const s = saveRef.current;
      if (!s.pet) return;
      const next = fn(s.pet, virtualNow(s.time));
      if (next && next !== s.pet) update((cur) => ({ ...cur, pet: next }));
    },
    [catchUp, update],
  );

  const createFirstEgg = useCallback(
    (input: FirstEggInput) => {
      const s = saveRef.current;
      const v = virtualNow(s.time);
      const rng = { rng: newSeed() };
      const egg = createEgg({
        id: newId(),
        name: input.name,
        mode: input.mode,
        now: v,
        schedule: input.schedule,
        daycare: { enabled: false, startMin: 8 * 60 + 30, endMin: 17 * 60, days: [false, true, true, true, true, true, false] },
        autoLights: true,
        seed: newSeed(),
        palette: Math.floor(Math.random() * PALETTE_COUNT),
        trait: pick(rng, TRAITS),
      });
      update((cur) => ({ ...cur, pet: egg }));
    },
    [update],
  );

  const warm = useCallback(() => withPet((pet, v) => warmEgg(pet, v)), [withPet]);

  const care = useCallback(
    (action: CareAction): RejectReason | null => {
      catchUp(false);
      const s = saveRef.current;
      if (!s.pet) return 'notAlive';
      const r = applyAction(s.pet, ctx, action, virtualNow(s.time));
      if (r.rejected) return r.rejected;
      update((cur) => ({
        ...cur,
        pet: r.state,
        meta: {
          ...cur.meta,
          firstCare: {
            fed: cur.meta.firstCare.fed || action.type === 'feed',
            cleaned: cur.meta.firstCare.cleaned || action.type === 'clean',
          },
        },
      }));
      if (r.events.length) noteEvents(r.events, r.state);
      if (s.settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      return null;
    },
    [catchUp, ctx, noteEvents, update],
  );

  const bringHome = useCallback(() => withPet((pet, v) => bringHomeFromNagyi(pet, v).state), [withPet]);

  const replaceWithEgg = useCallback(
    (cause: 'auto' | 'nagyinal', name: string, mode: Mode) => {
      const s = saveRef.current;
      if (!s.pet) return;
      const v = virtualNow(s.time);
      const pet = s.pet;
      const memorialCause = cause === 'nagyinal' ? 'nagyinal' : (pet.deathCause ?? 'elhanyagolas');
      const entry = memorialFromPet(pet, pet.diedAt ?? floorMin(v), memorialCause);
      const egg = createSuccessorEgg({ parent: pet, id: newId(), name, mode, now: v, seed: newSeed(), inheritance: true });
      update((cur) => ({
        ...cur,
        pet: egg,
        memorial: [entry, ...cur.memorial.filter((m) => m.id !== entry.id)],
        meta: { ...cur.meta, firstCare: { fed: false, cleaned: false } },
      }));
    },
    [update],
  );

  const leaveWithNagyi = useCallback(() => {
    const pet = saveRef.current.pet;
    if (pet) replaceWithEgg('nagyinal', pet.name, 'alap');
  }, [replaceWithEgg]);

  const closeLife = useCallback((name: string, mode: Mode) => replaceWithEgg('auto', name, mode), [replaceWithEgg]);

  const startVacationDays = useCallback(
    (days: number): VacationError | null => {
      catchUp(false);
      const s = saveRef.current;
      if (!s.pet) return 'notAlive';
      const v = virtualNow(s.time);
      const r = startVacation(s.pet, ctx, s.vacationHistory, v, v + days * 24 * 60 * MIN, v);
      if (r.error) return r.error;
      const planned = r.state.vacation!;
      update((cur) => ({ ...cur, pet: r.state, vacationHistory: [...cur.vacationHistory, planned] }));
      return null;
    },
    [catchUp, ctx, update],
  );

  const endVacationNow = useCallback(() => {
    catchUp(false);
    const s = saveRef.current;
    if (!s.pet?.vacation) return;
    const planned = s.pet.vacation;
    const r = endVacation(s.pet, ctx, virtualNow(s.time));
    update((cur) => ({
      ...cur,
      pet: r.state,
      vacationHistory: cur.vacationHistory
        .filter((h) => !(h.start === planned.start && h.end === planned.end))
        .concat(r.finished ? [r.finished] : []),
    }));
  }, [catchUp, ctx, update]);

  const changeSchedule = useCallback(
    (schedule: Schedule): ScheduleError | null => {
      catchUp(false);
      const s = saveRef.current;
      if (!s.pet) return null;
      const r = requestScheduleChange(s.pet, schedule, virtualNow(s.time));
      if (r.error) return r.error;
      update((cur) => ({ ...cur, pet: r.state }));
      return null;
    },
    [catchUp, update],
  );

  const setDaycare = useCallback(
    (daycare: Daycare) => withPet((pet) => ({ ...pet, daycare: { ...daycare, days: [...daycare.days] } })),
    [withPet],
  );
  const setAutoLights = useCallback((value: boolean) => withPet((pet) => ({ ...pet, autoLights: value })), [withPet]);
  const downgrade = useCallback(() => withPet((pet) => downgradeToAlap(pet)), [withPet]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => update((cur) => ({ ...cur, settings: { ...cur.settings, ...patch } })),
    [update],
  );

  const setNotifyCategory = useCallback(
    (cat: NotifyCategory, value: boolean) =>
      update((cur) => ({
        ...cur,
        settings: { ...cur.settings, notifyOverrides: { ...cur.settings.notifyOverrides, [cat]: value } },
      })),
    [update],
  );

  const askPermission = useCallback(async () => {
    const p = await requestPermission().catch(() => 'denied' as const);
    setPermission(p);
    update((cur) => ({ ...cur, meta: { ...cur.meta, notifAsked: true } }));
  }, [update]);

  const markNotifAsked = useCallback(
    () => update((cur) => ({ ...cur, meta: { ...cur.meta, notifAsked: true } })),
    [update],
  );

  const setEpitaph = useCallback(
    (id: string, text: string) =>
      update((cur) => ({
        ...cur,
        memorial: cur.memorial.map((m) => (m.id === id ? { ...m, epitaph: text.slice(0, 140) } : m)),
      })),
    [update],
  );

  const giveFlower = useCallback(
    (id: string) =>
      update((cur) => {
        const day = todayKey(Date.now());
        return {
          ...cur,
          memorial: cur.memorial.map((m) =>
            m.id === id && m.lastFlowerDay !== day ? { ...m, flowers: m.flowers + 1, lastFlowerDay: day } : m,
          ),
        };
      }),
    [update],
  );

  const setTimeScale = useCallback(
    (scale: number) => {
      catchUp(false);
      update((cur) => ({ ...cur, time: rescale(cur.time, scale) }));
    },
    [catchUp, update],
  );

  const resetAll = useCallback(async () => {
    await clearSchedule().catch(() => undefined);
    await AsyncStorage.removeItem(SAVE_KEY).catch(() => undefined);
    const fresh = emptySave();
    saveRef.current = fresh;
    setSave(fresh);
    setLastMessage(null);
    setSummary(null);
  }, []);

  const exportJson = useCallback(() => JSON.stringify(saveRef.current, null, 2), []);

  return {
    ready,
    save,
    pet: save.pet,
    now,
    ctx,
    lastMessage,
    summary,
    permission,
    dismissSummary: () => setSummary(null),
    createFirstEgg,
    warm,
    care,
    bringHome,
    leaveWithNagyi,
    closeLife,
    startVacationDays,
    endVacationNow,
    changeSchedule,
    setDaycare,
    setAutoLights,
    downgrade,
    updateSettings,
    setNotifyCategory,
    askPermission,
    markNotifAsked,
    setEpitaph,
    giveFlower,
    setTimeScale,
    resetAll,
    exportJson,
  };
}
