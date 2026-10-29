// A szerver-munkamenet (telepítési azonosító és token) a biztonságos tárolóban
// él (PRD 13.9: expo-secure-store). A telepítési azonosító titoknak számít:
// ugyanazzal a fiók tokenje újra lekérhető, ezért kriptográfiai UUID.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { Session } from './api';

const KEY = 'pixeltojas.session';

async function secureAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function loadSession(): Promise<Session> {
  let raw: string | null = null;
  try {
    raw = (await secureAvailable()) ? await SecureStore.getItemAsync(KEY) : await AsyncStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw) {
    try {
      const s = JSON.parse(raw) as Session;
      if (s.installId) return s;
    } catch {
      // sérült munkamenet: újat kezdünk
    }
  }
  return { installId: randomUUID(), token: null, userId: null };
}

export async function storeSession(s: Session): Promise<void> {
  const raw = JSON.stringify(s);
  if (await secureAvailable()) await SecureStore.setItemAsync(KEY, raw);
  else await AsyncStorage.setItem(KEY, raw);
}

/** Fióktörlés után új telepítési azonosító, így új anonim fiók jön létre. */
export function freshSession(): Session {
  return { installId: randomUUID(), token: null, userId: null };
}
