import type { AuthResponse, AuthTokens } from '@nextjourney/contracts';
import {
  type AxiosAdapter,
  type AxiosInstance,
  create,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';

export type TokenAccess = {
  getAccess: () => string | null;
  getRefresh: () => string | null;
  /** Guarda os tokens novos (e o usuário) depois de um refresh bem-sucedido. */
  onRefreshed: (response: AuthResponse) => void;
  /** O refresh falhou: a sessão acabou. */
  onSessionExpired: () => void;
};

type Options = {
  baseURL: string;
  tokens: TokenAccess;
  /** Só para testes. */
  adapter?: AxiosAdapter;
};

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
const isAuthPath = (url: string | undefined): boolean =>
  AUTH_PATHS.some((path) => url?.includes(path));

export type RefreshedTokens = AuthTokens;

/**
 * Cliente HTTP: injeta o access token e, num 401, renova pelo refresh token UMA vez e refaz a
 * chamada. Requisições concorrentes que levam 401 compartilham a mesma renovação (fila).
 */
export function createHttpClient({ baseURL, tokens, adapter }: Options): AxiosInstance {
  const client = create({ baseURL, timeout: 15_000, ...(adapter ? { adapter } : {}) });
  // Sem interceptors: o próprio refresh não pode cair no laço do 401
  const bare = create({ baseURL, timeout: 15_000, ...(adapter ? { adapter } : {}) });

  let refreshing: Promise<string> | undefined;

  const refresh = (): Promise<string> => {
    refreshing ??= (async () => {
      const refreshToken = tokens.getRefresh();
      if (!refreshToken) throw new Error('sem refresh token');
      try {
        const { data } = await bare.post<AuthResponse>('/auth/refresh', { refreshToken });
        tokens.onRefreshed(data);
        return data.tokens.accessToken;
      } catch (error) {
        tokens.onSessionExpired();
        throw error;
      } finally {
        refreshing = undefined;
      }
    })();
    return refreshing;
  };

  client.interceptors.request.use((config) => {
    const access = tokens.getAccess();
    if (access && !isAuthPath(config.url)) config.headers.set('Authorization', `Bearer ${access}`);
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!isAxiosError(error)) throw error;
      const original = error.config as RetriableConfig | undefined;
      if (
        error.response?.status !== 401 ||
        !original ||
        original._retried ||
        isAuthPath(original.url) ||
        !tokens.getRefresh()
      ) {
        throw error;
      }
      original._retried = true;
      const access = await refresh();
      original.headers.set('Authorization', `Bearer ${access}`);
      return client.request(original);
    },
  );

  return client;
}
