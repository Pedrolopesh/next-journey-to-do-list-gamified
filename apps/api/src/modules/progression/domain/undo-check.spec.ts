import {
  DEFAULT_GAME_CONFIG as config,
  type Difficulty,
  type PlayerState,
} from '@nextjourney/contracts';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { aplicarCheck, type CheckInput } from './apply-check.js';
import { desfazerCheck } from './undo-check.js';

const inicial: PlayerState = {
  level: 1,
  expInLevel: 100,
  expTotal: 100,
  coins: 20,
  totalChecks: 10,
  story: { chapter: 1, completed: false },
};

const noCapitulo = (chapter: number, coins: number): PlayerState => ({
  ...inicial,
  coins,
  story: { chapter, completed: false },
});

describe('desfazerCheck', () => {
  it('no capítulo 1 perde 3 moedas e mantém todo o EXP', () => {
    const undo = desfazerCheck(inicial, config);
    expect(undo.summary).toEqual({ moedasPerdidas: 3 });
    expect(undo.state).toEqual({ ...inicial, coins: 17, totalChecks: 9 });
  });

  it('a perda cresce com o capítulo: 3, 5, 10, 15 e 20', () => {
    const perdas = [1, 2, 3, 4, 5].map(
      (capitulo) => desfazerCheck(noCapitulo(capitulo, 100), config).summary.moedasPerdidas,
    );
    expect(perdas).toEqual([3, 5, 10, 15, 20]);
  });

  it('nunca deixa o saldo negativo', () => {
    const undo = desfazerCheck(noCapitulo(3, 4), config);
    expect(undo.summary.moedasPerdidas).toBe(4);
    expect(undo.state.coins).toBe(0);
  });

  it('com a história concluída a perda é a do capítulo 5', () => {
    const concluida: PlayerState = {
      ...inicial,
      level: 7,
      coins: 50,
      story: { chapter: 5, completed: true },
    };
    expect(desfazerCheck(concluida, config).summary.moedasPerdidas).toBe(20);
  });

  it('o EXP, o nível e o capítulo nunca mudam (qualquer estado)', () => {
    const dificuldade = fc.constantFrom<Difficulty>('easy', 'medium', 'hard');
    fc.assert(
      fc.property(
        fc.array(dificuldade, { minLength: 1, maxLength: 80 }),
        fc.integer({ min: 0, max: 5 }),
        (checks, extra) => {
          let state: PlayerState = { ...inicial, expInLevel: 0, expTotal: 0, coins: 0 };
          checks.forEach((difficulty, index) => {
            const input: CheckInput = {
              checkId: `c${index}`,
              type: 'habit',
              difficulty,
              localDate: '2026-10-09',
            };
            state = aplicarCheck(state, input, config).state;
          });
          for (let i = 0; i < extra; i += 1) {
            const antes = state;
            const { state: depois, summary } = desfazerCheck(antes, config);
            expect(depois.level).toBe(antes.level);
            expect(depois.expInLevel).toBe(antes.expInLevel);
            expect(depois.expTotal).toBe(antes.expTotal);
            expect(depois.story).toEqual(antes.story);
            expect(depois.coins).toBe(antes.coins - summary.moedasPerdidas);
            expect(depois.coins).toBeGreaterThanOrEqual(0);
            state = depois;
          }
        },
      ),
    );
  });
});
