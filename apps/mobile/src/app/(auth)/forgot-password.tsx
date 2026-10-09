import { forgotPasswordRequestSchema } from '@nextjourney/contracts';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { forgotPassword } from '@/api/endpoints';
import { isNetworkError } from '@/api/errors';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { colors, space } from '@/theme';

/** Recuperação de senha (RF-05). A resposta é sempre a mesma, exista ou não o e-mail. */
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    setError(null);
    const parsed = forgotPasswordRequestSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setError(t('auth.validation.emailInvalid'));
      return;
    }
    setSending(true);
    try {
      await forgotPassword(parsed.data);
      setSent(true);
    } catch (cause) {
      setError(isNetworkError(cause) ? t('auth.networkError') : t('auth.genericError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        {t('auth.forgotPassword')}
      </Text>
      {sent ? (
        <>
          <Text style={styles.text} accessibilityLiveRegion="polite">
            {t('auth.forgotSent')}
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
          <Text style={styles.text}>{t('auth.forgotIntro')}</Text>
          <TextField
            label={t('auth.emailLabel')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={error ?? undefined}
          />
          <Button label={t('auth.sendLink')} loading={sending} onPress={() => void submit()} />
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
});
