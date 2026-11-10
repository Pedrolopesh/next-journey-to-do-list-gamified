import { type INestApplication, RequestMethod } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { ENV, type Env } from './config/env.js';

/** Setup shared by the real API and the e2e tests. */
export function setupApp(app: INestApplication, options: { swagger: boolean }): void {
  app.useLogger(app.get(Logger));
  const env = app.get<Env>(ENV);

  // Behind a reverse proxy, trusts the first hop so the rate limit sees the real IP.
  if (env.TRUST_PROXY) (app as NestExpressApplication).set('trust proxy', 1);

  // The content security policy stays on everywhere. The Swagger page (outside production) uses
  // inline scripts, so only its own path gets a policy that allows them.
  const strict = helmet();
  const docs = helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'"],
      },
    },
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const relaxed = options.swagger && (req.path === '/docs' || req.path.startsWith('/docs/'));
    (relaxed ? docs : strict)(req, res, next);
  });

  // CORS restricted to an explicit list; with no list, no web origin is accepted.
  const origins = env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length > 0) app.enableCors({ origin: origins, credentials: false });
  // Versioning: /v1, with health and the public legal page (the store URL) at the root
  app.setGlobalPrefix('v1', {
    exclude: ['health', { path: 'legal/:slug', method: RequestMethod.GET }],
  });

  if (options.swagger) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Next Journey API').setVersion('1').addBearerAuth().build(),
    );
    SwaggerModule.setup('docs', app, document);
  }
}
