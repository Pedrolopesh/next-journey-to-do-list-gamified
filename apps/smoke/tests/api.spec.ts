import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

import { authResponseSchema, dataExportSchema, meResponseSchema } from '@nextjourney/contracts';
import { expect, test } from '@playwright/test';

const JSON_HEADERS = { 'content-type': 'application/json' };

test.describe('public surface', () => {
  test('health reports the API and the database as up', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'ok',
      info: { database: { status: 'up' } },
    });
  });

  test('security headers are present and nothing leaks the framework', async ({ request }) => {
    const headers = (await request.get('/health')).headers();
    expect(headers['strict-transport-security']).toBeTruthy();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('validation rejects an empty login body', async ({ request }) => {
    const response = await request.post('/v1/auth/login', { headers: JSON_HEADERS, data: {} });
    expect(response.status()).toBe(400);
  });

  test('protected routes require a token', async ({ request }) => {
    expect((await request.get('/v1/me')).status()).toBe(401);
  });
});

// Needs a way to confirm the test account's email without opening an inbox. Without it, the whole
// account flow is skipped and nothing is created.
// SMOKE_CONFIRM_COMMAND is an executable that receives the email as its only argument.
const confirmCommand = process.env['SMOKE_CONFIRM_COMMAND'];

test.describe.serial('account lifecycle', () => {
  test.skip(!confirmCommand, 'set SMOKE_CONFIRM_COMMAND to run the account flow');

  const email = `smoke+${Date.now()}@example.invalid`;
  const password = `Smoke-${randomBytes(6).toString('hex')}-Aa1!`;
  let accessToken = '';
  let refreshToken = '';

  test.afterAll(async ({ playwright }, testInfo) => {
    if (!accessToken) return;
    const baseURL = testInfo.project.use.baseURL;
    const context = await playwright.request.newContext(baseURL ? { baseURL } : {});
    const response = await context.delete('/v1/me', {
      headers: { ...JSON_HEADERS, authorization: `Bearer ${accessToken}` },
      data: { password },
    });
    expect([200, 204]).toContain(response.status());
    await context.dispose();
  });

  test('sign-up sends a verification code', async ({ request }) => {
    const response = await request.post('/v1/auth/register', {
      headers: JSON_HEADERS,
      data: {
        name: 'Smoke',
        email,
        password,
        confirmPassword: password,
        acceptedTerms: true,
        termsVersion: '1',
        timezone: 'UTC',
      },
    });
    expect([200, 201, 202]).toContain(response.status());
    expect(await response.json()).toEqual({ status: 'verification_sent' });
  });

  test('login returns tokens that match the contract', async ({ request }) => {
    execFileSync(confirmCommand ?? '', [email], { stdio: 'ignore' });
    const response = await request.post('/v1/auth/login', {
      headers: JSON_HEADERS,
      data: { email, password },
    });
    expect([200, 201]).toContain(response.status());
    const body = authResponseSchema.parse(await response.json());
    accessToken = body.tokens.accessToken;
    refreshToken = body.tokens.refreshToken;
  });

  test('GET /v1/me matches the contract', async ({ request }) => {
    const response = await request.get('/v1/me', {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
    meResponseSchema.parse(await response.json());
  });

  test('refresh rotates the session', async ({ request }) => {
    const response = await request.post('/v1/auth/refresh', {
      headers: JSON_HEADERS,
      data: { refreshToken },
    });
    expect([200, 201]).toContain(response.status());
    const body = authResponseSchema.parse(await response.json());
    accessToken = body.tokens.accessToken;
  });

  test('data export matches the contract', async ({ request }) => {
    const response = await request.get('/v1/me/export', {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
    dataExportSchema.parse(await response.json());
  });
});
