import type { ItemType } from '@nextjourney/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toApiError } from '@/api/errors';
import { useCreateItem, useMe } from '@/api/queries';
import { ItemForm } from '@/components/item-form';
import { toast } from '@/features/feedback/toast-store';
import { type ItemDraft, useItemDraftStore } from '@/features/items/item-draft-store';
import { colors, modalTop } from '@/theme';

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
  const userId = useMe().data?.user.id ?? null;
  const draft = useItemDraftStore((state) => (state.userId === userId ? state.draft : null));
  const saveDraft = useItemDraftStore((state) => state.save);
  const clearDraft = useItemDraftStore((state) => state.clear);
  const keepDraft = useCallback(
    (next: ItemDraft) => {
      if (userId) saveDraft(userId, next);
    },
    [userId, saveDraft],
  );

  return (
    <View style={[styles.container, { paddingTop: modalTop(insets.top) }]}>
      {userId ? (
        <ItemForm
          item={null}
          draft={draft}
          onDraftChange={keepDraft}
          initialType={initialType}
          onClose={() => {
            router.back();
          }}
          submitting={create.isPending}
          error={error}
          onSubmitUpdate={() => undefined}
          onSubmitCreate={(body) => {
            setError(null);
            create.mutate(body, {
              onSuccess: () => {
                clearDraft();
                toast.success(t('itemForm.created'));
                router.back();
              },
              onError: (cause) => {
                const message = toApiError(cause)?.message ?? t('itemForm.saveFailed');
                setError(message);
                toast.error(message);
              },
            });
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.bg.base } });
