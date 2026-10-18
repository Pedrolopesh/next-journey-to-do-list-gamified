import type { AchievementTier } from '@nextjourney/contracts';

import { colors } from '../../theme/colors';

const TIER_COLOR: Record<AchievementTier, string> = {
  1: colors.tier.bronze,
  2: colors.tier.silver,
  3: colors.tier.gold,
  4: colors.tier.diamond,
};

/** Cor da moldura da classe (1 bronze, 2 prata, 3 ouro, 4 diamante) que o servidor manda. */
export function tierColor(tier: AchievementTier): string {
  return TIER_COLOR[tier];
}
