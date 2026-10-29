// A játék-backend Express-alkalmazása (PRD 13.5). Külön Vercel-projekt, saját
// Upstash-adatbázissal; a meglévő emlékeztető-backendtől teljesen független.

import express from 'express';
import { loadConfig } from './config';
import { errorHandler, type Deps } from './http';
import { MemoryKv, UpstashKv } from './kv';
import { accountRoutes } from './routes/account';
import { authRoutes } from './routes/auth';
import { commerceRoutes } from './routes/commerce';
import { gameRoutes } from './routes/game';
import { opsRoutes } from './routes/ops';
import { createIdTokenVerifier } from './services/idtoken';
import { createExpoPushSender } from './services/push';

export function createApp(deps: Deps): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(
    express.json({
      limit: '64kb',
      // A QStash-aláírás a nyers törzs lenyomatát ellenőrzi.
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(authRoutes(deps));
  app.use(gameRoutes(deps));
  app.use(commerceRoutes(deps));
  app.use(accountRoutes(deps));
  app.use(opsRoutes(deps));
  app.use((_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });
  app.use(errorHandler);
  return app;
}

export function defaultDeps(env: NodeJS.ProcessEnv = process.env): Deps {
  const config = loadConfig(env);
  const now = () => Date.now();
  const kv =
    config.kvUrl && config.kvToken
      ? new UpstashKv(config.kvUrl, config.kvToken)
      : // Helyi fejlesztés Upstash nélkül; élesben a /v1/health 503 helyett ezt jelzi a napló.
        (console.warn('[game-api] Nincs Upstash-beállítás, memóriatár fut (csak helyi fejlesztéshez).'), new MemoryKv(now));
  return {
    kv,
    now,
    config,
    push: createExpoPushSender(config.expoAccessToken),
    verifyIdToken: createIdTokenVerifier({
      audiences: { apple: config.appleAudiences, google: config.googleClientIds },
      now,
    }),
    revenueCatDelete: async (userId) => {
      if (!config.revenueCatSecretKey) return;
      // RevenueCat REST API v1 ügyféltörlés [ELLENŐRIZENDŐ: végpont és jogosultság].
      const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${config.revenueCatSecretKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok && res.status !== 404) throw new Error(`RevenueCat HTTP ${res.status}`);
    },
  };
}
