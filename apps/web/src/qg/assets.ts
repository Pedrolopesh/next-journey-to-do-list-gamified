import catalogJson from '../../lab/catalog.json';
import type { AnimationName, Catalog } from './compose';
import { loadImage } from './engine';

/**
 * HQ art embedded in the banner's single bundle (data URLs): only the animations used in the app
 * (idle, walking and running) and the tiles the scenes draw. The banner never downloads anything.
 */
const sheets = import.meta.glob<string>('../../lab/assets/lpc/**/{idle,walk,run}.png', {
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

/** Loads the scenery tiles by name (grass, water, lava...). */
export async function loadTiles(): Promise<Record<string, HTMLImageElement>> {
  const entries = await Promise.all(
    Object.entries(tileFiles).map(
      async ([file, src]) =>
        [file.split('/').pop()?.replace('.png', '') ?? file, await loadImage(src)] as const,
    ),
  );
  return Object.fromEntries(entries);
}
