import { Inject, Injectable } from '@nestjs/common';
import {
  type Achievement,
  ACHIEVEMENT_CATALOG,
  type AchievementUnlocked,
  type AppEvent,
  type LocalDate,
} from '@nextjourney/contracts';

import { Clock } from '../../common/clock.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  type AchievementContext,
  addDays,
  type CheckRow,
  conquistasAtendidas,
  diaLocal,
  diasPerfeitos,
  diasSeguidosCompletos,
  estatisticasDeChecks,
  horaLocal,
  progressoDaConquista,
  resumoDeHoje,
} from '../progression/domain/index.js';

type EvaluateInput = {
  userId: string;
  timezone: string;
  now: Date;
  hoje: LocalDate;
  /** Presente só quando a avaliação vem de um check (as de horário dependem dele). */
  fromCheck?: boolean;
  /** Retroativo: já nasce como avisada, sem abrir modal. */
  silent?: boolean;
};

/** Janela dos diários: cobre a Chama de 30 dias e os dias perfeitos recentes. */
const DAILY_WINDOW_DAYS = 90;
/** Limite de voltas das conquistas de coleção (uma libera a outra). */
const MAX_PASSES = 4;

@Injectable()
export class AchievementsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
  ) {}

  /** Monta o contexto dos critérios a partir do banco (dentro da transação da ação). */
  async context(
    tx: Prisma.TransactionClient,
    input: EvaluateInput,
    unlocked: ReadonlySet<string>,
  ): Promise<AchievementContext> {
    const { userId, timezone, now, hoje } = input;
    const stats = await tx.userStats.findUniqueOrThrow({ where: { userId } });

    const [
      chaptersCompleted,
      storiesCompleted,
      checks,
      dailies,
      createdByType,
      openTodos,
      activeItems,
      itemsWithNotes,
    ] = await Promise.all([
      tx.chapterCompletion.count({ where: { userId } }),
      tx.storyProgress.count({ where: { userId, completed: true } }),
      tx.itemCheck.findMany({
        where: { userId, revertedAt: null },
        select: {
          checkedOn: true,
          itemId: true,
          item: {
            select: {
              type: true,
              categoryId: true,
              difficulty: true,
              dueAt: true,
              completedAt: true,
            },
          },
        },
      }),
      tx.item.findMany({
        where: { userId, type: 'daily', deletedAt: null },
        select: {
          scheduleDays: true,
          createdOn: true,
          checks: {
            where: { revertedAt: null, checkedOn: { gte: addDays(hoje, -DAILY_WINDOW_DAYS) } },
            select: { checkedOn: true },
          },
        },
      }),
      tx.item.groupBy({
        by: ['type'],
        where: { userId, isExample: false },
        _count: { _all: true },
      }),
      tx.item.count({
        where: { userId, type: 'todo', deletedAt: null, completedAt: null, isExample: false },
      }),
      tx.item.count({ where: { userId, deletedAt: null, completedAt: null, isExample: false } }),
      tx.item.count({
        where: {
          userId,
          deletedAt: null,
          isExample: false,
          notes: { not: null },
          NOT: { notes: '' },
        },
      }),
    ]);

    const rows: CheckRow[] = checks.map((check) => ({
      checkedOn: check.checkedOn,
      itemId: check.itemId,
      type: check.item.type,
      categoryId: check.item.categoryId,
      difficulty: check.item.difficulty,
      dueAt: check.item.dueAt,
      completedAt: check.item.completedAt,
    }));
    const stat = estatisticasDeChecks(rows);
    const today = resumoDeHoje(rows, hoje);
    const diarios = dailies.map((daily) => ({
      scheduleDays: daily.scheduleDays,
      createdOn: daily.createdOn,
      diasMarcados: daily.checks.map((check) => check.checkedOn),
    }));
    const created = { daily: 0, todo: 0, habit: 0 };
    for (const group of createdByType) created[group.type] = group._count._all;

    return {
      totalChecks: stats.totalChecks,
      level: stats.level,
      itemsCreated: stats.itemsCreated,
      coins: stats.coins,
      chaptersCompleted,
      storiesCompleted,
      checkHour: input.fromCheck ? horaLocal(now, timezone) : null,
      ...today,
      fullDaysStreak: diasSeguidosCompletos(diarios, hoje),
      perfectDays: diasPerfeitos(diarios, hoje),
      created,
      checksByType: stat.checksByType,
      todosDone: stat.todosDone,
      todosOnTime: stat.todosOnTime,
      todosLate: stat.todosLate,
      hardTodosDone: stat.hardTodosDone,
      openTodos,
      activeItems,
      itemsWithNotes,
      distinctDays: stat.distinctDays,
      bestDayRun: stat.bestDayRun,
      hadComeback: stat.hadComeback,
      maxChecksInDay: stat.maxChecksInDay,
      dailyDays: stat.dailyDays,
      habitDays: stat.habitDays,
      bestHabitRun: stat.bestHabitRun,
      maxHabitsInDay: stat.maxHabitsInDay,
      balancedDays: stat.balancedDays,
      podiumDays: stat.podiumDays,
      lookChanges: stats.lookChanges,
      categoriesCreated: stats.categoriesCreated,
      reminderEnabled: stats.reminderEnabledAt !== null,
      unlocked,
    };
  }

  /**
   * Avalia as conquistas na transação da ação (check, item, categoria, personagem ou evento). Cada
   * uma é liberada uma só vez (a chave primária impede duplicar). As de coleção entram na volta
   * seguinte, quando as outras já estão gravadas.
   *
   * Um modal por ação: tudo que foi liberado fica pendente (`notifiedAt` nulo), mas a resposta traz
   * só a pendente mais antiga. As outras aparecem, uma por vez, nas ações seguintes.
   */
  async evaluate(
    tx: Prisma.TransactionClient,
    input: EvaluateInput,
  ): Promise<AchievementUnlocked[]> {
    const rows = await tx.userAchievement.findMany({
      where: { userId: input.userId },
      select: { achievementSlug: true },
    });
    const have = new Set(rows.map((row) => row.achievementSlug));
    const created: AchievementUnlocked[] = [];

    for (let pass = 0; pass < MAX_PASSES; pass += 1) {
      const ctx = await this.context(tx, input, have);
      const fresh = conquistasAtendidas(ctx).filter((slug) => !have.has(slug));
      if (fresh.length === 0) break;
      for (const slug of fresh) {
        await tx.userAchievement.create({
          data: {
            userId: input.userId,
            achievementSlug: slug,
            unlockedAt: input.now,
            notifiedAt: input.silent ? input.now : null,
          },
        });
        have.add(slug);
        const entry = ACHIEVEMENT_CATALOG.find((achievement) => achievement.slug === slug);
        if (entry) created.push({ slug, name: entry.name, tier: entry.tier, glyph: entry.glyph });
      }
    }
    // Silencioso (retroativo): devolve o que liberou, já avisado. Normal: só a pendente mais antiga.
    return input.silent ? created : this.nextToShow(tx, input.userId);
  }

  /** A conquista pendente mais antiga (empate: ordem do catálogo), em lista de zero ou um item. */
  private async nextToShow(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<AchievementUnlocked[]> {
    const pending = await tx.userAchievement.findMany({
      where: { userId, notifiedAt: null },
      select: { achievementSlug: true, unlockedAt: true },
    });
    const order = new Map(ACHIEVEMENT_CATALOG.map((a, index) => [a.slug as string, index]));
    // Pendente cujo slug saiu do catálogo não pode travar a fila das válidas
    pending.splice(0, pending.length, ...pending.filter((row) => order.has(row.achievementSlug)));
    pending.sort(
      (a, b) =>
        a.unlockedAt.getTime() - b.unlockedAt.getTime() ||
        (order.get(a.achievementSlug) ?? 0) - (order.get(b.achievementSlug) ?? 0),
    );
    const first = pending[0];
    const entry = first && ACHIEVEMENT_CATALOG.find((a) => a.slug === first.achievementSlug);
    return entry
      ? [{ slug: entry.slug, name: entry.name, tier: entry.tier, glyph: entry.glyph }]
      : [];
  }

  /** Avaliação fora de um check (criar item, categoria, trocar visual, evento do app). */
  async evaluateFor(userId: string, silent = false): Promise<AchievementUnlocked[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { timezone: true },
    });
    if (!user) return [];
    const now = this.clock.now();
    return this.prisma.$transaction((tx) =>
      this.evaluate(tx, {
        userId,
        timezone: user.timezone,
        now,
        hoje: diaLocal(now, user.timezone),
        silent,
      }),
    );
  }

  /** Retroativo: libera, já como avisadas, o que cada usuário já cumpria. Devolve quantas liberou. */
  async backfillAll(): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    let total = 0;
    for (const user of users) total += (await this.evaluateFor(user.id, true)).length;
    return total;
  }

  /** Fato do aparelho que o servidor não observa sozinho (marca única) e a avaliação seguinte. */
  async registerEvent(userId: string, event: AppEvent): Promise<AchievementUnlocked[]> {
    if (event.type === 'reminder_enabled') {
      await this.prisma.userStats.updateMany({
        where: { userId, reminderEnabledAt: null },
        data: { reminderEnabledAt: this.clock.now() },
      });
    }
    return this.evaluateFor(userId);
  }

  /** Confirma o aviso (modal) só das conquistas do próprio usuário que ainda estão pendentes. */
  async ack(userId: string, slugs: string[]): Promise<void> {
    await this.prisma.userAchievement.updateMany({
      where: { userId, achievementSlug: { in: slugs }, notifiedAt: null },
      data: { notifiedAt: this.clock.now() },
    });
  }

  /** Catálogo com progresso e estado para o usuário (RF-32). Surpresa bloqueada não mostra o texto. */
  async list(userId: string, timezone: string, now: Date, hoje: LocalDate): Promise<Achievement[]> {
    const { ctx, rows } = await this.prisma.$transaction(async (tx) => {
      const found = await tx.userAchievement.findMany({ where: { userId } });
      const unlockedSet = new Set(found.map((row) => row.achievementSlug));
      return {
        ctx: await this.context(tx, { userId, timezone, now, hoje }, unlockedSet),
        rows: found,
      };
    });
    const byslug = new Map(rows.map((row) => [row.achievementSlug, row]));

    return ACHIEVEMENT_CATALOG.map((achievement) => {
      const row = byslug.get(achievement.slug);
      const secret = 'secret' in achievement;
      return {
        slug: achievement.slug,
        name: achievement.name,
        description: secret && !row ? null : achievement.description,
        trail: achievement.trail,
        tier: achievement.tier,
        glyph: achievement.glyph,
        secret,
        unlocked: Boolean(row),
        unlockedAt: row ? row.unlockedAt.toISOString() : null,
        pending: Boolean(row) && row?.notifiedAt === null,
        progress: progressoDaConquista(achievement.slug, ctx),
      };
    });
  }
}
