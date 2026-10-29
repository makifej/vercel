// Minijátékok (PRD 7.15): 5 kör, legalább 3 találat a győzelem. Nincs
// időzítés és nincs finommotoros igény; a Simogatás az akadálymentes alternatíva.
// A fordulók seedből jönnek; szerver módban a szerver ugyanebből validál.

import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { directionRounds, MINIGAME_ROUNDS, MINIGAME_WIN_AT, numberRounds, type MinigameKind } from '../sim';
import { Body, Button, Card } from './components';
import { colors, spacing } from './theme';

interface Props {
  visible: boolean;
  name: string;
  /** Szerver módban a szerver seedje; helyi módban null (véletlen seed). */
  seed: number | null;
  /** A „Nagyobb vagy kisebb?” elérhető-e (PRD 10.4). */
  allowNagyobb: boolean;
  onClose: () => void;
  onFinish: (kind: MinigameKind, guesses: string[], won: boolean) => void;
}

export function MiniGame({ visible, name, seed, allowNagyobb, onClose, onFinish }: Props) {
  const [kind, setKind] = useState<MinigameKind | null>(null);
  const [roundSeed, setRoundSeed] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [last, setLast] = useState<string | null>(null);

  const start = (k: MinigameKind) => {
    setKind(k);
    setRoundSeed(seed ?? Math.floor(Math.random() * 0x7fffffff));
    setGuesses([]);
    setLast(null);
  };

  const close = () => {
    setKind(null);
    setGuesses([]);
    setLast(null);
    onClose();
  };

  const round = guesses.length;
  const done = round >= MINIGAME_ROUNDS;
  const dirs = kind === 'merre' ? directionRounds(roundSeed) : [];
  const nums = kind === 'nagyobb' ? numberRounds(roundSeed) : [];
  const hitsOf = (list: string[]) =>
    list.filter((g, i) => (kind === 'merre' ? g === dirs[i] : (g === 'nagyobb') === nums[i + 1] > nums[i])).length;
  const hits = hitsOf(guesses);

  const guess = (g: string) => {
    if (!kind || done) return;
    const next = [...guesses, g];
    const correct = hitsOf(next) > hits;
    if (kind === 'merre') {
      setLast(`${name} ${dirs[round] === 'bal' ? 'balra' : 'jobbra'} fordult. ${correct ? 'Talált.' : 'Nem talált.'}`);
    } else {
      setLast(`A következő szám: ${nums[round + 1]}. ${correct ? 'Talált.' : 'Nem talált.'}`);
    }
    setGuesses(next);
    if (next.length >= MINIGAME_ROUNDS) onFinish(kind, next, hitsOf(next) >= MINIGAME_WIN_AT);
  };

  const title = kind === 'merre' ? 'Merre fordul?' : kind === 'nagyobb' ? 'Nagyobb vagy kisebb?' : 'Játék';
  const currentNumber = nums[Math.min(round, MINIGAME_ROUNDS)];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Card title={title} style={styles.card}>
          {kind === null ? (
            <>
              <Body dim>Válassz játékot. Öt kör, három találat a győzelem.</Body>
              <View style={styles.col}>
                <Button label="Merre fordul?" onPress={() => start('merre')} />
                <Button
                  label="Nagyobb vagy kisebb?"
                  disabled={!allowNagyobb}
                  onPress={() => start('nagyobb')}
                  accessibilityHint={allowNagyobb ? undefined : 'Teljes verzió vagy próbaidő kell hozzá'}
                />
                <Button label="Mégsem" kind="secondary" onPress={close} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.progress} accessibilityLiveRegion="polite">
                {`Kör: ${Math.min(round + 1, MINIGAME_ROUNDS)} / ${MINIGAME_ROUNDS} · Találat: ${hits}`}
              </Text>
              {last ? <Body>{last}</Body> : null}
              {!done ? (
                <Body dim>
                  {kind === 'merre'
                    ? `Szerinted ${name} merre fordul?`
                    : `A szám: ${currentNumber}. A következő nagyobb vagy kisebb lesz?`}
                </Body>
              ) : null}
              {done ? (
                <View style={styles.col}>
                  <Body>{hits >= MINIGAME_WIN_AT ? `Győzelem. ${name} boldog.` : `Most nem jött össze, de ${name} élvezte.`}</Body>
                  <Button label="Kész" onPress={close} />
                </View>
              ) : kind === 'merre' ? (
                <View style={styles.row}>
                  <Button label="Balra" onPress={() => guess('bal')} style={styles.flex} />
                  <Button label="Jobbra" onPress={() => guess('jobb')} style={styles.flex} />
                </View>
              ) : (
                <View style={styles.row}>
                  <Button label="Kisebb" onPress={() => guess('kisebb')} style={styles.flex} />
                  <Button label="Nagyobb" onPress={() => guess('nagyobb')} style={styles.flex} />
                </View>
              )}
            </>
          )}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing(4) },
  card: { gap: spacing(2) },
  col: { gap: spacing(2), marginTop: spacing(3) },
  row: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) },
  flex: { flex: 1 },
  progress: { color: colors.accent, fontSize: 16, fontWeight: '700' },
});
