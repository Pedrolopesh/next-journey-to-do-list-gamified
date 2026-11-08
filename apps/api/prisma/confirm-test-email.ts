import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

try {
  process.loadEnvFile('.env');
} catch {
  // without .env
}

/**
 * Development only: marks the email of a test account as confirmed, straight in the local database
 * (the UI test script does not read a mailbox). Refuses a database that is not local.
 * Uso: pnpm --filter @nextjourney/api exec tsx prisma/confirm-test-email.ts <email>
 */
const email = process.argv[2]?.trim().toLowerCase();
const url = process.env.DATABASE_URL;
if (!email || !url) {
  process.stderr.write('Informe o e-mail e defina DATABASE_URL.\n');
  process.exit(1);
}
const isLocal = (): boolean => {
  try {
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(url).hostname);
  } catch {
    return false;
  }
};
if (process.env.NODE_ENV === 'production' || !isLocal()) {
  process.stderr.write('Recusado: só roda contra banco local e fora de produção.\n');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const result = await prisma.user.updateMany({
  where: { email, emailVerifiedAt: null },
  data: { emailVerifiedAt: new Date() },
});
await prisma.$disconnect();
process.stdout.write(`e-mail confirmado em ${result.count} conta(s)\n`);
