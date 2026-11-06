import { ACHIEVEMENT_CATALOG } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import {
  type AchievementContext,
  achievementProgress,
  type AchievementSlug,
  countFullDaysStreak,
  countPerfectDays,
  metAchievements,
} from './achievements.js';
import { localHour } from './dates.js';

const base: AchievementContext = {
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
  unlocked: new Set(),
};

const com = (patch: Partial<AchievementContext>): AchievementContext => ({ ...base, ...patch });

describe('metAchievements', () => {
  it('with nothing done, nothing is met', () => {
    expect(metAchievements(base)).toEqual([]);
  });

  // [slug, context at the threshold, context one step below (when there is a numeric threshold)]
  const cases: [AchievementSlug, Partial<AchievementContext>, Partial<AchievementContext>?][] = [
    ['primeiro-passo', { totalChecks: 1 }],
    ['diario-inaugural', { created: { daily: 1, todo: 0, habit: 0 } }],
    ['primeira-tarefa', { created: { daily: 0, todo: 1, habit: 0 } }],
    ['primeiro-habito', { created: { daily: 0, todo: 0, habit: 1 } }],
    ['rotina-marcada', { dailyDays: 4 }, { dailyDays: 3 }],
    ['tarefa-cumprida', { todosDone: 6 }, { todosDone: 5 }],
    [
      'habito-em-acao',
      { checksByType: { daily: 0, todo: 0, habit: 8 } },
      { checksByType: { daily: 0, todo: 0, habit: 7 } },
    ],
    ['cara-nova', { lookChanges: 1 }],
    ['voltou', { distinctDays: 3 }, { distinctDays: 2 }],
    ['hora-marcada', { reminderEnabled: true }],
    ['pena-leve', { itemsWithNotes: 10 }, { itemsWithNotes: 9 }],
    ['guarda-roupa', { lookChanges: 10 }, { lookChanges: 9 }],
    [
      'rotina-em-marcha',
      { checksByType: { daily: 30, todo: 0, habit: 0 } },
      { checksByType: { daily: 29, todo: 0, habit: 0 } },
    ],
    [
      'rotina-firme',
      { checksByType: { daily: 60, todo: 0, habit: 0 } },
      { checksByType: { daily: 59, todo: 0, habit: 0 } },
    ],
    [
      'rotina-de-ferro',
      { checksByType: { daily: 250, todo: 0, habit: 0 } },
      { checksByType: { daily: 249, todo: 0, habit: 0 } },
    ],
    [
      'mestre-da-rotina',
      { checksByType: { daily: 600, todo: 0, habit: 0 } },
      { checksByType: { daily: 599, todo: 0, habit: 0 } },
    ],
    ['dia-perfeito', { perfectDays: 8 }, { perfectDays: 7 }],
    ['chama-3-dias', { fullDaysStreak: 5 }, { fullDaysStreak: 4 }],
    ['chama-7-dias', { fullDaysStreak: 10 }, { fullDaysStreak: 9 }],
    ['chama-14-dias', { fullDaysStreak: 21 }, { fullDaysStreak: 20 }],
    ['chama-30-dias', { fullDaysStreak: 45 }, { fullDaysStreak: 44 }],
    ['pe-na-lista', { todosDone: 12 }, { todosDone: 11 }],
    ['executor', { todosDone: 50 }, { todosDone: 49 }],
    ['imparavel', { todosDone: 200 }, { todosDone: 199 }],
    ['maquina-de-entregas', { todosDone: 500 }, { todosDone: 499 }],
    [
      'lista-zerada',
      { openTodos: 0, todosDone: 5, todosToday: 1 },
      { todosDone: 4, todosToday: 1 },
    ],
    ['no-prazo', { todosOnTime: 15 }, { todosOnTime: 14 }],
    ['resgate', { todosLate: 1 }],
    ['peso-pesado', { hardTodosDone: 15 }, { hardTodosDone: 14 }],
    ['semente', { habitDays: 14 }, { habitDays: 13 }],
    ['raiz', { habitDays: 60 }, { habitDays: 59 }],
    ['arvore', { habitDays: 180 }, { habitDays: 179 }],
    ['floresta', { habitDays: 365 }, { habitDays: 364 }],
    ['habito-em-chama', { bestHabitRun: 6 }, { bestHabitRun: 5 }],
    ['habito-de-7', { bestHabitRun: 21 }, { bestHabitRun: 20 }],
    ['habito-de-30', { bestHabitRun: 45 }, { bestHabitRun: 44 }],
    ['habito-de-100', { bestHabitRun: 100 }, { bestHabitRun: 99 }],
    ['dia-de-foco', { maxHabitsInDay: 6 }, { maxHabitsInDay: 5 }],
    ['organizado', { itemsCreated: 15 }, { itemsCreated: 14 }],
    ['planejador', { itemsCreated: 40 }, { itemsCreated: 39 }],
    ['arquiteto-da-rotina', { itemsCreated: 100 }, { itemsCreated: 99 }],
    ['maratonista', { totalChecks: 250 }, { totalChecks: 249 }],
    ['semana-inteira', { bestDayRun: 7 }, { bestDayRun: 6 }],
    ['mes-de-constancia', { bestDayRun: 30 }, { bestDayRun: 29 }],
    ['madrugador', { checkHour: 6 }, { checkHour: 7 }],
    ['coruja', { checkHour: 22 }, { checkHour: 21 }],
    [
      'equilibrio',
      { balancedDays: { three: 10, five: 0 } },
      { balancedDays: { three: 9, five: 0 } },
    ],
    [
      'vida-em-equilibrio',
      { balancedDays: { three: 0, five: 18 } },
      { balancedDays: { three: 0, five: 17 } },
    ],
    ['do-meu-jeito', { categoriesCreated: 1 }],
    ['no-podio', { podiumDays: 16 }, { podiumDays: 15 }],
    ['coracao-valente', { hadComeback: true }],
    ['bolsa-cheia', { activeItems: 20 }, { activeItems: 19 }],
    ['dia-brilhante', { maxChecksInDay: 15 }, { maxChecksInDay: 14 }],
    ['diamante-bruto', { distinctDays: 200 }, { distinctDays: 199 }],
    ['aprendiz', { level: 5 }, { level: 4 }],
    ['veterano', { level: 8 }, { level: 7 }],
    ['mestre', { level: 12 }, { level: 11 }],
    ['lenda-do-nivel', { level: 20 }, { level: 19 }],
    ['novo-capitulo', { chaptersCompleted: 1 }],
    ['livro-aberto', { chaptersCompleted: 3 }, { chaptersCompleted: 2 }],
    ['lenda-viva', { storiesCompleted: 1 }],
    ['colecionador', { storiesCompleted: 3 }, { storiesCompleted: 2 }],
    ['cofrinho', { coins: 200 }, { coins: 199 }],
    ['tesouro', { coins: 800 }, { coins: 799 }],
    ['fortuna', { coins: 3000 }, { coins: 2999 }],
  ];

  it('each action criterion has a test case (collection ones have their own)', () => {
    const cobertas = new Set(cases.map(([slug]) => slug));
    const colecao = [
      'colecionador-de-medalhas',
      'cacador-de-trofeus',
      'primeiro-lugar',
      'louros',
      'cofre-aberto',
    ];
    const faltando = ACHIEVEMENT_CATALOG.map((a) => a.slug).filter(
      (slug) => !cobertas.has(slug) && !colecao.includes(slug),
    );
    expect(faltando).toEqual([]);
  });

  it.each(cases)('%s at the criterion threshold', (slug, threshold, below) => {
    expect(metAchievements(com(threshold))).toContain(slug);
    if (below) expect(metAchievements(com(below))).not.toContain(slug);
  });

  it('time-of-day ones only apply when the evaluation comes from a check', () => {
    expect(metAchievements(com({ checkHour: null }))).not.toContain('madrugador');
    expect(metAchievements(com({ checkHour: 6 }))).toContain('madrugador');
  });

  it('an empty list requires a to-do completed today and none open', () => {
    expect(metAchievements(com({ todosDone: 5, openTodos: 1, todosToday: 1 }))).not.toContain(
      'lista-zerada',
    );
    expect(metAchievements(com({ todosDone: 5, openTodos: 0, todosToday: 0 }))).not.toContain(
      'lista-zerada',
    );
  });
});

describe('collection achievements', () => {
  const slugs = (n: number): ReadonlySet<string> =>
    new Set(ACHIEVEMENT_CATALOG.slice(0, n).map((a) => a.slug));

  it('count the achievements already unlocked', () => {
    expect(metAchievements(com({ unlocked: slugs(13) }))).not.toContain('colecionador-de-medalhas');
    expect(metAchievements(com({ unlocked: slugs(14) }))).toContain('colecionador-de-medalhas');
    expect(metAchievements(com({ unlocked: slugs(35) }))).toContain('cacador-de-trofeus');
    expect(metAchievements(com({ unlocked: slugs(50) }))).toContain('primeiro-lugar');
  });

  it('Laurels requires every achievement of a track', () => {
    const trilha = ACHIEVEMENT_CATALOG.filter((a) => a.trail === 'tarefas').map((a) => a.slug);
    expect(metAchievements(com({ unlocked: new Set(trilha) }))).toContain('louros');
    expect(metAchievements(com({ unlocked: new Set(trilha.slice(1)) }))).not.toContain('louros');
  });

  it('Opened Vault requires every surprise except itself', () => {
    const surpresas = ACHIEVEMENT_CATALOG.filter(
      (a) => 'secret' in a && a.slug !== 'cofre-aberto',
    ).map((a) => a.slug);
    expect(surpresas.length).toBeGreaterThan(0);
    expect(metAchievements(com({ unlocked: new Set(surpresas) }))).toContain('cofre-aberto');
    expect(metAchievements(com({ unlocked: new Set(surpresas.slice(1)) }))).not.toContain(
      'cofre-aberto',
    );
  });
});

describe('achievementProgress', () => {
  it('returns the progress capped at the target and null for event achievements', () => {
    expect(achievementProgress('maratonista', com({ totalChecks: 37 }))).toEqual({
      current: 37,
      target: 250,
    });
    expect(achievementProgress('maratonista', com({ totalChecks: 500 }))).toEqual({
      current: 250,
      target: 250,
    });
    expect(achievementProgress('aprendiz', com({ level: 3 }))).toEqual({ current: 3, target: 5 });
    expect(achievementProgress('primeiro-passo', base)).toBeNull();
  });
});

describe('countPerfectDays', () => {
  const todos = [0, 1, 2, 3, 4, 5, 6];
  const daily = (days: string[]) => ({
    scheduleDays: todos,
    createdOn: '2026-09-01',
    checkedDays: days,
  });

  it('counts the days when 3 or more scheduled dailies were all done', () => {
    const days = ['2026-10-09'];
    expect(countPerfectDays([daily(days), daily(days), daily(days)], '2026-10-09')).toBe(1);
  });

  it('with fewer than 3 scheduled or one missing, it does not count', () => {
    const days = ['2026-10-09'];
    expect(countPerfectDays([daily(days), daily(days)], '2026-10-09')).toBe(0);
    expect(countPerfectDays([daily(days), daily(days), daily([])], '2026-10-09')).toBe(0);
  });
});

describe('countFullDaysStreak (7-day flame)', () => {
  const todos = [0, 1, 2, 3, 4, 5, 6];
  const days = (...d: string[]) => d;

  it('counts days when every scheduled daily was done', () => {
    const a = {
      scheduleDays: todos,
      createdOn: '2026-09-01',
      checkedDays: days('2026-10-07', '2026-10-08', '2026-10-09'),
    };
    const b = {
      scheduleDays: todos,
      createdOn: '2026-09-01',
      checkedDays: days('2026-10-07', '2026-10-08', '2026-10-09'),
    };
    expect(countFullDaysStreak([a, b], '2026-10-09')).toBe(3);
  });

  it('a daily missing on a day breaks the streak', () => {
    const a = {
      scheduleDays: todos,
      createdOn: '2026-09-01',
      checkedDays: days('2026-10-07', '2026-10-08', '2026-10-09'),
    };
    const b = {
      scheduleDays: todos,
      createdOn: '2026-09-01',
      checkedDays: days('2026-10-07', '2026-10-09'),
    }; // faltou day 8
    expect(countFullDaysStreak([a, b], '2026-10-09')).toBe(1);
  });

  it('an incomplete today does not break it: counts from yesterday', () => {
    const a = {
      scheduleDays: todos,
      createdOn: '2026-09-01',
      checkedDays: days('2026-10-07', '2026-10-08'),
    };
    expect(countFullDaysStreak([a], '2026-10-09')).toBe(2);
  });

  it('days with no scheduled daily are neutral (neither count nor break)', () => {
    // only Monday (1) and Wednesday (3): 10/05 Mon, 10/07 Wed, 10/09 Fri (neutral), 10/08 Thu (neutral)
    const a = {
      scheduleDays: [1, 3],
      createdOn: '2026-09-01',
      checkedDays: days('2026-10-05', '2026-10-07'),
    };
    expect(countFullDaysStreak([a], '2026-10-09')).toBe(2);
  });

  it('a daily created after a day does not require a check on that day', () => {
    const a = {
      scheduleDays: todos,
      createdOn: '2026-10-08',
      checkedDays: days('2026-10-08', '2026-10-09'),
    };
    expect(countFullDaysStreak([a], '2026-10-09')).toBe(2);
  });

  it('with no dailies there is no streak', () => {
    expect(countFullDaysStreak([], '2026-10-09')).toBe(0);
  });

  it('reaches 7 consecutive days', () => {
    const checkedSets = Array.from({ length: 7 }, (_, i) => `2026-10-0${3 + i}`);
    const a = { scheduleDays: todos, createdOn: '2026-09-01', checkedDays: checkedSets };
    expect(countFullDaysStreak([a], '2026-10-09')).toBe(7);
  });
});

describe('localHour', () => {
  it('hour in the user time zone (includes the 00h boundary)', () => {
    expect(localHour('2026-10-09T15:00:00Z', 'America/Sao_Paulo')).toBe(12);
    expect(localHour('2026-10-09T09:59:00Z', 'America/Sao_Paulo')).toBe(6);
    expect(localHour('2026-10-09T03:00:00Z', 'America/Sao_Paulo')).toBe(0);
    expect(() => localHour('x', 'UTC')).toThrow(RangeError);
  });
});
