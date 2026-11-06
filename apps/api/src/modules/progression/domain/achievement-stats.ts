import type { LocalDate } from '@nextjourney/contracts';

import { addDays } from './dates.js';

export type ItemKind = 'daily' | 'todo' | 'habit';

/** An active (not undone) check with what matters from its item. */
export type CheckRow = {
  checkedOn: LocalDate;
  itemId: string;
  type: ItemKind;
  categoryId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  dueAt: Date | null;
  completedAt: Date | null;
};

export type CheckStats = {
  distinctDays: number;
  bestDayRun: number;
  hadComeback: boolean;
  maxChecksInDay: number;
  /** Active (not undone) checks by item type. */
  checksByType: { daily: number; todo: number; habit: number };
  /** Distinct days with a daily check. */
  dailyDays: number;
  habitDays: number;
  bestHabitRun: number;
  maxHabitsInDay: number;
  /** Days with a check in 3 or more categories / in 5 or more categories. */
  balancedDays: { three: number; five: number };
  /** Days with a daily, a to-do and a habit checked together. */
  podiumDays: number;
  todosDone: number;
  todosOnTime: number;
  todosLate: number;
  hardTodosDone: number;
};

const DAY_MS = 86_400_000;

function daysBetween(a: LocalDate, b: LocalDate): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

/** Longest run of consecutive days in a list of days (no repeats, any order). */
export function longestRun(days: readonly LocalDate[]): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let previous: LocalDate | null = null;
  for (const day of sorted) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

/** Stats of the active checks: everything the consistency, habit and to-do achievements ask for. */
export function checkStats(rows: readonly CheckRow[]): CheckStats {
  const days = [...new Set(rows.map((r) => r.checkedOn))].sort();

  const perDay = new Map<LocalDate, number>();
  for (const r of rows) perDay.set(r.checkedOn, (perDay.get(r.checkedOn) ?? 0) + 1);

  const checksByType = { daily: 0, todo: 0, habit: 0 };
  for (const r of rows) checksByType[r.type] += 1;

  const habitRows = rows.filter((r) => r.type === 'habit');
  const habitDays = new Set(habitRows.map((r) => r.checkedOn)).size;
  const daysPerHabit = new Map<string, LocalDate[]>();
  const habitsPerDay = new Map<LocalDate, Set<string>>();
  for (const r of habitRows) {
    daysPerHabit.set(r.itemId, [...(daysPerHabit.get(r.itemId) ?? []), r.checkedOn]);
    const set = habitsPerDay.get(r.checkedOn) ?? new Set<string>();
    set.add(r.itemId);
    habitsPerDay.set(r.checkedOn, set);
  }

  const categoriesPerDay = new Map<LocalDate, Set<string>>();
  const kindsPerDay = new Map<LocalDate, Set<ItemKind>>();
  for (const r of rows) {
    const categories = categoriesPerDay.get(r.checkedOn) ?? new Set<string>();
    categories.add(r.categoryId);
    categoriesPerDay.set(r.checkedOn, categories);
    const kinds = kindsPerDay.get(r.checkedOn) ?? new Set<ItemKind>();
    kinds.add(r.type);
    kindsPerDay.set(r.checkedOn, kinds);
  }
  const daysWithAtLeast = (minimum: number): number =>
    [...categoriesPerDay.values()].filter((set) => set.size >= minimum).length;

  const todos = new Map<string, CheckRow>();
  for (const r of rows) if (r.type === 'todo') todos.set(r.itemId, r);
  const completed = [...todos.values()].filter((r) => r.completedAt !== null);

  return {
    distinctDays: days.length,
    bestDayRun: longestRun(days),
    hadComeback: days.some((day, i) => i > 0 && daysBetween(days[i - 1] as LocalDate, day) >= 8),
    maxChecksInDay: Math.max(0, ...perDay.values()),
    checksByType,
    dailyDays: new Set(rows.filter((r) => r.type === 'daily').map((r) => r.checkedOn)).size,
    habitDays,
    bestHabitRun: Math.max(0, ...[...daysPerHabit.values()].map(longestRun)),
    maxHabitsInDay: Math.max(0, ...[...habitsPerDay.values()].map((s) => s.size)),
    balancedDays: { three: daysWithAtLeast(3), five: daysWithAtLeast(5) },
    podiumDays: [...kindsPerDay.values()].filter((set) => set.size >= 3).length,
    todosDone: todos.size,
    todosOnTime: completed.filter(
      (r) => r.dueAt !== null && r.completedAt !== null && r.completedAt <= r.dueAt,
    ).length,
    todosLate: completed.filter(
      (r) => r.dueAt !== null && r.completedAt !== null && r.completedAt > r.dueAt,
    ).length,
    hardTodosDone: [...todos.values()].filter((r) => r.difficulty === 'hard').length,
  };
}

/** What happened on today's local day: how many to-dos were completed. */
export function todaySummary(rows: readonly CheckRow[], today: LocalDate): { todosToday: number } {
  const todayRows = rows.filter((r) => r.checkedOn === today);
  return {
    todosToday: new Set(todayRows.filter((r) => r.type === 'todo').map((r) => r.itemId)).size,
  };
}
