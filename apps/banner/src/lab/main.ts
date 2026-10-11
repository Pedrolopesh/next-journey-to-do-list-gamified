import {
  type AnimationName,
  type BodyType,
  buildRecolorMap,
  type Catalog,
  creditsFor,
  type Direction,
  FRAME,
  frameRect,
  layersFor,
  type LayerSpec,
  recolorPixels,
  type Selection,
} from './compose';

const SCENE_W = 390;
const SCENE_H = 180;
const WALL_BOTTOM = 88;
const FPS: Record<AnimationName, number> = { idle: 2, walk: 9, run: 12 };
/** Velocidade do cenário em px por segundo, quando o personagem anda ou corre. */
const SCROLL: Record<AnimationName, number> = { idle: 0, walk: 40, run: 110 };
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

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error(`falha ao carregar ${src}`));
    };
    image.src = src;
  });

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

const state = {
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
  } as Selection,
  anim: 'idle' as AnimationName,
  direction: 'down' as Direction,
  movingScene: true,
};

/** Folhas recoloridas em cache: uma por camada, animação e cor. */
const sheets = new Map<string, Promise<HTMLCanvasElement>>();
let requests = 0;

function sheetFor(spec: LayerSpec, anim: AnimationName): Promise<HTMLCanvasElement> {
  const key = `${spec.path}|${anim}|${spec.material ?? ''}|${spec.color ?? ''}`;
  let sheet = sheets.get(key);
  if (!sheet) {
    requests += 1;
    sheet = loadImage(`/lab/assets/lpc/${spec.path}${anim}.png`).then((image) => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('sem canvas 2d');
      ctx.drawImage(image, 0, 0);
      const palette = spec.material ? catalog.palettes[spec.material] : null;
      const source = palette?.colors[palette.base];
      const target = spec.color ? palette?.colors[spec.color] : undefined;
      if (source && target && spec.color !== palette?.base) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        recolorPixels(data.data, buildRecolorMap(source, target));
        ctx.putImageData(data, 0, 0);
      }
      return canvas;
    });
    sheets.set(key, sheet);
  }
  return sheet;
}

const canvas = $<HTMLCanvasElement>('scene');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('sem canvas 2d');
ctx.imageSmoothingEnabled = false;

let resolved: { spec: LayerSpec; sheet: HTMLCanvasElement }[] = [];
let resolvedFor = '';

async function resolveLayers(): Promise<void> {
  const specs = layersFor(catalog, state.selection);
  const signature = JSON.stringify([specs, state.anim]);
  if (signature === resolvedFor) return;
  const next = await Promise.all(
    specs.map(async (spec) => ({ spec, sheet: await sheetFor(spec, state.anim) })),
  );
  resolved = next;
  resolvedFor = signature;
}

function tile(
  image: HTMLImageElement | undefined,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
): void {
  if (image) ctx?.drawImage(image, sx, sy, sw, sh, dx, dy, sw, sh);
}

function drawScene(offset: number): void {
  if (!ctx) return;
  const inside = scene.inside;
  // Piso e parede de tábuas (tile de madeira 32x32 do pacote), com a parede mais escura
  const shift = ((offset % 32) + 32) % 32;
  for (let y = 0; y < SCENE_H; y += 32) {
    for (let x = -32; x < SCENE_W + 32; x += 32) tile(inside, 0, 128, 32, 32, x - shift, y);
  }
  ctx.fillStyle = 'rgba(20, 8, 0, 0.45)';
  ctx.fillRect(0, 0, SCENE_W, WALL_BOTTOM);
  ctx.fillStyle = '#2a1608';
  ctx.fillRect(0, WALL_BOTTOM - 6, SCENE_W, 6);
  ctx.fillStyle = '#1a0d04';
  ctx.fillRect(0, 0, SCENE_W, 6);

  // Mobília parada (a cabana é cenário de descanso): estante, fogão e cama
  const move = state.movingScene && state.anim !== 'idle' ? -offset % 400 : 0;
  tile(scene.cabinets, 32, 0, 64, 72, 250 + move, WALL_BOTTOM - 72);
  tile(scene.kitchen, 0, 0, 32, 124, 340 + move, WALL_BOTTOM + 12 - 124);
  tile(scene.country, 0, 0, 64, 96, 16 + move, 44);
}

let last = performance.now();
let time = 0;
let scroll = 0;

async function frame(now: number): Promise<void> {
  const dt = (now - last) / 1000;
  last = now;
  time += dt;
  scroll += SCROLL[state.anim] * dt * (state.movingScene ? 1 : 0);
  await resolveLayers();
  drawScene(scroll);
  const frames = catalog.animations[state.anim];
  const index = Math.floor(time * FPS[state.anim]) % frames;
  const x = Math.round((SCENE_W - FRAME) / 2);
  const y = 88;
  const { sy } = frameRect(state.direction, 0);
  for (const { sheet } of resolved) {
    ctx?.drawImage(sheet, index * FRAME, sy, FRAME, FRAME, x, y, FRAME, FRAME);
  }
  requestAnimationFrame((t) => void frame(t));
}

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
buttons<'on' | 'off'>(
  $('c-scene'),
  [
    { value: 'on', label: 'Move com o personagem' },
    { value: 'off', label: 'Parado' },
  ],
  () => (state.movingScene ? 'on' : 'off'),
  (v) => {
    state.movingScene = v === 'on';
  },
);

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

requestAnimationFrame((t) => void frame(t));
