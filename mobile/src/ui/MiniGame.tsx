// Minijátékok (PRD 7.15): 5 kör, legalább 3 találat a győzelem. Nincs
// időzítés és nincs finommotoros igény; a Simogatás az akadálymentes alternatíva.

import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Card } from './components';
import { colors, spacing } from './theme';

export type GameKind = 'merre' | 'nagyobb';
const ROUNDS = 5;
const WIN_AT = 3;

interface Props {
  visible: boolean;
  name: string;
  onClose: () => void;
  onFinish: (won: boolean) => void;
}

export function MiniGame({ visible, name, onClose, onFinish }: Props) {
  const [kind, setKind] = useState<GameKind | null>(null);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  const [current, setCurrent] = useState(() => 1 + Math.floor(Math.random() * 9));

  const reset = () => {
    setKind(null);
    setRound(0);
    setHits(0);
    setLast(null);
    setCurrent(1 + Math.floor(Math.random() * 9));
  };

  const finishRound = (correct: boolean, text: string) => {
    const nextHits = hits + (correct ? 1 : 0);
    const nextRound = round + 1;
    setHits(nextHits);
    setRound(nextRound);
    setLast(text);
    if (nextRound >= ROUNDS) {
      onFinish(nextHits >= WIN_AT);
    }
  };

  const guessDirection = (dir: 'bal' | 'jobb') => {
    const actual: 'bal' | 'jobb' = Math.random() < 0.5 ? 'bal' : 'jobb';
    const correct = actual === dir;
    finishRound(correct, `${name} ${actual === 'bal' ? 'balra' : 'jobbra'} fordult. ${correct ? 'Talált.' : 'Nem talált.'}`);
  };

  const guessNumber = (higher: boolean) => {
    let next = current;
    while (next === current) next = 1 + Math.floor(Math.random() * 9);
    const correct = higher ? next > current : next < current;
    finishRound(correct, `A következő szám: ${next}. ${correct ? 'Talált.' : 'Nem talált.'}`);
    setCurrent(next);
  };

  const done = round >= ROUNDS;
  const title = useMemo(() => (kind === 'merre' ? 'Merre fordul?' : kind === 'nagyobb' ? 'Nagyobb vagy kisebb?' : 'Játék'), [kind]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.backdrop}>
        <Card title={title} style={styles.card}>
          {kind === null ? (
            <>
              <Body dim>Válassz játékot. Öt kör, három találat a győzelem.</Body>
              <View style={styles.col}>
                <Button label="Merre fordul?" onPress={() => setKind('merre')} />
                <Button label="Nagyobb vagy kisebb?" onPress={() => setKind('nagyobb')} />
                <Button label="Mégsem" kind="secondary" onPress={() => { reset(); onClose(); }} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.progress} accessibilityLiveRegion="polite">
                {`Kör: ${Math.min(round + 1, ROUNDS)} / ${ROUNDS} · Találat: ${hits}`}
              </Text>
              {last ? <Body>{last}</Body> : <Body dim>{kind === 'merre' ? `Szerinted ${name} merre fordul?` : `A szám: ${current}. A következő nagyobb vagy kisebb lesz?`}</Body>}
              {!done && kind === 'nagyobb' && last ? <Body dim>{`A szám: ${current}.`}</Body> : null}
              {done ? (
                <View style={styles.col}>
                  <Body>{hits >= WIN_AT ? `Győzelem. ${name} boldog.` : `Most nem jött össze, de ${name} élvezte.`}</Body>
                  <Button label="Kész" onPress={() => { reset(); onClose(); }} />
                </View>
              ) : kind === 'merre' ? (
                <View style={styles.row}>
                  <Button label="Balra" onPress={() => guessDirection('bal')} style={styles.flex} />
                  <Button label="Jobbra" onPress={() => guessDirection('jobb')} style={styles.flex} />
                </View>
              ) : (
                <View style={styles.row}>
                  <Button label="Kisebb" onPress={() => guessNumber(false)} style={styles.flex} />
                  <Button label="Nagyobb" onPress={() => guessNumber(true)} style={styles.flex} />
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
