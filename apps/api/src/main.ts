import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';
import { setupApp } from './setup-app.js';

// Loads .env in development (in production the variables come from the environment).
try {
  process.loadEnvFile('.env');
} catch {
  // sem .env
}

async function bootstrap(): Promise<void> {
  const env = loadEnv(); // fails right away if a variable is missing
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  setupApp(app, { swagger: env.NODE_ENV !== 'production' });
  app.enableShutdownHooks();
  await app.listen(env.PORT, env.HOST);
}

await bootstrap();
