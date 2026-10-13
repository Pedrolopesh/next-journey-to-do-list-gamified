import { Inject, Injectable } from '@nestjs/common';
import { type CheckResult, checkResultSchema, ERROR_CODES } from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import type { Item, ItemCheck, Prisma } from '../../generated/prisma/client.js';
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
   * Marca um item. Uma única transação: valida, grava o check, atualiza EXP/nível/moedas, o
   * capítulo da história ativa, a sequência do diário e as conquistas. O checkId (UUID do app)
   * torna a chamada idempotente: repetir devolve o mesmo resultado sem duplicar EXP.
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
      const active = await this.stories.active(tx, userId);
      const storyProgress = active
        ? { chapter: active.progress.chapter, completed: active.progress.completed }
        : NO_STORY;

      const applied = aplicarCheck(
        toPlayerState(stats, storyProgress),
        { checkId, type: item.type, difficulty: item.difficulty, localDate: hoje },
        config,
      );
      const { summary, record } = applied;

      // Capítulos concluídos (um por nível ganho): grava as conclusões e devolve o modal do último (RF-28)
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

      // Registro do check primeiro: as conquistas (ex.: equilíbrio, chama) enxergam este check
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

      const achievementsUnlocked = await this.achievements.evaluateAfterCheck(tx, {
        userId,
        timezone: user.timezone,
        now,
        hoje,
      });
      const result: CheckResult = { ...resultBase, achievementsUnlocked };
      // Repetir o checkId devolve exatamente este resultado (com as conquistas desta vez)
      await tx.itemCheck.update({ where: { id: checkId }, data: { result } });
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

      // O passo do capítulo volta na história em que o check contou, mesmo que não seja a ativa
      const progress = check.storyId
        ? await tx.storyProgress.findUnique({
            where: { userId_storyId: { userId, storyId: check.storyId } },
          })
        : null;
      const storyProgress = progress
        ? { chapter: progress.chapter, completed: progress.completed }
        : NO_STORY;

      const stats = await tx.userStats.findUniqueOrThrow({ where: { userId } });
      const config = await this.gameConfig.load(tx);
      const hoje = diaLocal(now, user.timezone);
      const undone = desfazerCheck(toPlayerState(stats, storyProgress), this.toRecord(check), hoje);
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

      await tx.userStats.update({ where: { userId }, data: statsColumns(undone.state) });
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
          expInLevel: undone.state.expInLevel,
          expForNextLevel: expParaNivel(undone.state.level, config),
        },
        chapterCompleted: false,
        completedChapter: null,
        achievementsUnlocked: [],
      };
    });
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
