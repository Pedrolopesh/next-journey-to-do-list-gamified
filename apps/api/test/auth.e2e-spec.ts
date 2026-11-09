import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createTestApp, registerUser, type TestContext } from './helpers.js';

describe('auth and basic security', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /health responde 200 e verifica o banco', async () => {
    const res = await ctx.http().get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.info.database.status).toBe('up');
  });

  it('the first code sign-in creates the user and the 5 default categories, and returns no secret', async () => {
    const auth = await registerUser(ctx);
    expect(JSON.stringify(auth)).not.toMatch(/hash|password/i);
    const categories = await ctx.prisma.category.findMany({ where: { userId: auth.user.id } });
    expect(categories.map((c) => c.name).sort()).toEqual([
      'Estudo',
      'Freela',
      'Pessoal',
      'Saúde',
      'Trabalho',
    ]);
  });

  it('validation does not return the value sent and uses the standard error format', async () => {
    const res = await ctx
      .http()
      .post('/v1/auth/email/start')
      .send({ email: 'nao-e-um-email-secreto' })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.requestId).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toContain('nao-e-um-email-secreto');
  });

  it('a protected route requires the access token', async () => {
    const auth = await registerUser(ctx);
    await ctx.http().get('/v1/items').expect(401);
    await ctx.http().get('/v1/items').set('authorization', 'Bearer lixo').expect(401);
    await ctx.http().get('/v1/items').set('authorization', bearer(auth)).expect(200);
  });

  it('the issued access token carries issuer, audience and key identifier', async () => {
    const auth = await registerUser(ctx);
    const [header, payload] = auth.tokens.accessToken
      .split('.')
      .slice(0, 2)
      .map(
        (part) =>
          JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>,
      );
    expect(header).toMatchObject({ alg: 'HS256', kid: 'k1' });
    expect(payload).toMatchObject({
      iss: 'nextjourney-api',
      aud: 'nextjourney-app',
      sub: auth.user.id,
    });
  });

  it('a JWT signed with another secret or with alg none is rejected', async () => {
    const forged = [
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ4In0.', // alg: none
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4In0.assinatura-invalida',
    ];
    for (const token of forged) {
      await ctx.http().get('/v1/me').set('authorization', `Bearer ${token}`).expect(401);
    }
  });

  it('simultaneous refresh with the same token: only one wins and the whole session falls (reuse)', async () => {
    const auth = await registerUser(ctx);
    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        ctx.http().post('/v1/auth/refresh').send({ refreshToken: auth.tokens.refreshToken }),
      ),
    );
    const winners = responses.filter((response) => response.status === 200);
    expect(winners).toHaveLength(1);
    expect(responses.filter((response) => response.status === 401)).toHaveLength(7);
    // There was reuse: no token of the family stays valid, not even the one the winner received
    for (const winner of winners) {
      await ctx
        .http()
        .post('/v1/auth/refresh')
        .send({ refreshToken: winner.body.tokens.refreshToken })
        .expect(401);
    }
    const active = await ctx.prisma.refreshToken.count({
      where: { userId: auth.user.id, revokedAt: null },
    });
    expect(active).toBe(0);
  });

  it('refresh rotates the token; reusing the old one drops the whole session', async () => {
    const auth = await registerUser(ctx);
    const first = auth.tokens.refreshToken;

    const rotated = await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: first })
      .expect(200);
    const second = rotated.body.tokens.refreshToken as string;
    expect(second).not.toBe(first);

    // reuse of the already rotated token: 401 and the whole family is revoked
    await ctx.http().post('/v1/auth/refresh').send({ refreshToken: first }).expect(401);
    await ctx.http().post('/v1/auth/refresh').send({ refreshToken: second }).expect(401);
  });

  it('logout revokes the session', async () => {
    const auth = await registerUser(ctx);
    await ctx
      .http()
      .post('/v1/auth/logout')
      .send({ refreshToken: auth.tokens.refreshToken })
      .expect(204);
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: auth.tokens.refreshToken })
      .expect(401);
  });

  it('refresh with a malformed or tampered token is 401', async () => {
    const auth = await registerUser(ctx);
    const [id] = auth.tokens.refreshToken.split('.');
    await ctx.http().post('/v1/auth/refresh').send({ refreshToken: 'abc' }).expect(401);
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: `${id}.adulterado` })
      .expect(401);
  });
});
