import type { Rect } from './mapas-motor';
import {
  BARE,
  BARREL_A,
  BARREL_B,
  BLOB,
  BRICK_HOUSE_A,
  BRICK_HOUSE_B,
  BUSHES,
  CAMP,
  CAMP_OUT,
  CRATES,
  DIRT,
  fenceLine,
  FLOWER_BUSHES,
  FLOWER_SMALL,
  FOUNTAIN,
  GRASS,
  HAY,
  LAKE,
  LILIES,
  type MapSpec,
  MUSHROOMS,
  PANELED_HOUSE,
  PINES,
  plants,
  REEDS,
  ROCKS,
  ROUND,
  ROUND_DARK,
  SAND,
  SHEET,
  TALL_GRASS,
  terrain,
  trees,
  TUFTS,
  WATER,
  wild,
} from './mapas-pecas';

/** More ready-made maps, mixing the same free pieces in other shapes and seasons. */

type Box = { x: number; y: number; w: number; h: number };
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

const SNOW_CAMP: MapSpec = {
  id: 'acampamento-neve',
  title: 'Acampamento na neve',
  about:
    'Clareira pequena no meio de um bosque de pinheiros nevados: fogueira, caixas, barris, feno e pedras; árvores secas nos cantos.',
  cols: 20,
  rows: 14,
  seed: 8,
  sheets: [
    terrain('winter'),
    trees('winter'),
    plants('winter'),
    SHEET.camp,
    SHEET.crate,
    SHEET.barrel,
    SHEET.hay,
    SHEET.rocks,
  ],
  build(p) {
    const t = terrain('winter');
    p.fill(t, GRASS, -1, -1, 22, 16);
    p.fill(t, DIRT, 6, 4, 8, 6);
    p.block(t, BLOB, 5, 2, 10, 4);
    p.block(t, BLOB, 5, 9, 10, 4);
    const hole = box(6, 4, 8, 6);
    p.stand(SHEET.camp, CAMP, 10, 7.4);
    p.stand(SHEET.crate, CRATES[0] as Rect, 7.4, 6.4);
    p.stand(SHEET.crate, CRATES[1] as Rect, 8.2, 6.7);
    p.stand(SHEET.barrel, BARREL_A, 12.8, 6.2);
    p.stand(SHEET.barrel, BARREL_B, 13.6, 6.6);
    p.stand(SHEET.hay, HAY[0] as Rect, 12.2, 9.4);
    p.scatter(trees('winter'), PINES, box(0, 1.5, 20, 12.5), 24, [hole], 1.7);
    p.scatter(trees('winter'), [BARE], box(0, 2, 20, 11), 3, [hole], 5);
    p.scatter(plants('winter'), TUFTS, box(0, 2, 20, 11), 12, [hole], 1.2);
    p.scatter(SHEET.rocks, ROCKS.slice(2), box(0, 3, 20, 10), 6, [], 2);
    p.finish();
  },
};

const SQUARE: MapSpec = {
  id: 'praca-vila',
  title: 'Praça da vila',
  about:
    'Praça de terra em cruz com uma fonte no centro, três casas de estilos diferentes, cercas, barris, caixas, canteiros de flores e árvores nas bordas.',
  cols: 26,
  rows: 16,
  seed: 31,
  sheets: [
    terrain('summer'),
    trees('summer'),
    plants('summer'),
    SHEET.flowers,
    SHEET.houseA,
    SHEET.houseB,
    SHEET.paneled,
    SHEET.fountain,
    SHEET.fence,
    SHEET.barrel,
    SHEET.crate,
  ],
  build(p) {
    const t = terrain('summer');
    p.fill(t, GRASS, -1, -1, 28, 18);
    p.fill(t, DIRT, 9, 5, 8, 7); // plaza
    p.fill(t, DIRT, 0, 8, 26, 2); // east-west road
    p.fill(t, DIRT, 12, 3, 2, 13); // north-south road
    p.stand(SHEET.fountain, FOUNTAIN, 13, 8.4);
    p.stand(SHEET.houseA, BRICK_HOUSE_A, 5.5, 6.4);
    p.stand(SHEET.houseB, BRICK_HOUSE_B, 21, 6.2);
    p.stand(SHEET.paneled, PANELED_HOUSE, 20, 14.6);
    fenceLine(p, 1, 7.2, 6);
    fenceLine(p, 15.5, 7.2, 8);
    p.stand(SHEET.barrel, BARREL_A, 9.4, 11.4);
    p.stand(SHEET.barrel, BARREL_B, 10.2, 11.6);
    p.stand(SHEET.crate, CRATES[0] as Rect, 16.4, 11.6);
    p.stand(SHEET.crate, CRATES[1] as Rect, 17.2, 11.8);
    const taken = [
      box(9, 4, 8, 8),
      box(0, 7, 26, 3),
      box(12, 2, 2, 14),
      box(2, 1, 8, 6),
      box(16, 1, 9, 6),
      box(16, 10, 8, 6),
    ];
    p.scatter(trees('summer'), ROUND, box(0, 1, 26, 1.5), 7, taken, 2.5);
    p.scatter(trees('summer'), ROUND_DARK, box(0, 14.5, 12, 1.5), 4, taken, 2.5);
    p.scatter(plants('summer'), BUSHES, box(0, 10, 12, 6), 6, taken, 1.6);
    p.scatter(SHEET.flowers, FLOWER_BUSHES([0, 1, 3, 5]), box(1, 10, 10, 5), 6, taken, 1.4);
    p.scatter(SHEET.flowers, FLOWER_SMALL([1, 3, 5, 8]), box(0, 2, 26, 14), 14, taken, 1.1);
    p.scatter(plants('summer'), TUFTS, box(0, 1, 26, 15), 16, taken, 1);
    p.finish();
  },
};

const AUTUMN_LAKE: MapSpec = {
  id: 'lago-outono',
  title: 'Lago de outono',
  about:
    'Lago grande com margem de grama e um cais de tábuas, cercado por árvores alaranjadas, vitórias-régias, juncos, cogumelos e uma fogueira na margem.',
  cols: 24,
  rows: 16,
  seed: 14,
  sheets: [
    terrain('autumn'),
    trees('autumn'),
    plants('autumn'),
    SHEET.mushrooms,
    SHEET.rocks,
    SHEET.camp,
    SHEET.woodFloor,
    SHEET.flowers,
  ],
  build(p) {
    const t = terrain('autumn');
    p.fill(t, GRASS, -1, -1, 26, 18);
    p.fill(t, WATER, 5, 3, 15, 9);
    p.block(t, LAKE, 5, 3, 15, 9, false);
    p.tiled(SHEET.woodFloor, [64, 0, 32, 32], 3.5, 6.5, 6, 2); // pier from the bank
    const lake = box(5, 3, 15, 9);
    p.stand(plants('autumn'), LILIES[0] as Rect, 10, 6);
    p.stand(plants('autumn'), LILIES[1] as Rect, 14, 8.5);
    p.stand(plants('autumn'), LILIES[2] as Rect, 16.5, 5.5);
    p.stand(plants('autumn'), LILIES[0] as Rect, 12.5, 10);
    p.stand(plants('autumn'), REEDS[0] as Rect, 7, 11);
    p.stand(plants('autumn'), REEDS[1] as Rect, 18.5, 4.4);
    p.stand(SHEET.camp, CAMP, 3, 11.4);
    const pier = box(3, 6, 7, 3);
    p.scatter(trees('autumn'), ROUND, box(0, 1, 24, 2), 9, [lake], 2.2);
    p.scatter(trees('autumn'), ROUND_DARK, box(0, 13.5, 24, 2.5), 9, [lake], 2.2);
    p.scatter(trees('autumn'), ROUND, box(0, 3, 4, 10), 4, [pier], 2.5);
    p.scatter(trees('autumn'), ROUND_DARK, box(20.5, 3, 3.5, 10), 4, [lake], 2.5);
    p.scatter(plants('autumn'), BUSHES, box(0, 1, 24, 14), 9, [lake, pier], 1.5);
    p.scatter(plants('autumn'), TUFTS, box(0, 1, 24, 14), 14, [lake, pier], 1.1);
    p.scatter(SHEET.mushrooms, MUSHROOMS, box(0, 1, 24, 14), 8, [lake, pier], 1.3);
    p.scatter(SHEET.rocks, ROCKS.slice(2), box(0, 1, 24, 14), 5, [lake, pier], 2);
    p.finish();
  },
};

const GARDEN: MapSpec = {
  id: 'jardim-flores',
  title: 'Jardim de flores',
  about:
    'Jardim cercado com fonte no centro, caminho de terra em volta, canteiros de flores de várias cores, arbustos, um pedaço de horta e feno.',
  cols: 20,
  rows: 14,
  seed: 52,
  sheets: [
    terrain('summer'),
    trees('summer'),
    plants('summer'),
    wild('summer'),
    SHEET.flowers,
    SHEET.fountain,
    SHEET.fence,
    SHEET.tilled,
    SHEET.hay,
    SHEET.rocks,
  ],
  build(p) {
    const t = terrain('summer');
    p.fill(t, GRASS, -1, -1, 22, 16);
    p.fill(t, DIRT, 6, 3, 8, 8);
    p.block(t, BLOB, 5, 2, 10, 10);
    p.fill(t, DIRT, 7, 4, 6, 6);
    p.stand(SHEET.fountain, FOUNTAIN, 10, 7.6);
    p.block(SHEET.tilled, BLOB, 15, 8, 4, 4);
    for (let i = 0; i < 3; i++) p.stand(plants('summer'), TUFTS[i] as Rect, 16 + i * 0.9, 10.4);
    fenceLine(p, 1, 1.4, 18);
    fenceLine(p, 1, 13.4, 18);
    p.stand(SHEET.hay, HAY[0] as Rect, 2.4, 12.4);
    const centre = box(5, 2, 10, 10);
    const bed = box(14.5, 7.5, 5, 5);
    p.scatter(
      SHEET.flowers,
      FLOWER_BUSHES([0, 1, 2, 3, 4, 5]),
      box(0, 3, 20, 10),
      22,
      [centre, bed],
      1.3,
    );
    p.scatter(
      SHEET.flowers,
      FLOWER_SMALL([0, 1, 2, 3, 4, 5, 6, 7, 8]),
      box(0, 3, 20, 10),
      30,
      [centre, bed],
      0.9,
    );
    p.scatter(plants('summer'), BUSHES, box(0, 2.4, 20, 10), 8, [centre, bed], 1.6);
    p.scatter(trees('summer'), ROUND, box(0, 0.5, 20, 1), 5, [], 3);
    p.scatter(SHEET.rocks, ROCKS.slice(2), box(0, 3, 20, 10), 4, [centre, bed], 3);
    p.finish();
  },
};

const ISLAND: MapSpec = {
  id: 'ilha-areia',
  title: 'Ilha de areia',
  about:
    'Ilha com praia de areia e grama no meio, cercada de água; tem um cais, fogueira, juncos, vitórias-régias, pedras e arbustos.',
  cols: 22,
  rows: 14,
  seed: 63,
  sheets: [
    terrain('summer'),
    trees('summer'),
    plants('summer'),
    SHEET.flowers,
    SHEET.rocks,
    SHEET.camp,
    SHEET.woodFloor,
    SHEET.barrel,
  ],
  build(p) {
    const t = terrain('summer');
    p.fill(t, WATER, -1, -1, 24, 16);
    p.block(t, BLOB, 4, 2, 14, 10); // grass island with a rough border
    p.fill(t, SAND, 7, 6, 8, 4); // beach in front
    p.tiled(SHEET.woodFloor, [64, 0, 32, 32], 17, 6, 4, 2); // pier to the right
    p.stand(SHEET.camp, CAMP, 11, 8.2);
    p.stand(SHEET.barrel, BARREL_A, 8.2, 8.6);
    p.stand(SHEET.barrel, BARREL_B, 14, 8.8);
    const centre = box(7, 6, 8, 4);
    p.scatter(trees('summer'), ROUND, box(4.5, 2.5, 13, 3), 4, [], 3);
    p.scatter(trees('summer'), PINES, box(4.5, 2.5, 13, 3), 3, [], 3);
    p.scatter(plants('summer'), BUSHES, box(4.5, 3, 13, 7), 6, [centre], 1.8);
    p.scatter(plants('summer'), TUFTS, box(4.5, 3, 13, 7), 10, [centre], 1.1);
    p.scatter(SHEET.flowers, FLOWER_SMALL([0, 1, 2, 3]), box(5, 4, 12, 3), 6, [centre], 1.5);
    p.scatter(SHEET.rocks, ROCKS.slice(1), box(5, 5, 12, 6), 5, [centre], 2.2);
    p.scatter(
      plants('summer'),
      LILIES,
      box(0, 0.5, 22, 13),
      9,
      [box(3.5, 1.5, 15, 10.5), box(16.5, 5.5, 5, 3)],
      1.8,
    );
    p.scatter(
      plants('summer'),
      REEDS,
      box(0, 0.5, 22, 13),
      6,
      [box(3.5, 1.5, 15, 10.5), box(16.5, 5.5, 5, 3)],
      2.2,
    );
    p.finish();
  },
};

const MARKET: MapSpec = {
  id: 'mercado',
  title: 'Mercado',
  about:
    'Praça de terra batida com bancas feitas de caixas, barris, feno e carrinhos, uma casa de tijolos ao fundo, cercas e árvores dos lados.',
  cols: 24,
  rows: 16,
  seed: 71,
  sheets: [
    terrain('summer'),
    trees('summer'),
    plants('summer'),
    SHEET.houseA,
    SHEET.paneled,
    SHEET.fence,
    SHEET.barrel,
    SHEET.crate,
    SHEET.hay,
    SHEET.cart,
    SHEET.flowers,
    SHEET.trough,
  ],
  build(p) {
    const t = terrain('summer');
    p.fill(t, GRASS, -1, -1, 26, 18);
    p.fill(t, DIRT, 2, 5, 20, 10);
    p.block(t, BLOB, -1, -2, 26, 7);
    p.block(t, BLOB, -1, 14, 26, 4);
    p.stand(SHEET.houseA, BRICK_HOUSE_A, 7, 6);
    p.stand(SHEET.paneled, PANELED_HOUSE, 18.5, 6);
    fenceLine(p, 2, 5.6, 4);
    fenceLine(p, 12.5, 5.6, 4);
    // Four stalls in two rows
    const stalls: [number, number][] = [
      [5, 10],
      [11, 10],
      [17, 10],
      [8, 13.4],
      [15, 13.4],
    ];
    stalls.forEach(([x, y], i) => {
      p.stand(SHEET.crate, CRATES[i % 2] as Rect, x, y);
      p.stand(SHEET.crate, CRATES[(i + 1) % 2] as Rect, x + 0.8, y + 0.15);
      p.stand(SHEET.barrel, i % 2 ? BARREL_A : BARREL_B, x + 1.7, y + 0.1);
      p.stand(SHEET.hay, HAY[i % 2] as Rect, x - 1.5, y + 0.2);
    });
    p.stand(SHEET.cart, [1, 0, 30, 63], 13.2, 8.4);
    const yard = box(2, 5, 20, 10);
    p.scatter(trees('summer'), ROUND, box(0, 1, 24, 2), 7, [], 2.4);
    p.scatter(trees('summer'), ROUND_DARK, box(0, 15, 24, 1.3), 6, [], 2.4);
    p.scatter(trees('summer'), PINES, box(0, 3, 2, 12), 3, [], 2.5);
    p.scatter(trees('summer'), PINES, box(22, 3, 2, 12), 3, [], 2.5);
    p.scatter(plants('summer'), BUSHES, box(0, 1, 24, 14), 6, [yard], 1.6);
    p.scatter(SHEET.flowers, FLOWER_SMALL([1, 3, 5]), box(0, 1, 24, 14), 8, [yard], 1.3);
    p.finish();
  },
};

const CABIN: MapSpec = {
  id: 'cabana-floresta',
  title: 'Cabana na floresta',
  about:
    'Cabana de madeira escondida numa mata fechada de árvores escuras: trilha de terra, fogueira apagada, lenha, tufos de grama alta e muitos cogumelos.',
  cols: 22,
  rows: 15,
  seed: 88,
  sheets: [
    terrain('summer'),
    trees('summer'),
    plants('summer'),
    SHEET.paneled,
    SHEET.camp,
    SHEET.hay,
    SHEET.barrel,
    SHEET.mushrooms,
    SHEET.rocks,
    SHEET.flowers,
    SHEET.fence,
  ],
  build(p) {
    const t = terrain('summer');
    p.fill(t, GRASS, -1, -1, 24, 17);
    p.fill(t, DIRT, 9, 8, 3, 8); // trail to the cabin
    p.block(t, BLOB, 5, 5, 11, 5);
    p.fill(t, DIRT, 7, 7, 8, 3);
    p.stand(SHEET.paneled, PANELED_HOUSE, 11, 8);
    p.stand(SHEET.camp, CAMP_OUT, 6.8, 10.2);
    p.stand(SHEET.hay, HAY[1] as Rect, 15.4, 9);
    p.stand(SHEET.barrel, BARREL_A, 14.4, 9.8);
    fenceLine(p, 4, 11.6, 4);
    const clear = box(4.5, 4.5, 12, 7);
    const trail = box(9, 10, 3, 6);
    p.scatter(trees('summer'), ROUND_DARK, box(0, 1.5, 22, 13.5), 26, [clear, trail], 1.6);
    p.scatter(trees('summer'), PINES, box(0, 1.5, 22, 13.5), 10, [clear, trail], 2);
    p.scatter(plants('summer'), TALL_GRASS, box(0, 3, 22, 12), 14, [clear, trail], 1.2);
    p.scatter(plants('summer'), BUSHES, box(0, 3, 22, 12), 8, [clear, trail], 1.5);
    p.scatter(SHEET.mushrooms, MUSHROOMS, box(0, 3, 22, 12), 16, [trail], 1);
    p.scatter(SHEET.rocks, ROCKS.slice(2), box(0, 3, 22, 12), 6, [clear, trail], 2);
    p.finish();
  },
};

const ICE_LAKE: MapSpec = {
  id: 'lago-congelado',
  title: 'Lago congelado',
  about:
    'Lago de gelo bem largo no meio da neve, com um cais, cercas, uma fogueira na margem, pinheiros, árvores secas e pedras cobertas.',
  cols: 24,
  rows: 15,
  seed: 19,
  sheets: [
    terrain('winter'),
    terrain('winter-ice'),
    trees('winter'),
    plants('winter'),
    SHEET.woodFloor,
    SHEET.fence,
    SHEET.camp,
    SHEET.rocks,
    SHEET.barrel,
  ],
  build(p) {
    const t = terrain('winter');
    p.fill(t, GRASS, -1, -1, 26, 17);
    p.fill(terrain('winter-ice'), WATER, 4, 3, 16, 9);
    p.block(terrain('winter-ice'), LAKE, 4, 3, 16, 9, false);
    p.tiled(SHEET.woodFloor, [64, 0, 32, 32], 2.5, 7, 5, 2);
    p.stand(SHEET.camp, CAMP, 2.4, 11.6);
    p.stand(SHEET.barrel, BARREL_A, 21.8, 12);
    p.stand(SHEET.barrel, BARREL_B, 22.6, 12.2);
    fenceLine(p, 18, 13, 6);
    const lake = box(4, 3, 16, 9);
    const pier = box(2, 6.5, 6, 3);
    p.scatter(trees('winter'), PINES, box(0, 1, 24, 2), 12, [lake], 1.6);
    p.scatter(trees('winter'), PINES, box(0, 13.5, 24, 2), 10, [lake], 1.6);
    p.scatter(trees('winter'), [BARE], box(0, 2, 4, 12), 2, [pier], 4);
    p.scatter(trees('winter'), PINES, box(20.5, 2, 3.5, 12), 5, [lake], 1.7);
    p.scatter(plants('winter'), BUSHES, box(0, 1, 24, 14), 6, [lake, pier], 1.8);
    p.scatter(plants('winter'), TUFTS, box(0, 1, 24, 14), 10, [lake, pier], 1.2);
    p.scatter(SHEET.rocks, ROCKS.slice(2), box(0, 1, 24, 14), 6, [lake, pier], 2);
    p.finish();
  },
};

const VALLEY: MapSpec = {
  id: 'vale-rio-outono',
  title: 'Vale com rio de outono',
  about:
    'Rio que cruza o mapa de cima a baixo, com uma ponte de tábuas ligando as duas margens: uma casa de cada lado, cercas, feno, árvores alaranjadas e flores silvestres.',
  cols: 24,
  rows: 14,
  seed: 97,
  sheets: [
    terrain('autumn'),
    trees('autumn'),
    plants('autumn'),
    SHEET.flowers,
    SHEET.houseB,
    SHEET.paneled,
    SHEET.fence,
    SHEET.hay,
    SHEET.barrel,
    SHEET.woodFloor,
    SHEET.rocks,
  ],
  build(p) {
    const t = terrain('autumn');
    p.fill(t, GRASS, -1, -1, 26, 16);
    p.fill(t, WATER, 10, -2, 4, 18);
    p.block(t, LAKE, 10, -2, 4, 18, false);
    p.tiled(SHEET.woodFloor, [64, 0, 32, 32], 9, 7, 6, 2); // bridge
    p.stand(SHEET.fence, [104, 0, 13, 128], 10, 7.4);
    p.stand(SHEET.fence, [104, 0, 13, 128], 14, 7.4);
    p.fill(t, DIRT, 1, 8, 8, 1.6);
    p.stand(SHEET.houseB, BRICK_HOUSE_B, 5, 7.4);
    p.stand(SHEET.paneled, PANELED_HOUSE, 19, 7.4);
    p.stand(SHEET.hay, HAY[0] as Rect, 2, 11.6);
    p.stand(SHEET.barrel, BARREL_A, 21.8, 10);
    p.stand(SHEET.barrel, BARREL_B, 22.6, 10.2);
    fenceLine(p, 15.5, 8.3, 6);
    const river = box(9.5, 0, 5, 14);
    const houses = [box(2, 4, 6, 5), box(16, 4, 6, 5)];
    p.scatter(trees('autumn'), ROUND, box(0, 1, 24, 3), 9, [river], 2);
    p.scatter(trees('autumn'), ROUND_DARK, box(0, 12.5, 24, 1.8), 8, [river], 2);
    p.scatter(plants('autumn'), BUSHES, box(0, 1, 24, 13), 9, [river, ...houses], 1.5);
    p.scatter(plants('autumn'), TUFTS, box(0, 1, 24, 13), 12, [river, ...houses], 1.1);
    p.scatter(SHEET.flowers, FLOWER_BUSHES([5, 6, 7]), box(0, 9, 24, 5), 6, [river], 1.6);
    p.scatter(plants('autumn'), LILIES, box(10, 1, 4, 12), 4, [box(9.5, 6, 5, 4)], 2.2);
    p.scatter(plants('autumn'), REEDS, box(10, 1, 4, 12), 4, [box(9.5, 6, 5, 4)], 2.4);
    p.scatter(SHEET.rocks, ROCKS.slice(2), box(0, 1, 24, 13), 5, [river, ...houses], 2);
    p.finish();
  },
};

const SHOP: MapSpec = {
  id: 'loja-interior',
  title: 'Loja por dentro',
  about:
    'Interior de uma loja de aldeia: balcão da cozinha, estantes lado a lado, baús, caixas, barris, mesa de negócios e um tapete na entrada.',
  cols: 18,
  rows: 11,
  seed: 6,
  sheets: [
    SHEET.woodFloor,
    SHEET.inside,
    SHEET.shelf,
    SHEET.kitchen,
    SHEET.chest,
    SHEET.table,
    SHEET.crate,
    SHEET.barrel,
    SHEET.hay,
    SHEET.diamond,
    SHEET.fireplace,
  ],
  build(p) {
    p.background('#1b1630');
    p.fill(SHEET.woodFloor, [[2, 0]], 0, 3, 18, 8);
    for (let x = 0; x < 18; x++) {
      const col = x === 0 ? 0 : x === 17 ? 2 : 1;
      for (let y = 0; y < 3; y++) p.tile(SHEET.inside, [col, y], x, y);
    }
    p.tiled(SHEET.diamond, [96, 0, 32, 32], 7, 8, 4, 3);
    p.stand(SHEET.kitchen, [0, 0, 64, 128], 3.2, 4.1);
    for (const x of [6.2, 8.2, 10.2]) p.stand(SHEET.shelf, [109, 8, 35, 88], x, 4);
    p.stand(SHEET.fireplace, [0, 13, 95, 75], 14.4, 3.9);
    p.stand(SHEET.table, [6, 19, 82, 45], 8.8, 7.4);
    p.stand(SHEET.table, [98, 29, 30, 35], 6.6, 7.6);
    p.stand(SHEET.chest, [0, 0, 94, 64], 2.8, 9.8);
    p.stand(SHEET.chest, [0, 0, 94, 64], 15.4, 9.8);
    p.stand(SHEET.crate, CRATES[0] as Rect, 1.3, 6.4);
    p.stand(SHEET.crate, CRATES[1] as Rect, 2.1, 6.6);
    p.stand(SHEET.barrel, BARREL_A, 16.6, 6.6);
    p.stand(SHEET.barrel, BARREL_B, 17.2, 6.9);
    p.stand(SHEET.hay, HAY[0] as Rect, 12.8, 9.8);
    p.finish();
  },
};

export const EXTRA_MAPS: MapSpec[] = [
  SNOW_CAMP,
  SQUARE,
  AUTUMN_LAKE,
  GARDEN,
  ISLAND,
  MARKET,
  CABIN,
  ICE_LAKE,
  VALLEY,
  SHOP,
];
