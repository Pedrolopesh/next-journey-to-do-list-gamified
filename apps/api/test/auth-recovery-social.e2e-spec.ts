import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bearer,
  createTestApp,
  FakeVerifier,
  NOON_09,
  PASSWORD,
  registerBody,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const NEW_PASSWORD = 'Outra#9876'; // scan-allow: fake test password

describe('password recovery', () => {
  let ctx: TestContext & { mailer: import('./helpers.js').FakeMailer };
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('answers 202 the same for an existing and a missing email (no enumeration)', async () => {
    ctx.clock.set(NOON_09);
    const auth = await registerUser(ctx);
    const known = await ctx
      .http()
      .post('/v1/auth/forgot-password')
      .send({ email: auth.user.email })
      .expect(202);
    const unknown = await ctx
      .http()
      .post('/v1/auth/forgot-password')
      .send({ email: uniqueEmail('nao') })
      .expect(202);
    expect(known.body).toEqual(unknown.body);
    expect(
      ctx.mailer.sent.filter(
        (m) => m.to === auth.user.email && m.subject.startsWith('Recuperação'),
      ),
    ).toHaveLength(1);
    expect(ctx.mailer.sent.some((m) => m.to.startsWith('nao-'))).toBe(false);
  });

  it('the link changes the password only once, drops the sessions and the new password becomes valid', async () => {
    ctx.clock.set(NOON_09);
    const auth = await registerUser(ctx);
    await ctx.http().post('/v1/auth/forgot-password').send({ email: auth.user.email }).expect(202);
    const token = ctx.mailer.lastResetToken(auth.user.email) as string;
    expect(token).toBeTruthy();
    // only the hash stays in the database
    const stored = await ctx.prisma.passwordReset.findFirstOrThrow({
      where: { userId: auth.user.id },
    });
    expect(stored.tokenHash).not.toContain(token);

    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token, newPassword: NEW_PASSWORD })
      .expect(204);
    // single-use link
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token, newPassword: NEW_PASSWORD })
      .expect(400);
    // the old password is no longer valid, the new one is
    await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email: auth.user.email, password: PASSWORD })
      .expect(401); // scan-allow: fake password
    await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email: auth.user.email, password: NEW_PASSWORD })
      .expect(200);
    // the previous session was revoked
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: auth.tokens.refreshToken })
      .expect(401);
  });

  it('the link expires in 30 minutes and only the most recent one works', async () => {
    ctx.clock.set(NOON_09);
    const auth = await registerUser(ctx);
    await ctx.http().post('/v1/auth/forgot-password').send({ email: auth.user.email }).expect(202);
    const first = ctx.mailer.lastResetToken(auth.user.email) as string;
    await ctx.http().post('/v1/auth/forgot-password').send({ email: auth.user.email }).expect(202);
    const second = ctx.mailer.lastResetToken(auth.user.email) as string;
    expect(second).not.toBe(first);
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token: first, newPassword: NEW_PASSWORD })
      .expect(400);

    ctx.clock.set('2026-10-09T15:31:00Z'); // 31 minutos depois
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token: second, newPassword: NEW_PASSWORD })
      .expect(400);
  });

  it('rejects a weak new password and a made-up token', async () => {
    ctx.clock.set(NOON_09);
    const auth = await registerUser(ctx);
    await ctx.http().post('/v1/auth/forgot-password').send({ email: auth.user.email }).expect(202);
    const token = ctx.mailer.lastResetToken(auth.user.email) as string;
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token, newPassword: 'fraca' })
      .expect(400);
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token: 'inventado', newPassword: NEW_PASSWORD }) // scan-allow: test data
      .expect(400);
    // the token is still valid after an attempt with a weak password
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token, newPassword: NEW_PASSWORD })
      .expect(204);
  });
});

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
    const stored = await ctx.prisma.user.findUniqueOrThrow({ where: { id: res.body.user.id } });
    expect(stored.passwordHash).toBeNull();
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

  it('social login takes over an UNCONFIRMED password account: deletes the password and the sessions', async () => {
    const email = uniqueEmail('pendente');
    await ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);
    const pendingCode = ctx.mailer.lastVerificationCode(email) ?? '';
    verifier.identity = { subject: `p-${email}`, email, emailVerified: true, name: null };
    await ctx.http().post('/v1/auth/apple').send({ idToken: 'ok' }).expect(200);

    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(user.passwordHash).toBeNull();
    // The password of whoever signed up earlier and the pending code stop working
    await ctx.http().post('/v1/auth/login').send({ email, password: PASSWORD }).expect(401); // scan-allow: fake password
    await ctx
      .http()
      .post('/v1/auth/verify-email')
      .send({ email, code: pendingCode, password: PASSWORD }) // scan-allow: fake password
      .expect(400);
  });

  it('a social-only account does not enter with a password; an invalid token is 401', async () => {
    const email = uniqueEmail('social');
    verifier.identity = { subject: `g-${email}`, email, emailVerified: true, name: null };
    await ctx.http().post('/v1/auth/google').send({ idToken: 'ok', termsVersion: '1' }).expect(200);
    await ctx.http().post('/v1/auth/login').send({ email, password: PASSWORD }).expect(401); // scan-allow: fake password
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
