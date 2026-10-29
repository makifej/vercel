// Első indítás (FR-01..FR-04): bemutatkozás, napirend, módválasztás, névadás.
// Regisztráció nincs; ebben a buildben semmilyen adat nem hagyja el a telefont.

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DAY_MIN, SCHEDULE_MAX_SLEEP_MIN, SCHEDULE_MIN_SLEEP_MIN, windowLength } from '../sim';
import type { Mode, Schedule } from '../sim';
import type { GameApi } from '../game/useGame';
import { Body, Button, Card, TimeStepper } from './components';
import { colors, spacing } from './theme';

type Step = 'welcome' | 'schedule' | 'mode' | 'classicInfo' | 'name';

export function Onboarding({ game }: { game: GameApi }) {
  const [step, setStep] = useState<Step>('welcome');
  const [schedule, setSchedule] = useState<Schedule>({ bedMin: 23 * 60, wakeMin: 7 * 60 });
  const [mode, setMode] = useState<Mode>('alap');
  const [name, setName] = useState('');

  const sleepLen = DAY_MIN - windowLength(schedule.wakeMin, schedule.bedMin);
  const scheduleOk = sleepLen >= SCHEDULE_MIN_SLEEP_MIN && sleepLen <= SCHEDULE_MAX_SLEEP_MIN;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'helyi idő';
  const nameOk = name.trim().length >= 1 && name.trim().length <= 12;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title} accessibilityRole="header">
        Pixeltojás
      </Text>

      {step === 'welcome' ? (
        <Card>
          <Body>Egy kis kedvenc, akiről minden nap gondoskodsz: etetés, játék, takarítás, gyógyszer és villanyoltás. A saját napirendedhez igazodik, és amíg alszol, ő is alszik.</Body>
          <Body dim>Regisztráció nincs. Ez a prototípus semmilyen adatot nem küld; minden a telefonodon marad.</Body>
          <Button label="Kezdjük" onPress={() => setStep('schedule')} style={styles.mt} />
        </Card>
      ) : null}

      {step === 'schedule' ? (
        <Card title="Napirend">
          <Body dim>A kedvenced a lefekvésed előtt fél órával elálmosodik, és veled ébred. Alvás alatt semmi nem történik vele.</Body>
          <TimeStepper label="Lefekvés" value={schedule.bedMin} onChange={(bedMin) => setSchedule((s) => ({ ...s, bedMin }))} />
          <TimeStepper label="Ébredés" value={schedule.wakeMin} onChange={(wakeMin) => setSchedule((s) => ({ ...s, wakeMin }))} />
          <Body dim>{`Alvásidő: ${Math.floor(sleepLen / 60)} óra ${sleepLen % 60} perc (7-11 óra lehet). Időzóna: ${tz}.`}</Body>
          <Body dim>Később 24 óránként egyszer módosíthatod; a változás a következő ébredéstől érvényes.</Body>
          <Button label="Tovább" disabled={!scheduleOk} onPress={() => setStep('mode')} style={styles.mt} />
        </Card>
      ) : null}

      {step === 'mode' ? (
        <Card title="Mód">
          <Body>Alap mód: ha sokáig nem érsz rá, a kedvenced nem hal meg, hanem Nagyi vigyáz rá, és egy koppintással hazahozhatod.</Body>
          <Body>Klasszikus mód: az eredeti szabályokhoz közelebb áll, a tartós elhanyagolás halálhoz vezet.</Body>
          <View style={styles.row}>
            <Button label="Alap mód" kind={mode === 'alap' ? 'primary' : 'secondary'} onPress={() => setMode('alap')} style={styles.flex} />
            <Button
              label="Klasszikus mód"
              kind={mode === 'klasszikus' ? 'primary' : 'secondary'}
              onPress={() => setMode('klasszikus')}
              style={styles.flex}
            />
          </View>
          <Button label="Tovább" onPress={() => setStep(mode === 'klasszikus' ? 'classicInfo' : 'name')} style={styles.mt} />
        </Card>
      ) : null}

      {step === 'classicInfo' ? (
        <Card title="Klasszikus mód">
          <Body>Ha a kedvenced egészsége elfogy, kritikus állapotba kerül. Ha 12 számlálható órán át így marad, meghal. Újraélesztés nincs, sem ingyen, sem pénzért.</Body>
          <Body>A jellemző idő az első figyelmeztetéstől a halálig kb. 20-21 számlálható óra. Alvás, csendes óra, napközi és szabadság alatt nem következhet be.</Body>
          <Body>Az értesítések nem kötelezőek. Nélkülük ébrenlét alatt nagyjából 5 óránként érdemes benézni, a halál elkerüléséhez legalább naponta egyszer.</Body>
          <Body>Alap módra bármikor visszaléphetsz, kritikus állapotban is.</Body>
          <View style={styles.col}>
            <Button
              label="Klasszikus móddal kezdem"
              kind="secondary"
              onPress={() => {
                setMode('klasszikus');
                setStep('name');
              }}
            />
            <Button
              label="Alap móddal kezdem"
              kind="secondary"
              onPress={() => {
                setMode('alap');
                setStep('name');
              }}
            />
          </View>
        </Card>
      ) : null}

      {step === 'name' ? (
        <Card title="Név">
          <Body dim>Hogy hívják a kedvencedet? 1-12 karakter.</Body>
          <TextInput
            value={name}
            onChangeText={(t) => setName(t.slice(0, 12))}
            placeholder="például Pötty"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            accessibilityLabel="A kedvenc neve"
            maxLength={12}
            autoFocus
          />
          <Button
            label="Kérem a tojást"
            disabled={!nameOk}
            onPress={() => game.createFirstEgg({ name: name.trim(), mode, schedule })}
            style={styles.mt}
          />
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(4), gap: spacing(3), flexGrow: 1, justifyContent: 'center' },
  title: { color: colors.accent, fontSize: 34, fontWeight: '900', textAlign: 'center', fontFamily: 'monospace' },
  mt: { marginTop: spacing(3) },
  row: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) },
  col: { gap: spacing(2), marginTop: spacing(3) },
  flex: { flex: 1 },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(3),
    minHeight: 48,
    fontSize: 18,
    marginTop: spacing(2),
  },
});
