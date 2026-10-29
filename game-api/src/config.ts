// Környezeti beállítások. Titok soha nem kerül a forrásba (a repó nyilvános,
// PRD NFR-08); minden érték a Vercel-projekt környezeti változóiból jön.

export interface Config {
  authSecret: string;
  minigameSalt: string;
  tokenTtlDays: number;
  kvUrl: string | null;
  kvToken: string | null;
  cronSecret: string | null;
  qstashSigningKeys: string[];
  publicBaseUrl: string | null;
  revenueCatWebhookAuth: string | null;
  revenueCatSecretKey: string | null;
  appleAudiences: string[];
  googleClientIds: string[];
  promoCodes: Map<string, string>;
  promoStatsKey: string | null;
  expoAccessToken: string | null;
  minAppVersion: string;
  rateLimitPerUserPerMin: number;
  rateLimitPerIpPerMin: number;
}

const list = (v: string | undefined): string[] =>
  (v ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/** `KOD:juttatas` párok vesszővel elválasztva, például `BETA26:beta,ALAPITO:alapito`. */
function parsePromo(v: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of list(v)) {
    const [code, perk] = item.split(':');
    if (code && perk) map.set(code.trim().toUpperCase(), perk.trim());
  }
  return map;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const authSecret = env.AUTH_SECRET ?? '';
  return {
    authSecret,
    minigameSalt: env.MINIGAME_SALT ?? `mg:${authSecret}`,
    tokenTtlDays: Number(env.TOKEN_TTL_DAYS ?? 30),
    // A Vercel Marketplace Upstash-erőforrása KV_REST_API_*, a közvetlenül létrehozott
    // adatbázis UPSTASH_REDIS_REST_* néven adja ugyanazt (a meglévő backend mintájára).
    kvUrl: env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL ?? null,
    kvToken: env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN ?? null,
    cronSecret: env.CRON_SECRET ?? null,
    qstashSigningKeys: list(`${env.QSTASH_CURRENT_SIGNING_KEY ?? ''},${env.QSTASH_NEXT_SIGNING_KEY ?? ''}`),
    publicBaseUrl: env.PUBLIC_BASE_URL ?? null,
    revenueCatWebhookAuth: env.REVENUECAT_WEBHOOK_AUTH ?? null,
    revenueCatSecretKey: env.REVENUECAT_SECRET_KEY ?? null,
    appleAudiences: list(env.APPLE_AUDIENCES),
    googleClientIds: list(env.GOOGLE_CLIENT_IDS),
    promoCodes: parsePromo(env.PET_PROMO_CODES),
    promoStatsKey: env.PROMO_STATS_KEY ?? null,
    expoAccessToken: env.EXPO_ACCESS_TOKEN ?? null,
    minAppVersion: env.MIN_APP_VERSION ?? '0.1.0',
    rateLimitPerUserPerMin: Number(env.RL_PER_USER_PER_MIN ?? 60),
    rateLimitPerIpPerMin: Number(env.RL_PER_IP_PER_MIN ?? 30),
  };
}
