import type {
  Difficulty,
  GameConfig,
  ItemType,
  LocalDate,
  PlayerState,
} from '@nextjourney/contracts';

import { expForLevel } from './levels.js';

export type CheckInput = {
  checkId: string;
  type: ItemType;
  difficulty: Difficulty;
  /** User's local day at check time (already computed with `localDay`). */
  localDate: LocalDate;
  /** This item already earned EXP today (unchecked and checked again): it earns only the coins. */
  expAlreadyEarned?: boolean;
};

/**
 * Record of what a check did, stored in item_checks; the input of `undoCheck`.
 */
export type CheckRecord = {
  checkId: string;
  localDate: LocalDate;
  exp: number;
  coins: number;
  countsForChapter: boolean;
  /** Chapter the check counted in (null if the story was already finished). */
  chapterAtCheck: number | null;
  /** The check raised the level and so finished chapter(s) of the active story. */
  closedChapter: boolean;
};

export type CheckSummary = {
  expGained: number;
  coinsGained: number;
  /** Level-up bonus, separate from the check's coins. */
  bonusCoins: number;
  leveledUp: boolean;
  levelsGained: number;
  level: number;
  chapterCompleted: boolean;
  storyCompleted: boolean;
  /** Chapters finished by this check, in order (one per level gained, until the story ends). */
  completedChapters: number[];
  chapterProgress: { chapter: number; expInLevel: number; expToNext: number };
};

export type ApplyCheckResult = {
  state: PlayerState;
  summary: CheckSummary;
  record: CheckRecord;
};

/**
 * Applies a check to the player's state. Pure function. Rules: docs/api/progressao-e-jogo.md.
 */
export function applyCheck(
  state: PlayerState,
  input: CheckInput,
  config: GameConfig,
): ApplyCheckResult {
  const exp = input.expAlreadyEarned ? 0 : config.expByDifficulty[input.difficulty];
  const coins = config.coinsByDifficulty[input.difficulty];

  let level = state.level;
  let expInLevel = state.expInLevel + exp;
  let levelsGained = 0;
  while (expInLevel >= expForLevel(level, config)) {
    expInLevel -= expForLevel(level, config);
    level += 1;
    levelsGained += 1;
  }
  const bonusCoins = levelsGained * config.levelUpBonusCoins;

  // Chapter: every level gained finishes one chapter of the active story, until the story ends
  let story = state.story;
  let countsForChapter = false;
  let chapterAtCheck: number | null = null;
  const completedChapters: number[] = [];
  let storyCompleted = false;
  if (!story.completed) {
    countsForChapter = true;
    chapterAtCheck = story.chapter;
    let chapter = story.chapter;
    for (let i = 0; i < levelsGained; i++) {
      completedChapters.push(chapter);
      if (chapter >= config.chaptersPerStory) {
        storyCompleted = true;
        break;
      }
      chapter += 1;
    }
    story = { chapter, completed: storyCompleted };
  }
  const closedChapter = completedChapters.length > 0;

  const chapterProgress = {
    chapter: story.chapter,
    expInLevel: expInLevel,
    expToNext: expForLevel(level, config),
  };

  return {
    state: {
      level,
      expInLevel,
      expTotal: state.expTotal + exp,
      coins: state.coins + coins + bonusCoins,
      totalChecks: state.totalChecks + 1,
      story,
    },
    summary: {
      expGained: exp,
      coinsGained: coins,
      bonusCoins,
      leveledUp: levelsGained > 0,
      levelsGained,
      level: level,
      chapterCompleted: closedChapter,
      completedChapters,
      storyCompleted,
      chapterProgress,
    },
    record: {
      checkId: input.checkId,
      localDate: input.localDate,
      exp,
      coins,
      countsForChapter,
      chapterAtCheck,
      closedChapter,
    },
  };
}
