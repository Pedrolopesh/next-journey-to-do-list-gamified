import {
  DEFAULT_GAME_CONFIG as config,
  type Difficulty,
  type PlayerState,
} from '@nextjourney/contracts';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { aplicarCheck, type CheckInput } from './apply-check.js';
import { expParaNivel } from './levels.js';
import { desfazerCheck } from './undo-check.js';

const HOJE = '2026-10-09';

const inicial: PlayerState = {
  level: 1,
  expInLevel: 0,
  expTotal: 0,
  coins: 0,
  totalChecks: 0,
  story: { chapter: 1, checksInChapter: 0, completed: false },
};

const input = (difficulty: Difficulty, localDate = HOJE): CheckInput => ({
  checkId: '3f1f4c2e-5a7b-4f3e-9c1d-2b8a6d4e7f10',
  type: 'habit',
  difficulty,
  localDate,
});

describe('desfazerCheck', () => {
  it('no mesmo dia devolve EXP, moedas e o passo do capítulo', () => {
    const feito = aplicarCheck(inicial, input('medium'), config);
    const undo = desfazerCheck(feito.state, feito.record, HOJE);
    expect(undo.ok).toBe(true);
    if (!undo.ok) return;
    expect(undo.state).toEqual(inicial);
    expect(undo.summary).toEqual({ expDevolvido: 10, moedasDevolvidas: 2 });
  });

  it('só funciona no mesmo dia local', () => {
    const feito = aplicarCheck(inicial, input('easy', '2026-10-08'), config);
    expect(desfazerCheck(feito.state, feito.record, HOJE)).toEqual({
      ok: false,
      motivo: 'OUTRO_DIA',
    });
  });

  it('o nível nunca cai e o bônus de moedas não é revertido', () => {
    const quase: PlayerState = { ...inicial, expInLevel: 45, expTotal: 45 };
    const feito = aplicarCheck(quase, input('easy'), config); // sobe para o nível 2
    expect(feito.state.level).toBe(2);
    const undo = desfazerCheck(feito.state, feito.record, HOJE);
    expect(undo.ok).toBe(true);
    if (!undo.ok) return;
    expect(undo.state.level).toBe(2);
    expect(undo.state.expInLevel).toBe(0); // para no mínimo do nível atual
    expect(undo.state.coins).toBe(10); // 1 moeda do check devolvida, 10 do bônus ficam
    expect(undo.summary.expDevolvido).toBe(0);
  });

  it('o check que fechou o capítulo não pode ser desmarcado', () => {
    const quase: PlayerState = {
      ...inicial,
      story: { chapter: 1, checksInChapter: 9, completed: false },
    };
    const feito = aplicarCheck(quase, input('easy'), config);
    expect(desfazerCheck(feito.state, feito.record, HOJE)).toEqual({
      ok: false,
      motivo: 'CAPITULO_FECHADO',
    });
  });

  it('check de um capítulo que já fechou também fica travado', () => {
    const quase: PlayerState = {
      ...inicial,
      story: { chapter: 1, checksInChapter: 8, completed: false },
    };
    const primeiro = aplicarCheck(quase, input('easy'), config); // 9 de 10
    const fechou = aplicarCheck(primeiro.state, input('easy'), config); // fecha
    expect(fechou.summary.capituloConcluido).toBe(true);
    expect(desfazerCheck(fechou.state, primeiro.record, HOJE)).toEqual({
      ok: false,
      motivo: 'CAPITULO_FECHADO',
    });
  });

  it('check depois da história concluída (não conta para capítulo) pode ser desfeito', () => {
    const concluida: PlayerState = {
      ...inicial,
      story: { chapter: 5, checksInChapter: 30, completed: true },
    };
    const feito = aplicarCheck(concluida, input('hard'), config);
    const undo = desfazerCheck(feito.state, feito.record, HOJE);
    expect(undo.ok).toBe(true);
    if (!undo.ok) return;
    expect(undo.state).toEqual(concluida);
  });

  it('não deixa moedas nem contadores negativos', () => {
    const feito = aplicarCheck(inicial, input('hard'), config);
    const zerado: PlayerState = { ...feito.state, coins: 0, totalChecks: 0 };
    const undo = desfazerCheck(zerado, feito.record, HOJE);
    expect(undo.ok).toBe(true);
    if (!undo.ok) return;
    expect(undo.state.coins).toBe(0);
    expect(undo.state.totalChecks).toBe(0);
  });
});

const difficultyArb = fc.constantFrom<Difficulty>('easy', 'medium', 'hard');

const stateArb = fc
  .record({
    level: fc.integer({ min: 1, max: 30 }),
    coins: fc.integer({ min: 0, max: 5000 }),
    totalChecks: fc.integer({ min: 0, max: 5000 }),
    chapter: fc.integer({ min: 1, max: 5 }),
    seed: fc.double({ min: 0, max: 0.999, noNaN: true }),
    chapterSeed: fc.double({ min: 0, max: 0.999, noNaN: true }),
  })
  .map(({ level, coins, totalChecks, chapter, seed, chapterSeed }): PlayerState => {
    const expInLevel = Math.floor(seed * expParaNivel(level));
    const required = Math.min(10 + 5 * (chapter - 1), 40);
    return {
      level,
      expInLevel,
      expTotal: expInLevel + 1000,
      coins,
      totalChecks: Math.max(totalChecks, 1),
      story: {
        chapter,
        checksInChapter: Math.floor(chapterSeed * required),
        completed: false,
      },
    };
  });

describe('propriedades (fast-check)', () => {
  it('aplicar e desfazer no mesmo dia volta ao estado original (exceto nível, que nunca cai)', () => {
    fc.assert(
      fc.property(stateArb, difficultyArb, (estado, difficulty) => {
        const feito = aplicarCheck(estado, input(difficulty), config);
        const undo = desfazerCheck(feito.state, feito.record, HOJE);
        if (!feito.summary.subiuDeNivel && !feito.summary.capituloConcluido) {
          // sem subir de nível nem fechar capítulo, volta exatamente ao original
          expect(undo.ok).toBe(true);
          if (undo.ok) expect(undo.state).toEqual(estado);
        } else if (undo.ok) {
          // se voltou, o nível nunca é menor do que o do estado original
          expect(undo.state.level).toBeGreaterThanOrEqual(estado.level);
        }
      }),
      { numRuns: 500 },
    );
  });

  it('invariantes: EXP no nível dentro do limite, nível e contadores nunca decrescem ao aplicar', () => {
    fc.assert(
      fc.property(
        stateArb,
        fc.array(difficultyArb, { minLength: 1, maxLength: 40 }),
        (estado, seq) => {
          let atual = estado;
          for (const difficulty of seq) {
            const { state } = aplicarCheck(atual, input(difficulty), config);
            expect(state.level).toBeGreaterThanOrEqual(atual.level);
            expect(state.expTotal).toBeGreaterThan(atual.expTotal);
            expect(state.totalChecks).toBe(atual.totalChecks + 1);
            expect(state.coins).toBeGreaterThanOrEqual(atual.coins);
            expect(state.expInLevel).toBeLessThan(expParaNivel(state.level));
            atual = state;
          }
        },
      ),
    );
  });

  it('desfazer nunca reduz o nível nem gera valores negativos', () => {
    fc.assert(
      fc.property(stateArb, difficultyArb, (estado, difficulty) => {
        const feito = aplicarCheck(estado, input(difficulty), config);
        const undo = desfazerCheck(feito.state, feito.record, HOJE);
        if (!undo.ok) return;
        expect(undo.state.level).toBe(feito.state.level);
        expect(undo.state.expInLevel).toBeGreaterThanOrEqual(0);
        expect(undo.state.coins).toBeGreaterThanOrEqual(0);
        expect(undo.state.totalChecks).toBeGreaterThanOrEqual(0);
      }),
    );
  });
});
