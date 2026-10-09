import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';
import { ACHIEVEMENTS, STORIES } from './seed-data.js';

try {
  process.loadEnvFile('.env');
} catch {
  // sem .env
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Seed versionado e idempotente: pode rodar quantas vezes precisar. */
await prisma.gameConfig.upsert({
  where: { key: 'game' },
  create: { key: 'game', value: DEFAULT_GAME_CONFIG },
  update: {},
});

for (const [position, story] of STORIES.entries()) {
  const saved = await prisma.story.upsert({
    where: { slug: story.slug },
    create: {
      slug: story.slug,
      name: story.name,
      themeColor: story.themeColor,
      description: story.description,
      position,
    },
    update: {
      name: story.name,
      themeColor: story.themeColor,
      description: story.description,
      position,
    },
  });
  for (const [index, [title, text]] of story.chapters.entries()) {
    const number = index + 1;
    await prisma.chapter.upsert({
      where: { storyId_number: { storyId: saved.id, number } },
      create: { storyId: saved.id, number, title, text, sceneKey: `${story.slug}-${number}` },
      update: { title, text, sceneKey: `${story.slug}-${number}` },
    });
  }
}

for (const achievement of ACHIEVEMENTS) {
  await prisma.achievement.upsert({
    where: { slug: achievement.slug },
    create: achievement,
    update: {
      name: achievement.name,
      description: achievement.description,
      iconKey: achievement.iconKey,
      rewardKey: achievement.rewardKey,
      position: achievement.position,
    },
  });
}

await prisma.$disconnect();
process.stdout.write('seed ok: game_config, histórias, capítulos e conquistas\n');
