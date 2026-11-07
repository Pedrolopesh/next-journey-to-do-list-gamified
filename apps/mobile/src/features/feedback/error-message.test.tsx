import { AxiosError } from 'axios';

import { describeError } from './error-message';

const t = (key: string): string => `t:${key}`;

const apiError = (status: number, code: string): AxiosError =>
  new AxiosError('falhou', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    data: { code, message: 'x' },
    statusText: '',
    headers: {},
    config: { headers: {} } as never,
  });

describe('describeError', () => {
  it('too many attempts (429) has its own message, on any screen', () => {
    expect(describeError(apiError(429, 'RATE_LIMITED'), t)).toBe('t:auth.rateLimited');
    expect(describeError(apiError(429, 'RATE_LIMITED'), t, { RATE_LIMITED: 'outra' })).toBe(
      't:auth.rateLimited',
    );
  });

  it('a proxy 429, in HTML and without an API code, also becomes the limit message', () => {
    const proxy = new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 429,
      data: '<html>429 Too Many Requests</html>',
      statusText: '',
      headers: {},
      config: { headers: {} } as never,
    });
    expect(describeError(proxy, t)).toBe('t:auth.rateLimited');
  });

  it('a known screen code beats the generic one; an unknown one falls back to the generic', () => {
    expect(describeError(apiError(401, 'UNAUTHORIZED'), t, { UNAUTHORIZED: 'senha' })).toBe(
      'senha',
    );
    expect(describeError(apiError(500, 'INTERNAL_ERROR'), t)).toBe('t:auth.genericError');
  });

  it('no server response is a network error', () => {
    expect(describeError(new AxiosError('rede', 'ERR_NETWORK'), t)).toBe('t:auth.networkError');
  });
});
