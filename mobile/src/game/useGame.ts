// A játék állapota és műveletei egy hookban, két módban:
// helyi mód: a szimuláció a telefonon fut, a mentés AsyncStorage-ban van;
// szerver mód: a game-api az idő és az állapot forrása (PRD 13.4), a műveletek
// a szerveren futnak, a két szinkron között a telefon ugyanazzal a szimulációval vetít.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
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
  formatMinuteOfDay,
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
import type { CareAction, Daycare, MemorialEntry, MinigameKind, Mode, PetState, Schedule, SimContext, SimEvent } from '../sim';
import { ApiError, describeError, GameClient, OfflineError, type EntitlementsView, type Session, type StateResponse } from './api';
import { clearSchedule, getPermission, requestPermission, setupNotifications, syncSchedule, type PermissionState } from './notifications';
import { planNotifications } from './notifyPlan';
import { emptySave, parseSave, SAVE_KEY, type NotifyCategory, type SaveData, type Settings } from './save';
import { freshSession, loadSession, storeSession } from './session';
import { absenceSummary, eventText, REJECT_TEXT, SCHEDULE_ERROR_TEXT, VACATION_ERROR_TEXT } from './texts';
import { rescale, virtualNow } from './time';

const SUMMARY_AFTER_MS = 5 * 60_000;
const SERVER_SYNC_MS = 5 * 60_000;
const REMOTE_KEY = 'pixeltojas:remote:v1';
const APP_VERSION = '0.2.0';

export interface FirstEggInput {
  name: string;
  mode: Mode;
  schedule: Schedule;
}

/** Szerver mód gyorsítótára: az utolsó szerverállapot, offline kivetítéshez. */
interface RemoteCache {
  url: string;
  pet: PetState | null;
  version: number;
  minigameSeed: number | null;
  serverOffset: number;
  syncedAtReal: number;
  entitlements: EntitlementsView | null;
  activeVacationId: string | null;
  memorial: MemorialEntry[];
}

export interface GameApi {
  ready: boolean;
  /** Szerver módban: volt-e már sikeres szinkron (addig nincs megjeleníthető állapot). */
  synced: boolean;
  mode: 'local' | 'server';
  serverUrl: string | null;
  online: boolean;
  serverError: string | null;
  busy: boolean;
  save: SaveData;
  pet: PetState | null;
  now: number;
  ctx: SimContext;
  memorial: MemorialEntry[];
  entitlements: EntitlementsView | null;
  minigameSeed: number | null;
  userId: string | null;
  lastMessage: string | null;
  summary: string | null;
  permission: PermissionState;
  dismissSummary: () => void;
  refresh: () => Promise<void>;
  connectServer: (url: string) => Promise<string | null>;
  disconnectServer: () => void;
  createFirstEgg: (input: FirstEggInput) => Promise<string | null>;
  warm: () => Promise<string | null>;
  care: (action: CareAction) => Promise<string | null>;
  playMinigame: (kind: MinigameKind, guesses: string[], won: boolean) => Promise<string | null>;
  bringHome: () => Promise<string | null>;
  leaveWithNagyi: () => Promise<string | null>;
  closeLife: (name: string, mode: Mode) => Promise<string | null>;
  startVacationDays: (days: number) => Promise<string | null>;
  endVacationNow: () => Promise<string | null>;
  changeSchedule: (schedule: Schedule) => Promise<string | null>;
  setDaycare: (daycare: Daycare) => Promise<string | null>;
  setAutoLights: (value: boolean) => Promise<string | null>;
  downgrade: () => Promise<string | null>;
  updateSettings: (patch: Partial<Settings>) => void;
  setNotifyCategory: (cat: NotifyCategory, value: boolean) => void;
  askPermission: () => Promise<void>;
  markNotifAsked: () => void;
  setEpitaph: (id: string, text: string) => void;
  giveFlower: (id: string) => void;
  refreshMemorial: () => Promise<void>;
  deletionCode: () => Promise<string | null>;
  setTimeScale: (scale: number) => void;
  resetAll: () => Promise<string | null>;
  exportJson: () => Promise<string>;
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

const hhmm = (m: number) => formatMinuteOfDay(m);

export function useGame(): GameApi {
  const ctx = useMemo<SimContext>(() => ({ local: deviceLocalTime() }), []);
  const tz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Europe/Budapest';
    } catch {
      return 'Europe/Budapest';
    }
  }, []);
  const [ready, setReady] = useState(false);
  const [save, setSave] = useState<SaveData>(emptySave);
  const saveRef = useRef(save);
  const [now, setNow] = useState(() => Date.now());
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>('undetermined');

  const [remote, setRemote] = useState<RemoteCache | null>(null);
  const remoteRef = useRef<RemoteCache | null>(null);
  const [projected, setProjected] = useState<PetState | null>(null);
  const [online, setOnline] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef<Session | null>(null);

  const serverUrl = save.settings.serverUrl;
  const serverMode = serverUrl !== null;

  const update = useCallback((fn: (s: SaveData) => SaveData) => {
    const next = fn(saveRef.current);
    if (next === saveRef.current) return;
    saveRef.current = next;
    setSave(next);
  }, []);

  const client = useMemo(() => {
    if (!serverUrl) return null;
    return new GameClient({
      baseUrl: serverUrl,
      tz,
      appVersion: APP_VERSION,
      getSession: () => sessionRef.current ?? freshSession(),
      onSession: (s) => {
        sessionRef.current = s;
        storeSession(s).catch(() => undefined);
      },
    });
  }, [serverUrl, tz]);

  const noteEvents = useCallback((events: SimEvent[], name: string) => {
    for (let i = events.length - 1; i >= 0; i--) {
      const text = eventText(events[i], name);
      if (text) {
        setLastMessage(text);
        break;
      }
    }
  }, []);

  // ---- Szerver mód ---------------------------------------------------------

  const serverNow = useCallback(() => Date.now() + (remoteRef.current?.serverOffset ?? 0), []);

  const project = useCallback(() => {
    const r = remoteRef.current;
    const t = serverNow();
    setNow(t);
    setProjected(r?.pet ? advance(r.pet, ctx, t).state : null);
  }, [ctx, serverNow]);

  const setRemoteCache = useCallback(
    (next: RemoteCache | null) => {
      remoteRef.current = next;
      setRemote(next);
      if (next) AsyncStorage.setItem(REMOTE_KEY, JSON.stringify(next)).catch(() => undefined);
      else AsyncStorage.removeItem(REMOTE_KEY).catch(() => undefined);
      project();
    },
    [project],
  );

  const applyServer = useCallback(
    (res: StateResponse, url: string) => {
      const prev = remoteRef.current?.url === url ? remoteRef.current : null;
      const pet = 'pet' in res ? res.pet : (prev?.pet ?? null);
      setRemoteCache({
        url,
        pet,
        version: res.version ?? prev?.version ?? 0,
        minigameSeed: res.minigameSeed ?? prev?.minigameSeed ?? null,
        serverOffset: Date.parse(res.serverNow) - Date.now(),
        syncedAtReal: Date.now(),
        entitlements: res.entitlements ?? prev?.entitlements ?? null,
        activeVacationId: res.activeVacationId !== undefined ? res.activeVacationId : (prev?.activeVacationId ?? null),
        memorial: prev?.memorial ?? [],
      });
      if (pet && res.events?.length) noteEvents(res.events as unknown as SimEvent[], pet.name);
      setOnline(true);
      setServerError(null);
    },
    [noteEvents, setRemoteCache],
  );

  const syncServer = useCallback(
    async (withSummary: boolean): Promise<boolean> => {
      if (!client) return false;
      try {
        const res = await client.state();
        applyServer(res, client.baseUrl);
        if (withSummary) setSummary(absenceSummary((res.events ?? []) as unknown as SimEvent[]));
        return true;
      } catch (e) {
        setOnline(!(e instanceof OfflineError));
        setServerError(describeError(e));
        return false;
      }
    },
    [client, applyServer],
  );

  /** Kedvenc-mutáció a szerveren; verzióütközésnél egyszer újraszinkronizál és újrapróbál. */
  const mutateServer = useCallback(
    async (fn: (c: GameClient, petId: string, version: number) => Promise<StateResponse>): Promise<StateResponse | string> => {
      const r = remoteRef.current;
      if (!client || !r?.pet) return 'Nincs aktív kedvenc.';
      setBusy(true);
      try {
        let res: StateResponse;
        try {
          res = await fn(client, r.pet.id, r.version);
        } catch (e) {
          if (!(e instanceof ApiError) || e.status !== 409 || e.code !== 'version_conflict') throw e;
          const fresh = await client.state();
          applyServer(fresh, client.baseUrl);
          const r2 = remoteRef.current;
          if (!r2?.pet) throw e;
          res = await fn(client, r2.pet.id, r2.version);
        }
        applyServer(res, client.baseUrl);
        return res;
      } catch (e) {
        project();
        setOnline(!(e instanceof OfflineError));
        return describeError(e);
      } finally {
        setBusy(false);
      }
    },
    [client, applyServer, project],
  );

  // ---- Helyi mód ----------------------------------------------------------

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
      if (events.length) noteEvents(events, pet.name);
      return events;
    },
    [ctx, noteEvents, update],
  );

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

  // ---- Életciklus ----------------------------------------------------------

  useEffect(() => {
    let alive = true;
    (async () => {
      await setupNotifications().catch(() => undefined);
      const [raw, rawRemote, session] = await Promise.all([
        AsyncStorage.getItem(SAVE_KEY).catch(() => null),
        AsyncStorage.getItem(REMOTE_KEY).catch(() => null),
        loadSession(),
      ]);
      if (!alive) return;
      sessionRef.current = session;
      await storeSession(session).catch(() => undefined);
      const data = parseSave(raw);
      saveRef.current = data;
      setSave(data);
      if (rawRemote) {
        try {
          const cached = JSON.parse(rawRemote) as RemoteCache;
          if (cached.url === data.settings.serverUrl) {
            remoteRef.current = cached;
            setRemote(cached);
          }
        } catch {
          // sérült gyorsítótár: a szerver úgyis felülírja
        }
      }
      setPermission(await getPermission().catch(() => 'undetermined' as const));
      const away = data.meta.lastBackgroundReal;
      const longAway = away !== null && Date.now() - away > SUMMARY_AFTER_MS;
      if (data.settings.serverUrl === null) {
        const events = catchUp(true);
        if (longAway) setSummary(absenceSummary(events));
      } else {
        project();
      }
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [catchUp, project]);

  // Szerver mód: első szinkron, majd ha a cím változik.
  useEffect(() => {
    if (!ready || !client) return;
    const away = saveRef.current.meta.lastBackgroundReal;
    void syncServer(away !== null && Date.now() - away > SUMMARY_AFTER_MS);
  }, [ready, client, syncServer]);

  // Óra: helyi módban léptetés, szerver módban kivetítés és időnkénti szinkron.
  useEffect(() => {
    if (!ready) return;
    const fast = !serverMode && save.time.scale > 1;
    const id = setInterval(() => {
      if (serverMode) {
        project();
        const r = remoteRef.current;
        if (!r || Date.now() - r.syncedAtReal > SERVER_SYNC_MS) void syncServer(false);
      } else {
        catchUp(false);
      }
    }, fast ? 1000 : 10_000);
    return () => clearInterval(id);
  }, [ready, serverMode, save.time.scale, catchUp, project, syncServer]);

  // Előtér és háttér.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const away = saveRef.current.meta.lastBackgroundReal;
        const longAway = away !== null && Date.now() - away > SUMMARY_AFTER_MS;
        if (saveRef.current.settings.serverUrl) void syncServer(longAway);
        else {
          const events = catchUp(true);
          if (longAway) setSummary(absenceSummary(events));
        }
        getPermission().then(setPermission).catch(() => undefined);
      } else if (state === 'background') {
        update((cur) => ({ ...cur, meta: { ...cur.meta, lastBackgroundReal: Date.now() } }));
        AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saveRef.current)).catch(() => undefined);
      }
    });
    return () => sub.remove();
  }, [catchUp, syncServer, update]);

  // Mentés (késleltetve).
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => {
      AsyncStorage.setItem(SAVE_KEY, JSON.stringify(save)).catch(() => undefined);
    }, 400);
    return () => clearTimeout(id);
  }, [save, ready]);

  const pet = serverMode ? projected : save.pet;

  // Értesítések újratervezése állapotváltozáskor (FR-21).
  const planKey = pet
    ? `${pet.status}|${pet.stage}|${Math.round(pet.hunger / 5)}|${Math.round(pet.happiness / 5)}|${pet.poops.length}|${pet.sick ? 1 : 0}|${pet.critical ? 1 : 0}|${pet.mode}|${pet.vacation?.end ?? 0}|${JSON.stringify(pet.schedule)}|${JSON.stringify(save.settings)}|${save.time.scale}|${permission}|${serverMode}`
    : 'none';
  const petRef = useRef(pet);
  petRef.current = pet;
  useEffect(() => {
    if (!ready || permission !== 'granted') return;
    const id = setTimeout(() => {
      const s = saveRef.current;
      const t = s.settings.serverUrl ? serverNow() : virtualNow(s.time);
      const plan = planNotifications(petRef.current, ctx, t, s.settings);
      // Szerver módban a terv szerveridőben készül; a valós idő eltolással jön vissza.
      const timeScale = s.settings.serverUrl
        ? { scale: 1, anchorReal: Date.now(), anchorVirtual: t }
        : s.time;
      syncSchedule(plan, timeScale).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(id);
  }, [planKey, ready, permission, ctx, serverNow]);

  // ---- Műveletek -------------------------------------------------------------

  const haptic = useCallback(() => {
    if (saveRef.current.settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, []);

  const markFirstCare = useCallback(
    (type: CareAction['type']) =>
      update((cur) => ({
        ...cur,
        meta: {
          ...cur.meta,
          firstCare: {
            fed: cur.meta.firstCare.fed || type === 'feed',
            cleaned: cur.meta.firstCare.cleaned || type === 'clean',
          },
        },
      })),
    [update],
  );

  const care = useCallback(
    async (action: CareAction): Promise<string | null> => {
      if (serverMode) {
        const current = projected;
        if (!current) return 'Nincs aktív kedvenc.';
        // Azonnali visszajelzés: ugyanaz a szabály fut helyben, mint a szerveren.
        const local = applyAction(current, ctx, action, serverNow());
        if (local.rejected) return REJECT_TEXT[local.rejected];
        setProjected(local.state);
        haptic();
        const res = await mutateServer((c, id, v) => c.actions(id, v, [{ id: randomUUID(), type: action.type }]));
        if (typeof res === 'string') return res;
        markFirstCare(action.type);
        const rejected = (res as { rejected?: { reason: string }[] }).rejected?.[0];
        return rejected ? (REJECT_TEXT[rejected.reason as keyof typeof REJECT_TEXT] ?? 'Most nem lehet.') : null;
      }
      catchUp(false);
      const s = saveRef.current;
      if (!s.pet) return REJECT_TEXT.notAlive;
      const r = applyAction(s.pet, ctx, action, virtualNow(s.time));
      if (r.rejected) return REJECT_TEXT[r.rejected];
      update((cur) => ({ ...cur, pet: r.state }));
      markFirstCare(action.type);
      if (r.events.length) noteEvents(r.events, r.state.name);
      haptic();
      return null;
    },
    [serverMode, projected, ctx, serverNow, haptic, mutateServer, markFirstCare, catchUp, update, noteEvents],
  );

  const playMinigame = useCallback(
    async (kind: MinigameKind, guesses: string[], won: boolean): Promise<string | null> => {
      if (!serverMode) return care({ type: 'play', won });
      const res = await mutateServer((c, id, v) => c.minigame(id, v, kind, guesses));
      if (typeof res === 'string') return res;
      const rejected = (res as { rejected?: string | null }).rejected;
      return rejected ? (REJECT_TEXT[rejected as keyof typeof REJECT_TEXT] ?? 'Most nem lehet.') : null;
    },
    [serverMode, care, mutateServer],
  );

  const warm = useCallback(async (): Promise<string | null> => {
    if (serverMode) {
      const res = await mutateServer((c, id, v) => c.actions(id, v, [{ id: randomUUID(), type: 'warm' }]));
      return typeof res === 'string' ? res : null;
    }
    withPet((p, v) => warmEgg(p, v));
    return null;
  }, [serverMode, mutateServer, withPet]);

  const createFirstEgg = useCallback(
    async (input: FirstEggInput): Promise<string | null> => {
      if (serverMode && client) {
        setBusy(true);
        try {
          await client.schedule({ tz, sleep: { start: hhmm(input.schedule.bedMin), end: hhmm(input.schedule.wakeMin) } });
          const res = await client.createPet(input.name, input.mode);
          applyServer(res, client.baseUrl);
          return null;
        } catch (e) {
          setOnline(!(e instanceof OfflineError));
          return describeError(e);
        } finally {
          setBusy(false);
        }
      }
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
      return null;
    },
    [serverMode, client, tz, applyServer, update],
  );

  const bringHome = useCallback(async (): Promise<string | null> => {
    if (serverMode) {
      const res = await mutateServer((c, id) => c.retrieve(id, 'home'));
      return typeof res === 'string' ? res : null;
    }
    withPet((p, v) => bringHomeFromNagyi(p, v).state);
    return null;
  }, [serverMode, mutateServer, withPet]);

  const replaceWithEgg = useCallback(
    (cause: 'auto' | 'nagyinal', name: string, mode: Mode) => {
      const s = saveRef.current;
      if (!s.pet) return;
      const v = virtualNow(s.time);
      const p = s.pet;
      const memorialCause = cause === 'nagyinal' ? 'nagyinal' : (p.deathCause ?? 'elhanyagolas');
      const entry = memorialFromPet(p, p.diedAt ?? floorMin(v), memorialCause);
      const egg = createSuccessorEgg({ parent: p, id: newId(), name, mode, now: v, seed: newSeed(), inheritance: true });
      update((cur) => ({
        ...cur,
        pet: egg,
        memorial: [entry, ...cur.memorial.filter((m) => m.id !== entry.id)],
        meta: { ...cur.meta, firstCare: { fed: false, cleaned: false } },
      }));
    },
    [update],
  );

  const refreshMemorial = useCallback(async () => {
    if (!client) return;
    try {
      const res = await client.memorial();
      const r = remoteRef.current;
      if (r) setRemoteCache({ ...r, memorial: res.entries });
    } catch (e) {
      setServerError(describeError(e));
    }
  }, [client, setRemoteCache]);

  const leaveWithNagyi = useCallback(async (): Promise<string | null> => {
    if (serverMode) {
      const res = await mutateServer((c, id) => c.retrieve(id, 'stay'));
      if (typeof res === 'string') return res;
      await refreshMemorial();
      return null;
    }
    const p = saveRef.current.pet;
    if (p) replaceWithEgg('nagyinal', p.name, 'alap');
    return null;
  }, [serverMode, mutateServer, refreshMemorial, replaceWithEgg]);

  const closeLife = useCallback(
    async (name: string, mode: Mode): Promise<string | null> => {
      if (serverMode && client) {
        setBusy(true);
        try {
          const res = await client.createPet(name, mode);
          applyServer(res, client.baseUrl);
          update((cur) => ({ ...cur, meta: { ...cur.meta, firstCare: { fed: false, cleaned: false } } }));
          await refreshMemorial();
          return null;
        } catch (e) {
          return describeError(e);
        } finally {
          setBusy(false);
        }
      }
      replaceWithEgg('auto', name, mode);
      return null;
    },
    [serverMode, client, applyServer, update, refreshMemorial, replaceWithEgg],
  );

  const startVacationDays = useCallback(
    async (days: number): Promise<string | null> => {
      if (serverMode) {
        const end = new Date(serverNow() + days * 24 * 60 * MIN).toISOString();
        const res = await mutateServer((c) => c.startVacation(end));
        return typeof res === 'string' ? res : null;
      }
      catchUp(false);
      const s = saveRef.current;
      if (!s.pet) return VACATION_ERROR_TEXT.notAlive;
      const v = virtualNow(s.time);
      const r = startVacation(s.pet, ctx, s.vacationHistory, v, v + days * 24 * 60 * MIN, v);
      if (r.error) return VACATION_ERROR_TEXT[r.error];
      const planned = r.state.vacation!;
      update((cur) => ({ ...cur, pet: r.state, vacationHistory: [...cur.vacationHistory, planned] }));
      return null;
    },
    [serverMode, serverNow, mutateServer, catchUp, ctx, update],
  );

  const endVacationNow = useCallback(async (): Promise<string | null> => {
    if (serverMode) {
      const id = remoteRef.current?.activeVacationId;
      if (!id) return 'A szabadság azonosítója nem ismert; frissítsd az állapotot.';
      const res = await mutateServer((c) => c.endVacation(id));
      return typeof res === 'string' ? res : null;
    }
    catchUp(false);
    const s = saveRef.current;
    if (!s.pet?.vacation) return null;
    const planned = s.pet.vacation;
    const r = endVacation(s.pet, ctx, virtualNow(s.time));
    update((cur) => ({
      ...cur,
      pet: r.state,
      vacationHistory: cur.vacationHistory
        .filter((h) => !(h.start === planned.start && h.end === planned.end))
        .concat(r.finished ? [r.finished] : []),
    }));
    return null;
  }, [serverMode, mutateServer, catchUp, ctx, update]);

  /** Szerver módban a napirend-végpont; utána friss állapot. */
  const putSchedule = useCallback(
    async (body: Record<string, unknown>): Promise<string | null> => {
      if (!client) return null;
      setBusy(true);
      try {
        await client.schedule({ tz, ...body });
        await syncServer(false);
        return null;
      } catch (e) {
        return describeError(e);
      } finally {
        setBusy(false);
      }
    },
    [client, tz, syncServer],
  );

  const changeSchedule = useCallback(
    async (schedule: Schedule): Promise<string | null> => {
      if (serverMode) {
        const err = await putSchedule({ sleep: { start: hhmm(schedule.bedMin), end: hhmm(schedule.wakeMin) } });
        return err ?? 'Elmentve. A következő ébredéstől érvényes.';
      }
      catchUp(false);
      const s = saveRef.current;
      if (!s.pet) return null;
      const r = requestScheduleChange(s.pet, schedule, virtualNow(s.time));
      if (r.error) return SCHEDULE_ERROR_TEXT[r.error];
      update((cur) => ({ ...cur, pet: r.state }));
      return 'Elmentve. A következő ébredéstől érvényes.';
    },
    [serverMode, putSchedule, catchUp, update],
  );

  const setDaycare = useCallback(
    async (daycare: Daycare): Promise<string | null> => {
      if (serverMode) {
        const days = daycare.days.flatMap((d, i) => (d ? [i] : []));
        return putSchedule({
          napkozi: daycare.enabled ? [{ days, start: hhmm(daycare.startMin), end: hhmm(daycare.endMin) }] : [],
        });
      }
      withPet((p) => ({ ...p, daycare: { ...daycare, days: [...daycare.days] } }));
      return null;
    },
    [serverMode, putSchedule, withPet],
  );

  const setAutoLights = useCallback(
    async (value: boolean): Promise<string | null> => {
      if (serverMode) return putSchedule({ autoLights: value });
      withPet((p) => ({ ...p, autoLights: value }));
      return null;
    },
    [serverMode, putSchedule, withPet],
  );

  const downgrade = useCallback(async (): Promise<string | null> => {
    if (serverMode) {
      const res = await mutateServer((c, id) => c.downgrade(id));
      return typeof res === 'string' ? res : null;
    }
    withPet((p) => downgradeToAlap(p));
    return null;
  }, [serverMode, mutateServer, withPet]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => update((cur) => ({ ...cur, settings: { ...cur.settings, ...patch } })),
    [update],
  );

  const setNotifyCategory = useCallback(
    (cat: NotifyCategory, value: boolean) => {
      update((cur) => ({
        ...cur,
        settings: { ...cur.settings, notifyOverrides: { ...cur.settings.notifyOverrides, [cat]: value } },
      }));
      // A szerver a push-tartaléknál veszi figyelembe a kategóriát.
      client?.notifications({ overrides: { [cat]: value } }).catch(() => undefined);
    },
    [update, client],
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
    (id: string, text: string) => {
      const epitaph = text.slice(0, 140);
      if (serverMode && client) {
        client
          .updateMemorial(id, { epitaph })
          .then(({ entry }) => {
            const r = remoteRef.current;
            if (r) setRemoteCache({ ...r, memorial: r.memorial.map((m) => (m.id === id ? entry : m)) });
          })
          .catch((e) => setServerError(describeError(e)));
        return;
      }
      update((cur) => ({ ...cur, memorial: cur.memorial.map((m) => (m.id === id ? { ...m, epitaph } : m)) }));
    },
    [serverMode, client, setRemoteCache, update],
  );

  const giveFlower = useCallback(
    (id: string) => {
      if (serverMode && client) {
        client
          .updateMemorial(id, { flower: true })
          .then(({ entry }) => {
            const r = remoteRef.current;
            if (r) setRemoteCache({ ...r, memorial: r.memorial.map((m) => (m.id === id ? entry : m)) });
          })
          .catch((e) => setServerError(describeError(e)));
        return;
      }
      update((cur) => {
        const day = todayKey(Date.now());
        return {
          ...cur,
          memorial: cur.memorial.map((m) =>
            m.id === id && m.lastFlowerDay !== day ? { ...m, flowers: m.flowers + 1, lastFlowerDay: day } : m,
          ),
        };
      });
    },
    [serverMode, client, setRemoteCache, update],
  );

  const deletionCode = useCallback(async (): Promise<string | null> => {
    if (!client) return null;
    try {
      return (await client.deletionCode()).code;
    } catch (e) {
      setServerError(describeError(e));
      return null;
    }
  }, [client]);

  const connectServer = useCallback(
    async (url: string): Promise<string | null> => {
      const clean = url.trim().replace(/\/+$/, '');
      if (!/^https?:\/\/[^\s]+$/.test(clean)) return 'Érvénytelen cím. Példa: https://pixeltojas-api.vercel.app';
      const probe = new GameClient({
        baseUrl: clean,
        tz,
        appVersion: APP_VERSION,
        getSession: () => sessionRef.current ?? freshSession(),
        onSession: (s) => {
          sessionRef.current = s;
          storeSession(s).catch(() => undefined);
        },
      });
      try {
        const h = await probe.health();
        if (!h.ok) return 'A szerver válaszolt, de nem üzemképes (adatbázis).';
      } catch (e) {
        return e instanceof OfflineError ? 'A szerver nem érhető el ezen a címen.' : describeError(e);
      }
      setRemoteCache(null);
      update((cur) => ({ ...cur, settings: { ...cur.settings, serverUrl: clean } }));
      return null;
    },
    [tz, setRemoteCache, update],
  );

  const disconnectServer = useCallback(() => {
    setRemoteCache(null);
    update((cur) => ({ ...cur, settings: { ...cur.settings, serverUrl: null } }));
  }, [setRemoteCache, update]);

  const setTimeScale = useCallback(
    (scale: number) => {
      if (serverMode) return;
      catchUp(false);
      update((cur) => ({ ...cur, time: rescale(cur.time, scale) }));
    },
    [serverMode, catchUp, update],
  );

  const resetAll = useCallback(async (): Promise<string | null> => {
    if (serverMode && client) {
      try {
        await client.deleteAccount();
      } catch (e) {
        return describeError(e);
      }
      const fresh = freshSession();
      sessionRef.current = fresh;
      await storeSession(fresh).catch(() => undefined);
    }
    await clearSchedule().catch(() => undefined);
    await AsyncStorage.multiRemove([SAVE_KEY, REMOTE_KEY]).catch(() => undefined);
    const base = emptySave();
    const next = { ...base, settings: { ...base.settings, serverUrl: saveRef.current.settings.serverUrl } };
    saveRef.current = next;
    setSave(next);
    remoteRef.current = null;
    setRemote(null);
    setProjected(null);
    setLastMessage(null);
    setSummary(null);
    return null;
  }, [serverMode, client]);

  const exportJson = useCallback(async () => {
    if (serverMode && client) {
      try {
        return JSON.stringify(await client.exportData(), null, 2);
      } catch (e) {
        return describeError(e);
      }
    }
    return JSON.stringify(saveRef.current, null, 2);
  }, [serverMode, client]);

  const refresh = useCallback(async () => {
    if (serverMode) await syncServer(false);
    else catchUp(false);
  }, [serverMode, syncServer, catchUp]);

  return {
    ready,
    synced: !serverMode || remote !== null,
    mode: serverMode ? 'server' : 'local',
    serverUrl,
    online,
    serverError,
    busy,
    save,
    pet,
    now,
    ctx,
    memorial: serverMode ? (remote?.memorial ?? []) : save.memorial,
    entitlements: serverMode ? (remote?.entitlements ?? null) : null,
    minigameSeed: serverMode ? (remote?.minigameSeed ?? null) : null,
    userId: sessionRef.current?.userId ?? null,
    lastMessage,
    summary,
    permission,
    dismissSummary: () => setSummary(null),
    refresh,
    connectServer,
    disconnectServer,
    createFirstEgg,
    warm,
    care,
    playMinigame,
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
    refreshMemorial,
    deletionCode,
    setTimeScale,
    resetAll,
    exportJson,
  };
}
