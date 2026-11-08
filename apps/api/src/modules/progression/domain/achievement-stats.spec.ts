import { describe, expect, it } from 'vitest';

import { type CheckRow, checkStats, longestRun, todaySummary } from './achievement-stats.js';

const row = (patch: Partial<CheckRow> & Pick<CheckRow, 'checkedOn'>): CheckRow => ({
  itemId: 'i1',
  type: 'daily',
  categoryId: 'c1',
  difficulty: 'easy',
  dueAt: null,
  completedAt: null,
  ...patch,
});

describe('longestRun', () => {
  it('finds the longest run of consecutive days, ignoring repeats and order', () => {
    expect(longestRun([])).toBe(0);
    expect(longestRun(['2026-10-03', '2026-10-01', '2026-10-02', '2026-10-02', '2026-10-09'])).toBe(
      3,
    );
  });
});

describe('checkStats', () => {
  it('counts distinct days, the run, the daily maximum and the comeback after 7 idle days', () => {
    const rows = [
      row({ checkedOn: '2026-10-01' }),
      row({ checkedOn: '2026-10-02', itemId: 'i2' }),
      row({ checkedOn: '2026-10-02', itemId: 'i3' }),
      row({ checkedOn: '2026-10-10' }),
    ];
    const s = checkStats(rows);
    expect(s.distinctDays).toBe(3);
    expect(s.bestDayRun).toBe(2);
    expect(s.maxChecksInDay).toBe(2);
    expect(s.hadComeback).toBe(true); // 02 -> 10: 7 days without a check
  });

  it('6 idle days is not a comeback yet', () => {
    const s = checkStats([row({ checkedOn: '2026-10-01' }), row({ checkedOn: '2026-10-08' })]);
    expect(s.hadComeback).toBe(false);
  });

  it('habits: distinct days, the run of a single habit and habits on the same day', () => {
    const habito = (checkedOn: string, itemId: string) => row({ checkedOn, itemId, type: 'habit' });
    const s = checkStats([
      habito('2026-10-01', 'h1'),
      habito('2026-10-02', 'h1'),
      habito('2026-10-03', 'h1'),
      habito('2026-10-03', 'h2'),
      habito('2026-10-09', 'h2'),
    ]);
    expect(s.habitDays).toBe(4);
    expect(s.bestHabitRun).toBe(3);
    expect(s.maxHabitsInDay).toBe(2);
    expect(s.checksByType.habit).toBe(5);
  });

  it('to-dos: done, on time, late and hard (each to-do counts once)', () => {
    const due = new Date('2026-10-05T12:00:00Z');
    const todo = (itemId: string, completedAt: string, extra: Partial<CheckRow> = {}) =>
      row({
        checkedOn: '2026-10-05',
        itemId,
        type: 'todo',
        completedAt: new Date(completedAt),
        ...extra,
      });
    const s = checkStats([
      todo('t1', '2026-10-05T10:00:00Z', { dueAt: due }), // on time
      todo('t1', '2026-10-05T10:00:00Z', { dueAt: due }), // repeated: does not count twice
      todo('t2', '2026-10-06T10:00:00Z', { dueAt: due, difficulty: 'hard' }), // late and hard
      todo('t3', '2026-10-06T10:00:00Z'), // no due date
    ]);
    expect(s.todosDone).toBe(3);
    expect(s.todosOnTime).toBe(1);
    expect(s.todosLate).toBe(1);
    expect(s.hardTodosDone).toBe(1);
  });
});

describe('todaySummary', () => {
  it('counts only the to-dos completed on the current day', () => {
    const today = '2026-10-09';
    const s = todaySummary(
      [
        row({ checkedOn: today, type: 'daily' }),
        row({ checkedOn: today, type: 'todo', itemId: 't' }),
        row({ checkedOn: '2026-10-08', type: 'todo', itemId: 't2' }),
      ],
      today,
    );
    expect(s).toEqual({ todosToday: 1 });
  });
});

describe('days with several categories, podium and daily days', () => {
  it('counts the days with 3 and 5 categories, the podium days and the daily days', () => {
    const cat = (day: string, n: number, type: CheckRow['type'] = 'daily') =>
      Array.from({ length: n }, (_, i) =>
        row({ checkedOn: day, categoryId: `c${i}`, itemId: `${day}-${i}`, type }),
      );
    const s = checkStats([
      ...cat('2026-10-01', 5), // 5 categories
      ...cat('2026-10-02', 3), // 3 categories
      ...cat('2026-10-03', 2), // only 2
      row({ checkedOn: '2026-10-04', type: 'todo', itemId: 't' }),
      row({ checkedOn: '2026-10-04', type: 'habit', itemId: 'h' }),
      row({ checkedOn: '2026-10-04', type: 'daily', itemId: 'd' }), // podium
    ]);
    expect(s.balancedDays).toEqual({ three: 2, five: 1 });
    expect(s.podiumDays).toBe(1);
    expect(s.dailyDays).toBe(4);
  });
});
