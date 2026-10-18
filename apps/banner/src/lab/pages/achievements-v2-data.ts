import {
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_TIERS,
  ACHIEVEMENT_TRAILS,
  type AchievementTier,
} from '@nextjourney/contracts';
import type { InsigniaName } from '@nextjourney/insignias';

/**
 * Visão do laboratório sobre o catálogo oficial de conquistas (`@nextjourney/contracts`): a lista é
 * a mesma do app e da API; aqui só entram a cor de cada classe e de onde sai o dado de cada critério.
 */

export type Tier = AchievementTier;
/** pronto: o servidor já mede; consulta: sai das tabelas atuais; novo: precisa de contador ou evento novo. */
export type Source = 'pronto' | 'consulta' | 'novo';

export type Trail = { id: string; name: string; goal: string };
export type Proposal = {
  id: string;
  trail: string;
  tier: Tier;
  name: string;
  desc: string;
  glyph: InsigniaName;
  source: Source;
  /** Conquista surpresa: a descrição só aparece depois de desbloquear. */
  secret?: true;
};

const TIER_COLORS: Record<Tier, string> = {
  1: '#cd7f32',
  2: '#cbd5e1',
  3: '#facc15',
  4: '#67e8f9',
};

export const TIERS: { tier: Tier; name: string; color: string }[] = ACHIEVEMENT_TIERS.map((t) => ({
  tier: t.tier,
  name: t.name,
  color: TIER_COLORS[t.tier],
}));

export const TRAILS: Trail[] = ACHIEVEMENT_TRAILS.map((t) => ({ ...t }));

const SOURCES: Record<string, Source> = {
  'primeiro-passo': 'pronto',
  'diario-inaugural': 'consulta',
  'primeira-tarefa': 'consulta',
  'primeiro-habito': 'consulta',
  'rotina-marcada': 'consulta',
  'tarefa-cumprida': 'consulta',
  'habito-em-acao': 'consulta',
  'cara-nova': 'novo',
  voltou: 'consulta',
  'rotina-em-marcha': 'consulta',
  'rotina-firme': 'consulta',
  'rotina-de-ferro': 'consulta',
  'mestre-da-rotina': 'consulta',
  'dia-perfeito': 'consulta',
  'chama-3-dias': 'pronto',
  'chama-7-dias': 'pronto',
  'chama-14-dias': 'pronto',
  'chama-30-dias': 'pronto',
  'pe-na-lista': 'consulta',
  executor: 'consulta',
  imparavel: 'consulta',
  'maquina-de-entregas': 'consulta',
  'lista-zerada': 'consulta',
  'no-prazo': 'consulta',
  resgate: 'consulta',
  'peso-pesado': 'consulta',
  semente: 'consulta',
  raiz: 'consulta',
  arvore: 'consulta',
  floresta: 'consulta',
  'habito-em-chama': 'consulta',
  'habito-de-7': 'consulta',
  'habito-de-30': 'consulta',
  'dia-de-foco': 'consulta',
  organizado: 'pronto',
  planejador: 'pronto',
  'arquiteto-da-rotina': 'pronto',
  maratonista: 'pronto',
  'semana-inteira': 'consulta',
  'mes-de-constancia': 'consulta',
  madrugador: 'pronto',
  coruja: 'pronto',
  equilibrio: 'pronto',
  'vida-em-equilibrio': 'consulta',
  'do-meu-jeito': 'novo',
  aprendiz: 'pronto',
  veterano: 'pronto',
  mestre: 'pronto',
  'lenda-do-nivel': 'pronto',
  'novo-capitulo': 'pronto',
  'livro-aberto': 'pronto',
  'lenda-viva': 'pronto',
  colecionador: 'pronto',
  cofrinho: 'consulta',
  tesouro: 'consulta',
  fortuna: 'consulta',
  'hora-marcada': 'novo',
  'pena-leve': 'consulta',
  'guarda-roupa': 'novo',
  'no-podio': 'consulta',
  'coracao-valente': 'consulta',
  'bolsa-cheia': 'consulta',
  'dia-brilhante': 'consulta',
  'diamante-bruto': 'consulta',
  'colecionador-de-medalhas': 'consulta',
  'cacador-de-trofeus': 'consulta',
  'primeiro-lugar': 'consulta',
  louros: 'consulta',
  'cofre-aberto': 'consulta',
};

export const PROPOSAL: Proposal[] = ACHIEVEMENT_CATALOG.map((a) => ({
  id: a.slug,
  trail: a.trail,
  tier: a.tier,
  name: a.name,
  desc: a.description,
  glyph: a.glyph,
  source: SOURCES[a.slug] ?? 'consulta',
  ...('secret' in a ? { secret: true as const } : {}),
}));
