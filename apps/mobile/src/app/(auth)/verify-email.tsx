import { VERIFICATION_CODE_LENGTH, verifyEmailRequestSchema } from '@nextjourney/contracts';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { resendVerification, verifyEmail } from '@/api/endpoints';
import { usePendingVerificationStore } from '@/auth/pending-verification-store';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { describeError } from '@/features/feedback/error-message';
import { toast } from '@/features/feedback/toast-store';
import { useAction } from '@/features/feedback/use-action';
import { colors, space } from '@/theme';

/** Segundos até liberar o reenvio (o mesmo intervalo mínimo da API). */
const RESEND_SECONDS = 60;

/** Confirmação do e-mail do cadastro: a pessoa digita o código de 6 dígitos recebido. */
export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const pending = usePendingVerificationStore((state) => state.pending);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [secondsLeft]);

  const confirm = useAction({
    name: 'auth.verifyEmail',
    success: t('auth.loginSuccess'),
    error: (cause) =>
      describeError(cause, t, { INVALID_VERIFICATION_CODE: t('auth.verify.invalidCode') }),
  });
  const resend = useAction({
    name: 'auth.resendVerification',
    success: t('auth.verify.resent'),
    error: (cause) => describeError(cause, t),
  });

  // App reaberto no meio do caminho: sem e-mail e senha em memória, volta ao login
  if (!pending) return <Redirect href="/login" />;

  const submit = async (): Promise<void> => {
    setError(null);
    const parsed = verifyEmailRequestSchema.safeParse({
      email: pending.email,
      code: code.trim(),
      password: pending.password,
    });
    if (!parsed.success) {
      setError(t('auth.verify.codeInvalid'));
      toast.error(t('auth.verify.codeInvalid'));
      return;
    }
    const ok = await confirm.run(async () => {
      await useSessionStore.getState().setSession(await verifyEmail(parsed.data));
    });
    if (ok) usePendingVerificationStore.getState().clear();
  };

  const sendAgain = async (): Promise<void> => {
    const ok = await resend.run(() => resendVerification({ email: pending.email }));
    if (ok) setSecondsLeft(RESEND_SECONDS);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        {t('auth.verify.title')}
      </Text>
      <Text style={styles.text}>{t('auth.verify.intro', { email: pending.email })}</Text>
      <TextField
        label={t('auth.verify.codeLabel')}
        value={code}
        onChangeText={(value) => {
          setCode(value.replace(/\D/g, '').slice(0, VERIFICATION_CODE_LENGTH));
        }}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={VERIFICATION_CODE_LENGTH}
        error={error ?? undefined}
      />
      <Button
        label={t('auth.verify.submit')}
        loading={confirm.loading}
        onPress={() => void submit()}
      />
      <Button
        label={
          secondsLeft > 0
            ? t('auth.verify.resendIn', { seconds: secondsLeft })
            : t('auth.verify.resend')
        }
        variant="secondary"
        loading={resend.loading}
        disabled={secondsLeft > 0}
        onPress={() => void sendAgain()}
      />
      <Button
        label={t('auth.backToLogin')}
        variant="ghost"
        onPress={() => {
          usePendingVerificationStore.getState().clear();
          router.replace('/login');
        }}
      />
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
