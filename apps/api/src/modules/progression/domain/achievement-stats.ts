import type { LocalDate } from '@nextjourney/contracts';

import { addDays } from './dates.js';

export type TipoDeItem = 'daily' | 'todo' | 'habit';

/** Um check ativo (não desfeito) com o que importa do item dele. */
export type CheckRow = {
  checkedOn: LocalDate;
  itemId: string;
  type: TipoDeItem;
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
  checksByType: { daily: number; todo: number; habit: number };
  habitDays: number;
  bestHabitRun: number;
  maxHabitsInDay: number;
  todosDone: number;
  todosOnTime: number;
  todosLate: number;
  hardTodosDone: number;
};

const DAY_MS = 86_400_000;

function diffDias(a: LocalDate, b: LocalDate): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

/** Maior sequência de dias consecutivos numa lista de dias (sem repetição e em qualquer ordem). */
export function maiorSequencia(days: readonly LocalDate[]): number {
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

/** Estatísticas dos checks ativos: tudo que as conquistas de constância, hábito e tarefa pedem. */
export function estatisticasDeChecks(rows: readonly CheckRow[]): CheckStats {
  const days = [...new Set(rows.map((r) => r.checkedOn))].sort();

  const porDia = new Map<LocalDate, number>();
  for (const r of rows) porDia.set(r.checkedOn, (porDia.get(r.checkedOn) ?? 0) + 1);

  const checksByType = { daily: 0, todo: 0, habit: 0 };
  for (const r of rows) checksByType[r.type] += 1;

  const habitRows = rows.filter((r) => r.type === 'habit');
  const habitDays = new Set(habitRows.map((r) => r.checkedOn)).size;
  const diasPorHabito = new Map<string, LocalDate[]>();
  const habitosPorDia = new Map<LocalDate, Set<string>>();
  for (const r of habitRows) {
    diasPorHabito.set(r.itemId, [...(diasPorHabito.get(r.itemId) ?? []), r.checkedOn]);
    const set = habitosPorDia.get(r.checkedOn) ?? new Set<string>();
    set.add(r.itemId);
    habitosPorDia.set(r.checkedOn, set);
  }

  const todos = new Map<string, CheckRow>();
  for (const r of rows) if (r.type === 'todo') todos.set(r.itemId, r);
  const concluidas = [...todos.values()].filter((r) => r.completedAt !== null);

  return {
    distinctDays: days.length,
    bestDayRun: maiorSequencia(days),
    hadComeback: days.some((day, i) => i > 0 && diffDias(days[i - 1] as LocalDate, day) >= 8),
    maxChecksInDay: Math.max(0, ...porDia.values()),
    checksByType,
    habitDays,
    bestHabitRun: Math.max(0, ...[...diasPorHabito.values()].map(maiorSequencia)),
    maxHabitsInDay: Math.max(0, ...[...habitosPorDia.values()].map((s) => s.size)),
    todosDone: todos.size,
    todosOnTime: concluidas.filter(
      (r) => r.dueAt !== null && r.completedAt !== null && r.completedAt <= r.dueAt,
    ).length,
    todosLate: concluidas.filter(
      (r) => r.dueAt !== null && r.completedAt !== null && r.completedAt > r.dueAt,
    ).length,
    hardTodosDone: [...todos.values()].filter((r) => r.difficulty === 'hard').length,
  };
}

/** O que aconteceu no dia local de hoje (categorias e tipos com check, tarefas concluídas). */
export function resumoDeHoje(
  rows: readonly CheckRow[],
  hoje: LocalDate,
): { categoriesToday: number; typesToday: number; todosToday: number } {
  const hojeRows = rows.filter((r) => r.checkedOn === hoje);
  return {
    categoriesToday: new Set(hojeRows.map((r) => r.categoryId)).size,
    typesToday: new Set(hojeRows.map((r) => r.type)).size,
    todosToday: new Set(hojeRows.filter((r) => r.type === 'todo').map((r) => r.itemId)).size,
  };
}
