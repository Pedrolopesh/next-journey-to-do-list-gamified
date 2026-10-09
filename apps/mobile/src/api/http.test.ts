import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { createHttpClient } from './http';

const USER = {
  id: '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10',
  name: 'P',
  email: 'p@exemplo.com',
  timezone: 'UTC',
};

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  return { data, status, statusText: String(status), headers: {}, config };
}

/** Servidor falso: /items exige o token "novo"; /auth/refresh devolve o token novo. */
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

describe('cliente http com refresh automático', () => {
  it('injeta o access token', async () => {
    const server = fakeServer();
    const { client } = setup(server);
    await client.get('/items').catch(() => undefined);
    expect(server.calls[0]).toEqual({ url: '/items', auth: 'Bearer velho' });
  });

  it('num 401 renova uma vez e refaz a chamada com o token novo', async () => {
    const server = fakeServer();
    const { client } = setup(server);
    const response = await client.get('/items');
    expect(response.data).toEqual({ ok: true });
    expect(server.calls.map((c) => c.url)).toEqual(['/items', '/auth/refresh', '/items']);
    expect(server.calls[2]?.auth).toBe('Bearer novo');
  });

  it('requisições concorrentes com 401 compartilham uma única renovação (fila)', async () => {
    const server = fakeServer();
    const { client } = setup(server);
    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(server.calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
  });

  it('se o refresh falha, encerra a sessão e propaga o erro (sem laço)', async () => {
    const server = fakeServer({ refreshFails: true });
    const { client, onSessionExpired } = setup(server);
    await expect(client.get('/items')).rejects.toBeTruthy();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(server.calls.filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
  });

  it('sem refresh token não tenta renovar', async () => {
    const server = fakeServer();
    const { client } = setup(server, false);
    await expect(client.get('/items')).rejects.toBeTruthy();
    expect(server.calls.some((c) => c.url === '/auth/refresh')).toBe(false);
  });

  it('o token não é enviado às rotas de auth', async () => {
    const server = fakeServer();
    const { client } = setup(server);
    await client.post('/auth/login', {}).catch(() => undefined);
    expect(server.calls[0]?.auth).toBeUndefined();
  });
});
