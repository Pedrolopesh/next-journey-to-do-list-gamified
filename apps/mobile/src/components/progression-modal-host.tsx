import { IconFlag, IconTrophy } from '@tabler/icons-react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ackAchievements } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import { queryKeys, showNextPending, useAchievements } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { AchievementUnlockedModal } from '@/components/achievement-unlocked-modal';
import { CelebrationModal } from '@/components/celebration-modal';
import { tierColor } from '@/features/achievements/tier';
import { useFeedbackStore } from '@/features/feedback/feedback-store';
import type { ModalEntry } from '@/features/feedback/modal-queue';
import { log } from '@/logging';
import { colors } from '@/theme';

/** New achievement alert (the app's single modal). The description comes from the catalog, if already loaded. */
function AchievementAlert({
  entry,
  onDismiss,
}: {
  entry: Extract<ModalEntry, { kind: 'achievement' }>;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const { data } = useAchievements();
  const queryClient = useQueryClient();
  const found = data?.find((item) => item.slug === entry.slug);
  const confirm = (slugs: string[]): void => {
    // Confirms the notice so it does not open again; if it fails, it opens next time
    void ackAchievements(slugs)
      .catch((cause: unknown) => {
        log.warn('achievement.ack_failed', { slug: entry.slug, code: toApiError(cause)?.code });
      })
      .finally(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.achievements });
      });
  };
  const close = (): void => {
    onDismiss();
    confirm([entry.slug]);
  };
  return (
    <AchievementUnlockedModal
      visible
      name={entry.name}
      description={found?.description ?? undefined}
      glyph={entry.glyph}
      tierColor={tierColor(entry.tier)}
      onContinue={close}
      onSeeAll={() => {
        const slugs = useFeedbackStore.getState().dismissAchievements();
        confirm(slugs.length > 0 ? slugs : [entry.slug]);
        router.push('/achievements');
      }}
    />
  );
}

/**
 * On app open, shows ONE pending achievement (the oldest), if any. The others come out one per
 * action (the server returns one pending per check; creating an item, category, character and event
 * use `showNextPending`), so they never open together.
 */
function usePendingAchievements(): void {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.user?.id ?? null);
  const checkedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || checkedFor.current === userId) return;
    checkedFor.current = userId;
    void showNextPending(queryClient);
  }, [queryClient, userId]);
}

/** Shows one modal at a time: level up, achievement and completed chapter. */
export function ProgressionModalHost() {
  const { t } = useTranslation();
  const entry = useFeedbackStore((state) => state.modals[0]);
  const dismiss = useFeedbackStore((state) => state.dismiss);
  usePendingAchievements();

  useEffect(() => {
    if (entry?.kind === 'level')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [entry]);

  if (!entry) return null;
  if (entry.kind === 'achievement') {
    return <AchievementAlert entry={entry} onDismiss={dismiss} />;
  }

  const level = entry.kind === 'level';
  return (
    <CelebrationModal
      visible
      tone={level ? colors.brand.primary : colors.brand.primaryLight}
      art={
        level ? (
          <IconTrophy size={64} color={colors.brand.primary} strokeWidth={1.75} />
        ) : (
          <IconFlag size={64} color={colors.brand.primary} strokeWidth={1.75} />
        )
      }
      headline={
        entry.kind === 'level'
          ? t('feedback.levelUpTitle', { level: entry.level })
          : entry.storyCompleted
            ? t('feedback.storyCompleted')
            : t('feedback.chapterTitle', { number: entry.number })
      }
      title={entry.kind === 'level' ? t('feedback.levelUpHeading') : entry.title}
      description={entry.kind === 'level' ? t('feedback.levelUpText') : entry.text}
      primaryLabel={t('feedback.continue')}
      onPrimary={dismiss}
      onClose={dismiss}
    />
  );
}
