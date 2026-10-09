import type { LocalDate } from '@nextjourney/contracts';

import { addDaysLocal } from './local-date';

export type DuePreset = 'none' | 'today' | 'tomorrow' | 'week';

/** Prazo rápido da tarefa → data local (AAAA-MM-DD) ou nula. O horário padrão é o fim do dia. */
export function dueDateFor(preset: DuePreset, today: LocalDate): LocalDate | null {
  switch (preset) {
    case 'none':
      return null;
    case 'today':
      return today;
    case 'tomorrow':
      return addDaysLocal(today, 1);
    case 'week':
      return addDaysLocal(today, 7);
  }
}

/** ISO com o fim do dia local (23:59) e o deslocamento do fuso (getTimezoneOffset: UTC-3 => 180). */
export function endOfDayIso(date: LocalDate, timezoneOffsetMinutes: number): string {
  const sign = timezoneOffsetMinutes <= 0 ? '+' : '-';
  const abs = Math.abs(timezoneOffsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${date}T23:59:00${sign}${hh}:${mm}`;
}
