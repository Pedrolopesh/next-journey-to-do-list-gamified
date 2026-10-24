import type { DeleteAccountRequest } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { deleteAccount } from '@/api/endpoints';
import { useMe } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { ScreenFrame } from '@/components/screen-frame';
import { TextField } from '@/components/text-field';
import {
  configureGoogle,
  getAppleIdToken,
  getGoogleIdToken,
  googleEnabled,
  isAppleAvailable,
} from '@/features/auth/social-id-token';
import { describeError } from '@/features/feedback/error-message';
import { useFeedbackStore } from '@/features/feedback/feedback-store';
import { toast } from '@/features/feedback/toast-store';
import { useAction } from '@/features/feedback/use-action';
import { colors, space } from '@/theme';

/** A pessoa desistiu no login do Google/Apple: não é erro do servidor. */
class Cancelled extends Error {}

/**
 * Exclusão de conta com reautenticação: a senha atual (conta com senha) ou um novo login com o
 * Google/Apple (conta só social). Só depois disso a API apaga a conta.
 */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: me, isError, refetch } = useMe();
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
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

  const confirm = (getProof: () => Promise<DeleteAccountRequest>): Promise<boolean> =>
    run(async () => {
      await deleteAccount(await getProof());
      queryClient.clear();
      useFeedbackStore.getState().clear();
      await useSessionStore.getState().clear();
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
  body: { color: colors.text.secondary, fontSize: 14, marginBottom: space[8] },
});
