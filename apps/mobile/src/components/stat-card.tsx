import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, space, tonedCard } from '@/theme';

import { PixelArt, type PixelArtName } from './pixel-art';

type Props = {
  art: PixelArtName;
  value: number;
  label: string;
  /** Cor do contorno e do número. */
  tone?: string;
  /** Makes the card a button (go to a list, open an explanation). */
  onPress?: () => void;
};

/** Indicador da Home: pixel art com o rótulo embaixo e o número grande ao lado, com contorno na cor do tom. */
export function StatCard({ art, value, label, tone = colors.brand.primary, onPress }: Props) {
  const Root = onPress ? Pressable : View;
  return (
    <Root
      style={[styles.card, tonedCard(tone)]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
      {...(onPress ? { accessibilityRole: 'button' as const, onPress } : {})}
    >
      <View style={styles.info}>
        <PixelArt name={art} size={36} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: tone }]}>{value}</Text>
    </Root>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
    borderRadius: radius.card,
    paddingVertical: space[12],
    paddingHorizontal: space[12],
  },
  info: { flex: 1, gap: space[4] },
  label: { color: colors.text.secondary, fontSize: fontSize[12] },
  value: { fontSize: fontSize[26], fontWeight: '700' },
});
