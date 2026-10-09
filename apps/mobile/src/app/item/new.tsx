import type { ItemType } from '@nextjourney/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toApiError } from '@/api/errors';
import { useCreateItem } from '@/api/queries';
import { ItemForm } from '@/components/item-form';
import { colors } from '@/theme';

const TYPES: readonly string[] = ['daily', 'todo', 'habit'];

export default function NewItemScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType: ItemType =
    params.type && TYPES.includes(params.type) ? (params.type as ItemType) : 'daily';
  const create = useCreateItem();
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ItemForm
        item={null}
        initialType={initialType}
        submitting={create.isPending}
        error={error}
        onSubmitUpdate={() => undefined}
        onSubmitCreate={(body) => {
          setError(null);
          create.mutate(body, {
            onSuccess: () => {
              router.back();
            },
            onError: (cause) => {
              setError(toApiError(cause)?.message ?? t('itemForm.saveFailed'));
            },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.bg.base } });
