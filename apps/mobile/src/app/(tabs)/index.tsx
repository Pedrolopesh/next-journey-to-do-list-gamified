import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHome, useMe } from '@/api/queries';
import { ActionButton } from '@/components/action-button';
import { QgControls } from '@/components/qg-controls';
import { StatCard } from '@/components/stat-card';
import { ErrorState, SkeletonList } from '@/components/states';
import { StoryProgressCard } from '@/components/story-progress-card';
import { TabScreen } from '@/components/tab-screen';
import { colors, space } from '@/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const home = useHome();
  const { data: me } = useMe();
  const [showEnvironment, setShowEnvironment] = useState(false);

  return (
    <TabScreen
      title={t('tabs.home')}
      scene="qg"
      bannerLabel={t('qg.sceneTitle')}
      bannerCaption={t('qg.sceneCaption')}
      debug={false}
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

            <StoryProgressCard />
          </>
        )}

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
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[12], paddingBottom: space[40] },
  greeting: { color: colors.text.primary, fontSize: 20, fontWeight: '600' },
  qgActions: { gap: space[8] },
  counters: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
});
