import { create } from 'zustand';

import type { ModalEntry } from './modal-queue';

type FeedbackState = {
  /** Modal queue (level, achievement, chapter): shown one at a time. */
  modals: ModalEntry[];
  enqueue: (entries: ModalEntry[]) => void;
  /** Achievements that already opened a modal in this session (avoids reopening while the notice is confirmed). */
  shownAchievements: string[];
  dismiss: () => void;
  /** Closes the queue's achievement notices at once ("Ver todas") and returns the slugs. */
  dismissAchievements: () => string[];
  /** Today's checks (per item) that can still be undone on this device. */
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

/** Last check of today for the item that can still be undone (or null). */
export function lastUndoableCheck(checks: FeedbackState['checks'], itemId: string): string | null {
  const entry = checks[itemId];
  if (!entry || entry.day !== today()) return null;
  return entry.checkIds.at(-1) ?? null;
}
