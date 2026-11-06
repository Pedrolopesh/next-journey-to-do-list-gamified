import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type JourneyState = {
  /** Level of the scene on display, per user. This device only; not sensitive data. */
  shownLevel: Record<string, number>;
  /** First use or a level that dropped (undone check): aligns to the current level. Never goes up by itself. */
  reconcile: (userId: string, level: number) => void;
  /** The scene switched (after the portal): starts showing the current level. */
  settle: (userId: string, level: number) => void;
};

/**
 * Keeps which level the journey is showing. When the player levels up, the real level gets
 * ahead of this value and the character waits at the portal; the scene only switches on the next check.
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
