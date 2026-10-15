import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, softGlowOutline, space } from '@/theme';

import { PixelArt, type PixelArtName } from './pixel-art';

type Props = {
  title: string;
  description: string;
  art: PixelArtName;
  onPress: () => void;
  disabled?: boolean;
};

/** Botão de ação da Home: contornado, com pixel art ao lado, título e descrição curta. */
export function ActionButton({ title, description, art, onPress, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        softGlowOutline(colors.brand.primary, { pressed }),
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <PixelArt name={art} size={48} />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    borderRadius: radius.card,
    paddingVertical: space[12],
    paddingHorizontal: space[16],
  },
  text: { flex: 1, gap: 2 },
  title: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
  description: { color: colors.text.secondary, fontSize: 13 },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
