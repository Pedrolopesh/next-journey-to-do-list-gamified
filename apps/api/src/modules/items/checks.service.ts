import { Inject, Injectable } from '@nestjs/common';
import { type CheckResult, checkResultSchema, ERROR_CODES } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import type { Item, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AchievementsService } from '../achievements/achievements.service.js';
import {
  aplicarCheck,
  calcularStreak,
  desfazerCheck,
  diaLocal,
  expParaNivel,
} from '../progression/domain/index.js';
import { GameConfigService } from '../progression/game-config.service.js';
import { NO_STORY, statsColumns, toPlayerState } from '../progression/player-state.js';
import { StoriesService } from '../stories/stories.service.js';

const notFound = (): AppError => new AppError(404, ERROR_CODES.NOT_FOUND, 'Item não encontrado');

@Injectable()
export class ChecksService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(GameConfigService) private readonly gameConfig: GameConfigService,
    @Inject(StoriesService) private readonly stories: StoriesService,
    @Inject(AchievementsService) private readonly achievements: AchievementsService,
  ) {}

  /**
   * Checks an item. A single transaction: validates, stores the check, updates EXP/level/coins, the
   * active story chapter, the daily streak and the achievements. The app's `checkId` (UUID) makes
   * the call idempotent: repeating it returns the same result without duplicating EXP.
   */
  async check(userId: string, itemId: string, checkId: string): Promise<CheckResult> {
    const now = this.clock.now();
    return this.prisma.$transaction(async (tx) => {
      // Serializes checks of the same user. A concurrent call with the same checkId waits here and,
      // once inside, already sees the check stored by the first.
      const user = await this.lockedUser(tx, userId);

      const existing = await tx.itemCheck.findUnique({ where: { id: checkId } });
      if (existing) {
        if (existing.userId !== userId || existing.itemId !== itemId) {
          throw new AppError(409, 'CHECK_ID_CONFLICT', 'checkId já usado em outro check');
        }
        return checkResultSchema.parse(existing.result);
      }

      const item = await tx.item.findFirst({ where: { id: itemId, userId, deletedAt: null } });
      if (!item) throw notFound();

      const hoje = diaLocal(now, user.timezone);
      if (item.type === 'daily' && item.lastCheckedOn === hoje) {
        throw new AppError(409, 'ALREADY_CHECKED', 'Este diário já foi marcado hoje');
      }
      if (item.type === 'todo' && item.completedAt) {
        throw new AppError(409, 'ALREADY_COMPLETED', 'Esta tarefa já foi concluída');
      }

      const stats = await tx.userStats.findUniqueOrThrow({ where: { userId } });
      const config = await this.gameConfig.load(tx);
      const active = await this.stories.active(tx, userId);
      const storyProgress = active
        ? { chapter: active.progress.chapter, completed: active.progress.completed }
        : NO_STORY;

      // Item unchecked and checked again: earns the coins, but the EXP counts only once. A to-do
      // counts once in a lifetime (unchecking on another day does not release the EXP again); a
      // daily and a habit, once per day (the next day is a real new check).
      const expJaGanho =
        (await tx.itemCheck.count({
          where: {
            itemId,
            revertedAt: { not: null },
            exp: { gt: 0 },
            ...(item.type === 'todo' ? {} : { checkedOn: hoje }),
          },
        })) > 0;

      const applied = aplicarCheck(
        toPlayerState(stats, storyProgress),
        { checkId, type: item.type, difficulty: item.difficulty, localDate: hoje, expJaGanho },
        config,
      );
      const { summary, record } = applied;

      // Finished chapters (one per level gained): stores the completions and returns the modal for
      // the last one (RF-28).
      let completedChapter: CheckResult['completedChapter'] = null;
      if (active && summary.capitulosConcluidos.length > 0) {
        const chapters = await tx.chapter.findMany({
          where: { storyId: active.story.id, number: { in: summary.capitulosConcluidos } },
          orderBy: { number: 'asc' },
        });
        for (const chapter of chapters) {
          await tx.chapterCompletion.upsert({
            where: { userId_chapterId: { userId, chapterId: chapter.id } },
            create: { userId, chapterId: chapter.id, completedAt: now },
            update: {},
          });
        }
        const last = chapters.at(-1);
        if (last) {
          completedChapter = {
            number: last.number,
            title: last.title,
            text: last.text,
            storyCompleted: summary.historiaConcluida,
          };
        }
      }

      await tx.userStats.update({ where: { userId }, data: statsColumns(applied.state) });
      if (active) {
        await tx.storyProgress.update({
          where: { userId_storyId: { userId, storyId: active.story.id } },
          data: {
            chapter: applied.state.story.chapter,
            completed: applied.state.story.completed,
          },
        });
      }

      // Store the check first: the achievements (e.g. balance, flame) see this check.
      const resultBase: Omit<CheckResult, 'achievementsUnlocked'> = {
        expGained: summary.expGanho,
        coinsGained: summary.moedasGanhas + summary.bonusMoedas,
        level: summary.nivel,
        leveledUp: summary.subiuDeNivel,
        chapterProgress: {
          chapter: summary.progressoCapitulo.capitulo,
          expInLevel: summary.progressoCapitulo.expNoNivel,
          expForNextLevel: summary.progressoCapitulo.expParaProximo,
        },
        chapterCompleted: summary.capituloConcluido,
        completedChapter,
      };
      await tx.itemCheck.create({
        data: {
          id: checkId,
          itemId,
          userId,
          checkedOn: hoje,
          exp: record.exp,
          coins: record.coins,
          countsForChapter: record.countsForChapter,
          chapterAtCheck: record.chapterAtCheck,
          storyId: record.countsForChapter && active ? active.story.id : null,
          closedChapter: record.closedChapter,
          streakBefore: item.streakCurrent,
          lastCheckedBefore: item.lastCheckedOn,
          result: { ...resultBase, achievementsUnlocked: [] },
        },
      });

      if (item.type === 'daily') {
        const streak = await this.streakFor(tx, item, hoje);
        await tx.item.update({
          where: { id: itemId },
          data: {
            lastCheckedOn: hoje,
            streakCurrent: streak,
            streakBest: Math.max(item.streakBest, streak),
          },
        });
      } else if (item.type === 'todo') {
        await tx.item.update({ where: { id: itemId }, data: { completedAt: now } });
      }

      const achievementsUnlocked = await this.achievements.evaluate(tx, {
        userId,
        timezone: user.timezone,
        now,
        hoje,
        fromCheck: true,
      });
      const result: CheckResult = { ...resultBase, achievementsUnlocked };
      // Repeating the checkId returns exactly this result (with the achievements this time).
      await tx.itemCheck.update({ where: { id: checkId }, data: { result } });
      return result;
    });
  }

  /**
   * Unchecks a check, on any day and chapter. EXP, level and chapter stay as they are: only the
   * coins decrease (the current chapter's loss, never below zero).
   */
  async undo(userId: string, itemId: string, checkId: string): Promise<CheckResult> {
    const now = this.clock.now();
    return this.prisma.$transaction(async (tx) => {
      const user = await this.lockedUser(tx, userId);

      const check = await tx.itemCheck.findFirst({ where: { id: checkId, itemId, userId } });
      if (!check) throw notFound();
      if (check.revertedAt) {
        throw new AppError(409, 'CHECK_ALREADY_REVERTED', 'Este check já foi desmarcado');
      }

      const item = await tx.item.findUniqueOrThrow({ where: { id: itemId } });
      if (item.deletedAt) {
        throw new AppError(
          409,
          ERROR_CODES.UNDO_NOT_ALLOWED,
          'Item excluído: o check não pode ser desmarcado',
        );
      }

      // The coin loss is that of the chapter the player is in now.
      const active = await this.stories.active(tx, userId);
      const storyProgress = active
        ? { chapter: active.progress.chapter, completed: active.progress.completed }
        : NO_STORY;

      const stats = await tx.userStats.findUniqueOrThrow({ where: { userId } });
      const config = await this.gameConfig.load(tx);
      const hoje = diaLocal(now, user.timezone);
      const undone = desfazerCheck(toPlayerState(stats, storyProgress), config);

      await tx.userStats.update({ where: { userId }, data: statsColumns(undone.state) });
      await tx.itemCheck.update({ where: { id: checkId }, data: { revertedAt: now } });

      if (item.type === 'daily') {
        // Any day works: recompute from the active checks that remain.
        const rest = await tx.itemCheck.findMany({
          where: { itemId, revertedAt: null },
          select: { checkedOn: true },
          orderBy: { checkedOn: 'desc' },
        });
        await tx.item.update({
          where: { id: itemId },
          data: {
            lastCheckedOn: rest[0]?.checkedOn ?? null,
            streakCurrent: await this.streakFor(tx, item, hoje),
          },
        });
      } else if (item.type === 'todo') {
        await tx.item.update({ where: { id: itemId }, data: { completedAt: null } });
      }

      return {
        expGained: 0,
        coinsGained: -undone.summary.moedasPerdidas,
        level: undone.state.level,
        leveledUp: false,
        chapterProgress: {
          chapter: undone.state.story.chapter,
          expInLevel: undone.state.expInLevel,
          expForNextLevel: expParaNivel(undone.state.level, config),
        },
        chapterCompleted: false,
        completedChapter: null,
        achievementsUnlocked: [],
      };
    });
  }

  /** Active user with the stats row locked: serializes the EXP actions of the same user. */
  private async lockedUser(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<{ timezone: string }> {
    const user = await tx.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { timezone: true },
    });
    if (!user) throw notFound();
    await tx.$queryRaw`SELECT 1 FROM user_stats WHERE user_id = ${userId}::uuid FOR UPDATE`;
    return user;
  }

  private async streakFor(tx: Prisma.TransactionClient, item: Item, hoje: string): Promise<number> {
    const rows = await tx.itemCheck.findMany({
      where: { itemId: item.id, revertedAt: null },
      select: { checkedOn: true },
    });
    return calcularStreak(
      {
        scheduleDays: item.scheduleDays,
        createdOn: item.createdOn,
        diasMarcados: rows.map((row) => row.checkedOn),
      },
      hoje,
    );
  }
}
