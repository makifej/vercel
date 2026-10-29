// Fiók törlése és exportja (PRD 13.9, FR-35, FR-36). Az anonim szerveroldali
// fiók is fiók, ezért alkalmazáson belüli törlés kötelező (Apple 5.1.1(v)); a
// Google Play webes törlési útvonalat is kér, ezt egy törlési kód szolgálja ki.

import { randomBytes } from 'node:crypto';
import express, { Router } from 'express';
import { limitByIp, locals, requireAuth, type Deps } from '../http';
import { getProfile, keys, saveProfile } from '../store';
import { iso } from '../time';

export async function deleteUser(deps: Deps, userId: string): Promise<void> {
  const { kv } = deps;
  const profile = await getProfile(kv, userId);
  const petIds = await kv.lrange(keys.userPets(userId));
  for (const petId of petIds) {
    const due = await kv.smembers(keys.petDue(petId));
    if (due.length) await kv.zrem(keys.duePush, due);
    await kv.del([keys.pet(petId), keys.petRev(petId), keys.petDue(petId), keys.memorial(petId)]);
  }
  const toDelete = [keys.user(userId), keys.userPets(userId), keys.pushTokens(userId), keys.trial(userId)];
  if (profile) {
    for (const [provider, sub] of Object.entries(profile.providers)) {
      if (sub && (await kv.get(keys.auth(provider, sub))) === userId) toDelete.push(keys.auth(provider, sub));
    }
    if (profile.installHash) toDelete.push(keys.install(profile.installHash));
    if (profile.deletionCode) toDelete.push(keys.deletionCode(profile.deletionCode));
  }
  await kv.del(toDelete);
  // A `trial:fp:*` visszaélés-jelzés megőrzése jogi kérdés (PRD 13.9 [JOGI]); itt marad.
  await deps.revenueCatDelete(userId).catch((e) => console.error('[game-api] RevenueCat törlés sikertelen', e));
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newDeletionCode(): string {
  const bytes = randomBytes(10);
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

const page = (body: string) => `<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pixeltojás: fiók törlése</title>
<style>body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;line-height:1.5;color:#1d2420}
input,button{font-size:18px;padding:10px;margin-top:8px}button{background:#1d2420;color:#fff;border:0;border-radius:8px}</style>
</head><body><h1>Pixeltojás: fiók törlése</h1>${body}</body></html>`;

export function accountRoutes(deps: Deps): Router {
  const r = Router();
  const auth = requireAuth(deps);

  r.delete('/v1/account', auth, async (_req, res) => {
    await deleteUser(deps, locals(res).userId);
    res.json({ deleted: true, serverNow: iso(deps.now()) });
  });

  r.get('/v1/account/export', auth, async (_req, res) => {
    const { profile } = locals(res);
    const petIds = await deps.kv.lrange(keys.userPets(profile.userId));
    const pets = await deps.kv.mget(petIds.map((id) => keys.pet(id)));
    const memorial = await deps.kv.mget(petIds.map((id) => keys.memorial(id)));
    const { deletionCode: _code, installHash: _hash, ...publicProfile } = profile;
    res.json({
      exportedAt: iso(deps.now()),
      profile: publicProfile,
      pets: pets.filter((x): x is string => x !== null).map((x) => JSON.parse(x).state),
      memorial: memorial.filter((x): x is string => x !== null).map((x) => JSON.parse(x)),
    });
  });

  r.get('/v1/account/deletion-code', auth, async (_req, res) => {
    const { profile } = locals(res);
    if (!profile.deletionCode) {
      const code = newDeletionCode();
      await deps.kv.set(keys.deletionCode(code), profile.userId);
      profile.deletionCode = code;
      await saveProfile(deps.kv, profile);
    }
    res.json({ code: profile.deletionCode, url: '/delete-account' });
  });

  r.get('/delete-account', (_req, res) => {
    res.type('html').send(
      page(`<p>A játékbeli fiókod és minden adatod (kedvencek, emlékkert, beállítások) véglegesen törölhető.
A legegyszerűbb az alkalmazásban: Beállítások, Adatok, Fiók törlése. Ha az alkalmazás már nincs meg,
add meg a törlési kódot, amelyet az alkalmazás a Beállításokban mutat.</p>
<form method="post" action="/delete-account"><label>Törlési kód<br><input name="code" autocomplete="off" required></label><br>
<button type="submit">Fiók végleges törlése</button></form>`),
    );
  });

  r.post('/delete-account', limitByIp(deps, 'delete', 5), express.urlencoded({ extended: false }), async (req, res) => {
    const code = String(req.body?.code ?? '').trim().toUpperCase();
    const userId = code ? await deps.kv.get(keys.deletionCode(code)) : null;
    if (!userId) {
      res.status(404).type('html').send(page('<p>Ismeretlen törlési kód. Ellenőrizd, és próbáld újra.</p><p><a href="/delete-account">Vissza</a></p>'));
      return;
    }
    await deleteUser(deps, userId);
    res.type('html').send(page('<p>A fiókot és minden hozzá tartozó adatot töröltük.</p>'));
  });

  return r;
}
