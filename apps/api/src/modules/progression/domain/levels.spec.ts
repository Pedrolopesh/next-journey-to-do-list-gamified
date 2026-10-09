import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { checksParaCapitulo, expParaNivel } from './levels.js';

describe('expParaNivel (75n - 25)', () => {
  it('bate com os exemplos da especificação', () => {
    expect(expParaNivel(1)).toBe(50);
    expect(expParaNivel(7)).toBe(500);
  });

  it('usa a config recebida', () => {
    const config = {
      ...DEFAULT_GAME_CONFIG,
      levelExpSlope: 100,
      levelExpOffset: 0,
    };
    expect(expParaNivel(3, config)).toBe(300);
  });

  it('rejeita nível inválido', () => {
    expect(() => expParaNivel(0)).toThrow(RangeError);
    expect(() => expParaNivel(1.5)).toThrow(RangeError);
    expect(() => expParaNivel(-2)).toThrow(RangeError);
  });
});

describe('checksParaCapitulo (10 + 5(n-1), máximo 40)', () => {
  it('cresce 5 por capítulo até o teto de 40', () => {
    expect([1, 2, 3, 4, 5].map((n) => checksParaCapitulo(n))).toEqual([10, 15, 20, 25, 30]);
    expect(checksParaCapitulo(7)).toBe(40);
    expect(checksParaCapitulo(8)).toBe(40);
    expect(checksParaCapitulo(100)).toBe(40);
  });

  it('rejeita capítulo inválido', () => {
    expect(() => checksParaCapitulo(0)).toThrow(RangeError);
  });
});
