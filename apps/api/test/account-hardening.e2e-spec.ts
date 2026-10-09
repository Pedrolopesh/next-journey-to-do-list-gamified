import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AccountService } from '../src/modules/account/account.service.js';
import {
  bearer,
  createItem,
  createTestApp,
  PASSWORD,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

describe('exclusão de conta', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('anonimiza na hora, encerra as sessões e libera o e-mail', async () => {
    const email = uniqueEmail('apagar');
    const auth = await registerUser(ctx, email);
    await createItem(ctx, auth, { type: 'habit', title: 'Beber água' });

    await ctx.http().delete('/v1/me').set('authorization', bearer(auth)).expect(204);

    const row = await ctx.prisma.user.findUniqueOrThrow({ where: { id: auth.user.id } });
    expect(row.deletedAt).not.toBeNull();
    expect(row.email).not.toBe(email);
    expect(row.name).toBe('Conta excluída');
    expect(row.passwordHash).toBeNull();

    // Login e renovação de sessão deixam de funcionar
    await ctx.http().post('/v1/auth/login').send({ email, password: PASSWORD }).expect(401);
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: auth.tokens.refreshToken })
      .expect(401);

    // O mesmo e-mail pode abrir uma conta nova
    const again = await registerUser(ctx, email);
    expect(again.user.id).not.toBe(auth.user.id);
  });

  it('o expurgo apaga de vez só o que passou do prazo de retenção', async () => {
    const old = await registerUser(ctx);
    const recent = await registerUser(ctx);
    await ctx.http().delete('/v1/me').set('authorization', bearer(old)).expect(204);
    await ctx.http().delete('/v1/me').set('authorization', bearer(recent)).expect(204);
    // 31 dias atrás para a conta antiga
    await ctx.prisma.user.update({
      where: { id: old.user.id },
      data: { deletedAt: new Date(ctx.clock.now().getTime() - 31 * 24 * 3600 * 1000) },
    });

    const removed = await ctx.app.get(AccountService).purgeExpired();

    expect(removed).toBeGreaterThanOrEqual(1);
    expect(await ctx.prisma.user.findUnique({ where: { id: old.user.id } })).toBeNull();
    expect(await ctx.prisma.item.count({ where: { userId: old.user.id } })).toBe(0);
    expect(await ctx.prisma.user.findUnique({ where: { id: recent.user.id } })).not.toBeNull();
  });

  it('exige autenticação', async () => {
    await ctx.http().delete('/v1/me').expect(401);
  });
});

describe('segurança da API', () => {
  it('manda headers do helmet e não anuncia o framework', async () => {
    const ctx = await createTestApp();
    const res = await ctx.http().get('/health').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    await ctx.app.close();
  });

  it('sem CORS_ORIGINS nenhuma origem web recebe permissão', async () => {
    const ctx = await createTestApp();
    const res = await ctx.http().get('/health').set('origin', 'https://outro.exemplo');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    await ctx.app.close();
  });

  it('limita as rotas de autenticação e responde 429 no excesso', async () => {
    const previous = process.env.THROTTLE_AUTH_LIMIT;
    process.env.THROTTLE_AUTH_LIMIT = '3';
    const ctx = await createTestApp();
    process.env.THROTTLE_AUTH_LIMIT = previous;
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 5; i++) {
        const res = await ctx
          .http()
          .post('/v1/auth/login')
          .send({ email: uniqueEmail(), password: PASSWORD });
        statuses.push(res.status);
      }
      expect(statuses.slice(0, 3)).toEqual([401, 401, 401]);
      expect(statuses.slice(3)).toEqual([429, 429]);
      // Rotas fora de auth seguem no limite geral, bem mais folgado
      await ctx.http().get('/health').expect(200);
    } finally {
      await ctx.app.close();
    }
  });
});
