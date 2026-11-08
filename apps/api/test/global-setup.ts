import { execFileSync } from 'node:child_process';

import { testDatabaseUrl } from './test-database.js';

/** Applies the migrations and the seed (stories, achievements, game_config) to the test database. */
export default function setup(): void {
  const env = { ...process.env, DATABASE_URL: testDatabaseUrl() };
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], { env, stdio: 'inherit' });
  execFileSync('pnpm', ['exec', 'prisma', 'db', 'seed'], { env, stdio: 'inherit' });
}
