import { authResponseSchema, meResponseSchema } from '@nextjourney/contracts';
import { expect, test } from '@playwright/test';

import { openInbox } from './support/temp-mail';

const JSON_HEADERS = { 'content-type': 'application/json' };

// Real delivery check: the API sends the sign-in code through the mail provider to a throwaway
// inbox, and the test reads it from there. It creates a real account in the target environment and
// deletes it at the end. Opt-in, because it depends on a third-party temporary mail service.
test.describe.serial('real email sign-in', () => {
  test.skip(!process.env['SMOKE_REAL_EMAIL'], 'set SMOKE_REAL_EMAIL=1 to run the real email flow');
  test.setTimeout(360_000);

  // The API sends at most one code per address every 60 seconds
  const RESEND_INTERVAL_MS = 61_000;
  let firstSentAt = 0;
  let accessToken = '';
  let inboxAddress = '';
  let inbox: Awaited<ReturnType<typeof openInbox>>;

  test('the sign-in code arrives by email and opens a session', async ({ request }) => {
    inbox = await openInbox();
    inboxAddress = inbox.address;
    const start = await request.post('/v1/auth/email/start', {
      headers: JSON_HEADERS,
      data: { email: inboxAddress, termsVersion: '1', timezone: 'UTC' },
    });
    firstSentAt = Date.now();
    expect(start.status()).toBe(202);

    const code = await inbox.nextCode();
    const confirm = await request.post('/v1/auth/email/confirm', {
      headers: JSON_HEADERS,
      data: { email: inboxAddress, code },
    });
    expect([200, 201]).toContain(confirm.status());
    accessToken = authResponseSchema.parse(await confirm.json()).tokens.accessToken;

    const me = await request.get('/v1/me', { headers: { authorization: `Bearer ${accessToken}` } });
    expect(me.status()).toBe(200);
    meResponseSchema.parse(await me.json());
  });

  // The deletion asks for a fresh code, which also goes by email
  test.afterAll(async ({ playwright }, testInfo) => {
    test.setTimeout(240_000);
    if (!accessToken) return;
    const wait = firstSentAt + RESEND_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    const baseURL = testInfo.project.use.baseURL;
    const context = await playwright.request.newContext(baseURL ? { baseURL } : {});
    await context.post('/v1/auth/email/start', {
      headers: JSON_HEADERS,
      data: { email: inboxAddress, termsVersion: '1', timezone: 'UTC' },
    });
    const code = await inbox.nextCode();
    const response = await context.delete('/v1/me', {
      headers: { ...JSON_HEADERS, authorization: `Bearer ${accessToken}` },
      data: { emailCode: code },
    });
    expect([200, 204]).toContain(response.status());
    await context.dispose();
  });
});
