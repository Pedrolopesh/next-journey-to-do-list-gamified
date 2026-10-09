import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

try {
  process.loadEnvFile('.env');
} catch {
  // sem .env
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// game_config inicial. Conteúdo (histórias, conquistas) entra por seed versionado nas próximas fases.
await prisma.gameConfig.upsert({
  where: { key: 'game' },
  create: { key: 'game', value: DEFAULT_GAME_CONFIG },
  update: {},
});
await prisma.$disconnect();
process.stdout.write('seed ok: game_config\n');
