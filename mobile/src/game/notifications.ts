// Helyi értesítések ütemezése az expo-notifications modullal. Pontos riasztást
// nem kérünk (PRD 9.2): a dátum-trigger alapértelmezett „bestEffort” kézbesítése
// pontatlan riasztást használ, ezért minden türelmi idő legalább 60 perc.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PlannedNotification } from './notifyPlan';
import { toReal, type TimeScale } from './time';

const CHANNEL_CARE = 'gondozas';
const CHANNEL_CRITICAL = 'kritikus';

export async function setupNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_CARE, {
      name: 'Gondozás és napi összesítő',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync(CHANNEL_CRITICAL, {
      name: 'Kritikus állapot',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermission(): Promise<PermissionState> {
  const res = await Notifications.getPermissionsAsync();
  if (res.granted) return 'granted';
  return res.canAskAgain ? 'undetermined' : 'denied';
}

export async function requestPermission(): Promise<PermissionState> {
  const res = await Notifications.requestPermissionsAsync();
  if (res.granted) return 'granted';
  return res.canAskAgain ? 'undetermined' : 'denied';
}

let lastSignature = '';

/** Teljes újratervezés: törlés, majd a terv ütemezése (FR-21). Változatlan tervnél nem csinál semmit. */
export async function syncSchedule(plan: PlannedNotification[], time: TimeScale): Promise<void> {
  const signature = plan.map((p) => `${p.key}|${p.body}`).join('\n') + `|${time.scale}|${time.anchorReal}`;
  if (signature === lastSignature) return;
  if ((await getPermission()) !== 'granted') return;
  lastSignature = signature;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  for (const p of plan) {
    const at = toReal(time, p.at);
    if (at <= now + 5_000) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: p.title, body: p.body, data: { key: p.key } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(at),
        channelId: p.critical ? CHANNEL_CRITICAL : CHANNEL_CARE,
      },
    });
  }
}

export async function clearSchedule(): Promise<void> {
  lastSignature = '';
  await Notifications.cancelAllScheduledNotificationsAsync();
}
