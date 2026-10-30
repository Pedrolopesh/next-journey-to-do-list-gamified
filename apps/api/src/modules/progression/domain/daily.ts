import type { LocalDate } from '@nextjourney/contracts';

import { addDays, diaDaSemana } from './dates.js';

export type Diario = {
  /** Scheduled days, from 0 (Sunday) to 6 (Saturday). "Every day" means all 7. */
  scheduleDays: readonly number[];
  createdOn: LocalDate;
  lastCheckedOn: LocalDate | null;
};

const MAX_LOOKBACK_DAYS = 3660;

function agendadoEm(diario: Pick<Diario, 'scheduleDays'>, dia: LocalDate): boolean {
  return diario.scheduleDays.includes(diaDaSemana(dia));
}

/**
 * A daily is overdue when its last scheduled day before today ended without a check. Takes `hoje`
 * as an argument and never reads the clock. Rules: docs/api/progressao-e-jogo.md.
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
  /** Local days with an active (not undone) check. */
  diasMarcados: readonly LocalDate[];
};

/**
 * Streak of consecutive days with a check. Checking an overdue daily today restarts it at 1. Rules:
 * docs/api/progressao-e-jogo.md.
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
