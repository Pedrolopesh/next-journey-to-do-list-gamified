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

/** Parte do logger que o cliente HTTP usa (o logger real está em src/logging). */
export type HttpLog = {
  debug: (event: string, data?: unknown) => void;
  info: (event: string, data?: unknown) => void;
  warn: (event: string, data?: unknown) => void;
};

type Options = {
  baseURL: string;
  tokens: TokenAccess;
  log?: HttpLog;
  /** Só para testes. */
  adapter?: AxiosAdapter;
};

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean; _rateRetries?: number };

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
const isAuthPath = (url: string | undefined): boolean =>
  AUTH_PATHS.some((path) => url?.includes(path));

/**
 * 429 em texto/HTML vem do proxy, antes de a API processar a chamada: repetir é seguro, até para
 * POST. O 429 da própria API (JSON com `code`) não se repete, para não gastar mais do limite.
 */
const MAX_RATE_RETRIES = 2;
const MAX_RATE_WAIT_MS = 5_000;

/** Espera do 429: `Retry-After` (segundos ou data) ou 0,5 s, 1 s... Passou do teto: null, desiste. */
export function rateLimitWait(
  retryAfter: unknown,
  attempt: number,
  now = Date.now(),
): number | null {
  const header = typeof retryAfter === 'string' ? retryAfter : '';
  const seconds = Number(header);
  let wait = 500 * attempt;
  if (header && Number.isFinite(seconds) && seconds > 0) wait = seconds * 1000;
  else if (header && Number.isNaN(seconds)) {
    const date = Date.parse(header);
    if (!Number.isNaN(date)) wait = Math.max(date - now, 0);
  }
  return wait > MAX_RATE_WAIT_MS ? null : wait;
}

export type RefreshedTokens = AuthTokens;

/**
 * Cliente HTTP: injeta o access token e, num 401, renova pelo refresh token UMA vez e refaz a
 * chamada. Requisições concorrentes que levam 401 compartilham a mesma renovação (fila).
 */
export function createHttpClient({ baseURL, tokens, adapter, log }: Options): AxiosInstance {
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

  // Registro de cada chamada: o que foi enviado, o que voltou e quanto demorou
  if (log) {
    const started = new WeakMap<object, { id: number; at: number }>();
    let counter = 0;
    client.interceptors.request.use((config) => {
      const id = ++counter;
      started.set(config, { id, at: Date.now() });
      const method = config.method?.toUpperCase();
      log.info('http.request', { id, method, url: config.url });
      log.debug('http.request.body', {
        id,
        params: config.params as unknown,
        body: config.data as unknown,
      });
      return config;
    });
    client.interceptors.response.use(
      (response) => {
        const meta = started.get(response.config);
        const ms = meta ? Date.now() - meta.at : undefined;
        const requestId = (response.headers as Record<string, unknown> | undefined)?.[
          'x-request-id'
        ];
        log.info('http.response', {
          id: meta?.id,
          url: response.config.url,
          status: response.status,
          ms,
          requestId,
        });
        log.debug('http.response.body', { id: meta?.id, body: response.data as unknown });
        return response;
      },
      (error: unknown) => {
        if (isAxiosError(error)) {
          const meta = error.config ? started.get(error.config) : undefined;
          log.warn('http.error', {
            id: meta?.id,
            url: error.config?.url,
            status: error.response?.status,
            ms: meta ? Date.now() - meta.at : undefined,
            network: !error.response,
            reason: error.code,
            requestId: (error.response?.headers as Record<string, unknown> | undefined)?.[
              'x-request-id'
            ],
            body: error.response?.data as unknown,
          });
        }
        throw error;
      },
    );
  }

  client.interceptors.request.use((config) => {
    // Na repetição depois do refresh o cabeçalho já traz o token novo; a sessão pode ainda não ter
    // gravado esse token (grava no armazenamento seguro antes), então não se sobrescreve.
    if ((config as RetriableConfig)._retried) return config;
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
        error.response?.status === 429 &&
        typeof error.response.data === 'string' &&
        original &&
        !original.signal?.aborted
      ) {
        const attempt = (original._rateRetries ?? 0) + 1;
        const headers = error.response.headers as Record<string, unknown> | undefined;
        const wait = rateLimitWait(headers?.['retry-after'], attempt);
        if (attempt > MAX_RATE_RETRIES || wait === null) throw error;
        original._rateRetries = attempt;
        await new Promise((resolve) => setTimeout(resolve, wait));
        if (original.signal?.aborted) throw error;
        return client.request(original);
      }
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
