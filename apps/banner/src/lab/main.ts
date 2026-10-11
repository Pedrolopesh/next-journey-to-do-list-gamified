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
import { SCENES } from './scenes';
import { applyTint, drawLights, vignette } from './scenes/lighting';
import { SCENE_H, SCENE_W, type SceneEnv, type TimeOfDay, TIMES } from './scenes/types';

const FPS: Record<AnimationName, number> = { idle: 2, walk: 9, run: 12 };
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
  sceneId: 'cabin',
  time: 'afternoon' as TimeOfDay,
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

/** Resolução interna: escolhe um fator inteiro para os sprites ficarem nítidos e o resto, suave. */
let scale = 1;
function fitCanvas(): void {
  const wanted = (canvas.clientWidth || SCENE_W) * (window.devicePixelRatio || 1);
  scale = Math.min(5, Math.max(2, Math.round(wanted / SCENE_W)));
  canvas.width = SCENE_W * scale;
  canvas.height = SCENE_H * scale;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

type ResolvedLayer = { spec: LayerSpec; sheet: HTMLCanvasElement };
const resolvedCache = new Map<string, ResolvedLayer[]>();

/** Camadas prontas (folhas recoloridas) de um personagem; aguarda o carregamento na primeira vez. */
async function resolveLayers(selection: Selection, anim: AnimationName): Promise<ResolvedLayer[]> {
  const specs = layersFor(catalog, selection);
  const signature = JSON.stringify([specs, anim]);
  const cached = resolvedCache.get(signature);
  if (cached) return cached;
  const next = await Promise.all(
    specs.map(async (spec) => ({ spec, sheet: await sheetFor(spec, anim) })),
  );
  resolvedCache.set(signature, next);
  return next;
}

function drawCharacter(
  layers: ResolvedLayer[],
  anim: AnimationName,
  direction: Direction,
  x: number,
  feetY: number,
  clock: number,
): void {
  const index = Math.floor(clock * FPS[anim]) % catalog.animations[anim];
  const { sy } = frameRect(direction, 0);
  // Sombra suave no chão, embaixo dos pés
  if (ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, feetY - 1, 13, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Nos quadros LPC os pés ficam perto da linha 60 de 64
  for (const { sheet } of layers) {
    ctx?.drawImage(
      sheet,
      index * FRAME,
      sy,
      FRAME,
      FRAME,
      Math.round(x - FRAME / 2),
      Math.round(feetY - 60),
      FRAME,
      FRAME,
    );
  }
}

let last = performance.now();
let time = 0;
let current: ResolvedLayer[] = [];

async function frame(now: number): Promise<void> {
  const dt = (now - last) / 1000;
  last = now;
  time += dt;
  const def = SCENES.find((candidate) => candidate.id === state.sceneId) ?? SCENES[0];
  if (!ctx || !def) return;
  const env: SceneEnv = { ctx, time: state.time, t: time, scroll: 0, tiles: scene };

  current = await resolveLayers(state.selection, state.anim);
  const extras = await Promise.all(
    (def.extras ?? []).map(async (extra) => ({
      extra,
      layers: await resolveLayers({ ...state.selection, ...extra.selection }, extra.anim),
    })),
  );

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false; // sprites e tiles continuam nítidos
  ctx.clearRect(0, 0, SCENE_W, SCENE_H);
  def.back(env);
  for (const { extra, layers } of extras)
    drawCharacter(layers, extra.anim, extra.direction, extra.x, extra.feetY, time);
  drawCharacter(current, state.anim, state.direction, SCENE_W / 2, def.groundY, time);
  def.front?.(env);
  applyTint(env, def.tint?.[state.time]);
  drawLights(env, def.lights?.(env) ?? []);
  vignette(env);
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

requestAnimationFrame((t) => void frame(t));
