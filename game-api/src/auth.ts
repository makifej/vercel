// HMAC-SHA256-tal aláírt hozzáférési token (PRD 13.9): `v1.<userId>.<lejárat>.<aláírás>`.
// 30 napos gördülő érvényesség: a szerver a lejárat felénél újat ad.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const b64url = (buf: Buffer) => buf.toString('base64url');

function sign(secret: string, payload: string): string {
  return b64url(createHmac('sha256', secret).update(payload).digest());
}

export function newUserId(): string {
  return `u_${randomBytes(12).toString('hex')}`;
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString('hex')}`;
}

export function issueToken(secret: string, userId: string, now: number, ttlDays: number): { token: string; expiresAt: number } {
  const expSec = Math.floor(now / 1000) + ttlDays * 86_400;
  const payload = `v1.${userId}.${expSec}`;
  return { token: `${payload}.${sign(secret, payload)}`, expiresAt: expSec * 1000 };
}

export function verifyToken(secret: string, token: string, now: number): { userId: string; expiresAt: number } | null {
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return null;
  const [, userId, expStr, sig] = parts;
  const expected = Buffer.from(sign(secret, `v1.${userId}.${expStr}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const expiresAt = Number(expStr) * 1000;
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;
  return { userId, expiresAt };
}

/** Időzítés-biztos összehasonlítás titkos fejlécekhez (webhook, cron). */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
