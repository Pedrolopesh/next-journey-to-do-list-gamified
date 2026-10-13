import type {
  BannerToAppMessage,
  CheckResult,
  Item,
  ItemType,
  MeResponse,
} from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isRetryableError, toApiError } from '@/api/errors';
import { queryKeys, useCheckItem, useMe, useUndoCheck } from '@/api/queries';
import type { BannerViewHandle } from '@/banner/banner-view';
import { useFeedbackStore } from '@/features/feedback/feedback-store';
import { buildModalQueue } from '@/features/feedback/modal-queue';
import { toast as showToast } from '@/features/feedback/toast-store';
import { useOfflineStore } from '@/features/offline/offline-store';
import { journeyView, levelProgress } from '@/features/qg/journey-progress';
import { useJourneyStore } from '@/features/qg/journey-store';
import { log } from '@/logging';

/** Se o banner não confirmar a troca de cena, o personagem é reposicionado mesmo assim depois deste prazo. */
const TRANSITION_FALLBACK_MS = 3500;

type Options = { type: ItemType; bannerRef: RefObject<BannerViewHandle | null> };

/**
 * Fluxo completo de um check (diário, tarefa ou hábito): vibração, banner na hora com o progresso
 * ESTIMADO, chamada à API, toast de EXP, fila de modais e desfazer. O app não calcula EXP.
 */
export function useCheckFlow({ type, bannerRef }: Options) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const check = useCheckItem(type);
  const undo = useUndoCheck();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Todo erro de check/desfazer também vira toast (a mensagem inline continua na lista)
  useEffect(() => {
    if (error) showToast.error(error);
  }, [error]);
  const afterTransition = useRef<(() => void) | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Fim da troca de cena: o personagem recomeça no novo nível, na posição da EXP. */
  const runAfterTransition = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    const next = afterTransition.current;
    afterTransition.current = null;
    next?.();
  }, []);

  const onBannerMessage = useCallback(
    (message: BannerToAppMessage) => {
      if (message.type === 'CHAPTER_TRANSITION_DONE') runAfterTransition();
    },
    [runAfterTransition],
  );

  const resetBanner = useCallback(() => {
    bannerRef.current?.reset();
  }, [bannerRef]);

  /**
   * Posição do personagem pela EXP do nível. Subiu de nível: corre até o portal e espera. Se o portal
   * já estava esperando, este check troca a cena (fade) e o personagem recomeça no nível novo.
   */
  const moveHero = useCallback(
    async (result: CheckResult, userId: string | undefined, portalWasPending: boolean) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      const fresh = queryClient.getQueryData<MeResponse>(queryKeys.me);
      if (!fresh) return;
      const send = (progress: number): void => {
        bannerRef.current?.send({ v: 1, type: 'ITEM_CHECKED', payload: { progress } });
      };
      if (portalWasPending && userId) {
        afterTransition.current = () => {
          useJourneyStore.getState().settle(userId, fresh.player.level);
          send(levelProgress(fresh.player));
        };
        bannerRef.current?.send({
          v: 1,
          type: 'CHAPTER_COMPLETED',
          payload: { nextSceneKey: `story-level-${result.level}` },
        });
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = setTimeout(runAfterTransition, TRANSITION_FALLBACK_MS);
        return;
      }
      send(result.leveledUp ? 1 : levelProgress(fresh.player));
    },
    [bannerRef, queryClient, runAfterTransition],
  );

  const handleCheck = useCallback(
    (item: Item) => {
      setError(null);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // 1) Banner na hora: o personagem comemora na posição atual (a posição nova vem com a resposta).
      // Com o portal esperando, nada se mexe agora: a troca de cena só acontece com o check confirmado.
      const userId = me?.user.id;
      const shown = userId ? useJourneyStore.getState().shownLevel[userId] : undefined;
      const view = me ? journeyView(me.player, shown) : null;
      const portalWasPending = view?.portalPending ?? false;
      if (view && !portalWasPending) {
        bannerRef.current?.send({
          v: 1,
          type: 'ITEM_CHECKED',
          payload: { progress: view.progress },
        });
      }

      // 2) API: o servidor decide EXP, nível, capítulo e conquistas
      const checkId = randomUUID();
      log.info('check.start', { itemId: item.id, type, checkId });
      check.mutate(
        { itemId: item.id, checkId },
        {
          onSuccess: (result) => {
            log.info('check.success', {
              itemId: item.id,
              checkId,
              expGained: result.expGained,
              chapterCompleted: result.chapterCompleted,
              levelUp: result.leveledUp,
            });
            useFeedbackStore.getState().rememberCheck(item.id, checkId);
            setToast(t('feedback.expToast', { exp: result.expGained }));

            const { now, afterBanner } = buildModalQueue(result);
            useFeedbackStore.getState().enqueue([...now, ...afterBanner]);
            void moveHero(result, userId, portalWasPending);
          },
          onError: (cause) => {
            // Sem rede: guarda na fila e segue (sincroniza sozinho ao voltar a conexão)
            log.warn('check.error', {
              itemId: item.id,
              checkId,
              code: toApiError(cause)?.code,
              retryable: isRetryableError(cause),
            });
            if (isRetryableError(cause)) {
              useOfflineStore
                .getState()
                .add({ itemId: item.id, type, checkId, queuedAt: Date.now() });
              useFeedbackStore.getState().rememberCheck(item.id, checkId);
              setToast(t('feedback.queuedOffline'));
              return;
            }
            const code = toApiError(cause)?.code;
            setError(
              code === 'ALREADY_CHECKED' || code === 'ALREADY_COMPLETED'
                ? t('feedback.alreadyDone')
                : t('feedback.checkFailed'),
            );
            resetBanner();
          },
        },
      );
    },
    [bannerRef, check, me, moveHero, resetBanner, t, type],
  );

  const handleUndo = useCallback(
    (item: Item, checkId: string) => {
      setError(null);
      log.info('check.undo', { itemId: item.id, checkId });
      // Check ainda na fila (nunca chegou ao servidor): basta tirar da fila
      if (useOfflineStore.getState().queue.some((queued) => queued.checkId === checkId)) {
        useOfflineStore.getState().remove([checkId]);
        useFeedbackStore.getState().forgetCheck(item.id, checkId);
        void queryClient.invalidateQueries({ queryKey: ['items'] });
        showToast.success(t('feedback.undone'));
        resetBanner();
        return;
      }
      undo.mutate(
        { itemId: item.id, checkId },
        {
          onSuccess: () => {
            useFeedbackStore.getState().forgetCheck(item.id, checkId);
            showToast.success(t('feedback.undone'));
            resetBanner();
          },
          onError: (cause) => {
            const code = toApiError(cause)?.code;
            useFeedbackStore.getState().forgetCheck(item.id, checkId);
            setError(
              code === 'CHECK_LOCKED'
                ? t('feedback.undoLocked')
                : code === 'UNDO_NOT_ALLOWED'
                  ? t('feedback.undoOtherDay')
                  : t('feedback.undoFailed'),
            );
          },
        },
      );
    },
    [queryClient, resetBanner, t, undo],
  );

  return { handleCheck, handleUndo, onBannerMessage, toast, setToast, error, setError };
}
