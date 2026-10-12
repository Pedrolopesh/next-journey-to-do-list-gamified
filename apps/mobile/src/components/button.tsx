import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, size, softGlow, softGlowOutline } from '@/theme';

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
        // Brilho suave: principal cheio, secundário contornado; ghost (só texto) não brilha.
        // Desabilitado ou carregando perde o brilho (o contorno continua).
        !inactive && variant === 'primary' && softGlow(colors.brand.primary, { pressed }),
        variant === 'secondary' &&
          (inactive
            ? styles.secondaryInactive
            : softGlowOutline(colors.brand.primary, { pressed })),
        pressed && styles.pressed,
        inactive && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.text.onPrimary : colors.brand.primaryLight}
        />
      ) : (
        <Text style={[styles.label, variant !== 'primary' && styles.ghostLabel]}>{label}</Text>
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
  secondary: { backgroundColor: 'transparent' },
  secondaryInactive: {
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  ghost: { backgroundColor: 'transparent' },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  label: { color: colors.text.onPrimary, fontSize: 15, fontWeight: '600' },
  ghostLabel: { color: colors.brand.primaryLight },
});
