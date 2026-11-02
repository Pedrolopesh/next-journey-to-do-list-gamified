import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHome, useMe } from '@/api/queries';
import { ActionButton } from '@/components/action-button';
import { CoinsInfoModal } from '@/components/info-modals';
import { StatCard } from '@/components/stat-card';
import { ErrorState, SkeletonList } from '@/components/states';
import { StoryProgressCard } from '@/components/story-progress-card';
import { TabScreen } from '@/components/tab-screen';
import { colors, fontSize, space } from '@/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const home = useHome();
  const { data: me } = useMe();
  const [coinsOpen, setCoinsOpen] = useState(false);

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
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting} accessibilityRole="header">
          {t('home.greeting', { name: me?.character?.name ?? me?.user.name ?? '' })}
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
                onPress={() => {
                  router.navigate('/dailies');
                }}
              />
              <StatCard
                art="tasks"
                value={home.data.counters.pendingTasks}
                label={t('home.pendingTasks')}
                onPress={() => {
                  router.navigate('/todos');
                }}
              />
              <StatCard
                art="streak"
                value={home.data.counters.bestStreak}
                label={t('home.bestStreak')}
                tone={colors.status.warning}
                onPress={() => {
                  router.navigate('/habits');
                }}
              />
              <StatCard
                art="coin"
                value={me?.player.coins ?? 0}
                label={t('home.coins')}
                tone={colors.brand.gold}
                onPress={() => {
                  setCoinsOpen(true);
                }}
              />
            </View>

            <StoryProgressCard />
          </>
        )}

        <CoinsInfoModal
          visible={coinsOpen}
          coins={me?.player.coins ?? 0}
          onClose={() => {
            setCoinsOpen(false);
          }}
        />
        <Text style={styles.section} accessibilityRole="header">
          {t('home.hqTitle')}
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
        </View>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[12], paddingBottom: space[40] },
  greeting: { color: colors.text.primary, fontSize: fontSize[20], fontWeight: '600' },
  section: {
    color: colors.text.secondary,
    fontSize: fontSize[13],
    fontWeight: '600',
    marginTop: space[8],
  },
  qgActions: { gap: space[8] },
  counters: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
});
