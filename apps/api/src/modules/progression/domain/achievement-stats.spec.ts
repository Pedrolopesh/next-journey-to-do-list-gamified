import { describe, expect, it } from 'vitest';

import {
  type CheckRow,
  estatisticasDeChecks,
  maiorSequencia,
  resumoDeHoje,
} from './achievement-stats.js';

const row = (patch: Partial<CheckRow> & Pick<CheckRow, 'checkedOn'>): CheckRow => ({
  itemId: 'i1',
  type: 'daily',
  categoryId: 'c1',
  difficulty: 'easy',
  dueAt: null,
  completedAt: null,
  ...patch,
});

describe('maiorSequencia', () => {
  it('acha a maior sequência de dias seguidos, ignorando repetição e ordem', () => {
    expect(maiorSequencia([])).toBe(0);
    expect(
      maiorSequencia(['2026-10-03', '2026-10-01', '2026-10-02', '2026-10-02', '2026-10-09']),
    ).toBe(3);
  });
});

describe('estatisticasDeChecks', () => {
  it('conta dias distintos, sequência, máximo no dia e o retorno depois de 7 dias parado', () => {
    const rows = [
      row({ checkedOn: '2026-10-01' }),
      row({ checkedOn: '2026-10-02', itemId: 'i2' }),
      row({ checkedOn: '2026-10-02', itemId: 'i3' }),
      row({ checkedOn: '2026-10-10' }),
    ];
    const s = estatisticasDeChecks(rows);
    expect(s.distinctDays).toBe(3);
    expect(s.bestDayRun).toBe(2);
    expect(s.maxChecksInDay).toBe(2);
    expect(s.hadComeback).toBe(true); // 02 -> 10: 7 dias sem marcar
  });

  it('6 dias parado ainda não é retorno', () => {
    const s = estatisticasDeChecks([
      row({ checkedOn: '2026-10-01' }),
      row({ checkedOn: '2026-10-08' }),
    ]);
    expect(s.hadComeback).toBe(false);
  });

  it('hábitos: dias distintos, sequência de um mesmo hábito e hábitos no mesmo dia', () => {
    const habito = (checkedOn: string, itemId: string) => row({ checkedOn, itemId, type: 'habit' });
    const s = estatisticasDeChecks([
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

  it('tarefas: concluídas, no prazo, atrasadas e difíceis (cada tarefa conta uma vez)', () => {
    const due = new Date('2026-10-05T12:00:00Z');
    const todo = (itemId: string, completedAt: string, extra: Partial<CheckRow> = {}) =>
      row({
        checkedOn: '2026-10-05',
        itemId,
        type: 'todo',
        completedAt: new Date(completedAt),
        ...extra,
      });
    const s = estatisticasDeChecks([
      todo('t1', '2026-10-05T10:00:00Z', { dueAt: due }), // no prazo
      todo('t1', '2026-10-05T10:00:00Z', { dueAt: due }), // repetido: não conta duas vezes
      todo('t2', '2026-10-06T10:00:00Z', { dueAt: due, difficulty: 'hard' }), // atrasada e difícil
      todo('t3', '2026-10-06T10:00:00Z'), // sem prazo
    ]);
    expect(s.todosDone).toBe(3);
    expect(s.todosOnTime).toBe(1);
    expect(s.todosLate).toBe(1);
    expect(s.hardTodosDone).toBe(1);
  });
});

describe('resumoDeHoje', () => {
  it('conta as tarefas concluídas só do dia de hoje', () => {
    const hoje = '2026-10-09';
    const s = resumoDeHoje(
      [
        row({ checkedOn: hoje, type: 'daily' }),
        row({ checkedOn: hoje, type: 'todo', itemId: 't' }),
        row({ checkedOn: '2026-10-08', type: 'todo', itemId: 't2' }),
      ],
      hoje,
    );
    expect(s).toEqual({ todosToday: 1 });
  });
});

describe('dias com várias categorias, pódio e dias de diário', () => {
  it('conta os dias com 3 e com 5 categorias, os dias de pódio e os dias de diário', () => {
    const cat = (day: string, n: number, type: CheckRow['type'] = 'daily') =>
      Array.from({ length: n }, (_, i) =>
        row({ checkedOn: day, categoryId: `c${i}`, itemId: `${day}-${i}`, type }),
      );
    const s = estatisticasDeChecks([
      ...cat('2026-10-01', 5), // 5 categorias
      ...cat('2026-10-02', 3), // 3 categorias
      ...cat('2026-10-03', 2), // só 2
      row({ checkedOn: '2026-10-04', type: 'todo', itemId: 't' }),
      row({ checkedOn: '2026-10-04', type: 'habit', itemId: 'h' }),
      row({ checkedOn: '2026-10-04', type: 'daily', itemId: 'd' }), // pódio
    ]);
    expect(s.balancedDays).toEqual({ three: 2, five: 1 });
    expect(s.podiumDays).toBe(1);
    expect(s.dailyDays).toBe(4);
  });
});
