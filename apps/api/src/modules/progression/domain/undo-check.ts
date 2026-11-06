import type { GameConfig, PlayerState } from '@nextjourney/contracts';

import { coinsLostOnUndo } from './levels.js';

export type UndoSummary = {
  /** Coins taken from the balance (never lets it go negative). */
  coinsLost: number;
};

export type UndoResult = { state: PlayerState; summary: UndoSummary };

/**
 * Unchecks a check. Pure function. Rules: docs/api/progressao-e-jogo.md.
 */
export function undoCheck(
  state: PlayerState,
  config: Pick<GameConfig, 'undoCoinPenalty'>,
): UndoResult {
  const coinsLost = Math.min(coinsLostOnUndo(state.story.chapter, config), state.coins);
  return {
    state: {
      ...state,
      coins: state.coins - coinsLost,
      totalChecks: Math.max(0, state.totalChecks - 1),
    },
    summary: { coinsLost },
  };
}
