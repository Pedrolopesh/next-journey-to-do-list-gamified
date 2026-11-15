import '../pages/cenarios.css';

import { h } from '../dom';
import type { LabPage } from '../page';
import { loadSheets, MapPainter, rng, type Time } from '../pages/mapas-motor';
import { DIRT, GRASS, type Season, terrain } from '../pages/mapas-pecas';
import {
  type Building,
  BUILDING_EXAMPLES,
  BUILDING_SHEETS,
  type BuildingStyle,
  placeBuilding,
  randomBuilding,
} from './construcoes';
import { CUSTOM_COUNT } from './custom';
import { type Kit, KIT_SHEETS, KITS, placeKit } from './kits';
import {
  type BiomeId,
  BIOMES,
  COLS,
  type LayoutId,
  LAYOUTS,
  paintRecipe,
  randomRecipe,
  type Recipe,
  RECIPE_SHEETS,
  ROWS,
} from './receita';
import { ALL_RECIPES, REGIONS } from './regioes';

const SECTION = 'Cenários e mapas';
const SHEETS = [...new Set([...RECIPE_SHEETS, ...KIT_SHEETS, ...BUILDING_SHEETS])];
const sheets = (): Promise<Map<string, HTMLImageElement>> => loadSheets(SHEETS);

const TIME_LABEL: Record<Time, string> = { morning: 'manhã', afternoon: 'tarde', night: 'noite' };
const SEASON_LABEL: Record<Season, string> = {
  summer: 'verão',
  autumn: 'outono',
  winter: 'inverno',
};

function strip(images: Map<string, HTMLImageElement>, recipe: Recipe): HTMLCanvasElement {
  const canvas = h('canvas', 'map-canvas');
  canvas.setAttribute('aria-label', recipe.title);
  paintRecipe(new MapPainter(canvas, COLS, ROWS, images, recipe.seed), recipe);
  return canvas;
}

const recipeLine = (r: Recipe): string =>
  `${BIOMES[r.biome].name} · ${LAYOUTS[r.layout]} · ${SEASON_LABEL[r.season]} · ${TIME_LABEL[r.time]} · kits: ${r.kits.join(', ')}`;

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = h('button', 'map-zoom', label);
  b.type = 'button';
  b.onclick = onClick;
  return b;
}

function select<T extends string>(
  label: string,
  options: [T, string][],
  value: T,
): [HTMLElement, HTMLSelectElement] {
  const el = h('select', 'map-select');
  for (const [v, text] of options) {
    const o = h('option', '', text);
    o.value = v;
    el.append(o);
  }
  el.value = value;
  return [h('label', 'map-field', h('span', '', label), el), el];
}

/** Page 1: the journey, 10 regions of 6 maps, each region as one long walk. */
export const journeyPage: LabPage = {
  id: 'mapa-jornada',
  label: 'Jornada: 60 mapas',
  section: SECTION,
  async mount(host) {
    host.append(
      h('h1', '', 'Jornada: 60 mapas'),
      h(
        'p',
        'hint',
        `10 regiões de 6 mapas, todos feitos pela mesma receita (lugar, estação, traçado do caminho, hora, kits e semente). Cada mapa é uma faixa de ${COLS}×${ROWS} blocos: o caminho entra e sai na mesma altura, então os mapas de uma região se emendam. Arraste cada faixa para o lado para andar pela região.`,
      ),
    );
    const images = await sheets();
    for (const region of REGIONS) {
      const walk = h('div', 'map-walk');
      const list = h('ol', 'map-stages');
      const section = h('section', 'panel map-panel');
      section.append(h('h2', '', region.name), h('p', 'hint', region.story), walk, list);
      host.append(section);
      for (const recipe of region.maps) {
        try {
          walk.append(strip(images, recipe));
        } catch (error) {
          walk.append(h('p', 'hint', `Falhou ${recipe.title}: ${String(error)}`));
        }
        list.append(
          h(
            'li',
            '',
            h('strong', '', recipe.title),
            ` — ${recipe.about} `,
            h('span', 'map-recipe', recipeLine(recipe)),
          ),
        );
        await new Promise((resolve) => setTimeout(resolve));
      }
    }
    host.append(h('p', 'hint', `Total: ${ALL_RECIPES.length} mapas.`));
  },
};

/** Page 2: the generator, one recipe at a time. */
export const generatorPage: LabPage = {
  id: 'mapa-gerador',
  label: 'Gerador de mapas',
  section: SECTION,
  async mount(host) {
    host.append(
      h('h1', '', 'Gerador de mapas'),
      h(
        'p',
        'hint',
        'Escolha o lugar e o traçado, ou sorteie. A mesma receita com a mesma semente dá sempre o mesmo mapa; trocar só a semente muda a posição de árvores, kits e construções.',
      ),
    );
    const images = await sheets();
    let recipe = randomRecipe(1, rng(1), 'vila');
    const biomeOptions = (Object.keys(BIOMES) as BiomeId[]).map(
      (id) => [id, BIOMES[id].name] as [BiomeId, string],
    );
    const [biomeField, biomeEl] = select('Lugar', biomeOptions, recipe.biome);
    const [layoutField, layoutEl] = select(
      'Traçado',
      Object.entries(LAYOUTS) as [LayoutId, string][],
      recipe.layout,
    );
    const [seasonField, seasonEl] = select(
      'Estação',
      Object.entries(SEASON_LABEL) as [Season, string][],
      recipe.season,
    );
    const [timeField, timeEl] = select(
      'Hora',
      Object.entries(TIME_LABEL) as [Time, string][],
      recipe.time,
    );
    const view = h('div', 'map-walk');
    const info = h('pre', 'map-json');
    const note = h('p', 'hint');

    const render = (): void => {
      const biome = BIOMES[recipe.biome];
      // What the place does not accept goes back to its first valid option
      if (!biome.layouts.includes(recipe.layout)) recipe.layout = biome.layouts[0] as LayoutId;
      if (!biome.seasons.includes(recipe.season)) recipe.season = biome.seasons[0] as Season;
      recipe.kits = recipe.kits.filter((k) => biome.kits.includes(k));
      if (!recipe.kits.length) recipe.kits = biome.kits.slice(0, 3);
      biomeEl.value = recipe.biome;
      layoutEl.value = recipe.layout;
      seasonEl.value = recipe.season;
      timeEl.value = recipe.time;
      note.textContent = `${biome.name} aceita: ${biome.layouts.map((l) => LAYOUTS[l]).join(', ')} · estações: ${biome.seasons.map((s) => SEASON_LABEL[s]).join(', ')} · kits: ${biome.kits.join(', ')}.`;
      view.replaceChildren(strip(images, recipe));
      info.textContent = JSON.stringify(recipe, null, 2);
    };
    biomeEl.onchange = () => {
      recipe.biome = biomeEl.value as BiomeId;
      render();
    };
    layoutEl.onchange = () => {
      recipe.layout = layoutEl.value as LayoutId;
      render();
    };
    seasonEl.onchange = () => {
      recipe.season = seasonEl.value as Season;
      render();
    };
    timeEl.onchange = () => {
      recipe.time = timeEl.value as Time;
      render();
    };
    const controls = h(
      'div',
      'map-controls',
      biomeField,
      layoutField,
      seasonField,
      timeField,
      button('Nova semente', () => {
        recipe.seed += 1;
        render();
      }),
      button('Sortear tudo', () => {
        const seed = Math.floor(Math.random() * 100000);
        recipe = randomRecipe(seed, rng(seed));
        render();
      }),
      button('Sortear neste lugar', () => {
        const seed = Math.floor(Math.random() * 100000);
        recipe = randomRecipe(seed, rng(seed), recipe.biome);
        render();
      }),
    );
    const section = h('section', 'panel map-panel');
    section.append(controls, note, view, h('h3', 'map-sub', 'Receita deste mapa'), info);
    host.append(section);
    render();
  },
};

function buildingsCanvas(
  images: Map<string, HTMLImageElement>,
  list: Building[],
  time: Time,
  season: Season,
): HTMLCanvasElement {
  const canvas = h('canvas', 'map-canvas');
  const perRow = 4;
  const rowsOf = Math.ceil(list.length / perRow);
  const p = new MapPainter(canvas, 40, rowsOf * 9, images, 1);
  p.fill(terrain(season), GRASS, 0, 0, 40, rowsOf * 9);
  list.forEach((b, i) => {
    const row = Math.floor(i / perRow);
    p.fill(terrain(season), DIRT, 0, row * 9 + 8, 40, 1);
    placeBuilding(p, b, 5 + (i % perRow) * 10, row * 9 + 8, time);
  });
  p.finish(time);
  return canvas;
}

/** Page 3: buildings assembled from parts. */
export const buildingsPage: LabPage = {
  id: 'mapa-construcoes',
  label: 'Construções por partes',
  section: SECTION,
  async mount(host) {
    host.append(
      h('h1', '', 'Construções por partes'),
      h(
        'p',
        'hint',
        'Casas, prédios e torres montados a partir de uma descrição: largura, andares, parede (6 tijolos e 40 tábuas), telhado (duas águas, quatro águas ou plano, em 6 cores), porta (painel ou arco) e janelas. Paredes, portas e janelas vêm das folhas livres; o telhado é desenhado em código.',
      ),
    );
    const images = await sheets();
    const examples = h('section', 'panel map-panel');
    const names = h('ol', 'map-stages');
    for (const b of BUILDING_EXAMPLES) names.append(h('li', '', b.name ?? ''));
    examples.append(
      h('h2', '', '12 exemplos fixos'),
      h('div', 'map-walk', buildingsCanvas(images, BUILDING_EXAMPLES, 'afternoon', 'summer')),
      names,
    );
    host.append(examples);

    const night = h('section', 'panel map-panel');
    night.append(
      h('h2', '', 'Os mesmos à noite'),
      h('p', 'hint', 'As janelas acendem sozinhas; a casa abandonada fica apagada.'),
      h('div', 'map-walk', buildingsCanvas(images, BUILDING_EXAMPLES, 'night', 'summer')),
    );
    host.append(night);

    const styles: [BuildingStyle, string][] = [
      ['vila', 'Vila'],
      ['cidade', 'Cidade'],
      ['castelo', 'Castelo'],
      ['ruina', 'Ruína'],
      ['neve', 'Neve'],
    ];
    for (const [style, label] of styles) {
      const view = h('div', 'map-walk');
      const draw = (seed: number): void => {
        const random = rng(seed);
        const list = Array.from({ length: 8 }, () => randomBuilding(random, style));
        view.replaceChildren(
          buildingsCanvas(
            images,
            list,
            'afternoon',
            style === 'neve' ? 'winter' : style === 'ruina' ? 'autumn' : 'summer',
          ),
        );
      };
      let seed = 7;
      const section = h('section', 'panel map-panel');
      section.append(
        h('h2', '', `Sorteio: ${label}`),
        button('Sortear outras 8', () => draw(++seed)),
        view,
      );
      host.append(section);
      draw(seed);
    }
  },
};

function kitCanvas(images: Map<string, HTMLImageElement>, k: Kit, seed: number): HTMLCanvasElement {
  const canvas = h('canvas', 'map-canvas');
  const p = new MapPainter(canvas, 40, 6, images, seed);
  if (k.where === 'dentro') p.fill('rev-structure-floor-wood-floor-a', [[2, 0]], 0, 0, 40, 6);
  else p.fill(terrain('summer'), k.where === 'tema' ? DIRT : GRASS, 0, 0, 40, 6);
  for (let i = 0; i < 4; i++) placeKit(p, k, 5 + i * 10, k.where === 'dentro' ? 3 : 4.4);
  p.finish('afternoon');
  return canvas;
}

/** Page 4: the kits and their variations. */
export const kitsPage: LabPage = {
  id: 'mapa-kits',
  label: 'Kits de cenário',
  section: SECTION,
  async mount(host) {
    host.append(
      h('h1', '', 'Kits de cenário'),
      h(
        'p',
        'hint',
        `${KITS.length} kits. Cada kit é um grupo de peças que sempre anda junto: tem encaixes, e cada encaixe tem opções. Cada faixa mostra o mesmo kit colocado 4 vezes, cada vez com um sorteio diferente. ${CUSTOM_COUNT} peças são desenhadas em código (lápides, portal, barricadas, tochas, bancas), para o que as folhas livres não têm.`,
      ),
    );
    const images = await sheets();
    const groups: [Kit['where'], string][] = [
      ['fora', 'Kits de área externa'],
      ['tema', 'Kits temáticos'],
      ['dentro', 'Kits de interior'],
    ];
    for (const [where, title] of groups) {
      host.append(h('h2', 'map-group', title));
      for (const k of KITS.filter((x) => x.where === where)) {
        const view = h('div', 'map-walk');
        let seed = 3;
        view.append(kitCanvas(images, k, seed));
        const options = k.slots.reduce((n, slot) => n * slot.length, 1);
        const section = h('section', 'panel map-panel');
        section.append(
          h('h3', '', k.name),
          h('p', 'hint', `${k.about} ${k.slots.length} encaixes, ${options} combinações.`),
          button('Sortear', () => view.replaceChildren(kitCanvas(images, k, ++seed))),
          view,
        );
        host.append(section);
      }
    }
  },
};

/** Page 5: relief and free shapes (cliff, waterfall, lava, lakes and curved paths). */
export const reliefPage: LabPage = {
  id: 'mapa-relevo',
  label: 'Relevo e formas livres',
  section: SECTION,
  async mount(host) {
    host.append(
      h('h1', '', 'Relevo e formas livres'),
      h(
        'p',
        'hint',
        'Paredão com cachoeira, gruta, escada e cipós em três estações; lagos, rios e lava com margem irregular; caminho em curvas. As bordas são escolhidas sozinhas a partir de onde fica a água, a lava ou a grama, então a forma pode ser qualquer uma.',
      ),
    );
    const images = await sheets();
    const demos: [string, string, Recipe][] = [
      [
        'Paredão no verão',
        'A cachoeira, a gruta e a escada mudam de lugar a cada semente.',
        {
          ...randomRecipe(11, rng(11), 'montanha'),
          season: 'summer',
          time: 'afternoon',
          kits: ['acampamento', 'pedras'],
        },
      ],
      [
        'Paredão no outono',
        '',
        {
          ...randomRecipe(12, rng(12), 'montanha'),
          season: 'autumn',
          time: 'morning',
          kits: ['descanso', 'cristais'],
        },
      ],
      [
        'Paredão no inverno',
        'O lago ao pé da cachoeira congela.',
        {
          ...randomRecipe(13, rng(13), 'montanha'),
          season: 'winter',
          time: 'afternoon',
          kits: ['acampamento'],
        },
      ],
      [
        'Lago de margem irregular',
        '',
        {
          ...randomRecipe(14, rng(14), 'campo'),
          layout: 'margem',
          season: 'summer',
          time: 'afternoon',
        },
      ],
      [
        'Caminho em curvas',
        '',
        {
          ...randomRecipe(15, rng(15), 'floresta'),
          layout: 'curva',
          season: 'summer',
          time: 'afternoon',
        },
      ],
      [
        'Pântano',
        'Poças espalhadas dos dois lados do caminho.',
        { ...randomRecipe(16, rng(16), 'pantano'), layout: 'curva', time: 'afternoon' },
      ],
      [
        'Lago de lava',
        'A mesma técnica dos lagos, com a folha de lava.',
        {
          ...randomRecipe(17, rng(17), 'inferno'),
          layout: 'margem',
          time: 'night',
          kits: ['chamas', 'cristais'],
        },
      ],
      [
        'Rio de lava',
        '',
        {
          ...randomRecipe(18, rng(18), 'inferno'),
          layout: 'travessia',
          time: 'afternoon',
          kits: ['tochas', 'chamas'],
        },
      ],
    ];
    for (const [title, about, recipe] of demos) {
      const view = h('div', 'map-walk');
      let seed = recipe.seed;
      const draw = (): void => view.replaceChildren(strip(images, { ...recipe, seed }));
      const section = h('section', 'panel map-panel');
      section.append(
        h('h2', '', title),
        h('p', 'hint', about),
        button('Outra semente', () => {
          seed += 1;
          draw();
        }),
        view,
      );
      host.append(section);
      draw();
    }
  },
};

export const GENERATOR_PAGES: LabPage[] = [
  journeyPage,
  generatorPage,
  buildingsPage,
  kitsPage,
  reliefPage,
];
