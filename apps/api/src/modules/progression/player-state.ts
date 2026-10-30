import type { PlayerState, StoryProgress } from '@nextjourney/contracts';

import type { UserStats } from '../../generated/prisma/client.js';

/**
 * Without an active story (onboarding incomplete) a check still earns EXP and coins but counts no
 * chapter.
 */
export const NO_STORY: StoryProgress = { chapter: 1, completed: true };

export function toPlayerState(stats: UserStats, story: StoryProgress = NO_STORY): PlayerState {
  return {
    level: stats.level,
    expInLevel: stats.expInLevel,
    expTotal: stats.expTotal,
    coins: stats.coins,
    totalChecks: stats.totalChecks,
    story,
  };
}

/** user_stats columns to write from the state (the story is saved in story_progress). */
export function statsColumns(state: PlayerState) {
  return {
    level: state.level,
    expInLevel: state.expInLevel,
    expTotal: state.expTotal,
    coins: state.coins,
    totalChecks: state.totalChecks,
  };
}
