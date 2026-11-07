import { describe, expect, it } from 'vitest';

import { shouldPlay } from './playback';

describe('shouldPlay', () => {
  it('animates only in the foreground and without reduced motion', () => {
    expect(shouldPlay('active', false)).toBe(true);
    expect(shouldPlay('background', false)).toBe(false);
    expect(shouldPlay('inactive', false)).toBe(false);
    expect(shouldPlay('active', true)).toBe(false);
  });

  it('an out-of-focus screen stays paused', () => {
    expect(shouldPlay('active', false, false)).toBe(false);
    expect(shouldPlay('active', false, true)).toBe(true);
  });
});
