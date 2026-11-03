import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, View } from 'react-native';

import { colors, space } from '@/theme';

const logo = require('../../assets/images/logo-livro.png') as number;

const WIDTH = 160;
const HEIGHT = 140;
/** The right page of the book in the image: where the page that turns starts. */
const PAGE = { left: 0.5, top: 0.07, width: 0.4375, height: 0.64 } as const;

/**
 * The book of the app floating, with a page that turns over now and then: a page of the same
 * pixel colors folds around the spine from right to left. Stays still with "reduce motion" on.
 */
export function AnimatedLogo() {
  const [float] = useState(() => new Animated.Value(0));
  const [turn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(float, {
              toValue: 1,
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(float, {
              toValue: 0,
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(900),
            Animated.timing(turn, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.delay(500),
            Animated.timing(turn, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [float, turn]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  // From the right (1) through edge-on (0) to the left (-1), around the spine
  const flip = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, -1] });
  const pageVisible = turn.interpolate({
    inputRange: [0, 0.02, 0.98, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={styles.box} accessibilityElementsHidden importantForAccessibility="no">
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors />
        <Animated.View
          style={[
            styles.page,
            {
              opacity: pageVisible,
              transform: [{ scaleX: flip }],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', padding: space[16] },
  logo: { width: WIDTH, height: HEIGHT },
  page: {
    position: 'absolute',
    left: WIDTH * PAGE.left,
    top: HEIGHT * PAGE.top,
    width: WIDTH * PAGE.width,
    height: HEIGHT * PAGE.height,
    backgroundColor: colors.pixel.page,
    borderColor: colors.brand.gold,
    borderWidth: 1,
    // Hinge on the spine: the left edge of the page stays put while the page flips
    transformOrigin: 'left center',
  },
});
