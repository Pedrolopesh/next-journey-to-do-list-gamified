import { IconCheck, IconLock } from '@tabler/icons-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { chooseStory } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import { refreshGameData, useMe, useStories, useStoryTimeline } from '@/api/queries';
import { Button } from '@/components/button';
import { ErrorState, SkeletonList } from '@/components/states';
import { TabScreen } from '@/components/tab-screen';
import { useAction } from '@/features/feedback/use-action';
import { colors, radius, space } from '@/theme';

/**
 * Minha história (RF-29): o banner da jornada em cima, as histórias (uma por cenário) para escolher
 * e os capítulos da história selecionada. Concluídos com check, atual com borda e progresso, futuros
 * com cadeado. Cada nível ganho na história ativa conclui um capítulo; o de cada história fica salvo.
 */
export default function TimelineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const stories = useStories();
  const activeSlug = me?.story?.slug ?? null;
  const [picked, setPicked] = useState<string | null>(null);
  const slug = picked ?? activeSlug ?? stories.data?.[0]?.slug ?? null;
  const timeline = useStoryTimeline(slug);
  const selected = stories.data?.find((story) => story.slug === slug);

  const { run, loading } = useAction({
    name: 'story.choose',
    success: selected ? t('timeline.storySelected', { name: selected.name }) : t('story.saved'),
    error: (cause) => toApiError(cause)?.message ?? t('timeline.storyFailed'),
  });

  const play = (): Promise<boolean> =>
    run(async () => {
      if (!slug) return;
      await chooseStory(slug);
      refreshGameData(queryClient);
    });

  return (
    <TabScreen
      title={t('profile.myStory')}
      onBack={() => {
        router.back();
      }}
      debug={false}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading} accessibilityRole="header">
          {t('timeline.pickStory')}
        </Text>

        {stories.isPending ? (
          <SkeletonList rows={2} />
        ) : stories.isError ? (
          <ErrorState
            message={t('items.load')}
            retryLabel={t('items.retry')}
            onRetry={() => {
              void stories.refetch();
            }}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cards}
          >
            {stories.data.map((story) => {
              const isSelected = story.slug === slug;
              return (
                <Pressable
                  key={story.slug}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${t('timeline.storyTab', { name: story.name })}. ${t('timeline.chaptersDone', { done: story.chaptersCompleted, total: story.chapterCount })}${story.isActive ? `. ${t('timeline.activeBadge')}` : ''}`}
                  onPress={() => {
                    setPicked(story.slug);
                  }}
                  style={[
                    styles.storyCard,
                    { borderColor: isSelected ? story.themeColor : colors.border.subtle },
                    isSelected && styles.storyCardSelected,
                  ]}
                >
                  <Text style={[styles.storyName, { color: story.themeColor }]} numberOfLines={1}>
                    {story.name}
                  </Text>
                  <Text style={styles.storyMeta}>
                    {t('timeline.chaptersDone', {
                      done: story.chaptersCompleted,
                      total: story.chapterCount,
                    })}
                  </Text>
                  {story.isActive ? (
                    <Text style={styles.badge}>{t('timeline.activeBadge')}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {selected ? (
          <View style={styles.summary}>
            <Text style={styles.description}>{selected.description}</Text>
            {!selected.isActive ? (
              <Button
                label={t('timeline.playStory')}
                loading={loading}
                onPress={() => void play()}
              />
            ) : null}
          </View>
        ) : null}

        <Text style={styles.heading} accessibilityRole="header">
          {t('timeline.chapters')}
        </Text>
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
          timeline.data.chapters.map((chapter) => {
            const percent =
              chapter.expInLevel !== null && chapter.expForNextLevel
                ? Math.round(Math.min(1, chapter.expInLevel / chapter.expForNextLevel) * 100)
                : null;
            return (
              <View
                key={chapter.number}
                style={[
                  styles.chapter,
                  chapter.state === 'current' && styles.current,
                  chapter.state === 'locked' && styles.locked,
                ]}
                accessibilityLabel={`${t('timeline.chapter', { number: chapter.number })}: ${chapter.title}. ${t(`timeline.state.${chapter.state}`)}`}
              >
                <View style={styles.titleRow}>
                  <View
                    style={[styles.badgeIcon, chapter.state === 'completed' && styles.badgeDone]}
                  >
                    {chapter.state === 'completed' ? (
                      <IconCheck size={16} color={colors.text.onPrimary} strokeWidth={2.5} />
                    ) : chapter.state === 'locked' ? (
                      <IconLock size={15} color={colors.text.muted} strokeWidth={1.75} />
                    ) : (
                      <Text style={styles.badgeNumber}>{chapter.number}</Text>
                    )}
                  </View>
                  <View style={styles.titleBox}>
                    <Text style={styles.chapterNumber}>
                      {t('timeline.chapter', { number: chapter.number })}
                    </Text>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  </View>
                </View>
                {percent !== null && chapter.expInLevel !== null && chapter.expForNextLevel ? (
                  <View style={styles.progress}>
                    <View style={styles.bar}>
                      <View style={[styles.fill, { width: `${percent}%` }]} />
                    </View>
                    <Text style={styles.condition}>
                      {t('timeline.progress', {
                        exp: chapter.expInLevel,
                        next: chapter.expForNextLevel,
                      })}
                    </Text>
                  </View>
                ) : null}
                {chapter.text ? <Text style={styles.text}>{chapter.text}</Text> : null}
                {chapter.state === 'locked' ? (
                  <Text style={styles.hint}>{t('timeline.lockedHint')}</Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[12], paddingBottom: space[40] },
  heading: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
  cards: { gap: space[8], paddingRight: space[16] },
  storyCard: {
    width: 150,
    gap: space[4],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space[12],
  },
  storyCardSelected: { borderWidth: 2 },
  storyName: { fontSize: 15, fontWeight: '700' },
  storyMeta: { color: colors.text.secondary, fontSize: 12 },
  badge: { color: colors.status.success, fontSize: 11, fontWeight: '700' },
  summary: { gap: space[8] },
  description: { color: colors.text.secondary, fontSize: 13 },
  chapter: {
    gap: space[8],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: space[12],
  },
  current: { borderColor: colors.brand.primary, borderWidth: 2 },
  locked: { opacity: 0.55 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.sunken,
  },
  badgeDone: { backgroundColor: colors.status.success },
  badgeNumber: { color: colors.brand.primaryLight, fontSize: 14, fontWeight: '700' },
  titleBox: { flex: 1 },
  chapterNumber: { color: colors.text.muted, fontSize: 11, fontWeight: '600' },
  chapterTitle: { color: colors.text.primary, fontSize: 15, fontWeight: '600' },
  progress: { gap: space[4] },
  bar: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.sunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.brand.primary, borderRadius: radius.pill },
  condition: { color: colors.brand.primaryLight, fontSize: 12 },
  text: { color: colors.text.secondary, fontSize: 13 },
  hint: { color: colors.text.muted, fontSize: 12 },
});
