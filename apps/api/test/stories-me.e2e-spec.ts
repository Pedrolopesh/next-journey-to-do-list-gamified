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

  it('o catálogo tem 6 histórias (uma por cenário) com 5 capítulos cada', async () => {
    const auth = await registerUser(ctx, undefined, { story: false });
    const res = await ctx.http().get('/v1/stories').set('authorization', bearer(auth)).expect(200);
    expect(res.body).toHaveLength(6);
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
      .send({ slug: 'castle' })
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
      slug: 'castle',
      chapterTitle: 'O portão do castelo',
    });
  });

  it('guarda e devolve a aparência LPC detalhada e rejeita chave inválida', async () => {
    const auth = await registerUser(ctx);
    const look = {
      bodyType: 'female',
      skin: 'amber',
      hair: 'hair-bob',
      hairColor: 'dark_brown',
      torso: 'torso-tshirt',
      torsoColor: 'blue',
      legs: 'legs-pants',
      legsColor: 'navy',
      feet: null,
      feetColor: 'brown',
    };
    const base = {
      name: 'Aria',
      title: 'Heroína',
      skin: 'light',
      hair: 'short-brown',
      outfit: 'tunic-purple',
    };
    await ctx
      .http()
      .put('/v1/me/character')
      .set('authorization', bearer(auth))
      .send({ ...base, look })
      .expect(200);
    const me = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(me.body.character.look).toEqual(look);

    await ctx
      .http()
      .put('/v1/me/character')
      .set('authorization', bearer(auth))
      .send({ ...base, look: { ...look, hair: '../x' } })
      .expect(400);

    // salvar sem look apaga a aparência detalhada
    await ctx
      .http()
      .put('/v1/me/character')
      .set('authorization', bearer(auth))
      .send(base)
      .expect(200);
    const again = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(again.body.character.look).toBeUndefined();
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

  const levelUpNext = (auth: Awaited<ReturnType<typeof registerUser>>) =>
    ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { expInLevel: 45, expTotal: 45 },
    });
  const activate = (auth: Awaited<ReturnType<typeof registerUser>>, slug: string) =>
    ctx.http().put('/v1/me/story').set('authorization', bearer(auth)).send({ slug }).expect(200);

  it('o progresso de cada história fica salvo ao trocar de história (RF-30)', async () => {
    const auth = await registerUser(ctx, undefined, { story: 'beach' });
    await levelUpNext(auth);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    await check(ctx, auth, item.id).expect(200); // sobe de nível: capítulo 1 da praia concluído

    await activate(auth, 'zombie');
    const other = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(other.body.player.story).toEqual({ chapter: 1, completed: false });

    await activate(auth, 'beach');
    const back = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(back.body.player.story).toEqual({ chapter: 2, completed: false }); // retomado de onde parou
    // EXP, nível e moedas são globais
    expect(back.body.player).toMatchObject({ level: 2, totalChecks: 1 });
  });

  it('desfazer funciona depois de trocar de história (check que não subiu de nível)', async () => {
    const auth = await registerUser(ctx, undefined, { story: 'beach' });
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const checkId = randomUUID();
    await check(ctx, auth, item.id, checkId).expect(200);
    await activate(auth, 'hell');
    await ctx
      .http()
      .delete(`/v1/items/${item.id}/checks/${checkId}`)
      .set('authorization', bearer(auth))
      .expect(200);

    await activate(auth, 'beach');
    const me = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(me.body.player).toMatchObject({ expInLevel: 0, totalChecks: 0 });
    expect(me.body.player.story).toEqual({ chapter: 1, completed: false });
  });

  it('subir de nível conclui o capítulo, devolve o modal e grava a conclusão', async () => {
    const auth = await registerUser(ctx);
    await levelUpNext(auth);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    const res = await check(ctx, auth, item.id).expect(200);
    expect(res.body).toMatchObject({ leveledUp: true, level: 2, chapterCompleted: true });
    expect(res.body.completedChapter).toMatchObject({
      number: 1,
      title: 'A chegada',
      storyCompleted: false,
    });
    expect(res.body.completedChapter.text.length).toBeGreaterThan(10);
    expect(res.body.chapterProgress).toEqual({ chapter: 2, expInLevel: 0, expForNextLevel: 125 });

    const timeline = await ctx
      .http()
      .get('/v1/me/story/timeline')
      .set('authorization', bearer(auth))
      .expect(200);
    const states = timeline.body.chapters.map((c: { state: string }) => c.state);
    expect(states).toEqual(['completed', 'current', 'locked', 'locked', 'locked']);
    // texto só nos capítulos concluídos; o atual mostra o progresso (EXP do nível)
    expect(timeline.body.chapters[0].text).toBeTruthy();
    expect(timeline.body.chapters[1].text).toBeNull();
    expect(timeline.body.chapters[1]).toMatchObject({ expInLevel: 0, expForNextLevel: 125 });
  });

  it('mostra os capítulos de outra história sem trocar a ativa; slug inexistente é 404', async () => {
    const auth = await registerUser(ctx, undefined, { story: 'beach' });
    const other = await ctx
      .http()
      .get('/v1/stories/castle/timeline')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(other.body.story).toMatchObject({ slug: 'castle', isActive: false, currentChapter: 1 });
    expect(other.body.chapters).toHaveLength(5);
    // nunca jogada: o capítulo 1 é o atual, sem progresso nem texto
    expect(other.body.chapters[0]).toMatchObject({
      state: 'current',
      expInLevel: null,
      text: null,
    });
    const active = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(active.body.story.slug).toBe('beach');
    await ctx
      .http()
      .get('/v1/stories/nao-existe/timeline')
      .set('authorization', bearer(auth))
      .expect(404);
  });

  it('a linha do tempo exige login e a de cada história é só do próprio usuário', async () => {
    await ctx.http().get('/v1/stories/beach/timeline').expect(401);
    const a = await registerUser(ctx, undefined, { story: 'beach' });
    const b = await registerUser(ctx, undefined, { story: 'beach' });
    await levelUpNext(a);
    const item = await createItem(ctx, a, { type: 'habit', difficulty: 'easy' });
    await check(ctx, a, item.id).expect(200);
    const mine = await ctx
      .http()
      .get('/v1/stories/beach/timeline')
      .set('authorization', bearer(b))
      .expect(200);
    expect(mine.body.chapters[0]).toMatchObject({ state: 'current', text: null });
  });

  it('concluir a história inteira e continuar rendendo EXP sem avançar capítulo', async () => {
    const auth = await registerUser(ctx);
    await ctx.prisma.storyProgress.updateMany({
      where: { userId: auth.user.id },
      data: { chapter: 5 },
    });
    await ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { level: 5, expInLevel: 345, expTotal: 345 },
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
    expect(stories.body.find((s: { slug: string }) => s.slug === 'beach').chaptersCompleted).toBe(
      1,
    );
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
