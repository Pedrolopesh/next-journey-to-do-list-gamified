import '@/i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { restoreSession } from '@/api/client';
import { useSessionStore } from '@/auth/session-store';
import { colors } from '@/theme';

/** Splash enquanto a sessão é verificada (RF-09). */
function Splash() {
  const { t } = useTranslation();
  return (
    <View style={styles.splash}>
      <Text style={styles.splashTitle}>{t('auth.welcomeTitle')}</Text>
    </View>
  );
}

export default function RootLayout() {
  const status = useSessionStore((state) => state.status);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );

  useEffect(() => {
    void restoreSession();
  }, []);

  // Ao sair, nenhum dado do usuário anterior fica em cache
  useEffect(() => {
    if (status === 'signedOut') queryClient.clear();
  }, [status, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      {status === 'loading' ? (
        <Splash />
      ) : (
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.base } }}
        >
          <Stack.Protected guard={status === 'signedIn'}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'signedOut'}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      )}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.base,
  },
  splashTitle: { color: colors.brand.primaryLight, fontSize: 22, fontWeight: '700' },
});
