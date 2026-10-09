import type { LocalDate, PlayerState } from '@nextjourney/contracts';

import type { CheckRecord } from './apply-check.js';

export type UndoFailureReason = 'OUTRO_DIA' | 'CAPITULO_FECHADO';

export type UndoSummary = {
  expDevolvido: number;
  moedasDevolvidas: number;
};

export type UndoResult =
  { ok: true; state: PlayerState; summary: UndoSummary } | { ok: false; motivo: UndoFailureReason };

/**
 * Desfaz um check. Função pura.
 *
 * - Só no mesmo dia local do check ('OUTRO_DIA' caso contrário).
 * - Capítulo fechado é definitivo: o check que fechou o capítulo, e os de capítulos já fechados,
 *   não voltam ('CAPITULO_FECHADO').
 * - O nível nunca cai: se a reversão passar do início do nível, o EXP para em 0 do nível atual.
 * - O bônus de moedas por nível não é revertido.
 */
export function desfazerCheck(
  state: PlayerState,
  record: CheckRecord,
  hoje: LocalDate,
): UndoResult {
  if (record.localDate !== hoje) return { ok: false, motivo: 'OUTRO_DIA' };

  if (record.countsForChapter) {
    const chapterClosedSince =
      state.story.completed || state.story.chapter !== record.chapterAtCheck;
    if (record.closedChapter || chapterClosedSince) {
      return { ok: false, motivo: 'CAPITULO_FECHADO' };
    }
  }

  const expRemoved = Math.min(record.exp, state.expInLevel);
  const coinsRemoved = Math.min(record.coins, state.coins);

  return {
    ok: true,
    state: {
      ...state,
      expInLevel: state.expInLevel - expRemoved,
      expTotal: state.expTotal - expRemoved,
      coins: state.coins - coinsRemoved,
      totalChecks: Math.max(0, state.totalChecks - 1),
      story: record.countsForChapter
        ? {
            ...state.story,
            checksInChapter: Math.max(0, state.story.checksInChapter - 1),
          }
        : state.story,
    },
    summary: { expDevolvido: expRemoved, moedasDevolvidas: coinsRemoved },
  };
}
