import type { CharacterLayers } from '@nextjourney/contracts';

import type { Selection } from './compose';

/** Skin: app key -> LPC palette. */
const SKINS: Record<string, string> = {
  light: 'light',
  tan: 'amber',
  brown: 'brown',
  dark: 'black',
};

/** Hair: app key -> LPC piece and color (`null` = bald). */
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

/** Clothes: app key -> LPC torso, pants and colors. */
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
};

const FALLBACK_HAIR: Hair = { hair: 'hair-buzzcut', color: 'dark_brown' };
const FALLBACK_OUTFIT = OUTFITS['tunic-purple'] as Outfit;

/**
 * Converts the app character layers into the banner LPC selection: uses `look` when it exists and,
 * otherwise, the simple keys (old signup).
 * An unknown key falls back to the default instead of breaking the scene. Accessories (hat, sword, shield) still
 * have no imported LPC art and are ignored.
 */
export function selectionFromLayers(layers: CharacterLayers): Selection {
  // The detailed appearance (app form) takes precedence over the simple keys map
  if (layers.look) return { ...layers.look };
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
