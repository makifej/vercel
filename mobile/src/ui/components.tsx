import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { formatMinuteOfDay } from '../sim';
import { colors, spacing } from './theme';

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  accessibilityHint,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        kind === 'primary' && styles.primary,
        kind === 'secondary' && styles.secondary,
        kind === 'danger' && styles.dangerBtn,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, kind === 'primary' && styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ title, children, style }: { title?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <Text style={styles.cardTitle} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export function Body({ children, dim }: { children: ReactNode; dim?: boolean }) {
  return <Text style={[styles.body, dim && styles.dim]}>{children}</Text>;
}

export function SwitchRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.body, styles.rowLabel]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.accent, false: colors.border }}
        thumbColor={colors.text}
      />
    </View>
  );
}

/** Időpont-léptető negyedórás lépésekkel (akadálymentes, nincs finommotoros igény). */
export function TimeStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const shift = (d: number) => onChange((((value + d) % 1440) + 1440) % 1440);
  return (
    <View style={styles.row}>
      <Text style={[styles.body, styles.rowLabel]}>{label}</Text>
      <Button label="−15" kind="secondary" onPress={() => shift(-15)} accessibilityHint="15 perccel korábbra" />
      <Text style={styles.stepValue} accessibilityLabel={`${label}: ${formatMinuteOfDay(value)}`}>
        {formatMinuteOfDay(value)}
      </Text>
      <Button label="+15" kind="secondary" onPress={() => shift(15)} accessibilityHint="15 perccel későbbre" />
    </View>
  );
}

export function NumberStepper({
  label,
  value,
  min,
  max,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.body, styles.rowLabel]}>{label}</Text>
      <Button label="−" kind="secondary" onPress={() => onChange(Math.max(min, value - 1))} />
      <Text style={styles.stepValue}>
        {value} {unit}
      </Text>
      <Button label="+" kind="secondary" onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border },
  dangerBtn: { backgroundColor: '#5a2b28', borderWidth: 1, borderColor: colors.danger },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  primaryText: { color: colors.accentText },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing(4),
    gap: spacing(2),
    marginBottom: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing(2) },
  body: { color: colors.text, fontSize: 16, lineHeight: 22 },
  dim: { color: colors.textDim },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginVertical: spacing(1) },
  rowLabel: { flex: 1 },
  stepValue: { color: colors.text, fontSize: 18, fontVariant: ['tabular-nums'], minWidth: 64, textAlign: 'center' },
});
