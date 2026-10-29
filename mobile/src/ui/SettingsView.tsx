import { useState } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import {
  DAY_MIN,
  formatMinuteOfDay,
  MODE,
  SCHEDULE_MAX_SLEEP_MIN,
  SCHEDULE_MIN_SLEEP_MIN,
  vacationBudgetUsedDays,
  windowLength,
} from '../sim';
import type { Daycare, Schedule } from '../sim';
import type { GameApi } from '../game/useGame';
import { NOTIFY_CATEGORIES, notifyEnabled, type NotifyCategory } from '../game/save';
import { formatWhen, MODE_NAMES } from '../game/texts';
import { Body, Button, Card, NumberStepper, SwitchRow, TimeStepper } from './components';
import { colors, spacing } from './theme';

const CATEGORY_LABELS: Record<NotifyCategory, string> = {
  osszesito: 'Napi összesítő (08:00, 12:30, 18:30)',
  gondozas: 'Éhség és unalom',
  egeszseg: 'Egészség',
  alvas: 'Elálmosodás',
  kritikus: 'Kritikus állapot és Nagyi',
  eletut: 'Fejlődés és idős kor',
  szabadsag: 'Szabadság vége',
};

const DAY_LABELS = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];

const SCHEDULE_ERRORS = {
  cooldown: 'A napirend 24 óránként egyszer módosítható.',
  tooShort: 'Az alvásidő legalább 7 óra.',
  tooLong: 'Az alvásidő legfeljebb 11 óra.',
};

const VACATION_ERRORS = {
  tooLong: 'Ez hosszabb, mint az egy alkalomra engedélyezett idő.',
  budget: 'A 90 napos szabadságkeret erre már nem elég.',
  notAllowed: 'Klasszikus módban beteg, kritikus vagy éhes kedvenccel nem indítható.',
  invalid: 'Érvénytelen időtartam.',
  notAlive: 'Most nem indítható.',
};

export function SettingsView({ game }: { game: GameApi }) {
  const pet = game.pet;
  const [schedule, setSchedule] = useState<Schedule>(pet?.pendingSchedule ?? pet?.schedule ?? { bedMin: 1380, wakeMin: 420 });
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);
  const [vacationDays, setVacationDays] = useState(2);
  const [vacationMsg, setVacationMsg] = useState<string | null>(null);

  if (!pet) return null;
  const mp = MODE[pet.mode];
  const sleepLen = DAY_MIN - windowLength(schedule.wakeMin, schedule.bedMin);
  const sleepOk = sleepLen >= SCHEDULE_MIN_SLEEP_MIN && sleepLen <= SCHEDULE_MAX_SLEEP_MIN;
  const used = vacationBudgetUsedDays(game.save.vacationHistory, game.now);
  const daycare = pet.daycare;
  const daycareLen = windowLength(daycare.startMin, daycare.endMin);
  const setDc = (patch: Partial<Daycare>) => game.setDaycare({ ...daycare, ...patch });

  const saveSchedule = () => {
    const err = game.changeSchedule(schedule);
    setScheduleMsg(err ? SCHEDULE_ERRORS[err] : 'Elmentve. A következő ébredéstől érvényes.');
  };

  const startVacation = () => {
    const err = game.startVacationDays(vacationDays);
    setVacationMsg(err ? VACATION_ERRORS[err] : null);
  };

  const confirmDowngrade = () =>
    Alert.alert(
      'Váltás Alap módra',
      'A váltás azonnali és visszafordíthatatlan ennél a kedvencnél. A Legenda forma esélye és a Klasszikus vérvonal elvész.',
      [
        { text: 'Mégsem', style: 'cancel' },
        { text: 'Váltok', onPress: game.downgrade },
      ],
    );

  const confirmReset = () =>
    Alert.alert('Minden adat törlése', 'A kedvenc, az emlékkert és a beállítások véglegesen törlődnek erről a telefonról.', [
      { text: 'Mégsem', style: 'cancel' },
      { text: 'Törlöm', style: 'destructive', onPress: () => void game.resetAll() },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title} accessibilityRole="header">
        Beállítások
      </Text>

      <Card title="Napirend">
        <TimeStepper label="Lefekvés" value={schedule.bedMin} onChange={(bedMin) => setSchedule((s) => ({ ...s, bedMin }))} />
        <TimeStepper label="Ébredés" value={schedule.wakeMin} onChange={(wakeMin) => setSchedule((s) => ({ ...s, wakeMin }))} />
        <Body dim>{`Jelenleg: ${formatMinuteOfDay(pet.schedule.bedMin)}-${formatMinuteOfDay(pet.schedule.wakeMin)}${pet.pendingSchedule ? `, ébredéstől: ${formatMinuteOfDay(pet.pendingSchedule.bedMin)}-${formatMinuteOfDay(pet.pendingSchedule.wakeMin)}` : ''}. 24 óránként egyszer módosítható, a következő ébredéstől érvényes.`}</Body>
        <Button label="Napirend mentése" disabled={!sleepOk} onPress={saveSchedule} style={styles.mt} />
        {scheduleMsg ? <Body dim>{scheduleMsg}</Body> : null}
      </Card>

      <Card title="Napközi">
        <SwitchRow label="Napközi bekapcsolva" value={daycare.enabled} onChange={(enabled) => setDc({ enabled })} />
        <TimeStepper label="Kezdés" value={daycare.startMin} onChange={(startMin) => setDc({ startMin })} />
        <TimeStepper label="Vége" value={daycare.endMin} onChange={(endMin) => setDc({ endMin })} />
        <View style={styles.days}>
          {DAY_LABELS.map((label, i) => (
            <Button
              key={label}
              label={label}
              kind={daycare.days[i] ? 'primary' : 'secondary'}
              onPress={() => setDc({ days: daycare.days.map((d, j) => (j === i ? !d : d)) })}
              style={styles.day}
            />
          ))}
        </View>
        <Body dim>{`A gondozó legalább egy szíven tartja a jelzőket, a végén takarít${pet.mode === 'alap' ? ', és a betegséget kezeli' : ''}. Napi legfeljebb ${mp.daycareMaxMin / 60} óra${daycareLen > mp.daycareMaxMin ? '; a beállított ablak ennél hosszabb, a többi nem számít napközinek' : ''}.`}</Body>
      </Card>

      {pet.mode === 'alap' ? (
        <Card title="Villany">
          <SwitchRow label="Automatikus villanyoltás elalváskor" value={pet.autoLights} onChange={game.setAutoLights} />
        </Card>
      ) : null}

      <Card title="Értesítések">
        <Body dim>
          {game.permission === 'granted'
            ? 'Engedélyezve. Legfeljebb 8 előre ütemezett értesítés, csendes órákban nincs.'
            : 'Nincs engedély. A játék értesítések nélkül is teljes értékű.'}
        </Body>
        {game.permission !== 'granted' ? (
          <Button
            label={game.permission === 'denied' ? 'Rendszerbeállítások' : 'Engedélyezés'}
            kind="secondary"
            onPress={() => (game.permission === 'denied' ? void Linking.openSettings() : void game.askPermission())}
            style={styles.mt}
          />
        ) : null}
        {NOTIFY_CATEGORIES.map((cat) => (
          <SwitchRow
            key={cat}
            label={CATEGORY_LABELS[cat]}
            value={notifyEnabled(game.save.settings, pet.mode, cat)}
            onChange={(v) => game.setNotifyCategory(cat, v)}
          />
        ))}
      </Card>

      <Card title="Szabadság">
        {pet.vacation ? (
          <>
            <Body>{`Szabadság: ${formatWhen(pet.vacation.start, game.now)} - ${formatWhen(pet.vacation.end, game.now)}`}</Body>
            <Button label="Szabadság vége most" kind="secondary" onPress={game.endVacationNow} style={styles.mt} />
          </>
        ) : (
          <>
            <Body dim>{`Teljes fagyasztás: nincs öregedés és fogyás. Egy alkalom legfeljebb ${mp.vacationMaxDays} nap, 90 napra ${mp.vacationBudgetDays} nap; felhasználva ${used.toFixed(1)} nap.`}</Body>
            <NumberStepper label="Időtartam" value={vacationDays} min={1} max={mp.vacationMaxDays} unit="nap" onChange={setVacationDays} />
            <Button label="Szabadság indítása most" kind="secondary" onPress={startVacation} style={styles.mt} />
          </>
        )}
        {vacationMsg ? <Body dim>{vacationMsg}</Body> : null}
      </Card>

      <Card title="Mód">
        <Body>{`Jelenlegi mód: ${MODE_NAMES[pet.mode]}${pet.downgraded ? ' (Klasszikusból váltva)' : ''}.`}</Body>
        {pet.mode === 'klasszikus' ? (
          <Button label="Váltás Alap módra" kind="secondary" onPress={confirmDowngrade} style={styles.mt} />
        ) : (
          <Body dim>Klasszikus módot új tojásnál lehet választani.</Body>
        )}
      </Card>

      <Card title="Megjelenítés">
        <View style={styles.row}>
          <Button
            label="Csillag"
            kind={game.save.settings.deathStyle === 'csillag' ? 'primary' : 'secondary'}
            onPress={() => game.updateSettings({ deathStyle: 'csillag' })}
            style={styles.flex}
          />
          <Button
            label="Sírkő"
            kind={game.save.settings.deathStyle === 'sirko' ? 'primary' : 'secondary'}
            onPress={() => game.updateSettings({ deathStyle: 'sirko' })}
            style={styles.flex}
          />
        </View>
        <SwitchRow label="Rezgés gondozáskor" value={game.save.settings.haptics} onChange={(haptics) => game.updateSettings({ haptics })} />
      </Card>

      <Card title="Prototípus: időgyorsítás">
        <Body dim>Csak kipróbáláshoz (PRD 7.16): a játékidő ennyiszer gyorsabban telik, így egy élet órák alatt bejárható. Visszakapcsoláskor a játékidő nem ugrik vissza.</Body>
        <View style={styles.row}>
          {[1, 10, 60].map((x) => (
            <Button
              key={x}
              label={`×${x}`}
              kind={game.save.time.scale === x ? 'primary' : 'secondary'}
              onPress={() => game.setTimeScale(x)}
              style={styles.flex}
            />
          ))}
        </View>
      </Card>

      <Card title="Adatok">
        <Body dim>Minden adat ezen a telefonon van. Exportálhatod JSON-ban, vagy véglegesen törölheted.</Body>
        <Button label="Exportálás" kind="secondary" onPress={() => void Share.share({ message: game.exportJson() })} style={styles.mt} />
        <Button label="Minden adat törlése" kind="danger" onPress={confirmReset} style={styles.mt} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(4), paddingBottom: spacing(10), gap: spacing(3) },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  mt: { marginTop: spacing(2) },
  row: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(2) },
  flex: { flex: 1 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1), marginVertical: spacing(2) },
  day: { flexGrow: 1, minWidth: 40, paddingHorizontal: spacing(1) },
});
