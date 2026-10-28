import { authResponseSchema } from '@nextjourney/contracts';
import axios, { isAxiosError } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useSessionStore } from '@/auth/session-store';
import { log } from '@/logging';

import { resolveApiUrl } from './api-url';
import { deviceName } from './device-name';
import { createHttpClient } from './http';

const API_URL = resolveApiUrl({
  configured: process.env.EXPO_PUBLIC_API_URL,
  isProduction: Constants.expoConfig?.extra?.appVariant === 'production',
  platform: Platform.OS,
});
export const baseURL = `${API_URL}/v1`;
log.info('app.api', { baseURL });

/** Cliente da API com refresh automático ligado à sessão. */
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

// A lista de sessões da conta mostra este nome (a API limpa e limita o texto)
http.defaults.headers.common['X-Device-Name'] = encodeURIComponent(deviceName());

/**
 * Ao abrir o app: se há refresh token salvo, troca por tokens novos e entra; senão, vai para o login.
 * Não guardamos o usuário no aparelho: ele vem da resposta do refresh.
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
    // Sem rede ou API fora do ar: mantém o refresh token salvo e deixa entrar de novo depois
    if (isAxiosError(error) && !error.response) {
      store.markSignedOut();
      return;
    }
    await store.clear();
  }
}
