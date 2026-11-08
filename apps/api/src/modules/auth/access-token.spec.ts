import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';

import type { Clock } from '../../common/clock.js';
import type { Env } from '../../config/env.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { SecurityEvents } from '../security/security-events.service.js';
import { TokensService } from './tokens.service.js';

const SUB = '5f0f4d4e-6b43-4f5e-9f55-0d1c1b8a8b11';
const CURRENT = 'segredo-atual-de-teste-com-mais-de-32-caracteres!'; // scan-allow: fake secret for tests only
const PREVIOUS = 'segredo-antigo-de-teste-com-mais-de-32-caracteres'; // scan-allow: fake secret for tests only
const OTHER = 'segredo-de-outro-servico-com-mais-de-32-caracteres'; // scan-allow: fake secret for tests only

const baseEnv = {
  JWT_ACCESS_SECRET: CURRENT,
  JWT_ISSUER: 'nextjourney-api',
  JWT_AUDIENCE: 'nextjourney-app',
  JWT_KEY_ID: 'k2',
  ACCESS_TOKEN_TTL_SECONDS: 900,
} as Env;

const service = (env: Partial<Env> = {}) =>
  new TokensService(
    new JwtService({ secret: CURRENT }),
    {} as PrismaService,
    {} as Clock,
    { ...baseEnv, ...env },
    { record: () => undefined } as unknown as SecurityEvents,
  );

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

describe('access token: issuer, audience and key', () => {
  it('accepts the token of the current key', async () => {
    await expect(service().verifyAccessToken(await sign(CURRENT))).resolves.toEqual({
      userId: SUB,
    });
  });

  it('rejects a different issuer or audience, even with the right secret', async () => {
    await expect(
      service().verifyAccessToken(await sign(CURRENT, { issuer: 'outro-servico' })),
    ).rejects.toThrow();
    await expect(
      service().verifyAccessToken(await sign(CURRENT, { audience: 'outro-app' })),
    ).rejects.toThrow();
  });

  it('rejects a token without issuer and audience (old format)', async () => {
    const legacy = await new JwtService({}).signAsync(
      { sub: SUB },
      { secret: CURRENT, expiresIn: 60 },
    );
    await expect(service().verifyAccessToken(legacy)).rejects.toThrow();
  });

  it('rejects a signature from another secret and an algorithm other than HS256', async () => {
    await expect(service().verifyAccessToken(await sign(OTHER))).rejects.toThrow();
    await expect(
      service().verifyAccessToken(await sign(CURRENT, { algorithm: 'HS512' })),
    ).rejects.toThrow();
  });

  describe('secret rotation', () => {
    const rotating = { JWT_ACCESS_SECRET_PREVIOUS: PREVIOUS, JWT_PREVIOUS_KEY_ID: 'k1' };

    it('durante a troca aceita a chave atual e a anterior', async () => {
      const tokens = service(rotating);
      await expect(tokens.verifyAccessToken(await sign(CURRENT))).resolves.toEqual({ userId: SUB });
      await expect(
        tokens.verifyAccessToken(await sign(PREVIOUS, { keyid: 'k1' })),
      ).resolves.toEqual({ userId: SUB });
    });

    it('after the rotation (with no previous key configured) the old token stops working', async () => {
      await expect(
        service().verifyAccessToken(await sign(PREVIOUS, { keyid: 'k1' })),
      ).rejects.toThrow();
    });

    it('a forged kid does not work: whoever signs with another secret is rejected even when pointing at the previous one', async () => {
      await expect(
        service(rotating).verifyAccessToken(await sign(OTHER, { keyid: 'k1' })),
      ).rejects.toThrow();
    });

    it('a token signed with the previous key but claiming to be the current one is rejected', async () => {
      await expect(
        service(rotating).verifyAccessToken(await sign(PREVIOUS, { keyid: 'k2' })),
      ).rejects.toThrow();
    });
  });
});
