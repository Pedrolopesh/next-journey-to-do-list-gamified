import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { ENV, type Env } from './config/env.js';

/** Configuração comum à API real e aos testes e2e. */
export function setupApp(app: INestApplication, options: { swagger: boolean }): void {
  app.useLogger(app.get(Logger));
  const env = app.get<Env>(ENV);

  // Atrás de proxy reverso, confia no primeiro salto para o rate limit ver o IP real
  if (env.TRUST_PROXY) (app as NestExpressApplication).set('trust proxy', 1);

  // A página do Swagger usa scripts inline, então a CSP só relaxa quando ele está ligado
  app.use(helmet(options.swagger ? { contentSecurityPolicy: false } : {}));

  // CORS restrito a uma lista explícita; sem lista, nenhuma origem web é aceita
  const origins = env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length > 0) app.enableCors({ origin: origins, credentials: false });
  // Versionamento /v1; o health fica na raiz
  app.setGlobalPrefix('v1', { exclude: ['health'] });

  if (options.swagger) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Next Journey API').setVersion('1').addBearerAuth().build(),
    );
    SwaggerModule.setup('docs', app, document);
  }
}
