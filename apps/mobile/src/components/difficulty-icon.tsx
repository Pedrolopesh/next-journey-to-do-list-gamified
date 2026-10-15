import type { Difficulty } from '@nextjourney/contracts';
import Svg, { Rect } from 'react-native-svg';

import { colors } from '@/theme';

const LEVELS: Record<Difficulty, { filled: number; color: string }> = {
  easy: { filled: 1, color: colors.status.success },
  medium: { filled: 2, color: colors.status.warning },
  hard: { filled: 3, color: colors.status.danger },
};

/**
 * Dificuldade em três barras crescentes (vetor): fácil 1 preenchida, médio 2, difícil 3. As vazias
 * ficam apagadas. A cor reforça o nível, mas o número de barras é que diz qual é.
 */
export function DifficultyIcon({
  difficulty,
  size = 28,
}: {
  difficulty: Difficulty;
  size?: number;
}) {
  const { filled, color } = LEVELS[difficulty];
  const bars = [
    { x: 2, y: 14, h: 8 },
    { x: 10, y: 8, h: 14 },
    { x: 18, y: 2, h: 20 },
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 26 24">
      {bars.map((bar, index) => (
        <Rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width={6}
          height={bar.h}
          rx={2}
          fill={index < filled ? color : colors.border.strong}
          opacity={index < filled ? 1 : 0.45}
        />
      ))}
    </Svg>
  );
}
