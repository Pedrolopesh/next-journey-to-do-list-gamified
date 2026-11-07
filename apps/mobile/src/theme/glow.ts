import type { ViewStyle } from 'react-native';

import { colors } from './colors';

/** "#rrggbb" -> [r, g, b]. */
function parse(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = parse(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mixes `hex` with `base` (0 = only `hex`, 1 = only `base`); returns "#rrggbb". */
export function mix(hex: string, base: string, amount: number): string {
  const a = parse(hex);
  const b = parse(base);
  const channel = (i: 0 | 1 | 2): string =>
    Math.round(a[i] * (1 - amount) + b[i] * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

type Options = {
  /** Pressed button: shorter glow and no lift. */
  pressed?: boolean;
  /** 0 to 1: how much of the glow shows (secondaries and chips use less). */
  strength?: number;
  /** Halo color, when different from the button color (e.g. dark button with blue halo). */
  halo?: string;
};

/**
 * "Soft glow" style: light gradient, highlight on top and a diffuse halo in the button color.
 * Uses React Native's `boxShadow` and `experimental_backgroundImage` (iOS and Android, new architecture).
 * Deliberately left out: the bottom navigation bar.
 */
export function softGlow(
  color: string,
  { pressed = false, strength = 1, halo = color }: Options = {},
): ViewStyle {
  const k = Math.max(0, Math.min(1, strength));
  return {
    experimental_backgroundImage: `linear-gradient(180deg, ${color}, ${mix(color, colors.bg.surface, 0.18)})`,
    boxShadow: pressed
      ? [
          { offsetX: 0, offsetY: 2, blurRadius: 6, color: 'rgba(0, 0, 0, 0.3)', inset: true },
          {
            offsetX: 0,
            offsetY: 2,
            blurRadius: 8,
            spreadDistance: -5,
            color: rgba(halo, 0.35 * k),
          },
          { offsetX: 0, offsetY: 0, blurRadius: 8, color: rgba(halo, 0.12 * k) },
        ]
      : [
          {
            offsetX: 0,
            offsetY: 1,
            blurRadius: 0,
            color: 'rgba(255, 255, 255, 0.28)',
            inset: true,
          },
          {
            offsetX: 0,
            offsetY: 4,
            blurRadius: 14,
            spreadDistance: -6,
            color: rgba(halo, 0.45 * k),
          },
          { offsetX: 0, offsetY: 0, blurRadius: 10, color: rgba(halo, 0.16 * k) },
        ],
  };
}

/**
 * Outlined soft glow: only the border and a light fill in the color, with the same diffuse halo.
 * For secondary actions (the filled button is kept for the screen's main action).
 */
export function softGlowOutline(
  color: string,
  { pressed = false }: { pressed?: boolean } = {},
): ViewStyle {
  return {
    borderWidth: 1.5,
    borderColor: rgba(color, pressed ? 0.95 : 0.75),
    experimental_backgroundImage: pressed
      ? `linear-gradient(180deg, ${rgba(color, 0.3)}, ${rgba(color, 0.18)})`
      : `linear-gradient(180deg, ${rgba(color, 0.14)}, ${rgba(color, 0.04)})`,
    boxShadow: pressed
      ? [
          { offsetX: 0, offsetY: 2, blurRadius: 6, color: 'rgba(0, 0, 0, 0.25)', inset: true },
          { offsetX: 0, offsetY: 2, blurRadius: 8, spreadDistance: -5, color: rgba(color, 0.26) },
        ]
      : [
          { offsetX: 0, offsetY: 1, blurRadius: 0, color: 'rgba(255, 255, 255, 0.1)', inset: true },
          { offsetX: 0, offsetY: 4, blurRadius: 12, spreadDistance: -6, color: rgba(color, 0.32) },
          { offsetX: 0, offsetY: 0, blurRadius: 10, color: rgba(color, 0.1) },
        ],
  };
}

/** Card outlined in the tone color (indicators and story card): strong border and light background. */
export function tonedCard(
  color: string,
): Pick<ViewStyle, 'borderWidth' | 'borderColor' | 'backgroundColor'> {
  return {
    borderWidth: 1.5,
    borderColor: rgba(color, 0.7),
    backgroundColor: rgba(color, 0.08),
  };
}
