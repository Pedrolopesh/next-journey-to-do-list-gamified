import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bearer,
  check,
  createItem,
  createTestApp,
  firstCategoryId,
  me,
  NOON_09,
  registerUser,
  type TestContext,
} from './helpers.js';

describe('itens e check', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  const reset = (): void => ctx.clock.set(NOON_09);

  it('check rende EXP e moedas pela dificuldade e atualiza o estado', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'hard' });
    const res = await check(ctx, auth, item.id).expect(200);
    expect(res.body).toMatchObject({ expGained: 20, coinsGained: 4, level: 1, leveledUp: false });
    const state = await me(ctx, auth);
    expect(state.player).toMatchObject({ expTotal: 20, coins: 4, totalChecks: 1 });
    expect(state.player.story.checksInChapter).toBe(1);
  });

  it('IDEMPOTENTE: repetir o mesmo checkId devolve o mesmo resultado sem duplicar EXP', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'medium' });
    const checkId = randomUUID();
    const first = await check(ctx, auth, item.id, checkId).expect(200);
    const second = await check(ctx, auth, item.id, checkId).expect(200);
    expect(second.body).toEqual(first.body);
    const state = await me(ctx, auth);
    expect(state.player.expTotal).toBe(10);
    expect(state.player.totalChecks).toBe(1);
  });

  it('IDEMPOTENTE sob concorrência: 6 chamadas paralelas com o mesmo checkId contam uma vez', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'medium' });
    const checkId = randomUUID();
    const responses = await Promise.all(
      Array.from({ length: 6 }, () => check(ctx, auth, item.id, checkId)),
    );
    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect(new Set(responses.map((r) => JSON.stringify(r.body))).size).toBe(1);
    const state = await me(ctx, auth);
    expect(state.player.expTotal).toBe(10);
    expect(await ctx.prisma.itemCheck.count({ where: { userId: auth.user.id } })).toBe(1);
  });

  it('checks diferentes em paralelo não se perdem (sem corrida no estado)', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    await Promise.all(Array.from({ length: 8 }, () => check(ctx, auth, item.id).expect(200)));
    const state = await me(ctx, auth);
    expect(state.player.expTotal).toBe(40);
    expect(state.player.totalChecks).toBe(8);
  });

  it('hábito não tem limite diário', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    for (let i = 0; i < 5; i += 1) await check(ctx, auth, item.id).expect(200);
    expect((await me(ctx, auth)).player.expTotal).toBe(25);
    const list = await ctx
      .http()
      .get('/v1/items?type=habit')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(list.body[0]).toMatchObject({ checksToday: 5, checksThisWeek: 5, doneToday: true });
  });

  it('diário só pode ser marcado uma vez por dia', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, {
      type: 'daily',
      scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    });
    await check(ctx, auth, item.id).expect(200);
    const again = await check(ctx, auth, item.id).expect(409);
    expect(again.body.code).toBe('ALREADY_CHECKED');
  });

  it('tarefa concluída sai da lista e não pode ser marcada de novo', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'todo' });
    await check(ctx, auth, item.id).expect(200);
    const list = await ctx
      .http()
      .get('/v1/items?type=todo')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(list.body).toHaveLength(0);
    const again = await check(ctx, auth, item.id).expect(409);
    expect(again.body.code).toBe('ALREADY_COMPLETED');
  });

  it('sobe de nível, carrega o EXP e dá o bônus de moedas', async () => {
    reset();
    const auth = await registerUser(ctx);
    await ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { expInLevel: 45, expTotal: 45 },
    });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'hard' }); // +20 EXP
    const res = await check(ctx, auth, item.id).expect(200);
    expect(res.body).toMatchObject({ leveledUp: true, level: 2, coinsGained: 4 + 10 });
    expect((await me(ctx, auth)).player).toMatchObject({ level: 2, expInLevel: 15, coins: 14 });
  });

  it('desfazer no mesmo dia devolve EXP, moedas e o passo do capítulo', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'medium' });
    const checkId = randomUUID();
    await check(ctx, auth, item.id, checkId).expect(200);
    const undone = await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(200);
    expect(undone.body).toMatchObject({ expGained: -10, coinsGained: -2 });
    expect((await me(ctx, auth)).player).toMatchObject({ expTotal: 0, coins: 0, totalChecks: 0 });
    // desmarcar duas vezes
    await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(409);
  });

  it('desfazer de outro dia é recusado (UNDO_NOT_ALLOWED)', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const checkId = randomUUID();
    await check(ctx, auth, item.id, checkId).expect(200);
    ctx.clock.set('2026-10-10T15:00:00Z'); // dia seguinte
    const res = await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(409);
    expect(res.body.code).toBe('UNDO_NOT_ALLOWED');
  });

  it('a virada do dia segue o fuso do perfil (23:59 ainda é o mesmo dia local)', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const checkId = randomUUID();
    ctx.clock.set('2026-10-10T02:59:00Z'); // 23:59 do dia 09 em Sao_Paulo
    await check(ctx, auth, item.id, checkId).expect(200);
    ctx.clock.set('2026-10-10T02:59:30Z');
    await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(200); // ainda é o mesmo dia local
  });

  it('o check que fecha o capítulo é definitivo (CHECK_LOCKED)', async () => {
    reset();
    const auth = await registerUser(ctx);
    await ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { storyChecksInChapter: 9 },
    });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const checkId = randomUUID();
    const res = await check(ctx, auth, item.id, checkId).expect(200);
    expect(res.body.chapterCompleted).toBe(true);
    expect((await me(ctx, auth)).player.story).toEqual({
      chapter: 2,
      checksInChapter: 0,
      completed: false,
    });
    const locked = await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(409);
    expect(locked.body.code).toBe('CHECK_LOCKED');
  });

  it('diário: sequência, atraso e restauração ao desmarcar', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, {
      type: 'daily',
      scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    });
    const list = async () =>
      (await ctx.http().get('/v1/items?type=daily').set('authorization', bearer(auth)).expect(200))
        .body[0];

    expect(await list()).toMatchObject({ overdue: false, streak: 0 });

    await check(ctx, auth, item.id).expect(200); // dia 09
    ctx.clock.set('2026-10-10T15:00:00Z');
    expect(await list()).toMatchObject({ overdue: false, doneToday: false, streak: 1 });
    const day10 = randomUUID();
    await check(ctx, auth, item.id, day10).expect(200);
    expect(await list()).toMatchObject({ doneToday: true, streak: 2 });

    // desmarcar o de hoje restaura a sequência anterior
    await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${day10}`)
      .set('authorization', bearer(auth))
      .expect(200);
    expect(await list()).toMatchObject({ doneToday: false, streak: 1 });

    // pula um dia sem marcar: atrasado, e marcar hoje reinicia em 1
    ctx.clock.set('2026-10-12T15:00:00Z');
    expect(await list()).toMatchObject({ overdue: true, streak: 0 });
    await check(ctx, auth, item.id).expect(200);
    expect(await list()).toMatchObject({ overdue: false, streak: 1 });
  });

  it('ISOLAMENTO (IDOR): usuário não vê, marca nem desfaz itens de outro usuário', async () => {
    reset();
    const owner = await registerUser(ctx);
    const intruder = await registerUser(ctx);
    const item = await createItem(ctx, owner, { type: 'habit' });
    const checkId = randomUUID();
    await check(ctx, owner, item.id, checkId).expect(200);

    await check(ctx, intruder, item.id).expect(404);
    await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(intruder))
      .expect(404);
    const list = await ctx
      .http()
      .get('/v1/items')
      .set('authorization', bearer(intruder))
      .expect(200);
    expect(list.body).toHaveLength(0);

    // reusar o checkId do outro usuário também não vaza nada
    const own = await createItem(ctx, intruder, { type: 'habit' });
    const conflict = await check(ctx, intruder, own.id, checkId).expect(409);
    expect(conflict.body.code).toBe('CHECK_ID_CONFLICT');
    expect(await me(ctx, owner)).toBeTruthy();
  });

  it('criar item com categoria de outro usuário é 404', async () => {
    reset();
    const owner = await registerUser(ctx);
    const intruder = await registerUser(ctx);
    const foreignCategory = await firstCategoryId(ctx, owner.user.id);
    await ctx
      .http()
      .post('/v1/items')
      .set('authorization', bearer(intruder))
      .send({ categoryId: foreignCategory, title: 'x', difficulty: 'easy', type: 'habit' })
      .expect(404);
  });

  it('entrada inválida: tipo errado, diário sem dias, checkId que não é UUID', async () => {
    reset();
    const auth = await registerUser(ctx);
    const categoryId = await firstCategoryId(ctx, auth.user.id);
    await ctx
      .http()
      .post('/v1/items')
      .set('authorization', bearer(auth))
      .send({ categoryId, title: 'x', difficulty: 'easy', type: 'daily' })
      .expect(400);
    const item = await createItem(ctx, auth, { type: 'habit' });
    await ctx
      .http()
      .post(`/v1/items/${item.id}/checks`)
      .set('authorization', bearer(auth))
      .send({ checkId: 'nao-e-uuid' })
      .expect(400);
    await ctx
      .http()
      .post('/v1/items/nao-e-uuid/checks')
      .set('authorization', bearer(auth))
      .send({ checkId: randomUUID() })
      .expect(400);
  });

  it('o x-request-id válido volta no header e inválido é substituído', async () => {
    const ok = await ctx.http().get('/health').set('x-request-id', 'meu-id-12345').expect(200);
    expect(ok.headers['x-request-id']).toBe('meu-id-12345');
    const bad = await ctx.http().get('/health').set('x-request-id', 'a b<script>').expect(200);
    expect(bad.headers['x-request-id']).not.toContain('<');
  });
});
