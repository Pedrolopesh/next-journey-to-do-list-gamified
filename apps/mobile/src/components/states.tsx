import type { Icon } from '@tabler/icons-react-native';
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

/**
 * Página sem itens: ícone num círculo, título e uma mensagem amigável dizendo o que fazer, como se
 * a informação ainda não existisse (e não como um erro).
 */
export function EmptyState({
  title,
  hint,
  icon: IconComponent,
}: {
  title: string;
  hint?: string;
  icon?: Icon;
}) {
  return (
    <View style={styles.empty} accessibilityRole="summary">
      {IconComponent ? (
        <View style={styles.emptyIcon} accessibilityElementsHidden importantForAccessibility="no">
          <IconComponent size={36} color={colors.brand.primaryLight} strokeWidth={1.75} />
        </View>
      ) : null}
      <Text style={styles.emptyTitle} accessibilityRole="header">
        {title}
      </Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
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
  empty: {
    alignItems: 'center',
    gap: space[12],
    paddingVertical: space[40],
    paddingHorizontal: space[24],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyHint: { color: colors.text.secondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  center: { alignItems: 'center', gap: space[8], paddingVertical: space[24] },
  title: { color: colors.text.secondary, fontSize: 14, textAlign: 'center' },
  hint: { color: colors.text.muted, fontSize: 12, textAlign: 'center' },
});
