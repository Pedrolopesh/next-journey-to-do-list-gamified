import {
  DEFAULT_GAME_CONFIG as config,
  type Difficulty,
  type PlayerState,
} from '@nextjourney/contracts';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { applyCheck, type CheckInput } from './apply-check.js';
import { undoCheck } from './undo-check.js';

const initial: PlayerState = {
  level: 1,
  expInLevel: 100,
  expTotal: 100,
  coins: 20,
  totalChecks: 10,
  story: { chapter: 1, completed: false },
};

const noCapitulo = (chapter: number, coins: number): PlayerState => ({
  ...initial,
  coins,
  story: { chapter, completed: false },
});

describe('undoCheck', () => {
  it('in chapter 1 it loses 3 coins and keeps all the EXP', () => {
    const undo = undoCheck(initial, config);
    expect(undo.summary).toEqual({ coinsLost: 3 });
    expect(undo.state).toEqual({ ...initial, coins: 17, totalChecks: 9 });
  });

  it('the loss grows with the chapter: 3, 5, 10, 15 and 20', () => {
    const perdas = [1, 2, 3, 4, 5].map(
      (chapter) => undoCheck(noCapitulo(chapter, 100), config).summary.coinsLost,
    );
    expect(perdas).toEqual([3, 5, 10, 15, 20]);
  });

  it('never lets the balance go negative', () => {
    const undo = undoCheck(noCapitulo(3, 4), config);
    expect(undo.summary.coinsLost).toBe(4);
    expect(undo.state.coins).toBe(0);
  });

  it('with the story finished the loss is the chapter 5 one', () => {
    const concluida: PlayerState = {
      ...initial,
      level: 7,
      coins: 50,
      story: { chapter: 5, completed: true },
    };
    expect(undoCheck(concluida, config).summary.coinsLost).toBe(20);
  });

  it('EXP, level and chapter never change (any state)', () => {
    const dificuldade = fc.constantFrom<Difficulty>('easy', 'medium', 'hard');
    fc.assert(
      fc.property(
        fc.array(dificuldade, { minLength: 1, maxLength: 80 }),
        fc.integer({ min: 0, max: 5 }),
        (checks, extra) => {
          let state: PlayerState = { ...initial, expInLevel: 0, expTotal: 0, coins: 0 };
          checks.forEach((difficulty, index) => {
            const input: CheckInput = {
              checkId: `c${index}`,
              type: 'habit',
              difficulty,
              localDate: '2026-10-09',
            };
            state = applyCheck(state, input, config).state;
          });
          for (let i = 0; i < extra; i += 1) {
            const before = state;
            const { state: after, summary } = undoCheck(before, config);
            expect(after.level).toBe(before.level);
            expect(after.expInLevel).toBe(before.expInLevel);
            expect(after.expTotal).toBe(before.expTotal);
            expect(after.story).toEqual(before.story);
            expect(after.coins).toBe(before.coins - summary.coinsLost);
            expect(after.coins).toBeGreaterThanOrEqual(0);
            state = after;
          }
        },
      ),
    );
  });
});
