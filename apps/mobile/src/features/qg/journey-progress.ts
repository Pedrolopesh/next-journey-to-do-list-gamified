import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';

type PlayerLevelState = {
  level: number;
  expInLevel: number;
  expForNextLevel: number;
  /** Chapter 5 completed: the character stays at the end of the scenery, with no portal. */
  story?: { completed: boolean };
};

/** Last scene of the story (chapter 5): the level goes up beyond that, but the scene does not advance. */
export const MAX_SCENE_LEVEL = DEFAULT_GAME_CONFIG.chaptersPerStory;

/** Scene level for a player level (capped at the last chapter). */
export function sceneLevel(level: number): number {
  return Math.min(level, MAX_SCENE_LEVEL);
}

/** How much of the current level was covered (0 to 1), by EXP. The server decides the EXP; here it is only read. */
export function levelProgress(player: PlayerLevelState): number {
  if (player.story?.completed) return 1;
  if (player.expForNextLevel <= 0) return 0;
  return Math.min(1, Math.max(0, player.expInLevel / player.expForNextLevel));
}

/**
 * What the journey shows. `shownLevel` is the level of the scene on display: if the player already leveled up
 * but the scene has not switched yet, the character stays at the portal (progress 1) until the next check. With the
 * story complete the character stays at the end of the chapter 5 scene, with no portal.
 */
export function journeyView(
  player: PlayerLevelState,
  shownLevel: number | undefined,
): { progress: number; portalPending: boolean } {
  if (shownLevel !== undefined && sceneLevel(player.level) > shownLevel) {
    return { progress: 1, portalPending: true };
  }
  return { progress: levelProgress(player), portalPending: false };
}
