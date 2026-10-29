// A játék-backend (game-api) kliense. A szerver az idő forrása (PRD 13.4): minden
// válasz `serverNow` mezőjéből a kliens eltolást számol, és ebből vetít helyben.

import type { MemorialEntry, PetState } from '../sim';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: Record<string, unknown>,
  ) {
    super(String(body.error ?? `HTTP ${status}`));
  }
  get code(): string {
    return String(this.body.error ?? '');
  }
}

/** Hálózati hiba (nincs kapcsolat, időtúllépés). */
export class OfflineError extends Error {}

export interface EntitlementsView {
  full: boolean;
  cosmetics: string[];
  perks: string[];
  trialActive: boolean;
  trialEndsAt: string | null;
}

export interface ServerEvent {
  type: string;
  at: string;
  t: number;
  call?: string;
  cause?: string;
  stage?: string;
  form?: string | null;
}

export interface StateResponse {
  serverNow: string;
  pet: PetState | null;
  version?: number;
  minigameSeed?: number;
  nextAttentionAt?: string | null;
  events?: ServerEvent[];
  activeVacationId?: string | null;
  entitlements?: EntitlementsView;
}

export interface ActionsResponse extends StateResponse {
  rejected: { id: string; reason: string }[];
}

export interface Session {
  installId: string;
  token: string | null;
  userId: string | null;
}

export interface ClientOptions {
  baseUrl: string;
  getSession: () => Session;
  onSession: (s: Session) => void;
  tz: string;
  appVersion: string;
  timeoutMs?: number;
}

export class GameClient {
  constructor(private readonly opts: ClientOptions) {}

  get baseUrl(): string {
    return this.opts.baseUrl.replace(/\/+$/, '');
  }

  private async raw(method: string, path: string, body?: unknown, token?: string | null): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs ?? 12_000);
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      throw new OfflineError((e as Error).message);
    } finally {
      clearTimeout(timer);
    }
    const refreshed = res.headers.get('X-Refreshed-Token');
    if (refreshed) this.opts.onSession({ ...this.opts.getSession(), token: refreshed });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new ApiError(res.status, data);
    return data;
  }

  /** Anonim fiók (PRD 13.9): ugyanaz a telepítési azonosító ugyanazt a fiókot kapja. */
  async signIn(): Promise<Session> {
    const s = this.opts.getSession();
    const data = (await this.raw('POST', '/v1/auth/anon', {
      installId: s.installId,
      platform: 'android',
      appVersion: this.opts.appVersion,
      locale: 'hu-HU',
      tz: this.opts.tz,
    })) as { userId: string; token: string };
    const next = { ...s, token: data.token, userId: data.userId };
    this.opts.onSession(next);
    return next;
  }

  /** Hitelesített kérés; lejárt vagy érvénytelen tokennél egyszer újra bejelentkezik. */
  async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    let token = this.opts.getSession().token;
    if (!token) token = (await this.signIn()).token;
    try {
      return (await this.raw(method, path, body, token)) as T;
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) throw e;
      const fresh = await this.signIn();
      return (await this.raw(method, path, body, fresh.token)) as T;
    }
  }

  health() {
    return this.raw('GET', '/v1/health') as Promise<{ ok: boolean; serverNow: string }>;
  }

  state() {
    return this.call<StateResponse>('GET', '/v1/state');
  }

  createPet(name: string, mode: 'alap' | 'klasszikus') {
    return this.call<StateResponse>('POST', '/v1/pets', { name, mode });
  }

  actions(petId: string, expectedVersion: number, actions: { id: string; type: string }[]) {
    return this.call<ActionsResponse>('POST', `/v1/pets/${petId}/actions`, { expectedVersion, actions });
  }

  minigame(petId: string, expectedVersion: number, game: 'merre' | 'nagyobb', guesses: string[]) {
    return this.call<StateResponse & { score: { hits: number; won: boolean }; rejected: string | null }>(
      'POST',
      `/v1/pets/${petId}/minigame`,
      { expectedVersion, game, guesses },
    );
  }

  downgrade(petId: string) {
    return this.call<StateResponse>('POST', `/v1/pets/${petId}/downgrade`, {});
  }

  retrieve(petId: string, choice: 'home' | 'stay') {
    return this.call<StateResponse>('POST', `/v1/pets/${petId}/retrieve`, { choice });
  }

  schedule(body: Record<string, unknown>) {
    return this.call<{ effectiveFrom: string | null; nextChangeAllowedAt: string | null }>('PUT', '/v1/settings/schedule', body);
  }

  notifications(body: Record<string, unknown>) {
    return this.call<unknown>('PUT', '/v1/settings/notifications', body);
  }

  startVacation(end: string) {
    return this.call<StateResponse & { remainingDays90: number }>('POST', '/v1/vacations', { start: 'now', end });
  }

  endVacation(id: string) {
    return this.call<StateResponse>('DELETE', `/v1/vacations/${id}`);
  }

  memorial() {
    return this.call<{ entries: MemorialEntry[] }>('GET', '/v1/memorial');
  }

  updateMemorial(petId: string, body: { epitaph?: string; flower?: boolean }) {
    return this.call<{ entry: MemorialEntry }>('PUT', `/v1/memorial/${petId}`, body);
  }

  deletionCode() {
    return this.call<{ code: string; url: string }>('GET', '/v1/account/deletion-code');
  }

  exportData() {
    return this.call<Record<string, unknown>>('GET', '/v1/account/export');
  }

  deleteAccount() {
    return this.call<{ deleted: boolean }>('DELETE', '/v1/account');
  }
}

/** Felhasználónak szóló, semleges hibaszöveg. */
export function describeError(e: unknown): string {
  if (e instanceof OfflineError) return 'Nincs kapcsolat a szerverrel. Próbáld újra később.';
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'entitlement_required':
        return 'Ehhez a Teljes verzió vagy aktív próbaidő kell.';
      case 'version_conflict':
        return 'Közben frissült az állapot. Próbáld újra.';
      case 'rate_limited':
        return 'Túl sok kérés. Várj egy percet.';
      case 'cooldown':
        return 'A napirend 24 óránként egyszer módosítható.';
      case 'napkozi_limit':
        return `A napközi legfeljebb ${String(e.body.maxHours)} óra lehet.`;
      case 'active_pet_exists':
        return 'Már van élő kedvenced.';
      case 'stay_not_yet_available':
        return '30 nap után választható.';
      case 'unavailable':
        return 'A szerver most nem érhető el. Próbáld újra később.';
      default:
        return `Szerverhiba (${e.status}).`;
    }
  }
  return 'Váratlan hiba történt.';
}
