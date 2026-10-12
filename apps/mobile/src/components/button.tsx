import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, size, softGlow } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        // Brilho suave (some quando desabilitado); o botão "ghost" é só texto e não brilha
        !inactive && variant === 'primary' && softGlow(colors.brand.primary, { pressed }),
        !inactive &&
          variant === 'secondary' &&
          softGlow(colors.bg.raised, { pressed, strength: 0.6, halo: colors.status.info }),
        pressed && styles.pressed,
        inactive && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.onPrimary} />
      ) : (
        <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: size.touchTarget + 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.brand.primary },
  secondary: { backgroundColor: colors.bg.raised },
  ghost: { backgroundColor: 'transparent' },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  label: { color: colors.text.onPrimary, fontSize: 15, fontWeight: '600' },
  ghostLabel: { color: colors.brand.primaryLight },
});
