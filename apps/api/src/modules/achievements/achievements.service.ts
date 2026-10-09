import { Inject, Injectable } from '@nestjs/common';
import type { Achievement, AchievementUnlocked, LocalDate } from '@nextjourney/contracts';

import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  ACHIEVEMENT_CATALOG,
  type AchievementContext,
  addDays,
  conquistasAtendidas,
  diasSeguidosCompletos,
  horaLocal,
  progressoDaConquista,
} from '../progression/domain/index.js';

type EvaluateInput = {
  userId: string;
  timezone: string;
  now: Date;
  hoje: LocalDate;
};

const CHAMA_WINDOW_DAYS = 60;

@Injectable()
export class AchievementsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Monta o contexto dos critérios a partir do banco (dentro da transação do check). */
  async context(tx: Prisma.TransactionClient, input: EvaluateInput): Promise<AchievementContext> {
    const { userId, timezone, now, hoje } = input;
    const stats = await tx.userStats.findUniqueOrThrow({ where: { userId } });

    const [chaptersCompleted, storiesCompleted, checksToday, dailies] = await Promise.all([
      tx.chapterCompletion.count({ where: { userId } }),
      tx.storyProgress.count({ where: { userId, completed: true } }),
      tx.itemCheck.findMany({
        where: { userId, checkedOn: hoje, revertedAt: null },
        select: { item: { select: { categoryId: true } } },
      }),
      tx.item.findMany({
        where: { userId, type: 'daily', deletedAt: null },
        select: {
          scheduleDays: true,
          createdOn: true,
          checks: {
            where: { revertedAt: null, checkedOn: { gte: addDays(hoje, -CHAMA_WINDOW_DAYS) } },
            select: { checkedOn: true },
          },
        },
      }),
    ]);

    return {
      totalChecks: stats.totalChecks,
      level: stats.level,
      itemsCreated: stats.itemsCreated,
      chaptersCompleted,
      storiesCompleted,
      checkHour: horaLocal(now, timezone),
      categoriesToday: new Set(checksToday.map((check) => check.item.categoryId)).size,
      fullDaysStreak: diasSeguidosCompletos(
        dailies.map((daily) => ({
          scheduleDays: daily.scheduleDays,
          createdOn: daily.createdOn,
          diasMarcados: daily.checks.map((check) => check.checkedOn),
        })),
        hoje,
      ),
    };
  }

  /**
   * Avalia as conquistas depois de um check, na mesma transação. Cada conquista é liberada uma só
   * vez (a chave primária impede duplicar) e libera o cosmético da recompensa.
   */
  async evaluateAfterCheck(
    tx: Prisma.TransactionClient,
    input: EvaluateInput,
  ): Promise<AchievementUnlocked[]> {
    const ctx = await this.context(tx, input);
    const earned = conquistasAtendidas(ctx);
    if (earned.length === 0) return [];

    const already = await tx.userAchievement.findMany({
      where: { userId: input.userId },
      select: { achievementSlug: true },
    });
    const have = new Set(already.map((entry) => entry.achievementSlug));
    const fresh = earned.filter((slug) => !have.has(slug));
    if (fresh.length === 0) return [];

    const unlocked: AchievementUnlocked[] = [];
    for (const slug of fresh) {
      const entry = ACHIEVEMENT_CATALOG.find((achievement) => achievement.slug === slug);
      if (!entry) continue;
      await tx.userAchievement.create({
        data: { userId: input.userId, achievementSlug: slug, unlockedAt: input.now },
      });
      if (entry.rewardKey) {
        await tx.userCosmetic.upsert({
          where: { userId_cosmeticKey: { userId: input.userId, cosmeticKey: entry.rewardKey } },
          create: { userId: input.userId, cosmeticKey: entry.rewardKey, source: slug },
          update: {},
        });
      }
      unlocked.push({ slug, name: entry.name, rewardKey: entry.rewardKey });
    }
    return unlocked;
  }

  /** Catálogo com progresso e estado para o usuário (RF-32). */
  async list(userId: string, timezone: string, now: Date, hoje: LocalDate): Promise<Achievement[]> {
    const [ctx, unlocked] = await this.prisma.$transaction(async (tx) => [
      await this.context(tx, { userId, timezone, now, hoje }),
      await tx.userAchievement.findMany({ where: { userId } }),
    ]);
    const unlockedAt = new Map(unlocked.map((entry) => [entry.achievementSlug, entry.unlockedAt]));

    return ACHIEVEMENT_CATALOG.map((achievement) => {
      const when = unlockedAt.get(achievement.slug);
      return {
        slug: achievement.slug,
        name: achievement.name,
        description: achievement.description,
        iconKey: achievement.iconKey,
        rewardKey: achievement.rewardKey,
        unlocked: Boolean(when),
        unlockedAt: when ? when.toISOString() : null,
        progress: progressoDaConquista(achievement.slug, ctx),
      };
    });
  }
}
