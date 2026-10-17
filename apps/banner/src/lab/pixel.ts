import {
  PIXEL_ART,
  PIXEL_PALETTE,
  type PixelArtName,
} from '../../../mobile/src/components/pixel-art-data';
import { INSIGNIA_PALETTE, type InsigniaName, INSIGNIAS } from './pages/insignias-data';

/** SVG da pixel art do app (os mesmos dados do componente `PixelArt` do app). */
export function pixelSvg(name: PixelArtName): string {
  const rects = PIXEL_ART[name].flatMap((row, y) =>
    [...row].flatMap((char, x) => {
      const fill = PIXEL_PALETTE[char];
      return fill ? [`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`] : [];
    }),
  );
  return `<svg class="pix" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
}

/** SVG de uma insígnia de conquista (pixel art 24x24, com contorno e sombreado próprios). */
export function insigniaSvg(name: InsigniaName): string {
  const rects = INSIGNIAS[name].flatMap((row, y) =>
    [...row].flatMap((char, x) => {
      const fill = INSIGNIA_PALETTE[char];
      return fill ? [`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`] : [];
    }),
  );
  return `<svg class="pix" viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
}
