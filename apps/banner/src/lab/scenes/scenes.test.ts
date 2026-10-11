import { describe, expect, it } from 'vitest';

import { SCENES } from './index';
import { TIMES } from './types';

describe('cenários do QG', () => {
  it('há pelo menos 5 opções, com ids únicos e linha dos pés dentro da cena', () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(5);
    expect(new Set(SCENES.map((scene) => scene.id)).size).toBe(SCENES.length);
    for (const scene of SCENES) {
      expect(scene.name).not.toBe('');
      expect(scene.blurb).not.toBe('');
      expect(scene.groundY).toBeGreaterThan(100);
      expect(scene.groundY).toBeLessThan(220);
    }
  });

  it('manhã, tarde e noite estão definidas', () => {
    expect(TIMES.map((time) => time.value)).toEqual(['morning', 'afternoon', 'night']);
  });
});
