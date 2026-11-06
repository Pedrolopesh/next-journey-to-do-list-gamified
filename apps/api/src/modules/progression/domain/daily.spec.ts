import { describe, expect, it } from 'vitest';

import { calculateStreak, type Daily, isOverdue } from './daily.js';

const TODOS = [0, 1, 2, 3, 4, 5, 6];
// 2026-10-05 is a Monday; 2026-10-09 is a Friday
const daily = (patch: Partial<Daily> = {}): Daily => ({
  scheduleDays: TODOS,
  createdOn: '2026-09-01',
  lastCheckedOn: null,
  ...patch,
});

describe('isOverdue', () => {
  it('an everyday daily without a check yesterday is overdue today', () => {
    expect(isOverdue(daily({ lastCheckedOn: '2026-10-07' }), '2026-10-09')).toBe(true);
  });

  it('checked yesterday is not overdue; checking today (even if overdue) clears it', () => {
    expect(isOverdue(daily({ lastCheckedOn: '2026-10-08' }), '2026-10-09')).toBe(false);
    expect(isOverdue(daily({ lastCheckedOn: '2026-10-09' }), '2026-10-09')).toBe(false);
  });

  it('the scheduled day of today itself does not count as overdue yet', () => {
    expect(isOverdue(daily({ lastCheckedOn: '2026-10-08' }), '2026-10-09')).toBe(false);
  });

  it('unscheduled days do not make a daily overdue', () => {
    // Monday and Wednesday (1 and 3). Today is Friday 2026-10-09; the last scheduled day was Wednesday 2026-10-07
    const d = daily({ scheduleDays: [1, 3], lastCheckedOn: '2026-10-07' });
    expect(isOverdue(d, '2026-10-09')).toBe(false);
    expect(
      isOverdue(daily({ scheduleDays: [1, 3], lastCheckedOn: '2026-10-05' }), '2026-10-09'),
    ).toBe(true);
  });

  it('never checked: overdue if there was a scheduled day since creation', () => {
    expect(isOverdue(daily({ createdOn: '2026-10-07' }), '2026-10-09')).toBe(true);
  });

  it('a daily created today is only overdue after a scheduled day ends', () => {
    expect(isOverdue(daily({ createdOn: '2026-10-09' }), '2026-10-09')).toBe(false);
    expect(isOverdue(daily({ createdOn: '2026-10-09' }), '2026-10-10')).toBe(true);
  });

  it('no scheduled day in the 7-day window means not overdue', () => {
    expect(isOverdue(daily({ scheduleDays: [] }), '2026-10-09')).toBe(false);
  });
});

describe('calculateStreak', () => {
  const base = { scheduleDays: TODOS, createdOn: '2026-09-01' };

  it('counts consecutive days ending today', () => {
    expect(
      calculateStreak(
        { ...base, checkedDays: ['2026-10-07', '2026-10-08', '2026-10-09'] },
        '2026-10-09',
      ),
    ).toBe(3);
  });

  it('today without a check yet does not break the streak', () => {
    expect(
      calculateStreak({ ...base, checkedDays: ['2026-10-07', '2026-10-08'] }, '2026-10-09'),
    ).toBe(2);
  });

  it('a scheduled day without a check breaks the streak', () => {
    expect(
      calculateStreak(
        { ...base, checkedDays: ['2026-10-06', '2026-10-08', '2026-10-09'] },
        '2026-10-09',
      ),
    ).toBe(2);
  });

  it('unscheduled days do not break the streak', () => {
    // agendado segunda(1), quarta(3), sexta(5): 05 seg, 07 qua, 09 sex
    const d = { scheduleDays: [1, 3, 5], createdOn: '2026-09-01' };
    expect(
      calculateStreak(
        { ...d, checkedDays: ['2026-10-05', '2026-10-07', '2026-10-09'] },
        '2026-10-09',
      ),
    ).toBe(3);
  });

  it('checking an overdue daily today restarts the streak at 1', () => {
    expect(
      calculateStreak({ ...base, checkedDays: ['2026-10-05', '2026-10-09'] }, '2026-10-09'),
    ).toBe(1);
  });

  it('does not count before creation or with no check', () => {
    expect(
      calculateStreak(
        {
          ...base,
          createdOn: '2026-10-08',
          checkedDays: ['2026-10-08', '2026-10-09'],
        },
        '2026-10-09',
      ),
    ).toBe(2);
    expect(calculateStreak({ ...base, checkedDays: [] }, '2026-10-09')).toBe(0);
  });

  it('crosses month and year boundaries', () => {
    expect(
      calculateStreak(
        {
          ...base,
          createdOn: '2026-12-01',
          checkedDays: ['2026-12-30', '2026-12-31', '2027-01-01'],
        },
        '2027-01-01',
      ),
    ).toBe(3);
  });
});
