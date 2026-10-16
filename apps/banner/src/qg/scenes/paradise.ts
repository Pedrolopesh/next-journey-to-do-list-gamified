import {
  byTime as by,
  gradientRect,
  portal,
  rect,
  rng,
  scrolled,
  sky,
  sprite,
  tileArea,
} from './draw';
import {
  FOREST_GROUND,
  FOREST_LEVEL_COUNT,
  FOREST_LEVELS,
  forestExtras,
  forestJourneyExtras,
  forestLevelLayers,
  forestSky,
} from './paradise-levels';
import type { Light, SceneDef, SceneEnv } from './types';
import { SCENE_H, SCENE_W } from './types';

const HORIZON = 104;
const OUT = '#16301c';

function rainbow(env: SceneEnv): void {
  if (env.time === 'night') return;
  const { ctx } = env;
  const colors = ['#ff5a5a', '#ffa14a', '#ffe14a', '#6bdc6b', '#4ab6ff', '#8a6bff'];
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, SCENE_W, HORIZON + 14);
  ctx.clip();
  ctx.globalAlpha = env.time === 'morning' ? 0.32 : 0.4;
  colors.forEach((color, i) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(120, 168, 138 - i * 3, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  });
  ctx.restore();
}

function mountains(env: SceneEnv): void {
  const { ctx } = env;
  const body = by(env.time, '#9aa8d6', '#8fb0d8', '#2d4373');
  const snow = by(env.time, '#fff0f0', '#ffffff', '#aab8e0');
  const peaks: [number, number][] = [
    [40, 46],
    [118, 60],
    [216, 40],
    [300, 56],
    [372, 44],
  ];
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-10, HORIZON + 6);
  for (const [x, h] of peaks) {
    ctx.lineTo(x - 52, HORIZON + 6);
    ctx.lineTo(x, HORIZON - h);
    ctx.lineTo(x + 52, HORIZON + 6);
  }
  ctx.lineTo(SCENE_W + 10, HORIZON + 6);
  ctx.fill();
  // neve no topo e sombra do lado direito
  for (const [x, h] of peaks) {
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.moveTo(x, HORIZON - h);
    ctx.lineTo(x - 12, HORIZON - h + 14);
    ctx.lineTo(x - 5, HORIZON - h + 11);
    ctx.lineTo(x, HORIZON - h + 16);
    ctx.lineTo(x + 5, HORIZON - h + 11);
    ctx.lineTo(x + 12, HORIZON - h + 14);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,30,70,0.18)';
    ctx.beginPath();
    ctx.moveTo(x, HORIZON - h);
    ctx.lineTo(x + 52, HORIZON + 6);
    ctx.lineTo(x + 8, HORIZON + 6);
    ctx.fill();
  }
}

function hills(env: SceneEnv, farShift = 0, nearShift = 0): void {
  const { ctx } = env;
  const layers: [number, number, number, string, number][] = [
    [HORIZON - 4, 8, 0.6, by(env.time, '#7dcf8a', '#6fd07f', '#1c4a4a'), farShift],
    [HORIZON + 8, 7, 2.4, by(env.time, '#5fbf72', '#52c26a', '#16403f'), nearShift],
  ];
  for (const [base, amp, phase, color, shift] of layers) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 150);
    for (let x = 0; x <= SCENE_W; x += 4)
      ctx.lineTo(
        x,
        base + Math.sin((x + shift) / 31 + phase) * amp + Math.sin((x + shift) / 11) * 1.5,
      );
    ctx.lineTo(SCENE_W, 150);
    ctx.fill();
  }
}

function cabin(env: SceneEnv, cx: number, base: number): void {
  const { ctx } = env;
  const night = env.time === 'night';
  const wood = by(env.time, '#a8743c', '#b27a40', '#8a5c30');
  const woodDark = '#6b4424';
  const woodLight = '#c99356';
  const w = 50;
  const h = 22;
  const x = cx - w / 2;
  const top = base - h;
  // chaminé de pedra (atrás do telhado)
  rect(env, cx + 12, top - 20, 9, 24, OUT);
  rect(env, cx + 13, top - 19, 7, 22, '#8d8f98');
  rect(env, cx + 13, top - 19, 2, 22, '#b4b6bf');
  rect(env, cx + 11, top - 22, 11, 4, OUT);
  rect(env, cx + 12, top - 21, 9, 2, '#6b6e78');
  // paredes de toras
  rect(env, x - 1, top - 1, w + 2, h + 2, OUT);
  for (let i = 0; i < h; i += 4) {
    rect(env, x, top + i, w, 4, wood);
    rect(env, x, top + i, w, 1, woodLight);
    rect(env, x, top + i + 3, w, 1, woodDark);
    rect(env, x, top + i, 2, 4, woodDark);
    rect(env, x + w - 2, top + i, 2, 4, woodDark);
  }
  // porta
  rect(env, x + 8, base - 14, 10, 14, OUT);
  rect(env, x + 9, base - 13, 8, 13, '#5a3412');
  rect(env, x + 9, base - 13, 1, 13, '#7a4a22');
  rect(env, x + 15, base - 7, 1, 2, '#ffd35a');
  // janela com luz
  rect(env, x + 28, top + 5, 13, 11, OUT);
  rect(env, x + 29, top + 6, 11, 9, night ? '#ffd980' : '#bfe6f0');
  rect(env, x + 34, top + 6, 1, 9, OUT);
  rect(env, x + 29, top + 10, 11, 1, OUT);
  rect(env, x + 27, top + 15, 15, 2, woodDark);
  // telhado
  ctx.fillStyle = OUT;
  ctx.beginPath();
  ctx.moveTo(x - 6, top + 1);
  ctx.lineTo(cx, top - 19);
  ctx.lineTo(x + w + 6, top + 1);
  ctx.fill();
  ctx.fillStyle = by(env.time, '#9a3a2a', '#a8402e', '#6a2a2a');
  ctx.beginPath();
  ctx.moveTo(x - 4, top);
  ctx.lineTo(cx, top - 17);
  ctx.lineTo(x + w + 4, top);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let r = 0; r < 4; r++) {
    const y = top - 3 - r * 4;
    const half = Math.round((w / 2 + 4) * (1 - (top - y) / 17));
    ctx.fillRect(cx - half, y, half * 2, 1);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(x - 4, top);
  ctx.lineTo(cx, top - 17);
  ctx.lineTo(cx - 3, top - 17);
  ctx.lineTo(x - 4, top);
  ctx.fill();
  // fumaça subindo da chaminé
  const smoke = by(env.time, 'rgba(240,240,244,', 'rgba(250,250,252,', 'rgba(190,200,230,');
  for (let i = 0; i < 6; i++) {
    const age = (((env.t * 0.35 + i / 6) % 1) + 1) % 1;
    const sx = cx + 16.5 + Math.sin(env.t * 0.9 + i * 1.7) * 2 + age * 12;
    const sy = top - 24 - age * 34;
    ctx.fillStyle = `${smoke}${(0.7 * (1 - age)).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 2 + age * 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Lago ao lado da cabana, na altura do chão dela (no QG, à esquerda da cabana em 222). */
const LAKE = { cx: 126, cy: 141, rx: 46, ry: 10 };

type LakeBox = { cx: number; cy: number; rx: number; ry: number };

function lake(env: SceneEnv, L: LakeBox = LAKE): void {
  const { ctx } = env;
  // os detalhes foram desenhados para um lago de 62 x 24; aqui acompanham o tamanho dele
  const sx = L.rx / 62;
  const sy = L.ry / 24;
  const path = (grow = 0): void => {
    ctx.beginPath();
    ctx.ellipse(L.cx, L.cy, L.rx + grow, L.ry + grow * 0.6, 0, 0, Math.PI * 2);
  };
  // margem de terra e pedras
  path(3);
  ctx.fillStyle = '#7a5a34';
  ctx.fill();
  path(1);
  ctx.fillStyle = '#c9b27a';
  ctx.fill();
  // água
  ctx.save();
  path();
  ctx.clip();
  gradientRect(
    env,
    L.cx - L.rx,
    L.cy - L.ry,
    L.rx * 2,
    L.ry * 2,
    by(env.time, ['#5ec8dc', '#2f9ac4'], ['#4fc3e8', '#2a8cd0'], ['#173a6a', '#0e2a55']),
  );
  tileArea(env, env.tiles.water, 0, 160, L.cx - L.rx, L.cy - L.ry, L.rx * 2, L.ry * 2, env.t * 6);
  gradientRect(env, L.cx - L.rx, L.cy - L.ry, L.rx * 2, 10, [
    'rgba(255,255,255,0.35)',
    'rgba(255,255,255,0)',
  ]);
  // brilhos
  const random = rng(4);
  for (let i = 0; i < 9; i++) {
    const phase = Math.sin(env.t * 2 + i * 1.3);
    if (phase > 0.2)
      rect(
        env,
        L.cx - 50 * sx + random() * 100 * sx,
        L.cy - 14 * sy + random() * 28 * sy,
        4,
        1,
        'rgba(255,255,255,0.7)',
      );
  }
  ctx.restore();
  // vitórias-régias com flor de lótus
  for (const [dx, dy, flower] of [
    [-30, -4, true],
    [-8, 8, false],
    [20, -8, true],
    [34, 6, false],
    [-44, 8, false],
  ] as const) {
    const bob = Math.sin(env.t * 1.2 + dx) * 0.6;
    const lx = Math.round(L.cx + dx * sx);
    const ly = L.cy + dy * sy;
    ctx.fillStyle = '#1f6f3a';
    ctx.beginPath();
    ctx.ellipse(lx, ly + bob + 1, 7 * sx + 1, 3 * sy + 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#46c25f';
    ctx.beginPath();
    ctx.ellipse(lx, ly + bob, 7 * sx + 1, 3 * sy + 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (flower) {
      rect(env, lx - 2, ly + bob - 4, 5, 3, '#ff8fd0');
      rect(env, lx - 1, ly + bob - 6, 3, 3, '#ffc2e6');
      rect(env, lx, ly + bob - 4, 1, 2, '#ffe14a');
    }
  }
  // juncos na margem
  for (const [dx, dy] of [
    [-58, 10],
    [-55, 14],
    [52, 14],
    [56, 8],
    [-8, -22],
    [30, -22],
  ] as const) {
    const sway = Math.round(Math.sin(env.t * 1.5 + dx) * 1);
    const rx = Math.round(L.cx + dx * sx);
    const ry = Math.round(L.cy + dy * sy);
    rect(env, rx, ry - 9, 1, 9, '#2f8a47');
    rect(env, rx + sway, ry - 12, 2, 4, '#6b4a2a');
    rect(env, rx + 2, ry - 6, 1, 6, '#46c25f');
  }
}

function flowers(env: SceneEnv): void {
  const random = rng(17);
  const colors = ['#ff6fa8', '#ffd23f', '#ffffff', '#b08aff', '#ff8a3d', '#6fd3ff'];
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(random() * SCENE_W);
    const y = HORIZON + 22 + Math.floor(random() * 92);
    const inLake = ((x - LAKE.cx) / (LAKE.rx + 6)) ** 2 + ((y - LAKE.cy) / (LAKE.ry + 5)) ** 2 < 1;
    if (inLake) continue;
    const color = colors[i % colors.length] ?? '#fff';
    const sway = Math.round(Math.sin(env.t * 1.6 + i) * 0.6);
    rect(env, x, y + 2, 1, 3, '#2f9a4a');
    rect(env, x - 1 + sway, y, 3, 1, color);
    rect(env, x + sway, y - 1, 1, 3, color);
    rect(env, x + sway, y, 1, 1, '#ffe14a');
  }
  // tufos de grama alta
  for (let i = 0; i < 40; i++) {
    const x = random() * SCENE_W;
    const y = HORIZON + 24 + random() * 90;
    rect(env, x, y, 1, 3, 'rgba(30,110,50,0.55)');
    rect(env, x + 2, y + 1, 1, 2, 'rgba(30,110,50,0.55)');
  }
}

function butterflies(env: SceneEnv): void {
  if (env.time === 'night') return;
  const colors = ['#ff8fd0', '#ffd23f', '#8fd0ff', '#ffa14a'];
  for (let i = 0; i < 5; i++) {
    const x = 50 + i * 70 + Math.sin(env.t * 0.9 + i) * 30;
    const y = 138 + Math.cos(env.t * 1.3 + i * 2) * 14 + i * 5;
    const flap = Math.sin(env.t * 14 + i) > 0 ? 3 : 1;
    const color = colors[i % colors.length] ?? '#ff8fd0';
    rect(env, x - flap, y - 1, flap, 2, color);
    rect(env, x + 1, y - 1, flap, 2, color);
    rect(env, x - flap + 1, y + 1, flap - 1, 1, color);
    rect(env, x, y - 1, 1, 3, '#3b2a4a');
  }
}

function birds(env: SceneEnv): void {
  if (env.time === 'night') return;
  for (let i = 0; i < 3; i++) {
    const x = ((env.t * (14 + i * 3) + i * 120) % (SCENE_W + 40)) - 20;
    const y = 26 + i * 12 + Math.sin(env.t * 2 + i) * 3;
    const up = Math.sin(env.t * 9 + i) > 0;
    const color = by(env.time, '#5a4a6a', '#3a4a6a', '#000');
    rect(env, x - 3, y + (up ? -1 : 1), 3, 1, color);
    rect(env, x, y, 1, 1, color);
    rect(env, x + 1, y + (up ? -1 : 1), 3, 1, color);
  }
}

/** Vaga-lumes: mesma posição para o desenho e para o brilho. */
function fireflyPos(i: number, t: number): { x: number; y: number; on: boolean } {
  const random = rng(31 + i * 7);
  const bx = random() * SCENE_W;
  const by0 = HORIZON + 24 + random() * 84;
  return {
    x: bx + Math.sin(t * 0.8 + i) * 12,
    y: by0 + Math.cos(t * 1.1 + i * 1.7) * 8,
    on: Math.sin(t * 2.6 + i * 2) > -0.3,
  };
}

function fireflies(env: SceneEnv): void {
  if (env.time !== 'night') return;
  for (let i = 0; i < 16; i++) {
    const f = fireflyPos(i, env.t);
    if (f.on) {
      rect(env, f.x, f.y, 2, 2, '#e8ff7a');
      rect(env, f.x, f.y, 1, 1, '#ffffff');
    }
  }
}

const FOREST_PERIOD = 1400;
/** Cabana, lago, árvores e arbustos andam juntos com o chão: é uma floresta só. */
const HOUSE_FACTOR = 1;
const HOUSE_X = 190;
const PATH_TOP = 172;
const PATH_BOTTOM = 196;

type TreeKind = 'pineA' | 'pineB' | 'bushA' | 'bushB';
type Tree = { x: number; kind: TreeKind };

/** Recortes da folha de árvores: [x, y, largura, altura]. */
const TREE_SHEET: Record<TreeKind, [number, number, number, number]> = {
  pineA: [4, 101, 85, 107],
  pineB: [102, 101, 85, 107],
  bushA: [1, 0, 94, 96],
  bushB: [98, 0, 94, 96],
};

function tree(env: SceneEnv, kind: TreeKind, x: number, baseY: number, scale: number): void {
  const image = env.tiles.treetop;
  if (!image) return;
  const [sx, sy, sw, sh] = TREE_SHEET[kind];
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);
  const left = Math.round(x - w / 2);
  if (left > SCENE_W || left + w < 0) return;
  env.ctx.drawImage(image, sx, sy, sw, sh, left, Math.round(baseY - h), w, h);
}

/** Árvores e arbustos espalhados com espaços irregulares, mas sem amontoar. */
function scatter(
  seed: number,
  from: number,
  minGap: number,
  maxGap: number,
  bushy: number,
): Tree[] {
  const random = rng(seed);
  const out: Tree[] = [];
  let x = from;
  while (x < FOREST_PERIOD - 60) {
    const bush = random() < bushy;
    const pick = random() < 0.5;
    out.push({ x, kind: bush ? (pick ? 'bushA' : 'bushB') : pick ? 'pineA' : 'pineB' });
    x += minGap + random() * (maxGap - minGap);
  }
  return out;
}

const FAR_TREES: Tree[] = [
  { x: 270, kind: 'pineA' },
  { x: 318, kind: 'pineB' },
  ...scatter(41, 470, 120, 210, 0.3),
];
const MID_TREES: Tree[] = [{ x: 352, kind: 'pineB' }, ...scatter(53, 560, 150, 260, 0.45)];
const NEAR_TREES: Tree[] = scatter(67, 640, 230, 380, 0.6);

const TREE_LAYERS: { trees: Tree[]; factor: number; base: number; scale: number; bush: number }[] =
  [
    { trees: FAR_TREES, factor: 1, base: 136, scale: 0.5, bush: 0.5 },
    { trees: MID_TREES, factor: 1, base: 154, scale: 0.72, bush: 0.5 },
    { trees: NEAR_TREES, factor: 1, base: 172, scale: 1, bush: 0.5 },
  ];

const lakeBox = (env: SceneEnv): LakeBox => ({
  cx: Math.round(scrolled(HOUSE_X - 100, env.scroll, FOREST_PERIOD, HOUSE_FACTOR)),
  cy: 141,
  rx: 46,
  ry: 10,
});

/** Flores e grama alta presas ao chão: passam sob os pés, sem poças d'água no caminho. */
function journeyFlowers(env: SceneEnv): void {
  const random = rng(17);
  const colors = ['#ff6fa8', '#ffd23f', '#ffffff', '#b08aff', '#ff8a3d', '#6fd3ff'];
  for (let i = 0; i < 80; i++) {
    const x = scrolled(random() * 820, env.scroll, 820);
    const y = HORIZON + 26 + Math.floor(random() * 88);
    if (y > PATH_TOP - 4 && y < PATH_BOTTOM + 2) continue;
    const color = colors[i % colors.length] ?? '#fff';
    const sway = Math.round(Math.sin(env.t * 1.6 + i) * 0.6);
    rect(env, x, y + 2, 1, 3, '#2f9a4a');
    rect(env, x - 1 + sway, y, 3, 1, color);
    rect(env, x + sway, y - 1, 1, 3, color);
    rect(env, x + sway, y, 1, 1, '#ffe14a');
  }
  for (let i = 0; i < 40; i++) {
    const x = scrolled(random() * 820, env.scroll, 820);
    const y = HORIZON + 28 + random() * 86;
    rect(env, x, y, 1, 3, 'rgba(30,110,50,0.55)');
    rect(env, x + 2, y + 1, 1, 2, 'rgba(30,110,50,0.55)');
  }
}

/** Árvores e arbustos da jornada, na lista por altura dos pés: quem passa por trás ou pela frente é certo. */
function treeItems(env: SceneEnv): { y: number; draw: () => void }[] {
  const out: { y: number; draw: () => void }[] = [];
  for (const layer of TREE_LAYERS) {
    for (const item of layer.trees) {
      const x = scrolled(item.x, env.scroll, FOREST_PERIOD, layer.factor);
      const bush = item.kind === 'bushA' || item.kind === 'bushB';
      const scale = bush ? layer.scale * 0.55 : layer.scale;
      out.push({ y: layer.base, draw: () => tree(env, item.kind, x, layer.base, scale) });
    }
  }
  return out;
}

/** Floresta na jornada: a casa com o lago passa devagar ao fundo, as árvores em três profundidades. */
function journey(env: SceneEnv): void {
  sky(env, 0, 0, SCENE_W, HORIZON + 8);
  forestSky(env);
  env.ctx.save();
  env.ctx.translate(-((env.scroll * 0.02) % SCENE_W), 0);
  rainbow(env);
  mountains(env);
  env.ctx.translate(SCENE_W, 0);
  rainbow(env);
  mountains(env);
  env.ctx.restore();
  birds(env);
  if (env.time !== 'night') {
    for (let i = 0; i < 4; i++) rect(env, 70 + i * 70, 0, 12, HORIZON, 'rgba(255,255,220,0.08)');
  }
  hills(env, env.scroll * 0.08, env.scroll * 0.16);
  const house = Math.round(scrolled(HOUSE_X, env.scroll, FOREST_PERIOD, HOUSE_FACTOR));
  cabin(env, house, HORIZON + 24);
  tileArea(
    env,
    env.tiles.grass,
    0,
    160,
    0,
    HORIZON + 24,
    SCENE_W,
    SCENE_H - HORIZON - 24,
    env.scroll,
  );
  gradientRect(env, 0, HORIZON + 22, SCENE_W, 36, [
    by(env.time, 'rgba(255,240,220,0.35)', 'rgba(255,255,240,0.28)', 'rgba(120,150,220,0.18)'),
    'rgba(255,255,255,0)',
  ]);
  lake(env, lakeBox(env));
  // Caminho de terra batida sob os pés
  rect(
    env,
    0,
    PATH_TOP,
    SCENE_W,
    PATH_BOTTOM - PATH_TOP,
    by(env.time, '#c9b27a', '#cdb67e', '#6a5a3c'),
  );
  rect(env, 0, PATH_TOP, SCENE_W, 1, 'rgba(90,60,30,0.35)');
  rect(env, 0, PATH_BOTTOM - 1, SCENE_W, 1, 'rgba(90,60,30,0.35)');
  const pebbles = rng(5);
  for (let i = 0; i < 26; i++) {
    rect(
      env,
      scrolled(pebbles() * 820, env.scroll, 820),
      PATH_TOP + 3 + pebbles() * (PATH_BOTTOM - PATH_TOP - 6),
      2,
      1,
      'rgba(110,80,40,0.45)',
    );
  }
  journeyFlowers(env);
  butterflies(env);
  fireflies(env);
  if (env.arrivedFor !== null) portal(env, env.arrivedFor, 168);
}

export const paradise: SceneDef = {
  id: 'paradise',
  name: 'Floresta',
  blurb:
    'Campo florido com lago e lótus, cabana com fumaça na chaminé, pinheiros e arbustos, arco-íris e borboletas.',
  groundY: FOREST_GROUND,
  levels: FOREST_LEVEL_COUNT,
  levelInfo: FOREST_LEVELS,
  ...forestLevelLayers,
  levelItems: (env) => [
    ...(forestLevelLayers.levelItems?.(env) ?? []),
    ...(env.journey ? treeItems(env) : []),
  ],
  extrasFor: forestExtras,
  journeyExtrasFor: forestJourneyExtras,
  journeyPeriod: 1400,
  journey,
  back(env) {
    sky(env, 0, 0, SCENE_W, HORIZON + 8);
    forestSky(env);
    rainbow(env);
    birds(env);
    mountains(env);
    // raios de sol
    if (env.time !== 'night') {
      for (let i = 0; i < 4; i++) rect(env, 70 + i * 70, 0, 12, HORIZON, 'rgba(255,255,220,0.08)');
    }
    hills(env);
    cabin(env, 222, HORIZON + 24);
    // campo e névoa suave no horizonte
    tileArea(env, env.tiles.grass, 0, 160, 0, HORIZON + 24, SCENE_W, SCENE_H - HORIZON - 24);
    gradientRect(env, 0, HORIZON + 22, SCENE_W, 36, [
      by(env.time, 'rgba(255,240,220,0.35)', 'rgba(255,255,240,0.28)', 'rgba(120,150,220,0.18)'),
      'rgba(255,255,255,0)',
    ]);
    // Árvores (pinheiros e arbustos do pacote)
    sprite(env, env.tiles.treetop, 4, 101, 85, 107, 276, 52);
    sprite(env, env.tiles.treetop, 102, 101, 85, 107, 332, 78);
    sprite(env, env.tiles.treetop, 1, 0, 94, 96, 290, 128);
    lake(env);
    flowers(env);
    butterflies(env);
    fireflies(env);
  },
  lights: (env): Light[] => {
    if (env.journey) {
      const box = lakeBox(env);
      const house = scrolled(HOUSE_X, env.scroll, FOREST_PERIOD, HOUSE_FACTOR);
      const out: Light[] = [
        { x: 304, y: 30, radius: 300, color: [160, 190, 255], intensity: 0.34 },
        { x: 195, y: 150, radius: 230, color: [150, 190, 240], intensity: 0.26 },
        { x: box.cx, y: box.cy, radius: 60, color: [140, 230, 255], intensity: 0.4 },
        { x: house + 4, y: HORIZON + 14, radius: 40, color: [255, 210, 120], intensity: 0.7 },
      ];
      for (let i = 0; i < 16; i++) {
        const f = fireflyPos(i, env.t);
        if (f.on) out.push({ x: f.x, y: f.y, radius: 12, color: [220, 255, 120], intensity: 0.9 });
      }
      return out;
    }
    const out: Light[] = [
      { x: 304, y: 30, radius: 300, color: [160, 190, 255], intensity: 0.34 },
      { x: 195, y: 150, radius: 230, color: [150, 190, 240], intensity: 0.26 },
      { x: LAKE.cx, y: LAKE.cy, radius: 70, color: [140, 230, 255], intensity: 0.4 },
      { x: 222 + 4, y: HORIZON + 14, radius: 40, color: [255, 210, 120], intensity: 0.7 },
    ];
    for (let i = 0; i < 16; i++) {
      const f = fireflyPos(i, env.t);
      if (f.on) out.push({ x: f.x, y: f.y, radius: 12, color: [220, 255, 120], intensity: 0.9 });
    }
    return out;
  },
  tint: {
    morning: { color: '#fff0d0', alpha: 0.12 },
    afternoon: { color: '#ffffff', alpha: 0 },
    night: { color: '#3b55a0', alpha: 0.36 },
  },
};
