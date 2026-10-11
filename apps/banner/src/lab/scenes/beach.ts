import { bands, flame, rect, rng, sky, tileArea } from './draw';
import type { SceneDef, SceneEnv } from './types';
import { SCENE_W } from './types';

const HORIZON = 98;

function palm(env: SceneEnv, x: number, baseY: number, lean: number): void {
  for (let i = 0; i < 9; i++) {
    rect(env, x + lean * i * 0.8, baseY - i * 8, 5, 9, i % 2 ? '#7a4a1e' : '#8c5a28');
  }
  const topX = x + lean * 7.2;
  const topY = baseY - 72;
  const sway = Math.sin(env.t * 1.4) * 2;
  const green = ['#1f7a3a', '#2fa04c', '#46c25f'];
  for (const [dx, dy] of [
    [-22, 6],
    [-14, -2],
    [14, -2],
    [22, 6],
    [-6, -8],
    [8, -9],
  ] as const) {
    const length = 6;
    for (let k = 0; k < length; k++) {
      rect(
        env,
        topX + (dx * k) / length + sway * (k / length),
        topY + (dy * k) / length + k * 0.6,
        6,
        3,
        green[k % 3] ?? '#2fa04c',
      );
    }
  }
  rect(env, topX - 2, topY + 1, 4, 4, '#5a3412');
}

export const beach: SceneDef = {
  id: 'beach',
  name: 'Praia',
  blurb: 'Areia, mar e palmeiras; o nascer e o pôr do sol aparecem no horizonte.',
  groundY: 176,
  back(env) {
    sky(env, 0, 0, SCENE_W, HORIZON);
    // Mar com faixas e ondas
    const sea =
      env.time === 'night'
        ? ['#0c2a55', '#0e3566', '#103f78']
        : env.time === 'morning'
          ? ['#3d8fb8', '#4aa4c4', '#5fb7d0']
          : ['#1d78c2', '#2a90d6', '#3ba6e0'];
    bands(env, 0, HORIZON, SCENE_W, 44, sea);
    tileArea(env, env.tiles.water, 0, 160, 0, HORIZON + 4, SCENE_W, 38, env.t * 8);
    rect(env, 0, HORIZON, SCENE_W, 1, 'rgba(255,255,255,0.35)');
    // Reflexo do sol/lua
    const reflect = env.time === 'night' ? '#cfd8ff' : '#fff2b8';
    const rx = env.time === 'morning' ? 86 : env.time === 'afternoon' ? 296 : 304;
    for (let i = 0; i < 7; i++) {
      rect(
        env,
        rx - 10 + ((Math.sin(env.t * 2 + i) * 3) | 0),
        HORIZON + 4 + i * 6,
        20 - i,
        2,
        reflect,
      );
    }
    // Espuma
    const foamY = 142 + ((Math.sin(env.t * 1.2) * 2) | 0);
    rect(env, 0, foamY, SCENE_W, 3, 'rgba(255,255,255,0.75)');
    // Areia
    bands(env, 0, 145, SCENE_W, 75, ['#f1d9a0', '#ecd194', '#e6c987', '#dfc07c', '#d8b772']);
    const random = rng(11);
    for (let i = 0; i < 90; i++)
      rect(env, random() * SCENE_W, 150 + random() * 66, 2, 1, 'rgba(120,80,30,0.25)');
    palm(env, 40, 196, 2);
    palm(env, 340, 200, -2);
    // Toalha
    rect(env, 96, 184, 36, 14, '#e8423f');
    rect(env, 96, 188, 36, 3, '#ffffff');
    // Fogueirinha à noite
    if (env.time === 'night') {
      rect(env, 266, 192, 14, 3, '#5a3412');
      flame(env, 273, 192, 2);
    }
  },
  lights: () => [
    { x: 273, y: 190, radius: 80, color: [255, 150, 60], intensity: 0.6, flicker: true },
  ],
  tint: {
    morning: { color: '#ffd9b3', alpha: 0.22 },
    afternoon: { color: '#fffbe8', alpha: 0.05 },
    night: { color: '#3a4aa0', alpha: 0.55 },
  },
};
