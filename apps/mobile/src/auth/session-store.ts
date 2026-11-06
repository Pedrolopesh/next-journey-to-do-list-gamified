import type { AuthResponse, UserSummary } from '@nextjourney/contracts';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { log } from '@/logging';

/** Only the refresh token is persisted (SecureStore: Keychain/Keystore). The access token lives in memory. */
const REFRESH_KEY = 'nj.refreshToken';

type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

type SessionState = {
  status: SessionStatus;
  user: UserSummary | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Sets the session from a login, sign-up or refresh response. */
  setSession: (response: AuthResponse) => Promise<void>;
  /** Ends the local session (logout or expired refresh). */
  clear: () => Promise<void>;
  /** Reads the saved refresh token; the renewal itself is done by `restoreSession`. */
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
    // Memory first: the next calls already use the new token (the refresh token is rotating)
    set({
      status: 'signedIn',
      user: response.user,
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
    });
    try {
      await SecureStore.setItemAsync(REFRESH_KEY, response.tokens.refreshToken);
    } catch (error) {
      // Without saving the refresh token the session does not survive closing the app: do not pretend it signed in
      set({ status: 'signedOut', user: null, accessToken: null, refreshToken: null });
      throw error;
    }
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
