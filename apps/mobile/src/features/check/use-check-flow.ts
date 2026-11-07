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
import { journeyView, levelProgress, sceneLevel } from '@/features/qg/journey-progress';
import { useJourneyStore } from '@/features/qg/journey-store';
import { log } from '@/logging';

/** If the banner does not confirm the scene change, the character is repositioned anyway after this deadline. */
const TRANSITION_FALLBACK_MS = 3500;

type Options = { type: ItemType; bannerRef: RefObject<BannerViewHandle | null> };

/**
 * Complete flow of a check (daily, task or habit): vibration, banner right away with the ESTIMATED
 * progress, API call, EXP toast, modal queue and undo. The app does not compute EXP.
 */
export function useCheckFlow({ type, bannerRef }: Options) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const check = useCheckItem(type);
  const undo = useUndoCheck();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Every check/undo error also becomes a toast (the inline message stays on the list)
  useEffect(() => {
    if (error) showToast.error(error);
  }, [error]);
  const afterTransition = useRef<(() => void) | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** End of the scene change: the character restarts at the new level, at the EXP position. */
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
   * Character position from the level's EXP. Leveled up: runs to the portal and waits. If the portal
   * was already waiting, this check switches the scene (fade) and the character restarts on the new level.
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
          useJourneyStore.getState().settle(userId, sceneLevel(fresh.player.level));
          send(levelProgress(fresh.player));
        };
        bannerRef.current?.send({
          v: 1,
          type: 'CHAPTER_COMPLETED',
          payload: { nextSceneKey: `story-level-${sceneLevel(result.level)}` },
        });
        clearTimeout(fallbackTimer.current);
        fallbackTimer.current = setTimeout(runAfterTransition, TRANSITION_FALLBACK_MS);
        return;
      }
      send(result.leveledUp ? 1 : levelProgress(fresh.player)); // story complete: always 1
    },
    [bannerRef, queryClient, runAfterTransition],
  );

  const handleCheck = useCallback(
    (item: Item) => {
      setError(null);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // 1) Banner right away: the character celebrates at the current position (the new position comes with the response).
      // With the portal waiting, nothing moves now: the scene change only happens with the check confirmed.
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

      // 2) API: the server decides EXP, level, chapter and achievements
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
            setToast(t('feedback.expToast', { exp: result.expGained, coins: result.coinsGained }));

            const { now, afterBanner } = buildModalQueue(result);
            useFeedbackStore.getState().enqueue([...now, ...afterBanner]);
            void moveHero(result, userId, portalWasPending);
          },
          onError: (cause) => {
            // No network: stores in the queue and goes on (syncs by itself when the connection returns)
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
      // Check still in the queue (never reached the server): just take it out of the queue
      if (useOfflineStore.getState().queue.some((queued) => queued.checkId === checkId)) {
        useOfflineStore.getState().remove([checkId]);
        useFeedbackStore.getState().forgetCheck(item.id, checkId);
        void queryClient.invalidateQueries({ queryKey: ['items'] });
        showToast.success(t('feedback.undone'));
        return;
      }
      undo.mutate(
        { itemId: item.id, checkId },
        {
          // EXP never goes back: the character stays where it is and only the coins decrease (yellow notice)
          onSuccess: (result) => {
            useFeedbackStore.getState().forgetCheck(item.id, checkId);
            const lost = Math.max(0, -result.coinsGained);
            if (lost > 0) showToast.warning(t('feedback.undoneCoins', { coins: lost }));
            else showToast.info(t('feedback.undoneNoCoins'));
          },
          onError: (cause) => {
            useFeedbackStore.getState().forgetCheck(item.id, checkId);
            // Already unchecked (repeated tap): the result is the expected one, not an error
            if (toApiError(cause)?.code === 'CHECK_ALREADY_REVERTED')
              showToast.info(t('feedback.undone'));
            else setError(t('feedback.undoFailed'));
          },
        },
      );
    },
    [queryClient, t, undo],
  );

  return { handleCheck, handleUndo, onBannerMessage, toast, setToast, error, setError };
}
