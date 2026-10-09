import { Inject, Injectable } from '@nestjs/common';
import { type CheckResult, checkResultSchema, ERROR_CODES } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import type { Item, ItemCheck, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  aplicarCheck,
  calcularStreak,
  desfazerCheck,
  diaLocal,
} from '../progression/domain/index.js';
import { GameConfigService } from '../progression/game-config.service.js';
import { fromPlayerState, toPlayerState } from '../progression/player-state.js';

const notFound = (): AppError => new AppError(404, ERROR_CODES.NOT_FOUND, 'Item não encontrado');

@Injectable()
export class ChecksService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(GameConfigService) private readonly gameConfig: GameConfigService,
  ) {}

  /**
   * Marca um item. Uma única transação: valida, grava o check, atualiza EXP/nível/moedas/capítulo
   * e a sequência do diário. O checkId (UUID do app) torna a chamada idempotente: repetir devolve
   * o mesmo resultado sem duplicar EXP.
   */
  async check(userId: string, itemId: string, checkId: string): Promise<CheckResult> {
    const now = this.clock.now();
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { timezone: true },
      });
      if (!user) throw notFound();

      // Serializa checks do mesmo usuário. Uma chamada concorrente com o mesmo checkId espera aqui
      // e, ao entrar, já enxerga o check gravado pela primeira.
      await tx.$queryRaw`SELECT 1 FROM user_stats WHERE user_id = ${userId}::uuid FOR UPDATE`;

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
      const applied = aplicarCheck(
        toPlayerState(stats),
        { checkId, type: item.type, difficulty: item.difficulty, localDate: hoje },
        config,
      );
      const { summary, record } = applied;

      const result: CheckResult = {
        expGained: summary.expGanho,
        coinsGained: summary.moedasGanhas + summary.bonusMoedas,
        level: summary.nivel,
        leveledUp: summary.subiuDeNivel,
        chapterProgress: {
          chapter: summary.progressoCapitulo.capitulo,
          checksInChapter: summary.progressoCapitulo.checks,
          requiredChecks: summary.progressoCapitulo.necessarios,
        },
        chapterCompleted: summary.capituloConcluido,
        achievementsUnlocked: [],
      };

      await tx.userStats.update({ where: { userId }, data: fromPlayerState(applied.state) });
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
          closedChapter: record.closedChapter,
          streakBefore: item.streakCurrent,
          lastCheckedBefore: item.lastCheckedOn,
          result,
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

      return result;
    });
  }

  /** Desmarca um check. Só no mesmo dia; capítulo fechado é definitivo; o nível nunca cai. */
  async undo(userId: string, itemId: string, checkId: string): Promise<CheckResult> {
    const now = this.clock.now();
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { timezone: true },
      });
      if (!user) throw notFound();

      await tx.$queryRaw`SELECT 1 FROM user_stats WHERE user_id = ${userId}::uuid FOR UPDATE`;

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

      const stats = await tx.userStats.findUniqueOrThrow({ where: { userId } });
      const config = await this.gameConfig.load(tx);
      const hoje = diaLocal(now, user.timezone);
      const undone = desfazerCheck(toPlayerState(stats), this.toRecord(check), hoje);
      if (!undone.ok) {
        if (undone.motivo === 'CAPITULO_FECHADO') {
          throw new AppError(
            409,
            ERROR_CODES.CHECK_LOCKED,
            'O capítulo já foi fechado: o check é definitivo',
          );
        }
        throw new AppError(
          409,
          ERROR_CODES.UNDO_NOT_ALLOWED,
          'Só é possível desmarcar no mesmo dia',
        );
      }

      await tx.userStats.update({ where: { userId }, data: fromPlayerState(undone.state) });
      await tx.itemCheck.update({ where: { id: checkId }, data: { revertedAt: now } });

      if (item.type === 'daily') {
        await tx.item.update({
          where: { id: itemId },
          data: { lastCheckedOn: check.lastCheckedBefore, streakCurrent: check.streakBefore },
        });
      } else if (item.type === 'todo') {
        await tx.item.update({ where: { id: itemId }, data: { completedAt: null } });
      }

      const { story } = undone.state;
      return {
        expGained: -undone.summary.expDevolvido,
        coinsGained: -undone.summary.moedasDevolvidas,
        level: undone.state.level,
        leveledUp: false,
        chapterProgress: {
          chapter: story.chapter,
          checksInChapter: story.checksInChapter,
          requiredChecks: this.requiredChecks(story.chapter, config),
        },
        chapterCompleted: false,
        achievementsUnlocked: [],
      };
    });
  }

  private requiredChecks(
    chapter: number,
    config: { chapterBaseChecks: number; chapterChecksStep: number; chapterMaxChecks: number },
  ): number {
    return Math.min(
      config.chapterBaseChecks + config.chapterChecksStep * (chapter - 1),
      config.chapterMaxChecks,
    );
  }

  private toRecord(check: ItemCheck) {
    return {
      checkId: check.id,
      localDate: check.checkedOn,
      exp: check.exp,
      coins: check.coins,
      countsForChapter: check.countsForChapter,
      chapterAtCheck: check.chapterAtCheck,
      closedChapter: check.closedChapter,
    };
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
