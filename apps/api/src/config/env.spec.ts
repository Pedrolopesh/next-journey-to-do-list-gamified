import { describe, expect, it } from 'vitest';

import { loadEnv } from './env.js';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db', // scan-allow: fake test data
  JWT_ACCESS_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres!', // scan-allow: fake secret for tests only
};

describe('AUTH_MIN_RESPONSE_MS', () => {
  it('defaults to 250 ms', () => {
    expect(loadEnv({ ...base, NODE_ENV: 'production' }).AUTH_MIN_RESPONSE_MS).toBe(250);
  });

  it('0 is only valid outside production', () => {
    expect(
      loadEnv({ ...base, NODE_ENV: 'test', AUTH_MIN_RESPONSE_MS: '0' }).AUTH_MIN_RESPONSE_MS,
    ).toBe(0);
    expect(() => loadEnv({ ...base, NODE_ENV: 'production', AUTH_MIN_RESPONSE_MS: '0' })).toThrow(
      /AUTH_MIN_RESPONSE_MS/,
    );
  });

  it('has a ceiling so requests are not held for minutes', () => {
    expect(() => loadEnv({ ...base, AUTH_MIN_RESPONSE_MS: '250000' })).toThrow(
      /AUTH_MIN_RESPONSE_MS/,
    );
  });
});

describe('JWT secret rotation', () => {
  const previous = {
    JWT_ACCESS_SECRET_PREVIOUS: 'segredo-antigo-de-teste-com-mais-de-32-caracteres', // scan-allow: fake secret for tests only
    JWT_PREVIOUS_KEY_ID: 'k0',
  };

  it('the previous key needs a secret and an identifier together, and an id different from the current one', () => {
    expect(loadEnv({ ...base, ...previous }).JWT_PREVIOUS_KEY_ID).toBe('k0');
    expect(() => loadEnv({ ...base, JWT_PREVIOUS_KEY_ID: 'k0' })).toThrow(
      /JWT_ACCESS_SECRET_PREVIOUS/,
    );
    expect(() => loadEnv({ ...base, ...previous, JWT_PREVIOUS_KEY_ID: 'k1' })).toThrow(
      /JWT_PREVIOUS_KEY_ID/,
    );
  });

  it('the previous secret cannot equal the current one', () => {
    expect(() =>
      loadEnv({ ...base, ...previous, JWT_ACCESS_SECRET_PREVIOUS: base.JWT_ACCESS_SECRET }),
    ).toThrow(/JWT_ACCESS_SECRET_PREVIOUS/);
  });

  it('without extra configuration it uses the default issuer and audience', () => {
    expect(loadEnv(base)).toMatchObject({
      JWT_ISSUER: 'nextjourney-api',
      JWT_AUDIENCE: 'nextjourney-app',
      JWT_KEY_ID: 'k1',
    });
  });
});

describe('empty optional variables', () => {
  it('RESEND_API_KEY= e chave anterior vazia valem como ausentes', () => {
    const env = loadEnv({
      ...base,
      RESEND_API_KEY: '',
      JWT_ACCESS_SECRET_PREVIOUS: '',
      JWT_PREVIOUS_KEY_ID: '',
    });
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.JWT_ACCESS_SECRET_PREVIOUS).toBeUndefined();
    expect(env.JWT_PREVIOUS_KEY_ID).toBeUndefined();
  });
});

describe('SEED_STARTER_ITEMS', () => {
  it('is on by default and can be turned off', () => {
    expect(loadEnv(base).SEED_STARTER_ITEMS).toBe(true);
    expect(loadEnv({ ...base, SEED_STARTER_ITEMS: 'false' }).SEED_STARTER_ITEMS).toBe(false);
    expect(() => loadEnv({ ...base, SEED_STARTER_ITEMS: 'talvez' })).toThrow(/SEED_STARTER_ITEMS/);
  });
});
