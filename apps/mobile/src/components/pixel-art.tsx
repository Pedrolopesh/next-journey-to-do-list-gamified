import Svg, { Rect } from 'react-native-svg';

/** Paleta da pixel art; "." é transparente. */
const PALETTE: Record<string, string> = {
  o: '#1a1233',
  H: '#6b4423',
  S: '#f2c9a0',
  e: '#1a1233',
  B: '#7c3aed',
  C: '#f5e6c8',
  l: '#b89968',
  y: '#f59e0b',
  Y: '#fde68a',
  G: '#8b7bd8',
  g: '#10b981',
  P: '#a78bfa',
  r: '#ef4444',
  R: '#f97316',
  W: '#f1f5f9',
};

/** Ícones 12x12; cada letra é uma cor da paleta. */
export const PIXEL_ART = {
  character: [
    '....oooo....',
    '...oHHHHo...',
    '..oHHHHHHo..',
    '..oHSSSSHo..',
    '..oSeSSeSo..',
    '..oSSSSSSo..',
    '...oSSSSo...',
    '..oBBBBBBo..',
    '.oBBBBBBBBo.',
    '.oBBBBBBBBo.',
    '.oBBBBBBBBo.',
    '.oooooooooo.',
  ],
  story: [
    '............',
    '.oooooooooo.',
    '.oPPPooPPPo.',
    '.oCllCoCllCo',
    '.oCCCCoCCCCo',
    '.oCllCoCllCo',
    '.oCCCCoCCCCo',
    '.oCllCoCllCo',
    '.oCCCCoCCCCo',
    '.oooooooooo.',
    '..oPPPPPPo..',
    '............',
  ],
  scenery: [
    '............',
    '.......yy...',
    '......yyyy..',
    '.......yy...',
    '...o........',
    '..oGo...o...',
    '.oGGGo.oGo..',
    'oGGGGGoGGGo.',
    'GGGGGGGGGGGo',
    'gggggggggggg',
    'gggggggggggg',
    '............',
  ],
  dailies: [
    '............',
    '.oooooooooo.',
    '.orrrrrrrro.',
    '.oooooooooo.',
    '.oWWWWWWWWo.',
    '.oWWWWWgWWo.',
    '.oWWWWgWWWo.',
    '.ogWWgWWWWo.',
    '.oWgggWWWWo.',
    '.oWWgWWWWWo.',
    '.oooooooooo.',
    '............',
  ],
  tasks: [
    '....oooo....',
    '.oooPPPPooo.',
    '.oCCCCCCCCo.',
    '.oCgCllllCo.',
    '.oCCCCCCCCo.',
    '.oCgCllllCo.',
    '.oCCCCCCCCo.',
    '.oCgCllllCo.',
    '.oCCCCCCCCo.',
    '.oooooooooo.',
    '............',
    '............',
  ],
  streak: [
    '.....o......',
    '....oyo.....',
    '....oyyo....',
    '...oyyyoo...',
    '..oyyRyyyo..',
    '..oyRRRyyo..',
    '.oyyRRRRyyo.',
    '.oyRRYYRRyo.',
    '.oyRYYYYRyo.',
    '.oyyYYYYyyo.',
    '..ooyyyyoo..',
    '....oooo....',
  ],
  coin: [
    '....oooo....',
    '..ooyyyyoo..',
    '.oyyYYYYyyo.',
    '.oyYyyyyYyo.',
    'oyYyyYYyyYyo',
    'oyYyyYYyyYyo',
    'oyYyyYYyyYyo',
    'oyYyyYYyyYyo',
    '.oyYyyyyYyo.',
    '.oyyYYYYyyo.',
    '..ooyyyyoo..',
    '....oooo....',
  ],
} as const;

export type PixelArtName = keyof typeof PIXEL_ART;

type Run = { x: number; y: number; w: number; fill: string };

/** Junta pixels vizinhos da mesma cor na linha (menos nós SVG por ícone). */
function runs(rows: readonly string[]): Run[] {
  const out: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x] ?? '.';
      const fill = PALETTE[ch];
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
