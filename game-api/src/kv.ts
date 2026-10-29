// Kulcs-érték réteg. Élesben az Upstash Redis REST API-ja, tesztben és helyi
// fejlesztésben memória. A parancsokat JSON-tömbként küldjük POST törzsben, így
// nincs URL-kódolási csapda (a meglévő backend a SET NX-et path-szegmensként
// kellett küldje, mert a query-forma szintaxishibát adott).

export class KvError extends Error {}

export interface ZEntry {
  score: number;
  member: string;
}

export interface Kv {
  get(key: string): Promise<string | null>;
  mget(keys: string[]): Promise<(string | null)[]>;
  /** true, ha az írás megtörtént (NX esetén false, ha a kulcs már létezett). */
  set(key: string, value: string, opts?: { nx?: boolean; exSeconds?: number }): Promise<boolean>;
  del(keys: string[]): Promise<number>;
  /** Ablakos számláló: az első növelés állítja be a lejáratot. */
  incrWindow(key: string, ttlSeconds: number): Promise<number>;
  rpush(key: string, value: string): Promise<void>;
  lrange(key: string): Promise<string[]>;
  sadd(key: string, members: string[]): Promise<void>;
  srem(key: string, members: string[]): Promise<void>;
  smembers(key: string): Promise<string[]>;
  zadd(key: string, entries: ZEntry[]): Promise<void>;
  zrem(key: string, members: string[]): Promise<void>;
  zrangeByScore(key: string, maxScore: number, limit: number): Promise<string[]>;
  /** Optimista zárolás: csak akkor ír, ha a verziókulcs értéke `expectedRev` (PRD NFR-07). */
  casSet(key: string, revKey: string, expectedRev: number, value: string): Promise<boolean>;
  ping(): Promise<boolean>;
}

const CAS_SCRIPT = `
local cur = redis.call('GET', KEYS[2])
if cur == false then cur = '0' end
if cur ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[3])
redis.call('SET', KEYS[2], ARGV[2])
return 1`;

type Command = (string | number)[];

export class UpstashKv implements Kv {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly timeoutMs = 2500,
  ) {}

  private async call<T>(path: string, body: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.url}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (e) {
      throw new KvError(`Upstash nem érhető el: ${(e as Error).message}`);
    }
    const data = (await res.json().catch(() => null)) as unknown;
    if (!res.ok || data === null) throw new KvError(`Upstash hiba: HTTP ${res.status}`);
    return data as T;
  }

  private async cmd<T>(command: Command): Promise<T> {
    const data = await this.call<{ result?: T; error?: string }>('', command.map(String));
    if (data.error) throw new KvError(`Upstash: ${data.error}`);
    return data.result as T;
  }

  get(key: string) {
    return this.cmd<string | null>(['GET', key]);
  }

  async mget(keys: string[]) {
    if (keys.length === 0) return [];
    return this.cmd<(string | null)[]>(['MGET', ...keys]);
  }

  async set(key: string, value: string, opts: { nx?: boolean; exSeconds?: number } = {}) {
    const command: Command = ['SET', key, value];
    if (opts.exSeconds) command.push('EX', opts.exSeconds);
    if (opts.nx) command.push('NX');
    return (await this.cmd<string | null>(command)) === 'OK';
  }

  async del(keys: string[]) {
    if (keys.length === 0) return 0;
    return this.cmd<number>(['DEL', ...keys]);
  }

  async incrWindow(key: string, ttlSeconds: number) {
    // SET NX EX hozza létre a lejárattal; az INCR a lejáratot nem írja felül.
    // (Az EXPIRE ... NX Redis 7-es opció, ezt kerüljük.)
    const data = await this.call<{ result?: number; error?: string }[]>('/pipeline', [
      ['SET', key, '0', 'EX', String(ttlSeconds), 'NX'],
      ['INCR', key],
    ]);
    const incr = data[1];
    if (!incr || incr.error) throw new KvError(`Upstash: ${incr?.error ?? 'pipeline'}`);
    return Number(incr.result);
  }

  async rpush(key: string, value: string) {
    await this.cmd(['RPUSH', key, value]);
  }

  lrange(key: string) {
    return this.cmd<string[]>(['LRANGE', key, 0, -1]);
  }

  async sadd(key: string, members: string[]) {
    if (members.length) await this.cmd(['SADD', key, ...members]);
  }

  async srem(key: string, members: string[]) {
    if (members.length) await this.cmd(['SREM', key, ...members]);
  }

  smembers(key: string) {
    return this.cmd<string[]>(['SMEMBERS', key]);
  }

  async zadd(key: string, entries: ZEntry[]) {
    if (entries.length === 0) return;
    await this.cmd(['ZADD', key, ...entries.flatMap((e) => [e.score, e.member])]);
  }

  async zrem(key: string, members: string[]) {
    if (members.length) await this.cmd(['ZREM', key, ...members]);
  }

  zrangeByScore(key: string, maxScore: number, limit: number) {
    return this.cmd<string[]>(['ZRANGEBYSCORE', key, '-inf', maxScore, 'LIMIT', 0, limit]);
  }

  async casSet(key: string, revKey: string, expectedRev: number, value: string) {
    const r = await this.cmd<number>(['EVAL', CAS_SCRIPT, 2, key, revKey, expectedRev, expectedRev + 1, value]);
    return Number(r) === 1;
  }

  async ping() {
    try {
      return (await this.cmd<string>(['PING'])) === 'PONG';
    } catch {
      return false;
    }
  }
}

/** Folyamaton belüli tár tesztekhez és helyi fejlesztéshez. */
export class MemoryKv implements Kv {
  private strings = new Map<string, { value: string; expiresAt: number | null }>();
  private lists = new Map<string, string[]>();
  private sets = new Map<string, Set<string>>();
  private zsets = new Map<string, Map<string, number>>();

  constructor(private readonly now: () => number = Date.now) {}

  private live(key: string) {
    const e = this.strings.get(key);
    if (!e) return null;
    if (e.expiresAt !== null && e.expiresAt <= this.now()) {
      this.strings.delete(key);
      return null;
    }
    return e;
  }

  keys(): string[] {
    const all = [...this.strings.keys()].filter((k) => this.live(k));
    return [...all, ...this.lists.keys(), ...this.sets.keys(), ...this.zsets.keys()];
  }

  async get(key: string) {
    return this.live(key)?.value ?? null;
  }

  async mget(keys: string[]) {
    return keys.map((k) => this.live(k)?.value ?? null);
  }

  async set(key: string, value: string, opts: { nx?: boolean; exSeconds?: number } = {}) {
    if (opts.nx && this.live(key)) return false;
    this.strings.set(key, { value, expiresAt: opts.exSeconds ? this.now() + opts.exSeconds * 1000 : null });
    return true;
  }

  async del(keys: string[]) {
    let n = 0;
    for (const k of keys) {
      if (this.live(k)) n++;
      if (this.lists.has(k) || this.sets.has(k) || this.zsets.has(k)) n++;
      this.strings.delete(k);
      this.lists.delete(k);
      this.sets.delete(k);
      this.zsets.delete(k);
    }
    return n;
  }

  async incrWindow(key: string, ttlSeconds: number) {
    const cur = this.live(key);
    const next = (cur ? Number(cur.value) : 0) + 1;
    this.strings.set(key, { value: String(next), expiresAt: cur?.expiresAt ?? this.now() + ttlSeconds * 1000 });
    return next;
  }

  async rpush(key: string, value: string) {
    this.lists.set(key, [...(this.lists.get(key) ?? []), value]);
  }

  async lrange(key: string) {
    return [...(this.lists.get(key) ?? [])];
  }

  async sadd(key: string, members: string[]) {
    const s = this.sets.get(key) ?? new Set<string>();
    members.forEach((m) => s.add(m));
    this.sets.set(key, s);
  }

  async srem(key: string, members: string[]) {
    const s = this.sets.get(key);
    members.forEach((m) => s?.delete(m));
  }

  async smembers(key: string) {
    return [...(this.sets.get(key) ?? [])];
  }

  async zadd(key: string, entries: ZEntry[]) {
    const z = this.zsets.get(key) ?? new Map<string, number>();
    entries.forEach((e) => z.set(e.member, e.score));
    this.zsets.set(key, z);
  }

  async zrem(key: string, members: string[]) {
    const z = this.zsets.get(key);
    members.forEach((m) => z?.delete(m));
  }

  async zrangeByScore(key: string, maxScore: number, limit: number) {
    return [...(this.zsets.get(key) ?? new Map<string, number>()).entries()]
      .filter(([, score]) => score <= maxScore)
      .sort((a, b) => a[1] - b[1])
      .slice(0, limit)
      .map(([m]) => m);
  }

  async casSet(key: string, revKey: string, expectedRev: number, value: string) {
    const cur = this.live(revKey)?.value ?? '0';
    if (cur !== String(expectedRev)) return false;
    this.strings.set(key, { value, expiresAt: null });
    this.strings.set(revKey, { value: String(expectedRev + 1), expiresAt: null });
    return true;
  }

  async ping() {
    return true;
  }
}
