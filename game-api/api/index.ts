// Vercel belépési pont: egyetlen függvény, a vercel.json minden útvonalat ide irányít.
import { createApp, defaultDeps } from '../src/app';

export default createApp(defaultDeps());
