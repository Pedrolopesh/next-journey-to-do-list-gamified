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
  /** Stores the new tokens (and the user) after a successful refresh. */
  onRefreshed: (response: AuthResponse) => void;
  /** The refresh failed: the session is over. */
  onSessionExpired: () => void;
};

/** Part of the logger the HTTP client uses (the real logger lives in src/logging). */
export type HttpLog = {
  debug: (event: string, data?: unknown) => void;
  info: (event: string, data?: unknown) => void;
  warn: (event: string, data?: unknown) => void;
};

type Options = {
  baseURL: string;
  tokens: TokenAccess;
  log?: HttpLog;
  /** Tests only. */
  adapter?: AxiosAdapter;
};

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean; _rateRetries?: number };

const AUTH_PATHS = ['/auth/email/', '/auth/refresh', '/auth/logout'];
const isAuthPath = (url: string | undefined): boolean =>
  AUTH_PATHS.some((path) => url?.includes(path));

/**
 * A 429 in text/HTML comes from the proxy, before the API processed the call: retrying is safe, even for
 * POST. The API's own 429 (JSON with `code`) is not retried, to avoid spending more of the limit.
 */
const MAX_RATE_RETRIES = 2;
const MAX_RATE_WAIT_MS = 5_000;

/** 429 wait: `Retry-After` (seconds or date) or 0.5 s, 1 s... Over the cap: null, give up. */
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
 * HTTP client: injects the access token and, on a 401, renews with the refresh token ONCE and repeats
 * the call. Concurrent requests that get a 401 share the same renewal (queue).
 */
export function createHttpClient({ baseURL, tokens, adapter, log }: Options): AxiosInstance {
  const client = create({ baseURL, timeout: 15_000, ...(adapter ? { adapter } : {}) });
  // No interceptors: the refresh itself must not fall into the 401 loop
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

  // Log of each call: what was sent, what came back and how long it took
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
    // On the retry after the refresh the header already carries the new token; the session may not have
    // saved that token yet (it saves to secure storage first), so it is not overwritten.
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
