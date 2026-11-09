import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bearer,
  createTestApp,
  FakeVerifier,
  NOON_09,
  registerUser,
  requestCode,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const WRONG = '000000';
/** The "now" instant of the test clock, in seconds (for the ID token `iat`). */
const NOW_S = Math.floor(Date.parse(NOON_09) / 1000);

describe('account deletion requires proof of ownership', () => {
  let ctx: TestContext;
  const verifier = new FakeVerifier();
  beforeAll(async () => {
    ctx = await createTestApp({ verifier });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const del = (auth: Awaited<ReturnType<typeof registerUser>>) =>
    ctx.http().delete('/v1/me').set('authorization', bearer(auth));
  const stillActive = async (userId: string) =>
    (await ctx.prisma.user.findUniqueOrThrow({ where: { id: userId } })).deletedAt === null;

  it('the right email code deletes', async () => {
    const auth = await registerUser(ctx);
    const emailCode = await requestCode(ctx, auth.user.email);
    await del(auth).send({ emailCode }).expect(204);
    expect(await stillActive(auth.user.id)).toBe(false);
  });

  it('a wrong code, no body, a password or a proof of the wrong kind: nothing is deleted and the session stays valid', async () => {
    const auth = await registerUser(ctx);
    await requestCode(ctx, auth.user.email);
    const wrong = await del(auth).send({ emailCode: WRONG }).expect(403);
    expect(wrong.body.code).toBe('REAUTH_FAILED');
    await del(auth).expect(400);
    await del(auth).send({}).expect(400);
    await del(auth).send({ password: 'Teste#1234' }).expect(400); // scan-allow: fake test password
    const social = await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(403);
    expect(social.body.code).toBe('REAUTH_FAILED');
    expect(await stillActive(auth.user.id)).toBe(true);
    // 403, never 401: the app must not treat it as an ended session
    await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
  });

  it('the sixth attempt in 15 minutes is 429, even with the right code', async () => {
    const auth = await registerUser(ctx);
    const emailCode = await requestCode(ctx, auth.user.email);
    for (let i = 0; i < 5; i += 1) await del(auth).send({ emailCode: WRONG }).expect(403);
    const blocked = await del(auth).send({ emailCode }).expect(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
    expect(await stillActive(auth.user.id)).toBe(true);
  });

  it('the right code resets the earlier wrong attempts', async () => {
    const auth = await registerUser(ctx);
    const emailCode = await requestCode(ctx, auth.user.email);
    for (let i = 0; i < 4; i += 1) await del(auth).send({ emailCode: WRONG }).expect(403);
    await del(auth).send({ emailCode }).expect(204);
  });

  describe('social-only account', () => {
    const social = async () => {
      const email = uniqueEmail('social');
      verifier.identity = {
        subject: `g-${email}`,
        email,
        emailVerified: true,
        name: null,
        issuedAt: NOW_S,
      };
      const response = await ctx
        .http()
        .post('/v1/auth/google')
        .send({ idToken: 'ok', termsVersion: '1' })
        .expect(200);
      return { auth: response.body as Awaited<ReturnType<typeof registerUser>>, email };
    };

    it('the email code also deletes a social-only account', async () => {
      const { auth, email } = await social();
      const emailCode = await requestCode(ctx, email);
      await del(auth).send({ emailCode }).expect(204);
      expect(await stillActive(auth.user.id)).toBe(false);
    });

    it('the ID token of the linked identity deletes', async () => {
      const { auth } = await social();
      await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(204);
      expect(await stillActive(auth.user.id)).toBe(false);
    });

    it('an old ID token (over 5 minutes) or one with no issue date does not prove presence now', async () => {
      const { auth, email } = await social();
      const identity = { subject: `g-${email}`, email, emailVerified: true, name: null };
      verifier.identity = { ...identity, issuedAt: NOW_S - 6 * 60 };
      await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(403);
      verifier.identity = identity;
      await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(403);
      verifier.identity = { ...identity, issuedAt: NOW_S - 60 };
      await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(204);
    });

    it('an invalid ID token, or one from another person, does not delete', async () => {
      const { auth, email } = await social();
      await del(auth).send({ provider: 'google', idToken: 'invalido' }).expect(403); // scan-allow: test data
      verifier.identity = {
        subject: 'sub-de-outra-pessoa',
        email: `outra-${email}`,
        emailVerified: true,
        name: null,
        issuedAt: NOW_S,
      };
      const res = await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(403);
      expect(res.body.code).toBe('REAUTH_FAILED');
      expect(await stillActive(auth.user.id)).toBe(true);
    });
  });
});
