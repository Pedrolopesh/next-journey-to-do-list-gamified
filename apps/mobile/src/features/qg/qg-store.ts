import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_SCENARIO, isScenario, isTimeMode, type Scenario, type TimeMode } from './options';

type QgPrefs = {
  scenario: Scenario;
  timeMode: TimeMode;
  setScenario: (scenario: Scenario) => void;
  setTimeMode: (mode: TimeMode) => void;
};

/**
 * Preferências do QG (cenário e hora). O cenário da jornada vem da história ativa, não daqui. Ficam só neste aparelho: não são dado sensível e não
 * mudam a progressão, por isso não passam pela API.
 */
export const useQgPrefs = create<QgPrefs>()(
  persist(
    (set) => ({
      scenario: DEFAULT_SCENARIO,
      timeMode: 'auto',
      setScenario: (scenario) => {
        set({ scenario });
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
        timeMode: state.timeMode,
      }),
      // Valor salvo inválido (ou de uma versão futura) volta ao padrão
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Pick<QgPrefs, 'scenario' | 'timeMode'>>;
        return {
          ...current,
          scenario: isScenario(saved.scenario) ? saved.scenario : current.scenario,
          timeMode: isTimeMode(saved.timeMode) ? saved.timeMode : current.timeMode,
        };
      },
    },
  ),
);
