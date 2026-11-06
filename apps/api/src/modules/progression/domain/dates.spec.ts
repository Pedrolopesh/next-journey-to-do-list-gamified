import { describe, expect, it } from 'vitest';

import { addDays, dayOfWeek, localDay } from './dates.js';

describe('addDays and dayOfWeek', () => {
  it('crosses month, year and leap-year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-10-09', 0)).toBe('2026-10-09');
  });

  it('day of week: 0 Sunday to 6 Saturday', () => {
    expect(dayOfWeek('2026-10-04')).toBe(0); // domingo
    expect(dayOfWeek('2026-10-09')).toBe(5); // sexta
    expect(dayOfWeek('2026-10-10')).toBe(6); // Saturday
  });
});

describe('localDay (the day turns at 00:00 in the user time zone)', () => {
  it('the same instant falls on different days depending on the time zone', () => {
    const instant = '2026-10-10T02:30:00Z';
    expect(localDay(instant, 'UTC')).toBe('2026-10-10');
    expect(localDay(instant, 'America/Sao_Paulo')).toBe('2026-10-09'); // UTC-3
    expect(localDay(instant, 'Asia/Tokyo')).toBe('2026-10-10'); // UTC+9
  });

  it('exact local midnight boundary', () => {
    expect(localDay('2026-10-10T02:59:59Z', 'America/Sao_Paulo')).toBe('2026-10-09');
    expect(localDay('2026-10-10T03:00:00Z', 'America/Sao_Paulo')).toBe('2026-10-10');
  });

  it('month and year boundaries in the local time zone', () => {
    expect(localDay('2027-01-01T01:00:00Z', 'America/Sao_Paulo')).toBe('2026-12-31');
    expect(localDay('2026-03-01T02:00:00Z', 'America/Sao_Paulo')).toBe('2026-02-28');
  });

  it('daylight saving: the day boundary follows the current offset', () => {
    // New York: DST starts on 2026-03-08 at 02:00 (UTC-5 -> UTC-4)
    expect(localDay('2026-03-08T04:59:59Z', 'America/New_York')).toBe('2026-03-07');
    expect(localDay('2026-03-08T05:00:00Z', 'America/New_York')).toBe('2026-03-08');
    // and ends on 2026-11-01 (UTC-4 -> UTC-5): 03:59:59Z is still day 1 at 23:59:59 (UTC-4)
    expect(localDay('2026-11-01T03:59:59Z', 'America/New_York')).toBe('2026-10-31');
    expect(localDay('2026-11-01T04:00:00Z', 'America/New_York')).toBe('2026-11-01');
  });

  it('accepts Date, number and string and rejects invalid input', () => {
    const iso = '2026-10-09T12:00:00Z';
    expect(localDay(new Date(iso), 'UTC')).toBe('2026-10-09');
    expect(localDay(Date.parse(iso), 'UTC')).toBe('2026-10-09');
    expect(() => localDay('not a date', 'UTC')).toThrow(RangeError);
    expect(() => localDay(iso, 'Marte/Olympus')).toThrow(RangeError);
  });
});
