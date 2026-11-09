import '@/i18n';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, View } from 'react-native';

import { restoreSession } from '@/api/client';
import { useMe } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { ProgressionModalHost } from '@/components/progression-modal-host';
import { ToastHost } from '@/components/toast-host';
import { useFeedbackStore } from '@/features/feedback/feedback-store';
import { useItemDraftStore } from '@/features/items/item-draft-store';
import { useCheckSync } from '@/features/offline/use-check-sync';
import { useCharacterDraft } from '@/features/onboarding/character-draft';
import { useOnboardingFlow } from '@/features/onboarding/flow-store';
import { isOnboardingComplete } from '@/features/onboarding/next-step';
import { syncDailyReminder } from '@/features/settings/reminder';
import { log } from '@/logging';
import { colors, fontSize, space } from '@/theme';

const logo = require('../../assets/images/logo-livro.png') as number;

/** Splash while the session is verified (RF-09). */
function Splash({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <View style={styles.splash}>
      <Image source={logo} style={styles.splashLogo} accessibilityIgnoresInvertColors />
      <Text style={styles.splashTitle}>{t('auth.welcomeTitle')}</Text>
      {children}
    </View>
  );
}

/**
 * Decides which group of screens is unlocked: login (no session), onboarding (character or
 * story missing) or the app. The app only unlocks the tabs once character and story are set (RF-13).
 */
function Gate() {
  const { t } = useTranslation();
  const status = useSessionStore((state) => state.status);
  const me = useMe();
  const finishing = useOnboardingFlow((state) => state.finishing);
  const signedIn = status === 'signedIn';
  useCheckSync();
  const notifyAt = me.data?.user.notifyAt;
  // Reschedules the reminder on open (covers reinstall and device change), without asking permission
  useEffect(() => {
    if (notifyAt !== undefined) void syncDailyReminder(notifyAt, { askPermission: false });
  }, [notifyAt]);

  if (status === 'loading') return <Splash />;
  if (signedIn && me.isPending) return <Splash />;
  if (signedIn && me.isError) {
    return (
      <Splash>
        <Text style={styles.error}>{t('auth.networkError')}</Text>
        <Button
          label={t('items.retry')}
          loading={me.isFetching}
          onPress={() => void me.refetch()}
        />
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
        <Stack.Protected guard={signedIn && (!ready || finishing)}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && ready && !finishing}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="item/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="item/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="story/timeline" />
          <Stack.Screen name="achievements" />
          <Stack.Screen name="history" />
          <Stack.Screen name="settings" />
        </Stack.Protected>
        {/* The legal texts are public: open from the sign-in screen and from the settings */}
        <Stack.Screen name="legal/[slug]" />
      </Stack>
      <ProgressionModalHost />
    </>
  );
}

export default function RootLayout() {
  const status = useSessionStore((state) => state.status);
  const pathname = usePathname();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
        queryCache: new QueryCache({
          onError: (error, query) => {
            log.warn('query.error', { key: query.queryKey, message: error.message });
          },
        }),
        mutationCache: new MutationCache({
          onMutate: (variables, mutation) => {
            log.info('mutation.start', { key: mutation.options.mutationKey, input: variables });
          },
          onSuccess: (data, _variables, _context, mutation) => {
            log.info('mutation.success', { key: mutation.options.mutationKey });
            log.debug('mutation.output', { key: mutation.options.mutationKey, data });
          },
          onError: (error, _variables, _context, mutation) => {
            log.warn('mutation.error', {
              key: mutation.options.mutationKey,
              message: error.message,
            });
          },
        }),
      }),
  );

  // Each screen change becomes a log entry (route without sensitive params)
  useEffect(() => {
    log.info('nav.screen', { path: pathname });
  }, [pathname]);

  // Errors nobody handled (JS and promises) are logged too
  useEffect(() => {
    const globals = globalThis as unknown as {
      ErrorUtils?: {
        getGlobalHandler: () => (error: Error, fatal?: boolean) => void;
        setGlobalHandler: (handler: (error: Error, fatal?: boolean) => void) => void;
      };
    };
    const previous = globals.ErrorUtils?.getGlobalHandler();
    globals.ErrorUtils?.setGlobalHandler((error, fatal) => {
      log.error('app.uncaught', {
        fatal,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 6),
      });
      previous?.(error, fatal);
    });
    return () => {
      if (previous) globals.ErrorUtils?.setGlobalHandler(previous);
    };
  }, []);

  useEffect(() => {
    void restoreSession();
  }, []);

  // On sign-out, no data from the previous user stays in cache
  useEffect(() => {
    if (status === 'signedOut') {
      queryClient.clear();
      useFeedbackStore.getState().clear();
      // Nothing of an interrupted onboarding may leak into the next sign-in
      useOnboardingFlow.getState().setFinishing(false);
      useCharacterDraft.getState().reset();
      useItemDraftStore.getState().clear();
    }
  }, [status, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Gate />
      <ToastHost />
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
  splashLogo: { width: 128, height: 112 },
  splashTitle: { color: colors.brand.primaryLight, fontSize: fontSize[22], fontWeight: '700' },
  error: { color: colors.status.danger, fontSize: fontSize[13] },
});
