import { describe, expect, it } from 'vitest';

import {
  ACHIEVEMENT_CATALOG,
  type AchievementContext,
  conquistasAtendidas,
  diasSeguidosCompletos,
  progressoDaConquista,
} from './achievements.js';
import { horaLocal } from './dates.js';

const base: AchievementContext = {
  totalChecks: 0,
  level: 1,
  itemsCreated: 0,
  chaptersCompleted: 0,
  storiesCompleted: 0,
  checkHour: 12,
  categoriesToday: 0,
  fullDaysStreak: 0,
};

describe('conquistasAtendidas', () => {
  it('o catálogo tem as 10 conquistas da especificação', () => {
    expect(ACHIEVEMENT_CATALOG).toHaveLength(10);
    expect(new Set(ACHIEVEMENT_CATALOG.map((a) => a.slug)).size).toBe(10);
  });

  it('sem nada feito, nada é atendido', () => {
    expect(conquistasAtendidas(base)).toEqual([]);
  });

  it.each([
    ['primeiro-passo', { totalChecks: 1 }],
    ['chama-7-dias', { fullDaysStreak: 7 }],
    ['organizado', { itemsCreated: 10 }],
    ['maratonista', { totalChecks: 100 }],
    ['aprendiz', { level: 5 }],
    ['veterano', { level: 10 }],
    ['novo-capitulo', { chaptersCompleted: 1 }],
    ['lenda-viva', { storiesCompleted: 1 }],
    ['madrugador', { checkHour: 6 }],
    ['equilibrio', { categoriesToday: 3 }],
  ] as const)('%s no limite do critério', (slug, patch) => {
    expect(conquistasAtendidas({ ...base, ...patch })).toContain(slug);
  });

  it('um passo abaixo do limite não atende', () => {
    expect(
      conquistasAtendidas({
        ...base,
        fullDaysStreak: 6,
        itemsCreated: 9,
        level: 4,
        categoriesToday: 2,
        checkHour: 7,
      }),
    ).toEqual([]);
    expect(conquistasAtendidas({ ...base, totalChecks: 99 })).toEqual(['primeiro-passo']);
  });

  it('madrugador usa a hora local: 06h59 sim, 07h00 não', () => {
    expect(conquistasAtendidas({ ...base, checkHour: 6 })).toContain('madrugador');
    expect(conquistasAtendidas({ ...base, checkHour: 7 })).not.toContain('madrugador');
  });
});

describe('progressoDaConquista', () => {
  it('devolve o progresso limitado ao alvo e nulo para conquistas de evento', () => {
    expect(progressoDaConquista('maratonista', { ...base, totalChecks: 37 })).toEqual({
      current: 37,
      target: 100,
    });
    expect(progressoDaConquista('maratonista', { ...base, totalChecks: 500 })).toEqual({
      current: 100,
      target: 100,
    });
    expect(progressoDaConquista('aprendiz', { ...base, level: 3 })).toEqual({
      current: 3,
      target: 5,
    });
    expect(progressoDaConquista('primeiro-passo', base)).toBeNull();
  });
});

describe('diasSeguidosCompletos (Chama de 7 dias)', () => {
  const todos = [0, 1, 2, 3, 4, 5, 6];
  const dias = (...d: string[]) => d;

  it('conta dias em que todos os diários agendados foram feitos', () => {
    const a = {
      scheduleDays: todos,
      createdOn: '2026-09-01',
      diasMarcados: dias('2026-10-07', '2026-10-08', '2026-10-09'),
    };
    const b = {
      scheduleDays: todos,
      createdOn: '2026-09-01',
      diasMarcados: dias('2026-10-07', '2026-10-08', '2026-10-09'),
    };
    expect(diasSeguidosCompletos([a, b], '2026-10-09')).toBe(3);
  });

  it('um diário faltando no dia quebra a sequência', () => {
    const a = {
      scheduleDays: todos,
      createdOn: '2026-09-01',
      diasMarcados: dias('2026-10-07', '2026-10-08', '2026-10-09'),
    };
    const b = {
      scheduleDays: todos,
      createdOn: '2026-09-01',
      diasMarcados: dias('2026-10-07', '2026-10-09'),
    }; // faltou dia 8
    expect(diasSeguidosCompletos([a, b], '2026-10-09')).toBe(1);
  });

  it('hoje incompleto não quebra: conta a partir de ontem', () => {
    const a = {
      scheduleDays: todos,
      createdOn: '2026-09-01',
      diasMarcados: dias('2026-10-07', '2026-10-08'),
    };
    expect(diasSeguidosCompletos([a], '2026-10-09')).toBe(2);
  });

  it('dias sem diário agendado são neutros (não contam nem quebram)', () => {
    // só segunda(1) e quarta(3): 05/10 seg, 07/10 qua, 09/10 sex (neutro), 08/10 qui (neutro)
    const a = {
      scheduleDays: [1, 3],
      createdOn: '2026-09-01',
      diasMarcados: dias('2026-10-05', '2026-10-07'),
    };
    expect(diasSeguidosCompletos([a], '2026-10-09')).toBe(2);
  });

  it('diário criado depois do dia não exige check naquele dia', () => {
    const a = {
      scheduleDays: todos,
      createdOn: '2026-10-08',
      diasMarcados: dias('2026-10-08', '2026-10-09'),
    };
    expect(diasSeguidosCompletos([a], '2026-10-09')).toBe(2);
  });

  it('sem diários não há sequência', () => {
    expect(diasSeguidosCompletos([], '2026-10-09')).toBe(0);
  });

  it('chega a 7 dias seguidos', () => {
    const marcados = Array.from({ length: 7 }, (_, i) => `2026-10-0${3 + i}`);
    const a = { scheduleDays: todos, createdOn: '2026-09-01', diasMarcados: marcados };
    expect(diasSeguidosCompletos([a], '2026-10-09')).toBe(7);
  });
});

describe('horaLocal', () => {
  it('hora no fuso do usuário (inclui a virada de 00h)', () => {
    expect(horaLocal('2026-10-09T15:00:00Z', 'America/Sao_Paulo')).toBe(12);
    expect(horaLocal('2026-10-09T09:59:00Z', 'America/Sao_Paulo')).toBe(6);
    expect(horaLocal('2026-10-09T03:00:00Z', 'America/Sao_Paulo')).toBe(0);
    expect(() => horaLocal('x', 'UTC')).toThrow(RangeError);
  });
});
