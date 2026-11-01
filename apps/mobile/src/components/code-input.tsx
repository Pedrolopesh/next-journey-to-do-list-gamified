import { type ComponentRef, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontSize, radius, size, space } from '@/theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length: number;
  autoFocus?: boolean;
};

/** One box per digit over a single hidden input (keeps paste and the system's code suggestion working). */
export function CodeInput({ value, onChange, length, autoFocus = true }: Props) {
  const { t } = useTranslation();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <Pressable
      onPress={() => input.current?.focus()}
      accessibilityLabel={t('entry.code.boxLabel', { index: Math.min(value.length + 1, length) })}
      style={styles.row}
    >
      {Array.from({ length }, (_, index) => {
        const active = index === Math.min(value.length, length - 1);
        return (
          <View key={index} style={[styles.box, active && styles.active]}>
            <Text style={styles.digit}>{value[index] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={input}
        value={value}
        onChangeText={(text) => {
          onChange(text.replace(/\D/g, '').slice(0, length));
        }}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[8], justifyContent: 'center' },
  box: {
    flex: 1,
    maxWidth: 52,
    height: size.touchTarget + space[16],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.surface,
  },
  active: { borderWidth: 2, borderColor: colors.brand.primaryLight },
  digit: { color: colors.text.primary, fontSize: fontSize[24], fontWeight: '700' },
  hidden: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
});
