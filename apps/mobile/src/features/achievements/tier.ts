import { colors } from '../../theme/colors';

export type Tier = keyof typeof colors.tier;

/**
 * Classe (cor da moldura) de cada conquista do catálogo atual. É só apresentação: o servidor decide
 * quando a conquista é desbloqueada. Conquista sem entrada aqui usa bronze.
 */
const TIER_BY_SLUG: Record<string, Tier> = {
  'primeiro-passo': 'bronze',
  organizado: 'bronze',
  aprendiz: 'bronze',
  'novo-capitulo': 'bronze',
  madrugador: 'bronze',
  'chama-7-dias': 'silver',
  maratonista: 'silver',
  veterano: 'silver',
  equilibrio: 'silver',
  'lenda-viva': 'gold',
};

export function tierOf(slug: string): Tier {
  return TIER_BY_SLUG[slug] ?? 'bronze';
}

export function tierColor(tier: Tier): string {
  return colors.tier[tier];
}
