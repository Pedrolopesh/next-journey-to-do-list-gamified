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
  it('muitas tentativas (429) tem mensagem própria, em qualquer tela', () => {
    expect(describeError(apiError(429, 'RATE_LIMITED'), t)).toBe('t:auth.rateLimited');
    expect(describeError(apiError(429, 'RATE_LIMITED'), t, { RATE_LIMITED: 'outra' })).toBe(
      't:auth.rateLimited',
    );
  });

  it('código conhecido da tela vence o genérico; desconhecido cai no genérico', () => {
    expect(describeError(apiError(401, 'UNAUTHORIZED'), t, { UNAUTHORIZED: 'senha' })).toBe(
      'senha',
    );
    expect(describeError(apiError(500, 'INTERNAL_ERROR'), t)).toBe('t:auth.genericError');
  });

  it('sem resposta do servidor é erro de rede', () => {
    expect(describeError(new AxiosError('rede', 'ERR_NETWORK'), t)).toBe('t:auth.networkError');
  });
});
