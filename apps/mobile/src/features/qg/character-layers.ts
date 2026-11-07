import type { Character, CharacterLayers } from '@nextjourney/contracts';

/** Layers the banner receives: those of the saved character or, with no character yet, the default ones. */
export function characterLayers(character: Character | null): CharacterLayers {
  if (!character) return { skin: 'light', hair: 'short-brown', outfit: 'tunic-purple' };
  return {
    skin: character.skin,
    hair: character.hair,
    outfit: character.outfit,
    ...(character.accessory ? { accessory: character.accessory } : {}),
    ...(character.look ? { look: character.look } : {}),
  };
}
