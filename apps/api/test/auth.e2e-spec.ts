import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bearer,
  createTestApp,
  PASSWORD,
  registerBody,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

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

  it('signup creates the user, the 5 default categories and never returns a password hash', async () => {
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
    const stored = await ctx.prisma.user.findUniqueOrThrow({ where: { id: auth.user.id } });
    expect(stored.passwordHash?.startsWith('$argon2id$')).toBe(true);
  });

  it('a repeated email answers the same as a new email (without revealing that the account exists)', async () => {
    const email = uniqueEmail();
    await registerUser(ctx, email);
    const repeated = await ctx
      .http()
      .post('/v1/auth/register')
      .send({ ...registerBody(email.toUpperCase()), name: 'Outra' })
      .expect(202);
    const fresh = await ctx
      .http()
      .post('/v1/auth/register')
      .send(registerBody(uniqueEmail()))
      .expect(202);
    expect(repeated.body).toEqual(fresh.body);
  });

  it('validation does not return the value sent (password) and uses the standard error format', async () => {
    const res = await ctx
      .http()
      .post('/v1/auth/register')
      .send({
        name: 'x',
        email: 'nao-e-email',
        password: 'senhaSecretaFraca', // scan-allow: fake test password
        confirmPassword: 'senhaSecretaFraca', // scan-allow: fake test password
        acceptedTerms: true,
        termsVersion: '1',
        timezone: 'UTC',
      })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.requestId).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toContain('senhaSecretaFraca');
  });

  it('login: wrong password and a missing email give the SAME response (no enumeration)', async () => {
    const auth = await registerUser(ctx);
    const wrongPassword = await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email: auth.user.email, password: 'Errada#1234' }) // scan-allow: fake test password
      .expect(401);
    const unknown = await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email: uniqueEmail('naoexiste'), password: 'Errada#1234' }) // scan-allow: fake test password
      .expect(401);
    const strip = (body: Record<string, unknown>) => ({ code: body.code, message: body.message });
    expect(strip(wrongPassword.body)).toEqual(strip(unknown.body));
  });

  it('login correto devolve tokens; rota protegida exige o access token', async () => {
    const auth = await registerUser(ctx);
    const login = await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email: auth.user.email, password: PASSWORD }) // scan-allow: fake test password
      .expect(200);
    expect(login.body.tokens.accessToken).toBeTruthy();

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
