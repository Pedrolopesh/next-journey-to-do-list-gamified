import type { CheckResult } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { buildModalQueue } from './modal-queue';

const base: CheckResult = {
  expGained: 10,
  coinsGained: 2,
  level: 1,
  leveledUp: false,
  chapterProgress: { chapter: 1, checksInChapter: 1, requiredChecks: 10 },
  chapterCompleted: false,
  completedChapter: null,
  achievementsUnlocked: [],
};

describe('buildModalQueue', () => {
  it('um check comum não abre modal', () => {
    expect(buildModalQueue(base)).toEqual({ now: [], afterBanner: [] });
  });

  it('nível, depois conquistas, na ordem; o capítulo espera o banner', () => {
    const result: CheckResult = {
      ...base,
      leveledUp: true,
      level: 3,
      chapterCompleted: true,
      completedChapter: { number: 1, title: 'T', text: 'x', storyCompleted: false },
      achievementsUnlocked: [
        { slug: 'a', name: 'A', rewardKey: null },
        { slug: 'b', name: 'B', rewardKey: 'outfit-cape' },
      ],
    };
    const queue = buildModalQueue(result);
    expect(queue.now.map((m) => m.kind)).toEqual(['level', 'achievement', 'achievement']);
    expect(queue.now[0]).toEqual({ kind: 'level', level: 3 });
    expect(queue.afterBanner).toEqual([
      { kind: 'chapter', number: 1, title: 'T', text: 'x', storyCompleted: false },
    ]);
  });
});
