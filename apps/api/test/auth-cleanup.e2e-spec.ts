import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  AuthCleanupService,
  EXPIRED_GRACE_DAYS,
} from '../src/modules/auth/auth-cleanup.service.js';
import { createTestApp, registerUser, type TestContext } from './helpers.js';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('limpeza de tokens, links e códigos expirados', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const ago = (days: number): Date => new Date(ctx.clock.now().getTime() - days * DAY_MS);

  it('apaga só o que expirou há mais de 7 dias; revogado ainda válido fica (detecta reuso)', async () => {
    const auth = await registerUser(ctx);
    const userId = auth.user.id;
    const family = randomUUID();
    const token = (days: number, revokedAt: Date | null = null) =>
      ctx.prisma.refreshToken.create({
        data: {
          userId,
          familyId: family,
          tokenHash: randomUUID(),
          expiresAt: ago(days),
          revokedAt,
        },
      });
    const old = await token(EXPIRED_GRACE_DAYS + 0.01);
    const boundary = await token(EXPIRED_GRACE_DAYS);
    const recentExpired = await token(1);
    const revokedValid = await token(-10, ago(2));
    const resets = await Promise.all(
      [EXPIRED_GRACE_DAYS + 1, 1].map((days) =>
        ctx.prisma.passwordReset.create({
          data: { userId, tokenHash: randomUUID(), expiresAt: ago(days) },
        }),
      ),
    );
    const codes = await Promise.all(
      [EXPIRED_GRACE_DAYS + 1, 1].map((days) =>
        ctx.prisma.emailVerification.create({
          data: { userId, codeHash: randomUUID(), expiresAt: ago(days) },
        }),
      ),
    );

    const counts = await ctx.app.get(AuthCleanupService).purgeExpired();

    expect(counts.refreshTokens).toBeGreaterThanOrEqual(1);
    expect(counts.passwordResets).toBeGreaterThanOrEqual(1);
    expect(counts.emailVerifications).toBeGreaterThanOrEqual(1);
    const left = async (
      model: 'refreshToken' | 'passwordReset' | 'emailVerification',
      ids: string[],
    ) =>
      (
        await (
          ctx.prisma[model] as unknown as {
            findMany(a: object): Promise<{ id: string }[]>;
          }
        ).findMany({ where: { id: { in: ids } } })
      )
        .map((row) => row.id)
        .sort();
    expect(
      await left('refreshToken', [old.id, boundary.id, recentExpired.id, revokedValid.id]),
    ).toEqual([boundary.id, recentExpired.id, revokedValid.id].sort());
    expect(
      await left(
        'passwordReset',
        resets.map((row) => row.id),
      ),
    ).toEqual([resets[1]!.id]);
    expect(
      await left(
        'emailVerification',
        codes.map((row) => row.id),
      ),
    ).toEqual([codes[1]!.id]);
  });

  it('rodar de novo não apaga mais nada do que já ficou dentro do prazo', async () => {
    const auth = await registerUser(ctx);
    const kept = await ctx.prisma.refreshToken.create({
      data: {
        userId: auth.user.id,
        familyId: randomUUID(),
        tokenHash: randomUUID(),
        expiresAt: ago(2),
      },
    });
    const service = ctx.app.get(AuthCleanupService);
    await service.purgeExpired();
    await service.purgeExpired();
    expect(await ctx.prisma.refreshToken.findUnique({ where: { id: kept.id } })).not.toBeNull();
  });
});
