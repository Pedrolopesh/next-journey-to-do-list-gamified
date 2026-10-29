import { randomUUID } from 'node:crypto';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AuthResponse, CheckResult, Item } from '@nextjourney/contracts';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { AppError } from '../src/common/app-error.js';
import { Clock } from '../src/common/clock.js';
import {
  IdTokenVerifier,
  type SocialProvider,
  type VerifiedIdentity,
} from '../src/modules/auth/id-token-verifier.js';
import { Mailer } from '../src/modules/auth/mailer.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup-app.js';

/** Relógio controlável: os testes avançam o tempo para exercitar dia local, atraso e desfazer. */
export class TestClock extends Clock {
  constructor(private current: Date) {
    super();
  }
  now(): Date {
    return this.current;
  }
  set(iso: string): void {
    this.current = new Date(iso);
  }
}

export type TestContext = {
  app: INestApplication;
  prisma: PrismaService;
  clock: TestClock;
  http: () => ReturnType<typeof request>;
  mailer: FakeMailer;
};

// 12:00 em America/Sao_Paulo (UTC-3)
export const NOON_09 = '2026-10-09T15:00:00Z';

/** E-mail capturado pelo teste (não há envio real). */
export class FakeMailer extends Mailer {
  readonly sent: { to: string; subject: string; text: string }[] = [];
  /** Simula um provedor lento (ms) para provar que a resposta não espera o envio. */
  delayMs = 0;
  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    this.sent.push(message);
    if (this.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, this.delayMs));
  }
  /** Código de confirmação do último e-mail para o endereço. */
  lastVerificationCode(to: string): string | undefined {
    const mail = [...this.sent].reverse().find((entry) => entry.to === to);
    return mail?.text.match(/é (\d{6})\./)?.[1];
  }
  /** Segredo do link de recuperação do último e-mail para o endereço. */
  lastResetToken(to: string): string | undefined {
    const mail = [...this.sent].reverse().find((entry) => entry.to === to);
    return mail?.text.match(/token=([A-Za-z0-9_-]+)/)?.[1];
  }
}

export async function createTestApp(
  overrides: { verifier?: IdTokenVerifier; seedStarterItems?: boolean } = {},
): Promise<TestContext> {
  // Os e2e assumem conta sem itens: a semeadura fica desligada, e só os testes dela a ligam
  process.env.SEED_STARTER_ITEMS = overrides.seedStarterItems ? 'true' : 'false';
  const clock = new TestClock(new Date(NOON_09));
  const mailer = new FakeMailer();
  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Clock)
    .useValue(clock)
    .overrideProvider(Mailer)
    .useValue(mailer);
  if (overrides.verifier)
    builder = builder.overrideProvider(IdTokenVerifier).useValue(overrides.verifier);
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication({ bufferLogs: true });
  setupApp(app, { swagger: false });
  await app.init();
  return {
    app,
    mailer,
    prisma: app.get(PrismaService),
    clock,
    http: () => request(app.getHttpServer()),
  };
}

/** Verificador falso: devolve a identidade configurada ou recusa o token "invalido". */
export class FakeVerifier extends IdTokenVerifier {
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

export const PASSWORD = 'Teste#1234'; // scan-allow: senha falsa de teste

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}-${randomUUID()}@exemplo.com`;
}

/** Dados válidos de cadastro por senha. */
export const registerBody = (email: string, password = PASSWORD) => ({
  name: 'Pessoa de Teste',
  email,
  password,
  confirmPassword: password,
  acceptedTerms: true,
  termsVersion: '2026-10-01',
  timezone: 'America/Sao_Paulo',
});

/** Cadastra, confirma o e-mail com o código capturado e devolve a sessão. */
export async function registerUser(
  ctx: TestContext,
  email = uniqueEmail(),
  options: { story?: string | false } = {},
): Promise<AuthResponse> {
  await ctx.http().post('/v1/auth/register').send(registerBody(email)).expect(202);
  const code = ctx.mailer.lastVerificationCode(email.trim().toLowerCase());
  const response = await ctx
    .http()
    .post('/v1/auth/verify-email')
    .send({ email, code, password: PASSWORD }) // scan-allow: senha falsa de teste
    .expect(200);
  const auth = response.body as AuthResponse;
  // A maioria dos testes precisa de uma história ativa (onboarding completo)
  const story = options.story === undefined ? 'beach' : options.story;
  if (story) {
    await ctx
      .http()
      .put('/v1/me/story')
      .set('authorization', `Bearer ${auth.tokens.accessToken}`)
      .send({ slug: story })
      .expect(200);
  }
  return auth;
}

export const bearer = (auth: AuthResponse): string => `Bearer ${auth.tokens.accessToken}`;

export async function firstCategoryId(ctx: TestContext, userId: string): Promise<string> {
  const category = await ctx.prisma.category.findFirstOrThrow({
    where: { userId },
    orderBy: { position: 'asc' },
  });
  return category.id;
}

export async function createItem(
  ctx: TestContext,
  auth: AuthResponse,
  body: Record<string, unknown>,
): Promise<Item> {
  const categoryId = await firstCategoryId(ctx, auth.user.id);
  const response = await ctx
    .http()
    .post('/v1/items')
    .set('authorization', bearer(auth))
    .send({ categoryId, title: 'Item de teste', difficulty: 'medium', ...body })
    .expect(201);
  return response.body as Item;
}

export function check(
  ctx: TestContext,
  auth: AuthResponse,
  itemId: string,
  checkId: string = randomUUID(),
) {
  return ctx
    .http()
    .post(`/v1/items/${itemId}/checks`)
    .set('authorization', bearer(auth))
    .send({ checkId });
}

export async function me(ctx: TestContext, auth: AuthResponse) {
  const response = await ctx.http().get('/v1/me').set('authorization', bearer(auth)).expect(200);
  return response.body as {
    player: {
      level: number;
      expInLevel: number;
      expTotal: number;
      coins: number;
      totalChecks: number;
      story: { chapter: number; completed: boolean };
    };
  };
}

export type { CheckResult };
