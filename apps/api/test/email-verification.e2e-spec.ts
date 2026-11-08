import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { VERIFICATION_RESEND_INTERVAL_MS } from '../src/modules/auth/email-verification.service.js';
import { createTestApp, PASSWORD, registerBody, type TestContext, uniqueEmail } from './helpers.js';

const WRONG = '000000';

describe('email verification on signup', () => {
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

  it('a new signup does not return a session and sends the code only by email', async () => {
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

  it('the right code with the password confirms the account and returns the session (single use)', async () => {
    const email = uniqueEmail();
    await register(email);
    const otp = code(email);
    const ok = await verify(email, otp).expect(200);
    expect(ok.body.tokens.accessToken).toBeTruthy();
    expect(ok.body.user.email).toBe(email);
    await ctx.http().post('/v1/auth/login').send({ email, password: PASSWORD }).expect(200); // scan-allow: fake password
    const again = await verify(email, otp).expect(400);
    expect(again.body.code).toBe('INVALID_VERIFICATION_CODE');
  });

  it('a wrong code, a missing email and a different password give the same response', async () => {
    const email = uniqueEmail();
    await register(email);
    const otp = code(email);
    const wrongCode = await verify(email, WRONG).expect(400);
    const unknown = await verify(uniqueEmail('naoexiste'), otp).expect(400);
    const wrongPassword = await verify(email, otp, 'Outra#1234').expect(400); // scan-allow: fake password
    expect(wrongCode.body.code).toBe('INVALID_VERIFICATION_CODE');
    expect(unknown.body.code).toBe(wrongCode.body.code);
    expect(wrongPassword.body.code).toBe(wrongCode.body.code);
    expect(wrongCode.body.message).toBe(unknown.body.message);
  });

  it('the fifth wrong attempt invalidates the code, even the right one', async () => {
    const email = uniqueEmail();
    await register(email);
    const otp = code(email);
    for (let i = 0; i < 5; i += 1) await verify(email, WRONG).expect(400);
    await verify(email, otp).expect(400);
  });

  it('the code expires in 15 minutes', async () => {
    const email = uniqueEmail();
    await register(email);
    const otp = code(email);
    later(15 * 60_000 + 1000);
    await verify(email, otp).expect(400);
  });

  it('parallel requests do not exceed the limit of 5 attempts', async () => {
    const email = uniqueEmail();
    await register(email);
    const otp = code(email);
    const wrong = otp === WRONG ? '111111' : WRONG;
    const burst = await Promise.all(Array.from({ length: 8 }, () => verify(email, wrong)));
    expect(burst.every((res) => res.status === 400)).toBe(true);
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    const row = await ctx.prisma.emailVerification.findFirstOrThrow({ where: { userId: user.id } });
    expect(row.attempts).toBe(5);
    expect(row.usedAt).not.toBeNull();
    // The right code is no longer valid: it was invalidated by the wrong attempts
    await verify(email, otp).expect(400);
  });

  it("a wrong password does not spend attempts: whoever only knows the email does not invalidate the owner's code", async () => {
    const email = uniqueEmail();
    await register(email);
    const otp = code(email);
    for (let i = 0; i < 8; i += 1) await verify(email, WRONG, 'Invasor#1234').expect(400); // scan-allow: fake password
    await verify(email, otp).expect(200);
  });

  it('resend: respects the interval, invalidates the old code and always answers 202', async () => {
    const email = uniqueEmail();
    await register(email);
    const first = code(email);
    const sentBefore = ctx.mailer.sent.length;
    await ctx.http().post('/v1/auth/resend-verification').send({ email }).expect(202);
    expect(ctx.mailer.sent.length).toBe(sentBefore); // within 60 s
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    await ctx.http().post('/v1/auth/resend-verification').send({ email }).expect(202);
    const second = code(email);
    expect(ctx.mailer.sent.length).toBe(sentBefore + 1);
    await verify(email, first === second ? WRONG : first).expect(400);
    await verify(email, second).expect(200);
    // A missing email and an already confirmed account: 202 and no email
    const total = ctx.mailer.sent.length;
    await ctx.http().post('/v1/auth/resend-verification').send({ email }).expect(202);
    await ctx
      .http()
      .post('/v1/auth/resend-verification')
      .send({ email: uniqueEmail('naoexiste') })
      .expect(202);
    expect(ctx.mailer.sent.length).toBe(total);
  });

  it('signup with the email of a confirmed account answers the same, does not change the account and only notifies', async () => {
    const email = uniqueEmail();
    await register(email);
    await verify(email, code(email)).expect(200);
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    const before = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    const res = await ctx
      .http()
      .post('/v1/auth/register')
      .send({ ...registerBody(email, 'Invasor#1234'), name: 'Invasor' }) // scan-allow: fake password
      .expect(202);
    expect(res.body).toEqual({ status: 'verification_sent' });
    const mail = ctx.mailer.sent.at(-1);
    expect(mail?.to).toBe(email);
    expect(mail?.text).not.toMatch(/\d{6}/);
    const after = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(after.name).toBe(before.name);
  });

  it('re-signup of a pending account wins, but only the password of the last signup confirms', async () => {
    const email = uniqueEmail();
    await register(email, 'Invasor#1234'); // scan-allow: fake password
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    await register(email);
    const otp = code(email);
    await verify(email, otp, 'Invasor#1234').expect(400); // scan-allow: fake password
    await verify(email, otp).expect(200);
  });

  it('login with the right password and a pending email is 403 and resends; a wrong password stays 401', async () => {
    const email = uniqueEmail();
    await register(email);
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    const sent = ctx.mailer.sent.length;
    const res = await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email, password: PASSWORD }) // scan-allow: fake test password
      .expect(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    expect(res.body.tokens).toBeUndefined();
    expect(ctx.mailer.sent.length).toBe(sent + 1);
    await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email, password: 'Errada#1234' }) // scan-allow: fake test password
      .expect(401);
  });
});
