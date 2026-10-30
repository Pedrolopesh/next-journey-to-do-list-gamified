import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { ENV, type Env } from './config/env.js';

/** Setup shared by the real API and the e2e tests. */
export function setupApp(app: INestApplication, options: { swagger: boolean }): void {
  app.useLogger(app.get(Logger));
  const env = app.get<Env>(ENV);

  // Behind a reverse proxy, trusts the first hop so the rate limit sees the real IP.
  if (env.TRUST_PROXY) (app as NestExpressApplication).set('trust proxy', 1);

  // The Swagger page uses inline scripts, so the CSP only relaxes when it is on.
  app.use(helmet(options.swagger ? { contentSecurityPolicy: false } : {}));

  // CORS restricted to an explicit list; with no list, no web origin is accepted.
  const origins = env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length > 0) app.enableCors({ origin: origins, credentials: false });
  // Versioning: /v1, with health at the root
  app.setGlobalPrefix('v1', { exclude: ['health'] });

  if (options.swagger) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Next Journey API').setVersion('1').addBearerAuth().build(),
    );
    SwaggerModule.setup('docs', app, document);
  }
}
