import type { HistoryItem } from '@nextjourney/contracts';
import { IconChevronDown, IconChevronUp, IconHistory } from '@tabler/icons-react-native';
import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { useCategories, useCheckItem, useHistory, useMe, useUndoCheck } from '@/api/queries';
import { Button } from '@/components/button';
import { CheckBox } from '@/components/check-box';
import { DifficultyIcon } from '@/components/difficulty-icon';
import { ScreenFrame } from '@/components/screen-frame';
import { EmptyState, ErrorState, SkeletonList } from '@/components/states';
import { useFeedbackStore } from '@/features/feedback/feedback-store';
import { buildModalQueue } from '@/features/feedback/modal-queue';
import { toast } from '@/features/feedback/toast-store';
import { colors, fontSize, radius, size, space } from '@/theme';

/**
 * History: the completed tasks, which left the task list, most recent first. Each row has the
 * same check as the lists (unchecking returns the task to the list; checking again
 * completes it once more) and opens the details on the same screen.
 */
export default function HistoryScreen() {
  const { t } = useTranslation();
  const history = useHistory();
  const categories = useCategories();
  const undo = useUndoCheck();
  const check = useCheckItem('todo');
  // The day is the profile's time zone day (rule 8), not the device's
  const timeZone = useMe().data?.user.timezone;
  const [expanded, setExpanded] = useState<string | null>(null);
  // Rows unchecked in this visit: they leave the history on the server, but stay on screen so they can
  // be checked again
  const [unchecked, setUnchecked] = useState<Record<string, HistoryItem>>({});

  const rows = history.data?.pages.flatMap((page) => page.items) ?? [];
  const live = new Set(rows.map((row) => row.id));
  const shown = [...rows, ...Object.values(unchecked).filter((row) => !live.has(row.id))].sort(
    (a, b) => b.completedAt.localeCompare(a.completedAt),
  );
  const categoryName = (id: string): string =>
    categories.data?.find((category) => category.id === id)?.name ?? t('history.noCategory');
  const date = (iso: string, withTime = false): string => {
    const value = new Date(iso);
    const options = timeZone ? { timeZone } : {};
    return withTime
      ? value.toLocaleString('pt-BR', { ...options, dateStyle: 'short', timeStyle: 'short' })
      : value.toLocaleDateString('pt-BR', options);
  };

  const uncheckRow = (row: HistoryItem): void => {
    if (!row.checkId) return;
    undo.mutate(
      { itemId: row.id, checkId: row.checkId },
      {
        onSuccess: (result) => {
          setUnchecked((current) => ({ ...current, [row.id]: row }));
          const lost = Math.max(0, -result.coinsGained);
          if (lost > 0) toast.warning(t('feedback.undoneCoins', { coins: lost }));
          else toast.info(t('feedback.undoneNoCoins'));
        },
        onError: (cause) => {
          // Already undone (repeated tap): the result is the expected one, not an error
          if (toApiError(cause)?.code === 'CHECK_ALREADY_REVERTED') {
            setUnchecked((current) => ({ ...current, [row.id]: row }));
            toast.info(t('feedback.undone'));
          } else toast.error(t('feedback.undoFailed'));
        },
      },
    );
  };

  const checkRow = (row: HistoryItem): void => {
    check.mutate(
      { itemId: row.id, checkId: randomUUID() },
      {
        onSuccess: (result) => {
          setUnchecked((current) => {
            const { [row.id]: _gone, ...rest } = current;
            return rest;
          });
          toast.success(
            t('feedback.expToast', { exp: result.expGained, coins: result.coinsGained }),
          );
          const { now, afterBanner } = buildModalQueue(result);
          useFeedbackStore.getState().enqueue([...now, ...afterBanner]);
        },
        onError: () => {
          toast.error(t('feedback.checkFailed'));
        },
      },
    );
  };

  return (
    <ScreenFrame title={t('history.title')} scroll={false}>
      {history.isPending ? (
        <SkeletonList rows={4} />
      ) : history.isError ? (
        <ErrorState
          message={t('history.load')}
          retryLabel={t('items.retry')}
          retrying={history.isFetching}
          onRetry={() => {
            void history.refetch();
          }}
        />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(row) => row.id}
          ListHeaderComponent={
            shown.length > 0 ? <Text style={styles.hint}>{t('history.undoHint')}</Text> : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon={IconHistory}
              title={t('history.empty')}
              hint={t('history.emptyHint')}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item: row }) => {
            const done = live.has(row.id);
            const open = expanded === row.id;
            const busy =
              (undo.isPending && undo.variables.itemId === row.id) ||
              (check.isPending && check.variables.itemId === row.id);
            return (
              <View style={styles.card}>
                <View style={styles.row}>
                  <CheckBox
                    checked={done}
                    loading={busy}
                    disabled={done && !row.checkId}
                    label={done ? t('history.checked') : t('history.unchecked')}
                    onPress={() => {
                      if (done) uncheckRow(row);
                      else checkRow(row);
                    }}
                  />
                  <Pressable
                    style={styles.info}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={`${row.title}. ${t(open ? 'history.collapse' : 'history.expand')}`}
                    onPress={() => {
                      setExpanded(open ? null : row.id);
                    }}
                  >
                    <Text
                      style={[styles.title, !done && styles.titleOff]}
                      numberOfLines={open ? undefined : 2}
                    >
                      {row.title}
                    </Text>
                    <Text style={styles.meta}>
                      {`${categoryName(row.categoryId)} · ${t('history.completedOn', { date: date(row.completedAt) })}`}
                    </Text>
                  </Pressable>
                  <DifficultyIcon difficulty={row.difficulty} />
                  {open ? (
                    <IconChevronUp size={18} color={colors.text.muted} />
                  ) : (
                    <IconChevronDown size={18} color={colors.text.muted} />
                  )}
                </View>
                {open ? (
                  <View style={styles.details}>
                    <Detail label={t('history.category')} value={categoryName(row.categoryId)} />
                    <Detail
                      label={t('history.difficultyField')}
                      value={t(`difficulty.${row.difficulty}`)}
                    />
                    <Detail
                      label={t('history.notes')}
                      value={row.notes ? row.notes : t('history.noNotes')}
                    />
                    {row.createdAt ? (
                      <Detail label={t('history.createdOn')} value={date(row.createdAt)} />
                    ) : null}
                    <Detail
                      label={t('history.dueOn')}
                      value={row.dueAt ? date(row.dueAt) : t('history.noDue')}
                    />
                    <Detail
                      label={t('history.completedAtField')}
                      value={date(row.completedAt, true)}
                    />
                  </View>
                ) : null}
              </View>
            );
          }}
          ListFooterComponent={
            history.hasNextPage ? (
              <Button
                label={t('history.more')}
                variant="secondary"
                loading={history.isFetchingNextPage}
                onPress={() => {
                  void history.fetchNextPage();
                }}
              />
            ) : undefined
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenFrame>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: space[40], flexGrow: 1 },
  hint: { color: colors.text.muted, fontSize: fontSize[12], marginBottom: space[12] },
  separator: { height: space[8] },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[12], padding: space[12] },
  info: { flex: 1, gap: space[4], minHeight: size.touchTarget, justifyContent: 'center' },
  title: { color: colors.text.primary, fontSize: fontSize[15], fontWeight: '600' },
  titleOff: { color: colors.text.secondary },
  meta: { color: colors.text.secondary, fontSize: fontSize[12] },
  details: {
    gap: space[8],
    paddingHorizontal: space[12],
    paddingBottom: space[12],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: space[12],
  },
  detail: { gap: 2 },
  detailLabel: { color: colors.text.muted, fontSize: fontSize[12], fontWeight: '600' },
  detailValue: { color: colors.text.primary, fontSize: fontSize[14] },
});
