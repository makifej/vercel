import { createHash, createHmac, generateKeyPairSync, sign } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { issueToken, verifyToken } from '../src/auth';
import { UpstashKv } from '../src/kv';
import { verifyQstashSignature } from '../src/routes/ops';
import { createIdTokenVerifier } from '../src/services/idtoken';
import { zoneLocalTime } from '../src/time';

const b64 = (v: object | Buffer) => (Buffer.isBuffer(v) ? v : Buffer.from(JSON.stringify(v))).toString('base64url');

describe('token', () => {
  it('aláírás, lejárat, hamisítás', () => {
    const now = Date.UTC(2026, 10, 2);
    const { token } = issueToken('titok', 'u_abc', now, 30);
    expect(verifyToken('titok', token, now)?.userId).toBe('u_abc');
    expect(verifyToken('masik', token, now)).toBeNull();
    expect(verifyToken('titok', token, now + 31 * 86_400_000)).toBeNull();
    expect(verifyToken('titok', token.replace('u_abc', 'u_xyz'), now)).toBeNull();
  });
});

describe('időzóna', () => {
  it('Europe/Budapest DST-váltás (2026-03-29 02:00 -> 03:00)', () => {
    const local = zoneLocalTime('Europe/Budapest');
    expect(local(Date.UTC(2026, 2, 29, 0, 30)).minuteOfDay).toBe(1 * 60 + 30);
    expect(local(Date.UTC(2026, 2, 29, 1, 30)).minuteOfDay).toBe(3 * 60 + 30);
    expect(local(Date.UTC(2026, 10, 2, 6, 0))).toEqual({ minuteOfDay: 7 * 60, weekday: 1 });
  });
});

describe('QStash aláírás', () => {
  const key = 'sig-kulcs';
  const now = Date.UTC(2026, 10, 2, 6, 0);
  const make = (claims: object, k = key) => {
    const head = b64({ alg: 'HS256', typ: 'JWT' });
    const payload = b64(claims);
    const sig = createHmac('sha256', k).update(`${head}.${payload}`).digest('base64url');
    return `${head}.${payload}.${sig}`;
  };
  const bodyHash = createHash('sha256').update('{}').digest('base64url');
  const good = { iss: 'Upstash', sub: 'https://api.example/v1/cron/tick', exp: now / 1000 + 300, nbf: now / 1000, body: bodyHash };

  it('elfogadja az érvényeset, a második kulccsal is', () => {
    expect(verifyQstashSignature(make(good), '{}', [key], now, 'https://api.example/v1/cron/tick')).toBe(true);
    expect(verifyQstashSignature(make(good, 'kov'), '{}', [key, 'kov'], now, null)).toBe(true);
  });

  it('elutasítja a rossz kulcsot, törzset, URL-t, lejártat', () => {
    expect(verifyQstashSignature(make(good, 'rossz'), '{}', [key], now, null)).toBe(false);
    expect(verifyQstashSignature(make(good), '{"x":1}', [key], now, null)).toBe(false);
    expect(verifyQstashSignature(make(good), '{}', [key], now, 'https://mas/v1/cron/tick')).toBe(false);
    expect(verifyQstashSignature(make({ ...good, exp: now / 1000 - 1 }), '{}', [key], now, null)).toBe(false);
    expect(verifyQstashSignature(make({ ...good, iss: 'mas' }), '{}', [key], now, null)).toBe(false);
  });
});

describe('Apple/Google ID-token', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
  const now = Date.UTC(2026, 10, 2, 6, 0);
  const verifier = createIdTokenVerifier({
    audiences: { apple: ['hu.pixeltojas.app'], google: ['google-client'] },
    now: () => now,
    fetchJwks: async () => [jwk],
  });
  const make = (claims: object, kid = 'k1') => {
    const head = b64({ alg: 'RS256', kid });
    const payload = b64(claims);
    const sig = sign('RSA-SHA256', Buffer.from(`${head}.${payload}`), privateKey).toString('base64url');
    return `${head}.${payload}.${sig}`;
  };
  const apple = { iss: 'https://appleid.apple.com', aud: 'hu.pixeltojas.app', sub: 'apple-1', exp: now / 1000 + 600 };

  it('érvényes Apple-token', async () => {
    expect(await verifier('apple', make(apple))).toEqual({ provider: 'apple', sub: 'apple-1', email: null });
  });

  it('rossz közönség, kibocsátó, lejárt token, ismeretlen kulcs, módosított tartalom', async () => {
    expect(await verifier('apple', make({ ...apple, aud: 'mas' }))).toBeNull();
    expect(await verifier('apple', make({ ...apple, iss: 'https://accounts.google.com' }))).toBeNull();
    expect(await verifier('apple', make({ ...apple, exp: now / 1000 - 1 }))).toBeNull();
    expect(await verifier('apple', make(apple, 'ismeretlen'))).toBeNull();
    const [h, , s] = make(apple).split('.');
    expect(await verifier('apple', `${h}.${b64({ ...apple, sub: 'tamado' })}.${s}`)).toBeNull();
    expect(await verifier('google', make({ ...apple, iss: 'https://accounts.google.com', aud: 'google-client' }))).toEqual({
      provider: 'google',
      sub: 'apple-1',
      email: null,
    });
  });
});

describe('Upstash REST', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('JSON-tömb parancsok, SET NX EX, CAS-szkript', async () => {
    const calls: { url: string; body: unknown }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        const body = JSON.parse(String(init.body));
        calls.push({ url, body });
        const result = Array.isArray(body[0]) ? [{ result: 'OK' }, { result: 3 }] : { result: body[0] === 'EVAL' ? 1 : 'OK' };
        return new Response(JSON.stringify(result), { status: 200 });
      }),
    );
    const kv = new UpstashKv('https://db.upstash.io', 'tok');
    expect(await kv.set('k', 'v', { nx: true, exSeconds: 60 })).toBe(true);
    expect(calls[0]).toEqual({ url: 'https://db.upstash.io', body: ['SET', 'k', 'v', 'EX', '60', 'NX'] });
    expect(await kv.incrWindow('rl', 120)).toBe(3);
    expect(calls[1].url).toBe('https://db.upstash.io/pipeline');
    expect(calls[1].body).toEqual([
      ['SET', 'rl', '0', 'EX', '120', 'NX'],
      ['INCR', 'rl'],
    ]);
    expect(await kv.casSet('p:1', 'p:1:v', 4, '{}')).toBe(true);
    const cas = calls[2].body as string[];
    expect(cas[0]).toBe('EVAL');
    expect(cas.slice(2)).toEqual(['2', 'p:1', 'p:1:v', '4', '5', '{}']);
  });

  it('Upstash-hiba KvError, a végpont 503-at ad', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'ERR' }), { status: 400 })));
    const kv = new UpstashKv('https://db.upstash.io', 'tok');
    await expect(kv.get('x')).rejects.toThrow('Upstash');
  });
});
