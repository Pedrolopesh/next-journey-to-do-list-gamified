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
 * A daily is overdue when the last scheduled day before today ended without a check.
 * Only counts days from creation. Checking today (even an overdue one) clears the overdue state.
 * Takes `hoje` as an argument (never reads the clock).
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
 * Streak: consecutive days with a check, going back from today.
 * A scheduled day without a check (other than today) breaks the streak; unscheduled days do not.
 * Today without a check yet does not break it (the day is not over).
 * Checking an overdue daily today restarts at 1.
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
