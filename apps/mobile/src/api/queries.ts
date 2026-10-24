import type { CheckResult, Item, ItemType, MeResponse } from '@nextjourney/contracts';
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
  // começa com 'items': qualquer check ou desmarcar recarrega o histórico junto
  history: ['items', 'history'] as const,
  stories: ['stories'] as const,
  timeline: ['timeline'] as const,
  achievements: ['achievements'] as const,
  categories: ['categories'] as const,
  cosmetics: ['cosmetics'] as const,
  sessions: ['sessions'] as const,
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

/** Histórico de tarefas concluídas, paginado pelo instante de conclusão. */
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

/** Capítulos de qualquer história do catálogo (Minha história: ver outra sem trocar a ativa). */
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

/**
 * Depois de uma ação que não devolve conquistas (criar item ou categoria, salvar personagem, evento):
 * busca as pendentes e mostra só a mais antiga, e só se nenhum modal estiver aberto. Assim cada
 * ação abre no máximo um modal de conquista.
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
    // Sem rede: a conquista continua pendente e aparece na próxima ação
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

/** Barra de progresso da história (0 a 1): cheia com a história concluída, senão a EXP do capítulo. */
export function storyRatio(me: MeResponse | undefined): number {
  return me?.player.story.completed ? 1 : chapterProgress(me);
}

/** Progresso do capítulo (0 a 1): a EXP dentro do nível, que também move o personagem no banner. */
export function chapterProgress(me: MeResponse | undefined): number {
  if (!me) return 0;
  const { expInLevel, expForNextLevel } = me.player;
  return Math.min(1, Math.max(0, expInLevel / expForNextLevel));
}
