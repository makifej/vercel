import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from './game/useGame';
import { Body, Button, Card } from './ui/components';
import { HomeView } from './ui/HomeView';
import { MemorialView } from './ui/MemorialView';
import { Onboarding } from './ui/Onboarding';
import { ServerCard } from './ui/ServerCard';
import { SettingsView } from './ui/SettingsView';
import { colors, spacing } from './ui/theme';

type Tab = 'home' | 'memorial' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Kedvenc' },
  { id: 'memorial', label: 'Emlékkert' },
  { id: 'settings', label: 'Beállítások' },
];

function Root() {
  const game = useGame();
  const [tab, setTab] = useState<Tab>('home');

  if (!game.ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (game.mode === 'server' && !game.synced) {
    return (
      <ScrollView contentContainerStyle={styles.connecting}>
        {game.serverError ? null : <ActivityIndicator color={colors.accent} />}
        <Body>{game.serverError ?? 'Kapcsolódás a játékszerverhez...'}</Body>
        {game.serverError ? <Button label="Újra" onPress={() => void game.refresh()} /> : null}
        <ServerCard game={game} compact />
      </ScrollView>
    );
  }

  if (!game.pet) return <Onboarding game={game} />;

  const { meta } = game.save;
  // Engedélykérés kontextusban: az első etetés és takarítás után, soha induláskor (FR-20).
  const askNotif =
    !meta.notifAsked && meta.firstCare.fed && meta.firstCare.cleaned && game.permission === 'undetermined' && game.pet.status === 'alive';

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>
        {tab === 'home' ? <HomeView game={game} /> : null}
        {tab === 'memorial' ? <MemorialView game={game} /> : null}
        {tab === 'settings' ? <SettingsView game={game} /> : null}
      </View>
      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <Modal visible={askNotif} transparent animationType="fade" onRequestClose={game.markNotifAsked}>
        <View style={styles.backdrop}>
          <Card title="Értesítések">
            <Body>{`Szólhatok, amikor ${game.pet.name} megéhezik, vagy figyelmet kér?`}</Body>
            <Body dim>Napi néhány értesítés, csendes órákban soha. Később a Beállításokban módosíthatod; nélküle is teljes értékű a játék.</Body>
            <View style={styles.row}>
              <Button label="Igen" kind="secondary" onPress={() => void game.askPermission()} style={styles.flex} />
              <Button label="Most nem" kind="secondary" onPress={game.markNotifAsked} style={styles.flex} />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <Root />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  connecting: { flexGrow: 1, justifyContent: 'center', padding: spacing(4), gap: spacing(3) },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  tabActive: { borderTopWidth: 3, borderTopColor: colors.accent },
  tabText: { color: colors.textDim, fontSize: 15, fontWeight: '600' },
  tabTextActive: { color: colors.text },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing(4) },
  row: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) },
});
