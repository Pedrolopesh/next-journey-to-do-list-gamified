import { describe, expect, it } from 'vitest';

import { PIXEL_ART, PIXEL_PALETTE } from '../pixel-art-data';

describe('pixel art', () => {
  it.each(Object.entries(PIXEL_ART))('%s is 12x12 and uses only palette colors', (_name, rows) => {
    expect(rows).toHaveLength(12);
    for (const row of rows) {
      expect(row).toHaveLength(12);
      for (const ch of row) expect(ch === '.' || ch in PIXEL_PALETTE).toBe(true);
    }
  });
});
