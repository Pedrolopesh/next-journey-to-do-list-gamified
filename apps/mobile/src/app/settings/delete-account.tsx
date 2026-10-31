import { type DeleteAccountRequest, VERIFICATION_CODE_LENGTH } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { deleteAccount, emailStart } from '@/api/endpoints';
import { useMe } from '@/api/queries';
import { signOutLocally } from '@/auth/sign-out-local';
import { Button } from '@/components/button';
import { CodeInput } from '@/components/code-input';
import { ScreenFrame } from '@/components/screen-frame';
import { TextField } from '@/components/text-field';
import {
  configureGoogle,
  getAppleIdToken,
  getGoogleIdToken,
  googleEnabled,
  isAppleAvailable,
} from '@/features/auth/social-id-token';
import { TERMS_VERSION } from '@/features/auth/terms';
import { describeError } from '@/features/feedback/error-message';
import { toast } from '@/features/feedback/toast-store';
import { useAction } from '@/features/feedback/use-action';
import { colors, fontSize, space } from '@/theme';

/** A pessoa desistiu no login do Google/Apple: não é erro do servidor. */
class Cancelled extends Error {}

/**
 * Account deletion with re-authentication: the current password (account with a password), the
 * code received by email or a fresh sign-in with Google/Apple (account without a password). Only
 * then does the API delete the account.
 */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: me, isError, refetch } = useMe();
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    configureGoogle();
    void isAppleAvailable().then(setAppleAvailable);
  }, []);

  const { run, loading } = useAction({
    name: 'account.delete',
    success: t('settings.deleted'),
    error: (cause) =>
      cause instanceof Cancelled
        ? t('settings.reauthCancelled')
        : describeError(cause, t, { REAUTH_FAILED: t('settings.reauthFailed') }),
  });

  const send = useAction({
    name: 'account.deleteSendCode',
    success: t('settings.deleteCodeSent'),
    error: (cause) => describeError(cause, t),
  });

  const confirm = (getProof: () => Promise<DeleteAccountRequest>): Promise<boolean> =>
    run(async () => {
      await deleteAccount(await getProof());
      await signOutLocally(queryClient);
    });

  const withPassword = (): void => {
    if (password.length === 0) {
      setFieldError(t('settings.deletePasswordRequired'));
      toast.error(t('settings.deletePasswordRequired'));
      return;
    }
    setFieldError(null);
    void confirm(() => Promise.resolve({ password }));
  };

  const sendCode = (email: string): void => {
    void send.run(async () => {
      await emailStart({
        email,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        termsVersion: TERMS_VERSION,
      });
      setCodeSent(true);
    });
  };

  const withCode = (): void => {
    if (code.length !== VERIFICATION_CODE_LENGTH) {
      toast.error(t('entry.code.incomplete'));
      return;
    }
    void confirm(() => Promise.resolve({ emailCode: code }));
  };

  const withProvider = (provider: 'google' | 'apple'): void => {
    void confirm(async () => {
      const idToken = await (provider === 'google' ? getGoogleIdToken() : getAppleIdToken());
      if (!idToken) throw new Cancelled();
      return { provider, idToken };
    });
  };

  return (
    <ScreenFrame title={t('settings.deleteTitle')}>
      <Text style={styles.body}>{t('settings.deleteBody')}</Text>
      {me === undefined && isError ? (
        <>
          <Text style={styles.body}>{t('settings.deleteLoadFailed')}</Text>
          <Button
            label={t('settings.deleteRetry')}
            variant="secondary"
            onPress={() => {
              void refetch();
            }}
          />
        </>
      ) : me === undefined ? (
        <Button label={t('settings.deleteConfirm')} loading onPress={() => undefined} />
      ) : me.user.hasPassword ? (
        <>
          <TextField
            label={t('settings.deletePasswordLabel')}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoComplete="current-password"
            secret
            error={fieldError ?? undefined}
          />
          <Button
            label={t('settings.deleteConfirm')}
            variant="danger"
            loading={loading}
            onPress={withPassword}
          />
        </>
      ) : (
        <>
          <Text style={styles.body}>{t('settings.deleteWithCode')}</Text>
          {codeSent ? (
            <>
              <CodeInput value={code} onChange={setCode} length={VERIFICATION_CODE_LENGTH} />
              <Button
                label={t('settings.deleteConfirm')}
                variant="danger"
                loading={loading}
                disabled={code.length !== VERIFICATION_CODE_LENGTH}
                onPress={withCode}
              />
            </>
          ) : (
            <Button
              label={t('settings.deleteSendCode')}
              variant="secondary"
              loading={send.loading}
              onPress={() => {
                sendCode(me.user.email);
              }}
            />
          )}
          <Text style={styles.body}>{t('settings.deleteWithProvider')}</Text>
          {googleEnabled ? (
            <Button
              label={t('settings.deleteWithGoogle')}
              variant="danger"
              loading={loading}
              onPress={() => {
                withProvider('google');
              }}
            />
          ) : null}
          {appleAvailable ? (
            <Button
              label={t('settings.deleteWithApple')}
              variant="danger"
              loading={loading}
              onPress={() => {
                withProvider('apple');
              }}
            />
          ) : null}
        </>
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text.secondary, fontSize: fontSize[14], marginBottom: space[8] },
});
