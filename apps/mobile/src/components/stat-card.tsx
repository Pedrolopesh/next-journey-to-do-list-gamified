import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, rgba, space } from '@/theme';

import { PixelArt, type PixelArtName } from './pixel-art';

type Props = {
  art: PixelArtName;
  value: number;
  label: string;
  /** Cor do contorno e do número. */
  tone?: string;
};

/** Indicador da Home: pixel art, número grande e rótulo, com contorno na cor do tom. */
export function StatCard({ art, value, label, tone = colors.brand.primary }: Props) {
  return (
    <View
      style={[styles.card, { borderColor: rgba(tone, 0.7), backgroundColor: rgba(tone, 0.08) }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <PixelArt name={art} size={36} />
      <Text style={[styles.value, { color: tone }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: 2,
    borderWidth: 1.5,
    borderRadius: radius.card,
    paddingVertical: space[12],
    paddingHorizontal: space[12],
  },
  value: { marginTop: space[4], fontSize: 30, fontWeight: '700' },
  label: { color: colors.text.secondary, fontSize: 12 },
});
