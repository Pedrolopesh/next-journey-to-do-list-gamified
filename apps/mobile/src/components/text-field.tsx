import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, radius, size, space } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | undefined;
  /** Campo de senha: mostra o botão mostrar/ocultar. */
  secret?: boolean;
};

export function TextField({ label, error, secret = false, ...input }: Props) {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(secret);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={hidden}
          style={styles.input}
        />
        {secret && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? t('auth.showPassword') : t('auth.hidePassword')}
            onPress={() => {
              setHidden((value) => !value);
            }}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>
              {hidden ? t('auth.showPassword') : t('auth.hidePassword')}
            </Text>
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space[4] },
  label: { color: colors.text.secondary, fontSize: 13, fontWeight: '500' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: colors.bg.surface,
    borderColor: colors.border.strong,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  fieldError: { borderColor: colors.status.danger },
  input: { flex: 1, color: colors.text.primary, fontSize: 15, paddingHorizontal: space[12] },
  toggle: { minHeight: size.touchTarget, justifyContent: 'center', paddingHorizontal: space[12] },
  toggleText: { color: colors.brand.primaryLight, fontSize: 13 },
  error: { color: colors.status.danger, fontSize: 12 },
});
