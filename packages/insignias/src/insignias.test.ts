import { ACHIEVEMENT_CATALOG } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { INSIGNIA_PALETTE, INSIGNIAS } from './insignias';

describe('insígnias', () => {
  it('toda grade tem 24x24 e só usa cores da paleta', () => {
    for (const [name, rows] of Object.entries(INSIGNIAS)) {
      expect(rows, name).toHaveLength(24);
      for (const row of rows) {
        expect(row, name).toHaveLength(24);
        for (const char of row) {
          expect(char === '.' || char in INSIGNIA_PALETTE, `${name}: ${char}`).toBe(true);
        }
      }
    }
  });

  it('toda conquista do catálogo aponta para uma insígnia que existe', () => {
    for (const achievement of ACHIEVEMENT_CATALOG) {
      expect(achievement.glyph in INSIGNIAS, achievement.slug).toBe(true);
    }
  });
});
