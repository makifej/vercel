// Expo Push API kliens (PRD 9.1, 13.8). Kérésenként legfeljebb 100 üzenet; az
// Expo SLA-t nem vállal, ezért a push csak tartalék a helyi értesítések mellett.

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  channelId: string;
  data?: Record<string, string>;
}

export interface PushResult {
  /** Érvénytelenné vált tokenek (DeviceNotRegistered), ezeket töröljük. */
  invalidTokens: string[];
  sent: number;
}

export type PushSender = (messages: PushMessage[]) => Promise<PushResult>;

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export function createExpoPushSender(accessToken: string | null): PushSender {
  return async (messages) => {
    const invalidTokens: string[] = [];
    let sent = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(chunk.map((m) => ({ ...m, sound: 'default', priority: 'high' }))),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Expo push HTTP ${res.status}`);
      const body = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
      (body.data ?? []).forEach((ticket, idx) => {
        if (ticket.status === 'ok') sent++;
        else if (ticket.details?.error === 'DeviceNotRegistered') invalidTokens.push(chunk[idx].to);
      });
    }
    return { invalidTokens, sent };
  };
}

export const EXPO_TOKEN_RE = /^Expo(nent)?PushToken\[[A-Za-z0-9_\-]+\]$/;
