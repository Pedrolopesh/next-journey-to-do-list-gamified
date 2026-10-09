import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { colors, radius, space } from '@/theme';

type Props = { message: string | null; onHidden: () => void };

/** Toast de EXP a cada check (RF-25): aparece, fica 1,6 s e some. */
export function ExpToast({ message, onHidden }: Props) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!message) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(1300),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onHidden();
    });
  }, [message, onHidden, opacity]);

  if (!message) return null;
  return (
    <Animated.View
      style={[styles.toast, { opacity }]}
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: space[24],
    alignSelf: 'center',
    backgroundColor: colors.brand.gold,
    borderRadius: radius.pill,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
  },
  text: { color: colors.bg.base, fontSize: 14, fontWeight: '700' },
});
