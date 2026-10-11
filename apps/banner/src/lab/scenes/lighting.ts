import type { Light, SceneEnv, Tint } from './types';
import { SCENE_H, SCENE_W } from './types';

const DEFAULT_TINT: Record<SceneEnv['time'], Tint> = {
  morning: { color: '#ffd9b3', alpha: 0.25 },
  afternoon: { color: '#fff4de', alpha: 0.08 },
  night: { color: '#2f3d8f', alpha: 0.58 },
};

/** Cor da hora do dia aplicada sobre a cena inteira (multiplica as cores). */
export function applyTint(env: SceneEnv, tint?: Tint): void {
  const { ctx } = env;
  const chosen = tint ?? DEFAULT_TINT[env.time];
  if (chosen.alpha <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = chosen.alpha;
  ctx.fillStyle = chosen.color;
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);
  ctx.restore();
}

/** Brilho das fontes de luz, em anéis (visual de pixel art) e somando cor. */
export function drawLights(env: SceneEnv, lights: Light[]): void {
  const { ctx } = env;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const light of lights) {
    if (!(light.at ?? ['night']).includes(env.time)) continue;
    const flicker = light.flicker
      ? 1 + Math.sin(env.t * 13 + light.x) * 0.05 + Math.sin(env.t * 7.3) * 0.03
      : 1;
    const [r, g, b] = light.color;
    const rings = 9;
    for (let i = 0; i < rings; i++) {
      const radius = light.radius * flicker * (1 - i / rings);
      ctx.fillStyle = `rgba(${r},${g},${b},${(light.intensity / rings) * 0.42})`;
      ctx.beginPath();
      ctx.arc(Math.round(light.x), Math.round(light.y), Math.max(1, radius), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
