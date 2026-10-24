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
    const row = (days: number, revokedAt: Date | null = null) => ({
      userId,
      familyId: family,
      tokenHash: randomUUID(),
      expiresAt: ago(days),
      revokedAt,
    });
    const old = await ctx.prisma.refreshToken.create({ data: row(EXPIRED_GRACE_DAYS + 1) });
    const recentExpired = await ctx.prisma.refreshToken.create({ data: row(1) });
    const revokedValid = await ctx.prisma.refreshToken.create({
      data: row(-10, ago(2)),
    });
    await ctx.prisma.passwordReset.createMany({
      data: [
        { userId, tokenHash: randomUUID(), expiresAt: ago(EXPIRED_GRACE_DAYS + 1) },
        { userId, tokenHash: randomUUID(), expiresAt: ago(0) },
      ],
    });
    await ctx.prisma.emailVerification.createMany({
      data: [
        { userId, codeHash: 'a', expiresAt: ago(EXPIRED_GRACE_DAYS + 1) },
        { userId, codeHash: 'b', expiresAt: ago(0) },
      ],
    });

    const counts = await ctx.app.get(AuthCleanupService).purgeExpired();

    expect(counts.refreshTokens).toBeGreaterThanOrEqual(1);
    expect(counts.passwordResets).toBeGreaterThanOrEqual(1);
    expect(counts.emailVerifications).toBeGreaterThanOrEqual(1);
    const tokens = await ctx.prisma.refreshToken.findMany({
      where: { id: { in: [old.id, recentExpired.id, revokedValid.id] } },
    });
    expect(tokens.map((token) => token.id).sort()).toEqual(
      [recentExpired.id, revokedValid.id].sort(),
    );
    expect(await ctx.prisma.passwordReset.count({ where: { userId } })).toBe(1);
    // O código do cadastro (válido) e o recém-expirado continuam; o antigo some
    expect(
      await ctx.prisma.emailVerification.count({
        where: { userId, expiresAt: { lt: ago(EXPIRED_GRACE_DAYS) } },
      }),
    ).toBe(0);
  });

  it('rodar de novo não apaga mais nada (idempotente)', async () => {
    const service = ctx.app.get(AuthCleanupService);
    await service.purgeExpired();
    const again = await service.purgeExpired();
    expect(again).toEqual({ refreshTokens: 0, passwordResets: 0, emailVerifications: 0 });
  });
});
