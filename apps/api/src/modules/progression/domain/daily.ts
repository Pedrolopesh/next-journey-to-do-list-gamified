import type { LocalDate } from '@nextjourney/contracts';

import { addDays, dayOfWeek } from './dates.js';

export type Daily = {
  /** Scheduled days, from 0 (Sunday) to 6 (Saturday). "Every day" means all 7. */
  scheduleDays: readonly number[];
  createdOn: LocalDate;
  lastCheckedOn: LocalDate | null;
};

const MAX_LOOKBACK_DAYS = 3660;

function isScheduledOn(daily: Pick<Daily, 'scheduleDays'>, day: LocalDate): boolean {
  return daily.scheduleDays.includes(dayOfWeek(day));
}

/**
 * A daily is overdue when its last scheduled day before today ended without a check. Takes `today`
 * as an argument and never reads the clock. Rules: docs/api/progression-and-game.md.
 */
export function isOverdue(daily: Daily, today: LocalDate): boolean {
  for (let i = 1; i <= 7; i += 1) {
    const day = addDays(today, -i);
    if (day < daily.createdOn) return false;
    if (isScheduledOn(daily, day)) {
      return daily.lastCheckedOn === null || daily.lastCheckedOn < day;
    }
  }
  return false;
}

export type DailyHistory = Pick<Daily, 'scheduleDays' | 'createdOn'> & {
  /** Local days with an active (not undone) check. */
  checkedDays: readonly LocalDate[];
};

/**
 * Streak of consecutive days with a check. Checking an overdue daily today restarts it at 1. Rules:
 * docs/api/progression-and-game.md.
 */
export function calculateStreak(historico: DailyHistory, today: LocalDate): number {
  const checkedSets = new Set(historico.checkedDays);
  let streak = 0;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i += 1) {
    const day = addDays(today, -i);
    if (day < historico.createdOn) break;
    if (checkedSets.has(day)) {
      streak += 1;
    } else if (i > 0 && isScheduledOn(historico, day)) {
      break;
    }
  }
  return streak;
}
