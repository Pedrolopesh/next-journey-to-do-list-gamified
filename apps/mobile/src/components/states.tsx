import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { colors, radius, space } from '@/theme';

/** Linhas cinza pulsando enquanto a lista carrega (skeleton). */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [opacity]);

  return (
    <View style={styles.skeletonList} accessibilityElementsHidden importantForAccessibility="no">
      {Array.from({ length: rows }, (_, index) => (
        <Animated.View key={index} style={[styles.skeletonRow, { opacity }]} />
      ))}
    </View>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function ErrorState({
  message,
  retryLabel,
  retrying = false,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  /** Mostra o botão carregando enquanto a nova tentativa roda. */
  retrying?: boolean;
  onRetry: () => void;
}) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <Text style={styles.title}>{message}</Text>
      <Button label={retryLabel} variant="secondary" loading={retrying} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonList: { gap: space[8], paddingVertical: space[12] },
  skeletonRow: { height: 68, borderRadius: radius.card, backgroundColor: colors.bg.surface },
  center: { alignItems: 'center', gap: space[8], paddingVertical: space[24] },
  title: { color: colors.text.secondary, fontSize: 14, textAlign: 'center' },
  hint: { color: colors.text.muted, fontSize: 12, textAlign: 'center' },
});
