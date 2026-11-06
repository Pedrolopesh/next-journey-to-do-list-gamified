import { describe, expect, it } from 'vitest';

import { tierColor } from './tier';

describe('tierColor', () => {
  it('each server class has a design system color', () => {
    expect(tierColor(1)).toBe('#cd7f32');
    expect(tierColor(3)).toBe('#facc15');
    expect(tierColor(4)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('the four classes have different colors', () => {
    expect(new Set([1, 2, 3, 4].map((tier) => tierColor(tier as 1 | 2 | 3 | 4))).size).toBe(4);
  });
});
