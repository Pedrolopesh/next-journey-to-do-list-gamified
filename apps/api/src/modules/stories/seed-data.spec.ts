import { storySchema } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { ACHIEVEMENTS, STORIES } from '../../../prisma/seed-data.js';

describe('versioned content (seed)', () => {
  it('has 6 stories, one per banner scene, with 5 chapters each', () => {
    expect(STORIES.map((story) => story.slug)).toEqual([
      'beach',
      'rooftop',
      'zombie',
      'castle',
      'paradise',
      'hell',
    ]);
    for (const story of STORIES) expect(story.chapters).toHaveLength(5);
  });

  it('each story respects the Story contract', () => {
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
          sceneKey: story.slug,
        })),
      });
      expect(parsed.success, story.slug).toBe(true);
    }
  });

  it('unique slugs and texts short enough for the chapter card', () => {
    expect(new Set(STORIES.map((story) => story.slug)).size).toBe(STORIES.length);
    for (const story of STORIES) {
      for (const [title, text] of story.chapters) {
        expect(title.length).toBeLessThanOrEqual(60);
        expect(text.length).toBeLessThanOrEqual(600);
      }
    }
  });

  it('does not repeat an achievement slug', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.slug)).size).toBe(ACHIEVEMENTS.length);
  });
});
