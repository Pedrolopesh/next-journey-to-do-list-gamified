import { describe, expect, it } from 'vitest';

import { tierColor } from './tier';

describe('tierColor', () => {
  it('cada classe do servidor tem uma cor do design system', () => {
    expect(tierColor(1)).toBe('#cd7f32');
    expect(tierColor(3)).toBe('#facc15');
    expect(tierColor(4)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('as quatro classes têm cores diferentes', () => {
    expect(new Set([1, 2, 3, 4].map((tier) => tierColor(tier as 1 | 2 | 3 | 4))).size).toBe(4);
  });
});
