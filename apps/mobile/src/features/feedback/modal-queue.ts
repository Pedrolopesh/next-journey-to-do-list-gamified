import type { AchievementTier, CheckResult } from '@nextjourney/contracts';

export type ModalEntry =
  | { kind: 'level'; level: number }
  | { kind: 'achievement'; slug: string; name: string; tier: AchievementTier; glyph: string }
  | { kind: 'chapter'; number: number; title: string; text: string; storyCompleted: boolean };

/**
 * Modals of a check, in the order they appear (one at a time): level, achievements and, last,
 * the chapter. The chapter is only released when the banner finishes the transition (see use-check-flow).
 */
export function buildModalQueue(result: CheckResult): {
  now: ModalEntry[];
  afterBanner: ModalEntry[];
} {
  const now: ModalEntry[] = [];
  if (result.leveledUp) now.push({ kind: 'level', level: result.level });
  for (const achievement of result.achievementsUnlocked) {
    now.push({
      kind: 'achievement',
      slug: achievement.slug,
      name: achievement.name,
      tier: achievement.tier,
      glyph: achievement.glyph,
    });
  }
  const afterBanner: ModalEntry[] = [];
  if (result.completedChapter) {
    afterBanner.push({ kind: 'chapter', ...result.completedChapter });
  }
  return { now, afterBanner };
}
