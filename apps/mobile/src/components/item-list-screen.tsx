import type { Category, Item, ItemType } from '@nextjourney/contracts';
import type { Icon } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useCategories, useItems } from '@/api/queries';
import type { BannerViewHandle } from '@/banner/banner-view';
import { ExpToast } from '@/components/exp-toast';
import { Fab } from '@/components/fab';
import { ItemRow } from '@/components/item-row';
import { Pills } from '@/components/pills';
import { ProgressMiniBar } from '@/components/progress-mini-bar';
import { EmptyState, ErrorState, SkeletonList } from '@/components/states';
import { StoryProgressCard } from '@/components/story-progress-card';
import { TabScreen } from '@/components/tab-screen';
import { useCheckFlow } from '@/features/check/use-check-flow';
import { lastUndoableCheck, useFeedbackStore } from '@/features/feedback/feedback-store';
import { colors, space } from '@/theme';

type Props = {
  type: ItemType;
  title: string;
  emptyTitle: string;
  emptyHint: string;
  /** Ícone do estado vazio (página sem itens). */
  emptyIcon?: Icon;
  /** Agrupa por categoria e mostra filtro por pills (tarefas). */
  groupByCategory?: boolean;
  /** Mostra contadores de hoje e da semana (hábitos). */
  counters?: boolean;
  /** Aviso no rodapé (tarefas): onde foram parar as concluídas. Toque abre o histórico. */
  historyNotice?: string;
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
  emptyIcon,
  groupByCategory = false,
  counters = false,
  historyNotice,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const banner = useRef<BannerViewHandle>(null);
  const flow = useCheckFlow({ type, bannerRef: banner });
  const items = useItems(type);
  const categories = useCategories();
  const checks = useFeedbackStore((state) => state.checks);
  const [filter, setFilter] = useState<string | null>(null);
  // O cartão do capítulo rola junto com os itens; quando some, aparece o resumo fixo
  const [showMini, setShowMini] = useState(false);
  const cardBottom = useRef(Infinity);
  const onCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    cardBottom.current = y + height;
  }, []);
  // Carregando ou erro: a lista some e o cartão volta ao topo, então o resumo fixo sai também
  // (ajuste de estado durante a renderização, o padrão recomendado em vez de um efeito)
  const [wasLoaded, setWasLoaded] = useState(items.isSuccess);
  if (wasLoaded !== items.isSuccess) {
    setWasLoaded(items.isSuccess);
    setShowMini(false);
  }
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowMini(event.nativeEvent.contentOffset.y > cardBottom.current);
  }, []);

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

  const header = (
    <View style={styles.header}>
      <View onLayout={onCardLayout}>
        <StoryProgressCard showCoins />
      </View>
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
    </View>
  );

  return (
    <TabScreen
      title={title}
      bannerRef={banner}
      debug={false}
      onBannerMessage={flow.onBannerMessage}
    >
      {items.isPending ? (
        <>
          {header}
          <SkeletonList />
        </>
      ) : items.isError ? (
        <>
          {header}
          <ErrorState
            message={t('items.load')}
            retryLabel={t('items.retry')}
            retrying={items.isFetching}
            onRetry={() => {
              void items.refetch();
            }}
          />
        </>
      ) : (
        <SectionList
          ListHeaderComponent={header}
          onScroll={onScroll}
          scrollEventThrottle={16}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) =>
            section.title ? <Text style={styles.section}>{section.title}</Text> : null
          }
          renderItem={({ item }) => {
            // O check desta sessão é o mais recente (e cobre a fila offline); o do servidor vale ao reabrir o app
            const undoId = lastUndoableCheck(checks, item.id) ?? item.lastCheckId;
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
          ListEmptyComponent={
            <EmptyState
              title={emptyTitle}
              hint={emptyHint}
              {...(emptyIcon ? { icon: emptyIcon } : {})}
            />
          }
          ListFooterComponent={
            historyNotice ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={historyNotice}
                onPress={() => {
                  router.push('/history');
                }}
                style={styles.notice}
              >
                <Text style={styles.noticeText}>{historyNotice}</Text>
              </Pressable>
            ) : undefined
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
          stickySectionHeadersEnabled={false}
        />
      )}

      {showMini ? (
        <View style={styles.mini} pointerEvents="none">
          <ProgressMiniBar />
        </View>
      ) : null}

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
  header: { gap: space[8] },
  // colado ao banner: a tela tem margem de 16 em volta, o resumo ocupa a largura toda
  mini: { position: 'absolute', top: 0, left: 0, right: 0 },
  heading: { color: colors.text.primary, fontSize: 20, fontWeight: '600', marginTop: space[8] },
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
  notice: { paddingVertical: space[16], paddingHorizontal: space[8] },
  noticeText: { color: colors.text.muted, fontSize: 12, textAlign: 'center' },
});
