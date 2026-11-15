import { describe, expect, it } from 'vitest';

import { rng } from '../pages/mapas-motor';
import { Grid } from './grade';
import { KITS } from './kits';
import { BIOMES, COLS, PATH_ROW, pathRows, randomRecipe } from './receita';
import { ALL_RECIPES, REGIONS } from './regioes';

describe('map generator', () => {
  it('has 10 regions of 6 maps with unique ids', () => {
    expect(REGIONS).toHaveLength(10);
    for (const region of REGIONS) expect(region.maps).toHaveLength(6);
    expect(new Set(ALL_RECIPES.map((r) => r.id)).size).toBe(60);
  });

  it('only uses layouts, seasons and kits that exist and that the place accepts', () => {
    const kits = new Set(KITS.map((k) => k.id));
    for (const recipe of ALL_RECIPES) {
      const biome = BIOMES[recipe.biome];
      expect(biome.layouts, recipe.id).toContain(recipe.layout);
      expect(biome.seasons, recipe.id).toContain(recipe.season);
      for (const id of recipe.kits) expect(kits.has(id), `${recipe.id}: ${id}`).toBe(true);
    }
  });

  it('starts and ends every path on the same row, moving one row at a time', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rows = pathRows('curva', rng(seed));
      expect(rows).toHaveLength(COLS);
      expect(rows[0]).toBe(PATH_ROW);
      expect(rows[COLS - 1]).toBe(PATH_ROW);
      for (let x = 1; x < COLS; x++) {
        expect(Math.abs((rows[x] as number) - (rows[x - 1] as number))).toBeLessThanOrEqual(1);
      }
    }
  });

  it('gives the same recipe for the same seed', () => {
    expect(randomRecipe(42, rng(42))).toEqual(randomRecipe(42, rng(42)));
    const recipe = randomRecipe(7, rng(7), 'neve');
    expect(BIOMES.neve.kits).toEqual(expect.arrayContaining(recipe.kits));
  });

  it('removes strips one tile wide, which the edge pieces cannot draw', () => {
    const grid = new Grid(6, 6).box(1, 1, 3, 3).box(4, 2, 2, 1);
    grid.tidy();
    expect(grid.get(4, 2)).toBe(false);
    expect(grid.get(2, 2)).toBe(true);
  });
});
