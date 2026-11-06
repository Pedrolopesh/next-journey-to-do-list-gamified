import type { AchievementTier } from '@nextjourney/contracts';

import { colors } from '../../theme/colors';

const TIER_COLOR: Record<AchievementTier, string> = {
  1: colors.tier.bronze,
  2: colors.tier.silver,
  3: colors.tier.gold,
  4: colors.tier.diamond,
};

/** Color of the class frame (1 bronze, 2 silver, 3 gold, 4 diamond) that the server sends. */
export function tierColor(tier: AchievementTier): string {
  return TIER_COLOR[tier];
}
