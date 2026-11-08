// Spacing, radius and sizes of the design system. Source: the Figma design system.
// Spacing and icons follow the screen width (see `scale.ts`); the touch target never goes
// below 44 pt (accessibility rule).
import { Platform } from 'react-native';

import { scale } from './scale';

export const space = {
  4: scale(4),
  8: scale(8),
  12: scale(12),
  16: scale(16),
  20: scale(20),
  24: scale(24),
  32: scale(32),
  40: scale(40),
  screenMargin: scale(16),
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
  button: 10,
  card: 12,
} as const;

export const size = {
  touchTarget: Math.max(44, scale(44)),
  navBarHeight: 84,
  iconSize: scale(24),
} as const;

/**
 * Top padding of a screen presented as a modal: the iOS sheet already starts below the status bar,
 * so the safe-area inset would only leave an empty band above the header; Android draws it full
 * screen and still needs the inset.
 */
export const modalTop = (safeAreaTop: number): number =>
  Platform.OS === 'ios' ? space[8] : safeAreaTop;
