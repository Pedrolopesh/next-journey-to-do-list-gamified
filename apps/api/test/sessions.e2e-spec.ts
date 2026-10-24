import { randomUUID } from 'node:crypto';

import type { AuthResponse, Session } from '@nextjourney/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createTestApp, PASSWORD, registerUser, type TestContext } from './helpers.js';

describe('sessões da conta', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const loginAs = async (email: string, device?: string): Promise<AuthResponse> => {
    let request = ctx.http().post('/v1/auth/login');
    if (device !== undefined) request = request.set('x-device-name', encodeURIComponent(device));
    const res = await request.send({ email, password: PASSWORD }).expect(200); // scan-allow: senha falsa
    return res.body as AuthResponse;
  };
  const list = async (auth: AuthResponse): Promise<Session[]> =>
    (await ctx.http().get('/v1/me/sessions').set('authorization', bearer(auth)).expect(200)).body
      .sessions as Session[];
  const later = (ms: number) =>
    ctx.clock.set(new Date(ctx.clock.now().getTime() + ms).toISOString());

  it('lista um item por aparelho, com o nome e só o atual marcado', async () => {
    const first = await registerUser(ctx);
    const phone = await loginAs(first.user.email, 'Pixel 8');
    const tablet = await loginAs(first.user.email, 'Tablet da sala');

    const sessions = await list(phone);
    expect(sessions.map((s) => s.deviceName).sort()).toEqual(
      ['Aparelho desconhecido', 'Pixel 8', 'Tablet da sala'].sort(),
    );
    expect(sessions.filter((s) => s.current).map((s) => s.deviceName)).toEqual(['Pixel 8']);
    expect((await list(tablet)).find((s) => s.current)?.deviceName).toBe('Tablet da sala');
    // Nada de segredo na resposta
    expect(JSON.stringify(sessions)).not.toMatch(/token|hash|secret/i);
  });

  it('nome do aparelho vem limpo e limitado; lixo vira o nome padrão', async () => {
    const first = await registerUser(ctx);
    const long = await loginAs(first.user.email, `${'a'.repeat(200)}`);
    const control = await loginAs(first.user.email, 'Linha\tcom   espaços');
    const names = (await list(long)).map((s) => s.deviceName);
    expect(names).toContain('a'.repeat(80));
    expect(names).toContain('Linha com espaços');
    // Nenhuma das sessões ficou com o nome cru
    expect(names.every((name) => name.length <= 80 && !/[\t\n\r]/.test(name))).toBe(true);
    expect(control.tokens.refreshToken).toBeTruthy();
  });

  it('a renovação mantém a mesma sessão e atualiza o último uso', async () => {
    const first = await registerUser(ctx);
    const device = await loginAs(first.user.email, 'Aparelho renovado');
    const before = (await list(device)).find((s) => s.current)!;
    later(60_000);
    const renewed = await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: device.tokens.refreshToken })
      .expect(200);
    const after = await list(renewed.body as AuthResponse);
    expect(after.filter((s) => s.deviceName === 'Aparelho renovado')).toHaveLength(1);
    const current = after.find((s) => s.current)!;
    expect(current.id).toBe(before.id);
    expect(current.createdAt).toBe(before.createdAt);
    expect(new Date(current.lastUsedAt).getTime()).toBeGreaterThan(
      new Date(before.lastUsedAt).getTime(),
    );
  });

  it('encerrar outro aparelho derruba só o refresh dele', async () => {
    const first = await registerUser(ctx);
    const keep = await loginAs(first.user.email, 'Fica');
    const drop = await loginAs(first.user.email, 'Sai');
    const target = (await list(keep)).find((s) => s.deviceName === 'Sai')!;

    await ctx
      .http()
      .delete(`/v1/me/sessions/${target.id}`)
      .set('authorization', bearer(keep))
      .expect(204);

    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: drop.tokens.refreshToken })
      .expect(401);
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: keep.tokens.refreshToken })
      .expect(200);
    // Encerrar de novo a mesma sessão: já não existe
    await ctx
      .http()
      .delete(`/v1/me/sessions/${target.id}`)
      .set('authorization', bearer(keep))
      .expect(404);
  });

  it('encerrar a sessão atual funciona como logout', async () => {
    const first = await registerUser(ctx);
    const only = await loginAs(first.user.email, 'Atual');
    const current = (await list(only)).find((s) => s.current)!;
    await ctx
      .http()
      .delete(`/v1/me/sessions/${current.id}`)
      .set('authorization', bearer(only))
      .expect(204);
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: only.tokens.refreshToken })
      .expect(401);
  });

  it('não vê nem encerra sessão de outra conta (IDOR)', async () => {
    const mine = await registerUser(ctx);
    const theirs = await registerUser(ctx);
    const theirSession = (await list(theirs))[0]!;

    expect((await list(mine)).map((s) => s.id)).not.toContain(theirSession.id);
    const res = await ctx
      .http()
      .delete(`/v1/me/sessions/${theirSession.id}`)
      .set('authorization', bearer(mine))
      .expect(404);
    expect(res.body.code).toBe('NOT_FOUND');
    // A sessão da outra pessoa continua viva
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: theirs.tokens.refreshToken })
      .expect(200);
    // Id inventado ou malformado
    await ctx
      .http()
      .delete(`/v1/me/sessions/${randomUUID()}`)
      .set('authorization', bearer(mine))
      .expect(404);
    await ctx
      .http()
      .delete('/v1/me/sessions/nao-e-uuid')
      .set('authorization', bearer(mine))
      .expect(400);
  });

  it('sair de todos os aparelhos encerra todas as sessões', async () => {
    const first = await registerUser(ctx);
    const a = await loginAs(first.user.email, 'A');
    const b = await loginAs(first.user.email, 'B');
    await ctx.http().delete('/v1/me/sessions').set('authorization', bearer(a)).expect(204);
    for (const auth of [first, a, b]) {
      await ctx
        .http()
        .post('/v1/auth/refresh')
        .send({ refreshToken: auth.tokens.refreshToken })
        .expect(401);
    }
    expect(await list(a)).toEqual([]);
  });

  it('exige autenticação', async () => {
    await ctx.http().get('/v1/me/sessions').expect(401);
    await ctx.http().delete('/v1/me/sessions').expect(401);
  });
});
