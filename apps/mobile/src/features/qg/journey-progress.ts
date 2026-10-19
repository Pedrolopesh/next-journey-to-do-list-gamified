import { DEFAULT_GAME_CONFIG } from '@nextjourney/contracts';

type PlayerLevelState = {
  level: number;
  expInLevel: number;
  expForNextLevel: number;
  /** Capítulo 5 concluído: o personagem fica no fim do cenário, sem portal. */
  story?: { completed: boolean };
};

/** Último cenário da história (capítulo 5): o nível sobe além disso, mas a cena não avança. */
export const MAX_SCENE_LEVEL = DEFAULT_GAME_CONFIG.chaptersPerStory;

/** Nível da cena para um nível do jogador (limitado ao último capítulo). */
export function sceneLevel(level: number): number {
  return Math.min(level, MAX_SCENE_LEVEL);
}

/** Quanto do nível atual já foi percorrido (0 a 1), pela EXP. O servidor decide a EXP; aqui só se lê. */
export function levelProgress(player: PlayerLevelState): number {
  if (player.story?.completed) return 1;
  if (player.expForNextLevel <= 0) return 0;
  return Math.min(1, Math.max(0, player.expInLevel / player.expForNextLevel));
}

/**
 * O que a jornada mostra. `shownLevel` é o nível da cena em exibição: se o jogador já subiu de nível
 * mas a cena ainda não trocou, o personagem fica no portal (progresso 1) até o próximo check. Com a
 * história concluída o personagem fica no fim da cena do capítulo 5, sem portal.
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
