import { describe, expect, it } from 'vitest';

import { journeyView, levelProgress, sceneLevel } from './journey-progress';

const player = (level: number, expInLevel: number) => ({ level, expInLevel, expForNextLevel: 50 });

describe('levelProgress', () => {
  it('follows the EXP within the level', () => {
    expect(levelProgress(player(1, 0))).toBe(0);
    expect(levelProgress(player(1, 25))).toBe(0.5);
  });

  it('clamps between 0 and 1', () => {
    expect(levelProgress(player(1, 80))).toBe(1);
    expect(levelProgress({ level: 1, expInLevel: 5, expForNextLevel: 0 })).toBe(0);
  });
});

describe('journeyView', () => {
  it('without a displayed level, or equal to the current one, uses the EXP', () => {
    expect(journeyView(player(2, 10), undefined)).toEqual({ progress: 0.2, portalPending: false });
    expect(journeyView(player(2, 10), 2)).toEqual({ progress: 0.2, portalPending: false });
  });

  it('leveled up and the scene has not switched yet: stays at the portal', () => {
    expect(journeyView(player(3, 5), 2)).toEqual({ progress: 1, portalPending: true });
  });

  it('displayed level above the current one (undone check) does not trap at the portal', () => {
    expect(journeyView(player(2, 10), 3)).toEqual({ progress: 0.2, portalPending: false });
  });
});

describe('completed story (chapter 5 past the end)', () => {
  const concluida = (level: number, expInLevel: number) => ({
    level,
    expInLevel,
    expForNextLevel: 1000,
    story: { completed: true },
  });

  it('the scene does not go past chapter 5', () => {
    expect(sceneLevel(3)).toBe(3);
    expect(sceneLevel(5)).toBe(5);
    expect(sceneLevel(9)).toBe(5);
  });

  it('the character stays at the end of the scene, with no portal, even when leveling up', () => {
    expect(journeyView(concluida(6, 100), 5)).toEqual({ progress: 1, portalPending: false });
    expect(journeyView(concluida(9, 0), 5)).toEqual({ progress: 1, portalPending: false });
  });

  it('the portal from chapter 4 to 5 still applies', () => {
    expect(journeyView(player(5, 10), 4)).toEqual({ progress: 1, portalPending: true });
  });
});
