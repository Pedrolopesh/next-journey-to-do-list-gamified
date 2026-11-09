import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bearer,
  createTestApp,
  FakeVerifier,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

describe('login social', () => {
  let ctx: TestContext;
  const verifier = new FakeVerifier();
  beforeAll(async () => {
    ctx = await createTestApp({ verifier });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('first access requires accepting the terms and creates the account with the default categories', async () => {
    const email = uniqueEmail('social');
    verifier.identity = {
      subject: `g-${email}`,
      email,
      emailVerified: true,
      name: 'Pessoa Social',
    };
    const sem = await ctx.http().post('/v1/auth/google').send({ idToken: 'ok' }).expect(400);
    expect(sem.body.code).toBe('TERMS_REQUIRED');

    const res = await ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '2026-10-01', timezone: 'America/Sao_Paulo' })
      .expect(200);
    expect(res.body.user).toMatchObject({
      email,
      name: 'Pessoa Social',
      timezone: 'America/Sao_Paulo',
    });
    expect(await ctx.prisma.category.count({ where: { userId: res.body.user.id } })).toBe(5);
  });

  it('the second access enters the same account (no duplicate)', async () => {
    const email = uniqueEmail('social');
    verifier.identity = { subject: `g-${email}`, email, emailVerified: true, name: null };
    const first = await ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '1' })
      .expect(200);
    const second = await ctx.http().post('/v1/auth/google').send({ idToken: 'ok' }).expect(200);
    expect(second.body.user.id).toBe(first.body.user.id);
  });

  it('links to the same user when the VERIFIED email matches', async () => {
    const existing = await registerUser(ctx);
    verifier.identity = {
      subject: `a-${existing.user.email}`,
      email: existing.user.email,
      emailVerified: true,
      name: null,
    };
    const res = await ctx.http().post('/v1/auth/apple').send({ idToken: 'ok' }).expect(200);
    expect(res.body.user.id).toBe(existing.user.id);
    expect(await ctx.prisma.authIdentity.count({ where: { userId: existing.user.id } })).toBe(1);
  });

  it('an UNVERIFIED email never links or creates an account (prevents account takeover)', async () => {
    const existing = await registerUser(ctx);
    verifier.identity = {
      subject: `x-${existing.user.email}`,
      email: existing.user.email,
      emailVerified: false,
      name: null,
    };
    const res = await ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '1' })
      .expect(400);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED_BY_PROVIDER');
    expect(await ctx.prisma.authIdentity.count({ where: { userId: existing.user.id } })).toBe(0);
  });

  it('a provider without a verified email does not create a new account', async () => {
    const email = uniqueEmail('naoverificado');
    verifier.identity = { subject: `n-${email}`, email, emailVerified: false, name: null };
    const res = await ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '1' })
      .expect(400);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED_BY_PROVIDER');
    expect(await ctx.prisma.user.count({ where: { email } })).toBe(0);
  });

  it('social login takes over an UNCONFIRMED account created by code: it is confirmed and the pending code stops working', async () => {
    const email = uniqueEmail('pendente');
    await ctx.http().post('/v1/auth/email/start').send({ email }).expect(202);
    const pendingCode = ctx.mailer.lastVerificationCode(email) ?? '';
    verifier.identity = { subject: `p-${email}`, email, emailVerified: true, name: null };
    await ctx.http().post('/v1/auth/apple').send({ idToken: 'ok' }).expect(200);

    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).not.toBeNull();
    // The code that reached the mailbox of whoever asked for it stops working
    await ctx.http().post('/v1/auth/email/confirm').send({ email, code: pendingCode }).expect(400);
  });

  it('an invalid token is 401', async () => {
    const email = uniqueEmail('social');
    verifier.identity = { subject: `g-${email}`, email, emailVerified: true, name: null };
    await ctx.http().post('/v1/auth/google').send({ idToken: 'ok', termsVersion: '1' }).expect(200);
    await ctx.http().post('/v1/auth/google').send({ idToken: 'invalido' }).expect(401); // scan-allow: test data
  });

  it('the social login access token works on protected routes', async () => {
    const email = uniqueEmail('social');
    verifier.identity = { subject: `g-${email}`, email, emailVerified: true, name: null };
    const res = await ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '1' })
      .expect(200);
    await ctx.http().get('/v1/me').set('authorization', bearer(res.body)).expect(200);
  });
});

describe('social login without configured credentials', () => {
  it('answers 503 (feature unavailable), without leaking details', async () => {
    const ctx = await createTestApp(); // real verifier, without GOOGLE_CLIENT_IDS
    const res = await ctx.http().post('/v1/auth/google').send({ idToken: 'qualquer' }).expect(503); // scan-allow: test data
    expect(res.body.code).toBe('SOCIAL_LOGIN_UNAVAILABLE');
    await ctx.http().post('/v1/auth/apple').send({ idToken: 'qualquer' }).expect(503); // scan-allow: test data
    await ctx.app.close();
  });
});
