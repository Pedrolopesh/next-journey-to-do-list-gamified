import { spawnSync } from 'node:child_process';
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

  test('security headers appear exactly once and nothing leaks the framework', async ({
    request,
  }) => {
    const response = await request.get('/health');
    const count = (name: string): number =>
      response.headersArray().filter((header) => header.name.toLowerCase() === name).length;
    expect(count('strict-transport-security')).toBe(1);
    expect(count('x-content-type-options')).toBe(1);
    expect(count('referrer-policy')).toBe(1);
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(count('x-powered-by')).toBe(0);
  });

  test('validation rejects an empty email-start body', async ({ request }) => {
    const response = await request.post('/v1/auth/email/start', {
      headers: JSON_HEADERS,
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test('protected routes require a token', async ({ request }) => {
    expect((await request.get('/v1/me')).status()).toBe(401);
  });
});

// Needs a way to store a known login code for the test account without opening an inbox. Without
// it, the whole account flow is skipped and nothing is created.
// SMOKE_CODE_COMMAND is a shell command that receives the email and a 6-digit code as its last two
// arguments and must make that code the valid login code of the account (see runbooks/deploy.md).
const codeCommand = process.env['SMOKE_CODE_COMMAND'];

test.describe.serial('account lifecycle', () => {
  test.skip(!codeCommand, 'set SMOKE_CODE_COMMAND to run the account flow');

  const email = `smoke+${Date.now()}@example.invalid`;
  const knownCode = String(100000 + (randomBytes(4).readUInt32BE() % 900000));
  let started = false;
  let accessToken = '';
  let refreshToken = '';

  // Always tries to delete the account, even when an earlier step failed.
  test.afterAll(async ({ playwright }, testInfo) => {
    if (!started) return;
    const baseURL = testInfo.project.use.baseURL;
    const context = await playwright.request.newContext(baseURL ? { baseURL } : {});
    if (accessToken) {
      // The login consumed the code; the deletion needs a fresh one
      const stored = spawnSync(
        '/bin/sh',
        ['-c', `${codeCommand ?? ''} "$1" "$2"`, 'code', email, knownCode],
        { encoding: 'utf8' },
      );
      expect(stored.status, stored.stderr).toBe(0);
      const response = await context.delete('/v1/me', {
        headers: { ...JSON_HEADERS, authorization: `Bearer ${accessToken}` },
        data: { emailCode: knownCode },
      });
      expect([200, 204]).toContain(response.status());
    } else {
      process.stderr.write(
        `The smoke test account could not be deleted and was left behind: ${email}\n`,
      );
    }
    await context.dispose();
  });

  test('asking for the code answers 202 and creates the pending account', async ({ request }) => {
    const response = await request.post('/v1/auth/email/start', {
      headers: JSON_HEADERS,
      data: { email, termsVersion: '1', timezone: 'UTC' },
    });
    started = true;
    expect(response.status()).toBe(202);
  });

  test('the code command stores a known code for the account', () => {
    const result = spawnSync(
      '/bin/sh',
      ['-c', `${codeCommand ?? ''} "$1" "$2"`, 'code', email, knownCode],
      { encoding: 'utf8' },
    );
    expect(result.status, result.stderr).toBe(0);
  });

  test('confirming the code returns tokens that match the contract', async ({ request }) => {
    const response = await request.post('/v1/auth/email/confirm', {
      headers: JSON_HEADERS,
      data: { email, code: knownCode },
    });
    expect([200, 201]).toContain(response.status());
    const body = authResponseSchema.parse(await response.json());
    accessToken = body.tokens.accessToken;
    refreshToken = body.tokens.refreshToken;
  });

  test('the legacy password login is gone', async ({ request }) => {
    const response = await request.post('/v1/auth/login', {
      headers: JSON_HEADERS,
      data: { email, password: 'irrelevant' }, // scan-allow: test data
    });
    expect(response.status()).toBe(404);
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
