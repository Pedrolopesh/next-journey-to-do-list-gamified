import {
  DEFAULT_GAME_CONFIG as config,
  type Difficulty,
  type PlayerState,
} from '@nextjourney/contracts';
import { describe, expect, it } from 'vitest';

import { aplicarCheck, type CheckInput } from './apply-check.js';
import { expParaNivel } from './levels.js';

const inicial: PlayerState = {
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

  it('sobe de nível ao chegar em 200 EXP (nível 1 -> 2) e dá o bônus de 10 moedas', () => {
    const quase: PlayerState = { ...inicial, expInLevel: 195, expTotal: 195 };
    const { state, summary } = aplicarCheck(quase, input('easy'), config);
    expect(summary.subiuDeNivel).toBe(true);
    expect(summary.niveisGanhos).toBe(1);
    expect(state.level).toBe(2);
    expect(state.expInLevel).toBe(0);
    expect(summary.bonusMoedas).toBe(10);
    expect(state.coins).toBe(1 + 10);
  });

  it('carrega o EXP que sobra para o próximo nível', () => {
    const quase: PlayerState = { ...inicial, expInLevel: 195, expTotal: 195 };
    const { state } = aplicarCheck(quase, input('hard'), config); // 195 + 20 = 215
    expect(state.level).toBe(2);
    expect(state.expInLevel).toBe(15);
  });

  it('pode subir mais de um nível num check e soma um bônus por nível', () => {
    const generosa = {
      ...config,
      expByDifficulty: { easy: 5, medium: 10, hard: 1200 },
    };
    const { state, summary } = aplicarCheck(inicial, input('hard'), generosa);
    // 200 (1->2) + 400 (2->3) + 600 (3->4) = 1200; sobra 0
    expect(summary.niveisGanhos).toBe(3);
    expect(state.level).toBe(4);
    expect(state.expInLevel).toBe(0);
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

describe('aplicarCheck: capítulos e história (cada nível ganho conclui um capítulo)', () => {
  it('check sem subir de nível não conclui capítulo e mostra a EXP como progresso', () => {
    const { state, summary } = aplicarCheck(inicial, input('easy'), config);
    expect(state.story).toEqual({ chapter: 1, completed: false });
    expect(summary.progressoCapitulo).toEqual({ capitulo: 1, expNoNivel: 5, expParaProximo: 200 });
    expect(summary.capituloConcluido).toBe(false);
    expect(summary.capitulosConcluidos).toEqual([]);
  });

  it('subir de nível conclui o capítulo atual e abre o seguinte', () => {
    const quase: PlayerState = { ...inicial, expInLevel: 195, expTotal: 195 };
    const { state, summary, record } = aplicarCheck(quase, input('easy'), config);
    expect(summary.capituloConcluido).toBe(true);
    expect(summary.capitulosConcluidos).toEqual([1]);
    expect(record.closedChapter).toBe(true);
    expect(state.level).toBe(2);
    expect(state.story).toEqual({ chapter: 2, completed: false });
    expect(summary.progressoCapitulo).toEqual({ capitulo: 2, expNoNivel: 0, expParaProximo: 400 });
  });

  it('vários níveis num check concluem vários capítulos, um por nível', () => {
    const generosa = { ...config, expByDifficulty: { easy: 5, medium: 10, hard: 1200 } };
    const { state, summary } = aplicarCheck(inicial, input('hard'), generosa);
    expect(summary.niveisGanhos).toBe(3);
    expect(summary.capitulosConcluidos).toEqual([1, 2, 3]);
    expect(state.story).toEqual({ chapter: 4, completed: false });
  });

  it('o 5º capítulo conclui a história; níveis seguintes seguem sem capítulo', () => {
    const ultimo: PlayerState = {
      ...inicial,
      level: 5,
      expInLevel: 970,
      expTotal: 2900,
      story: { chapter: 5, completed: false },
    };
    const fim = aplicarCheck(ultimo, input('hard'), config); // 970 + 20 < 1000: ainda no capítulo 5
    expect(fim.summary.capituloConcluido).toBe(false);
    const quase: PlayerState = { ...ultimo, expInLevel: 995 };
    const concluiu = aplicarCheck(quase, input('easy'), config);
    expect(concluiu.summary.capitulosConcluidos).toEqual([5]);
    expect(concluiu.summary.historiaConcluida).toBe(true);
    expect(concluiu.state.story).toEqual({ chapter: 5, completed: true });

    const depois = aplicarCheck(
      { ...concluiu.state, expInLevel: concluiu.state.expInLevel },
      input('hard'),
      config,
    );
    expect(depois.state.story).toEqual(concluiu.state.story);
    expect(depois.record.countsForChapter).toBe(false);
    expect(depois.record.chapterAtCheck).toBeNull();
    expect(depois.summary.capitulosConcluidos).toEqual([]);
  });

  it('item que já rendeu EXP hoje rende só as moedas', () => {
    const { state, summary, record } = aplicarCheck(
      inicial,
      { ...input('medium'), expJaGanho: true },
      config,
    );
    expect(summary.expGanho).toBe(0);
    expect(summary.moedasGanhas).toBe(2);
    expect(state.expInLevel).toBe(0);
    expect(state.expTotal).toBe(0);
    expect(state.coins).toBe(2);
    expect(record.exp).toBe(0);
  });

  it('depois da história concluída o nível sobe de 1000 em 1000 e o capítulo não avança', () => {
    const fim: PlayerState = {
      ...inicial,
      level: 6,
      expInLevel: 990,
      expTotal: 4000,
      story: { chapter: 5, completed: true },
    };
    const { state, summary } = aplicarCheck(fim, input('hard'), config);
    expect(state.level).toBe(7);
    expect(state.expInLevel).toBe(10);
    expect(summary.capitulosConcluidos).toEqual([]);
    expect(state.story).toEqual({ chapter: 5, completed: true });
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

  it('invariante: capítulos concluídos = níveis ganhos até o fim da história', () => {
    let state = inicial;
    let concluidos = 0;
    for (let i = 0; i < 400; i += 1) {
      const result = aplicarCheck(state, input('hard'), config);
      concluidos += result.summary.capitulosConcluidos.length;
      state = result.state;
    }
    expect(concluidos).toBe(Math.min(state.level - 1, config.chaptersPerStory));
    expect(state.story.completed).toBe(state.level - 1 >= config.chaptersPerStory);
  });
});
