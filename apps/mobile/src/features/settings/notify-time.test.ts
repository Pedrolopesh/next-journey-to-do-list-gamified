import { describe, expect, it } from 'vitest';

import { parseNotifyTime, splitTime } from './notify-time';

describe('parseNotifyTime', () => {
  it('normaliza horários válidos', () => {
    expect(parseNotifyTime('08:30')).toEqual({ ok: true, value: '08:30' });
    expect(parseNotifyTime('8:30')).toEqual({ ok: true, value: '08:30' });
    expect(parseNotifyTime('0830')).toEqual({ ok: true, value: '08:30' });
    expect(parseNotifyTime('830')).toEqual({ ok: true, value: '08:30' });
    expect(parseNotifyTime('23:59')).toEqual({ ok: true, value: '23:59' });
  });
  it('vazio desliga o lembrete; inválido é recusado', () => {
    expect(parseNotifyTime('  ')).toEqual({ ok: true, value: null });
    for (const bad of ['24:00', '12:60', 'abc', '1:5', '99']) {
      expect(parseNotifyTime(bad)).toEqual({ ok: false });
    }
  });
});

describe('splitTime', () => {
  it('separa hora e minuto', () => {
    expect(splitTime('08:30')).toEqual({ hour: 8, minute: 30 });
    expect(splitTime('23:05')).toEqual({ hour: 23, minute: 5 });
  });
});
