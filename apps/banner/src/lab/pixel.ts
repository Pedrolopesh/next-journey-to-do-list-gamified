import { INSIGNIA_PALETTE, type InsigniaName, INSIGNIAS } from '@nextjourney/insignias';

import {
  PIXEL_ART,
  PIXEL_PALETTE,
  type PixelArtName,
} from '../../../mobile/src/components/pixel-art-data';

/** SVG of the app's pixel art (the same data as the app's `PixelArt` component). */
export function pixelSvg(name: PixelArtName): string {
  const rects = PIXEL_ART[name].flatMap((row, y) =>
    [...row].flatMap((char, x) => {
      const fill = PIXEL_PALETTE[char];
      return fill ? [`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`] : [];
    }),
  );
  return `<svg class="pix" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
}

/** SVG of an achievement badge (24x24 pixel art, with its own outline and shading). */
export function insigniaSvg(name: InsigniaName): string {
  const rects = INSIGNIAS[name].flatMap((row, y) =>
    [...row].flatMap((char, x) => {
      const fill = INSIGNIA_PALETTE[char];
      return fill ? [`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`] : [];
    }),
  );
  return `<svg class="pix" viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
}
