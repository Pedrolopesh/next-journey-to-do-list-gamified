import Svg, { Rect } from 'react-native-svg';

import { PIXEL_ART, PIXEL_PALETTE, type PixelArtName } from './pixel-art-data';

export type { PixelArtName };

type Run = { x: number; y: number; w: number; fill: string };

/** Junta pixels vizinhos da mesma cor na linha (menos nós SVG por ícone). */
function runs(rows: readonly string[]): Run[] {
  const out: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x] ?? '.';
      const fill = PIXEL_PALETTE[ch];
      if (!fill) {
        x += 1;
        continue;
      }
      let w = 1;
      while (row[x + w] === ch) w += 1;
      out.push({ x, y, w, fill });
      x += w;
    }
  });
  return out;
}

/** Pixel art do app (vetor, sem borrar ao ampliar). Decorativa: some para leitores de tela. */
export function PixelArt({ name, size = 48 }: { name: PixelArtName; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {runs(PIXEL_ART[name]).map((run) => (
        <Rect
          key={`${run.x}-${run.y}`}
          x={run.x}
          y={run.y}
          width={run.w}
          height={1}
          fill={run.fill}
        />
      ))}
    </Svg>
  );
}
