import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fontSize, radius, size, softGlow, space } from '@/theme';

type Option<T extends string> = { value: T; label: string; color?: string; disabled?: boolean };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** List that scrolls horizontally (filters) instead of wrapping. */
  scroll?: boolean;
  label?: string;
  /** Unselected options already show their own color (outline and text), as a preview. */
  tinted?: boolean;
};

/** Single-option selector (categories, difficulty, kind). 44 pt touch target. */
export function Pills<T extends string>({
  options,
  value,
  onChange,
  scroll = false,
  label,
  tinted = false,
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
            ...softGlow(option.color ?? colors.brand.primary, { strength: 0.6 }),
          },
          !selected && tinted && option.color && { borderColor: option.color },
          option.disabled && styles.disabled,
        ]}
      >
        <Text
          style={[
            styles.text,
            selected && styles.textSelected,
            !selected && tinted && option.color && { color: option.color },
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={[styles.row, styles.scrollRow]}
        showsVerticalScrollIndicator={false}
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
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[8], alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  // fixed height (pill + glow room): the list does not shrink or jump when the filter changes
  scroller: { flexGrow: 0, flexShrink: 0, height: size.touchTarget + 16 },
  // room so the selected chip's glow is not clipped by the list
  scrollRow: { paddingVertical: 8, paddingHorizontal: 4 },
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
  text: { color: colors.text.secondary, fontSize: fontSize[13], fontWeight: '500' },
  textSelected: { color: colors.text.onPrimary, fontWeight: '600' },
});
