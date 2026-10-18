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
    expect(state.player.story).toEqual({ chapter: 1, completed: false }); // sem subir de nível o capítulo não muda
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
      data: { expInLevel: 195, expTotal: 195 },
    });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'hard' }); // +20 EXP
    const res = await check(ctx, auth, item.id).expect(200);
    expect(res.body).toMatchObject({ leveledUp: true, level: 2, coinsGained: 4 + 10 });
    expect((await me(ctx, auth)).player).toMatchObject({ level: 2, expInLevel: 15, coins: 14 });
  });

  it('desfazer tira moedas, nunca o EXP, e marcar de novo no dia rende só as moedas', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'medium' });
    const checkId = randomUUID();
    await check(ctx, auth, item.id, checkId).expect(200); // +10 EXP, +2 moedas
    const undone = await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(200);
    // capítulo 1 perde até 3 moedas, limitado ao saldo (2)
    expect(undone.body).toMatchObject({ expGained: 0, coinsGained: -2 });
    expect((await me(ctx, auth)).player).toMatchObject({
      expTotal: 10,
      expInLevel: 10,
      coins: 0,
      totalChecks: 0,
    });
    // desmarcar duas vezes
    await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(409);
    // marcar de novo no mesmo dia: moedas sim, EXP não
    const again = await check(ctx, auth, item.id).expect(200);
    expect(again.body).toMatchObject({ expGained: 0, coinsGained: 2 });
    expect((await me(ctx, auth)).player).toMatchObject({ expTotal: 10, coins: 2, totalChecks: 1 });
  });

  it('a perda de moedas segue o capítulo atual (capítulo 2 perde 5)', async () => {
    reset();
    const auth = await registerUser(ctx);
    await ctx.prisma.storyProgress.updateMany({
      where: { userId: auth.user.id },
      data: { chapter: 2 },
    });
    await ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { level: 2, coins: 40 },
    });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const checkId = randomUUID();
    await check(ctx, auth, item.id, checkId).expect(200); // +1 moeda: 41
    const undone = await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(200);
    expect(undone.body).toMatchObject({ expGained: 0, coinsGained: -5 });
    expect((await me(ctx, auth)).player.coins).toBe(36);
  });

  it('desfazer vale em outro dia', async () => {
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
      .expect(200);
    expect(res.body.expGained).toBe(0);
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

  it('o check que fecha o capítulo também pode ser desmarcado: nível e capítulo ficam', async () => {
    reset();
    const auth = await registerUser(ctx);
    await ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { expInLevel: 195, expTotal: 195 },
    });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const checkId = randomUUID();
    const res = await check(ctx, auth, item.id, checkId).expect(200);
    expect(res.body.chapterCompleted).toBe(true);
    expect(res.body).toMatchObject({ leveledUp: true, level: 2 });
    expect((await me(ctx, auth)).player.story).toEqual({ chapter: 2, completed: false });
    const undone = await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(200);
    expect(undone.body).toMatchObject({ expGained: 0, level: 2 });
    expect((await me(ctx, auth)).player).toMatchObject({ level: 2, expInLevel: 0 });
    expect((await me(ctx, auth)).player.story).toEqual({ chapter: 2, completed: false });
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

  it('a lista traz o check de hoje que vale (lastCheckId) e some quando é desmarcado', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const list = async () =>
      (await ctx.http().get('/v1/items?type=habit').set('authorization', bearer(auth)).expect(200))
        .body[0];
    expect((await list()).lastCheckId).toBeNull();

    const first = randomUUID();
    const second = randomUUID();
    await check(ctx, auth, item.id, first).expect(200);
    await check(ctx, auth, item.id, second).expect(200);
    expect((await list()).lastCheckId).toBe(second); // o mais recente vale

    await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${second}`)
      .set('authorization', bearer(auth))
      .expect(200);
    expect((await list()).lastCheckId).toBe(first);

    ctx.clock.set('2026-10-10T15:00:00Z'); // dia seguinte: o check de ontem não aparece
    expect((await list()).lastCheckId).toBeNull();
  });

  it('histórico: tarefas concluídas, da mais recente à mais antiga, paginado', async () => {
    reset();
    const auth = await registerUser(ctx);
    const a = await createItem(ctx, auth, { type: 'todo', title: 'Primeira' });
    const b = await createItem(ctx, auth, { type: 'todo', title: 'Segunda' });
    const c = await createItem(ctx, auth, { type: 'todo', title: 'Terceira' });
    await createItem(ctx, auth, { type: 'todo', title: 'Aberta' });
    await createItem(ctx, auth, { type: 'habit', title: 'Hábito' });
    const checkA = randomUUID();
    await check(ctx, auth, a.id, checkA).expect(200);
    ctx.clock.set('2026-10-09T16:00:00Z');
    await check(ctx, auth, b.id).expect(200);
    ctx.clock.set('2026-10-10T16:00:00Z');
    await check(ctx, auth, c.id).expect(200);

    const history = (query = '') =>
      ctx.http().get(`/v1/items/history${query}`).set('authorization', bearer(auth)).expect(200);

    const all = await history();
    expect(all.body.items.map((i: { title: string }) => i.title)).toEqual([
      'Terceira',
      'Segunda',
      'Primeira',
    ]);
    expect(all.body.nextCursor).toBeNull();
    expect(all.body.items[2]).toMatchObject({ id: a.id, checkId: checkA, difficulty: 'medium' });

    const page1 = await history('?limit=2');
    expect(page1.body.items).toHaveLength(2);
    expect(page1.body.nextCursor).toBe(page1.body.items[1].completedAt);
    const page2 = await history(`?limit=2&before=${page1.body.nextCursor}`);
    expect(page2.body.items.map((i: { title: string }) => i.title)).toEqual(['Primeira']);
    expect(page2.body.nextCursor).toBeNull();

    // desmarcar a tarefa devolve ela à lista e a tira do histórico
    await ctx
      .http()
      .delete(`/v1/items/${a.id}/checks/${checkA}`)
      .set('authorization', bearer(auth))
      .expect(200);
    expect((await history()).body.items.map((i: { title: string }) => i.title)).toEqual([
      'Terceira',
      'Segunda',
    ]);
    const open = await ctx
      .http()
      .get('/v1/items?type=todo')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(open.body.map((i: { title: string }) => i.title)).toContain('Primeira');
  });

  it('histórico exige login, valida a consulta e não mistura usuários (IDOR)', async () => {
    reset();
    const owner = await registerUser(ctx);
    const other = await registerUser(ctx);
    const item = await createItem(ctx, owner, { type: 'todo', title: 'Minha' });
    await check(ctx, owner, item.id).expect(200);

    await ctx.http().get('/v1/items/history').expect(401);
    await ctx
      .http()
      .get('/v1/items/history?limit=0')
      .set('authorization', bearer(owner))
      .expect(400);
    await ctx
      .http()
      .get('/v1/items/history?before=ontem')
      .set('authorization', bearer(owner))
      .expect(400);
    const mine = await ctx
      .http()
      .get('/v1/items/history')
      .set('authorization', bearer(owner))
      .expect(200);
    expect(mine.body.items).toHaveLength(1);
    const theirs = await ctx
      .http()
      .get('/v1/items/history')
      .set('authorization', bearer(other))
      .expect(200);
    expect(theirs.body.items).toEqual([]);
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
