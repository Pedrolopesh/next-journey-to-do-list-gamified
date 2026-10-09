import type { Item } from '@nextjourney/contracts';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHome, useMe } from '@/api/queries';
import type { BannerViewHandle } from '@/banner/banner-view';
import { ExpToast } from '@/components/exp-toast';
import { ItemRow } from '@/components/item-row';
import { EmptyState, ErrorState, SkeletonList } from '@/components/states';
import { TabScreen } from '@/components/tab-screen';
import { useCheckFlow } from '@/features/check/use-check-flow';
import { colors, radius, space } from '@/theme';

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.counter} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.counterValue}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const banner = useRef<BannerViewHandle>(null);
  const dailyFlow = useCheckFlow({ type: 'daily', bannerRef: banner });
  const todoFlow = useCheckFlow({ type: 'todo', bannerRef: banner });
  const home = useHome();
  const { data: me } = useMe();

  const flowFor = (item: Item) => (item.type === 'todo' ? todoFlow : dailyFlow);
  const error = dailyFlow.error ?? todoFlow.error;
  const toast = dailyFlow.toast ?? todoFlow.toast;

  return (
    <TabScreen
      title={t('tabs.home')}
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
              <Counter value={home.data.counters.pendingDailies} label={t('home.pendingDailies')} />
              <Counter value={home.data.counters.pendingTasks} label={t('home.pendingTasks')} />
              <Counter value={home.data.counters.bestStreak} label={t('home.bestStreak')} />
            </View>

            {home.data.story ? (
              <View
                style={styles.story}
                accessibilityLabel={t('home.storyCard', { name: home.data.story.name })}
              >
                <Text style={styles.storyName}>{home.data.story.name}</Text>
                <Text style={styles.storyChapter}>
                  {t('home.chapter', {
                    number: home.data.story.chapter,
                    title: home.data.story.chapterTitle,
                  })}
                </Text>
                <View style={styles.bar}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.round((home.data.story.checksInChapter / home.data.story.requiredChecks) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.storyProgress}>
                  {t('home.itemsToAdvance', {
                    left: Math.max(
                      0,
                      home.data.story.requiredChecks - home.data.story.checksInChapter,
                    ),
                  })}
                </Text>
              </View>
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
  counters: { flexDirection: 'row', gap: space[8] },
  counter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingVertical: space[12],
  },
  counterValue: { color: colors.brand.gold, fontSize: 22, fontWeight: '700' },
  counterLabel: { color: colors.text.secondary, fontSize: 11, textAlign: 'center' },
  story: {
    gap: space[4],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: space[12],
  },
  storyName: { color: colors.text.primary, fontSize: 15, fontWeight: '600' },
  storyChapter: { color: colors.text.secondary, fontSize: 13 },
  bar: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.sunken,
    overflow: 'hidden',
    marginVertical: space[4],
  },
  barFill: { height: '100%', backgroundColor: colors.brand.primary },
  storyProgress: { color: colors.text.muted, fontSize: 12 },
  sectionTitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: space[8],
  },
  error: { color: colors.status.danger, fontSize: 13 },
  list: { gap: space[8] },
});
