import type { Catalog } from '../qg/compose';
import { createQgEngine, loadImage, type QgEngine, type QgState } from '../qg/engine';

/** Catálogo e tiles de cenário: carregados uma vez e reaproveitados entre as páginas. */
const assets = (async () => {
  const catalog = (await (await fetch('/lab/catalog.json')).json()) as Catalog;
  const tiles = Object.fromEntries(
    await Promise.all(
      catalog.scenery.map(
        async ({ file }) =>
          [
            file.split('/').pop()?.replace('.png', '') ?? file,
            await loadImage(`/lab/${file}`),
          ] as const,
      ),
    ),
  ) as Record<string, HTMLImageElement>;
  return { catalog, tiles };
})();

export type LabEngine = {
  engine: QgEngine;
  state: QgState;
  catalog: Catalog;
  /** Quantas folhas de sprite este motor pediu. */
  requests: () => number;
  destroy: () => void;
};

/** Estado inicial do personagem do laboratório. */
export const initialState = (): QgState => ({
  selection: {
    bodyType: 'male',
    skin: 'light',
    hair: 'hair-bob',
    hairColor: 'chestnut',
    torso: 'torso-tshirt',
    torsoColor: 'blue',
    legs: 'legs-pants',
    legsColor: 'navy',
    feet: 'feet-basic-shoes',
    feetColor: 'brown',
  },
  anim: 'idle',
  direction: 'down',
  sceneId: 'cabin',
  journey: false,
  stop: 0,
  level: 1,
  time: 'afternoon',
});

/** Liga o motor do QG a um canvas e o inicia; `destroy` para o desenho e solta o redimensionamento. */
export async function createLabEngine(
  canvas: HTMLCanvasElement,
  state: QgState = initialState(),
): Promise<LabEngine> {
  const { catalog, tiles } = await assets;
  let requests = 0;
  const engine = createQgEngine({
    canvas,
    catalog,
    tiles,
    sheetSrc: (path, anim) => {
      requests += 1;
      return `/lab/assets/lpc/${path}${anim}.png`;
    },
    initial: state,
  });
  window.addEventListener('resize', engine.resize);
  engine.start();
  return {
    engine,
    state: engine.state,
    catalog,
    requests: () => requests,
    destroy: () => {
      engine.pause();
      window.removeEventListener('resize', engine.resize);
    },
  };
}

/** Palco do canvas (390x220) usado pelas páginas de cenários e de personagem. */
export function stage(label: string): { wrap: HTMLElement; canvas: HTMLCanvasElement } {
  const wrap = document.createElement('div');
  wrap.className = 'stage';
  const canvas = document.createElement('canvas');
  canvas.width = 390;
  canvas.height = 220;
  canvas.setAttribute('aria-label', label);
  wrap.append(canvas);
  return { wrap, canvas };
}
