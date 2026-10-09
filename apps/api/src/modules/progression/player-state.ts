import type { PlayerState } from '@nextjourney/contracts';

import type { UserStats } from '../../generated/prisma/client.js';

export function toPlayerState(stats: UserStats): PlayerState {
  return {
    level: stats.level,
    expInLevel: stats.expInLevel,
    expTotal: stats.expTotal,
    coins: stats.coins,
    totalChecks: stats.totalChecks,
    story: {
      chapter: stats.storyChapter,
      checksInChapter: stats.storyChecksInChapter,
      completed: stats.storyCompleted,
    },
  };
}

export function fromPlayerState(state: PlayerState) {
  return {
    level: state.level,
    expInLevel: state.expInLevel,
    expTotal: state.expTotal,
    coins: state.coins,
    totalChecks: state.totalChecks,
    storyChapter: state.story.chapter,
    storyChecksInChapter: state.story.checksInChapter,
    storyCompleted: state.story.completed,
  };
}
