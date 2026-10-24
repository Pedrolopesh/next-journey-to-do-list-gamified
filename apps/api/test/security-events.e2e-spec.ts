import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { SecurityEvents } from '../src/modules/security/security-events.service.js';
import { createTestApp, PASSWORD, registerUser, type TestContext } from './helpers.js';

const WRONG = 'Errada#1234'; // scan-allow: senha falsa de teste

describe('eventos de segurança nos fluxos reais', () => {
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

  it('login falho, recuperação pedida e concluída, reuso do refresh e limite deixam rastro', async () => {
    const auth = await registerUser(ctx);
    const { email } = auth.user;
    const mark = calls().length;

    await ctx.http().post('/v1/auth/login').send({ email, password: WRONG }).expect(401);
    await ctx.http().post('/v1/auth/forgot-password').send({ email }).expect(202);
    const token = ctx.mailer.lastResetToken(email) ?? '';
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token, newPassword: 'Outra#9876' }) // scan-allow: senha falsa de teste
      .expect(204);
    // Reuso do refresh token: o 1º já foi derrubado pelo reset; uma conta nova mostra o reuso de verdade
    const other = await registerUser(ctx);
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: other.tokens.refreshToken })
      .expect(200);
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: other.tokens.refreshToken })
      .expect(401);

    const types = typesSince(mark);
    expect(types).toEqual(
      expect.arrayContaining([
        'login_failed',
        'password_reset_requested',
        'password_reset_completed',
        'refresh_reuse_detected',
      ]),
    );
  });

  it('exclusão: prova recusada e conta excluída deixam rastro', async () => {
    const auth = await registerUser(ctx);
    const mark = calls().length;
    await ctx
      .http()
      .delete('/v1/me')
      .set('authorization', `Bearer ${auth.tokens.accessToken}`)
      .send({ password: WRONG })
      .expect(403);
    await ctx
      .http()
      .delete('/v1/me')
      .set('authorization', `Bearer ${auth.tokens.accessToken}`)
      .send({ password: PASSWORD }) // scan-allow: senha falsa de teste
      .expect(204);
    expect(typesSince(mark)).toEqual(['reauth_failed', 'account_deleted']);
    expect(
      calls()
        .slice(mark)
        .every((call) => (call[1] as { userId?: string }).userId === auth.user.id),
    ).toBe(true);
  });

  it('o limite de tentativas gera o evento rate_limited', async () => {
    const { email } = (await registerUser(ctx)).user;
    const mark = calls().length;
    for (let i = 0; i < 6; i += 1) {
      await ctx.http().post('/v1/auth/login').send({ email, password: WRONG });
    }
    expect(typesSince(mark)).toContain('rate_limited');
  });

  it('nenhum evento carrega e-mail, senha ou token', async () => {
    const auth = await registerUser(ctx);
    await ctx.http().post('/v1/auth/login').send({ email: auth.user.email, password: WRONG });
    const logged = dump();
    expect(logged).not.toContain(auth.user.email);
    expect(logged).not.toContain(WRONG);
    expect(logged).not.toContain(PASSWORD);
    expect(logged).not.toContain(auth.tokens.refreshToken);
    expect(logged).not.toContain(auth.tokens.accessToken);
    // O IP chega mascarado ao log; aqui conferimos que o contexto traz só campos conhecidos
    for (const call of calls()) {
      expect(
        Object.keys(call[1] ?? {}).every((key) => ['userId', 'ip', 'scope'].includes(key)),
      ).toBe(true);
    }
  });
});
