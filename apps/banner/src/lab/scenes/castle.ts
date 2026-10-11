import { bands, flame, rect, rng, sky } from './draw';
import type { SceneDef, SceneEnv } from './types';
import { SCENE_W } from './types';

const FLOOR = 124;

function torch(env: SceneEnv, x: number): void {
  rect(env, x - 2, 66, 4, 22, '#4a3320');
  rect(env, x - 5, 62, 10, 5, '#3a2a1a');
  flame(env, x, 62, 2);
}

function banner(env: SceneEnv, x: number): void {
  rect(env, x, 20, 22, 56, '#9a1b1b');
  rect(env, x, 70, 22, 6, '#7a1414');
  rect(env, x + 8, 30, 6, 18, '#f4c542');
  rect(env, x + 4, 36, 14, 4, '#f4c542');
  rect(env, x - 2, 18, 26, 3, '#4a3320');
}

export const castle: SceneDef = {
  id: 'castle',
  name: 'Castelo',
  blurb: 'Salão de pedra com tapete real, estandartes, tochas e janela em arco.',
  groundY: 178,
  back(env) {
    // Parede de blocos de pedra
    bands(env, 0, 0, SCENE_W, FLOOR, ['#6b7280', '#656b78', '#5f6572']);
    const random = rng(2);
    for (let y = 0; y < FLOOR; y += 12) {
      const offset = (y / 12) % 2 ? 0 : 16;
      for (let x = -16 + offset; x < SCENE_W; x += 32) {
        rect(env, x, y, 31, 11, `rgba(255,255,255,${0.02 + random() * 0.05})`);
        rect(env, x + 31, y, 1, 12, 'rgba(0,0,0,0.25)');
      }
      rect(env, 0, y + 11, SCENE_W, 1, 'rgba(0,0,0,0.25)');
    }
    // Janela em arco com céu
    sky(env, 168, 24, 54, 62);
    rect(env, 160, 18, 8, 70, '#8b93a1');
    rect(env, 222, 18, 8, 70, '#8b93a1');
    rect(env, 160, 14, 70, 6, '#8b93a1');
    rect(env, 193, 24, 4, 62, '#4a4f58');
    rect(env, 168, 52, 54, 4, '#4a4f58');
    banner(env, 70);
    banner(env, 298);
    torch(env, 130);
    torch(env, 262);
    // Piso de lajes e tapete real
    bands(env, 0, FLOOR, SCENE_W, 100, ['#4a4f58', '#434852', '#3c414a']);
    for (let y = FLOOR; y < 220; y += 24) rect(env, 0, y, SCENE_W, 1, 'rgba(0,0,0,0.3)');
    for (let x = 0; x < SCENE_W; x += 48) rect(env, x, FLOOR, 1, 100, 'rgba(0,0,0,0.2)');
    rect(env, 138, FLOOR, 114, 100, '#8f1d1d');
    rect(env, 138, FLOOR, 4, 100, '#f4c542');
    rect(env, 248, FLOOR, 4, 100, '#f4c542');
  },
  lights: () => [
    {
      x: 130,
      y: 62,
      radius: 90,
      color: [255, 150, 60],
      intensity: 0.55,
      flicker: true,
      at: ['night', 'morning', 'afternoon'],
    },
    {
      x: 262,
      y: 62,
      radius: 90,
      color: [255, 150, 60],
      intensity: 0.55,
      flicker: true,
      at: ['night', 'morning', 'afternoon'],
    },
    { x: 195, y: 100, radius: 90, color: [150, 170, 255], intensity: 0.25, at: ['night'] },
  ],
  tint: {
    morning: { color: '#ffe0c0', alpha: 0.2 },
    afternoon: { color: '#fff4de', alpha: 0.08 },
    night: { color: '#27357f', alpha: 0.55 },
  },
};
