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

describe('stories, character and profile', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeAll(() => ctx?.clock.set(NOON_09));

  it('the catalog has 6 stories (one per scene) with 5 chapters each', async () => {
    const auth = await registerUser(ctx, undefined, { story: false });
    const res = await ctx.http().get('/v1/stories').set('authorization', bearer(auth)).expect(200);
    expect(res.body).toHaveLength(6);
    expect(res.body.every((s: { chapterCount: number }) => s.chapterCount === 5)).toBe(true);
    expect(res.body.some((s: { isActive: boolean }) => s.isActive)).toBe(false);
  });

  it('onboarding: /me shows what is missing until there is a character and a story', async () => {
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

  it('stores and returns the detailed LPC look and rejects an invalid key', async () => {
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

    // saving without a look erases the detailed look
    await ctx
      .http()
      .put('/v1/me/character')
      .set('authorization', bearer(auth))
      .send(base)
      .expect(200);
    const again = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(again.body.character.look).toBeUndefined();
  });

  it('a missing story is 404 and an invalid character is 400', async () => {
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
      data: { expInLevel: 195, expTotal: 195 },
    });
  const activate = (auth: Awaited<ReturnType<typeof registerUser>>, slug: string) =>
    ctx.http().put('/v1/me/story').set('authorization', bearer(auth)).send({ slug }).expect(200);

  it('the progress of each story is kept when switching stories (RF-30)', async () => {
    const auth = await registerUser(ctx, undefined, { story: 'beach' });
    await levelUpNext(auth);
    const item = await createItem(ctx, auth, { type: 'habit', difficulty: 'easy' });
    await check(ctx, auth, item.id).expect(200); // levels up: chapter 1 of the beach completed

    await activate(auth, 'zombie');
    const other = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(other.body.player.story).toEqual({ chapter: 1, completed: false });

    await activate(auth, 'beach');
    const back = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
    expect(back.body.player.story).toEqual({ chapter: 2, completed: false }); // resumed from where it stopped
    // EXP, level and coins are global
    expect(back.body.player).toMatchObject({ level: 2, totalChecks: 1 });
  });

  it('undo works after switching stories and keeps the EXP', async () => {
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
    expect(me.body.player).toMatchObject({ expInLevel: 5, totalChecks: 0 });
    expect(me.body.player.story).toEqual({ chapter: 1, completed: false });
  });

  it('leveling up completes the chapter, returns the modal and records the completion', async () => {
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
    expect(res.body.chapterProgress).toEqual({ chapter: 2, expInLevel: 0, expForNextLevel: 400 });

    const timeline = await ctx
      .http()
      .get('/v1/me/story/timeline')
      .set('authorization', bearer(auth))
      .expect(200);
    const states = timeline.body.chapters.map((c: { state: string }) => c.state);
    expect(states).toEqual(['completed', 'current', 'locked', 'locked', 'locked']);
    // text only on completed chapters; the current one shows progress (EXP of the level)
    expect(timeline.body.chapters[0].text).toBeTruthy();
    expect(timeline.body.chapters[1].text).toBeNull();
    expect(timeline.body.chapters[1]).toMatchObject({ expInLevel: 0, expForNextLevel: 400 });
  });

  it('shows the chapters of another story without switching the active one; a missing slug is 404', async () => {
    const auth = await registerUser(ctx, undefined, { story: 'beach' });
    const other = await ctx
      .http()
      .get('/v1/stories/castle/timeline')
      .set('authorization', bearer(auth))
      .expect(200);
    expect(other.body.story).toMatchObject({ slug: 'castle', isActive: false, currentChapter: 1 });
    expect(other.body.chapters).toHaveLength(5);
    // never played: chapter 1 is the current one, with no progress or text
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

  it("the timeline requires login and each story's is only the user's own", async () => {
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

  it('finishing the whole story and still earning EXP without advancing a chapter', async () => {
    const auth = await registerUser(ctx);
    await ctx.prisma.storyProgress.updateMany({
      where: { userId: auth.user.id },
      data: { chapter: 5 },
    });
    await ctx.prisma.userStats.update({
      where: { userId: auth.user.id },
      data: { level: 5, expInLevel: 995, expTotal: 995 },
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

  it('PATCH /me: profile time zone and reminder; an invalid time zone is 400', async () => {
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

  it('the user only sees their own profile (no email or data from others)', async () => {
    const a = await registerUser(ctx);
    const b = await registerUser(ctx);
    const me = await ctx.http().get('/v1/me').set('authorization', bearer(a)).expect(200);
    expect(me.body.user.id).toBe(a.user.id);
    expect(JSON.stringify(me.body)).not.toContain(b.user.email);
    expect(JSON.stringify(me.body)).not.toMatch(/hash/i);
  });
});
