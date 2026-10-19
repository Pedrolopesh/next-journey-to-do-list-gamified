import { ACHIEVEMENT_CATALOG } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { type AchievementContext, progressoDaConquista } from './achievements.js';

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

/** Números de um texto, sem o ponto de milhar ("3.000" vira 3000). */
const numeros = (texto: string): number[] =>
  (texto.match(/\d[\d.]*/g) ?? []).map((n) => Number(n.replace(/\./g, '')));

describe('catálogo e regras dizem o mesmo número', () => {
  const comMeta = ACHIEVEMENT_CATALOG.flatMap((a) => {
    const progresso = progressoDaConquista(a.slug, vazio);
    return progresso ? [{ a, alvo: progresso.target }] : [];
  });

  it('há conquistas com meta numérica para conferir', () => {
    expect(comMeta.length).toBeGreaterThan(40);
  });

  it.each(comMeta.map(({ a, alvo }) => [a.slug, a.name, a.description, alvo] as const))(
    '%s: o texto cita a meta da regra',
    (_slug, name, description, alvo) => {
      expect(numeros(description), `descrição "${description}"`).toContain(alvo);
      // o nome só tem número quando é a mesma meta (ex.: "Chama de 5 dias")
      for (const n of numeros(name)) expect(n, `nome "${name}"`).toBe(alvo);
    },
  );
});
