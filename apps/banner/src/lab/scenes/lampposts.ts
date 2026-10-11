import { rect } from './draw';
import type { Light, SceneEnv } from './types';
import { SCENE_W } from './types';

export type Lamp = {
  x: number;
  /** Altura dos pés do poste. */
  baseY: number;
  /** Altura do poste. */
  h: number;
  /** Para que lado o braço se curva: 1 = direita, -1 = esquerda (sempre para o personagem). */
  dir: 1 | -1;
};

const OUT = '#1b1f17';
const REACH = 9;

/** Onde fica a lâmpada de um poste. */
export function lampHead(lamp: Lamp): { x: number; y: number } {
  return { x: lamp.x + lamp.dir * REACH, y: lamp.baseY - lamp.h + 3 };
}

/** Poste de iluminação em pixel art. A lâmpada só acende à noite. */
export function drawLampPost(env: SceneEnv, lamp: Lamp): void {
  const { x, baseY, h, dir } = lamp;
  const top = baseY - h;
  // base e poste
  rect(env, x - 4, baseY - 4, 9, 5, OUT);
  rect(env, x - 3, baseY - 3, 7, 3, '#4d555d');
  rect(env, x - 3, baseY - 3, 7, 1, '#7a838c');
  rect(env, x - 2, top, 5, h - 3, OUT);
  rect(env, x - 1, top, 3, h - 3, '#5d656d');
  rect(env, x - 1, top, 1, h - 3, '#9099a2');
  // braço curvo
  for (let i = 0; i <= REACH; i++) {
    const y = top + (i > REACH - 3 ? 2 : i > REACH - 6 ? 1 : 0);
    rect(env, x + dir * i - (dir < 0 ? 0 : 0), y - 1, 1, 4, OUT);
    rect(env, x + dir * i, y, 1, 2, '#5d656d');
  }
  // cúpula e lâmpada
  const head = lampHead(lamp);
  rect(env, head.x - 4, head.y - 4, 9, 3, OUT);
  rect(env, head.x - 3, head.y - 3, 7, 1, '#7a838c');
  rect(env, head.x - 3, head.y - 1, 7, 3, OUT);
  rect(env, head.x - 2, head.y - 1, 5, 2, env.time === 'night' ? '#fff3b8' : '#b8c0b0');
}

/** Cone de luz de cada poste caindo sobre o personagem (só de noite). */
export function drawLampCones(env: SceneEnv, lamps: Lamp[], targetX: number, feetY: number): void {
  if (env.time !== 'night') return;
  const { ctx } = env;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const lamp of lamps) {
    const head = lampHead(lamp);
    const gradient = ctx.createLinearGradient(head.x, head.y, targetX, feetY);
    gradient.addColorStop(0, 'rgba(255,238,170,0.5)');
    gradient.addColorStop(1, 'rgba(255,238,170,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(head.x - 2, head.y + 2);
    ctx.lineTo(head.x + 2, head.y + 2);
    ctx.lineTo(targetX + 24, feetY + 3);
    ctx.lineTo(targetX - 24, feetY + 3);
    ctx.fill();
  }
  ctx.restore();
}

/** Brilhos dos postes e uma poça de luz em volta do personagem; só acendem à noite. */
export function lampLights(lamps: Lamp[], targetX: number, feetY: number): Light[] {
  const out: Light[] = [];
  for (const lamp of lamps) {
    const head = lampHead(lamp);
    out.push({ x: head.x, y: head.y, radius: 26, color: [255, 236, 160], intensity: 0.9 });
    out.push({
      x: (head.x + targetX) / 2,
      y: feetY - 26,
      radius: 70,
      color: [255, 232, 170],
      intensity: 0.42,
    });
  }
  out.push({ x: targetX, y: feetY - 8, radius: 46, color: [255, 240, 190], intensity: 0.4 });
  return out.filter((light) => light.x > -100 && light.x < SCENE_W + 100);
}
