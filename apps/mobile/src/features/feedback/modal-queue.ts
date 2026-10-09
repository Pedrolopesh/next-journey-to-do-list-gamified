import type { CheckResult } from '@nextjourney/contracts';

export type ModalEntry =
  | { kind: 'level'; level: number }
  | { kind: 'achievement'; slug: string; name: string; rewardKey: string | null }
  | { kind: 'chapter'; number: number; title: string; text: string; storyCompleted: boolean };

/**
 * Modais de um check, na ordem em que aparecem (um de cada vez): nível, conquistas e, por último,
 * o capítulo. O capítulo só é liberado quando o banner termina a transição (ver use-check-flow).
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
      rewardKey: achievement.rewardKey,
    });
  }
  const afterBanner: ModalEntry[] = [];
  if (result.completedChapter) {
    afterBanner.push({ kind: 'chapter', ...result.completedChapter });
  }
  return { now, afterBanner };
}
