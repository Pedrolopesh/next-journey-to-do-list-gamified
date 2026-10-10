import type { AuthResponse, UserSummary } from '@nextjourney/contracts';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { log } from '@/logging';

/** Só o refresh token é persistido (SecureStore: Keychain/Keystore). O access token vive na memória. */
const REFRESH_KEY = 'nj.refreshToken';

type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

type SessionState = {
  status: SessionStatus;
  user: UserSummary | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Define a sessão a partir de uma resposta de login, cadastro ou refresh. */
  setSession: (response: AuthResponse) => Promise<void>;
  /** Encerra a sessão local (logout ou refresh expirado). */
  clear: () => Promise<void>;
  /** Lê o refresh token salvo; a renovação em si é feita por `restoreSession`. */
  loadStoredRefreshToken: () => Promise<string | null>;
  markSignedOut: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  refreshToken: null,

  async setSession(response) {
    log.info('session.signedIn', { userId: response.user.id });
    await SecureStore.setItemAsync(REFRESH_KEY, response.tokens.refreshToken);
    set({
      status: 'signedIn',
      user: response.user,
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
    });
  },

  async clear() {
    log.info('session.cleared');
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined);
    set({ status: 'signedOut', user: null, accessToken: null, refreshToken: null });
  },

  async loadStoredRefreshToken() {
    try {
      return await SecureStore.getItemAsync(REFRESH_KEY);
    } catch {
      return null;
    }
  },

  markSignedOut() {
    set({ status: 'signedOut', user: null, accessToken: null, refreshToken: null });
  },
}));
