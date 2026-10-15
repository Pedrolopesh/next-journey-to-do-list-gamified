type PlayerLevelState = { level: number; expInLevel: number; expForNextLevel: number };

/** Quanto do nível atual já foi percorrido (0 a 1), pela EXP. O servidor decide a EXP; aqui só se lê. */
export function levelProgress(player: PlayerLevelState): number {
  if (player.expForNextLevel <= 0) return 0;
  return Math.min(1, Math.max(0, player.expInLevel / player.expForNextLevel));
}

/**
 * O que a jornada mostra. `shownLevel` é o nível da cena em exibição: se o jogador já subiu de nível
 * mas a cena ainda não trocou, o personagem fica no portal (progresso 1) até o próximo check.
 */
export function journeyView(
  player: PlayerLevelState,
  shownLevel: number | undefined,
): { progress: number; portalPending: boolean } {
  if (shownLevel !== undefined && player.level > shownLevel) {
    return { progress: 1, portalPending: true };
  }
  return { progress: levelProgress(player), portalPending: false };
}
