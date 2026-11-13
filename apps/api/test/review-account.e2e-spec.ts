import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createTestApp, type TestContext, uniqueEmail } from './helpers.js';

const REVIEW_CODE = '424242';

describe('store review account', () => {
  let ctx: TestContext;
  const reviewEmail = uniqueEmail('review');

  beforeAll(async () => {
    process.env.REVIEW_ACCOUNT_EMAIL = reviewEmail;
    process.env.REVIEW_ACCOUNT_CODE = REVIEW_CODE;
    ctx = await createTestApp({ seedStarterItems: true });
  });
  afterAll(async () => {
    delete process.env.REVIEW_ACCOUNT_EMAIL;
    delete process.env.REVIEW_ACCOUNT_CODE;
    await ctx.app.close();
  });

  const start = (email: string) =>
    ctx
      .http()
      .post('/v1/auth/email/start')
      .send({ email, timezone: 'America/Sao_Paulo', termsVersion: '1' });
  const confirm = (email: string, code: string) =>
    ctx.http().post('/v1/auth/email/confirm').send({ email, code });

  it('signs in with the fixed code, sends no email, and the code works again', async () => {
    await start(reviewEmail).expect(202);
    expect(ctx.mailer.sent.some((mail) => mail.to === reviewEmail)).toBe(false);

    const first = await confirm(reviewEmail, REVIEW_CODE).expect(200);
    expect(first.body.tokens.accessToken).toBeTruthy();
    await ctx.http().get('/v1/me').set('Authorization', bearer(first.body)).expect(200);

    // Not single use: a second reviewer session with the same code
    await confirm(reviewEmail, REVIEW_CODE).expect(200);
  });

  it('is case-insensitive on the email and rejects a wrong code', async () => {
    await confirm(reviewEmail.toUpperCase(), REVIEW_CODE).expect(200);
    const wrong = await confirm(reviewEmail, '000000').expect(400);
    expect(wrong.body.code).toBe('INVALID_VERIFICATION_CODE');
  });

  it('the fixed code does not work for any other email', async () => {
    const other = uniqueEmail();
    await start(other).expect(202);
    await confirm(other, REVIEW_CODE).expect(400);
    expect(ctx.mailer.sent.some((mail) => mail.to === other)).toBe(true);
  });
});

describe('without a review account configured', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    delete process.env.REVIEW_ACCOUNT_EMAIL;
    delete process.env.REVIEW_ACCOUNT_CODE;
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('no fixed code is accepted', async () => {
    const email = uniqueEmail('review');
    await ctx
      .http()
      .post('/v1/auth/email/start')
      .send({ email, timezone: 'America/Sao_Paulo', termsVersion: '1' })
      .expect(202);
    await ctx.http().post('/v1/auth/email/confirm').send({ email, code: REVIEW_CODE }).expect(400);
  });
});
