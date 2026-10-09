import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

/** Configuração comum à API real e aos testes e2e. */
export function setupApp(app: INestApplication, options: { swagger: boolean }): void {
  app.useLogger(app.get(Logger));
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
