import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 390 }) },
  PixelRatio: { roundToNearestPixel: (value: number) => Math.round(value * 3) / 3 },
}));

const { scale } = await import('./scale');

describe('scale', () => {
  it('keeps the value at the Figma reference width', () => {
    expect(scale(16, 390)).toBeCloseTo(16, 1);
  });

  it('follows the screen width', () => {
    expect(scale(16, 430)).toBeGreaterThan(16);
    expect(scale(16, 360)).toBeLessThan(16);
  });

  it('clamps the factor on very small and very large screens', () => {
    expect(scale(100, 100)).toBeCloseTo(85, 0);
    expect(scale(100, 1200)).toBeCloseTo(125, 0);
  });
});
