import { execFileSync } from 'node:child_process';

import { testDatabaseUrl } from './test-database.js';

/** Aplica as migrations no banco de teste antes de rodar os e2e. */
export default function setup(): void {
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'inherit',
  });
}
