import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, radius, size, softGlow, softGlowOutline } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  /** Solid color behind the outlined button: stops another button's glow from showing through the translucent background. */
  backdrop?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  backdrop = colors.bg.base,
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
        // Soft glow: filled primary, outlined secondary; ghost (text only) does not glow.
        // Disabled or loading loses the glow (the outline stays).
        !inactive && variant === 'primary' && softGlow(colors.brand.primary, { pressed }),
        variant === 'secondary' &&
          (inactive
            ? styles.secondaryInactive
            : softGlowOutline(colors.brand.primary, { pressed })),
        // Sign out and destructive actions: filled in red, like the primary
        !inactive && variant === 'danger' && softGlow(colors.status.danger, { pressed }),
        variant === 'secondary' && { backgroundColor: backdrop },
        pressed && styles.pressed,
        inactive && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger'
              ? colors.text.onPrimary
              : colors.brand.primaryLight
          }
        />
      ) : (
        <Text
          style={[styles.label, variant !== 'primary' && variant !== 'danger' && styles.ghostLabel]}
        >
          {label}
        </Text>
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
  secondary: { backgroundColor: colors.bg.base },
  secondaryInactive: {
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.status.danger },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  label: { color: colors.text.onPrimary, fontSize: fontSize[15], fontWeight: '600' },
  ghostLabel: { color: colors.brand.primaryLight },
});
