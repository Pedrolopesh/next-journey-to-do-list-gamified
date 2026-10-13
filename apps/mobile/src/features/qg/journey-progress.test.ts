import { describe, expect, it } from 'vitest';

import { journeyView, levelProgress } from './journey-progress';

const player = (level: number, expInLevel: number) => ({ level, expInLevel, expForNextLevel: 50 });

describe('levelProgress', () => {
  it('segue a EXP dentro do nível', () => {
    expect(levelProgress(player(1, 0))).toBe(0);
    expect(levelProgress(player(1, 25))).toBe(0.5);
  });

  it('limita entre 0 e 1', () => {
    expect(levelProgress(player(1, 80))).toBe(1);
    expect(levelProgress({ level: 1, expInLevel: 5, expForNextLevel: 0 })).toBe(0);
  });
});

describe('journeyView', () => {
  it('sem nível exibido ou igual ao atual, usa a EXP', () => {
    expect(journeyView(player(2, 10), undefined)).toEqual({ progress: 0.2, portalPending: false });
    expect(journeyView(player(2, 10), 2)).toEqual({ progress: 0.2, portalPending: false });
  });

  it('subiu de nível e a cena ainda não trocou: fica no portal', () => {
    expect(journeyView(player(3, 5), 2)).toEqual({ progress: 1, portalPending: true });
  });

  it('nível exibido maior que o atual (check desfeito) não prende no portal', () => {
    expect(journeyView(player(2, 10), 3)).toEqual({ progress: 0.2, portalPending: false });
  });
});
