import { describe, expect, it } from 'vitest';

import { addDays, diaDaSemana, diaLocal } from './dates.js';

describe('addDays e diaDaSemana', () => {
  it('atravessa virada de mês, de ano e ano bissexto', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-10-09', 0)).toBe('2026-10-09');
  });

  it('dia da semana: 0 domingo a 6 sábado', () => {
    expect(diaDaSemana('2026-10-04')).toBe(0); // domingo
    expect(diaDaSemana('2026-10-09')).toBe(5); // sexta
    expect(diaDaSemana('2026-10-10')).toBe(6); // sábado
  });
});

describe('diaLocal (virada às 00:00 no fuso do usuário)', () => {
  it('o mesmo instante cai em dias diferentes conforme o fuso', () => {
    const instante = '2026-10-10T02:30:00Z';
    expect(diaLocal(instante, 'UTC')).toBe('2026-10-10');
    expect(diaLocal(instante, 'America/Sao_Paulo')).toBe('2026-10-09'); // UTC-3
    expect(diaLocal(instante, 'Asia/Tokyo')).toBe('2026-10-10'); // UTC+9
  });

  it('virada exata da meia-noite local', () => {
    expect(diaLocal('2026-10-10T02:59:59Z', 'America/Sao_Paulo')).toBe('2026-10-09');
    expect(diaLocal('2026-10-10T03:00:00Z', 'America/Sao_Paulo')).toBe('2026-10-10');
  });

  it('virada de mês e de ano no fuso local', () => {
    expect(diaLocal('2027-01-01T01:00:00Z', 'America/Sao_Paulo')).toBe('2026-12-31');
    expect(diaLocal('2026-03-01T02:00:00Z', 'America/Sao_Paulo')).toBe('2026-02-28');
  });

  it('horário de verão: a virada do dia segue o deslocamento vigente', () => {
    // Nova York: DST começa em 2026-03-08 às 02:00 (UTC-5 -> UTC-4)
    expect(diaLocal('2026-03-08T04:59:59Z', 'America/New_York')).toBe('2026-03-07');
    expect(diaLocal('2026-03-08T05:00:00Z', 'America/New_York')).toBe('2026-03-08');
    // e termina em 2026-11-01 (UTC-4 -> UTC-5): 03:59:59Z ainda é dia 1 às 23:59:59 (UTC-4)
    expect(diaLocal('2026-11-01T03:59:59Z', 'America/New_York')).toBe('2026-10-31');
    expect(diaLocal('2026-11-01T04:00:00Z', 'America/New_York')).toBe('2026-11-01');
  });

  it('aceita Date, número e string e rejeita entrada inválida', () => {
    const iso = '2026-10-09T12:00:00Z';
    expect(diaLocal(new Date(iso), 'UTC')).toBe('2026-10-09');
    expect(diaLocal(Date.parse(iso), 'UTC')).toBe('2026-10-09');
    expect(() => diaLocal('não é data', 'UTC')).toThrow(RangeError);
    expect(() => diaLocal(iso, 'Marte/Olympus')).toThrow(RangeError);
  });
});
