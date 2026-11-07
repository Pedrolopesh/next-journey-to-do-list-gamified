import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { createHttpClient, rateLimitWait } from './http';

const USER = {
  id: '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10',
  name: 'P',
  email: 'p@exemplo.com',
  timezone: 'UTC',
};

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  return { data, status, statusText: String(status), headers: {}, config };
}

/** Fake server: /items requires the "new" token; /auth/refresh returns the new token. */
function fakeServer(options: { refreshFails?: boolean } = {}) {
  const calls: { url: string; auth?: string }[] = [];
  const adapter: AxiosAdapter = (config) => {
    const auth = config.headers.get('Authorization') as string | undefined;
    calls.push({ url: String(config.url), ...(auth ? { auth } : {}) });
    if (config.url === '/auth/refresh') {
      if (options.refreshFails) {
        return Promise.reject(
          new AxiosError('x', '401', config, undefined, respond(config, 401, {})),
        );
      }
      return Promise.resolve(
        respond(config, 200, {
          tokens: { accessToken: 'novo', refreshToken: 'r2', expiresIn: 900 },
          user: USER,
        }),
      );
    }
    if (auth === 'Bearer novo') return Promise.resolve(respond(config, 200, { ok: true }));
    return Promise.reject(new AxiosError('x', '401', config, undefined, respond(config, 401, {})));
  };
  return { adapter, calls };
}

function setup(server: ReturnType<typeof fakeServer>, hasRefresh = true) {
  let access: string | null = 'velho';
  const onSessionExpired = vi.fn();
  const client = createHttpClient({
    baseURL: 'http://api.test',
    adapter: server.adapter,
    tokens: {
      getAccess: () => access,
      getRefresh: () => (hasRefresh ? 'r1' : null),
      onRefreshed: (response) => {
        access = response.tokens.accessToken;
      },
      onSessionExpired,
    },
  });
  return { client, onSessionExpired };
}

describe('http client with automatic refresh', () => {
  it('injects the access token', async () => {
    const server = fakeServer();
    const { client } = setup(server);
    await client.get('/items').catch(() => undefined);
    expect(server.calls[0]).toEqual({ url: '/items', auth: 'Bearer velho' });
  });

  it('on a 401 renews once and repeats the call with the new token', async () => {
    const server = fakeServer();
    const { client } = setup(server);
    const response = await client.get('/items');
    expect(response.data).toEqual({ ok: true });
    expect(server.calls.map((c) => c.url)).toEqual(['/items', '/auth/refresh', '/items']);
    expect(server.calls[2]?.auth).toBe('Bearer novo');
  });

  it('the retry uses the new token even if the session has not saved it yet (POST with body)', async () => {
    const server = fakeServer();
    // delayed onRefreshed: getAccess still returns the old token during the retry
    const client = createHttpClient({
      baseURL: 'http://api.test',
      adapter: server.adapter,
      tokens: {
        getAccess: () => 'velho',
        getRefresh: () => 'r1',
        onRefreshed: () => undefined,
        onSessionExpired: vi.fn(),
      },
    });
    const response = await client.post('/items', { title: 'x' });
    expect(response.status).toBe(200);
    expect(server.calls.at(-1)?.auth).toBe('Bearer novo');
  });

  it('concurrent requests with a 401 share a single renewal (queue)', async () => {
    const server = fakeServer();
    const { client } = setup(server);
    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(server.calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
  });

  it('if the refresh fails, ends the session and propagates the error (no loop)', async () => {
    const server = fakeServer({ refreshFails: true });
    const { client, onSessionExpired } = setup(server);
    await expect(client.get('/items')).rejects.toBeTruthy();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(server.calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
  });

  it('without a refresh token it does not try to renew', async () => {
    const server = fakeServer();
    const { client } = setup(server, false);
    await expect(client.get('/items')).rejects.toBeTruthy();
    expect(server.calls.some((c) => c.url === '/auth/refresh')).toBe(false);
  });

  it('the token is not sent to the auth routes', async () => {
    const server = fakeServer();
    const { client } = setup(server);
    await client.post('/auth/email/start', {}).catch(() => undefined);
    expect(server.calls[0]?.auth).toBeUndefined();
  });
});

describe('rate limit (429)', () => {
  const limited = (config: InternalAxiosRequestConfig) =>
    new AxiosError('x', '429', config, undefined, {
      ...respond(config, 429, '<html>429</html>'),
      headers: { 'retry-after': '0.001' },
    });

  const clientWith = (adapter: AxiosAdapter) =>
    createHttpClient({
      baseURL: 'http://api.test',
      adapter,
      tokens: {
        getAccess: () => 'a',
        getRefresh: () => 'r',
        onRefreshed: vi.fn(),
        onSessionExpired: vi.fn(),
      },
    });

  it('repeats the call after the wait and delivers the result', async () => {
    let calls = 0;
    const client = clientWith((config) =>
      ++calls < 2 ? Promise.reject(limited(config)) : Promise.resolve(respond(config, 200, 'ok')),
    );
    expect((await client.get('/items')).data).toBe('ok');
    expect(calls).toBe(2);
  });

  it('gives up after 2 retries and returns the 429', async () => {
    let calls = 0;
    const client = clientWith((config) => {
      calls++;
      return Promise.reject(limited(config));
    });
    await expect(client.get('/items')).rejects.toMatchObject({ response: { status: 429 } });
    expect(calls).toBe(3);
  });

  it('does not repeat the API own 429 (JSON with code)', async () => {
    let calls = 0;
    const client = clientWith((config) => {
      calls++;
      return Promise.reject(
        new AxiosError(
          'x',
          '429',
          config,
          undefined,
          respond(config, 429, { code: 'RATE_LIMITED' }),
        ),
      );
    });
    await expect(client.post('/items', {})).rejects.toMatchObject({ response: { status: 429 } });
    expect(calls).toBe(1);
  });

  it('uses Retry-After (seconds or date) and gives up past the cap', () => {
    expect(rateLimitWait('2', 1)).toBe(2000);
    expect(rateLimitWait('999', 1)).toBeNull();
    expect(rateLimitWait(undefined, 2)).toBe(1000);
    const now = Date.parse('2026-10-21T07:00:00Z');
    expect(rateLimitWait('Wed, 21 Oct 2026 07:00:03 GMT', 1, now)).toBe(3000);
    expect(rateLimitWait('Wed, 21 Oct 2026 07:28:00 GMT', 1, now)).toBeNull();
  });
});
