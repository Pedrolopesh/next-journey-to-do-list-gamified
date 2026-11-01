import type { CharacterClass, CharacterLayers, LpcLook } from '@nextjourney/contracts';
import { create } from 'zustand';

import { DEFAULT_LOOK, legacyHair, legacySkin } from '@/features/qg/options';

const DEFAULT_OUTFIT = 'tunic-purple';

/** Layers the banner needs to draw a look (the simple keys follow the detailed look). */
export function layersOfLook(look: LpcLook): CharacterLayers {
  return {
    skin: legacySkin(look.skin),
    hair: legacyHair(look.hair),
    outfit: DEFAULT_OUTFIT,
    look,
  };
}

type DraftState = {
  look: LpcLook;
  characterClass: CharacterClass | null;
  name: string;
  setLook: (look: LpcLook) => void;
  setCharacterClass: (value: CharacterClass | null) => void;
  setName: (name: string) => void;
  reset: () => void;
};

/** Character being built during the onboarding; only "Criar personagem" sends it to the API. */
export const useCharacterDraft = create<DraftState>((set) => ({
  look: DEFAULT_LOOK,
  characterClass: null,
  name: '',
  setLook: (look) => {
    set({ look });
  },
  setCharacterClass: (characterClass) => {
    set({ characterClass });
  },
  setName: (name) => {
    set({ name });
  },
  reset: () => {
    set({ look: DEFAULT_LOOK, characterClass: null, name: '' });
  },
}));
