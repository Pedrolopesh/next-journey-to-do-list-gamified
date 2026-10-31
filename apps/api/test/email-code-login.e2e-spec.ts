import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { VERIFICATION_RESEND_INTERVAL_MS } from '../src/modules/auth/email-verification.service.js';
import { bearer, createTestApp, type TestContext, uniqueEmail } from './helpers.js';

const WRONG = '000000';

describe('login sem senha por código de e-mail', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp({ seedStarterItems: true });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const start = (email: string) =>
    ctx
      .http()
      .post('/v1/auth/email/start')
      .send({ email, timezone: 'America/Sao_Paulo', termsVersion: '1' });
  const confirm = (email: string, code: string) =>
    ctx.http().post('/v1/auth/email/confirm').send({ email, code });
  const code = (email: string) => ctx.mailer.lastVerificationCode(email) ?? '';
  const later = (ms: number) =>
    ctx.clock.set(new Date(ctx.clock.now().getTime() + ms).toISOString());

  it('e-mail novo cria conta pendente sem senha e envia o código', async () => {
    const email = uniqueEmail();
    await start(email).expect(202);
    expect(code(email)).toMatch(/^\d{6}$/);
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).toBeNull();
  });

  it('o código confirma a conta, devolve a sessão e cria os itens de exemplo', async () => {
    const email = uniqueEmail();
    await start(email).expect(202);
    const ok = await confirm(email, code(email)).expect(200);
    expect(ok.body.tokens.accessToken).toBeTruthy();
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(await ctx.prisma.item.count({ where: { userId: user.id } })).toBeGreaterThan(0);
    const me = await ctx.http().get('/v1/me').set('Authorization', bearer(ok.body)).expect(200);
    expect(me.body.user.hasPassword).toBe(false);
    expect(me.body.user.goal).toBeNull();
  });

  it('conta já confirmada entra de novo pelo código, sem recriar itens', async () => {
    const email = uniqueEmail();
    await start(email).expect(202);
    await confirm(email, code(email)).expect(200);
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    const before = await ctx.prisma.item.count({ where: { userId: user.id } });

    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    await start(email).expect(202);
    await confirm(email, code(email)).expect(200);
    expect(await ctx.prisma.item.count({ where: { userId: user.id } })).toBe(before);
  });

  it('código errado, expirado, usado ou e-mail sem conta dão a mesma resposta', async () => {
    const email = uniqueEmail();
    await start(email).expect(202);
    const otp = code(email);
    const wrong = await confirm(email, WRONG).expect(400);
    const unknown = await confirm(uniqueEmail('naoexiste'), otp).expect(400);
    expect(wrong.body.code).toBe('INVALID_VERIFICATION_CODE');
    expect(unknown.body.code).toBe(wrong.body.code);
    expect(unknown.body.message).toBe(wrong.body.message);
    await confirm(email, otp).expect(200);
    await confirm(email, otp).expect(400);
  });

  it('a resposta do pedido é igual para e-mail novo e já confirmado', async () => {
    const known = uniqueEmail();
    await start(known).expect(202);
    await confirm(known, code(known)).expect(200);
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    const a = await start(known).expect(202);
    const b = await start(uniqueEmail()).expect(202);
    expect(a.body).toEqual(b.body);
  });

  it('a conta criada por e-mail apaga a conta com o código', async () => {
    const email = uniqueEmail();
    await start(email).expect(202);
    const auth = await confirm(email, code(email)).expect(200);
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    await start(email).expect(202);
    const wrong = await ctx
      .http()
      .delete('/v1/me')
      .set('Authorization', bearer(auth.body))
      .send({ emailCode: WRONG })
      .expect(403);
    expect(wrong.body.code).toBe('REAUTH_FAILED');
    await ctx
      .http()
      .delete('/v1/me')
      .set('Authorization', bearer(auth.body))
      .send({ emailCode: code(email) })
      .expect(204);
  });
});
