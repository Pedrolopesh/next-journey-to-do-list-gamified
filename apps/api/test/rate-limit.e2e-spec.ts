import { createHash } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { LIMITS, RateLimitService } from '../src/modules/auth/rate-limit.service.js';
import {
  createTestApp,
  PASSWORD,
  registerBody,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const WRONG = 'Errada#1234'; // scan-allow: senha falsa de teste

describe('limite de tentativas por e-mail', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const login = (email: string, password: string) =>
    ctx.http().post('/v1/auth/login').send({ email, password });
  const later = (ms: number) =>
    ctx.clock.set(new Date(ctx.clock.now().getTime() + ms).toISOString());

  it('login: a 6ª tentativa no mesmo e-mail e IP é 429, mesmo com a senha certa', async () => {
    const email = (await registerUser(ctx)).user.email;
    for (let i = 0; i < LIMITS.login.perEmailAndIp.limit; i += 1) {
      await login(email, WRONG).expect(401);
    }
    const blocked = await login(email, PASSWORD).expect(429); // scan-allow: senha falsa
    expect(blocked.body.code).toBe('RATE_LIMITED');
    expect(blocked.body.details.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('o excesso responde igual para conta existente e inexistente (sem enumeração)', async () => {
    const known = (await registerUser(ctx)).user.email;
    const unknown = uniqueEmail('naoexiste');
    const statuses: Record<string, number[]> = { known: [], unknown: [] };
    for (let i = 0; i < LIMITS.login.perEmailAndIp.limit + 2; i += 1) {
      statuses.known!.push((await login(known, WRONG)).status);
      statuses.unknown!.push((await login(unknown, WRONG)).status);
    }
    expect(statuses.known).toEqual(statuses.unknown);
    expect(statuses.known!.at(-1)).toBe(429);
  });

  it('login certo zera as senhas erradas daquele e-mail e IP', async () => {
    const email = (await registerUser(ctx)).user.email;
    for (let i = 0; i < LIMITS.login.perEmailAndIp.limit - 1; i += 1) {
      await login(email, WRONG).expect(401);
    }
    await login(email, PASSWORD).expect(200); // scan-allow: senha falsa
    for (let i = 0; i < LIMITS.login.perEmailAndIp.limit - 1; i += 1) {
      await login(email, WRONG).expect(401);
    }
  });

  it('a janela passa e o login volta a funcionar', async () => {
    const email = (await registerUser(ctx)).user.email;
    for (let i = 0; i < LIMITS.login.perEmailAndIp.limit; i += 1) await login(email, WRONG);
    await login(email, PASSWORD).expect(429); // scan-allow: senha falsa
    later(LIMITS.login.perEmailAndIp.windowMs + 1000);
    await login(email, PASSWORD).expect(200); // scan-allow: senha falsa
  });

  it('teto só por e-mail vale para ataque vindo de IPs diferentes', async () => {
    const service = ctx.app.get(RateLimitService);
    const email = uniqueEmail('distribuido');
    for (let i = 0; i < LIMITS.login.perEmail.limit; i += 1) {
      await service.hit('login:email', email, LIMITS.login.perEmail);
    }
    await expect(service.hit('login:email', email, LIMITS.login.perEmail)).rejects.toMatchObject({
      status: 429,
    });
    // Outro e-mail não é afetado
    await service.hit('login:email', uniqueEmail('outro'), LIMITS.login.perEmail);
  });

  it('esqueci a senha: a 4ª em 15 minutos é 429 para qualquer e-mail', async () => {
    const known = (await registerUser(ctx)).user.email;
    const unknown = uniqueEmail('naoexiste');
    for (const email of [known, unknown]) {
      for (let i = 0; i < LIMITS.forgotPassword.perEmailAndIp.limit; i += 1) {
        await ctx.http().post('/v1/auth/forgot-password').send({ email }).expect(202);
      }
      const res = await ctx.http().post('/v1/auth/forgot-password').send({ email }).expect(429);
      expect(res.body.code).toBe('RATE_LIMITED');
    }
  });

  it('cadastro: limite por e-mail e mesma resposta com conta existente', async () => {
    const email = (await registerUser(ctx)).user.email; // já consumiu 1 do cadastro
    for (let i = 1; i < LIMITS.register.perEmailAndIp.limit; i += 1) {
      await ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);
    }
    await ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(429);
  });

  it('quem abusa trava só a si mesmo: outro IP ainda consegue pedir a recuperação', async () => {
    const service = ctx.app.get(RateLimitService);
    const email = uniqueEmail('vitima');
    // O atacante (IP A) esgota o limite dele
    for (let i = 0; i < LIMITS.forgotPassword.perEmailAndIp.limit; i += 1) {
      await service.hitBoth('forgot-password', email, '203.0.113.1', LIMITS.forgotPassword);
    }
    await expect(
      service.hitBoth('forgot-password', email, '203.0.113.1', LIMITS.forgotPassword),
    ).rejects.toMatchObject({ status: 429 });
    // A dona (IP B) não é afetada
    await service.hitBoth('forgot-password', email, '203.0.113.2', LIMITS.forgotPassword);
  });

  it('a tabela guarda só hash: nem e-mail nem IP em texto', async () => {
    const email = (await registerUser(ctx)).user.email;
    await login(email, WRONG);
    const expectedKey = createHash('sha256').update(`login:email:${email}`).digest('hex');
    const row = await ctx.prisma.rateLimit.findUnique({ where: { key: expectedKey } });
    expect(row?.count).toBe(1);
    const mine = await ctx.prisma.rateLimit.findMany({
      where: { windowStart: { gte: row!.windowStart } },
    });
    const dump = JSON.stringify(mine);
    expect(dump).not.toContain(email);
    expect(dump).not.toContain('127.0.0.1');
  });
});
