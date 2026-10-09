import '@/i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { restoreSession } from '@/api/client';
import { useMe } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { ProgressionModalHost } from '@/components/progression-modal-host';
import { useFeedbackStore } from '@/features/feedback/feedback-store';
import { isOnboardingComplete } from '@/features/onboarding/next-step';
import { colors, space } from '@/theme';

/** Splash enquanto a sessão é verificada (RF-09). */
function Splash({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <View style={styles.splash}>
      <Text style={styles.splashTitle}>{t('auth.welcomeTitle')}</Text>
      {children}
    </View>
  );
}

/**
 * Decide qual grupo de telas está liberado: login (sem sessão), onboarding (falta personagem ou
 * história) ou o app. O app só libera as abas com personagem e história definidos (RF-13).
 */
function Gate() {
  const { t } = useTranslation();
  const status = useSessionStore((state) => state.status);
  const me = useMe();
  const signedIn = status === 'signedIn';

  if (status === 'loading') return <Splash />;
  if (signedIn && me.isPending) return <Splash />;
  if (signedIn && me.isError) {
    return (
      <Splash>
        <Text style={styles.error}>{t('auth.networkError')}</Text>
        <Button label={t('items.retry')} onPress={() => void me.refetch()} />
      </Splash>
    );
  }

  const ready = signedIn && me.data ? isOnboardingComplete(me.data.onboarding) : false;

  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.base } }}
      >
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !ready}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && ready}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="item/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="item/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="story/timeline" />
          <Stack.Screen name="achievements" />
          <Stack.Screen name="settings" />
        </Stack.Protected>
      </Stack>
      <ProgressionModalHost />
    </>
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
    if (status === 'signedOut') {
      queryClient.clear();
      useFeedbackStore.getState().clear();
    }
  }, [status, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Gate />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[16],
    backgroundColor: colors.bg.base,
  },
  splashTitle: { color: colors.brand.primaryLight, fontSize: 22, fontWeight: '700' },
  error: { color: colors.status.danger, fontSize: 13 },
});
