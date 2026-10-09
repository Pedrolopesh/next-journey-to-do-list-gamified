import type { LocalDate } from '@nextjourney/contracts';

import { addDays, diaDaSemana } from './dates.js';

export type Diario = {
  /** Dias agendados, de 0 (domingo) a 6 (sábado). "Todo dia" = os 7 dias. */
  scheduleDays: readonly number[];
  createdOn: LocalDate;
  /** Último dia local em que o diário foi marcado. */
  lastCheckedOn: LocalDate | null;
};

const MAX_LOOKBACK_DAYS = 3660;

function agendadoEm(diario: Pick<Diario, 'scheduleDays'>, dia: LocalDate): boolean {
  return diario.scheduleDays.includes(diaDaSemana(dia));
}

/**
 * Um diário está atrasado quando o último dia agendado antes de hoje terminou sem check.
 * Só conta dias a partir da criação. Marcar hoje (mesmo um atrasado) tira o atraso.
 * Recebe `hoje` como argumento (nunca lê o relógio).
 */
export function estaAtrasado(diario: Diario, hoje: LocalDate): boolean {
  for (let i = 1; i <= 7; i += 1) {
    const dia = addDays(hoje, -i);
    if (dia < diario.createdOn) return false;
    if (agendadoEm(diario, dia)) {
      return diario.lastCheckedOn === null || diario.lastCheckedOn < dia;
    }
  }
  return false;
}

export type HistoricoDiario = Pick<Diario, 'scheduleDays' | 'createdOn'> & {
  /** Dias locais em que houve check ativo (não desfeito). */
  diasMarcados: readonly LocalDate[];
};

/**
 * Sequência: dias seguidos com check, voltando a partir de hoje.
 * Dia agendado sem check (que não seja hoje) quebra a sequência; dias não agendados não quebram.
 * Hoje ainda sem check não quebra (o dia não terminou). Marcar um atrasado hoje reinicia em 1.
 */
export function calcularStreak(historico: HistoricoDiario, hoje: LocalDate): number {
  const marcados = new Set(historico.diasMarcados);
  let streak = 0;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i += 1) {
    const dia = addDays(hoje, -i);
    if (dia < historico.createdOn) break;
    if (marcados.has(dia)) {
      streak += 1;
    } else if (i > 0 && agendadoEm(historico, dia)) {
      break;
    }
  }
  return streak;
}
