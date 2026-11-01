import { Dimensions, PixelRatio } from 'react-native';

/** Width of the frames in the Figma (iPhone 14 Pro): every design value is written for it. */
const REFERENCE_WIDTH = 390;
/** Phones narrower than this or wider than this (tablets) stop scaling, to keep the layout usable. */
const MIN_FACTOR = 0.85;
const MAX_FACTOR = 1.25;

const factor = (width: number): number =>
  Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, width / REFERENCE_WIDTH));

/**
 * Scales a design value (px at the Figma reference width) to the screen in use, so spacing and
 * type follow the device width instead of staying fixed. Rounded to a physical pixel.
 */
export const scale = (value: number, width: number = Dimensions.get('window').width): number =>
  PixelRatio.roundToNearestPixel(value * factor(width));

// The tokens are computed once at start: the app is locked to portrait (app.config.ts), so the
// window width does not change while it runs.

/** Type scale (sizes used by the design, scaled to the screen). Use `fontSize[14]`, not `14`. */
export const fontSize = {
  11: scale(11),
  12: scale(12),
  13: scale(13),
  14: scale(14),
  15: scale(15),
  16: scale(16),
  17: scale(17),
  18: scale(18),
  20: scale(20),
  22: scale(22),
  24: scale(24),
  26: scale(26),
  28: scale(28),
} as const;
