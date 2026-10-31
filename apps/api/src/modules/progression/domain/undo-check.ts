import type { GameConfig, PlayerState } from '@nextjourney/contracts';

import { moedasPerdidasAoDesmarcar } from './levels.js';

export type UndoSummary = {
  /** Coins taken from the balance (never lets it go negative). */
  moedasPerdidas: number;
};

export type UndoResult = { state: PlayerState; summary: UndoSummary };

/**
 * Unchecks a check. Pure function. Rules: docs/api/progressao-e-jogo.md.
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
