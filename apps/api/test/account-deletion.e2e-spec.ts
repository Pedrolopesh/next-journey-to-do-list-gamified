import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bearer,
  createTestApp,
  FakeVerifier,
  NOON_09,
  PASSWORD,
  registerUser,
  type TestContext,
  uniqueEmail,
} from './helpers.js';

const WRONG = 'Errada#1234'; // scan-allow: senha falsa de teste
/** Instante "agora" do relógio de teste, em segundos (para o `iat` do ID token). */
const NOW_S = Math.floor(Date.parse(NOON_09) / 1000);

describe('exclusão de conta exige reautenticação', () => {
  let ctx: TestContext;
  const verifier = new FakeVerifier();
  beforeAll(async () => {
    ctx = await createTestApp({ verifier });
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  const del = (auth: Awaited<ReturnType<typeof registerUser>>) =>
    ctx.http().delete('/v1/me').set('authorization', bearer(auth));
  const stillActive = async (userId: string) =>
    (await ctx.prisma.user.findUniqueOrThrow({ where: { id: userId } })).deletedAt === null;

  it('conta com senha: senha certa exclui', async () => {
    const auth = await registerUser(ctx);
    await del(auth).send({ password: PASSWORD }).expect(204); // scan-allow: senha falsa de teste
    expect(await stillActive(auth.user.id)).toBe(false);
  });

  it('senha errada, sem corpo ou prova do tipo errado: nada é excluído e a sessão continua valendo', async () => {
    const auth = await registerUser(ctx);
    const wrong = await del(auth).send({ password: WRONG }).expect(403);
    expect(wrong.body.code).toBe('REAUTH_FAILED');
    await del(auth).expect(400);
    await del(auth).send({}).expect(400);
    const social = await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(403);
    expect(social.body.code).toBe('REAUTH_FAILED');
    expect(await stillActive(auth.user.id)).toBe(true);
    // 403, nunca 401: o app não pode tratar como sessão encerrada
    await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
  });

  it('a sexta tentativa em 15 minutos é 429, até com a senha certa', async () => {
    const auth = await registerUser(ctx);
    for (let i = 0; i < 5; i += 1) await del(auth).send({ password: WRONG }).expect(403);
    const blocked = await del(auth).send({ password: PASSWORD }).expect(429); // scan-allow: senha falsa
    expect(blocked.body.code).toBe('RATE_LIMITED');
    expect(await stillActive(auth.user.id)).toBe(true);
  });

  it('senha certa zera as tentativas erradas anteriores', async () => {
    const auth = await registerUser(ctx);
    for (let i = 0; i < 4; i += 1) await del(auth).send({ password: WRONG }).expect(403);
    await del(auth).send({ password: PASSWORD }).expect(204); // scan-allow: senha falsa de teste
  });

  describe('conta só social', () => {
    const social = async () => {
      const email = uniqueEmail('social');
      verifier.identity = {
        subject: `g-${email}`,
        email,
        emailVerified: true,
        name: null,
        issuedAt: NOW_S,
      };
      const response = await ctx
        .http()
        .post('/v1/auth/google')
        .send({ idToken: 'ok', termsVersion: '1' })
        .expect(200);
      return { auth: response.body as Awaited<ReturnType<typeof registerUser>>, email };
    };

    it('o /me avisa que não tem senha', async () => {
      const { auth } = await social();
      const me = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
      expect(me.body.user.hasPassword).toBe(false);
      const withPassword = await registerUser(ctx);
      const other = await ctx
        .http()
        .get('/v1/me')
        .set('authorization', bearer(withPassword))
        .expect(200);
      expect(other.body.user.hasPassword).toBe(true);
    });

    it('ID token da identidade ligada exclui', async () => {
      const { auth } = await social();
      await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(204);
      expect(await stillActive(auth.user.id)).toBe(false);
    });

    it('ID token antigo (mais de 5 minutos) ou sem data de emissão não prova presença agora', async () => {
      const { auth, email } = await social();
      const identity = { subject: `g-${email}`, email, emailVerified: true, name: null };
      verifier.identity = { ...identity, issuedAt: NOW_S - 6 * 60 };
      await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(403);
      verifier.identity = identity;
      await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(403);
      verifier.identity = { ...identity, issuedAt: NOW_S - 60 };
      await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(204);
    });

    it('ID token inválido ou de outra pessoa não exclui', async () => {
      const { auth, email } = await social();
      await del(auth).send({ provider: 'google', idToken: 'invalido' }).expect(403); // scan-allow: dado de teste
      verifier.identity = {
        subject: 'sub-de-outra-pessoa',
        email: `outra-${email}`,
        emailVerified: true,
        name: null,
        issuedAt: NOW_S,
      };
      const res = await del(auth).send({ provider: 'google', idToken: 'ok' }).expect(403);
      expect(res.body.code).toBe('REAUTH_FAILED');
      // Senha não vale para conta que não tem senha
      await del(auth).send({ password: PASSWORD }).expect(403); // scan-allow: senha falsa de teste
      expect(await stillActive(auth.user.id)).toBe(true);
    });
  });
});
