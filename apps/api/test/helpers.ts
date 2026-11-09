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

/** Controllable clock: tests advance time to exercise local day, overdue and undo. */
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

// 12:00 in America/Sao_Paulo (UTC-3)
export const NOON_09 = '2026-10-09T15:00:00Z';

/** Email captured by the test (nothing is really sent). */
export class FakeMailer extends Mailer {
  readonly sent: { to: string; subject: string; text: string }[] = [];
  /** Simulates a slow provider (ms) to prove the response does not wait for the send. */
  delayMs = 0;
  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    this.sent.push(message);
    if (this.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, this.delayMs));
  }
  /** Confirmation code from the last email to the address. */
  lastVerificationCode(to: string): string | undefined {
    const mail = [...this.sent].reverse().find((entry) => entry.to === to);
    return mail?.text.match(/é (\d{6})\./)?.[1];
  }
}

export async function createTestApp(
  overrides: { verifier?: IdTokenVerifier; seedStarterItems?: boolean } = {},
): Promise<TestContext> {
  // The e2e suite assumes accounts with no items: seeding is off unless a test turns it on
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

/** Fake verifier: returns the configured identity or rejects the token "invalido". */
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

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}-${randomUUID()}@exemplo.com`;
}

/**
 * Asks for the sign-in code of an email and trades it for a session. The account is created on the
 * first time. The mail interval is cleared first, so it also works for a second sign-in of the
 * same account in the same test.
 */
export async function loginByCode(
  ctx: TestContext,
  email: string,
  deviceName?: string,
): Promise<AuthResponse> {
  const normalized = email.trim().toLowerCase();
  await ctx.prisma.user.updateMany({
    where: { email: normalized },
    data: { verificationMailSentAt: null },
  });
  await ctx
    .http()
    .post('/v1/auth/email/start')
    .send({ email, timezone: 'America/Sao_Paulo', termsVersion: '2026-10-01' })
    .expect(202);
  const code = ctx.mailer.lastVerificationCode(normalized);
  const confirm = ctx.http().post('/v1/auth/email/confirm');
  if (deviceName) confirm.set('x-device-name', deviceName);
  const response = await confirm.send({ email, code }).expect(200);
  return response.body as AuthResponse;
}

/** Signs in by code (creating the account) and, by default, picks the first story. */
export async function registerUser(
  ctx: TestContext,
  email = uniqueEmail(),
  options: { story?: string | false } = {},
): Promise<AuthResponse> {
  const auth = await loginByCode(ctx, email);
  // Most tests need an active story (complete onboarding)
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

/** Asks for a fresh code for an existing account and returns it (the 60 s mail interval is cleared). */
export async function requestCode(ctx: TestContext, email: string): Promise<string> {
  await ctx.prisma.user.updateMany({ where: { email }, data: { verificationMailSentAt: null } });
  await ctx.http().post('/v1/auth/email/start').send({ email }).expect(202);
  return ctx.mailer.lastVerificationCode(email) ?? '';
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

/** Deletes the account proving ownership with a fresh email code. */
export async function deleteWithCode(ctx: TestContext, auth: AuthResponse): Promise<void> {
  const emailCode = await requestCode(ctx, auth.user.email);
  await ctx
    .http()
    .delete('/v1/me')
    .set('authorization', bearer(auth))
    .send({ emailCode })
    .expect(204);
}
