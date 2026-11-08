import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';
import { ACHIEVEMENTS, STORIES } from './seed-data.js';

try {
  process.loadEnvFile('.env');
} catch {
  // without .env
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

// The catalog is fixed: stories that left it (e.g. the old themed ones) are removed, along with their
// progress (database cascade). Whoever had one active goes back to the story choice.
await prisma.story.deleteMany({ where: { slug: { notIn: STORIES.map((story) => story.slug) } } });

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
      create: { storyId: saved.id, number, title, text, sceneKey: story.slug },
      update: { title, text, sceneKey: story.slug },
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
      trail: achievement.trail,
      tier: achievement.tier,
      glyph: achievement.glyph,
      secret: achievement.secret,
      position: achievement.position,
    },
  });
}

await prisma.$disconnect();
process.stdout.write('seed ok: game_config, histórias, capítulos e conquistas\n');
