import { describe, expect, it } from 'vitest';

import { shouldPlay } from './playback';

describe('shouldPlay', () => {
  it('anima só em primeiro plano e sem reduzir movimento', () => {
    expect(shouldPlay('active', false)).toBe(true);
    expect(shouldPlay('background', false)).toBe(false);
    expect(shouldPlay('inactive', false)).toBe(false);
    expect(shouldPlay('active', true)).toBe(false);
  });
});
