import { describe, expect, it } from 'vitest';

import { loadEnv } from './env.js';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db', // scan-allow: dado falso de teste
  JWT_ACCESS_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres!', // scan-allow: segredo falso só para testes
};

describe('AUTH_MIN_RESPONSE_MS', () => {
  it('padrão de 250 ms', () => {
    expect(loadEnv({ ...base, NODE_ENV: 'production' }).AUTH_MIN_RESPONSE_MS).toBe(250);
  });

  it('0 só vale fora de produção', () => {
    expect(
      loadEnv({ ...base, NODE_ENV: 'test', AUTH_MIN_RESPONSE_MS: '0' }).AUTH_MIN_RESPONSE_MS,
    ).toBe(0);
    expect(() => loadEnv({ ...base, NODE_ENV: 'production', AUTH_MIN_RESPONSE_MS: '0' })).toThrow(
      /AUTH_MIN_RESPONSE_MS/,
    );
  });

  it('tem teto para não segurar requisições por minutos', () => {
    expect(() => loadEnv({ ...base, AUTH_MIN_RESPONSE_MS: '250000' })).toThrow(
      /AUTH_MIN_RESPONSE_MS/,
    );
  });
});

describe('troca do segredo do JWT', () => {
  const previous = {
    JWT_ACCESS_SECRET_PREVIOUS: 'segredo-antigo-de-teste-com-mais-de-32-caracteres', // scan-allow: segredo falso só para testes
    JWT_PREVIOUS_KEY_ID: 'k0',
  };

  it('chave anterior precisa de segredo e identificador juntos, e id diferente do atual', () => {
    expect(loadEnv({ ...base, ...previous }).JWT_PREVIOUS_KEY_ID).toBe('k0');
    expect(() => loadEnv({ ...base, JWT_PREVIOUS_KEY_ID: 'k0' })).toThrow(
      /JWT_ACCESS_SECRET_PREVIOUS/,
    );
    expect(() => loadEnv({ ...base, ...previous, JWT_PREVIOUS_KEY_ID: 'k1' })).toThrow(
      /JWT_PREVIOUS_KEY_ID/,
    );
  });

  it('o segredo anterior não pode ser igual ao atual', () => {
    expect(() =>
      loadEnv({ ...base, ...previous, JWT_ACCESS_SECRET_PREVIOUS: base.JWT_ACCESS_SECRET }),
    ).toThrow(/JWT_ACCESS_SECRET_PREVIOUS/);
  });

  it('sem configuração extra usa emissor e audiência padrão', () => {
    expect(loadEnv(base)).toMatchObject({
      JWT_ISSUER: 'nextjourney-api',
      JWT_AUDIENCE: 'nextjourney-app',
      JWT_KEY_ID: 'k1',
    });
  });
});
