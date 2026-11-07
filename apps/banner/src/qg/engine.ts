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
import { extrasOf, followSpot, journeySpot, patrolSpot } from './extras';
import { SCENES } from './scenes';
import { applyTint, drawLights, vignette } from './scenes/lighting';
import { SCENE_H, SCENE_W, type SceneEnv, type TimeOfDay } from './scenes/types';

const FPS: Record<AnimationName, number> = { idle: 2, walk: 9, run: 12 };
/** Scenery speed (logical px per second) when the character walks or runs on the journey. */
const JOURNEY_SPEED: Record<AnimationName, number> = { idle: 0, walk: 34, run: 80 };
/** Journey stops: the character reaches the end after this number of runs. */
export const JOURNEY_STOPS = 6;
const JOURNEY_START_X = 64;
const JOURNEY_END_X = 296;
/** Character speed across the screen during a run (logical px per second). */
const JOURNEY_RUN_SPEED = 18;

/** Character position on the screen at each journey stop. */
export function journeyX(stop: number): number {
  const fraction = Math.min(1, Math.max(0, stop / JOURNEY_STOPS));
  return JOURNEY_START_X + (JOURNEY_END_X - JOURNEY_START_X) * fraction;
}
/** Recolored sheets kept in memory; past this, the oldest ones leave the cache. */
const MAX_CACHED_SHEETS = 64;

export type QgState = {
  selection: Selection;
  anim: AnimationName;
  direction: Direction;
  sceneId: string;
  time: TimeOfDay;
  /** Journey: the character walks to the right and the scenery scrolls left behind them. */
  journey: boolean;
  /** Journey stop (0 to `JOURNEY_STOPS`); changing the value makes the character run there. */
  stop: number;
  /** Scenery level (1 to `SceneDef.levels`). */
  level: number;
};

export type QgEngineOptions = {
  canvas: HTMLCanvasElement;
  catalog: Catalog;
  /** Scenery tiles (grass, water, lava...) already loaded, by name. */
  tiles: Record<string, HTMLImageElement>;
  /** Address of the sprite sheet for a layer and animation (file or data URL). */
  sheetSrc: (path: string, anim: AnimationName) => string;
  initial: QgState;
  /** Frames per second limit (the app WebView uses less than the lab). */
  maxFps?: number;
  /** Largest integer scale factor of the internal resolution. */
  maxScale?: number;
};

export type QgEngine = {
  /** Mutable state: the lab and the banner only touch these fields. */
  state: QgState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** Puts the character straight at a journey stop, without running. */
  placeHero: (stop: number) => void;
  /** Recomputes the internal resolution (after changing the canvas size). */
  resize: () => void;
  /** Resolves when the sheets of the current state are ready (useful for the first frame). */
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
    selection.hat ?? '',
    selection.arms ?? '',
  ].join('|');
}

/** Draws the HQ scenery and the LPC character on a canvas, at integer scale and with an FPS limit. */
export function createQgEngine(options: QgEngineOptions): QgEngine {
  const { canvas, catalog, tiles, sheetSrc } = options;
  const maxFps = options.maxFps ?? 60;
  const maxScale = options.maxScale ?? 5;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sem canvas 2d');

  const state: QgState = options.initial;

  // ---- Recolored sheets (cache) ----
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
      // Each recolored sheet takes about 0.5 MB: without a limit, changing the appearance many times
      // (random draw, colors) would make the WebView grow endlessly
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

  // ---- Ready-made layers of the character and the extras, updated when the state changes ----
  let hero: ResolvedLayer[] = [];
  let heroAnim: AnimationName = state.anim;
  let extras: { layers: ResolvedLayer[]; index: number }[] = [];
  let resolvedKey = '';
  let resolving: Promise<void> = Promise.resolve();

  let heroX = journeyX(state.stop);
  const moving = (): boolean => Math.abs(journeyX(state.stop) - heroX) > 0.5;
  const arrived = (): boolean => state.stop >= JOURNEY_STOPS && !moving();
  /** Animation on stage: on the journey, run while advancing and stop on reaching the end. */
  const currentAnim = (): AnimationName => {
    if (!state.journey) return state.anim;
    if (moving()) return 'run';
    return arrived() ? 'idle' : state.anim;
  };

  const sync = (): Promise<void> => {
    const def = SCENES.find((scene) => scene.id === state.sceneId) ?? SCENES[0];
    const anim = currentAnim();
    const walks = state.journey && def?.journey !== undefined;
    // The extras (guards, wizards, nobles) come from the scene and level, which are already in the key: their look only
    // changes when the scene or level changes. Changing `extra.selection` without that would leave stale layers.
    const key = `${state.sceneId}|${state.level}|${walks ? 'j' : 'q'}|${selectionKey(state.selection, anim)}`;
    if (key === resolvedKey) return resolving;
    resolvedKey = key;
    const run = async (): Promise<void> => {
      const nextHero = await resolveLayers(state.selection, anim);
      const nextExtras = await Promise.all(
        (def ? extrasOf(def, state.level, walks) : []).map(async (extra, index) => ({
          index,
          // The hero's hat and arms do not pass to the extras: each extra declares its own
          layers: await resolveLayers(
            { ...state.selection, hat: null, arms: null, ...extra.selection },
            extra.anim,
          ),
        })),
      );
      // Only applies if the state did not change again while loading
      if (resolvedKey === key) {
        hero = nextHero;
        heroAnim = anim;
        extras = nextExtras;
      }
    };
    resolving = run()
      .then(() => {
        // Warms up the run animation (used when celebrating a check) without blocking the first frame
        if (anim !== 'run') void resolveLayers(state.selection, 'run').catch(() => undefined);
      })
      .catch(() => undefined);
    return resolving;
  };

  // ---- Internal resolution: integer factor for crisp sprites and the rest smooth ----
  let scale = 1;
  const resize = (): void => {
    const wanted = (canvas.clientWidth || SCENE_W) * (window.devicePixelRatio || 1);
    scale = Math.min(maxScale, Math.max(2, Math.round(wanted / SCENE_W)));
    // Resizing clears the canvas: only touch it when the size really changes
    if (canvas.width !== SCENE_W * scale) canvas.width = SCENE_W * scale;
    if (canvas.height !== SCENE_H * scale) canvas.height = SCENE_H * scale;
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
    // Soft shadow on the ground, under the feet
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, feetY - 1, 13, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // In the LPC frames the feet sit near line 60 of 64
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
      level: state.level,
    };
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false; // sprites and tiles stay crisp
    ctx.clearRect(0, 0, SCENE_W, SCENE_H);
    (walking ? def.journey : def.back)?.(env);
    const list = extrasOf(def, state.level, walking);
    // Everything that has a ground position (level objects, extras and the character) is drawn in the order of
    // foot height: whatever is higher on the screen goes behind whatever is lower
    const drawables: { y: number; draw: () => void }[] = def.levelItems?.(env) ?? [];
    for (const { layers, index } of extras) {
      const extra = list[index];
      if (!extra) continue;
      drawables.push({
        y: extra.feetY,
        draw: () => {
          let spot = { x: extra.x, direction: extra.direction };
          if (walking && extra.follow) spot = followSpot(extra.follow, heroX, clock, chase);
          else if (walking) spot = journeySpot(extra, scroll, clock, def.journeyPeriod ?? 820);
          else if (extra.patrol) spot = patrolSpot(extra.patrol, clock);
          drawCharacter(layers, extra.anim, spot.direction, spot.x, extra.feetY, clock);
        },
      });
    }
    const direction = state.journey ? 'right' : state.direction;
    const heroPosition = state.journey ? heroX : SCENE_W / 2;
    drawables.push({
      y: def.groundY,
      draw: () => drawCharacter(hero, heroAnim, direction, heroPosition, def.groundY, clock),
    });
    drawables.sort((p, q) => p.y - q.y);
    for (const item of drawables) item.draw();
    if (!walking) def.front?.(env);
    applyTint(env, def.tint?.[state.time]);
    drawLights(env, [...(def.lights?.(env) ?? []), ...(def.levelLights?.(env) ?? [])]);
    vignette(env);
  };

  // ---- Animation loop ----
  let raf = 0;
  let running = false;
  let last = performance.now();
  let clock = 0;
  let lastDraw = 0;
  let scroll = 0;
  /** 0 to 1: how far the extras running with the character have entered the scene. */
  let chase = 0;
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
      chase += ((JOURNEY_SPEED[currentAnim()] > 0 ? 1 : 0) - chase) * Math.min(1, dt * 2.5);
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
