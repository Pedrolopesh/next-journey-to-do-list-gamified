import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { SecurityEvents } from '../src/modules/security/security-events.service.js';
import {
  createTestApp,
  registerUser,
  requestCode,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const WRONG = '000000';

describe('security events in the real flows', () => {
  let ctx: TestContext;
  let record: ReturnType<typeof vi.spyOn>;
  beforeAll(async () => {
    ctx = await createTestApp();
    record = vi.spyOn(ctx.app.get(SecurityEvents), 'record');
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const calls = (): [string, object?][] => record.mock.calls;
  const typesSince = (mark: number): string[] =>
    calls()
      .slice(mark)
      .map((call) => call[0]);
  const dump = (): string => JSON.stringify(calls());

  it('refresh token reuse leaves a trace', async () => {
    const auth = await registerUser(ctx);
    const mark = calls().length;
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: auth.tokens.refreshToken })
      .expect(200);
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: auth.tokens.refreshToken })
      .expect(401);
    expect(typesSince(mark)).toContain('refresh_reuse_detected');
  });

  it('deletion: a refused proof and a deleted account leave a trace', async () => {
    const auth = await registerUser(ctx);
    const emailCode = await requestCode(ctx, auth.user.email);
    const mark = calls().length;
    await ctx
      .http()
      .delete('/v1/me')
      .set('authorization', `Bearer ${auth.tokens.accessToken}`)
      .send({ emailCode: WRONG })
      .expect(403);
    await ctx
      .http()
      .delete('/v1/me')
      .set('authorization', `Bearer ${auth.tokens.accessToken}`)
      .send({ emailCode })
      .expect(204);
    expect(typesSince(mark)).toEqual(['reauth_failed', 'account_deleted']);
    expect(
      calls()
        .slice(mark)
        .every((call) => (call[1] as { userId?: string }).userId === auth.user.id),
    ).toBe(true);
  });

  it('the attempt limit generates the rate_limited event', async () => {
    const email = uniqueEmail();
    const mark = calls().length;
    for (let i = 0; i < 11; i += 1) {
      await ctx.http().post('/v1/auth/email/start').send({ email });
    }
    expect(typesSince(mark)).toContain('rate_limited');
  });

  it('no event carries an email, password or token', async () => {
    const auth = await registerUser(ctx);
    await requestCode(ctx, auth.user.email);
    await ctx
      .http()
      .delete('/v1/me')
      .set('authorization', `Bearer ${auth.tokens.accessToken}`)
      .send({ emailCode: WRONG })
      .expect(403);
    const logged = dump();
    expect(logged).not.toContain(auth.user.email);
    expect(logged).not.toContain(WRONG);
    expect(logged).not.toContain(auth.tokens.refreshToken);
    expect(logged).not.toContain(auth.tokens.accessToken);
    // The IP reaches the log masked; here we check that the context carries only known fields
    for (const call of calls()) {
      expect(
        Object.keys(call[1] ?? {}).every((key) => ['userId', 'ip', 'scope'].includes(key)),
      ).toBe(true);
    }
  });
});
