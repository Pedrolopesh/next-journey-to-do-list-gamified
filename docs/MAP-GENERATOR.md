# Map generator (lab)

How the lab builds top-view maps from a recipe, what can vary and what cannot. It lives in
`apps/web/src/lab/gerador` and is shown in the lab under the menu "Cenários e mapas". Nothing here
is in the app yet: the lab is where the format is validated first.

## Two families of scenery

| Family    | Where                      | View                           | Art                               |
| --------- | -------------------------- | ------------------------------ | --------------------------------- |
| Side view | `apps/web/src/qg/scenes`   | From the side, with parallax   | Drawn in code (see `SCENARIOS.md`) |
| Top view  | `apps/web/src/lab/gerador` | From above, character in profile | Free LPC sheets plus code props  |

The two do not mix inside one map, because the perspective differs. They share the idea of the
recipe and the hours of the day.

## The map

Every map is a strip of 40 x 12 tiles of 32 px. The path is two rows tall and enters and leaves on
row 7 in every map, so any two maps join end to end and a region is one long walk.

## The recipe

```ts
type Recipe = {
  id: string;
  title: string;
  about: string;
  biome: BiomeId; // the place
  season: 'summer' | 'autumn' | 'winter';
  layout: LayoutId; // shape of the path
  time: 'morning' | 'afternoon' | 'night';
  density: number; // 0.4 (open) to 1.4 (packed)
  seed: number;
  kits: string[];
};
```

The same recipe always paints the same map. Changing only the seed moves trees, kits, buildings,
the river, the lake edge and the waterfall.

| Layer    | Options                                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Place    | 16: village, forest, field, snow, swamp, mountain, beach, city, castle, graveyard, shooting range, apocalypse, hell, dungeon, house interior, castle hall |
| Layout   | 8: straight, curves, crossing with a bridge, clearing or square, lake shore, street with buildings, cliff with waterfall, corridor (indoor)              |
| Season   | 3, limited by the place (snow is always winter, hell has no season)                                                                                      |
| Hour     | 3: morning (warm veil), afternoon, night (dark veil plus lights)                                                                                         |
| Kits     | 25, each place has its own pool                                                                                                                          |
| Density  | Scales the number of trees and plants                                                                                                                    |
| Seed     | Any integer                                                                                                                                              |

Each place declares which layouts, seasons and kits it accepts (`BIOMES` in `receita.ts`). The
generator page of the lab and the test `gerador.test.ts` enforce it.

## Building blocks

- **Free shapes (`autotile` in `mapas-motor.ts`)**. A terrain is a 3x3 block (corners, edges,
  center) plus four inner corners. Given a grid that says where the terrain goes, the painter picks
  each tile. Grass, lakes, ice and lava use it, so paths curve and lake edges are irregular.
  `Grid.tidy()` removes strips one tile wide, which those pieces cannot draw.
- **Relief (`relevo.ts`)**. A cliff terrace across the top with waterfall, cave, ladder and vines.
  The cliff sheets only have corner tiles; the straight edge is made of two half tiles.
- **Buildings (`construcoes.ts`)**. One description (width, floors, wall, roof, door, windows) gives
  one building. Walls, doors and windows come from the sheets; the roof is drawn in code. Five
  styles for the generator: village, city, castle, ruin and snow. Windows light up at night.
- **Kits (`kits.ts`)**. A kit is a list of slots and each slot has options; placing a kit picks one
  option per slot. No piece is ever dropped alone on the map.
- **Code props (`custom.ts`)**. What the free sheets do not have (tombstones, portal, barricades,
  torches, market stalls, wrecked car, throne), drawn in flat colors and whole pixels.
- **Light (`finish` in `mapas-motor.ts`)**. Fires, lamps, torches, crystals, lava and lit windows
  register a light that shows at night. A place may have its own veil (fog, heat).

## The first journey

`regioes.ts` holds 60 recipes: 10 regions of 6 maps. Six regions are natural (home village, forest,
rivers and lakes, autumn, snow, mountain) and four are not (online game hub city, dungeon,
apocalypse with a shooting range, hell). Each region has a line of story that ties the place to the
habit of doing tasks.

## What varies well and what does not

Varies well: the place, the season, the path, the hour, the seed, the kits and their options, the
buildings, the position of river, lake, waterfall, cave and ladder.

Limits today:

- The cliff is a straight terrace across the top; it has no plateaus with side walls yet.
- Lakes on sand have no inner corners in the sheet, so the beach only gets a straight sea.
- Indoor maps are a corridor with a wall on top; there are no rooms with side walls or doors.
- Roofs are drawn in code in three shapes; the roof sheets are not used.
- The character does not walk on these maps in the lab yet; the path is only painted.
- There is no art for desert, modern city or space. Those need other free packs (checking the
  license, as in `apps/web/lab/CREDITS-CENARIOS.md`) or props drawn in code.

## Adding things

- A map: one row in a region of `regioes.ts`.
- A kit: one entry in `KITS`; add its id to the pool of the places that may use it.
- A code prop: one function in `custom.ts`, added to `CUSTOM`.
- A place: one entry in `BIOMES`, with its ground, path, trees, kits and accepted layouts.
- A piece from a sheet: find its rectangle and add it to `apps/web/src/lab/pages/mapas-pecas.ts`.

Every sheet used must stay listed, with author and license, in
`apps/web/lab/CREDITS-CENARIOS.md`.
