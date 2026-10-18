import { create } from 'zustand';

import type { ModalEntry } from './modal-queue';

type FeedbackState = {
  /** Fila de modais (nível, conquista, capítulo): exibidos um de cada vez. */
  modals: ModalEntry[];
  enqueue: (entries: ModalEntry[]) => void;
  /** Conquistas que já abriram modal nesta sessão (evita reabrir enquanto o aviso é confirmado). */
  shownAchievements: string[];
  dismiss: () => void;
  /** Fecha os avisos de conquista da fila de uma vez ("Ver todas") e devolve os slugs. */
  dismissAchievements: () => string[];
  /** Checks de hoje (por item) que ainda podem ser desfeitos neste aparelho. */
  checks: Record<string, { day: string; checkIds: string[] }>;
  rememberCheck: (itemId: string, checkId: string) => void;
  forgetCheck: (itemId: string, checkId: string) => void;
  clear: () => void;
};

const today = (): string => new Date().toISOString().slice(0, 10);

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  modals: [],
  shownAchievements: [],
  enqueue: (entries) => {
    set((state) => {
      const known = new Set([
        ...state.shownAchievements,
        ...state.modals.flatMap((m) => (m.kind === 'achievement' ? [m.slug] : [])),
      ]);
      const fresh = entries.filter((entry) => {
        if (entry.kind !== 'achievement') return true;
        if (known.has(entry.slug)) return false;
        known.add(entry.slug);
        return true;
      });
      return fresh.length > 0 ? { modals: [...state.modals, ...fresh] } : state;
    });
  },
  dismiss: () => {
    set((state) => {
      const [first, ...rest] = state.modals;
      return {
        modals: rest,
        shownAchievements:
          first?.kind === 'achievement'
            ? [...state.shownAchievements, first.slug]
            : state.shownAchievements,
      };
    });
  },
  dismissAchievements: () => {
    const slugs = get()
      .modals.filter((m) => m.kind === 'achievement')
      .map((m) => m.slug);
    set((state) => ({
      modals: state.modals.filter((m) => m.kind !== 'achievement'),
      shownAchievements: [...state.shownAchievements, ...slugs],
    }));
    return slugs;
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
    set({ modals: [], shownAchievements: [], checks: {} });
  },
}));

/** Último check de hoje do item que ainda pode ser desfeito (ou nulo). */
export function lastUndoableCheck(checks: FeedbackState['checks'], itemId: string): string | null {
  const entry = checks[itemId];
  if (!entry || entry.day !== today()) return null;
  return entry.checkIds.at(-1) ?? null;
}
