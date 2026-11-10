import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestContext } from './helpers.js';

describe('security headers', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('keeps the strict content security policy on every route (no inline scripts)', async () => {
    for (const path of ['/health', '/legal/terms', '/v1/me']) {
      const res = await ctx.http().get(path);
      const policy = String(res.headers['content-security-policy']);
      expect(policy, path).toContain("default-src 'self'");
      expect(policy, path).toContain("script-src 'self'");
      expect(policy, path).not.toContain("'unsafe-inline'; script-src");
      expect(policy.match(/script-src[^;]*/)?.[0], path).not.toContain('unsafe-inline');
    }
  });
});
