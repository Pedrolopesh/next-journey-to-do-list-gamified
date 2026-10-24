import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { socialLogin } from '@/api/endpoints';
import { isNetworkError, toApiError } from '@/api/errors';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import {
  configureGoogle,
  getAppleIdToken,
  getGoogleIdToken,
  googleEnabled,
  isAppleAvailable,
} from '@/features/auth/social-id-token';
import { toast } from '@/features/feedback/toast-store';
import { colors, space } from '@/theme';

/** Termos aceitos no primeiro acesso por login social (LGPD). Sobe quando os textos mudarem. */
const TERMS_VERSION = '2026-10-01';

/**
 * Login com Google e com Apple. O aparelho obtém o ID token e só ele vai para a API, que valida no
 * servidor. Os botões só aparecem quando o recurso está configurado/disponível.
 */
export function SocialButtons() {
  const { t } = useTranslation();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    configureGoogle();
    void isAppleAvailable().then(setAppleAvailable);
  }, []);

  const finish = async (provider: 'google' | 'apple', idToken: string): Promise<void> => {
    try {
      const response = await socialLogin(provider, {
        idToken,
        timezone,
        termsVersion: TERMS_VERSION,
      });
      await useSessionStore.getState().setSession(response);
      toast.success(t('auth.loginSuccess'));
    } catch (cause) {
      const message = isNetworkError(cause)
        ? t('auth.networkError')
        : toApiError(cause)?.code === 'EMAIL_NOT_VERIFIED_BY_PROVIDER'
          ? t('auth.providerEmailNotVerified')
          : t('auth.genericError');
      setError(message);
      toast.error(message);
    }
  };

  const google = async (): Promise<void> => {
    setError(null);
    setBusy('google');
    try {
      const idToken = await getGoogleIdToken();
      if (idToken) await finish('google', idToken);
    } catch {
      setError(t('auth.genericError'));
      toast.error(t('auth.genericError'));
    } finally {
      setBusy(null);
    }
  };

  const apple = async (): Promise<void> => {
    setError(null);
    setBusy('apple');
    try {
      const idToken = await getAppleIdToken();
      if (idToken) await finish('apple', idToken);
    } catch {
      toast.error(t('auth.genericError'));
    } finally {
      setBusy(null);
    }
  };

  if (!googleEnabled && !appleAvailable) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.or}>{t('auth.or')}</Text>
      {googleEnabled ? (
        <Button
          label={t('auth.continueGoogle')}
          variant="secondary"
          loading={busy === 'google'}
          onPress={() => void google()}
        />
      ) : null}
      {appleAvailable ? (
        <Button
          label={t('auth.continueApple')}
          variant="secondary"
          loading={busy === 'apple'}
          onPress={() => void apple()}
        />
      ) : null}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[8] },
  or: { color: colors.text.muted, fontSize: 12, textAlign: 'center' },
  error: { color: colors.status.danger, fontSize: 13 },
});
