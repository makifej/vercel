// Seedelt PRNG (mulberry32). Az állapot a kedvencben él, így ugyanabból a
// pillanatképből mindig ugyanazok az ütemezett események születnek.

export function nextRandom(state: { rng: number }): number {
  let t = (state.rng = (state.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomBetween(state: { rng: number }, min: number, max: number): number {
  return min + (max - min) * nextRandom(state);
}

export function pick<T>(state: { rng: number }, items: readonly T[]): T {
  return items[Math.floor(nextRandom(state) * items.length) % items.length];
}

export function seedFromString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
