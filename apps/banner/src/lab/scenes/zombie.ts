import { bands, disc, flame, rect, rng, skyline, tileArea } from './draw';
import type { SceneDef } from './types';
import { SCENE_W } from './types';

const SKY_BY_TIME = {
  morning: ['#4b5a52', '#5f6e63', '#77836f', '#8f9a7a', '#a8ae85', '#bdbf94'],
  afternoon: ['#7a6a3c', '#8d7a45', '#a38b4e', '#b99d58', '#c9ae66', '#d6bd78'],
  night: ['#0a0710', '#120b19', '#1a0f20', '#241226', '#2e1629', '#3a1a2d'],
} as const;

export const zombie: SceneDef = {
  id: 'zombie',
  name: 'Apocalipse zumbi',
  blurb: 'Cidade em ruínas, barricada e fogueira; um zumbi ronda ao longe.',
  groundY: 182,
  back(env) {
    bands(env, 0, 0, SCENE_W, 120, [...SKY_BY_TIME[env.time]]);
    // Lua vermelha à noite, sol fraco de dia
    if (env.time === 'night') {
      disc(env, 315, 41, 11, '#b3262e');
      disc(env, 315, 41, 8, '#d4343c');
    } else {
      disc(env, 311, env.time === 'morning' ? 81 : 39, 11, 'rgba(255,240,200,0.5)');
    }
    const far = env.time === 'night' ? '#190e1c' : '#4d5648';
    const near = env.time === 'night' ? '#0f0813' : '#363d33';
    skyline(env, 21, 130, 24, 66, far, { windows: false, ruined: true });
    skyline(env, 33, 138, 28, 84, near, { windows: true, ruined: true });
    // Névoa que desliza
    for (let i = 0; i < 3; i++) {
      const x = ((env.t * (6 + i * 3) + i * 140) % (SCENE_W + 120)) - 120;
      rect(
        env,
        x,
        110 + i * 14,
        120,
        8,
        env.time === 'night' ? 'rgba(120,90,140,0.14)' : 'rgba(210,220,190,0.2)',
      );
    }
    // Rua rachada
    tileArea(env, env.tiles.cement, 0, 160, 0, 138, SCENE_W, 90);
    rect(env, 0, 138, SCENE_W, 2, 'rgba(0,0,0,0.4)');
    const random = rng(5);
    for (let i = 0; i < 10; i++)
      rect(env, random() * SCENE_W, 150 + random() * 60, 10 + random() * 14, 1, 'rgba(0,0,0,0.45)');
    // Barricada: tábuas e sacos de areia
    for (let i = 0; i < 5; i++)
      rect(env, 24 + i * 3, 124 + i * 10, 64, 6, i % 2 ? '#6b4a2a' : '#7d5a35');
    rect(env, 30, 120, 3, 56, '#4a3320');
    rect(env, 78, 120, 3, 56, '#4a3320');
    for (let i = 0; i < 4; i++) rect(env, 270 + i * 16, 176, 16, 9, i % 2 ? '#b09a6a' : '#a38b5c');
    for (let i = 0; i < 3; i++) rect(env, 278 + i * 16, 168, 16, 9, '#b09a6a');
    // Barril em chamas
    rect(env, 326, 160, 22, 26, '#7d3b1c');
    rect(env, 326, 166, 22, 2, '#3b1d0c');
    rect(env, 326, 178, 22, 2, '#3b1d0c');
    flame(env, 337, 160, 2);
    // Poste de luz que pisca
    rect(env, 356, 70, 3, 110, '#3a3f44');
    rect(env, 346, 68, 14, 4, '#3a3f44');
    if (Math.sin(env.t * 7) > -0.2 || env.time !== 'night') rect(env, 346, 72, 8, 3, '#ffe9a0');
  },
  lights: () => [
    {
      x: 337,
      y: 158,
      radius: 100,
      color: [255, 120, 40],
      intensity: 0.6,
      flicker: true,
      at: ['night', 'morning', 'afternoon'],
    },
    { x: 350, y: 76, radius: 70, color: [255, 230, 150], intensity: 0.3, at: ['night'] },
  ],
  extras: [
    {
      x: 262,
      feetY: 178,
      anim: 'walk',
      direction: 'left',
      selection: {
        bodyType: 'male',
        skin: 'zombie_green',
        hair: null,
        torso: 'torso-tshirt',
        torsoColor: 'gray',
        legs: 'legs-pants',
        legsColor: 'charcoal',
        feet: null,
      },
    },
  ],
  tint: {
    morning: { color: '#b8c8a8', alpha: 0.3 },
    afternoon: { color: '#e0c890', alpha: 0.25 },
    night: { color: '#4a2a5a', alpha: 0.55 },
  },
};
