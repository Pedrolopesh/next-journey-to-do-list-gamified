import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Logger, LoggerModule } from 'nestjs-pino';

import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { ENV, type Env } from './config/env.js';
import { CoreModule } from './core.module.js';
import { AchievementsModule } from './modules/achievements/achievements.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { HomeModule } from './modules/home/home.module.js';
import { ItemsModule } from './modules/items/items.module.js';
import { MeModule } from './modules/me/me.module.js';
import { StoriesModule } from './modules/stories/stories.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

const REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;

@Module({
  imports: [
    CoreModule,
    PrismaModule,
    LoggerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level: env.LOG_LEVEL,
          // requestId: usa o x-request-id válido que vier ou gera um UUID; volta no header
          genReqId: (req, res) => {
            const header = req.headers['x-request-id'];
            const id =
              typeof header === 'string' && REQUEST_ID.test(header) ? header : randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          // Só metadados: corpo de requisição nunca é logado
          serializers: {
            req: (req: { id: string; method: string; url: string }) => ({
              id: req.id,
              method: req.method,
              url: req.url.split('?')[0],
            }),
            res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
          },
          customProps: (req) => ({ userId: (req as { user?: { id: string } }).user?.id }),
          // Defesa em profundidade: mesmo que algo seja logado por engano, estes campos somem
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
    {
      provide: APP_FILTER,
      inject: [Logger],
      useFactory: (logger: Logger) => new AllExceptionsFilter(logger),
    },
  ],
})
export class AppModule {}
