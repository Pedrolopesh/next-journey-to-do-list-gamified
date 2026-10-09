import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bearer,
  check,
  createItem,
  createTestApp,
  firstCategoryId,
  NOON_09,
  registerUser,
  type TestContext,
} from './helpers.js';

describe('conquistas e home', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  const reset = (): void => ctx.clock.set(NOON_09);
  const unlocked = (body: { achievementsUnlocked: { slug: string }[] }): string[] =>
    body.achievementsUnlocked.map((a) => a.slug);

  it('o primeiro check libera Primeiro passo uma única vez, e repetir o checkId devolve o mesmo resultado', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const checkId = randomUUID();
    const first = await check(ctx, auth, item.id, checkId).expect(200);
    expect(unlocked(first.body)).toEqual(['primeiro-passo']);
    const replay = await check(ctx, auth, item.id, checkId).expect(200);
    expect(replay.body).toEqual(first.body);
    const second = await check(ctx, auth, item.id).expect(200);
    expect(unlocked(second.body)).toEqual([]); // já ganha: não repete
    expect(await ctx.prisma.userAchievement.count({ where: { userId: auth.user.id } })).toBe(1);
  });

  it('desmarcar não remove a conquista já ganha', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit' });
    const checkId = randomUUID();
    await check(ctx, auth, item.id, checkId).expect(200);
    await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(200);
    const list = await ctx
      .http()
      .get('/v1/achievements')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(list.body.find((a: { slug: string }) => a.slug === 'primeiro-passo').unlocked).toBe(
      true,
    );
  });

  it('Aprendiz (nível 5) libera o cosmético, que passa a poder ser usado no personagem', async () => {
    reset();
    const auth = await registerUser(ctx);
    await ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { level: 4, expInLevel: 274, expTotal: 600 }, // 4 -> 5 exige 275
    });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const res = await check(ctx, auth, item.id).expect(200);
    expect(res.body).toMatchObject({ leveledUp: true, level: 5 });
    expect(unlocked(res.body)).toContain('aprendiz');
    expect(
      res.body.achievementsUnlocked.find((a: { slug: string }) => a.slug === 'aprendiz').rewardKey,
    ).toBe('weapon-silver-sword');

    const cosmetics = await ctx
      .http()
      .get('/v1/me/cosmetics')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(cosmetics.body.cosmetics).toContain('weapon-silver-sword');
    await ctx
      .http()
      .put('/v1/me/character')
      .set('authorization', bearer(auth))
      .send({
        name: 'Aria',
        title: 'Herói',
        skin: 'light',
        hair: 'short-brown',
        outfit: 'tunic-purple',
        accessory: 'weapon-silver-sword',
      })
      .expect(200);
  });

  it('Maratonista no 100º check e Organizado com 10 itens criados', async () => {
    reset();
    const auth = await registerUser(ctx);
    for (let i = 0; i < 9; i += 1) await createItem(ctx, auth, { type: 'habit' });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' }); // 10º item
    await ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { totalChecks: 99 },
    });
    const res = await check(ctx, auth, item.id).expect(200);
    expect(unlocked(res.body)).toEqual(
      expect.arrayContaining(['maratonista', 'organizado', 'primeiro-passo']),
    );
    expect(
      res.body.achievementsUnlocked.find((a: { slug: string }) => a.slug === 'maratonista')
        .rewardKey,
    ).toBe('accessory-bandana');
  });

  it('Madrugador: check antes das 07h no fuso do perfil (06:59 sim, 07:00 não)', async () => {
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    ctx.clock.set('2026-10-09T10:00:00Z'); // 07:00 em Sao_Paulo
    const tarde = await check(ctx, auth, item.id).expect(200);
    expect(unlocked(tarde.body)).not.toContain('madrugador');
    ctx.clock.set('2026-10-09T09:59:00Z'); // 06:59
    const cedo = await check(ctx, auth, item.id).expect(200);
    expect(unlocked(cedo.body)).toContain('madrugador');
  });

  it('Equilíbrio: checks em 3 categorias diferentes no mesmo dia', async () => {
    reset();
    const auth = await registerUser(ctx);
    const categories = (await ctx.http().get('/v1/categories').set('authorization', bearer(auth)))
      .body;
    const items = [];
    for (const category of categories.slice(0, 3)) {
      items.push(
        await createItem(ctx, auth, { type: 'habit', difficulty: 'easy', categoryId: category.id }),
      );
    }
    const [first, second, third] = items as unknown as [
      { id: string },
      { id: string },
      { id: string },
    ];
    const r1 = await check(ctx, auth, first.id).expect(200);
    const r2 = await check(ctx, auth, second.id).expect(200);
    expect(unlocked(r1.body)).not.toContain('equilibrio');
    expect(unlocked(r2.body)).not.toContain('equilibrio');
    const r3 = await check(ctx, auth, third.id).expect(200);
    expect(unlocked(r3.body)).toContain('equilibrio');
  });

  it('Chama de 7 dias: todos os diários agendados por 7 dias seguidos libera a roupa especial', async () => {
    const auth = await registerUser(ctx);
    const daily = await createItem(ctx, auth, {
      type: 'daily',
      scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    });
    let last: { achievementsUnlocked: { slug: string }[] } = { achievementsUnlocked: [] };
    for (let day = 3; day <= 9; day += 1) {
      ctx.clock.set(`2026-10-0${day}T15:00:00Z`);
      // o diário foi criado em 09/10 (relógio no momento da criação); recria a data de criação
      if (day === 3) {
        await ctx.prisma.item.update({
          where: { id: daily.id },
          data: { createdOn: '2026-10-03' },
        });
      }
      last = (await check(ctx, auth, daily.id).expect(200)).body;
      if (day < 9) expect(unlocked(last)).not.toContain('chama-7-dias');
    }
    expect(unlocked(last)).toContain('chama-7-dias');
    const cosmetics = await ctx
      .http()
      .get('/v1/me/cosmetics')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(cosmetics.body.cosmetics).toContain('outfit-special');
  });

  it('GET /achievements: catálogo de 10 com progresso e estado', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    await check(ctx, auth, item.id).expect(200);
    const res = await ctx
      .http()
      .get('/v1/achievements')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(res.body).toHaveLength(10);
    const marathon = res.body.find((a: { slug: string }) => a.slug === 'maratonista');
    expect(marathon).toMatchObject({ unlocked: false, progress: { current: 1, target: 100 } });
    expect(res.body.find((a: { slug: string }) => a.slug === 'primeiro-passo')).toMatchObject({
      unlocked: true,
      progress: null,
    });
  });

  it('GET /home: contadores, história ativa e itens "Para hoje"', async () => {
    reset();
    const auth = await registerUser(ctx);
    await createItem(ctx, auth, {
      type: 'daily',
      scheduleDays: [0, 1, 2, 3, 4, 5, 6],
      title: 'Treinar',
    });
    const done = await createItem(ctx, auth, {
      type: 'daily',
      scheduleDays: [0, 1, 2, 3, 4, 5, 6],
      title: 'Meditar',
    });
    await createItem(ctx, auth, { type: 'todo', title: 'Hoje', dueAt: '2026-10-09T20:00:00Z' });
    await createItem(ctx, auth, { type: 'todo', title: 'Atrasada', dueAt: '2026-10-07T12:00:00Z' });
    await createItem(ctx, auth, { type: 'todo', title: 'Futura', dueAt: '2026-10-30T12:00:00Z' });
    await check(ctx, auth, done.id).expect(200);

    const res = await ctx.http().get('/v1/home').set('authorization', bearer(auth)).expect(200);
    expect(res.body.counters).toEqual({ pendingDailies: 1, pendingTasks: 3, bestStreak: 1 });
    expect(res.body.story).toMatchObject({
      slug: 'empreendedor',
      chapter: 1,
      checksInChapter: 1,
      requiredChecks: 10,
    });
    const titles = res.body.today.map((i: { title: string }) => i.title).sort();
    expect(titles).toEqual(['Atrasada', 'Hoje', 'Treinar']); // Futura e o diário já feito ficam de fora
  });

  it('a Home de um usuário não mistura itens de outro', async () => {
    reset();
    const a = await registerUser(ctx);
    const b = await registerUser(ctx);
    await createItem(ctx, a, { type: 'daily', scheduleDays: [0, 1, 2, 3, 4, 5, 6] });
    const res = await ctx.http().get('/v1/home').set('authorization', bearer(b)).expect(200);
    expect(res.body.counters).toEqual({ pendingDailies: 0, pendingTasks: 0, bestStreak: 0 });
    expect(res.body.today).toEqual([]);
    expect(await firstCategoryId(ctx, b.user.id)).toBeTruthy();
  });
});
