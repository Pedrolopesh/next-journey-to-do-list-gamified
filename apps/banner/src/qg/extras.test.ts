import { describe, expect, it } from 'vitest';

import { extrasOf, followSpot, journeySpot, patrolSpot } from './extras';
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

  it('starts at `from` facing `to`', () => {
    expect(patrolSpot(patrol, 0)).toEqual({ x: 10, direction: 'right' });
  });

  it('advances at the given speed', () => {
    expect(patrolSpot(patrol, 2)).toEqual({ x: 50, direction: 'right' });
  });

  it('turns around at the end of the stretch and faces the other way', () => {
    expect(patrolSpot(patrol, 6)).toEqual({ x: 90, direction: 'left' });
  });

  it('starts over after going and coming back', () => {
    expect(patrolSpot(patrol, 10)).toEqual({ x: 10, direction: 'right' });
  });

  it('works from right to left', () => {
    expect(patrolSpot({ from: 200, to: 100, speed: 10 }, 3)).toEqual({ x: 170, direction: 'left' });
  });

  it('without a stretch or without speed it stands still', () => {
    expect(patrolSpot({ from: 5, to: 5, speed: 10 }, 3).x).toBe(5);
    expect(patrolSpot({ from: 5, to: 50, speed: 0 }, 3).x).toBe(5);
  });
});

describe('extrasOf', () => {
  const def = {
    extras: [person(1)],
    extrasFor: (level: number) => [person(level)],
  } as unknown as SceneDef;

  it('uses the level extras when the scenery defines them', () => {
    expect(extrasOf(def, 3)[0]?.x).toBe(3);
  });

  it('devolve a mesma lista nas chamadas seguintes', () => {
    expect(extrasOf(def, 2)).toBe(extrasOf(def, 2));
  });

  it('without per-level extras it falls back to `extras`', () => {
    const plain = { extras: [person(9)] } as unknown as SceneDef;
    expect(extrasOf(plain, 4)[0]?.x).toBe(9);
    expect(extrasOf({} as SceneDef, 1)).toEqual([]);
  });
});

describe('journey extras', () => {
  const def = {
    extrasFor: (level: number) => [person(level)],
    journeyExtrasFor: (level: number) => [person(level * 100)],
  } as unknown as SceneDef;

  it('uses the dedicated journey list, separate from the HQ one', () => {
    expect(extrasOf(def, 2, true)[0]?.x).toBe(200);
    expect(extrasOf(def, 2, false)[0]?.x).toBe(2);
    expect(extrasOf(def, 2, true)).toBe(extrasOf(def, 2, true));
  });

  it('without a journey list there are no extras in it', () => {
    expect(extrasOf({ extrasFor: () => [person(1)] } as unknown as SceneDef, 1, true)).toEqual([]);
  });

  it('whoever is standing passes with the scrolling scenery', () => {
    expect(journeySpot(person(300), 0, 5, 820).x).toBe(300);
    expect(journeySpot(person(300), 120, 5, 820).x).toBe(180);
  });

  it('whoever walks moves in the world and faces where they are going', () => {
    const walker = { ...person(300), drift: 10 };
    expect(journeySpot(walker, 0, 5, 820)).toEqual({ x: 350, direction: 'right' });
    expect(journeySpot({ ...walker, drift: -10 }, 0, 5, 820)).toEqual({
      x: 250,
      direction: 'left',
    });
  });

  it('wraps around the world cycle', () => {
    expect(journeySpot(person(10), 120, 0, 820).x).toBe(710);
  });
});

describe('followSpot', () => {
  const behind = { offset: -60, sway: 0, rate: 1, phase: 0 };
  const ahead = { offset: 60, sway: 0, rate: 1, phase: 0 };

  it('stays behind or ahead of the character when the scenery runs', () => {
    expect(followSpot(behind, 200, 0, 1).x).toBe(140);
    expect(followSpot(ahead, 200, 0, 1).x).toBe(260);
  });

  it('leaves the screen on the side they came from when the scenery stops', () => {
    expect(followSpot(behind, 200, 0, 0).x).toBeLessThan(0);
    expect(followSpot(ahead, 200, 0, 0).x).toBeGreaterThan(390);
  });

  it('never passes the character, even while swaying', () => {
    const wobble = { offset: -40, sway: 6, rate: 2, phase: 0 };
    for (let t = 0; t < 10; t += 0.1) expect(followSpot(wobble, 200, t, 1).x).toBeLessThan(200);
  });
});
