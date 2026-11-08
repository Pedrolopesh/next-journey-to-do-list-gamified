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
import {
  IntroCheckDemo,
  IntroItemTypes,
  IntroRewards,
  IntroScenery,
  IntroWalkingHero,
} from '@/components/intro-demos';
import { IntroWelcome } from '@/components/intro-welcome';
import { PixelTitle } from '@/components/pixel-title';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';
import { DEFAULT_LOOK } from '@/features/qg/options';
import { colors, fontSize, space } from '@/theme';

const STEPS = ['welcome', 'slide1', 'slide2', 'slide3'] as const;

/**
 * Intro (skippable): a welcome with the animated book, then 3 screens that let the person try the
 * app: see the hero walk, check an item and see the rewards, and pick a scenery. Nothing here is
 * saved or sent to the API, and the next step is always creating the character.
 */
export default function TutorialScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const { run, loading: saving } = useAction({
    name: 'onboarding.tutorial',
    error: (error) => describeError(error, t),
  });
  const step = STEPS[index] ?? STEPS[0];
  const welcome = step === 'welcome';
  const last = index === STEPS.length - 1;

  const finish = (): Promise<boolean> =>
    run(async () => {
      const me = await patchMe({ tutorialSeen: true });
      queryClient.setQueryData(queryKeys.me, me);
      router.push('/character');
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
        <PixelTitle lead={t('tutorial.titleLead')} accent={t('tutorial.titleAccent')} />
        {welcome ? (
          <IntroWelcome />
        ) : (
          <>
            {step === 'slide1' ? <IntroWalkingHero look={DEFAULT_LOOK} /> : null}
            {step === 'slide2' ? <IntroCheckDemo /> : null}
            {step === 'slide3' ? <IntroScenery look={DEFAULT_LOOK} /> : null}
            <View style={styles.copy}>
              <Text style={styles.title} accessibilityRole="header">
                {t(`tutorial.${step}.title`)}
              </Text>
              <Text style={styles.text}>{t(`tutorial.${step}.text`)}</Text>
            </View>
            {step === 'slide1' ? <IntroItemTypes /> : null}
            {step === 'slide2' ? <IntroRewards /> : null}
          </>
        )}
      </ScrollView>
      <View style={styles.actions}>
        <Button
          label={welcome ? t('tutorial.begin') : last ? t('tutorial.start') : t('tutorial.next')}
          loading={saving}
          onPress={() => {
            if (last) void finish();
            else setIndex(index + 1);
          }}
        />
        {/* The space of "Pular" stays reserved on the welcome so the button does not jump */}
        <View
          style={welcome ? styles.reserved : undefined}
          pointerEvents={welcome ? 'none' : 'auto'}
          accessibilityElementsHidden={welcome}
          importantForAccessibility={welcome ? 'no-hide-descendants' : 'auto'}
        >
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
  body: { flexGrow: 1, gap: space[16], paddingBottom: space[16] },
  copy: { gap: space[8] },
  title: { color: colors.text.primary, fontSize: fontSize[22], fontWeight: '700' },
  text: { color: colors.text.secondary, fontSize: fontSize[14] },
  actions: { gap: space[8] },
  reserved: { opacity: 0 },
});
