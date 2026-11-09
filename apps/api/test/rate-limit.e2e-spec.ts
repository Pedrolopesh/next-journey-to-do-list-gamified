import { createHash } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { LIMITS, RateLimitService } from '../src/modules/auth/rate-limit.service.js';
import { createTestApp, registerUser, type TestContext, uniqueEmail } from './helpers.js';

const WRONG = '000000';

describe('attempt limit per email', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const start = (email: string) => ctx.http().post('/v1/auth/email/start').send({ email });
  const confirm = (email: string, code: string) =>
    ctx.http().post('/v1/auth/email/confirm').send({ email, code });
  const later = (ms: number) =>
    ctx.clock.set(new Date(ctx.clock.now().getTime() + ms).toISOString());

  it('code request: the 11th request on the same email and IP is 429', async () => {
    const email = uniqueEmail();
    for (let i = 0; i < LIMITS.emailStart.perEmailAndIp.limit; i += 1) {
      await start(email).expect(202);
    }
    const blocked = await start(email).expect(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
    expect(blocked.body.details.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('the excess answers the same for an existing and a missing account (no enumeration)', async () => {
    const known = (await registerUser(ctx)).user.email; // the sign-up already used one request
    const unknown = uniqueEmail('naoexiste');
    const outcomes = async (email: string) => {
      const found: { status: number; code?: string }[] = [];
      for (let i = 0; i < LIMITS.emailStart.perEmailAndIp.limit + 2; i += 1) {
        const res = await start(email);
        found.push({ status: res.status, ...(res.status === 429 ? { code: res.body.code } : {}) });
      }
      return found;
    };
    const withAccount = await outcomes(known);
    const withoutAccount = await outcomes(unknown);
    // Same kinds of answer, in the same shape; only the count of the signup request differs
    for (const list of [withAccount, withoutAccount]) {
      expect(list.at(-1)).toEqual({ status: 429, code: 'RATE_LIMITED' });
      expect(list.every((item) => item.status === 202 || item.status === 429)).toBe(true);
    }
    expect(new Set(withAccount.map((item) => JSON.stringify(item)))).toEqual(
      new Set(withoutAccount.map((item) => JSON.stringify(item))),
    );
  });

  it('confirming: the 11th attempt on the same email and IP is 429, even with the right code', async () => {
    const email = uniqueEmail();
    await start(email).expect(202);
    const code = ctx.mailer.lastVerificationCode(email) ?? '';
    for (let i = 0; i < LIMITS.verifyEmail.perEmailAndIp.limit; i += 1) {
      await confirm(email, WRONG).expect(400);
    }
    const blocked = await confirm(email, code).expect(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
  });

  it('the window passes and requests work again', async () => {
    const email = uniqueEmail();
    for (let i = 0; i < LIMITS.emailStart.perEmailAndIp.limit; i += 1) await start(email);
    await start(email).expect(429);
    later(LIMITS.emailStart.perEmailAndIp.windowMs + 1000);
    await start(email).expect(202);
  });

  it('a ceiling by email alone holds against an attack coming from different IPs', async () => {
    const service = ctx.app.get(RateLimitService);
    const email = uniqueEmail('distribuido');
    for (let i = 0; i < LIMITS.emailStart.perEmail.limit; i += 1) {
      await service.hit('email-start:email', email, LIMITS.emailStart.perEmail);
    }
    await expect(
      service.hit('email-start:email', email, LIMITS.emailStart.perEmail),
    ).rejects.toMatchObject({ status: 429 });
    // Another email is not affected
    await service.hit('email-start:email', uniqueEmail('outro'), LIMITS.emailStart.perEmail);
  });

  it('whoever abuses only locks themselves: another IP can still request a code', async () => {
    const service = ctx.app.get(RateLimitService);
    const email = uniqueEmail('vitima');
    // The attacker (IP A) uses up their own limit
    for (let i = 0; i < LIMITS.emailStart.perEmailAndIp.limit; i += 1) {
      await service.hitBoth('email-start', email, 'cliente-a', LIMITS.emailStart);
    }
    await expect(
      service.hitBoth('email-start', email, 'cliente-a', LIMITS.emailStart),
    ).rejects.toMatchObject({ status: 429 });
    // The owner (IP B) is not affected
    await service.hitBoth('email-start', email, 'cliente-b', LIMITS.emailStart);
  });

  it('the table stores only hashes: neither email nor IP in plain text', async () => {
    const email = uniqueEmail();
    await start(email).expect(202);
    const expectedKey = createHash('sha256').update(`email-start:email:${email}`).digest('hex');
    const row = await ctx.prisma.rateLimit.findUnique({ where: { key: expectedKey } });
    expect(row?.count).toBe(1);
    const mine = await ctx.prisma.rateLimit.findMany({
      where: { windowStart: { gte: row!.windowStart } },
    });
    const dump = JSON.stringify(mine);
    expect(dump).not.toContain(email);
    expect(dump).not.toContain('127.0.0.1');
  });
});
