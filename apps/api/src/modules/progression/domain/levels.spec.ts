import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { expParaNivel, moedasPerdidasAoDesmarcar } from './levels.js';

describe('expParaNivel (tabela por capítulo)', () => {
  it('bate com a tabela aprovada', () => {
    expect([1, 2, 3, 4, 5].map((n) => expParaNivel(n))).toEqual([200, 400, 600, 800, 1000]);
  });

  it('do fim da tabela em diante vale o último valor', () => {
    expect(expParaNivel(6)).toBe(1000);
    expect(expParaNivel(40)).toBe(1000);
  });

  it('usa a config recebida', () => {
    const config = { ...DEFAULT_GAME_CONFIG, levelExpTable: [10, 20] };
    expect(expParaNivel(1, config)).toBe(10);
    expect(expParaNivel(2, config)).toBe(20);
    expect(expParaNivel(3, config)).toBe(20);
  });

  it('rejeita nível inválido', () => {
    expect(() => expParaNivel(0)).toThrow(RangeError);
    expect(() => expParaNivel(1.5)).toThrow(RangeError);
    expect(() => expParaNivel(-2)).toThrow(RangeError);
  });
});

describe('moedasPerdidasAoDesmarcar', () => {
  it('3, 5, 10, 15 e 20 por capítulo, e o último depois do fim', () => {
    expect([1, 2, 3, 4, 5, 6].map((n) => moedasPerdidasAoDesmarcar(n))).toEqual([
      3, 5, 10, 15, 20, 20,
    ]);
  });

  it('rejeita capítulo inválido', () => {
    expect(() => moedasPerdidasAoDesmarcar(0)).toThrow(RangeError);
  });
});
