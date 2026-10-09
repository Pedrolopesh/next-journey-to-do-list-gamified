import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { socialLogin } from '@/api/endpoints';
import { isNetworkError, toApiError } from '@/api/errors';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { colors, space } from '@/theme';

/** Termos aceitos no primeiro acesso por login social (LGPD). Sobe quando os textos mudarem. */
const TERMS_VERSION = '2026-10-01';

// Client ids são públicos (não são segredos). Sem eles o botão do Google não aparece.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

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
  const googleEnabled = GOOGLE_WEB_CLIENT_ID !== '';

  useEffect(() => {
    if (googleEnabled) {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
      });
    }
    if (Platform.OS === 'ios') {
      void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, [googleEnabled]);

  const finish = async (provider: 'google' | 'apple', idToken: string): Promise<void> => {
    try {
      const response = await socialLogin(provider, {
        idToken,
        timezone,
        termsVersion: TERMS_VERSION,
      });
      await useSessionStore.getState().setSession(response);
    } catch (cause) {
      setError(
        isNetworkError(cause)
          ? t('auth.networkError')
          : toApiError(cause)?.code === 'EMAIL_UNAVAILABLE'
            ? t('auth.emailUnavailable')
            : t('auth.genericError'),
      );
    }
  };

  const google = async (): Promise<void> => {
    setError(null);
    setBusy('google');
    try {
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      if (isSuccessResponse(result) && result.data.idToken)
        await finish('google', result.data.idToken);
    } catch {
      setError(t('auth.genericError'));
    } finally {
      setBusy(null);
    }
  };

  const apple = async (): Promise<void> => {
    setError(null);
    setBusy('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });
      if (credential.identityToken) await finish('apple', credential.identityToken);
    } catch {
      // cancelar o fluxo da Apple não é erro
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
