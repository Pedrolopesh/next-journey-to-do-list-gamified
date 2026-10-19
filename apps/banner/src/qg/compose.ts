/** Lógica pura do laboratório do personagem LPC: catálogo, recolorização e montagem de camadas. */

export type Material = 'body' | 'hair' | 'cloth' | 'eye';
export type BodyType = 'male' | 'female';
export type AnimationName = 'idle' | 'walk' | 'run';
/** Ordem das linhas nas folhas LPC. */
export type Direction = 'up' | 'left' | 'down' | 'right';

export type Credit = {
  file: string;
  authors: string[];
  licenseUsed: string;
  licensesOffered: string[];
  urls: string[];
  notes: string;
};

export type Part = {
  id: string;
  slot: string;
  name: string;
  material: Material | null;
  bodyTypes: BodyType[];
  layers: { z: number; paths: Partial<Record<BodyType, string>> }[];
  credits: number[];
};

export type Catalog = {
  animations: Record<AnimationName, number>;
  bodyTypes: BodyType[];
  palettes: Record<Material, { base: string; colors: Record<string, string[]> }>;
  parts: Part[];
  scenery: { file: string; from: string }[];
  credits: Credit[];
};

export type Selection = {
  bodyType: BodyType;
  skin: string;
  hair: string | null;
  hairColor: string;
  torso: string | null;
  torsoColor: string;
  legs: string | null;
  legsColor: string;
  feet: string | null;
  feetColor: string;
  /** Peças prontas sem recolorir (id do catálogo): chapéu/viseira e proteção dos braços. */
  hat?: string | null;
  arms?: string | null;
};

export const FRAME = 64;
const DIRECTION_ROW: Record<Direction, number> = { up: 0, left: 1, down: 2, right: 3 };

/** Retângulo do quadro na folha: coluna = quadro da animação, linha = direção. */
export function frameRect(direction: Direction, frame: number): { sx: number; sy: number } {
  return { sx: frame * FRAME, sy: DIRECTION_ROW[direction] * FRAME };
}

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const value = Number.parseInt(
    clean.length === 3 ? [...clean].map((c) => c + c).join('') : clean,
    16,
  );
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Troca cada cor da paleta-base pela cor de mesma posição na paleta de destino. */
export function buildRecolorMap(source: string[], target: string[]): Map<number, Rgb> {
  const map = new Map<number, Rgb>();
  const count = Math.min(source.length, target.length);
  for (let i = 0; i < count; i++) {
    const [r, g, b] = hexToRgb(source[i] ?? '#000000');
    map.set((r << 16) | (g << 8) | b, hexToRgb(target[i] ?? '#000000'));
  }
  return map;
}

/** Recolore os pixels opacos (RGBA) in-place. Pixels fora da paleta ficam como estão. */
export function recolorPixels(pixels: Uint8ClampedArray, map: Map<number, Rgb>): void {
  for (let i = 0; i < pixels.length; i += 4) {
    if ((pixels[i + 3] ?? 0) === 0) continue;
    const key = ((pixels[i] ?? 0) << 16) | ((pixels[i + 1] ?? 0) << 8) | (pixels[i + 2] ?? 0);
    const replacement = map.get(key);
    if (!replacement) continue;
    pixels[i] = replacement[0];
    pixels[i + 1] = replacement[1];
    pixels[i + 2] = replacement[2];
  }
}

export type LayerSpec = {
  /** Caminho da pasta da camada dentro de assets/lpc (termina com "/"). */
  path: string;
  z: number;
  material: Material | null;
  /** Nome da cor na paleta do material (ex.: "brown"). */
  color: string | null;
  partId: string;
};

/** Camadas a desenhar para a seleção atual, da mais ao fundo para a mais à frente. */
export function layersFor(catalog: Catalog, selection: Selection): LayerSpec[] {
  const chosen: { id: string; color: string | null }[] = [
    { id: 'body', color: selection.skin },
    { id: `head-${selection.bodyType}`, color: selection.skin },
    { id: 'face', color: selection.skin },
    ...(selection.hair ? [{ id: selection.hair, color: selection.hairColor }] : []),
    ...(selection.torso ? [{ id: selection.torso, color: selection.torsoColor }] : []),
    ...(selection.legs ? [{ id: selection.legs, color: selection.legsColor }] : []),
    ...(selection.feet ? [{ id: selection.feet, color: selection.feetColor }] : []),
    ...(selection.arms ? [{ id: selection.arms, color: null }] : []),
    ...(selection.hat ? [{ id: selection.hat, color: null }] : []),
  ];
  const specs: LayerSpec[] = [];
  for (const { id, color } of chosen) {
    const part = catalog.parts.find((candidate) => candidate.id === id);
    if (!part) continue;
    for (const layer of part.layers) {
      const path = layer.paths[selection.bodyType];
      if (path) specs.push({ path, z: layer.z, material: part.material, color, partId: part.id });
    }
  }
  return specs.sort((a, b) => a.z - b.z);
}

/** Licenças dos itens escolhidos, sem repetir, com a licença que de fato usamos. */
export function creditsFor(catalog: Catalog, partIds: string[]): Credit[] {
  const indexes = new Set<number>();
  for (const id of partIds) {
    for (const index of catalog.parts.find((part) => part.id === id)?.credits ?? []) {
      indexes.add(index);
    }
  }
  return [...indexes].map((index) => catalog.credits[index]).filter((c): c is Credit => !!c);
}
