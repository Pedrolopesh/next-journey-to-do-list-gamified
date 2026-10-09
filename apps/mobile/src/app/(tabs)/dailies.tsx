import type { Item } from '@nextjourney/contracts';
import { randomUUID } from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { chapterProgress, useCheckItem, useItems, useMe } from '@/api/queries';
import type { BannerViewHandle } from '@/banner/banner-view';
import { Button } from '@/components/button';
import { DailyRow } from '@/components/daily-row';
import { ExpToast } from '@/components/exp-toast';
import { TabScreen } from '@/components/tab-screen';
import { colors, space } from '@/theme';

/** Atrasados no topo, depois os pendentes e, por último, os feitos hoje (RF-19). */
function sortDailies(items: Item[]): Item[] {
  const rank = (item: Item): number => (item.doneToday ? 2 : item.overdue ? 0 : 1);
  return [...items].sort((a, b) => rank(a) - rank(b));
}

export default function DailiesScreen() {
  const { t } = useTranslation();
  const banner = useRef<BannerViewHandle>(null);
  const { data: me } = useMe();
  const items = useItems('daily');
  const check = useCheckItem('daily');
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => sortDailies(items.data ?? []), [items.data]);

  const handleCheck = useCallback(
    (item: Item) => {
      setError(null);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // 1) Banner na hora, com o progresso ESTIMADO (checks do capítulo + 1 sobre o necessário)
      if (me) {
        const { story, requiredChecksInChapter } = me.player;
        const estimated = Math.min(1, (story.checksInChapter + 1) / requiredChecksInChapter);
        banner.current?.send({ v: 1, type: 'ITEM_CHECKED', payload: { progress: estimated } });
      }

      // 2) API: o servidor decide EXP, nível e capítulo; o app só reconcilia com o resultado
      check.mutate(
        { itemId: item.id, checkId: randomUUID() },
        {
          onSuccess: (result) => {
            setToast(t('dailies.expToast', { exp: result.expGained }));
            const { checksInChapter, requiredChecks } = result.chapterProgress;
            if (result.chapterCompleted) {
              banner.current?.send({
                v: 1,
                type: 'CHAPTER_COMPLETED',
                payload: { nextSceneKey: `story-1-chapter-${result.chapterProgress.chapter}` },
              });
            } else {
              // reconcilia o banner com o valor real
              banner.current?.send({
                v: 1,
                type: 'ITEM_CHECKED',
                payload: { progress: Math.min(1, checksInChapter / requiredChecks) },
              });
            }
          },
          onError: (cause) => {
            const code = toApiError(cause)?.code;
            setError(
              code === 'ALREADY_CHECKED' ? t('dailies.alreadyChecked') : t('dailies.checkFailed'),
            );
            // volta o banner à posição real, sem animação
            banner.current?.send({
              v: 1,
              type: 'INIT',
              payload: {
                scene: 'map',
                character: { skin: 'light', hair: 'short-brown', outfit: 'tunic-purple' },
                sceneKey: `story-1-chapter-${me?.player.story.chapter ?? 1}`,
                progress: chapterProgress(me),
                timeOfDay: 'night',
              },
            });
          },
        },
      );
    },
    [check, me, t],
  );

  return (
    <TabScreen title={t('dailies.title')} bannerRef={banner} debug={false}>
      <Text style={styles.heading} accessibilityRole="header">
        {t('dailies.title')}
      </Text>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      {items.isError ? (
        <View style={styles.center}>
          <Text style={styles.message}>{t('dailies.loadError')}</Text>
          <Button
            label={t('dailies.retry')}
            variant="secondary"
            onPress={() => {
              void items.refetch();
            }}
          />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DailyRow item={item} onCheck={handleCheck} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            items.isPending ? null : (
              <View style={styles.center}>
                <Text style={styles.message}>{t('dailies.empty')}</Text>
                <Text style={styles.hint}>{t('dailies.emptyHint')}</Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={items.isRefetching}
              onRefresh={() => {
                void items.refetch();
              }}
              tintColor={colors.brand.primaryLight}
            />
          }
          contentContainerStyle={styles.list}
        />
      )}
      <ExpToast
        message={toast}
        onHidden={() => {
          setToast(null);
        }}
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text.primary, fontSize: 20, fontWeight: '600' },
  error: { color: colors.status.danger, fontSize: 13 },
  list: { paddingVertical: space[12], flexGrow: 1 },
  separator: { height: space[8] },
  center: { alignItems: 'center', gap: space[8], paddingVertical: space[24] },
  message: { color: colors.text.secondary, fontSize: 14 },
  hint: { color: colors.text.muted, fontSize: 12 },
});
