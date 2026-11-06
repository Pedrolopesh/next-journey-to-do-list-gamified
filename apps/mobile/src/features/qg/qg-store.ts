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
 * QG preferences (scenery and time). The journey scenery comes from the active story, not from here.
 * They stay on this device only: they are not sensitive data and do not change progression, so they
 * do not go through the API.
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
      // Invalid saved value (or from a future version) goes back to the default
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
