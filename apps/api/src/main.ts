import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';
import { setupApp } from './setup-app.js';

// Carrega o .env em desenvolvimento (em produção as variáveis vêm do ambiente)
try {
  process.loadEnvFile('.env');
} catch {
  // sem .env
}

async function bootstrap(): Promise<void> {
  const env = loadEnv(); // falha na hora se faltar variável
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  setupApp(app, { swagger: env.NODE_ENV !== 'production' });
  app.enableShutdownHooks();
  await app.listen(env.PORT, env.HOST);
}

await bootstrap();
