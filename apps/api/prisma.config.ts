import { defineConfig, env } from 'prisma/config';

// Prisma 7 does not load .env by itself
try {
  process.loadEnvFile('.env');
} catch {
  // without .env: the variable must come from the environment (CI)
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: env('DATABASE_URL') },
});
