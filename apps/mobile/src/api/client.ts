import { authResponseSchema } from '@nextjourney/contracts';
import axios, { isAxiosError } from 'axios';
import { Platform } from 'react-native';

import { useSessionStore } from '@/auth/session-store';

import { createHttpClient } from './http';

// Emulador Android enxerga o localhost do computador em 10.0.2.2
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_URL).replace(/\/$/, '');
export const baseURL = `${API_URL}/v1`;

/** Cliente da API com refresh automático ligado à sessão. */
export const http = createHttpClient({
  baseURL,
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
