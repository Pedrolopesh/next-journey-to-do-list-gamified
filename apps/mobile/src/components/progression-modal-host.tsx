import { IconTrophy } from '@tabler/icons-react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { ackAchievements } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import { queryKeys, showNextPending, useAchievements } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { AchievementUnlockedModal } from '@/components/achievement-unlocked-modal';
import { Button } from '@/components/button';
import { tierColor } from '@/features/achievements/tier';
import { useFeedbackStore } from '@/features/feedback/feedback-store';
import type { ModalEntry } from '@/features/feedback/modal-queue';
import { log } from '@/logging';
import { colors, radius, space } from '@/theme';

/** Alerta de conquista nova (modal único do app). A descrição vem do catálogo, se já carregado. */
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
    // Confirma o aviso para não abrir de novo; se falhar, abre na próxima vez
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
 * Ao abrir o app, mostra UMA conquista pendente (a mais antiga), se houver. As demais saem uma por
 * ação (o servidor devolve uma pendente a cada check; criar item, categoria, personagem e evento
 * usam `showNextPending`), então nunca abrem juntas.
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

/** Mostra um modal de cada vez: subida de nível, conquista e capítulo concluído. */
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

  let header: string;
  let title: string;
  let text: string;
  switch (entry.kind) {
    case 'level':
      header = colors.brand.primary;
      title = t('feedback.levelUpTitle', { level: entry.level });
      text = t('feedback.levelUpText');
      break;
    case 'chapter':
      header = colors.brand.primaryLight;
      title = entry.storyCompleted
        ? t('feedback.storyCompleted')
        : t('feedback.chapterTitle', { number: entry.number });
      text = `${entry.title}\n\n${entry.text}`;
      break;
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={[styles.header, { backgroundColor: header }]}>
            <IconTrophy size={32} color={colors.bg.base} strokeWidth={1.75} />
          </View>
          <View style={styles.body}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.text}>{text}</Text>
            <Button label={t('feedback.continue')} onPress={dismiss} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[24],
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  header: { height: 72, alignItems: 'center', justifyContent: 'center' },
  body: { padding: space[20], gap: space[12] },
  title: { color: colors.text.primary, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  text: { color: colors.text.secondary, fontSize: 14, textAlign: 'center' },
});
