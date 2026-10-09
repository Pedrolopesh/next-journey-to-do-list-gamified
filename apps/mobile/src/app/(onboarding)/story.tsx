import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chooseStory } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import { queryKeys, useStories } from '@/api/queries';
import { Button } from '@/components/button';
import { ErrorState, SkeletonList } from '@/components/states';
import { colors, radius, space } from '@/theme';

/** Escolha de 1 entre 5 histórias (RF-12). Ao escolher, o app libera as abas. */
export default function StoryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const stories = useStories();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async (): Promise<void> => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await chooseStory(selected);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    } catch (cause) {
      setError(toApiError(cause)?.message ?? t('story.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + space[16] }]}>
      <Text style={styles.title} accessibilityRole="header">
        {t('story.chooseTitle')}
      </Text>
      <ScrollView contentContainerStyle={styles.list}>
        {stories.isPending ? (
          <SkeletonList rows={4} />
        ) : stories.isError ? (
          <ErrorState
            message={t('items.load')}
            retryLabel={t('items.retry')}
            onRetry={() => {
              void stories.refetch();
            }}
          />
        ) : (
          stories.data.map((story) => {
            const isSelected = selected === story.slug;
            return (
              <Pressable
                key={story.slug}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${story.name}. ${story.description}`}
                onPress={() => {
                  setSelected(story.slug);
                }}
                style={[
                  styles.card,
                  { borderColor: isSelected ? story.themeColor : colors.border.subtle },
                  isSelected && styles.cardSelected,
                ]}
              >
                <Text style={[styles.name, { color: story.themeColor }]}>{story.name}</Text>
                <Text style={styles.description}>{story.description}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ paddingBottom: insets.bottom + space[16] }}>
        <Button
          label={t('story.confirm')}
          onPress={() => void confirm()}
          loading={saving}
          disabled={!selected}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: space.screenMargin,
    backgroundColor: colors.bg.base,
    gap: space[12],
  },
  title: { color: colors.text.primary, fontSize: 22, fontWeight: '700' },
  list: { gap: space[8], paddingBottom: space[16] },
  card: {
    gap: space[4],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space[16],
  },
  cardSelected: { borderWidth: 2 },
  name: { fontSize: 17, fontWeight: '700' },
  description: { color: colors.text.secondary, fontSize: 13 },
  error: { color: colors.status.danger, fontSize: 13 },
});
