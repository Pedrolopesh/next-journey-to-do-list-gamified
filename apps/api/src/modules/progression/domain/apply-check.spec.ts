import {
  DEFAULT_GAME_CONFIG as config,
  type Difficulty,
  type PlayerState,
} from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { aplicarCheck, type CheckInput } from './apply-check.js';
import { checksParaCapitulo, expParaNivel } from './levels.js';

const inicial: PlayerState = {
  level: 1,
  expInLevel: 0,
  expTotal: 0,
  coins: 0,
  totalChecks: 0,
  story: { chapter: 1, checksInChapter: 0, completed: false },
};

const input = (difficulty: Difficulty, type: CheckInput['type'] = 'daily'): CheckInput => ({
  checkId: '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10',
  type,
  difficulty,
  localDate: '2026-10-09',
});

describe('aplicarCheck: EXP, moedas e nível', () => {
  it.each([
    ['easy', 5, 1],
    ['medium', 10, 2],
    ['hard', 20, 4],
  ] as const)('dificuldade %s rende %i EXP e %i moedas', (difficulty, exp, coins) => {
    const { state, summary } = aplicarCheck(inicial, input(difficulty), config);
    expect(summary.expGanho).toBe(exp);
    expect(summary.moedasGanhas).toBe(coins);
    expect(state.expInLevel).toBe(exp);
    expect(state.expTotal).toBe(exp);
    expect(state.coins).toBe(coins);
    expect(state.totalChecks).toBe(1);
    expect(summary.subiuDeNivel).toBe(false);
  });

  it('não muda o estado original (função pura)', () => {
    const copia = structuredClone(inicial);
    aplicarCheck(inicial, input('hard'), config);
    expect(inicial).toEqual(copia);
  });

  it('sobe de nível ao chegar em 50 EXP (nível 1 -> 2) e dá o bônus de 10 moedas', () => {
    const quase: PlayerState = { ...inicial, expInLevel: 45, expTotal: 45 };
    const { state, summary } = aplicarCheck(quase, input('easy'), config);
    expect(summary.subiuDeNivel).toBe(true);
    expect(summary.niveisGanhos).toBe(1);
    expect(state.level).toBe(2);
    expect(state.expInLevel).toBe(0);
    expect(summary.bonusMoedas).toBe(10);
    expect(state.coins).toBe(1 + 10);
  });

  it('carrega o EXP que sobra para o próximo nível', () => {
    const quase: PlayerState = { ...inicial, expInLevel: 45, expTotal: 45 };
    const { state } = aplicarCheck(quase, input('hard'), config); // 45 + 20 = 65
    expect(state.level).toBe(2);
    expect(state.expInLevel).toBe(15);
  });

  it('pode subir mais de um nível num check e soma um bônus por nível', () => {
    const generosa = {
      ...config,
      expByDifficulty: { easy: 5, medium: 10, hard: 400 },
    };
    const { state, summary } = aplicarCheck(inicial, input('hard'), generosa);
    // 50 (1->2) + 125 (2->3) + 200 (3->4) = 375; sobram 25
    expect(summary.niveisGanhos).toBe(3);
    expect(state.level).toBe(4);
    expect(state.expInLevel).toBe(25);
    expect(summary.bonusMoedas).toBe(30);
  });

  it('hábito não tem limite diário: todo check rende EXP e moedas', () => {
    let state = inicial;
    for (let i = 0; i < 6; i += 1) {
      const result = aplicarCheck(state, input('medium', 'habit'), config);
      expect(result.summary.expGanho).toBe(10);
      expect(result.summary.moedasGanhas).toBe(2);
      state = result.state;
    }
    expect(state.totalChecks).toBe(6);
  });

  it('diário, tarefa e hábito rendem igual (só a dificuldade importa)', () => {
    const a = aplicarCheck(inicial, input('medium', 'daily'), config).summary;
    const b = aplicarCheck(inicial, input('medium', 'todo'), config).summary;
    const c = aplicarCheck(inicial, input('medium', 'habit'), config).summary;
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});

describe('aplicarCheck: capítulos e história', () => {
  it('cada check conta 1 passo para o capítulo', () => {
    const { state, summary } = aplicarCheck(inicial, input('easy'), config);
    expect(state.story).toEqual({
      chapter: 1,
      checksInChapter: 1,
      completed: false,
    });
    expect(summary.progressoCapitulo).toEqual({
      capitulo: 1,
      checks: 1,
      necessarios: 10,
    });
    expect(summary.capituloConcluido).toBe(false);
  });

  it('fecha o capítulo exatamente no check 10 e abre o seguinte (15 checks)', () => {
    const quase: PlayerState = {
      ...inicial,
      story: { chapter: 1, checksInChapter: 9, completed: false },
    };
    const { state, summary, record } = aplicarCheck(quase, input('easy'), config);
    expect(summary.capituloConcluido).toBe(true);
    expect(record.closedChapter).toBe(true);
    expect(state.story).toEqual({
      chapter: 2,
      checksInChapter: 0,
      completed: false,
    });
    expect(summary.progressoCapitulo.necessarios).toBe(checksParaCapitulo(2));
  });

  it('o 5º capítulo conclui a história; depois os checks seguem rendendo EXP sem avançar capítulo', () => {
    const ultimo: PlayerState = {
      ...inicial,
      story: { chapter: 5, checksInChapter: 29, completed: false },
    };
    const fim = aplicarCheck(ultimo, input('easy'), config);
    expect(fim.summary.capituloConcluido).toBe(true);
    expect(fim.summary.historiaConcluida).toBe(true);
    expect(fim.state.story.completed).toBe(true);

    const depois = aplicarCheck(fim.state, input('hard'), config);
    expect(depois.summary.expGanho).toBe(20);
    expect(depois.state.story).toEqual(fim.state.story);
    expect(depois.record.countsForChapter).toBe(false);
    expect(depois.record.chapterAtCheck).toBeNull();
  });

  it('limite de 40 checks vale a partir do capítulo 7 (config com mais capítulos)', () => {
    const longa = { ...config, chaptersPerStory: 10 };
    const estado: PlayerState = {
      ...inicial,
      story: { chapter: 7, checksInChapter: 39, completed: false },
    };
    const { summary } = aplicarCheck(estado, input('easy'), longa);
    expect(summary.capituloConcluido).toBe(true);
  });

  it('o registro guarda o necessário para desfazer', () => {
    const { record } = aplicarCheck(inicial, input('medium'), config);
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

  it('invariante: EXP no nível sempre abaixo do necessário', () => {
    let state = inicial;
    for (let i = 0; i < 200; i += 1) {
      state = aplicarCheck(state, input(i % 3 === 0 ? 'hard' : 'easy'), config).state;
      expect(state.expInLevel).toBeLessThan(expParaNivel(state.level));
    }
  });
});
