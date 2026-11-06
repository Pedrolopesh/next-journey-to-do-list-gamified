import { ACHIEVEMENT_CATALOG } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { type AchievementContext, achievementProgress } from './achievements.js';

const vazio = {
  totalChecks: 0,
  level: 1,
  itemsCreated: 0,
  coins: 0,
  chaptersCompleted: 0,
  storiesCompleted: 0,
  checkHour: null,
  todosToday: 0,
  fullDaysStreak: 0,
  perfectDays: 0,
  created: { daily: 0, todo: 0, habit: 0 },
  checksByType: { daily: 0, todo: 0, habit: 0 },
  todosDone: 0,
  todosOnTime: 0,
  todosLate: 0,
  hardTodosDone: 0,
  openTodos: 0,
  activeItems: 0,
  itemsWithNotes: 0,
  distinctDays: 0,
  bestDayRun: 0,
  hadComeback: false,
  maxChecksInDay: 0,
  dailyDays: 0,
  habitDays: 0,
  bestHabitRun: 0,
  maxHabitsInDay: 0,
  balancedDays: { three: 0, five: 0 },
  podiumDays: 0,
  lookChanges: 0,
  categoriesCreated: 0,
  reminderEnabled: false,
  unlocked: new Set<string>(),
} satisfies AchievementContext;

/** Numbers in a text, without the thousands separator ("3.000" becomes 3000). */
const numbers = (texto: string): number[] =>
  (texto.match(/\d[\d.]*/g) ?? []).map((n) => Number(n.replace(/\./g, '')));

describe('catalog and rules state the same number', () => {
  const comMeta = ACHIEVEMENT_CATALOG.flatMap((a) => {
    const progresso = achievementProgress(a.slug, vazio);
    return progresso ? [{ a, target: progresso.target }] : [];
  });

  it('there are achievements with a numeric target to check', () => {
    expect(comMeta.length).toBeGreaterThan(40);
  });

  it.each(comMeta.map(({ a, target }) => [a.slug, a.name, a.description, target] as const))(
    '%s: o texto cita a meta da regra',
    (_slug, name, description, target) => {
      expect(numbers(description), `description "${description}"`).toContain(target);
      // the name only has a number when it is the same target (e.g. "5-day flame")
      for (const n of numbers(name)) expect(n, `nome "${name}"`).toBe(target);
    },
  );
});
