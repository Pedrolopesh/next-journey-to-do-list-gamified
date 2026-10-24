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

describe('auth e segurança básica', () => {
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

  it('cadastro cria o usuário, as 5 categorias padrão e nunca devolve hash de senha', async () => {
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

  it('e-mail repetido responde igual ao e-mail novo (sem revelar que a conta existe)', async () => {
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

  it('validação não devolve o valor enviado (senha) e usa o formato padrão de erro', async () => {
    const res = await ctx
      .http()
      .post('/v1/auth/register')
      .send({
        name: 'x',
        email: 'nao-e-email',
        password: 'senhaSecretaFraca', // scan-allow: senha falsa de teste
        confirmPassword: 'senhaSecretaFraca', // scan-allow: senha falsa de teste
        acceptedTerms: true,
        termsVersion: '1',
        timezone: 'UTC',
      })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.requestId).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toContain('senhaSecretaFraca');
  });

  it('login: senha errada e e-mail inexistente dão a MESMA resposta (sem enumeração)', async () => {
    const auth = await registerUser(ctx);
    const wrongPassword = await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email: auth.user.email, password: 'Errada#1234' }) // scan-allow: senha falsa de teste
      .expect(401);
    const unknown = await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email: uniqueEmail('naoexiste'), password: 'Errada#1234' }) // scan-allow: senha falsa de teste
      .expect(401);
    const strip = (body: Record<string, unknown>) => ({ code: body.code, message: body.message });
    expect(strip(wrongPassword.body)).toEqual(strip(unknown.body));
  });

  it('login correto devolve tokens; rota protegida exige o access token', async () => {
    const auth = await registerUser(ctx);
    const login = await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email: auth.user.email, password: PASSWORD }) // scan-allow: senha falsa de teste
      .expect(200);
    expect(login.body.tokens.accessToken).toBeTruthy();

    await ctx.http().get('/v1/items').expect(401);
    await ctx.http().get('/v1/items').set('authorization', 'Bearer lixo').expect(401);
    await ctx.http().get('/v1/items').set('authorization', bearer(auth)).expect(200);
  });

  it('o token de acesso emitido leva emissor, audiência e identificador da chave', async () => {
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

  it('JWT assinado com outro segredo ou com alg none é recusado', async () => {
    const forged = [
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ4In0.', // alg: none
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4In0.assinatura-invalida',
    ];
    for (const token of forged) {
      await ctx.http().get('/v1/me').set('authorization', `Bearer ${token}`).expect(401);
    }
  });

  it('refresh simultâneo com o mesmo token: só um vence e a sessão toda cai (reuso)', async () => {
    const auth = await registerUser(ctx);
    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        ctx.http().post('/v1/auth/refresh').send({ refreshToken: auth.tokens.refreshToken }),
      ),
    );
    const winners = responses.filter((response) => response.status === 200);
    expect(winners).toHaveLength(1);
    expect(responses.filter((response) => response.status === 401)).toHaveLength(7);
    // Houve reuso: nenhum token da família continua valendo, nem o que o vencedor recebeu
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

  it('refresh rotaciona o token; reusar o antigo derruba a sessão inteira', async () => {
    const auth = await registerUser(ctx);
    const first = auth.tokens.refreshToken;

    const rotated = await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: first })
      .expect(200);
    const second = rotated.body.tokens.refreshToken as string;
    expect(second).not.toBe(first);

    // reuso do token já rotacionado: 401 e a família inteira é revogada
    await ctx.http().post('/v1/auth/refresh').send({ refreshToken: first }).expect(401);
    await ctx.http().post('/v1/auth/refresh').send({ refreshToken: second }).expect(401);
  });

  it('logout revoga a sessão', async () => {
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

  it('refresh com token mal formado ou adulterado é 401', async () => {
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
