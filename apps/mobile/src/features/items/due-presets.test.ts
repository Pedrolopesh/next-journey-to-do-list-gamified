import { describe, expect, it } from 'vitest';

import { dueDateFor, endOfDayIso } from './due-presets';
import { addDaysLocal, deviceToday } from './local-date';

describe('prazos rápidos', () => {
  it('converte o atalho em data local', () => {
    expect(dueDateFor('none', '2026-10-09')).toBeNull();
    expect(dueDateFor('today', '2026-10-09')).toBe('2026-10-09');
    expect(dueDateFor('tomorrow', '2026-10-31')).toBe('2026-11-01');
    expect(dueDateFor('week', '2026-12-28')).toBe('2027-01-04');
  });

  it('fim do dia com o deslocamento do fuso (UTC-3 e UTC+5:30)', () => {
    expect(endOfDayIso('2026-10-09', 180)).toBe('2026-10-09T23:59:00-03:00');
    expect(endOfDayIso('2026-10-09', -330)).toBe('2026-10-09T23:59:00+05:30');
    expect(endOfDayIso('2026-10-09', 0)).toBe('2026-10-09T23:59:00+00:00');
  });

  it('datas locais do calendário', () => {
    expect(addDaysLocal('2028-02-28', 1)).toBe('2028-02-29');
    expect(deviceToday(new Date(2026, 9, 9, 23, 59))).toBe('2026-10-09');
  });
});
