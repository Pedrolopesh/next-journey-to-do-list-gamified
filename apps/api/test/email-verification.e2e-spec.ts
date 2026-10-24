import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { VERIFICATION_RESEND_INTERVAL_MS } from '../src/modules/auth/email-verification.service.js';
import { createTestApp, PASSWORD, registerBody, type TestContext, uniqueEmail } from './helpers.js';

const WRONG = '000000';

describe('verificação de e-mail no cadastro', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const register = (email: string, password = PASSWORD) =>
    ctx.http().post('/v1/auth/register').send(registerBody(email, password)).expect(202);
  const verify = (email: string, code: string, password = PASSWORD) =>
    ctx.http().post('/v1/auth/verify-email').send({ email, code, password });
  const later = (ms: number) =>
    ctx.clock.set(new Date(ctx.clock.now().getTime() + ms).toISOString());
  const code = (email: string) => ctx.mailer.lastVerificationCode(email) ?? '';

  it('cadastro novo não devolve sessão e envia o código só por e-mail', async () => {
    const email = uniqueEmail();
    const res = await register(email);
    expect(res.body).toEqual({ status: 'verification_sent' });
    expect(code(email)).toMatch(/^\d{6}$/);
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).toBeNull();
    const stored = await ctx.prisma.emailVerification.findMany({ where: { userId: user.id } });
    expect(stored).toHaveLength(1);
    expect(JSON.stringify(stored)).not.toContain(code(email));
  });

  it('código certo com a senha confirma a conta e devolve a sessão (uso único)', async () => {
    const email = uniqueEmail();
    await register(email);
    const otp = code(email);
    const ok = await verify(email, otp).expect(200);
    expect(ok.body.tokens.accessToken).toBeTruthy();
    expect(ok.body.user.email).toBe(email);
    await ctx.http().post('/v1/auth/login').send({ email, password: PASSWORD }).expect(200); // scan-allow: senha falsa
    const again = await verify(email, otp).expect(400);
    expect(again.body.code).toBe('INVALID_VERIFICATION_CODE');
  });

  it('código errado, e-mail inexistente e senha diferente dão a mesma resposta', async () => {
    const email = uniqueEmail();
    await register(email);
    const otp = code(email);
    const wrongCode = await verify(email, WRONG).expect(400);
    const unknown = await verify(uniqueEmail('naoexiste'), otp).expect(400);
    const wrongPassword = await verify(email, otp, 'Outra#1234').expect(400); // scan-allow: senha falsa
    expect(wrongCode.body.code).toBe('INVALID_VERIFICATION_CODE');
    expect(unknown.body.code).toBe(wrongCode.body.code);
    expect(wrongPassword.body.code).toBe(wrongCode.body.code);
    expect(wrongCode.body.message).toBe(unknown.body.message);
  });

  it('a quinta tentativa errada invalida o código, até o certo', async () => {
    const email = uniqueEmail();
    await register(email);
    const otp = code(email);
    for (let i = 0; i < 5; i += 1) await verify(email, WRONG).expect(400);
    await verify(email, otp).expect(400);
  });

  it('código expira em 15 minutos', async () => {
    const email = uniqueEmail();
    await register(email);
    const otp = code(email);
    later(15 * 60_000 + 1000);
    await verify(email, otp).expect(400);
  });

  it('reenvio: respeita o intervalo, invalida o código antigo e responde sempre 202', async () => {
    const email = uniqueEmail();
    await register(email);
    const first = code(email);
    const sentBefore = ctx.mailer.sent.length;
    await ctx.http().post('/v1/auth/resend-verification').send({ email }).expect(202);
    expect(ctx.mailer.sent.length).toBe(sentBefore); // dentro de 60 s
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    await ctx.http().post('/v1/auth/resend-verification').send({ email }).expect(202);
    const second = code(email);
    expect(ctx.mailer.sent.length).toBe(sentBefore + 1);
    await verify(email, first === second ? WRONG : first).expect(400);
    await verify(email, second).expect(200);
    // E-mail inexistente e conta já confirmada: 202 e nenhum e-mail
    const total = ctx.mailer.sent.length;
    await ctx.http().post('/v1/auth/resend-verification').send({ email }).expect(202);
    await ctx
      .http()
      .post('/v1/auth/resend-verification')
      .send({ email: uniqueEmail('naoexiste') })
      .expect(202);
    expect(ctx.mailer.sent.length).toBe(total);
  });

  it('cadastro com e-mail de conta confirmada responde igual, não muda a conta e só avisa', async () => {
    const email = uniqueEmail();
    await register(email);
    await verify(email, code(email)).expect(200);
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    const before = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    const res = await ctx
      .http()
      .post('/v1/auth/register')
      .send({ ...registerBody(email, 'Invasor#1234'), name: 'Invasor' }) // scan-allow: senha falsa
      .expect(202);
    expect(res.body).toEqual({ status: 'verification_sent' });
    const mail = ctx.mailer.sent.at(-1);
    expect(mail?.to).toBe(email);
    expect(mail?.text).not.toMatch(/\d{6}/);
    const after = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(after.name).toBe(before.name);
  });

  it('recadastro de conta pendente vence, mas só a senha do último cadastro confirma', async () => {
    const email = uniqueEmail();
    await register(email, 'Invasor#1234'); // scan-allow: senha falsa
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    await register(email);
    const otp = code(email);
    await verify(email, otp, 'Invasor#1234').expect(400); // scan-allow: senha falsa
    await verify(email, otp).expect(200);
  });

  it('login com senha certa e e-mail pendente é 403 e reenvia; senha errada segue 401', async () => {
    const email = uniqueEmail();
    await register(email);
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    const sent = ctx.mailer.sent.length;
    const res = await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email, password: PASSWORD }) // scan-allow: senha falsa de teste
      .expect(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    expect(res.body.tokens).toBeUndefined();
    expect(ctx.mailer.sent.length).toBe(sent + 1);
    await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email, password: 'Errada#1234' }) // scan-allow: senha falsa de teste
      .expect(401);
  });
});
