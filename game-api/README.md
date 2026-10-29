# Pixeltojás game-api

A játék backendje a [PRD](../docs/PRD-tamagotchi.md) 13. fejezete szerint: Express 5 + TypeScript egyetlen Vercel-függvényben, saját Upstash Redis adatbázissal. A meglévő emlékeztető-backendtől (`../api`) teljesen független; annak deployja ezt a mappát nem tölti fel (`.vercelignore`).

A szerver ugyanazt a determinisztikus szimulációt futtatja, mint a telefon. A kanonikus forrás a `mobile/src/sim`, ide másolatként kerül (`npm run sync-sim`); a CI `npm run check-sim` lépése elbukik, ha a kettő eltér.

## Telepítés (új Vercel-projekt)

1. Vercelben új projekt ugyanebből a repóból, **Root Directory: `game-api`**. A régió a `vercel.json` szerint `fra1` (uniós, NFR-09).
2. Új, uniós régiós Upstash Redis adatbázis kifejezetten ehhez a projekthez (PRD 13.5: a kulcsok ütköznének a meglévővel).
3. Környezeti változók:

| Változó | Kötelező | Szerep |
|---|---|---|
| `AUTH_SECRET` | igen | a tokenek HMAC-kulcsa; hosszú, véletlen érték |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (vagy `KV_REST_API_*`) | igen | adatbázis |
| `CRON_SECRET` | push-tartalékhoz | Vercel Cron Bearer-titka |
| `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `PUBLIC_BASE_URL` | QStash-ütemezéshez | aláírás-ellenőrzés |
| `REVENUECAT_WEBHOOK_AUTH` | vásárláshoz | a RevenueCat webhook Authorization fejléce |
| `REVENUECAT_SECRET_KEY` | ajánlott | RevenueCat-oldali törlés fióktörléskor |
| `APPLE_AUDIENCES`, `GOOGLE_CLIENT_IDS` | összekapcsoláshoz | az ID-tokenek elfogadott közönsége (vesszővel) |
| `PET_PROMO_CODES`, `PROMO_STATS_KEY` | nem | `KOD:juttatas` párok; statisztika kulcsa |
| `EXPO_ACCESS_TOKEN` | nem | Expo push-hozzáférés-védelem esetén |
| `MIN_APP_VERSION`, `RL_PER_USER_PER_MIN`, `RL_PER_IP_PER_MIN`, `TOKEN_TTL_DAYS`, `MINIGAME_SALT` | nem | finomhangolás |

4. Push-tartalék ütemezése (PRD 13.8): zárt bétában QStash-ütemezés 5 percenként a `POST /v1/cron/tick` végpontra; Pro csomagon a `vercel.json`-ba felvehető cron (`{"path": "/v1/cron/tick", "schedule": "*/5 * * * *"}`). Hobby csomagon a napinál sűrűbb cron a deployt elbuktathatja, ezért alapból nincs benne [ELLENŐRIZENDŐ].

## Végpontok (PRD 13.7)

`POST /v1/auth/anon`, `POST /v1/auth/link`, `DELETE /v1/account`, `GET /v1/account/export`, `GET /v1/account/deletion-code`, `GET /v1/config`, `GET /v1/state`, `POST /v1/pets`, `POST /v1/pets/:id/actions`, `POST /v1/pets/:id/minigame`, `POST /v1/pets/:id/downgrade`, `POST /v1/pets/:id/retrieve`, `PUT /v1/settings/schedule`, `PUT /v1/settings/notifications`, `POST /v1/vacations`, `DELETE /v1/vacations/:id`, `GET /v1/memorial`, `PUT /v1/memorial/:petId`, `POST /v1/push/tokens`, `POST /v1/trial`, `POST /v1/promo`, `GET /v1/promo/stats`, `POST /v1/webhooks/revenuecat`, `GET|POST /v1/cron/tick`, `GET /v1/health`, `GET|POST /delete-account`.

Minden mutáció szerveridővel bélyegez, előbb a szerveridőre lépteti a kedvencet, és optimista zárolással ment (`expectedVersion`, ütközésnél 409). A műveletek azonosítója 48 órán át idempotens.

## Üzemeltetés

- **Vészleállító:** `sys:flags` = `{"deathEnabled": false}` minden Klasszikus halált Kritikus-tartásra vált.
- **Kiesés-jóváírás:** `sys:incidents` = `[{"start": <ms>, "end": <ms>}]`; ezekben az intervallumokban a szimuláció áll.
- **Minimális app-verzió:** `sys:flags` `minAppVersion` mezője vagy a `MIN_APP_VERSION` változó.

## Fejlesztés

```bash
npm ci
npm run dev        # memóriatár, ha nincs Upstash-beállítás; AUTH_SECRET kell
npm run typecheck
npm test
npm run sync-sim   # a mobile/src/sim módosítása után
```

## Eltérések a PRD-től és nyitott pontok

- A kód ebben a repóban van (`game-api/`), nem külön privát monorepóban; külön Vercel-projektként telepíthető. A repó nyilvános, ezért minden titok csak környezeti változóban él.
- A `sys:flags` és a `sys:incidents` JSON-dokumentum (a PRD hash-t, illetve rendezett halmazt ír); a `lin:{lineageId}` kulcs helyett a családfa adatai a kedvenc pillanatképében és az emlékkertben vannak.
- A csendes órák a napirend alvásablakával azonosak; a PRD 7.9 szerinti legfeljebb 3 órás bővítés még nincs. Napközi-ablakból egy adható meg.
- A RevenueCat eseménytípusai, a QStash-aláírás formátuma, a RevenueCat törlési végpontja és az Apple/Google JWKS-adatok dokumentált értékek alapján készültek, de az eredeti oldalakat a fejlesztői környezet hálózati szabálya miatt nem lehetett megnyitni [ELLENŐRIZENDŐ].
- A `GET /v1/lines` és a Gemini-szövegbank (`tools/linegen`) a PRD szerint az 1.1-es kiadás része, nincs benne.
- A mobil app még offline módban fut; a szerverhez kötése (token, szinkron, műveletek a szerveren) a következő lépés.
