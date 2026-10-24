import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';

import type { Clock } from '../../common/clock.js';
import type { Env } from '../../config/env.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { TokensService } from './tokens.service.js';

const SUB = '5f0f4d4e-6b43-4f5e-9f55-0d1c1b8a8b11';
const CURRENT = 'segredo-atual-de-teste-com-mais-de-32-caracteres!'; // scan-allow: segredo falso só para testes
const PREVIOUS = 'segredo-antigo-de-teste-com-mais-de-32-caracteres'; // scan-allow: segredo falso só para testes
const OTHER = 'segredo-de-outro-servico-com-mais-de-32-caracteres'; // scan-allow: segredo falso só para testes

const baseEnv = {
  JWT_ACCESS_SECRET: CURRENT,
  JWT_ISSUER: 'nextjourney-api',
  JWT_AUDIENCE: 'nextjourney-app',
  JWT_KEY_ID: 'k2',
  ACCESS_TOKEN_TTL_SECONDS: 900,
} as Env;

const service = (env: Partial<Env> = {}) =>
  new TokensService(new JwtService({ secret: CURRENT }), {} as PrismaService, {} as Clock, {
    ...baseEnv,
    ...env,
  });

const sign = (
  secret: string,
  options: {
    issuer?: string;
    audience?: string;
    keyid?: string;
    algorithm?: 'HS256' | 'HS512';
  } = {},
) =>
  new JwtService({}).signAsync(
    { sub: SUB },
    {
      secret,
      expiresIn: 60,
      issuer: options.issuer ?? 'nextjourney-api',
      audience: options.audience ?? 'nextjourney-app',
      keyid: options.keyid ?? 'k2',
      algorithm: options.algorithm ?? 'HS256',
    },
  );

describe('token de acesso: emissor, audiência e chave', () => {
  it('aceita o token da chave atual', async () => {
    await expect(service().verifyAccessToken(await sign(CURRENT))).resolves.toBe(SUB);
  });

  it('recusa emissor ou audiência diferentes, mesmo com o segredo certo', async () => {
    await expect(
      service().verifyAccessToken(await sign(CURRENT, { issuer: 'outro-servico' })),
    ).rejects.toThrow();
    await expect(
      service().verifyAccessToken(await sign(CURRENT, { audience: 'outro-app' })),
    ).rejects.toThrow();
  });

  it('recusa token sem emissor e audiência (formato antigo)', async () => {
    const legacy = await new JwtService({}).signAsync(
      { sub: SUB },
      { secret: CURRENT, expiresIn: 60 },
    );
    await expect(service().verifyAccessToken(legacy)).rejects.toThrow();
  });

  it('recusa assinatura de outro segredo e algoritmo diferente de HS256', async () => {
    await expect(service().verifyAccessToken(await sign(OTHER))).rejects.toThrow();
    await expect(
      service().verifyAccessToken(await sign(CURRENT, { algorithm: 'HS512' })),
    ).rejects.toThrow();
  });

  describe('troca do segredo', () => {
    const rotating = { JWT_ACCESS_SECRET_PREVIOUS: PREVIOUS, JWT_PREVIOUS_KEY_ID: 'k1' };

    it('durante a troca aceita a chave atual e a anterior', async () => {
      const tokens = service(rotating);
      await expect(tokens.verifyAccessToken(await sign(CURRENT))).resolves.toBe(SUB);
      await expect(tokens.verifyAccessToken(await sign(PREVIOUS, { keyid: 'k1' }))).resolves.toBe(
        SUB,
      );
    });

    it('depois da troca (sem a anterior configurada) o token antigo cai', async () => {
      await expect(
        service().verifyAccessToken(await sign(PREVIOUS, { keyid: 'k1' })),
      ).rejects.toThrow();
    });

    it('kid forjado não vale: quem assina com outro segredo é recusado mesmo apontando para a anterior', async () => {
      await expect(
        service(rotating).verifyAccessToken(await sign(OTHER, { keyid: 'k1' })),
      ).rejects.toThrow();
    });

    it('token assinado com a chave anterior mas dizendo ser a atual é recusado', async () => {
      await expect(
        service(rotating).verifyAccessToken(await sign(PREVIOUS, { keyid: 'k2' })),
      ).rejects.toThrow();
    });
  });
});
