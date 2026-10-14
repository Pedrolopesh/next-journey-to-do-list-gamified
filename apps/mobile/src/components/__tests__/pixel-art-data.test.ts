import { describe, expect, it } from 'vitest';

import { achievementArt, PIXEL_ART, PIXEL_PALETTE } from '../pixel-art-data';

describe('pixel art', () => {
  it.each(Object.entries(PIXEL_ART))('%s tem 12x12 e só cores da paleta', (_name, rows) => {
    expect(rows).toHaveLength(12);
    for (const row of rows) {
      expect(row).toHaveLength(12);
      for (const ch of row) expect(ch === '.' || ch in PIXEL_PALETTE).toBe(true);
    }
  });

  it('cada conquista tem arte e uma desconhecida cai no livro', () => {
    expect(achievementArt('legend')).toBe('legend');
    expect(achievementArt('flame')).toBe('streak');
    expect(achievementArt('nao-existe')).toBe('story');
  });
});
