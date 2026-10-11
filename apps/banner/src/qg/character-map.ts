import type { CharacterLayers } from '@nextjourney/contracts';

import type { Selection } from './compose';

/** Pele: chave do app -> paleta LPC. */
const SKINS: Record<string, string> = {
  light: 'light',
  tan: 'amber',
  brown: 'brown',
  dark: 'black',
};

/** Cabelo: chave do app -> peça e cor LPC (`null` = careca). */
type Hair = { hair: string | null; color: string };
const HAIRS: Record<string, Hair> = {
  'short-brown': { hair: 'hair-buzzcut', color: 'dark_brown' },
  'long-black': { hair: 'hair-half-up', color: 'black' },
  'curly-red': { hair: 'hair-curly-short', color: 'redhead' },
  bald: { hair: null, color: 'black' },
};

type Outfit = {
  torso: string;
  torsoColor: string;
  legs: string;
  legsColor: string;
  feetColor: string;
};

/** Roupa: chave do app -> torso, calça e cores LPC. */
const OUTFITS: Record<string, Outfit> = {
  'tunic-purple': {
    torso: 'torso-longsleeve-2',
    torsoColor: 'purple',
    legs: 'legs-pants',
    legsColor: 'charcoal',
    feetColor: 'brown',
  },
  'tunic-green': {
    torso: 'torso-longsleeve-2',
    torsoColor: 'forest',
    legs: 'legs-pants',
    legsColor: 'brown',
    feetColor: 'brown',
  },
  'armor-iron': {
    torso: 'torso-sleeveless-2',
    torsoColor: 'slate',
    legs: 'legs-pants',
    legsColor: 'gray',
    feetColor: 'charcoal',
  },
  'outfit-special': {
    torso: 'torso-cardigan',
    torsoColor: 'yellow',
    legs: 'legs-pants',
    legsColor: 'maroon',
    feetColor: 'brown',
  },
  'outfit-cape': {
    torso: 'torso-cardigan',
    torsoColor: 'red',
    legs: 'legs-pants',
    legsColor: 'black',
    feetColor: 'black',
  },
};

const FALLBACK_HAIR: Hair = { hair: 'hair-buzzcut', color: 'dark_brown' };
const FALLBACK_OUTFIT = OUTFITS['tunic-purple'] as Outfit;

/**
 * Converte as chaves de camada do app (cadastro do personagem) na seleção LPC do banner.
 * Chave desconhecida cai no padrão em vez de quebrar a cena. Acessórios (chapéu, espada, escudo) ainda
 * não têm arte LPC importada e são ignorados.
 */
export function selectionFromLayers(layers: CharacterLayers): Selection {
  const hair = HAIRS[layers.hair] ?? FALLBACK_HAIR;
  const outfit = OUTFITS[layers.outfit] ?? FALLBACK_OUTFIT;
  return {
    bodyType: 'male',
    skin: SKINS[layers.skin] ?? 'light',
    hair: hair.hair,
    hairColor: hair.color,
    torso: outfit.torso,
    torsoColor: outfit.torsoColor,
    legs: outfit.legs,
    legsColor: outfit.legsColor,
    feet: 'feet-revised-boots',
    feetColor: outfit.feetColor,
  };
}
