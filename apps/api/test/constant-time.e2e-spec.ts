import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createTestApp,
  registerBody,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const FLOOR_MS = 300;

/** Mede quanto a resposta demora, em ms. */
async function took(send: () => PromiseLike<unknown>): Promise<number> {
  const start = performance.now();
  await send();
  return performance.now() - start;
}

describe('rotas de conta com tempo de resposta igual (sem enumeração por tempo)', () => {
  let ctx: TestContext;
  const previous = process.env.AUTH_MIN_RESPONSE_MS;
  beforeAll(async () => {
    process.env.AUTH_MIN_RESPONSE_MS = String(FLOOR_MS);
    ctx = await createTestApp();
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
    expect(Math.abs(withAccount - withoutAccount)).toBeLessThan(120);
  });

  it('esqueci a senha não espera o provedor de e-mail, mesmo lento', async () => {
    const email = (await registerUser(ctx)).user.email;
    ctx.mailer.delayMs = 1500;
    try {
      const elapsed = await took(() =>
        ctx.http().post('/v1/auth/forgot-password').send({ email }).expect(202),
      );
      expect(elapsed).toBeLessThan(1000);
    } finally {
      ctx.mailer.delayMs = 0;
    }
  });

  it('cadastro: e-mail novo e e-mail já usado levam o mesmo tempo', async () => {
    const used = (await registerUser(ctx)).user.email;
    const register = (email: string) =>
      ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);

    const fresh = await took(() => register(uniqueEmail()));
    const existing = await took(() => register(used));

    expect(fresh).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(existing).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(Math.abs(fresh - existing)).toBeLessThan(120);
  });

  it('reenvio do código: conta pendente e e-mail inexistente levam o mesmo tempo', async () => {
    const pending = uniqueEmail();
    await ctx.http().post('/v1/auth/register').send(registerBody(pending)).expect(202);
    const resend = (email: string) =>
      ctx.http().post('/v1/auth/resend-verification').send({ email }).expect(202);

    const known = await took(() => resend(pending));
    const unknown = await took(() => resend(uniqueEmail('naoexiste')));

    expect(known).toBeGreaterThanOrEqual(FLOOR_MS - 10);
    expect(Math.abs(known - unknown)).toBeLessThan(120);
  });
});
