import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bearer,
  createTestApp,
  FakeVerifier,
  NOON_09,
  PASSWORD,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const WRONG = 'Errada#1234'; // scan-allow: fake test password
/** The "now" instant of the test clock, in seconds (for the ID token `iat`). */
const NOW_S = Math.floor(Date.parse(NOON_09) / 1000);

describe('account deletion requires reauthentication', () => {
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

  it('account with a password: the right password deletes', async () => {
    const auth = await registerUser(ctx);
    await del(auth).send({ password: PASSWORD }).expect(204); // scan-allow: fake test password
    expect(await stillActive(auth.user.id)).toBe(false);
  });

  it('wrong password, no body or a proof of the wrong kind: nothing is deleted and the session stays valid', async () => {
    const auth = await registerUser(ctx);
    const wrong = await del(auth).send({ password: WRONG }).expect(403);
    expect(wrong.body.code).toBe('REAUTH_FAILED');
    await del(auth).expect(400);
    await del(auth).send({}).expect(400);
    const social = await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(403);
    expect(social.body.code).toBe('REAUTH_FAILED');
    expect(await stillActive(auth.user.id)).toBe(true);
    // 403, never 401: the app must not treat it as an ended session
    await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
  });

  it('the sixth attempt in 15 minutes is 429, even with the right password', async () => {
    const auth = await registerUser(ctx);
    for (let i = 0; i < 5; i += 1) await del(auth).send({ password: WRONG }).expect(403);
    const blocked = await del(auth).send({ password: PASSWORD }).expect(429); // scan-allow: fake password
    expect(blocked.body.code).toBe('RATE_LIMITED');
    expect(await stillActive(auth.user.id)).toBe(true);
  });

  it('the right password resets the earlier wrong attempts', async () => {
    const auth = await registerUser(ctx);
    for (let i = 0; i < 4; i += 1) await del(auth).send({ password: WRONG }).expect(403);
    await del(auth).send({ password: PASSWORD }).expect(204); // scan-allow: fake test password
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

    it('/me reports that there is no password', async () => {
      const { auth } = await social();
      const me = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
      expect(me.body.user.hasPassword).toBe(false);
      const withPassword = await registerUser(ctx);
      const other = await ctx
        .http()
        .get('/v1/me')
        .set('authorization', bearer(withPassword))
        .expect(200);
      expect(other.body.user.hasPassword).toBe(true);
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
      // A password is not valid for an account that has no password
      await del(auth).send({ password: PASSWORD }).expect(403); // scan-allow: fake test password
      expect(await stillActive(auth.user.id)).toBe(true);
    });
  });
});
