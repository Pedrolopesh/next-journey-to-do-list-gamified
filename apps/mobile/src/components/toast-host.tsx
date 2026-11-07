import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type ToastKind, useToastStore } from '@/features/feedback/toast-store';
import { colors, fontSize, radius, space } from '@/theme';

const DURATION_MS: Record<ToastKind, number> = {
  success: 2500,
  info: 3000,
  warning: 3000,
  error: 5000,
};
const BACKGROUND: Record<ToastKind, string> = {
  success: colors.status.success,
  info: colors.brand.primary,
  error: colors.status.danger,
  warning: colors.status.warning,
};
// Yellow needs dark text for contrast
const TEXT: Record<ToastKind, string> = {
  success: colors.text.onPrimary,
  info: colors.text.onPrimary,
  error: colors.text.onPrimary,
  warning: colors.bg.base,
};

/** Shows the current toast at the top of any screen, above everything. Errors stay longer. */
export function ToastHost() {
  const current = useToastStore((state) => state.current);
  const hide = useToastStore((state) => state.hide);
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!current) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        hide(current.id);
      });
    }, DURATION_MS[current.kind]);
    return () => {
      clearTimeout(timer);
    };
  }, [current, hide, opacity]);

  if (!current) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[
        styles.toast,
        { top: insets.top + space[8], opacity, backgroundColor: BACKGROUND[current.kind] },
      ]}
    >
      <Text style={[styles.text, { color: TEXT[current.kind] }]}>{current.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space[16],
    right: space[16],
    zIndex: 1000,
    elevation: 10,
    borderRadius: radius.card,
    paddingHorizontal: space[16],
    paddingVertical: space[12],
  },
  text: {
    color: colors.text.onPrimary,
    fontSize: fontSize[14],
    fontWeight: '600',
    textAlign: 'center',
  },
});
