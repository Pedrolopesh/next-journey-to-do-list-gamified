import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Logger, LoggerModule } from 'nestjs-pino';

import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { ENV, type Env } from './config/env.js';
import { CoreModule } from './core.module.js';
import { AchievementsModule } from './modules/achievements/achievements.module.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { HomeModule } from './modules/home/home.module.js';
import { ItemsModule } from './modules/items/items.module.js';
import { MeModule } from './modules/me/me.module.js';
import { SecurityModule } from './modules/security/security.module.js';
import { StoriesModule } from './modules/stories/stories.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

const REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;

@Module({
  imports: [
    CoreModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    // Two per-IP, per-minute limits: a general one and, only on the authentication routes, a
    // stricter one.
    ThrottlerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        throttlers: [
          { name: 'default', ttl: 60_000, limit: env.THROTTLE_LIMIT },
          {
            name: 'auth',
            ttl: 60_000,
            limit: env.THROTTLE_AUTH_LIMIT,
            skipIf: (context) => context.getClass() !== AuthController,
          },
        ],
      }),
    }),
    LoggerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level: env.LOG_LEVEL,
          // requestId: uses a valid incoming x-request-id or generates a UUID; it goes back in the
          // header.
          genReqId: (req, res) => {
            const header = req.headers['x-request-id'];
            const id =
              typeof header === 'string' && REQUEST_ID.test(header) ? header : randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          // Metadata only: the request body is never logged.
          serializers: {
            req: (req: { id: string; method: string; url: string }) => ({
              id: req.id,
              method: req.method,
              url: req.url.split('?')[0],
            }),
            res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
          },
          customProps: (req) => ({ userId: (req as { user?: { id: string } }).user?.id }),
          // Defense in depth: even if something is logged by mistake, these fields disappear.
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              '*.password',
              '*.token',
              '*.refreshToken',
              '*.accessToken',
              '*.idToken',
              '*.email',
            ],
            censor: '[REDACTED]',
          },
          ...(env.NODE_ENV === 'development'
            ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
            : {}),
        },
      }),
    }),
    SecurityModule,
    AuthModule,
    ItemsModule,
    MeModule,
    StoriesModule,
    CategoriesModule,
    AchievementsModule,
    HomeModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_FILTER,
      inject: [Logger],
      useFactory: (logger: Logger) => new AllExceptionsFilter(logger),
    },
  ],
})
export class AppModule {}
