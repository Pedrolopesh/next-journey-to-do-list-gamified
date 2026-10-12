import { IconPlus } from '@tabler/icons-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors, softGlow, space } from '@/theme';

const FAB_SIZE = 52;

/** Botão flutuante de criar item (52 pt, direito inferior). */
export function Fab({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        softGlow(colors.brand.primary, { pressed }),
        pressed && styles.pressed,
      ]}
    >
      <IconPlus size={24} color={colors.text.onPrimary} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: space.screenMargin,
    bottom: space[16],
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.96 }] },
});
