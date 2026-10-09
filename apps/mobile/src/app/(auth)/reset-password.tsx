import { PASSWORD_RULES, resetPasswordRequestSchema } from '@nextjourney/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { resetPassword } from '@/api/endpoints';
import { isNetworkError, toApiError } from '@/api/errors';
import { Button } from '@/components/button';
import { PasswordChecklist } from '@/components/password-checklist';
import { TextField } from '@/components/text-field';
import { colors, space } from '@/theme';

/** Nova senha, aberta pelo link do e-mail (nextjourney://reset-password?token=...). */
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    setError(null);
    if (password !== confirm) {
      setError(t('auth.validation.passwordMismatch'));
      return;
    }
    const parsed = resetPasswordRequestSchema.safeParse({
      token: token ?? '',
      newPassword: password,
    });
    if (!parsed.success || !PASSWORD_RULES.every((rule) => rule.test(password))) {
      setError(t('auth.validation.passwordRules'));
      return;
    }
    setSaving(true);
    try {
      await resetPassword(parsed.data);
      setDone(true);
    } catch (cause) {
      setError(
        isNetworkError(cause)
          ? t('auth.networkError')
          : toApiError(cause)?.code === 'INVALID_RESET_TOKEN'
            ? t('auth.resetInvalid')
            : t('auth.genericError'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        {t('auth.resetTitle')}
      </Text>
      {done ? (
        <>
          <Text style={styles.text} accessibilityLiveRegion="polite">
            {t('auth.resetDone')}
          </Text>
          <Button
            label={t('auth.backToLogin')}
            onPress={() => {
              router.replace('/login');
            }}
          />
        </>
      ) : (
        <>
          <TextField
            label={t('auth.newPasswordLabel')}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            secret
          />
          <PasswordChecklist password={password} />
          <TextField
            label={t('auth.confirmPasswordLabel')}
            value={confirm}
            onChangeText={setConfirm}
            autoCapitalize="none"
            secret
          />
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button label={t('auth.resetSubmit')} loading={saving} onPress={() => void submit()} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: space.screenMargin,
    paddingTop: space[40],
    gap: space[16],
    backgroundColor: colors.bg.base,
    flexGrow: 1,
  },
  title: { color: colors.text.primary, fontSize: 24, fontWeight: '700' },
  text: { color: colors.text.secondary, fontSize: 14 },
  error: { color: colors.status.danger, fontSize: 13 },
});
