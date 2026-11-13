import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SCENERY_RULES, type SceneryItem } from './cenarios-regras';

const items = JSON.parse(
  readFileSync(resolve(process.cwd(), 'lab/inventario-cenarios.json'), 'utf8'),
) as SceneryItem[];

describe('scenery pages', () => {
  it('each piece appears on exactly one page', () => {
    const wrong = items.filter(
      (item) => Object.values(SCENERY_RULES).filter((rule) => rule(item)).length !== 1,
    );
    expect(wrong.map((item) => item.path)).toEqual([]);
  });

  it('only pieces with a free license have a file', () => {
    const free = /\b(CC0|OGA-?BY|CC-?BY)\b/i;
    for (const item of items) {
      expect(item.free).toBe(item.thumb !== null);
      if (item.free) expect(item.license).toMatch(free);
    }
  });

  it('every kept piece names its authors and a license', () => {
    const missing = items.filter(
      (item) => item.free && (item.authors.length === 0 || !item.license),
    );
    expect(missing.map((item) => item.path)).toEqual([]);
  });
});
