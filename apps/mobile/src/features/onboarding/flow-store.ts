import { create } from 'zustand';

type FlowState = {
  /**
   * True from the moment the story is chosen until the last optional question (reminders, age,
   * gender) is answered or skipped: keeps the onboarding screens open although the server already
   * counts the onboarding as done.
   */
  finishing: boolean;
  setFinishing: (value: boolean) => void;
};

export const useOnboardingFlow = create<FlowState>((set) => ({
  finishing: false,
  setFinishing: (finishing) => {
    set({ finishing });
  },
}));
