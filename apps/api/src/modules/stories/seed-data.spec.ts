import { storySchema } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { ACHIEVEMENTS, STORIES } from '../../../prisma/seed-data.js';
import { checksParaCapitulo } from '../progression/domain/index.js';

describe('conteúdo versionado (seed)', () => {
  it('tem 5 histórias com 5 capítulos cada', () => {
    expect(STORIES).toHaveLength(5);
    for (const story of STORIES) expect(story.chapters).toHaveLength(5);
  });

  it('cada história respeita o contrato de Story', () => {
    for (const story of STORIES) {
      const parsed = storySchema.safeParse({
        slug: story.slug,
        name: story.name,
        themeColor: story.themeColor,
        description: story.description,
        chapters: story.chapters.map(([title, text], index) => ({
          number: index + 1,
          title,
          text,
          requiredChecks: checksParaCapitulo(index + 1),
          sceneKey: `${story.slug}-${index + 1}`,
        })),
      });
      expect(parsed.success, story.slug).toBe(true);
    }
  });

  it('slugs únicos e textos curtos o bastante para o card do capítulo', () => {
    expect(new Set(STORIES.map((story) => story.slug)).size).toBe(STORIES.length);
    for (const story of STORIES) {
      for (const [title, text] of story.chapters) {
        expect(title.length).toBeLessThanOrEqual(60);
        expect(text.length).toBeLessThanOrEqual(600);
      }
    }
  });

  it('não repete o slug de conquista', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.slug)).size).toBe(ACHIEVEMENTS.length);
  });
});
