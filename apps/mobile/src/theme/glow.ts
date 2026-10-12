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

/** Mistura `hex` com `base` (0 = só `hex`, 1 = só `base`); devolve "#rrggbb". */
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
  /** Botão apertado: brilho mais curto e sem subir. */
  pressed?: boolean;
  /** 0 a 1: quanto do brilho aparece (secundários e chips usam menos). */
  strength?: number;
  /** Cor do halo, quando for diferente da cor do botão (ex.: botão escuro com halo azul). */
  halo?: string;
};

/**
 * Estilo "brilho suave": gradiente leve, realce no topo e um halo difuso na cor do botão.
 * Usa `boxShadow` e `experimental_backgroundImage` do React Native (iOS e Android, nova arquitetura).
 * Fica de fora de propósito: a barra de navegação inferior.
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
            offsetY: 4,
            blurRadius: 12,
            spreadDistance: -6,
            color: rgba(halo, 0.6 * k),
          },
          { offsetX: 0, offsetY: 0, blurRadius: 10, color: rgba(halo, 0.25 * k) },
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
            offsetY: 8,
            blurRadius: 22,
            spreadDistance: -8,
            color: rgba(halo, 0.7 * k),
          },
          { offsetX: 0, offsetY: 0, blurRadius: 18, color: rgba(halo, 0.28 * k) },
        ],
  };
}
