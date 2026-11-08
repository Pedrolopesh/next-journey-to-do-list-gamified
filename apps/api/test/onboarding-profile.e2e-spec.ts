import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createTestApp, registerUser, type TestContext } from './helpers.js';

describe('onboarding profile', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('stores goal, age, gender and reminders and returns them in GET /me', async () => {
    const auth = await registerUser(ctx);
    const patched = await ctx
      .http()
      .patch('/v1/me')
      .set('Authorization', bearer(auth))
      .send({
        goals: ['fitness', 'learning'],
        ageRange: '25-34',
        gender: 'other',
        remindersOptIn: true,
      })
      .expect(200);
    expect(patched.body.user).toMatchObject({
      goals: ['fitness', 'learning'],
      ageRange: '25-34',
      gender: 'other',
      remindersOptIn: true,
    });
  });

  it('rejects empty or repeated goals', async () => {
    const auth = await registerUser(ctx);
    for (const goals of [[], ['fitness', 'fitness'], ['unknown']]) {
      await ctx
        .http()
        .patch('/v1/me')
        .set('Authorization', bearer(auth))
        .send({ goals })
        .expect(400);
    }
  });

  it('age and gender can be cleared with null', async () => {
    const auth = await registerUser(ctx);
    await ctx
      .http()
      .patch('/v1/me')
      .set('Authorization', bearer(auth))
      .send({ ageRange: '18-24', gender: 'male' })
      .expect(200);
    const cleared = await ctx
      .http()
      .patch('/v1/me')
      .set('Authorization', bearer(auth))
      .send({ ageRange: null, gender: null })
      .expect(200);
    expect(cleared.body.user.ageRange).toBeNull();
    expect(cleared.body.user.gender).toBeNull();
  });

  it('a value outside the list gives 400 and is not saved', async () => {
    const auth = await registerUser(ctx);
    await ctx
      .http()
      .patch('/v1/me')
      .set('Authorization', bearer(auth))
      .send({ ageRange: '10' })
      .expect(400);
    const me = await ctx.http().get('/v1/me').set('Authorization', bearer(auth)).expect(200);
    expect(me.body.user.ageRange).toBeNull();
  });

  it('the character stores the class and the old character comes without it', async () => {
    const auth = await registerUser(ctx);
    const base = {
      name: 'Aria',
      title: 'Aventureiro',
      skin: 'light',
      hair: 'brown',
      outfit: 'tunic',
    };
    await ctx
      .http()
      .put('/v1/me/character')
      .set('Authorization', bearer(auth))
      .send(base)
      .expect(200);
    const without = await ctx.http().get('/v1/me').set('Authorization', bearer(auth)).expect(200);
    expect(without.body.character.characterClass).toBeUndefined();

    await ctx
      .http()
      .put('/v1/me/character')
      .set('Authorization', bearer(auth))
      .send({ ...base, characterClass: 'mage' })
      .expect(200);
    const withClass = await ctx.http().get('/v1/me').set('Authorization', bearer(auth)).expect(200);
    expect(withClass.body.character.characterClass).toBe('mage');
  });

  it('the character name accepts free nicknames and rejects markup and invisible characters', async () => {
    const auth = await registerUser(ctx);
    const base = { title: 'Aventureiro', skin: 'light', hair: 'brown', outfit: 'tunic' };
    const put = (name: string) =>
      ctx
        .http()
        .put('/v1/me/character')
        .set('Authorization', bearer(auth))
        .send({ ...base, name });

    await put('Zé_77 🐉').expect(200);
    for (const bad of [
      '<script>alert(1)</script>',
      'a<b',
      'nome\u202Einvertido',
      'inv\u200Bisível',
    ]) {
      await put(bad).expect(400);
    }
    await put('a'.repeat(41)).expect(400);
  });

  it('the email in the code request has a size limit', async () => {
    const huge = `${'a'.repeat(250)}@exemplo.com`;
    await ctx.http().post('/v1/auth/email/start').send({ email: huge }).expect(400);
  });
});
