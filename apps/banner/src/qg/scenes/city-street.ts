import { rect, scrolled } from './draw';
import { drawLampPost, type Lamp, lampHead } from './lampposts';
import type { Light, SceneEnv } from './types';
import { SCENE_W } from './types';

/** Linhas da avenida (y de tela). O personagem anda na calçada, com os pés em `groundY` da cena. */
export const FAR_SIDEWALK = 140;
export const ROAD_TOP = 146;
export const ROAD_MID = 163;
export const CURB = 179;
const SIDEWALK_END = 220;
const LAMP_BASE = 188;
const STOP_BASE = 188;
const OUT = '#14161c';

/** Período (px de distância) em que postes e ponto de ônibus se repetem. */
export const STREET_PERIOD = 900;
export const LAMP_WORLD = [80, 380, 680];
const BUS_STOP_WORLD = 520;

const LAMPS_SCREEN = (env: SceneEnv): Lamp[] =>
  LAMP_WORLD.map((world) => ({
    x: Math.round(scrolled(world, env.scroll, STREET_PERIOD)),
    baseY: LAMP_BASE,
    h: 60,
    dir: 1 as const,
  })).filter((lamp) => lamp.x > -30 && lamp.x < SCENE_W + 30);

/** Asfalto de duas faixas, meio-fio e calçada com juntas que passam sob os pés. */
export function ground(env: SceneEnv): void {
  const night = env.time === 'night';
  rect(env, 0, FAR_SIDEWALK, SCENE_W, ROAD_TOP - FAR_SIDEWALK, night ? '#5a5d66' : '#a8a59f');
  rect(env, 0, ROAD_TOP - 1, SCENE_W, 1, 'rgba(0,0,0,0.3)');
  rect(env, 0, ROAD_TOP, SCENE_W, CURB - ROAD_TOP, night ? '#34363d' : '#4c4f57');
  rect(env, 0, ROAD_TOP + 1, SCENE_W, 1, 'rgba(255,255,255,0.08)');
  // Faixa tracejada: anda com a calçada
  const dash = 24;
  const start = -(((env.scroll % dash) + dash) % dash);
  for (let x = start; x < SCENE_W; x += dash) rect(env, x, ROAD_MID, 12, 1, '#e6dfae');
  // Meio-fio e calçada
  rect(env, 0, CURB, SCENE_W, 3, '#d2cfc6');
  rect(env, 0, CURB, SCENE_W, 1, '#ece9e0');
  rect(env, 0, CURB + 3, SCENE_W, 1, 'rgba(0,0,0,0.3)');
  rect(env, 0, CURB + 4, SCENE_W, SIDEWALK_END - CURB - 4, '#bdb9b0');
  rect(env, 0, CURB + 4, SCENE_W, 2, '#c8c4bb');
  const joint = 'rgba(70,66,60,0.35)';
  rect(env, 0, 198, SCENE_W, 1, joint);
  rect(env, 0, 211, SCENE_W, 1, joint);
  const paver = 30;
  const first = -(((env.scroll % paver) + paver) % paver);
  for (let x = first; x < SCENE_W; x += paver) {
    rect(env, x, CURB + 4, 1, 198 - CURB - 4, joint);
    rect(env, x + 15, 198, 1, 13, joint);
    rect(env, x, 211, 1, SIDEWALK_END - 211, joint);
  }
}

type Model = 'hatch' | 'sedan' | 'van';
type Car = {
  x: number;
  y: number;
  dir: 1 | -1;
  model: Model;
  color: string;
  /** Tamanho do desenho: a faixa de trás é um pouco menor, para dar profundidade. */
  scale: number;
};

const MODELS: readonly Model[] = ['hatch', 'sedan', 'van'];
const CAR_COLORS = [
  '#d93a3a',
  '#2f6fe0',
  '#f2c230',
  '#2faa5a',
  '#f2f2f2',
  '#2b2f3a',
  '#e07a2f',
  '#8e4fd1',
  '#b8bec9',
  '#17a2b8',
];
/** Comprimento de cada modelo em unidades (multiplicado pela escala da faixa). */
const LENGTH: Record<Model, number> = { hatch: 28, sedan: 34, van: 34 };

/** Faixa da avenida: a de cima vai com o personagem; a de baixo vem contra. */
const LANES = [
  { y: ROAD_MID - 2, dir: 1 as const, speed: 110, offset: 0, scale: 2.3 },
  { y: CURB - 6, dir: -1 as const, speed: 130, offset: 700, scale: 2.8 },
];
const TRAFFIC_PERIOD = 1700;
const SLOTS = 3;

/** Número fixo entre 0 e 1 para a mesma entrada: modelo, cor e ausência do carro sem sortear a cada quadro. */
function hash(a: number, b: number, c: number): number {
  let h = Math.imul((a * 73856093) ^ (b * 19349663) ^ (c * 83492791), 2654435761);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** Carros visíveis agora. A posição soma o movimento do carro e o deslocamento do cenário. */
export function traffic(env: SceneEnv): Car[] {
  const out: Car[] = [];
  LANES.forEach((lane, laneIndex) => {
    for (let slot = 0; slot < SLOTS; slot++) {
      const raw =
        lane.offset + slot * (TRAFFIC_PERIOD / SLOTS) + lane.dir * lane.speed * env.t - env.scroll;
      const cycle = Math.floor((raw + 120) / TRAFFIC_PERIOD);
      const seed = slot * 7 + laneIndex * 3;
      if (hash(seed, cycle, 1) > 0.8) continue;
      const model = MODELS[Math.floor(hash(seed, cycle, 2) * MODELS.length)] ?? 'hatch';
      const color = CAR_COLORS[Math.floor(hash(seed, cycle, 3) * CAR_COLORS.length)] ?? '#d93a3a';
      const x = raw - cycle * TRAFFIC_PERIOD - 120 + (hash(seed, cycle, 4) - 0.5) * 80;
      if (x < -130 || x > SCENE_W + 10) continue;
      out.push({ x, y: lane.y, dir: lane.dir, model, color, scale: lane.scale });
    }
  });
  return out;
}

function mix(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const part = (shift: number): number => {
    const v = (n >> shift) & 255;
    return Math.max(
      0,
      Math.min(255, Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))),
    );
  };
  return `rgb(${part(16)},${part(8)},${part(0)})`;
}

type Part = [dx: number, dy: number, w: number, h: number, kind: 'body' | 'glass'];

/** Peças de cada modelo, de lado e virado para a direita; y sobe a partir das rodas (em unidades). */
const SHAPES: Record<Model, Part[]> = {
  hatch: [
    [0, -8, 28, 5, 'body'],
    [5, -12, 15, 4, 'body'],
    [6, -11, 6, 3, 'glass'],
    [13, -11, 6, 3, 'glass'],
  ],
  sedan: [
    [0, -8, 34, 5, 'body'],
    [9, -12, 16, 4, 'body'],
    [10, -11, 6, 3, 'glass'],
    [17, -11, 7, 3, 'glass'],
  ],
  van: [
    [0, -15, 27, 12, 'body'],
    [27, -9, 7, 6, 'body'],
    [3, -14, 5, 4, 'glass'],
    [10, -14, 5, 4, 'glass'],
    [21, -14, 5, 5, 'glass'],
  ],
};
const WHEELS: Record<Model, [number, number]> = { hatch: [6, 22], sedan: [7, 27], van: [7, 27] };

/** Roda redonda com pneu, aro e cubo. */
function wheel(env: SceneEnv, cx: number, cy: number, radius: number): void {
  const { ctx } = env;
  ctx.fillStyle = OUT;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#25262d';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b8bcc6';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6a6e78';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function drawCar(env: SceneEnv, car: Car): void {
  const S = car.scale;
  const length = Math.round(LENGTH[car.model] * S);
  const flip = (dx: number, w: number): number =>
    Math.round(car.x + (car.dir > 0 ? dx * S : length - (dx + w) * S));
  const shape = SHAPES[car.model];
  // sombra no asfalto
  rect(env, car.x + 3, car.y - 1, length - 6, 3, 'rgba(0,0,0,0.28)');
  for (const [dx, dy, w, h, kind] of shape) {
    if (kind === 'body') rect(env, flip(dx, w) - 1, car.y + dy * S - 1, w * S + 2, h * S + 2, OUT);
  }
  const wheelR = Math.round(2.6 * S);
  const wheelY = car.y - wheelR;
  for (const wx of WHEELS[car.model]) {
    // cava da roda escura por baixo da carroceria
    rect(env, flip(wx - 3.2, 6.4), wheelY - wheelR - 2, Math.round(6.4 * S), wheelR + 6, OUT);
  }
  for (const [dx, dy, w, h, kind] of shape) {
    if (kind === 'body') {
      rect(env, flip(dx, w), car.y + dy * S, w * S, h * S, car.color);
      rect(env, flip(dx, w), car.y + dy * S, w * S, 2, mix(car.color, 0.38));
    } else {
      rect(env, flip(dx, w), car.y + dy * S, w * S, h * S, '#9fd4f0');
      rect(env, flip(dx, w), car.y + dy * S, w * S, 2, '#e4f5fd');
      rect(env, flip(dx, w), car.y + dy * S + h * S - 2, w * S, 2, '#6aa6c8');
    }
  }
  // faixa escura da parte de baixo, soleira e linhas das portas
  const lowerTop = car.model === 'van' ? -15 : -8;
  const lowerH = car.model === 'van' ? 12 : 5;
  rect(env, flip(0, LENGTH[car.model]), car.y - 3.2 * S, length, 2, mix(car.color, -0.35));
  rect(
    env,
    flip(0, LENGTH[car.model]),
    car.y + (lowerTop + lowerH * 0.55) * S,
    length,
    1,
    mix(car.color, -0.2),
  );
  const seams = car.model === 'van' ? [9, 17] : [9, 18];
  for (const sx of seams) {
    rect(
      env,
      flip(sx, 0.4),
      car.y + lowerTop * S,
      1,
      Math.round(lowerH * S) - 2,
      mix(car.color, -0.45),
    );
    rect(
      env,
      flip(sx + 1, 2),
      car.y + (lowerTop + 1.4) * S,
      Math.round(1.2 * S),
      2,
      mix(car.color, 0.5),
    );
  }
  for (const wx of WHEELS[car.model])
    wheel(env, flip(wx - 0.2, 0) + Math.round(wheelR * 0.0), wheelY, wheelR);
  // faróis e lanternas, para-choques
  const frontX = car.dir > 0 ? car.x + length - 5 : car.x;
  const rearX = car.dir > 0 ? car.x : car.x + length - 3;
  rect(env, frontX, car.y + (lowerTop + lowerH * 0.2) * S, 5, 4, '#fff2b0');
  rect(env, rearX, car.y + (lowerTop + lowerH * 0.2) * S, 3, 5, '#e0302c');
  rect(env, car.dir > 0 ? car.x + length - 3 : car.x, car.y - 4.2 * S, 3, 3, '#6a6e78');
  rect(env, car.dir > 0 ? car.x : car.x + length - 3, car.y - 4.2 * S, 3, 3, '#6a6e78');
}

export function drawTraffic(env: SceneEnv, lane: 'far' | 'near'): void {
  const y = lane === 'far' ? LANES[0]?.y : LANES[1]?.y;
  for (const car of traffic(env)) if (car.y === y) drawCar(env, car);
}

/** Onde o ônibus fica parado: no meio-fio, junto do ponto (anda com a calçada). */
const BUS_LENGTH = 124;
const BUS_BASE = CURB - 2;

function busLeft(env: SceneEnv): number {
  const margin = 220;
  const center =
    ((((BUS_STOP_WORLD - env.scroll + margin) % STREET_PERIOD) + STREET_PERIOD) % STREET_PERIOD) -
    margin;
  return Math.round(center - BUS_LENGTH / 2);
}

/** Roda de ônibus: cava escura (só acima do chão), pneu, aro e cubo. */
function busWheel(env: SceneEnv, cx: number, y: number): void {
  for (let dy = -9; dy <= 0; dy++) {
    const half = Math.round(Math.sqrt(81 - dy * dy));
    rect(env, cx - half, y - 8 + dy, half * 2 + 1, 1, OUT);
  }
  const { ctx } = env;
  const ring = (r: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + 0.5, y - 7.5, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ring(7, '#1b1d24');
  ring(4, '#aab0ba');
  ring(2, '#5b616c');
}

/**
 * Ônibus parado no ponto, virado para a esquerda (mão da faixa de baixo): carroceria longa com
 * para-brisa, porta da frente, fileira de janelas, listra, letreiro e duas rodas nas cavas.
 * Desenhado por último na rua: os carros passam atrás.
 */
export function drawBus(env: SceneEnv): void {
  const x = busLeft(env);
  if (x > SCENE_W + 10 || x + BUS_LENGTH < -10) return;
  const night = env.time === 'night';
  const body = '#2f6fe0';
  const glass = night ? '#ffe9a8' : '#9fd4f0';
  const glassTop = night ? '#fff6d0' : '#e4f5fd';
  const y = BUS_BASE;
  const L = BUS_LENGTH;
  rect(env, x + 6, y - 1, L - 12, 3, 'rgba(0,0,0,0.3)');
  // carroceria com contorno, teto mais claro e saia escura
  rect(env, x - 1, y - 49, L + 2, 44, OUT);
  rect(env, x, y - 48, L, 42, body);
  rect(env, x + 2, y - 48, L - 4, 2, mix(body, 0.4));
  rect(env, x, y - 17, L, 3, '#f4f4f6');
  rect(env, x, y - 12, L, 6, mix(body, -0.4));
  // ar-condicionado no teto
  rect(env, x + 56, y - 53, 38, 5, OUT);
  rect(env, x + 57, y - 52, 36, 3, '#c9ced6');
  // para-brisa grande na frente e letreiro do destino
  rect(env, x + 2, y - 43, 15, 26, glass);
  rect(env, x + 2, y - 43, 15, 2, glassTop);
  rect(env, x + 9, y - 43, 1, 26, body);
  rect(env, x + 3, y - 47, 13, 4, OUT);
  for (let k = 0; k < 4; k++) rect(env, x + 4 + k * 3, y - 46, 2, 2, '#ffb000');
  // porta da frente (duas folhas) e janelas laterais
  rect(env, x + 19, y - 43, 12, 36, OUT);
  rect(env, x + 20, y - 42, 5, 34, glass);
  rect(env, x + 26, y - 42, 4, 34, glass);
  rect(env, x + 20, y - 42, 10, 2, glassTop);
  for (let i = 0; i < 6; i++) {
    const wx = x + 35 + i * 14;
    rect(env, wx, y - 42, 11, 19, glass);
    rect(env, wx, y - 42, 11, 2, glassTop);
  }
  // rodas nas cavas, faróis, lanterna e para-choque
  busWheel(env, x + 24, y);
  busWheel(env, x + L - 26, y);
  rect(env, x - 2, y - 9, 3, 3, '#2a2d36');
  rect(env, x, y - 15, 3, 4, '#fff2b0');
  rect(env, x + L - 3, y - 15, 3, 5, '#e0302c');
}

/** Ponto de ônibus: abrigo com vidro, banco e placa azul com o ônibus desenhado. */
function busStop(env: SceneEnv, x: number): void {
  const night = env.time === 'night';
  const top = STOP_BASE - 38;
  rect(env, x + 3, top + 4, 50, 28, night ? 'rgba(120,170,220,0.3)' : 'rgba(170,215,245,0.4)');
  rect(env, x + 3, top + 4, 50, 1, 'rgba(255,255,255,0.45)');
  for (const px of [x, x + 54]) {
    rect(env, px - 1, top, 4, 38, OUT);
    rect(env, px, top, 2, 38, '#6c7380');
  }
  rect(env, x - 4, top - 3, 65, 5, OUT);
  rect(env, x - 3, top - 2, 63, 3, '#3d6fb5');
  rect(env, x - 3, top - 2, 63, 1, '#7aa6e0');
  rect(env, x + 10, STOP_BASE - 13, 38, 4, OUT);
  rect(env, x + 11, STOP_BASE - 12, 36, 2, '#b07a44');
  rect(env, x + 13, STOP_BASE - 9, 2, 9, '#4c525e');
  rect(env, x + 43, STOP_BASE - 9, 2, 9, '#4c525e');
  // placa
  rect(env, x + 63, STOP_BASE - 52, 3, 52, OUT);
  rect(env, x + 64, STOP_BASE - 52, 1, 52, '#8a909c');
  rect(env, x + 56, STOP_BASE - 62, 18, 15, OUT);
  rect(env, x + 57, STOP_BASE - 61, 16, 13, '#2a6fd6');
  rect(env, x + 59, STOP_BASE - 59, 12, 7, '#ffffff');
  rect(env, x + 60, STOP_BASE - 58, 4, 3, '#2a6fd6');
  rect(env, x + 65, STOP_BASE - 58, 4, 3, '#2a6fd6');
  rect(env, x + 60, STOP_BASE - 50, 2, 2, '#ffffff');
  rect(env, x + 68, STOP_BASE - 50, 2, 2, '#ffffff');
  if (night) rect(env, x + 4, top + 1, 48, 1, '#fff3b8');
}

/** Calçada: postes e ponto de ônibus, desenhados atrás do personagem. */
export function sidewalkProps(env: SceneEnv): void {
  busStop(env, Math.round(scrolled(BUS_STOP_WORLD, env.scroll, STREET_PERIOD)) - 28);
  for (const lamp of LAMPS_SCREEN(env)) drawLampPost(env, lamp);
}

/** Luzes da noite: postes, o ponto de ônibus e os faróis dos carros. */
export function streetLights(env: SceneEnv): Light[] {
  const out: Light[] = [];
  for (const lamp of LAMPS_SCREEN(env)) {
    const head = lampHead(lamp);
    out.push({ x: head.x, y: head.y, radius: 26, color: [255, 236, 160], intensity: 0.9 });
    out.push({ x: head.x, y: LAMP_BASE - 6, radius: 60, color: [255, 232, 170], intensity: 0.42 });
  }
  const stop = scrolled(BUS_STOP_WORLD, env.scroll, STREET_PERIOD);
  out.push({ x: stop, y: STOP_BASE - 34, radius: 48, color: [255, 240, 190], intensity: 0.5 });
  for (const car of traffic(env)) {
    const length = LENGTH[car.model] * car.scale;
    const front = car.dir > 0 ? car.x + length + 8 : car.x - 8;
    out.push({ x: front, y: car.y - 9, radius: 44, color: [255, 238, 180], intensity: 0.75 });
  }
  const bus = busLeft(env);
  out.push({ x: bus + 20, y: BUS_BASE - 14, radius: 44, color: [255, 238, 180], intensity: 0.7 });
  out.push({
    x: bus + BUS_LENGTH / 2,
    y: BUS_BASE - 34,
    radius: 70,
    color: [255, 235, 170],
    intensity: 0.4,
  });
  return out.filter((light) => light.x > -80 && light.x < SCENE_W + 80);
}
