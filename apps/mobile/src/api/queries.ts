import type { CheckResult, Item, ItemType, MeResponse } from '@nextjourney/contracts';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSessionStore } from '@/auth/session-store';

import {
  checkItem,
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  fetchAchievements,
  fetchCategories,
  fetchCosmetics,
  fetchHome,
  fetchItems,
  fetchMe,
  fetchStories,
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
  stories: ['stories'] as const,
  timeline: ['timeline'] as const,
  achievements: ['achievements'] as const,
  categories: ['categories'] as const,
  cosmetics: ['cosmetics'] as const,
};

function useSignedIn(): boolean {
  return useSessionStore((state) => state.status === 'signedIn');
}

export const useMe = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.me, queryFn: fetchMe, enabled });
};

export const useHome = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.home, queryFn: fetchHome, enabled });
};

export const useItems = (type: ItemType) => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.items(type), queryFn: () => fetchItems(type), enabled });
};

export const useStories = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.stories, queryFn: fetchStories, enabled });
};

export const useTimeline = () => {
  const enabled = useSignedIn();
  return useQuery({ queryKey: queryKeys.timeline, queryFn: fetchTimeline, enabled });
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

/** Depois de qualquer mudança de jogo, estes dados podem ter mudado. */
/** Recarrega tudo que depende do progresso (itens, perfil, home, história, conquistas). */
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
 * Check com atualização otimista: o item aparece marcado na hora (menos de 100 ms) e o cache é
 * reconciliado com o CheckResult da API. Em erro, volta ao estado anterior. O app NÃO calcula EXP.
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
      // Sem rede o check vai para a fila offline: o item continua marcado até sincronizar
      if (isRetryableError(error)) return;
      if (context?.previous) queryClient.setQueryData(queryKeys.items(type), context.previous);
    },
    onSettled: refresh,
  });
}

/** Desfazer um check (só no mesmo dia). O servidor devolve o que foi revertido. */
export function useUndoCheck() {
  const refresh = useRefreshGameData();
  return useMutation<CheckResult, Error, CheckVariables>({
    mutationFn: ({ itemId, checkId }) => undoCheck(itemId, checkId),
    onSettled: refresh,
  });
}

export function useCreateItem() {
  const refresh = useRefreshGameData();
  return useMutation({ mutationFn: createItem, onSuccess: refresh });
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
    create: useMutation({ mutationFn: createCategory, onSuccess: done }),
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

/** Progresso do capítulo (0 a 1) a partir do GET /me, para posicionar o banner. */
export function chapterProgress(me: MeResponse | undefined): number {
  if (!me) return 0;
  const { story, requiredChecksInChapter } = me.player;
  if (story.completed) return 1;
  return Math.min(1, story.checksInChapter / requiredChecksInChapter);
}
