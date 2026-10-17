import { rect, scrolled } from './draw';
import type { ExtraCharacter, Light, SceneDef, SceneEnv } from './types';

/**
 * Peças comuns dos níveis dos cenários (ver docs/CENARIOS.md): lista de objetos por nível, um
 * jeito único de posicioná-los (QG parado ou jornada rolando), separação entre o que fica atrás e
 * na frente do personagem pela altura dos pés, e atalhos para criar figurantes.
 */

export type BaseProp = {
  k: string;
  /** QG: posição na tela. Jornada: posição no mundo. */
  x: number;
  /** Altura dos pés (base do objeto). */
  y: number;
  /** Jornada: quanto rola em relação ao chão (menor que 1 para o que está longe). */
  f?: number;
  /** Jornada: ciclo próprio em px (padrão: o do cenário). Use ciclos longos para o que é raro. */
  p?: number;
};

export type PropKit<P extends BaseProp> = {
  /** Ciclo do mundo na jornada. */
  period: number;
  /** Objetos de cada nível no QG. */
  qg: Record<number, P[]>;
  /** Objetos de cada nível na jornada. */
  journey: Record<number, P[]>;
  draw: (env: SceneEnv, prop: P, x: number) => void;
  light?: (env: SceneEnv, prop: P, x: number) => Light | null;
};

export const clampLevel = (level: number, count: number): number =>
  Math.min(count, Math.max(1, Math.round(level)));

/** Posição de um objeto na tela, sempre em pixel inteiro. */
export function propX<P extends BaseProp>(env: SceneEnv, kit: PropKit<P>, prop: P): number {
  if (!env.journey) return Math.round(prop.x);
  return Math.round(scrolled(prop.x, env.scroll, prop.p ?? kit.period, prop.f ?? 1));
}

function propsOf<P extends BaseProp>(env: SceneEnv, kit: PropKit<P>, count: number): P[] {
  const table = env.journey ? kit.journey : kit.qg;
  return table[clampLevel(env.level, count)] ?? [];
}

/** Ganchos `levelItems` e `levelLights` de um cenário a partir da lista de objetos. */
export function propLayers<P extends BaseProp>(
  kit: PropKit<P>,
  count: number,
): Pick<SceneDef, 'levelItems' | 'levelLights'> {
  return {
    levelItems: (env) =>
      propsOf(env, kit, count).map((prop) => ({
        y: prop.y,
        draw: () => kit.draw(env, prop, propX(env, kit, prop)),
      })),
    levelLights: (env) => {
      if (!kit.light) return [];
      const out: Light[] = [];
      for (const prop of propsOf(env, kit, count)) {
        const light = kit.light(env, prop, propX(env, kit, prop));
        if (light) out.push(light);
      }
      return out;
    },
  };
}

/** Desenha um objeto maior a partir do pé dele: o desenho é feito na origem e ampliado. */
export function grown(env: SceneEnv, x: number, y: number, k: number, draw: () => void): void {
  env.ctx.save();
  env.ctx.translate(Math.round(x), Math.round(y));
  env.ctx.scale(k, k);
  draw();
  env.ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// Figurantes
// ---------------------------------------------------------------------------------------------

export type Look = Partial<ExtraCharacter['selection']>;

/** Gente comum para cenários do dia a dia. */
export const CASUAL: Look[] = [
  {
    bodyType: 'female',
    skin: 'amber',
    hair: 'hair-bangs-bun',
    hairColor: 'chestnut',
    torso: 'torso-tshirt',
    torsoColor: 'rose',
    legs: 'legs-pants',
    legsColor: 'navy',
    feet: 'feet-basic-shoes',
  },
  {
    bodyType: 'male',
    skin: 'light',
    hair: 'hair-buzzcut',
    hairColor: 'sandy',
    torso: 'torso-longsleeve-2',
    torsoColor: 'forest',
    legs: 'legs-pants',
    legsColor: 'charcoal',
    feet: 'feet-basic-shoes',
  },
  {
    bodyType: 'female',
    skin: 'brown',
    hair: 'hair-natural',
    hairColor: 'black',
    torso: 'torso-cardigan',
    torsoColor: 'yellow',
    legs: 'legs-leggings',
    legsColor: 'black',
    feet: 'feet-basic-shoes',
  },
  {
    bodyType: 'male',
    skin: 'bronze',
    hair: 'hair-curly-short',
    hairColor: 'dark_brown',
    torso: 'torso-tshirt',
    torsoColor: 'teal',
    legs: 'legs-shorts',
    legsColor: 'tan',
    feet: 'feet-sandals',
  },
  {
    bodyType: 'female',
    skin: 'light',
    hair: 'hair-bob',
    hairColor: 'blonde',
    torso: 'torso-sleeveless-2',
    torsoColor: 'sky',
    legs: 'legs-pants',
    legsColor: 'slate',
    feet: 'feet-basic-shoes',
  },
  {
    bodyType: 'male',
    skin: 'olive',
    hair: null,
    hairColor: 'black',
    torso: 'torso-tshirt',
    torsoColor: 'orange',
    legs: 'legs-pants',
    legsColor: 'navy',
    feet: 'feet-basic-shoes',
  },
  {
    bodyType: 'female',
    skin: 'taupe',
    hair: 'hair-half-up',
    hairColor: 'raven',
    torso: 'torso-longsleeve-2',
    torsoColor: 'lavender',
    legs: 'legs-pants',
    legsColor: 'white',
    feet: 'feet-basic-shoes',
  },
  {
    bodyType: 'male',
    skin: 'black',
    hair: 'hair-buzzcut',
    hairColor: 'black',
    torso: 'torso-tshirt',
    torsoColor: 'maroon',
    legs: 'legs-shorts',
    legsColor: 'blue',
    feet: 'feet-basic-shoes',
  },
];

/** Alguém parado, olhando para `direction`. */
export const stand = (
  look: Look,
  x: number,
  feetY: number,
  direction: ExtraCharacter['direction'],
): ExtraCharacter => ({ x, feetY, anim: 'idle', direction, selection: look });

/** QG: vai e volta entre dois pontos da tela. */
export const roamer = (
  look: Look,
  anim: 'walk' | 'run',
  from: number,
  to: number,
  speed: number,
  feetY: number,
): ExtraCharacter => ({
  x: from,
  feetY,
  anim,
  direction: 'right',
  selection: look,
  patrol: { from, to, speed },
});

/** Jornada: anda no mundo (`drift` em px/s; negativo vai para a esquerda). */
export const walker = (
  look: Look,
  anim: 'walk' | 'run',
  world: number,
  drift: number,
  feetY: number,
): ExtraCharacter => ({
  x: world,
  feetY,
  anim,
  direction: drift >= 0 ? 'right' : 'left',
  selection: look,
  drift,
});

/** Jornada: parado no mundo, com ciclo próprio quando acompanha um objeto raro. */
export const stander = (
  look: Look,
  world: number,
  feetY: number,
  direction: ExtraCharacter['direction'],
  period?: number,
): ExtraCharacter => ({
  x: world,
  feetY,
  anim: 'idle',
  direction,
  selection: look,
  ...(period === undefined ? {} : { period }),
});

// ---------------------------------------------------------------------------------------------
// Desenhos comuns
// ---------------------------------------------------------------------------------------------

/** Círculo cheio em pixels inteiros, linha a linha (sem serrilhado suave). */
export function disc(env: SceneEnv, cx: number, cy: number, r: number, color: string): void {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(r * r - dy * dy));
    rect(env, cx - half, cy + dy, half * 2 + 1, 1, color);
  }
}

const FLAGS = ['#e63946', '#ffc93c', '#2a9d8f', '#ff7a2e', '#6aa8e0', '#ff6fa8'];

/** Bandeirinhas penduradas num varal entre dois pontos de apoio (nunca soltas no ar). */
export function flagLine(
  env: SceneEnv,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  sag: number,
  phase = 0,
): void {
  const steps = Math.max(2, Math.round(Math.abs(x1 - x0) / 8));
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = Math.round(x0 + (x1 - x0) * u);
    const y = Math.round(y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag);
    if (x < -10 || x > SCENE_W_KIT + 10) continue;
    rect(env, x, y, 2, 1, '#14161c');
    if (i % 2 === 0) {
      const color = FLAGS[(i / 2 + phase) % FLAGS.length] ?? '#e63946';
      const swing = Math.round(Math.sin(env.t * 1.6 + i * 0.9 + phase));
      rect(env, x - 1 + swing, y + 1, 5, 2, color);
      rect(env, x + swing, y + 3, 3, 2, color);
      rect(env, x + 1 + swing, y + 5, 1, 1, color);
    }
  }
}

const SCENE_W_KIT = 390;

/** Fogos de artifício: cada explosão abre, cai e some. Só à noite. */
export function fireworks(env: SceneEnv, bursts: [number, number, string, number][]): void {
  if (env.time !== 'night') return;
  for (const [bx, by, color, offset] of bursts) {
    const p = ((env.t + offset) % 3.3) / 3.3;
    if (p > 0.75) continue;
    const radius = Math.min(1, p * 2.2) * 26;
    const fall = p * p * 16;
    env.ctx.globalAlpha = Math.max(0, 1 - p / 0.75);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      rect(env, bx + Math.cos(a) * radius, by + Math.sin(a) * radius + fall, 2, 2, color);
    }
    env.ctx.globalAlpha = 1;
  }
}

/** Balões amarrados num ponto: sobem e balançam devagar, presos por um fio. */
export function balloons(env: SceneEnv, x: number, y: number, colors: string[], phase = 0): void {
  colors.forEach((color, i) => {
    const sway = Math.round(Math.sin(env.t * 0.9 + phase + i * 1.7) * 1.5);
    const bx = x + (i - (colors.length - 1) / 2) * 7 + sway;
    const by = y - 22 - (i % 2) * 6;
    const length = Math.max(1, y - (by + 4));
    for (let k = 0; k <= length; k++)
      rect(env, x + ((bx - x) * k) / length, y - k, 1, 1, '#cfd2d8');
    disc(env, bx, by, 4, '#14161c');
    disc(env, bx, by, 3, color);
    rect(env, bx - 1, by - 2, 1, 1, '#ffffff');
  });
}
