import { flame, glow, rect, shadedBlock, sky, sprite, tileArea } from './draw';
import type { SceneDef, SceneEnv } from './types';
import { SCENE_W } from './types';

const WALL = 112;

const OUTLINE = '#1c0e06';

const block = (
  env: SceneEnv,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  dark: string,
  light: string,
): void => {
  shadedBlock(env, x, y, w, h, fill, dark, light, OUTLINE);
};

/** Tapete trançado em frente à lareira: borda, listra dourada, losangos e franjas. */
function rug(env: SceneEnv, x: number, y: number, w: number, h: number): void {
  rect(env, x - 1, y - 1, w + 2, h + 2, '#2e1010');
  rect(env, x, y, w, h, '#7d2323');
  rect(env, x + 2, y + 2, w - 4, h - 4, '#a33a34');
  rect(env, x + 4, y + 4, w - 8, h - 8, '#d9a441');
  rect(env, x + 5, y + 5, w - 10, h - 10, '#a33a34');
  const cy = y + h / 2;
  for (let dx = 12; dx < w - 10; dx += 12) {
    for (let k = 0; k < 4; k++) {
      rect(env, x + dx - k, cy - (4 - k), 1 + k * 2, 1, '#7d2323');
      rect(env, x + dx - k, cy + (3 - k), 1 + k * 2, 1, '#7d2323');
    }
    rect(env, x + dx, cy - 1, 1, 2, '#f1d27a');
  }
  for (let fy = y + 1; fy < y + h - 1; fy += 2) {
    rect(env, x - 3, fy, 2, 1, '#eadcb4');
    rect(env, x + w + 1, fy, 2, 1, '#eadcb4');
  }
}

/** Poltrona vista por trás (de frente para a lareira): encosto alto, braços e pés. */
function armchair(env: SceneEnv, cx: number, baseY: number): void {
  const x0 = cx - 12;
  rect(env, x0 + 1, baseY - 2, 3, 2, '#2a170a');
  rect(env, x0 + 20, baseY - 2, 3, 2, '#2a170a');
  block(env, x0 - 2, baseY - 20, 6, 18, '#276468', '#1a4548', '#3f8a8e');
  block(env, x0 + 20, baseY - 20, 6, 18, '#276468', '#1a4548', '#3f8a8e');
  block(env, x0 + 3, baseY - 12, 18, 10, '#2f767a', '#1d4d50', '#4a9a9e');
  block(env, x0 + 2, baseY - 34, 20, 24, '#378489', '#235a5e', '#59a8ac');
  rect(env, x0 + 2, baseY - 34, 1, 1, OUTLINE);
  rect(env, x0 + 21, baseY - 34, 1, 1, OUTLINE);
  rect(env, x0 + 5, baseY - 24, 14, 1, '#235a5e'); // costura do encosto
  rect(env, x0 + 5, baseY - 23, 14, 1, '#59a8ac');
}

/** Criado-mudo de madeira com gaveta e puxador. */
function nightstand(env: SceneEnv, x: number, y: number): void {
  block(env, x, y, 24, 6, '#b27a3c', '#8a5a2a', '#d09a58'); // tampo
  block(env, x + 1, y + 6, 22, 22, '#8f5d2b', '#6b4119', '#a8723a'); // corpo
  rect(env, x + 3, y + 9, 18, 8, '#7d4f23');
  rect(env, x + 3, y + 9, 18, 1, '#a8723a');
  rect(env, x + 10, y + 12, 4, 2, '#e8c46a'); // puxador
  rect(env, x + 3, y + 20, 18, 5, '#7d4f23');
  rect(env, x + 10, y + 22, 4, 2, '#e8c46a');
  rect(env, x + 2, y + 28, 3, 3, OUTLINE); // pés
  rect(env, x + 19, y + 28, 3, 3, OUTLINE);
}

/** Luminária de mesa: base, haste e cúpula; acesa à noite. */
function lamp(env: SceneEnv, cx: number, baseY: number, lit: boolean): void {
  block(env, cx - 4, baseY - 4, 8, 4, '#6b4119', '#4a2c0e', '#8a5a2a');
  rect(env, cx - 1, baseY - 12, 2, 8, OUTLINE);
  rect(env, cx, baseY - 12, 1, 8, '#c9a24a');
  const shade = lit ? '#ffe9a8' : '#e9dcb4';
  rect(env, cx - 8, baseY - 13, 16, 1, OUTLINE);
  rect(env, cx - 7, baseY - 22, 14, 10, OUTLINE);
  rect(env, cx - 6, baseY - 21, 12, 8, shade);
  rect(env, cx - 6, baseY - 21, 12, 1, lit ? '#fff6d0' : '#f6ecd0');
  rect(env, cx - 6, baseY - 14, 12, 1, lit ? '#f0c76a' : '#c9b88a');
  rect(env, cx - 4, baseY - 25, 8, 3, OUTLINE);
  rect(env, cx - 3, baseY - 24, 6, 2, shade);
  if (lit) glow(env, cx, baseY - 16, 22, [255, 214, 130], 0.5);
}

export const cabin: SceneDef = {
  id: 'cabin',
  name: 'Cabana',
  blurb: 'Interior de madeira com janela: o céu lá fora mostra a hora do dia.',
  groundY: 172,
  back(env) {
    const { ctx, tiles } = env;
    tileArea(env, tiles.inside, 0, 128, 0, 0, SCENE_W, 220);
    rect(env, 0, 0, SCENE_W, WALL, 'rgba(20,8,0,0.45)');
    rect(env, 0, WALL - 6, SCENE_W, 6, '#2a1608');
    rect(env, 0, 0, SCENE_W, 6, '#1a0d04');

    // Janela com céu
    sky(env, 168, 24, 54, 52);
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(163, 19, 64, 5);
    ctx.fillRect(163, 76, 64, 5);
    ctx.fillRect(163, 19, 5, 62);
    ctx.fillRect(222, 19, 5, 62);
    ctx.fillRect(193, 24, 4, 52);
    ctx.fillRect(168, 48, 54, 4);

    sprite(env, tiles.cabinets, 32, 0, 64, 72, 250, WALL - 72);
    sprite(env, tiles.kitchen, 0, 0, 32, 124, 340, WALL + 12 - 124);
    sprite(env, tiles.country, 0, 0, 64, 96, 16, 62);
    // Criado-mudo com luminária ao lado da cama
    nightstand(env, 80, 112);
    lamp(env, 92, 112, env.time === 'night');
    // Tapete na frente da lareira, com duas poltronas viradas para o fogo
    rug(env, 306, 134, 80, 40);
    armchair(env, 328, 164);
    armchair(env, 366, 164);

    // Lareira acesa dentro do fogão
    if (env.time === 'night') flame(env, 357, WALL + 2, 1);
  },
  lights: () => [
    {
      x: 357,
      y: WALL,
      radius: 90,
      color: [255, 150, 60],
      intensity: 0.55,
      flicker: true,
      at: ['night', 'afternoon'],
    },
    { x: 92, y: 98, radius: 70, color: [255, 200, 120], intensity: 0.5, at: ['night'] },
    { x: 195, y: 60, radius: 70, color: [120, 150, 255], intensity: 0.28, at: ['night'] },
    { x: 195, y: 120, radius: 110, color: [255, 220, 150], intensity: 0.3, at: ['morning'] },
  ],
  tint: {
    morning: { color: '#ffd9b3', alpha: 0.28 },
    afternoon: { color: '#fff0d6', alpha: 0.12 },
    night: { color: '#2f3d8f', alpha: 0.6 },
  },
};
