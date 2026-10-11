import catalogJson from '../../lab/catalog.json';
import type { AnimationName, Catalog } from './compose';
import { loadImage } from './engine';

/**
 * Arte do QG embutida no bundle único do banner (data URLs): só as animações usadas no app
 * (parado e correndo) e os tiles que os cenários desenham. O banner nunca baixa nada.
 */
const sheets = import.meta.glob<string>('../../lab/assets/lpc/**/{idle,run}.png', {
  eager: true,
  query: '?inline',
  import: 'default',
});

const tileFiles = import.meta.glob<string>('../../lab/assets/scene/*.png', {
  eager: true,
  query: '?inline',
  import: 'default',
});

export const catalog = catalogJson as unknown as Catalog;

export function sheetSrc(path: string, anim: AnimationName): string {
  return sheets[`../../lab/assets/lpc/${path}${anim}.png`] ?? '';
}

/** Carrega os tiles de cenário por nome (grama, água, lava...). */
export async function loadTiles(): Promise<Record<string, HTMLImageElement>> {
  const entries = await Promise.all(
    Object.entries(tileFiles).map(
      async ([file, src]) =>
        [file.split('/').pop()?.replace('.png', '') ?? file, await loadImage(src)] as const,
    ),
  );
  return Object.fromEntries(entries);
}
