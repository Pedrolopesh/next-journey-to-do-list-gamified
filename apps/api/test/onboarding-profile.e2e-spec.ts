import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createTestApp, registerUser, type TestContext } from './helpers.js';

describe('perfil do onboarding', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('guarda meta, idade, gênero e lembretes e devolve em GET /me', async () => {
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

  it('rejeita metas vazias ou repetidas', async () => {
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

  it('idade e gênero podem ser limpos com null', async () => {
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

  it('valor fora da lista dá 400 e não grava', async () => {
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

  it('o personagem guarda a classe e o personagem antigo vem sem ela', async () => {
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

  it('o nome do personagem aceita apelidos livres e recusa marcação e caracteres invisíveis', async () => {
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

  it('o e-mail do pedido de código tem limite de tamanho', async () => {
    const huge = `${'a'.repeat(250)}@exemplo.com`;
    await ctx.http().post('/v1/auth/email/start').send({ email: huge }).expect(400);
  });
});
