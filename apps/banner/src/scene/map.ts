import '../styles/scene.css';

const SCENE_WIDTH = 195;
const HERO_FRAME_WIDTH = 24;
const RUN_DURATION_MS = 5000;
export const HERO_MOVE_MS = 600;
export const FADE_MS = 500;

export type MapScene = {
  /** progress de 0 (borda direita) a 1 (borda esquerda). `animate: false` posiciona sem transição. */
  setProgress: (progress: number, options?: { animate?: boolean }) => void;
  /** Corrida de 5 s até a nova posição e volta para a caminhada (ITEM_CHECKED) */
  run: (progress: number) => void;
  pause: () => void;
  resume: () => void;
  fadeOut: () => void;
  fadeIn: () => void;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Posição do personagem no eixo X (px, na arte nativa) para um progresso de 0 a 1. */
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
      // força o navegador a aplicar a posição antes de religar a transição
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
