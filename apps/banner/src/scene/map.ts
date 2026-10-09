import '../styles/scene.css';

const SCENE_WIDTH = 195;
const HERO_FRAME_WIDTH = 24;
const RUN_DURATION_MS = 5000;

export type MapScene = {
  /** progress de 0 (borda direita) a 1 (borda esquerda) */
  setProgress: (progress: number) => void;
  /** Corrida de 5 s e volta para a caminhada (ITEM_CHECKED) */
  run: (progress: number) => void;
  pause: () => void;
  resume: () => void;
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
  if (!hero) throw new Error('Elemento #hero não encontrado');

  let runTimer: ReturnType<typeof setTimeout> | undefined;

  const setProgress = (progress: number): void => {
    hero.style.setProperty('--hero-x', `${heroX(progress)}px`);
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
  };
}
