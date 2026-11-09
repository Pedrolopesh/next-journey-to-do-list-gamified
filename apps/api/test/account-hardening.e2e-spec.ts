import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AccountService } from '../src/modules/account/account.service.js';
import {
  bearer,
  createItem,
  createTestApp,
  deleteWithCode,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

describe('account deletion', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('anonymizes at once, ends the sessions and frees the email', async () => {
    const email = uniqueEmail('apagar');
    const auth = await registerUser(ctx, email);
    await createItem(ctx, auth, { type: 'habit', title: 'Beber água' });

    await deleteWithCode(ctx, auth);

    const row = await ctx.prisma.user.findUniqueOrThrow({ where: { id: auth.user.id } });
    expect(row.deletedAt).not.toBeNull();
    expect(row.email).not.toBe(email);
    expect(row.name).toBe('Conta excluída');

    // An access token still within its validity stops working at once
    await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(401);
    // Session renewal stops working
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: auth.tokens.refreshToken })
      .expect(401);

    // The same email can open a new account
    const again = await registerUser(ctx, email);
    expect(again.user.id).not.toBe(auth.user.id);
  });

  it('the purge also deletes a sign-up by code never confirmed for over 7 days', async () => {
    const stale = uniqueEmail('pendente-antigo');
    const fresh = uniqueEmail('pendente-novo');
    for (const email of [stale, fresh]) {
      await ctx.http().post('/v1/auth/email/start').send({ email }).expect(202);
    }
    const confirmed = await registerUser(ctx);
    const old = new Date(ctx.clock.now().getTime() - 8 * 24 * 60 * 60 * 1000);
    await ctx.prisma.user.updateMany({
      where: { email: { in: [stale, confirmed.user.email] } },
      data: { createdAt: old },
    });

    await ctx.app.get(AccountService).purgeExpired();

    expect(await ctx.prisma.user.count({ where: { email: stale } })).toBe(0);
    expect(await ctx.prisma.user.count({ where: { email: fresh } })).toBe(1);
    expect(await ctx.prisma.user.count({ where: { id: confirmed.user.id } })).toBe(1);
  });

  it('the purge deletes for good only what passed the retention period', async () => {
    const old = await registerUser(ctx);
    const recent = await registerUser(ctx);
    await deleteWithCode(ctx, old);
    await deleteWithCode(ctx, recent);
    // 31 days ago for the old account
    await ctx.prisma.user.update({
      where: { id: old.user.id },
      data: { deletedAt: new Date(ctx.clock.now().getTime() - 31 * 24 * 3600 * 1000) },
    });

    const removed = await ctx.app.get(AccountService).purgeExpired();

    expect(removed).toBeGreaterThanOrEqual(1);
    expect(await ctx.prisma.user.findUnique({ where: { id: old.user.id } })).toBeNull();
    expect(await ctx.prisma.item.count({ where: { userId: old.user.id } })).toBe(0);
    expect(await ctx.prisma.user.findUnique({ where: { id: recent.user.id } })).not.toBeNull();
  });

  it('requires authentication', async () => {
    await ctx.http().delete('/v1/me').expect(401);
  });
});

describe('API security', () => {
  it('sends helmet headers and does not advertise the framework', async () => {
    const ctx = await createTestApp();
    const res = await ctx.http().get('/health').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    await ctx.app.close();
  });

  it('without CORS_ORIGINS no web origin is allowed', async () => {
    const ctx = await createTestApp();
    const res = await ctx.http().get('/health').set('origin', 'https://outro.exemplo');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    await ctx.app.close();
  });

  it('limits the authentication routes and answers 429 on excess', async () => {
    const previous = process.env.THROTTLE_AUTH_LIMIT;
    process.env.THROTTLE_AUTH_LIMIT = '3';
    const ctx = await createTestApp();
    process.env.THROTTLE_AUTH_LIMIT = previous;
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 5; i++) {
        const res = await ctx.http().post('/v1/auth/refresh').send({ refreshToken: 'invalido' }); // scan-allow: test data
        statuses.push(res.status);
      }
      expect(statuses.slice(0, 3)).toEqual([401, 401, 401]);
      expect(statuses.slice(3)).toEqual([429, 429]);
      // Routes outside auth stay on the general limit, much looser
      await ctx.http().get('/health').expect(200);
    } finally {
      await ctx.app.close();
    }
  });
});
