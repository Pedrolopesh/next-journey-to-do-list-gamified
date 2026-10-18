import { describe, expect, it } from 'vitest';

import catalog from '../../lab/catalog.json';
import { selectionFromLayers } from './character-map';
import { type Catalog, layersFor } from './compose';

const SKIN_KEYS = ['light', 'tan', 'brown', 'dark'];
const HAIR_KEYS = ['short-brown', 'long-black', 'curly-red', 'bald'];
const OUTFIT_KEYS = ['tunic-purple', 'tunic-green', 'armor-iron'];

describe('seleção LPC a partir das camadas do app', () => {
  const data = catalog as unknown as Catalog;

  it('toda combinação de chaves do app vira camadas e cores que existem no catálogo', () => {
    for (const skin of SKIN_KEYS)
      for (const hair of HAIR_KEYS)
        for (const outfit of OUTFIT_KEYS) {
          const selection = selectionFromLayers({ skin, hair, outfit });
          expect(data.palettes.body.colors[selection.skin]).toBeDefined();
          if (selection.hair) {
            expect(data.parts.some((part) => part.id === selection.hair)).toBe(true);
            expect(data.palettes.hair.colors[selection.hairColor]).toBeDefined();
          }
          for (const color of [selection.torsoColor, selection.legsColor, selection.feetColor])
            expect(data.palettes.cloth.colors[color]).toBeDefined();
          for (const id of [selection.torso, selection.legs, selection.feet])
            expect(data.parts.some((part) => part.id === id)).toBe(true);
          expect(layersFor(data, selection).length).toBeGreaterThan(3);
        }
  });

  it('careca não tem peça de cabelo', () => {
    expect(
      selectionFromLayers({ skin: 'light', hair: 'bald', outfit: 'tunic-green' }).hair,
    ).toBeNull();
  });

  it('chave desconhecida cai no padrão sem quebrar', () => {
    const selection = selectionFromLayers({ skin: '???', hair: '???', outfit: '???' });
    expect(selection.skin).toBe('light');
    expect(selection.torso).toBe('torso-longsleeve-2');
  });

  it('a aparência detalhada (look) vale mais que as chaves simples', () => {
    const look = {
      bodyType: 'female' as const,
      skin: 'olive',
      hair: 'hair-bob',
      hairColor: 'blonde',
      torso: 'torso-tshirt',
      torsoColor: 'teal',
      legs: 'legs-shorts',
      legsColor: 'tan',
      feet: null,
      feetColor: 'brown',
    };
    const selection = selectionFromLayers({
      skin: 'dark',
      hair: 'bald',
      outfit: 'armor-iron',
      look,
    });
    expect(selection).toEqual(look);
    expect(layersFor(data, selection).length).toBeGreaterThan(3);
  });
});
