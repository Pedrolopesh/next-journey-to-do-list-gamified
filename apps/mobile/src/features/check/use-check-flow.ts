import type { BannerToAppMessage, Item, ItemType } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { type RefObject, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isRetryableError, toApiError } from '@/api/errors';
import { chapterProgress, useCheckItem, useMe, useUndoCheck } from '@/api/queries';
import type { BannerViewHandle } from '@/banner/banner-view';
import { useFeedbackStore } from '@/features/feedback/feedback-store';
import { buildModalQueue, type ModalEntry } from '@/features/feedback/modal-queue';
import { useOfflineStore } from '@/features/offline/offline-store';

/** Se o banner não confirmar a transição de capítulo, o modal abre mesmo assim depois deste prazo. */
const CHAPTER_MODAL_FALLBACK_MS = 3500;

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
  const pendingChapter = useRef<ModalEntry[]>([]);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const releaseChapterModal = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    if (pendingChapter.current.length > 0) {
      useFeedbackStore.getState().enqueue(pendingChapter.current);
      pendingChapter.current = [];
    }
  }, []);

  /** Mensagens do banner: ao terminar a transição de capítulo, abre o modal do capítulo. */
  const onBannerMessage = useCallback(
    (message: BannerToAppMessage) => {
      if (message.type === 'CHAPTER_TRANSITION_DONE') releaseChapterModal();
    },
    [releaseChapterModal],
  );

  const resetBanner = useCallback(() => {
    // volta o banner à posição real, sem animação
    bannerRef.current?.send({
      v: 1,
      type: 'INIT',
      payload: {
        scene: 'map',
        character: { skin: 'light', hair: 'short-brown', outfit: 'tunic-purple' },
        sceneKey: `story-${me?.story?.slug ?? '1'}-chapter-${me?.player.story.chapter ?? 1}`,
        progress: chapterProgress(me),
        timeOfDay: 'night',
      },
    });
  }, [bannerRef, me]);

  const handleCheck = useCallback(
    (item: Item) => {
      setError(null);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // 1) Banner na hora, com o progresso estimado (checks do capítulo + 1 sobre o necessário)
      if (me) {
        const { story, requiredChecksInChapter } = me.player;
        const estimated = Math.min(1, (story.checksInChapter + 1) / requiredChecksInChapter);
        bannerRef.current?.send({ v: 1, type: 'ITEM_CHECKED', payload: { progress: estimated } });
      }

      // 2) API: o servidor decide EXP, nível, capítulo e conquistas
      const checkId = randomUUID();
      check.mutate(
        { itemId: item.id, checkId },
        {
          onSuccess: (result) => {
            useFeedbackStore.getState().rememberCheck(item.id, checkId);
            setToast(t('feedback.expToast', { exp: result.expGained }));

            const { now, afterBanner } = buildModalQueue(result);
            useFeedbackStore.getState().enqueue(now);
            if (result.chapterCompleted) {
              pendingChapter.current = afterBanner;
              bannerRef.current?.send({
                v: 1,
                type: 'CHAPTER_COMPLETED',
                payload: { nextSceneKey: `story-chapter-${result.chapterProgress.chapter}` },
              });
              clearTimeout(fallbackTimer.current);
              fallbackTimer.current = setTimeout(releaseChapterModal, CHAPTER_MODAL_FALLBACK_MS);
            } else {
              const { checksInChapter, requiredChecks } = result.chapterProgress;
              bannerRef.current?.send({
                v: 1,
                type: 'ITEM_CHECKED',
                payload: { progress: Math.min(1, checksInChapter / requiredChecks) },
              });
            }
          },
          onError: (cause) => {
            // Sem rede: guarda na fila e segue (sincroniza sozinho ao voltar a conexão)
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
    [bannerRef, check, me, releaseChapterModal, resetBanner, t, type],
  );

  const handleUndo = useCallback(
    (item: Item, checkId: string) => {
      setError(null);
      // Check ainda na fila (nunca chegou ao servidor): basta tirar da fila
      if (useOfflineStore.getState().queue.some((queued) => queued.checkId === checkId)) {
        useOfflineStore.getState().remove([checkId]);
        useFeedbackStore.getState().forgetCheck(item.id, checkId);
        void queryClient.invalidateQueries({ queryKey: ['items'] });
        resetBanner();
        return;
      }
      undo.mutate(
        { itemId: item.id, checkId },
        {
          onSuccess: () => {
            useFeedbackStore.getState().forgetCheck(item.id, checkId);
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
