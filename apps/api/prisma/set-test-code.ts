import { createHash } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

try {
  process.loadEnvFile('.env');
} catch {
  // in .env
}

/**
 * Development only: stores a known email code for a test account straight in the local database
 * (the UI tests do not read a mailbox). The app's own "send code" does not replace it, because the
 * last-send date is moved into the future, inside the minimum interval between emails. Refuses a
 * database that is not local.
 * Usage: pnpm --filter @nextjourney/api exec tsx prisma/set-test-code.ts <email> <6-digit code>
 */
const email = process.argv[2]?.trim().toLowerCase();
const code = process.argv[3];
const url = process.env.DATABASE_URL;
if (!email || !code || !/^\d{6}$/.test(code) || !url) {
  process.stderr.write('Pass the email and a 6-digit code, and set DATABASE_URL.\n');
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
  process.stderr.write('Refused: only runs against a local database, outside production.\n');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
if (!user) {
  process.stderr.write('Test account not found.\n');
  await prisma.$disconnect();
  process.exit(1);
}
const now = new Date();
await prisma.$transaction([
  prisma.emailVerification.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: now },
  }),
  prisma.emailVerification.create({
    data: {
      userId: user.id,
      codeHash: createHash('sha256').update(`${user.id}:${code}`).digest('hex'),
      expiresAt: new Date(now.getTime() + 60 * 60_000),
    },
  }),
  prisma.user.update({
    where: { id: user.id },
    data: { verificationMailSentAt: new Date(now.getTime() + 60 * 60_000) },
  }),
]);
await prisma.$disconnect();
process.stdout.write('test code stored\n');
