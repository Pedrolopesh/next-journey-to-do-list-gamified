import { create } from 'zustand';

type EmailFlow = {
  /** Email the code was sent to; lives only in memory (nothing sensitive is persisted). */
  email: string | null;
  set: (email: string) => void;
  clear: () => void;
};

export const useEmailFlow = create<EmailFlow>((set) => ({
  email: null,
  set: (email) => {
    set({ email });
  },
  clear: () => {
    set({ email: null });
  },
}));
