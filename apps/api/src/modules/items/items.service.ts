import { Inject, Injectable } from '@nestjs/common';
import {
  type CreateItemRequest,
  ERROR_CODES,
  type HistoryResponse,
  type Item as ItemDto,
  type ItemType,
  type UpdateItemRequest,
} from '@nextjourney/contracts';

import { AppError } from '../../common/app-error.js';
import { Clock } from '../../common/clock.js';
import type { Item } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AchievementsService } from '../achievements/achievements.service.js';
import {
  addDays,
  calcularStreak,
  diaDaSemana,
  diaLocal,
  estaAtrasado,
} from '../progression/domain/index.js';

/** Segunda-feira da semana de uma data local (a semana vai de segunda a domingo). */
function inicioDaSemana(date: string): string {
  const dow = diaDaSemana(date);
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

@Injectable()
export class ItemsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(Clock) private readonly clock: Clock,
    @Inject(AchievementsService) private readonly achievements: AchievementsService,
  ) {}

  /** Lista os itens do usuário já com o estado do dia (feito, atrasado, sequência, contadores). */
  async list(
    userId: string,
    type: ItemType | undefined,
    date: string | undefined,
  ): Promise<ItemDto[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { timezone: true },
    });
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Usuário não encontrado');

    const hoje = date ?? diaLocal(this.clock.now(), user.timezone);
    const semana = inicioDaSemana(hoje);

    const items = await this.prisma.item.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(type ? { type } : {}),
        // tarefa marcada sai da lista e vai para o histórico
        OR: [{ type: { not: 'todo' } }, { completedAt: null }],
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    if (items.length === 0) return [];

    const checks = await this.prisma.itemCheck.findMany({
      where: { userId, itemId: { in: items.map((item) => item.id) }, revertedAt: null },
      select: { id: true, itemId: true, checkedOn: true, checkedAt: true },
      orderBy: { checkedAt: 'asc' },
    });
    const daysByItem = new Map<string, string[]>();
    const lastToday = new Map<string, string>();
    for (const check of checks) {
      const list = daysByItem.get(check.itemId) ?? [];
      list.push(check.checkedOn);
      daysByItem.set(check.itemId, list);
      if (check.checkedOn === hoje) lastToday.set(check.itemId, check.id); // o mais recente vence
    }

    const now = this.clock.now();
    return items.map((item) =>
      this.toDto(item, daysByItem.get(item.id) ?? [], hoje, semana, now, lastToday.get(item.id)),
    );
  }

  /**
   * Histórico: tarefas concluídas (que saíram da lista), da mais recente para a mais antiga.
   * Só do próprio usuário; paginado por `before` (instante de conclusão).
   */
  async history(
    userId: string,
    before: string | undefined,
    limit: number,
  ): Promise<HistoryResponse> {
    const rows = await this.prisma.item.findMany({
      where: {
        userId,
        deletedAt: null,
        type: 'todo',
        completedAt: { not: null, ...(before ? { lt: new Date(before) } : {}) },
      },
      select: {
        id: true,
        title: true,
        categoryId: true,
        difficulty: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
      take: limit + 1,
    });
    const page = rows.slice(0, limit);
    const checks = await this.prisma.itemCheck.findMany({
      where: { userId, itemId: { in: page.map((row) => row.id) }, revertedAt: null },
      select: { id: true, itemId: true },
      orderBy: { checkedAt: 'asc' },
    });
    const checkByItem = new Map(checks.map((check) => [check.itemId, check.id]));
    const items = page.map((row) => ({
      id: row.id,
      title: row.title,
      categoryId: row.categoryId,
      difficulty: row.difficulty,
      completedAt: (row.completedAt as Date).toISOString(),
      checkId: checkByItem.get(row.id) ?? null,
    }));
    return {
      items,
      nextCursor: rows.length > limit ? (items.at(-1)?.completedAt ?? null) : null,
    };
  }

  async create(userId: string, input: CreateItemRequest): Promise<ItemDto> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { timezone: true },
    });
    if (!user) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Usuário não encontrado');

    // O usuário só pode usar as próprias categorias (IDOR)
    const category = await this.prisma.category.findFirst({
      where: { id: input.categoryId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!category) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Categoria não encontrada');

    const now = this.clock.now();
    const hoje = diaLocal(now, user.timezone);
    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.item.create({
        data: {
          userId,
          categoryId: input.categoryId,
          type: input.type,
          title: input.title,
          notes: input.notes ?? null,
          difficulty: input.difficulty,
          scheduleDays: input.type === 'daily' ? input.scheduleDays : [],
          dueAt: input.type === 'todo' && input.dueAt ? new Date(input.dueAt) : null,
          createdOn: hoje,
          isExample: input.example === true,
        },
      });
      // Exemplo do app não conta como item criado pelo usuário
      if (input.example !== true) {
        await tx.userStats.update({ where: { userId }, data: { itemsCreated: { increment: 1 } } });
      }
      await this.achievements.evaluate(tx, { userId, timezone: user.timezone, now, hoje });
      return created;
    });
    return this.toDto(item, [], hoje, inicioDaSemana(hoje), this.clock.now());
  }

  /** Edita um item. O tipo não muda; frequência só em diário e prazo só em tarefa. */
  async update(userId: string, itemId: string, input: UpdateItemRequest): Promise<ItemDto> {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, userId, deletedAt: null },
    });
    if (!item) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Item não encontrado');
    if (input.scheduleDays !== undefined && item.type !== 'daily') {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Só diários têm frequência');
    }
    if (input.dueAt !== undefined && item.type !== 'todo') {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Só tarefas têm prazo');
    }
    if (input.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: input.categoryId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!category) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Categoria não encontrada');
    }
    const updated = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.scheduleDays !== undefined ? { scheduleDays: input.scheduleDays } : {}),
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
      },
    });
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    const now = this.clock.now();
    const hoje = diaLocal(now, user.timezone);
    const checks = await this.prisma.itemCheck.findMany({
      where: { itemId, revertedAt: null },
      select: { id: true, checkedOn: true },
      orderBy: { checkedAt: 'asc' },
    });
    const lastToday = checks.filter((check) => check.checkedOn === hoje).at(-1)?.id;
    return this.toDto(
      updated,
      checks.map((check) => check.checkedOn),
      hoje,
      inicioDaSemana(hoje),
      now,
      lastToday,
    );
  }

  /** Exclusão lógica: o histórico de EXP é mantido (RF-16). */
  async remove(userId: string, itemId: string): Promise<void> {
    const result = await this.prisma.item.updateMany({
      where: { id: itemId, userId, deletedAt: null },
      data: { deletedAt: this.clock.now() },
    });
    if (result.count === 0) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Item não encontrado');
  }

  private toDto(
    item: Item,
    checkedDays: string[],
    hoje: string,
    semana: string,
    now: Date,
    lastCheckId: string | undefined = undefined,
  ): ItemDto {
    const checksToday = checkedDays.filter((day) => day === hoje).length;
    const checksThisWeek = checkedDays.filter((day) => day >= semana && day <= hoje).length;
    const isDaily = item.type === 'daily';

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      notes: item.notes,
      categoryId: item.categoryId,
      difficulty: item.difficulty,
      scheduleDays: isDaily ? item.scheduleDays : null,
      dueAt: item.dueAt ? item.dueAt.toISOString() : null,
      doneToday: item.type === 'todo' ? false : checksToday > 0,
      overdue: !isDaily
        ? item.type === 'todo' &&
          item.dueAt !== null &&
          item.completedAt === null &&
          item.dueAt < now
        : estaAtrasado(
            {
              scheduleDays: item.scheduleDays,
              createdOn: item.createdOn,
              lastCheckedOn: item.lastCheckedOn,
            },
            hoje,
          ),
      streak: isDaily
        ? calcularStreak(
            {
              scheduleDays: item.scheduleDays,
              createdOn: item.createdOn,
              diasMarcados: checkedDays,
            },
            hoje,
          )
        : 0,
      checksToday,
      checksThisWeek,
      lastCheckId: lastCheckId ?? null,
    };
  }
}
