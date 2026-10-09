import { execFileSync } from 'node:child_process';

import { testDatabaseUrl } from './test-database.js';

/** Aplica as migrations e o seed (histórias, conquistas, game_config) no banco de teste. */
export default function setup(): void {
  const env = { ...process.env, DATABASE_URL: testDatabaseUrl() };
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], { env, stdio: 'inherit' });
  execFileSync('pnpm', ['exec', 'prisma', 'db', 'seed'], { env, stdio: 'inherit' });
}
