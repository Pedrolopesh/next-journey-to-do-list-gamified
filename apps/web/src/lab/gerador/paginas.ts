import '../pages/cenarios.css';

import { choiceGroup, h, row } from '../dom';
import type { LabPage } from '../page';
import { loadSheets, MapPainter, rng, TILE, type Time } from '../pages/mapas-motor';
import { DIRT, GRASS, type Season, terrain } from '../pages/mapas-pecas';
import { airOf, animate, type Glow, motionOn, setMotion } from './animacao';
import {
  type Building,
  BUILDING_EXAMPLES,
  BUILDING_SHEETS,
  type BuildingStyle,
  placeBuilding,
  randomBuilding,
} from './construcoes';
import { CUSTOM_COUNT } from './custom';
import { type Kit, kit, KIT_SHEETS, KITS, placeKit } from './kits';
import {
  type BiomeId,
  BIOMES,
  COLS,
  type LayoutId,
  LAYOUTS,
  MAX_SCREENS,
  paintRecipe,
  randomRecipe,
  type Recipe,
  RECIPE_SHEETS,
  ROWS,
  SCREENS,
  screensOf,
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
const SCREEN_PX = COLS * TILE;

/** The whole map of a recipe: its screens painted one after the other on one canvas. */
function strip(images: Map<string, HTMLImageElement>, recipe: Recipe): HTMLCanvasElement {
  const parts = screensOf(recipe);
  const canvas = h('canvas', 'map-canvas');
  canvas.setAttribute('aria-label', recipe.title);
  // One painter for the whole map: what stands at the edge of a screen spills over the next
  const painter = new MapPainter(canvas, COLS, ROWS, images, recipe.seed, parts.length);
  parts.forEach((part, i) => {
    painter.screen(i, part.seed);
    paintRecipe(painter, part, false);
  });
  const biome = BIOMES[recipe.biome];
  painter.finish(recipe.time, biome.tint, biome.night);
  const marks = painter.marks;
  const glows: Glow[] = painter.lights.map((l) => ({
    x: l.x * TILE,
    y: l.y * TILE,
    radius: l.radius * TILE,
    color: l.color,
  }));
  animate(canvas, {
    marks,
    glows,
    air: airOf(recipe),
    night: recipe.time === 'night',
    screen: SCREEN_PX,
  });
  return canvas;
}

const recipeLine = (r: Recipe): string =>
  `${BIOMES[r.biome].name} · ${SEASON_LABEL[r.season]} · ${TIME_LABEL[r.time]} · começa em ${LAYOUTS[r.layout].toLowerCase()} · kits: ${r.kits.join(', ')}`;

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = h('button', 'map-zoom', label);
  b.type = 'button';
  b.onclick = onClick;
  return b;
}

/**
 * The whole map in one glance, under the strip. A tap on it takes the strip to that point.
 */
function overview(walk: HTMLElement): HTMLCanvasElement {
  const mini = h('canvas', 'map-mini');
  mini.height = 0;
  mini.onclick = (event) => {
    const box = mini.getBoundingClientRect();
    const at = (event.clientX - box.left) / box.width;
    walk.scrollTo({ left: at * walk.scrollWidth - walk.clientWidth / 2, behavior: 'smooth' });
  };
  return mini;
}

function drawOverview(mini: HTMLCanvasElement, canvas: HTMLCanvasElement | null): void {
  mini.width = canvas ? canvas.width / 4 : 0;
  mini.height = canvas ? canvas.height / 4 : 0;
  if (!canvas) return;
  const ctx = mini.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(canvas, 0, 0, mini.width, mini.height);
  // A mark at every seam between two screens
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (let x = SCREEN_PX / 4; x < mini.width; x += SCREEN_PX / 4) ctx.fillRect(x, 0, 1, 6);
}

/** Stops the walk that is running (only one map walks at a time). */
let stopWalk: (() => void) | null = null;

/**
 * Walks the map by itself and, at the end, goes back to its start without a jump: what the
 * player sees while the stage is not cleared. A copy of the first screens goes after the map
 * so the turn is seamless.
 */
function startWalk(walk: HTMLElement, onStop: () => void): void {
  stopWalk?.();
  const canvas = walk.querySelector('canvas');
  if (!canvas) return;
  const tail = h('canvas', 'map-canvas');
  tail.width = 2 * SCREEN_PX;
  tail.height = canvas.height;
  const ctx = tail.getContext('2d');
  for (let x = 0; x < tail.width; x += canvas.width) ctx?.drawImage(canvas, x, 0);
  walk.append(tail);
  const share = canvas.width / (canvas.width + tail.width);
  let position = walk.scrollLeft;
  let last = performance.now();
  let frame = 0;
  const step = (now: number): void => {
    const lap = walk.scrollWidth * share;
    position += Math.min(64, now - last) * 0.14;
    last = now;
    if (position >= lap) position -= lap;
    walk.scrollLeft = position;
    frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  stopWalk = () => {
    cancelAnimationFrame(frame);
    tail.remove();
    stopWalk = null;
    onStop();
  };
}

/** Turns the motion of every map of the page on and off. */
function motionButton(): HTMLButtonElement {
  const label = (): string => `Animação: ${motionOn() ? 'ligada' : 'desligada'}`;
  const b = button(label(), () => {
    setMotion(!motionOn());
    b.textContent = label();
    b.setAttribute('aria-pressed', String(motionOn()));
  });
  b.setAttribute('aria-pressed', String(motionOn()));
  return b;
}

function walkButton(walk: HTMLElement): HTMLButtonElement {
  const b = button('Andar em loop', () => {
    if (b.getAttribute('aria-pressed') === 'true') return stopWalk?.();
    b.setAttribute('aria-pressed', 'true');
    b.textContent = 'Parar';
    startWalk(walk, () => {
      b.setAttribute('aria-pressed', 'false');
      b.textContent = 'Andar em loop';
    });
  });
  b.setAttribute('aria-pressed', 'false');
  return b;
}

/** Page 1: the journey, 60 maps one by one, each several screens long. */
export const journeyPage: LabPage = {
  id: 'mapa-jornada',
  label: 'Jornada: 60 mapas',
  section: SECTION,
  async mount(host) {
    const total = ALL_RECIPES.length;
    host.append(
      h('h1', '', `Jornada: ${total} mapas`),
      h(
        'p',
        'hint',
        `10 regiões de 6 mapas, um por um. Cada mapa tem de 4 a 6 telas de ${COLS}×${ROWS} blocos: o mesmo lugar, com o caminho, as construções e os kits em outra ordem a cada tela. O caminho entra e sai na mesma altura em todas, então o fim do mapa emenda no próprio começo e no começo do mapa seguinte. Enquanto a fase não é concluída, o personagem anda em loop dentro do mesmo mapa; ao concluir, atravessa para o próximo. Arraste o mapa para o lado, toque na miniatura para ir a um ponto ou use "Andar em loop".`,
      ),
    );
    host.append(h('div', 'map-controls', motionButton()));
    const images = await sheets();
    const pending = new Map<Element, Recipe>();
    const minis = new Map<Element, HTMLCanvasElement>();
    const watcher = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const walk = entry.target as HTMLElement;
          const recipe = pending.get(walk);
          if (!recipe) continue;
          if (!entry.isIntersecting) {
            // Far from the screen: the canvas is released, a long map is heavy to keep
            if (walk.childElementCount > 1) stopWalk?.();
            walk.replaceChildren();
            drawOverview(minis.get(walk) as HTMLCanvasElement, null);
            continue;
          }
          if (walk.firstChild) continue;
          try {
            const canvas = strip(images, recipe);
            walk.append(canvas);
            drawOverview(minis.get(walk) as HTMLCanvasElement, canvas);
          } catch (error) {
            walk.append(h('p', 'hint', `Falhou ${recipe.title}: ${String(error)}`));
          }
        }
      },
      { rootMargin: '500px 0px' },
    );
    let number = 0;
    for (const region of REGIONS) {
      const section = h('section', 'panel map-panel');
      section.append(h('h2', '', region.name), h('p', 'hint', region.story));
      host.append(section);
      for (const recipe of region.maps) {
        number++;
        const next = ALL_RECIPES[number];
        const screens = recipe.screens ?? SCREENS;
        const walk = h('div', 'map-walk map-lazy');
        const mini = overview(walk);
        const stage = h('article', 'map-stage');
        stage.id = `mapa-${number}`;
        const target = number + 1;
        const links = h(
          'p',
          'map-next',
          'Sem concluir a fase: volta ao começo deste mapa. Concluindo: ',
        );
        if (next) {
          const link = h('a', '', `entra no mapa ${target}, ${next.title}`);
          link.href = `#mapa-${target}`;
          link.onclick = (event) => {
            event.preventDefault();
            document.getElementById(`mapa-${target}`)?.scrollIntoView({ behavior: 'smooth' });
          };
          links.append(link, '.');
        } else links.append('fim da jornada.');
        stage.append(
          h('h3', '', `Mapa ${number} de ${total} · ${recipe.title}`),
          h('p', 'hint', recipe.about),
          h(
            'p',
            'map-recipe',
            `${screens} telas (${screens * COLS} blocos) · ${recipeLine(recipe)}`,
          ),
          h('div', 'map-controls', walkButton(walk)),
          walk,
          mini,
          links,
        );
        section.append(stage);
        minis.set(walk, mini);
        pending.set(walk, recipe);
        watcher.observe(walk);
      }
    }
  },
};

const DENSITIES: [string, string][] = [
  ['0.4', 'Aberto'],
  ['0.7', 'Leve'],
  ['1', 'Médio'],
  ['1.4', 'Cheio'],
];

/** Page 2: the generator, one recipe at a time, redrawn at every choice. */
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
        'Toque em qualquer opção e o mapa é refeito na hora. A mesma receita com a mesma semente dá sempre o mesmo mapa; trocar só a semente muda a posição de árvores, kits e construções. Cada lugar só mostra os traçados, as estações e os kits que aceita.',
      ),
    );
    const images = await sheets();
    let recipe: Recipe = { ...randomRecipe(1, rng(1), 'vila'), screens: SCREENS };
    const view = h('div', 'map-walk');
    const mini = overview(view);
    const fixed = h('div', 'map-rows');
    const perPlace = h('div', 'map-rows');
    const info = h('pre', 'map-json');
    const status = h('p', 'map-recipe');
    const seedEl = h('input', 'map-select');
    seedEl.type = 'number';
    seedEl.inputMode = 'numeric';

    const paint = (): void => {
      stopWalk?.();
      const at = view.scrollLeft;
      recipe.title = `${BIOMES[recipe.biome].name} #${recipe.seed}`;
      const canvas = strip(images, recipe);
      view.replaceChildren(canvas);
      view.scrollLeft = at;
      drawOverview(mini, canvas);
      const screens = recipe.screens ?? SCREENS;
      status.textContent = `${recipe.title} · ${screens} ${screens === 1 ? 'tela' : 'telas'} (${screens * COLS} blocos) · ${recipeLine(recipe)}`;
      seedEl.value = String(recipe.seed);
      info.textContent = JSON.stringify(recipe, null, 2);
    };
    const kitChips = (): HTMLElement => {
      const chips = h('span', 'chips');
      for (const id of BIOMES[recipe.biome].kits) {
        const chip = h('button', 'chip', kit(id).name);
        chip.type = 'button';
        chip.setAttribute('aria-pressed', String(recipe.kits.includes(id)));
        chip.onclick = () => {
          recipe.kits = recipe.kits.includes(id)
            ? recipe.kits.filter((k) => k !== id)
            : [...recipe.kits, id];
          chip.setAttribute('aria-pressed', String(recipe.kits.includes(id)));
          paint();
        };
        chips.append(chip);
      }
      return chips;
    };
    /** Rows that depend on the place: only what it accepts is offered. */
    const placeRows = (): void => {
      const biome = BIOMES[recipe.biome];
      if (!biome.layouts.includes(recipe.layout)) recipe.layout = biome.layouts[0] as LayoutId;
      if (!biome.seasons.includes(recipe.season)) recipe.season = biome.seasons[0] as Season;
      recipe.kits = recipe.kits.filter((k) => biome.kits.includes(k));
      if (!recipe.kits.length) recipe.kits = biome.kits.slice(0, 3);
      perPlace.replaceChildren(
        row(
          'Primeira tela',
          choiceGroup(
            biome.layouts.map((value) => ({ value, label: LAYOUTS[value] })),
            () => recipe.layout,
            (value) => {
              recipe.layout = value;
              paint();
            },
          ),
        ),
        row(
          'Estação',
          choiceGroup(
            biome.seasons.map((value) => ({ value, label: SEASON_LABEL[value] })),
            () => recipe.season,
            (value) => {
              recipe.season = value;
              paint();
            },
          ),
        ),
        row('Kits (vários)', kitChips()),
      );
    };
    const fixedRows = (): void => {
      fixed.replaceChildren(
        row(
          'Lugar',
          choiceGroup(
            (Object.keys(BIOMES) as BiomeId[]).map((value) => ({
              value,
              label: BIOMES[value].name,
            })),
            () => recipe.biome,
            (value) => {
              recipe.biome = value;
              placeRows();
              paint();
            },
          ),
        ),
        row(
          'Hora',
          choiceGroup(
            (Object.keys(TIME_LABEL) as Time[]).map((value) => ({
              value,
              label: TIME_LABEL[value],
            })),
            () => recipe.time,
            (value) => {
              recipe.time = value;
              paint();
            },
          ),
        ),
        row(
          'Telas',
          choiceGroup(
            Array.from({ length: MAX_SCREENS }, (_, i) => ({
              value: String(i + 1),
              label: String(i + 1),
            })),
            () => String(recipe.screens ?? SCREENS),
            (value) => {
              recipe.screens = Number(value);
              paint();
            },
          ),
        ),
        row(
          'Vegetação',
          choiceGroup(
            DENSITIES.map(([value, label]) => ({ value, label })),
            () => String(recipe.density),
            (value) => {
              recipe.density = Number(value);
              paint();
            },
          ),
        ),
      );
    };
    const all = (): void => {
      fixedRows();
      placeRows();
      paint();
    };
    const reseed = (seed: number): void => {
      recipe.seed = Math.max(0, Math.round(seed) || 0);
      paint();
    };
    seedEl.onchange = () => reseed(Number(seedEl.value));
    const draw = (biome?: BiomeId): void => {
      const seed = Math.floor(Math.random() * 100000);
      recipe = { ...randomRecipe(seed, rng(seed), biome), screens: recipe.screens ?? SCREENS };
      all();
    };
    const live = h('div', 'map-live', view, mini, status);
    const seedRow = row(
      'Semente',
      h(
        'span',
        'chips',
        button('−', () => reseed(recipe.seed - 1)),
        seedEl,
        button('+', () => reseed(recipe.seed + 1)),
      ),
    );
    const actions = h(
      'div',
      'map-controls',
      walkButton(view),
      motionButton(),
      button('Sortear tudo', () => draw()),
      button('Sortear neste lugar', () => draw(recipe.biome)),
    );
    const section = h('section', 'panel map-panel');
    section.append(
      live,
      actions,
      fixed,
      perPlace,
      seedRow,
      h('h3', 'map-sub', 'Receita deste mapa'),
      info,
    );
    host.append(section);
    all();
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
      const draw = (): void => view.replaceChildren(strip(images, { ...recipe, seed, screens: 1 }));
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
