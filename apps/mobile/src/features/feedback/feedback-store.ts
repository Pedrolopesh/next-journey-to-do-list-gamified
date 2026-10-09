import { create } from 'zustand';

import type { ModalEntry } from './modal-queue';

type FeedbackState = {
  /** Fila de modais (nível, conquista, capítulo): exibidos um de cada vez. */
  modals: ModalEntry[];
  enqueue: (entries: ModalEntry[]) => void;
  dismiss: () => void;
  /** Checks de hoje (por item) que ainda podem ser desfeitos neste aparelho. */
  checks: Record<string, { day: string; checkIds: string[] }>;
  rememberCheck: (itemId: string, checkId: string) => void;
  forgetCheck: (itemId: string, checkId: string) => void;
  clear: () => void;
};

const today = (): string => new Date().toISOString().slice(0, 10);

export const useFeedbackStore = create<FeedbackState>((set) => ({
  modals: [],
  enqueue: (entries) => {
    if (entries.length > 0) set((state) => ({ modals: [...state.modals, ...entries] }));
  },
  dismiss: () => {
    set((state) => ({ modals: state.modals.slice(1) }));
  },
  checks: {},
  rememberCheck: (itemId, checkId) => {
    set((state) => {
      const current = state.checks[itemId];
      const day = today();
      const ids = current && current.day === day ? current.checkIds : [];
      return { checks: { ...state.checks, [itemId]: { day, checkIds: [...ids, checkId] } } };
    });
  },
  forgetCheck: (itemId, checkId) => {
    set((state) => {
      const current = state.checks[itemId];
      if (!current) return state;
      return {
        checks: {
          ...state.checks,
          [itemId]: { ...current, checkIds: current.checkIds.filter((id) => id !== checkId) },
        },
      };
    });
  },
  clear: () => {
    set({ modals: [], checks: {} });
  },
}));

/** Último check de hoje do item que ainda pode ser desfeito (ou nulo). */
export function lastUndoableCheck(checks: FeedbackState['checks'], itemId: string): string | null {
  const entry = checks[itemId];
  if (!entry || entry.day !== today()) return null;
  return entry.checkIds.at(-1) ?? null;
}
