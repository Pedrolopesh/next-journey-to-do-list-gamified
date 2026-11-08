import { ACHIEVEMENT_CATALOG } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { AGORA } from './achievements-v2-rules';

/** Numbers in a text, without the thousands separator ("3.000" becomes 3000). */
const numeros = (texto: string): number[] =>
  (texto.match(/\d[\d.]*/g) ?? []).map((n) => Number(n.replace(/\./g, '')));

/**
 * The lab simulator must describe the same rules as the catalog (which the API checks against
 * the real rules in achievements-consistency.spec.ts).
 */
describe('lab and catalog say the same', () => {
  it('every catalog achievement has a lab criterion, with the same text and name', () => {
    for (const a of ACHIEVEMENT_CATALOG) {
      const lab = AGORA[a.slug];
      expect(lab, `sem critério no laboratório para ${a.slug}`).toBeDefined();
      expect(lab?.desc, a.slug).toBe(a.description);
      if (lab?.name) expect(lab.name, a.slug).toBe(a.name);
    }
  });

  it('the lab numeric goal appears in the catalog text', () => {
    for (const a of ACHIEVEMENT_CATALOG) {
      const lab = AGORA[a.slug];
      // goal 1 becomes a word in the text ("primeiro"), so only check from 2 onwards
      if (lab && lab.m !== 'manual' && lab.m !== 'trail' && lab.m !== 'secrets' && lab.t > 1) {
        expect(numeros(a.description), a.slug).toContain(lab.t);
      }
    }
  });
});
