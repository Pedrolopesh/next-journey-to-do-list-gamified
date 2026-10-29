import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { STARTER_ITEMS } from '../src/modules/items/starter-items.js';
import { StarterItemsService } from '../src/modules/items/starter-items.service.js';
import {
  bearer,
  check,
  createTestApp,
  FakeVerifier,
  PASSWORD,
  registerBody,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const TOTAL = STARTER_ITEMS.length;

describe('itens de exemplo criados pelo servidor', () => {
  let ctx: TestContext;
  const verifier = new FakeVerifier();
  beforeAll(async () => {
    ctx = await createTestApp({ verifier, seedStarterItems: true });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const itemsOf = (userId: string) => ctx.prisma.item.findMany({ where: { userId } });
  const social = (email: string) => {
    verifier.identity = {
      subject: `g-${email}`,
      email,
      emailVerified: true,
      name: 'Pessoa Social',
    };
    return ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '2026-10-01', timezone: 'America/Sao_Paulo' });
  };

  it('a confirmação do e-mail cria os exemplos, marcados como exemplo, na categoria padrão', async () => {
    const auth = await registerUser(ctx, uniqueEmail(), { story: false });
    const items = await itemsOf(auth.user.id);
    expect(items).toHaveLength(TOTAL);
    expect(items.every((item) => item.isExample)).toBe(true);
    const categories = await ctx.prisma.category.findMany({ where: { userId: auth.user.id } });
    const water = items.find((item) => item.title === 'Beber 2 litros de água');
    expect(categories.find((c) => c.id === water?.categoryId)?.name).toBe('Saúde');
    expect(water?.scheduleDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // Dia local do fuso do perfil (America/Sao_Paulo), não o de UTC
    expect(water?.createdOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const list = await ctx
      .http()
      .get('/v1/items?type=daily')
      .set('authorization', bearer(auth))
      .expect(200);
    expect((list.body as unknown[]).length).toBe(
      STARTER_ITEMS.filter((item) => item.type === 'daily').length,
    );
  });

  it('exemplo não conta como item criado nem libera conquista de criação', async () => {
    const auth = await registerUser(ctx);
    const stats = await ctx.prisma.userStats.findUniqueOrThrow({ where: { userId: auth.user.id } });
    expect(stats.itemsCreated).toBe(0);
    const unlocked = await ctx.prisma.userAchievement.findMany({ where: { userId: auth.user.id } });
    expect(unlocked).toEqual([]);
  });

  it('o primeiro check num exemplo libera só as conquistas por check', async () => {
    const auth = await registerUser(ctx);
    const habit = await ctx.prisma.item.findFirstOrThrow({
      where: { userId: auth.user.id, type: 'habit' },
    });
    await check(ctx, auth, habit.id).expect(200);
    const slugs = (
      await ctx.prisma.userAchievement.findMany({ where: { userId: auth.user.id } })
    ).map((row) => row.achievementSlug);
    expect(slugs).toContain('primeiro-passo');
    expect(slugs).not.toContain('primeiro-habito');
  });

  it('login social cria a conta já com os exemplos; o segundo acesso não duplica', async () => {
    const email = uniqueEmail('social');
    const first = await social(email).expect(200);
    expect(await itemsOf(first.body.user.id)).toHaveLength(TOTAL);
    await social(email).expect(200);
    expect(await itemsOf(first.body.user.id)).toHaveLength(TOTAL);
  });

  it('vínculo social a uma conta pendente a confirma e cria os exemplos uma única vez', async () => {
    const email = uniqueEmail();
    await ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);
    const res = await social(email).expect(200);
    expect(await itemsOf(res.body.user.id)).toHaveLength(TOTAL);
  });

  it('semear de novo na mesma conta não duplica os exemplos', async () => {
    const auth = await registerUser(ctx, uniqueEmail(), { story: false });
    const service = ctx.app.get(StarterItemsService);
    const created = await ctx.prisma.$transaction((tx) =>
      service.seed(tx, { userId: auth.user.id, timezone: 'UTC', now: ctx.clock.now() }),
    );
    expect(created).toBe(0);
    expect(await itemsOf(auth.user.id)).toHaveLength(TOTAL);
  });

  it('os exemplos voltam na ordem do catálogo', async () => {
    const auth = await registerUser(ctx, uniqueEmail(), { story: false });
    const list = await ctx
      .http()
      .get('/v1/items?type=daily')
      .set('authorization', bearer(auth))
      .expect(200);
    const titles = (list.body as { title: string }[]).map((item) => item.title);
    expect(titles).toEqual(
      STARTER_ITEMS.filter((item) => item.type === 'daily').map((item) => item.title),
    );
  });

  it('login por senha e vínculo social a conta existente não criam exemplos', async () => {
    const email = uniqueEmail();
    const auth = await registerUser(ctx, email, { story: false });
    await ctx.prisma.item.deleteMany({ where: { userId: auth.user.id } });
    await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email, password: PASSWORD }) // scan-allow: senha falsa de teste
      .expect(200);
    await social(email).expect(200);
    expect(await itemsOf(auth.user.id)).toHaveLength(0);
  });

  it('código errado não semeia e a conta segue pendente', async () => {
    const email = uniqueEmail();
    await ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);
    await ctx
      .http()
      .post('/v1/auth/verify-email')
      .send({ email, code: '000000', password: PASSWORD }) // scan-allow: senha falsa de teste
      .expect(400);
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerifiedAt).toBeNull();
    expect(await itemsOf(user.id)).toHaveLength(0);
  });

  it('falha ao criar os exemplos: a conta segue pendente e o mesmo código ainda vale', async () => {
    const email = uniqueEmail();
    await ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);
    const code = ctx.mailer.lastVerificationCode(email) ?? '';
    const body = { email, code, password: PASSWORD }; // scan-allow: senha falsa de teste
    const spy = vi
      .spyOn(ctx.app.get(StarterItemsService), 'seed')
      .mockRejectedValueOnce(new Error('falha simulada'));
    await ctx.http().post('/v1/auth/verify-email').send(body).expect(500);
    spy.mockRestore();
    const pending = await ctx.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(pending.emailVerifiedAt).toBeNull();
    expect(await itemsOf(pending.id)).toHaveLength(0);

    await ctx.http().post('/v1/auth/verify-email').send(body).expect(200);
    expect(await itemsOf(pending.id)).toHaveLength(TOTAL);
  });
});

describe('itens de exemplo com a opção desligada', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp({ seedStarterItems: false });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('a conta é confirmada sem nenhum exemplo', async () => {
    const auth = await registerUser(ctx, uniqueEmail(), { story: false });
    expect(await ctx.prisma.item.count({ where: { userId: auth.user.id } })).toBe(0);
  });
});
