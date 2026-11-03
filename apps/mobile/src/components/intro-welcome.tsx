import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, space } from '@/theme';

import { AnimatedLogo } from './animated-logo';
import { PixelArt, type PixelArtName } from './pixel-art';

const STEPS: readonly { art: PixelArtName; key: 'character' | 'story' | 'check' }[] = [
  { art: 'character', key: 'character' },
  { art: 'scenery', key: 'story' },
  { art: 'dailies', key: 'check' },
];

/**
 * First screen of the intro: the animated book of the app, a welcome and the three steps ahead.
 * Nothing here is saved.
 */
export function IntroWelcome() {
  const { t } = useTranslation();
  return (
    <View style={styles.stack}>
      <View style={styles.frame}>
        <AnimatedLogo />
      </View>
      <View style={styles.speech}>
        <Text style={styles.speechTitle} accessibilityRole="header">
          {t('tutorial.welcome.title')}
        </Text>
        <Text style={styles.speechText}>{t('tutorial.welcome.text')}</Text>
      </View>
      <Text style={styles.kicker}>{t('tutorial.welcome.kicker')}</Text>
      <View style={styles.steps}>
        {STEPS.map((step) => (
          <View key={step.key} style={styles.step}>
            <PixelArt name={step.art} size={40} />
            <View style={styles.stepLabel}>
              {t(`tutorial.welcome.steps.${step.key}`)
                .split('\n')
                .map((line) => (
                  <Text key={line} style={styles.stepLine}>
                    {line}
                  </Text>
                ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: space[16] },
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[16],
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.brand.gold,
    backgroundColor: colors.bg.surface,
  },
  speech: {
    gap: space[4],
    padding: space[16],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.surface,
  },
  speechTitle: { color: colors.brand.primaryLight, fontSize: fontSize[16], fontWeight: '700' },
  speechText: { color: colors.text.primary, fontSize: fontSize[14] },
  kicker: {
    color: colors.text.muted,
    fontSize: fontSize[12],
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  steps: { flexDirection: 'row', gap: space[8] },
  step: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    minHeight: 112,
    padding: space[8],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.surface,
  },
  stepLabel: { alignItems: 'center' },
  stepLine: { color: colors.text.primary, fontSize: fontSize[12], fontWeight: '600' },
});
