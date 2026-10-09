import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toApiError } from '@/api/errors';
import { useDeleteItem, useItems, useUpdateItem } from '@/api/queries';
import { ItemForm } from '@/components/item-form';
import { colors } from '@/theme';

export default function EditItemScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  // O item vem do cache das listas (diário, tarefa ou hábito)
  const dailies = useItems('daily');
  const todos = useItems('todo');
  const habits = useItems('habit');
  const item =
    [...(dailies.data ?? []), ...(todos.data ?? []), ...(habits.data ?? [])].find(
      (entry) => entry.id === id,
    ) ?? null;
  const update = useUpdateItem();
  const remove = useDeleteItem();
  const [error, setError] = useState<string | null>(null);

  if (!item) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.message}>{t('itemForm.notFound')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ItemForm
        item={item}
        initialType={item.type}
        submitting={update.isPending || remove.isPending}
        error={error}
        onSubmitCreate={() => undefined}
        onSubmitUpdate={(body) => {
          setError(null);
          update.mutate(
            { id: item.id, body },
            {
              onSuccess: () => {
                router.back();
              },
              onError: (cause) => {
                setError(toApiError(cause)?.message ?? t('itemForm.saveFailed'));
              },
            },
          );
        }}
        onDelete={() => {
          setError(null);
          remove.mutate(item.id, {
            onSuccess: () => {
              router.back();
            },
            onError: () => {
              setError(t('itemForm.saveFailed'));
            },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  message: { color: colors.text.secondary, padding: 24, textAlign: 'center' },
});
