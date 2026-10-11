import { bands, glow, rect, sky, skyline, tileArea } from './draw';
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
    // Espreguiçadeira: encosto inclinado, assento listrado e pernas
    const { ctx } = env;
    ctx.fillStyle = '#c9892a';
    ctx.beginPath();
    ctx.moveTo(30, 170);
    ctx.lineTo(40, 150);
    ctx.lineTo(48, 154);
    ctx.lineTo(40, 174);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#fff4d6' : '#f0b24a';
      ctx.fillRect(34 + i * 9, 172 + (i > 1 ? 0 : 0), 9, 6);
    }
    ctx.fillStyle = '#4a3b2c';
    ctx.fillRect(36, 178, 2.5, 11);
    ctx.fillRect(84, 178, 2.5, 11);
    // Vasos com plantas
    for (const px of [352, 372]) {
      ctx.fillStyle = '#a2552e';
      ctx.fillRect(px - 7, 176, 14, 12);
      ctx.fillStyle = '#2f9e52';
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.ellipse(px + (k - 2) * 3, 170 - (k % 2) * 4, 3, 8, (k - 2) * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Varal de luzes (acende à noite)
    ctx.strokeStyle = '#2b2b33';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 96);
    ctx.quadraticCurveTo(100, 122, 200, 98);
    ctx.quadraticCurveTo(300, 76, 390, 104);
    ctx.stroke();
    for (let i = 1; i < 14; i++) {
      const u = i / 14;
      const bx = u * 390;
      const by =
        u < 0.5
          ? 96 + Math.sin(u * Math.PI) * 24 * (1 - u)
          : 100 - Math.sin((u - 0.5) * Math.PI) * 14 + 6;
      ctx.fillStyle = env.time === 'night' ? '#ffe9a8' : '#cfc7b0';
      ctx.beginPath();
      ctx.arc(bx, by + 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
      if (env.time === 'night') glow(env, bx, by + 2, 12, [255, 210, 120], 0.35);
    }
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
