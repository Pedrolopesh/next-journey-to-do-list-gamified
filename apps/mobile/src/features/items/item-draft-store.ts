import type { ItemType } from '@nextjourney/contracts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DuePreset } from './due-presets';

/** What the new-item form holds while the person is still writing. */
export type ItemDraft = {
  type: ItemType;
  title: string;
  notes: string;
  difficulty: 'easy' | 'medium' | 'hard';
  categoryId: string | null;
  days: number[];
  due: DuePreset;
  dueTouched: boolean;
};

type DraftState = {
  /** Owner of the draft: another account on the same device never sees it. */
  userId: string | null;
  draft: ItemDraft | null;
  save: (userId: string, draft: ItemDraft) => void;
  clear: () => void;
};

/** True when there is nothing worth keeping yet. */
const isBlank = (draft: ItemDraft): boolean =>
  draft.title.trim() === '' && draft.notes.trim() === '';

/**
 * Draft of the item being created, kept on this device until it is saved. Task text is not
 * sensitive data, so plain AsyncStorage is enough.
 */
export const useItemDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      userId: null,
      draft: null,
      save: (userId, draft) => {
        set(isBlank(draft) ? { userId: null, draft: null } : { userId, draft });
      },
      clear: () => {
        set({ userId: null, draft: null });
      },
    }),
    { name: 'nextjourney.item-draft.v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
