import { PrismaPg } from '@prisma/adapter-pg';

import { SystemClock } from '../src/common/clock.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { AchievementsService } from '../src/modules/achievements/achievements.service.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';

try {
  process.loadEnvFile('.env');
} catch {
  // without .env
}

/**
 * Achievements backfill: unlocks, already marked as notified (no modal), what each user already met.
 * Idempotent: running it again unlocks nothing twice. Usage: pnpm --filter @nextjourney/api db:backfill-achievements
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const service = new AchievementsService(prisma as unknown as PrismaService, new SystemClock());
const total = await service.backfillAll();
await prisma.$disconnect();
process.stdout.write(`retroativo ok: ${total} conquistas liberadas\n`);
