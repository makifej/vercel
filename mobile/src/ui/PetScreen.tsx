import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { PetState } from '../sim';
import { healthLabel, hearts, stageLabel } from '../game/texts';
import { PixelSprite, type SpriteColors } from './PixelSprite';
import { BABY, EGG, FORM_SPRITES, GRAVE, POOP, SKULL, STAR, type Sprite } from './sprites';
import { colors, PALETTES, SENIOR_TINT } from './theme';

const PIXEL = 7;
const STEPS = 6;

function spriteColors(pet: PetState): SpriteColors {
  const pal = pet.stage === 'senior' ? SENIOR_TINT : PALETTES[pet.palette % PALETTES.length];
  return { o: colors.lcdDark, b: pal.body, l: pal.light, e: colors.lcdDark, w: '#ffffff', c: '#ff8fa3', a: '#d9a514' };
}

const ICON_COLORS: SpriteColors = {
  o: colors.lcdDark,
  b: '#8a5a2b',
  l: '#b07d4b',
  e: colors.lcdDark,
  w: '#ffffff',
  c: '#ff8fa3',
  a: '#d9a514',
};

function petSprite(pet: PetState, deathStyle: 'csillag' | 'sirko'): Sprite {
  if (pet.status === 'egg') return EGG;
  if (pet.status === 'dead') return deathStyle === 'sirko' ? GRAVE : STAR;
  if (pet.stage === 'baby' || !pet.form) return BABY;
  return FORM_SPRITES[pet.form];
}

function describe(pet: PetState): string {
  if (pet.status === 'egg') return `${pet.name} még tojás.`;
  if (pet.status === 'dead') return `${pet.name} életének vége.`;
  if (pet.status === 'nagyi') return `${pet.name} Nagyinál van.`;
  const parts = [
    `${pet.name}, ${stageLabel(pet)}`,
    `jóllakottság ${hearts(pet.hunger)} szív a 4-ből`,
    `boldogság ${hearts(pet.happiness)} szív a 4-ből`,
    `egészség: ${healthLabel(pet)}`,
  ];
  if (pet.asleep) parts.push(pet.lightsOff ? 'alszik, a villany leoltva' : 'alszik, a villany ég');
  if (pet.sick) parts.push('beteg');
  if (pet.poops.length) parts.push(`${pet.poops.length} kaki`);
  if (pet.calls.some((c) => c.type !== 'misbehave')) parts.push('figyelmet kér');
  if (pet.calls.some((c) => c.type === 'misbehave')) parts.push('rosszalkodik');
  return parts.join(', ');
}

export function PetScreen({ pet, deathStyle }: { pet: PetState; deathStyle: 'csillag' | 'sirko' }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const [flip, setFlip] = useState(false);
  const [blink, setBlink] = useState(true);
  const bob = useRef(new Animated.Value(0)).current;

  const moving = pet.status === 'alive' && !pet.asleep && !pet.vacation && !reduceMotion;
  const warming = pet.status === 'egg' && pet.eggWarmMin !== null && !reduceMotion;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!moving) return;
    const id = setInterval(() => {
      const prev = posRef.current;
      const next = Math.max(-STEPS, Math.min(STEPS, prev + Math.floor(Math.random() * 3) - 1));
      posRef.current = next;
      setPos(next);
      if (next !== prev) setFlip(next < prev);
      setBlink((b) => !b);
    }, 1100);
    return () => clearInterval(id);
  }, [moving]);

  useEffect(() => {
    if (!moving && !warming) {
      bob.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -PIXEL, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [moving, warming, bob]);

  const sprite = useMemo(() => petSprite(pet, deathStyle), [pet, deathStyle]);
  const sColors = useMemo(() => spriteColors(pet), [pet]);
  const deathColors = useMemo<SpriteColors>(() => ({ ...sColors, a: '#d9a514', w: '#f4f4f0', b: sColors.b }), [sColors]);
  const attention = pet.status === 'alive' && pet.calls.length > 0;
  const lightsOff = pet.status === 'alive' && pet.asleep && pet.lightsOff;

  return (
    <View style={styles.lcd} accessible accessibilityLabel={describe(pet)}>
      <View style={styles.topIcons}>
        <View style={styles.iconSlot}>{pet.sick ? <PixelSprite sprite={SKULL} colors={ICON_COLORS} pixel={4} /> : null}</View>
        <Text style={styles.stageText}>{pet.status === 'nagyi' ? 'Nagyinál' : pet.vacation ? 'Szabadságon' : stageLabel(pet)}</Text>
        <View style={styles.iconSlot}>
          {attention && (blink || reduceMotion) ? <Text style={styles.attention}>!</Text> : null}
        </View>
      </View>

      <View style={styles.stage}>
        {pet.status === 'nagyi' ? (
          <Text style={styles.lcdText}>{`${pet.name} Nagyinál van.\nJól van, és vár.`}</Text>
        ) : pet.vacation && pet.status === 'alive' ? (
          <View style={styles.center}>
            <PixelSprite sprite={sprite} colors={sColors} pixel={PIXEL - 2} />
            <Text style={styles.lcdText}>Üdül</Text>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ translateX: pos * PIXEL * 2 }, { translateY: bob }] }}>
            <PixelSprite
              sprite={sprite}
              colors={pet.status === 'dead' ? deathColors : sColors}
              pixel={PIXEL}
              flip={flip}
            />
          </Animated.View>
        )}
        {pet.status === 'alive' && pet.asleep ? <Text style={styles.zzz}>{pet.napMin > 0 ? 'z' : 'Z z'}</Text> : null}
        {pet.status === 'alive' && !pet.vacation ? (
          <View style={styles.poops}>
            {pet.poops.map((_, i) => (
              <PixelSprite key={i} sprite={POOP} colors={ICON_COLORS} pixel={4} />
            ))}
          </View>
        ) : null}
      </View>
      {lightsOff ? <View style={styles.dark} pointerEvents="none" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lcd: {
    backgroundColor: colors.lcd,
    borderRadius: 18,
    borderWidth: 6,
    borderColor: '#3b4a3a',
    height: 230,
    padding: 10,
    overflow: 'hidden',
  },
  topIcons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 34 },
  iconSlot: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stageText: { color: colors.lcdDark, fontFamily: 'monospace', fontSize: 14 },
  attention: { color: colors.lcdDark, fontFamily: 'monospace', fontSize: 28, fontWeight: '900' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  lcdText: { color: colors.lcdDark, fontFamily: 'monospace', fontSize: 16, textAlign: 'center' },
  zzz: { position: 'absolute', top: 6, right: 70, color: colors.lcdDark, fontFamily: 'monospace', fontSize: 22 },
  poops: { position: 'absolute', right: 4, bottom: 4, flexDirection: 'column-reverse', gap: 4 },
  dark: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 16, 10, 0.78)' },
});
