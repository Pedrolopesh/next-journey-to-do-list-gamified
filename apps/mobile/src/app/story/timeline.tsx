import { IconCheck, IconLock } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useTimeline } from '@/api/queries';
import { ScreenFrame } from '@/components/screen-frame';
import { ErrorState, SkeletonList } from '@/components/states';
import { colors, radius, space } from '@/theme';

/** Minha história (RF-29): concluídos com check verde, atual com borda roxa e futuros com cadeado. */
export default function TimelineScreen() {
  const { t } = useTranslation();
  const timeline = useTimeline();

  return (
    <ScreenFrame title={t('profile.myStory')}>
      {timeline.isPending ? (
        <SkeletonList />
      ) : timeline.isError ? (
        <ErrorState
          message={t('items.load')}
          retryLabel={t('items.retry')}
          onRetry={() => {
            void timeline.refetch();
          }}
        />
      ) : (
        <>
          <Text style={styles.story}>{timeline.data.story.name}</Text>
          {timeline.data.chapters.map((chapter) => (
            <View
              key={chapter.number}
              style={[
                styles.card,
                chapter.state === 'current' && styles.current,
                chapter.state === 'locked' && styles.locked,
              ]}
              accessibilityLabel={`${t('timeline.chapter', { number: chapter.number })}: ${chapter.title}. ${t(`timeline.state.${chapter.state}`)}`}
            >
              <View style={styles.titleRow}>
                {chapter.state === 'completed' ? (
                  <IconCheck size={16} color={colors.status.success} strokeWidth={2.25} />
                ) : chapter.state === 'locked' ? (
                  <IconLock size={16} color={colors.text.muted} strokeWidth={1.75} />
                ) : null}
                <Text style={styles.chapterTitle}>
                  {t('timeline.chapter', { number: chapter.number })}: {chapter.title}
                </Text>
              </View>
              {chapter.state === 'current' ? (
                <Text style={styles.condition}>
                  {t('timeline.condition', {
                    current: chapter.checksInChapter ?? 0,
                    total: chapter.requiredChecks,
                  })}
                </Text>
              ) : null}
              {chapter.text ? <Text style={styles.text}>{chapter.text}</Text> : null}
            </View>
          ))}
        </>
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  story: { color: colors.brand.primaryLight, fontSize: 16, fontWeight: '600' },
  card: {
    gap: space[4],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: space[12],
  },
  current: { borderColor: colors.brand.primary, borderWidth: 2 },
  locked: { opacity: 0.55 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  chapterTitle: { color: colors.text.primary, fontSize: 15, fontWeight: '600', flex: 1 },
  condition: { color: colors.brand.primaryLight, fontSize: 13 },
  text: { color: colors.text.secondary, fontSize: 13 },
});
