import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { coinsLostOnUndo, expForLevel } from './levels.js';

describe('expForLevel (table by level)', () => {
  it('matches the approved table', () => {
    expect([1, 2, 3, 4, 5].map((n) => expForLevel(n))).toEqual([200, 400, 600, 800, 1000]);
  });

  it('from the end of the table on, the last value applies', () => {
    expect(expForLevel(6)).toBe(1000);
    expect(expForLevel(40)).toBe(1000);
  });

  it('uses the given config', () => {
    const config = { ...DEFAULT_GAME_CONFIG, levelExpTable: [10, 20] };
    expect(expForLevel(1, config)).toBe(10);
    expect(expForLevel(2, config)).toBe(20);
    expect(expForLevel(3, config)).toBe(20);
  });

  it('rejects an invalid level', () => {
    expect(() => expForLevel(0)).toThrow(RangeError);
    expect(() => expForLevel(1.5)).toThrow(RangeError);
    expect(() => expForLevel(-2)).toThrow(RangeError);
  });
});

describe('coinsLostOnUndo', () => {
  it('3, 5, 10, 15 and 20 per chapter, and the last one after the end', () => {
    expect([1, 2, 3, 4, 5, 6].map((n) => coinsLostOnUndo(n))).toEqual([3, 5, 10, 15, 20, 20]);
  });

  it('rejects an invalid chapter', () => {
    expect(() => coinsLostOnUndo(0)).toThrow(RangeError);
  });
});
