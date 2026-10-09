import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { patchMe } from '@/api/endpoints';
import { queryKeys } from '@/api/queries';
import { Button } from '@/components/button';
import { nextOnboardingStep } from '@/features/onboarding/next-step';
import { colors, space } from '@/theme';

const SLIDES = ['slide1', 'slide2', 'slide3'] as const;

/** Tutorial de 3 slides, pulável, só no primeiro acesso (RF-10). */
export default function TutorialScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index] ?? SLIDES[0];

  const finish = async (): Promise<void> => {
    setSaving(true);
    try {
      const me = await patchMe({ tutorialSeen: true });
      queryClient.setQueryData(queryKeys.me, me);
      const next = nextOnboardingStep(me.onboarding);
      if (next === 'character') router.replace('/character');
      else if (next === 'story') router.replace('/story');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + space[24], paddingBottom: insets.bottom + space[24] },
      ]}
    >
      <View style={styles.hero}>
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
        {!last ? (
          <Button label={t('tutorial.skip')} variant="ghost" onPress={() => void finish()} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: space.screenMargin,
    backgroundColor: colors.bg.base,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[16] },
  title: { color: colors.text.primary, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  text: { color: colors.text.secondary, fontSize: 15, textAlign: 'center' },
  dots: { color: colors.brand.primaryLight, fontSize: 14, letterSpacing: 4 },
  actions: { gap: space[8] },
});
