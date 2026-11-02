import { emailStartRequestSchema } from '@nextjourney/contracts';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { emailStart } from '@/api/endpoints';
import { useEmailFlow } from '@/auth/email-flow-store';
import { Button } from '@/components/button';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { TextField } from '@/components/text-field';
import { TERMS_VERSION } from '@/features/auth/terms';
import { describeError } from '@/features/feedback/error-message';
import { toast } from '@/features/feedback/toast-store';
import { useAction } from '@/features/feedback/use-action';

/** Passwordless entry, step 1: the email that receives the 6-digit code. */
export default function EmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { run, loading } = useAction({
    name: 'auth.emailStart',
    success: t('entry.email.sent'),
    error: (cause) => describeError(cause, t),
  });

  const submit = async (): Promise<void> => {
    setError(null);
    const parsed = emailStartRequestSchema.safeParse({
      email: email.trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      termsVersion: TERMS_VERSION,
    });
    if (!parsed.success) {
      setError(t('entry.email.invalid'));
      toast.error(t('entry.email.invalid'));
      return;
    }
    const ok = await run(() => emailStart(parsed.data));
    if (ok) {
      useEmailFlow.getState().set(parsed.data.email);
      router.push('/code');
    }
  };

  return (
    <OnboardingScreen
      title={t('entry.email.title')}
      subtitle={t('entry.email.intro')}
      footer={
        <Button label={t('entry.email.send')} loading={loading} onPress={() => void submit()} />
      }
    >
      <TextField
        label={t('entry.email.label')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('entry.email.placeholder')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        maxLength={254}
        error={error ?? undefined}
      />
    </OnboardingScreen>
  );
}
