import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type JourneyState = {
  /** Nível da cena em exibição, por usuário. Só neste aparelho; não é dado sensível. */
  shownLevel: Record<string, number>;
  /** Primeiro uso ou nível que caiu (check desfeito): alinha ao nível atual. Nunca sobe sozinho. */
  reconcile: (userId: string, level: number) => void;
  /** A cena trocou (depois do portal): passa a exibir o nível atual. */
  settle: (userId: string, level: number) => void;
};

/**
 * Guarda qual nível a jornada está mostrando. Quando o jogador sobe de nível, o nível real passa a
 * frente deste valor e o personagem espera no portal; a cena só troca no check seguinte.
 */
export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      shownLevel: {},
      reconcile: (userId, level) => {
        const current = get().shownLevel[userId];
        if (current === undefined || current > level) {
          set((state) => ({ shownLevel: { ...state.shownLevel, [userId]: level } }));
        }
      },
      settle: (userId, level) => {
        set((state) => ({ shownLevel: { ...state.shownLevel, [userId]: level } }));
      },
    }),
    {
      name: 'nextjourney.journey.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ shownLevel: state.shownLevel }),
    },
  ),
);
