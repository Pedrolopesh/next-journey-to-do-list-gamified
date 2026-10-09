import type { CheckResult, Item, ItemType, MeResponse } from '@nextjourney/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSessionStore } from '@/auth/session-store';

import { checkItem, fetchItems, fetchMe } from './endpoints';

export const queryKeys = {
  me: ['me'] as const,
  items: (type: ItemType) => ['items', type] as const,
};

export function useMe() {
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  return useQuery({ queryKey: queryKeys.me, queryFn: fetchMe, enabled: signedIn });
}

export function useItems(type: ItemType) {
  const signedIn = useSessionStore((state) => state.status === 'signedIn');
  return useQuery({
    queryKey: queryKeys.items(type),
    queryFn: () => fetchItems(type),
    enabled: signedIn,
  });
}

type CheckVariables = { itemId: string; checkId: string };

/**
 * Check com atualização otimista: o item aparece marcado na hora (menos de 100 ms) e o cache é
 * reconciliado com o CheckResult da API. Em erro, volta ao estado anterior. O app NÃO calcula EXP.
 */
export function useCheckItem(type: ItemType) {
  const queryClient = useQueryClient();
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
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.items(type), context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['items'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

/** Progresso do capítulo (0 a 1) a partir do GET /me, para posicionar o banner. */
export function chapterProgress(me: MeResponse | undefined): number {
  if (!me) return 0;
  const { story, requiredChecksInChapter } = me.player;
  if (story.completed) return 1;
  return Math.min(1, story.checksInChapter / requiredChecksInChapter);
}
