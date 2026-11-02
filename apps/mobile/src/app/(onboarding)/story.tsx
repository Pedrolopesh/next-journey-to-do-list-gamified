import { IconInfoCircle } from '@tabler/icons-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { chooseStory } from '@/api/endpoints';
import { queryKeys, useStories } from '@/api/queries';
import { Button } from '@/components/button';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { ErrorState, SkeletonList } from '@/components/states';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';
import { useOnboardingFlow } from '@/features/onboarding/flow-store';
import { STORY_IMAGES } from '@/features/onboarding/story-art';
import { colors, fontSize, radius, size, space } from '@/theme';

/** Story choice: cards with the scenery, name and description; "i" opens a sample of the story. */
export default function StoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const stories = useStories();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const { run, loading } = useAction({
    name: 'onboarding.story',
    success: t('story.saved'),
    error: (cause) => describeError(cause, t),
  });

  const confirm = async (): Promise<void> => {
    if (!selected) return;
    // The server counts the onboarding as done once the story is chosen; the optional questions
    // that follow keep these screens open until they are answered or skipped.
    useOnboardingFlow.getState().setFinishing(true);
    const ok = await run(async () => {
      await chooseStory(selected);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    });
    if (ok) router.replace('/reminders');
    else useOnboardingFlow.getState().setFinishing(false);
  };

  const detailStory = stories.data?.find((story) => story.slug === details);

  return (
    <OnboardingScreen
      title={t('story.chooseTitle')}
      subtitle={t('story.chooseSubtitle')}
      footer={
        <Button
          label={t('story.confirm')}
          onPress={() => void confirm()}
          loading={loading}
          disabled={!selected}
        />
      }
    >
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
              accessibilityLabel={`${story.name}. ${t(`story.tagline.${story.slug}`, { defaultValue: story.description })}`}
              onPress={() => {
                setSelected(story.slug);
              }}
              style={[
                styles.card,
                { borderColor: isSelected ? story.themeColor : colors.border.subtle },
                isSelected && styles.cardSelected,
              ]}
            >
              <View>
                <Image
                  source={STORY_IMAGES[story.slug]}
                  style={styles.image}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('story.info', { name: story.name })}
                  onPress={() => {
                    setDetails(story.slug);
                  }}
                  style={styles.info}
                >
                  <IconInfoCircle size={22} color={colors.text.primary} />
                </Pressable>
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.name, { color: story.themeColor }]}>{story.name}</Text>
                <Text style={styles.description}>
                  {t(`story.tagline.${story.slug}`, { defaultValue: story.description })}
                </Text>
              </View>
            </Pressable>
          );
        })
      )}

      <Modal
        transparent
        visible={detailStory !== undefined}
        animationType="fade"
        onRequestClose={() => {
          setDetails(null);
        }}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            setDetails(null);
          }}
        >
          {detailStory ? (
            <Pressable style={styles.modal} accessibilityViewIsModal>
              <Image
                source={STORY_IMAGES[detailStory.slug]}
                style={styles.modalImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              <View style={styles.modalBody}>
                <Text style={[styles.name, { color: detailStory.themeColor }]}>
                  {detailStory.name}
                </Text>
                <Text style={styles.description}>
                  {t(`story.about.${detailStory.slug}`, { defaultValue: detailStory.description })}
                </Text>
                <Button
                  label={t('story.close')}
                  variant="secondary"
                  onPress={() => {
                    setDetails(null);
                  }}
                />
              </View>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  cardSelected: { borderWidth: 2 },
  image: { width: '100%', height: 150 },
  info: {
    position: 'absolute',
    right: space[8],
    top: space[8],
    width: size.touchTarget,
    height: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.sunken,
    opacity: 0.9,
  },
  cardText: { gap: space[4], padding: space[16] },
  name: { fontSize: fontSize[17], fontWeight: '700' },
  description: { color: colors.text.secondary, fontSize: fontSize[13] },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: space.screenMargin,
    backgroundColor: colors.bg.sunken,
  },
  modal: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  modalImage: { width: '100%', height: 150 },
  modalBody: { gap: space[12], padding: space[16] },
});
