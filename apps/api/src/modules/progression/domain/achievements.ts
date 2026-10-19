import { ACHIEVEMENT_CATALOG, type AchievementSlug, type LocalDate } from '@nextjourney/contracts';

import { addDays, diaDaSemana } from './dates.js';

export type { AchievementSlug };

/** Tudo que os critérios das conquistas precisam saber. Montado pelo serviço; os critérios são puros. */
export type AchievementContext = {
  totalChecks: number;
  level: number;
  itemsCreated: number;
  coins: number;
  /** Capítulos já concluídos, somando todas as histórias. */
  chaptersCompleted: number;
  storiesCompleted: number;
  /** Hora local (0 a 23) do check em processamento; nulo quando a avaliação não vem de um check. */
  checkHour: number | null;
  /** Tarefas concluídas hoje. */
  todosToday: number;
  /** Dias seguidos completos (ver diasSeguidosCompletos). */
  fullDaysStreak: number;
  /** Dias recentes em que todos os diários agendados (3 ou mais) foram feitos. */
  perfectDays: number;
  /** Itens criados por tipo (inclui os excluídos). */
  created: { daily: number; todo: number; habit: number };
  /** Checks ativos por tipo de item. */
  checksByType: { daily: number; todo: number; habit: number };
  todosDone: number;
  todosOnTime: number;
  todosLate: number;
  hardTodosDone: number;
  openTodos: number;
  /** Itens ativos agora (exclui excluídos e tarefas concluídas). */
  activeItems: number;
  itemsWithNotes: number;
  distinctDays: number;
  bestDayRun: number;
  hadComeback: boolean;
  maxChecksInDay: number;
  dailyDays: number;
  habitDays: number;
  bestHabitRun: number;
  maxHabitsInDay: number;
  /** Dias com check em 3+ categorias e em 5+ categorias. */
  balancedDays: { three: number; five: number };
  /** Dias com diário, tarefa e hábito marcados juntos. */
  podiumDays: number;
  lookChanges: number;
  categoriesCreated: number;
  reminderEnabled: boolean;
  /** Conquistas já desbloqueadas (para as de coleção). */
  unlocked: ReadonlySet<string>;
};

export const FULL_DAYS_FOR_FLAME = 10;
export const TOTAL_CHECKS_FOR_MARATHON = 250;
export const ITEMS_FOR_ORGANIZED = 15;

type Progress = { current: number; target: number };
type Rule = {
  met: (ctx: AchievementContext) => boolean;
  progress?: (ctx: AchievementContext) => Progress;
};

/** Critério numérico: atende ao chegar no alvo e mostra o progresso (limitado ao alvo). */
const atLeast = (get: (ctx: AchievementContext) => number, target: number): Rule => ({
  met: (ctx) => get(ctx) >= target,
  progress: (ctx) => ({ current: Math.min(get(ctx), target), target }),
});

/** Critério de evento: sem progresso numérico. */
const when = (met: (ctx: AchievementContext) => boolean): Rule => ({ met });

const trailSlugs = (trail: string): string[] =>
  ACHIEVEMENT_CATALOG.filter((a) => a.trail === trail).map((a) => a.slug);
const trails = [...new Set(ACHIEVEMENT_CATALOG.map((a) => a.trail))];
/** A coleção das surpresas não conta a si mesma. */
const surprises = ACHIEVEMENT_CATALOG.filter((a) => 'secret' in a && a.slug !== 'cofre-aberto').map(
  (a) => a.slug,
);
const unlockedCount = (ctx: AchievementContext): number => ctx.unlocked.size;

/** Critério de cada conquista, pelo slug do catálogo (`@nextjourney/contracts`). */
const RULES: Record<AchievementSlug, Rule> = {
  // Primeiros passos
  'primeiro-passo': when((c) => c.totalChecks >= 1),
  'diario-inaugural': when((c) => c.created.daily >= 1),
  'primeira-tarefa': when((c) => c.created.todo >= 1),
  'primeiro-habito': when((c) => c.created.habit >= 1),
  'rotina-marcada': atLeast((c) => c.dailyDays, 4),
  'tarefa-cumprida': atLeast((c) => c.todosDone, 6),
  'habito-em-acao': atLeast((c) => c.checksByType.habit, 8),
  'cara-nova': when((c) => c.lookChanges >= 1),
  voltou: atLeast((c) => c.distinctDays, 3),
  'hora-marcada': when((c) => c.reminderEnabled),
  'pena-leve': atLeast((c) => c.itemsWithNotes, 10),
  'guarda-roupa': atLeast((c) => c.lookChanges, 10),
  // Diários
  'rotina-em-marcha': atLeast((c) => c.checksByType.daily, 30),
  'rotina-firme': atLeast((c) => c.checksByType.daily, 60),
  'rotina-de-ferro': atLeast((c) => c.checksByType.daily, 250),
  'mestre-da-rotina': atLeast((c) => c.checksByType.daily, 600),
  'dia-perfeito': atLeast((c) => c.perfectDays, 8),
  'chama-3-dias': atLeast((c) => c.fullDaysStreak, 5),
  'chama-7-dias': atLeast((c) => c.fullDaysStreak, FULL_DAYS_FOR_FLAME),
  'chama-14-dias': atLeast((c) => c.fullDaysStreak, 21),
  'chama-30-dias': atLeast((c) => c.fullDaysStreak, 45),
  // Tarefas
  'pe-na-lista': atLeast((c) => c.todosDone, 12),
  executor: atLeast((c) => c.todosDone, 50),
  imparavel: atLeast((c) => c.todosDone, 200),
  'maquina-de-entregas': atLeast((c) => c.todosDone, 500),
  'lista-zerada': when((c) => c.openTodos === 0 && c.todosDone >= 5 && c.todosToday >= 1),
  'no-prazo': atLeast((c) => c.todosOnTime, 15),
  resgate: when((c) => c.todosLate >= 1),
  'peso-pesado': atLeast((c) => c.hardTodosDone, 15),
  // Hábitos
  semente: atLeast((c) => c.habitDays, 14),
  raiz: atLeast((c) => c.habitDays, 60),
  arvore: atLeast((c) => c.habitDays, 180),
  floresta: atLeast((c) => c.habitDays, 365),
  'habito-em-chama': atLeast((c) => c.bestHabitRun, 6),
  'habito-de-7': atLeast((c) => c.bestHabitRun, 21),
  'habito-de-30': atLeast((c) => c.bestHabitRun, 45),
  'habito-de-100': atLeast((c) => c.bestHabitRun, 100),
  'dia-de-foco': atLeast((c) => c.maxHabitsInDay, 6),
  // Organização e constância
  organizado: atLeast((c) => c.itemsCreated, ITEMS_FOR_ORGANIZED),
  planejador: atLeast((c) => c.itemsCreated, 40),
  'arquiteto-da-rotina': atLeast((c) => c.itemsCreated, 100),
  maratonista: atLeast((c) => c.totalChecks, TOTAL_CHECKS_FOR_MARATHON),
  'semana-inteira': atLeast((c) => c.bestDayRun, 7),
  'mes-de-constancia': atLeast((c) => c.bestDayRun, 30),
  madrugador: when((c) => c.checkHour !== null && c.checkHour < 7),
  coruja: when((c) => c.checkHour !== null && c.checkHour >= 22),
  equilibrio: atLeast((c) => c.balancedDays.three, 10),
  'vida-em-equilibrio': atLeast((c) => c.balancedDays.five, 18),
  'do-meu-jeito': when((c) => c.categoriesCreated >= 1),
  'no-podio': atLeast((c) => c.podiumDays, 16),
  'coracao-valente': when((c) => c.hadComeback),
  'bolsa-cheia': atLeast((c) => c.activeItems, 20),
  'dia-brilhante': atLeast((c) => c.maxChecksInDay, 15),
  'diamante-bruto': atLeast((c) => c.distinctDays, 200),
  // Jornada
  aprendiz: atLeast((c) => c.level, 5),
  veterano: atLeast((c) => c.level, 8),
  mestre: atLeast((c) => c.level, 12),
  'lenda-do-nivel': atLeast((c) => c.level, 20),
  'novo-capitulo': when((c) => c.chaptersCompleted >= 1),
  'livro-aberto': atLeast((c) => c.chaptersCompleted, 3),
  'lenda-viva': when((c) => c.storiesCompleted >= 1),
  colecionador: atLeast((c) => c.storiesCompleted, 3),
  cofrinho: atLeast((c) => c.coins, 200),
  tesouro: atLeast((c) => c.coins, 800),
  fortuna: atLeast((c) => c.coins, 3000),
  // Marcos e coleções (dependem das demais; o serviço repete a avaliação até estabilizar)
  'colecionador-de-medalhas': atLeast(unlockedCount, 14),
  'cacador-de-trofeus': atLeast(unlockedCount, 35),
  'primeiro-lugar': atLeast(unlockedCount, 50),
  louros: when((c) => trails.some((t) => trailSlugs(t).every((slug) => c.unlocked.has(slug)))),
  'cofre-aberto': when((c) => surprises.every((slug) => c.unlocked.has(slug))),
};

/** Todas as conquistas cujo critério está satisfeito agora. Quem decide o que é novo é o chamador. */
export function conquistasAtendidas(ctx: AchievementContext): AchievementSlug[] {
  return ACHIEVEMENT_CATALOG.filter((a) => RULES[a.slug].met(ctx)).map((a) => a.slug);
}

/** Progresso numérico para a galeria (nulo quando o critério é um evento). */
export function progressoDaConquista(
  slug: AchievementSlug,
  ctx: AchievementContext,
): { current: number; target: number } | null {
  return RULES[slug].progress?.(ctx) ?? null;
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

/**
 * Dias, entre os últimos `janela`, em que o usuário tinha 3 ou mais diários agendados e fez todos.
 * Quem usa o app há mais tempo só enxerga a janela (limite do retroativo).
 */
export function diasPerfeitos(
  diarios: readonly DiarioDaChama[],
  hoje: LocalDate,
  janela = MAX_LOOKBACK_DAYS,
): number {
  const marcados = diarios.map((d) => new Set(d.diasMarcados));
  let total = 0;
  for (let i = 0; i < janela; i += 1) {
    const dia = addDays(hoje, -i);
    const agendados = diarios
      .map((d, index) => ({ d, index }))
      .filter(({ d }) => d.createdOn <= dia && d.scheduleDays.includes(diaDaSemana(dia)));
    if (agendados.length < 3) continue;
    if (agendados.every(({ index }) => marcados[index]?.has(dia) ?? false)) total += 1;
  }
  return total;
}
