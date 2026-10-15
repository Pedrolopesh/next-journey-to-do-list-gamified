import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useCategories, useCreateItem, useItems, useMe } from '@/api/queries';
import { describeError } from '@/features/feedback/error-message';
import { toast } from '@/features/feedback/toast-store';

import { buildExampleRequests } from './examples';

const keyFor = (userId: string): string => `nextjourney.examples.v1.${userId}`;

/**
 * Na primeira vez que a pessoa abre o app sem nenhum item, cria os itens de exemplo (uma vez por
 * usuário, neste aparelho) e avisa por toast. Se falhar antes de criar o primeiro, tenta de novo na próxima abertura.
 */
export function useStarterExamples(): void {
  const { t } = useTranslation();
  const me = useMe();
  const categories = useCategories();
  const dailies = useItems('daily');
  const todos = useItems('todo');
  const habits = useItems('habit');
  const create = useCreateItem();
  const started = useRef(false);

  const userId = me.data?.user.id;
  const ready = [dailies, todos, habits].every((query) => query.isSuccess);
  const empty = ready && [dailies, todos, habits].every((query) => query.data?.length === 0);
  const categoryList = categories.data;

  useEffect(() => {
    if (started.current || !userId || !empty || !categoryList) return;
    started.current = true;
    const key = keyFor(userId);
    void (async () => {
      try {
        if ((await AsyncStorage.getItem(key)) !== null) return;
        const requests = buildExampleRequests(categoryList, (type, name) =>
          t(`examples.${type}.${name}`),
        );
        for (const request of requests) await create.mutateAsync(request);
        if (requests.length > 0) {
          await AsyncStorage.setItem(key, '1');
          toast.success(t('examples.added'));
        }
      } catch (error) {
        started.current = false;
        toast.error(describeError(error, t));
      }
    })();
  }, [userId, empty, categoryList, create, t]);
}
