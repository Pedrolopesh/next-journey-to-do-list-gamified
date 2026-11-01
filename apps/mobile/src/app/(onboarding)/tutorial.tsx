import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, type ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { patchMe } from '@/api/endpoints';
import { queryKeys } from '@/api/queries';
import { BackButton } from '@/components/back-button';
import { Button } from '@/components/button';
import { PixelArt } from '@/components/pixel-art';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';
import { colors, fontSize, radius, space } from '@/theme';

const SLIDES = ['slide1', 'slide2', 'slide3'] as const;

const beach = require('../../../assets/onboarding/scene-beach.png') as ImageSourcePropType;
const castle = require('../../../assets/onboarding/scene-castle.png') as ImageSourcePropType;
const zombie = require('../../../assets/onboarding/scene-zombie.png') as ImageSourcePropType;
const hell = require('../../../assets/onboarding/scene-hell.png') as ImageSourcePropType;
const hero = require('../../../assets/onboarding/preview-adventurer.png') as ImageSourcePropType;

/** Illustration of each slide (scene art generated from the banner, and the app's own pixel art). */
function Illustration({ slide }: { slide: (typeof SLIDES)[number] }) {
  if (slide === 'slide1') {
    return (
      <Image
        source={hero}
        style={styles.hero}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }
  if (slide === 'slide2') {
    return (
      <View style={styles.pixels}>
        <PixelArt name="dailies" size={72} />
        <PixelArt name="coin" size={72} />
        <PixelArt name="streak" size={72} />
      </View>
    );
  }
  return (
    <View style={styles.grid}>
      {[beach, castle, zombie, hell].map((source, index) => (
        <Image
          key={index}
          source={source}
          style={styles.tile}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ))}
    </View>
  );
}

/** Intro in 3 screens (skippable): create the hero, mark to earn EXP, choose the journey. */
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
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index] ?? SLIDES[0];

  const finish = (): Promise<boolean> =>
    run(async () => {
      const me = await patchMe({ tutorialSeen: true });
      queryClient.setQueryData(queryKeys.me, me);
      router.replace('/goal');
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
      <View style={styles.body}>
        <Illustration slide={slide} />
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
      </View>
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
  container: { flex: 1, paddingHorizontal: space.screenMargin, backgroundColor: colors.bg.base },
  backRow: { height: 44 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[16] },
  hero: { width: '100%', height: 220, borderRadius: radius.lg },
  pixels: { flexDirection: 'row', gap: space[16], height: 220, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8], width: '100%', height: 220 },
  tile: { width: '48.5%', height: 106, borderRadius: radius.md },
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
