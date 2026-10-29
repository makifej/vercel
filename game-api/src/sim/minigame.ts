// Minijátékok seedelt, determinisztikus fordulói (PRD 7.15, FR-44). A szerver a
// seed és a tippek alapján újraszámolja az eredményt, így a kliens nem küldhet
// tetszőleges győzelmet. A seed ismeretében tökéletes játék lehetséges; egyjátékos
// kedvencnél ez elfogadott kockázat (PRD 13.4).

import { nextRandom, seedFromString } from './rng';

export type MinigameKind = 'merre' | 'nagyobb';
export type Direction = 'bal' | 'jobb';
export type HigherLower = 'nagyobb' | 'kisebb';

export const MINIGAME_ROUNDS = 5;
export const MINIGAME_WIN_AT = 3;

export function minigameSeed(salt: string, petId: string, revision: number): number {
  return seedFromString(`${salt}|${petId}|${revision}`);
}

/** „Merre fordul?”: a kedvenc fordulási iránya körönként. */
export function directionRounds(seed: number): Direction[] {
  const rng = { rng: seed | 0 };
  return Array.from({ length: MINIGAME_ROUNDS }, () => (nextRandom(rng) < 0.5 ? 'bal' : 'jobb'));
}

/** „Nagyobb vagy kisebb?”: kezdő szám és öt további, 1-9 között, szomszédosan különbözők. */
export function numberRounds(seed: number): number[] {
  const rng = { rng: seed | 0 };
  const out = [1 + Math.floor(nextRandom(rng) * 9)];
  while (out.length <= MINIGAME_ROUNDS) {
    const n = 1 + Math.floor(nextRandom(rng) * 9);
    if (n !== out[out.length - 1]) out.push(n);
  }
  return out;
}

export interface MinigameScore {
  hits: number;
  won: boolean;
}

/** Az eredmény újraszámolása; érvénytelen tippsorozatnál null. */
export function scoreMinigame(kind: MinigameKind, seed: number, guesses: readonly string[]): MinigameScore | null {
  if (guesses.length !== MINIGAME_ROUNDS) return null;
  let hits = 0;
  if (kind === 'merre') {
    const rounds = directionRounds(seed);
    for (let i = 0; i < MINIGAME_ROUNDS; i++) {
      if (guesses[i] !== 'bal' && guesses[i] !== 'jobb') return null;
      if (guesses[i] === rounds[i]) hits++;
    }
  } else {
    const nums = numberRounds(seed);
    for (let i = 0; i < MINIGAME_ROUNDS; i++) {
      if (guesses[i] !== 'nagyobb' && guesses[i] !== 'kisebb') return null;
      const higher = nums[i + 1] > nums[i];
      if ((guesses[i] === 'nagyobb') === higher) hits++;
    }
  }
  return { hits, won: hits >= MINIGAME_WIN_AT };
}
