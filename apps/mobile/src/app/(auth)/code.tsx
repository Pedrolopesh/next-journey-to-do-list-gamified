import { emailConfirmRequestSchema, VERIFICATION_CODE_LENGTH } from '@nextjourney/contracts';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { emailConfirm, emailStart } from '@/api/endpoints';
import { useEmailFlow } from '@/auth/email-flow-store';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { CodeInput } from '@/components/code-input';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { TERMS_VERSION } from '@/features/auth/terms';
import { describeError } from '@/features/feedback/error-message';
import { toast } from '@/features/feedback/toast-store';
import { useAction } from '@/features/feedback/use-action';

/** Seconds until the resend is allowed (the API's minimum interval between emails). */
const RESEND_SECONDS = 60;

/** Passwordless entry, step 2: the 6-digit code trades for the session. */
export default function CodeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const email = useEmailFlow((state) => state.email);
  const [code, setCode] = useState('');
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
    name: 'auth.emailConfirm',
    success: t('auth.loginSuccess'),
    error: (cause) =>
      describeError(cause, t, { INVALID_VERIFICATION_CODE: t('entry.code.invalid') }),
  });
  const resend = useAction({
    name: 'auth.emailResend',
    success: t('entry.code.resent'),
    error: (cause) => describeError(cause, t),
  });

  // App reopened midway: the email only lives in memory, so start over
  if (!email) return <Redirect href="/email" />;

  const submit = async (): Promise<void> => {
    const parsed = emailConfirmRequestSchema.safeParse({ email, code });
    if (!parsed.success || code.length !== VERIFICATION_CODE_LENGTH) {
      toast.error(t('entry.code.incomplete'));
      return;
    }
    const ok = await confirm.run(async () => {
      await useSessionStore.getState().setSession(await emailConfirm(parsed.data));
    });
    if (ok) useEmailFlow.getState().clear();
  };

  const sendAgain = async (): Promise<void> => {
    const ok = await resend.run(() =>
      emailStart({
        email,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        termsVersion: TERMS_VERSION,
      }),
    );
    if (ok) setSecondsLeft(RESEND_SECONDS);
  };

  return (
    <OnboardingScreen
      title={t('entry.code.title')}
      subtitle={t('entry.code.intro', { email })}
      footer={
        <>
          <Button
            label={t('entry.code.confirm')}
            loading={confirm.loading}
            disabled={code.length !== VERIFICATION_CODE_LENGTH}
            onPress={() => void submit()}
          />
          <Button
            label={
              secondsLeft > 0
                ? t('entry.code.resendIn', { seconds: secondsLeft })
                : t('entry.code.resend')
            }
            variant="secondary"
            loading={resend.loading}
            disabled={secondsLeft > 0}
            onPress={() => void sendAgain()}
          />
          <Button
            label={t('entry.code.otherEmail')}
            variant="ghost"
            onPress={() => {
              useEmailFlow.getState().clear();
              router.replace('/email');
            }}
          />
        </>
      }
    >
      <CodeInput value={code} onChange={setCode} length={VERIFICATION_CODE_LENGTH} />
    </OnboardingScreen>
  );
}
