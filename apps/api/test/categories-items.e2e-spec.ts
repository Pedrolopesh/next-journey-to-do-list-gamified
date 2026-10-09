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

describe('categorias e CRUD de itens', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  const reset = (): void => ctx.clock.set(NOON_09);

  it('o cadastro cria 5 categorias; criar, renomear e recolorir', async () => {
    reset();
    const auth = await registerUser(ctx);
    const list = await ctx
      .http()
      .get('/v1/categories')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(list.body.map((c: { name: string }) => c.name)).toEqual([
      'Trabalho',
      'Saúde',
      'Estudo',
      'Freela',
      'Pessoal',
    ]);

    const created = await ctx
      .http()
      .post('/v1/categories')
      .set('authorization', bearer(auth))
      .send({ name: 'Casa', color: '#10b981' })
      .expect(201);
    const renamed = await ctx
      .http()
      .patch(`/v1/categories/${created.body.id}`)
      .set('authorization', bearer(auth))
      .send({ name: 'Lar', color: '#3b82f6' })
      .expect(200);
    expect(renamed.body).toMatchObject({ name: 'Lar', color: '#3b82f6' });
    await ctx
      .http()
      .post('/v1/categories')
      .set('authorization', bearer(auth))
      .send({ name: 'x', color: '#000000' })
      .expect(400);
  });

  it('limite de 10 categorias', async () => {
    const auth = await registerUser(ctx);
    for (let i = 0; i < 5; i += 1) {
      await ctx
        .http()
        .post('/v1/categories')
        .set('authorization', bearer(auth))
        .send({ name: `Extra ${i}`, color: '#7c3aed' })
        .expect(201);
    }
    const res = await ctx
      .http()
      .post('/v1/categories')
      .set('authorization', bearer(auth))
      .send({ name: 'Demais', color: '#7c3aed' })
      .expect(409);
    expect(res.body.code).toBe('CATEGORY_LIMIT');
  });

  it('excluir categoria com itens exige o destino (moveTo) e move os itens', async () => {
    reset();
    const auth = await registerUser(ctx);
    const categories = (await ctx.http().get('/v1/categories').set('authorization', bearer(auth)))
      .body;
    const [from, to] = categories;
    const item = await createItem(ctx, auth, { type: 'habit', categoryId: from.id });

    const sem = await ctx
      .http()
      .delete(`/v1/categories/${from.id}`)
      .set('authorization', bearer(auth))
      .expect(409);
    expect(sem.body.code).toBe('CATEGORY_HAS_ITEMS');

    await ctx
      .http()
      .delete(`/v1/categories/${from.id}?moveTo=${to.id}`)
      .set('authorization', bearer(auth))
      .expect(204);
    const moved = await ctx.prisma.item.findUniqueOrThrow({ where: { id: item.id } });
    expect(moved.categoryId).toBe(to.id);
    const after = (await ctx.http().get('/v1/categories').set('authorization', bearer(auth))).body;
    expect(after).toHaveLength(4);
  });

  it('não exclui a última categoria', async () => {
    const auth = await registerUser(ctx);
    const categories = (await ctx.http().get('/v1/categories').set('authorization', bearer(auth)))
      .body;
    for (const category of categories.slice(1)) {
      await ctx
        .http()
        .delete(`/v1/categories/${category.id}`)
        .set('authorization', bearer(auth))
        .expect(204);
    }
    const last = await ctx
      .http()
      .delete(`/v1/categories/${categories[0].id}`)
      .set('authorization', bearer(auth))
      .expect(409);
    expect(last.body.code).toBe('LAST_CATEGORY');
  });

  it('ISOLAMENTO: não edita nem exclui categoria de outro usuário', async () => {
    const owner = await registerUser(ctx);
    const intruder = await registerUser(ctx);
    const id = await firstCategoryId(ctx, owner.user.id);
    await ctx
      .http()
      .patch(`/v1/categories/${id}`)
      .set('authorization', bearer(intruder))
      .send({ name: 'x' })
      .expect(404);
    await ctx
      .http()
      .delete(`/v1/categories/${id}`)
      .set('authorization', bearer(intruder))
      .expect(404);
  });

  it('editar item: título, dificuldade e categoria; regras por tipo', async () => {
    reset();
    const auth = await registerUser(ctx);
    const habit = await createItem(ctx, auth, { type: 'habit', title: 'Ler' });
    const daily = await createItem(ctx, auth, { type: 'daily', scheduleDays: [1, 3] });
    const todo = await createItem(ctx, auth, { type: 'todo' });

    const edited = await ctx
      .http()
      .patch(`/v1/items/${habit.id}`)
      .set('authorization', bearer(auth))
      .send({ title: 'Ler 20 páginas', difficulty: 'hard' })
      .expect(200);
    expect(edited.body).toMatchObject({ title: 'Ler 20 páginas', difficulty: 'hard' });

    await ctx
      .http()
      .patch(`/v1/items/${habit.id}`)
      .set('authorization', bearer(auth))
      .send({ scheduleDays: [1] })
      .expect(400);
    await ctx
      .http()
      .patch(`/v1/items/${daily.id}`)
      .set('authorization', bearer(auth))
      .send({ dueAt: '2026-10-10T12:00:00Z' })
      .expect(400);
    const days = await ctx
      .http()
      .patch(`/v1/items/${daily.id}`)
      .set('authorization', bearer(auth))
      .send({ scheduleDays: [0, 6] })
      .expect(200);
    expect(days.body.scheduleDays).toEqual([0, 6]);
    const due = await ctx
      .http()
      .patch(`/v1/items/${todo.id}`)
      .set('authorization', bearer(auth))
      .send({ dueAt: '2026-10-20T12:00:00Z' })
      .expect(200);
    expect(due.body.dueAt).toBe('2026-10-20T12:00:00.000Z');
  });

  it('ISOLAMENTO: não edita nem exclui item de outro usuário; categoria alheia é 404', async () => {
    const owner = await registerUser(ctx);
    const intruder = await registerUser(ctx);
    const item = await createItem(ctx, owner, { type: 'habit' });
    await ctx
      .http()
      .patch(`/v1/items/${item.id}`)
      .set('authorization', bearer(intruder))
      .send({ title: 'x' })
      .expect(404);
    await ctx
      .http()
      .delete(`/v1/items/${item.id}`)
      .set('authorization', bearer(intruder))
      .expect(404);
    const mine = await createItem(ctx, intruder, { type: 'habit' });
    const foreign = await firstCategoryId(ctx, owner.user.id);
    await ctx
      .http()
      .patch(`/v1/items/${mine.id}`)
      .set('authorization', bearer(intruder))
      .send({ categoryId: foreign })
      .expect(404);
  });

  it('exclusão é lógica: some da lista, mantém o histórico de EXP e trava o desfazer', async () => {
    reset();
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'medium' });
    const checkId = randomUUID();
    await check(ctx, auth, item.id, checkId).expect(200);

    await ctx.http().delete(`/v1/items/${item.id}`).set('authorization', bearer(auth)).expect(204);
    const list = await ctx.http().get('/v1/items').set('authorization', bearer(auth)).expect(200);
    expect(list.body).toHaveLength(0);
    // histórico mantido
    expect(await ctx.prisma.itemCheck.count({ where: { itemId: item.id } })).toBe(1);
    expect(
      (await ctx.prisma.item.findUniqueOrThrow({ where: { id: item.id } })).deletedAt,
    ).not.toBeNull();
    // não marca mais nem desfaz
    await check(ctx, auth, item.id).expect(404);
    const undo = await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(409);
    expect(undo.body.code).toBe('UNDO_NOT_ALLOWED');
    await ctx.http().delete(`/v1/items/${item.id}`).set('authorization', bearer(auth)).expect(404);
  });

  it('tarefa com prazo vencido aparece como atrasada', async () => {
    reset();
    const auth = await registerUser(ctx);
    await createItem(ctx, auth, { type: 'todo', dueAt: '2026-10-08T12:00:00Z' });
    await createItem(ctx, auth, { type: 'todo', dueAt: '2026-10-20T12:00:00Z' });
    const list = await ctx
      .http()
      .get('/v1/items?type=todo')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(list.body.map((t: { overdue: boolean }) => t.overdue).sort()).toEqual([false, true]);
  });

  it('criar item conta para a conquista Organizado (itemsCreated)', async () => {
    const auth = await registerUser(ctx);
    for (let i = 0; i < 3; i += 1) await createItem(ctx, auth, { type: 'habit' });
    const stats = await ctx.prisma.userStats.findUniqueOrThrow({ where: { userId: auth.user.id } });
    expect(stats.itemsCreated).toBe(3);
  });
});
