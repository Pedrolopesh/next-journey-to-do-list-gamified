import { type Category, CATEGORY_COLORS, MAX_CATEGORIES } from '@nextjourney/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { useCategories, useCategoryMutations } from '@/api/queries';
import { Button } from '@/components/button';
import { Pills } from '@/components/pills';
import { ScreenFrame } from '@/components/screen-frame';
import { TextField } from '@/components/text-field';
import { toast } from '@/features/feedback/toast-store';
import { colors, radius, space } from '@/theme';

/** Categorias (RF-23): renomear, criar e excluir até 10, com cor da paleta. */
export default function CategoriesScreen() {
  const { t } = useTranslation();
  const categories = useCategories();
  const { create, update, remove } = useCategoryMutations();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = categories.data ?? [];
  const fail = (cause: unknown): void => {
    const code = toApiError(cause)?.code;
    const message =
      code === 'CATEGORY_LIMIT'
        ? t('categories.limit', { max: MAX_CATEGORIES })
        : code === 'LAST_CATEGORY'
          ? t('categories.last')
          : t('categories.failed');
    setError(message);
    toast.error(message);
  };

  return (
    <ScreenFrame title={t('categories.title')}>
      {list.map((category: Category) => (
        <View key={category.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: category.color }]} />
          {editing?.id === category.id ? (
            <View style={styles.editor}>
              <TextField
                label={t('categories.name')}
                value={editing.name}
                onChangeText={(value) => {
                  setEditing({ id: category.id, name: value });
                }}
                maxLength={30}
              />
              <Button
                label={t('common.save')}
                loading={update.isPending}
                onPress={() => {
                  setError(null);
                  update.mutate(
                    { id: category.id, body: { name: editing.name.trim() } },
                    {
                      onSuccess: () => {
                        setEditing(null);
                        toast.success(t('categories.renamed'));
                      },
                      onError: fail,
                    },
                  );
                }}
              />
            </View>
          ) : (
            <Text style={styles.name}>{category.name}</Text>
          )}
          {editing?.id !== category.id ? (
            <View style={styles.actions}>
              <Button
                label={t('categories.rename')}
                variant="ghost"
                onPress={() => {
                  setEditing({ id: category.id, name: category.name });
                }}
              />
              <Button
                label={t('categories.delete')}
                variant="ghost"
                onPress={() => {
                  setError(null);
                  setDeleting(category.id);
                }}
              />
            </View>
          ) : null}
          {deleting === category.id ? (
            <View style={styles.editor}>
              <Text style={styles.hint}>{t('categories.moveTo')}</Text>
              <Pills
                scroll
                label={t('categories.moveTo')}
                value={null}
                onChange={(destination) => {
                  remove.mutate(
                    { id: category.id, moveTo: destination },
                    {
                      onSuccess: () => {
                        setDeleting(null);
                        toast.success(t('categories.removed'));
                      },
                      onError: fail,
                    },
                  );
                }}
                options={list
                  .filter((other) => other.id !== category.id)
                  .map((other) => ({ value: other.id, label: other.name, color: other.color }))}
              />
            </View>
          ) : null}
        </View>
      ))}

      {list.length < MAX_CATEGORIES ? (
        <View style={styles.new}>
          <TextField
            label={t('categories.newName')}
            value={name}
            onChangeText={setName}
            maxLength={30}
          />
          <Pills
            scroll
            label={t('categories.color')}
            value={color}
            onChange={setColor}
            options={CATEGORY_COLORS.map((value) => ({ value, label: '●', color: value }))}
          />
          <Button
            label={t('categories.add')}
            loading={create.isPending}
            onPress={() => {
              setError(null);
              if (name.trim() === '') {
                setError(t('categories.nameRequired'));
                toast.error(t('categories.nameRequired'));
                return;
              }
              create.mutate(
                { name: name.trim(), color: color as (typeof CATEGORY_COLORS)[number] },
                {
                  onSuccess: () => {
                    setName('');
                    toast.success(t('categories.added'));
                  },
                  onError: fail,
                },
              );
            }}
          />
        </View>
      ) : (
        <Text style={styles.hint}>{t('categories.limit', { max: MAX_CATEGORIES })}</Text>
      )}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: space[8],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: space[12],
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { color: colors.text.primary, fontSize: 15, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: space[8] },
  editor: { gap: space[8] },
  new: { gap: space[12], marginTop: space[8] },
  hint: { color: colors.text.muted, fontSize: 12 },
  error: { color: colors.status.danger, fontSize: 13 },
});
