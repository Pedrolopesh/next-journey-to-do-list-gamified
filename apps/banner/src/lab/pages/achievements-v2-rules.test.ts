import { ACHIEVEMENT_CATALOG } from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { AGORA } from './achievements-v2-rules';

/** Números de um texto, sem o ponto de milhar ("3.000" vira 3000). */
const numeros = (texto: string): number[] =>
  (texto.match(/\d[\d.]*/g) ?? []).map((n) => Number(n.replace(/\./g, '')));

/**
 * O simulador do laboratório precisa descrever as mesmas regras do catálogo (que a API confere com
 * as regras de verdade em achievements-consistency.spec.ts).
 */
describe('laboratório e catálogo dizem o mesmo', () => {
  it('toda conquista do catálogo tem critério no laboratório, com o mesmo texto e nome', () => {
    for (const a of ACHIEVEMENT_CATALOG) {
      const lab = AGORA[a.slug];
      expect(lab, `sem critério no laboratório para ${a.slug}`).toBeDefined();
      expect(lab?.desc, a.slug).toBe(a.description);
      if (lab?.name) expect(lab.name, a.slug).toBe(a.name);
    }
  });

  it('a meta numérica do laboratório aparece no texto do catálogo', () => {
    for (const a of ACHIEVEMENT_CATALOG) {
      const lab = AGORA[a.slug];
      // meta 1 vira palavra no texto ("primeiro"), então só confere de 2 em diante
      if (lab && lab.m !== 'manual' && lab.m !== 'trail' && lab.m !== 'secrets' && lab.t > 1) {
        expect(numeros(a.description), a.slug).toContain(lab.t);
      }
    }
  });
});
