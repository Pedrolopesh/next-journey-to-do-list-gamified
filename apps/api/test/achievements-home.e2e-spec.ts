import { randomUUID } from 'node:crypto';

import { ACHIEVEMENT_CATALOG } from '@nextjourney/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AchievementsService } from '../src/modules/achievements/achievements.service.js';
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
    expect(unlocked(first.body)).toEqual(
      expect.arrayContaining(['primeiro-passo', 'habito-em-acao']),
    );
    const replay = await check(ctx, auth, item.id, checkId).expect(200);
    expect(replay.body).toEqual(first.body);
    const second = await check(ctx, auth, item.id).expect(200);
    expect(unlocked(second.body)).toEqual([]); // já ganha: não repete
    expect(
      await ctx.prisma.userAchievement.count({
        where: { userId: auth.user.id, achievementSlug: 'primeiro-passo' },
      }),
    ).toBe(1);
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

  it('Aprendiz (nível 5) volta com a classe e a insígnia do catálogo', async () => {
    reset();
    const auth = await registerUser(ctx);
    await ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { level: 4, expInLevel: 799, expTotal: 1800 }, // 4 -> 5 exige 800
    });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const res = await check(ctx, auth, item.id).expect(200);
    expect(res.body).toMatchObject({ leveledUp: true, level: 5 });
    expect(unlocked(res.body)).toContain('aprendiz');
    const entry = ACHIEVEMENT_CATALOG.find((a) => a.slug === 'aprendiz');
    expect(
      res.body.achievementsUnlocked.find((a: { slug: string }) => a.slug === 'aprendiz'),
    ).toEqual({ slug: 'aprendiz', name: 'Aprendiz', tier: entry?.tier, glyph: entry?.glyph });
    expect(JSON.stringify(res.body)).not.toContain('rewardKey');
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
    expect(unlocked(res.body)).toEqual(expect.arrayContaining(['maratonista', 'primeiro-passo']));
    // Organizado saiu ao criar o 10º item, antes do check
    expect(
      await ctx.prisma.userAchievement.count({
        where: { userId: auth.user.id, achievementSlug: 'organizado' },
      }),
    ).toBe(1);
    expect(
      res.body.achievementsUnlocked.find((a: { slug: string }) => a.slug === 'maratonista').tier,
    ).toBe(3);
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

  it('Chama de 7 dias: todos os diários agendados por 7 dias seguidos ', async () => {
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
  });

  it('GET /achievements: catálogo de 69 com progresso, estado e aviso pendente', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    await check(ctx, auth, item.id).expect(200);
    const res = await ctx
      .http()
      .get('/v1/achievements')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(res.body).toHaveLength(69);
    const marathon = res.body.find((a: { slug: string }) => a.slug === 'maratonista');
    expect(marathon).toMatchObject({ unlocked: false, progress: { current: 1, target: 100 } });
    expect(res.body.find((a: { slug: string }) => a.slug === 'primeiro-passo')).toMatchObject({
      unlocked: true,
      pending: true,
      progress: null,
    });
    expect(JSON.stringify(res.body)).not.toContain('rewardKey');
  });

  it('surpresa bloqueada não mostra a descrição; ao desbloquear, mostra', async () => {
    reset();
    const auth = await registerUser(ctx);
    const find = async () =>
      (
        await ctx.http().get('/v1/achievements').set('authorization', bearer(auth)).expect(200)
      ).body.find((a: { slug: string }) => a.slug === 'resgate');
    expect(await find()).toMatchObject({ secret: true, unlocked: false, description: null });
    await ctx.prisma.userAchievement.create({
      data: { userId: auth.user.id, achievementSlug: 'resgate' },
    });
    expect(await find()).toMatchObject({ unlocked: true });
    expect((await find()).description).toEqual(expect.any(String));
  });

  it('ack confirma o aviso só das conquistas do próprio usuário', async () => {
    reset();
    const a = await registerUser(ctx);
    const b = await registerUser(ctx);
    for (const auth of [a, b]) {
      const item = await createItem(ctx, auth, { type: 'habit' });
      await check(ctx, auth, item.id).expect(200);
    }
    await ctx
      .http()
      .post('/v1/achievements/ack')
      .set('authorization', bearer(a))
      .send({ slugs: ['primeiro-passo'] })
      .expect(204);
    const rowOf = (userId: string) =>
      ctx.prisma.userAchievement.findUniqueOrThrow({
        where: { userId_achievementSlug: { userId, achievementSlug: 'primeiro-passo' } },
      });
    expect((await rowOf(a.user.id)).notifiedAt).not.toBeNull();
    expect((await rowOf(b.user.id)).notifiedAt).toBeNull(); // o ack de A não toca em B
    await ctx
      .http()
      .post('/v1/achievements/ack')
      .set('authorization', bearer(a))
      .send({ slugs: [] })
      .expect(400);
  });

  it('criar itens, categoria e mudar o visual avaliam conquistas fora do check', async () => {
    reset();
    const auth = await registerUser(ctx);
    await createItem(ctx, auth, { type: 'daily', scheduleDays: [1] });
    await createItem(ctx, auth, { type: 'todo' });
    const has = async (slug: string) =>
      (await ctx.prisma.userAchievement.count({
        where: { userId: auth.user.id, achievementSlug: slug },
      })) === 1;
    expect(await has('diario-inaugural')).toBe(true);
    expect(await has('primeira-tarefa')).toBe(true);
    expect(await has('primeiro-passo')).toBe(false); // sem check ainda

    await ctx
      .http()
      .post('/v1/categories')
      .set('authorization', bearer(auth))
      .send({ name: 'Estudos', color: '#7c3aed' })
      .expect(201);
    expect(await has('do-meu-jeito')).toBe(true);

    const character = {
      name: 'Aria',
      title: 'Herói',
      skin: 'light',
      hair: 'short-brown',
      outfit: 'tunic-purple',
    };
    const put = (body: object) =>
      ctx.http().put('/v1/me/character').set('authorization', bearer(auth)).send(body).expect(200);
    await put(character); // primeiro cadastro não é mudança de visual
    expect(await has('cara-nova')).toBe(false);
    await put(character); // igual: nada muda
    expect(await has('cara-nova')).toBe(false);
    await put({ ...character, hair: 'long-black' });
    expect(await has('cara-nova')).toBe(true);
  });

  it('POST /me/events: lembrete ativado libera Hora marcada uma vez; tipo inválido é recusado', async () => {
    reset();
    const auth = await registerUser(ctx);
    await ctx
      .http()
      .post('/v1/me/events')
      .set('authorization', bearer(auth))
      .send({ type: 'unlock_everything' })
      .expect(400);
    for (let i = 0; i < 2; i += 1) {
      await ctx
        .http()
        .post('/v1/me/events')
        .set('authorization', bearer(auth))
        .send({ type: 'reminder_enabled' })
        .expect(204);
    }
    expect(
      await ctx.prisma.userAchievement.count({
        where: { userId: auth.user.id, achievementSlug: 'hora-marcada' },
      }),
    ).toBe(1);
  });

  it('coleção: a 5ª conquista libera Colecionador de medalhas na mesma passada', async () => {
    reset();
    const auth = await registerUser(ctx);
    for (const type of ['daily', 'todo', 'habit'] as const) {
      await createItem(ctx, auth, { type, scheduleDays: [1] });
    }
    const item = await createItem(ctx, auth, { type: 'habit' });
    const res = await check(ctx, auth, item.id).expect(200);
    expect(unlocked(res.body)).toContain('colecionador-de-medalhas');
  });

  it('retroativo: libera o que já cumpria, já avisado, e não repete', async () => {
    reset();
    const auth = await registerUser(ctx);
    await ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { totalChecks: 100, level: 5 },
    });
    const service = ctx.app.get(AchievementsService);
    expect(await service.backfillAll()).toBeGreaterThan(0);
    const rows = await ctx.prisma.userAchievement.findMany({ where: { userId: auth.user.id } });
    expect(rows.map((r) => r.achievementSlug)).toEqual(
      expect.arrayContaining(['primeiro-passo', 'maratonista', 'aprendiz']),
    );
    expect(rows.every((r) => r.notifiedAt !== null)).toBe(true);
    const again = await service.evaluateFor(auth.user.id, true);
    expect(again).toEqual([]);
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
      slug: 'beach',
      chapter: 1,
      expInLevel: 10,
      expForNextLevel: 200,
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
