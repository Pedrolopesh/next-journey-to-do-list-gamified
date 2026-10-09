import { randomUUID } from 'node:crypto';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AuthResponse, CheckResult, Item } from '@nextjourney/contracts';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { Clock } from '../src/common/clock.js';
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
};

// 12:00 em America/Sao_Paulo (UTC-3)
export const NOON_09 = '2026-10-09T15:00:00Z';

export async function createTestApp(): Promise<TestContext> {
  const clock = new TestClock(new Date(NOON_09));
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Clock)
    .useValue(clock)
    .compile();
  const app = moduleRef.createNestApplication({ bufferLogs: true });
  setupApp(app, { swagger: false });
  await app.init();
  return {
    app,
    prisma: app.get(PrismaService),
    clock,
    http: () => request(app.getHttpServer()),
  };
}

export const PASSWORD = 'Teste#1234'; // scan-allow: senha falsa de teste

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}-${randomUUID()}@exemplo.com`;
}

export async function registerUser(ctx: TestContext, email = uniqueEmail()): Promise<AuthResponse> {
  const response = await ctx
    .http()
    .post('/v1/auth/register')
    .send({
      name: 'Pessoa de Teste',
      email,
      password: PASSWORD, // scan-allow: senha falsa de teste
      confirmPassword: PASSWORD, // scan-allow: senha falsa de teste
      acceptedTerms: true,
      termsVersion: '2026-10-01',
      timezone: 'America/Sao_Paulo',
    })
    .expect(201);
  return response.body as AuthResponse;
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
      story: { chapter: number; checksInChapter: number; completed: boolean };
    };
  };
}

export type { CheckResult };
