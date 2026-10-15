import { describe, expect, it } from 'vitest';

import { extrasOf, patrolSpot } from './extras';
import type { ExtraCharacter, SceneDef } from './scenes/types';

const person = (x: number): ExtraCharacter => ({
  x,
  feetY: 170,
  anim: 'idle',
  direction: 'down',
  selection: {},
});

describe('patrolSpot', () => {
  const patrol = { from: 10, to: 110, speed: 20 };

  it('começa em `from` olhando para `to`', () => {
    expect(patrolSpot(patrol, 0)).toEqual({ x: 10, direction: 'right' });
  });

  it('avança na velocidade dada', () => {
    expect(patrolSpot(patrol, 2)).toEqual({ x: 50, direction: 'right' });
  });

  it('dá a volta no fim do trecho e olha para o outro lado', () => {
    expect(patrolSpot(patrol, 6)).toEqual({ x: 90, direction: 'left' });
  });

  it('recomeça depois de ir e voltar', () => {
    expect(patrolSpot(patrol, 10)).toEqual({ x: 10, direction: 'right' });
  });

  it('funciona da direita para a esquerda', () => {
    expect(patrolSpot({ from: 200, to: 100, speed: 10 }, 3)).toEqual({ x: 170, direction: 'left' });
  });

  it('sem trecho ou sem velocidade fica parado', () => {
    expect(patrolSpot({ from: 5, to: 5, speed: 10 }, 3).x).toBe(5);
    expect(patrolSpot({ from: 5, to: 50, speed: 0 }, 3).x).toBe(5);
  });
});

describe('extrasOf', () => {
  const def = {
    extras: [person(1)],
    extrasFor: (level: number) => [person(level)],
  } as unknown as SceneDef;

  it('usa os figurantes do nível quando o cenário os define', () => {
    expect(extrasOf(def, 3)[0]?.x).toBe(3);
  });

  it('devolve a mesma lista nas chamadas seguintes', () => {
    expect(extrasOf(def, 2)).toBe(extrasOf(def, 2));
  });

  it('sem figurantes por nível cai em `extras`', () => {
    const plain = { extras: [person(9)] } as unknown as SceneDef;
    expect(extrasOf(plain, 4)[0]?.x).toBe(9);
    expect(extrasOf({} as SceneDef, 1)).toEqual([]);
  });
});
