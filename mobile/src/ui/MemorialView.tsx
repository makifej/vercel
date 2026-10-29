// Emlékkert (FR-15) és családfa (FR-16). Teljesen ingyenes, fizetési elem
// nélkül; a sírfelirat csak a játékosé, analitikába nem kerül.

import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { MemorialEntry } from '../sim';
import type { GameApi } from '../game/useGame';
import { CAUSE_NAMES, formatDate, FORM_NAMES, MODE_NAMES, STAGE_NAMES } from '../game/texts';
import { Body, Button, Card } from './components';
import { PixelSprite, type SpriteColors } from './PixelSprite';
import { GRAVE, STAR } from './sprites';
import { colors, PALETTES, spacing } from './theme';

function iconColors(entry: MemorialEntry): SpriteColors {
  const pal = PALETTES[entry.palette % PALETTES.length];
  return { o: colors.lcdDark, b: pal.body, l: pal.light, e: colors.lcdDark, w: '#f4f4f0', c: '#ff8fa3', a: '#d9a514' };
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function EntryCard({ entry, game }: { entry: MemorialEntry; game: GameApi }) {
  const [text, setText] = useState(entry.epitaph);
  const style = game.save.settings.deathStyle;
  const flowered = entry.lastFlowerDay === todayKey();
  const formName = entry.form ? FORM_NAMES[entry.form] : STAGE_NAMES[entry.stage];
  return (
    <Card>
      <View style={styles.entryHead}>
        <View style={styles.icon}>
          <PixelSprite sprite={style === 'sirko' ? GRAVE : STAR} colors={iconColors(entry)} pixel={3} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.entryName}>{entry.name}</Text>
          <Text style={styles.entryMeta}>{`${entry.familyName} család · ${entry.generation}. generáció · ${MODE_NAMES[entry.mode]}`}</Text>
        </View>
      </View>
      <Body>{`${formName} · ${entry.lifeDays} nap · ${entry.ageYears} év`}</Body>
      <Body dim>{`${CAUSE_NAMES[entry.cause]} · ${formatDate(entry.bornAt)} - ${formatDate(entry.endedAt)}`}</Body>
      <Body dim>{`Gondozási hibák összesen: ${entry.totalMistakes} · Virágok: ${entry.flowers}`}</Body>
      <TextInput
        value={text}
        onChangeText={(t) => setText(t.slice(0, 140))}
        onEndEditing={() => game.setEpitaph(entry.id, text)}
        placeholder="Sírfelirat (legfeljebb 140 karakter)"
        placeholderTextColor={colors.textDim}
        style={styles.input}
        multiline
        maxLength={140}
        accessibilityLabel={`${entry.name} sírfelirata`}
      />
      <Button
        label={flowered ? 'Ma már vittél virágot' : 'Virágot viszek'}
        kind="secondary"
        disabled={flowered}
        onPress={() => game.giveFlower(entry.id)}
        style={styles.mt}
      />
    </Card>
  );
}

export function MemorialView({ game }: { game: GameApi }) {
  const entries = game.save.memorial;
  const families = useMemo(() => {
    const map = new Map<string, MemorialEntry[]>();
    for (const e of entries) map.set(e.familyName, [...(map.get(e.familyName) ?? []), e]);
    return [...map.entries()];
  }, [entries]);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title} accessibilityRole="header">
        Emlékkert
      </Text>
      {entries.length === 0 ? (
        <Card>
          <Body dim>Itt őrizzük minden lezárult élet emlékét. Még üres.</Body>
        </Card>
      ) : null}
      {families.length > 0 ? (
        <Card title="Családfa">
          {families.map(([family, list]) => (
            <View key={family} style={styles.family}>
              <Text style={styles.entryName}>{`${family} család`}</Text>
              {[...list]
                .sort((a, b) => a.bornAt - b.bornAt)
                .map((e) => (
                  <Body key={e.id} dim>{`${e.generation}. generáció: ${e.name} (${CAUSE_NAMES[e.cause]})`}</Body>
                ))}
            </View>
          ))}
        </Card>
      ) : null}
      {entries.map((e) => (
        <EntryCard key={e.id} entry={e} game={game} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(4), paddingBottom: spacing(10), gap: spacing(3) },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(2) },
  icon: { backgroundColor: colors.lcd, borderRadius: 8, padding: 4 },
  entryName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  entryMeta: { color: colors.textDim, fontSize: 13 },
  flex: { flex: 1 },
  family: { marginBottom: spacing(2) },
  mt: { marginTop: spacing(2) },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    minHeight: 48,
    fontSize: 16,
    marginTop: spacing(2),
  },
});
