import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, radius, size, softGlow } from '@/theme';

type Props = {
  checked: boolean;
  disabled?: boolean;
  /** Shows a spinner while the action that the tap started is running. */
  loading?: boolean;
  label: string;
  onPress: () => void;
};

/** Round check of the item rows (lists and history): empty, or green with a check mark. */
export function CheckBox({ checked, disabled = false, loading = false, label, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: disabled || loading, busy: loading }}
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.check,
        checked && styles.checkDone,
        checked && softGlow(colors.status.success, { strength: 0.6 }),
      ]}
    >
      {loading ? (
        <ActivityIndicator color={checked ? colors.text.onPrimary : colors.brand.primaryLight} />
      ) : checked ? (
        <Text style={styles.checkMark}>✓</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: {
    width: size.touchTarget,
    height: size.touchTarget,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  checkMark: { color: colors.text.onPrimary, fontSize: fontSize[20], fontWeight: '700' },
});
