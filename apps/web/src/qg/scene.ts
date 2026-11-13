import './qg.css';

import type { CharacterLayers } from '@nextjourney/contracts';

import { catalog, loadTiles, sheetSrc } from './assets';
import { selectionFromLayers } from './character-map';
import { createQgEngine, JOURNEY_STOPS, type QgEngine } from './engine';
import { SCENES } from './scenes';
import type { TimeOfDay } from './scenes/types';

const QG_DEFAULT_SCENE = 'cabin';
const CELEBRATE_MS = 1500;

export type QgScene = {
  /** Shows the HQ (hides the Map) and starts animating. */
  show: () => void;
  /** Hides the HQ and stops the animation loop. */
  hide: () => void;
  setScene: (sceneId: string) => void;
  /** Journey: the character walks left and the scenery scrolls (item tabs). */
  setJourney: (journey: boolean) => void;
  setTime: (time: TimeOfDay) => void;
  setCharacter: (layers: CharacterLayers) => void;
  /** Chapter progress (0 to 1): on the journey it becomes the character's stop. */
  setProgress: (progress: number, options?: { animate?: boolean }) => void;
  /** Check done: the character celebrates; on the journey, runs to the stop of the new progress. */
  celebrate: (progress: number) => void;
  pause: () => void;
  resume: () => void;
  fadeOut: () => void;
  fadeIn: () => void;
};

/** Journey stop (0 to `JOURNEY_STOPS`) for the chapter progress. */
export function stopFor(progress: number): number {
  if (progress >= 1) return JOURNEY_STOPS;
  return Math.max(0, Math.floor(progress * JOURNEY_STOPS));
}

function isQgSceneId(id: string): boolean {
  return SCENES.some((scene) => scene.id === id);
}

/**
 * HQ (Home) scene: canvas scenery with the LPC character. The engine is only created (and the art only
 * decoded) the first time the HQ is shown, so the Map tabs do not pay for it.
 */
export function createQgScene(root: HTMLElement): QgScene {
  const host = document.createElement('div');
  host.className = 'qg';
  const canvas = document.createElement('canvas');
  canvas.className = 'qg-canvas';
  const fade = document.createElement('div');
  fade.className = 'qg-fade';
  host.append(canvas, fade);
  root.append(host);

  let engine: QgEngine | null = null;
  let loading: Promise<void> | null = null;
  let visible = false;
  let paused = false;
  let celebrateTimer: ReturnType<typeof setTimeout> | undefined;

  const pending = {
    sceneId: QG_DEFAULT_SCENE,
    time: 'afternoon' as TimeOfDay,
    journey: false,
    stop: 0,
    snap: true,
    layers: null as CharacterLayers | null,
  };

  const apply = (): void => {
    if (!engine) return;
    engine.state.sceneId = isQgSceneId(pending.sceneId) ? pending.sceneId : QG_DEFAULT_SCENE;
    engine.state.time = pending.time;
    engine.state.journey = pending.journey;
    // A repeated INIT (the app reloads the profile after each check) must not teleport
    // the character or cut the run in progress
    if (pending.snap && engine.state.stop !== pending.stop) engine.placeHero(pending.stop);
    else engine.state.stop = pending.stop;
    pending.snap = false;
    if (!pending.journey && engine.state.anim === 'walk') engine.state.anim = 'idle';
    if (pending.journey && engine.state.anim === 'idle') engine.state.anim = 'walk';
    if (pending.layers) engine.state.selection = selectionFromLayers(pending.layers);
  };

  const ensureEngine = (): void => {
    if (engine || loading) return;
    loading = loadTiles()
      .then(async (tiles) => {
        const created = createQgEngine({
          canvas,
          catalog,
          tiles,
          sheetSrc,
          initial: {
            selection: selectionFromLayers(
              pending.layers ?? { skin: 'light', hair: 'short-brown', outfit: 'tunic-purple' },
            ),
            anim: 'idle',
            direction: 'down',
            sceneId: QG_DEFAULT_SCENE,
            time: 'afternoon',
            journey: false,
            stop: 0,
            level: 1,
          },
          maxFps: 30,
          maxScale: 3,
        });
        engine = created;
        apply();
        await created.ready();
        if (visible && !paused) created.start();
      })
      .catch(() => {
        // Without the art the HQ stays blank; release it to try again on the next INIT
        loading = null;
      });
  };

  return {
    show() {
      visible = true;
      root.dataset.scene = 'qg';
      ensureEngine();
      engine?.resize();
      if (!paused) engine?.start();
    },
    hide() {
      visible = false;
      engine?.pause();
    },
    setScene(sceneId) {
      pending.sceneId = sceneId;
      apply();
    },
    setJourney(journey) {
      pending.journey = journey;
      apply();
    },
    setTime(time) {
      pending.time = time;
      apply();
    },
    setCharacter(layers) {
      pending.layers = layers;
      apply();
    },
    setProgress(progress, options) {
      pending.stop = stopFor(progress);
      pending.snap = !(options?.animate ?? true);
      apply();
    },
    celebrate(progress) {
      pending.stop = stopFor(progress);
      pending.snap = false;
      apply();
      if (!engine) return;
      engine.state.anim = 'run';
      clearTimeout(celebrateTimer);
      celebrateTimer = setTimeout(() => {
        if (engine) engine.state.anim = pending.journey ? 'walk' : 'idle';
      }, CELEBRATE_MS);
    },
    pause() {
      paused = true;
      engine?.pause();
    },
    resume() {
      paused = false;
      if (visible) engine?.start();
    },
    fadeOut() {
      fade.classList.add('visible');
    },
    fadeIn() {
      fade.classList.remove('visible');
    },
  };
}
