import type { Character, CharacterLayers } from '@nextjourney/contracts';

/** Camadas que o banner recebe: as do personagem salvo ou, sem personagem ainda, as padrão. */
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
