import type { LocalDate } from '@nextjourney/contracts';

import { addDays, diaDaSemana } from './dates.js';

/** Catálogo inicial de conquistas (REQUISITOS.MD). O seed grava estas linhas no banco. */
export const ACHIEVEMENT_CATALOG = [
  {
    slug: 'primeiro-passo',
    name: 'Primeiro passo',
    description: 'Faça o seu primeiro check',
    iconKey: 'first-step',
    rewardKey: null,
  },
  {
    slug: 'chama-7-dias',
    name: 'Chama de 7 dias',
    description: 'Conclua todos os diários agendados por 7 dias seguidos',
    iconKey: 'flame',
    rewardKey: 'outfit-special',
  },
  {
    slug: 'organizado',
    name: 'Organizado',
    description: 'Crie 10 itens',
    iconKey: 'organized',
    rewardKey: null,
  },
  {
    slug: 'maratonista',
    name: 'Maratonista',
    description: 'Faça 100 checks no total',
    iconKey: 'marathon',
    rewardKey: 'accessory-bandana',
  },
  {
    slug: 'aprendiz',
    name: 'Aprendiz',
    description: 'Chegue ao nível 5',
    iconKey: 'apprentice',
    rewardKey: 'weapon-silver-sword',
  },
  {
    slug: 'veterano',
    name: 'Veterano',
    description: 'Chegue ao nível 10',
    iconKey: 'veteran',
    rewardKey: 'outfit-cape',
  },
  {
    slug: 'novo-capitulo',
    name: 'Novo capítulo',
    description: 'Complete o primeiro capítulo',
    iconKey: 'new-chapter',
    rewardKey: null,
  },
  {
    slug: 'lenda-viva',
    name: 'Lenda viva',
    description: 'Complete uma história inteira',
    iconKey: 'legend',
    rewardKey: 'accessory-shield',
  },
  {
    slug: 'madrugador',
    name: 'Madrugador',
    description: 'Faça um check antes das 07h',
    iconKey: 'early-bird',
    rewardKey: null,
  },
  {
    slug: 'equilibrio',
    name: 'Equilíbrio',
    description: 'Faça checks em 3 categorias diferentes no mesmo dia',
    iconKey: 'balance',
    rewardKey: null,
  },
] as const;

export type AchievementSlug = (typeof ACHIEVEMENT_CATALOG)[number]['slug'];

export type AchievementContext = {
  totalChecks: number;
  level: number;
  itemsCreated: number;
  /** Capítulos já concluídos, somando todas as histórias. */
  chaptersCompleted: number;
  storiesCompleted: number;
  /** Hora local (0 a 23) do check que está sendo processado. */
  checkHour: number;
  /** Categorias distintas com check ativo no dia local de hoje. */
  categoriesToday: number;
  /** Dias seguidos completos (ver diasSeguidosCompletos). */
  fullDaysStreak: number;
};

export const FULL_DAYS_FOR_FLAME = 7;
export const TOTAL_CHECKS_FOR_MARATHON = 100;
export const ITEMS_FOR_ORGANIZED = 10;

/** Todas as conquistas cujo critério está satisfeito agora. Quem decide o que é novo é o chamador. */
export function conquistasAtendidas(ctx: AchievementContext): AchievementSlug[] {
  const earned: AchievementSlug[] = [];
  if (ctx.totalChecks >= 1) earned.push('primeiro-passo');
  if (ctx.fullDaysStreak >= FULL_DAYS_FOR_FLAME) earned.push('chama-7-dias');
  if (ctx.itemsCreated >= ITEMS_FOR_ORGANIZED) earned.push('organizado');
  if (ctx.totalChecks >= TOTAL_CHECKS_FOR_MARATHON) earned.push('maratonista');
  if (ctx.level >= 5) earned.push('aprendiz');
  if (ctx.level >= 10) earned.push('veterano');
  if (ctx.chaptersCompleted >= 1) earned.push('novo-capitulo');
  if (ctx.storiesCompleted >= 1) earned.push('lenda-viva');
  if (ctx.checkHour < 7) earned.push('madrugador');
  if (ctx.categoriesToday >= 3) earned.push('equilibrio');
  return earned;
}

/** Progresso numérico para a tela de conquistas (nulo quando o critério é um evento). */
export function progressoDaConquista(
  slug: AchievementSlug,
  ctx: Pick<
    AchievementContext,
    'totalChecks' | 'level' | 'itemsCreated' | 'fullDaysStreak' | 'categoriesToday'
  >,
): { current: number; target: number } | null {
  const capped = (current: number, target: number) => ({
    current: Math.min(current, target),
    target,
  });
  switch (slug) {
    case 'chama-7-dias':
      return capped(ctx.fullDaysStreak, FULL_DAYS_FOR_FLAME);
    case 'organizado':
      return capped(ctx.itemsCreated, ITEMS_FOR_ORGANIZED);
    case 'maratonista':
      return capped(ctx.totalChecks, TOTAL_CHECKS_FOR_MARATHON);
    case 'aprendiz':
      return capped(ctx.level, 5);
    case 'veterano':
      return capped(ctx.level, 10);
    case 'equilibrio':
      return capped(ctx.categoriesToday, 3);
    default:
      return null;
  }
}

export type DiarioDaChama = {
  scheduleDays: readonly number[];
  createdOn: LocalDate;
  /** Dias locais com check ativo neste diário. */
  diasMarcados: readonly LocalDate[];
};

const MAX_LOOKBACK_DAYS = 90;

/**
 * Dias seguidos em que TODO diário agendado foi concluído no próprio dia (voltando a partir de hoje).
 * Dia sem nenhum diário agendado é neutro: não conta e não quebra. Hoje incompleto ainda não
 * quebra (o dia não terminou); um dia anterior incompleto quebra.
 */
export function diasSeguidosCompletos(diarios: readonly DiarioDaChama[], hoje: LocalDate): number {
  const marcados = diarios.map((d) => new Set(d.diasMarcados));
  let streak = 0;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i += 1) {
    const dia = addDays(hoje, -i);
    const agendados = diarios
      .map((d, index) => ({ d, index }))
      .filter(({ d }) => d.createdOn <= dia && d.scheduleDays.includes(diaDaSemana(dia)));
    if (agendados.length === 0) continue; // neutro
    const completo = agendados.every(({ index }) => marcados[index]?.has(dia) ?? false);
    if (completo) streak += 1;
    else if (i > 0) break;
  }
  return streak;
}
