import { PixelifySans_700Bold, useFonts } from '@expo-google-fonts/pixelify-sans';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';

import { gradientColor } from '@/features/onboarding/title-gradient';
import { colors, fontSize } from '@/theme';

/** Colors the accent line goes through; the gold of the design comes first and is the still one. */
const STOPS = [
  colors.brand.gold,
  colors.brand.primaryLight,
  colors.status.info,
  colors.status.success,
] as const;
/** One full trip through the colors, and how much of the loop the word spans at once. */
const LOOP_MS = 7000;
const SPREAD = 0.35;
const FRAME_MS = 50;

type Props = { lead: string; accent: string };

/**
 * Two-line title in a pixel font: the lead in plain text and the accent line with a gradient that
 * slides softly through the colors. With "reduce motion" on, the accent stays still in gold.
 */
export function PixelTitle({ lead, accent }: Props) {
  const [loaded] = useFonts({ PixelifySans_700Bold });
  const [phase, setPhase] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setStill);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setStill);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (still) return;
    const started = Date.now();
    const timer = setInterval(() => {
      setPhase(((Date.now() - started) % LOOP_MS) / LOOP_MS);
    }, FRAME_MS);
    return () => {
      clearInterval(timer);
    };
  }, [still]);

  const font = loaded ? styles.font : null;
  const letters = Array.from(accent);
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={`${lead} ${accent}`}>
      <Text style={[styles.lead, font]} importantForAccessibility="no">
        {lead}
      </Text>
      <Text style={[styles.accent, font]} importantForAccessibility="no">
        {letters.map((letter, i) => (
          <Text
            key={i}
            style={{
              color: still
                ? colors.brand.gold
                : gradientColor(STOPS, phase + (i / letters.length) * SPREAD),
            }}
          >
            {letter}
          </Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  font: { fontFamily: 'PixelifySans_700Bold' },
  lead: {
    color: colors.text.primary,
    fontSize: fontSize[24],
    textAlign: 'center',
    lineHeight: fontSize[24] * 1.25,
  },
  accent: { fontSize: fontSize[28], textAlign: 'center', lineHeight: fontSize[28] * 1.25 },
});
