import type { CheckResult, Item, ItemType, LegalSlug, MeResponse } from '@nextjourney/contracts';
import {
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useSessionStore } from '@/auth/session-store';
import { useFeedbackStore } from '@/features/feedback/feedback-store';

import {
  checkItem,
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  fetchAchievements,
  fetchCategories,
  fetchCosmetics,
  fetchHistory,
  fetchHome,
  fetchItems,
  fetchLegalDocument,
  fetchMe,
  fetchSessions,
  fetchStories,
  fetchStoryTimeline,
  fetchTimeline,
  undoCheck,
  updateCategory,
  updateItem,
} from './endpoints';
import { isRetryableError } from './errors';

export const queryKeys = {
  me: ['me'] as const,
  home: ['home'] as const,
  items: (type: ItemType) => ['items', type] as const,
  // starts with 'items': any check or uncheck reloads the history too
  history: ['items', 'history'] as const,
  stories: ['stories'] as const,
  timeline: ['timeline'] as const,
  achievements: ['achievements'] as const,
  categories: ['categories'] as const,
  cosmetics: ['cosmetics'] as const,
  sessions: ['sessions'] as const,
  legal: (slug: LegalSlug) => ['legal', slug] as const,
};

function useSignedIn(): boolean {
  return useSessionStore((state) => state.status === 'signedIn');
}

export const useMe = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.me, queryFn: fetchMe, enabled });
};

export const useSessions = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.sessions, queryFn: fetchSessions, enabled });
};

export const useHome = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.home, queryFn: fetchHome, enabled });
};

export const useItems = (type: ItemType) => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.items(type), queryFn: () => fetchItems(type), enabled });
};

/** History of completed tasks, paged by completion time. */
export const useHistory = () => {
  const enabled = useSignedIn();
  return useInfiniteQuery({
    queryKey: queryKeys.history,
    queryFn: ({ pageParam }) => fetchHistory(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
};

export const useStories = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.stories, queryFn: fetchStories, enabled });
};

export const useTimeline = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.timeline, queryFn: fetchTimeline, enabled });
};

/** Chapters of any story in the catalog (My story: view another without switching the active one). */
export const useStoryTimeline = (slug: string | null) => {
  const enabled = useSignedIn() && slug !== null;
  return useQuery({
    queryKey: [...queryKeys.timeline, slug] as const,
    queryFn: () => fetchStoryTimeline(slug ?? ''),
    enabled,
  });
};

export const useAchievements = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.achievements, queryFn: fetchAchievements, enabled });
};

export const useCategories = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.categories, queryFn: fetchCategories, enabled });
};

export const useCosmetics = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.cosmetics, queryFn: fetchCosmetics, enabled });
};

/** After any game change, this data may have changed. */
/** Reloads everything that depends on progress (items, profile, home, story, achievements). */
export function refreshGameData(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['items'] });
  void queryClient.invalidateQueries({ queryKey: queryKeys.me });
  void queryClient.invalidateQueries({ queryKey: queryKeys.home });
  void queryClient.invalidateQueries({ queryKey: queryKeys.timeline });
  void queryClient.invalidateQueries({ queryKey: queryKeys.achievements });
  void queryClient.invalidateQueries({ queryKey: queryKeys.stories });
}

function useRefreshGameData() {
  const queryClient = useQueryClient();
  return () => {
    refreshGameData(queryClient);
  };
}

type CheckVariables = { itemId: string; checkId: string };

/**
 * Check with optimistic update: the item shows as checked right away (under 100 ms) and the cache is
 * reconciled with the API's CheckResult. On error it goes back to the previous state. The app does NOT compute EXP.
 */
export function useCheckItem(type: ItemType) {
  const queryClient = useQueryClient();
  const refresh = useRefreshGameData();
  return useMutation<CheckResult, Error, CheckVariables, { previous: Item[] | undefined }>({
    mutationFn: ({ itemId, checkId }) => checkItem(itemId, checkId),
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.items(type) });
      const previous = queryClient.getQueryData<Item[]>(queryKeys.items(type));
      queryClient.setQueryData<Item[]>(queryKeys.items(type), (items) =>
        items?.map((item) =>
          item.id === itemId
            ? {
                ...item,
                doneToday: true,
                checksToday: item.checksToday + 1,
                checksThisWeek: item.checksThisWeek + 1,
              }
            : item,
        ),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      // No network: the check goes to the offline queue and the item stays checked until it syncs
      if (isRetryableError(error)) return;
      if (context?.previous) queryClient.setQueryData(queryKeys.items(type), context.previous);
    },
    onSettled: refresh,
  });
}

/** Undo a check (same day only). The server returns what was reverted. */
export function useUndoCheck() {
  const refresh = useRefreshGameData();
  return useMutation<CheckResult, Error, CheckVariables>({
    mutationFn: ({ itemId, checkId }) => undoCheck(itemId, checkId),
    onSettled: refresh,
  });
}

/**
 * After an action that returns no achievements (create item or category, save character, event):
 * fetches the pending ones and shows only the oldest, and only if no modal is open. This way each
 * action opens at most one achievement modal.
 */
export async function showNextPending(queryClient: QueryClient): Promise<void> {
  try {
    const list = await queryClient.fetchQuery({
      queryKey: queryKeys.achievements,
      queryFn: fetchAchievements,
      staleTime: 0,
    });
    if (useFeedbackStore.getState().modals.length > 0) return;
    const [oldest] = list
      .filter((item) => item.pending)
      .sort((a, b) => (a.unlockedAt ?? '').localeCompare(b.unlockedAt ?? ''));
    if (!oldest) return;
    useFeedbackStore.getState().enqueue([
      {
        kind: 'achievement',
        slug: oldest.slug,
        name: oldest.name,
        tier: oldest.tier,
        glyph: oldest.glyph,
      },
    ]);
  } catch {
    // No network: the achievement stays pending and shows up on the next action
  }
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  const refresh = useRefreshGameData();
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      refresh();
      void showNextPending(queryClient);
    },
  });
}

export function useUpdateItem() {
  const refresh = useRefreshGameData();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateItem>[1] }) =>
      updateItem(id, body),
    onSuccess: refresh,
  });
}

export function useDeleteItem() {
  const refresh = useRefreshGameData();
  return useMutation({ mutationFn: deleteItem, onSuccess: refresh });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const refresh = useRefreshGameData();
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    refresh();
  };
  return {
    create: useMutation({
      mutationFn: createCategory,
      onSuccess: () => {
        done();
        void showNextPending(queryClient);
      },
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateCategory>[1] }) =>
        updateCategory(id, body),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: ({ id, moveTo }: { id: string; moveTo?: string }) => deleteCategory(id, moveTo),
      onSuccess: done,
    }),
  };
}

/** Story progress bar (0 to 1): full when the story is complete, otherwise the chapter's EXP. */
export function storyRatio(me: MeResponse | undefined): number {
  return me?.player.story.completed ? 1 : chapterProgress(me);
}

/** Chapter progress (0 to 1): the EXP within the level, which also moves the character on the banner. */
export function chapterProgress(me: MeResponse | undefined): number {
  if (!me) return 0;
  const { expInLevel, expForNextLevel } = me.player;
  return Math.min(1, Math.max(0, expInLevel / expForNextLevel));
}

/** A legal text served by the API. It rarely changes, so it stays fresh for an hour. */
export const useLegalDocument = (slug: LegalSlug) =>
  useQuery({
    queryKey: queryKeys.legal(slug),
    queryFn: () => fetchLegalDocument(slug),
    staleTime: 60 * 60 * 1000,
  });
