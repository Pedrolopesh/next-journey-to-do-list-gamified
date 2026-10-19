import type { HistoryItem } from '@nextjourney/contracts';
import { IconHistory } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { useCategories, useHistory, useMe, useUndoCheck } from '@/api/queries';
import { Button } from '@/components/button';
import { DifficultyIcon } from '@/components/difficulty-icon';
import { ScreenFrame } from '@/components/screen-frame';
import { EmptyState, ErrorState, SkeletonList } from '@/components/states';
import { toast } from '@/features/feedback/toast-store';
import { colors, radius, space } from '@/theme';

/** Histórico: as tarefas concluídas, que saíram da lista de tarefas, da mais recente para a mais antiga. */
export default function HistoryScreen() {
  const { t } = useTranslation();
  const history = useHistory();
  const categories = useCategories();
  const undo = useUndoCheck();
  // O dia é o do fuso do perfil (regra 8), não o do aparelho
  const timeZone = useMe().data?.user.timezone;

  const rows = history.data?.pages.flatMap((page) => page.items) ?? [];
  const categoryName = (id: string): string =>
    categories.data?.find((category) => category.id === id)?.name ?? t('history.noCategory');

  const undoRow = (row: HistoryItem): void => {
    if (!row.checkId) return;
    undo.mutate(
      { itemId: row.id, checkId: row.checkId },
      {
        onSuccess: (result) => {
          const lost = Math.max(0, -result.coinsGained);
          if (lost > 0) toast.warning(t('feedback.undoneCoins', { coins: lost }));
          else toast.info(t('feedback.undoneNoCoins'));
        },
        onError: (cause) => {
          // Já estava desfeito (toque repetido): o resultado é o esperado, não é erro
          if (toApiError(cause)?.code === 'CHECK_ALREADY_REVERTED')
            toast.info(t('feedback.undone'));
          else toast.error(t('feedback.undoFailed'));
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
          data={rows}
          keyExtractor={(row) => row.id}
          ListHeaderComponent={
            rows.length > 0 ? <Text style={styles.hint}>{t('history.undoHint')}</Text> : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon={IconHistory}
              title={t('history.empty')}
              hint={t('history.emptyHint')}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item: row }) => (
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>
                  {row.title}
                </Text>
                <Text style={styles.meta}>
                  {`${categoryName(row.categoryId)} · ${t('history.completedOn', {
                    date: new Date(row.completedAt).toLocaleDateString(
                      'pt-BR',
                      timeZone ? { timeZone } : {},
                    ),
                  })}`}
                </Text>
              </View>
              <DifficultyIcon difficulty={row.difficulty} />
              {row.checkId ? (
                <Button
                  label={t('history.undo')}
                  variant="secondary"
                  loading={undo.isPending && undo.variables.itemId === row.id}
                  onPress={() => {
                    undoRow(row);
                  }}
                />
              ) : null}
            </View>
          )}
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
        />
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: space[40], flexGrow: 1 },
  hint: { color: colors.text.muted, fontSize: 12, marginBottom: space[12] },
  separator: { height: space[8] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: space[12],
  },
  info: { flex: 1, gap: space[4] },
  title: { color: colors.text.primary, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.text.secondary, fontSize: 12 },
});
