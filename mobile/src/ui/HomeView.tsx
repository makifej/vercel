import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ACTION,
  daysAtNagyi,
  inWindow,
  MODE,
  NAGYI_STAY_OPTION_DAYS,
  nextAttention,
  remainingSeniorDays,
} from '../sim';
import type { CareAction, Mode } from '../sim';
import type { GameApi } from '../game/useGame';
import {
  ACTION_LABELS,
  deathText,
  formatWhen,
  healthLabel,
  hearts,
  MODE_NAMES,
  REJECT_TEXT,
  TRAIT_NAMES,
} from '../game/texts';
import { Body, Button, Card } from './components';
import { MiniGame } from './MiniGame';
import { PetScreen } from './PetScreen';
import { colors, spacing } from './theme';

const ACTIONS: CareAction['type'][] = ['feed', 'snack', 'play', 'pet', 'clean', 'medicine', 'scold', 'lights'];

function HeartRow({ label, value }: { label: string; value: number }) {
  const n = hearts(value);
  return (
    <View style={styles.statRow} accessible accessibilityLabel={`${label}: ${n} szív a 4-ből`}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.hearts}>{'♥'.repeat(n) + '♡'.repeat(4 - n)}</Text>
    </View>
  );
}

function Segments({ label, value }: { label: string; value: number }) {
  const n = Math.round(value / 25);
  return (
    <View style={styles.statRow} accessible accessibilityLabel={`${label}: ${n} a 4-ből`}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.segments}>{'■'.repeat(n) + '□'.repeat(4 - n)}</Text>
    </View>
  );
}

export function HomeView({ game }: { game: GameApi }) {
  const { pet, now, ctx } = game;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const next = useMemo(() => (pet ? nextAttention(pet, ctx, now) : null), [pet, ctx, now]);

  if (!pet) return null;

  const doCare = (action: CareAction) => {
    const r = game.care(action);
    setFeedback(r ? REJECT_TEXT[r] : null);
  };

  const onAction = (type: CareAction['type']) => {
    if (type === 'play') {
      if (pet.asleep) return setFeedback(REJECT_TEXT.asleep);
      if (pet.sick) return setFeedback(REJECT_TEXT.sick);
      if (pet.energy < ACTION.minPlayEnergy || pet.napMin > 0) return setFeedback(REJECT_TEXT.tired);
      setFeedback(null);
      setPlaying(true);
      return;
    }
    doCare({ type } as CareAction);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.name} accessibilityRole="header">
          {pet.name}
        </Text>
        <Text style={styles.meta}>
          {`${pet.familyName} család · ${pet.generation}. generáció · ${MODE_NAMES[pet.mode]} mód${pet.status !== 'egg' ? ` · ${pet.ageYears} év` : ''}`}
        </Text>
        {pet.status === 'alive' ? <Text style={styles.meta}>{`Személyiség: ${TRAIT_NAMES[pet.trait]}`}</Text> : null}
        {game.save.time.scale > 1 ? (
          <Text style={styles.fast}>{`Gyorsított idő ×${game.save.time.scale} · játékidő: ${formatWhen(now, Date.now())}`}</Text>
        ) : null}
      </View>

      {game.summary ? (
        <Card>
          <Body>{game.summary}</Body>
          <Button label="Rendben" kind="secondary" onPress={game.dismissSummary} style={styles.mt} />
        </Card>
      ) : null}

      <PetScreen pet={pet} deathStyle={game.save.settings.deathStyle} />

      {pet.status === 'egg' ? <EggCard game={game} /> : null}
      {pet.status === 'dead' ? <FarewellCard game={game} /> : null}
      {pet.status === 'nagyi' ? <NagyiCard game={game} /> : null}

      {pet.status === 'alive' ? (
        <>
          {pet.critical ? (
            <Card>
              <Body>
                {pet.mode === 'klasszikus'
                  ? `${pet.name} állapota kritikus. Kb. ${Math.max(0, Math.ceil((MODE.klasszikus.criticalMin - pet.critical.countedMin) / 60))} óra van hátra; az alvásidő és a napközi nem számít bele. Ha most nem alkalmas, Alap módra válthatsz.`
                  : `${pet.name} állapota kritikus. Ha a következő órákban nem érsz rá, Nagyi vigyáz rá.`}
              </Body>
              <Body dim>Gondozd: étel, játék vagy nasi, takarítás, gyógyszer.</Body>
              {pet.mode === 'klasszikus' ? (
                <Button label="Váltás Alap módra" kind="secondary" onPress={game.downgrade} style={styles.mt} />
              ) : null}
            </Card>
          ) : null}

          {pet.vacation && now >= pet.vacation.start ? (
            <Card>
              <Body>{`${pet.name} szabadságon van ${formatWhen(pet.vacation.end, now)}-ig. Közben minden áll.`}</Body>
              <Button label="Szabadság vége" kind="secondary" onPress={game.endVacationNow} style={styles.mt} />
            </Card>
          ) : null}

          <Card>
            <HeartRow label="Jóllakottság" value={pet.hunger} />
            <HeartRow label="Boldogság" value={pet.happiness} />
            <Segments label="Fegyelem" value={pet.discipline} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Energia</Text>
              <Text style={styles.statValue}>{`${Math.round(pet.energy)}%`}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Egészség</Text>
              <Text style={[styles.statValue, pet.health < 50 && styles.warn]}>{healthLabel(pet)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Súly</Text>
              <Text style={styles.statValue}>{`${pet.weight} g`}</Text>
            </View>
            {pet.stage === 'senior' ? (
              <Body dim>{`Még nagyjából ${remainingSeniorDays(pet)} napot tölthettek együtt.`}</Body>
            ) : null}
            {pet.convalescenceMin > 0 ? <Body dim>Lábadozik: a boldogságnövelő műveletek fele annyit érnek.</Body> : null}
            {pet.inDaycare ? <Body dim>Napköziben van: a gondozó legalább egy szíven tartja.</Body> : null}
            <Text style={styles.next} accessibilityLiveRegion="polite">
              {next === null
                ? 'Most nincs teendő.'
                : next <= now
                  ? 'Most figyelmet kér.'
                  : `Következő ellenőrzés legkésőbb: ${formatWhen(next, now)}`}
            </Text>
          </Card>

          <View style={styles.grid}>
            {ACTIONS.map((type) => (
              <Button
                key={type}
                label={type === 'lights' ? (pet.lightsOff ? 'Villany fel' : 'Villany le') : ACTION_LABELS[type]}
                kind="secondary"
                onPress={() => onAction(type)}
                style={styles.gridItem}
              />
            ))}
          </View>
          {feedback ? <Body dim>{feedback}</Body> : null}
          {game.lastMessage ? <Text style={styles.message}>{game.lastMessage}</Text> : null}
        </>
      ) : null}

      <MiniGame
        visible={playing}
        name={pet.name}
        onClose={() => setPlaying(false)}
        onFinish={(won) => doCare({ type: 'play', won })}
      />
    </ScrollView>
  );
}

function EggCard({ game }: { game: GameApi }) {
  const pet = game.pet!;
  const local = game.ctx.local(game.now).minuteOfDay;
  const nearBed = inWindow(local, pet.schedule.bedMin - 90, pet.schedule.bedMin);
  if (pet.eggWarmMin !== null) {
    return (
      <Card>
        <Body>{`A tojás melegszik. Kb. ${Math.max(1, 5 - pet.eggWarmMin)} perc a kelésig.`}</Body>
      </Card>
    );
  }
  return (
    <Card>
      <Body>A tojás a melegítés után öt perccel kel ki. A bébi szakasz 65 percig tart, ezalatt érdemes a közelben lenni.</Body>
      {nearBed ? (
        <Body dim>Hamarosan lefekvés. Érdemes reggel melegíteni; ha most kelteted, az első alvás a bébi szakasz végén kezdődik.</Body>
      ) : null}
      <Button label="Melegítés" onPress={game.warm} style={styles.mt} />
    </Card>
  );
}

function NagyiCard({ game }: { game: GameApi }) {
  const pet = game.pet!;
  const days = daysAtNagyi(pet, game.now);
  return (
    <Card>
      <Body>{`${pet.name} Nagyinál van, amíg ráérsz. Hazahozhatod egy koppintással, ingyen.`}</Body>
      <Body dim>Visszatéréskor a gondozási hibák száma kettővel nő, felnőtt vagy idős korban az élettartam egy nappal rövidül.</Body>
      <Button label="Hazahozom" onPress={game.bringHome} style={styles.mt} />
      {days >= NAGYI_STAY_OPTION_DAYS ? (
        <Button label="Maradjon Nagyinál, új tojást kezdek" kind="secondary" onPress={game.leaveWithNagyi} style={styles.mt} />
      ) : null}
    </Card>
  );
}

function FarewellCard({ game }: { game: GameApi }) {
  const pet = game.pet!;
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>(pet.mode);
  const natural = pet.deathCause === 'oregkor';
  const valid = name.trim().length >= 1 && name.trim().length <= 12;
  return (
    <Card title="Búcsú">
      <Body>{deathText(pet.deathCause ?? 'elhanyagolas', pet.name)}</Body>
      <Body dim>{`Élt ${Math.round(pet.lifeMin / 1440)} napot, ${pet.ageYears} évet.`}</Body>
      <Text style={[styles.statLabel, styles.mt]}>{natural ? 'Az új tojás neve' : 'Az új kedvenc neve'}</Text>
      <TextInput
        value={name}
        onChangeText={(t) => setName(t.slice(0, 12))}
        placeholder="1-12 karakter"
        placeholderTextColor={colors.textDim}
        style={styles.input}
        accessibilityLabel="Az új kedvenc neve"
        maxLength={12}
      />
      <View style={styles.row}>
        {(['alap', 'klasszikus'] as Mode[]).map((m) => (
          <Button
            key={m}
            label={`${MODE_NAMES[m]} mód`}
            kind={mode === m ? 'primary' : 'secondary'}
            onPress={() => setMode(m)}
            style={styles.flex}
          />
        ))}
      </View>
      {mode === 'klasszikus' ? (
        <Body dim>Klasszikus módban a tartós elhanyagolás halálhoz vezet; a jellemző idő az első figyelmeztetéstől kb. 20-21 számlálható óra. Alap módra bármikor visszaléphetsz.</Body>
      ) : null}
      <Button
        label="Emlékkertbe kísérem, új tojás"
        disabled={!valid}
        onPress={() => game.closeLife(name.trim(), mode)}
        style={styles.mt}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(4), paddingBottom: spacing(10), gap: spacing(3) },
  header: { marginBottom: spacing(1) },
  name: { color: colors.text, fontSize: 28, fontWeight: '800' },
  meta: { color: colors.textDim, fontSize: 14 },
  fast: { color: colors.accent, fontSize: 13, marginTop: spacing(1) },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  statLabel: { color: colors.textDim, fontSize: 16 },
  statValue: { color: colors.text, fontSize: 16, fontWeight: '600' },
  warn: { color: colors.danger },
  hearts: { color: '#ff8fa3', fontSize: 22, letterSpacing: 2 },
  segments: { color: colors.accent, fontSize: 18, letterSpacing: 2 },
  next: { color: colors.accent, fontSize: 15, marginTop: spacing(2) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  gridItem: { width: '23%', flexGrow: 1, paddingHorizontal: spacing(1) },
  message: { color: colors.text, fontSize: 15, textAlign: 'center', marginTop: spacing(1) },
  mt: { marginTop: spacing(3) },
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
    fontSize: 18,
    marginTop: spacing(1),
  },
});

