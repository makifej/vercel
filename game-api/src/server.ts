// Helyi futtatás: `npm run dev`. A Vercel a `api/index.ts` alapértelmezett exportját használja.
import { createApp, defaultDeps } from './app';

const port = Number(process.env.PORT ?? 3001);
createApp(defaultDeps()).listen(port, () => console.log(`game-api: http://localhost:${port}`));
