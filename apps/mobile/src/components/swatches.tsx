import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, size, space } from '@/theme';

type Props = {
  /** Nome da cor e a cor de exemplo (hex) de cada bolinha. */
  options: readonly { value: string; color: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  label: string;
};

/** Escolha de cor por bolinhas (mais direta que uma lista de nomes). Alvo de toque de 44 pt. */
export function Swatches({ options, value, onChange, label }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(option.value);
            }}
            style={styles.hit}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: option.color },
                selected && styles.dotSelected,
              ]}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space[4], alignItems: 'center' },
  hit: {
    width: size.touchTarget,
    height: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.border.subtle,
  },
  dotSelected: { borderColor: colors.text.primary, borderWidth: 3, transform: [{ scale: 1.12 }] },
});
