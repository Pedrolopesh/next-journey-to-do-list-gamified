import { defineConfig, env } from 'prisma/config';

// Prisma 7 não carrega o .env sozinho
try {
  process.loadEnvFile('.env');
} catch {
  // sem .env: a variável precisa vir do ambiente (CI)
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: env('DATABASE_URL') },
});
