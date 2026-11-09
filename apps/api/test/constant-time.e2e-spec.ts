import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, registerUser, type TestContext, uniqueEmail } from './helpers.js';

const FLOOR_MS = 300;

/** Measures how long the response takes, in ms. */
async function took(send: () => PromiseLike<unknown>): Promise<number> {
  const start = performance.now();
  await send();
  return performance.now() - start;
}

describe('account routes with equal response time (no enumeration by timing)', () => {
  let ctx: TestContext;
  const start = (email: string) => ctx.http().post('/v1/auth/email/start').send({ email });
  const previous = process.env.AUTH_MIN_RESPONSE_MS;
  beforeAll(async () => {
    process.env.AUTH_MIN_RESPONSE_MS = String(FLOOR_MS);
    ctx = await createTestApp();
    // Warms up connections so the first measurement does not pay the startup cost
    await start(uniqueEmail()).expect(202);
  });
  afterAll(async () => {
    await ctx.app.close();
    if (previous === undefined) delete process.env.AUTH_MIN_RESPONSE_MS;
    else process.env.AUTH_MIN_RESPONSE_MS = previous;
  });

  it('code request: an existing and a missing email take the same time', async () => {
    const known = (await registerUser(ctx)).user.email;

    const withAccount = await took(() => start(known).expect(202));
    const withoutAccount = await took(() => start(uniqueEmail('naoexiste')).expect(202));

    expect(withAccount).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(withoutAccount).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(Math.abs(withAccount - withoutAccount)).toBeLessThan(150);
  });

  it('code request does not wait for the email provider, even a slow one', async () => {
    ctx.mailer.delayMs = 900;
    try {
      const elapsed = await took(() => start(uniqueEmail()).expect(202));
      expect(elapsed).toBeLessThan(700);
      // Lets the slow send finish before closing the app
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      ctx.mailer.delayMs = 0;
    }
  });

  it('code request: a new email and an already confirmed one take the same time', async () => {
    const used = (await registerUser(ctx)).user.email;

    const fresh = await took(() => start(uniqueEmail()).expect(202));
    const existing = await took(() => start(used).expect(202));

    expect(fresh).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(existing).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(Math.abs(fresh - existing)).toBeLessThan(150);
  });

  it('code request: a pending account and a missing email take the same time', async () => {
    const pending = uniqueEmail();
    await start(pending).expect(202);

    const known = await took(() => start(pending).expect(202));
    const unknown = await took(() => start(uniqueEmail('naoexiste')).expect(202));

    expect(known).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(Math.abs(known - unknown)).toBeLessThan(150);
  });
});
