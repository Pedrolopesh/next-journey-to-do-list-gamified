import type {
  Difficulty,
  GameConfig,
  ItemType,
  LocalDate,
  PlayerState,
} from '@nextjourney/contracts';

import { checksParaCapitulo, expParaNivel } from './levels.js';

export type CheckInput = {
  checkId: string;
  type: ItemType;
  difficulty: Difficulty;
  /** Dia local do usuário no momento do check (já calculado com diaLocal). */
  localDate: LocalDate;
};

/**
 * Registro do que um check fez, guardado em item_checks. É a entrada de desfazerCheck e
 * permite reverter exatamente aquele check.
 */
export type CheckRecord = {
  checkId: string;
  localDate: LocalDate;
  exp: number;
  coins: number;
  countsForChapter: boolean;
  /** Capítulo em que o check contou (nulo se a história já estava concluída). */
  chapterAtCheck: number | null;
  /** O check fechou o capítulo. */
  closedChapter: boolean;
};

export type CheckSummary = {
  expGanho: number;
  moedasGanhas: number;
  /** Bônus de subida de nível, à parte das moedas do check. */
  bonusMoedas: number;
  subiuDeNivel: boolean;
  niveisGanhos: number;
  nivel: number;
  capituloConcluido: boolean;
  historiaConcluida: boolean;
  progressoCapitulo: { capitulo: number; checks: number; necessarios: number };
};

export type ApplyCheckResult = {
  state: PlayerState;
  summary: CheckSummary;
  record: CheckRecord;
};

/**
 * Aplica um check ao estado do jogador. Função pura: recebe dados, devolve dados.
 *
 * - EXP e moedas vêm da dificuldade (config). Hábito não tem limite diário.
 * - O EXP que sobra ao subir de nível é carregado; um check pode subir mais de um nível.
 * - Cada nível ganho rende o bônus de moedas.
 * - Todo tipo de item conta 1 passo para o capítulo, até a história terminar.
 */
export function aplicarCheck(
  state: PlayerState,
  input: CheckInput,
  config: GameConfig,
): ApplyCheckResult {
  const exp = config.expByDifficulty[input.difficulty];
  const coins = config.coinsByDifficulty[input.difficulty];

  // Nível e EXP
  let level = state.level;
  let expInLevel = state.expInLevel + exp;
  let niveisGanhos = 0;
  while (expInLevel >= expParaNivel(level, config)) {
    expInLevel -= expParaNivel(level, config);
    level += 1;
    niveisGanhos += 1;
  }
  const bonusMoedas = niveisGanhos * config.levelUpBonusCoins;

  // Capítulo
  let story = state.story;
  let countsForChapter = false;
  let chapterAtCheck: number | null = null;
  let closedChapter = false;
  let historiaConcluida = false;
  if (!story.completed) {
    countsForChapter = true;
    chapterAtCheck = story.chapter;
    const checks = story.checksInChapter + 1;
    const required = checksParaCapitulo(story.chapter, config);
    if (checks >= required) {
      closedChapter = true;
      if (story.chapter >= config.chaptersPerStory) {
        historiaConcluida = true;
        story = {
          chapter: story.chapter,
          checksInChapter: required,
          completed: true,
        };
      } else {
        story = {
          chapter: story.chapter + 1,
          checksInChapter: 0,
          completed: false,
        };
      }
    } else {
      story = { ...story, checksInChapter: checks };
    }
  }

  const progressoCapitulo = {
    capitulo: story.chapter,
    checks: story.checksInChapter,
    necessarios: checksParaCapitulo(story.chapter, config),
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
