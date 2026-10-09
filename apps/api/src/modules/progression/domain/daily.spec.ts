import { describe, expect, it } from 'vitest';

import { calcularStreak, type Diario, estaAtrasado } from './daily.js';

const TODOS = [0, 1, 2, 3, 4, 5, 6];
// 2026-10-05 é segunda; 2026-10-09 é sexta
const diario = (patch: Partial<Diario> = {}): Diario => ({
  scheduleDays: TODOS,
  createdOn: '2026-09-01',
  lastCheckedOn: null,
  ...patch,
});

describe('estaAtrasado', () => {
  it('diário diário sem check ontem está atrasado hoje', () => {
    expect(estaAtrasado(diario({ lastCheckedOn: '2026-10-07' }), '2026-10-09')).toBe(true);
  });

  it('marcado ontem não está atrasado; marcar hoje (mesmo atrasado) tira o atraso', () => {
    expect(estaAtrasado(diario({ lastCheckedOn: '2026-10-08' }), '2026-10-09')).toBe(false);
    expect(estaAtrasado(diario({ lastCheckedOn: '2026-10-09' }), '2026-10-09')).toBe(false);
  });

  it('o próprio dia agendado de hoje ainda não conta como atrasado', () => {
    expect(estaAtrasado(diario({ lastCheckedOn: '2026-10-08' }), '2026-10-09')).toBe(false);
  });

  it('dias não agendados não geram atraso', () => {
    // segunda e quarta (1 e 3). Hoje é sexta 2026-10-09; último agendado foi quarta 2026-10-07
    const d = diario({ scheduleDays: [1, 3], lastCheckedOn: '2026-10-07' });
    expect(estaAtrasado(d, '2026-10-09')).toBe(false);
    expect(
      estaAtrasado(diario({ scheduleDays: [1, 3], lastCheckedOn: '2026-10-05' }), '2026-10-09'),
    ).toBe(true);
  });

  it('nunca marcado: atrasado se houve dia agendado desde a criação', () => {
    expect(estaAtrasado(diario({ createdOn: '2026-10-07' }), '2026-10-09')).toBe(true);
  });

  it('diário criado hoje só fica atrasado depois que um dia agendado termina', () => {
    expect(estaAtrasado(diario({ createdOn: '2026-10-09' }), '2026-10-09')).toBe(false);
    expect(estaAtrasado(diario({ createdOn: '2026-10-09' }), '2026-10-10')).toBe(true);
  });

  it('sem dia agendado na janela de 7 dias não há atraso', () => {
    expect(estaAtrasado(diario({ scheduleDays: [] }), '2026-10-09')).toBe(false);
  });
});

describe('calcularStreak', () => {
  const base = { scheduleDays: TODOS, createdOn: '2026-09-01' };

  it('conta dias seguidos terminando hoje', () => {
    expect(
      calcularStreak(
        { ...base, diasMarcados: ['2026-10-07', '2026-10-08', '2026-10-09'] },
        '2026-10-09',
      ),
    ).toBe(3);
  });

  it('hoje ainda sem check não quebra a sequência', () => {
    expect(
      calcularStreak({ ...base, diasMarcados: ['2026-10-07', '2026-10-08'] }, '2026-10-09'),
    ).toBe(2);
  });

  it('dia agendado sem check quebra a sequência', () => {
    expect(
      calcularStreak(
        { ...base, diasMarcados: ['2026-10-06', '2026-10-08', '2026-10-09'] },
        '2026-10-09',
      ),
    ).toBe(2);
  });

  it('dias não agendados não quebram a sequência', () => {
    // agendado segunda(1), quarta(3), sexta(5): 05 seg, 07 qua, 09 sex
    const d = { scheduleDays: [1, 3, 5], createdOn: '2026-09-01' };
    expect(
      calcularStreak(
        { ...d, diasMarcados: ['2026-10-05', '2026-10-07', '2026-10-09'] },
        '2026-10-09',
      ),
    ).toBe(3);
  });

  it('marcar um atrasado hoje reinicia a sequência em 1', () => {
    expect(
      calcularStreak({ ...base, diasMarcados: ['2026-10-05', '2026-10-09'] }, '2026-10-09'),
    ).toBe(1);
  });

  it('não conta antes da criação nem sem nenhum check', () => {
    expect(
      calcularStreak(
        {
          ...base,
          createdOn: '2026-10-08',
          diasMarcados: ['2026-10-08', '2026-10-09'],
        },
        '2026-10-09',
      ),
    ).toBe(2);
    expect(calcularStreak({ ...base, diasMarcados: [] }, '2026-10-09')).toBe(0);
  });

  it('atravessa virada de mês e de ano', () => {
    expect(
      calcularStreak(
        {
          ...base,
          createdOn: '2026-12-01',
          diasMarcados: ['2026-12-30', '2026-12-31', '2027-01-01'],
        },
        '2027-01-01',
      ),
    ).toBe(3);
  });
});
