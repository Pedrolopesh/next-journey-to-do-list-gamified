import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createTestApp,
  registerBody,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const FLOOR_MS = 300;

/** Measures how long the response takes, in ms. */
async function took(send: () => PromiseLike<unknown>): Promise<number> {
  const start = performance.now();
  await send();
  return performance.now() - start;
}

describe('account routes with equal response time (no enumeration by timing)', () => {
  let ctx: TestContext;
  const previous = process.env.AUTH_MIN_RESPONSE_MS;
  beforeAll(async () => {
    process.env.AUTH_MIN_RESPONSE_MS = String(FLOOR_MS);
    ctx = await createTestApp();
    // Warms up connections and argon2 so the first measurement does not pay the startup cost
    await ctx.http().post('/v1/auth/register').send(registerBody(uniqueEmail())).expect(202);
  });
  afterAll(async () => {
    await ctx.app.close();
    if (previous === undefined) delete process.env.AUTH_MIN_RESPONSE_MS;
    else process.env.AUTH_MIN_RESPONSE_MS = previous;
  });

  it('esqueci a senha: e-mail existente e inexistente levam o mesmo tempo', async () => {
    const known = (await registerUser(ctx)).user.email;
    const forgot = (email: string) =>
      ctx.http().post('/v1/auth/forgot-password').send({ email }).expect(202);

    const withAccount = await took(() => forgot(known));
    const withoutAccount = await took(() => forgot(uniqueEmail('naoexiste')));

    expect(withAccount).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(withoutAccount).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(Math.abs(withAccount - withoutAccount)).toBeLessThan(150);
  });

  it('forgot password does not wait for the email provider, even a slow one', async () => {
    const email = (await registerUser(ctx)).user.email;
    ctx.mailer.delayMs = 900;
    try {
      const elapsed = await took(() =>
        ctx.http().post('/v1/auth/forgot-password').send({ email }).expect(202),
      );
      expect(elapsed).toBeLessThan(700);
      // Lets the slow send finish before closing the app
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      ctx.mailer.delayMs = 0;
    }
  });

  it('signup: a new email and an already used email take the same time', async () => {
    const used = (await registerUser(ctx)).user.email;
    const register = (email: string) =>
      ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);

    const fresh = await took(() => register(uniqueEmail()));
    const existing = await took(() => register(used));

    expect(fresh).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(existing).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(Math.abs(fresh - existing)).toBeLessThan(150);
  });

  it('code resend: a pending account and a missing email take the same time', async () => {
    const pending = uniqueEmail();
    await ctx.http().post('/v1/auth/register').send(registerBody(pending)).expect(202);
    const resend = (email: string) =>
      ctx.http().post('/v1/auth/resend-verification').send({ email }).expect(202);

    const known = await took(() => resend(pending));
    const unknown = await took(() => resend(uniqueEmail('naoexiste')));

    expect(known).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(Math.abs(known - unknown)).toBeLessThan(150);
  });
});
