import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bearer,
  check,
  createItem,
  createTestApp,
  NOON_09,
  registerUser,
  type TestContext,
} from './helpers.js';

describe('histórias, personagem e perfil', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeAll(() => ctx?.clock.set(NOON_09));

  it('o catálogo tem 5 histórias com 5 capítulos cada', async () => {
    const auth = await registerUser(ctx, undefined, { story: false });
    const res = await ctx.http().get('/v1/stories').set('authorization', bearer(auth)).expect(200);
    expect(res.body).toHaveLength(5);
    expect(res.body.every((s: { chapterCount: number }) => s.chapterCount === 5)).toBe(true);
    expect(res.body.some((s: { isActive: boolean }) => s.isActive)).toBe(false);
  });

  it('onboarding: /me mostra o que falta até ter personagem e história', async () => {
    const auth = await registerUser(ctx, undefined, { story: false });
    const before = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(before.body.onboarding).toEqual({
      tutorialSeen: false,
      hasCharacter: false,
      hasStory: false,
    });
    expect(before.body.character).toBeNull();

    await ctx
      .http()
      .put('/v1/me/character')
      .set('authorization', bearer(auth))
      .send({
        name: 'Aria',
        title: 'Heroína',
        skin: 'light',
        hair: 'short-brown',
        outfit: 'tunic-purple',
      })
      .expect(200);
    await ctx
      .http()
      .put('/v1/me/story')
      .set('authorization', bearer(auth))
      .send({ slug: 'guerreiro' })
      .expect(200);
    await ctx
      .http()
      .patch('/v1/me')
      .set('authorization', bearer(auth))
      .send({ tutorialSeen: true })
      .expect(200);

    const after = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(after.body.onboarding).toEqual({
      tutorialSeen: true,
      hasCharacter: true,
      hasStory: true,
    });
    expect(after.body.character).toMatchObject({ name: 'Aria', title: 'Heroína' });
    expect(after.body.story).toMatchObject({
      slug: 'guerreiro',
      chapterTitle: 'O campo de treino',
    });
  });

  it('história inexistente é 404 e personagem inválido é 400', async () => {
    const auth = await registerUser(ctx, undefined, { story: false });
    await ctx
      .http()
      .put('/v1/me/story')
      .set('authorization', bearer(auth))
      .send({ slug: 'nao-existe' })
      .expect(404);
    await ctx
      .http()
      .put('/v1/me/character')
      .set('authorization', bearer(auth))
      .send({ name: '', title: 'Rei', skin: 'x', hair: 'x', outfit: 'x' })
      .expect(400);
  });

  it('cosmético de conquista só pode ser usado depois de liberado', async () => {
    const auth = await registerUser(ctx);
    const res = await ctx
      .http()
      .put('/v1/me/character')
      .set('authorization', bearer(auth))
      .send({
        name: 'Aria',
        title: 'Herói',
        skin: 'light',
        hair: 'short-brown',
        outfit: 'outfit-cape',
      })
      .expect(403);
    expect(res.body.code).toBe('COSMETIC_LOCKED');
  });

  it('o progresso de cada história fica salvo ao trocar de história (RF-30)', async () => {
    const auth = await registerUser(ctx, undefined, { story: 'empreendedor' });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    for (let i = 0; i < 3; i += 1) await check(ctx, auth, item.id).expect(200);

    await ctx
      .http()
      .put('/v1/me/story')
      .set('authorization', bearer(auth))
      .send({ slug: 'explorador' })
      .expect(200);
    const other = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(other.body.player.story.checksInChapter).toBe(0);
    await check(ctx, auth, item.id).expect(200);

    await ctx
      .http()
      .put('/v1/me/story')
      .set('authorization', bearer(auth))
      .send({ slug: 'empreendedor' })
      .expect(200);
    const back = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(back.body.player.story.checksInChapter).toBe(3); // retomado de onde parou
    // EXP, nível e moedas são globais: 4 checks fáceis no total
    expect(back.body.player.totalChecks).toBe(4);
  });

  it('desfazer volta o passo na história em que o check contou, mesmo depois de trocar', async () => {
    const auth = await registerUser(ctx, undefined, { story: 'empreendedor' });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const checkId = randomUUID();
    await check(ctx, auth, item.id, checkId).expect(200);
    await ctx
      .http()
      .put('/v1/me/story')
      .set('authorization', bearer(auth))
      .send({ slug: 'lenda' })
      .expect(200);
    await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(200);

    await ctx
      .http()
      .put('/v1/me/story')
      .set('authorization', bearer(auth))
      .send({ slug: 'empreendedor' })
      .expect(200);
    const me = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(me.body.player.story.checksInChapter).toBe(0);
  });

  it('concluir um capítulo devolve o conteúdo do modal e grava a conclusão', async () => {
    const auth = await registerUser(ctx);
    await ctx.prisma.storyProgress.updateMany({
      where: { userId: auth.user.id },
      data: { checksInChapter: 9 },
    });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const res = await check(ctx, auth, item.id).expect(200);
    expect(res.body.chapterCompleted).toBe(true);
    expect(res.body.completedChapter).toMatchObject({
      number: 1,
      title: 'O primeiro quiosque',
      storyCompleted: false,
    });
    expect(res.body.completedChapter.text.length).toBeGreaterThan(10);

    const timeline = await ctx
      .http()
      .get('/v1/me/story/timeline')
      .set('authorization', bearer(auth))
      .expect(200);
    const states = timeline.body.chapters.map((c: { state: string }) => c.state);
    expect(states).toEqual(['completed', 'current', 'locked', 'locked', 'locked']);
    // texto só nos capítulos concluídos; o atual mostra o progresso
    expect(timeline.body.chapters[0].text).toBeTruthy();
    expect(timeline.body.chapters[1].text).toBeNull();
    expect(timeline.body.chapters[1]).toMatchObject({ checksInChapter: 0, requiredChecks: 15 });
  });

  it('concluir a história inteira e continuar rendendo EXP sem avançar capítulo', async () => {
    const auth = await registerUser(ctx);
    await ctx.prisma.storyProgress.updateMany({
      where: { userId: auth.user.id },
      data: { chapter: 5, checksInChapter: 29 },
    });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const fim = await check(ctx, auth, item.id).expect(200);
    expect(fim.body.completedChapter).toMatchObject({ number: 5, storyCompleted: true });
    const mais = await check(ctx, auth, item.id).expect(200);
    expect(mais.body).toMatchObject({ expGained: 5, chapterCompleted: false });
    const stories = await ctx
      .http()
      .get('/v1/stories')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(
      stories.body.find((s: { slug: string }) => s.slug === 'empreendedor').chaptersCompleted,
    ).toBe(1);
  });

  it('PATCH /me: fuso do perfil e lembrete; fuso inválido é 400', async () => {
    const auth = await registerUser(ctx);
    const res = await ctx
      .http()
      .patch('/v1/me')
      .set('authorization', bearer(auth))
      .send({ timezone: 'America/New_York', notifyAt: '08:30' })
      .expect(200);
    expect(res.body.user).toMatchObject({ timezone: 'America/New_York', notifyAt: '08:30' });
    await ctx
      .http()
      .patch('/v1/me')
      .set('authorization', bearer(auth))
      .send({ timezone: 'Marte/Olympus' })
      .expect(400);
  });

  it('o usuário só enxerga o próprio perfil (sem e-mail ou dados de outros)', async () => {
    const a = await registerUser(ctx);
    const b = await registerUser(ctx);
    const me = await ctx.http().get('/v1/me').set('authorization', bearer(a)).expect(200);
    expect(me.body.user.id).toBe(a.user.id);
    expect(JSON.stringify(me.body)).not.toContain(b.user.email);
    expect(JSON.stringify(me.body)).not.toMatch(/hash/i);
  });
});
