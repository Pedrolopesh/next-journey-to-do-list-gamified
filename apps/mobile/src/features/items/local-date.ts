import type { LocalDate } from '@nextjourney/contracts';

/** Adds days to a local YYYY-MM-DD date (pure calendar, no time zone). */
export function addDaysLocal(date: LocalDate, days: number): LocalDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The device's local date (YYYY-MM-DD). */
export function deviceToday(now: Date = new Date()): LocalDate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
