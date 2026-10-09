import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radius, size, space } from '@/theme';

type Option<T extends string> = { value: T; label: string; color?: string; disabled?: boolean };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Lista que rola na horizontal (filtros) em vez de quebrar linha. */
  scroll?: boolean;
  label?: string;
};

/** Seletor de uma opção (categorias, dificuldade, tipo). Alvo de toque de 44 pt. */
export function Pills<T extends string>({
  options,
  value,
  onChange,
  scroll = false,
  label,
}: Props<T>) {
  const content = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled: option.disabled ?? false }}
        accessibilityLabel={label ? `${label}: ${option.label}` : option.label}
        disabled={option.disabled}
        onPress={() => {
          onChange(option.value);
        }}
        style={[
          styles.pill,
          selected && {
            backgroundColor: option.color ?? colors.brand.primary,
            borderColor: option.color ?? colors.brand.primary,
          },
          option.disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.text, selected && styles.textSelected]}>{option.label}</Text>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {content}
      </ScrollView>
    );
  }
  return (
    <ScrollView
      horizontal={false}
      scrollEnabled={false}
      contentContainerStyle={[styles.row, styles.wrap]}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[8], alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  pill: {
    minHeight: size.touchTarget,
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  text: { color: colors.text.secondary, fontSize: 13, fontWeight: '500' },
  textSelected: { color: colors.text.onPrimary, fontWeight: '600' },
});
