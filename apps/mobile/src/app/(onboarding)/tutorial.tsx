import type { LpcLook } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { patchMe } from '@/api/endpoints';
import { queryKeys } from '@/api/queries';
import { BackButton } from '@/components/back-button';
import { Button } from '@/components/button';
import { IntroCheckDemo, IntroScenery, IntroWalkingHero } from '@/components/intro-demos';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';
import { DEFAULT_LOOK } from '@/features/qg/options';
import { colors, fontSize, space } from '@/theme';

const SLIDES = ['slide1', 'slide2', 'slide3'] as const;

/**
 * Intro in 3 screens (skippable) that let the person try the app: swap the hero, check an item and
 * see the coins and EXP move, and pick a scenery. Nothing here is saved or sent to the API.
 */
export default function TutorialScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  // The look picked on the first slide follows the person through the other two (not saved)
  const [look, setLook] = useState<LpcLook>(DEFAULT_LOOK);
  const { run, loading: saving } = useAction({
    name: 'onboarding.tutorial',
    error: (error) => describeError(error, t),
  });
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index] ?? SLIDES[0];

  const finish = (): Promise<boolean> =>
    run(async () => {
      const me = await patchMe({ tutorialSeen: true });
      queryClient.setQueryData(queryKeys.me, me);
      router.push('/goal');
    });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[16] },
      ]}
    >
      <View style={styles.backRow}>
        {index > 0 ? (
          <BackButton
            onPress={() => {
              setIndex(index - 1);
            }}
          />
        ) : null}
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {slide === 'slide1' ? <IntroWalkingHero look={look} onLookChange={setLook} /> : null}
        {slide === 'slide2' ? <IntroCheckDemo look={look} /> : null}
        {slide === 'slide3' ? <IntroScenery look={look} /> : null}
        <Text style={styles.title} accessibilityRole="header">
          {t(`tutorial.${slide}.title`)}
        </Text>
        <Text style={styles.text}>{t(`tutorial.${slide}.text`)}</Text>
        <Text
          style={styles.dots}
          accessibilityLabel={t('tutorial.progress', { current: index + 1, total: SLIDES.length })}
        >
          {SLIDES.map((_, i) => (i === index ? '●' : '○')).join(' ')}
        </Text>
      </ScrollView>
      <View style={styles.actions}>
        <Button
          label={last ? t('tutorial.start') : t('tutorial.next')}
          loading={saving}
          onPress={() => {
            if (last) void finish();
            else setIndex(index + 1);
          }}
        />
        {/* The space of "Pular" stays reserved on the last slide so the content does not jump */}
        <View style={last ? styles.reserved : undefined}>
          <Button label={t('tutorial.skip')} variant="ghost" onPress={() => void finish()} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: space.screenMargin, backgroundColor: colors.bg.base },
  backRow: { height: 44 },
  body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: space[16] },
  title: {
    color: colors.text.primary,
    fontSize: fontSize[24],
    fontWeight: '700',
    textAlign: 'center',
  },
  text: { color: colors.text.secondary, fontSize: fontSize[15], textAlign: 'center' },
  dots: { color: colors.brand.primaryLight, fontSize: fontSize[14], letterSpacing: 4 },
  actions: { gap: space[8] },
  reserved: { opacity: 0 },
});
