import { describe, expect, it } from 'vitest';

import { SCENES } from './index';
import { TIMES } from './types';

describe('HQ scenes', () => {
  it('there are at least 5 options, with unique ids and the foot line inside the scene', () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(5);
    expect(new Set(SCENES.map((scene) => scene.id)).size).toBe(SCENES.length);
    for (const scene of SCENES) {
      expect(scene.name).not.toBe('');
      expect(scene.blurb).not.toBe('');
      expect(scene.groundY).toBeGreaterThan(100);
      expect(scene.groundY).toBeLessThan(220);
    }
  });

  it('morning, afternoon and night are defined', () => {
    expect(TIMES.map((time) => time.value)).toEqual(['morning', 'afternoon', 'night']);
  });
});

describe('scenery levels', () => {
  it('a scenery with levels has a name, description and changes for each one', () => {
    for (const scene of SCENES.filter((s) => (s.levels ?? 1) > 1)) {
      expect(scene.levelInfo?.length, scene.id).toBe(scene.levels);
      for (const info of scene.levelInfo ?? []) {
        expect(info.name, scene.id).not.toBe('');
        expect(info.blurb, scene.id).not.toBe('');
        expect(info.changes.length, scene.id).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('extras of each level stay inside the frame and have their feet below the horizon', () => {
    for (const scene of SCENES.filter((s) => (s.levels ?? 1) > 1)) {
      for (let level = 1; level <= (scene.levels ?? 1); level++) {
        const lists = [scene.extrasFor?.(level) ?? [], scene.journeyExtrasFor?.(level) ?? []];
        for (const extra of lists.flat()) {
          expect(extra.feetY, `${scene.id} nível ${level}`).toBeGreaterThan(100);
          expect(extra.feetY, `${scene.id} nível ${level}`).toBeLessThan(220);
        }
      }
    }
  });
});
