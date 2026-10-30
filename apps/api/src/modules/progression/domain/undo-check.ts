import type { GameConfig, PlayerState } from '@nextjourney/contracts';

import { moedasPerdidasAoDesmarcar } from './levels.js';

export type UndoSummary = {
  /** Coins taken from the balance (never lets it go negative). */
  moedasPerdidas: number;
};

export type UndoResult = { state: PlayerState; summary: UndoSummary };

/**
 * Unchecks a check. Pure function.
 *
 * - Works on any day and in any chapter.
 * - EXP, level and chapter never go back: only the coins decrease.
 * - The loss is that of the current chapter (3, 5, 10, 15, 20), capped at the balance.
 * - The coin bonus per level is not reverted.
 */
export function desfazerCheck(
  state: PlayerState,
  config: Pick<GameConfig, 'undoCoinPenalty'>,
): UndoResult {
  const moedasPerdidas = Math.min(
    moedasPerdidasAoDesmarcar(state.story.chapter, config),
    state.coins,
  );
  return {
    state: {
      ...state,
      coins: state.coins - moedasPerdidas,
      totalChecks: Math.max(0, state.totalChecks - 1),
    },
    summary: { moedasPerdidas },
  };
}
