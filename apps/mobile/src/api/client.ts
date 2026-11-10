import { authResponseSchema } from '@nextjourney/contracts';
import axios, { isAxiosError } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useSessionStore } from '@/auth/session-store';
import { log } from '@/logging';

import { resolveApiUrl } from './api-url';
import { deviceName } from './device-name';
import { createHttpClient } from './http';

/**
 * A build with a missing or non-https API URL does not crash on start: it records the problem and
 * the root layout shows a configuration error screen instead of the app.
 */
function resolveConfiguredApiUrl(): string | null {
  try {
    return resolveApiUrl({
      configured: process.env.EXPO_PUBLIC_API_URL,
      // Release bundle (__DEV__ false) counts as production even if the manifest variant is missing
      isProduction: !__DEV__ || Constants.expoConfig?.extra?.appVariant === 'production',
      platform: Platform.OS,
    });
  } catch (error) {
    log.error('app.config', { message: error instanceof Error ? error.message : 'invalid' });
    return null;
  }
}

const API_URL = resolveConfiguredApiUrl();
/** True when the build has no valid API URL: nothing can work, so the app only explains it. */
export const configError = API_URL === null;
export const baseURL = `${API_URL ?? ''}/v1`;
if (!configError) log.info('app.api', { baseURL });

/** API client with automatic refresh tied to the session. */
export const http = createHttpClient({
  baseURL,
  log,
  tokens: {
    getAccess: () => useSessionStore.getState().accessToken,
    getRefresh: () => useSessionStore.getState().refreshToken,
    onRefreshed: (response) => {
      void useSessionStore.getState().setSession(authResponseSchema.parse(response));
    },
    onSessionExpired: () => {
      void useSessionStore.getState().clear();
    },
  },
});

// The account's session list shows this name (the API cleans and limits the text)
http.defaults.headers.common['X-Device-Name'] = encodeURIComponent(deviceName());

/**
 * On app open: if a refresh token is saved, trade it for new tokens and sign in; otherwise go to login.
 * The user is not stored on the device: it comes from the refresh response.
 */
export async function restoreSession(): Promise<void> {
  const store = useSessionStore.getState();
  const stored = await store.loadStoredRefreshToken();
  if (!stored) {
    store.markSignedOut();
    return;
  }
  try {
    const { data } = await axios.post<unknown>(
      `${baseURL}/auth/refresh`,
      { refreshToken: stored },
      { timeout: 15_000 },
    );
    await store.setSession(authResponseSchema.parse(data));
  } catch (error) {
    // No network or API down: keep the saved refresh token and let the person in again later
    if (isAxiosError(error) && !error.response) {
      store.markSignedOut();
      return;
    }
    await store.clear();
  }
}
