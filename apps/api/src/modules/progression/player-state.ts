import type { PlayerState, StoryProgress } from '@nextjourney/contracts';

import type { UserStats } from '../../generated/prisma/client.js';

/** Sem história ativa (onboarding incompleto) o check rende EXP e moedas mas não conta capítulo. */
export const NO_STORY: StoryProgress = { chapter: 1, checksInChapter: 0, completed: true };

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

/** Colunas de user_stats a gravar a partir do estado (a história é gravada em story_progress). */
export function statsColumns(state: PlayerState) {
  return {
    level: state.level,
    expInLevel: state.expInLevel,
    expTotal: state.expTotal,
    coins: state.coins,
    totalChecks: state.totalChecks,
  };
}
