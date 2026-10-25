import { randomUUID } from 'node:crypto';

import { dataExportSchema } from '@nextjourney/contracts';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { SecurityEvents } from '../src/modules/security/security-events.service.js';
import {
  bearer,
  check,
  createItem,
  createTestApp,
  FakeVerifier,
  me,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

describe('exportação dos dados da conta (LGPD)', () => {
  let ctx: TestContext;
  const verifier = new FakeVerifier();
  beforeAll(async () => {
    ctx = await createTestApp({ verifier });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const exportOf = (auth: Awaited<ReturnType<typeof registerUser>>) =>
    ctx.http().get('/v1/me/export').set('authorization', bearer(auth));

  it('traz perfil, itens, checks, categorias e progresso da própria conta, no formato do contrato', async () => {
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'habit', title: 'Beber água' });
    await check(ctx, auth, item.id).expect(200);
    const progress = await me(ctx, auth);

    const res = await exportOf(auth).expect(200);
    const data = dataExportSchema.parse(res.body);

    expect(data.account.id).toBe(auth.user.id);
    expect(data.account.email).toBe(auth.user.email);
    expect(data.account.signInMethods).toEqual(['password']);
    expect(data.account.emailVerifiedAt).not.toBeNull();
    expect(data.items.map((row) => row.title)).toContain('Beber água');
    expect(data.checks.map((row) => row.itemId)).toContain(item.id);
    expect(data.categories).toHaveLength(5);
    expect(data.progress.totalChecks).toBe(progress.player.totalChecks);
    expect(data.progress.expTotal).toBe(progress.player.expTotal);
    expect(data.stories.length).toBeGreaterThan(0);
  });

  it('inclui itens excluídos logicamente (o histórico também é da pessoa)', async () => {
    const auth = await registerUser(ctx);
    const item = await createItem(ctx, auth, { type: 'todo', title: 'Tarefa apagada' });
    await ctx.http().delete(`/v1/items/${item.id}`).set('authorization', bearer(auth)).expect(204);
    const data = dataExportSchema.parse((await exportOf(auth).expect(200)).body);
    const row = data.items.find((entry) => entry.id === item.id);
    expect(row?.deletedAt).not.toBeNull();
  });

  it('nunca traz hash de senha, token, código ou id do provedor', async () => {
    const auth = await registerUser(ctx);
    // Com sessão aberta, login social ligado e e-mail confirmado
    const subject = `google-subject-${randomUUID()}`;
    verifier.identity = {
      subject,
      email: auth.user.email,
      emailVerified: true,
      name: null,
    };
    await ctx.http().post('/v1/auth/google').send({ idToken: 'ok' }).expect(200);

    const res = await exportOf(auth).expect(200);
    const text = JSON.stringify(res.body);
    expect(res.body.account.signInMethods.sort()).toEqual(['google', 'password']);
    expect(text).not.toMatch(/argon2|passwordHash|tokenHash|codeHash|refreshToken|accessToken/i);
    expect(text).not.toContain(subject);
    expect(text).not.toContain(auth.tokens.refreshToken);
    expect(text).not.toContain(auth.tokens.accessToken);
  });

  it('não mistura dados de outra conta', async () => {
    const mine = await registerUser(ctx);
    const theirs = await registerUser(ctx);
    const theirItem = await createItem(ctx, theirs, {
      type: 'habit',
      title: 'Segredo da outra pessoa',
    });
    await check(ctx, theirs, theirItem.id).expect(200);

    const data = dataExportSchema.parse((await exportOf(mine).expect(200)).body);
    expect(JSON.stringify(data)).not.toContain('Segredo da outra pessoa');
    expect(JSON.stringify(data)).not.toContain(theirs.user.email);
    expect(data.checks.map((row) => row.itemId)).not.toContain(theirItem.id);
  });

  it('conta só social também exporta, sem senha entre os métodos', async () => {
    const email = uniqueEmail('social');
    verifier.identity = { subject: `g-${email}`, email, emailVerified: true, name: null };
    const login = await ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '1' })
      .expect(200);
    const res = await exportOf(login.body).expect(200);
    expect(res.body.account.signInMethods).toEqual(['google']);
  });

  it('limite de 3 por hora e rastro no log (id da conta, sem conteúdo)', async () => {
    const auth = await registerUser(ctx);
    const record = vi.spyOn(ctx.app.get(SecurityEvents), 'record');
    for (let i = 0; i < 3; i += 1) await exportOf(auth).expect(200);
    const blocked = await exportOf(auth).expect(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
    const exported = record.mock.calls.filter((call) => call[0] === 'data_exported');
    expect(exported).toHaveLength(3);
    expect(JSON.stringify(exported)).toContain(auth.user.id);
    expect(JSON.stringify(exported)).not.toContain(auth.user.email);
    record.mockRestore();
  });

  it('exige autenticação', async () => {
    await ctx.http().get('/v1/me/export').expect(401);
  });
});
