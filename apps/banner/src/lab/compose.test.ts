import { describe, expect, it } from 'vitest';

import {
  buildRecolorMap,
  type Catalog,
  creditsFor,
  frameRect,
  hexToRgb,
  layersFor,
  recolorPixels,
  type Selection,
} from './compose';

const catalog: Catalog = {
  animations: { idle: 2, walk: 9, run: 8 },
  bodyTypes: ['male', 'female'],
  palettes: {
    body: { base: 'light', colors: {} },
    hair: { base: 'orange', colors: {} },
    cloth: { base: 'white', colors: {} },
    eye: { base: 'x', colors: {} },
  },
  parts: [
    {
      id: 'body',
      slot: 'body',
      name: 'Corpo',
      material: 'body',
      bodyTypes: ['male', 'female'],
      layers: [{ z: 10, paths: { male: 'body/male/', female: 'body/female/' } }],
      credits: [0],
    },
    {
      id: 'head-male',
      slot: 'head',
      name: 'Cabeça',
      material: 'body',
      bodyTypes: ['male'],
      layers: [{ z: 100, paths: { male: 'head/male/' } }],
      credits: [0],
    },
    {
      id: 'face',
      slot: 'face',
      name: 'Rosto',
      material: 'body',
      bodyTypes: ['male'],
      layers: [{ z: 101, paths: { male: 'face/male/' } }],
      credits: [1],
    },
    {
      id: 'legs-pants',
      slot: 'legs',
      name: 'Calça',
      material: 'cloth',
      bodyTypes: ['male'],
      layers: [{ z: 20, paths: { male: 'legs/male/' } }],
      credits: [1],
    },
  ],
  scenery: [],
  credits: [
    {
      file: 'a',
      authors: ['A'],
      licenseUsed: 'OGA-BY 3.0',
      licensesOffered: [],
      urls: [],
      notes: '',
    },
    { file: 'b', authors: ['B'], licenseUsed: 'CC0', licensesOffered: [], urls: [], notes: '' },
  ],
};
const selection: Selection = {
  bodyType: 'male',
  skin: 'light',
  hair: null,
  hairColor: 'orange',
  torso: null,
  torsoColor: 'white',
  legs: 'legs-pants',
  legsColor: 'blue',
  feet: null,
  feetColor: 'white',
};

describe('lab do personagem', () => {
  it('converte hex e calcula o quadro na folha', () => {
    expect(hexToRgb('#FF8000')).toEqual([255, 128, 0]);
    expect(hexToRgb('#f80')).toEqual([255, 136, 0]);
    expect(frameRect('down', 3)).toEqual({ sx: 192, sy: 128 });
    expect(frameRect('up', 0)).toEqual({ sx: 0, sy: 0 });
  });

  it('recolore só pixels opacos da paleta-base', () => {
    const map = buildRecolorMap(['#ff0000', '#00ff00'], ['#0000ff', '#ffffff']);
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 0, 1, 2, 3, 255]);
    recolorPixels(pixels, map);
    expect([...pixels]).toEqual([0, 0, 255, 255, 0, 255, 0, 0, 1, 2, 3, 255]);
  });

  it('monta as camadas ordenadas por profundidade para o tipo de corpo', () => {
    const specs = layersFor(catalog, selection);
    expect(specs.map((s) => s.partId)).toEqual(['body', 'legs-pants', 'head-male', 'face']);
    expect(specs.find((s) => s.partId === 'legs-pants')?.color).toBe('blue');
  });

  it('lista as licenças só dos itens escolhidos, sem repetir', () => {
    const credits = creditsFor(catalog, ['body', 'head-male', 'legs-pants']);
    expect(credits.map((c) => c.licenseUsed)).toEqual(['OGA-BY 3.0', 'CC0']);
  });
});
