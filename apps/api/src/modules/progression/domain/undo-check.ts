import type { GameConfig, PlayerState } from '@nextjourney/contracts';

import { moedasPerdidasAoDesmarcar } from './levels.js';

export type UndoSummary = {
  /** Moedas tiradas do saldo (nunca deixa o saldo negativo). */
  moedasPerdidas: number;
};

export type UndoResult = { state: PlayerState; summary: UndoSummary };

/**
 * Desmarca um check. Função pura.
 *
 * - Vale em qualquer dia e em qualquer capítulo.
 * - O EXP, o nível e o capítulo nunca voltam: só as moedas diminuem.
 * - A perda é a do capítulo atual (3, 5, 10, 15, 20), limitada ao saldo.
 * - O bônus de moedas por nível não é revertido.
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
