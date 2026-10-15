import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { expParaNivel } from './levels.js';

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
