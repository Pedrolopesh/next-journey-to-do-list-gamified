import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { chooseStory } from '@/api/endpoints';
import { queryKeys, useMe, useStories } from '@/api/queries';
import { BackButton } from '@/components/back-button';
import { Button } from '@/components/button';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { ErrorState, SkeletonList } from '@/components/states';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';
import { STORY_IMAGES } from '@/features/onboarding/story-art';
import { colors, fontSize, radius, space } from '@/theme';

/** Home → "Mudar história principal": the banner follows the story that is highlighted. */
export default function ChangeStoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const stories = useStories();
  const [picked, setPicked] = useState<string | null>(null);
  // Starts on the story that is active today
  const selected = picked ?? me?.story?.slug ?? null;
  const { run, loading } = useAction({
    name: 'story.change',
    success: t('story.saved'),
    error: (cause) => describeError(cause, t),
  });

  const current = stories.data?.find((story) => story.slug === selected);

  const confirm = async (): Promise<void> => {
    if (!selected) return;
    const ok = await run(async () => {
      await chooseStory(selected);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      await queryClient.invalidateQueries({ queryKey: queryKeys.home });
    });
    if (ok) router.back();
  };

  return (
    <OnboardingScreen
      hideBack
      preview={
        <View>
          <Image
            source={selected ? STORY_IMAGES[selected] : undefined}
            style={styles.banner}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.back}>
            <BackButton overlay />
          </View>
        </View>
      }
      title={t('story.changeTitle')}
      subtitle={t('story.changeSubtitle')}
      footer={
        <Button
          label={t('story.changeConfirm')}
          loading={loading}
          disabled={!selected || selected === me?.story?.slug}
          onPress={() => void confirm()}
        />
      }
    >
      {stories.isPending ? (
        <SkeletonList rows={2} />
      ) : stories.isError ? (
        <ErrorState
          message={t('items.load')}
          retryLabel={t('items.retry')}
          onRetry={() => {
            void stories.refetch();
          }}
        />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {stories.data.map((story) => {
              const isSelected = story.slug === selected;
              return (
                <Pressable
                  key={story.slug}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={story.name}
                  onPress={() => {
                    setPicked(story.slug);
                  }}
                  style={[
                    styles.chip,
                    { borderColor: isSelected ? story.themeColor : colors.border.subtle },
                  ]}
                >
                  <Text style={[styles.chipLabel, { color: story.themeColor }]}>{story.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {current ? (
            <View style={styles.description}>
              <Text style={[styles.name, { color: current.themeColor }]}>{current.name}</Text>
              <Text style={styles.text}>
                {t(`story.about.${current.slug}`, { defaultValue: current.description })}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  banner: { width: '100%', height: 190 },
  back: { position: 'absolute', left: space[8], top: space[8] },
  row: { gap: space[8], paddingVertical: space[8] },
  chip: {
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    borderRadius: radius.pill,
    borderWidth: 2,
    backgroundColor: colors.bg.surface,
  },
  chipLabel: { fontSize: fontSize[14], fontWeight: '700' },
  description: {
    gap: space[8],
    padding: space[16],
    borderRadius: radius.card,
    backgroundColor: colors.bg.surface,
  },
  name: { fontSize: fontSize[18], fontWeight: '700' },
  text: { color: colors.text.secondary, fontSize: fontSize[14] },
});
