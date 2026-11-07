import '../styles/scene.css';

const SCENE_WIDTH = 195;
const HERO_FRAME_WIDTH = 24;
const RUN_DURATION_MS = 5000;
export const HERO_MOVE_MS = 600;
export const FADE_MS = 500;

export type MapScene = {
  /** progress from 0 (right edge) to 1 (left edge). `animate: false` positions without a transition. */
  setProgress: (progress: number, options?: { animate?: boolean }) => void;
  /** 5 s run to the new position and back to walking (ITEM_CHECKED) */
  run: (progress: number) => void;
  pause: () => void;
  resume: () => void;
  fadeOut: () => void;
  fadeIn: () => void;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Character position on the X axis (px, in native art) for a progress from 0 to 1. */
export function heroX(progress: number): number {
  return (1 - clamp01(progress)) * (SCENE_WIDTH - HERO_FRAME_WIDTH);
}

export function createMapScene(banner: HTMLElement): MapScene {
  const hero = banner.querySelector<HTMLElement>('#hero');
  const fade = banner.querySelector<HTMLElement>('#fade');
  if (!hero || !fade) throw new Error('Elementos #hero e #fade não encontrados');

  let runTimer: ReturnType<typeof setTimeout> | undefined;

  const setProgress: MapScene['setProgress'] = (progress, options) => {
    const animate = options?.animate ?? true;
    hero.classList.toggle('instant', !animate);
    hero.style.setProperty('--hero-x', `${heroX(progress)}px`);
    if (!animate) {
      // forces the browser to apply the position before re-enabling the transition
      void hero.offsetWidth;
      hero.classList.remove('instant');
    }
  };

  return {
    setProgress,
    run(progress) {
      banner.classList.add('running');
      setProgress(progress);
      clearTimeout(runTimer);
      runTimer = setTimeout(() => {
        banner.classList.remove('running');
      }, RUN_DURATION_MS);
    },
    pause() {
      banner.classList.add('paused');
    },
    resume() {
      banner.classList.remove('paused');
    },
    fadeOut() {
      fade.classList.add('visible');
    },
    fadeIn() {
      fade.classList.remove('visible');
    },
  };
}
