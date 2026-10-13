import {
  type AnimationName,
  type BodyType,
  type Catalog,
  creditsFor,
  type Direction,
} from '../qg/compose';
import { createQgEngine, JOURNEY_STOPS, loadImage, type QgState } from '../qg/engine';
import { SCENES } from '../qg/scenes';
import { type TimeOfDay, TIMES } from '../qg/scenes/types';

const SKINS = ['light', 'amber', 'olive', 'taupe', 'bronze', 'brown', 'black'];
const HAIR_COLORS = [
  'black',
  'dark_brown',
  'chestnut',
  'blonde',
  'ginger',
  'redhead',
  'gray',
  'pink',
  'purple',
  'blue',
];
const CLOTH_COLORS = [
  'white',
  'black',
  'red',
  'blue',
  'navy',
  'green',
  'forest',
  'purple',
  'yellow',
  'orange',
  'tan',
  'gray',
];

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} não encontrado`);
  return el as T;
};

const catalog = (await (await fetch('/lab/catalog.json')).json()) as Catalog;
const scene = Object.fromEntries(
  await Promise.all(
    catalog.scenery.map(
      async ({ file }) =>
        [
          file.split('/').pop()?.replace('.png', '') ?? file,
          await loadImage(`/lab/${file}`),
        ] as const,
    ),
  ),
) as Record<string, HTMLImageElement>;

const state: QgState = {
  selection: {
    bodyType: 'male',
    skin: 'light',
    hair: 'hair-bob',
    hairColor: 'chestnut',
    torso: 'torso-tshirt',
    torsoColor: 'blue',
    legs: 'legs-pants',
    legsColor: 'navy',
    feet: 'feet-basic-shoes',
    feetColor: 'brown',
  },
  anim: 'idle',
  direction: 'down',
  sceneId: 'cabin',
  journey: false,
  stop: 0,
  time: 'afternoon',
};

let requests = 0;
const canvas = $<HTMLCanvasElement>('scene');
const engine = createQgEngine({
  canvas,
  catalog,
  tiles: scene,
  sheetSrc: (path, anim) => {
    requests += 1;
    return `/lab/assets/lpc/${path}${anim}.png`;
  },
  initial: state,
});
window.addEventListener('resize', engine.resize);

// ---- Controles ----
function buttons<T extends string>(
  host: HTMLElement,
  values: { value: T; label: string }[],
  current: () => T,
  onPick: (value: T) => void,
): void {
  const render = (): void => {
    host.replaceChildren(
      ...values.map(({ value, label }) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.setAttribute('aria-pressed', String(current() === value));
        button.onclick = () => {
          onPick(value);
          render();
        };
        return button;
      }),
    );
  };
  render();
}

function swatches(
  host: HTMLElement,
  material: 'body' | 'hair' | 'cloth',
  names: string[],
  current: () => string,
  onPick: (name: string) => void,
): void {
  const render = (): void => {
    host.replaceChildren(
      ...names.map((name) => {
        const button = document.createElement('button');
        const colors = catalog.palettes[material].colors[name];
        button.className = 'swatch';
        button.title = name;
        button.setAttribute('aria-label', name);
        button.setAttribute('aria-pressed', String(current() === name));
        button.style.background = colors?.[3] ?? '#888';
        button.onclick = () => {
          onPick(name);
          render();
        };
        return button;
      }),
    );
  };
  render();
}

function fillSelect(
  select: HTMLSelectElement,
  slot: string,
  current: string | null,
  onPick: (id: string | null) => void,
): void {
  select.replaceChildren(
    new Option('Nenhum', ''),
    ...catalog.parts
      .filter((part) => part.slot === slot)
      .map((part) => new Option(part.name, part.id)),
  );
  select.value = current ?? '';
  select.onchange = () => {
    onPick(select.value === '' ? null : select.value);
  };
}

const sel = state.selection;
buttons<BodyType>(
  $('c-body'),
  [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Feminino' },
  ],
  () => sel.bodyType,
  (v) => {
    sel.bodyType = v;
  },
);
swatches(
  $('c-skin'),
  'body',
  SKINS,
  () => sel.skin,
  (v) => {
    sel.skin = v;
  },
);
fillSelect($<HTMLSelectElement>('s-hair'), 'hair', sel.hair, (v) => {
  sel.hair = v;
});
swatches(
  $('c-hair'),
  'hair',
  HAIR_COLORS,
  () => sel.hairColor,
  (v) => {
    sel.hairColor = v;
  },
);
fillSelect($<HTMLSelectElement>('s-torso'), 'torso', sel.torso, (v) => {
  sel.torso = v;
});
swatches(
  $('c-torso'),
  'cloth',
  CLOTH_COLORS,
  () => sel.torsoColor,
  (v) => {
    sel.torsoColor = v;
  },
);
fillSelect($<HTMLSelectElement>('s-legs'), 'legs', sel.legs, (v) => {
  sel.legs = v;
});
swatches(
  $('c-legs'),
  'cloth',
  CLOTH_COLORS,
  () => sel.legsColor,
  (v) => {
    sel.legsColor = v;
  },
);
fillSelect($<HTMLSelectElement>('s-feet'), 'feet', sel.feet, (v) => {
  sel.feet = v;
});
swatches(
  $('c-feet'),
  'cloth',
  CLOTH_COLORS,
  () => sel.feetColor,
  (v) => {
    sel.feetColor = v;
  },
);
buttons<AnimationName>(
  $('c-anim'),
  [
    { value: 'idle', label: 'Parado' },
    { value: 'walk', label: 'Andando' },
    { value: 'run', label: 'Correndo' },
  ],
  () => state.anim,
  (v) => {
    state.anim = v;
  },
);
buttons<Direction>(
  $('c-dir'),
  [
    { value: 'down', label: 'Frente' },
    { value: 'left', label: 'Esquerda' },
    { value: 'right', label: 'Direita' },
    { value: 'up', label: 'Costas' },
  ],
  () => state.direction,
  (v) => {
    state.direction = v;
  },
);
buttons<'still' | 'journey'>(
  $('c-mode'),
  [
    { value: 'still', label: 'Parado no lugar' },
    { value: 'journey', label: 'Jornada (anda e o cenário rola)' },
  ],
  () => (state.journey ? 'journey' : 'still'),
  (v) => {
    state.journey = v === 'journey';
    if (state.journey && state.anim === 'idle') state.anim = 'walk';
  },
);
buttons<string>(
  $('c-stop'),
  Array.from({ length: JOURNEY_STOPS + 1 }, (_, n) => ({ value: String(n), label: String(n) })),
  () => String(state.stop),
  (v) => {
    state.stop = Number(v);
  },
);
buttons<string>(
  $('c-place'),
  SCENES.map((def) => ({ value: def.id, label: def.name })),
  () => state.sceneId,
  (v) => {
    state.sceneId = v;
    $('blurb').textContent = SCENES.find((def) => def.id === v)?.blurb ?? '';
  },
);
buttons<TimeOfDay>(
  $('c-time'),
  TIMES,
  () => state.time,
  (v) => {
    state.time = v;
  },
);
$('blurb').textContent = SCENES.find((def) => def.id === state.sceneId)?.blurb ?? '';

// ---- Créditos e peso ----
function renderCredits(): void {
  const ids = [
    'body',
    `head-${sel.bodyType}`,
    'face',
    sel.hair,
    sel.torso,
    sel.legs,
    sel.feet,
  ].filter((id): id is string => !!id);
  const credits = [
    ...creditsFor(catalog, ids),
    ...catalog.credits.filter((credit) => credit.file.startsWith('tileset/')),
  ];
  $('credits').replaceChildren(
    ...credits.map((credit) => {
      const row = document.createElement('tr');
      const art = document.createElement('td');
      art.textContent = credit.file.replace(/^.*\/(?=[^/]+\/[^/]+$)/, '');
      const authors = document.createElement('td');
      authors.textContent = credit.authors.join(', ');
      const license = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = credit.licenseUsed;
      license.append(badge);
      row.append(art, authors, license);
      return row;
    }),
  );
  const bytes = performance
    .getEntriesByType('resource')
    .filter((entry) => entry.name.includes('/lab/assets/'))
    .reduce((sum, entry) => sum + (entry as PerformanceResourceTiming).encodedBodySize, 0);
  $('stats').textContent =
    `${requests} folhas carregadas, ${(bytes / 1024).toFixed(0)} KB de arte até agora (limite do banner: 1,5 MB no total).`;
}
setInterval(renderCredits, 600);
renderCredits();

engine.start();
