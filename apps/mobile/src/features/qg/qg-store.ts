import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_SCENARIO,
  DEFAULT_STORY_SCENARIO,
  isScenario,
  isStoryScenario,
  isTimeMode,
  type Scenario,
  type StoryScenario,
  type TimeMode,
} from './options';

type QgPrefs = {
  scenario: Scenario;
  storyScenario: StoryScenario;
  timeMode: TimeMode;
  setScenario: (scenario: Scenario) => void;
  setStoryScenario: (scenario: StoryScenario) => void;
  setTimeMode: (mode: TimeMode) => void;
};

/**
 * Preferências do QG e da história (cenários e hora). Ficam só neste aparelho: não são dado sensível e não
 * mudam a progressão, por isso não passam pela API.
 */
export const useQgPrefs = create<QgPrefs>()(
  persist(
    (set) => ({
      scenario: DEFAULT_SCENARIO,
      storyScenario: DEFAULT_STORY_SCENARIO,
      timeMode: 'auto',
      setScenario: (scenario) => {
        set({ scenario });
      },
      setStoryScenario: (storyScenario) => {
        set({ storyScenario });
      },
      setTimeMode: (timeMode) => {
        set({ timeMode });
      },
    }),
    {
      name: 'nextjourney.qg.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        scenario: state.scenario,
        storyScenario: state.storyScenario,
        timeMode: state.timeMode,
      }),
      // Valor salvo inválido (ou de uma versão futura) volta ao padrão
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<
          Pick<QgPrefs, 'scenario' | 'storyScenario' | 'timeMode'>
        >;
        return {
          ...current,
          scenario: isScenario(saved.scenario) ? saved.scenario : current.scenario,
          storyScenario: isStoryScenario(saved.storyScenario)
            ? saved.storyScenario
            : current.storyScenario,
          timeMode: isTimeMode(saved.timeMode) ? saved.timeMode : current.timeMode,
        };
      },
    },
  ),
);
