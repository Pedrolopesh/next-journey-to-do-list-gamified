import type { Item } from '@nextjourney/contracts';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHome, useMe } from '@/api/queries';
import type { BannerViewHandle } from '@/banner/banner-view';
import { ActionButton } from '@/components/action-button';
import { ExpToast } from '@/components/exp-toast';
import { HomeStoryCard } from '@/components/home-story-card';
import { ItemRow } from '@/components/item-row';
import { QgControls } from '@/components/qg-controls';
import { StatCard } from '@/components/stat-card';
import { EmptyState, ErrorState, SkeletonList } from '@/components/states';
import { TabScreen } from '@/components/tab-screen';
import { useCheckFlow } from '@/features/check/use-check-flow';
import { colors, space } from '@/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const banner = useRef<BannerViewHandle>(null);
  const dailyFlow = useCheckFlow({ type: 'daily', bannerRef: banner });
  const todoFlow = useCheckFlow({ type: 'todo', bannerRef: banner });
  const home = useHome();
  const { data: me } = useMe();
  const [showEnvironment, setShowEnvironment] = useState(false);

  const flowFor = (item: Item) => (item.type === 'todo' ? todoFlow : dailyFlow);
  const error = dailyFlow.error ?? todoFlow.error;
  const toast = dailyFlow.toast ?? todoFlow.toast;

  return (
    <TabScreen
      title={t('tabs.home')}
      scene="qg"
      bannerLabel={t('qg.sceneTitle')}
      bannerCaption={t('qg.sceneCaption')}
      bannerRef={banner}
      debug={false}
      onBannerMessage={(message) => {
        dailyFlow.onBannerMessage(message);
        todoFlow.onBannerMessage(message);
      }}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={home.isRefetching}
            onRefresh={() => {
              void home.refetch();
            }}
            tintColor={colors.brand.primaryLight}
          />
        }
      >
        <Text style={styles.greeting} accessibilityRole="header">
          {t('home.greeting', { name: me?.user.name ?? '' })}
        </Text>

        <View style={styles.qgActions}>
          <ActionButton
            art="character"
            title={t('qg.changeCharacter')}
            description={t('qg.changeCharacterDesc')}
            onPress={() => {
              router.push('/settings/character');
            }}
          />
          <ActionButton
            art="story"
            title={t('qg.changeStory')}
            description={t('qg.changeStoryDesc')}
            onPress={() => {
              router.push('/story/timeline');
            }}
          />
          <ActionButton
            art="scenery"
            title={showEnvironment ? t('qg.closeScenario') : t('qg.changeScenario')}
            description={t('qg.changeScenarioDesc')}
            onPress={() => {
              setShowEnvironment((open) => !open);
            }}
          />
        </View>
        {showEnvironment ? <QgControls /> : null}

        {home.isPending ? (
          <SkeletonList rows={2} />
        ) : home.isError ? (
          <ErrorState
            message={t('items.load')}
            retryLabel={t('items.retry')}
            onRetry={() => {
              void home.refetch();
            }}
          />
        ) : (
          <>
            <View style={styles.counters}>
              <StatCard
                art="dailies"
                value={home.data.counters.pendingDailies}
                label={t('home.pendingDailies')}
              />
              <StatCard
                art="tasks"
                value={home.data.counters.pendingTasks}
                label={t('home.pendingTasks')}
              />
              <StatCard
                art="streak"
                value={home.data.counters.bestStreak}
                label={t('home.bestStreak')}
                tone={colors.status.warning}
              />
              <StatCard
                art="coin"
                value={me?.player.coins ?? 0}
                label={t('home.coins')}
                tone={colors.brand.gold}
              />
            </View>

            {home.data.story ? (
              <HomeStoryCard
                name={home.data.story.name}
                chapter={home.data.story.chapter}
                chapterTitle={home.data.story.chapterTitle}
                level={me?.player.level ?? 1}
                expInLevel={home.data.story.expInLevel}
                expForNextLevel={home.data.story.expForNextLevel}
                completed={home.data.story.completed}
              />
            ) : null}

            <Text style={styles.sectionTitle}>{t('home.today')}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {home.data.today.length === 0 ? (
              <EmptyState title={t('home.todayEmpty')} />
            ) : (
              <View style={styles.list}>
                {home.data.today.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onCheck={flowFor(item).handleCheck}
                    onOpen={(target) => {
                      router.push({ pathname: '/item/[id]', params: { id: target.id } });
                    }}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <ExpToast
        message={toast}
        onHidden={() => {
          dailyFlow.setToast(null);
          todoFlow.setToast(null);
        }}
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[12], paddingBottom: space[40] },
  greeting: { color: colors.text.primary, fontSize: 20, fontWeight: '600' },
  qgActions: { gap: space[8] },
  counters: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  sectionTitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: space[8],
  },
  error: { color: colors.status.danger, fontSize: 13 },
  list: { gap: space[8] },
});
