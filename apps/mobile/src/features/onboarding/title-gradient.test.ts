import { describe, expect, it } from 'vitest';

import { gradientColor } from './title-gradient';

const STOPS = ['#ff0000', '#00ff00', '#0000ff'] as const;

describe('gradientColor', () => {
  it('returns each stop at its own position', () => {
    expect(gradientColor(STOPS, 0)).toBe('#ff0000');
    expect(gradientColor(STOPS, 1 / 3)).toBe('#00ff00');
    expect(gradientColor(STOPS, 2 / 3)).toBe('#0000ff');
  });

  it('blends halfway between two stops', () => {
    expect(gradientColor(STOPS, 1 / 6)).toBe('#7f8000');
  });

  it('wraps back to the first stop and accepts positions outside 0 to 1', () => {
    expect(gradientColor(STOPS, 1)).toBe('#ff0000');
    expect(gradientColor(STOPS, -1 / 3)).toBe('#0000ff');
    expect(gradientColor(STOPS, 1 + 1 / 3)).toBe('#00ff00');
  });
});
