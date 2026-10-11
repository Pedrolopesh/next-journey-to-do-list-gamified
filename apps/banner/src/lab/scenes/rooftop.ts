import { bands, rect, sky, skyline, tileArea } from './draw';
import type { SceneDef } from './types';
import { SCENE_W } from './types';

const PARAPET = 136;

export const rooftop: SceneDef = {
  id: 'rooftop',
  name: 'Topo do prédio',
  blurb: 'Terraço de um arranha-céu com a cidade ao fundo, janelas acesas à noite.',
  groundY: 190,
  back(env) {
    sky(env, 0, 0, SCENE_W, 120);
    const far = env.time === 'night' ? '#141c3d' : env.time === 'morning' ? '#8f86b8' : '#7e9fc6';
    const near = env.time === 'night' ? '#0b1129' : env.time === 'morning' ? '#5d5a8c' : '#4f6f98';
    skyline(env, 3, 128, 28, 70, far, { windows: true });
    skyline(env, 9, 136, 30, 88, near, { windows: true });
    // Antena com luz vermelha piscando
    rect(env, 320, 40, 2, 70, near);
    if (Math.sin(env.t * 4) > 0) rect(env, 319, 38, 4, 4, '#ff3b30');
    // Caixa d'água
    rect(env, 330, 88, 28, 22, '#6d5a47');
    rect(env, 328, 84, 32, 6, '#4b3b2c');
    // Mureta (parapeito) e piso
    bands(env, 0, PARAPET - 8, SCENE_W, 22, ['#8a8f99', '#7b808b', '#6c717c']);
    rect(env, 0, PARAPET - 10, SCENE_W, 3, '#b6bbc4');
    tileArea(env, env.tiles.cement, 0, 160, 0, PARAPET + 14, SCENE_W, 90);
    rect(env, 0, PARAPET + 14, SCENE_W, 2, 'rgba(0,0,0,0.3)');
    // Grade do guarda-corpo na frente do céu
    for (let x = 6; x < SCENE_W; x += 16) rect(env, x, PARAPET - 30, 2, 22, '#9aa0ab');
    rect(env, 0, PARAPET - 32, SCENE_W, 2, '#b6bbc4');
    // Espreguiçadeira
    rect(env, 36, 172, 54, 8, '#e8a33d');
    rect(env, 36, 160, 8, 16, '#e8a33d');
    rect(env, 38, 180, 3, 12, '#5a4a3a');
    rect(env, 84, 180, 3, 12, '#5a4a3a');
  },
  lights: () => [
    { x: 321, y: 40, radius: 24, color: [255, 60, 50], intensity: 0.35, at: ['night'] },
    { x: 195, y: 150, radius: 150, color: [120, 140, 255], intensity: 0.16, at: ['night'] },
  ],
  tint: {
    morning: { color: '#ffd2b0', alpha: 0.25 },
    afternoon: { color: '#fffdf0', alpha: 0.04 },
    night: { color: '#2b3a88', alpha: 0.5 },
  },
};
