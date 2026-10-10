import type { Category, Item, ItemType } from '@nextjourney/contracts';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { useCategories, useItems } from '@/api/queries';
import type { BannerViewHandle } from '@/banner/banner-view';
import { ExpToast } from '@/components/exp-toast';
import { Fab } from '@/components/fab';
import { ItemRow } from '@/components/item-row';
import { Pills } from '@/components/pills';
import { EmptyState, ErrorState, SkeletonList } from '@/components/states';
import { TabScreen } from '@/components/tab-screen';
import { useCheckFlow } from '@/features/check/use-check-flow';
import { lastUndoableCheck, useFeedbackStore } from '@/features/feedback/feedback-store';
import { colors, space } from '@/theme';

type Props = {
  type: ItemType;
  title: string;
  emptyTitle: string;
  emptyHint: string;
  /** Agrupa por categoria e mostra filtro por pills (tarefas). */
  groupByCategory?: boolean;
  /** Mostra contadores de hoje e da semana (hábitos). */
  counters?: boolean;
};

/** Atrasados no topo, depois os pendentes e, por último, os feitos hoje (RF-19, RF-20). */
function sortItems(items: Item[]): Item[] {
  const rank = (item: Item): number =>
    item.doneToday && item.type !== 'habit' ? 2 : item.overdue ? 0 : 1;
  return [...items].sort((a, b) => rank(a) - rank(b));
}

/** Lista de itens de um tipo (diários, tarefas ou hábitos) com check, desfazer, estados e criar. */
export function ItemListScreen({
  type,
  title,
  emptyTitle,
  emptyHint,
  groupByCategory = false,
  counters = false,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const banner = useRef<BannerViewHandle>(null);
  const flow = useCheckFlow({ type, bannerRef: banner });
  const items = useItems(type);
  const categories = useCategories();
  const checks = useFeedbackStore((state) => state.checks);
  const [filter, setFilter] = useState<string | null>(null);

  const sections = useMemo(() => {
    const sorted = sortItems(items.data ?? []);
    const visible = filter ? sorted.filter((item) => item.categoryId === filter) : sorted;
    if (!groupByCategory) return [{ key: 'all', title: '', data: visible }];
    const byCategory = new Map<string, Item[]>();
    for (const item of visible)
      byCategory.set(item.categoryId, [...(byCategory.get(item.categoryId) ?? []), item]);
    const known = categories.data ?? [];
    return [...byCategory.entries()].map(([id, data]) => ({
      key: id,
      title: known.find((category: Category) => category.id === id)?.name ?? t('todos.noCategory'),
      data,
    }));
  }, [items.data, filter, groupByCategory, categories.data, t]);

  const openItem = (item: Item): void => {
    router.push({ pathname: '/item/[id]', params: { id: item.id } });
  };

  return (
    <TabScreen
      title={title}
      bannerRef={banner}
      debug={false}
      onBannerMessage={flow.onBannerMessage}
    >
      <Text style={styles.heading} accessibilityRole="header">
        {title}
      </Text>

      {groupByCategory && (categories.data?.length ?? 0) > 0 ? (
        <Pills
          scroll
          label={t('todos.filter')}
          value={filter ?? 'all'}
          onChange={(value) => {
            setFilter(value === 'all' ? null : value);
          }}
          options={[
            { value: 'all', label: t('todos.all') },
            ...(categories.data ?? []).map((category) => ({
              value: category.id,
              label: category.name,
              color: category.color,
            })),
          ]}
        />
      ) : null}

      {flow.error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {flow.error}
        </Text>
      ) : null}

      {items.isPending ? (
        <SkeletonList />
      ) : items.isError ? (
        <ErrorState
          message={t('items.load')}
          retryLabel={t('items.retry')}
          retrying={items.isFetching}
          onRetry={() => {
            void items.refetch();
          }}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) =>
            section.title ? <Text style={styles.section}>{section.title}</Text> : null
          }
          renderItem={({ item }) => {
            const undoId = lastUndoableCheck(checks, item.id);
            return (
              <ItemRow
                item={item}
                counters={counters}
                onCheck={flow.handleCheck}
                onOpen={openItem}
                {...(undoId
                  ? {
                      onUndo: (target: Item) => {
                        flow.handleUndo(target, undoId);
                      },
                    }
                  : {})}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<EmptyState title={emptyTitle} hint={emptyHint} />}
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
          stickySectionHeadersEnabled={false}
        />
      )}

      <ExpToast
        message={flow.toast}
        onHidden={() => {
          flow.setToast(null);
        }}
      />
      <Fab
        label={t('items.newItem')}
        onPress={() => {
          router.push({ pathname: '/item/new', params: { type } });
        }}
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text.primary, fontSize: 20, fontWeight: '600' },
  error: { color: colors.status.danger, fontSize: 13 },
  section: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: space[12],
    marginBottom: space[8],
  },
  list: { paddingVertical: space[12], paddingBottom: 96, flexGrow: 1 },
  separator: { height: space[8] },
});
