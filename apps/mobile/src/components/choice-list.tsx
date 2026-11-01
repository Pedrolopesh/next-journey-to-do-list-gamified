import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, size, space } from '@/theme';

import { PixelArt, type PixelArtName } from './pixel-art';

type Option<T extends string> = { value: T; label: string; art?: PixelArtName };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
};

/** Single-choice list of full-width rows (onboarding questions). */
export function ChoiceList<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              onChange(option.value);
            }}
            style={[styles.row, selected && styles.selected]}
          >
            {option.art ? <PixelArt name={option.art} size={28} /> : null}
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[8] },
  row: {
    minHeight: size.touchTarget + space[8],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingHorizontal: space[16],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.surface,
  },
  selected: { borderWidth: 2, borderColor: colors.brand.primaryLight },
  label: { color: colors.text.secondary, fontSize: fontSize[16] },
  labelSelected: { color: colors.text.primary, fontWeight: '600' },
});
