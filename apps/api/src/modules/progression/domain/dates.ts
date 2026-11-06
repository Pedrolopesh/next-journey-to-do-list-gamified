import type { LocalDate } from '@nextjourney/contracts';

/**
 * Local dates (YYYY-MM-DD) with no implicit clock: everything receives the date as an argument. The
 * arithmetic uses UTC only as a calendar; no time zone is involved here.
 */

function toUtcDate(date: LocalDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

function toLocalDate(date: Date): LocalDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const result = toUtcDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return toLocalDate(result);
}

/** 0 = Sunday ... 6 = Saturday. */
export function dayOfWeek(date: LocalDate): number {
  return toUtcDate(date).getUTCDay();
}

/**
 * User's local day for an instant, in the profile's IANA time zone (the day turns at 00:00 in that
 * zone). Takes the instant as an argument: never reads the clock. Throws RangeError if the time
 * zone is invalid.
 */
export function localDay(instant: Date | number | string, timezone: string): LocalDate {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid instant');
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Local hour (0 to 23) of an instant in the user's time zone. Takes the instant as an argument. */
export function localHour(instant: Date | number | string, timezone: string): number {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid instant');
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return Number(hour);
}
