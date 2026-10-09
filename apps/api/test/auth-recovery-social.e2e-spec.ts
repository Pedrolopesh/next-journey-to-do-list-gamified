import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppError } from '../src/common/app-error.js';
import {
  IdTokenVerifier,
  type SocialProvider,
  type VerifiedIdentity,
} from '../src/modules/auth/id-token-verifier.js';
import {
  bearer,
  createTestApp,
  NOON_09,
  PASSWORD,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const NEW_PASSWORD = 'Outra#9876'; // scan-allow: senha falsa de teste

/** Verificador falso: devolve a identidade configurada ou recusa o token "invalido". */
class FakeVerifier extends IdTokenVerifier {
  identity: VerifiedIdentity = {
    subject: 'sub-1',
    email: 'x@exemplo.com',
    emailVerified: true,
    name: 'Pessoa Social',
  };
  verify(_provider: SocialProvider, idToken: string): Promise<VerifiedIdentity> {
    if (idToken === 'invalido')
      return Promise.reject(new AppError(401, 'UNAUTHORIZED', 'Login social inválido'));
    return Promise.resolve(this.identity);
  }
}

describe('recuperação de senha', () => {
  let ctx: TestContext & { mailer: import('./helpers.js').FakeMailer };
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('responde 202 igual para e-mail existente e inexistente (sem enumeração)', async () => {
    ctx.clock.set(NOON_09);
    const auth = await registerUser(ctx);
    const known = await ctx
      .http()
      .post('/v1/auth/forgot-password')
      .send({ email: auth.user.email })
      .expect(202);
    const unknown = await ctx
      .http()
      .post('/v1/auth/forgot-password')
      .send({ email: uniqueEmail('nao') })
      .expect(202);
    expect(known.body).toEqual(unknown.body);
    expect(ctx.mailer.sent.filter((m) => m.to === auth.user.email)).toHaveLength(1);
    expect(ctx.mailer.sent.some((m) => m.to.startsWith('nao-'))).toBe(false);
  });

  it('o link troca a senha uma só vez, derruba as sessões e a senha nova passa a valer', async () => {
    ctx.clock.set(NOON_09);
    const auth = await registerUser(ctx);
    await ctx.http().post('/v1/auth/forgot-password').send({ email: auth.user.email }).expect(202);
    const token = ctx.mailer.lastResetToken(auth.user.email) as string;
    expect(token).toBeTruthy();
    // só o hash fica no banco
    const stored = await ctx.prisma.passwordReset.findFirstOrThrow({
      where: { userId: auth.user.id },
    });
    expect(stored.tokenHash).not.toContain(token);

    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token, newPassword: NEW_PASSWORD })
      .expect(204);
    // link de uso único
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token, newPassword: NEW_PASSWORD })
      .expect(400);
    // senha antiga não vale mais, a nova vale
    await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email: auth.user.email, password: PASSWORD })
      .expect(401); // scan-allow: senha falsa
    await ctx
      .http()
      .post('/v1/auth/login')
      .send({ email: auth.user.email, password: NEW_PASSWORD })
      .expect(200);
    // sessão anterior foi revogada
    await ctx
      .http()
      .post('/v1/auth/refresh')
      .send({ refreshToken: auth.tokens.refreshToken })
      .expect(401);
  });

  it('o link expira em 30 minutos e só o mais recente vale', async () => {
    ctx.clock.set(NOON_09);
    const auth = await registerUser(ctx);
    await ctx.http().post('/v1/auth/forgot-password').send({ email: auth.user.email }).expect(202);
    const first = ctx.mailer.lastResetToken(auth.user.email) as string;
    await ctx.http().post('/v1/auth/forgot-password').send({ email: auth.user.email }).expect(202);
    const second = ctx.mailer.lastResetToken(auth.user.email) as string;
    expect(second).not.toBe(first);
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token: first, newPassword: NEW_PASSWORD })
      .expect(400);

    ctx.clock.set('2026-10-09T15:31:00Z'); // 31 minutos depois
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token: second, newPassword: NEW_PASSWORD })
      .expect(400);
  });

  it('recusa senha nova fraca e token inventado', async () => {
    ctx.clock.set(NOON_09);
    const auth = await registerUser(ctx);
    await ctx.http().post('/v1/auth/forgot-password').send({ email: auth.user.email }).expect(202);
    const token = ctx.mailer.lastResetToken(auth.user.email) as string;
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token, newPassword: 'fraca' })
      .expect(400);
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token: 'inventado', newPassword: NEW_PASSWORD }) // scan-allow: dado de teste
      .expect(400);
    // o token ainda é válido depois de uma tentativa com senha fraca
    await ctx
      .http()
      .post('/v1/auth/reset-password')
      .send({ token, newPassword: NEW_PASSWORD })
      .expect(204);
  });
});

describe('login social', () => {
  let ctx: TestContext;
  const verifier = new FakeVerifier();
  beforeAll(async () => {
    ctx = await createTestApp({ verifier });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('primeiro acesso exige o aceite dos termos e cria a conta com as categorias padrão', async () => {
    const email = uniqueEmail('social');
    verifier.identity = {
      subject: `g-${email}`,
      email,
      emailVerified: true,
      name: 'Pessoa Social',
    };
    const sem = await ctx.http().post('/v1/auth/google').send({ idToken: 'ok' }).expect(400);
    expect(sem.body.code).toBe('TERMS_REQUIRED');

    const res = await ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '2026-10-01', timezone: 'America/Sao_Paulo' })
      .expect(200);
    expect(res.body.user).toMatchObject({
      email,
      name: 'Pessoa Social',
      timezone: 'America/Sao_Paulo',
    });
    expect(await ctx.prisma.category.count({ where: { userId: res.body.user.id } })).toBe(5);
    const stored = await ctx.prisma.user.findUniqueOrThrow({ where: { id: res.body.user.id } });
    expect(stored.passwordHash).toBeNull();
  });

  it('o segundo acesso entra na mesma conta (sem duplicar)', async () => {
    const email = uniqueEmail('social');
    verifier.identity = { subject: `g-${email}`, email, emailVerified: true, name: null };
    const first = await ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '1' })
      .expect(200);
    const second = await ctx.http().post('/v1/auth/google').send({ idToken: 'ok' }).expect(200);
    expect(second.body.user.id).toBe(first.body.user.id);
  });

  it('vincula ao mesmo usuário quando o e-mail VERIFICADO coincide', async () => {
    const existing = await registerUser(ctx);
    verifier.identity = {
      subject: `a-${existing.user.email}`,
      email: existing.user.email,
      emailVerified: true,
      name: null,
    };
    const res = await ctx.http().post('/v1/auth/apple').send({ idToken: 'ok' }).expect(200);
    expect(res.body.user.id).toBe(existing.user.id);
    expect(await ctx.prisma.authIdentity.count({ where: { userId: existing.user.id } })).toBe(1);
  });

  it('e-mail NÃO verificado nunca vincula nem cria conta (evita tomada de conta)', async () => {
    const existing = await registerUser(ctx);
    verifier.identity = {
      subject: `x-${existing.user.email}`,
      email: existing.user.email,
      emailVerified: false,
      name: null,
    };
    const res = await ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '1' })
      .expect(409);
    expect(res.body.code).toBe('EMAIL_UNAVAILABLE');
    expect(await ctx.prisma.authIdentity.count({ where: { userId: existing.user.id } })).toBe(0);
  });

  it('conta só social não entra com senha; token inválido é 401', async () => {
    const email = uniqueEmail('social');
    verifier.identity = { subject: `g-${email}`, email, emailVerified: true, name: null };
    await ctx.http().post('/v1/auth/google').send({ idToken: 'ok', termsVersion: '1' }).expect(200);
    await ctx.http().post('/v1/auth/login').send({ email, password: PASSWORD }).expect(401); // scan-allow: senha falsa
    await ctx.http().post('/v1/auth/google').send({ idToken: 'invalido' }).expect(401); // scan-allow: dado de teste
  });

  it('o access token do login social funciona nas rotas protegidas', async () => {
    const email = uniqueEmail('social');
    verifier.identity = { subject: `g-${email}`, email, emailVerified: true, name: null };
    const res = await ctx
      .http()
      .post('/v1/auth/google')
      .send({ idToken: 'ok', termsVersion: '1' })
      .expect(200);
    await ctx.http().get('/v1/me').set('authorization', bearer(res.body)).expect(200);
  });
});

describe('login social sem credenciais configuradas', () => {
  it('responde 503 (recurso indisponível), sem vazar detalhes', async () => {
    const ctx = await createTestApp(); // verificador real, sem GOOGLE_CLIENT_IDS
    const res = await ctx.http().post('/v1/auth/google').send({ idToken: 'qualquer' }).expect(503); // scan-allow: dado de teste
    expect(res.body.code).toBe('SOCIAL_LOGIN_UNAVAILABLE');
    await ctx.http().post('/v1/auth/apple').send({ idToken: 'qualquer' }).expect(503); // scan-allow: dado de teste
    await ctx.app.close();
  });
});
