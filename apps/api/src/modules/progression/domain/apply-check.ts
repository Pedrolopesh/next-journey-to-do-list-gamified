import type {
  Difficulty,
  GameConfig,
  ItemType,
  LocalDate,
  PlayerState,
} from '@nextjourney/contracts';

import { expParaNivel } from './levels.js';

export type CheckInput = {
  checkId: string;
  type: ItemType;
  difficulty: Difficulty;
  /** User's local day at check time (already computed with `diaLocal`). */
  localDate: LocalDate;
  /** This item already earned EXP today (unchecked and checked again): it earns only the coins. */
  expJaGanho?: boolean;
};

/**
 * Record of what a check did, stored in item_checks; the input of `desfazerCheck`.
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
  expGanho: number;
  moedasGanhas: number;
  /** Level-up bonus, separate from the check's coins. */
  bonusMoedas: number;
  subiuDeNivel: boolean;
  niveisGanhos: number;
  nivel: number;
  capituloConcluido: boolean;
  historiaConcluida: boolean;
  /** Chapters finished by this check, in order (one per level gained, until the story ends). */
  capitulosConcluidos: number[];
  progressoCapitulo: { capitulo: number; expNoNivel: number; expParaProximo: number };
};

export type ApplyCheckResult = {
  state: PlayerState;
  summary: CheckSummary;
  record: CheckRecord;
};

/**
 * Applies a check to the player's state. Pure function. Rules: docs/api/progressao-e-jogo.md.
 */
export function aplicarCheck(
  state: PlayerState,
  input: CheckInput,
  config: GameConfig,
): ApplyCheckResult {
  const exp = input.expJaGanho ? 0 : config.expByDifficulty[input.difficulty];
  const coins = config.coinsByDifficulty[input.difficulty];

  let level = state.level;
  let expInLevel = state.expInLevel + exp;
  let niveisGanhos = 0;
  while (expInLevel >= expParaNivel(level, config)) {
    expInLevel -= expParaNivel(level, config);
    level += 1;
    niveisGanhos += 1;
  }
  const bonusMoedas = niveisGanhos * config.levelUpBonusCoins;

  // Chapter: every level gained finishes one chapter of the active story, until the story ends
  let story = state.story;
  let countsForChapter = false;
  let chapterAtCheck: number | null = null;
  const capitulosConcluidos: number[] = [];
  let historiaConcluida = false;
  if (!story.completed) {
    countsForChapter = true;
    chapterAtCheck = story.chapter;
    let chapter = story.chapter;
    for (let i = 0; i < niveisGanhos; i++) {
      capitulosConcluidos.push(chapter);
      if (chapter >= config.chaptersPerStory) {
        historiaConcluida = true;
        break;
      }
      chapter += 1;
    }
    story = { chapter, completed: historiaConcluida };
  }
  const closedChapter = capitulosConcluidos.length > 0;

  const progressoCapitulo = {
    capitulo: story.chapter,
    expNoNivel: expInLevel,
    expParaProximo: expParaNivel(level, config),
  };

  return {
    state: {
      level,
      expInLevel,
      expTotal: state.expTotal + exp,
      coins: state.coins + coins + bonusMoedas,
      totalChecks: state.totalChecks + 1,
      story,
    },
    summary: {
      expGanho: exp,
      moedasGanhas: coins,
      bonusMoedas,
      subiuDeNivel: niveisGanhos > 0,
      niveisGanhos,
      nivel: level,
      capituloConcluido: closedChapter,
      capitulosConcluidos,
      historiaConcluida,
      progressoCapitulo,
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
