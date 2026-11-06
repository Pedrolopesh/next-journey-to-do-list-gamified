import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, size, space } from '@/theme';

type Props = {
  /** Color name and the sample color (hex) of each dot. */
  options: readonly { value: string; color: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  label: string;
};

/** Color choice by dots (more direct than a list of names). 44 pt touch target. */
export function Swatches({ options, value, onChange, label }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      showsVerticalScrollIndicator={false}
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
