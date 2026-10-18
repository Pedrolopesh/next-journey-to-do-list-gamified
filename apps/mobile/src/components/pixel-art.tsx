import { INSIGNIA_PALETTE, INSIGNIAS } from '@nextjourney/insignias';
import { memo, useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { PIXEL_ART, PIXEL_PALETTE, type PixelArtName } from './pixel-art-data';

export type { PixelArtName };

type Run = { x: number; y: number; w: number; fill: string };

/** Junta pixels vizinhos da mesma cor na linha (menos nós SVG por ícone). */
function runs(rows: readonly string[], palette: Record<string, string> = PIXEL_PALETTE): Run[] {
  const out: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x] ?? '.';
      const fill = palette[ch];
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

/** Um traçado por cor: junta os pixels da cor em um só `Path` (poucos nós SVG por insígnia). */
export function pathsByColor(
  rows: readonly string[],
  palette: Record<string, string>,
): { fill: string; d: string }[] {
  const byFill = new Map<string, string>();
  for (const run of runs(rows, palette)) {
    byFill.set(run.fill, `${byFill.get(run.fill) ?? ''}M${run.x} ${run.y}h${run.w}v1h-${run.w}z`);
  }
  return [...byFill].map(([fill, d]) => ({ fill, d }));
}

/**
 * Insígnia de conquista (pixel art 24x24 de `@nextjourney/insignias`). Nome desconhecido não
 * desenha nada. A galeria mostra dezenas ao mesmo tempo: um `Path` por cor e memoizada.
 */
export const Insignia = memo(function Insignia({
  glyph,
  size = 48,
}: {
  glyph: string;
  size?: number;
}) {
  const paths = useMemo(() => {
    const rows = (INSIGNIAS as Record<string, readonly string[] | undefined>)[glyph] ?? [];
    return pathsByColor(rows, INSIGNIA_PALETTE);
  }, [glyph]);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {paths.map((path) => (
        <Path key={path.fill} d={path.d} fill={path.fill} />
      ))}
    </Svg>
  );
});
