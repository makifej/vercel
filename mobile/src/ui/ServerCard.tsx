// Játékszerver beállítása: cím, kapcsolódás, helyi módra váltás, fiókadatok.

import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { GameApi } from '../game/useGame';
import { Body, Button, Card } from './components';
import { colors, spacing } from './theme';

export function ServerCard({ game, compact }: { game: GameApi; compact?: boolean }) {
  const [url, setUrl] = useState(game.serverUrl ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const connect = async () => {
    setWorking(true);
    const err = await game.connectServer(url);
    setWorking(false);
    setMsg(err ?? 'Kapcsolódva.');
  };

  return (
    <Card title="Játékszerver">
      {game.mode === 'server' ? (
        <>
          <Body>{`Szerver mód: ${game.serverUrl}`}</Body>
          <Body dim>
            {game.online
              ? 'A kedvenc állapota a szerveren él, az idő a szerveré. Gondozni kapcsolat mellett lehet.'
              : 'Most nincs kapcsolat; a kijelzés az utolsó ismert állapotból számol.'}
          </Body>
          {game.entitlements ? (
            <Body dim>
              {game.entitlements.full
                ? 'Teljes verzió aktív.'
                : game.entitlements.trialActive && game.entitlements.trialEndsAt
                  ? `Próbaidő: ${new Date(game.entitlements.trialEndsAt).toLocaleString('hu-HU')}-ig.`
                  : 'A próbaidő lejárt; az Alap mód teljes értékű.'}
            </Body>
          ) : null}
          {!compact ? (
            <>
              <Button
                label={code ? `Törlési kód: ${code}` : 'Webes törlési kód megjelenítése'}
                kind="secondary"
                onPress={async () => setCode(await game.deletionCode())}
                style={styles.mt}
              />
              {code ? <Body dim>{`Webes törlés: ${game.serverUrl}/delete-account`}</Body> : null}
            </>
          ) : null}
          <Button label="Helyi módra váltás" kind="secondary" onPress={game.disconnectServer} style={styles.mt} />
          <Body dim>A helyi mód külön mentés: a szerveren élő kedvenc megmarad, később visszakapcsolódhatsz.</Body>
        </>
      ) : (
        <>
          <Body dim>Helyi mód: minden a telefonon fut. Szerver módban a kedvenc a játékszerveren él, és az idő nem állítható át a telefon órájával.</Body>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://pixeltojas-api.vercel.app"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
            accessibilityLabel="A játékszerver címe"
          />
          <View style={styles.row}>
            <Button label="Kapcsolódás" disabled={working || url.trim().length < 8} onPress={() => void connect()} style={styles.flex} />
          </View>
        </>
      )}
      {msg ? <Body dim>{msg}</Body> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  mt: { marginTop: spacing(2) },
  row: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(2) },
  flex: { flex: 1 },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(3),
    minHeight: 48,
    fontSize: 16,
    marginTop: spacing(2),
  },
});
