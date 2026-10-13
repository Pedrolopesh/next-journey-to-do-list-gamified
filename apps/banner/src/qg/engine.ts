import {
  type AnimationName,
  buildRecolorMap,
  type Catalog,
  type Direction,
  FRAME,
  frameRect,
  layersFor,
  type LayerSpec,
  recolorPixels,
  type Selection,
} from './compose';
import { SCENES } from './scenes';
import { applyTint, drawLights, vignette } from './scenes/lighting';
import { SCENE_H, SCENE_W, type SceneEnv, type TimeOfDay } from './scenes/types';

const FPS: Record<AnimationName, number> = { idle: 2, walk: 9, run: 12 };
/** Velocidade do cenário (px lógicos por segundo) quando o personagem anda ou corre na jornada. */
const JOURNEY_SPEED: Record<AnimationName, number> = { idle: 0, walk: 34, run: 80 };
/** Paradas da jornada: o personagem chega ao fim depois deste número de corridas. */
export const JOURNEY_STOPS = 6;
const JOURNEY_START_X = 64;
const JOURNEY_END_X = 296;
/** Velocidade do personagem pela tela durante uma corrida (px lógicos por segundo). */
const JOURNEY_RUN_SPEED = 18;

/** Posição do personagem na tela em cada parada da jornada. */
export function journeyX(stop: number): number {
  const fraction = Math.min(1, Math.max(0, stop / JOURNEY_STOPS));
  return JOURNEY_START_X + (JOURNEY_END_X - JOURNEY_START_X) * fraction;
}
/** Folhas recoloridas guardadas em memória; passando disso, as mais antigas saem do cache. */
const MAX_CACHED_SHEETS = 64;

export type QgState = {
  selection: Selection;
  anim: AnimationName;
  direction: Direction;
  sceneId: string;
  time: TimeOfDay;
  /** Jornada: o personagem anda para a direita e o cenário rola para a esquerda atrás dele. */
  journey: boolean;
  /** Parada da jornada (0 a `JOURNEY_STOPS`); mudar o valor faz o personagem correr até lá. */
  stop: number;
};

export type QgEngineOptions = {
  canvas: HTMLCanvasElement;
  catalog: Catalog;
  /** Tiles de cenário (grama, água, lava...) já carregados, por nome. */
  tiles: Record<string, HTMLImageElement>;
  /** Endereço da folha de sprites de uma camada e animação (arquivo ou data URL). */
  sheetSrc: (path: string, anim: AnimationName) => string;
  initial: QgState;
  /** Limite de quadros por segundo (o WebView do app usa menos que o laboratório). */
  maxFps?: number;
  /** Maior fator inteiro de escala da resolução interna. */
  maxScale?: number;
};

export type QgEngine = {
  /** Estado mutável: o laboratório e o banner só mexem nestes campos. */
  state: QgState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** Põe o personagem direto numa parada da jornada, sem correr. */
  placeHero: (stop: number) => void;
  /** Recalcula a resolução interna (depois de mudar o tamanho do canvas). */
  resize: () => void;
  /** Resolve quando as folhas do estado atual estão prontas (útil para o primeiro quadro). */
  ready: () => Promise<void>;
};

export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error('falha ao carregar imagem'));
    };
    image.src = src;
  });

type ResolvedLayer = { spec: LayerSpec; sheet: HTMLCanvasElement };

function selectionKey(selection: Selection, anim: AnimationName): string {
  return [
    anim,
    selection.bodyType,
    selection.skin,
    selection.hair,
    selection.hairColor,
    selection.torso,
    selection.torsoColor,
    selection.legs,
    selection.legsColor,
    selection.feet,
    selection.feetColor,
  ].join('|');
}

/** Desenha o cenário do QG e o personagem LPC num canvas, em escala inteira e com limite de FPS. */
export function createQgEngine(options: QgEngineOptions): QgEngine {
  const { canvas, catalog, tiles, sheetSrc } = options;
  const maxFps = options.maxFps ?? 60;
  const maxScale = options.maxScale ?? 5;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sem canvas 2d');

  const state: QgState = options.initial;

  // ---- Folhas recoloridas (cache) ----
  const sheets = new Map<string, Promise<HTMLCanvasElement>>();
  const sheetFor = (spec: LayerSpec, anim: AnimationName): Promise<HTMLCanvasElement> => {
    const key = `${spec.path}|${anim}|${spec.material ?? ''}|${spec.color ?? ''}`;
    let sheet = sheets.get(key);
    if (!sheet) {
      sheet = loadImage(sheetSrc(spec.path, anim)).then((image) => {
        const layer = document.createElement('canvas');
        layer.width = image.width;
        layer.height = image.height;
        const layerCtx = layer.getContext('2d', { willReadFrequently: true });
        if (!layerCtx) throw new Error('sem canvas 2d');
        layerCtx.drawImage(image, 0, 0);
        const palette = spec.material ? catalog.palettes[spec.material] : null;
        const source = palette?.colors[palette.base];
        const target = spec.color ? palette?.colors[spec.color] : undefined;
        if (source && target && spec.color !== palette?.base) {
          const data = layerCtx.getImageData(0, 0, layer.width, layer.height);
          recolorPixels(data.data, buildRecolorMap(source, target));
          layerCtx.putImageData(data, 0, 0);
        }
        return layer;
      });
      sheets.set(key, sheet);
      // Cada folha recolorida ocupa cerca de 0,5 MB: sem limite, trocar a aparência muitas vezes
      // (sorteio, cores) faria o WebView crescer sem parar
      if (sheets.size > MAX_CACHED_SHEETS) {
        const oldest = sheets.keys().next();
        if (!oldest.done) sheets.delete(oldest.value);
      }
    }
    return sheet;
  };

  const resolveLayers = async (
    selection: Selection,
    anim: AnimationName,
  ): Promise<ResolvedLayer[]> => {
    const specs = layersFor(catalog, selection);
    return Promise.all(specs.map(async (spec) => ({ spec, sheet: await sheetFor(spec, anim) })));
  };

  // ---- Camadas prontas do personagem e dos figurantes, atualizadas quando o estado muda ----
  let hero: ResolvedLayer[] = [];
  let heroAnim: AnimationName = state.anim;
  let extras: { layers: ResolvedLayer[]; index: number }[] = [];
  let resolvedKey = '';
  let resolving: Promise<void> = Promise.resolve();

  let heroX = journeyX(state.stop);
  const moving = (): boolean => Math.abs(journeyX(state.stop) - heroX) > 0.5;
  const arrived = (): boolean => state.stop >= JOURNEY_STOPS && !moving();
  /** Animação em cena: na jornada, correr enquanto avança e parar ao chegar ao fim. */
  const currentAnim = (): AnimationName => {
    if (!state.journey) return state.anim;
    if (moving()) return 'run';
    return arrived() ? 'idle' : state.anim;
  };

  const sync = (): Promise<void> => {
    const def = SCENES.find((scene) => scene.id === state.sceneId) ?? SCENES[0];
    const anim = currentAnim();
    const key = `${state.sceneId}|${selectionKey(state.selection, anim)}`;
    if (key === resolvedKey) return resolving;
    resolvedKey = key;
    const run = async (): Promise<void> => {
      const nextHero = await resolveLayers(state.selection, anim);
      const nextExtras = await Promise.all(
        (def?.extras ?? []).map(async (extra, index) => ({
          index,
          layers: await resolveLayers({ ...state.selection, ...extra.selection }, extra.anim),
        })),
      );
      // Só aplica se o estado não mudou de novo enquanto carregava
      if (resolvedKey === key) {
        hero = nextHero;
        heroAnim = anim;
        extras = nextExtras;
      }
    };
    resolving = run()
      .then(() => {
        // Aquece a animação de correr (usada ao comemorar um check) sem travar o primeiro quadro
        if (anim !== 'run') void resolveLayers(state.selection, 'run').catch(() => undefined);
      })
      .catch(() => undefined);
    return resolving;
  };

  // ---- Resolução interna: fator inteiro para sprites nítidos e o resto suave ----
  let scale = 1;
  const resize = (): void => {
    const wanted = (canvas.clientWidth || SCENE_W) * (window.devicePixelRatio || 1);
    scale = Math.min(maxScale, Math.max(2, Math.round(wanted / SCENE_W)));
    canvas.width = SCENE_W * scale;
    canvas.height = SCENE_H * scale;
  };
  resize();

  const drawCharacter = (
    layers: ResolvedLayer[],
    anim: AnimationName,
    direction: Direction,
    x: number,
    feetY: number,
    clock: number,
  ): void => {
    const index = Math.floor(clock * FPS[anim]) % catalog.animations[anim];
    const { sy } = frameRect(direction, 0);
    // Sombra suave no chão, embaixo dos pés
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, feetY - 1, 13, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Nos quadros LPC os pés ficam perto da linha 60 de 64
    for (const { sheet } of layers) {
      ctx.drawImage(
        sheet,
        index * FRAME,
        sy,
        FRAME,
        FRAME,
        Math.round(x - FRAME / 2),
        Math.round(feetY - 60),
        FRAME,
        FRAME,
      );
    }
  };

  const draw = (clock: number): void => {
    const def = SCENES.find((scene) => scene.id === state.sceneId) ?? SCENES[0];
    if (!def) return;
    const walking = state.journey && def.journey !== undefined;
    const env: SceneEnv = {
      ctx,
      time: state.time,
      t: clock,
      scroll,
      tiles,
      journey: walking,
      arrivedFor: arrived() ? clock - arrivedAt : null,
    };
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false; // sprites e tiles continuam nítidos
    ctx.clearRect(0, 0, SCENE_W, SCENE_H);
    (walking ? def.journey : def.back)?.(env);
    if (!walking) {
      for (const { layers, index } of extras) {
        const extra = def.extras?.[index];
        if (extra) drawCharacter(layers, extra.anim, extra.direction, extra.x, extra.feetY, clock);
      }
    }
    const direction = state.journey ? 'right' : state.direction;
    const heroPosition = state.journey ? heroX : SCENE_W / 2;
    drawCharacter(hero, heroAnim, direction, heroPosition, def.groundY, clock);
    if (!walking) def.front?.(env);
    applyTint(env, def.tint?.[state.time]);
    drawLights(env, def.lights?.(env) ?? []);
    vignette(env);
  };

  // ---- Laço de animação ----
  let raf = 0;
  let running = false;
  let last = performance.now();
  let clock = 0;
  let lastDraw = 0;
  let scroll = 0;
  let arrivedAt = 0;
  let wasArrived = false;
  const minGap = 1000 / maxFps - 1;

  const tick = (now: number): void => {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.25, (now - last) / 1000);
    clock += dt;
    last = now;
    if (state.journey) {
      const target = journeyX(state.stop);
      if (moving())
        heroX +=
          Math.sign(target - heroX) * Math.min(Math.abs(target - heroX), JOURNEY_RUN_SPEED * dt);
      else heroX = target;
      scroll += JOURNEY_SPEED[currentAnim()] * dt;
      const isArrived = arrived();
      if (isArrived && !wasArrived) arrivedAt = clock;
      wasArrived = isArrived;
    }
    if (now - lastDraw < minGap) return;
    lastDraw = now;
    void sync();
    draw(clock);
  };

  const play = (): void => {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  return {
    state,
    start: play,
    resume: play,
    pause() {
      running = false;
      cancelAnimationFrame(raf);
    },
    placeHero(stop) {
      state.stop = stop;
      heroX = journeyX(stop);
    },
    resize,
    ready: () => sync(),
  };
}
