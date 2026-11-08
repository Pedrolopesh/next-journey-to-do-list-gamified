import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { VERIFICATION_RESEND_INTERVAL_MS } from '../src/modules/auth/email-verification.service.js';
import { bearer, createTestApp, registerBody, type TestContext, uniqueEmail } from './helpers.js';

const WRONG = '000000';

describe('passwordless login by email code', () => {
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

  it('a new email creates a pending account without a password and sends the code', async () => {
    const email = uniqueEmail();
    await start(email).expect(202);
    expect(code(email)).toMatch(/^\d{6}$/);
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).toBeNull();
  });

  it('the code confirms the account, returns the session and creates the starter items', async () => {
    const email = uniqueEmail();
    await start(email).expect(202);
    const ok = await confirm(email, code(email)).expect(200);
    expect(ok.body.tokens.accessToken).toBeTruthy();
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(await ctx.prisma.item.count({ where: { userId: user.id } })).toBeGreaterThan(0);
    const me = await ctx.http().get('/v1/me').set('Authorization', bearer(ok.body)).expect(200);
    expect(me.body.user.hasPassword).toBe(false);
    expect(me.body.user.goals).toEqual([]);
  });

  it('the export lists email as a way to sign in for the account without a password', async () => {
    const email = uniqueEmail();
    await start(email).expect(202);
    const auth = await confirm(email, code(email)).expect(200);
    const exported = await ctx
      .http()
      .get('/v1/me/export')
      .set('Authorization', bearer(auth.body))
      .expect(200);
    expect(exported.body.account.signInMethods).toEqual(['email']);
  });

  it('an already confirmed account signs in again by code, without recreating items', async () => {
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

  it('a wrong, expired or used code, or an email without an account, give the same response', async () => {
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

  it("the password of someone else's pending signup does not survive the email owner's confirmation", async () => {
    const email = uniqueEmail();
    // Someone else registers the victim's email with a password they know (legacy endpoint)
    await ctx
      .http()
      .post('/v1/auth/register')
      .send(registerBody(email, 'Atacante#1234'))
      .expect(202); // scan-allow: fake password
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    // The owner signs in with the code that reaches their mailbox
    await start(email).expect(202);
    await confirm(email, code(email)).expect(200);
    await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email, password: 'Atacante#1234' }) // scan-allow: fake password
      .expect(401);
  });

  it('the request response is the same for a new and an already confirmed email', async () => {
    const known = uniqueEmail();
    await start(known).expect(202);
    await confirm(known, code(known)).expect(200);
    later(VERIFICATION_RESEND_INTERVAL_MS + 1000);
    const a = await start(known).expect(202);
    const b = await start(uniqueEmail()).expect(202);
    expect(a.body).toEqual(b.body);
  });

  it('the account created by email deletes the account with the code', async () => {
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
