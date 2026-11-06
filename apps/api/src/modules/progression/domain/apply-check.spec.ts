import {
  DEFAULT_GAME_CONFIG as config,
  type Difficulty,
  type PlayerState,
} from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { applyCheck, type CheckInput } from './apply-check.js';
import { expForLevel } from './levels.js';

const initial: PlayerState = {
  level: 1,
  expInLevel: 0,
  expTotal: 0,
  coins: 0,
  totalChecks: 0,
  story: { chapter: 1, completed: false },
};

const input = (difficulty: Difficulty, type: CheckInput['type'] = 'daily'): CheckInput => ({
  checkId: '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10',
  type,
  difficulty,
  localDate: '2026-10-09',
});

describe('applyCheck: EXP, coins and level', () => {
  it.each([
    ['easy', 5, 1],
    ['medium', 10, 2],
    ['hard', 20, 4],
  ] as const)('dificuldade %s rende %i EXP e %i moedas', (difficulty, exp, coins) => {
    const { state, summary } = applyCheck(initial, input(difficulty), config);
    expect(summary.expGained).toBe(exp);
    expect(summary.coinsGained).toBe(coins);
    expect(state.expInLevel).toBe(exp);
    expect(state.expTotal).toBe(exp);
    expect(state.coins).toBe(coins);
    expect(state.totalChecks).toBe(1);
    expect(summary.leveledUp).toBe(false);
  });

  it('does not change the original state (pure function)', () => {
    const copia = structuredClone(initial);
    applyCheck(initial, input('hard'), config);
    expect(initial).toEqual(copia);
  });

  it('levels up at 200 EXP (level 1 -> 2) and gives the 10-coin bonus', () => {
    const quase: PlayerState = { ...initial, expInLevel: 195, expTotal: 195 };
    const { state, summary } = applyCheck(quase, input('easy'), config);
    expect(summary.leveledUp).toBe(true);
    expect(summary.levelsGained).toBe(1);
    expect(state.level).toBe(2);
    expect(state.expInLevel).toBe(0);
    expect(summary.bonusCoins).toBe(10);
    expect(state.coins).toBe(1 + 10);
  });

  it('carries the leftover EXP to the next level', () => {
    const quase: PlayerState = { ...initial, expInLevel: 195, expTotal: 195 };
    const { state } = applyCheck(quase, input('hard'), config); // 195 + 20 = 215
    expect(state.level).toBe(2);
    expect(state.expInLevel).toBe(15);
  });

  it('can gain more than one level in a check and adds one bonus per level', () => {
    const generosa = {
      ...config,
      expByDifficulty: { easy: 5, medium: 10, hard: 1200 },
    };
    const { state, summary } = applyCheck(initial, input('hard'), generosa);
    // 200 (1->2) + 400 (2->3) + 600 (3->4) = 1200; sobra 0
    expect(summary.levelsGained).toBe(3);
    expect(state.level).toBe(4);
    expect(state.expInLevel).toBe(0);
    expect(summary.bonusCoins).toBe(30);
  });

  it('a habit has no daily limit: every check earns EXP and coins', () => {
    let state = initial;
    for (let i = 0; i < 6; i += 1) {
      const result = applyCheck(state, input('medium', 'habit'), config);
      expect(result.summary.expGained).toBe(10);
      expect(result.summary.coinsGained).toBe(2);
      state = result.state;
    }
    expect(state.totalChecks).toBe(6);
  });

  it('daily, to-do and habit earn the same (only the difficulty matters)', () => {
    const a = applyCheck(initial, input('medium', 'daily'), config).summary;
    const b = applyCheck(initial, input('medium', 'todo'), config).summary;
    const c = applyCheck(initial, input('medium', 'habit'), config).summary;
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});

describe('applyCheck: chapters and story (each level gained finishes a chapter)', () => {
  it('a check without a level-up finishes no chapter and shows EXP as progress', () => {
    const { state, summary } = applyCheck(initial, input('easy'), config);
    expect(state.story).toEqual({ chapter: 1, completed: false });
    expect(summary.chapterProgress).toEqual({ chapter: 1, expInLevel: 5, expToNext: 200 });
    expect(summary.chapterCompleted).toBe(false);
    expect(summary.completedChapters).toEqual([]);
  });

  it('a level-up finishes the current chapter and opens the next', () => {
    const quase: PlayerState = { ...initial, expInLevel: 195, expTotal: 195 };
    const { state, summary, record } = applyCheck(quase, input('easy'), config);
    expect(summary.chapterCompleted).toBe(true);
    expect(summary.completedChapters).toEqual([1]);
    expect(record.closedChapter).toBe(true);
    expect(state.level).toBe(2);
    expect(state.story).toEqual({ chapter: 2, completed: false });
    expect(summary.chapterProgress).toEqual({ chapter: 2, expInLevel: 0, expToNext: 400 });
  });

  it('several levels in one check finish several chapters, one per level', () => {
    const generosa = { ...config, expByDifficulty: { easy: 5, medium: 10, hard: 1200 } };
    const { state, summary } = applyCheck(initial, input('hard'), generosa);
    expect(summary.levelsGained).toBe(3);
    expect(summary.completedChapters).toEqual([1, 2, 3]);
    expect(state.story).toEqual({ chapter: 4, completed: false });
  });

  it('the 5th chapter finishes the story; later levels carry on without a chapter', () => {
    const last: PlayerState = {
      ...initial,
      level: 5,
      expInLevel: 970,
      expTotal: 2900,
      story: { chapter: 5, completed: false },
    };
    const end = applyCheck(last, input('hard'), config); // 970 + 20 < 1000: still in chapter 5
    expect(end.summary.chapterCompleted).toBe(false);
    const quase: PlayerState = { ...last, expInLevel: 995 };
    const concluiu = applyCheck(quase, input('easy'), config);
    expect(concluiu.summary.completedChapters).toEqual([5]);
    expect(concluiu.summary.storyCompleted).toBe(true);
    expect(concluiu.state.story).toEqual({ chapter: 5, completed: true });

    const after = applyCheck(
      { ...concluiu.state, expInLevel: concluiu.state.expInLevel },
      input('hard'),
      config,
    );
    expect(after.state.story).toEqual(concluiu.state.story);
    expect(after.record.countsForChapter).toBe(false);
    expect(after.record.chapterAtCheck).toBeNull();
    expect(after.summary.completedChapters).toEqual([]);
  });

  it('an item that already earned EXP today earns only the coins', () => {
    const { state, summary, record } = applyCheck(
      initial,
      { ...input('medium'), expAlreadyEarned: true },
      config,
    );
    expect(summary.expGained).toBe(0);
    expect(summary.coinsGained).toBe(2);
    expect(state.expInLevel).toBe(0);
    expect(state.expTotal).toBe(0);
    expect(state.coins).toBe(2);
    expect(record.exp).toBe(0);
  });

  it('after the story is finished the level rises by 1000 EXP and the chapter does not advance', () => {
    const end: PlayerState = {
      ...initial,
      level: 6,
      expInLevel: 990,
      expTotal: 4000,
      story: { chapter: 5, completed: true },
    };
    const { state, summary } = applyCheck(end, input('hard'), config);
    expect(state.level).toBe(7);
    expect(state.expInLevel).toBe(10);
    expect(summary.completedChapters).toEqual([]);
    expect(state.story).toEqual({ chapter: 5, completed: true });
  });

  it('the record keeps what is needed to undo', () => {
    const { record } = applyCheck(initial, input('medium'), config);
    expect(record).toEqual({
      checkId: '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10',
      localDate: '2026-10-09',
      exp: 10,
      coins: 2,
      countsForChapter: true,
      chapterAtCheck: 1,
      closedChapter: false,
    });
  });

  it('invariant: EXP in the level is always below the requirement', () => {
    let state = initial;
    for (let i = 0; i < 200; i += 1) {
      state = applyCheck(state, input(i % 3 === 0 ? 'hard' : 'easy'), config).state;
      expect(state.expInLevel).toBeLessThan(expForLevel(state.level));
    }
  });

  it('invariant: completed chapters = levels gained until the story ends', () => {
    let state = initial;
    let concluidos = 0;
    for (let i = 0; i < 400; i += 1) {
      const result = applyCheck(state, input('hard'), config);
      concluidos += result.summary.completedChapters.length;
      state = result.state;
    }
    expect(concluidos).toBe(Math.min(state.level - 1, config.chaptersPerStory));
    expect(state.story.completed).toBe(state.level - 1 >= config.chaptersPerStory);
  });
});
