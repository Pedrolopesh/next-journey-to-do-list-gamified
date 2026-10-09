import { IconTrophy } from '@tabler/icons-react-native';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { useFeedbackStore } from '@/features/feedback/feedback-store';
import { colors, radius, space } from '@/theme';

/** Mostra um modal de cada vez: subida de nível, conquista e capítulo concluído. */
export function ProgressionModalHost() {
  const { t } = useTranslation();
  const entry = useFeedbackStore((state) => state.modals[0]);
  const dismiss = useFeedbackStore((state) => state.dismiss);

  useEffect(() => {
    if (entry?.kind === 'level')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [entry]);

  if (!entry) return null;

  let header: string;
  let title: string;
  let text: string;
  switch (entry.kind) {
    case 'level':
      header = colors.brand.primary;
      title = t('feedback.levelUpTitle', { level: entry.level });
      text = t('feedback.levelUpText');
      break;
    case 'achievement':
      header = colors.brand.gold;
      title = entry.name;
      text = entry.rewardKey
        ? t('feedback.achievementReward', { reward: entry.rewardKey })
        : t('feedback.achievementTitle');
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
